/**
 * Utility functions for parsing, detecting, and formatting tabular data (TSV from Excel/Sheets, CSV, Markdown tables).
 */

/**
 * Checks if a string looks like a 24-character hexadecimal MongoDB ObjectId.
 */
export function isMongoObjectId(val = '') {
  return typeof val === 'string' && /^[a-f0-9]{24}$/i.test(val.trim());
}

/**
 * Extracts a table structure from text if present.
 * Supports:
 * - TSV (Excel / Google Sheets copy-paste with \t)
 * - Markdown tables (| col1 | col2 |)
 * - Semicolon or comma-separated CSV with headers
 *
 * Returns null if no valid table with at least 2 rows and 2 columns is found.
 */
export function extractTableFromText(text = '') {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return null;

  let tableStartIndex = -1;
  let tableEndIndex = -1;
  let detectedDelimiter = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) {
      // If we are inside a table, allow up to 2 empty lines (e.g. batch separators in Excel)
      if (tableStartIndex !== -1) {
        const nextLines = lines.slice(i + 1, i + 3);
        const hasNextTableRow = nextLines.some(l => l.includes('\t') || l.includes('|'));
        if (hasNextTableRow) continue;
      }
      continue;
    }

    const tabCount = (rawLine.match(/\t/g) || []).length;
    const pipeCount = (rawLine.match(/\|/g) || []).length;

    if (tabCount >= 1 || pipeCount >= 2) {
      if (tableStartIndex === -1) {
        tableStartIndex = i;
        detectedDelimiter = tabCount >= 1 ? '\t' : '|';
      }
      tableEndIndex = i;
    } else if (tableStartIndex !== -1) {
      // Line doesn't have delimiters. If we already found a table, stop.
      break;
    }
  }

  if (tableStartIndex === -1 || tableEndIndex - tableStartIndex < 1) {
    return null;
  }

  const tableLines = lines.slice(tableStartIndex, tableEndIndex + 1);
  const rawRows = [];

  for (const line of tableLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip Markdown divider rows like |---|---| or |:---:|
    if (/^[|\-\s:]+$/.test(trimmed) && trimmed.includes('-')) continue;

    let cells = [];
    if (detectedDelimiter === '\t') {
      cells = line.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
    } else {
      const inner = trimmed.replace(/^\||\|$/g, '');
      cells = inner.split('|').map(c => c.trim().replace(/^["']|["']$/g, ''));
    }

    // Filter out completely empty rows (e.g. tabs with only spaces)
    const hasContent = cells.some(c => c.length > 0);
    if (hasContent && cells.length >= 2) {
      rawRows.push(cells);
    }
  }

  if (rawRows.length < 2) return null;

  const firstCell = (rawRows[0][0] || '').trim();
  const isFirstRowData = /^\d+$/.test(firstCell) || isMongoObjectId(firstCell);

  let headers = [];
  let dataRows = [];

  if (isFirstRowData) {
    const maxCols = Math.max(...rawRows.map(r => r.length));
    headers = Array.from({ length: maxCols }, (_, i) => (i === 0 ? 'ID' : `Columna ${i + 1}`));
    dataRows = rawRows;
  } else {
    headers = [...rawRows[0]];
    const maxCols = Math.max(headers.length, ...rawRows.map(r => r.length));
    while (headers.length < maxCols) {
      headers.push(`Columna ${headers.length + 1}`);
    }
    dataRows = rawRows.slice(1);
  }

  // Normalize all data rows
  const normalizedRows = dataRows.map(r => {
    const row = [...r];
    while (row.length < headers.length) row.push('');
    return row.slice(0, headers.length);
  });

  if (normalizedRows.length === 0) return null;

  const prefixText = lines.slice(0, tableStartIndex).join('\n').trim();
  const suffixText = lines.slice(tableEndIndex + 1).join('\n').trim();

  return {
    prefixText,
    suffixText,
    rawTableText: tableLines.join('\n'),
    table: {
      headers,
      rows: normalizedRows,
      totalRows: normalizedRows.length,
      totalCols: headers.length,
      delimiter: detectedDelimiter
    }
  };
}

/**
 * Analyzes headers to determine if the table represents a student transfer matrix:
 * - Student ID column
 * - Current / Origin Group ID column
 * - New / Destination Group ID column
 */
export function detectTransferTable(table) {
  if (!table || !Array.isArray(table.headers) || table.headers.length < 2) {
    return null;
  }

  const headers = table.headers.map(h => String(h || '').toLowerCase().trim());

  let studentCol = -1;
  let fromGroupCol = -1;
  let toGroupCol = -1;

  // 1. Identify Student Column
  studentCol = headers.findIndex(h => /(?:user_id|student_id|estudiante|alumno|usuario|id_estudiante|id_usuario)/i.test(h));
  if (studentCol === -1) {
    studentCol = headers.findIndex(h => /^(?:id|user|student)$/i.test(h));
  }
  // Fallback: column 0 if all rows in col 0 are valid ObjectIds or numeric INCs
  if (studentCol === -1 && table.rows.length > 0) {
    const col0Sample = table.rows.slice(0, 5).every(r => isMongoObjectId(r[0]) || /^\d{4,7}$/.test(r[0]));
    if (col0Sample) studentCol = 0;
  }

  // 2. Identify From/Current Group Column
  fromGroupCol = headers.findIndex((h, idx) => 
    idx !== studentCol && /(?:actual|origen|from|donde\s*(?:est[aá]|se\s*encuentra)|viejo|antiguo|salida)/i.test(h)
  );

  // 3. Identify To/Destination Group Column
  toGroupCol = headers.findIndex((h, idx) => 
    idx !== studentCol && idx !== fromGroupCol && /(?:deber[ií]a|nuevo|destino|to|hacia|llegada|ingreso|nueva)/i.test(h)
  );

  // Fallback: if we have 3 columns and column 0 is student, column 1 is origin, column 2 is destination
  if (studentCol === 0 && table.headers.length === 3) {
    if (fromGroupCol === -1) fromGroupCol = 1;
    if (toGroupCol === -1) toGroupCol = 2;
  }

  // Check if we have valid columns
  const isTransfer = studentCol !== -1 && fromGroupCol !== -1 && toGroupCol !== -1;
  const isEnrollBatch = studentCol !== -1 && (fromGroupCol === -1 || toGroupCol === -1) && table.headers.length === 2;

  if (!isTransfer && !isEnrollBatch) return null;

  const validRows = [];
  for (const r of table.rows) {
    const sId = (r[studentCol] || '').trim();
    if (!sId) continue;

    if (isTransfer) {
      const fromGId = (r[fromGroupCol] || '').trim();
      const toGId = (r[toGroupCol] || '').trim();
      if (fromGId && toGId) {
        validRows.push({
          studentId: sId,
          fromGroupId: fromGId,
          toGroupId: toGId
        });
      }
    } else if (isEnrollBatch) {
      const targetGCol = fromGroupCol !== -1 ? fromGroupCol : (studentCol === 0 ? 1 : 0);
      const targetGId = (r[targetGCol] || '').trim();
      if (targetGId) {
        validRows.push({
          studentId: sId,
          groupId: targetGId
        });
      }
    }
  }

  if (validRows.length === 0) return null;

  return {
    isTransfer,
    isEnrollBatch,
    studentCol,
    fromGroupCol,
    toGroupCol,
    items: validRows,
    totalStudents: validRows.length
  };
}

/**
 * Analyzes headers and rows to determine if the table represents a student status change batch:
 * - Student ID column (INC or MongoDB ObjectId)
 * - Status column (e.g., 'Finalizado', 'Con materias pendientes', 'Materias pendientes', 'Activo', etc.)
 * - Optional program hint columns (e.g. 'Flex', 'Grado 11')
 */
export function detectStatusTable(table) {
  if (!table || !Array.isArray(table.rows) || table.rows.length === 0) {
    return null;
  }

  const headers = (table.headers || []).map(h => String(h || '').toLowerCase().trim());
  const colCount = Math.max(headers.length, ...table.rows.map(r => r.length));
  if (colCount < 2) return null;

  // 1. Identify Student Column
  let studentCol = headers.findIndex(h => /(?:user_id|student_id|estudiante|alumno|usuario|id_estudiante|id_usuario|inc)/i.test(h));
  if (studentCol === -1) {
    studentCol = headers.findIndex(h => /^(?:id|user|student)$/i.test(h));
  }

  if (studentCol === -1) {
    for (let c = 0; c < colCount; c++) {
      const matchCount = table.rows.filter(r => {
        const val = (r[c] || '').trim();
        return isMongoObjectId(val) || /^\d{3,8}$/.test(val);
      }).length;
      if (matchCount / table.rows.length >= 0.7) {
        studentCol = c;
        break;
      }
    }
  }

  if (studentCol === -1 && table.rows.length > 0) {
    const col0Sample = table.rows.slice(0, 5).every(r => isMongoObjectId(r[0]) || /^\d{3,8}$/.test((r[0] || '').trim()));
    if (col0Sample) studentCol = 0;
  }

  if (studentCol === -1) return null;

  // 2. Identify Status Column
  let statusCol = headers.findIndex((h, idx) => idx !== studentCol && /(?:estado|status|condici[oó]n|novedad)/i.test(h));

  const knownStatusKeywords = /(?:finalizad[oa]|materias?\s+pendientes?|activ[oa]|retirad[oa]|graduad[oa]|aprobad[oa]|reprobad[oa]|inactiv[oa]|suspendid[oa]|matriculad[oa]|desertor|cancelad[oa]|con\s+materias|en\s+proceso)/i;

  if (statusCol === -1) {
    for (let c = colCount - 1; c >= 0; c--) {
      if (c === studentCol) continue;
      const matchCount = table.rows.filter(r => {
        const val = (r[c] || '').trim();
        return knownStatusKeywords.test(val);
      }).length;
      if (matchCount / table.rows.length >= 0.4) {
        statusCol = c;
        break;
      }
    }
  }

  // Fallback: If 2 columns total, the other column is status
  if (statusCol === -1 && colCount === 2) {
    statusCol = studentCol === 0 ? 1 : 0;
  }

  if (statusCol === -1) return null;

  // 3. Other columns may contain Program or Level hints (e.g., 'Flex', 'Grado 11')
  const otherCols = [];
  for (let c = 0; c < colCount; c++) {
    if (c !== studentCol && c !== statusCol) {
      otherCols.push(c);
    }
  }

  const validRows = [];
  for (const r of table.rows) {
    const sId = (r[studentCol] || '').trim();
    const stName = (r[statusCol] || '').trim();
    if (!sId || !stName) continue;

    // Must look like an ID or numeric INC
    if (!isMongoObjectId(sId) && !/^\d{1,8}$/.test(sId)) continue;

    const programHints = otherCols.map(c => (r[c] || '').trim()).filter(Boolean).join(' ');

    validRows.push({
      studentId: sId,
      statusName: stName,
      programHint: programHints
    });
  }

  if (validRows.length === 0) return null;

  return {
    isStatusBatch: true,
    studentCol,
    statusCol,
    items: validRows,
    totalStudents: validRows.length
  };
}

/**
 * Converts a table object to a TSV string (for copying back to clipboard or Excel).
 */
export function tableToTSV(table) {
  if (!table) return '';
  const lines = [
    table.headers.join('\t'),
    ...table.rows.map(r => r.join('\t'))
  ];
  return lines.join('\n');
}
