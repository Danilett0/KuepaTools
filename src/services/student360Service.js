import { supabase } from './supabaseClient.js';
import { findUser } from './usuariosService.js';

/**
 * Normaliza cadenas de texto eliminando acentos, diacríticos y espacios sobrantes.
 * Útil para búsquedas insensibles a tildes (ej. 'matematicas' coincide con 'Matemáticas').
 *
 * @param {string} str
 * @returns {string}
 */
export function normalizeText(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Normaliza las entidades de Supabase para la vista Estudiante 360°.
 *
 * @param {object|null} user - Entidad normalizada de usuario.
 * @param {Array} rawStructures - Estructuras/grupos devueltos por Supabase.
 * @param {Array} programsCatalog - Catálogo de programas en Supabase.
 * @returns {object|null}
 */
export function normalizeStudent360(user, rawStructures = [], programsCatalog = []) {
  if (!user) return null;

  const mongoId = user._id?.$oid || user._id || '';
  const inc = user.incremental_user_code || null;
  const fullName = user.profile?.full_name || '';
  const email = user.profile?.email || '';
  const phone = user.profile?.phone || '';
  const allianceId = user.alliance_id?.$oid || user.alliance_id || '';

  // Catálogo en memoria mongo_id -> name
  const progMap = new Map();
  if (Array.isArray(programsCatalog)) {
    for (const p of programsCatalog) {
      const pId = p.mongo_id || p._id?.$oid || p._id;
      if (pId) progMap.set(String(pId), p.name);
    }
  }

  // Normalizar programas del estudiante
  const programs = [];
  const rawPrograms = Array.isArray(user.programs) ? user.programs : [];
  for (const prog of rawPrograms) {
    const pId = prog.structure?.$oid || prog.structure || '';
    if (!pId) continue;
    const name = progMap.get(String(pId)) || `Programa ${pId}`;
    programs.push({
      programId: String(pId),
      name,
      raw: prog,
    });
  }

  // Normalizar grupos/materias
  const groups = [];
  const structuresList = Array.isArray(rawStructures) ? rawStructures : [];
  for (const str of structuresList) {
    const gId = str.mongo_id || str._id?.$oid || str._id || '';
    if (!gId) continue;
    const levelName = str.parent?.level?.name || 'Nivel General';
    const parentId = str.parent_id || str.parent?._id?.$oid || str.parent?.mongo_id || '';
    const subjectName = str.parent?.name || '';
    groups.push({
      groupId: String(gId),
      name: str.name || `Grupo ${gId}`,
      levelName,
      parentId: String(parentId),
      subjectName,
      raw: str,
    });
  }

  return {
    student: {
      mongoId: String(mongoId),
      inc,
      fullName,
      email,
      phone,
      allianceId: String(allianceId),
    },
    programs,
    groups,
  };
}

/**
 * Genera comandos Magik CLI para acciones sobre un estudiante.
 *
 * @param {string} actionType - 'audit' | 'recalculate_grade' | 'recalculate_all_grades' | 'fix_deliverable' | 'clean_cache_lms' | 'clean_cache_crm'
 * @param {object} params - Parámetros requeridos para la acción
 * @returns {string[]} Lista de comandos generados
 */
export function generate360Commands(actionType, params = {}) {
  const { studentId, programId, groupId, groupIds, statusId } = params;
  const targetGroupIds = Array.isArray(groupIds) && groupIds.length > 0
    ? groupIds.filter(Boolean)
    : (groupId ? [groupId] : []);

  switch (actionType) {
    case 'audit': {
      if (!studentId || !programId) {
        throw new Error('studentId y programId son requeridos para la auditoría.');
      }
      const cmds = [
        `magik run:prod audit:level["${programId}","${studentId}"]`,
        `magik run:prod audit:statistics["${programId}","${studentId}"]`,
      ];
      if (groupId) {
        cmds.push(`magik run:prod audit:subject ["${groupId}","${studentId}"]`);
      }
      cmds.push(`magik run:prod audit:compacts["${programId}","${studentId}"]`);
      return cmds;
    }

    case 'recalculate_grade': {
      if (!studentId || targetGroupIds.length === 0) {
        throw new Error('studentId y groupId son requeridos para recalcular notas.');
      }
      return targetGroupIds.map((gId) => `magik run:prod:force final:user ["${gId}","${studentId}"]`);
    }

    case 'recalculate_all_grades': {
      if (!studentId || !Array.isArray(groupIds) || groupIds.length === 0) {
        return [];
      }
      return groupIds
        .filter(Boolean)
        .map((gId) => `magik run:prod:force final:user ["${gId}","${studentId}"]`);
    }

    case 'fix_deliverable': {
      if (!studentId || targetGroupIds.length === 0) {
        throw new Error('studentId y groupId son requeridos para corregir entregable.');
      }
      return targetGroupIds.map((gId) => `magik run:prod attempts:fix ["${gId}","${studentId}"]`);
    }

    case 'audit_group': {
      if (!studentId || targetGroupIds.length === 0) {
        throw new Error('studentId y groupId son requeridos para auditar la materia.');
      }
      return targetGroupIds.map((gId) => `magik run:prod audit:subject ["${gId}","${studentId}"]`);
    }

    case 'remove_user': {
      if (!studentId || targetGroupIds.length === 0) {
        throw new Error('studentId y groupId son requeridos para retirar de la materia.');
      }
      return targetGroupIds.map((gId) => `magik run:prod pull:user:from:group["${gId}","${studentId}"]`);
    }

    case 'change_program_status':
    case 'change_status': {
      const targetStatusId = statusId || params.statusId;
      if (!studentId || !programId || !targetStatusId) {
        throw new Error('studentId, programId y statusId son requeridos para cambiar el estado del programa.');
      }
      return [`magik run:prod status:change["${programId}","${targetStatusId}","${studentId}"]`];
    }

    case 'clean_cache_lms':
      return ['magik run:prod cache:clean:sislms ["*"]'];

    case 'clean_cache_crm':
      return ['magik run:prod cache:clean:crm ["*"]'];

    default:
      throw new Error(`Acción no soportada: ${actionType}`);
  }
}

const inFlightStudentRequests = new Map();
const programsCatalogCache = new Map();

async function getProgramsCatalog(allianceId) {
  if (allianceId && programsCatalogCache.has(allianceId)) {
    return programsCatalogCache.get(allianceId);
  }
  const { data } = await supabase
    .from('programas')
    .select('mongo_id, name')
    .eq('alliance_id', allianceId);
  const catalog = data || [];
  if (allianceId && catalog.length > 0) {
    programsCatalogCache.set(allianceId, catalog);
  }
  return catalog;
}

/**
 * Consulta y orquesta la extracción integral 360° de un estudiante.
 * Deduplica llamadas en curso para prevenir peticiones HTTP redundantes.
 *
 * @param {string} identifier - INC numérico o Mongo ObjectID
 * @param {string} allianceId - ID de la alianza en MongoDB
 * @returns {Promise<object|null>}
 */
export async function fetchStudent360Data(identifier, allianceId) {
  const trimmed = (identifier || '').trim();
  if (!trimmed) return null;

  const key = `${trimmed}:${allianceId || ''}`;
  if (inFlightStudentRequests.has(key)) {
    return inFlightStudentRequests.get(key);
  }

  const fetchPromise = (async () => {
    const user = await findUser(trimmed, allianceId);
    if (!user) return null;

    const studentId = user._id?.$oid || (typeof user._id === 'string' ? user._id : '') || user.mongo_id || '';
    if (!studentId) return null;

    // Consultas paralelas en Supabase (con catálogo de programas en caché)
    const [structuresRes, rawPrograms] = await Promise.all([
      supabase
        .from('structures')
        .select(`
          mongo_id,
          name,
          parent_id,
          parent:parent_id (
            name,
            pensum_level_id,
            level:pensum_level_id ( name )
          )
        `)
        .contains('users', [studentId]),
      getProgramsCatalog(allianceId),
    ]);

    const rawStructures = structuresRes.data || [];

    return normalizeStudent360(user, rawStructures, rawPrograms);
  })();

  inFlightStudentRequests.set(key, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlightStudentRequests.delete(key);
  }
}

/**
 * Formatea una lista de IDs (o arreglos de strings/objetos) en una cadena delimitada por saltos de línea
 * para ser copiada al portapapeles y pegada en textareas o scripts de terminal.
 *
 * @param {Array<string|object>} items - Lista de IDs o entidades con groupId o id
 * @param {string} [delimiter='\n'] - Separador
 * @returns {string}
 */
export function formatIdsForClipboard(items = [], delimiter = '\n') {
  if (!Array.isArray(items)) return '';
  return items
    .map((item) => {
      if (typeof item === 'object' && item !== null) {
        return item.groupId || item.id || '';
      }
      return typeof item === 'string' ? item : '';
    })
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .join(delimiter);
}

const ROMAN_MAP = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
  xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15,
};

const CEFR_MAP = {
  a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6,
};

function parseLevelRank(name) {
  const norm = normalizeText(name);
  if (!norm) return { priority: 999, category: 'last', number: 999, original: name };

  // 1. Módulo 0 / Inducción / Nivelación (máxima prioridad)
  if (
    /(\b(modulo|cuatrimestre|semestre|ciclo|nivel)\s*0\b|\binduccion\b|\bnivelacion\b|\bpropedeutico\b|\bbienvenida\b)/i.test(
      norm
    )
  ) {
    return { priority: 0, category: 'intro', number: 0, original: name };
  }

  // 2. Sin nivel / Otros (última prioridad)
  if (/(sin nivel|general|otros|otro)/i.test(norm)) {
    return { priority: 900, category: 'last', number: 999, original: name };
  }

  // 3. Determinar categoría
  let category = 'general';
  if (norm.includes('cuatrimestre')) category = 'cuatrimestre';
  else if (norm.includes('semestre')) category = 'semestre';
  else if (norm.includes('ciclo')) category = 'ciclo';
  else if (norm.includes('modulo')) category = 'modulo';
  else if (norm.includes('nivel')) category = 'nivel';
  else if (norm.includes('ingles') || norm.includes('english')) category = 'ingles';

  // 4. Extraer número arábigo
  const digitMatch = norm.match(/\b\d+\b/);
  if (digitMatch) {
    return { priority: 10, category, number: parseInt(digitMatch[0], 10), original: name };
  }

  // 5. Extraer número romano (ej: Ciclo IV, Semestre II)
  const romanMatch = norm.match(/\b(x[ivx]*|v[ivx]*|i[vx]+|i+)\b/i);
  if (romanMatch && ROMAN_MAP[romanMatch[0].toLowerCase()]) {
    return { priority: 10, category, number: ROMAN_MAP[romanMatch[0].toLowerCase()], original: name };
  }

  // 6. Extraer CEFR (ej: A1, B2)
  const cefrMatch = norm.match(/\b([abc][12])\b/i);
  if (cefrMatch && CEFR_MAP[cefrMatch[0].toLowerCase()]) {
    return { priority: 10, category, number: CEFR_MAP[cefrMatch[0].toLowerCase()], original: name };
  }

  return { priority: 50, category, number: 999, original: name };
}

/**
 * Compara dos niveles académicos según secuencia lógica pedagógica:
 * Módulo 0 / Inducción primero, luego categorías ordenadas por número/romano/alfanumérico, y 'Sin nivel' al final.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareAcademicLevels(a, b) {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const infoA = parseLevelRank(a);
  const infoB = parseLevelRank(b);

  if (infoA.priority !== infoB.priority) {
    return infoA.priority - infoB.priority;
  }

  if (infoA.category !== infoB.category) {
    return infoA.category.localeCompare(infoB.category);
  }

  if (infoA.number !== infoB.number) {
    return infoA.number - infoB.number;
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Ordena un arreglo de nombres de niveles académicos con lógica pedagógica secuencial.
 *
 * @param {string[]} levels
 * @returns {string[]}
 */
export function sortAcademicLevels(levels = []) {
  if (!Array.isArray(levels)) return [];
  return [...levels].sort(compareAcademicLevels);
}

/**
 * Genera el resumen del estudiante con formato e iconos limpios para tickets de soporte.
 *
 * @param {object} student
 * @param {string} allianceName
 * @returns {string}
 */
export function formatStudentTicketSummary(student, allianceName = '', programName = '') {
  if (!student) return '';
  const fullName = student.fullName || 'N/A';
  const alliance = allianceName || (student.allianceId ? 'Kuepa' : 'N/A');
  const inc = student.inc ? String(student.inc) : 'N/A';
  const mongoId = student.mongoId || 'N/A';
  const email = student.email || 'N/A';
  const phone = student.phone || 'N/A';
  const sisUrl = student.mongoId ? `https://sis.kuepa.com/students/details/${student.mongoId}` : 'N/A';

  const lines = [
    `👤 Nombre: ${fullName}`,
    `🏛️ Alianza: ${alliance}`,
    `🆔 INC: ${inc}`,
    `🔑 Mongo ObjectId: ${mongoId}`,
    ...(programName ? [`🎓 Programa: ${programName}`] : [])
  ];

  return lines.join('\n');
}

/**
 * Genera la URL canónica hacia la vista de grupo académico en SIS.
 *
 * @param {string} groupId - Mongo ObjectId del grupo académico
 * @param {string} [tab='sylabus'] - Pestaña activa por defecto ('sylabus')
 * @returns {string}
 */
export function buildSisGroupUrl(groupId, tab = 'sylabus') {
  if (!groupId) return '';
  const cleanId = String(groupId).trim();
  return cleanId ? `https://sis.kuepa.com/academic-group/details/${cleanId}?tab=${tab}` : '';
}

/**
 * Retorna la paleta de colores coherente con el Design System para un estado académico.
 *
 * @param {string} statusName - Nombre del estado (ej: Activo, Retirado, Graduado, Suspendido)
 * @returns {{ dot: string, text: string, bg: string, border: string }}
 */
export function getStatusTheme(statusName = '') {
  const norm = normalizeText(statusName);
  if (norm.includes('activo') || norm.includes('al dia')) {
    return {
      dot: '#10b981',
      text: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.35)',
    };
  }
  if (norm.includes('graduado') || norm.includes('egresado') || norm.includes('finalizado')) {
    return {
      dot: '#38bdf8',
      text: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.15)',
      border: 'rgba(56, 189, 248, 0.35)',
    };
  }
  if (
    norm.includes('retirado') ||
    norm.includes('desertor') ||
    norm.includes('inactivo') ||
    norm.includes('baja') ||
    norm.includes('expulsado') ||
    norm.includes('abandono')
  ) {
    return {
      dot: '#ef4444',
      text: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.35)',
    };
  }
  if (
    norm.includes('suspendido') ||
    norm.includes('aplazado') ||
    norm.includes('moroso') ||
    norm.includes('alerta') ||
    norm.includes('deuda')
  ) {
    return {
      dot: '#f59e0b',
      text: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.35)',
    };
  }
  return {
    dot: '#a855f7',
    text: '#c084fc',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.35)',
  };
}

/**
 * Normaliza y extrae el nombre base de una asignatura eliminando sufijos de grupo.
 *
 * @param {string} name
 * @returns {string}
 */
export function extractBaseSubjectName(name = '') {
  let norm = normalizeText(name);
  if (!norm) return '';

  norm = norm
    .replace(/\s*\|\s*.*$/i, '')
    .replace(/[-–—]\s*(carril|grupo|mp|gpo|a\.?c|sec|aula|cohorte|\d+(\.\d+)?v?)\b.*$/i, '')
    .replace(/[-–—]\s*(ene|feb|mar|abr|may|mayo|jun|jul|ago|sep|oct|nov|dic)\b.*$/i, '')
    .replace(/\s+(ene|feb|mar|abr|may|mayo|jun|jul|ago|sep|oct|nov|dic)\s+(tg\s+)?(cp|cont|adm|sis)?\b.*$/i, '')
    .replace(/\s+\d{3,5}v?\b.*$/i, '')
    .replace(/[-–—]\s*\d+v?\s*$/i, '')
    .replace(/\s+-\s*$/i, '')
    .replace(/[._\-–—]+$/, '')
    .trim();

  return norm;
}

/**
 * Detecta asignaturas duplicadas donde un estudiante está inscrito en más de un grupo
 * de la misma materia académica basándose en el nombre base normalizado de la asignatura.
 *
 * @param {Array<object>} groups
 * @returns {Set<string>} Conjunto de groupIds duplicados
 */
export function detectDuplicateGroupIds(groups = []) {
  if (!Array.isArray(groups) || groups.length <= 1) return new Set();

  const keyMap = new Map();

  for (const g of groups) {
    const rawName = g.name || '';
    const base = extractBaseSubjectName(rawName) || normalizeText(rawName);
    if (!base) continue;

    const key = `base:${base}`;
    if (!keyMap.has(key)) {
      keyMap.set(key, []);
    }
    if (g.groupId) {
      keyMap.get(key).push(g.groupId);
    }
  }

  const duplicateSet = new Set();
  for (const [, ids] of keyMap.entries()) {
    if (ids.length > 1) {
      ids.forEach((id) => duplicateSet.add(id));
    }
  }

  return duplicateSet;
}



