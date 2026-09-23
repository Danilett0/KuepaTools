import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  DEFAULT_AI_MODEL, 
  AVAILABLE_AI_MODELS, 
  resolveSafeAiModel, 
  getApiUrl 
} from '../src/services/aiService.js';

test('Catálogo de Modelos de IA — Solo 2 modelos activos y válidos', async (t) => {
  await t.test('contiene estrictamente 2 modelos configurados', () => {
    assert.equal(AVAILABLE_AI_MODELS.length, 2);
    const modelIds = AVAILABLE_AI_MODELS.map(m => m.id);
    assert.deepEqual(modelIds, ['gemini-3.5-flash-lite', 'gemini-3.5-flash']);
  });

  await t.test('DEFAULT_AI_MODEL es gemini-3.5-flash-lite', () => {
    assert.equal(DEFAULT_AI_MODEL, 'gemini-3.5-flash-lite');
  });

  await t.test('resolveSafeAiModel resuelve modelos activos correctamente', () => {
    assert.equal(resolveSafeAiModel('gemini-3.5-flash-lite'), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel('gemini-3.5-flash'), 'gemini-3.5-flash');
  });

  await t.test('resolveSafeAiModel redirige modelos obsoletos o saturados al modelo estable', () => {
    assert.equal(resolveSafeAiModel('gemini-3.6-flash'), 'gemini-3.5-flash');
    assert.equal(resolveSafeAiModel('gemini-3.7-flash'), 'gemini-3.5-flash');
    assert.equal(resolveSafeAiModel('gemini-3.8-flash'), 'gemini-3.5-flash');
    assert.equal(resolveSafeAiModel('gemini-2.5-pro'), 'gemini-3.5-flash');
    assert.equal(resolveSafeAiModel('gemini-3.1-pro-preview'), 'gemini-3.5-flash');
    assert.equal(resolveSafeAiModel('gemini-2.5-flash'), 'gemini-3.5-flash');
  });

  await t.test('casos límite: null, undefined, cadena vacía y valores desconocidos', () => {
    assert.equal(resolveSafeAiModel(null), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel(undefined), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel(''), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel('unknown-model-xyz'), 'gemini-3.5-flash');
  });

  await t.test('getApiUrl construye el endpoint v1beta con el modelo sanitizado', () => {
    const urlLite = getApiUrl('gemini-3.5-flash-lite');
    assert.equal(urlLite, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');

    const urlDeprecated = getApiUrl('gemini-3.8-flash');
    assert.equal(urlDeprecated, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent');
  });
});
