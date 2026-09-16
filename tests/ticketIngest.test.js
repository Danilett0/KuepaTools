import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeStr,
  parseAcademicTerm,
  matchAcademicTerm,
  cleanTicketNoise,
  extractMultipleSisUrls
} from '../src/utils/academicTerms.js';

describe('academicTerms — normalizeStr & parseAcademicTerm', () => {
  test('normaliza texto con acentos y mayúsculas', () => {
    assert.equal(normalizeStr('  CUATRIMESTRE 5  '), 'cuatrimestre 5');
    assert.equal(normalizeStr('Matemáticas Básicas'), 'matematicas basicas');
  });

  test('reconoce abreviaturas institucionales C1 a C10', () => {
    assert.deepEqual(parseAcademicTerm('C5'), { isAcademicTerm: true, termNumber: 5, rawTerm: 'c5' });
    assert.deepEqual(parseAcademicTerm('c-5'), { isAcademicTerm: true, termNumber: 5, rawTerm: 'c-5' });
    assert.deepEqual(parseAcademicTerm('cuatri 5'), { isAcademicTerm: true, termNumber: 5, rawTerm: 'cuatri 5' });
    assert.deepEqual(parseAcademicTerm('cuatrimestre 3'), { isAcademicTerm: true, termNumber: 3, rawTerm: 'cuatrimestre 3' });
    assert.deepEqual(parseAcademicTerm('ciclo 4'), { isAcademicTerm: true, termNumber: 4, rawTerm: 'ciclo 4' });
    assert.deepEqual(parseAcademicTerm('5'), { isAcademicTerm: true, termNumber: 5, rawTerm: '5' });
  });

  test('no clasifica nombres de materias como término de nivel abreviado', () => {
    assert.equal(parseAcademicTerm('Matemáticas').isAcademicTerm, false);
    assert.equal(parseAcademicTerm('Cálculo diferencial').isAcademicTerm, false);
  });
});

describe('academicTerms — matchAcademicTerm', () => {
  test('debe hacer match de C5 con un nivel llamado "Cuatrimestre 5"', () => {
    assert.equal(matchAcademicTerm('Cálculo Integral', 'Cuatrimestre 5', 'C5'), true);
    assert.equal(matchAcademicTerm('Cálculo Integral', 'Cuatrimestre 5', 'c-5'), true);
    assert.equal(matchAcademicTerm('Cálculo Integral', 'Cuatrimestre 5', 'cuatrimestre 5'), true);
  });

  test('debe hacer match de C5 con números romanos "Cuatrimestre V"', () => {
    assert.equal(matchAcademicTerm('Macroeconomía', 'Cuatrimestre V', 'C5'), true);
  });

  test('debe hacer match si el grupo tiene la etiqueta de nivel en su nombre', () => {
    assert.equal(matchAcademicTerm('Inglés C5 - Noche', 'N/A', 'C5'), true);
    assert.equal(matchAcademicTerm('Matemáticas - Cuatrimestre 5', '', 'C5'), true);
  });

  test('no debe confundir C1 con C10', () => {
    assert.equal(matchAcademicTerm('Electiva C10', 'Cuatrimestre 10', 'C1'), false);
    assert.equal(matchAcademicTerm('Electiva C1', 'Cuatrimestre 1', 'C10'), false);
  });

  test('mantiene compatibilidad con búsqueda tradicional por nombre de materia', () => {
    assert.equal(matchAcademicTerm('Fundamentos de Programación', 'Semestre 1', 'programacion'), true);
    assert.equal(matchAcademicTerm('Contabilidad I', 'Nivel 1', 'Derecho'), false);
  });
});

describe('academicTerms — cleanTicketNoise', () => {
  test('elimina menciones de Slack con markdown y URLs', () => {
    const rawSlack = 'Hola buenas tardes [@Jefferson](https://kuepa.slack.com/team/U078CRBQMRT) [@Caren Fonseca](https://kuepa.slack.com/team/U011ERD8Y8M) espero estén bien!! ID: 19393';
    const cleaned = cleanTicketNoise(rawSlack);

    assert.equal(cleaned.includes('slack.com'), false);
    assert.equal(cleaned.includes('@Jefferson'), false);
    assert.equal(cleaned.includes('INC 19393'), true);
  });

  test('elimina menciones crudas de Slack tipo <@U01234567>', () => {
    const raw = 'Favor revisar <@U078CRBQMRT|jefferson> con ID: 45210';
    const cleaned = cleanTicketNoise(raw);
    assert.equal(cleaned.includes('U078CRBQMRT'), false);
    assert.equal(cleaned.includes('INC 45210'), true);
  });

  test('enmascara números de ticket para no confundirlos con estudiantes', () => {
    const raw = 'Revisar ticket #123456 para el estudiante con cédula: 89321';
    const cleaned = cleanTicketNoise(raw);
    assert.equal(cleaned.includes('123456'), false);
    assert.equal(cleaned.includes('INC 89321'), true);
  });
});

describe('academicTerms — extractMultipleSisUrls', () => {
  test('extrae múltiples URLs de SIS con student_id y structure_id', () => {
    const text = `
      Estudiante 1: https://sis.kuepa.com/students/details/60d21b4667d0d8992e610aaa?structure_id=60d21b4967d0d8992e610111
      Estudiante 2: https://sis.kuepa.com/students/details/60d21b4667d0d8992e610bbb?structure_id=60d21b4967d0d8992e610222
    `;

    const urls = extractMultipleSisUrls(text);
    assert.equal(urls.length, 2);
    assert.equal(urls[0].studentId, '60d21b4667d0d8992e610aaa');
    assert.equal(urls[0].programId, '60d21b4967d0d8992e610111');
    assert.equal(urls[1].studentId, '60d21b4667d0d8992e610bbb');
    assert.equal(urls[1].programId, '60d21b4967d0d8992e610222');
  });

  test('soporta URLs de SIS sin structure_id', () => {
    const text = 'Revisar https://sis.kuepa.com/students/details/60d21b4667d0d8992e610ccc';
    const urls = extractMultipleSisUrls(text);
    assert.equal(urls.length, 1);
    assert.equal(urls[0].studentId, '60d21b4667d0d8992e610ccc');
    assert.equal(urls[0].programId, null);
  });

  test('deduplica URLs repetidas del mismo estudiante', () => {
    const text = `
      https://sis.kuepa.com/students/details/60d21b4667d0d8992e610aaa?structure_id=60d21b4967d0d8992e610111
      otra vez https://sis.kuepa.com/students/details/60d21b4667d0d8992e610aaa?structure_id=60d21b4967d0d8992e610111
    `;
    const urls = extractMultipleSisUrls(text);
    assert.equal(urls.length, 1);
  });
});
