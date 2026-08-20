import{a as e,t}from"./usuariosService-Dq63zMwu.js";import{n,t as r}from"./constants-DFn6Z-8X.js";var i=`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`,a=`
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
2. Si tiene múltiples programas Y la acción que vas a generar requiere program_id, PRIMERO verifica si el usuario mencionó (o insinuó claramente, ej: "tecnologo") el nombre de uno de ellos en su mensaje. Si es así, USA el ID de ese programa directamente. Si NO lo especificó, PREGUNTA al usuario cuál necesita listando los NOMBRES (no los IDs crudos). Usa saltos de línea (
) y viñetas para que se muestre como una lista vertical clara. Si la acción NO requiere program_id, ignora este paso.
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
`,o=async(e,t)=>{if(!t)throw Error(`No API Key provided`);let n=e.map(e=>({role:e.role===`ai`?`model`:`user`,parts:[{text:e.text}]})),r={systemInstruction:{parts:[{text:a}]},contents:n,generationConfig:{responseMimeType:`application/json`,temperature:0}};try{let e=await fetch(`${i}?key=${t}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(r)});if(!e.ok){let t=await e.json();throw e.status===429||t.error?.code===429?Error(`Límite de peticiones de IA alcanzado (Error 429). Espera unos 50 segundos antes de intentar nuevamente.`):e.status===503||t.error?.code===503?Error(`El modelo de IA está muy saturado ahora mismo (Error 503). Intenta de nuevo en unos momentos.`):Error(t.error?.message||`Error al conectar con Gemini`)}let n=(await e.json()).candidates[0].content.parts[0].text,a=n.indexOf(`{`),o=n.lastIndexOf(`}`);return a!==-1&&o!==-1&&(n=n.substring(a,o+1)),JSON.parse(n)}catch(e){throw console.error(`Gemini API Error:`,e),e}},s=e=>{let t=[],n={},r={},i=[];for(let t of e){let{action_type:e,student_id:a,group_id:o}=t,s=o||`[FALTA_ID_GRUPO]`,c=a||`[FALTA_ID_ESTUDIANTE]`;e===`enroll_user`?(n[s]||(n[s]=new Set),n[s].add(c)):e===`remove_user`?(r[s]||(r[s]=new Set),r[s].add(c)):i.push(t)}for(let[e,n]of Object.entries(r)){let r=Array.from(n).map(e=>`"${e}"`).join(`,`);t.push(`magik run:prod pull:user:from:group["${e}",${r}]`)}for(let[e,r]of Object.entries(n)){let n=Array.from(r).map(e=>`"${e}"`).join(`,`);t.push(`magik run:prod enroll:user["${e}",${n}]`)}for(let e of i){let{action_type:n,student_id:r,program_id:i,group_id:a,status_id:o}=e,s=i||`[FALTA_ID_PROGRAMA]`,c=a||`[FALTA_ID_GRUPO]`,l=r||`[FALTA_ID_ESTUDIANTE]`;switch(n){case`change_status`:let r=o||`"${e.status_name}"`;t.push(`magik run:prod status:change["${s}","${r}","${l}"]`);break;case`undo_publication`:t.push(`magik run:prod undo:publication ["${c}"]`);break;case`recalculate_grades`:t.push(`magik run:prod:force final:user ["${c}","${l}"]`);break;case`audit_statistics`:t.push(`magik run:prod audit:statistics["${s}","${l}"]`),a&&t.push(`magik run:prod audit:subject ["${a}","${l}"]`),t.push(`magik run:prod audit:compacts["${s}","${l}"]`);break;case`clean_cache_sislms`:t.push(`magik run:prod cache:clean:sislms ["*"]`);break;case`clean_cache_crm`:t.push(`magik run:prod cache:clean:crm ["*"]`);break;case`fix_deliverable`:t.push(`magik run:prod attempts:fix ["${c}","${l}"]`);break;default:console.warn(`Action type no reconocido: ${n}`)}}return t};function c(e){let t=(e.replace(/\b[a-f0-9]{24}\b/gi,`___OID___`).match(/\b\d{3,7}\b/g)||[]).filter(e=>{let t=parseInt(e);return!(t>=2020&&t<=2030)});return[...new Set(t)]}function l(e){let t=e.match(/\b[a-f0-9]{24}\b/gi)||[];return[...new Set(t)]}async function u(t,n){if(!t.length)return{};try{let{data:r}=await e.from(`programas`).select(`mongo_id, name`).eq(`alliance_id`,n).in(`mongo_id`,t);return r?Object.fromEntries(r.map(e=>[e.mongo_id,e.name])):{}}catch(e){return console.error(`Error resolviendo nombres de programas:`,e),{}}}async function d(e,n,i){let a=r[n],o=c(e),s=l(e);if(o.length===0)return{students:[],objectIds:s,enrichedContext:``};i&&i(`resolving_students`);let d=[],p=[];for(let e of o)try{let n=await t(e,a);if(n&&n._id&&n._id.$oid){let t=(n.programs||[]).map(e=>{let t=e.structure?.$oid||e.structure;return t&&p.push(t),{id:t}}).filter(e=>e.id);d.push({inc:e,objectId:n._id.$oid,name:n.profile?.full_name||`Sin nombre`,email:n.profile?.email||``,programs:t,programCount:t.length,autoProgram:t.length===1?t[0]:null})}}catch(t){console.warn(`No se pudo hidratar INC ${e}:`,t.message)}if(p.length>0){let e=await u([...new Set(p)],a);for(let t of d){for(let n of t.programs)n.name=e[n.id]||n.id;t.autoProgram&&(t.autoProgram.name=e[t.autoProgram.id]||t.autoProgram.id)}}return{students:d,objectIds:s,enrichedContext:f(d,s)}}function f(e,t){if(e.length===0)return``;let n=`
[CONTEXTO DEL SISTEMA - ESTUDIANTES DETECTADOS]:`;for(let t of e)if(n+=`\n- INC ${t.inc} → ObjectID: "${t.objectId}"`,n+=`\n  Nombre: "${t.name}"`,t.programCount===0)n+=`
  Programas: Ninguno registrado.`;else if(t.programCount===1)n+=`\n  Programa (1): "${t.autoProgram.name}" (ID: ${t.autoProgram.id})`,n+=`
  → Tiene 1 solo programa. USA ESTE DIRECTAMENTE como program_id sin preguntar.`;else{n+=`\n  Programas (${t.programCount}):`;for(let e of t.programs)n+=`\n    • "${e.name}" (ID: ${e.id})`;n+=`
  → Tiene múltiples programas. Si la acción requiere program_id, verifica si el usuario ya mencionó cuál quiere (ej: por nombre o palabra clave), y USA su ID directamente. Si no lo especificó, PREGUNTA al usuario cuál necesita listando los nombres con saltos de línea (\\n) como una lista vertical. Si la acción NO requiere program_id (ej. enroll_user, remove_user, fix_deliverable), ignora los programas.`}return t.length>0&&(n+=`\n\nObjectIDs detectados en el mensaje: ${t.join(`, `)}`,n+=`
(Pueden ser group_id, program_id, u otro ID según el contexto del mensaje.)`),n+=`

USA ESTOS DATOS DIRECTAMENTE EN TUS ACCIONES. No preguntes por student_id ni program_id si ya están aquí.`,n}var p=class{constructor(e,t){this.apiKey=e,this.alliance=t}normalizeStr(e){return e.normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).toLowerCase()}async preprocessMessage(n,i,a){let o=n,s=``,c=a||n;try{let e=await d(c,this.alliance,i);e.enrichedContext&&(s+=e.enrichedContext)}catch(e){console.error(`Error en hydration de estudiantes:`,e)}let l=n.match(/https:\/\/sis\.kuepa\.com\/students\/details\/([a-f0-9]{24})\?structure_id=([a-f0-9]{24})/i);if(l){let n=l[1],i=l[2];try{let a=await t(n,r[this.alliance]),o=`desconocido`;if(a){let{data:t}=await e.from(`programas`).select(`mongo_id, name`).eq(`alliance_id`,r[this.alliance]).eq(`mongo_id`,i).single();t&&(o=t.name)}s+=`\n[CONTEXTO DE URL: El usuario proporcionó una URL de SIS. student_id: "${n}", program_id: "${i}" (Programa: "${o}"). USA ESTOS IDs DIRECTAMENTE.]`}catch(e){console.error(`Error en RAG de URL:`,e),s+=`\n[CONTEXTO DE URL: student_id: "${n}", program_id: "${i}".]`}}return`${o}${s}`}async resolveMagicVariables(e,i){let a={...e},o=null;if(a.student_id)try{if(o=await t(a.student_id,r[this.alliance]),o&&o._id&&o._id.$oid)a.student_id=o._id.$oid;else if(a.student_id.length<24&&/^\d+$/.test(a.student_id))throw Error(`INCOMPLETE:El estudiante con INC ${a.student_id} no fue encontrado en tu base de datos.`)}catch(e){if(e.message.startsWith(`INCOMPLETE`))throw e;console.error(`Error resolviendo usuario:`,e)}if(!a.program_id&&(a.action_type===`audit_statistics`||a.action_type===`change_status`)){if(o&&o.programs&&o.programs.length>0){if(o.programs.length===1)a.program_id=o.programs[0].structure?.$oid||o.programs[0].structure;else throw Error(`INCOMPLETE:El estudiante tiene múltiples programas registrados (${o.programs.length}). Por favor, proporciona el ID del programa específico al que te refieres.`)}else throw Error(`INCOMPLETE:No se encontró ningún programa asociado al estudiante. ¿Tienes el ID del programa académico?`)}if(a.action_type===`change_status`&&a.status_name&&!a.status_id){let e=(n[this.alliance]||[]).find(e=>this.normalizeStr(e.label)===this.normalizeStr(a.status_name));if(e)a.status_id=e.value;else throw Error(`INCOMPLETE:El estado "${a.status_name}" no existe en la alianza actual. Por favor verifica el nombre.`)}return a}async processMessage(e,t,n){if(!this.apiKey)throw Error(`No API Key provided`);let r=t.filter(e=>e.role===`user`&&!e.isHidden).map(e=>e.text).join(`
`),i=r?`${r}\n${e}`:e,a=await this.preprocessMessage(e,n,i);n(`ai`);let c=t.map(e=>{let t=e.text;return e.role===`ai`&&!t&&e.parsedResult?.type===`COMMANDS`&&(t=`[Acciones generadas y ejecutadas por el sistema. No repetir.]`),{role:e.role,text:t}}),l=t.length>0?`[CONTINUACIÓN]`:`[NUEVA TAREA]`;c.push({role:`user`,text:`${l}: ${a}`});try{let e=await o(c,this.apiKey);if(e&&(e.type===`INCOMPLETE`||e.type===`INFO`||e.type===`QUERY`||e.type===`ROUTE`))return e;if(e&&e.type===`ACTIONS`&&e.actions){n(`db_processing`);let r=[];for(let n of e.actions){let e=await this.resolveMagicVariables(n,t);r.push(e)}let i=s(r);return i.filter(e=>e.includes(`[FALTA_`)).length>0?{type:`INCOMPLETE`,message:`No se pudieron resolver todos los datos necesarios para generar los comandos. Verifica que los IDs proporcionados sean correctos.`}:{type:`COMMANDS`,commands:i}}if(e&&e.type===`COMMANDS`)return e;throw Error(`Respuesta no soportada del agente.`)}catch(e){if(e.message&&e.message.startsWith(`INCOMPLETE:`))return{type:`INCOMPLETE`,message:e.message.replace(`INCOMPLETE:`,``)};throw e}finally{n(null)}}};export{p as AgentOrchestrator};