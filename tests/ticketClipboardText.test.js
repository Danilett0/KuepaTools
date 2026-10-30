import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { copyTextToClipboard } from '../src/services/ticketExportService.js';

describe('ticketExportService — copyTextToClipboard (TDD & Casos Límite)', () => {
  test('debe retornar false si el texto es nulo, undefined o vacío', async () => {
    assert.equal(await copyTextToClipboard(''), false);
    assert.equal(await copyTextToClipboard(null), false);
    assert.equal(await copyTextToClipboard(undefined), false);
  });

  test('debe copiar exitosamente usando writeTextFn inyectado (simulando navigator.clipboard.writeText)', async () => {
    let capturedText = null;
    const writeTextFn = async (text) => {
      capturedText = text;
    };

    const result = await copyTextToClipboard('Texto de prueba para Slack', { writeTextFn });
    assert.equal(result, true);
    assert.equal(capturedText, 'Texto de prueba para Slack');
  });

  test('debe convertir números y tipos no-string a string de forma segura', async () => {
    let capturedText = null;
    const writeTextFn = async (text) => {
      capturedText = text;
    };

    const result = await copyTextToClipboard(12345, { writeTextFn });
    assert.equal(result, true);
    assert.equal(capturedText, '12345');
  });

  test('debe usar fallback execCommand cuando writeText lanza "NotAllowedError: Document is not focused"', async () => {
    const writeTextFn = async () => {
      const err = new Error("Failed to execute 'writeText' on 'Clipboard': Document is not focused.");
      err.name = 'NotAllowedError';
      throw err;
    };

    let executedCommand = null;
    const execCommandFn = (cmd) => {
      executedCommand = cmd;
      return true;
    };

    // Simulamos un entorno con DOM mínimo para que cree el textarea
    const originalDocument = globalThis.document;
    const createdElements = [];
    globalThis.document = {
      body: {
        appendChild: (el) => createdElements.push(el),
        removeChild: (el) => {
          const idx = createdElements.indexOf(el);
          if (idx !== -1) createdElements.splice(idx, 1);
        }
      },
      createElement: () => ({
        style: {},
        setAttribute: () => {},
        focus: () => {},
        select: () => {},
        setSelectionRange: () => {}
      }),
      hasFocus: () => false
    };

    try {
      const result = await copyTextToClipboard('Resumen Slack con ventana desenfocada', {
        writeTextFn,
        execCommandFn
      });

      assert.equal(result, true);
      assert.equal(executedCommand, 'copy');
      assert.equal(createdElements.length, 0, 'El elemento textarea debe ser removido después de copiar');
    } finally {
      globalThis.document = originalDocument;
    }
  });

  test('debe retornar false limpiamente si tanto writeText como execCommand fallan sin lanzar excepción no capturada', async () => {
    const writeTextFn = async () => {
      throw new Error("Clipboard write rejected");
    };

    const execCommandFn = () => false;

    const originalDocument = globalThis.document;
    globalThis.document = {
      body: {
        appendChild: () => {},
        removeChild: () => {}
      },
      createElement: () => ({
        style: {},
        setAttribute: () => {},
        focus: () => {},
        select: () => {},
        setSelectionRange: () => {}
      }),
      hasFocus: () => false
    };

    try {
      const result = await copyTextToClipboard('Texto imposible de copiar', {
        writeTextFn,
        execCommandFn
      });

      assert.equal(result, false);
    } finally {
      globalThis.document = originalDocument;
    }
  });

  test('debe intentar invocar window.focus si document.hasFocus() es false', async () => {
    let windowFocusCalled = false;
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;

    globalThis.window = {
      focus: () => {
        windowFocusCalled = true;
      }
    };
    globalThis.document = {
      hasFocus: () => false,
      body: { appendChild: () => {}, removeChild: () => {} },
      createElement: () => ({ style: {}, setAttribute: () => {}, focus: () => {}, select: () => {} })
    };

    try {
      await copyTextToClipboard('Texto con window focus', {
        writeTextFn: async () => true
      });
      assert.equal(windowFocusCalled, true, 'Debe llamar a window.focus()');
    } finally {
      globalThis.window = originalWindow;
      globalThis.document = originalDocument;
    }
  });
});
