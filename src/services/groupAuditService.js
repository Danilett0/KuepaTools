import { supabase } from './supabaseClient.js';

/**
 * Contrato de parámetros para la generación del comando audit:subject por grupo.
 * @typedef {Object} GroupAuditSubjectParams
 * @property {string} groupId - MongoDB ObjectId o URL que contenga el ID del grupo académico.
 * @property {string[]} studentIds - Lista de ObjectIds de los estudiantes a auditar.
 */

/**
 * Extrae un ObjectId válido de MongoDB (24 caracteres hexadecimales) de un texto o URL.
 * @param {string} input - Cadena que contiene el ID o URL.
 * @returns {string} ObjectId de 24 caracteres o cadena vacía si no es válido.
 */
export function extractObjectId(input) {
  if (!input || typeof input !== 'string') return '';
  const match = input.trim().match(/\b([a-f0-9]{24})\b/i);
  return match ? match[1] : '';
}

/**
 * Genera el comando CLI de producción para auditar todos los estudiantes de un grupo.
 * magik run:prod audit:subject ["<grupo_id>","<estudiante_1>","<estudiante_2>",...]
 *
 * @param {string} groupId - ID o URL del grupo académico.
 * @param {string[]} studentIds - Arreglo de IDs de estudiantes.
 * @returns {string} Comando Magik formateado.
 * @throws {Error} Si el grupo o los estudiantes son inválidos o están vacíos.
 */
export function generateAuditGroupSubjectCommand(groupId, studentIds = []) {
  if (!groupId || typeof groupId !== 'string') {
    throw new Error('groupId es requerido y debe ser un string.');
  }

  const resolvedGroupId = extractObjectId(groupId);
  if (!resolvedGroupId) {
    throw new Error('groupId debe contener un ObjectId válido de 24 caracteres hexadecimales.');
  }

  if (!Array.isArray(studentIds)) {
    throw new Error('studentIds debe ser un array.');
  }

  const validStudentIds = Array.from(
    new Set(
      studentIds
        .filter(id => id && typeof id === 'string')
        .map(id => extractObjectId(id))
        .filter(Boolean)
    )
  );

  if (validStudentIds.length === 0) {
    throw new Error('Se requiere al menos un estudiante con ObjectId válido para generar el comando.');
  }

  return `magik run:prod audit:subject ${JSON.stringify([resolvedGroupId, ...validStudentIds])}`;
}

/**
 * Consulta en Supabase la estructura de un grupo por su mongo_id y retorna sus datos y estudiantes asociados.
 *
 * @param {string} groupId - ID o URL del grupo académico.
 * @returns {Promise<{ groupId: string, name: string, studentIds: string[], allianceId: string|null }|null>}
 */
export async function fetchGroupStructure(groupId) {
  const cleanId = extractObjectId(groupId);
  if (!cleanId) return null;

  const { data, error } = await supabase
    .from('structures')
    .select(`
      mongo_id,
      name,
      users,
      alliance_id,
      parent:parent_id (
        pensum_level_id,
        level:pensum_level_id ( name )
      )
    `)
    .eq('mongo_id', cleanId)
    .maybeSingle();

  if (error) {
    console.error('Error al consultar grupo en structures:', error);
    throw error;
  }

  if (!data) return null;

  return {
    groupId: data.mongo_id,
    name: data.name || `Grupo ${data.mongo_id}`,
    levelName: data.parent?.level?.name || null,
    studentIds: Array.isArray(data.users) ? data.users.filter(Boolean) : [],
    allianceId: data.alliance_id || null,
  };
}

/**
 * Consulta en Supabase información básica de perfil (nombre, INC) para una lista de student ObjectIds.
 *
 * @param {string[]} studentIds - Lista de ObjectIds de estudiantes.
 * @returns {Promise<Array<{ mongoId: string, inc: number|null, fullName: string, email: string|null }>>}
 */
export async function fetchStudentsInfo(studentIds = []) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) return [];

  const validIds = Array.from(new Set(studentIds.map(extractObjectId).filter(Boolean)));
  if (validIds.length === 0) return [];

  const { data, error } = await supabase
    .from('users')
    .select('mongo_id, incremental_user_code, full_name, email')
    .in('mongo_id', validIds);

  if (error) {
    console.error('Error al consultar usuarios:', error);
    return [];
  }

  return (data || []).map(u => ({
    mongoId: u.mongo_id,
    inc: u.incremental_user_code || null,
    fullName: u.full_name || 'Estudiante sin nombre',
    email: u.email || null,
  }));
}
