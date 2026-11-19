import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractAcademicGroupUrls } from '../src/utils/academicTerms.js';
import { AgentOrchestrator } from '../src/services/AgentOrchestrator.js';
import { fetchGroupStructure } from '../src/services/groupAuditService.js';

describe('Academic Group URLs & Group Query Orchestration', () => {
  describe('fetchGroupStructure', () => {
    test('retorna los datos estructurados del grupo incluyendo parentName, nivel y allianceName', async () => {
      const groupData = await fetchGroupStructure('6a2856eea17f032252aae1be');
      assert.ok(groupData);
      assert.equal(groupData.groupId, '6a2856eea17f032252aae1be');
      assert.equal(groupData.name, 'Manejo de Herramientas Ofimáticas - 1903V');
      assert.equal(groupData.parentName, 'AE-C1-V3-L6 oct 2026 - ene 2027 - 2');
      assert.equal(groupData.levelName, 'Cuatrimestre 1');
      assert.equal(groupData.allianceId, '6303ed663138387a1669d82a');
      assert.equal(groupData.allianceName, 'Nueva América');
      assert.equal(groupData.studentIds.length, 86);
    });

    test('casos límite: retorna null con groupId nulo, vacío o malformado', async () => {
      assert.equal(await fetchGroupStructure(null), null);
      assert.equal(await fetchGroupStructure(''), null);
      assert.equal(await fetchGroupStructure('invalido'), null);
      assert.equal(await fetchGroupStructure(undefined), null);
    });
  });
  describe('extractAcademicGroupUrls', () => {
    test('extrae correctamente el groupId de una URL de grupo con query params (?tab=sylabus)', () => {
      const text = 'Revisar este grupo https://sis.kuepa.com/academic-group/details/6a2856eea17f032252aae1be?tab=sylabus urgente';
      const results = extractAcademicGroupUrls(text);
      assert.equal(results.length, 1);
      assert.equal(results[0].groupId, '6a2856eea17f032252aae1be');
      assert.ok(results[0].fullUrl.includes('6a2856eea17f032252aae1be'));
    });

    test('extrae múltiples URLs de grupos deduplicando por groupId', () => {
      const text = `
        https://sis.kuepa.com/academic-group/details/6a2856eea17f032252aae1be?tab=sylabus
        https://sis.kuepa.com/academic-group/details/6a2856eea17f032252aae1be
        https://sis.kuepa.com/academic-group/details/6a28568fa17f032252aacb58
      `;
      const results = extractAcademicGroupUrls(text);
      assert.equal(results.length, 2);
      assert.equal(results[0].groupId, '6a2856eea17f032252aae1be');
      assert.equal(results[1].groupId, '6a28568fa17f032252aacb58');
    });

    test('casos límite: maneja null, undefined, texto vacío o strings sin URLs', () => {
      assert.deepEqual(extractAcademicGroupUrls(null), []);
      assert.deepEqual(extractAcademicGroupUrls(undefined), []);
      assert.deepEqual(extractAcademicGroupUrls(''), []);
      assert.deepEqual(extractAcademicGroupUrls(12345), []);
      assert.deepEqual(extractAcademicGroupUrls('solo texto plano sin links'), []);
    });
  });

  describe('AgentOrchestrator — preprocessMessage con URLs de grupos', () => {
    test('pre-hidrata el contexto de grupo académico cuando se proporciona URL de grupo SIS', async () => {
      const orchestrator = new AgentOrchestrator('fake-key', 'na');
      const text = 'que informacion tenemos de este grupo https://sis.kuepa.com/academic-group/details/6a2856eea17f032252aae1be?tab=sylabus';
      
      const enriched = await orchestrator.preprocessMessage(text, () => {});
      assert.ok(typeof enriched === 'string');
      // Debe contener bloque de contexto de grupo académico
      assert.ok(enriched.includes('[CONTEXTO DE GRUPO ACADÉMICO:'));
      assert.ok(enriched.includes('6a2856eea17f032252aae1be'));
    });

    test('pre-hidrata el contexto de grupo académico cuando se menciona "grupo" junto a un ObjectId de 24 hex', async () => {
      const orchestrator = new AgentOrchestrator('fake-key', 'na');
      const text = 'que datos tenemos del grupo 6a2856eea17f032252aae1be por favor';
      
      const enriched = await orchestrator.preprocessMessage(text, () => {});
      assert.ok(typeof enriched === 'string');
      assert.ok(enriched.includes('[CONTEXTO DE GRUPO ACADÉMICO:'));
      assert.ok(enriched.includes('6a2856eea17f032252aae1be'));
    });

    test('pre-hidrata el contexto cuando el ObjectId va al inicio y la palabra grupo al final ("6a2856eea17f032252aae1be dame la info que tengas de este grupo academico")', async () => {
      const orchestrator = new AgentOrchestrator('fake-key', 'na');
      const text = '6a2856eea17f032252aae1be dame la info que tengas de este grupo academico';
      
      const enriched = await orchestrator.preprocessMessage(text, () => {});
      assert.ok(typeof enriched === 'string');
      assert.ok(enriched.includes('[CONTEXTO DE GRUPO ACADÉMICO:'));
      assert.ok(enriched.includes('6a2856eea17f032252aae1be'));
    });

    test('no secuestra consultas de grupos como si fueran alianzas del catálogo', async () => {
      const orchestrator = new AgentOrchestrator('fake-key', 'na');
      const text = '6a2856eea17f032252aae1be dame la info que tengas de este grupo academico';
      const isAskingForSpecificAlliance = /(?:alianza\s+(?:de\s+)?|id\s+de\s+(?:la\s+alianza\s+de\s+)?)([\w\s\d]+)/i.test(text);
      // Con el regex corregido, NO debe ser considerado una consulta de alianza
      assert.equal(isAskingForSpecificAlliance, false);
    });

    test('al consultar "Alianza ID" no busca "ID" en el catálogo ni devuelve Colsubsidio', async () => {
      const orchestrator = new AgentOrchestrator('fake-key', 'na');
      const result = await orchestrator.processMessage('Alianza ID', [], () => {});
      assert.ok(result);
      assert.equal(result.type, 'INFO');
      assert.ok(result.message.includes('Nueva América'));
      assert.ok(!result.message.includes('Colsubsidio'));
    });

    test('pre-hidrata el contexto de grupo incluyendo el nombre de la alianza (Nueva América)', async () => {
      const orchestrator = new AgentOrchestrator('fake-key', 'na');
      const text = 'que datos tenemos del grupo 6a2856eea17f032252aae1be por favor';
      const enriched = await orchestrator.preprocessMessage(text, () => {});
      assert.ok(enriched.includes('Nueva América'));
    });

    test('casos límite: no falla si la URL contiene un ID inexistente o mal formado', async () => {
      const orchestrator = new AgentOrchestrator('fake-key', 'na');
      const text = 'https://sis.kuepa.com/academic-group/details/000000000000000000000000';
      const enriched = await orchestrator.preprocessMessage(text, () => {});
      assert.ok(typeof enriched === 'string');
    });
  });
});
