import { toPng } from 'html-to-image';
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
