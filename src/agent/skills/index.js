/**
 * agent/skills/index.js
 * Este archivo centraliza la lógica de conversión de intenciones abstractas
 * a comandos reales de Magik. Evita que el LLM tenga que adivinar la sintaxis.
 */

export const generateCommandsFromActions = (actions) => {
  let commands = [];
  
  for (const action of actions) {
    const { action_type, student_id, program_id, group_id, status_id } = action;

    // Utilidades para asegurar que no pasamos 'undefined' crudos si se requiere magia semántica
    const pId = program_id || "[FALTA_ID_PROGRAMA]";
    const gId = group_id || "[FALTA_ID_GRUPO]";
    const sId = student_id || "[FALTA_ID_ESTUDIANTE]";

    switch (action_type) {
      case "enroll_user":
        commands.push(`magik run:prod enroll:user["${gId}","${sId}"]`);
        break;
        
      case "change_status":
        const stId = status_id || `"${action.status_name}"`; // Si el orquestador no lo tradujo, dejamos el string para el fallback
        commands.push(`magik run:prod status:change["${pId}","${stId}","${sId}"]`);
        break;
        
      case "remove_user":
        commands.push(`magik run:prod pull:user:from:group["${gId}","${sId}"]`);
        break;
        
      case "undo_publication":
        commands.push(`magik run:prod undo:publication ["${gId}"]`);
        break;
        
      case "recalculate_grades":
        commands.push(`magik run:prod:force final:user ["${gId}","${sId}"]`);
        break;
        
      case "audit_statistics":
        commands.push(`magik run:prod audit:level["${pId}","${sId}"]`);
        commands.push(`magik run:prod audit:statistics["${pId}","${sId}"]`);
        if (group_id) {
          commands.push(`magik run:prod audit:subject ["${group_id}","${sId}"]`);
        }
        commands.push(`magik run:prod audit:compacts["${pId}","${sId}"]`);
        break;
        
      default:
        console.warn(`Action type no reconocido: ${action_type}`);
    }
  }
  
  return commands;
};
