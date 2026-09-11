

### Fase 1: Ficha Técnica Estudiante 360°
Consolidación integral de la información y diagnóstico operativo de un estudiante en una vista unificada.

- **Objetivo:** Consultar por `INC` o `ObjectId` y centralizar perfil, programas inscritos, historial de grupos activos/finalizados, estado académico y acciones de remediación con un solo clic.
- **Componentes Afectados / Nuevos:**
  - `[NEW] src/Components/Estudiante360/Estudiante360.jsx`
  - `[NEW] src/Components/Estudiante360/FichaPerfil.jsx`
  - `[NEW] src/Components/Estudiante360/AccionesRapidas.jsx`
  - `[MODIFY] src/Components/Sidebar.jsx` (nuevo item de navegación)
  - `[MODIFY] src/Components/AppRouter.jsx` (ruta `estudiante-360`)
- **Acciones Rápidas Integradas:**
  - Limpiar caché LMS/SIS (`cache:clean:sislms`).
  - Recalcular notas finales en grupos activos (`final:user`).
  - Corregir entregables (`attempts:fix`).
  - Disparar auditoría completa (`audit:statistics`, `audit:compacts`).
- **Criterios de Aceptación (TDD):**
  - Renderizado correcto del perfil del estudiante al resolver `incremental_user_code`.
  - Manejo de fallback para estudiantes con múltiples programas o sin grupos asociados.
  - Generación exacta de comandos según la acción seleccionada sin mutaciones no deseadas.

---

### Fase 2: Matriz de Traslados y Promociones Masivas
Operación transaccional para desvincular estudiantes de uno o varios grupos origen y vincularlos a grupos destino.

- **Objetivo:** Automatizar la transición de grupos/cohortes en un único flujo, generando en secuencia atómica los comandos `pull:user:from:group` y `enroll:user`.
- **Componentes Afectados / Nuevos:**
  - `[NEW] src/Components/Inscripciones/FormTraslados.jsx`
  - `[MODIFY] src/Components/Inscripciones.jsx`
  - `[MODIFY] src/agent/skills/index.js` (soporte para acción combinada `transfer_user`)
- **Flujo de Entrada:**
  - Selector de Alianza.
  - Selección de Grupo(s) Origen y Grupo(s) Destino.
  - Lista de estudiantes (por `INC` o `ObjectId`, manual o pegado masivo).
- **Criterios de Aceptación (TDD):**
  - Generación ordenada de comandos de retiro primero y comandos de inscripción después.
  - Validación de que ningún ID de grupo destino coincida con el grupo origen.
  - Prevención de duplicados en la lista de estudiantes procesados.

---

### Fase 3: Validador Semántico Pre-Generación
Mecanismo de inspección previa en Supabase para alertar inconsistencias antes de la generación/copia de comandos.

- **Objetivo:** Evitar fallos en el CLI de producción verificando pertenencias y estados antes de emitir los comandos.
- **Componentes Afectados / Nuevos:**
  - `[NEW] src/services/validatorService.js`
  - `[MODIFY] src/Components/Inscripciones/FormEstudiante.jsx`
  - `[MODIFY] src/Components/Inscripciones/FormGrupo.jsx`
  - `[MODIFY] src/Components/CambioEstados.jsx`
- **Reglas de Validación:**
  - Comprobar si el estudiante ya existe dentro del array `users` de `structures`.
  - Alertar si el `program_id` no pertenece a la alianza seleccionada.
  - Alertar si el estudiante ya se encuentra en el estado destino.
- **Criterios de Aceptación (TDD):**
  - Pruebas unitarias sobre `validatorService.js` con mocks de respuestas Supabase.
  - Indicadores visuales en la interfaz sin bloquear de manera obstructiva el flujo operativo.

---

### Fase 4: Registro de Auditoría de Operadores (Audit Log)
Trazabilidad de operaciones ejecutadas o comandos copiados para control de cambios e historial.

- **Objetivo:** Registrar en Supabase cada generación/copia de comandos, identificando al operador y las entidades modificadas.
- **Contrato de Base de Datos:**
  - Tabla: `public.audit_logs`
  - Columnas: `id (uuid)`, `user_id (uuid)`, `operator_email (text)`, `action_type (text)`, `alliance_id (text)`, `affected_students (jsonb)`, `affected_groups (jsonb)`, `commands_count (integer)`, `created_at (timestamptz)`.
- **Componentes Afectados / Nuevos:**
  - `[NEW] src/services/auditLoggerService.js`
  - `[NEW] src/Components/AuditLogsPanel.jsx`
  - `[MODIFY] src/Components/CommandsDisplay.jsx` (llamada al hook de auditoría al copiar/generar)
- **Criterios de Aceptación (TDD):**
  - Inserción asíncrona sin bloquear la experiencia de usuario (fire-and-forget seguro).
  - Manejo de excepciones si la conexión a Supabase se degrada.

---

### Fase 5: Ingesta Inteligente de Tickets vía AI
Módulo de parseo desestructurado en la Command Palette y formularios para tickets de soporte.

- **Objetivo:** Permitir pegar el texto crudo de un ticket de soporte (Zendesk, Slack, correo) y extraer automáticamente la intención, los INCs/URLs involucrados y generar el set de acciones.
- **Componentes Afectados / Nuevos:**
  - `[MODIFY] src/services/aiService.js` (actualización de system prompt para tickets complejos)
  - `[MODIFY] src/services/AgentOrchestrator.js` (procesamiento de entidades múltiples en lote)
  - `[MODIFY] src/Components/ui/KuepaCommandPalette.jsx`
- **Criterios de Aceptación (TDD):**
  - Extracción precisa de múltiples estudiantes y grupos presentes en un mismo texto libre.
  - Pregunta aclaratoria (`INCOMPLETE`) si la acción requerida es ambigua.

---

### Fase 6: Ejecución Directa de Comandos (Runner / SSH Seguro)
Cierre del ciclo operativo permitiendo la ejecución remota controlada de comandos en servidores de staging/producción.

- **Objetivo:** Enviar lotes de comandos a un runner backend autenticado con confirmación en dos pasos.
- **Requisitos Previos de Arquitectura:**
  - Especificación de contrato de API para el Runner / Webhook seguro.
  - Mecanismo de autenticación con privilegios de rol `admin` y confirmación de contraseña/2FA.
  - Definición de ambiente destino (staging primero, prod con doble autorización).
- **Componentes Afectados / Nuevos:**
  - `[NEW] src/services/runnerService.js`
  - `[NEW] src/Components/ui/ExecutionModal.jsx`
  - `[MODIFY] src/Components/CommandsDisplay.jsx`
- **Criterios de Aceptación (TDD):**
  - Aborto inmediato ante respuestas de error de red.
  - Captura y renderizado de stdout y stderr en tiempo real.
