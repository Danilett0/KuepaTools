/**
 * agent/skills/index.js
 * Este archivo centraliza la lógica de conversión de intenciones abstractas
 * a comandos reales de Magik. Evita que el LLM tenga que adivinar la sintaxis.
 */

export const generateCommandsFromActions = (actions) => {
  let commands = [];
  
  const groupedEnroll = {};
  const groupedRemove = {};
  const otherActions = [];

  // Agrupar acciones de inscripción y retiro
  for (const action of actions) {
    const { action_type, student_id, group_id } = action;
    const gId = group_id || "[FALTA_ID_GRUPO]";
    const sId = student_id || "[FALTA_ID_ESTUDIANTE]";

    if (action_type === "enroll_user") {
      if (!groupedEnroll[gId]) groupedEnroll[gId] = new Set();
      groupedEnroll[gId].add(sId);
    } else if (action_type === "remove_user") {
      if (!groupedRemove[gId]) groupedRemove[gId] = new Set();
      groupedRemove[gId].add(sId);
    } else {
      otherActions.push(action);
    }
  }

  // Generar comandos agrupados para retiros (pull:user:from:group)
  for (const [gId, sIds] of Object.entries(groupedRemove)) {
    const studentArgs = Array.from(sIds).map(id => `"${id}"`).join(',');
    commands.push(`magik run:prod pull:user:from:group["${gId}",${studentArgs}]`);
  }

  // Generar comandos agrupados para inscripciones (enroll:user)
  for (const [gId, sIds] of Object.entries(groupedEnroll)) {
    const studentArgs = Array.from(sIds).map(id => `"${id}"`).join(',');
    commands.push(`magik run:prod enroll:user["${gId}",${studentArgs}]`);
  }

  // Procesar las demás acciones normalmente
  for (const action of otherActions) {
    const { action_type, student_id, program_id, group_id, status_id } = action;

    const pId = program_id || "[FALTA_ID_PROGRAMA]";
    const gId = group_id || "[FALTA_ID_GRUPO]";
    const sId = student_id || "[FALTA_ID_ESTUDIANTE]";

    switch (action_type) {
      case "change_status":
        const stId = status_id || `"${action.status_name}"`; // Si el orquestador no lo tradujo, dejamos el string para el fallback
        commands.push(`magik run:prod status:change["${pId}","${stId}","${sId}"]`);
        break;
        
      case "undo_publication":
        commands.push(`magik run:prod undo:publication ["${gId}"]`);
        break;
        
      case "recalculate_grades":
        commands.push(`magik run:prod:force final:user ["${gId}","${sId}"]`);
        break;
        
      case "audit_statistics":
        commands.push(`magik run:prod audit:statistics["${pId}","${sId}"]`);
        if (group_id) {
          commands.push(`magik run:prod audit:subject ["${group_id}","${sId}"]`);
        }
        commands.push(`magik run:prod audit:compacts["${pId}","${sId}"]`);
        break;
        
      case "clean_cache_sislms":
        commands.push(`magik run:prod cache:clean:sislms ["*"]`);
        break;
        
      case "clean_cache_crm":
        commands.push(`magik run:prod cache:clean:crm ["*"]`);
        break;
        
      case "fix_deliverable":
        commands.push(`magik run:prod attempts:fix ["${gId}","${sId}"]`);
        break;
        
      default:
        console.warn(`Action type no reconocido: ${action_type}`);
    }
  }
  
  return commands;
};
