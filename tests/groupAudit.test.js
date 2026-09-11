import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateAuditGroupSubjectCommand } from '../src/services/groupAuditService.js';

describe('generateAuditGroupSubjectCommand', () => {
  const sampleGroupId = '6765d926107fc303893724e9';
  const sampleStudents = [
    '64f1a2b3c4d5e6f7a8b9c0d1',
    '64f1a2b3c4d5e6f7a8b9c0d2',
    '64f1a2b3c4d5e6f7a8b9c0d3'
  ];

  test('debe generar el comando magik audit:subject con grupo y estudiantes en el formato requerido', () => {
    const cmd = generateAuditGroupSubjectCommand(sampleGroupId, sampleStudents);
    assert.equal(
      cmd,
      'magik run:prod audit:subject ["6765d926107fc303893724e9","64f1a2b3c4d5e6f7a8b9c0d1","64f1a2b3c4d5e6f7a8b9c0d2","64f1a2b3c4d5e6f7a8b9c0d3"]'
    );
  });

  test('debe manejar exactamente 10 estudiantes para un grupo reportado', () => {
    const tenStudents = Array.from({ length: 10 }, (_, i) => `64f1a2b3c4d5e6f7a8b9c0${i.toString().padStart(2, '0')}`);
    const cmd = generateAuditGroupSubjectCommand(sampleGroupId, tenStudents);
    const expectedArray = [sampleGroupId, ...tenStudents];
    assert.equal(cmd, `magik run:prod audit:subject ${JSON.stringify(expectedArray)}`);
  });

  test('debe extraer el ObjectId si el groupId viene como URL de SIS', () => {
    const url = 'https://sis.kuepa.com/academic-group/details/6765d926107fc303893724e9';
    const cmd = generateAuditGroupSubjectCommand(url, ['64f1a2b3c4d5e6f7a8b9c0d1']);
    assert.equal(
      cmd,
      'magik run:prod audit:subject ["6765d926107fc303893724e9","64f1a2b3c4d5e6f7a8b9c0d1"]'
    );
  });

  test('debe deduplicar IDs de estudiantes repetidos y filtrar vacíos', () => {
    const duplicates = [
      '64f1a2b3c4d5e6f7a8b9c0d1',
      '64f1a2b3c4d5e6f7a8b9c0d1',
      '   ',
      null,
      '64f1a2b3c4d5e6f7a8b9c0d2'
    ];
    const cmd = generateAuditGroupSubjectCommand(sampleGroupId, duplicates);
    assert.equal(
      cmd,
      'magik run:prod audit:subject ["6765d926107fc303893724e9","64f1a2b3c4d5e6f7a8b9c0d1","64f1a2b3c4d5e6f7a8b9c0d2"]'
    );
  });

  test('casos límite: debe lanzar error si groupId es nulo, vacío o inválido', () => {
    assert.throws(() => generateAuditGroupSubjectCommand('', sampleStudents), /groupId/);
    assert.throws(() => generateAuditGroupSubjectCommand(null, sampleStudents), /groupId/);
    assert.throws(() => generateAuditGroupSubjectCommand('invalid-id', sampleStudents), /ObjectId/);
  });

  test('casos límite: debe lanzar error si studentIds no es array o no contiene estudiantes válidos', () => {
    assert.throws(() => generateAuditGroupSubjectCommand(sampleGroupId, null), /studentIds/);
    assert.throws(() => generateAuditGroupSubjectCommand(sampleGroupId, []), /al menos un estudiante/);
    assert.throws(() => generateAuditGroupSubjectCommand(sampleGroupId, ['invalido']), /al menos un estudiante/);
  });
});
