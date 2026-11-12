import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateCommandsFromActions } from '../src/agent/skills/index.js';
import { AgentOrchestrator } from '../src/services/AgentOrchestrator.js';
import { generate360Commands } from '../src/services/student360Service.js';

describe('undo_program — TDD Test Suite', () => {
  const sampleProgramId = '6581e669e02d22076e798300';
  const sampleStudentId = '6a95c8907e12260ec590cfb5';

  describe('Skills: generateCommandsFromActions', () => {
    test('genera el comando exacto magik run:prod undo:program ["program_id","student_id"]', () => {
      const actions = [
        {
          action_type: 'undo_program',
          program_id: sampleProgramId,
          student_id: sampleStudentId
        }
      ];

      const commands = generateCommandsFromActions(actions);
      assert.equal(commands.length, 1);
      assert.equal(commands[0], `magik run:prod undo:program ["${sampleProgramId}","${sampleStudentId}"]`);
    });

    test('genera placeholders claros si faltan IDs', () => {
      const actions = [{ action_type: 'undo_program' }];
      const commands = generateCommandsFromActions(actions);
      assert.equal(commands.length, 1);
      assert.equal(commands[0], 'magik run:prod undo:program ["[FALTA_ID_PROGRAMA]","[FALTA_ID_ESTUDIANTE]"]');
    });

    test('procesa múltiples acciones undo_program independientemente', () => {
      const actions = [
        {
          action_type: 'undo_program',
          program_id: sampleProgramId,
          student_id: sampleStudentId
        },
        {
          action_type: 'undo_program',
          program_id: '6581e669e02d22076e798301',
          student_id: '6a95c8907e12260ec590cfb6'
        }
      ];

      const commands = generateCommandsFromActions(actions);
      assert.equal(commands.length, 2);
      assert.equal(commands[0], `magik run:prod undo:program ["${sampleProgramId}","${sampleStudentId}"]`);
      assert.equal(commands[1], 'magik run:prod undo:program ["6581e669e02d22076e798301","6a95c8907e12260ec590cfb6"]');
    });
  });

  describe('AgentOrchestrator: resolveMagicVariables & ticketResponse', () => {
    test('autocompleta program_id si el estudiante tiene exactamente 1 programa', async () => {
      const orchestrator = new AgentOrchestrator('fake-key', 'na');
      orchestrator.userCache.set(sampleStudentId, {
        _id: { $oid: sampleStudentId },
        incremental_user_code: 31722,
        profile: { full_name: 'Estudiante Prueba' },
        programs: [{ structure: { $oid: sampleProgramId } }]
      });

      const action = {
        action_type: 'undo_program',
        student_id: sampleStudentId,
        program_id: null
      };

      const resolved = await orchestrator.resolveMagicVariables(action, [], 'eliminar programa');
      assert.equal(resolved.program_id, sampleProgramId);
    });

    test('resuelve program_id por nombre si el estudiante tiene múltiples programas y el usuario menciona el nombre', async () => {
      const orchestrator = new AgentOrchestrator('fake-key', 'na');
      const progMkt = '6581e669e02d22076e798300';
      const progDesign = '6581e669e02d22076e798301';

      orchestrator.userCache.set(sampleStudentId, {
        _id: { $oid: sampleStudentId },
        incremental_user_code: 31722,
        profile: { full_name: 'Estudiante Prueba' },
        programs: [
          { structure: { $oid: progMkt }, name: 'Marketing Digital' },
          { structure: { $oid: progDesign }, name: 'Diseño Gráfico' }
        ]
      });

      const action = {
        action_type: 'undo_program',
        student_id: sampleStudentId,
        program_id: null
      };

      const resolved = await orchestrator.resolveMagicVariables(
        action,
        [],
        'Me podrian ayudar a eliminar el programa de marketing de este estudiante por favor ID: 31722'
      );
      assert.equal(resolved.program_id, progMkt);
    });

    test('lanza error INCOMPLETE si el estudiante tiene múltiples programas y no se especifica ni coincide ninguno', async () => {
      const orchestrator = new AgentOrchestrator('fake-key', 'na');
      orchestrator.userCache.set(sampleStudentId, {
        _id: { $oid: sampleStudentId },
        incremental_user_code: 31722,
        programs: [
          { structure: { $oid: 'prog1' }, name: 'Ingeniería' },
          { structure: { $oid: 'prog2' }, name: 'Derecho' }
        ]
      });

      const action = {
        action_type: 'undo_program',
        student_id: sampleStudentId,
        program_id: null
      };

      await assert.rejects(
        async () => {
          await orchestrator.resolveMagicVariables(action, [], 'eliminar programa por favor');
        },
        /INCOMPLETE:El estudiante tiene múltiples programas registrados/
      );
    });

    test('generateTicketResponse formatea la respuesta para undo_program', async () => {
      const orchestrator = new AgentOrchestrator('fake-key', 'na');
      orchestrator.userCache.set(sampleStudentId, {
        _id: { $oid: sampleStudentId },
        incremental_user_code: 31722,
        profile: { full_name: 'Estudiante Prueba' }
      });

      const actions = [
        {
          action_type: 'undo_program',
          program_id: sampleProgramId,
          student_id: sampleStudentId
        }
      ];

      const ticket = await orchestrator.generateTicketResponse(actions);
      assert.ok(ticket.includes('✅'));
      assert.ok(ticket.includes('Estudiante Prueba'));
      assert.ok(ticket.includes('31722'));
    });
  });

  describe('Student360Service: generate360Commands', () => {
    test('genera comando magik run:prod undo:program', () => {
      const cmds = generate360Commands('undo_program', {
        studentId: sampleStudentId,
        programId: sampleProgramId
      });
      assert.equal(cmds.length, 1);
      assert.equal(cmds[0], `magik run:prod undo:program ["${sampleProgramId}","${sampleStudentId}"]`);
    });

    test('lanza error si faltan parámetros en generate360Commands', () => {
      assert.throws(() => {
        generate360Commands('undo_program', { studentId: sampleStudentId });
      }, /studentId y programId son requeridos/);
    });
  });
});

