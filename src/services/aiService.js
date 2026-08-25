const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

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

## Flujo de Trabajo:
1. IMPORTANTE: Analiza TODA la conversación para mantener el contexto (ej. saber a qué estudiante o programa se refiere el usuario), pero genera la acción (type: "ACTIONS") ÚNICAMENTE para la ÚLTIMA petición del usuario. NUNCA acumules ni repitas acciones de mensajes anteriores.
2. Si falta CUALQUIER DATO estrictamente obligatorio para una acción (ej. student_id o group_id en enroll_user), devuelve \`type: "INCOMPLETE"\` preguntando por él.
3. Para acciones donde program_id es opcional (audit_statistics, change_status), si no se proporciona NI está en el contexto, NO lo pidas. El sistema lo autocompletará.

## Consultas de Información:
Si el usuario hace una pregunta sobre qué programas o estados existen, devuelve \`type: "QUERY"\` con \`query.table\` ("programas", "alianzas", "estados") y \`query.searchTerm\`.
Si necesitas saber en qué grupos está inscrito un estudiante (por ejemplo, para retirarlo de un grupo mencionando su nombre, para retirarlo de un cuatrimestre entero, o trasladarlo), devuelve \`type: "QUERY"\` con \`query.table: "grupos_estudiante"\`, \`query.student_id\` (el ID del estudiante en contexto) y opcionalmente \`query.searchTerm\` con el nombre del grupo o nivel a buscar (ej: "Matemáticas", "cuatrimestre 5"). NUNCA uses nombres de texto crudo en un parámetro \`group_id\`. Si solo tienes el nombre, haz el QUERY primero para obtener su ObjectID (24 caracteres). Luego genera las acciones necesarias.
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

export const analyzeIntentWithGemini = async (chatHistory, apiKey) => {
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

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 429 || errorData.error?.code === 429) {
        throw new Error("Límite de peticiones de IA alcanzado (Error 429). Espera unos 50 segundos antes de intentar nuevamente.");
      }
      if (response.status === 503 || errorData.error?.code === 503) {
        throw new Error("El modelo de IA está muy saturado ahora mismo (Error 503). Intenta de nuevo en unos momentos.");
      }
      throw new Error(errorData.error?.message || "Error al conectar con Gemini");
    }

    const data = await response.json();
    let resultText = data.candidates[0].content.parts[0].text;
    
    // Limpiar posibles bloques de markdown y extraer solo el objeto JSON
    const startIndex = resultText.indexOf('{');
    const endIndex = resultText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      resultText = resultText.substring(startIndex, endIndex + 1);
    }
    
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
