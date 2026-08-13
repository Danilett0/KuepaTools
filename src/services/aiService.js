const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

const SYSTEM_PROMPT = `
Eres el motor de ejecución de "KuepaTools", un asistente de línea de comandos.
Tu trabajo es interpretar la solicitud del usuario en lenguaje natural y generar directamente los comandos de la plataforma (Magik) que deben ejecutarse. Devuelve UNICAMENTE un JSON válido.

Reglas de IDs:
- "INC" (Incremental): Siempre es un número (ej: 292828, 19999).
- "ObjectID": Siempre 24 caracteres hexadecimales (ej: 698f588e45358f0ffa1fbcd6).

Diccionario de Comandos Magik:
- Inscribir a grupo: \`magik run:prod enroll:user["<group_id>","<student_id>"]\`
- Cambiar de estado: \`magik run:prod status:change["<program_id>","<state_id>","<student_id>"]\` (Estados conocidos: "Desertor", "Retirado", "Activo", "Graduado"). Nota: En el comando usa el ID del programa y el ID/texto del estado según contexto.
- Retirar de grupo (desvincular): \`magik run:prod pull:user:from:group["<group_id>","<student_id>"]\`
- Deshacer publicación: \`magik run:prod undo:publication ["<group_id>"]\`
- Recalcular Nota / Finalizar: \`magik run:prod:force final:user ["<group_id>","<student_id>"]\`
- Auditar Estadísticas (siempre devuelve estos 4 comandos exactos):
  1. \`magik run:prod audit:level["<program_id>","<student_id>"]\`
  2. \`magik run:prod audit:statistics["<program_id>","<student_id>"]\`
  3. \`magik run:prod audit:subject ["<group_id>", "<student_id>"]\` (omitir este si no hay group_id)
  4. \`magik run:prod audit:compacts["<program_id>","<student_id>"]\`

Si el usuario solicita una acción que TIENE comandos de Magik y proporcionó TODOS LOS DATOS (IDs), devuelve \`type: "COMMANDS"\` y el array con los comandos.

Si el usuario pide una acción pero FALTAN DATOS OBLIGATORIOS, NO DEVUELVAS "ROUTE". Debes devolver SIEMPRE \`type: "COMMANDS"\` y generar el comando Magik.
REGLA CRÍTICA DE SINTAXIS JSON: Cuando devuelvas el array de "commands", si incluyes comillas dobles dentro del string, DEBES escaparlas obligatoriamente con barra invertida (ej: "magik run:prod status:change[\\\"id1\\\", \\\"id2\\\"]"). De lo contrario, causarás un error fatal al parsear el JSON. También puedes usar comillas simples internamente (ej: "magik run:prod status:change['id1', 'id2']").
Excepción vital: Si falta un dato CRÍTICO que no puedes dejar como comodín (por ejemplo, el usuario pide un cambio de estado pero NUNCA menciona a qué estado quiere pasarlo), debes devolver \`type: "INCOMPLETE"\` y generar una pregunta amigable en el campo \`message\` pidiendo ese dato (ej: "¿A qué estado quieres cambiar al estudiante?"). Nunca inventes el estado.
MUY IMPORTANTE: Si encuentras CUALQUIER ID (ObjectID o INC) en el texto del usuario, ASÚMELO como el ID que necesitas para el comando. Por ejemplo, si el comando necesita un <group_id> y ves un ObjectID en el texto, úsalo inmediatamente, no digas que falta.
Si falta el ID de un programa, PERO el usuario mencionó el nombre del programa (ej: "técnico", "tecnólogo", "contaduría"), DEBES usar OBLIGATORIAMENTE un comodín que incluya ese nombre al final, separándolo por guión bajo, con este formato: \`[FALTA_ID_DE_PROGRAMA_TECNICO]\` o \`[FALTA_ID_DE_PROGRAMA_CONTADURIA]\`. NUNCA uses solo \`[FALTA_ID_DE_PROGRAMA]\` si el usuario te dio el nombre. Para grupos usa \`[FALTA_ID_DE_GRUPO]\`.
Si el texto implica múltiples acciones (ej: dos estudiantes diferentes, o aplicar un cambio en dos programas distintos), genera TODOS los comandos por separado (un elemento en el array \`commands\` por cada acción).

Mapeo de Rutas (targetComponent) e Intenciones (intent):
- Inscribir a grupo -> intent: "ENROLL", targetComponent: "inscripciones-estudiante"
- Cambiar de estado / Retirar -> intent: "CHANGE_STATE", targetComponent: "cambios-estado"
- Deshacer publicación -> intent: "UNDO_PUBLICATION", targetComponent: "herramientas-undo"
- Recalcular Nota -> intent: "FINAL_USER", targetComponent: "herramientas-final"
- Auditar Estadísticas -> intent: "AUDIT_STATS", targetComponent: "auditar-estadisticas"
- Buscar/Consultar un ID -> intent: "SEARCH_ID", targetComponent: "buscar-id"
- Ver programas de estudiante -> intent: "GET_PROGRAMS", targetComponent: "programas-estudiante"
- Extraer grupos de un texto -> intent: "EXTRACT_GROUPS", targetComponent: "herramientas-extraer"
- Información del sistema -> intent: "INFO", targetComponent: "informacion"

Estructura estricta JSON:
{
  "type": "COMMANDS" | "ROUTE",
  "commands": ["magik run...", ...],
  "intent": "ENROLL | CHANGE_STATE | ...",
  "targetComponent": "string o null",
  "ids": ["id1", "id2"],
  "suggestedState": "string o null (ej: 'Graduado')",
  "message": "string (solo requerido si type es INCOMPLETE)"
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
      temperature: 0.1
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
