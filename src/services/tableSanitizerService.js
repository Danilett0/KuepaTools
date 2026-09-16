/**
 * tableSanitizerService.js
 * Utilitario de alta precisión para detectar, limpiar y estructurar volcados de datos,
 * hojas de cálculo (Excel, Google Sheets) y tablas pegadas desde terminal/SQL/Mongo.
 */

/**
 * Determina si un bloque de texto contiene datos tabulares (TSV, CSV, punto y coma o columnas alineadas).
 *
 * @param {string} text
 * @returns {boolean}
 */
export function isTableContent(text) {
  if (!text || typeof text !== 'string') return false;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return false;

  // 1. Detección de TSV (tabs de Excel o Sheets)
  const tabLines = lines.filter(l => l.includes('\t'));
  if (tabLines.length >= 2 && tabLines.length >= lines.length * 0.6) {
    return true;
  }

  // 2. Detección de separador punto y coma o pipe
  const semiLines = lines.filter(l => l.includes(';'));
  if (semiLines.length >= 2 && semiLines.length >= lines.length * 0.7) {
    return true;
  }

  const pipeLines = lines.filter(l => l.includes('|'));
  if (pipeLines.length >= 2 && pipeLines.length >= lines.length * 0.7) {
    return true;
  }

  // 3. Detección de columnas espaciadas de terminal o SQL (2 o más espacios consecutivos)
  const multiSpaceLines = lines.filter(l => /\S\s{2,}\S/.test(l));
  if (multiSpaceLines.length >= 2 && multiSpaceLines.length >= lines.length * 0.6) {
    return true;
  }

  return false;
}

/**
 * Convierte un arreglo de filas en formato Markdown Table estándar.
 */
function formatRowsToMarkdownTable(rows, colCount) {
  if (!rows.length) return '';

  const cleanRows = rows.map(row => {
    const padded = [...row];
    while (padded.length < colCount) padded.push('');
    return padded.map(cell => cell.replace(/\|/g, '\\|').trim());
  });

  const header = cleanRows[0];
  const separator = Array(colCount).fill('---');
  const dataRows = cleanRows.slice(1);

  const headerLine = `| ${header.join(' | ')} |`;
  const sepLine = `| ${separator.join(' | ')} |`;
  const bodyLines = dataRows.map(r => `| ${r.join(' | ')} |`).join('\n');

  return `${headerLine}\n${sepLine}\n${bodyLines}`;
}

/**
 * Limpia y formatea un bloque de texto que contenga una tabla (TSV, CSV, espacios)
 * transformándolo en una tabla Markdown perfectamente alineada.
 *
 * @param {string} text - Texto pegado o escrito
 * @returns {string} Texto con la tabla normalizada a Markdown
 */
export function sanitizeTableOrDump(text) {
  if (!text || typeof text !== 'string') return text;

  const rawLines = text.split(/\r?\n/);
  if (rawLines.length < 2) return text;

  // Si ya es una tabla Markdown con pipes y separador '---', retornarla limpia
  const hasMarkdownPipes = rawLines.some(l => l.trim().startsWith('|')) && rawLines.some(l => /\|?\s*---+\s*\|/.test(l));
  if (hasMarkdownPipes) {
    return text.trim();
  }

  const cleanLines = rawLines.map(l => l.trimEnd()).filter(l => l.trim().length > 0);
  if (cleanLines.length < 2) return text;

  // 1. Detección de TSV (Excel / Google Sheets / Web tables)
  const tabCount = cleanLines.filter(l => l.includes('\t')).length;
  if (tabCount >= 2 && tabCount >= cleanLines.length * 0.6) {
    const rows = cleanLines.map(line => line.split('\t').map(c => c.trim()));
    const colCount = Math.max(...rows.map(r => r.length));
    if (colCount >= 2) {
      return formatRowsToMarkdownTable(rows, colCount);
    }
  }

  // 2. Detección de punto y coma
  const semiCount = cleanLines.filter(l => l.includes(';')).length;
  if (semiCount >= 2 && semiCount >= cleanLines.length * 0.7) {
    const rows = cleanLines.map(line => line.split(';').map(c => c.trim()));
    const colCount = Math.max(...rows.map(r => r.length));
    if (colCount >= 2) {
      return formatRowsToMarkdownTable(rows, colCount);
    }
  }

  // 3. Detección de columnas espaciadas (salidas CLI de MongoDB, Postgres, o DataGrip)
  const multiSpaceCount = cleanLines.filter(l => /\S\s{2,}\S/.test(l)).length;
  if (multiSpaceCount >= 2 && multiSpaceCount >= cleanLines.length * 0.6) {
    const rows = cleanLines.map(line => line.split(/\s{2,}/).map(c => c.trim()));
    const colCount = Math.max(...rows.map(r => r.length));
    if (colCount >= 2) {
      return formatRowsToMarkdownTable(rows, colCount);
    }
  }

  return text;
}

/**
 * Convierte tablas Markdown (| col1 | col2 |) al formato nativo de Jira Markup (|| col1 || col2 ||).
 *
 * @param {string} text
 * @returns {string}
 */
export function convertMarkdownTablesToJira(text) {
  if (!text || typeof text !== 'string') return text;

  const lines = text.split('\n');
  const result = [];
  let inTable = false;
  let isHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detectar separador de tabla Markdown: | --- | --- |
    if (inTable && /^\|?\s*[-:\s|]+\s*\|?$/.test(line) && line.includes('-')) {
      continue; // Jira no usa la fila de guiones '---'
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      if (!inTable) {
        // Primera fila = cabecera
        inTable = true;
        isHeader = true;
        result.push(`|| ${cells.join(' || ')} ||`);
      } else {
        // Fila de datos
        result.push(`| ${cells.join(' | ')} |`);
      }
    } else {
      inTable = false;
      isHeader = false;
      result.push(lines[i]);
    }
  }

  return result.join('\n');
}

/**
 * Parsea una tabla en formato Markdown a un objeto para renderizar en React UI.
 *
 * @param {string} tableStr
 * @returns {{ headers: string[], rows: string[][] } | null}
 */
export function parseMarkdownTable(tableStr) {
  if (!tableStr || typeof tableStr !== 'string') return null;

  const lines = tableStr.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const pipeLines = lines.filter(l => l.startsWith('|') && l.endsWith('|'));
  if (pipeLines.length < 2) return null;

  const rawRows = [];
  for (const line of pipeLines) {
    // Omitir separador de guiones
    if (/^\|?\s*[-:\s|]+\s*\|?$/.test(line) && line.includes('-')) {
      continue;
    }
    const cells = line.slice(1, -1).split('|').map(c => c.trim());
    rawRows.push(cells);
  }

  if (rawRows.length === 0) return null;

  const headers = rawRows[0];
  const rows = rawRows.slice(1);

  return { headers, rows };
}
