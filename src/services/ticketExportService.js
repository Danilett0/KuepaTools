import { toPng, toBlob } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Sanitiza un texto para usarlo como nombre de archivo seguro
 */
export function getSafeFilename(summary, extension = 'png') {
  const base = (summary || 'Ticket_Jira')
    .replace(/^Soporte_Estudiante\s*-\s*/i, '')
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 45);
  
  return `Ticket_Jira_${base || 'Reporte'}.${extension}`;
}

/**
 * Exporta el contenedor del ticket como imagen PNG de alta resolución (2x)
 */
export async function exportTicketAsImage(node, summary = '') {
  if (!node) throw new Error("No se encontró el contenedor del ticket.");

  const filename = getSafeFilename(summary, 'png');

  // Capturar imagen con 2x pixel ratio para nitidez retina
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#1d2125',
    skipFonts: true,
    filter: (domNode) => {
      // Ocultar botones interactivos de copiado en la imagen final
      if (domNode?.classList?.contains('no-export') || domNode?.dataset?.noExport === 'true') {
        return false;
      }
      return true;
    }
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return filename;
}

/**
 * Copia un elemento DOM directamente al portapapeles como una imagen PNG de alta resolución (2x)
 * excluyendo botones interactivos u otros elementos marcados con .no-export o data-no-export="true".
 *
 * @param {HTMLElement} node - Elemento DOM a capturar
 * @param {Object} [options={}]
 * @param {string} [options.backgroundColor='#090d16'] - Fondo sólido para evitar transparencias extrañas
 * @param {number} [options.pixelRatio=2] - Factor de resolución nítido (2x)
 * @param {boolean} [options.skipFonts=true] - Omite embeber fuentes remotas para evitar SecurityError en CSSStyleSheet
 * @param {Function} [options.filter] - Función filtro opcional
 * @param {Function} [options.toBlobFn] - Inyección opcional de toBlob para tests
 * @returns {Promise<boolean>}
 */
export async function copyElementAsImage(node, options = {}) {
  if (!node || typeof node !== 'object') {
    throw new Error("No se proporcionó el elemento DOM a exportar.");
  }

  if (typeof navigator === 'undefined' || !navigator.clipboard?.write || typeof window === 'undefined' || !window.ClipboardItem) {
    throw new Error("El portapapeles de imágenes no es compatible con este entorno.");
  }

  const {
    backgroundColor = '#090d16',
    pixelRatio = 2,
    skipFonts = true,
    filter = (domNode) => {
      if (domNode?.classList?.contains('no-export') || domNode?.dataset?.noExport === 'true') {
        return false;
      }
      return true;
    },
    toBlobFn = toBlob
  } = options;

  let blob = null;
  if (typeof toBlobFn === 'function') {
    blob = await toBlobFn(node, {
      cacheBust: true,
      pixelRatio,
      backgroundColor,
      skipFonts,
      filter,
      style: {
        margin: '0',
        ...(options.style || {})
      }
    });
  }

  if (!blob && typeof toPng === 'function') {
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio,
      backgroundColor,
      skipFonts,
      filter,
      style: {
        margin: '0',
        ...(options.style || {})
      }
    });
    if (dataUrl) {
      const res = await fetch(dataUrl);
      blob = await res.blob();
    }
  }

  if (!blob) {
    throw new Error("No se pudo generar la imagen a partir del elemento.");
  }

  await navigator.clipboard.write([
    new window.ClipboardItem({ 'image/png': blob })
  ]);

  return true;
}

/**
 * Exporta el contenedor del ticket como un documento PDF profesional
 */
export async function exportTicketAsPdf(node, summary = '') {
  if (!node) throw new Error("No se encontró el contenedor del ticket.");

  const filename = getSafeFilename(summary, 'pdf');

  // 1. Renderizar el DOM del ticket como PNG a 2x
  const imgData = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#1d2125',
    skipFonts: true,
    filter: (domNode) => {
      if (domNode?.classList?.contains('no-export') || domNode?.dataset?.noExport === 'true') {
        return false;
      }
      return true;
    }
  });

  // 2. Obtener dimensiones reales de la imagen capturada
  const img = new window.Image();
  img.src = imgData;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const imgWidth = img.width;
  const imgHeight = img.height;

  // 3. Configurar documento PDF
  // Ancho base estándar: 210mm (ancho A4)
  const margin = 10; // 10mm de margen a cada lado
  const contentWidth = 210;
  const contentHeight = (imgHeight * contentWidth) / imgWidth;
  const pageWidth = contentWidth + (margin * 2);
  const pageHeight = contentHeight + (margin * 2);

  // Creamos un PDF a medida que abarca todo el ticket sin cortar código a la mitad
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight]
  });

  // Fondo oscuro corporativo idéntico a Jira Dark
  pdf.setFillColor(29, 33, 37);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Insertar imagen del reporte
  pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);

  // Descargar PDF
  pdf.save(filename);

  return filename;
}

/**
 * Copia texto plano al portapapeles de manera resiliente.
 * Soporta navigator.clipboard.writeText moderno con recuperación de foco
 * y fallback automático mediante document.execCommand('copy') para entornos
 * donde el foco de la ventana se perdió durante una operación asíncrona o
 * restricciones del navegador (e.g. NotAllowedError: Document is not focused).
 *
 * @param {string|number} text - Texto a copiar
 * @param {Object} [options={}]
 * @param {Function} [options.writeTextFn] - Inyección opcional para testing de navigator.clipboard.writeText
 * @param {Function} [options.execCommandFn] - Inyección opcional para testing de document.execCommand
 * @returns {Promise<boolean>} true si se copió exitosamente, false en caso contrario
 */
export async function copyTextToClipboard(text, options = {}) {
  const textToCopy = text === null || text === undefined ? '' : String(text);
  if (!textToCopy) return false;

  const { writeTextFn, execCommandFn } = options;

  // 1. Intentar recuperar el foco de la ventana si no está enfocada
  if (typeof window !== 'undefined' && typeof window.focus === 'function') {
    try {
      if (typeof document !== 'undefined' && typeof document.hasFocus === 'function' && !document.hasFocus()) {
        window.focus();
      }
    } catch {
      // Ignorar restricciones del navegador sobre window.focus()
    }
  }

  // 2. Método principal: navigator.clipboard.writeText
  const hasClipboardApi = typeof writeTextFn === 'function' || (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  );

  if (hasClipboardApi) {
    try {
      if (typeof writeTextFn === 'function') {
        await writeTextFn(textToCopy);
      } else {
        await navigator.clipboard.writeText(textToCopy);
      }
      return true;
    } catch (clipboardErr) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn("navigator.clipboard.writeText falló (posible falta de foco o permisos). Probando fallback:", clipboardErr?.message || clipboardErr);
      }
    }
  }

  // 3. Fallback: elemento textarea temporal + document.execCommand('copy')
  if (typeof document !== 'undefined' && typeof document.createElement === 'function' && document.body) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '-9999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';

      document.body.appendChild(textArea);
      if (typeof textArea.focus === 'function') {
        textArea.focus({ preventScroll: true });
      }
      if (typeof textArea.select === 'function') {
        textArea.select();
      }
      if (typeof textArea.setSelectionRange === 'function') {
        textArea.setSelectionRange(0, textToCopy.length);
      }

      const execCopy = execCommandFn || ((cmd) => document.execCommand(cmd));
      const successful = Boolean(execCopy('copy'));
      document.body.removeChild(textArea);

      if (successful) {
        return true;
      }
    } catch (fallbackErr) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn("Fallback execCommand('copy') no disponible o denegado:", fallbackErr?.message || fallbackErr);
      }
    }
  }

  return false;
}
