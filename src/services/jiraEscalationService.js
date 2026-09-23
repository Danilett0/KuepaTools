import { DEFAULT_AI_MODEL, AVAILABLE_AI_MODELS, getApiUrl } from './aiService.js';
import { findUser } from './usuariosService.js';
import { sanitizeTableOrDump, convertMarkdownTablesToJira } from './tableSanitizerService.js';

const JIRA_SYSTEM_PROMPT = `
Eres un Líder Técnico de Soporte N3 y QA Lead especializado en plataformas educativas y sistemas empresariales.
Tu objetivo exclusivo es transformar descripciones de incidentes técnicos en reportes y tickets de JIRA de altísima calidad técnica, estructurados, claros y accionables para el equipo de Ingeniería y Desarrollo.

## REGLAS CRÍTICAS DE FIDELIDAD (CERO ASUNCIONES / CERO ALUCINACIONES):
1. TÍTULO / SUMMARY (REGLA ESTRICTA):
   - El título DEBE comenzar SIEMPRE obligatoriamente con el prefijo exacto: "Soporte_Estudiante - <Descripción técnica concisa del fallo o requerimiento>"
     Ejemplo: "Soporte_Estudiante - Error fatal en cola de solicitudes al procesar registro huérfano de estudiante inactivo/eliminado"
   - PROHIBIDO TERMINANTEMENTE inventar o colocar prefijos o siglas entre corchetes como "[NA]", "[Solicitudes/CRM]", "[Kuepa]", etc. Usa ÚNICAMENTE "Soporte_Estudiante - ".

2. FIDELIDAD ESTRICTA AL CONTEXTO (NO ASUMAS MÓDULOS NI ALIANZAS):
   - NUNCA asumas ni inventes que un subsistema es "CRM", "LMS", "SIS", etc., a menos que el usuario lo haya mencionado expresamente en su texto. Si el usuario dice "módulo de solicitudes", el subsistema es "Módulo de solicitudes".
   - NUNCA asumas una alianza específica (como "Nueva América", "Kuepa" ni ninguna otra) a menos que el usuario la mencione textualmente en su mensaje o se derive de la consulta de base de datos del estudiante. Si no se menciona ninguna alianza, en Contexto indica "No especificada / General".

3. TABLAS DE BASE DE DATOS, HOJAS DE CÁLCULO Y OBJECTIDS:
   - Un ObjectId de MongoDB tiene SIEMPRE exactamente 24 caracteres hexadecimales (ej: "64fa8b29c1234567890abcde").
   - NUNCA concatenes múltiples ObjectIds en un solo hash largo.
   - Si en el mensaje vienen tablas o volcados (de Excel, Google Sheets, SQL o listas de solicitudes/INCs), CONSÉRVALOS SIEMPRE como tablas estructuradas Markdown (| Col 1 | Col 2 |) en "validationData" o "context". PROHIBIDO desarmar tablas en párrafos corridos confusos; Ingeniería requiere ver las filas y columnas alineadas.
   - Si en el mensaje vienen tablas o pares de ObjectId de solicitud e INC de estudiante pegados, lístalos ordenadamente como viñetas claras o en tabla Markdown.

4. CAPTURAS DE PANTALLA Y EVIDENCIAS VISUALES ADJUNTAS:
   - Si el usuario adjunta capturas de pantalla, imágenes o capturas de errores:
     * Inspecciona visualmente la captura con rigor (OCR): extrae con máxima fidelidad los mensajes de error textuales (banners rojos, alertas modales, toasts, stack traces, peticiones HTTP fallidas como 500, 404, 403, etc.).
     * Extrae cualquier ObjectId de MongoDB, código INC, número de solicitud o nombre visible en la captura y agrégalo a "validationData".
     * Describe con exactitud en "Comportamiento Observado (❌ Observado:)" lo que se visualiza en la captura (incluyendo el texto exacto del fallo en la interfaz).
     * En "Diagnóstico Técnico & Causa Raíz Preliminar", formula hipótesis técnicas coherentes con lo que se visualiza en la imagen.

## REGLA DE CONCISIÓN Y PROPORCIÓN (MUY IMPORTANTE):
- Si el problema es fácil de explicar (ejemplo: una solicitud que bloquea la cola a una asesora), redáctalo de manera compacta y directa en pocas líneas.
- PROHIBIDO el texto de relleno, retórica excesiva o repetir los mismos datos en múltiples secciones.
- Si un ID ya está en "Datos de Validación", no lo repitas en párrafos largos en "Contexto del Caso".
- Sé ejecutivo, técnico y ve directo al grano.

## Dinámica de Evaluación (2 Estados Posibles):

### 1. ESTADO "INCOMPLETE" (Falta información crítica)
Si la información suministrada por el usuario es demasiado vaga o carece de datos indispensables para que un desarrollador entienda y reproduzca el caso, NO inventes datos. Devuelve status "INCOMPLETE" con preguntas puntuales (máximo 3).
Datos indispensables a evaluar:
- ¿Qué está fallando exactamente o cuál es el síntoma observado?
- ¿Qué se esperaba que ocurriera (comportamiento esperado)?
- ¿Cuál es la entidad afectada (estudiante con INC/MongoID, grupo, materia, o si es un fallo global de la plataforma)?
- ¿Qué acción, comando o flujo se intentó y qué resultado/error dio?

### 2. ESTADO "COMPLETE" (Información suficiente)
Genera el ticket formal para JIRA con un estándar de ingeniería riguroso y en este orden exacto de secciones:
1. context: "Contexto del Caso" (Explicación concisa y directa: qué ocurre y a quién afecta, en 2-3 líneas).
2. validationData: "Datos de Validación" (Listado limpio de datos para comprobar: Estudiante, INC, C.C., IDs de Solicitud/Registros, Asesor/Agente afectado).
3. reproductionSteps: "Pasos para Reproducir" (Pasos 1, 2, 3 directos).
4. behavior: "Comportamiento Observado vs Esperado" (Usa estrictamente los encabezados con iconos "❌ Observado:" y "✅ Esperado:").
5. solution: "Solución Propuesta / Data Patch" (SOLO si hay una solución propuesta concreta como query en MongoDB o ajuste en caliente con los IDs reales. Si NO hay propuesta o requiere desarrollo, dejar estrictamente como cadena vacía "").
6. technicalDiagnosis: "Diagnóstico Técnico & Causa Raíz Preliminar" (Hipótesis técnica concreta para el desarrollador en 2-4 líneas).
7. acceptanceCriteria: "Criterios de Aceptación (DoD)" (Lista de checkboxes [ ] para QA y Dev, entre 2 y 4 puntos).

## DIFERENCIACIÓN ESTRICTA Y OBLIGATORIA DE IDENTIFICADORES (REGLA DE ORO):
- CÉDULA / DOCUMENTO DE IDENTIDAD (C.C., T.I., C.E., de 7 a 11 dígitos numéricos, ej: 1028885011):
  * Corresponde a la cédula o identificación oficial del ESTUDIANTE.
  * PROHIBIDO TERMINANTEMENTE clasificarlo, etiquetarlo o nombrarlo como "INC" o "ID Incremental".
  * En "validationData" debe listarse explícitamente como "Cédula: <número>" o "Documento C.C.: <número>".
  * En "extractedEntities" debe registrarse con type: "student" o "cc", y label: "Cédula".
- CÓDIGO INC (Incremental corto de 1 a 6 dígitos, ej: 45281, 32953):
  * Es exclusivamente el código numérico corto interno de estudiante o ticket (nunca una cédula).
- MONGO OBJECTID (24 caracteres hexadecimales, ej: 6aa97ac8594184100e81670a):
  * Identificador técnico de base de datos de MongoDB.

## REGLA DE MODIFICACIÓN Y APUNTES ITERATIVOS (SI YA EXISTE UN TICKET):
- Si en la conversación ya existe un ticket generado previamente y el usuario envía apuntes, aclaraciones, correcciones o adiciones:
  1. TU TAREA ES REFINAR Y ACTUALIZAR EL TICKET ACTUAL: Mantén la información válida existente e incorpora o modifica únicamente las secciones afectadas por el nuevo mensaje del usuario.
  2. NUNCA reinicies el ticket desde cero ni borres datos técnicos ya verificados (IDs, INCs, Cédulas) a menos que el usuario lo solicite expresamente.
  3. Devuelve SIEMPRE el ticket completo actualizado en formato JSON con status "COMPLETE".
  4. En "friendlyMessage", confirma concisamente qué secciones o datos acabas de actualizar (ej: "He actualizado los pasos para reproducir y añadido la nota sobre Safari.").

## INTEGRACIÓN CON BASE DE DATOS INSTITUCIONAL (REGLA ESTRICTA - CERO DISCULPAS DE IA):
- Operas como el Agente Líder Técnico N3 de KuepaTools y estás PLENAMENTE CONECTADO a la base de datos de estudiantes (Supabase / MongoDB).
- La plataforma consulta la base de datos automáticamente en segundo plano para cualquier INC o MongoID mencionado en el chat y te inyecta los resultados en el contexto.
- PROHIBIDO TERMINANTEMENTE responder frases como "Como modelo de IA no tengo acceso a la base de datos", "no tengo herramientas internas", "no puedo consultar la base de datos de producción" o disculpas similares.
- Si el usuario te pide buscar un ID largo (ObjectId), nombre o datos de un estudiante:
  1. Si en el contexto aparecen "[DATOS DE ESTUDIANTE ENCONTRADOS EN BASE DE DATOS]", toma ese MongoID real e incorpóralo DE INMEDIATO en "validationData", "extractedEntities" y en la descripción del ticket. Confirma al usuario amablemente que el registro fue localizado en la base de datos e insertado.
  2. Si en el contexto aparece "[CONSULTA A BASE DE DATOS REALIZADA]" indicando que no se encontró el estudiante (por ejemplo, con un INC inexistente o de prueba como 123456), informa con precisión técnica y ejecutiva:
     "He consultado la base de datos interna de estudiantes para el identificador <código>, pero no figura ningún registro activo con ese número en el sistema. Por favor verifica si el INC tiene algún dígito faltante o proporciona el ObjectId de 24 caracteres manualmente."

## Formato estricto de respuesta JSON:

Si es INCOMPLETE:
{
  "status": "INCOMPLETE",
  "friendlyMessage": "string (explicación breve y cortés de qué datos faltan)",
  "questions": [
    "string (pregunta 1 concisa)",
    "string (pregunta 2 concisa)"
  ],
  "draftSummary": "string (resumen tentativo del caso)"
}

Si es COMPLETE:
{
  "status": "COMPLETE",
  "friendlyMessage": "string (confirmación de éxito)",
  "ticket": {
    "summary": "Soporte_Estudiante - <Descripción técnica concisa>",
    "extractedEntities": [
      { "type": "student" | "inc" | "cc" | "mongo_id" | "agent", "label": "string", "value": "string" }
    ],
    "sections": {
      "context": "string",
      "validationData": "string",
      "reproductionSteps": "string",
      "behavior": "string",
      "solution": "string (opcional, cadena vacía si no aplica)",
      "technicalDiagnosis": "string",
      "acceptanceCriteria": "string"
    }
  }
}
`;


/**
 * Normaliza textos donde se hayan pegado tablas o columnas sin espacios:
 * - Detecta el patrón de copia de MongoDB: [ObjectId de 24 hex][INC de 4 a 7 dígitos]
 * - Separa cadenas de solo hexadecimal (48+ hex)
 */
export function normalizeConcatenatedObjectIds(text) {
  if (!text || typeof text !== 'string') return text;

  // 1. Detectar patrón común de tablas pegadas: [ObjectId de 24 hex][INC numérico de 4 a 7 dígitos]
  // Ejemplo: 6aa97ac8594184100e81670a312166aa971a4e4f256613bfd57b530212...
  let formatted = text.replace(/([0-9a-fA-F]{24})(\d{4,7})(?=[0-9a-fA-F]{24}|$|\s|\[)/g, (match, oid, inc) => {
    return `\n- [Solicitud ID: ${oid} | INC Estudiante: ${inc}]\n`;
  });

  // 2. Si quedan cadenas largas continuas de solo hexadecimal (48+ chars sin INCs):
  formatted = formatted.replace(/\b[0-9a-fA-F]{48,}\b/g, (match) => {
    const chunks = [];
    for (let i = 0; i < match.length; i += 24) {
      chunks.push(match.substring(i, i + 24));
    }
    return chunks.join(' ');
  });

  return formatted;
}

/**
 * Detecta si hay menciones de INCs o MongoIDs en el texto y busca los datos reales en Supabase
 * (Búsqueda global sin restringir alianza)
 */
export async function hydrateEscalationContext(conversationHistory, currentTicket = null) {
  let fullText = conversationHistory.map(m => m.text).join(' ');
  if (currentTicket) {
    fullText += ` ${currentTicket.summary || ''} ${JSON.stringify(currentTicket.sections || {})}`;
  }
  const normalizedText = normalizeConcatenatedObjectIds(fullText);

  // Extraer números de 2 a 6 dígitos (potenciales INCs, números cortos de plataforma)
  const incMatches = [...new Set((normalizedText.match(/\b\d{2,6}\b/g) || []))].filter(n => Number(n) <= 99999);
  // Extraer números de 7 a 11 dígitos (Cédulas / Documentos de identidad)
  const cedulaMatches = [...new Set((normalizedText.match(/\b\d{7,11}\b/g) || []))];
  // Extraer Mongo ObjectIDs de 24 hex
  const mongoMatches = [...new Set((normalizedText.match(/\b[0-9a-fA-F]{24}\b/g) || []))];

  const candidateIds = [...cedulaMatches, ...incMatches, ...mongoMatches].slice(0, 8);
  const resolvedUsers = [];
  const notFoundIds = [];

  for (const id of candidateIds) {
    try {
      const user = await findUser(id, null);
      if (user) {
        resolvedUsers.push({
          id,
          fullName: user.profile?.full_name || 'Sin nombre',
          inc: user.incremental_user_code,
          mongoId: user._id?.$oid,
          programs: user.programs?.map(p => p.name || p.id).join(', ') || 'N/A'
        });
      } else {
        notFoundIds.push(id);
      }
    } catch {
      notFoundIds.push(id);
    }
  }

  return { resolvedUsers, notFoundIds, candidateIds };
}

/**
 * Compila la descripción completa garantizando que todo lo presente
 * en las tarjetas visuales de sections se incluya en el texto copiado,
 * incluyendo los iconos/emojis para que se reflejen idénticos al pegar en Jira.
 */
export function compileDescription(sections, format = 'markdown', attachments = []) {
  if (!sections) return '';

  const context = sections.context || '';
  const validationData = sections.validationData || sections.affectedEntities || '';
  const reproductionSteps = sections.reproductionSteps || '';
  
  // Normalizar comportamiento para incluir siempre los iconos ❌ y ✅
  let behavior = sections.behavior || '';
  if (!behavior && (sections.observedBehavior || sections.expectedBehavior)) {
    const parts = [];
    if (sections.observedBehavior) parts.push(`❌ Observado:\n${sections.observedBehavior}`);
    if (sections.expectedBehavior) parts.push(`✅ Esperado:\n${sections.expectedBehavior}`);
    behavior = parts.join('\n\n');
  } else if (behavior) {
    if (!behavior.includes('❌') && /observado/i.test(behavior)) {
      behavior = behavior.replace(/(?:Comportamiento\s*)?Observado\s*:?/i, '❌ Observado:');
    }
    if (!behavior.includes('✅') && /esperado/i.test(behavior)) {
      behavior = behavior.replace(/(?:Comportamiento\s*)?Esperado\s*:?/i, '✅ Esperado:');
    }
  }

  const solution = sections.solution || sections.dataPatch || '';
  const technicalDiagnosis = sections.technicalDiagnosis || '';
  const acceptanceCriteria = sections.acceptanceCriteria || '';

  if (format === 'jiraMarkup') {
    const toJira = (txt) => {
      if (!txt) return '';
      let res = txt
        .replace(/```(?:javascript|json|bash|sh|sql)?\n([\s\S]*?)```/g, '{code}\n$1{code}')
        .replace(/\*\*(.*?)\*\*/g, '*$1*');
      res = convertMarkdownTablesToJira(res);
      return res;
    };

    const parts = [];
    if (context) parts.push(`h3. 📄 Contexto del Caso`, toJira(context), ``);
    if (validationData) parts.push(`h3. 💾 Datos de Validación`, toJira(validationData), ``);
    if (reproductionSteps) parts.push(`h3. 🔄 Pasos para Reproducir`, toJira(reproductionSteps), ``);
    if (behavior) parts.push(`h3. ⚠️ Comportamiento Observado vs Esperado`, toJira(behavior), ``);
    if (solution && solution.trim()) parts.push(`h3. 🛠️ Solución Propuesta / Data Patch`, toJira(solution), ``);
    if (technicalDiagnosis) parts.push(`h3. 🧠 Diagnóstico Técnico & Causa Raíz Preliminar`, toJira(technicalDiagnosis), ``);
    if (acceptanceCriteria) parts.push(`h3. 🎯 Criterios de Aceptación (DoD)`, toJira(acceptanceCriteria));
    if (attachments && attachments.length > 0) {
      parts.push(``, `h3. 📸 Evidencias y Capturas Adjuntas`);
      attachments.forEach(att => {
        parts.push(`* 🖼️ *${att.name}* (${att.sizeKb ? `${att.sizeKb} KB` : 'Evidencia'})`);
      });
    }

    return parts.join('\n').trim();
  }

  // Markdown estándar para Jira Cloud
  const parts = [];
  if (context) parts.push(`### 📄 Contexto del Caso`, context, ``);
  if (validationData) parts.push(`### 💾 Datos de Validación`, validationData, ``);
  if (reproductionSteps) parts.push(`### 🔄 Pasos para Reproducir`, reproductionSteps, ``);
  if (behavior) parts.push(`### ⚠️ Comportamiento Observado vs Esperado`, behavior, ``);
  if (solution && solution.trim()) parts.push(`### 🛠️ Solución Propuesta / Data Patch`, solution, ``);
  if (technicalDiagnosis) parts.push(`### 🧠 Diagnóstico Técnico & Causa Raíz Preliminar`, technicalDiagnosis, ``);
  if (acceptanceCriteria) parts.push(`### 🎯 Criterios de Aceptación (DoD)`, acceptanceCriteria);
  if (attachments && attachments.length > 0) {
    parts.push(``, `### 📸 Evidencias y Capturas Adjuntas`);
    attachments.forEach(att => {
      parts.push(`- 🖼️ **${att.name}** (${att.sizeKb ? `${att.sizeKb} KB` : 'Evidencia'})`);
    });
  }

  return parts.join('\n').trim();
}

/**
 * Procesa la conversación con Gemini para generar o afinar el ticket de Jira
 */
export async function processJiraEscalation(conversationHistory, apiKey, options = {}) {
  if (!apiKey) {
    throw new Error("No se ha configurado la API Key de Gemini.");
  }

  const model = options.model || DEFAULT_AI_MODEL;
  const newAttachments = options.attachments || [];
  
  // 1. Normalizar posibles ObjectIds concatenados y limpiar/formatear tablas pegadas
  const preprocessedHistory = conversationHistory.map(msg => ({
    ...msg,
    text: sanitizeTableOrDump(normalizeConcatenatedObjectIds(msg.text))
  }));

  // 2. Hidratación de entidades desde la DB si se mencionaron estudiantes
  const currentTicket = options.currentTicket || null;
  const { resolvedUsers, notFoundIds, candidateIds } = await hydrateEscalationContext(preprocessedHistory, currentTicket);
  
  let dbStatusInjection = '';
  if (resolvedUsers.length > 0) {
    dbStatusInjection = `\n[DATOS DE ESTUDIANTE ENCONTRADOS EN BASE DE DATOS]:\n` +
      resolvedUsers.map(u => `- Estudiante: ${u.fullName} | INC: ${u.inc} | MongoID (ID Largo): ${u.mongoId} | Programas: ${u.programs}`).join('\n') +
      `\n(INSTRUCCIÓN OBLIGATORIA: Si el usuario solicitó el ID largo o datos del estudiante, usa este MongoID exacto: "${resolvedUsers[0].mongoId}" en Datos de Validación, en el summary y en todo el ticket. Confirma amablemente que el registro fue localizado en la base de datos).\n`;
  } else if (candidateIds.length > 0) {
    dbStatusInjection = `\n[CONSULTA A BASE DE DATOS REALIZADA EN TIEMPO REAL]:\n` +
      `La plataforma consultó automáticamente la base de datos para los identificadores: ${candidateIds.join(', ')}.\n` +
      `Resultado: NO se encontró ningún estudiante con esos identificadores en la base de datos institucional.\n` +
      `(INSTRUCCIÓN OBLIGATORIA: Si el usuario te pide buscar el ID largo o datos del estudiante, explícale que se consultó la base de datos interna para el INC ${candidateIds.join(', ')} pero no arrojó registros en el sistema, para que verifique si el código es correcto o lo proporcione manualmente. NUNCA digas que no tienes acceso a la base de datos ni des disculpas genéricas de IA).\n`;
  }

  // 3. Preparar el historial para Gemini
  const formattedContents = preprocessedHistory.map((msg, index) => {
    let content = msg.text;
    if (index === 0 && dbStatusInjection) {
      content = `${dbStatusInjection}\n\n[DESCRIPCIÓN DEL CASO]:\n${content}`;
    }

    // Si ya existe un ticket generado y este es el nuevo mensaje del usuario:
    if (index === preprocessedHistory.length - 1 && currentTicket && msg.role === 'user') {
      content = `[TICKET ACTUALMENTE GENERADO EN PANTALLA]:
Título actual: ${currentTicket.summary}
Secciones actuales:
${JSON.stringify(currentTicket.sections, null, 2)}
${dbStatusInjection ? `\n${dbStatusInjection}` : ''}
[APUNTE / MODIFICACIÓN SOLICITADA POR EL USUARIO]:
${content}

(INSTRUCCIÓN: MANTÉN la estructura y datos válidos del ticket anterior e integra las modificaciones o apuntes solicitados arriba. Devuelve el ticket completo actualizado en status COMPLETE).`;
    }

    const isLatestUserMsg = (index === preprocessedHistory.length - 1 && msg.role === 'user');
    // Enviar imágenes únicamente si son nuevas o si es la fase inicial sin ticket previo (evita saturar payload API)
    const msgAttachments = isLatestUserMsg 
      ? newAttachments 
      : (!currentTicket ? (msg.attachments || []) : []);

    if (msgAttachments && msgAttachments.length > 0) {
      content += `\n\n[EVIDENCIAS VISUALES ADJUNTAS (${msgAttachments.length} capturas)]: Inspecciona minuciosamente cada captura de pantalla adjunta (errores, queries, ObjectIds, documentos o modales visibles) e incorpóralos en el diagnóstico, comportamiento observado y datos de validación.`;
    }

    const parts = [{ text: content }];

    if (msgAttachments && msgAttachments.length > 0) {
      msgAttachments.forEach(att => {
        const base64Data = att.base64 || (att.dataUrl ? att.dataUrl.split(',')[1] : null);
        if (base64Data && att.mimeType) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: base64Data
            }
          });
        }
      });
    }

    return {
      role: msg.role === 'ai' ? 'model' : 'user',
      parts
    };
  });

  const payload = {
    systemInstruction: {
      parts: [{ text: JIRA_SYSTEM_PROMPT }]
    },
    contents: formattedContents,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1
    }
  };

  const apiUrl = getApiUrl(model);
  const response = await fetch(`${apiUrl}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorData = null;
    try { errorData = await response.json(); } catch { /* ignore */ }
    const status = response.status;
    if (status === 429) {
      throw new Error("Límite de solicitudes de IA alcanzado (Error 429). Espera un momento.");
    }
    if (status === 413) {
      throw new Error("El tamaño de las capturas es demasiado grande para la API. Intenta con menos imágenes o de menor resolución.");
    }
    throw new Error(errorData?.error?.message || `Error ${status} al consultar Gemini.`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Respuesta vacía recibida desde el modelo de IA.");
  }

  let cleanedText = rawText;
  const startIndex = cleanedText.indexOf('{');
  const endIndex = cleanedText.lastIndexOf('}');
  if (startIndex !== -1 && endIndex !== -1) {
    cleanedText = cleanedText.substring(startIndex, endIndex + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (initialErr) {
    // Blindaje y auto-reparación de JSON en caso de comas finales o caracteres de control
    try {
      const repaired = cleanedText
        .replace(/,\s*([}\]])/g, '$1') // Remueve comas finales
        .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
      parsed = JSON.parse(repaired);
    } catch {
      throw new Error(`El modelo devolvió una respuesta con formato inválido: ${initialErr.message}`);
    }
  }

  // Asegurar compatibilidad de formato y prefijo estricto
  if (parsed.status === 'COMPLETE' && parsed.ticket) {
    // Garantizar que siempre empiece con Soporte_Estudiante -
    if (parsed.ticket.summary && !parsed.ticket.summary.startsWith('Soporte_Estudiante -')) {
      const cleanedSummary = parsed.ticket.summary.replace(/^(\[[^\]]+\])+\s*/, '').trim();
      parsed.ticket.summary = `Soporte_Estudiante - ${cleanedSummary}`;
    }

    // Acumular capturas previas y nuevas sin duplicar por contenido o ID
    const prevAtts = currentTicket?.attachments || [];
    const combinedAttachments = [...prevAtts];
    newAttachments.forEach(att => {
      const isDuplicate = combinedAttachments.some(e => 
        e.id === att.id || 
        (e.base64 && att.base64 && e.base64 === att.base64)
      );
      if (!isDuplicate) {
        // Desambiguar nombre si ya existe uno igual
        let finalName = att.name;
        let counter = 1;
        while (combinedAttachments.some(e => e.name === finalName)) {
          const dotIdx = att.name.lastIndexOf('.');
          const base = dotIdx !== -1 ? att.name.substring(0, dotIdx) : att.name;
          const ext = dotIdx !== -1 ? att.name.substring(dotIdx) : '.png';
          finalName = `${base}_${++counter}${ext}`;
        }
        combinedAttachments.push({
          ...att,
          name: finalName
        });
      }
    });
    parsed.ticket.attachments = combinedAttachments;

    // Compilar la descripción COMPLETA directamente desde las secciones
    // para asegurar que nada de lo mostrado en las tarjetas visuales se pierda al copiar
    if (parsed.ticket.sections) {
      parsed.ticket.descriptionMarkdown = compileDescription(parsed.ticket.sections, 'markdown', combinedAttachments);
      parsed.ticket.descriptionJiraMarkup = compileDescription(parsed.ticket.sections, 'jiraMarkup', combinedAttachments);
      parsed.ticket.description = parsed.ticket.descriptionMarkdown;
    } else if (!parsed.ticket.descriptionMarkdown && parsed.ticket.description) {
      parsed.ticket.descriptionMarkdown = parsed.ticket.description;
      parsed.ticket.descriptionJiraMarkup = parsed.ticket.description;
    }
  }

  return parsed;
}

/**
 * Da formato estandarizado al resumen para canales de Slack
 * (Con iconos atractivos, sin asteriscos, sin preguntas por viñeta, con espacio para Tarea generada)
 */
export function formatSlackEscalationMessage({ taskRef = '', summary = '' } = {}) {
  const cleanSummary = (summary && typeof summary === 'string') 
    ? summary.replace(/\*/g, '').trim()
    : (summary ? String(summary).replace(/\*/g, '').trim() : 'Se reportó el incidente en plataforma para revisión y corrección técnica.');

  const cleanTaskRef = (taskRef && typeof taskRef === 'string') 
    ? taskRef.replace(/\*/g, '').trim() 
    : '';

  return [
    `🎫 Tarea generada: ${cleanTaskRef}`.trimEnd(),
    `📢 Se escaló: ${cleanSummary}`
  ].join('\n\n');
}

/**
 * Genera un resumen determinista directo sin consumo de API ni asteriscos
 */
export function generateSlackSummaryFallback(ticket) {
  if (!ticket || typeof ticket !== 'object') {
    return formatSlackEscalationMessage({});
  }

  const rawSummary = ticket.summary || '';
  const cleanTitle = (typeof rawSummary === 'string' ? rawSummary : String(rawSummary))
    .replace(/^Soporte_Estudiante\s*-\s*/i, '')
    .replace(/\*/g, '')
    .trim();

  let what = '';
  if (ticket.sections?.context && typeof ticket.sections.context === 'string') {
    what = ticket.sections.context.split('\n')[0].replace(/^[#\-*]\s*/, '').replace(/\*/g, '').trim();
  } else if (ticket.sections?.behavior && typeof ticket.sections.behavior === 'string') {
    const obsMatch = ticket.sections.behavior.match(/❌\s*Observado\s*:?\s*([^\n]+)/i);
    what = (obsMatch && obsMatch[1] ? obsMatch[1] : ticket.sections.behavior.split('\n')[0])
      .replace(/\*/g, '')
      .trim();
  }

  let why = '';
  if (ticket.sections?.acceptanceCriteria && typeof ticket.sections.acceptanceCriteria === 'string') {
    const crit = ticket.sections.acceptanceCriteria
      .split('\n')
      .find(line => line.trim().length > 0 && !line.startsWith('#'));
    if (crit) {
      why = crit.replace(/^\[\s*[x ]?\s*\]\s*/i, '').replace(/^[*\-]\s*/, '').replace(/\*/g, '').trim();
    }
  }
  if (!why && ticket.sections?.behavior && typeof ticket.sections.behavior === 'string') {
    const expMatch = ticket.sections.behavior.match(/✅\s*Esperado\s*:?\s*([^\n]+)/i);
    if (expMatch && expMatch[1]) {
      why = expMatch[1].replace(/\*/g, '').trim();
    }
  }
  if (!why && ticket.sections?.solution && typeof ticket.sections.solution === 'string') {
    if (!ticket.sections.solution.includes('```') && !ticket.sections.solution.includes('db.')) {
      why = ticket.sections.solution.split('\n')[0].replace(/\*/g, '').trim();
    }
  }

  let combined = '';
  if (what && why) {
    const lowerWhy = why.charAt(0).toLowerCase() + why.slice(1);
    combined = `${what}; se busca ${lowerWhy}`;
  } else if (what) {
    combined = what;
  } else if (cleanTitle) {
    combined = `${cleanTitle}, para su revisión y corrección técnica.`;
  }

  return formatSlackEscalationMessage({
    summary: combined
  });
}

/**
 * Genera el resumen para Slack asistido por IA en tono sencillo con iconos atractivos,
 * sin asteriscos, sin preguntas por viñetas y dejando Tarea generada para completar.
 */
export async function generateSlackSummaryWithAI(ticket, apiKey, options = {}) {
  if (!ticket || typeof ticket !== 'object') {
    return generateSlackSummaryFallback(null);
  }

  const cleanKey = apiKey ? String(apiKey).replace(/['"]/g, '').trim() : '';
  if (!cleanKey) {
    return generateSlackSummaryFallback(ticket);
  }

  const model = options.model || DEFAULT_AI_MODEL;
  const prompt = `
Eres un comunicador de soporte técnico en Slack.
Tu objetivo es redactar un mensaje ULTRA CORTO, dinámico, fluido y en lenguaje cotidiano para usuarios básicos / asesores no técnicos en un canal de Slack.
A partir del siguiente ticket de Jira, sintetiza en un único texto continuo (de 2 a 3 líneas) qué se escaló y qué se busca solucionar (unificando ambas respuestas sin preguntas).

Ticket:
Título: ${ticket.summary || ''}
Secciones:
${JSON.stringify(ticket.sections || {}, null, 2)}

REGLAS ESTRICTAS:
1. PROHIBIDO terminantemente usar asteriscos (*) en ningún lugar del mensaje.
2. PROHIBIDO formular o estructurar el texto como preguntas (NO uses "¿Qué se escaló?", "¿Por qué?", etc.).
3. PROHIBIDO inventar o asumir identificadores o códigos de tarea. Deja "🎫 Tarea generada:" vacía para que el usuario la complete.
4. Devuelve ÚNICAMENTE este formato exacto con iconos:
🎫 Tarea generada: 

📢 Se escaló: <Resumen unificado y fluido de qué ocurrió y qué se busca solucionar>
`;

  try {
    const payload = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 250
      }
    };

    const apiUrl = getApiUrl(model);
    const response = await fetch(`${apiUrl}?key=${cleanKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return generateSlackSummaryFallback(ticket);
    }

    const data = await response.json();
    const rawAiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (rawAiText) {
      let cleanAiText = rawAiText.replace(/\*/g, '').trim();
      if (/tarea generada:/i.test(cleanAiText)) {
        if (!cleanAiText.startsWith('🎫')) {
          cleanAiText = cleanAiText.replace(/^(?:📌\s*|🎫\s*)?tarea generada:/i, '🎫 Tarea generada:');
        }
        if (!cleanAiText.includes('📢')) {
          cleanAiText = cleanAiText.replace(/se escal[oó]:/i, '📢 Se escaló:');
        }
        return cleanAiText;
      }
      const strippedSummary = cleanAiText.replace(/^(?:📢\s*)?se escal[oó]:?\s*/i, '');
      return `🎫 Tarea generada: \n\n📢 Se escaló: ${strippedSummary}`;
    }
    return generateSlackSummaryFallback(ticket);
  } catch (err) {
    console.warn("Fallo al generar resumen Slack con IA, usando fallback determinista:", err);
    return generateSlackSummaryFallback(ticket);
  }
}


