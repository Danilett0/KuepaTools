import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  prepareRetryHistory,
  DEFAULT_AI_TIMEOUT_MS,
  DEFAULT_MAX_RETRIES
} from '../src/services/aiService.js';

test('Configuración y Lógica de Reintentos de IA', async (t) => {
  await t.test('constantes de timeout (90s) y reintentos máximos (5)', () => {
    assert.equal(DEFAULT_AI_TIMEOUT_MS, 90000, 'El timeout por defecto debe ser 90 segundos');
    assert.equal(DEFAULT_MAX_RETRIES, 5, 'El máximo de reintentos debe ser 5');
  });

  await t.test('debe retornar historial hasta el mensaje de usuario cuando es el último elemento', () => {
    const history = [
      { id: '1', role: 'user', text: 'Hola' },
      { id: '2', role: 'ai', text: '¿En qué puedo ayudarte?' },
      { id: '3', role: 'user', text: 'Inscribe a 12345 en grupo 101' }
    ];

    const result = prepareRetryHistory(history, 2);
    assert.equal(result.length, 3);
    assert.deepEqual(result, history);
    assert.notEqual(result, history, 'Debe ser una copia nueva del arreglo');
  });

  await t.test('debe truncar respuestas posteriores al reintentar un mensaje previo', () => {
    const history = [
      { id: '1', role: 'user', text: 'Primer mensaje' },
      { id: '2', role: 'ai', text: 'Primera respuesta' },
      { id: '3', role: 'user', text: 'Segundo mensaje' },
      { id: '4', role: 'ai', text: 'Segunda respuesta con error' }
    ];

    const result = prepareRetryHistory(history, 2);
    assert.equal(result.length, 3);
    assert.deepEqual(result, [
      { id: '1', role: 'user', text: 'Primer mensaje' },
      { id: '2', role: 'ai', text: 'Primera respuesta' },
      { id: '3', role: 'user', text: 'Segundo mensaje' }
    ]);
  });

  await t.test('debe funcionar cuando el mensaje a reintentar es el primero del chat', () => {
    const history = [
      { id: '1', role: 'user', text: 'Consulta inicial' },
      { id: '2', role: 'ai', text: 'Respuesta parcial' }
    ];

    const result = prepareRetryHistory(history, 0);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, 'Consulta inicial');
  });

  await t.test('no debe permitir reintentar si el targetIndex corresponde a un mensaje de rol "ai"', () => {
    const history = [
      { id: '1', role: 'user', text: 'Hola' },
      { id: '2', role: 'ai', text: 'Respuesta' }
    ];

    const result = prepareRetryHistory(history, 1);
    assert.deepEqual(result, []);
  });

  await t.test('casos límite: historial nulo, indefinido, vacío o no-arreglo', () => {
    assert.deepEqual(prepareRetryHistory(null, 0), []);
    assert.deepEqual(prepareRetryHistory(undefined, 0), []);
    assert.deepEqual(prepareRetryHistory([], 0), []);
    assert.deepEqual(prepareRetryHistory('no-array', 0), []);
    assert.deepEqual(prepareRetryHistory({}, 0), []);
  });

  await t.test('casos límite: índice inválido, negativo, fuera de rango o tipo inesperado', () => {
    const history = [{ role: 'user', text: 'Test' }];
    assert.deepEqual(prepareRetryHistory(history, -1), []);
    assert.deepEqual(prepareRetryHistory(history, 5), []);
    assert.deepEqual(prepareRetryHistory(history, null), []);
    assert.deepEqual(prepareRetryHistory(history, undefined), []);
    assert.deepEqual(prepareRetryHistory(history, '0'), []);
  });
});
