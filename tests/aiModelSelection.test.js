import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  DEFAULT_AI_MODEL, 
  AVAILABLE_AI_MODELS, 
  resolveSafeAiModel, 
  getApiUrl,
  analyzeIntentWithGemini
} from '../src/services/aiService.js';
test('Catálogo de Modelos de IA — Exclusivamente Gemini 3.5 Flash Lite activo', async (t) => {
  await t.test('contiene estrictamente 1 modelo configurado (Gemini 3.5 Flash Lite)', () => {
    assert.equal(AVAILABLE_AI_MODELS.length, 1);
    assert.equal(AVAILABLE_AI_MODELS[0].id, 'gemini-3.5-flash-lite');
    assert.equal(AVAILABLE_AI_MODELS[0].label, 'Gemini 3.5 Flash Lite');
  });

  await t.test('DEFAULT_AI_MODEL es gemini-3.5-flash-lite', () => {
    assert.equal(DEFAULT_AI_MODEL, 'gemini-3.5-flash-lite');
  });

  await t.test('resolveSafeAiModel resuelve gemini-3.5-flash-lite correctamente', () => {
    assert.equal(resolveSafeAiModel('gemini-3.5-flash-lite'), 'gemini-3.5-flash-lite');
  });

  await t.test('resolveSafeAiModel redirige todos los modelos anteriores y alternativos a gemini-3.5-flash-lite', () => {
    assert.equal(resolveSafeAiModel('gemini-3.6-flash'), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel('gemini-3.5-flash'), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel('gemini-3.7-flash'), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel('gemini-3.8-flash'), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel('gemini-2.5-flash-lite'), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel('gemini-3.1-flash-lite'), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel('gemini-2.5-pro'), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel('gemini-3.1-pro-preview'), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel('gemini-2.5-flash'), 'gemini-3.5-flash-lite');
  });

  await t.test('casos límite: null, undefined, cadena vacía y valores desconocidos resuelven a gemini-3.5-flash-lite', () => {
    assert.equal(resolveSafeAiModel(null), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel(undefined), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel(''), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel('unknown-model-xyz'), 'gemini-3.5-flash-lite');
    assert.equal(resolveSafeAiModel(12345), 'gemini-3.5-flash-lite');
  });

  await t.test('getApiUrl construye el endpoint v1beta exclusivamente con gemini-3.5-flash-lite', () => {
    const urlLite = getApiUrl('gemini-3.5-flash-lite');
    assert.equal(urlLite, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');

    const urlRedirected = getApiUrl('gemini-3.6-flash');
    assert.equal(urlRedirected, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');

    const urlDefault = getApiUrl();
    assert.equal(urlDefault, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
  });

  await t.test('analyzeIntentWithGemini realiza peticiones y reintentos exclusivamente con gemini-3.5-flash-lite', async () => {
    const originalFetch = globalThis.fetch;
    const requestedUrls = [];

    globalThis.fetch = async (url) => {
      requestedUrls.push(url.toString());
      if (requestedUrls.length === 1) {
        return {
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: async () => ({ error: { message: 'Model overloaded' } })
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: '{"type":"INFO","message":"ok"}' }] }
          }]
        })
      };
    };

    try {
      const result = await analyzeIntentWithGemini(
        [{ role: 'user', text: 'hola' }],
        'test-key',
        { model: 'gemini-3.6-flash', baseDelay: 10, maxRetries: 2 }
      );

      assert.deepEqual(result, { type: 'INFO', message: 'ok' });
      assert.equal(requestedUrls.length, 2);
      assert.ok(requestedUrls[0].includes('models/gemini-3.5-flash-lite:generateContent'), 'El primer intento debe consultar gemini-3.5-flash-lite');
      assert.ok(requestedUrls[1].includes('models/gemini-3.5-flash-lite:generateContent'), 'El reintento tras 503 debe consultar gemini-3.5-flash-lite');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

