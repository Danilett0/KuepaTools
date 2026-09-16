/**
 * imageCompressionService.js
 * Utilidad liviana y robusta para procesar, comprimir y manipular capturas de pantalla
 * para el módulo de Escalamiento Jira y la API Multimodal de Gemini.
 */

const MAX_IMAGE_DIMENSION = 1600; // Ancho o alto máximo para legibilidad óptima de texto sin sobrepeso
const COMPRESSION_QUALITY = 0.84; // Calidad de compresión para WebP / JPEG
const MAX_ATTACHMENTS_PER_TICKET = 4;

/**
 * Procesa un archivo o Blob de imagen, redimensionándolo si es necesario y extrayendo
 * su representación en Base64 tanto completa (dataUrl) como pura (para Gemini inlineData).
 * 
 * @param {File|Blob} file 
 * @param {string} [customName]
 * @returns {Promise<{ id: string, name: string, mimeType: string, base64: string, dataUrl: string, sizeKb: number, width: number, height: number }>}
 */
export async function processImageFile(file, customName = null) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error("El archivo proporcionado no es una imagen válida."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error al leer el archivo de imagen."));
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo cargar la imagen para procesamiento."));
      img.onload = () => {
        try {
          let { width, height } = img;
          
          // Calcular escala si excede las dimensiones máximas
          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
              width = MAX_IMAGE_DIMENSION;
            } else {
              width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
              height = MAX_IMAGE_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // Fondo neutro si la imagen tiene transparencia
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Usar image/jpeg o image/png según formato
          let outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          let optimizedDataUrl = canvas.toDataURL(outputMime, COMPRESSION_QUALITY);
          let base64Pure = optimizedDataUrl.split(',')[1] || '';
          let sizeKb = Math.round((base64Pure.length * 3) / 4 / 1024);

          // Si el tamaño supera los 400KB, aplicar compresión optimizada para proteger localStorage y API
          if (sizeKb > 400) {
            outputMime = 'image/jpeg';
            optimizedDataUrl = canvas.toDataURL(outputMime, 0.74);
            base64Pure = optimizedDataUrl.split(',')[1] || '';
            sizeKb = Math.round((base64Pure.length * 3) / 4 / 1024);
          }

          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substr(2, 4);
          let cleanName = customName;
          if (!cleanName) {
            if (file.name && file.name !== 'image.png' && file.name !== 'blob') {
              cleanName = file.name;
            } else {
              cleanName = `captura_${timestamp.toString().slice(-4)}_${randomSuffix}.${outputMime === 'image/png' ? 'png' : 'jpg'}`;
            }
          }

          resolve({
            id: `att_${timestamp}_${randomSuffix}`,
            name: cleanName,
            mimeType: outputMime,
            base64: base64Pure,
            dataUrl: optimizedDataUrl,
            sizeKb,
            width,
            height,
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Copia una imagen directamente al portapapeles del sistema operativo
 * en formato binario para poder pegarla con Ctrl+V directamente en Jira, Slack o Paint.
 * 
 * @param {string} dataUrl 
 * @returns {Promise<boolean>}
 */
export async function copyImageToClipboard(dataUrl) {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error("Portapapeles de imágenes no soportado en este navegador.");
    }

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    
    // El portapapeles en la mayoría de navegadores solo acepta image/png
    let clipboardBlob = blob;
    if (blob.type !== 'image/png') {
      clipboardBlob = await convertBlobToPng(blob);
    }

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': clipboardBlob })
    ]);
    return true;
  } catch (err) {
    console.warn("Fallo al copiar imagen en portapapeles binario:", err);
    return false;
  }
}

/**
 * Convierte un Blob de cualquier formato de imagen a PNG para portapapeles
 */
async function convertBlobToPng(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (pngBlob) resolve(pngBlob);
        else reject(new Error("No se pudo convertir a PNG."));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error al convertir imagen a PNG."));
    };
    img.src = url;
  });
}

/**
 * Descarga una imagen al disco local del usuario con un nombre limpio
 * 
 * @param {string} dataUrl 
 * @param {string} filename 
 */
export function downloadImage(dataUrl, filename = 'captura_evidencia.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export { MAX_ATTACHMENTS_PER_TICKET };
