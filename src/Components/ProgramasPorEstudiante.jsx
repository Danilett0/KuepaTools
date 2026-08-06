import { useMemo } from 'react';
import { Search, BookOpen, X, Copy, ArrowRight } from 'lucide-react';

import { toast } from 'react-toastify';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useUsuariosCompletos } from '../hooks/useUsuariosCompletos';
import { useCatalogos } from '../hooks/useCatalogos';
import AllianceSwitcher from './ui/AllianceSwitcher';
import ClearButton from './ui/ClearButton';

const ProgramasPorEstudiante = () => {
  const [idsText, setIdsText] = useLocalStorage('programas-est-ids', '');
  const [alianza, setAlianza] = useLocalStorage('programas-est-alianza', 'na');
  const [searchFilter, setSearchFilter] = useLocalStorage('programas-est-filter', '');
  const { data: usuariosCompletos, loading } = useUsuariosCompletos();
  const { programas: programasData } = useCatalogos();

  const programasMap = useMemo(() =>
    programasData ? Object.fromEntries(programasData.map(p => [p._id.$oid, p])) : {}
  , [programasData]);

  const allianceId = alianza === 'kuepa'
    ? '602169e217b5c8a27f9e9c06'
    : '6303ed663138387a1669d82a';

  // Auto-complete: replace incremental IDs with long IDs on blur
  const handleBlur = () => {
    const lines = idsText.split('\n');
    let changed = false;

    const updated = lines.map(raw => {
      const val = raw.trim();
      if (!val) return raw;

      const user = usuariosCompletos.find(u => {
        const uAlliance = u.alliance_id?.$oid || u.alliance_id;
        if (uAlliance !== allianceId) return false;
        return String(u.incremental_user_code) === val;
      });

      if (user) {
        changed = true;
        return user._id?.$oid || user._id;
      }
      return raw;
    });

    if (changed) setIdsText(updated.join('\n'));
  };

  // Parse input lines and resolve each student
  const results = useMemo(() => {
    const lines = idsText.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (!lines.length) return [];

    return lines.map(line => {
      const user = usuariosCompletos.find(u => {
        const uAlliance = u.alliance_id?.$oid || u.alliance_id;
        if (uAlliance !== allianceId) return false;
        return String(u.incremental_user_code) === line || (u._id?.$oid || u._id) === line;
      });

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
    });
  }, [idsText, allianceId, usuariosCompletos, programasMap]);

  // Normalize text: remove accents/diacritics and lowercase for accent-insensitive search
  const normalize = (str) =>
    str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  // Apply search filter to programs within each result
  const filteredResults = useMemo(() => {
    const term = normalize(searchFilter.trim());
    if (!term) return results;

    return results.map(r => {
      if (!r.found) return r;
      return {
        ...r,
        programs: r.programs.filter(p => normalize(p.name).includes(term)),
      };
    });
  }, [results, searchFilter]);

  // Count totals for the header
  const totalStudents = results.filter(r => r.found).length;
  const totalPrograms = results.reduce((acc, r) => acc + r.programs.length, 0);
  const visiblePrograms = filteredResults.reduce((acc, r) => acc + r.programs.length, 0);

  const copiarProgramIds = () => {
    const ids = filteredResults.flatMap(r => r.programs.map(p => p.id));
    if (!ids.length) return;
    navigator.clipboard.writeText(ids.join('\n'));
    toast.success(`${ids.length} ID${ids.length !== 1 ? 's' : ''} de programa${ids.length !== 1 ? 's' : ''} copiado${ids.length !== 1 ? 's' : ''}`);
  };

  const handleClear = () => {
    setIdsText('');
    setSearchFilter('');
  };

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-content" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="inscripciones-form-container animate-slide-up" style={{ marginTop: 0 }}>

          {/* ── Header ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "10px",
                background: "var(--primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BookOpen size={16} style={{ color: "#090909" }} />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--on-surface)", fontFamily: "'Nunito', sans-serif" }}>
                Programas Estudiante
              </span>
              {loading && (
                <span style={{ fontSize: '11px', color: '#eab308', fontStyle: 'italic', fontFamily: "'Space Grotesk', sans-serif", marginLeft: "8px" }}>
                  Cargando usuarios...
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AllianceSwitcher value={alianza} size="md" onChange={(val) => { setAlianza(val); handleClear(); }} />
              <ClearButton onClick={handleClear} />
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--glass-border)', marginBottom: '24px' }} />

          {/* ── Cuerpo principal ───────────────────────────────── */}
          <div style={{ display: 'flex', gap: '16px', height: '380px' }}>

            {/* ── Panel izquierdo: textarea de IDs ────────────── */}
            <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <label className="input-label" style={{ marginBottom: 0 }}>
                  IDs ESTUDIANTES
                  {results.length > 0 && (
                    <span style={{ marginLeft: '8px', fontWeight: 400, color: 'var(--on-surface-variant)', fontSize: '12px' }}>
                      {results.length} ingresados
                    </span>
                  )}
                </label>
              </div>
              <textarea
                className="inscripciones-input"
                value={idsText}
                onChange={(e) => setIdsText(e.target.value)}
                onBlur={handleBlur}
                placeholder={"Ejemplo:\n292828\n237575\n297832"}
                style={{
                  height: '340px',
                  resize: 'none',
                  fontFamily: "'Space Grotesk', monospace",
                  fontSize: '14px',
                  lineHeight: '1.8',
                  letterSpacing: '0.02em',
                  overflowY: 'auto',
                }}
              />
            </div>

            {/* ── Flecha central ──────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, paddingTop: '32px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: totalStudents > 0 ? 'var(--primary-container)' : 'var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}>
                <ArrowRight size={16} style={{ color: totalStudents > 0 ? '#fff' : 'var(--text-muted)' }} />
              </div>
            </div>

            {/* ── Panel derecho: programas agrupados ──────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, overflow: 'hidden' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: !totalPrograms ? 'var(--glass-border)' : visiblePrograms === totalPrograms ? '#22c55e' : '#eab308',
                    transition: 'background 0.3s ease',
                  }} />
                  <label className="input-label" style={{ marginBottom: 0 }}>
                    PROGRAMAS
                    {totalPrograms > 0 && (
                      <span style={{ marginLeft: '8px', fontWeight: 400, color: 'var(--on-surface-variant)', fontSize: '12px' }}>
                        {visiblePrograms}/{totalPrograms} {searchFilter.trim() ? 'filtrados' : 'total'}
                      </span>
                    )}
                  </label>
                </div>
                <button
                  onClick={copiarProgramIds}
                  disabled={!visiblePrograms}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: visiblePrograms ? 'var(--primary-container)' : 'transparent',
                    color: visiblePrograms ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${visiblePrograms ? 'var(--primary)' : 'var(--glass-border)'}`,
                    borderRadius: '8px', padding: '5px 12px',
                    fontSize: '12px', fontWeight: '600',
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: visiblePrograms ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Copy size={13} /> Copiar IDs
                </button>
              </div>

              {/* Search filter */}
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
                    className="inscripciones-input"
                    style={{
                      height: '38px',
                      paddingLeft: '34px',
                      paddingRight: searchFilter ? '34px' : '12px',
                      fontSize: '13px',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  />
                  {searchFilter && (
                    <button
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

              {/* Results list */}
              <div style={{
                flex: 1,
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.3)',
                overflowY: 'auto',
                minHeight: 0,
              }}>
                {results.length === 0 ? (
                  <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '12px',
                    color: 'var(--text-muted)', padding: '24px',
                  }}>
                    <BookOpen size={32} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>
                      Ingresa IDs de estudiantes para ver sus programas
                    </span>
                  </div>
                ) : (
                  <div>
                    {filteredResults.map((result, rIdx) => (
                      <div
                        key={rIdx}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 14px',
                          borderBottom: rIdx < filteredResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          background: result.found
                            ? (rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')
                            : 'rgba(239,68,68,0.04)',
                          transition: 'background 0.15s ease',
                          minWidth: 0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = result.found ? 'rgba(18,163,131,0.06)' : 'rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = result.found ? (rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)') : 'rgba(239,68,68,0.04)'}
                      >
                        {/* ID badge */}
                        <span style={{
                          fontSize: '11px', fontFamily: "'Space Grotesk', monospace", fontWeight: 700,
                          color: result.found ? 'var(--primary)' : '#ef4444',
                          flexShrink: 0, whiteSpace: 'nowrap',
                        }}>
                          ID {result.found ? result.inc : result.input}
                        </span>

                        {result.found ? (
                          <>


                            {/* Program names proportionally divided */}
                            <div style={{
                              display: 'flex', flex: 1, minWidth: 0, gap: '8px',
                              alignItems: 'center'
                            }}>
                              {result.programs.length > 0 ? (
                                result.programs.map((p, pIdx) => (
                                  <React.Fragment key={pIdx}>
                                    {pIdx > 0 && <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>}
                                    <span
                                      style={{
                                        fontSize: '11px', color: 'var(--on-surface)', fontWeight: 400,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        flex: 1,
                                        fontFamily: "'Space Grotesk', sans-serif",
                                      }}
                                      title={p.name}
                                    >
                                      {p.name}
                                    </span>
                                  </React.Fragment>
                                ))
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: "'Space Grotesk', sans-serif" }}>
                                  Sin programas que coincidan
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic', fontFamily: "'Space Grotesk', sans-serif" }}>
                            No encontrado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramasPorEstudiante;
