/**
 * Utility functions for cleaning and formatting text for clipboard and display.
 */

/**
 * Strips raw Markdown syntax (bold asterisks, inline code backticks, headers, callout wrappers)
 * so that copied content is clean, professional, and directly pasteable in Slack, Jira, or emails.
 *
 * Example transformation:
 * Input:
 *   Aquí tienes la lista de alianzas registradas en el catálogo (18):
 *   • **512:** `5fc1417018d8cca721c0ba02`
 *   *(Nota: Las sedes principales de la plataforma son **Kuepa (Colombia)**: `6021...` y **Nueva América**: `6303...`)*
 * Output:
 *   Aquí tienes la lista de alianzas registradas en el catálogo (18):
 *   • 512: 5fc1417018d8cca721c0ba02
 *   Nota: Las sedes principales de la plataforma son Kuepa (Colombia): 6021... y Nueva América: 6303...
 */
export function cleanMarkdownForClipboard(text = '') {
  if (!text) return '';

  return text
    // 1. Clean callout / note lines: *(Nota: ...)*, (*Nota: ...*), > Nota: ...
    .replace(/^[\s*>#(*]*\s*(Nota|Importante|Atención|Atencion|Tip|Advertencia)\s*[:\-–]?\s*(.*?)\s*[)*]*$/gim, '$1: $2')
    // 2. Remove bold **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // 3. Remove inline code backticks `code`
    .replace(/`([^`]+)`/g, '$1')
    // 4. Remove wrappers like *(text)* or (*text*)
    .replace(/\*\((.*?)\)\*/g, '$1')
    .replace(/\(\*(.*?)\*\)/g, '$1')
    // 5. Remove single asterisk / underscore italics *text* or _text_
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    // 6. Remove Markdown headers (# Header, ## Header, ### Header)
    .replace(/^#{1,6}\s+/gm, '')
    // 7. Clean up colon spacing (e.g. "Nombre:  valor" -> "Nombre: valor")
    .replace(/:\s{2,}/g, ': ')
    .trim();
}
