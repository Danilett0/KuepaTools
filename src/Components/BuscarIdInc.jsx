import React, { useState, useCallback } from 'react';
import { Copy, Search, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { findUsersByIncList } from '../services/usuariosService';
import AllianceSwitcher from './ui/AllianceSwitcher';
import ClearButton from './ui/ClearButton';
import { ALLIANCE_IDS } from '../utils/constants';

const ALLIANCE_ID = {
  na:    ALLIANCE_IDS.na,
  kuepa: ALLIANCE_IDS.kuepa,
};

const BuscarIdInc = () => {
  const [incText, setIncText] = useLocalStorage('buscarid-incText', '');
  const [alianza, setAlianza] = useLocalStorage('buscarid-alianza', 'na');
  const [resultado, setResultado] = useState([]);
  const [loading, setLoading] = useState(false);

  // Parse the textarea into a list of { raw, incNum } entries
  const parseLines = useCallback(() => {
    return incText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l !== '')
      .map(raw => ({ raw, incNum: Number(raw) }));
  }, [incText]);

  // On-demand search — fires only when the user triggers it
  const handleBuscar = useCallback(async () => {
    const lines = parseLines();
    if (!lines.length) return;

    const allianceId = ALLIANCE_ID[alianza];
    const validIncs = lines.filter(l => !isNaN(l.incNum)).map(l => l.incNum);

    setLoading(true);
    try {
      const found = await findUsersByIncList(validIncs, allianceId);
      // Build a fast lookup map incNum → user
      const byInc = Object.fromEntries(found.map(u => [u.incremental_user_code, u]));

      const results = lines.map(({ raw, incNum }) => {
        if (isNaN(incNum)) return { inc: raw, id: null, name: null, found: false };
        const user = byInc[incNum];
        if (user?._id?.$oid) {
          return { inc: raw, id: user._id.$oid, name: user.profile?.full_name, found: true };
        }
        return { inc: raw, id: null, name: null, found: false };
      });

      setResultado(results);
    } catch (err) {
      toast.error('Error al buscar usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [parseLines, alianza]);

  const inputLineCount = incText.split('\n').filter(l => l.trim()).length;
  const foundCount = resultado.filter(r => r.found).length;
  const totalCount = resultado.length;

  const copiarAlPortapapeles = () => {
    if (!resultado.length) return;
    const text = resultado.map(r => r.found ? r.id : 'no encontrado').join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`${foundCount} ID${foundCount !== 1 ? 's' : ''} copiado${foundCount !== 1 ? 's' : ''}`);
  };

  const handleClear = () => {
    setIncText('');
    setResultado([]);
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
                <Search size={16} style={{ color: "#090909" }} />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--on-surface)", fontFamily: "'Nunito', sans-serif" }}>
                Búscar ID por Incremental
              </span>
              {loading && (
                <span style={{ fontSize: '11px', color: '#eab308', fontStyle: 'italic', fontFamily: "'Space Grotesk', sans-serif", marginLeft: "8px", display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                  Buscando...
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AllianceSwitcher value={alianza} size="md" onChange={(val) => { setAlianza(val); handleClear(); }} />
              <ClearButton onClick={handleClear} />
            </div>
          </div>

          {/* ── Divisor ────────────────────────────────────────── */}
          <div style={{ height: '1px', background: 'var(--glass-border)', marginBottom: '24px' }} />

          {/* ── Cuerpo principal ───────────────────────────────── */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>

            {/* Panel izquierdo: entrada */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <label className="input-label" style={{ marginBottom: 0 }}>
                    IDs INCREMENTALES
                    {inputLineCount > 0 && (
                      <span style={{ marginLeft: '8px', fontWeight: 400, color: 'var(--on-surface-variant)', fontSize: '12px' }}>
                        {inputLineCount} ingresados
                      </span>
                    )}
                  </label>
                </div>
                <button
                  onClick={handleBuscar}
                  disabled={loading || !inputLineCount}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: inputLineCount && !loading ? 'var(--primary)' : 'transparent',
                    color: inputLineCount && !loading ? '#090909' : 'var(--text-muted)',
                    border: `1px solid ${inputLineCount ? 'var(--primary)' : 'var(--glass-border)'}`,
                    borderRadius: '8px', padding: '5px 12px',
                    fontSize: '12px', fontWeight: '700',
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: inputLineCount && !loading ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={13} />}
                  Buscar
                </button>
              </div>
              <textarea
                className="inscripciones-input"
                value={incText}
                onChange={(e) => {
                  const cleaned = e.target.value
                    .split('\n')
                    .map(l => l.trim())
                    .filter(l => l !== '')
                    .join('\n');
                  setIncText(cleaned);
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text');
                  const cleaned = pasted
                    .split(/\r?\n/)
                    .map(l => l.trim())
                    .filter(l => l !== '')
                    .join('\n');
                  // Insertar en la posición del cursor respetando el texto existente
                  const ta = e.target;
                  const start = ta.selectionStart;
                  const end = ta.selectionEnd;
                  const before = incText.slice(0, start);
                  const after = incText.slice(end);
                  const merged = [before, cleaned, after]
                    .join('')
                    .split('\n')
                    .map(l => l.trim())
                    .filter(l => l !== '')
                    .join('\n');
                  setIncText(merged);
                }}
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

            {/* Flecha central */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, paddingTop: '32px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: totalCount > 0 ? 'var(--primary-container)' : 'var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}>
                <ArrowRight size={16} style={{ color: totalCount > 0 ? '#fff' : 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Panel derecho: resultados */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: totalCount === 0 ? 'var(--glass-border)' : foundCount === totalCount ? '#22c55e' : '#eab308',
                    transition: 'background 0.3s ease',
                  }} />
                  <label className="input-label" style={{ marginBottom: 0 }}>
                    IDs LARGOS
                    {totalCount > 0 && (
                      <span style={{ marginLeft: '8px', fontWeight: 400, color: 'var(--on-surface-variant)', fontSize: '12px' }}>
                        {foundCount}/{totalCount} encontrados
                      </span>
                    )}
                  </label>
                </div>
                <button
                  onClick={copiarAlPortapapeles}
                  disabled={!foundCount}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: foundCount ? 'var(--primary-container)' : 'transparent',
                    color: foundCount ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${foundCount ? 'var(--primary)' : 'var(--glass-border)'}`,
                    borderRadius: '8px', padding: '5px 12px',
                    fontSize: '12px', fontWeight: '600',
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: foundCount ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Copy size={13} /> Copiar IDs
                </button>
              </div>

              {/* Lista de resultados */}
              <div style={{
                height: '340px',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.3)',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}>
                {resultado.length === 0 ? (
                  <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '12px',
                    color: 'var(--text-muted)', padding: '24px',
                  }}>
                    <Search size={32} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>
                      Los resultados aparecerán aquí
                    </span>
                  </div>
                ) : (
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {resultado.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '0 12px',
                          height: '25.2px',   /* 14px * 1.8 — igual al line-height del textarea */
                          borderBottom: i < resultado.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {r.found ? (
                            <div style={{
                              fontSize: '12px', fontFamily: "'Space Grotesk', monospace",
                              color: 'var(--on-surface)', letterSpacing: '0.02em',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {r.id}
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#ef4444', fontStyle: 'italic', fontFamily: "'Space Grotesk', sans-serif" }}>
                              No encontrado
                            </span>
                          )}
                        </div>

                        {/* Indicador y botón copiar individual */}
                        {r.found ? (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(r.id);
                              toast.success('ID copiado');
                            }}
                            title="Copiar este ID"
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
                        ) : (
                          <div style={{ width: '21px', flexShrink: 0 }} />
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

export default BuscarIdInc;
