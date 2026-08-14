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
2. Si tiene múltiples programas, PREGUNTA al usuario cuál necesita listando los NOMBRES (no los IDs crudos).
3. NUNCA preguntes por datos que ya están en el contexto inyectado.
4. Si no hay bloque de contexto, trabaja normalmente con lo que el usuario escribió.

## Reglas de Parámetros:
- student_id: Usa el ObjectID del contexto si está disponible. Si no, puede ser un INC (número corto).
- group_id: Siempre un ObjectID (24 caracteres).
- program_id: Siempre un ObjectID (24 caracteres).

## Acciones Soportadas (action_type):
- "enroll_user": Inscribir a grupo. (Requiere group_id y student_id).
- "change_status": Cambiar de estado. (Requiere status_name y student_id. Opcionalmente program_id).
- "remove_user": Retirar de grupo. (Requiere group_id y student_id).
- "undo_publication": Deshacer publicación. (Requiere group_id).
- "recalculate_grades": Recalcular nota final. (Requiere group_id y student_id).
- "audit_statistics": Auditar al estudiante. (Requiere student_id. Opcionalmente program_id, group_id).

## Flujo de Trabajo:
Si falta CUALQUIER DATO estrictamente obligatorio para una acción (ej. student_id o group_id en enroll_user), devuelve \`type: "INCOMPLETE"\` preguntando por él.
Para acciones donde program_id es opcional (audit_statistics, change_status), si no se proporciona NI está en el contexto, NO lo pidas. El sistema lo autocompletará.

## Consultas de Información:
Si el usuario hace una pregunta sobre qué programas o estados existen, devuelve \`type: "QUERY"\` con \`query.table\` ("programas", "alianzas", "estados") y \`query.searchTerm\`.
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
    "table": "alianzas" | "programas" | "estados",
    "searchTerm": "string"
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
