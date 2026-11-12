import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractINCs, buildContextBlock, isGroupLookupNeeded } from '../src/services/studentHydrator.js';

describe('studentHydrator - extractINCs', () => {
  test('debe extraer múltiples INCs de una lista vertical como la enviada por el usuario', () => {
    const text = `requiero que a esta lista de estudiantes los retires de todos los grupos académicos que tengan inscritos.

33108
33131
33105
33095
33119
33134
33136
33102
33097
33100
33118
33099`;

    const incs = extractINCs(text);
    assert.equal(incs.length, 12);
    assert.deepEqual(incs, [
      '33108', '33131', '33105', '33095',
      '33119', '33134', '33136', '33102',
      '33097', '33100', '33118', '33099'
    ]);
  });

  test('casos límite: texto vacío, nulo o sin números devuelve arreglo vacío', () => {
    assert.deepEqual(extractINCs(''), []);
    assert.deepEqual(extractINCs(null), []);
    assert.deepEqual(extractINCs(undefined), []);
    assert.deepEqual(extractINCs('texto sin identificadores'), []);
  });
});

describe('studentHydrator - buildContextBlock con grupos inscritos', () => {
  test('debe incluir grupos inscritos con ID y nombre cuando el estudiante tiene grupos', () => {
    const students = [
      {
        inc: '33095',
        objectId: '6aa16e377e56a51007106472',
        name: 'Lisdeth Andrea Moron Munoz',
        programCount: 1,
        autoProgram: { name: 'Auxiliar de Mercadeo', id: '61e2a3b4c5d6e7f8a9b0c1d2' },
        programs: [{ name: 'Auxiliar de Mercadeo', id: '61e2a3b4c5d6e7f8a9b0c1d2' }],
        groups: [
          { mongo_id: '6a0dcee7292777099f916c9f', name: 'Fundamentos de mercadeo', parent: { level: { name: 'Fundamentación' } } },
          { mongo_id: '6a23314c3c68dd13606fe98e', name: 'Marketing Relacional', parent: { level: { name: 'Fundamentación' } } }
        ]
      }
    ];

    const block = buildContextBlock(students, []);
    assert.match(block, /INC 33095/);
    assert.match(block, /Grupos inscritos \(2\):/);
    assert.match(block, /6a0dcee7292777099f916c9f/);
    assert.match(block, /Marketing Relacional/);
  });

  test('debe incluir el nombre de la materia (parent.name) cuando está disponible en la estructura', () => {
    const students = [
      {
        inc: '31620',
        objectId: '6a3becf08323367429d710ff',
        name: 'Federic Alexander Ballen Vargas',
        programCount: 1,
        autoProgram: { name: 'T.L. en Contabilidad y Finanzas', id: '678e56f347a9c4130b4e4ac7' },
        programs: [{ name: 'T.L. en Contabilidad y Finanzas', id: '678e56f347a9c4130b4e4ac7' }],
        groups: [
          { 
            mongo_id: '69a5cc9777cfb517f6341117', 
            name: 'Módulo Alpha TLCF', 
            parent: { name: 'M0-TLCF JUL I', level: { name: 'Introducción' } } 
          }
        ]
      }
    ];

    const block = buildContextBlock(students, []);
    assert.match(block, /Materia: M0-TLCF JUL I/);
    assert.match(block, /Nivel: Introducción/);
  });

  test('debe indicar "Ninguno registrado" cuando el estudiante no tiene grupos inscritos', () => {
    const students = [
      {
        inc: '33108',
        objectId: '6aa17497b8640d100208762a',
        name: 'Karen Sofia Gonzalez Pineros',
        programCount: 1,
        autoProgram: { name: 'Auxiliar Administrativo', id: '61e2a3b4c5d6e7f8a9b0c1d3' },
        programs: [{ name: 'Auxiliar Administrativo', id: '61e2a3b4c5d6e7f8a9b0c1d3' }],
        groups: []
      }
    ];

    const block = buildContextBlock(students, []);
    assert.match(block, /INC 33108/);
    assert.match(block, /Grupos inscritos: Ninguno registrado/);
  });

  test('omite la sección de grupos cuando groups es undefined (lookup omitido para inscripciones puras)', () => {
    const students = [
      {
        inc: '33108',
        objectId: '6aa17497b8640d100208762a',
        name: 'Karen Sofia Gonzalez Pineros',
        programCount: 1,
        autoProgram: { name: 'Auxiliar Administrativo', id: '61e2a3b4c5d6e7f8a9b0c1d3' },
        programs: [{ name: 'Auxiliar Administrativo', id: '61e2a3b4c5d6e7f8a9b0c1d3' }],
        groups: undefined
      }
    ];

    const block = buildContextBlock(students, ['6ae3853368839a18af139191']);
    assert.match(block, /INC 33108/);
    assert.ok(!block.includes('Grupos inscritos'));
    assert.match(block, /ObjectIDs detectados en el mensaje: 6ae3853368839a18af139191/);
    assert.match(block, /usa ESTRICTAMENTE "6ae3853368839a18af139191" como group_id/);
  });

  test('casos límite: arreglo de estudiantes vacío retorna string vacío', () => {
    assert.equal(buildContextBlock([], []), '');
    assert.equal(buildContextBlock(null, []), '');
    assert.equal(buildContextBlock(undefined, []), '');
  });
});

describe('studentHydrator - isGroupLookupNeeded', () => {
  test('retorna false para peticiones de inscripción pura', () => {
    const text1 = 'en este grupo 6ae3853368839a18af139191 necesito inscribir a esta lista de estudiantes\n15110\n23822';
    assert.equal(isGroupLookupNeeded(text1), false);

    const text2 = 'inscribir al estudiante 15110 en el grupo 6ae3853368839a18af139191';
    assert.equal(isGroupLookupNeeded(text2), false);

    const text3 = 'matricular a estos estudiantes al grupo 6ae3853368839a18af139191';
    assert.equal(isGroupLookupNeeded(text3), false);
  });

  test('retorna true cuando se solicitan retiros, traslados o eliminación de cuatrimestres', () => {
    assert.equal(isGroupLookupNeeded('retirar al estudiante 15110 de sus grupos'), true);
    assert.equal(isGroupLookupNeeded('sacar del grupo a 15110'), true);
    assert.equal(isGroupLookupNeeded('trasladar materias de 15110 al grupo 6ae...'), true);
    assert.equal(isGroupLookupNeeded('eliminar C3 de 15110'), true);
    assert.equal(isGroupLookupNeeded('desinscribir de todos los grupos'), true);
    assert.equal(isGroupLookupNeeded('cambiar de grupo al estudiante 15110'), true);
  });

  test('casos límite: texto vacío, nulo o tipos no string retornan false', () => {
    assert.equal(isGroupLookupNeeded(''), false);
    assert.equal(isGroupLookupNeeded(null), false);
    assert.equal(isGroupLookupNeeded(undefined), false);
    assert.equal(isGroupLookupNeeded(12345), false);
  });
});
