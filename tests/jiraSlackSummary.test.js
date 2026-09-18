import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSlackEscalationMessage,
  generateSlackSummaryFallback
} from '../src/services/jiraEscalationService.js';

describe('Jira Slack Summary — formatSlackEscalationMessage', () => {
  test('formatea correctamente con "🎫 Tarea generada:" y "📢 Se escaló:" con iconos y sin asteriscos', () => {
    const result = formatSlackEscalationMessage({
      summary: 'El estudiante aparece como regular teniendo materias retiradas; se busca corregir la inconsistencia.'
    });

    assert.ok(result.startsWith('🎫 Tarea generada:'));
    assert.ok(result.includes('📢 Se escaló: El estudiante aparece como regular teniendo materias retiradas; se busca corregir la inconsistencia.'));
    assert.equal(result.includes('*'), false, 'No debe contener asteriscos');
    assert.equal(result.includes('¿Qué se escaló?'), false, 'No debe tener preguntas');
    assert.equal(result.includes('¿Por qué'), false, 'No debe tener preguntas');
  });

  test('elimina asteriscos si vienen en el texto ingresado preservando los iconos', () => {
    const result = formatSlackEscalationMessage({
      summary: 'Fallo *crítico* en plataforma *web*.'
    });
    assert.equal(result.includes('*'), false);
    assert.ok(result.includes('📢 Se escaló: Fallo crítico en plataforma web.'));
    assert.ok(result.includes('🎫 Tarea generada:'));
  });

  test('maneja campos nulos o vacíos sin romper el formato ni arrojar excepciones', () => {
    const result = formatSlackEscalationMessage({});
    assert.ok(result.startsWith('🎫 Tarea generada:'));
    assert.ok(result.includes('📢 Se escaló:'));
    assert.equal(result.includes('undefined'), false);
    assert.equal(result.includes('null'), false);
    assert.equal(result.includes('*'), false);
  });

  test('maneja valores no string de forma segura', () => {
    const result = formatSlackEscalationMessage({
      summary: 12345
    });
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('12345'));
    assert.ok(result.includes('📢 Se escaló:'));
    assert.equal(result.includes('*'), false);
  });
});

describe('Jira Slack Summary — generateSlackSummaryFallback', () => {
  test('extrae y sintetiza adecuadamente a partir de un ticket completo con iconos, sin asteriscos ni preguntas', () => {
    const mockTicket = {
      summary: 'Soporte_Estudiante - Desincronización de estado de estudiante y fallo en actualización',
      extractedEntities: [
        { type: 'student', label: 'Estudiante', value: 'Ana Gómez' },
        { type: 'inc', label: 'INC', value: '45892' }
      ],
      sections: {
        context: 'El estudiante aparece como retirado en el sistema pero la plataforma web lo sigue mostrando como regular.',
        validationData: 'Estudiante: Ana Gómez | INC: 45892',
        reproductionSteps: '1. Ingresar a perfil\n2. Clic en guardar',
        behavior: '❌ Observado: Error al guardar estado\n✅ Esperado: Desinscribir materias y actualizar a retirado',
        acceptanceCriteria: '[ ] Actualizar el estado a retirado y desinscribir materias'
      }
    };

    const slackText = generateSlackSummaryFallback(mockTicket);
    assert.ok(typeof slackText === 'string');
    assert.ok(slackText.startsWith('🎫 Tarea generada:'));
    assert.ok(slackText.includes('📢 Se escaló:'));
    assert.equal(slackText.includes('*'), false, 'No debe tener asteriscos');
    assert.equal(slackText.includes('¿Qué se escaló?'), false);
    assert.equal(slackText.includes('•'), false, 'No debe tener viñetas con preguntas');
  });

  test('soporta tickets sin sections ni datos', () => {
    const emptyTicket = {};
    const slackText = generateSlackSummaryFallback(emptyTicket);
    assert.ok(typeof slackText === 'string');
    assert.ok(slackText.startsWith('🎫 Tarea generada:'));
    assert.ok(slackText.includes('📢 Se escaló:'));
    assert.equal(slackText.includes('*'), false);
  });

  test('soporta ticket nulo o indefinido sin crashear', () => {
    const resultNull = generateSlackSummaryFallback(null);
    const resultUndefined = generateSlackSummaryFallback(undefined);
    assert.ok(typeof resultNull === 'string');
    assert.ok(typeof resultUndefined === 'string');
    assert.ok(resultNull.startsWith('🎫 Tarea generada:'));
    assert.ok(resultUndefined.startsWith('🎫 Tarea generada:'));
    assert.equal(resultNull.includes('*'), false);
    assert.equal(resultUndefined.includes('*'), false);
  });
});
