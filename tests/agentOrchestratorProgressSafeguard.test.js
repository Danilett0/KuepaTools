import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AgentOrchestrator } from '../src/services/AgentOrchestrator.js';
import { generateCommandsFromActions } from '../src/agent/skills/index.js';

describe('AgentOrchestrator — Progress vs Deliverable Safeguard', () => {
  const orchestrator = new AgentOrchestrator('fake-key', 'kuepa');

  const mockUserWithOneProgram = {
    _id: { $oid: '698510fabdc0ec2a03ae8653' },
    incremental_user_code: 23878,
    profile: { full_name: 'Javier Enrique Martinez Carabali' },
    programs: [
      {
        structure: { $oid: '602169e217b5c8a27f9e9c06' },
        name: 'Bachillerato'
      }
    ]
  };

  orchestrator.userCache.set('698510fabdc0ec2a03ae8653', mockUserWithOneProgram);
  orchestrator.userCache.set('23878', mockUserWithOneProgram);

  test('debe reasignar fix_deliverable a audit_statistics si el usuario solicita corregir progreso', async () => {
    const userText = '@Jefferson @Caren Fonseca 23878 Hola! Me ayudan corrigiendo el progreso del estudiante en 6ae38cc129fdbf17e74ca310 por favor?';

    const hallucinatedAction = {
      action_type: 'fix_deliverable',
      student_id: '698510fabdc0ec2a03ae8653',
      group_id: '6ae38cc129fdbf17e74ca310'
    };

    const resolved = await orchestrator.resolveMagicVariables(hallucinatedAction, [], userText);

    assert.equal(resolved.action_type, 'audit_statistics');
    assert.equal(resolved.group_id, '6ae38cc129fdbf17e74ca310');
    assert.equal(resolved.student_id, '698510fabdc0ec2a03ae8653');
    assert.equal(resolved.program_id, '602169e217b5c8a27f9e9c06');
  });

  test('no debe alterar fix_deliverable si el usuario explícitamente habla de entregable o intento', async () => {
    const userText = 'Por favor habilitar o corregir entregable para 23878 en 6ae38cc129fdbf17e74ca310';

    const legitimateDeliverableAction = {
      action_type: 'fix_deliverable',
      student_id: '698510fabdc0ec2a03ae8653',
      group_id: '6ae38cc129fdbf17e74ca310'
    };

    const resolved = await orchestrator.resolveMagicVariables(legitimateDeliverableAction, [], userText);

    assert.equal(resolved.action_type, 'fix_deliverable');
    assert.equal(resolved.group_id, '6ae38cc129fdbf17e74ca310');
    assert.equal(resolved.student_id, '698510fabdc0ec2a03ae8653');
  });

  test('no debe alterar fix_deliverable si el usuario habla de tarea o actividad', async () => {
    const userText = 'reabrir intento de tarea en 6ae38cc129fdbf17e74ca310 para 23878';

    const action = {
      action_type: 'fix_deliverable',
      student_id: '698510fabdc0ec2a03ae8653',
      group_id: '6ae38cc129fdbf17e74ca310'
    };

    const resolved = await orchestrator.resolveMagicVariables(action, [], userText);

    assert.equal(resolved.action_type, 'fix_deliverable');
  });

  test('casos límite: maneja userText vacío, nulo o tipos inesperados sin romper ni alterar fix_deliverable', async () => {
    const action = {
      action_type: 'fix_deliverable',
      student_id: '698510fabdc0ec2a03ae8653',
      group_id: '6ae38cc129fdbf17e74ca310'
    };

    const resEmpty = await orchestrator.resolveMagicVariables(action, [], '');
    assert.equal(resEmpty.action_type, 'fix_deliverable');

    const resNull = await orchestrator.resolveMagicVariables(action, [], null);
    assert.equal(resNull.action_type, 'fix_deliverable');

    const resUndefined = await orchestrator.resolveMagicVariables(action, [], undefined);
    assert.equal(resUndefined.action_type, 'fix_deliverable');
  });

  test('genera los comandos y mensaje de ticket correctos cuando la acción es salvaguardada a audit_statistics', async () => {
    const userText = '@Jefferson @Caren Fonseca 23878 Hola! Me ayudan corrigiendo el progreso del estudiante en 6ae38cc129fdbf17e74ca310 por favor?';

    const hallucinatedAction = {
      action_type: 'fix_deliverable',
      student_id: '698510fabdc0ec2a03ae8653',
      group_id: '6ae38cc129fdbf17e74ca310'
    };

    const resolved = await orchestrator.resolveMagicVariables(hallucinatedAction, [], userText);
    const cmds = generateCommandsFromActions([resolved]);

    assert.equal(cmds.length, 3);
    assert.equal(cmds[0], 'magik run:prod audit:statistics["602169e217b5c8a27f9e9c06","698510fabdc0ec2a03ae8653"]');
    assert.equal(cmds[1], 'magik run:prod audit:subject ["6ae38cc129fdbf17e74ca310","698510fabdc0ec2a03ae8653"]');
    assert.equal(cmds[2], 'magik run:prod audit:compacts["602169e217b5c8a27f9e9c06","698510fabdc0ec2a03ae8653"]');

    const ticketResponse = await orchestrator.generateTicketResponse([resolved], 'Listo el ajuste.');
    assert.match(ticketResponse, /Progreso y estadísticas auditados con éxito/);
    assert.match(ticketResponse, /Javier Enrique Martinez Carabali/);
    assert.match(ticketResponse, /23878/);
  });
});
