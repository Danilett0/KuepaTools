import { analyzeIntentWithGemini } from './aiService';
import { findUser } from './usuariosService';
import { supabase } from './supabaseClient';
import { ALLIANCE_IDS, STATE_OPTIONS_BY_ALIANZA } from '../utils/constants';
import { generateCommandsFromActions } from '../agent/skills';
import { hydrateStudents } from './studentHydrator';

export class AgentOrchestrator {
  constructor(apiKey, alliance) {
    this.apiKey = apiKey;
    this.alliance = alliance;
  }

  // Utilidad para normalizar textos sin acentos
  normalizeStr(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
      
      if (hydration.enrichedContext) {
        additionalContext += hydration.enrichedContext;
      }
    } catch (err) {
      console.error("Error en hydration de estudiantes:", err);
      // Fallback silencioso: el sistema sigue funcionando sin hidratación
    }

    // ── URL Detection (compatibilidad existente) ────────────────────────
    const urlMatch = text.match(/https:\/\/sis\.kuepa\.com\/students\/details\/([a-f0-9]{24})\?structure_id=([a-f0-9]{24})/i);
    
    if (urlMatch) {
      const studentId = urlMatch[1];
      const programId = urlMatch[2];
      
      try {
        const studentUser = await findUser(studentId, ALLIANCE_IDS[this.alliance]);
        let programName = "desconocido";
        
        if (studentUser) {
          const { data: progCatalog } = await supabase.from('programas')
            .select('mongo_id, name')
            .eq('alliance_id', ALLIANCE_IDS[this.alliance])
            .eq('mongo_id', programId)
            .single();
            
          if (progCatalog) {
            programName = progCatalog.name;
          }
        }
        
        additionalContext += `\n[CONTEXTO DE URL: El usuario proporcionó una URL de SIS. student_id: "${studentId}", program_id: "${programId}" (Programa: "${programName}"). USA ESTOS IDs DIRECTAMENTE.]`;
      } catch (err) {
        console.error("Error en RAG de URL:", err);
        additionalContext += `\n[CONTEXTO DE URL: student_id: "${studentId}", program_id: "${programId}".]`;
      }
    }

    return `${enrichedText}${additionalContext}`;
  }

  /**
   * Fase 2: Magic Resolution (Post-LLM)
   * Red de seguridad: traduce INCs, programas faltantes y estados a sus ObjectIDs reales.
   * Con el INC-First pipeline, esto debería intervenir cada vez menos.
   */
  async resolveMagicVariables(action, chatHistory) {
    let resolvedAction = { ...action };
    let studentUser = null;

    // 1. Buscar Usuario y Resolver INC -> ObjectID
    if (resolvedAction.student_id) {
      try {
        studentUser = await findUser(resolvedAction.student_id, ALLIANCE_IDS[this.alliance]);
        if (studentUser && studentUser._id && studentUser._id.$oid) {
          resolvedAction.student_id = studentUser._id.$oid;
        } else if (resolvedAction.student_id.length < 24 && /^\d+$/.test(resolvedAction.student_id)) {
          throw new Error(`INCOMPLETE:El estudiante con INC ${resolvedAction.student_id} no fue encontrado en tu base de datos.`);
        }
      } catch (err) {
        if (err.message.startsWith('INCOMPLETE')) throw err;
        console.error("Error resolviendo usuario:", err);
      }
    }

    // 2. Autocompletar program_id desde los programas del estudiante
    if (!resolvedAction.program_id && (resolvedAction.action_type === 'audit_statistics' || resolvedAction.action_type === 'change_status')) {
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

    // 3. Resolver Estados Dinámicos
    if (resolvedAction.action_type === 'change_status' && resolvedAction.status_name && !resolvedAction.status_id) {
      const estadosCatalog = STATE_OPTIONS_BY_ALIANZA[this.alliance] || [];
      const matchedState = estadosCatalog.find(e => this.normalizeStr(e.label) === this.normalizeStr(resolvedAction.status_name));
      if (matchedState) {
        resolvedAction.status_id = matchedState.value;
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
      // 2. Llamar a LLM
      const geminiResult = await analyzeIntentWithGemini(historyForGemini, this.apiKey);

      // Si pide clarificación o info
      if (geminiResult && (geminiResult.type === 'INCOMPLETE' || geminiResult.type === 'INFO' || geminiResult.type === 'QUERY' || geminiResult.type === 'ROUTE')) {
        return geminiResult;
      }

      // 3. Procesar Acciones (Tool Calls manuales traducidos)
      if (geminiResult && geminiResult.type === 'ACTIONS' && geminiResult.actions) {
        onThinkingStateChange('db_processing');
        
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
