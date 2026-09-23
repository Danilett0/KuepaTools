import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractINCs, buildContextBlock } from '../src/services/studentHydrator.js';

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

  test('casos límite: arreglo de estudiantes vacío retorna string vacío', () => {
    assert.equal(buildContextBlock([], []), '');
    assert.equal(buildContextBlock(null, []), '');
    assert.equal(buildContextBlock(undefined, []), '');
  });
});
