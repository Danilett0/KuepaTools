/**
 * studentHydrator.js
 * 
 * Servicio de "hidratación" de estudiantes: dado un texto en lenguaje natural,
 * detecta todos los INCs y ObjectIDs mencionados, busca los estudiantes en la BD,
 * y devuelve perfiles ricos listos para inyectar como contexto al LLM.
 * 
 * Esto permite que la IA reciba datos reales (nombre, programas, IDs largos)
 * SIN tener que preguntar al usuario, reduciendo fricciones.
 */

import { findUser } from './usuariosService';
import { supabase } from './supabaseClient';
import { ALLIANCE_IDS } from '../utils/constants';

/**
 * Detecta todos los números que parecen INCs en el texto.
 * Un INC es un número de 1 a 7 dígitos que NO forma parte de un ObjectID (24 hex chars).
 * 
 * @param {string} text - Texto del usuario
 * @returns {string[]} - Array de INCs encontrados como strings
 */
function extractINCs(text) {
  // Primero, eliminamos los ObjectIDs para no confundir dígitos dentro de ellos
  const textWithoutObjectIds = text.replace(/\b[a-f0-9]{24}\b/gi, '___OID___');
  
  // Buscamos secuencias de dígitos de 3-7 caracteres (mínimo 3 para evitar "1", "2", "10")
  const matches = textWithoutObjectIds.match(/\b\d{3,7}\b/g) || [];
  
  // Filtrar falsos positivos comunes (años, etc.)
  const filtered = matches.filter(n => {
    const num = parseInt(n);
    // Excluir años comunes (2020-2030)
    if (num >= 2020 && num <= 2030) return false;
    return true;
  });
  
  // Deduplicar
  return [...new Set(filtered)];
}

/**
 * Detecta todos los ObjectIDs (24 caracteres hexadecimales) en el texto.
 * 
 * @param {string} text - Texto del usuario
 * @returns {string[]} - Array de ObjectIDs encontrados
 */
function extractObjectIDs(text) {
  const matches = text.match(/\b[a-f0-9]{24}\b/gi) || [];
  return [...new Set(matches)];
}

/**
 * Dado un array de program structure IDs, busca sus nombres en el catálogo de Supabase.
 * 
 * @param {string[]} programIds - Array de ObjectIDs de programas (structure)
 * @param {string} allianceId - ObjectID de la alianza
 * @returns {Promise<Object>} - Mapa de programId → nombre
 */
async function resolveProgramNames(programIds, allianceId) {
  if (!programIds.length) return {};
  
  try {
    const { data } = await supabase
      .from('programas')
      .select('mongo_id, name')
      .eq('alliance_id', allianceId)
      .in('mongo_id', programIds);
    
    if (!data) return {};
    return Object.fromEntries(data.map(p => [p.mongo_id, p.name]));
  } catch (err) {
    console.error('Error resolviendo nombres de programas:', err);
    return {};
  }
}

/**
 * Función principal: Hidrata el texto del usuario detectando estudiantes
 * y construyendo perfiles ricos para cada uno.
 * 
 * @param {string} text - Mensaje del usuario en lenguaje natural
 * @param {string} allianceKey - Clave de alianza ('na' o 'kuepa')
 * @param {function} onStateChange - Callback para actualizar estado visual (opcional)
 * @returns {Promise<{ students: HydratedStudent[], objectIds: string[], enrichedContext: string }>}
 * 
 * @typedef {Object} HydratedStudent
 * @property {string} inc - INC original
 * @property {string} objectId - ObjectID largo del estudiante
 * @property {string} name - Nombre completo
 * @property {string} email - Email
 * @property {Array} programs - Programas con id y nombre resuelto
 * @property {number} programCount - Cantidad de programas
 * @property {Object|null} autoProgram - Programa auto-resuelto si tiene exactamente 1
 */
export async function hydrateStudents(text, allianceKey, onStateChange) {
  const allianceId = ALLIANCE_IDS[allianceKey];
  const detectedINCs = extractINCs(text);
  const detectedObjectIDs = extractObjectIDs(text);
  
  if (detectedINCs.length === 0) {
    return {
      students: [],
      objectIds: detectedObjectIDs,
      enrichedContext: ''
    };
  }
  
  if (onStateChange) onStateChange('resolving_students');
  
  const hydratedStudents = [];
  
  // Recopilar todos los program IDs para resolver nombres en batch
  const allProgramIds = [];
  
  // Buscar cada INC en la BD
  for (const inc of detectedINCs) {
    try {
      const user = await findUser(inc, allianceId);
      
      if (user && user._id && user._id.$oid) {
        const studentPrograms = (user.programs || []).map(p => {
          const pid = p.structure?.$oid || p.structure;
          if (pid) allProgramIds.push(pid);
          return { id: pid };
        }).filter(p => p.id);
        
        hydratedStudents.push({
          inc,
          objectId: user._id.$oid,
          name: user.profile?.full_name || 'Sin nombre',
          email: user.profile?.email || '',
          programs: studentPrograms,
          programCount: studentPrograms.length,
          autoProgram: studentPrograms.length === 1 ? studentPrograms[0] : null
        });
      }
    } catch (err) {
      console.warn(`No se pudo hidratar INC ${inc}:`, err.message);
    }
  }
  
  // Resolver nombres de programas en batch
  if (allProgramIds.length > 0) {
    const programNames = await resolveProgramNames([...new Set(allProgramIds)], allianceId);
    
    // Enriquecer los programas con sus nombres
    for (const student of hydratedStudents) {
      for (const prog of student.programs) {
        prog.name = programNames[prog.id] || prog.id;
      }
      if (student.autoProgram) {
        student.autoProgram.name = programNames[student.autoProgram.id] || student.autoProgram.id;
      }
    }
  }
  
  // Construir el bloque de contexto enriquecido para el LLM
  const enrichedContext = buildContextBlock(hydratedStudents, detectedObjectIDs);
  
  return {
    students: hydratedStudents,
    objectIds: detectedObjectIDs,
    enrichedContext
  };
}

/**
 * Construye el bloque de texto [CONTEXTO DEL SISTEMA] que se inyectará
 * al mensaje antes de enviarlo al LLM.
 */
function buildContextBlock(students, objectIds) {
  if (students.length === 0) return '';
  
  let context = '\n[CONTEXTO DEL SISTEMA - ESTUDIANTES DETECTADOS]:';
  
  for (const s of students) {
    context += `\n- INC ${s.inc} → ObjectID: "${s.objectId}"`;
    context += `\n  Nombre: "${s.name}"`;
    
    if (s.programCount === 0) {
      context += `\n  Programas: Ninguno registrado.`;
    } else if (s.programCount === 1) {
      context += `\n  Programa (1): "${s.autoProgram.name}" (ID: ${s.autoProgram.id})`;
      context += `\n  → Tiene 1 solo programa. USA ESTE DIRECTAMENTE como program_id sin preguntar.`;
    } else {
      context += `\n  Programas (${s.programCount}):`;
      for (const p of s.programs) {
        context += `\n    • "${p.name}" (ID: ${p.id})`;
      }
      context += `\n  → Tiene múltiples programas. Si la acción requiere program_id, verifica si el usuario ya mencionó cuál quiere (ej: por nombre o palabra clave), y USA su ID directamente. Si no lo especificó, PREGUNTA al usuario cuál necesita listando los nombres con saltos de línea (\\n) como una lista vertical. Si la acción NO requiere program_id (ej. enroll_user, remove_user, fix_deliverable), ignora los programas.`;
    }
  }
  
  if (objectIds.length > 0) {
    context += `\n\nObjectIDs detectados en el mensaje: ${objectIds.join(', ')}`;
    context += `\n(Pueden ser group_id, program_id, u otro ID según el contexto del mensaje.)`;
  }
  
  context += `\n\nUSA ESTOS DATOS DIRECTAMENTE EN TUS ACCIONES. No preguntes por student_id ni program_id si ya están aquí.`;
  
  return context;
}
