import { analyzeIntentWithGemini } from './aiService.js';
import { findUser, findUsersByIncList, findUsersByMongoIds } from './usuariosService.js';
import { supabase } from './supabaseClient.js';
import { ALLIANCE_IDS } from '../utils/constants.js';
import { generateCommandsFromActions } from '../agent/skills/index.js';
import { hydrateStudents, extractObjectIDs } from './studentHydrator.js';
import { extractMultipleSisUrls } from '../utils/academicTerms.js';
export const DEFAULT_TICKET_CLOSINGS = [
  'Listo por aquí. Por favor valida y nos avisas si surge cualquier duda. 🙌',
  'Quedó listo de nuestra parte. Por favor revisa y nos comentas si necesitas algo más. ✨',
  'Gestión finalizada con éxito. Favor verificar en plataforma y quedamos súper atentos. 🚀',
  'Todo en orden por aquí. Por favor confirma que todo se visualice bien de tu lado. 👍',
  'Caso resuelto. Revisa con calma y nos avisas si hace falta algún ajuste adicional. 🙌',
  'Listo el ajuste. Cualquier novedad o inquietud, quedamos muy atentos. ✨'
];

export function getRandomTicketClosing() {
  const index = Math.floor(Math.random() * DEFAULT_TICKET_CLOSINGS.length);
  return DEFAULT_TICKET_CLOSINGS[index];
}

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
          (action.action_type === 'audit_statistics' || action.action_type === 'change_status' || action.action_type === 'undo_program');
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
  async resolveMagicVariables(action, chatHistory, userText = '') {
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
          (resolvedAction.action_type === 'audit_statistics' || resolvedAction.action_type === 'change_status' || resolvedAction.action_type === 'undo_program');
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
    if (!resolvedAction.program_id && (resolvedAction.action_type === 'audit_statistics' || resolvedAction.action_type === 'change_status' || resolvedAction.action_type === 'undo_program')) {
      if (!studentUser && resolvedAction.student_id) {
        studentUser = await this.getUser(resolvedAction.student_id);
      }

      if (studentUser && studentUser.programs && studentUser.programs.length > 0) {
        if (studentUser.programs.length === 1) {
          resolvedAction.program_id = studentUser.programs[0].structure?.$oid || studentUser.programs[0].structure;
        } else {
          let matchedProg = null;
          if (typeof userText === 'string' && userText.trim()) {
            const normalizedText = this.normalizeStr(userText);
            matchedProg = studentUser.programs.find(p => {
              const name = p.name || '';
              if (!name) return false;
              const normName = this.normalizeStr(name);
              if (normalizedText.includes(normName)) return true;
              const words = normName.split(/\s+/).filter(w => w.length > 3);
              return words.some(w => normalizedText.includes(w));
            });
          }

          if (matchedProg) {
            resolvedAction.program_id = matchedProg.structure?.$oid || matchedProg.structure;
          } else {
            throw new Error(`INCOMPLETE:El estudiante tiene múltiples programas registrados (${studentUser.programs.length}). Por favor, proporciona el ID del programa específico al que te refieres.`);
          }
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

    // 4. Anclaje determinista de group_id para enroll_user
    // Si el usuario especificó un único group_id explícito en su mensaje, cualquier acción enroll_user
    // debe usar estrictamente ese ID, evitando alucinaciones o mezcla de IDs del LLM.
    if (resolvedAction.action_type === 'enroll_user' && typeof userText === 'string' && userText.trim()) {
      const explicitOids = extractObjectIDs(userText);
      const candidateGroupOids = explicitOids.filter(oid => oid !== resolvedAction.student_id);
      if (candidateGroupOids.length === 1) {
        resolvedAction.group_id = candidateGroupOids[0];
      } else if (explicitOids.length === 1) {
        resolvedAction.group_id = explicitOids[0];
      }
    }

    return resolvedAction;
  }

  /**
   * Genera una respuesta concisa y profesional lista para copiar y pegar en tickets o Slack.
   * Entrega únicamente la solución técnica ejecutada sin frases de despedida ni relleno adicional.
   */
  async generateTicketResponse(actions, customClosing = null) {
    if (!actions || actions.length === 0) return null;

    const studentIds = [...new Set(actions.map(a => a.student_id).filter(Boolean))];
    const groupIds = [...new Set(actions.map(a => a.group_id).filter(Boolean))];
    const programIds = [...new Set(actions.map(a => a.program_id).filter(Boolean))];

    // Consultar nombres de grupos
    const groupMap = {};
    if (groupIds.length > 0) {
      try {
        const { data: groups } = await supabase
          .from('structures')
          .select('mongo_id, name')
          .in('mongo_id', groupIds);
        if (groups) {
          groups.forEach(g => { groupMap[g.mongo_id] = g.name; });
        }
      } catch (err) {
        console.warn('Error fetching group names for ticket response:', err);
      }
    }

    // Consultar nombres de programas
    const programMap = {};
    if (programIds.length > 0) {
      try {
        const { data: progs } = await supabase
          .from('programas')
          .select('mongo_id, name')
          .in('mongo_id', programIds);
        if (progs) {
          progs.forEach(p => { programMap[p.mongo_id] = p.name; });
        }
      } catch (err) {
        console.warn('Error fetching program names for ticket response:', err);
      }
    }

    // Mapear datos de estudiantes usando el cache en memoria
    const students = studentIds.map(sId => {
      const u = this.userCache.get(sId);
      return {
        id: sId,
        name: u?.profile?.full_name || u?.full_name || 'Estudiante',
        inc: u?.incremental_user_code || u?.raw_data?.incremental_user_code || ''
      };
    });

    const actionTypes = new Set(actions.map(a => a.action_type));
    const hasEnroll = actionTypes.has('enroll_user');
    const hasRemove = actionTypes.has('remove_user');
    const isTraslado = hasEnroll && hasRemove;

    // Detectar categorías de acción independientes
    const categories = [];
    if (isTraslado) {
      categories.push('traslado');
    } else {
      if (hasEnroll) categories.push('enroll');
      if (hasRemove) categories.push('remove');
    }
    if (actionTypes.has('change_status')) categories.push('change_status');
    if (actionTypes.has('audit_statistics')) categories.push('audit_statistics');
    if (actionTypes.has('recalculate_grades')) categories.push('recalculate_grades');
    if (actionTypes.has('fix_deliverable')) categories.push('fix_deliverable');
    if (actionTypes.has('undo_publication')) categories.push('undo_publication');
    if (actionTypes.has('clean_cache_sislms') || actionTypes.has('clean_cache_crm')) categories.push('clean_cache');
    if (actionTypes.has('undo_program')) categories.push('undo_program');

    // ── GESTIÓN MULTIACCIÓN COMPUESTA ──────────────────────────────────────────
    if (categories.length > 1) {
      const bullets = [];

      if (categories.includes('change_status')) {
        const statusActions = actions.filter(a => a.action_type === 'change_status');
        const stDetails = statusActions.map(act => {
          const s = students.find(st => st.id === act.student_id) || {};
          const incTag = s.inc ? ` (ID: ${s.inc})` : '';
          const progName = programMap[act.program_id] ? ` en su programa ${programMap[act.program_id]}` : '';
          return `${s.name || 'Estudiante'}${incTag} a estado ${act.status_name || 'Actualizado'}${progName}`;
        }).join(', ');
        bullets.push(`• Cambio de Estado: ${stDetails}.`);
      }

      if (categories.includes('traslado')) {
        const enrollGroups = [...new Set(actions.filter(a => a.action_type === 'enroll_user').map(a => groupMap[a.group_id] || a.group_id).filter(Boolean))];
        const destStr = enrollGroups.length > 0 ? ` al nuevo grupo ${enrollGroups.join(', ')}` : '';
        const names = students.map(s => `${s.name}${s.inc ? ` (ID: ${s.inc})` : ''}`).join(', ');
        bullets.push(`• Traslado de materias: Realizado${destStr} para ${names}.`);
      }

      if (categories.includes('enroll')) {
        const enrollGroups = [...new Set(actions.filter(a => a.action_type === 'enroll_user').map(a => groupMap[a.group_id] || a.group_id).filter(Boolean))];
        const gStr = enrollGroups.length > 0 ? ` al grupo ${enrollGroups.join(', ')}` : '';
        const names = students.map(s => `${s.name}${s.inc ? ` (ID: ${s.inc})` : ''}`).join(', ');
        bullets.push(`• Inscripción: Estudiante inscrito${gStr} (${names}).`);
      }

      if (categories.includes('remove')) {
        const removeGroups = [...new Set(actions.filter(a => a.action_type === 'remove_user').map(a => groupMap[a.group_id] || a.group_id).filter(Boolean))];
        const gStr = removeGroups.length > 0 ? ` del grupo ${removeGroups.join(', ')}` : '';
        const names = students.map(s => `${s.name}${s.inc ? ` (ID: ${s.inc})` : ''}`).join(', ');
        bullets.push(`• Retiro: Estudiante retirado${gStr} (${names}).`);
      }

      if (categories.includes('audit_statistics')) {
        const names = students.map(s => `${s.name}${s.inc ? ` (ID: ${s.inc})` : ''}`).join(', ');
        bullets.push(`• Auditoría de estadísticas: Sincronización de progreso completada para ${names}.`);
      }

      if (categories.includes('recalculate_grades')) {
        const names = students.map(s => `${s.name}${s.inc ? ` (ID: ${s.inc})` : ''}`).join(', ');
        bullets.push(`• Recálculo de notas completado para ${names}.`);
      }

      if (categories.includes('fix_deliverable')) {
        const names = students.map(s => `${s.name}${s.inc ? ` (ID: ${s.inc})` : ''}`).join(', ');
        bullets.push(`• Entregable corregido y habilitado para ${names}.`);
      }

      if (categories.includes('undo_publication')) {
        const gNames = [...new Set(actions.filter(a => a.action_type === 'undo_publication').map(a => groupMap[a.group_id] || a.group_id).filter(Boolean))];
        const gStr = gNames.length > 0 ? ` para el grupo ${gNames.join(', ')}` : '';
        bullets.push(`• Despublicación revertida${gStr}.`);
      }

      if (categories.includes('clean_cache')) {
        bullets.push(`• Caché del sistema purgada.`);
      }

      if (categories.includes('undo_program')) {
        const undoProgActions = actions.filter(a => a.action_type === 'undo_program');
        const details = undoProgActions.map(act => {
          const s = students.find(st => st.id === act.student_id) || {};
          const incTag = s.inc ? ` (ID: ${s.inc})` : '';
          const progName = programMap[act.program_id] ? ` del programa ${programMap[act.program_id]}` : '';
          return `${s.name || 'Estudiante'}${incTag}${progName}`;
        }).join(', ');
        bullets.push(`• Eliminación de Programa: Desvinculación completada para ${details}.`);
      }

      return `✅ Solicitud gestionada con éxito.\n\nSe completaron las siguientes acciones:\n\n${bullets.join('\n')}`;
    }

    // ── ACCIONES MONOTEMÁTICAS ESPECIALIZADAS ──────────────────────────────────

    // 1. Cambio de estado
    if (actionTypes.has('change_status')) {
      const statusActions = actions.filter(a => a.action_type === 'change_status');
      if (statusActions.length === 1) {
        const act = statusActions[0];
        const student = students.find(s => s.id === act.student_id) || students[0] || {};
        const stName = act.status_name || 'solicitado';
        const progName = programMap[act.program_id] ? ` en su programa ${programMap[act.program_id]}` : '';
        const incTag = student.inc ? ` (ID: ${student.inc})` : '';
        return `✅ Estado actualizado con éxito.\n\nEl estudiante ${student.name}${incTag} ha sido actualizado a estado ${stName}${progName}.`;
      } else {
        const listStr = statusActions.map(act => {
          const s = students.find(st => st.id === act.student_id) || {};
          const incTag = s.inc ? ` (ID: ${s.inc})` : '';
          return `• ${s.name || 'Estudiante'}${incTag}: Estado ${act.status_name || 'Actualizado'}`;
        }).join('\n');
        return `✅ Estados actualizados con éxito.\n\nSe procesó la actualización de estado para los siguientes estudiantes:\n\n${listStr}`;
      }
    }

    // 2. Auditoría de estadísticas
    if (actionTypes.has('audit_statistics')) {
      const gNames = actions.map(a => groupMap[a.group_id]).filter(Boolean);
      const groupStr = gNames.length > 0 ? ` en el grupo ${gNames.join(', ')}` : '';
      if (students.length === 1) {
        const student = students[0] || {};
        const incTag = student.inc ? ` (ID: ${student.inc})` : '';
        return `✅ Progreso y estadísticas auditados con éxito.\n\nSe ejecutó la auditoría y sincronización completa para el estudiante ${student.name}${incTag}${groupStr}. Los recursos completados y avances han sido recalculados y sincronizados en la plataforma.`;
      } else {
        const studentList = students.map(s => `• ${s.name}${s.inc ? ` (ID: ${s.inc})` : ''}`).join('\n');
        return `✅ Progreso y estadísticas auditados con éxito.\n\nSe ejecutó la auditoría y sincronización completa${groupStr} para los siguientes estudiantes:\n\n${studentList}\n\nLos recursos completados y avances han sido recalculados y sincronizados en la plataforma.`;
      }
    }

    // 3. Traslados (Enroll + Remove simultáneos)
    if (isTraslado) {
      const origGroups = [...new Set(actions.filter(a => a.action_type === 'remove_user').map(a => groupMap[a.group_id] || a.group_id).filter(Boolean))];
      const enrollGroups = [...new Set(actions.filter(a => a.action_type === 'enroll_user').map(a => groupMap[a.group_id] || a.group_id).filter(Boolean))];

      if (students.length === 1) {
        const student = students[0] || {};
        const incTag = student.inc ? ` (ID: ${student.inc})` : '';

        // Si hay múltiples grupos en origen o destino, desglosarlos con viñetas
        if (origGroups.length > 1 || enrollGroups.length > 1) {
          const origText = origGroups.length > 1
            ? `de los siguientes grupos:\n${origGroups.map(g => `  • ${g}`).join('\n')}`
            : (origGroups.length === 1 ? `del grupo ${origGroups[0]}` : 'de los grupos anteriores');
          const destText = enrollGroups.length > 1
            ? `en los siguientes nuevos grupos:\n${enrollGroups.map(g => `  • ${g}`).join('\n')}`
            : (enrollGroups.length === 1 ? `al nuevo grupo ${enrollGroups[0]}` : 'en los nuevos grupos solicitados');

          return `✅ Traslado de materias gestionado con éxito.\n\nSe realizaron los movimientos correspondientes para el estudiante ${student.name}${incTag}, desinscribiendo ${origText} e inscribiendo ${destText}.`;
        }

        const origStr = origGroups.length > 0 ? `del grupo ${origGroups.join(', ')}` : 'de los grupos anteriores';
        const destStr = enrollGroups.length > 0 ? `al nuevo grupo ${enrollGroups.join(', ')}` : 'en los nuevos grupos solicitados';
        return `✅ Traslado de materias gestionado con éxito.\n\nSe realizaron los movimientos correspondientes para el estudiante ${student.name}${incTag}, desinscribiendo ${origStr} e inscribiendo ${destStr}.`;
      } else {
        const studentLines = students.map(s => {
          const incTag = s.inc ? ` (ID: ${s.inc})` : '';
          const sOrig = [...new Set(actions.filter(a => a.student_id === s.id && a.action_type === 'remove_user').map(a => groupMap[a.group_id] || a.group_id).filter(Boolean))];
          const sDest = [...new Set(actions.filter(a => a.student_id === s.id && a.action_type === 'enroll_user').map(a => groupMap[a.group_id] || a.group_id).filter(Boolean))];

          if (sOrig.length > 0 && sDest.length > 0) {
            return `• ${s.name}${incTag}: ${sOrig.join(', ')} ➔ ${sDest.join(', ')}`;
          } else if (sDest.length > 0) {
            return `• ${s.name}${incTag}: ➔ ${sDest.join(', ')}`;
          } else if (sOrig.length > 0) {
            return `• ${s.name}${incTag}: Retiro de ${sOrig.join(', ')}`;
          } else {
            return `• ${s.name}${incTag}`;
          }
        }).join('\n');

        return `✅ Traslados de materias gestionados con éxito.\n\nSe realizaron los movimientos correspondientes para los siguientes estudiantes:\n\n${studentLines}`;
      }
    }

    // 4. Inscripciones puras
    if (hasEnroll) {
      const enrollGroups = [...new Set(actions.map(a => groupMap[a.group_id] || a.group_id).filter(Boolean))];
      if (students.length === 1) {
        const student = students[0] || {};
        const incTag = student.inc ? ` (ID: ${student.inc})` : '';
        if (enrollGroups.length > 1) {
          const groupList = enrollGroups.map(g => `• ${g}`).join('\n');
          return `✅ Estudiante inscrito con éxito.\n\nEl estudiante ${student.name}${incTag} ha sido inscrito satisfactoriamente en los siguientes grupos:\n\n${groupList}`;
        }
        const groupStr = enrollGroups.length === 1 ? ` al grupo ${enrollGroups[0]}` : '';
        return `✅ Estudiante inscrito con éxito.\n\nEl estudiante ${student.name}${incTag} ha sido inscrito satisfactoriamente${groupStr}.`;
      } else {
        const studentList = students.map(s => `• ${s.name}${s.inc ? ` (ID: ${s.inc})` : ''}`).join('\n');
        if (enrollGroups.length > 1) {
          const groupList = enrollGroups.map(g => `• ${g}`).join('\n');
          return `✅ Inscripciones realizadas con éxito.\n\nSe inscribieron los siguientes ${students.length} estudiantes:\n\n${studentList}\n\nEn los siguientes grupos:\n\n${groupList}`;
        }
        const groupStr = enrollGroups.length === 1 ? ` (${enrollGroups[0]})` : '';
        return `✅ Inscripciones realizadas con éxito.\n\nSe inscribieron los siguientes ${students.length} estudiantes en los grupos correspondientes${groupStr}:\n\n${studentList}`;
      }
    }

    // 5. Retiros puros
    if (hasRemove) {
      const removeGroups = [...new Set(actions.map(a => groupMap[a.group_id] || a.group_id).filter(Boolean))];
      if (students.length === 1) {
        const student = students[0] || {};
        const incTag = student.inc ? ` (ID: ${student.inc})` : '';
        if (removeGroups.length > 1) {
          const groupList = removeGroups.map(g => `• ${g}`).join('\n');
          return `✅ Retiro procesado con éxito.\n\nSe retiró al estudiante ${student.name}${incTag} de los siguientes grupos:\n\n${groupList}`;
        }
        const groupStr = removeGroups.length === 1 ? ` del grupo ${removeGroups[0]}` : '';
        return `✅ Retiro procesado con éxito.\n\nSe retiró al estudiante ${student.name}${incTag}${groupStr}.`;
      } else {
        const studentList = students.map(s => `• ${s.name}${s.inc ? ` (ID: ${s.inc})` : ''}`).join('\n');
        if (removeGroups.length > 1) {
          const groupList = removeGroups.map(g => `• ${g}`).join('\n');
          return `✅ Retiro masivo procesado.\n\nSe retiraron los siguientes ${students.length} estudiantes:\n\n${studentList}\n\nDe los siguientes grupos:\n\n${groupList}`;
        }
        const groupStr = removeGroups.length === 1 ? ` (${removeGroups[0]})` : '';
        return `✅ Retiro masivo procesado.\n\nSe retiraron los siguientes ${students.length} estudiantes de los grupos indicados${groupStr}:\n\n${studentList}`;
      }
    }

    // 6. Despublicación de grupos (undo_publication)
    if (actionTypes.has('undo_publication')) {
      const gNames = [...new Set(actions.map(a => groupMap[a.group_id] || a.group_id).filter(Boolean))];
      const gStr = gNames.length > 0 ? ` para el grupo ${gNames.join(', ')}` : '';
      return `✅ Despublicación realizada con éxito.\n\nSe revirtió la publicación${gStr}.`;
    }

    // 7. Recálculo de notas
    if (actionTypes.has('recalculate_grades')) {
      if (students.length === 1) {
        const student = students[0] || {};
        const incTag = student.inc ? ` (ID: ${student.inc})` : '';
        return `✅ Calificaciones recalculadas con éxito.\n\nSe forzó el recálculo de la nota final para ${student.name}${incTag}.`;
      } else {
        const studentList = students.map(s => `• ${s.name}${s.inc ? ` (ID: ${s.inc})` : ''}`).join('\n');
        return `✅ Calificaciones recalculadas con éxito.\n\nSe forzó el recálculo de la nota final para los siguientes estudiantes:\n\n${studentList}`;
      }
    }

    // 8. Corregir entregable
    if (actionTypes.has('fix_deliverable')) {
      if (students.length === 1) {
        const student = students[0] || {};
        const incTag = student.inc ? ` (ID: ${student.inc})` : '';
        return `✅ Entregable corregido.\n\nSe habilitó y corrigió el intento de entrega para el estudiante ${student.name}${incTag}.`;
      } else {
        const studentList = students.map(s => `• ${s.name}${s.inc ? ` (ID: ${s.inc})` : ''}`).join('\n');
        return `✅ Entregables corregidos.\n\nSe habilitó y corrigió el intento de entrega para los siguientes estudiantes:\n\n${studentList}`;
      }
    }

    // 9. Limpieza de cache
    if (actionTypes.has('clean_cache_sislms') || actionTypes.has('clean_cache_crm')) {
      return `✅ Caché del sistema limpiada con éxito.\n\nSe ejecutó la purga del caché solicitado.`;
    }

    // 10. Eliminación de programa
    if (actionTypes.has('undo_program')) {
      const undoProgActions = actions.filter(a => a.action_type === 'undo_program');
      if (undoProgActions.length === 1) {
        const act = undoProgActions[0];
        const student = students.find(s => s.id === act.student_id) || students[0] || {};
        const progName = programMap[act.program_id] ? ` ${programMap[act.program_id]}` : '';
        const incTag = student.inc ? ` (ID: ${student.inc})` : '';
        return `✅ Programa eliminado con éxito.\n\nSe desvinculó el programa${progName} para el estudiante ${student.name}${incTag}.`;
      } else {
        const listStr = undoProgActions.map(act => {
          const s = students.find(st => st.id === act.student_id) || {};
          const incTag = s.inc ? ` (ID: ${s.inc})` : '';
          const progName = programMap[act.program_id] ? ` en ${programMap[act.program_id]}` : '';
          return `• ${s.name || 'Estudiante'}${incTag}: Programa retirado${progName}`;
        }).join('\n');
        return `✅ Programas eliminados con éxito.\n\nSe procesó la eliminación de programa para los siguientes estudiantes:\n\n${listStr}`;
      }
    }

    // Fallback genérico
    if (students.length === 1) {
      const student = students[0] || {};
      const incTag = student.inc ? ` (ID: ${student.inc})` : '';
      return `✅ Solicitud gestionada con éxito.\n\nSe procesaron los comandos correspondientes para ${student.name || 'el estudiante'}${incTag}.`;
    } else {
      const studentList = students.map(s => `• ${s.name || 'Estudiante'}${s.inc ? ` (ID: ${s.inc})` : ''}`).join('\n');
      return `✅ Solicitud gestionada con éxito.\n\nSe procesaron los comandos correspondientes para los siguientes estudiantes:\n\n${studentList}`;
    }
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

    if (this.options?.signal?.aborted) {
      const abortErr = new Error('Operación cancelada por el usuario.');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    try {
      // 2. Llamar a LLM con reintentos automáticos para mitigar errores 503/429
      const geminiResult = await analyzeIntentWithGemini(historyForGemini, this.apiKey, {
        maxRetries: 5,
        timeoutMs: 90000,
        model: this.options?.model,
        signal: this.options?.signal,
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
          const resolvedAction = await this.resolveMagicVariables(action, chatHistory, userText);
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

        // 6. Generar respuesta sintetizada para Tickets / Slack
        const ticketResponse = await this.generateTicketResponse(finalActions, geminiResult.ticketClosing);

        return {
          type: 'COMMANDS',
          commands: bashCommands,
          ticketResponse,
          message: geminiResult.message || null
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
