import { useState, useMemo, useCallback, Fragment, useEffect, useRef } from 'react';
import { Search, BookOpen, X, Copy, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useUsuariosCompletos } from '../hooks/useUsuariosCompletos';
import { useCatalogos } from '../hooks/useCatalogos';
import AllianceSwitcher from './ui/AllianceSwitcher';
import { ALLIANCE_IDS } from '../utils/constants';
import { useAppStore } from '../store/useAppStore';

export default function ProgramasPorEstudiante() {
  const { findUsersByIncList, findUsersByMongoIds, findUser } = useUsuariosCompletos();
  const [idsText, setIdsText] = useLocalStorage('programas-est-ids', '');
  const [alianza, setAlianza] = useLocalStorage('programas-est-alianza', 'na');
  const [searchFilter, setSearchFilter] = useLocalStorage('programas-est-filter', '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const { programas: programasData } = useCatalogos();

  const programasMap = useMemo(() =>
    programasData ? Object.fromEntries(programasData.map(p => [p._id.$oid, p])) : {}
  , [programasData]);

  const allianceId = alianza === 'kuepa' ? ALLIANCE_IDS.kuepa : ALLIANCE_IDS.na;

  const aiPrefilledData = useAppStore(state => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore(state => state.setAiPrefilledData);

  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.intent === 'GET_PROGRAMS') {
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 0) {
        setIdsText(aiPrefilledData.ids.join('\n'));
      }
      setAiPrefilledData(null);
    }
  }, [aiPrefilledData, setIdsText, setAiPrefilledData]);

  // Parse input lines
  const parseLines = useCallback(() => {
    return idsText.split('\n').map(l => l.trim()).filter(l => l !== '');
  }, [idsText]);

  // On-demand search — resolves each student in the list
  const handleBuscar = useCallback(async () => {
    const lines = parseLines();
    if (!lines.length) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Collect valid INCs for bulk lookup
      const incs = lines.filter(l => /^\d+$/.test(l) && l.length < 24).map(Number);
      let byInc = {};
      if (incs.length > 0) {
        const found = await findUsersByIncList(incs, allianceId);
        byInc = Object.fromEntries(found.map(u => [u.incremental_user_code, u]));
      }

      // Collect MongoDB ObjectIDs for bulk lookup
      const mongoIds = lines.filter(l => /^[a-f0-9]{24}$/i.test(l));
      let byMongoId = {};
      if (mongoIds.length > 0) {
        const foundMongo = await findUsersByMongoIds(mongoIds, allianceId);
        byMongoId = Object.fromEntries(foundMongo.map(u => [u._id?.$oid || u.mongo_id, u]));
      }

      const resolvedResults = await Promise.all(lines.map(async line => {
        let user = null;
        if (/^\d+$/.test(line) && line.length < 24) {
          user = byInc[Number(line)];
        } else if (/^[a-f0-9]{24}$/i.test(line)) {
          user = byMongoId[line];
        }
        if (!user) {
          user = await findUser(line, allianceId);
        }

        if (!user) return { input: line, found: false, user: null, programs: [] };

        const longId = user._id?.$oid || user._id;
        const programs = (user.programs || []).map((prog, idx) => {
          const pid = prog.structure?.$oid || prog.structure;
          if (!pid) return null;
          const catalogEntry = programasMap[pid];
          return { id: pid, name: catalogEntry?.name || pid, idx };
        }).filter(Boolean);

        return {
          input: line,
          found: true,
          user,
          longId,
          name: user.profile?.full_name || longId,
          inc: user.incremental_user_code,
          programs,
        };
      }));

      setResults(resolvedResults);
    } catch (error) {
      toast.error('Error al buscar usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [parseLines, allianceId, programasMap, findUsersByIncList, findUser]);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleBuscar();
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [idsText, allianceId, handleBuscar]);

  // Normalize text: remove accents/diacritics and lowercase for accent-insensitive search
  const normalize = (str) =>
    str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  // Apply search filter to programs within each result
  const filteredResults = useMemo(() => {
    const term = normalize(searchFilter.trim());
    if (!term) return results;

    return results.reduce((acc, r) => {
      if (!r.found) return acc;
      
      const matchedPrograms = r.programs.filter(p => normalize(p.name).includes(term));
      if (matchedPrograms.length > 0) {
        acc.push({ ...r, programs: matchedPrograms });
      }
      return acc;
    }, []);
  }, [results, searchFilter]);

  // Count totals for the header
  const totalEntered = parseLines().length;
  const totalStudents = results.filter(r => r.found).length;
  const totalPrograms = results.reduce((acc, r) => acc + r.programs.length, 0);
  const visiblePrograms = filteredResults.reduce((acc, r) => acc + r.programs.length, 0);

  const copiarProgramIds = () => {
    const ids = filteredResults.flatMap(r => r.programs.map(p => p.id));
    if (!ids.length) return;
    navigator.clipboard.writeText(ids.join('\n'));
    toast.success(`${ids.length} ID${ids.length !== 1 ? 's' : ''} de programa${ids.length !== 1 ? 's' : ''} copiado${ids.length !== 1 ? 's' : ''}`);
  };

  const handleClear = useCallback(() => {
    setIdsText('');
    setSearchFilter('');
    setResults([]);
  }, [setIdsText, setSearchFilter]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  return (
    <div
      className="inscripciones-main animate-slide-down"
      style={{ padding: '18px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}
    >
      {/* ── Header ── */}
      <div className="inscripciones-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="inscripciones-mode-badge">
            <BookOpen size={17} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--on-surface)', margin: 0, lineHeight: 1.2 }}>
              Programas por Estudiante
            </h1>
            <span style={{ fontSize: '11.5px', color: 'var(--on-surface-variant)' }}>
              Consulta y filtra los programas académicos asignados a una lista de estudiantes
            </span>
          </div>
        </div>
      </div>

      {/* ── Barra de Pestañas / Controles ── */}
      <div className="inscripciones-tabs">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 14px' }}>
          <BookOpen size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', fontFamily: "'Nunito', sans-serif" }}>
            Consulta de Programas
          </span>
          {loading && (
            <span style={{ fontSize: '11px', color: '#eab308', marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
              <Loader2 size={12} className="animate-spin" />
              Cargando programas...
            </span>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AllianceSwitcher
            value={alianza}
            onChange={(val) => { setAlianza(val); handleClear(); }}
          />
          <button
            type="button"
            onClick={handleClear}
            title="Limpiar (Esc)"
            style={{
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              color: 'var(--on-surface-variant)',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--on-surface)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--on-surface-variant)'; e.currentTarget.style.background = 'transparent'; }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* ── Panel Principal ── */}
      <div className="inscripciones-panel">
        <div className="inscr-dual-pane" style={{ minHeight: '340px' }}>
          {/* Panel Izquierdo: Entrada de estudiantes */}
          <div className="inscr-pane-card" style={{ flex: '0 0 320px' }}>
            <div className="inscr-pane-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="inscr-field-label">Estudiantes (INC o ID)</span>
                {totalEntered > 0 && (
                  <span className="inscr-count-badge">
                    {totalStudents}/{totalEntered}
                  </span>
                )}
              </div>
            </div>

            <textarea
              className="inscr-textarea"
              value={idsText}
              onChange={(e) => setIdsText(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text');
                const cleaned = pasted
                  .split(/\r?\n/)
                  .map(l => l.trim())
                  .filter(l => l !== '')
                  .join('\n');
                const ta = e.target;
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const before = idsText.slice(0, start);
                const after = idsText.slice(end);
                setIdsText(before + cleaned + after);
              }}
              placeholder={'Ejemplo:\n292828\n237575\n67b338a6357fb57f91e0b332'}
              style={{
                flex: 1,
                minHeight: '300px',
                resize: 'none',
                fontFamily: "'Space Grotesk', monospace",
                fontSize: '13px',
                lineHeight: '1.8',
              }}
            />
          </div>

          {/* Panel Derecho: Programas */}
          <div className="inscr-pane-card">
            <div className="inscr-pane-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: !totalStudents ? 'var(--glass-border)' : filteredResults.length === totalStudents ? '#22c55e' : '#eab308',
                  transition: 'background 0.3s ease',
                }} />
                <span className="inscr-field-label">Programas Asignados</span>
                {totalStudents > 0 && (
                  <span className="inscr-count-badge">
                    {filteredResults.length}/{totalStudents} {searchFilter.trim() ? 'filtrados' : 'estudiantes'} ({visiblePrograms} prog.)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={copiarProgramIds}
                disabled={!visiblePrograms}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: visiblePrograms ? 'rgba(18, 163, 131, 0.15)' : 'transparent',
                  color: visiblePrograms ? 'var(--primary)' : 'var(--on-surface-variant)',
                  border: `1px solid ${visiblePrograms ? 'rgba(18, 163, 131, 0.35)' : 'var(--glass-border)'}`,
                  borderRadius: '8px',
                  padding: '5px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: visiblePrograms ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
              >
                <Copy size={12} />
                <span>Copiar IDs</span>
              </button>
            </div>

            {/* Filtro de búsqueda por programa */}
            {totalPrograms > 0 && (
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--on-surface-variant)', pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filtrar por nombre de programa..."
                  className="inscr-input"
                  style={{
                    height: '36px',
                    paddingLeft: '34px',
                    paddingRight: searchFilter ? '34px' : '12px',
                    fontSize: '12px',
                  }}
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    style={{
                      position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--on-surface-variant)', padding: '4px',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Contenedor de Resultados */}
            <div style={{
              flex: 1,
              minHeight: '260px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {results.length === 0 ? (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '10px',
                  color: 'var(--on-surface-variant)', padding: '24px',
                }}>
                  <BookOpen size={28} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif" }}>
                    Ingresa IDs de estudiantes para ver sus programas
                  </span>
                </div>
              ) : (
                <div style={{ overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarColor: 'var(--primary) rgba(255, 255, 255, 0.04)' }}>
                  {filteredResults.map((result, rIdx) => (
                    <div
                      key={rIdx}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '10px 14px',
                        borderBottom: rIdx < filteredResults.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: result.found
                          ? (rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)')
                          : 'rgba(239,68,68,0.04)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = result.found ? 'rgba(18,163,131,0.06)' : 'rgba(239,68,68,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = result.found ? (rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)') : 'rgba(239,68,68,0.04)'}
                    >
                      {/* Badge del estudiante */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '130px', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '11px', fontFamily: "'Space Grotesk', monospace", fontWeight: 700,
                          color: result.found ? 'var(--primary)' : '#ef4444',
                        }}>
                          {result.found ? (result.inc ? `INC ${result.inc}` : result.longId?.slice(0, 8) + '...') : result.input}
                        </span>
                        {result.found && result.name && (
                          <span style={{
                            fontSize: '10.5px', color: 'var(--on-surface-variant)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }} title={result.name}>
                            {result.name}
                          </span>
                        )}
                      </div>

                      {/* Lista de programas */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {result.found ? (
                          result.programs.length > 0 ? (
                            result.programs.map((p, pIdx) => (
                              <div
                                key={pIdx}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '4px 8px', borderRadius: '6px',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid rgba(255, 255, 255, 0.06)',
                                  fontSize: '11.5px', color: 'var(--on-surface)',
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  maxWidth: '100%',
                                }}
                                title={`${p.name} (${p.id})`}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {p.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(p.id);
                                    toast.success(`ID de "${p.name}" copiado`);
                                  }}
                                  title={`Copiar ID: ${p.id}`}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--on-surface-variant)', padding: 0,
                                    display: 'flex', alignItems: 'center', flexShrink: 0,
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <span style={{ fontSize: '11.5px', color: 'var(--on-surface-variant)', fontStyle: 'italic', fontFamily: "'Space Grotesk', sans-serif" }}>
                              Sin programas registrados
                            </span>
                          )
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#ef4444', fontStyle: 'italic', fontFamily: "'Space Grotesk', sans-serif" }}>
                            Estudiante no encontrado
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
