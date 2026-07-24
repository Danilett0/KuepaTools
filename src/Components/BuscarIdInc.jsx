import React, { useState, useEffect } from 'react';
import { Copy, Search, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useUsuariosCompletos } from '../hooks/useUsuariosCompletos';
import AllianceSwitcher from './ui/AllianceSwitcher';
import ClearButton from './ui/ClearButton';

const BuscarIdInc = () => {
  const [incText, setIncText] = useLocalStorage('buscarid-incText', '');
  const [alianza, setAlianza] = useLocalStorage('buscarid-alianza', 'na');
  const [resultado, setResultado] = useState([]);
  const { data: usuariosCompletos, loading } = useUsuariosCompletos();

  useEffect(() => {
    if (!incText.trim()) {
      setResultado([]);
      return;
    }

    const lines = incText.split('\n').map(line => line.trim()).filter(line => line !== '');
    const allianceId = alianza === 'kuepa'
      ? '602169e217b5c8a27f9e9c06'
      : '6303ed663138387a1669d82a';

    const results = lines.map(incStr => {
      const incNum = Number(incStr);
      if (isNaN(incNum)) return { inc: incStr, id: null, found: false };

      const user = usuariosCompletos.find(
        u => u.incremental_user_code === incNum && u.alliance_id?.$oid === allianceId
      );

      if (user?._id?.$oid) {
        return { inc: incStr, id: user._id.$oid, name: user.profile?.full_name, found: true };
      }
      return { inc: incStr, id: null, found: false };
    });

    setResultado(results);
  }, [incText, alianza, usuariosCompletos]);

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

          {/* ── Divisor ────────────────────────────────────────── */}
          <div style={{ height: '1px', background: 'var(--glass-border)', marginBottom: '24px' }} />

          {/* ── Cuerpo principal ───────────────────────────────── */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>

            {/* Panel izquierdo: entrada */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <label className="input-label" style={{ marginBottom: 0 }}>
                  IDs INCREMENTALES
                  {totalCount > 0 && (
                    <span style={{ marginLeft: '8px', fontWeight: 400, color: 'var(--on-surface-variant)', fontSize: '12px' }}>
                      {totalCount} ingresados
                    </span>
                  )}
                </label>
              </div>
              <textarea
                className="inscripciones-input"
                value={incText}
                onChange={(e) => setIncText(e.target.value)}
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
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 16px',
                          borderBottom: i < resultado.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        }}
                      >
                        {/* Número incremental */}
                        <span style={{
                          fontSize: '12px', fontFamily: "'Space Grotesk', monospace",
                          color: 'var(--on-surface-variant)', minWidth: '48px',
                          background: 'rgba(255,255,255,0.05)', borderRadius: '4px',
                          padding: '2px 6px', textAlign: 'center', flexShrink: 0,
                        }}>
                          #{r.inc}
                        </span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          {r.found ? (
                            <>
                              <div style={{
                                fontSize: '12px', fontFamily: "'Space Grotesk', monospace",
                                color: 'var(--on-surface)', letterSpacing: '0.02em',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {r.id}
                              </div>
                              {r.name && (
                                <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px' }}>
                                  {r.name}
                                </div>
                              )}
                            </>
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
