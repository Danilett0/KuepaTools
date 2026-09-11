import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generate360Commands,
  normalizeStudent360,
  normalizeText,
  formatIdsForClipboard,
  sortAcademicLevels,
  compareAcademicLevels,
  formatStudentTicketSummary,
} from '../src/services/student360Service.js';

describe('generate360Commands', () => {
  test('debe generar comandos de auditoría completa para un estudiante y programa', () => {
    const cmds = generate360Commands('audit', {
      studentId: '64f1a2b3c4d5e6f7a8b9c0d1',
      programId: '61e2a3b4c5d6e7f8a9b0c1d2',
    });

    assert.equal(cmds.length, 3);
    assert.equal(cmds[0], 'magik run:prod audit:level["61e2a3b4c5d6e7f8a9b0c1d2","64f1a2b3c4d5e6f7a8b9c0d1"]');
    assert.equal(cmds[1], 'magik run:prod audit:statistics["61e2a3b4c5d6e7f8a9b0c1d2","64f1a2b3c4d5e6f7a8b9c0d1"]');
    assert.equal(cmds[2], 'magik run:prod audit:compacts["61e2a3b4c5d6e7f8a9b0c1d2","64f1a2b3c4d5e6f7a8b9c0d1"]');
  });

  test('debe incluir audit:subject si se especifica groupId', () => {
    const cmds = generate360Commands('audit', {
      studentId: '64f1a2b3c4d5e6f7a8b9c0d1',
      programId: '61e2a3b4c5d6e7f8a9b0c1d2',
      groupId: '6765d926107fc303893724e9',
    });

    assert.equal(cmds.length, 4);
    assert.equal(cmds[2], 'magik run:prod audit:subject ["6765d926107fc303893724e9","64f1a2b3c4d5e6f7a8b9c0d1"]');
  });

  test('debe generar comando recalculate_grade para un grupo específico', () => {
    const cmds = generate360Commands('recalculate_grade', {
      studentId: '64f1a2b3c4d5e6f7a8b9c0d1',
      groupId: '6765d926107fc303893724e9',
    });

    assert.equal(cmds.length, 1);
    assert.equal(cmds[0], 'magik run:prod:force final:user ["6765d926107fc303893724e9","64f1a2b3c4d5e6f7a8b9c0d1"]');
  });

  test('debe generar múltiples comandos para recalculate_all_grades', () => {
    const cmds = generate360Commands('recalculate_all_grades', {
      studentId: '64f1a2b3c4d5e6f7a8b9c0d1',
      groupIds: ['6765d926107fc303893724e9', '6765d926107fc303893724ea'],
    });

    assert.equal(cmds.length, 2);
    assert.equal(cmds[0], 'magik run:prod:force final:user ["6765d926107fc303893724e9","64f1a2b3c4d5e6f7a8b9c0d1"]');
    assert.equal(cmds[1], 'magik run:prod:force final:user ["6765d926107fc303893724ea","64f1a2b3c4d5e6f7a8b9c0d1"]');
  });

  test('debe generar comando fix_deliverable', () => {
    const cmds = generate360Commands('fix_deliverable', {
      studentId: '64f1a2b3c4d5e6f7a8b9c0d1',
      groupId: '6765d926107fc303893724e9',
    });

    assert.equal(cmds.length, 1);
    assert.equal(cmds[0], 'magik run:prod attempts:fix ["6765d926107fc303893724e9","64f1a2b3c4d5e6f7a8b9c0d1"]');
  });

  test('debe generar comando audit_group para una materia específica', () => {
    const cmds = generate360Commands('audit_group', {
      studentId: '64f1a2b3c4d5e6f7a8b9c0d1',
      groupId: '6765d926107fc303893724e9',
    });

    assert.equal(cmds.length, 1);
    assert.equal(cmds[0], 'magik run:prod audit:subject ["6765d926107fc303893724e9","64f1a2b3c4d5e6f7a8b9c0d1"]');
  });

  test('debe generar comando remove_user para retirar de una materia', () => {
    const cmds = generate360Commands('remove_user', {
      studentId: '64f1a2b3c4d5e6f7a8b9c0d1',
      groupId: '6765d926107fc303893724e9',
    });

    assert.equal(cmds.length, 1);
    assert.equal(cmds[0], 'magik run:prod pull:user:from:group["6765d926107fc303893724e9","64f1a2b3c4d5e6f7a8b9c0d1"]');
  });

  test('debe generar comandos en lote para recalculate_grade, audit_group, fix_deliverable y remove_user', () => {
    const groupIds = ['g1', 'g2'];
    const studentId = 's1';

    const auditCmds = generate360Commands('audit_group', { studentId, groupIds });
    assert.deepEqual(auditCmds, [
      'magik run:prod audit:subject ["g1","s1"]',
      'magik run:prod audit:subject ["g2","s1"]',
    ]);

    const recalcCmds = generate360Commands('recalculate_grade', { studentId, groupIds });
    assert.deepEqual(recalcCmds, [
      'magik run:prod:force final:user ["g1","s1"]',
      'magik run:prod:force final:user ["g2","s1"]',
    ]);

    const fixCmds = generate360Commands('fix_deliverable', { studentId, groupIds });
    assert.deepEqual(fixCmds, [
      'magik run:prod attempts:fix ["g1","s1"]',
      'magik run:prod attempts:fix ["g2","s1"]',
    ]);

    const removeCmds = generate360Commands('remove_user', { studentId, groupIds });
    assert.deepEqual(removeCmds, [
      'magik run:prod pull:user:from:group["g1","s1"]',
      'magik run:prod pull:user:from:group["g2","s1"]',
    ]);
  });

  test('debe generar comandos de caché sin parámetros', () => {
    const lms = generate360Commands('clean_cache_lms');
    assert.deepEqual(lms, ['magik run:prod cache:clean:sislms ["*"]']);

    const crm = generate360Commands('clean_cache_crm');
    assert.deepEqual(crm, ['magik run:prod cache:clean:crm ["*"]']);
  });

  test('casos límite: parámetros nulos o ausentes deben lanzar error o retornar vacío', () => {
    assert.throws(() => generate360Commands('audit', {}), /studentId y programId son requeridos/);
    assert.throws(() => generate360Commands('recalculate_grade', { studentId: '123' }), /groupId son requeridos/);
    assert.throws(() => generate360Commands('audit_group', { studentId: '123' }), /groupId son requeridos/);
    assert.throws(() => generate360Commands('remove_user', { studentId: '123' }), /groupId son requeridos/);
    assert.deepEqual(generate360Commands('recalculate_all_grades', { studentId: '123', groupIds: [] }), []);
    assert.deepEqual(generate360Commands('recalculate_all_grades', { studentId: '123', groupIds: null }), []);
  });
});

describe('normalizeStudent360', () => {
  const mockUser = {
    _id: { $oid: '64f1a2b3c4d5e6f7a8b9c0d1' },
    alliance_id: { $oid: '6303ed663138387a1669d82a' },
    incremental_user_code: 45281,
    profile: {
      full_name: 'Juan Pérez',
      email: 'juan@kuepa.edu',
      phone: '3001234567',
    },
    programs: [
      { structure: { $oid: '61e2a3b4c5d6e7f8a9b0c1d2' } },
      { structure: '61e2a3b4c5d6e7f8a9b0c1d3' },
    ],
  };

  const mockStructures = [
    {
      mongo_id: '6765d926107fc303893724e9',
      name: 'Matemáticas Básicas G1',
      parent: {
        pensum_level_id: 'level-1',
        level: { name: 'Cuatrimestre 1' },
      },
    },
  ];

  const mockPrograms = [
    { mongo_id: '61e2a3b4c5d6e7f8a9b0c1d2', name: 'Técnico Laboral en Sistemas' },
  ];

  test('normaliza estudiante completo con programas y grupos', () => {
    const result = normalizeStudent360(mockUser, mockStructures, mockPrograms);

    assert.equal(result.student.mongoId, '64f1a2b3c4d5e6f7a8b9c0d1');
    assert.equal(result.student.inc, 45281);
    assert.equal(result.student.fullName, 'Juan Pérez');
    assert.equal(result.student.email, 'juan@kuepa.edu');
    assert.equal(result.student.phone, '3001234567');

    assert.equal(result.programs.length, 2);
    assert.equal(result.programs[0].programId, '61e2a3b4c5d6e7f8a9b0c1d2');
    assert.equal(result.programs[0].name, 'Técnico Laboral en Sistemas');
    // Segundo programa no estaba en catálogo, usa fallback a ID
    assert.equal(result.programs[1].programId, '61e2a3b4c5d6e7f8a9b0c1d3');
    assert.equal(result.programs[1].name, 'Programa 61e2a3b4c5d6e7f8a9b0c1d3');

    assert.equal(result.groups.length, 1);
    assert.equal(result.groups[0].groupId, '6765d926107fc303893724e9');
    assert.equal(result.groups[0].name, 'Matemáticas Básicas G1');
    assert.equal(result.groups[0].levelName, 'Cuatrimestre 1');
  });

  test('casos límite: usuario nulo, sin programas o sin grupos', () => {
    assert.equal(normalizeStudent360(null, [], []), null);

    const userSinProgramas = { ...mockUser, programs: [] };
    const resSinProgramas = normalizeStudent360(userSinProgramas, [], []);
    assert.deepEqual(resSinProgramas.programs, []);
    assert.deepEqual(resSinProgramas.groups, []);

    const userProgramasUndefined = { ...mockUser, programs: null };
    const resProgUndefined = normalizeStudent360(userProgramasUndefined, null, null);
    assert.deepEqual(resProgUndefined.programs, []);
    assert.deepEqual(resProgUndefined.groups, []);
  });
});

describe('normalizeText', () => {
  test('elimina tildes, diacríticos y convierte a minúsculas', () => {
    assert.equal(normalizeText('Matemáticas'), 'matematicas');
    assert.equal(normalizeText('Cátedra Nueva América'), 'catedra nueva america');
    assert.equal(normalizeText('Programación de Software'), 'programacion de software');
    assert.equal(normalizeText('Lógica y Algoritmos'), 'logica y algoritmos');
    assert.equal(normalizeText('   INGLÉS B1   '), 'ingles b1');
  });

  test('casos límite: valores nulos, vacíos o no strings', () => {
    assert.equal(normalizeText(''), '');
    assert.equal(normalizeText(null), '');
    assert.equal(normalizeText(undefined), '');
  });
});

describe('formatIdsForClipboard', () => {
  test('debe formatear arreglo de IDs separados por salto de línea por defecto', () => {
    const ids = ['6765d926107fc303893724e9', '6765d926107fc303893724ea', '6765d926107fc303893724eb'];
    const result = formatIdsForClipboard(ids);
    assert.equal(result, '6765d926107fc303893724e9\n6765d926107fc303893724ea\n6765d926107fc303893724eb');
  });

  test('debe permitir delimitadores personalizados como coma o espacio', () => {
    const ids = ['id1', 'id2'];
    assert.equal(formatIdsForClipboard(ids, ', '), 'id1, id2');
  });

  test('debe extraer groupId o id si se pasan objetos de materia', () => {
    const items = [
      { groupId: '6765d926107fc303893724e9', name: 'Materia 1' },
      { id: '6765d926107fc303893724ea', name: 'Materia 2' },
    ];
    assert.equal(formatIdsForClipboard(items), '6765d926107fc303893724e9\n6765d926107fc303893724ea');
  });

  test('casos límite: arreglo vacío, nulo, indefinido o elementos vacíos', () => {
    assert.equal(formatIdsForClipboard([]), '');
    assert.equal(formatIdsForClipboard(null), '');
    assert.equal(formatIdsForClipboard(undefined), '');
    assert.equal(formatIdsForClipboard(['', '   ', null, 'id_valido', undefined]), 'id_valido');
    assert.equal(formatIdsForClipboard('no-array'), '');
  });
});

describe('sortAcademicLevels', () => {
  test('debe ordenar niveles de Nueva América con Módulo 0 al inicio y Cuatrimestres en orden numérico', () => {
    const input = [
      'Cuatrimestre 3',
      'Cuatrimestre 4',
      'Cuatrimestre 5',
      'Cuatrimestre 1',
      'Cuatrimestre 2',
      'Módulo 0',
    ];
    const expected = [
      'Módulo 0',
      'Cuatrimestre 1',
      'Cuatrimestre 2',
      'Cuatrimestre 3',
      'Cuatrimestre 4',
      'Cuatrimestre 5',
    ];
    assert.deepEqual(sortAcademicLevels(input), expected);
  });

  test('debe ordenar niveles de Kuepa con Inducción primero y Ciclos/Módulos en orden numérico', () => {
    const inputCiclos = ['Ciclo 5', 'Ciclo 3', 'Ciclo 6', 'Ciclo 4', 'Inducción'];
    const expectedCiclos = ['Inducción', 'Ciclo 3', 'Ciclo 4', 'Ciclo 5', 'Ciclo 6'];
    assert.deepEqual(sortAcademicLevels(inputCiclos), expectedCiclos);

    const inputModulos = ['Módulo 3', 'Módulo 1', 'Módulo 0', 'Módulo 2'];
    const expectedModulos = ['Módulo 0', 'Módulo 1', 'Módulo 2', 'Módulo 3'];
    assert.deepEqual(sortAcademicLevels(inputModulos), expectedModulos);
  });

  test('debe ordenar números romanos como Semestre I, II, III, IV', () => {
    const input = ['Semestre IV', 'Semestre I', 'Semestre II', 'Semestre III'];
    const expected = ['Semestre I', 'Semestre II', 'Semestre III', 'Semestre IV'];
    assert.deepEqual(sortAcademicLevels(input), expected);
  });

  test('casos límite: arreglo vacío, nulos, undefined y "Sin nivel" al final', () => {
    assert.deepEqual(sortAcademicLevels([]), []);
    assert.deepEqual(sortAcademicLevels(null), []);
    assert.deepEqual(sortAcademicLevels(undefined), []);

    const conSinNivel = ['Cuatrimestre 2', 'Sin nivel', 'Módulo 0', 'Cuatrimestre 1'];
    assert.deepEqual(sortAcademicLevels(conSinNivel), [
      'Módulo 0',
      'Cuatrimestre 1',
      'Cuatrimestre 2',
      'Sin nivel',
    ]);
  });
});

describe('formatStudentTicketSummary', () => {
  test('debe formatear ficha sin título, sin # en INC y con iconos en cada dato', () => {
    const student = {
      fullName: 'Leidy Yuliana Ocampo Cuervo',
      inc: 19999,
      mongoId: '67b338a6357fb57f91e0b332',
      email: 'ly.ocampoc@lanuevaamerica.edu.co',
      phone: '3157146557',
    };
    const res = formatStudentTicketSummary(student, 'Nueva América');
    const expected = [
      '👤 Nombre: Leidy Yuliana Ocampo Cuervo',
      '🏛️ Alianza: Nueva América',
      '🆔 INC: 19999',
      '🔑 Mongo ObjectId: 67b338a6357fb57f91e0b332',
      '✉️ Correo: ly.ocampoc@lanuevaamerica.edu.co',
      '📞 Teléfono: 3157146557',
      '🔗 Perfil SIS: https://sis.kuepa.com/students/details/67b338a6357fb57f91e0b332',
    ].join('\n');

    assert.equal(res, expected);
    assert.equal(res.includes('#19999'), false);
    assert.equal(res.includes('Ficha de Soporte'), false);
  });

  test('casos límite: estudiante nulo, campos ausentes o valores vacíos', () => {
    assert.equal(formatStudentTicketSummary(null), '');
    assert.equal(formatStudentTicketSummary(undefined), '');

    const vacio = formatStudentTicketSummary({});
    assert.equal(vacio.includes('👤 Nombre: N/A'), true);
    assert.equal(vacio.includes('🆔 INC: N/A'), true);
    assert.equal(vacio.includes('🔗 Perfil SIS: N/A'), true);
  });
});



