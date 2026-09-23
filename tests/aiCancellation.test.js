import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeIntentWithGemini } from '../src/services/aiService.js';

test('Cancelación de Peticiones y Control de AbortSignal en aiService', async (t) => {
  await t.test('analyzeIntentWithGemini aborta inmediatamente si el signal ya está abortado', async () => {
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
      async () => {
        await analyzeIntentWithGemini([{ role: 'user', text: 'test' }], 'fake-key', {
          signal: controller.signal,
          maxRetries: 3
        });
      },
      (err) => {
        assert.equal(err.name, 'AbortError');
        return true;
      }
    );
  });

  await t.test('analyzeIntentWithGemini rechaza inmediatamente al abortar y NO realiza reintentos', async () => {
    const controller = new AbortController();
    let retryCount = 0;

    // Abortar casi de inmediato
    setTimeout(() => {
      controller.abort();
    }, 10);

    await assert.rejects(
      async () => {
        await analyzeIntentWithGemini([{ role: 'user', text: 'test' }], 'fake-key', {
          signal: controller.signal,
          maxRetries: 3,
          baseDelay: 100,
          onRetry: () => {
            retryCount++;
          }
        });
      },
      (err) => {
        assert.equal(err.name, 'AbortError');
        return true;
      }
    );

    assert.equal(retryCount, 0, 'No debe haber ejecutado reintentos tras un AbortError');
  });

  await t.test('analyzeIntentWithGemini aborta por timeout individual y ejecuta reintento', async () => {
    let retriesTriggered = 0;
    let lastRetryStatus = null;

    await assert.rejects(
      async () => {
        await analyzeIntentWithGemini([{ role: 'user', text: 'test' }], 'fake-key', {
          timeoutMs: 30,
          maxRetries: 1,
          baseDelay: 10,
          onRetry: ({ status }) => {
            retriesTriggered++;
            lastRetryStatus = status;
          }
        });
      },
      (err) => {
        return true;
      }
    );

    assert.equal(retriesTriggered, 1, 'Debe haber reintentado exactamente 1 vez por timeout');
    assert.equal(lastRetryStatus, 'TIMEOUT', 'El estado del reintento debe ser TIMEOUT');
  });

  await t.test('casos límite: opciones nulas o sin signal no arrojan error de tipo', async () => {
    // Verificamos que sin signal arroje el error de fetch o auth esperado, no un fallo por signal
    await assert.rejects(
      async () => {
        await analyzeIntentWithGemini([{ role: 'user', text: 'test' }], 'fake-key', {
          signal: null,
          maxRetries: 0
        });
      },
      (err) => {
        assert.notEqual(err.message, 'signal is not defined');
        return true;
      }
    );
  });
});
