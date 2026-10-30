import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { copyElementAsImage } from '../src/services/ticketExportService.js';

describe('ticketExportService — copyElementAsImage (Contrato y Casos Límite)', () => {
  test('debe rechazar con error explícito si el nodo es null o undefined', async () => {
    await assert.rejects(
      async () => {
        await copyElementAsImage(null);
      },
      (err) => {
        assert.match(err.message, /No se proporcionó el elemento DOM a exportar/);
        return true;
      }
    );

    await assert.rejects(
      async () => {
        await copyElementAsImage(undefined);
      },
      (err) => {
        assert.match(err.message, /No se proporcionó el elemento DOM a exportar/);
        return true;
      }
    );
  });

  test('debe rechazar con error si el nodo no es un objeto válido', async () => {
    await assert.rejects(
      async () => {
        await copyElementAsImage('not-a-node');
      },
      (err) => {
        assert.match(err.message, /No se proporcionó el elemento DOM a exportar/);
        return true;
      }
    );
  });

  test('debe fallar limpiamente si el entorno carece de soporte para portapapeles de imágenes', async () => {
    // En Node.js estándar sin navigator.clipboard.write ni window.ClipboardItem
    const mockNode = { nodeType: 1 };
    await assert.rejects(
      async () => {
        await copyElementAsImage(mockNode);
      },
      (err) => {
        assert.match(err.message, /portapapeles de imágenes/i);
        return true;
      }
    );
  });

  test('debe filtrar correctamente elementos marcados con .no-export o data-no-export', async () => {
    // Probamos el comportamiento del filtro por defecto
    const mockNode = { nodeType: 1 };
    let capturedFilter = null;

    // Simulamos un entorno con ClipboardItem y navigator.clipboard
    const originalNavigator = globalThis.navigator;
    const originalWindow = globalThis.window;
    let writtenItems = null;

    try {
      globalThis.window = {
        ClipboardItem: class ClipboardItem {
          constructor(obj) {
            this.data = obj;
          }
        }
      };

      globalThis.navigator = {
        clipboard: {
          write: async (items) => {
            writtenItems = items;
          }
        }
      };

      const customBlob = { size: 1024, type: 'image/png' };
      const mockToBlob = async (node, opts) => {
        capturedFilter = opts.filter;
        return customBlob;
      };

      await copyElementAsImage(mockNode, {
        toBlobFn: mockToBlob,
        backgroundColor: '#090d16',
        pixelRatio: 2
      });

      assert.ok(capturedFilter, 'Debe haber capturado la función de filtro');

      // Comprobar filtro:
      const exportableNode = { classList: { contains: () => false }, dataset: {} };
      const nonExportableByClass = { classList: { contains: (cls) => cls === 'no-export' }, dataset: {} };
      const nonExportableByData = { classList: { contains: () => false }, dataset: { noExport: 'true' } };

      assert.equal(capturedFilter(exportableNode), true, 'Nodo estándar debe ser exportado');
      assert.equal(capturedFilter(nonExportableByClass), false, 'Nodo con clase no-export no debe ser exportado');
      assert.equal(capturedFilter(nonExportableByData), false, 'Nodo con data-no-export="true" no debe ser exportado');

      assert.ok(writtenItems, 'Debe haber escrito en el portapapeles');
      assert.equal(writtenItems.length, 1);
      assert.equal(writtenItems[0].data['image/png'], customBlob);
    } finally {
      globalThis.navigator = originalNavigator;
      globalThis.window = originalWindow;
    }
  });

  test('debe configurar skipFonts: true por defecto para evitar errores de CORS y cssRules SecurityError con fuentes externas', async () => {
    const mockNode = { nodeType: 1 };
    const originalNavigator = globalThis.navigator;
    const originalWindow = globalThis.window;
    let capturedOptions = null;

    try {
      globalThis.window = {
        ClipboardItem: class ClipboardItem {
          constructor(obj) {
            this.data = obj;
          }
        }
      };

      globalThis.navigator = {
        clipboard: {
          write: async () => {}
        }
      };

      const mockToBlob = async (node, opts) => {
        capturedOptions = opts;
        return { size: 100, type: 'image/png' };
      };

      await copyElementAsImage(mockNode, {
        toBlobFn: mockToBlob
      });

      assert.ok(capturedOptions, 'Debe llamar a toBlob con opciones');
      assert.equal(capturedOptions.skipFonts, true, 'skipFonts debe ser true para evitar conflictos de cssRules');
    } finally {
      globalThis.navigator = originalNavigator;
      globalThis.window = originalWindow;
    }
  });
});
