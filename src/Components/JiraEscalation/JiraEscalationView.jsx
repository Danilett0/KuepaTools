import React, { useState, useEffect, useRef } from 'react';
import { 
  Ticket, 
  Send, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Tag, 
  AlertCircle,
  Bot,
  Database,
  Code2,
  CheckSquare,
  Wrench,
  HelpCircle,
  LayoutGrid,
  FileCode,
  Bug,
  Search,
  Cpu,
  Zap,
  Terminal,
  User,
  Image as ImageIcon,
  FileDown,
  ArrowRight,
  Pencil,
  X,
  ExternalLink,
  Table
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAppStore } from '../../store/useAppStore';
import { getGlobalSetting } from '../../services/settingsService';
import { processJiraEscalation, compileDescription } from '../../services/jiraEscalationService';
import { exportTicketAsImage, exportTicketAsPdf } from '../../services/ticketExportService';
import { DEFAULT_AI_MODEL } from '../../services/aiService';
import { isTableContent, sanitizeTableOrDump, convertMarkdownTablesToJira, parseMarkdownTable } from '../../services/tableSanitizerService';
import { processImageFile, copyImageToClipboard, downloadImage, MAX_ATTACHMENTS_PER_TICKET } from '../../services/imageCompressionService';

// ── Jira UI Helper Components & Formatters (Estilo Idéntico a Jira Cloud) ──────

function JiraCodeBlock({ code, onCopy, isCopied }) {
  const cleanCode = (code || '')
    .replace(/^```(?:javascript|json|mongo|bash|sh|sql)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();

  const lines = cleanCode.split('\n');

  const highlightLine = (line) => {
    const parts = [];
    let lastIdx = 0;
    const regex = /(".*?"|'.*?'|\bObjectId\b|\b\d+\b)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push(<span key={lastIdx}>{line.substring(lastIdx, match.index)}</span>);
      }
      const token = match[0];
      if (token.startsWith('"') || token.startsWith("'")) {
        // String en verde idéntico a Jira
        parts.push(<span key={match.index} style={{ color: '#57ab5a' }}>{token}</span>);
      } else if (token === 'ObjectId') {
        parts.push(<span key={match.index} style={{ color: '#539bf5' }}>{token}</span>);
      } else {
        parts.push(<span key={match.index} style={{ color: '#f0883e' }}>{token}</span>);
      }
      lastIdx = regex.lastIndex;
    }
    if (lastIdx < line.length) {
      parts.push(<span key={lastIdx}>{line.substring(lastIdx)}</span>);
    }
    return parts.length > 0 ? parts : line;
  };

  return (
    <div style={{
      background: '#161a1d',
      border: '1px solid #282e33',
      borderRadius: '5px',
      overflow: 'hidden',
      margin: '10px 0',
      fontFamily: "'Space Grotesk', 'Fira Code', 'Consolas', monospace"
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 10px',
        background: '#111417',
        borderBottom: '1px solid #282e33'
      }}>
        <span style={{ fontSize: '11px', color: '#8c9bab', fontWeight: 600 }}>
          Script MongoDB / Data Patch
        </span>
        <button
          onClick={() => onCopy(cleanCode, 'solutionCode')}
          className="no-export"
          style={{
            background: 'transparent',
            border: 'none',
            color: isCopied ? '#4ade80' : '#8c9bab',
            cursor: 'pointer',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 600
          }}
          title="Copiar solo el código"
        >
          {isCopied ? <Check size={11} /> : <Copy size={11} />}
          {isCopied ? 'Copiado' : 'Copiar código'}
        </button>
      </div>
      <div style={{ display: 'flex', fontSize: '12px', lineHeight: 1.6 }}>
        <div style={{
          padding: '8px 10px',
          background: 'rgba(0,0,0,0.3)',
          borderRight: '1px solid #282e33',
          color: '#636e7b',
          userSelect: 'none',
          textAlign: 'right',
          minWidth: '22px'
        }}>
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div style={{ padding: '8px 12px', flex: 1, overflowX: 'auto', color: '#dee4ea' }}>
          {lines.map((line, i) => (
            <div key={i} style={{ whiteSpace: 'pre' }}>{highlightLine(line)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

const renderSolutionContent = (solutionText, onCopyCode, isCopied) => {
  if (!solutionText) return null;
  const codeRegex = /```(?:javascript|json|mongo|bash|sh|sql)?\n([\s\S]*?)```/i;
  const match = solutionText.match(codeRegex);

  if (match) {
    const beforeCode = solutionText.substring(0, match.index).trim();
    const code = match[1].trim();
    const afterCode = solutionText.substring(match.index + match[0].length).trim();

    return (
      <div>
        {beforeCode && <p style={{ margin: '0 0 8px', color: '#b6c2cf', lineHeight: 1.6 }}>{beforeCode}</p>}
        <JiraCodeBlock code={code} onCopy={onCopyCode} isCopied={isCopied} />
        {afterCode && <p style={{ margin: '6px 0 0', color: '#8c9bab', fontStyle: 'italic', fontSize: '12px' }}>{afterCode}</p>}
      </div>
    );
  }

  const lines = solutionText.split('\n');
  const codeLineIdx = lines.findIndex(l => l.trim().startsWith('db.'));
  if (codeLineIdx !== -1) {
    const before = lines.slice(0, codeLineIdx).join('\n').trim();
    const code = lines[codeLineIdx].trim();
    const after = lines.slice(codeLineIdx + 1).join('\n').trim();
    return (
      <div>
        {before && <p style={{ margin: '0 0 8px', color: '#b6c2cf', lineHeight: 1.6 }}>{before}</p>}
        <JiraCodeBlock code={code} onCopy={onCopyCode} isCopied={isCopied} />
        {after && <p style={{ margin: '6px 0 0', color: '#8c9bab', fontStyle: 'italic', fontSize: '12px' }}>{after}</p>}
      </div>
    );
  }

  return <div style={{ color: '#b6c2cf', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{solutionText}</div>;
};

const renderValidationData = (valData, onNavigateToStudent, onNavigateToBuscarId) => {
  if (!valData) return null;

  // Si contiene una tabla Markdown estructurada, renderizarla con estilo de tabla nativa de Jira
  const parsedTable = parseMarkdownTable(valData);
  if (parsedTable) {
    return (
      <div style={{ overflowX: 'auto', margin: '4px 0 10px 0' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
          textAlign: 'left',
          background: '#111417',
          borderRadius: '5px',
          overflow: 'hidden',
          border: '1px solid #282e33'
        }}>
          <thead>
            <tr style={{ background: '#1c2127', borderBottom: '1px solid #282e33' }}>
              {parsedTable.headers.map((h, i) => (
                <th key={i} style={{ padding: '7px 10px', color: '#dee4ea', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsedTable.rows.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: rIdx < parsedTable.rows.length - 1 ? '1px solid #1f2429' : 'none' }}>
                {row.map((cell, cIdx) => {
                  const cleanCell = cell.replace(/['"]/g, '').trim();
                  const isCellMongo = /^[0-9a-fA-F]{24}$/.test(cleanCell);
                  const cellDigits = cleanCell.replace(/\D/g, '');
                  const isCellInc = (/^INC[-_ ]?\d+$/i.test(cleanCell) || (cellDigits.length >= 2 && cellDigits.length <= 6 && !isCellMongo)) && Number(cellDigits) <= 100000;
                  return (
                    <td key={cIdx} style={{ padding: '6px 10px', color: '#c7d1db', fontFamily: (isCellMongo || cellDigits.length >= 4) ? "'Space Grotesk', monospace" : 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{cell}</span>
                        {isCellMongo && onNavigateToStudent && (
                          <button
                            type="button"
                            className="no-export"
                            onClick={() => onNavigateToStudent(cleanCell)}
                            style={{
                              background: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: '3px',
                              padding: '1px 5px',
                              color: '#38bdf8',
                              fontSize: '9.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                            title="Abrir MongoID en Estudiante 360"
                          >
                            <ExternalLink size={9} /> 360
                          </button>
                        )}
                        {isCellInc && onNavigateToBuscarId && (
                          <button
                            type="button"
                            className="no-export"
                            onClick={() => onNavigateToBuscarId(cellDigits || cleanCell)}
                            style={{
                              background: 'rgba(34, 197, 94, 0.12)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: '3px',
                              padding: '1px 5px',
                              color: '#4ade80',
                              fontSize: '9.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                            title={`Consultar INC-${cellDigits || cleanCell} en Buscar ID`}
                          >
                            <ExternalLink size={9} /> Buscar ID
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const lines = valData.split('\n').filter(l => l.trim().length > 0);
  return (
    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', color: '#b6c2cf' }}>
      {lines.map((line, idx) => {
        const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
        const colonIdx = cleanLine.indexOf(':');
        if (colonIdx !== -1) {
          const label = cleanLine.substring(0, colonIdx + 1);
          const val = cleanLine.substring(colonIdx + 1).trim();
          const cleanVal = val.replace(/['"]/g, '').trim();
          const rawDigits = cleanVal.replace(/\D/g, '');
          const isMongo = /^[0-9a-fA-F]{24}$/.test(cleanVal);
          // Cédula / Documento: detectado por etiqueta o por tener entre 7 y 11 dígitos (nunca un ObjectId de 24 hex)
          const isCedula = !isMongo && (/c[eé]dula|c\.c|documento|identificaci[oó]n/i.test(label) || (rawDigits.length >= 7 && rawDigits.length <= 11));
          // INC: estrictamente de 2 a 6 dígitos (código incremental corto) y NUNCA cédula ni mongo
          const isInc = !isCedula && !isMongo && (/inc/i.test(label) || /^INC[-_ ]?\d+$/i.test(cleanVal)) && (rawDigits.length >= 2 && rawDigits.length <= 6);

          return (
            <li key={idx} style={{ marginBottom: '6px', fontSize: '12.5px', lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: '#dee4ea' }}>{label} </span>
              <span style={{ fontFamily: (isMongo || isCedula) ? "'Space Grotesk', monospace" : 'inherit', color: '#c7d1db' }}>
                {val}
              </span>
              {isMongo && onNavigateToStudent && (
                <button
                  type="button"
                  className="no-export"
                  onClick={() => onNavigateToStudent(cleanVal)}
                  style={{
                    marginLeft: '8px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '4px',
                    padding: '1px 6px',
                    color: '#38bdf8',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    verticalAlign: 'middle',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)'; }}
                  title={`Abrir MongoID en Estudiante 360`}
                >
                  <ExternalLink size={10} /> 360
                </button>
              )}
              {isInc && onNavigateToBuscarId && (
                <button
                  type="button"
                  className="no-export"
                  onClick={() => onNavigateToBuscarId(rawDigits || cleanVal)}
                  style={{
                    marginLeft: '8px',
                    background: 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '4px',
                    padding: '1px 6px',
                    color: '#4ade80',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    verticalAlign: 'middle',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.22)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.12)'; }}
                  title={`Consultar INC-${rawDigits || cleanVal} en Buscar ID`}
                >
                  <ExternalLink size={10} /> Buscar ID
                </button>
              )}
            </li>
          );
        }
        return (
          <li key={idx} style={{ marginBottom: '4px', fontSize: '12.5px', lineHeight: 1.55 }}>
            {cleanLine}
          </li>
        );
      })}
    </ul>
  );
};

const renderReproductionSteps = (stepsText) => {
  if (!stepsText) return null;
  const lines = stepsText.split('\n').filter(l => l.trim().length > 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {lines.map((line, idx) => {
        const cleanLine = line.trim();
        return (
          <div key={idx} style={{ fontSize: '12.5px', lineHeight: 1.55, color: '#b6c2cf' }}>
            {cleanLine}
          </div>
        );
      })}
    </div>
  );
};

const renderBehaviorContent = (sections) => {
  let observed = sections.observedBehavior || '';
  let expected = sections.expectedBehavior || '';

  if (!observed && !expected && sections.behavior) {
    const text = sections.behavior;
    const splitRegex = /(?:❌|Comportamiento)?\s*Observado\s*:?/i;
    const expectedRegex = /(?:✅|Comportamiento)?\s*Esperado\s*:?/i;

    if (splitRegex.test(text) && expectedRegex.test(text)) {
      const expIdx = text.search(expectedRegex);
      observed = text.substring(0, expIdx).replace(splitRegex, '').trim();
      expected = text.substring(expIdx).replace(expectedRegex, '').trim();
    }
  }

  if (observed || expected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {observed && (
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f87171', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>❌</span> Observado:
            </div>
            <div style={{ fontSize: '12.5px', lineHeight: 1.6, color: '#dee4ea' }}>
              {observed}
            </div>
          </div>
        )}
        {expected && (
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#4ade80', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✅</span> Esperado:
            </div>
            <div style={{ fontSize: '12.5px', lineHeight: 1.6, color: '#dee4ea' }}>
              {expected}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <div style={{ color: '#dee4ea', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{sections.behavior}</div>;
};

const renderAcceptanceCriteria = (dodText) => {
  if (!dodText) return null;
  const lines = dodText.split('\n').filter(l => l.trim().length > 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {lines.map((line, idx) => {
        const clean = line.replace(/^[-*]\s*(\[[ xX]\])?\s*/, '').trim();
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', lineHeight: 1.5, color: '#dee4ea' }}>
            <span style={{
              width: '13px',
              height: '13px',
              borderRadius: '3px',
              border: '1.5px solid #2dd4bf',
              background: 'rgba(45, 212, 191, 0.12)',
              marginTop: '3px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }} />
            <span>{clean}</span>
          </div>
        );
      })}
    </div>
  );
};

const EXAMPLE_TEMPLATES = [
  {
    id: 'orphan-request',
    tag: 'Base de Datos',
    tagColor: '#12a383',
    icon: Database,
    title: 'Solicitud Huérfana por Usuario Inactivo',
    summary: 'Error al consultar cola por registro desvinculado con Mongo ID.',
    prompt: 'Hay una solicitud en cola que rompe la vista al consultar porque el estudiante original Lucas Daza Leon (INC: 32577, CC: 1028885011) fue inactivado al cruzar matrícula. La solicitud tiene ID 6aa97ac8594184100e81670a y no tiene student_data válido.'
  },
  {
    id: 'grades-mismatch',
    tag: 'Académico',
    tagColor: '#38bdf8',
    icon: Code2,
    title: 'Descuadre de Calificaciones en Materia',
    summary: 'Discrepancia entre nota calculada y reflejada en actividades.',
    prompt: 'El estudiante con INC 123456 tiene notas descuadradas en la materia Matemáticas. Se corrió final:user pero la nota sigue mostrando 2.8 en lugar de 3.5 que calculan las actividades.'
  },
  {
    id: 'status-conflict',
    tag: 'Validación de Estados',
    tagColor: '#f59e0b',
    icon: AlertTriangle,
    title: 'Conflicto de Estado de Matrícula',
    summary: 'Estudiante con estado incompatible o error en status:change.',
    prompt: 'El estudiante INC 345678 aparece como Retirado pero en plataforma sigue en estado Regular cursando materias. Se intentó status:change pero regresa error de validación.'
  }
];

// ── Jira Processing HUD & Synthesis Stages ─────────────────────────────────

const PROCESSING_STAGES = [
  {
    id: 0,
    title: 'Extrayendo Identificadores & Logs',
    shortTitle: 'Extracción de Datos',
    desc: 'Escaneando texto, normalizando IDs de MongoDB, tickets INC y cédulas...',
    icon: Search,
    color: '#38bdf8'
  },
  {
    id: 1,
    title: 'Analizando Contexto & Causa Raíz',
    shortTitle: 'Diagnóstico Técnico',
    desc: 'Correlacionando logs con el módulo de solicitudes y aislando el origen del fallo...',
    icon: Cpu,
    color: '#a855f7'
  },
  {
    id: 2,
    title: 'Estructurando Solución & Data Patch',
    shortTitle: 'Data Patch MongoDB',
    desc: 'Sintetizando pasos de reproducción y diseñando script de corrección en BD...',
    icon: Database,
    color: '#12a383'
  },
  {
    id: 3,
    title: 'Compilando Criterios de Aceptación (DoD)',
    shortTitle: 'Formato Jira Cloud',
    desc: 'Generando formato estándar de ingeniería con directivas de validación...',
    icon: Zap,
    color: '#f59e0b'
  }
];

function ProcessingChatBubble({ stage = 0 }) {
  const currentStage = PROCESSING_STAGES[stage] || PROCESSING_STAGES[0];
  const progressPercent = ((stage + 1) / PROCESSING_STAGES.length) * 100;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '6px',
      width: '100%',
      animation: 'smoothCardEntrance 0.8s cubic-bezier(0.22, 1, 0.36, 1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: '#22c55e',
          display: 'inline-block',
          animation: 'beaconPulse 2.2s infinite ease-in-out'
        }} />
        <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.05em' }}>
          ASISTENTE JIRA (CREANDO TICKET)
        </span>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          color: '#38bdf8',
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '1px 7px',
          borderRadius: '10px'
        }}>
          Paso {stage + 1}/4
        </span>
      </div>

      <div style={{
        maxWidth: '92%',
        width: '460px',
        padding: '14px 16px',
        borderRadius: '14px 14px 14px 2px',
        background: 'linear-gradient(135deg, rgba(18, 163, 131, 0.12) 0%, rgba(17, 24, 39, 0.85) 100%)',
        border: '1px solid rgba(18, 163, 131, 0.4)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(18, 163, 131, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Dynamic Glowing Progress Laser */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '2.5px',
          width: `${progressPercent}%`,
          background: 'linear-gradient(90deg, var(--primary), #38bdf8)',
          boxShadow: '0 0 10px #38bdf8',
          transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(18, 163, 131, 0.18)',
            border: '1px solid rgba(18, 163, 131, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentStage.color,
            flexShrink: 0
          }}>
            {React.createElement(currentStage.icon, { size: 16 })}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.01em' }}>
              {currentStage.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px', lineHeight: 1.3 }}>
              {currentStage.desc}
            </div>
          </div>
        </div>

        {/* Dynamic Neural Equalizer Wave */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3.5px', height: '14px' }}>
            {[45, 85, 60, 100, 35, 75, 50, 95, 40, 80].map((h, i) => (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: `${h}%`,
                  background: 'linear-gradient(to top, var(--primary), #38bdf8)',
                  borderRadius: '2px',
                  animation: 'aiPulseWave 1.4s ease-in-out infinite alternate',
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '10.5px', color: '#8c9bab', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={11} color="var(--primary)" /> Generando con Gemini...
          </span>
        </div>
      </div>
    </div>
  );
}

function TicketSynthesisSkeleton({ stage = 0 }) {
  const currentStage = PROCESSING_STAGES[stage] || PROCESSING_STAGES[0];
  const progressPercent = ((stage + 1) / PROCESSING_STAGES.length) * 100;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      width: '100%',
      animation: 'smoothCardEntrance 1.2s cubic-bezier(0.22, 1, 0.36, 1)'
    }}>
      {/* ── Cyber HUD Header Bar ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(18, 163, 131, 0.12) 0%, rgba(56, 189, 248, 0.08) 100%)',
        border: '1px solid rgba(18, 163, 131, 0.35)',
        borderRadius: '10px',
        padding: '14px 18px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Laser Glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '2px',
          width: `${progressPercent}%`,
          background: 'linear-gradient(90deg, var(--primary), #38bdf8)',
          boxShadow: '0 0 12px #38bdf8',
          transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block',
              animation: 'beaconPulse 2.2s infinite ease-in-out'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Síntesis Activa de Ticket Jira
            </span>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '100px',
            padding: '2px 10px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#38bdf8'
          }}>
            <Sparkles size={12} className="animate-spin-slow" />
            Fase {stage + 1} de 4: {currentStage.shortTitle}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentStage.color,
            flexShrink: 0
          }}>
            {React.createElement(currentStage.icon, { size: 15 })}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface)', fontWeight: 500, lineHeight: 1.4 }}>
            {currentStage.desc}
          </p>
        </div>
      </div>

      {/* ── Holographic Jira Blueprint Card ── */}
      <div style={{
        background: '#1d2125',
        border: '1px solid #282e33',
        borderRadius: '8px',
        padding: '22px 26px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        animation: 'cyberGlow 4.5s infinite alternate ease-in-out'
      }}>
        {/* Holographic Laser Scanner Beam */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(18, 163, 131, 0.15) 20%, rgba(56, 189, 248, 0.85) 50%, rgba(18, 163, 131, 0.15) 80%, transparent 100%)',
          boxShadow: '0 0 16px rgba(56, 189, 248, 0.9), 0 0 6px rgba(18, 163, 131, 0.8)',
          pointerEvents: 'none',
          zIndex: 10,
          animation: 'laserScan 3.6s infinite ease-in-out alternate'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Skeleton Title Box */}
          <div style={{ paddingBottom: '14px', borderBottom: '1px solid #282e33' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={12} color="#8c9bab" />
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#8c9bab', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Título del Ticket
              </span>
            </div>
            <div className="jira-shimmer-bar" style={{ height: '22px', width: '85%', borderRadius: '4px' }} />
          </div>

          {/* Skeleton Chips (IDs Clave) */}
          <div style={{
            padding: '8px 12px',
            background: '#161a1d',
            border: '1px solid #282e33',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#8c9bab' }}>
              IDs Clave:
            </span>
            <div className="jira-shimmer-bar" style={{ height: '18px', width: '130px', borderRadius: '3px' }} />
            <div className="jira-shimmer-bar" style={{ height: '18px', width: '90px', borderRadius: '3px' }} />
            <div className="jira-shimmer-bar" style={{ height: '18px', width: '160px', borderRadius: '3px' }} />
            <div className="jira-shimmer-bar" style={{ height: '18px', width: '110px', borderRadius: '3px' }} />
          </div>

          {/* Skeleton Section: Contexto del Caso */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <FileText size={13} color="#38bdf8" />
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
                CONTEXTO DEL CASO
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="jira-shimmer-bar" style={{ height: '14px', width: '98%', borderRadius: '3px' }} />
              <div className="jira-shimmer-bar" style={{ height: '14px', width: '92%', borderRadius: '3px' }} />
              <div className="jira-shimmer-bar" style={{ height: '14px', width: '65%', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Skeleton Section: Datos de Validación */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Database size={13} color="#a855f7" />
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#a855f7', letterSpacing: '0.04em' }}>
                DATOS DE VALIDACIÓN
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="jira-shimmer-bar" style={{ height: '14px', width: '80%', borderRadius: '3px' }} />
              <div className="jira-shimmer-bar" style={{ height: '14px', width: '70%', borderRadius: '3px' }} />
              <div className="jira-shimmer-bar" style={{ height: '14px', width: '90%', borderRadius: '3px' }} />
              <div className="jira-shimmer-bar" style={{ height: '14px', width: '75%', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Skeleton Section: Pasos para Reproducir */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <RefreshCw size={13} color="#22c55e" />
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#22c55e', letterSpacing: '0.04em' }}>
                PASOS PARA REPRODUCIR
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
                <div className="jira-shimmer-bar" style={{ height: '14px', width: '88%', borderRadius: '3px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
                <div className="jira-shimmer-bar" style={{ height: '14px', width: '75%', borderRadius: '3px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
                <div className="jira-shimmer-bar" style={{ height: '14px', width: '60%', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

          {/* Skeleton Section: Mock Terminal Code Block */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Terminal size={13} color="#12a383" />
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#12a383', letterSpacing: '0.04em' }}>
                SOLUCIÓN PROPUESTA / DATA PATCH (MONGODB)
              </span>
            </div>
            <div style={{
              background: '#161a1d',
              border: '1px solid #282e33',
              borderRadius: '6px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div className="jira-shimmer-bar-code" style={{ height: '13px', width: '55%', borderRadius: '2px' }} />
              <div className="jira-shimmer-bar-code" style={{ height: '13px', width: '78%', borderRadius: '2px' }} />
              <div className="jira-shimmer-bar-code" style={{ height: '13px', width: '42%', borderRadius: '2px' }} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function TicketDraftRadar({ conversation, lastQuestions, onInsertHint }) {
  const userText = conversation
    .filter(m => m.role === 'user')
    .map(m => m.text)
    .join(' ');

  // Extraer entidades detectadas automáticamente
  const incMatches = userText.match(/\bINC\s*[-_]?\s*\d+\b/gi) || [];
  const uniqueIncs = [...new Set(incMatches.map(s => s.replace(/\s+/g, ' ').toUpperCase()))];
  
  const mongoMatches = userText.match(/\b[0-9a-f]{24}\b/gi) || [];
  const uniqueMongoIds = [...new Set(mongoMatches)];

  const statesFound = [];
  if (/retirado/i.test(userText)) statesFound.push('Retirado');
  if (/regular/i.test(userText)) statesFound.push('Regular');
  if (/inactivo/i.test(userText)) statesFound.push('Inactivo');
  if (/inscrito/i.test(userText)) statesFound.push('Inscrito');
  if (/graduado/i.test(userText)) statesFound.push('Graduado');

  const modulesFound = [];
  if (/statuschange/i.test(userText)) modulesFound.push('statuschange');
  if (/solicitud/i.test(userText)) modulesFound.push('solicitudes');
  if (/calificaci[oó]n|nota/i.test(userText)) modulesFound.push('calificaciones');
  if (/500|error|timeout|validaci[oó]n/i.test(userText)) modulesFound.push('error de validación');

  const questions = lastQuestions && lastQuestions.length > 0
    ? lastQuestions
    : [
        "¿Cuál es el ObjectId de MongoDB o cédula del estudiante?",
        "¿Cuál es el mensaje exacto de error devuelto?",
        "¿Qué acción previa generó la discrepancia?"
      ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      height: '100%',
      animation: 'smoothCardEntrance 1.2s cubic-bezier(0.22, 1, 0.36, 1)'
    }}>
      {/* ── Header HUD Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.09) 0%, rgba(18, 163, 131, 0.09) 100%)',
        border: '1px solid rgba(234, 179, 8, 0.35)',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(234, 179, 8, 0.18)',
            border: '1px solid rgba(234, 179, 8, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#facc15',
            boxShadow: '0 0 12px rgba(234, 179, 8, 0.3)'
          }}>
            <Search size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff' }}>
                Fase 1: Recolección y Telemetría de Caso
              </span>
              <span style={{
                fontSize: '9px',
                fontWeight: 800,
                textTransform: 'uppercase',
                background: 'rgba(234, 179, 8, 0.2)',
                color: '#facc15',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                padding: '2px 7px',
                borderRadius: '4px'
              }}>
                Borrador Activo
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#8c9bab' }}>
              La IA está correlacionando incidentes y esperando los últimos parámetros para compilar el ticket final.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#facc15',
            animation: 'beaconPulse 1.5s infinite'
          }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#facc15' }}>
            {questions.length} Parámetros Pendientes
          </span>
        </div>
      </div>

      {/* ── Card 1: Telemetría Detectada Automáticamente ── */}
      <div style={{
        background: '#1d2125',
        border: '1px solid #282e33',
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Database size={13} /> Parámetros Técnicos Identificados:
          </span>
          <span style={{ fontSize: '10.5px', color: '#8c9bab' }}>
            Auto-extracción Gemini
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {uniqueIncs.length > 0 && uniqueIncs.map((inc, i) => (
            <span key={i} style={{
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(18, 163, 131, 0.16)',
              color: '#34d399',
              border: '1px solid rgba(18, 163, 131, 0.45)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Tag size={12} /> {inc}
            </span>
          ))}

          {uniqueMongoIds.length > 0 && uniqueMongoIds.map((id, i) => (
            <span key={i} style={{
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.16)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Code2 size={12} /> ObjectId: {id.substring(0, 10)}...
            </span>
          ))}

          {statesFound.length > 0 && (
            <span style={{
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(168, 85, 247, 0.16)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <RefreshCw size={12} /> {statesFound.join(' ➔ ')}
            </span>
          )}

          {modulesFound.length > 0 && modulesFound.map((m, i) => (
            <span key={i} style={{
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#dee4ea',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Wrench size={12} /> {m}
            </span>
          ))}

          {uniqueIncs.length === 0 && uniqueMongoIds.length === 0 && statesFound.length === 0 && modulesFound.length === 0 && (
            <span style={{ fontSize: '11.5px', color: '#8c9bab', fontStyle: 'italic' }}>
              Esperando primer identificador (INC, Mongo ID o Cédula)...
            </span>
          )}
        </div>
      </div>

      {/* ── Card 2: Requerimientos Pendientes (Interactive Cards) ── */}
      <div style={{
        background: '#1d2125',
        border: '1px solid #282e33',
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#facc15',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertTriangle size={13} /> Parámetros Faltantes Requeridos por Ingeniería:
          </span>
          <span style={{ fontSize: '10.5px', color: '#8c9bab' }}>
            Haz clic en un punto para responderlo
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {questions.map((q, idx) => (
            <div
              key={idx}
              onClick={() => onInsertHint && onInsertHint(`[Punto ${idx + 1}]: `)}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.55)';
                e.currentTarget.style.transform = 'translateX(3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.25)';
                e.currentTarget.style.transform = 'translateX(0px)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 900,
                  color: '#facc15',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  flexShrink: 0
                }}>
                  0{idx + 1}
                </span>
                <span style={{ fontSize: '12.5px', color: '#fef08a', lineHeight: 1.4, fontWeight: 500 }}>
                  {q}
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#facc15',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                Responder ✍️
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Card 3: Blueprint Holográfico del Ticket ── */}
      <div style={{
        background: '#161a1d',
        border: '1px dashed #282e33',
        borderRadius: '12px',
        padding: '14px 16px',
        flex: 1,
        minHeight: '130px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#8c9bab',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <FileText size={13} /> Blueprint de Ticket (Estructura en Compilación)
          </span>
          <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>
            4 de 7 Secciones Listas
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #282e33', borderRadius: '6px', padding: '8px 10px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#38bdf8', display: 'block', marginBottom: '2px' }}>
              1. Contexto & Diagnóstico
            </span>
            <span style={{ fontSize: '9.5px', color: '#8c9bab' }}>
              Listo para compilar
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #282e33', borderRadius: '6px', padding: '8px 10px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#22c55e', display: 'block', marginBottom: '2px' }}>
              2. Pasos de Reproducción
            </span>
            <span style={{ fontSize: '9.5px', color: '#8c9bab' }}>
              Extraídos del incidente
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #282e33', borderRadius: '6px', padding: '8px 10px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#f59e0b', display: 'block', marginBottom: '2px' }}>
              3. Data Patch MongoDB
            </span>
            <span style={{ fontSize: '9.5px', color: '#f59e0b' }}>
              Requiere ObjectId exacto
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #282e33', borderRadius: '6px', padding: '8px 10px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#a855f7', display: 'block', marginBottom: '2px' }}>
              4. Criterios DoD Jira
            </span>
            <span style={{ fontSize: '9.5px', color: '#8c9bab' }}>
              Generación automática
            </span>
          </div>
        </div>

        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          borderRadius: '6px',
          background: 'rgba(56, 189, 248, 0.06)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={14} color="#38bdf8" />
          <span style={{ fontSize: '11px', color: '#dee4ea', lineHeight: 1.3 }}>
            Al responder los puntos faltantes a la izquierda, la IA completará el Data Patch de base de datos y desbloqueará las tarjetas interactivas de Jira.
          </span>
        </div>
      </div>
    </div>
  );
}



function SectionEditForm({ value, onChange, onSave, onCancel, isCode = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }} className="no-export">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            onSave();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        rows={Math.max(4, Math.min(14, (value || '').split('\n').length + 1))}
        style={{
          width: '100%',
          background: '#0d1117',
          border: '1px solid #38bdf8',
          borderRadius: '6px',
          padding: '10px 12px',
          color: '#dee4ea',
          fontSize: '13px',
          fontFamily: isCode ? "'JetBrains Mono', 'Fira Code', monospace" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          lineHeight: '1.5',
          outline: 'none',
          boxShadow: '0 0 12px rgba(56, 189, 248, 0.2)',
          resize: 'vertical',
          boxSizing: 'border-box'
        }}
        autoFocus
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '10.5px', color: '#8c9bab' }}>
          <kbd style={{ background: '#21262d', padding: '1px 5px', borderRadius: '3px', border: '1px solid #30363d', color: '#c9d1d9' }}>Ctrl + Enter</kbd> guardar · <kbd style={{ background: '#21262d', padding: '1px 5px', borderRadius: '3px', border: '1px solid #30363d', color: '#c9d1d9' }}>Esc</kbd> cancelar
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid #30363d',
              borderRadius: '4px',
              padding: '4px 10px',
              color: '#c9d1d9',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s'
            }}
          >
            <X size={12} /> Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 12px',
              color: '#022c22',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s'
            }}
          >
            <Check size={12} strokeWidth={2.5} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JiraEscalationView() {
  const [apiKey, setApiKey] = useLocalStorage('gemini_api_key', '');
  const [aiModel] = useLocalStorage('gemini_model', DEFAULT_AI_MODEL);
  
  const [inputValue, setInputValue] = useLocalStorage('jira_escalation_input', '');
  const [conversation, setConversation] = useLocalStorage('jira_escalation_conversation', []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTicket, setCurrentTicket] = useLocalStorage('jira_escalation_ticket', null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const fileInputRef = useRef(null);
  const [lastMissingQuestions, setLastMissingQuestions] = useLocalStorage('jira_escalation_questions', []);
  const [copiedSection, setCopiedSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editDraftValue, setEditDraftValue] = useState('');
  const [processingStage, setProcessingStage] = useState(0);
  const [isExporting, setIsExporting] = useState(null); // null | 'image' | 'pdf'
  const ticketExportRef = useRef(null);

  // Cerrar modal de imagen con tecla Escape
  useEffect(() => {
    const handleKeyDownModal = (e) => {
      if (e.key === 'Escape' && activeLightboxImage) {
        setActiveLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDownModal);
    return () => window.removeEventListener('keydown', handleKeyDownModal);
  }, [activeLightboxImage]);

  const handleStartEdit = (sectionKey, initialText) => {
    setEditingSection(sectionKey);
    setEditDraftValue(initialText || '');
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditDraftValue('');
  };

  const handleSaveEdit = (sectionKey) => {
    if (sectionKey === 'summary') {
      const trimmed = editDraftValue.trim();
      if (!trimmed) {
        toast.warning("El título no puede quedar vacío.");
        return;
      }
      setCurrentTicket(prev => ({
        ...prev,
        summary: trimmed
      }));
    } else {
      setCurrentTicket(prev => ({
        ...prev,
        sections: {
          ...prev?.sections,
          [sectionKey]: editDraftValue
        }
      }));
    }
    setEditingSection(null);
    setEditDraftValue('');
    toast.success("Sección actualizada y guardada.");
  };

  const handleNavigateToStudent360 = (identifier) => {
    if (!identifier) return;
    const cleanId = String(identifier).trim().replace(/^['"]|['"]$/g, '');
    useAppStore.getState().setAiPrefilledData({
      ids: [cleanId]
    });
    useAppStore.getState().setActiveComponent('estudiante-360');
    toast.info(`Cargando estudiante (${cleanId}) en Estudiante 360...`);
  };

  const handleNavigateToBuscarId = (incNum) => {
    if (!incNum) return;
    const cleanInc = String(incNum).replace(/^INC[-_ ]?/i, '').trim();
    useAppStore.getState().setAiPrefilledData({
      intent: 'SEARCH_ID',
      ids: [cleanInc]
    });
    useAppStore.getState().setActiveComponent('buscar-id');
  };

  const handleExportImage = async () => {
    if (!currentTicket || !ticketExportRef.current || isExporting) return;
    try {
      setIsExporting('image');
      await exportTicketAsImage(ticketExportRef.current, currentTicket.summary);
      toast.success("Imagen PNG descargada con éxito.");
    } catch (err) {
      console.error("Error al exportar imagen:", err);
      toast.error("Error al generar imagen del ticket.");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!currentTicket || !ticketExportRef.current || isExporting) return;
    try {
      setIsExporting('pdf');
      await exportTicketAsPdf(ticketExportRef.current, currentTicket.summary);
      toast.success("Documento PDF descargado con éxito.");
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      toast.error("Error al generar PDF del ticket.");
    } finally {
      setIsExporting(null);
    }
  };
  
  // Modos de visualización y formato
  const [previewMode, setPreviewMode] = useLocalStorage('jira_escalation_preview_mode', 'structured');
  const [jiraFormat, setJiraFormat] = useLocalStorage('jira_escalation_format', 'markdown');

  // Modo de vista dinámica: Vista centrada limpia (1 columna) en estado inicial -> Expansión a Dual-Pane al interactuar
  const isDualPane = conversation.length > 0 || isProcessing || currentTicket !== null;

  const inputRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Auto-scroll en el panel de conversación
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isProcessing]);

  // Ciclo dinámico de fases del motor IA durante el procesamiento
  useEffect(() => {
    if (!isProcessing) {
      setProcessingStage(0);
      return;
    }
    const interval = setInterval(() => {
      setProcessingStage((prev) => (prev + 1) % PROCESSING_STAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Cargar API Key de BD si no está en localStorage
  useEffect(() => {
    const loadKey = async () => {
      if (!apiKey) {
        const dbKey = await getGlobalSetting('gemini_api_key');
        if (dbKey) {
          setApiKey(dbKey.replace(/['"]/g, '').trim());
        }
      }
    };
    loadKey();
  }, [apiKey, setApiKey]);

  // Auto-resize del textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      if (inputValue) {
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 180)}px`;
      }
    }
  }, [inputValue]);

  const handleAddImageFile = async (file) => {
    try {
      const processed = await processImageFile(file);
      setPendingAttachments(prev => {
        if (prev.length >= MAX_ATTACHMENTS_PER_TICKET) {
          toast.warning(`Máximo ${MAX_ATTACHMENTS_PER_TICKET} capturas por ticket.`);
          return prev;
        }
        let finalName = processed.name;
        let counter = 1;
        while (prev.some(p => p.name === finalName)) {
          const dotIdx = processed.name.lastIndexOf('.');
          const base = dotIdx !== -1 ? processed.name.substring(0, dotIdx) : processed.name;
          const ext = dotIdx !== -1 ? processed.name.substring(dotIdx) : '.png';
          finalName = `${base}_${++counter}${ext}`;
        }
        return [...prev, { ...processed, name: finalName }];
      });
      toast.success(`📸 Captura "${processed.name}" adjuntada (${processed.sizeKb} KB).`);
    } catch (err) {
      console.error("Error al procesar captura:", err);
      toast.error(err.message || "No se pudo procesar la captura de imagen.");
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await handleAddImageFile(file);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePendingAttachment = (attId) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const handleSend = async (textToSend = null) => {
    const text = (textToSend !== null ? textToSend : inputValue).trim();
    const currentPending = [...pendingAttachments];
    if ((!text && currentPending.length === 0) || isProcessing) return;

    if (!apiKey) {
      toast.error("Configura tu API Key de Gemini en el chat principal o settings.");
      return;
    }

    const displayText = text || (currentPending.length > 0 ? "Adjunto capturas de pantalla para análisis y documentación del caso." : "");
    const updatedConversation = [
      ...conversation, 
      { 
        role: 'user', 
        text: displayText,
        attachments: currentPending 
      }
    ];
    setConversation(updatedConversation);
    setInputValue('');
    setPendingAttachments([]);
    setIsProcessing(true);
    setLastMissingQuestions([]);

    try {
      const cleanKey = apiKey.replace(/['"]/g, '').trim();
      const wasUpdate = currentTicket !== null;
      const result = await processJiraEscalation(updatedConversation, cleanKey, { 
        model: aiModel,
        currentTicket: currentTicket,
        attachments: currentPending
      });

      if (result.status === 'INCOMPLETE') {
        setConversation([
          ...updatedConversation,
          { 
            role: 'ai', 
            text: result.friendlyMessage || "Faltan algunos datos clave para estructurar el reporte de Jira.",
            questions: result.questions || [],
            draftSummary: result.draftSummary
          }
        ]);
        setLastMissingQuestions(result.questions || []);
      } else if (result.status === 'COMPLETE' && result.ticket) {
        setCurrentTicket(result.ticket);
        setConversation([
          ...updatedConversation,
          { 
            role: 'ai', 
            text: result.friendlyMessage || (wasUpdate 
              ? "¡Ticket actualizado con tus apuntes y capturas!" 
              : "¡Ticket de Jira generado exitosamente! Se analizaron e incorporaron las capturas adjuntas."),
            isComplete: true
          }
        ]);
        toast.success(wasUpdate ? "Ticket actualizado con tus apuntes." : "Ticket de Jira estructurado con éxito.");
      }
    } catch (error) {
      console.error("Error al procesar escalamiento:", error);
      toast.error(error.message || "Error al procesar con el asistente.");
      setConversation([
        ...updatedConversation,
        { role: 'ai', text: `⚠️ Error: ${error.message || "No se pudo conectar con el modelo de IA."}` }
      ]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = async (e) => {
    // 1. Detección prioritaria de imágenes del portapapeles
    const items = e.clipboardData?.items;
    if (items) {
      const imageItems = Array.from(items).filter(item => item.kind === 'file' && item.type.startsWith('image/'));
      if (imageItems.length > 0) {
        e.preventDefault();
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) {
            await handleAddImageFile(file);
          }
        }
        return;
      }
    }

    // 2. Detección de tablas para formateo Markdown limpio
    const text = e.clipboardData?.getData('text');
    if (text && isTableContent(text)) {
      const sanitized = sanitizeTableOrDump(text);
      if (sanitized && sanitized !== text) {
        e.preventDefault();
        const textarea = e.target;
        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;
        const current = inputValue || '';
        const newVal = current.substring(0, start) + sanitized + current.substring(end);
        setInputValue(newVal);
        toast.success("📋 Tabla detectada y convertida a Markdown limpio.");
        setTimeout(() => {
          if (textarea) {
            textarea.selectionStart = textarea.selectionEnd = start + sanitized.length;
          }
        }, 0);
      }
    }
  };

  const handleSanitizeInputTable = () => {
    if (!inputValue.trim()) {
      toast.info("Pega primero la tabla o datos en la caja para formatearlos.");
      return;
    }
    if (isTableContent(inputValue)) {
      const formatted = sanitizeTableOrDump(inputValue);
      setInputValue(formatted);
      toast.success("Tabla formateada correctamente a Markdown.");
    } else {
      toast.info("No se detectaron columnas tabuladas o filas en el texto actual.");
    }
  };

  const handleReset = () => {
    setConversation([]);
    setCurrentTicket(null);
    setPendingAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveLightboxImage(null);
    setLastMissingQuestions([]);
    setInputValue('');
    try {
      localStorage.removeItem('jira_escalation_conversation');
      localStorage.removeItem('jira_escalation_ticket');
      localStorage.removeItem('jira_escalation_questions');
      localStorage.removeItem('jira_escalation_input');
    } catch {
      // Ignorar errores en entornos sin acceso a storage
    }
    toast.info("Sesión de escalamiento reiniciada.");
    inputRef.current?.focus();
  };

  const copyToClipboard = async (text, sectionKey) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionKey);
      if (sectionKey === 'full' && currentTicket?.attachments?.length > 0) {
        toast.success("Texto del ticket copiado. Usa el botón 'Copiar' de cada imagen para pegarlas en Jira.");
      } else {
        toast.success("Copiado al portapapeles");
      }
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  };

  const getSectionCopyText = (sectionKey) => {
    if (!currentTicket?.sections) return '';
    const isJira = jiraFormat === 'jiraMarkup';
    const h3 = isJira ? 'h3.' : '###';

    switch (sectionKey) {
      case 'context':
        return `${h3} 📄 Contexto del Caso\n\n${currentTicket.sections.context || ''}`;
      
      case 'validationData': {
        let valText = currentTicket.sections.validationData || currentTicket.sections.affectedEntities || '';
        if (isJira) {
          valText = convertMarkdownTablesToJira(valText);
        }
        return `${h3} 💾 Datos de Validación\n\n${valText}`;
      }
      
      case 'reproductionSteps':
        return `${h3} 🔄 Pasos para Reproducir\n\n${currentTicket.sections.reproductionSteps || ''}`;
      
      case 'behavior': {
        let b = currentTicket.sections.behavior || '';
        if (!b && (currentTicket.sections.observedBehavior || currentTicket.sections.expectedBehavior)) {
          const parts = [];
          if (currentTicket.sections.observedBehavior) parts.push(`❌ Observado:\n${currentTicket.sections.observedBehavior}`);
          if (currentTicket.sections.expectedBehavior) parts.push(`✅ Esperado:\n${currentTicket.sections.expectedBehavior}`);
          b = parts.join('\n\n');
        } else if (b) {
          if (!b.includes('❌') && /observado/i.test(b)) {
            b = b.replace(/(?:Comportamiento\s*)?Observado\s*:?/i, '❌ Observado:');
          }
          if (!b.includes('✅') && /esperado/i.test(b)) {
            b = b.replace(/(?:Comportamiento\s*)?Esperado\s*:?/i, '✅ Esperado:');
          }
        }
        return `${h3} ⚠️ Comportamiento Observado vs Esperado\n\n${b}`;
      }

      case 'solution': {
        let sol = currentTicket.sections.solution || currentTicket.sections.dataPatch || '';
        if (isJira) {
          sol = sol.replace(/```(?:javascript|json|bash|sh|sql)?\n([\s\S]*?)```/g, '{code}\n$1{code}');
        }
        return `${h3} 🛠️ Solución Propuesta / Data Patch\n\n${sol}`;
      }

      case 'technicalDiagnosis':
        return `${h3} 🧠 Diagnóstico Técnico & Causa Raíz Preliminar\n\n${currentTicket.sections.technicalDiagnosis || ''}`;

      case 'acceptanceCriteria':
        return `${h3} 🎯 Criterios de Aceptación (DoD)\n\n${currentTicket.sections.acceptanceCriteria || ''}`;

      default:
        return currentTicket.sections[sectionKey] || '';
    }
  };

  const getRawDescription = () => {
    if (!currentTicket) return '';
    return currentTicket.sections
      ? compileDescription(currentTicket.sections, jiraFormat, currentTicket.attachments || [])
      : (jiraFormat === 'markdown' 
          ? (currentTicket.descriptionMarkdown || currentTicket.description) 
          : (currentTicket.descriptionJiraMarkup || currentTicket.description));
  };

  const getFullTicketText = () => {
    if (!currentTicket) return '';
    const description = getRawDescription();
    if (jiraFormat === 'markdown') {
      return `# ${currentTicket.summary}\n\n${description}`;
    } else {
      return `h1. ${currentTicket.summary}\n\n${description}`;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isDualPane ? '100%' : 'auto',
      maxHeight: isDualPane ? '100%' : 'min(780px, 92vh)',
      width: '100%',
      maxWidth: isDualPane ? '1560px' : '920px',
      margin: isDualPane ? '0 auto' : 'auto',
      boxSizing: 'border-box',
      gap: '12px',
      minHeight: 0,
      flex: isDualPane ? 1 : '0 1 auto',
      transition: 'max-width 1.4s cubic-bezier(0.22, 1, 0.36, 1)'
    }}>
      <style>{`
        @keyframes jiraShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes laserScan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 0.95; }
          85% { opacity: 0.95; }
          100% { top: 96%; opacity: 0; }
        }
        @keyframes aiPulseWave {
          0%, 100% { transform: scaleY(0.3); opacity: 0.45; }
          50% { transform: scaleY(1.3); opacity: 1; }
        }
        @keyframes cyberGlow {
          0%, 100% { box-shadow: 0 0 16px rgba(18, 163, 131, 0.2); border-color: #282e33; }
          50% { box-shadow: 0 0 28px rgba(56, 189, 248, 0.35); border-color: rgba(56, 189, 248, 0.5); }
        }
        @keyframes beaconPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }
        @keyframes smoothCardEntrance {
          0% { opacity: 0; transform: translateY(16px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0px) scale(1); }
        }
        .jira-shimmer-bar {
          background: linear-gradient(90deg, #22272b 0%, #2c333a 50%, #22272b 100%);
          background-size: 200% 100%;
          animation: jiraShimmer 2.6s infinite linear;
        }
        .jira-shimmer-bar-code {
          background: linear-gradient(90deg, rgba(18, 163, 131, 0.12) 0%, rgba(56, 189, 248, 0.24) 50%, rgba(18, 163, 131, 0.12) 100%);
          background-size: 200% 100%;
          animation: jiraShimmer 2.4s infinite linear;
        }
        @keyframes floatCore {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-5px) scale(1.02); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes pulseCoreGlow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.95; }
        }
        @keyframes rotateHud {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rotateHudReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin 5s linear infinite;
        }
        @keyframes materializeSheen {
          0% {
            box-shadow: 0 0 0 rgba(18, 163, 131, 0), inset 0 0 0 rgba(56, 189, 248, 0);
          }
          35% {
            box-shadow: 0 0 32px rgba(18, 163, 131, 0.4), 0 0 16px rgba(56, 189, 248, 0.4);
            border-color: rgba(56, 189, 248, 0.6);
          }
          100% {
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border-color: var(--glass-border);
          }
        }
        .jira-input-capsule:focus-within {
          border-color: rgba(52, 211, 153, 0.45) !important;
          box-shadow: 0 0 24px rgba(16, 185, 129, 0.2), 0 8px 30px rgba(0, 0, 0, 0.35) !important;
        }
        .jira-input-capsule.editing:focus-within {
          border-color: rgba(56, 189, 248, 0.5) !important;
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.25), 0 8px 30px rgba(0, 0, 0, 0.35) !important;
        }
        .jira-input-capsule textarea::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* ── Top Header ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface-low)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '8px 16px',
        backdropFilter: 'blur(16px)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(18,163,131,0.2) 0%, rgba(6,160,128,0.35) 100%)',
            border: '1px solid var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Ticket size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--on-surface)' }}>
                Escalamiento Jira (Nivel 2 / Ingeniería)
              </h2>
              <span style={{
                background: 'rgba(18, 163, 131, 0.15)',
                border: '1px solid rgba(18, 163, 131, 0.3)',
                color: 'var(--primary)',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                textTransform: 'uppercase'
              }}>
                Admin Tool
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
              Genera tickets de soporte N3 con resolución de BD, propuesta de Data Patch y Criterios de Aceptación (DoD).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isDualPane && (
            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '6px 14px',
                color: 'var(--on-surface-variant)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.25s',
                animation: 'fadeIn 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ff5263'; e.currentTarget.style.borderColor = 'rgba(255,82,99,0.3)'; e.currentTarget.style.background = 'rgba(255,82,99,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--on-surface-variant)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
              title="Limpiar caso e iniciar uno nuevo"
            >
              <RefreshCw size={13} /> Nuevo Caso
            </button>
          )}
        </div>
      </div>

      {/* ── Main Workspace (Morphs Between Centered Single View and Dual-Pane) ── */}
      <div style={{
        display: 'flex',
        gap: isDualPane ? '14px' : '0px',
        flex: isDualPane ? '1 1 0%' : '0 1 auto',
        minHeight: 0,
        overflow: 'hidden',
        width: '100%',
        transition: 'gap 1.4s cubic-bezier(0.22, 1, 0.36, 1)'
      }}>

        {/* ── Left Pane: Conversational Intake & Questions ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-low)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          overflow: 'hidden',
          minHeight: 0,
          height: '100%',
          flex: isDualPane ? '0 0 calc(45% - 7px)' : '1 1 100%',
          maxWidth: isDualPane ? 'calc(45% - 7px)' : '100%',
          minWidth: 0,
          boxShadow: isDualPane ? '0 12px 36px rgba(0,0,0,0.35)' : '0 16px 48px rgba(0,0,0,0.45)',
          transition: 'flex 1.4s cubic-bezier(0.22, 1, 0.36, 1), max-width 1.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 1.4s cubic-bezier(0.22, 1, 0.36, 1)'
        }}>
          {/* Messages list */}
          <div style={{
            flex: isDualPane ? 1 : '0 1 auto',
            minHeight: 0,
            overflowY: isDualPane ? 'auto' : 'visible',
            padding: isDualPane ? '20px 20px 14px' : '14px 16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: isDualPane ? '14px' : '10px'
          }}>
            {conversation.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '4px 6px',
                animation: 'fadeIn 0.4s ease'
              }}>
                {/* ── Futuristic Hero Cockpit Banner ── */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(18, 163, 131, 0.09) 0%, rgba(17, 24, 39, 0.75) 50%, rgba(10, 10, 10, 0.9) 100%)',
                  border: '1px solid rgba(18, 163, 131, 0.3)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Subtle ambient light beam */}
                  <div style={{
                    position: 'absolute',
                    top: '-60px',
                    right: '-40px',
                    width: '180px',
                    height: '180px',
                    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                    pointerEvents: 'none'
                  }} />

                  {/* Left: Sci-Fi Concentric HUD Arc Reactor Core */}
                  <div style={{
                    position: 'relative',
                    width: '105px',
                    height: '105px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Rotating Concentric SVG Ring 1 */}
                    <svg
                      viewBox="0 0 120 120"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        animation: 'rotateHud 18s linear infinite',
                        pointerEvents: 'none'
                      }}
                    >
                      <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(18, 163, 131, 0.4)" strokeWidth="1.5" strokeDasharray="8 6 3 6" />
                      <circle cx="60" cy="60" r="51" fill="none" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1" strokeDasharray="16 12" />
                    </svg>

                    {/* Rotating Concentric SVG Ring 2 (Reverse) */}
                    <svg
                      viewBox="0 0 120 120"
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        width: 'calc(100% - 8px)',
                        height: 'calc(100% - 8px)',
                        animation: 'rotateHudReverse 24s linear infinite',
                        pointerEvents: 'none'
                      }}
                    >
                      <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="4 8" />
                    </svg>

                    {/* Masked Circular 3D Artwork */}
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid rgba(18, 163, 131, 0.65)',
                      boxShadow: '0 0 20px rgba(18, 163, 131, 0.4), inset 0 0 15px rgba(0,0,0,0.8)',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <img
                        src="/jira_ai_core.jpg"
                        alt="AI Engineering Core"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>

                    {/* Core Status Pill */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-3px',
                      zIndex: 3,
                      background: '#0a0d10',
                      border: '1px solid rgba(18, 163, 131, 0.6)',
                      borderRadius: '100px',
                      padding: '1.5px 7px',
                      fontSize: '8.5px',
                      fontWeight: 800,
                      color: '#4ade80',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.7)',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        animation: 'beaconPulse 1.4s infinite'
                      }} />
                      CORE V3.1
                    </div>
                  </div>

                  {/* Right: Cockpit Info & Tech Badges */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--primary)',
                        background: 'rgba(18, 163, 131, 0.14)',
                        border: '1px solid rgba(18, 163, 131, 0.35)',
                        padding: '1px 7px',
                        borderRadius: '4px'
                      }}>
                        N2 / N3 Engineering
                      </span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#38bdf8',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <Cpu size={11} /> Gemini 2.5
                      </span>
                    </div>

                    <h3 style={{
                      margin: '0 0 4px',
                      fontSize: '15.5px',
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2
                    }}>
                      Escalamiento a Jira Inteligente
                    </h3>

                    <p style={{
                      margin: '0 0 8px',
                      fontSize: '11.5px',
                      color: 'var(--on-surface-variant)',
                      lineHeight: 1.4
                    }}>
                      Pega mensajes de Slack, logs o reportes técnicos. La IA extraerá IDs, diagnosticará la causa raíz y estructurará el ticket con Data Patch y DoD.
                    </p>

                    {/* Quick Capabilities Tag Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#dee4ea',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Database size={9} color="#12a383" /> Mongo Regex
                      </span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#dee4ea',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Code2 size={9} color="#38bdf8" /> Data Patch
                      </span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#dee4ea',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <CheckSquare size={9} color="#f59e0b" /> DoD Jira
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── 3-Column Bento Launchpad for Quick Examples ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Sparkles size={11} /> Casos Frecuentes Preconfigurados:
                    </span>
                    <span style={{ fontSize: '10px', color: '#8c9bab' }}>
                      Selecciona uno para probar el asistente
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px'
                  }}>
                    {EXAMPLE_TEMPLATES.map((tmpl, idx) => {
                      const IconComponent = tmpl.icon || FileText;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSend(tmpl.prompt)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '120px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${tmpl.tagColor}0a`;
                            e.currentTarget.style.borderColor = `${tmpl.tagColor}55`;
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.4), 0 0 16px ${tmpl.tagColor}22`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                            e.currentTarget.style.transform = 'translateY(0px)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {/* Top row: Icon orb + category tag */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              background: `${tmpl.tagColor}18`,
                              border: `1px solid ${tmpl.tagColor}40`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: tmpl.tagColor
                            }}>
                              <IconComponent size={14} />
                            </div>
                            <span style={{
                              fontSize: '8.5px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: `${tmpl.tagColor}15`,
                              color: tmpl.tagColor,
                              border: `1px solid ${tmpl.tagColor}30`
                            }}>
                              {tmpl.tag}
                            </span>
                          </div>

                          {/* Body: Title & concise summary */}
                          <div>
                            <h4 style={{ margin: '0 0 3px', fontSize: '12px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
                              {tmpl.title}
                            </h4>
                            <p style={{
                              margin: 0,
                              fontSize: '10.5px',
                              color: 'var(--on-surface-variant)',
                              lineHeight: 1.35,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {tmpl.summary}
                            </p>
                          </div>

                          {/* Bottom: Action trigger link */}
                          <div style={{
                            marginTop: '10px',
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: tmpl.tagColor
                          }}>
                            <span>Cargar caso</span>
                            <span style={{ fontSize: '12px' }}>↗</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Subtle Bottom Assistant Hint ── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '10.5px',
                  color: '#8c9bab',
                  padding: '2px 0'
                }}>
                  <Terminal size={12} color="var(--primary)" />
                  <span>
                    O pega cualquier hilo caótico de Slack o consulta en la caja inferior para autodetectar datos.
                  </span>
                </div>
              </div>
            ) : (
              conversation.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      gap: '5px',
                      animation: 'smoothCardEntrance 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
                    }}
                  >
                    {/* Header with avatar & role */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0 4px',
                      flexDirection: isUser ? 'row-reverse' : 'row'
                    }}>
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: isUser 
                          ? 'linear-gradient(135deg, rgba(18, 163, 131, 0.4) 0%, rgba(6, 160, 128, 0.6) 100%)' 
                          : 'linear-gradient(135deg, rgba(56, 189, 248, 0.35) 0%, rgba(14, 165, 233, 0.6) 100%)',
                        border: isUser ? '1px solid var(--primary)' : '1px solid #38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '10px',
                        boxShadow: isUser ? '0 0 8px rgba(18, 163, 131, 0.4)' : '0 0 8px rgba(56, 189, 248, 0.4)'
                      }}>
                        {isUser ? <User size={12} /> : <Bot size={12} />}
                      </div>
                      <span style={{ fontSize: '11px', color: isUser ? '#34d399' : '#38bdf8', fontWeight: 700 }}>
                        {isUser ? 'Admin (Tú)' : 'Asistente Jira · Lead N3'}
                      </span>
                    </div>

                    {/* Bubble Body */}
                    <div style={{
                      maxWidth: '92%',
                      padding: '12px 16px',
                      borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                      background: isUser 
                        ? 'linear-gradient(135deg, rgba(18, 163, 131, 0.16) 0%, rgba(10, 30, 24, 0.8) 100%)' 
                        : 'linear-gradient(135deg, rgba(22, 27, 34, 0.9) 0%, rgba(15, 23, 42, 0.85) 100%)',
                      border: isUser ? '1px solid rgba(18, 163, 131, 0.45)' : '1px solid rgba(56, 189, 248, 0.3)',
                      color: 'var(--on-surface)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      boxShadow: isUser ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.4)',
                      fontFamily: isUser ? "'Nunito', sans-serif" : "'Space Grotesk', sans-serif"
                    }}>
                      {msg.text}

                      {/* Miniaturas de capturas adjuntas enviadas en este mensaje */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                          {msg.attachments.map((att, attI) => (
                            <div
                              key={att.id || attI}
                              onClick={() => setActiveLightboxImage(att)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(0, 0, 0, 0.35)',
                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                borderRadius: '5px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)'; }}
                              title="Clic para ampliar captura"
                            >
                              {att.dataUrl && (
                                <img
                                  src={att.dataUrl}
                                  alt={att.name}
                                  style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '3px' }}
                                />
                              )}
                              <span style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 600, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {att.name}
                              </span>
                              {att.sizeKb && (
                                <span style={{ fontSize: '9px', color: '#94a3b8' }}>({att.sizeKb}KB)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.questions && msg.questions.length > 0 && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px 14px',
                          background: 'rgba(234, 179, 8, 0.08)',
                          border: '1px solid rgba(234, 179, 8, 0.35)',
                          borderRadius: '10px',
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontSize: '11.5px', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <AlertTriangle size={13} /> Parámetros indispensables para resolución:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {msg.questions.map((q, qIdx) => (
                              <div
                                key={qIdx}
                                onClick={() => {
                                  setInputValue(prev => prev ? `${prev}\n[Punto ${qIdx + 1}]: ` : `[Punto ${qIdx + 1}]: `);
                                  inputRef.current?.focus();
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '8px',
                                  fontSize: '12px',
                                  color: '#fef08a',
                                  background: 'rgba(234, 179, 8, 0.05)',
                                  border: '1px solid rgba(234, 179, 8, 0.15)',
                                  borderRadius: '6px',
                                  padding: '6px 8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234, 179, 8, 0.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(234, 179, 8, 0.05)'; }}
                                title="Clic para responder este punto en el chat"
                              >
                                <span style={{
                                  fontSize: '9px',
                                  fontWeight: 900,
                                  background: 'rgba(234, 179, 8, 0.25)',
                                  border: '1px solid rgba(234, 179, 8, 0.4)',
                                  color: '#facc15',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  marginTop: '1px',
                                  flexShrink: 0
                                }}>
                                  0{qIdx + 1}
                                </span>
                                <span style={{ lineHeight: 1.35, flex: 1 }}>{q}</span>
                                <span style={{ fontSize: '9.5px', color: '#facc15', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  ✍️
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isProcessing && (
              <ProcessingChatBubble stage={processingStage} />
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Area (Unified Capsule matching AI Assistant) */}
          <div style={{
            flexShrink: 0,
            padding: '12px 16px 14px',
            borderTop: '1px solid var(--glass-border)',
            background: 'rgba(5, 8, 15, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Active Ticket Modification Mode Banner */}
            {currentTicket && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.08) 0%, rgba(18, 163, 131, 0.08) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#38bdf8',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} color="#38bdf8" />
                  <span><strong>Modo Edición:</strong> Tus mensajes refinarán y actualizarán este ticket.</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    color: '#8c9bab',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ff5263';
                    e.currentTarget.style.background = 'rgba(255, 82, 99, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#8c9bab';
                    e.currentTarget.style.background = 'none';
                  }}
                  title="Limpiar caso e iniciar uno nuevo"
                >
                  ¿Otro caso? <strong style={{ textDecoration: 'underline', color: 'inherit' }}>Nuevo Caso 🔄</strong>
                </button>
              </div>
            )}

            {/* Unified Capsule Container */}
            <div
              className={`jira-input-capsule ${currentTicket ? 'editing' : ''}`}
              style={{
                background: 'linear-gradient(180deg, rgba(16, 24, 39, 0.75) 0%, rgba(9, 14, 24, 0.9) 100%)',
                border: currentTicket ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '12px 14px 10px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                transition: 'border-color 0.25s ease, box-shadow 0.25s ease'
              }}
            >
              {/* Barra de Capturas de Pantalla Pendientes */}
              {pendingAttachments.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  padding: '6px 8px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  borderRadius: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.25)'
                }}>
                  <span style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ImageIcon size={12} /> Capturas ({pendingAttachments.length}/{MAX_ATTACHMENTS_PER_TICKET}):
                  </span>
                  {pendingAttachments.map(att => (
                    <div 
                      key={att.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(30, 41, 59, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        padding: '2px 7px',
                        fontSize: '10.5px',
                        color: '#e2e8f0'
                      }}
                    >
                      <img 
                        src={att.dataUrl} 
                        alt={att.name} 
                        style={{ width: '22px', height: '22px', objectFit: 'cover', borderRadius: '3px', cursor: 'pointer' }}
                        onClick={() => setActiveLightboxImage(att)}
                        title="Clic para previsualizar"
                      />
                      <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {att.name}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '9.5px' }}>({att.sizeKb}KB)</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePendingAttachment(att.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '1px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '2px'
                        }}
                        title="Quitar captura"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={
                  lastMissingQuestions.length > 0 
                    ? "Responde las preguntas o aclara los datos faltantes..." 
                    : currentTicket 
                      ? "Escribe apuntes, cambios o pega capturas adicionales con Ctrl+V..." 
                      : "Escribe o pega el caso aquí (o pega capturas de pantalla con Ctrl+V)..."
                }
                rows={2}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--on-surface)',
                  fontSize: '13.5px',
                  fontFamily: "'Space Grotesk', sans-serif",
                  minHeight: '34px',
                  maxHeight: '180px',
                  resize: 'none',
                  lineHeight: '1.5',
                  padding: 0,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              />

              {/* Capsule Inner Toolbar (Helper Chips on Left + Integrated Send/Update Button on Right) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setInputValue(prev => prev ? `${prev}\nObjectId: ` : 'ObjectId: ');
                      inputRef.current?.focus();
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.22)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: '#38bdf8',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.18)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'; }}
                    title="Insertar campo ObjectId de MongoDB"
                  >
                    <Code2 size={11} /> + ObjectId
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputValue(prev => prev ? `${prev}\nCédula: ` : 'Cédula: ');
                      inputRef.current?.focus();
                    }}
                    style={{
                      background: 'rgba(18, 163, 131, 0.08)',
                      border: '1px solid rgba(18, 163, 131, 0.22)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: '#34d399',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(18, 163, 131, 0.18)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(18, 163, 131, 0.08)'; }}
                    title="Insertar campo Cédula"
                  >
                    <User size={11} /> + Cédula
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputValue(prev => prev ? `${prev}\nError devuelto: ` : 'Error devuelto: ');
                      inputRef.current?.focus();
                    }}
                    style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.22)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: '#facc15',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.18)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)'; }}
                    title="Insertar plantilla Error / Log"
                  >
                    <AlertTriangle size={11} /> + Error / Log
                  </button>
                  <button
                    type="button"
                    onClick={handleSanitizeInputTable}
                    style={{
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.22)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: '#c084fc',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.18)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)'; }}
                    title="Limpiar y formatear tabla pegada de Excel, Sheets, terminal o SQL"
                  >
                    <Table size={11} /> Formatear Tabla
                  </button>

                  {/* Botón para adjuntar capturas / imágenes */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: pendingAttachments.length > 0 ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                      border: pendingAttachments.length > 0 ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: pendingAttachments.length > 0 ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.18)'; e.currentTarget.style.color = '#38bdf8'; }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.background = pendingAttachments.length > 0 ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = pendingAttachments.length > 0 ? '#38bdf8' : '#94a3b8';
                    }}
                    title="Adjuntar captura de pantalla (o pega directamente con Ctrl+V)"
                  >
                    <ImageIcon size={11} /> {pendingAttachments.length > 0 ? `Capturas (${pendingAttachments.length})` : 'Adjuntar Captura'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                <button
                  onClick={() => handleSend()}
                  disabled={isProcessing || (!inputValue.trim() && pendingAttachments.length === 0)}
                  style={{
                    background: ((!inputValue.trim() && pendingAttachments.length === 0) || isProcessing) 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : (currentTicket 
                          ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' 
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'),
                    color: ((!inputValue.trim() && pendingAttachments.length === 0) || isProcessing) 
                      ? 'rgba(255, 255, 255, 0.25)' 
                      : (currentTicket ? '#022135' : '#022c22'),
                    border: 'none',
                    borderRadius: currentTicket ? '100px' : '50%',
                    width: currentTicket ? 'auto' : '36px',
                    height: '36px',
                    padding: currentTicket ? '0 14px' : '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: ((!inputValue.trim() && pendingAttachments.length === 0) || isProcessing) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: ((!inputValue.trim() && pendingAttachments.length === 0) || isProcessing) 
                      ? 'none' 
                      : (currentTicket 
                          ? '0 4px 14px rgba(56, 189, 248, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                          : '0 4px 14px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'),
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if ((inputValue.trim() || pendingAttachments.length > 0) && !isProcessing) {
                      e.currentTarget.style.transform = 'scale(1.06)';
                      e.currentTarget.style.boxShadow = currentTicket 
                        ? '0 6px 20px rgba(56, 189, 248, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)' 
                        : '0 6px 20px rgba(16, 185, 129, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (inputValue.trim() && !isProcessing) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = currentTicket 
                        ? '0 4px 14px rgba(56, 189, 248, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                        : '0 4px 14px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  title={currentTicket ? "Actualizar ticket" : "Enviar mensaje"}
                >
                  {isProcessing ? (
                    <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : currentTicket ? (
                    <>
                      <Sparkles size={14} color="#022135" />
                      <span>Actualizar</span>
                    </>
                  ) : (
                    <ArrowRight size={17} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Pane: Live Jira Ticket Preview Card / Synthesis HUD ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-low)',
          border: isDualPane ? '1px solid var(--glass-border)' : '0px solid transparent',
          borderRadius: '16px',
          overflow: 'hidden',
          minHeight: 0,
          height: '100%',
          flex: isDualPane ? '0 0 calc(55% - 7px)' : '0 0 0%',
          maxWidth: isDualPane ? 'calc(55% - 7px)' : '0px',
          minWidth: 0,
          opacity: isDualPane ? 1 : 0,
          transform: isDualPane ? 'translateX(0) scale(1)' : 'translateX(80px) scale(0.95)',
          filter: isDualPane ? 'blur(0px)' : 'blur(10px)',
          pointerEvents: isDualPane ? 'auto' : 'none',
          boxShadow: isDualPane ? '0 12px 36px rgba(0,0,0,0.35)' : 'none',
          animation: isDualPane ? 'materializeSheen 2.4s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          transition: 'flex 1.4s cubic-bezier(0.22, 1, 0.36, 1), max-width 1.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1), transform 1.4s cubic-bezier(0.22, 1, 0.36, 1), filter 1.2s ease, border-color 0.9s ease'
        }}>
          {/* Header of Preview */}
          <div style={{
            flexShrink: 0,
            padding: '10px 16px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} color="var(--primary)" />
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--on-surface)' }}>
                  {currentTicket ? 'Ticket Jira Estructurado' : 'Panel de Telemetría & Diagnóstico'}
                </span>
              </div>
              <span style={{
                fontSize: '9.5px',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '100px',
                background: currentTicket ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                color: currentTicket ? '#4ade80' : '#facc15',
                border: currentTicket ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: currentTicket ? '#22c55e' : '#facc15',
                  animation: 'beaconPulse 1.5s infinite'
                }} />
                {currentTicket ? 'Completado · Listo' : (isProcessing ? 'Sintetizando...' : 'Recolección en Curso')}
              </span>
            </div>

            {currentTicket && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Botón Descargar Imagen */}
                <button
                  onClick={handleExportImage}
                  disabled={isExporting !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '8px',
                    padding: '5px 11px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: isExporting !== null ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isExporting !== null ? 0.6 : 1
                  }}
                  title="Descargar ticket como imagen PNG en alta resolución"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)'; }}
                >
                  {isExporting === 'image' ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <ImageIcon size={13} />
                  )}
                  {isExporting === 'image' ? 'Generando...' : 'Imagen'}
                </button>

                {/* Botón Descargar PDF */}
                <button
                  onClick={handleExportPdf}
                  disabled={isExporting !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(168, 85, 247, 0.12)',
                    color: '#c084fc',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    borderRadius: '8px',
                    padding: '5px 11px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: isExporting !== null ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isExporting !== null ? 0.6 : 1
                  }}
                  title="Descargar ticket como documento PDF profesional"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.22)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)'; }}
                >
                  {isExporting === 'pdf' ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <FileDown size={13} />
                  )}
                  {isExporting === 'pdf' ? 'Generando...' : 'PDF'}
                </button>

                {/* Botón Copiar Ticket */}
                <button
                  onClick={() => copyToClipboard(getFullTicketText(), 'full')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: copiedSection === 'full' ? '#22c55e' : 'var(--primary)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title="Copiar texto completo formateado para Jira"
                >
                  {copiedSection === 'full' ? <Check size={13} /> : <Copy size={13} />}
                  {copiedSection === 'full' ? '¡Copiado!' : 'Copiar Ticket'}
                </button>
              </div>
            )}
          </div>

          {/* Ticket Content Preview Area */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '16px'
          }}>
            {isProcessing ? (
              <TicketSynthesisSkeleton stage={processingStage} />
            ) : !currentTicket ? (
              conversation.length > 0 ? (
                <TicketDraftRadar 
                  conversation={conversation}
                  lastQuestions={lastMissingQuestions}
                  onInsertHint={(hint) => {
                    setInputValue(prev => prev ? `${prev}\n${hint}` : hint);
                    inputRef.current?.focus();
                  }}
                />
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: 'var(--on-surface-variant)',
                  padding: '24px'
                }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '27px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px'
                  }}>
                    <Ticket size={26} opacity={0.4} />
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '14.5px', color: 'var(--on-surface)' }}>
                    Aún no hay ticket generado
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px', maxWidth: '340px', lineHeight: 1.5 }}>
                    Escribe o pega el caso a la izquierda. Se generará automáticamente el ticket con formato de ingeniería listo para Jira.
                  </p>
                </div>
              )
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                animation: 'smoothCardEntrance 1.0s cubic-bezier(0.22, 1, 0.36, 1)'
              }}>

                {/* Visual Structured Jira Cloud Document Mode */}
                {previewMode === 'structured' ? (
                  <div
                    ref={ticketExportRef}
                    style={{
                      background: '#1d2125',
                      border: '1px solid #282e33',
                      borderRadius: '8px',
                      padding: '22px 26px',
                      color: '#dee4ea',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px',
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                    }}
                  >

                    {/* Summary / Title Box */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                      paddingBottom: '14px',
                      borderBottom: '1px solid #282e33'
                    }}>
                      {editingSection === 'summary' ? (
                        <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }} className="no-export">
                          <input
                            type="text"
                            value={editDraftValue}
                            onChange={(e) => setEditDraftValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit('summary');
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            style={{
                              flex: 1,
                              background: '#0d1117',
                              border: '1px solid #38bdf8',
                              borderRadius: '6px',
                              padding: '7px 11px',
                              color: '#ffffff',
                              fontSize: '14.5px',
                              fontWeight: 700,
                              outline: 'none',
                              boxShadow: '0 0 10px rgba(56, 189, 248, 0.25)'
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit('summary')}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              color: '#022c22',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={12} strokeWidth={2.5} /> Guardar
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid #30363d',
                              borderRadius: '4px',
                              padding: '6px 10px',
                              color: '#c9d1d9',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ flex: 1 }}>
                            <span style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#8c9bab', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                              Título del Ticket
                            </span>
                            <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: '#ffffff', lineHeight: 1.4 }}>
                              {currentTicket.summary}
                            </h3>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-export">
                            <button
                              onClick={() => handleStartEdit('summary', currentTicket.summary)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid #282e33',
                                borderRadius: '4px',
                                padding: '4px 9px',
                                color: '#8c9bab',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = '#8c9bab'; e.currentTarget.style.borderColor = '#282e33'; }}
                              title="Editar título manualmente"
                            >
                              <Pencil size={11} /> Editar
                            </button>
                            <button
                              onClick={() => copyToClipboard(currentTicket.summary, 'summary')}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid #282e33',
                                borderRadius: '4px',
                                padding: '4px 9px',
                                color: copiedSection === 'summary' ? '#4ade80' : '#8c9bab',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}
                              title="Copiar título de Jira"
                            >
                              {copiedSection === 'summary' ? <Check size={11} /> : <Copy size={11} />}
                              {copiedSection === 'summary' ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>



                    {/* Section 1: Contexto del Caso */}
                    {(currentTicket.sections?.context || editingSection === 'context') && (
                      <div style={{
                        background: '#161a1d',
                        border: '1px solid #282e33',
                        borderRadius: '6px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={15} color="#38bdf8" />
                            <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Contexto del Caso
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-export">
                            <button
                              onClick={() => editingSection === 'context' ? handleCancelEdit() : handleStartEdit('context', currentTicket.sections?.context || '')}
                              style={{
                                background: editingSection === 'context' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid #282e33',
                                borderRadius: '4px',
                                padding: '2px 7px',
                                color: editingSection === 'context' ? '#38bdf8' : '#8c9bab',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                              title="Editar manualmente el contexto"
                            >
                              <Pencil size={10} /> Editar
                            </button>
                            <button
                              onClick={() => copyToClipboard(getSectionCopyText('context'), 'context')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedSection === 'context' ? '#4ade80' : '#8c9bab',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '3px'
                              }}
                              title="Copiar Contexto con Icono"
                            >
                              {copiedSection === 'context' ? <Check size={11} /> : <Copy size={11} />}
                              {copiedSection === 'context' ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                        {editingSection === 'context' ? (
                          <SectionEditForm
                            value={editDraftValue}
                            onChange={setEditDraftValue}
                            onSave={() => handleSaveEdit('context')}
                            onCancel={handleCancelEdit}
                          />
                        ) : (
                          <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#dee4ea' }}>
                            {currentTicket.sections?.context}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section 2: Datos de Validación */}
                    {(currentTicket.sections?.validationData || currentTicket.sections?.affectedEntities || editingSection === 'validationData') && (
                      <div style={{
                        background: '#161a1d',
                        border: '1px solid #282e33',
                        borderRadius: '6px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Database size={15} color="#c084fc" />
                            <span style={{ color: '#c084fc', fontWeight: 800, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Datos de Validación
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-export">
                            <button
                              onClick={() => editingSection === 'validationData' ? handleCancelEdit() : handleStartEdit('validationData', currentTicket.sections?.validationData || currentTicket.sections?.affectedEntities || '')}
                              style={{
                                background: editingSection === 'validationData' ? 'rgba(192, 132, 252, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid #282e33',
                                borderRadius: '4px',
                                padding: '2px 7px',
                                color: editingSection === 'validationData' ? '#c084fc' : '#8c9bab',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                              title="Editar manualmente datos de validación"
                            >
                              <Pencil size={10} /> Editar
                            </button>
                            <button
                              onClick={() => copyToClipboard(getSectionCopyText('validationData'), 'validationData')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedSection === 'validationData' ? '#4ade80' : '#8c9bab',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '3px'
                              }}
                              title="Copiar Datos de Validación con Icono"
                            >
                              {copiedSection === 'validationData' ? <Check size={11} /> : <Copy size={11} />}
                              {copiedSection === 'validationData' ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                        {editingSection === 'validationData' ? (
                          <SectionEditForm
                            value={editDraftValue}
                            onChange={setEditDraftValue}
                            onSave={() => handleSaveEdit('validationData')}
                            onCancel={handleCancelEdit}
                          />
                        ) : (
                          renderValidationData(
                            currentTicket.sections?.validationData || currentTicket.sections?.affectedEntities,
                            handleNavigateToStudent360,
                            handleNavigateToBuscarId
                          )
                        )}
                      </div>
                    )}

                    {/* Section 3: Pasos para Reproducir */}
                    {(currentTicket.sections?.reproductionSteps || editingSection === 'reproductionSteps') && (
                      <div style={{
                        background: '#161a1d',
                        border: '1px solid #282e33',
                        borderRadius: '6px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={15} color="#34d399" />
                            <span style={{ color: '#34d399', fontWeight: 800, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Pasos para Reproducir
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-export">
                            <button
                              onClick={() => editingSection === 'reproductionSteps' ? handleCancelEdit() : handleStartEdit('reproductionSteps', currentTicket.sections?.reproductionSteps || '')}
                              style={{
                                background: editingSection === 'reproductionSteps' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid #282e33',
                                borderRadius: '4px',
                                padding: '2px 7px',
                                color: editingSection === 'reproductionSteps' ? '#34d399' : '#8c9bab',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                              title="Editar pasos para reproducir"
                            >
                              <Pencil size={10} /> Editar
                            </button>
                            <button
                              onClick={() => copyToClipboard(getSectionCopyText('reproductionSteps'), 'reproductionSteps')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedSection === 'reproductionSteps' ? '#4ade80' : '#8c9bab',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '3px'
                              }}
                              title="Copiar Pasos con Icono"
                            >
                              {copiedSection === 'reproductionSteps' ? <Check size={11} /> : <Copy size={11} />}
                              {copiedSection === 'reproductionSteps' ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                        {editingSection === 'reproductionSteps' ? (
                          <SectionEditForm
                            value={editDraftValue}
                            onChange={setEditDraftValue}
                            onSave={() => handleSaveEdit('reproductionSteps')}
                            onCancel={handleCancelEdit}
                          />
                        ) : (
                          renderReproductionSteps(currentTicket.sections?.reproductionSteps)
                        )}
                      </div>
                    )}

                    {/* Section 4: Comportamiento Observado vs Esperado */}
                    {(currentTicket.sections?.behavior || currentTicket.sections?.observedBehavior || currentTicket.sections?.expectedBehavior || editingSection === 'behavior') && (
                      <div style={{
                        background: '#161a1d',
                        border: '1px solid #282e33',
                        borderRadius: '6px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={15} color="#f87171" />
                            <span style={{ color: '#f87171', fontWeight: 800, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Comportamiento Observado vs Esperado
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-export">
                            <button
                              onClick={() => {
                                if (editingSection === 'behavior') {
                                  handleCancelEdit();
                                } else {
                                  const text = currentTicket.sections?.behavior || 
                                    `Observado:\n${currentTicket.sections?.observedBehavior || ''}\n\nEsperado:\n${currentTicket.sections?.expectedBehavior || ''}`;
                                  handleStartEdit('behavior', text);
                                }
                              }}
                              style={{
                                background: editingSection === 'behavior' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid #282e33',
                                borderRadius: '4px',
                                padding: '2px 7px',
                                color: editingSection === 'behavior' ? '#f87171' : '#8c9bab',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                              title="Editar comportamiento observado vs esperado"
                            >
                              <Pencil size={10} /> Editar
                            </button>
                            <button
                              onClick={() => copyToClipboard(getSectionCopyText('behavior'), 'behavior')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedSection === 'behavior' ? '#4ade80' : '#8c9bab',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '3px'
                              }}
                              title="Copiar Comportamiento con Iconos"
                            >
                              {copiedSection === 'behavior' ? <Check size={11} /> : <Copy size={11} />}
                              {copiedSection === 'behavior' ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                        {editingSection === 'behavior' ? (
                          <SectionEditForm
                            value={editDraftValue}
                            onChange={setEditDraftValue}
                            onSave={() => handleSaveEdit('behavior')}
                            onCancel={handleCancelEdit}
                          />
                        ) : (
                          renderBehaviorContent(currentTicket.sections)
                        )}
                      </div>
                    )}

                    {/* Section 5: Solución Propuesta / Data Patch */}
                    {((currentTicket.sections?.solution || currentTicket.sections?.dataPatch)?.trim() || editingSection === 'solution') && (
                      <div style={{
                        background: '#161a1d',
                        border: '1px solid #282e33',
                        borderRadius: '6px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Wrench size={15} color="#fbbf24" />
                            <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Solución Propuesta / Data Patch
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-export">
                            <button
                              onClick={() => editingSection === 'solution' ? handleCancelEdit() : handleStartEdit('solution', currentTicket.sections?.solution || currentTicket.sections?.dataPatch || '')}
                              style={{
                                background: editingSection === 'solution' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid #282e33',
                                borderRadius: '4px',
                                padding: '2px 7px',
                                color: editingSection === 'solution' ? '#fbbf24' : '#8c9bab',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                              title="Editar solución y script de patch"
                            >
                              <Pencil size={10} /> Editar
                            </button>
                            <button
                              onClick={() => copyToClipboard(getSectionCopyText('solution'), 'solution')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedSection === 'solution' ? '#4ade80' : '#fbbf24',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '3px'
                              }}
                              title="Copiar Solución Completa con Icono"
                            >
                              {copiedSection === 'solution' ? <Check size={11} /> : <Copy size={11} />}
                              {copiedSection === 'solution' ? 'Copiado' : 'Copiar Solución'}
                            </button>
                          </div>
                        </div>
                        {editingSection === 'solution' ? (
                          <SectionEditForm
                            value={editDraftValue}
                            onChange={setEditDraftValue}
                            onSave={() => handleSaveEdit('solution')}
                            onCancel={handleCancelEdit}
                            isCode={true}
                          />
                        ) : (
                          renderSolutionContent(
                            currentTicket.sections?.solution || currentTicket.sections?.dataPatch,
                            (code) => copyToClipboard(code, 'solutionCode'),
                            copiedSection === 'solutionCode'
                          )
                        )}
                      </div>
                    )}

                    {/* Section 6: Diagnóstico Técnico & Causa Raíz Preliminar */}
                    {(currentTicket.sections?.technicalDiagnosis || editingSection === 'technicalDiagnosis') && (
                      <div style={{
                        background: '#161a1d',
                        border: '1px solid #282e33',
                        borderRadius: '6px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Code2 size={15} color="#818cf8" />
                            <span style={{ color: '#818cf8', fontWeight: 800, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Diagnóstico Técnico & Causa Raíz Preliminar
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-export">
                            <button
                              onClick={() => editingSection === 'technicalDiagnosis' ? handleCancelEdit() : handleStartEdit('technicalDiagnosis', currentTicket.sections?.technicalDiagnosis || '')}
                              style={{
                                background: editingSection === 'technicalDiagnosis' ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid #282e33',
                                borderRadius: '4px',
                                padding: '2px 7px',
                                color: editingSection === 'technicalDiagnosis' ? '#818cf8' : '#8c9bab',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                              title="Editar diagnóstico técnico"
                            >
                              <Pencil size={10} /> Editar
                            </button>
                            <button
                              onClick={() => copyToClipboard(getSectionCopyText('technicalDiagnosis'), 'technicalDiagnosis')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedSection === 'technicalDiagnosis' ? '#4ade80' : '#8c9bab',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '3px'
                              }}
                              title="Copiar Diagnóstico con Icono"
                            >
                              {copiedSection === 'technicalDiagnosis' ? <Check size={11} /> : <Copy size={11} />}
                              {copiedSection === 'technicalDiagnosis' ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                        {editingSection === 'technicalDiagnosis' ? (
                          <SectionEditForm
                            value={editDraftValue}
                            onChange={setEditDraftValue}
                            onSave={() => handleSaveEdit('technicalDiagnosis')}
                            onCancel={handleCancelEdit}
                          />
                        ) : (
                          <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#dee4ea' }}>
                            {currentTicket.sections?.technicalDiagnosis}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section 7: Criterios de Aceptación (DoD) */}
                    {(currentTicket.sections?.acceptanceCriteria || editingSection === 'acceptanceCriteria') && (
                      <div style={{
                        background: '#161a1d',
                        border: '1px solid #282e33',
                        borderRadius: '6px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckSquare size={15} color="#2dd4bf" />
                            <span style={{ color: '#2dd4bf', fontWeight: 800, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Criterios de Aceptación (DoD)
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-export">
                            <button
                              onClick={() => editingSection === 'acceptanceCriteria' ? handleCancelEdit() : handleStartEdit('acceptanceCriteria', currentTicket.sections?.acceptanceCriteria || '')}
                              style={{
                                background: editingSection === 'acceptanceCriteria' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid #282e33',
                                borderRadius: '4px',
                                padding: '2px 7px',
                                color: editingSection === 'acceptanceCriteria' ? '#2dd4bf' : '#8c9bab',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                              title="Editar criterios de aceptación DoD"
                            >
                              <Pencil size={10} /> Editar
                            </button>
                            <button
                              onClick={() => copyToClipboard(getSectionCopyText('acceptanceCriteria'), 'acceptanceCriteria')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedSection === 'acceptanceCriteria' ? '#4ade80' : '#8c9bab',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '3px'
                              }}
                              title="Copiar DoD con Icono"
                            >
                              {copiedSection === 'acceptanceCriteria' ? <Check size={11} /> : <Copy size={11} />}
                              {copiedSection === 'acceptanceCriteria' ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                        {editingSection === 'acceptanceCriteria' ? (
                          <SectionEditForm
                            value={editDraftValue}
                            onChange={setEditDraftValue}
                            onSave={() => handleSaveEdit('acceptanceCriteria')}
                            onCancel={handleCancelEdit}
                          />
                        ) : (
                          renderAcceptanceCriteria(currentTicket.sections?.acceptanceCriteria)
                        )}
                      </div>
                    )}

                    {/* Section 8: Evidencias y Capturas Adjuntas */}
                    {currentTicket.attachments && currentTicket.attachments.length > 0 && (
                      <div style={{
                        background: '#161a1d',
                        border: '1px solid #282e33',
                        borderRadius: '6px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ImageIcon size={15} color="#38bdf8" />
                            <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Evidencias y Capturas Adjuntas ({currentTicket.attachments.length})
                            </span>
                          </div>
                          <span style={{ fontSize: '10.5px', color: '#8c9bab' }} className="no-export">
                            Usa <strong>Copiar</strong> para pegarlas directo en Jira con <kbd style={{ background: '#282e33', padding: '1px 4px', borderRadius: '3px', fontSize: '9.5px', color: '#38bdf8' }}>Ctrl+V</kbd>
                          </span>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                          gap: '12px'
                        }}>
                          {currentTicket.attachments.map((att, attIdx) => (
                            <div
                              key={att.id || attIdx}
                              style={{
                                background: '#101418',
                                border: '1px solid #282e33',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'border-color 0.2s, transform 0.2s'
                              }}
                            >
                              <div 
                                style={{
                                  height: '115px',
                                  background: '#090d12',
                                  position: 'relative',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden'
                                }}
                                onClick={() => setActiveLightboxImage(att)}
                                title="Clic para ampliar captura"
                              >
                                <img 
                                  src={att.dataUrl} 
                                  alt={att.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                                <div style={{
                                  position: 'absolute',
                                  bottom: '4px',
                                  right: '4px',
                                  background: 'rgba(0, 0, 0, 0.75)',
                                  borderRadius: '4px',
                                  padding: '2px 5px',
                                  fontSize: '9.5px',
                                  color: '#38bdf8',
                                  fontWeight: 600
                                }}>
                                  {att.sizeKb ? `${att.sizeKb} KB` : 'Evidencia'}
                                </div>
                              </div>
                              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#dee4ea',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }} title={att.name}>
                                  {att.name}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-export">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const success = await copyImageToClipboard(att.dataUrl);
                                      if (success) {
                                        toast.success("Imagen copiada al portapapeles. Lista para pegar en Jira con Ctrl+V.");
                                      } else {
                                        toast.error("No se pudo copiar la imagen al portapapeles.");
                                      }
                                    }}
                                    style={{
                                      flex: 1,
                                      background: 'rgba(56, 189, 248, 0.1)',
                                      border: '1px solid rgba(56, 189, 248, 0.25)',
                                      borderRadius: '4px',
                                      padding: '4px 6px',
                                      color: '#38bdf8',
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px'
                                    }}
                                    title="Copiar imagen para pegar directo en Jira"
                                  >
                                    <Copy size={10} /> Copiar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => downloadImage(att.dataUrl, att.name)}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid #282e33',
                                      borderRadius: '4px',
                                      padding: '4px 6px',
                                      color: '#94a3b8',
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px'
                                    }}
                                    title="Descargar archivo de imagen"
                                  >
                                    <FileDown size={10} /> Descargar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  /* Raw View Mode */
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '14px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                        Texto Crudo para Copiar ({jiraFormat === 'markdown' ? 'Jira Cloud / Markdown' : 'Jira Server / Clásico'})
                      </span>
                      <button
                        onClick={() => copyToClipboard(getRawDescription(), 'rawDesc')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: copiedSection === 'rawDesc' ? '#22c55e' : 'var(--primary)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600
                        }}
                      >
                        {copiedSection === 'rawDesc' ? <Check size={11} /> : <Copy size={11} />}
                        {copiedSection === 'rawDesc' ? 'Copiado' : 'Copiar Solo Descripción'}
                      </button>
                    </div>

                    <pre style={{
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: 1.55,
                      color: 'var(--on-surface)',
                      whiteSpace: 'pre-wrap',
                      fontFamily: "'Space Grotesk', monospace"
                    }}>
                      {getRawDescription()}
                    </pre>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal Lightbox para visualización de capturas en alta resolución */}
      {activeLightboxImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setActiveLightboxImage(null)}
        >
          <div 
            style={{
              maxWidth: '92vw',
              maxHeight: '88vh',
              background: '#161a1d',
              border: '1px solid #282e33',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '12px 16px',
              background: '#1c2127',
              borderBottom: '1px solid #282e33',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} color="#38bdf8" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#dee4ea' }}>
                  {activeLightboxImage.name}
                </span>
                {activeLightboxImage.sizeKb && (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>({activeLightboxImage.sizeKb} KB)</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyImageToClipboard(activeLightboxImage.dataUrl);
                    if (ok) toast.success("Imagen copiada al portapapeles. Lista para pegar en Jira (Ctrl+V).");
                  }}
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '5px',
                    padding: '4px 10px',
                    color: '#38bdf8',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Copy size={12} /> Copiar Imagen
                </button>
                <button
                  type="button"
                  onClick={() => downloadImage(activeLightboxImage.dataUrl, activeLightboxImage.name)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid #282e33',
                    borderRadius: '5px',
                    padding: '4px 10px',
                    color: '#dee4ea',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <FileDown size={12} /> Descargar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLightboxImage(null)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '5px',
                    padding: '4px 8px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Cerrar (Esc)"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div style={{
              padding: '14px',
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#090d12'
            }}>
              <img 
                src={activeLightboxImage.dataUrl} 
                alt={activeLightboxImage.name} 
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
