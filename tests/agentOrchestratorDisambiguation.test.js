import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AgentOrchestrator } from '../src/services/AgentOrchestrator.js';

describe('AgentOrchestrator — Multiple Programs Disambiguation & Ordinal Support', () => {
  const orchestrator = new AgentOrchestrator('fake-key', 'na');

  const mockUserWithTwoPrograms = {
    _id: { $oid: '69702880e569501d6d9d3f5b' },
    incremental_user_code: 12345,
    profile: { full_name: 'Estudiante Demo' },
    programs: [
      {
        structure: { $oid: '6ab19bc9893449125c48a291' },
        name: 'Administración pública'
      },
      {
        structure: { $oid: '6ab19bf5893449125c48a84d' },
        name: 'Álgebra Lineal-2341V..'
      }
    ]
  };

  // Pre-poblar caché para que no intente consultar BD externa en pruebas unitarias
  orchestrator.userCache.set('69702880e569501d6d9d3f5b', mockUserWithTwoPrograms);
  orchestrator.userCache.set('12345', mockUserWithTwoPrograms);
  orchestrator.estadosCache = [{ mongo_id: '111', name: 'Regular' }];
  orchestrator.alianzasCache = [
    { mongo_id: '602169e217b5c8a27f9e9c06', name: 'Kuepa Colombia' },
    { mongo_id: '6303ed663138387a1669d82a', name: 'Nueva América' },
    { mongo_id: '654321098765432109876543', name: 'Socios 3' },
    { mongo_id: '654321098765432109876544', name: 'Compensar' }
  ];

  test('resuelve el primer programa cuando el usuario responde "1" o "el 1" o "el primero"', async () => {
    const action = {
      action_type: 'change_status',
      student_id: '69702880e569501d6d9d3f5b',
      status_name: 'Regular'
    };

    const resolved1 = await orchestrator.resolveMagicVariables(action, [], '1');
    assert.equal(resolved1.program_id, '6ab19bc9893449125c48a291');

    const resolvedEl1 = await orchestrator.resolveMagicVariables(action, [], 'el 1');
    assert.equal(resolvedEl1.program_id, '6ab19bc9893449125c48a291');

    const resolvedPrimero = await orchestrator.resolveMagicVariables(action, [], 'el primero');
    assert.equal(resolvedPrimero.program_id, '6ab19bc9893449125c48a291');
  });

  test('resuelve el segundo programa cuando el usuario responde "2" o "el 2" o "el segundo"', async () => {
    const action = {
      action_type: 'change_status',
      student_id: '69702880e569501d6d9d3f5b',
      status_name: 'Regular'
    };

    const resolved2 = await orchestrator.resolveMagicVariables(action, [], '2');
    assert.equal(resolved2.program_id, '6ab19bf5893449125c48a84d');

    const resolvedEl2 = await orchestrator.resolveMagicVariables(action, [], 'el 2');
    assert.equal(resolvedEl2.program_id, '6ab19bf5893449125c48a84d');

    const resolvedSegundo = await orchestrator.resolveMagicVariables(action, [], 'segundo');
    assert.equal(resolvedSegundo.program_id, '6ab19bf5893449125c48a84d');
  });

  test('resuelve el programa por nombre o palabra clave (ej: "administración" o "álgebra")', async () => {
    const action = {
      action_type: 'change_status',
      student_id: '69702880e569501d6d9d3f5b',
      status_name: 'Regular'
    };

    const resolvedAdmin = await orchestrator.resolveMagicVariables(action, [], 'para administración publica por favor');
    assert.equal(resolvedAdmin.program_id, '6ab19bc9893449125c48a291');

    const resolvedAlgebra = await orchestrator.resolveMagicVariables(action, [], 'en algebra lineal');
    assert.equal(resolvedAlgebra.program_id, '6ab19bf5893449125c48a84d');
  });

  test('lanza INCOMPLETE detallado con lista de programas y opciones cuando no hay coincidencia', async () => {
    const action = {
      action_type: 'change_status',
      student_id: '69702880e569501d6d9d3f5b',
      status_name: 'Regular'
    };

    try {
      await orchestrator.resolveMagicVariables(action, [], 'cambiar estado');
      assert.fail('Debió lanzar excepción INCOMPLETE');
    } catch (err) {
      assert.ok(err.message.startsWith('INCOMPLETE:'));
      assert.match(err.message, /Administración pública/);
      assert.match(err.message, /Álgebra Lineal/);
      assert.match(err.message, /6ab19bc9893449125c48a291/);
      assert.match(err.message, /6ab19bf5893449125c48a84d/);
      assert.ok(Array.isArray(err.options));
      assert.equal(err.options.length, 2);
      assert.equal(err.options[0].value, '6ab19bc9893449125c48a291');
      assert.equal(err.options[1].value, '6ab19bf5893449125c48a84d');
    }
  });

  test('casos límite: ordinal fuera de rango ("99"), texto vacío o null lista opciones sin reventar', async () => {
    const action = {
      action_type: 'change_status',
      student_id: '69702880e569501d6d9d3f5b',
      status_name: 'Regular'
    };

    await assert.rejects(
      async () => orchestrator.resolveMagicVariables(action, [], '99'),
      (err) => err.message.startsWith('INCOMPLETE:') && Array.isArray(err.options)
    );

    await assert.rejects(
      async () => orchestrator.resolveMagicVariables(action, [], ''),
      (err) => err.message.startsWith('INCOMPLETE:') && Array.isArray(err.options)
    );

    await assert.rejects(
      async () => orchestrator.resolveMagicVariables(action, [], null),
      (err) => err.message.startsWith('INCOMPLETE:') && Array.isArray(err.options)
    );
  });

  test('responde con type: INFO directo y lista de opciones cuando el usuario pregunta "¿qué programas tiene?" o "dime cuáles son"', async () => {
    const history = [
      { id: '1', role: 'user', text: 'cambiar a regular al estudiante 12345' },
      { id: '2', role: 'ai', text: 'El estudiante tiene múltiples programas...' }
    ];

    const resultQueProgramas = await orchestrator.processMessage('que programas tiene?', history, () => {});
    assert.equal(resultQueProgramas.type, 'INFO');
    assert.match(resultQueProgramas.message, /Administración pública/);
    assert.match(resultQueProgramas.message, /Álgebra Lineal/);
    assert.ok(Array.isArray(resultQueProgramas.options));
    assert.equal(resultQueProgramas.options.length, 2);

    const resultDimeCuales = await orchestrator.processMessage('dime cuales son', history, () => {});
    assert.equal(resultDimeCuales.type, 'INFO');
    assert.match(resultDimeCuales.message, /Administración pública/);
    assert.ok(Array.isArray(resultDimeCuales.options));
  });

  test('desambigua correctamente para audit_statistics y undo_program', async () => {
    const actionAudit = {
      action_type: 'audit_statistics',
      student_id: '69702880e569501d6d9d3f5b'
    };
    const resolvedAudit = await orchestrator.resolveMagicVariables(actionAudit, [], '1');
    assert.equal(resolvedAudit.program_id, '6ab19bc9893449125c48a291');

    const actionUndo = {
      action_type: 'undo_program',
      student_id: '69702880e569501d6d9d3f5b'
    };
    const resolvedUndo = await orchestrator.resolveMagicVariables(actionUndo, [], 'el 2');
    assert.equal(resolvedUndo.program_id, '6ab19bf5893449125c48a84d');
  });

  test('resuelve el programa cuando el usuario pega directamente el ObjectID de 24 caracteres', async () => {
    const action = {
      action_type: 'change_status',
      student_id: '69702880e569501d6d9d3f5b',
      status_name: 'Regular'
    };
    const resolved = await orchestrator.resolveMagicVariables(action, [], 'el ID es 6ab19bf5893449125c48a84d');
    assert.equal(resolved.program_id, '6ab19bf5893449125c48a84d');
  });

  test('soporta 3 programas y resuelve hasta "3" o "tercero"', async () => {
    const mockUserThreePrograms = {
      _id: { $oid: '69702880e569501d6d9d3f99' },
      incremental_user_code: 99999,
      profile: { full_name: 'Estudiante Triple' },
      programs: [
        { structure: { $oid: '6ab19bc9893449125c48a291' }, name: 'Programa Uno' },
        { structure: { $oid: '6ab19bf5893449125c48a84d' }, name: 'Programa Dos' },
        { structure: { $oid: '6ab19bf5893449125c48a999' }, name: 'Programa Tres' }
      ]
    };
    orchestrator.userCache.set('69702880e569501d6d9d3f99', mockUserThreePrograms);

    const action = {
      action_type: 'change_status',
      student_id: '69702880e569501d6d9d3f99',
      status_name: 'Regular'
    };

    const resolvedTres = await orchestrator.resolveMagicVariables(action, [], '3');
    assert.equal(resolvedTres.program_id, '6ab19bf5893449125c48a999');

    const resolvedTercero = await orchestrator.resolveMagicVariables(action, [], 'el tercero');
    assert.equal(resolvedTercero.program_id, '6ab19bf5893449125c48a999');
  });

  test('responde con el correo del estudiante cuando el usuario pregunta "¿cuál es el correo de este estudiante?"', async () => {
    const userWithEmail = {
      _id: { $oid: '69702880e569501d6d9d3f5b' },
      incremental_user_code: 12345,
      profile: { full_name: 'Estudiante Demo', email: 'demo@kuepa.com' },
      programs: []
    };
    orchestrator.userCache.set('69702880e569501d6d9d3f5b', userWithEmail);
    orchestrator.userCache.set('12345', userWithEmail);

    const history = [];
    const resultEmail = await orchestrator.processMessage('oye cual es el correo de este estudiante ID 12345', history, () => {});
    assert.equal(resultEmail.type, 'INFO');
    assert.match(resultEmail.message, /demo@kuepa\.com/);
    assert.match(resultEmail.message, /Estudiante Demo/);
  });

  test('responde con la lista completa de alianzas del catálogo cuando el usuario solicita "todas las alianzas"', async () => {
    const result = await orchestrator.processMessage('dame la lista de todas alianzas con sus nombres y id que tenemos', [], () => {});
    assert.equal(result.type, 'INFO');
    assert.match(result.message, /Socios 3/);
    assert.match(result.message, /654321098765432109876543/);
    assert.match(result.message, /Compensar/);
    assert.match(result.message, /654321098765432109876544/);
  });

  test('responde con los IDs de las alianzas maestras cuando el usuario pregunta específicamente por ellas', async () => {
    const resultAlianzas = await orchestrator.processMessage('ahora dime el id de la alianza kuepa colombia y en de nueva america', [], () => {});
    assert.equal(resultAlianzas.type, 'INFO');
    assert.match(resultAlianzas.message, /602169e217b5c8a27f9e9c06/);
    assert.match(resultAlianzas.message, /6303ed663138387a1669d82a/);
    assert.match(resultAlianzas.message, /Kuepa/);
    assert.match(resultAlianzas.message, /Nueva América/);
  });

  test('encuentra una alianza específica como "socios 3" en el catálogo sin secuestrar con alianzas maestras', async () => {
    const result = await orchestrator.processMessage('cual es el id de la alianza de socios 3', [], () => {});
    assert.equal(result.type, 'INFO');
    assert.match(result.message, /Socios 3/);
    assert.match(result.message, /654321098765432109876543/);
    assert.ok(!result.message.includes('Las alianzas configuradas en el sistema son:'));
  });
});
