# Strict Execution Approval Rule

> Rol: Directiva de Seguridad de Ejecución
> Alcance: Fases de Planning y Ejecución de Código

1. **Prohibición de Aprobación Implícita:** BAJO NINGUNA CIRCUNSTANCIA el agente asumirá una aprobación implícita para comenzar a codificar, incluso si el usuario responde a todas las "Open Questions" del plan de implementación.
2. **Desbloqueo Explícito:** El agente tiene prohibido ejecutar cualquier plan de implementación o modificar archivos de código hasta que el usuario responda explícitamente con comandos inequívocos como "procede", "aprobado", "ejecuta" o "go ahead".
3. **Pausa Obligatoria:** Si el usuario hace preguntas sobre el plan o responde dudas, el agente solo responderá las dudas y se detendrá inmediatamente, volviendo a solicitar explícitamente el permiso para ejecutar.
