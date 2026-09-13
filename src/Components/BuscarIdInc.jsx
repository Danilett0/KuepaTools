import React, { useState, useCallback, useEffect } from 'react';
import { Copy, Search, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useUsuariosCompletos } from '../hooks/useUsuariosCompletos';
import AllianceSwitcher from './ui/AllianceSwitcher';
import { ALLIANCE_IDS } from '../utils/constants';
import { useAppStore } from '../store/useAppStore';

const ALLIANCE_ID = {
  na: ALLIANCE_IDS.na,
  kuepa: ALLIANCE_IDS.kuepa,
};

export default function BuscarIdInc() {
  const { findUsersByIncList } = useUsuariosCompletos();
  const [incText, setIncText] = useLocalStorage('buscarid-incText', '');
  const [alianza, setAlianza] = useLocalStorage('buscarid-alianza', 'na');
  const [resultado, setResultado] = useState([]);
  const [loading, setLoading] = useState(false);

  const aiPrefilledData = useAppStore(state => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore(state => state.setAiPrefilledData);

  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.intent === 'SEARCH_ID') {
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 0) {
        setIncText(aiPrefilledData.ids.join('\n'));
      }
      setAiPrefilledData(null);
    }
  }, [aiPrefilledData, setIncText, setAiPrefilledData]);

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
  }, [parseLines, alianza, findUsersByIncList]);

  const inputLineCount = incText.split('\n').filter(l => l.trim()).length;
  const foundCount = resultado.filter(r => r.found).length;
  const totalCount = resultado.length;

  const copiarAlPortapapeles = () => {
    if (!resultado.length) return;
    const text = resultado.map(r => r.found ? r.id : 'no encontrado').join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`${foundCount} ID${foundCount !== 1 ? 's' : ''} copiado${foundCount !== 1 ? 's' : ''}`);
  };

  const handleClear = useCallback(() => {
    setIncText('');
    setResultado([]);
  }, [setIncText]);

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
            <Search size={17} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--on-surface)', margin: 0, lineHeight: 1.2 }}>
              Búscar ID por Incremental
            </h1>
            <span style={{ fontSize: '11.5px', color: 'var(--on-surface-variant)' }}>
              Conversión masiva de códigos incrementales (INC) a IDs de MongoDB
            </span>
          </div>
        </div>
      </div>

      {/* ── Barra de Pestaña y Controles ── */}
      <div className="inscripciones-tabs">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 14px' }}>
          <Search size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', fontFamily: "'Nunito', sans-serif" }}>
            Conversor INC ↔ ID
          </span>
          {loading && (
            <span style={{ fontSize: '11px', color: '#eab308', marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
              <Loader2 size={12} className="animate-spin" />
              Buscando...
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
          {/* Panel Izquierdo: Entrada */}
          <div className="inscr-pane-card">
            <div className="inscr-pane-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="inscr-field-label">IDs Incrementales</span>
                {inputLineCount > 0 && (
                  <span className="inscr-count-badge">{inputLineCount}</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleBuscar}
                disabled={loading || !inputLineCount}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: inputLineCount && !loading ? 'linear-gradient(135deg, var(--primary) 0%, #06a080 100%)' : 'transparent',
                  color: inputLineCount && !loading ? '#090909' : 'var(--on-surface-variant)',
                  border: `1px solid ${inputLineCount && !loading ? 'transparent' : 'var(--glass-border)'}`,
                  borderRadius: '8px',
                  padding: '5px 14px',
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: inputLineCount && !loading ? 'pointer' : 'not-allowed',
                  boxShadow: inputLineCount && !loading ? '0 2px 10px rgba(18, 163, 131, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                <span>Buscar</span>
              </button>
            </div>

            <textarea
              className="inscr-textarea"
              value={incText}
              onChange={(e) => setIncText(e.target.value)}
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
                const before = incText.slice(0, start);
                const after = incText.slice(end);
                setIncText(before + cleaned + after);
              }}
              placeholder={'Ejemplo:\n292828\n237575\n297832'}
              style={{
                flex: 1,
                minHeight: '280px',
                resize: 'none',
                fontFamily: "'Space Grotesk', monospace",
                fontSize: '13px',
                lineHeight: '1.8',
              }}
            />
          </div>

          {/* Panel Derecho: Resultados */}
          <div className="inscr-pane-card">
            <div className="inscr-pane-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: totalCount === 0 ? 'var(--glass-border)' : foundCount === totalCount ? '#22c55e' : '#eab308',
                  transition: 'background 0.3s ease',
                }} />
                <span className="inscr-field-label">IDs Largos (MongoDB)</span>
                {totalCount > 0 && (
                  <span className="inscr-count-badge">{foundCount}/{totalCount}</span>
                )}
              </div>

              <button
                type="button"
                onClick={copiarAlPortapapeles}
                disabled={!foundCount}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: foundCount ? 'rgba(18, 163, 131, 0.15)' : 'transparent',
                  color: foundCount ? 'var(--primary)' : 'var(--on-surface-variant)',
                  border: `1px solid ${foundCount ? 'rgba(18, 163, 131, 0.35)' : 'var(--glass-border)'}`,
                  borderRadius: '8px',
                  padding: '5px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: foundCount ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
              >
                <Copy size={12} />
                <span>Copiar IDs</span>
              </button>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: '280px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {resultado.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  color: 'var(--on-surface-variant)',
                  padding: '24px',
                }}>
                  <Search size={28} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif" }}>
                    Los resultados aparecerán aquí al pulsar Buscar
                  </span>
                </div>
              ) : (
                <div style={{ overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarColor: 'var(--primary) rgba(255, 255, 255, 0.04)' }}>
                  {resultado.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderBottom: i < resultado.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                    >
                      <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', width: '24px', flexShrink: 0, fontFamily: 'monospace' }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {r.found ? (
                          <>
                            <span style={{
                              fontSize: '12.5px',
                              fontFamily: "'Space Grotesk', monospace",
                              color: 'var(--on-surface)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {r.id}
                            </span>
                            {r.name && (
                              <span style={{
                                fontSize: '10.5px',
                                color: 'var(--primary)',
                                background: 'rgba(18, 163, 131, 0.12)',
                                padding: '1px 7px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '140px',
                                flexShrink: 0,
                              }}>
                                {r.name}
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#ef4444', fontStyle: 'italic', fontFamily: "'Space Grotesk', sans-serif" }}>
                            No encontrado ({r.inc})
                          </span>
                        )}
                      </div>

                      {r.found ? (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(r.id);
                            toast.success('ID copiado');
                          }}
                          title="Copiar este ID"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--on-surface-variant)',
                            padding: '4px',
                            borderRadius: '4px',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.15s ease',
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
  );
}
