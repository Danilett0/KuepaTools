import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AgentOrchestrator } from '../src/services/AgentOrchestrator.js';

describe('AgentOrchestrator — Enroll Group ID Safeguard', () => {
  const orchestrator = new AgentOrchestrator('fake-key', 'na');

  test('debe forzar el group_id del usuario si la acción es enroll_user y el mensaje contiene exactamente un group_id', async () => {
    const userText = 'en este grupo 6ae3853368839a18af139191 necesito inscribir a esta lista de estudiantes\n15110\n23822';
    
    // Simula una acción donde el LLM alucinó un group_id híbrido o diferente
    const hallucinatedAction = {
      action_type: 'enroll_user',
      student_id: '69702880e569501d6d9d3f5b',
      group_id: '6ae3853368839a18af139ed7' // ID alucinado/mezclado
    };

    const resolved = await orchestrator.resolveMagicVariables(hallucinatedAction, [], userText);
    assert.equal(resolved.group_id, '6ae3853368839a18af139191');
  });

  test('asigna el group_id del usuario si la acción enroll_user viene sin group_id', async () => {
    const userText = 'inscribir a 69702880e569501d6d9d3f5b al grupo 6ae3853368839a18af139191';
    
    const missingGroupAction = {
      action_type: 'enroll_user',
      student_id: '69702880e569501d6d9d3f5b',
      group_id: null
    };

    const resolved = await orchestrator.resolveMagicVariables(missingGroupAction, [], userText);
    assert.equal(resolved.group_id, '6ae3853368839a18af139191');
  });

  test('no altera el group_id en acciones que no sean enroll_user (ej: undo_publication)', async () => {
    const userText = 'despublicar grupo 6ae3853368839a18af139191';
    
    const undoAction = {
      action_type: 'undo_publication',
      group_id: '6ae3853368839a18af139191'
    };

    const resolved = await orchestrator.resolveMagicVariables(undoAction, [], userText);
    assert.equal(resolved.group_id, '6ae3853368839a18af139191');
  });

  test('no sobreescribe el group_id si el mensaje del usuario contiene múltiples ObjectIDs', async () => {
    const userText = 'inscribe a Juan en 6ae3853368839a18af139191 y a Pedro en 6ae3865668839a18af139ed7';
    
    const actionPedro = {
      action_type: 'enroll_user',
      student_id: '69702880e569501d6d9d3f5b',
      group_id: '6ae3865668839a18af139ed7'
    };

    const resolved = await orchestrator.resolveMagicVariables(actionPedro, [], userText);
    // Debe respetar el asignado por el LLM porque el usuario mencionó múltiples grupos
    assert.equal(resolved.group_id, '6ae3865668839a18af139ed7');
  });

  test('casos límite: maneja userText vacío, nulo o tipos inesperados sin romper', async () => {
    const action = {
      action_type: 'enroll_user',
      student_id: '69702880e569501d6d9d3f5b',
      group_id: '6ae3853368839a18af139191'
    };

    const resEmpty = await orchestrator.resolveMagicVariables(action, [], '');
    assert.equal(resEmpty.group_id, '6ae3853368839a18af139191');

    const resNull = await orchestrator.resolveMagicVariables(action, [], null);
    assert.equal(resNull.group_id, '6ae3853368839a18af139191');

    const resUndefined = await orchestrator.resolveMagicVariables(action, [], undefined);
    assert.equal(resUndefined.group_id, '6ae3853368839a18af139191');
  });
});

