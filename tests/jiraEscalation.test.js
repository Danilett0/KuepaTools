import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { compileDescription, compileDescriptionHtml } from '../src/services/jiraEscalationService.js';

describe('Jira Escalation — Estructura compacta (Contexto, Validación, Resultado Esperado)', () => {
  const newSections = {
    context: 'Error en la actualización de calificaciones del estudiante al cruzar notas.',
    validationData: 'INC: 45281 | Cédula: 1028885011 | MongoID: 64fa8b29c1234567890abcde',
    expectedResult: 'Se espera que la calificación final calculada se refleje correctamente en la card del home y en el historial.'
  };

  test('genera exactamente las 3 secciones principales en Markdown sin Data Patch ni Comportamiento redundante', () => {
    const md = compileDescription(newSections, 'markdown');

    // Debe contener las 3 secciones exactas
    assert.ok(md.includes('### 📄 Contexto del Caso'));
    assert.ok(md.includes('### 💾 Datos de Validación'));
    assert.ok(md.includes('### 🎯 Resultado Esperado'));
    assert.ok(md.includes(newSections.expectedResult));

    // NO debe contener secciones eliminadas
    assert.equal(md.includes('Solución Propuesta'), false);
    assert.equal(md.includes('Data Patch'), false);
    assert.equal(md.includes('Comportamiento Observado vs Esperado'), false);
    assert.equal(md.includes('Criterios de Aceptación (DoD)'), false);
    assert.equal(md.includes('Pasos para Reproducir'), false);
    assert.equal(md.includes('Diagnóstico Técnico'), false);
  });

  test('genera exactamente las 3 secciones principales en Jira Markup sin Data Patch', () => {
    const jira = compileDescription(newSections, 'jiraMarkup');

    assert.ok(jira.includes('h3. 📄 Contexto del Caso'));
    assert.ok(jira.includes('h3. 💾 Datos de Validación'));
    assert.ok(jira.includes('h3. 🎯 Resultado Esperado'));

    assert.equal(jira.includes('Solución Propuesta'), false);
    assert.equal(jira.includes('Data Patch'), false);
    assert.equal(jira.includes('Comportamiento Observado vs Esperado'), false);
    assert.equal(jira.includes('Criterios de Aceptación (DoD)'), false);
  });

  test('ignora campos heredados de solución/patch en objetos antiguos', () => {
    const legacySections = {
      context: 'Error 500 al procesar solicitud',
      validationData: 'INC: 12345',
      solution: 'db.users.update(...)',
      dataPatch: 'db.patch(...)',
      expectedResult: 'Se debe procesar la solicitud con código 200.'
    };

    const md = compileDescription(legacySections, 'markdown');
    assert.equal(md.includes('Solución Propuesta'), false);
    assert.equal(md.includes('Data Patch'), false);
    assert.equal(md.includes('db.users.update'), false);
    assert.ok(md.includes('### 🎯 Resultado Esperado'));
  });

  test('realiza fallback adecuado a expectedResult si vienen secciones antiguas', () => {
    const oldSections = {
      context: 'Error al inscribir',
      validationData: 'INC: 99999',
      acceptanceCriteria: '[ ] Inscribir materia sin errores'
    };

    const md = compileDescription(oldSections, 'markdown');
    assert.ok(md.includes('### 🎯 Resultado Esperado'));
    assert.ok(md.includes('Inscribir materia sin errores'));
  });

  test('maneja secciones vacías o nulas sin lanzar excepciones', () => {
    assert.equal(compileDescription(null), '');
    assert.equal(compileDescription({}), '');
    assert.equal(compileDescription(undefined), '');
  });
});

describe('Jira Escalation — Portapapeles Enriquecido HTML con Imágenes (compileDescriptionHtml)', () => {
  const sampleSections = {
    context: 'Error al cargar módulo de notas.',
    validationData: 'INC: 88888 | MongoID: 64fa8b29c1234567890abcde',
    expectedResult: 'El estudiante debe visualizar el módulo correctamente.'
  };

  test('compila las 3 secciones principales en formato HTML con encabezados semánticos', () => {
    const html = compileDescriptionHtml(sampleSections);
    assert.ok(html.includes('<h3>📄 Contexto del Caso</h3>'));
    assert.ok(html.includes('<h3>💾 Datos de Validación</h3>'));
    assert.ok(html.includes('<h3>🎯 Resultado Esperado</h3>'));
    assert.ok(html.includes(sampleSections.expectedResult));
  });

  test('incrusta las etiquetas <img> con sus dataUrls para copiado conjunto en portapapeles', () => {
    const dummyAttachments = [
      {
        name: 'captura_error_1.png',
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        sizeKb: 45
      },
      {
        name: 'captura_error_2.jpg',
        base64: '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
        mimeType: 'image/jpeg',
        sizeKb: 120
      }
    ];

    const html = compileDescriptionHtml(sampleSections, dummyAttachments);
    assert.ok(html.includes('<h3>📸 Evidencias y Capturas Adjuntas</h3>'));
    assert.ok(html.includes('captura_error_1.png'));
    assert.ok(html.includes('<img src="data:image/png;base64,'));
    assert.ok(html.includes('captura_error_2.jpg'));
    assert.ok(html.includes('<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...'));
  });

  test('omite secciones eliminadas como Data Patch o Solución Propuesta en HTML', () => {
    const legacy = {
      ...sampleSections,
      solution: 'db.patch(...)',
      dataPatch: 'db.users.update(...)'
    };
    const html = compileDescriptionHtml(legacy);
    assert.equal(html.includes('Solución Propuesta'), false);
    assert.equal(html.includes('Data Patch'), false);
  });

  test('maneja secciones nulas o sin capturas de manera segura', () => {
    assert.equal(compileDescriptionHtml(null), '');
    assert.equal(compileDescriptionHtml({}), '');
    const htmlWithoutAtts = compileDescriptionHtml(sampleSections, []);
    assert.equal(htmlWithoutAtts.includes('<img'), false);
  });
});
