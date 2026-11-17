import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractTableFromText, detectTransferTable, detectStatusTable, tableToTSV } from '../src/utils/tableParser.js';
import { cleanMarkdownForClipboard } from '../src/utils/textFormatters.js';

describe('Table Parser & Formatter', () => {
  const sampleExcelPaste = `user_id\tgrupo_id donde esta actualmente\tgroup_id donde deberia estar
6998a15d92d9657075fc35f7\t6abfdd45e3470307853cb734\t6a1f092e4306bf1859c7b52b
698cfadc701b7a3ca5558a98\t6abfdd45e3470307853cb734\t6a1f092e4306bf1859c7b52b

698cfadc701b7a3ca5558a98\t6abfd9d3e05ccb0399dc5c63\t6a1f06c34306bf1859c767dd`;

  test('extractTableFromText extrae correctamente la tabla TSV ignorando líneas vacías', () => {
    const result = extractTableFromText(sampleExcelPaste);
    assert.ok(result !== null);
    assert.equal(result.table.headers.length, 3);
    assert.equal(result.table.headers[0], 'user_id');
    assert.equal(result.table.totalRows, 3);
    assert.equal(result.table.rows[0][0], '6998a15d92d9657075fc35f7');
    assert.equal(result.table.rows[2][1], '6abfd9d3e05ccb0399dc5c63');
  });

  test('detectTransferTable identifica columnas de estudiante, grupo actual y grupo destino', () => {
    const result = extractTableFromText(sampleExcelPaste);
    const transfer = detectTransferTable(result.table);
    assert.ok(transfer !== null);
    assert.equal(transfer.isTransfer, true);
    assert.equal(transfer.studentCol, 0);
    assert.equal(transfer.fromGroupCol, 1);
    assert.equal(transfer.toGroupCol, 2);
    assert.equal(transfer.items.length, 3);
    assert.equal(transfer.items[0].studentId, '6998a15d92d9657075fc35f7');
    assert.equal(transfer.items[0].fromGroupId, '6abfdd45e3470307853cb734');
    assert.equal(transfer.items[0].toGroupId, '6a1f092e4306bf1859c7b52b');
  });

  test('tableToTSV genera texto válido para portapapeles', () => {
    const result = extractTableFromText(sampleExcelPaste);
    const tsv = tableToTSV(result.table);
    assert.ok(tsv.includes('user_id\tgrupo_id donde esta actualmente\tgroup_id donde deberia estar'));
    assert.ok(tsv.includes('6998a15d92d9657075fc35f7\t6abfdd45e3470307853cb734\t6a1f092e4306bf1859c7b52b'));
  });

  test('extractTableFromText maneja tablas sin encabezados sin perder la primera fila', () => {
    const rawPaste = `19867\tHada Valentina Morales Ortiz\tFlex\tGrado 11\tFinalizado
27041\tIsabella Garbiras Garnica\tFlex\tGrado 11\tCon materias pendientes
23806\tMickyn Stiven Moreno Ortiz\tFlex\tGrado 11\tCon materias pendientes`;
    const result = extractTableFromText(rawPaste);
    assert.ok(result !== null);
    assert.equal(result.table.totalRows, 3);
    assert.equal(result.table.headers[0], 'ID');
    assert.equal(result.table.rows[0][0], '19867');
    assert.equal(result.table.rows[0][1], 'Hada Valentina Morales Ortiz');
    assert.equal(result.table.rows[2][0], '23806');
  });

  test('detectStatusTable identifica columnas de estudiante, estado y pista de programa', () => {
    const rawPaste = `19867\tHada Valentina Morales Ortiz\tFlex\tGrado 11\tFinalizado
27041\tIsabella Garbiras Garnica\tFlex\tGrado 11\tCon materias pendientes
23806\tMickyn Stiven Moreno Ortiz\tFlex\tGrado 11\tCon materias pendientes`;
    const result = extractTableFromText(rawPaste);
    const statusData = detectStatusTable(result.table);
    assert.ok(statusData !== null);
    assert.equal(statusData.isStatusBatch, true);
    assert.equal(statusData.studentCol, 0);
    assert.equal(statusData.statusCol, 4);
    assert.equal(statusData.totalStudents, 3);
    assert.equal(statusData.items[0].studentId, '19867');
    assert.equal(statusData.items[0].statusName, 'Finalizado');
    assert.ok(statusData.items[0].programHint.includes('Flex'));
    assert.equal(statusData.items[1].studentId, '27041');
    assert.equal(statusData.items[1].statusName, 'Con materias pendientes');
  });

  test('cleanMarkdownForClipboard remueve negritas, backticks y wrappers de notas', () => {
    const dirty = '• **512:** `5fc1417018d8cca721c0ba02`\n*(Nota: Sede principal **Kuepa**: `6021...`)*';
    const clean = cleanMarkdownForClipboard(dirty);
    assert.ok(!clean.includes('**'));
    assert.ok(!clean.includes('`'));
    assert.ok(!clean.includes('*('));
    assert.ok(clean.includes('• 512: 5fc1417018d8cca721c0ba02'));
    assert.ok(clean.includes('Nota: Sede principal Kuepa: 6021...'));
  });
});
