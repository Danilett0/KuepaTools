/**
 * academicTerms.js
 * 
 * Utilidades puras para normalización de jerga institucional de Kuepa / Nueva América,
 * limpieza de ruido en tickets (Slack, Zendesk, Email) y matching inteligente de
 * niveles académicos (Cuatrimestres, Ciclos, Semestres).
 */

const ROMAN_NUMERALS = {
  1: 'i',
  2: 'ii',
  3: 'iii',
  4: 'iv',
  5: 'v',
  6: 'vi',
  7: 'vii',
  8: 'viii',
  9: 'ix',
  10: 'x'
};

/**
 * Normaliza un texto removiendo acentos, diacríticos y espacios excesivos.
 * @param {string} str 
 * @returns {string}
 */
export function normalizeStr(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Detecta si un término de búsqueda corresponde a un nivel abreviado
 * como C1, C5, Cuatri 5, Ciclo 3, etc.
 * 
 * @param {string} searchTerm 
 * @returns {{ isAcademicTerm: boolean, termNumber: number|null, rawTerm: string }}
 */
export function parseAcademicTerm(searchTerm) {
  const normalized = normalizeStr(searchTerm);
  if (!normalized) {
    return { isAcademicTerm: false, termNumber: null, rawTerm: '' };
  }

  // Coincide con patrones como: c5, c-5, c 5, cuatri 5, cuatrimestre 5, ciclo 5, semestre 5, nivel 5
  const match = normalized.match(/^(?:c|cuatri|cuatrimestre|ciclo|semestre|nivel)[-\s]*([0-9]{1,2})$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return { isAcademicTerm: true, termNumber: num, rawTerm: normalized };
  }

  // Detectar solo número aislado (1-10) si vino de un contexto de nivel
  const numOnlyMatch = normalized.match(/^([0-9]{1,2})$/);
  if (numOnlyMatch) {
    const num = parseInt(numOnlyMatch[1], 10);
    return { isAcademicTerm: true, termNumber: num, rawTerm: normalized };
  }

  return { isAcademicTerm: false, termNumber: null, rawTerm: normalized };
}

/**
 * Evalúa si un grupo o su nivel pensum coinciden con un término de búsqueda.
 * Soporta jerga institucional (ej: "C5" encuentra "Cuatrimestre 5", "Ciclo 5", "Cuatrimestre V").
 * 
 * @param {string} groupName - Nombre del grupo/materia (ej: "Cálculo I - C5")
 * @param {string} levelName - Nombre del nivel pensum (ej: "Cuatrimestre 5")
 * @param {string} searchTerm - Término buscado (ej: "C5", "cuatrimestre 5", "Matemáticas")
 * @returns {boolean}
 */
export function matchAcademicTerm(groupName = '', levelName = '', searchTerm = '') {
  const cleanSearch = normalizeStr(searchTerm);
  if (!cleanSearch) return true;

  const cleanGroup = normalizeStr(groupName);
  const cleanLevel = normalizeStr(levelName);

  const parsed = parseAcademicTerm(cleanSearch);

  if (parsed.isAcademicTerm && parsed.termNumber !== null) {
    const n = parsed.termNumber;
    const roman = ROMAN_NUMERALS[n] || '';

    // Variantes que representan el mismo nivel
    const levelPatterns = [
      `cuatrimestre ${n}`,
      `cuatri ${n}`,
      `ciclo ${n}`,
      `semestre ${n}`,
      `nivel ${n}`,
      `modulo ${n}`,
      `c${n}`,
      `c ${n}`,
      `c-${n}`
    ];

    if (roman) {
      levelPatterns.push(`cuatrimestre ${roman}`);
      levelPatterns.push(`ciclo ${roman}`);
      levelPatterns.push(`semestre ${roman}`);
      levelPatterns.push(`nivel ${roman}`);
    }

    // 1. Verificar si el levelName contiene alguna de las variantes con límites de palabra
    const levelMatches = levelPatterns.some(pat => {
      const escaped = pat.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(^|\\b|[-_])${escaped}(\\b|[-_]|$)`, 'i');
      return regex.test(cleanLevel);
    });
    if (levelMatches) return true;

    // 2. Verificar si el groupName contiene la marca de nivel (ej. "C5" o "Cuatrimestre 5")
    const groupMatches = levelPatterns.some(pat => {
      // Usar regex con word boundary para evitar que "C1" coincida dentro de "C10" o "AC12"
      const escaped = pat.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(^|\\b|[-_])${escaped}(\\b|[-_]|$)`, 'i');
      return regex.test(cleanGroup);
    });

    if (groupMatches) return true;

    // Si era un término de nivel (ej. C1) y no coincidió con ningún patrón, no caer en substring laxo
    return false;
  }

  // Fallback estándar: coincidencia de subcadena tradicional sin acentos para nombres de materias (ej. "Matemáticas")
  return cleanGroup.includes(cleanSearch) || cleanLevel.includes(cleanSearch);
}

/**
 * Limpia el ruido conversacional típico de tickets de Slack, Zendesk o correos electrónicos.
 * - Elimina menciones y enlaces de Slack tipo [@Usuario](https://...slack.com/...) o <@U...>
 * - Ignora números de ticket tipo #12345 o ticket: 12345 para no confundirlos con INCs
 * - Normaliza etiquetas como "ID: 19393" o "cédula: 19393" a "INC 19393"
 * 
 * @param {string} text 
 * @returns {string}
 */
export function cleanTicketNoise(text) {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // 1. Eliminar menciones Markdown de Slack: [@Nombre](https://*.slack.com/...)
  cleaned = cleaned.replace(/\[@[^\]]+\]\(https?:\/\/[^\s)]*slack\.com[^\s)]*\)/gi, ' ');

  // 2. Eliminar menciones crudas de Slack: <@U[A-Z0-9]+>
  cleaned = cleaned.replace(/<@U[A-Z0-9]+(?:\|[^>]+)?>/gi, ' ');

  // 3. Normalizar etiquetas de ID/INC (incluyendo acentos) para capturar estudiantes claramente
  cleaned = cleaned.replace(/\b(?:id|identificador|c[eé]dula|cc|c[oó]digo)[\s:]+(\d{3,7})\b/gi, 'INC $1');

  // 4. Enmascarar números de ticket explícitos para no confundirlos con INCs de estudiante
  cleaned = cleaned.replace(/\b(?:ticket|caso|incidente|soporte)[\s:#]+(\d{3,8})\b/gi, 'TICKET_REF');

  // 5. Enmascarar números precedidos directamente por '#' (convención típica de tickets: #12345)
  // Pero conservar si viene con prefijo explícito de INC como INC #12345
  cleaned = cleaned.replace(/(?<!INC\s*)#(\d{4,8})\b/gi, 'TICKET_REF');

  return cleaned.trim();
}

/**
 * Extrae todas las URLs de estudiantes de SIS encontradas en el texto.
 * Soporta URLs completas con structure_id y URLs simples sin structure_id.
 * 
 * @param {string} text 
 * @returns {Array<{ studentId: string, programId: string|null, fullUrl: string }>}
 */
export function extractMultipleSisUrls(text) {
  if (!text || typeof text !== 'string') return [];

  const urlRegex = /https:\/\/sis\.kuepa\.com\/students\/details\/([a-f0-9]{24})(?:\?structure_id=([a-f0-9]{24}))?/gi;
  const results = [];
  const seenStudentIds = new Set();

  for (const match of text.matchAll(urlRegex)) {
    const studentId = match[1];
    const programId = match[2] || null;

    if (!seenStudentIds.has(studentId)) {
      seenStudentIds.add(studentId);
      results.push({
        studentId,
        programId,
        fullUrl: match[0]
      });
    }
  }

  return results;
}
