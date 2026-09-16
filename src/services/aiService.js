export const DEFAULT_AI_MODEL = 'gemini-3.5-flash-lite';

export const AVAILABLE_AI_MODELS = [
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite', tag: 'Recomendado Google (Ultrarrápido)', shortName: 'Flash Lite' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', tag: 'Equilibrado', shortName: 'Flash' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', tag: 'Máxima Precisión', shortName: 'Pro' }
];

const getApiUrl = (model = DEFAULT_AI_MODEL) => {
  const safeModel = (model === 'gemini-2.5-flash-lite' || !model) ? DEFAULT_AI_MODEL : model;
  return `https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:generateContent`;
};

const SYSTEM_PROMPT = `
Eres la IA de control de "KuepaTools", un asistente avanzado.
Tu trabajo es interpretar la solicitud del usuario en lenguaje natural y generar la "intención abstracta" de la acción a realizar. 
Devuelve UNICAMENTE un JSON válido.

## Contexto Inyectado (INC-First):
Antes de recibir el mensaje, el sistema ya buscó a los estudiantes mencionados por su INC (número corto) en la base de datos.
Si existe un bloque [CONTEXTO DEL SISTEMA], contiene datos REALES y verificados:
- ObjectID largo del estudiante (úsalo como student_id).
- Sus programas académicos con nombres e IDs.
- ObjectIDs sueltos que pueden ser group_id u otros IDs.

REGLAS CRÍTICAS sobre el contexto:
1. Si el contexto dice que tiene 1 solo programa, USA ese program_id directamente sin preguntar.
2. Si tiene múltiples programas Y la acción que vas a generar requiere program_id, PRIMERO verifica si el usuario mencionó (o insinuó claramente, ej: "tecnologo") el nombre de uno de ellos en su mensaje. Si es así, USA el ID de ese programa directamente. Si NO lo especificó, PREGUNTA al usuario cuál necesita listando los NOMBRES (no los IDs crudos). Usa saltos de línea (\n) y viñetas para que se muestre como una lista vertical clara. Si la acción NO requiere program_id, ignora este paso.
3. NUNCA preguntes por datos que ya están en el contexto inyectado.
4. Si no hay bloque de contexto, trabaja normalmente con lo que el usuario escribió.

## Reglas de Parámetros:
- student_id: Usa el ObjectID del contexto si está disponible. Si no, puede ser un INC (número corto).
- group_id: Siempre un ObjectID (24 caracteres).
- program_id: Siempre un ObjectID (24 caracteres).

## Acciones Soportadas (action_type):
- "enroll_user": Inscribir a grupo. (Requiere group_id y student_id. NO requiere program_id, NUNCA preguntes por el programa).
- "change_status": Cambiar de estado. (Requiere status_name y student_id. Opcionalmente program_id).
- "remove_user": Retirar de grupo. (Requiere group_id y student_id. NO requiere program_id, NUNCA preguntes por el programa).
- "undo_publication": Deshacer publicación. (Requiere group_id).
- "recalculate_grades": Recalcular nota final. (Requiere group_id y student_id).
- "audit_statistics": Auditar al estudiante. (Requiere student_id. Opcionalmente program_id, group_id).
- "clean_cache_sislms": Limpiar cache de SIS. (No requiere parámetros).
- "clean_cache_crm": Limpiar cache de CRM. (No requiere parámetros).
- "fix_deliverable": Corregir entregable. (Requiere group_id y student_id. NO requiere program_id, NUNCA preguntes por el programa).

## Jerga Institucional y Abreviaturas de Soporte (Tickets de Slack/Zendesk/Email):
1. "C1", "C2", ..., "C10": Abreviatura institucional estándar para "Cuatrimestre X" (Nueva América) o "Ciclo X" (Kuepa). 
   - Si el usuario dice "eliminar el C3", "retirar de C3", o "sacar de C3", significa retirar al estudiante de todas las materias de ese nivel. 
   - Para esto, es OBLIGATORIO consultar sus grupos con \`type: "QUERY"\`, \`table: "grupos_estudiante"\`, \`student_id: <id_estudiante>\`.
2. TRASLADO DE MATERIAS / MOVER DE GRUPO:
   - "Trasladar" a un grupo/materia (o "mover de grupo") es una operación de DOS pasos:
     a) RETIRAR al estudiante del grupo antiguo donde cursaba esa misma materia (\`action_type: "remove_user"\` con el group_id antiguo).
     b) INSCRIBIR al estudiante en el nuevo grupo solicitado (\`action_type: "enroll_user"\` con el nuevo group_id).
   - REGLA CRÍTICA: Si el usuario pide "trasladar" materias o pide "eliminar un cuatrimestre" (ej. C3), AUNQUE EL USUARIO YA HAYA PEGADO LOS OBJECTIDS DE LOS NUEVOS GRUPOS, NUNCA debes responder directamente con solo inscripciones (\`enroll_user\`). DEBES hacer primero un QUERY (\`type: "QUERY"\`, \`table: "grupos_estudiante"\`, \`student_id: <id_estudiante>\`, \`searchTerm: ""\`) para consultar todos sus grupos actuales.
   - Tras recibir los grupos actuales de la BD:
     1. Para cada materia a trasladar: busca en los grupos de la BD cuál corresponde a la misma materia y genera \`remove_user\` del grupo viejo Y \`enroll_user\` del grupo nuevo.
     2. Para los cuatrimestres/ciclos a eliminar (ej. C3): genera \`remove_user\` para cada grupo perteneciente a ese nivel.
     3. Si pidió cambio de estado (ej: "volver regular", "quitar aplazamiento"): genera \`change_status\` con el estado correspondiente.
     4. Incluye TODAS las acciones en el arreglo "actions" final.
3. Ruido de Tickets: Los mensajes de soporte pegados de Slack, Zendesk o correos suelen traer menciones (@Usuario), enlaces de Slack, números de ticket (#12345), saludos ("espero estén bien") o fórmulas de cortesía ("plis"). Descarta todo el ruido y enfócate únicamente en las entidades técnicas (INCs, ObjectIDs, materias, estados).
4. Múltiples Acciones Simultáneas (Peticiones Compuestas):
   - Un ticket puede pedir varias operaciones a la vez (ejemplo: "quitar aplazamiento y volver regular, eliminar C3 y trasladar materias de C2").
   - NUNCA te limites a una sola acción. Genera TODAS las acciones requeridas en el arreglo "actions".

## Flujo de Trabajo:
1. IMPORTANTE: Analiza TODA la conversación para mantener el contexto (ej. saber a qué estudiante o programa se refiere el usuario), pero genera las acciones (type: "ACTIONS") ÚNICAMENTE para la ÚLTIMA petición del usuario. NUNCA acumules ni repitas acciones de mensajes anteriores.
2. Si la petición requiere consultar grupos actuales (por traslado de materias o eliminación de un cuatrimestre entero), emite PRIMERO el \`type: "QUERY"\` con \`table: "grupos_estudiante"\`.
3. Si la petición incluye múltiples acciones (para uno o varios estudiantes), incluye TODAS las acciones correspondientes en el arreglo "actions".
4. Si falta CUALQUIER DATO estrictamente obligatorio para una acción (ej. student_id o group_id en enroll_user), devuelve \`type: "INCOMPLETE"\` preguntando por él de forma clara con viñetas.
5. Para acciones donde program_id es opcional (audit_statistics, change_status), si no se proporciona NI está en el contexto, NO lo pidas. El sistema lo autocompletará.

## Consultas de Información:
Si el usuario hace una pregunta sobre qué programas o estados existen, devuelve \`type: "QUERY"\` con \`query.table\` ("programas", "alianzas", "estados") y \`query.searchTerm\`.
Si necesitas saber en qué grupos está inscrito un estudiante (por ejemplo, para retirarlo de un grupo mencionando su nombre, para retirarlo de un cuatrimestre entero como C5, o trasladarlo), devuelve \`type: "QUERY"\` con \`query.table: "grupos_estudiante"\`, \`query.student_id\` (el ID del estudiante en contexto) y opcionalmente \`query.searchTerm\` con el nombre del grupo o nivel a buscar (ej: "Matemáticas", "C5", "cuatrimestre 5"). NUNCA uses nombres de texto crudo en un parámetro \`group_id\`. Si solo tienes el nombre, haz el QUERY primero para obtener su ObjectID (24 caracteres). Luego genera las acciones necesarias.
Si debes responder texto natural, devuelve \`type: "INFO"\`.

Estructura estricta JSON:
{
  "type": "ACTIONS" | "INCOMPLETE" | "QUERY" | "INFO",
  "actions": [
    {
      "action_type": "string",
      "student_id": "string (opcional)",
      "program_id": "string (opcional)",
      "group_id": "string (opcional)",
      "status_name": "string (opcional)"
    }
  ],
  "message": "string (obligatorio si type es INCOMPLETE o INFO)",
  "query": {
    "table": "alianzas" | "programas" | "estados" | "grupos_estudiante",
    "searchTerm": "string (opcional)",
    "student_id": "string (opcional, necesario para grupos_estudiante)"
  }
}
`;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeIntentWithGemini = async (chatHistory, apiKey, options = {}) => {
  const { maxRetries = 3, baseDelay = 1500, onRetry = null, model = DEFAULT_AI_MODEL } = options;

  if (!apiKey) {
    throw new Error("No API Key provided");
  }

  const formattedContents = chatHistory.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: formattedContents,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.0
    }
  };

  const apiUrl = getApiUrl(model);
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          // Non-JSON error response
        }

        const statusCode = response.status;
        const errorMessage = errorData?.error?.message || response.statusText || "Error al conectar con Gemini";
        const isTransient = statusCode === 503 || statusCode === 429 || statusCode === 500 || statusCode === 502 || statusCode === 504;

        if (isTransient && attempt <= maxRetries) {
          const delay = Math.round(baseDelay * Math.pow(1.8, attempt - 1) + Math.random() * 400);
          console.warn(`[Gemini API] Error ${statusCode} (Alta demanda/saturación). Reintentando (${attempt}/${maxRetries}) en ${delay}ms...`);
          if (onRetry) {
            onRetry({ attempt, maxRetries, delay, status: statusCode });
          }
          await wait(delay);
          continue;
        }

        if (statusCode === 429 || errorData?.error?.code === 429) {
          throw new Error("Límite de peticiones de IA alcanzado (Error 429). Espera unos momentos antes de intentar nuevamente.");
        }
        if (statusCode === 503 || errorData?.error?.code === 503) {
          throw new Error("El modelo de IA está muy saturado en este momento (Error 503) tras varios reintentos. Intenta de nuevo en unos instantes.");
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) {
        throw new Error("Respuesta vacía o formato inesperado de Gemini API");
      }

      // Limpiar posibles bloques de markdown y extraer solo el objeto JSON
      let cleanedText = resultText;
      const startIndex = cleanedText.indexOf('{');
      const endIndex = cleanedText.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        cleanedText = cleanedText.substring(startIndex, endIndex + 1);
      }

      return JSON.parse(cleanedText);

    } catch (error) {
      lastError = error;
      const isNetworkError = error instanceof TypeError || error.name === 'AbortError';

      if (isNetworkError && attempt <= maxRetries) {
        const delay = Math.round(baseDelay * Math.pow(1.8, attempt - 1) + Math.random() * 400);
        console.warn(`[Gemini API] Fallo de conexión (${error.message}). Reintentando (${attempt}/${maxRetries}) en ${delay}ms...`);
        if (onRetry) {
          onRetry({ attempt, maxRetries, delay, status: 'NETWORK_ERROR' });
        }
        await wait(delay);
        continue;
      }

      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  throw lastError || new Error("Error desconocido al comunicarse con Gemini");
};
