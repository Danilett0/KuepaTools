import React, { useMemo } from 'react';
import { Copy, Search, ArrowRight, BookOpen, X, User } from 'lucide-react';
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

  // Apply search filter to programs within each result
  const filteredResults = useMemo(() => {
    const term = searchFilter.trim().toLowerCase();
    if (!term) return results;

    return results.map(r => {
      if (!r.found) return r;
      return {
        ...r,
        programs: r.programs.filter(p => p.name.toLowerCase().includes(term)),
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
                      <div key={rIdx}>
                        {/* Student header row */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 16px',
                          background: result.found ? 'rgba(18,163,131,0.08)' : 'rgba(239,68,68,0.06)',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          ...(rIdx > 0 ? { borderTop: '1px solid rgba(255,255,255,0.08)' } : {}),
                          position: 'sticky', top: 0, zIndex: 1,
                        }}>
                          <User size={14} style={{ color: result.found ? 'var(--primary)' : '#ef4444', flexShrink: 0 }} />
                          {result.found ? (
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)' }}>
                                  {result.name}
                                </span>
                                <span style={{
                                  fontSize: '10px', fontFamily: "'Space Grotesk', monospace",
                                  color: 'var(--on-surface-variant)',
                                  background: 'rgba(255,255,255,0.06)', borderRadius: '4px',
                                  padding: '1px 6px',
                                }}>
                                  #{result.inc}
                                </span>
                                <span style={{
                                  fontSize: '10px', fontFamily: "'Space Grotesk', sans-serif",
                                  color: 'var(--primary)', fontWeight: 600,
                                }}>
                                  {result.programs.length} programa{result.programs.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontSize: '12px', fontFamily: "'Space Grotesk', monospace",
                                color: 'var(--on-surface-variant)',
                                background: 'rgba(255,255,255,0.05)', borderRadius: '4px',
                                padding: '1px 6px',
                              }}>
                                {result.input}
                              </span>
                              <span style={{ fontSize: '12px', color: '#ef4444', fontStyle: 'italic', fontFamily: "'Space Grotesk', sans-serif" }}>
                                No encontrado
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Programs for this student */}
                        {result.found && result.programs.length > 0 && result.programs.map((prog, pIdx) => (
                          <div
                            key={prog.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px',
                              padding: '10px 16px 10px 42px',
                              borderBottom: pIdx < result.programs.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                              background: pIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(18,163,131,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = pIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                          >
                            <span style={{
                              fontSize: '10px', fontFamily: "'Space Grotesk', monospace",
                              color: 'var(--primary)', minWidth: '20px',
                              background: 'rgba(18,163,131,0.1)', borderRadius: '4px',
                              padding: '1px 5px', textAlign: 'center', flexShrink: 0,
                              fontWeight: 600,
                            }}>
                              {pIdx + 1}
                            </span>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '12px', color: 'var(--on-surface)', fontWeight: 500,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {prog.name}
                              </div>
                              <div style={{
                                fontSize: '10px', fontFamily: "'Space Grotesk', monospace",
                                color: 'var(--on-surface-variant)', letterSpacing: '0.02em',
                                marginTop: '2px',
                              }}>
                                {prog.id}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(prog.id);
                                toast.success('ID de programa copiado');
                              }}
                              title="Copiar ID"
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--on-surface-variant)', padding: '4px',
                                borderRadius: '4px', flexShrink: 0, transition: 'color 0.2s',
                                display: 'flex', alignItems: 'center',
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        ))}

                        {/* Student found but no programs match filter */}
                        {result.found && result.programs.length === 0 && searchFilter.trim() && (
                          <div style={{
                            padding: '8px 16px 8px 42px',
                            fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic',
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}>
                            Sin programas que coincidan
                          </div>
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
