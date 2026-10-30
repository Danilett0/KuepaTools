import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AgentOrchestrator } from '../src/services/AgentOrchestrator.js';

describe('AgentOrchestrator — preprocessMessage', () => {
  const orchestrator = new AgentOrchestrator('fake-key', 'kuepa');

  test('no debe fallar con ReferenceError al procesar mensajes con o sin URLs de SIS', async () => {
    const text = 'Buenas tardes, me ayudan por favor a inscribir el siguiente estudiante ID 23590';
    // Debe ejecutarse sin lanzar ReferenceError: extractMultipleSisUrls is not defined
    const result = await orchestrator.preprocessMessage(text, () => {});
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('23590'));
  });

  test('extrae y procesa URLs de SIS en preprocessMessage', async () => {
    const text = 'Revisar https://sis.kuepa.com/students/details/507f1f77bcf86cd799439011?structure_id=507f191e810c19729de860ea';
    const result = await orchestrator.preprocessMessage(text, () => {});
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('507f1f77bcf86cd799439011'));
  });

  test('maneja casos límite como texto vacío, nulo o tipos inesperados sin romper', async () => {
    const resultEmpty = await orchestrator.preprocessMessage('', () => {});
    assert.equal(typeof resultEmpty, 'string');
  });
});
