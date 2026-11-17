import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AgentOrchestrator, DEFAULT_TICKET_CLOSINGS } from '../src/services/AgentOrchestrator.js';

describe('AgentOrchestrator — Respuestas Limpias de Ticket (Solo Solución Técnica)', () => {
  const fakeApiKey = 'fake-key-for-unit-test';
  const orchestrator = new AgentOrchestrator(fakeApiKey, 'kuepa');

  // Precargar usuario simulado en cache
  orchestrator.userCache.set('user123', {
    full_name: 'Daniel Albarracin',
    incremental_user_code: 9999
  });

  test('no debe incluir frases de despedida o cierre genéricas al final del mensaje de ticket', async () => {
    const actions = [
      { action_type: 'clean_cache_sislms' }
    ];

    const response = await orchestrator.generateTicketResponse(actions);

    assert.equal(
      response,
      '✅ Caché del sistema limpiada con éxito.\n\nSe ejecutó la purga del caché solicitado.',
      'La respuesta debe contener únicamente la solución técnica'
    );
  });

  test('en traslados debe presentar solo el movimiento de materias sin texto de despedida adicional', async () => {
    const actions = [
      { action_type: 'remove_user', student_id: 'user123', group_id: 'g1' },
      { action_type: 'enroll_user', student_id: 'user123', group_id: 'g2' }
    ];

    const response = await orchestrator.generateTicketResponse(actions);

    assert.ok(response.startsWith('✅ Traslado de materias gestionado con éxito.'));
    assert.ok(response.includes('desinscribiendo del grupo g1 e inscribiendo al nuevo grupo g2'));
    // No debe contener frases de cierre típicas
    assert.equal(response.includes('🙌'), false);
    assert.equal(response.includes('✨'), false);
    assert.equal(response.includes('🚀'), false);
    assert.equal(response.includes('atento'), false);
    assert.equal(response.includes('ayudarte'), false);
    assert.equal(response.includes('duda'), false);
  });

  test('en cambio de estado, inscripciones y auditoría no debe añadir despedidas ni saltos sobrantes', async () => {
    const actions = [
      { action_type: 'audit_statistics', student_id: 'user123' }
    ];

    const response = await orchestrator.generateTicketResponse(actions);

    assert.ok(response.startsWith('✅ Progreso y estadísticas auditados con éxito.'));
    assert.equal(response.endsWith('sincronizados en la plataforma.'), true, 'Debe finalizar exactamente con la solución sin anexos');
  });

  test('casos límite: si se pasa un customClosing previo, este se ignora para priorizar la solución limpia', async () => {
    const actions = [
      { action_type: 'clean_cache_crm' }
    ];

    const response = await orchestrator.generateTicketResponse(actions, '¡Cualquier otra solicitud por aquí estamos para ayudarte! 🚀');
    assert.equal(
      response,
      '✅ Caché del sistema limpiada con éxito.\n\nSe ejecutó la purga del caché solicitado.'
    );
  });

  test('debe listar a todos los estudiantes involucrados cuando se procesa un traslado de materias para múltiples estudiantes', async () => {
    orchestrator.userCache.set('userA', {
      profile: { full_name: 'Karen Nicoll Arias Sarmiento' },
      incremental_user_code: 32970
    });
    orchestrator.userCache.set('userB', {
      profile: { full_name: 'Julieth Alejandra Moreno Penuela' },
      incremental_user_code: 33080
    });

    const actions = [
      { action_type: 'remove_user', student_id: 'userA', group_id: 'gOriginA' },
      { action_type: 'remove_user', student_id: 'userB', group_id: 'gOriginB' },
      { action_type: 'enroll_user', student_id: 'userA', group_id: 'gDest' },
      { action_type: 'enroll_user', student_id: 'userB', group_id: 'gDest' }
    ];

    const response = await orchestrator.generateTicketResponse(actions);

    assert.ok(response.includes('Traslado'), 'Debe referirse a traslados');
    assert.ok(response.includes('Karen Nicoll Arias Sarmiento'), 'Debe incluir al primer estudiante');
    assert.ok(response.includes('32970'), 'Debe incluir el ID del primer estudiante');
    assert.ok(response.includes('Julieth Alejandra Moreno Penuela'), 'Debe incluir al segundo estudiante');
    assert.ok(response.includes('33080'), 'Debe incluir el ID del segundo estudiante');
  });

  test('debe listar a todos los estudiantes cuando se realizan retiros o inscripciones masivas', async () => {
    const actions = [
      { action_type: 'enroll_user', student_id: 'userA', group_id: 'g1' },
      { action_type: 'enroll_user', student_id: 'userB', group_id: 'g1' }
    ];

    const response = await orchestrator.generateTicketResponse(actions);

    assert.ok(response.includes('Karen Nicoll Arias Sarmiento'));
    assert.ok(response.includes('Julieth Alejandra Moreno Penuela'));
  });

  test('debe detallar el grupo de origen y destino por cada estudiante en traslados con flecha (➔)', async () => {
    const actions = [
      { action_type: 'remove_user', student_id: 'userA', group_id: '69fcdebe6bcd0b27089fdde0' },
      { action_type: 'enroll_user', student_id: 'userA', group_id: '6a3301340f2ce00aa9324862' },
      { action_type: 'remove_user', student_id: 'userB', group_id: '69baf96217e6175c9d728084' },
      { action_type: 'enroll_user', student_id: 'userB', group_id: '6a3301340f2ce00aa9324862' }
    ];

    const response = await orchestrator.generateTicketResponse(actions);

    assert.ok(response.includes('➔'), 'Debe incluir la flecha de movimiento de origen a destino');
    assert.ok(response.includes('Karen Nicoll Arias Sarmiento (ID: 32970)'));
    assert.ok(response.includes('Julieth Alejandra Moreno Penuela (ID: 33080)'));
  });

  test('debe soportar la acción de despublicación (undo_publication) con redacción específica', async () => {
    const actions = [
      { action_type: 'undo_publication', group_id: 'gPublication1' }
    ];

    const response = await orchestrator.generateTicketResponse(actions);

    assert.ok(response.includes('Despublicación realizada con éxito'), 'Debe contener mensaje específico de despublicación');
    assert.ok(response.includes('gPublication1'));
  });

  test('debe consolidar solicitudes mixtas (cambio de estado + inscripción) en una sola respuesta', async () => {
    const actions = [
      { action_type: 'change_status', student_id: 'userA', status_name: 'Activo' },
      { action_type: 'enroll_user', student_id: 'userA', group_id: 'gMath' }
    ];

    const response = await orchestrator.generateTicketResponse(actions);

    assert.ok(response.includes('Estado'));
    assert.ok(response.includes('Activo'));
    assert.ok(response.includes('Inscripción') || response.includes('inscrito'));
  });

  test('debe usar Estudiante como fallback con mayúscula cuando no hay nombre en cache', async () => {
    orchestrator.userCache.set('userNoName', {
      incremental_user_code: 5555
    });

    const actions = [
      { action_type: 'clean_cache_sislms' },
      { action_type: 'recalculate_grades', student_id: 'userNoName' }
    ];

    const response = await orchestrator.generateTicketResponse([
      { action_type: 'recalculate_grades', student_id: 'userNoName' }
    ]);

    assert.ok(response.includes('Estudiante (ID: 5555)'));
    assert.equal(response.includes('el estudiante'), false);
  });

  test('debe listar múltiples grupos con viñetas separadas en retiros para que no se vean arrumados', async () => {
    orchestrator.userCache.set('userMendez', {
      profile: { full_name: 'Juan Esteban Mendez Alba' },
      incremental_user_code: 19608
    });

    const actions = [
      { action_type: 'remove_user', student_id: 'userMendez', group_id: 'Practica profesional Oct IS' },
      { action_type: 'remove_user', student_id: 'userMendez', group_id: 'Estadística Inferencial 2781V - Grupo 1' },
      { action_type: 'remove_user', student_id: 'userMendez', group_id: 'Electiva Profundización 2 - Grupo 1' }
    ];

    const response = await orchestrator.generateTicketResponse(actions);

    assert.ok(response.startsWith('✅ Retiro procesado con éxito.'));
    assert.ok(response.includes('Se retiró al estudiante Juan Esteban Mendez Alba (ID: 19608) de los siguientes grupos:'));
    assert.ok(response.includes('• Practica profesional Oct IS'));
    assert.ok(response.includes('• Estadística Inferencial 2781V - Grupo 1'));
    assert.ok(response.includes('• Electiva Profundización 2 - Grupo 1'));
    assert.equal(response.includes('del grupo Practica profesional Oct IS,'), false);
  });

  test('debe listar múltiples grupos con viñetas separadas en inscripciones para legibilidad', async () => {
    orchestrator.userCache.set('userMendez', {
      profile: { full_name: 'Juan Esteban Mendez Alba' },
      incremental_user_code: 19608
    });

    const actions = [
      { action_type: 'enroll_user', student_id: 'userMendez', group_id: 'Grupo Alfa' },
      { action_type: 'enroll_user', student_id: 'userMendez', group_id: 'Grupo Beta' }
    ];

    const response = await orchestrator.generateTicketResponse(actions);

    assert.ok(response.startsWith('✅ Estudiante inscrito con éxito.'));
    assert.ok(response.includes('ha sido inscrito satisfactoriamente en los siguientes grupos:'));
    assert.ok(response.includes('• Grupo Alfa'));
    assert.ok(response.includes('• Grupo Beta'));
    assert.equal(response.includes('al grupo Grupo Alfa, Grupo Beta'), false);
  });

  test('en traslados extensos (> 2 estudiantes o matriz tabular), genera un resumen con cifras globales para Slack / Tickets', async () => {
    orchestrator.userCache.set('u1', { profile: { full_name: 'Estudiante 1' }, incremental_user_code: 101 });
    orchestrator.userCache.set('u2', { profile: { full_name: 'Estudiante 2' }, incremental_user_code: 102 });
    orchestrator.userCache.set('u3', { profile: { full_name: 'Estudiante 3' }, incremental_user_code: 103 });

    const actions = [
      { action_type: 'remove_user', student_id: 'u1', group_id: 'gOrig1' },
      { action_type: 'remove_user', student_id: 'u2', group_id: 'gOrig2' },
      { action_type: 'remove_user', student_id: 'u3', group_id: 'gOrig3' },
      { action_type: 'enroll_user', student_id: 'u1', group_id: 'gDest1' },
      { action_type: 'enroll_user', student_id: 'u2', group_id: 'gDest2' },
      { action_type: 'enroll_user', student_id: 'u3', group_id: 'gDest3' }
    ];

    const response = await orchestrator.generateTicketResponse(actions);

    assert.ok(response.startsWith('✅ Traslados realizados con éxito.'));
    assert.ok(response.includes('Se realizaron un total de 3 traslados de materias para 3 estudiantes según lo solicitado en el ticket.'));
    assert.equal(response.includes('➔'), false);
    assert.equal(response.includes('Estudiante 1'), false);
  });

  test('en lotes tabulares con opción isBatch, sintetiza cifras globales incluso con 2 estudiantes', async () => {
    const actions = [
      { action_type: 'remove_user', student_id: 'u1', group_id: 'gOrig1' },
      { action_type: 'remove_user', student_id: 'u2', group_id: 'gOrig2' },
      { action_type: 'enroll_user', student_id: 'u1', group_id: 'gDest1' },
      { action_type: 'enroll_user', student_id: 'u2', group_id: 'gDest2' }
    ];

    const response = await orchestrator.generateTicketResponse(actions, null, { isBatch: true });

    assert.ok(response.startsWith('✅ Traslados realizados con éxito.'));
    assert.ok(response.includes('Se realizaron un total de 2 traslados de materias para 2 estudiantes'));
    assert.equal(response.includes('➔'), false);
  });
});
