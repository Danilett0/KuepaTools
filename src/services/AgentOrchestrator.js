import { analyzeIntentWithGemini } from './aiService';
import { findUser, findUsersByIncList, findUsersByMongoIds } from './usuariosService';
import { supabase } from './supabaseClient';
import { ALLIANCE_IDS } from '../utils/constants';
import { generateCommandsFromActions } from '../agent/skills';
import { hydrateStudents } from './studentHydrator';
import { extractMultipleSisUrls } from '../utils/academicTerms';

export class AgentOrchestrator {
  constructor(apiKey, alliance, options = {}) {
    this.apiKey = apiKey;
    this.alliance = alliance;
    this.options = options;
    this.userCache = new Map();
    this.estadosCache = null;
  }

  // Utilidad para normalizar textos sin acentos
  normalizeStr(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  /**
   * Helper para obtener usuario desde cache local o consultar DB si no existe.
   */
  async getUser(identifier) {
    const trimmed = String(identifier || '').trim();
    if (!trimmed) return null;

    if (this.userCache.has(trimmed)) {
      return this.userCache.get(trimmed);
    }

    const allianceId = ALLIANCE_IDS[this.alliance];
    const user = await findUser(trimmed, allianceId);
    if (user) {
      if (user.incremental_user_code) {
        this.userCache.set(String(user.incremental_user_code), user);
      }
      if (user._id?.$oid) {
        this.userCache.set(user._id.$oid, user);
      }
    }
    return user;
  }

  /**
   * Pre-carga en batch todos los usuarios involucrados en las acciones que aún no estén en cache.
   */
  async batchPrefetchUsers(actions) {
    const allianceId = ALLIANCE_IDS[this.alliance];
    const uncachedIncs = new Set();
    const uncachedMongoIds = new Set();

    for (const action of actions) {
      const sId = String(action.student_id || '').trim();
      if (!sId || this.userCache.has(sId)) continue;

      const isMongoId = /^[a-f0-9]{24}$/i.test(sId);
      const isInc = /^\d{1,7}$/.test(sId);

      if (isInc) {
        uncachedIncs.add(parseInt(sId, 10));
      } else if (isMongoId) {
        const needsProgramAutoFill = !action.program_id && 
          (action.action_type === 'audit_statistics' || action.action_type === 'change_status');
        if (needsProgramAutoFill) {
          uncachedMongoIds.add(sId);
        }
      }
    }

    const promises = [];
    if (uncachedIncs.size > 0) {
      promises.push(
        findUsersByIncList([...uncachedIncs], allianceId).then(users => {
          for (const u of users) {
            if (u.incremental_user_code) this.userCache.set(String(u.incremental_user_code), u);
            if (u._id?.$oid) this.userCache.set(u._id.$oid, u);
          }
        }).catch(err => console.warn('Error pre-fetching INCs:', err))
      );
    }

    if (uncachedMongoIds.size > 0) {
      promises.push(
        findUsersByMongoIds([...uncachedMongoIds], allianceId).then(users => {
          for (const u of users) {
            if (u.incremental_user_code) this.userCache.set(String(u.incremental_user_code), u);
            if (u._id?.$oid) this.userCache.set(u._id.$oid, u);
          }
        }).catch(err => console.warn('Error pre-fetching MongoIds:', err))
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Fase 1: RAG Pre-procesamiento (INC-First Pipeline)
   * 
   * 1. Detecta INCs en el texto y busca a los estudiantes en la BD.
   * 2. Construye un perfil rico (nombre, programas, ObjectID) para cada estudiante.
   * 3. Detecta URLs de SIS y extrae IDs de ahí también.
   * 4. Inyecta todo como contexto al mensaje para que el LLM tenga datos reales.
   */
  async preprocessMessage(text, onStateChange, fullConversationText) {
    let enrichedText = text;
    let additionalContext = "";

    // ── INC-First: Hidratar estudiantes detectados ──────────────────────
    // Usa el texto completo de la conversación para detectar INCs de mensajes anteriores
    const textToHydrate = fullConversationText || text;
    try {
      const hydration = await hydrateStudents(textToHydrate, this.alliance, onStateChange);
      
      // Guardar estudiantes hidratados en el cache local para evitar re-consultas
      if (hydration.students && hydration.students.length > 0) {
        for (const s of hydration.students) {
          if (s.rawUser) {
            if (s.inc) this.userCache.set(String(s.inc), s.rawUser);
            if (s.objectId) this.userCache.set(s.objectId, s.rawUser);
          }
        }
      }

      if (hydration.enrichedContext) {
        additionalContext += hydration.enrichedContext;
      }
    } catch (err) {
      console.error("Error en hydration de estudiantes:", err);
      // Fallback silencioso: el sistema sigue funcionando sin hidratación
    }

    // ── Multi-URL SIS Detection (Fase 5: Tickets con múltiples URLs) ────
    const sisUrls = extractMultipleSisUrls(text);
    if (sisUrls.length > 0) {
      for (const item of sisUrls) {
        const { studentId, programId } = item;
        try {
          const studentUser = await this.getUser(studentId);
          let programName = "desconocido";
          
          if (studentUser && programId) {
            const { data: progCatalog } = await supabase.from('programas')
              .select('mongo_id, name')
              .eq('alliance_id', ALLIANCE_IDS[this.alliance])
              .eq('mongo_id', programId)
              .single();
              
            if (progCatalog) {
              programName = progCatalog.name;
            }
          }
          
          const studentName = studentUser?.profile?.full_name || "Estudiante";
          const progInfo = programId ? `, program_id: "${programId}" (Programa: "${programName}")` : '';
          additionalContext += `\n[CONTEXTO DE URL: ${studentName} - student_id: "${studentId}"${progInfo}. USA ESTOS IDs DIRECTAMENTE.]`;
        } catch (err) {
          console.error("Error en RAG de URL:", err);
          const progInfo = programId ? `, program_id: "${programId}"` : '';
          additionalContext += `\n[CONTEXTO DE URL: student_id: "${studentId}"${progInfo}.]`;
        }
      }
    }

    return `${enrichedText}${additionalContext}`;
  }

  /**
   * Fase 2: Magic Resolution (Post-LLM)
   * Red de seguridad: traduce INCs, programas faltantes y estados a sus ObjectIDs reales.
   * Con el INC-First pipeline y el cache local, esto no genera consultas duplicadas.
   */
  async resolveMagicVariables(action, chatHistory) {
    let resolvedAction = { ...action };
    let studentUser = null;

    const isMongoId = (id) => typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);
    const isInc = (id) => typeof id === 'string' && /^\d+$/.test(id) && id.length <= 7;

    // 1. Buscar Usuario y Resolver INC -> ObjectID solo si es necesario
    if (resolvedAction.student_id) {
      const sId = String(resolvedAction.student_id).trim();

      if (isMongoId(sId)) {
        // Ya es un ObjectID válido de MongoDB.
        // Solo necesitamos studentUser si la acción requiere autocompletar program_id
        const needsProgramAutoFill = !resolvedAction.program_id && 
          (resolvedAction.action_type === 'audit_statistics' || resolvedAction.action_type === 'change_status');
        if (needsProgramAutoFill) {
          studentUser = await this.getUser(sId);
        }
      } else if (isInc(sId)) {
        // Es un INC, resolvemos a ObjectID usando cache o DB
        studentUser = await this.getUser(sId);
        if (studentUser && studentUser._id && studentUser._id.$oid) {
          resolvedAction.student_id = studentUser._id.$oid;
        } else {
          throw new Error(`INCOMPLETE:El estudiante con INC ${sId} no fue encontrado en tu base de datos.`);
        }
      } else {
        // Formato no estándar, intentar resolver por si acaso
        studentUser = await this.getUser(sId);
        if (studentUser && studentUser._id && studentUser._id.$oid) {
          resolvedAction.student_id = studentUser._id.$oid;
        }
      }
    }

    // 2. Autocompletar program_id desde los programas del estudiante
    if (!resolvedAction.program_id && (resolvedAction.action_type === 'audit_statistics' || resolvedAction.action_type === 'change_status')) {
      if (!studentUser && resolvedAction.student_id) {
        studentUser = await this.getUser(resolvedAction.student_id);
      }

      if (studentUser && studentUser.programs && studentUser.programs.length > 0) {
        if (studentUser.programs.length === 1) {
          resolvedAction.program_id = studentUser.programs[0].structure?.$oid || studentUser.programs[0].structure;
        } else {
          throw new Error(`INCOMPLETE:El estudiante tiene múltiples programas registrados (${studentUser.programs.length}). Por favor, proporciona el ID del programa específico al que te refieres.`);
        }
      } else {
        throw new Error(`INCOMPLETE:No se encontró ningún programa asociado al estudiante. ¿Tienes el ID del programa académico?`);
      }
    }

    // 3. Resolver Estados Dinámicos usando cache local
    if (resolvedAction.action_type === 'change_status' && resolvedAction.status_name && !resolvedAction.status_id) {
      if (!this.estadosCache) {
        const { data: estadosData } = await supabase
          .from('estados')
          .select('mongo_id, name')
          .eq('alliance_id', ALLIANCE_IDS[this.alliance]);
        this.estadosCache = estadosData || [];
      }
        
      const matchedState = this.estadosCache.find(e => this.normalizeStr(e.name) === this.normalizeStr(resolvedAction.status_name));
      if (matchedState) {
        resolvedAction.status_id = matchedState.mongo_id;
      } else {
        throw new Error(`INCOMPLETE:El estado "${resolvedAction.status_name}" no existe en la alianza actual. Por favor verifica el nombre.`);
      }
    }

    return resolvedAction;
  }

  /**
   * Método principal para procesar un mensaje del usuario.
   */
  async processMessage(userText, chatHistory, onThinkingStateChange) {
    if (!this.apiKey) throw new Error("No API Key provided");

    // Recopilar todo el texto de la conversación (mensajes del usuario) para hidratar
    // Esto asegura que en mensajes de seguimiento como "2", el sistema aún detecte
    // los INCs del mensaje original y re-inyecte el contexto del estudiante.
    const allUserText = chatHistory
      .filter(m => m.role === 'user' && !m.isHidden)
      .map(m => m.text)
      .join('\n');
    const fullConversationText = allUserText ? `${allUserText}\n${userText}` : userText;

    // 1. RAG + INC-First Hydration (usa el texto completo de la conversación)
    const processedText = await this.preprocessMessage(userText, onThinkingStateChange, fullConversationText);
    
    onThinkingStateChange('ai');
    
    // Construir historial para Gemini
    const historyForGemini = chatHistory.map((m) => {
      let textContent = m.text;
      // Si la IA generó comandos, su texto visible suele estar vacío, lo que confunde al LLM haciéndole creer que no respondió.
      if (m.role === 'ai' && !textContent && m.parsedResult?.type === 'COMMANDS') {
        textContent = "[Acciones generadas y ejecutadas por el sistema. No repetir.]";
      }
      return { role: m.role, text: textContent };
    });
    // Agregar el mensaje actual enriquecido
    // Si hay historial, es una continuación (ej. el usuario respondió "2" a una pregunta)
    const isFollowUp = chatHistory.length > 0;
    const prefix = isFollowUp ? '[CONTINUACIÓN]' : '[NUEVA TAREA]';
    historyForGemini.push({ role: 'user', text: `${prefix}: ${processedText}` });

    try {
      // 2. Llamar a LLM con reintentos automáticos para mitigar errores 503/429
      const geminiResult = await analyzeIntentWithGemini(historyForGemini, this.apiKey, {
        maxRetries: 3,
        model: this.options?.model,
        onRetry: ({ attempt, maxRetries }) => {
          if (onThinkingStateChange) {
            onThinkingStateChange(`ai_retry_${attempt}_${maxRetries}`);
          }
        }
      });

      // Si pide clarificación o info
      if (geminiResult && (geminiResult.type === 'INCOMPLETE' || geminiResult.type === 'INFO' || geminiResult.type === 'QUERY' || geminiResult.type === 'ROUTE')) {
        return geminiResult;
      }

      // 3. Procesar Acciones (Tool Calls manuales traducidos)
      if (geminiResult && geminiResult.type === 'ACTIONS' && geminiResult.actions) {
        onThinkingStateChange('db_processing');
        
        // Pre-cargar en batch cualquier usuario de las acciones que aún no esté en cache
        await this.batchPrefetchUsers(geminiResult.actions);

        let finalActions = [];
        for (const action of geminiResult.actions) {
          const resolvedAction = await this.resolveMagicVariables(action, chatHistory);
          finalActions.push(resolvedAction);
        }

        // 4. Transformar acciones abstractas a comandos Bash usando Skills
        const bashCommands = generateCommandsFromActions(finalActions);

        // 5. Validar que no haya comandos con placeholders sin resolver
        const invalidCommands = bashCommands.filter(cmd => cmd.includes('[FALTA_'));
        if (invalidCommands.length > 0) {
          return {
            type: 'INCOMPLETE',
            message: 'No se pudieron resolver todos los datos necesarios para generar los comandos. Verifica que los IDs proporcionados sean correctos.'
          };
        }

        return {
          type: 'COMMANDS',
          commands: bashCommands
        };
      }

      // Soporte Legacy por si devuelve comandos directos
      if (geminiResult && geminiResult.type === 'COMMANDS') {
        return geminiResult;
      }

      throw new Error("Respuesta no soportada del agente.");

    } catch (error) {
      if (error.message && error.message.startsWith('INCOMPLETE:')) {
        return { type: 'INCOMPLETE', message: error.message.replace('INCOMPLETE:', '') };
      }
      throw error;
    } finally {
      onThinkingStateChange(null);
    }
  }
}
