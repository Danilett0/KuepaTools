import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  Sparkles,
  Database,
  Layers,
  CheckSquare,
  Wrench,
  UserMinus,
  Calculator,
  Copy,
  UserCog,
  ChevronDown,
  Search,
} from 'lucide-react';

export default function AccionesRapidas({
  hasStudent,
  hasProgram,
  groupsCount,
  selectedGroupIds = [],
  onClearSelection,
  onAction,
  statusOptions = [],
  selectedProgramName = '',
  currentStatusName = '',
}) {
  const isBatchMode = selectedGroupIds.length > 0;
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusSearch, setStatusSearch] = useState('');
  const statusRef = useRef(null);

  useEffect(() => {
    if (!statusMenuOpen) return;
    const handleClickOutside = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [statusMenuOpen]);

  useEffect(() => {
    if (!statusMenuOpen) {
      setStatusSearch('');
      return;
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setStatusMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [statusMenuOpen]);

  const filteredStatuses = useMemo(() => {
    if (!statusSearch.trim()) return statusOptions;
    const q = statusSearch.toLowerCase();
    return statusOptions.filter((s) => s.label.toLowerCase().includes(q));
  }, [statusOptions, statusSearch]);

  const getStatusDotColor = (name = '') => {
    const norm = name.toLowerCase();
    if (norm.includes('activo')) return '#10b981';
    if (norm.includes('graduado')) return '#38bdf8';
    if (norm.includes('retirado') || norm.includes('desertor') || norm.includes('inactivo') || norm.includes('expulsado')) return '#ef4444';
    if (norm.includes('suspendido') || norm.includes('aplazado') || norm.includes('moroso')) return '#f59e0b';
    if (norm.includes('egresado') || norm.includes('finalizado')) return '#6366f1';
    return '#a855f7';
  };

  return (
    <div
      style={{
        background: 'var(--surface-low)',
        border: `1px solid ${isBatchMode ? 'var(--primary)' : 'var(--glass-border)'}`,
        borderRadius: '12px',
        padding: '8px 14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '6px',
        boxShadow: isBatchMode ? '0 0 16px rgba(18, 163, 131, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.25s ease',
        minWidth: 0,
      }}
    >
      {/* ── Cabecera de la barra ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {isBatchMode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <CheckSquare size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 800, fontSize: '11px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Acciones en lote ({selectedGroupIds.length} materias)
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} color="var(--primary)" />
              <span style={{ fontWeight: 800, fontSize: '11px', color: 'var(--on-surface)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Acciones Rápidas
              </span>
            </div>
            {!hasStudent && (
              <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', opacity: 0.7 }}>
                Requiere estudiante
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Botonera: Modo Lote vs Modo Global ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {isBatchMode ? (
          <>
            {/* Auditar Seleccionadas */}
            <button
              type="button"
              onClick={() => onAction('audit_group', { groupIds: selectedGroupIds })}
              style={{
                height: '32px',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Nunito', sans-serif",
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={`Generar audit:subject para las ${selectedGroupIds.length} materias`}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#38bdf8';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                e.currentTarget.style.color = '#38bdf8';
              }}
            >
              <Activity size={13} />
              <span>Auditar ({selectedGroupIds.length})</span>
            </button>

            {/* Recalcular Seleccionadas */}
            <button
              type="button"
              onClick={() => onAction('recalculate_grade', { groupIds: selectedGroupIds })}
              style={{
                height: '32px',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: 'rgba(18, 163, 131, 0.15)',
                border: '1px solid rgba(18, 163, 131, 0.4)',
                color: '#10b981',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Nunito', sans-serif",
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={`Recalcular notas para las ${selectedGroupIds.length} materias`}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary)';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(18, 163, 131, 0.15)';
                e.currentTarget.style.color = '#10b981';
              }}
            >
              <Calculator size={13} />
              <span>Recalcular ({selectedGroupIds.length})</span>
            </button>

            {/* Corregir Entregables Seleccionadas */}
            <button
              type="button"
              onClick={() => onAction('fix_deliverable', { groupIds: selectedGroupIds })}
              style={{
                height: '32px',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                color: '#eab308',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Nunito', sans-serif",
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={`Corregir entregables para las ${selectedGroupIds.length} materias`}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#eab308';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(234, 179, 8, 0.15)';
                e.currentTarget.style.color = '#eab308';
              }}
            >
              <Wrench size={13} />
              <span>Entregables ({selectedGroupIds.length})</span>
            </button>

            {/* Retirar Seleccionadas */}
            <button
              type="button"
              onClick={() => onAction('remove_user', { groupIds: selectedGroupIds })}
              style={{
                height: '32px',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Nunito', sans-serif",
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={`Retirar estudiante de las ${selectedGroupIds.length} materias`}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              <UserMinus size={13} />
              <span>Retirar ({selectedGroupIds.length})</span>
            </button>

            {/* Copiar IDs Seleccionadas */}
            <button
              type="button"
              onClick={() => onAction('copy_group_ids', { groupIds: selectedGroupIds })}
              style={{
                height: '32px',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--glass-border)',
                color: 'var(--on-surface)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Nunito', sans-serif",
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={`Copiar ${selectedGroupIds.length} IDs de materias seleccionadas al portapapeles`}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(18, 163, 131, 0.2)';
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.color = 'var(--on-surface)';
              }}
            >
              <Copy size={13} />
              <span>Copiar IDs ({selectedGroupIds.length})</span>
            </button>
          </>
        ) : (
          <>
            {/* Auditar Avance */}
            <button
              type="button"
              onClick={() => onAction('audit')}
              disabled={!hasStudent || !hasProgram}
              style={{
                height: '32px',
                padding: '0 12px',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                border: 'none',
                background: !hasStudent || !hasProgram
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
                color: !hasStudent || !hasProgram ? 'var(--on-surface-variant)' : '#090909',
                boxShadow: !hasStudent || !hasProgram ? 'none' : '0 2px 10px rgba(18, 163, 131, 0.3)',
                opacity: !hasStudent || !hasProgram ? 0.35 : 1,
                cursor: !hasStudent || !hasProgram ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Nunito', sans-serif",
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={!hasStudent ? 'Carga un estudiante primero' : !hasProgram ? 'Selecciona un programa para auditar' : 'Genera comandos para auditar estadísticas y compactos'}
              onMouseEnter={(e) => {
                if (hasStudent && hasProgram) e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                if (hasStudent && hasProgram) e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Activity size={13} />
              <span>Auditar Avance</span>
            </button>

            {/* Cambiar Estado del Programa */}
            <div ref={statusRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  if (hasStudent && hasProgram) {
                    setStatusMenuOpen((prev) => !prev);
                  }
                }}
                disabled={!hasStudent || !hasProgram}
                style={{
                  height: '32px',
                  padding: '0 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '8px',
                  background: statusMenuOpen
                    ? 'rgba(245, 158, 11, 0.22)'
                    : !hasStudent || !hasProgram
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(245, 158, 11, 0.12)',
                  border: `1px solid ${
                    statusMenuOpen
                      ? '#f59e0b'
                      : !hasStudent || !hasProgram
                      ? 'var(--glass-border)'
                      : 'rgba(245, 158, 11, 0.4)'
                  }`,
                  color: !hasStudent || !hasProgram ? 'var(--on-surface-variant)' : '#fbbf24',
                  boxShadow: statusMenuOpen ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none',
                  opacity: !hasStudent || !hasProgram ? 0.35 : 1,
                  cursor: !hasStudent || !hasProgram ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Nunito', sans-serif",
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                title={
                  !hasStudent
                    ? 'Carga un estudiante primero'
                    : !hasProgram
                    ? 'Selecciona un programa para cambiar estado'
                    : 'Generar comando status:change para el programa activo'
                }
                onMouseEnter={(e) => {
                  if (hasStudent && hasProgram && !statusMenuOpen) {
                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.22)';
                    e.currentTarget.style.borderColor = '#f59e0b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasStudent && hasProgram && !statusMenuOpen) {
                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                  }
                }}
              >
                <UserCog size={13} />
                <span>Cambiar Estado</span>
                <ChevronDown
                  size={12}
                  style={{
                    transform: statusMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {statusMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    minWidth: '220px',
                    maxWidth: '280px',
                    background: '#16191c',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '10px',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7), 0 0 16px rgba(245, 158, 11, 0.15)',
                    zIndex: 300,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Encabezado del Popover */}
                  <div
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--glass-border)',
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        color: 'var(--on-surface-variant)',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                      }}
                    >
                      Estado en Programa:
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--on-surface)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                      }}
                    >
                      🎓 {selectedProgramName || 'Programa actual'}
                    </div>
                    {currentStatusName && (
                      <div style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '2px' }}>
                        Actual: <strong>{currentStatusName}</strong>
                      </div>
                    )}
                  </div>

                  {/* Buscador si hay más de 5 estados */}
                  {statusOptions.length > 5 && (
                    <div
                      style={{
                        padding: '6px 10px',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Search size={12} color="var(--on-surface-variant)" />
                      <input
                        type="text"
                        autoFocus
                        value={statusSearch}
                        onChange={(e) => setStatusSearch(e.target.value)}
                        placeholder="Buscar estado..."
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: 'var(--on-surface)',
                          fontSize: '11px',
                          fontFamily: "'Nunito', sans-serif",
                        }}
                      />
                    </div>
                  )}

                  {/* Lista de opciones de estado */}
                  <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
                    {filteredStatuses.length > 0 ? (
                      filteredStatuses.map((opt) => {
                        const isCurrent = opt.label === currentStatusName;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              onAction('change_program_status', {
                                statusId: opt.value,
                                statusName: opt.label,
                              });
                              setStatusMenuOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              background: isCurrent ? 'rgba(18, 163, 131, 0.12)' : 'transparent',
                              border: 'none',
                              color: isCurrent ? 'var(--primary)' : 'var(--on-surface)',
                              fontWeight: isCurrent ? 800 : 600,
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.15s ease',
                              fontFamily: "'Nunito', sans-serif",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                              e.currentTarget.style.color = '#fbbf24';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = isCurrent
                                ? 'rgba(18, 163, 131, 0.12)'
                                : 'transparent';
                              e.currentTarget.style.color = isCurrent ? 'var(--primary)' : 'var(--on-surface)';
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: getStatusDotColor(opt.label),
                                  display: 'inline-block',
                                  flexShrink: 0,
                                }}
                              />
                              <span>{opt.label}</span>
                            </span>
                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: '9px',
                                  background: 'rgba(18, 163, 131, 0.2)',
                                  color: 'var(--primary)',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                }}
                              >
                                Actual
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div
                        style={{
                          padding: '8px',
                          fontSize: '11px',
                          color: 'var(--on-surface-variant)',
                          textAlign: 'center',
                        }}
                      >
                        No se encontraron estados
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recalcular Todos los Grupos */}
            <button
              type="button"
              onClick={() => onAction('recalculate_all_grades')}
              disabled={!hasStudent || groupsCount === 0}
              style={{
                height: '32px',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: 'rgba(18, 163, 131, 0.12)',
                border: '1px solid rgba(18, 163, 131, 0.4)',
                color: '#10b981',
                opacity: !hasStudent || groupsCount === 0 ? 0.35 : 1,
                cursor: !hasStudent || groupsCount === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Nunito', sans-serif",
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={!hasStudent ? 'Carga un estudiante primero' : 'Recalcular notas finales de todos los grupos matriculados'}
              onMouseEnter={(e) => {
                if (hasStudent && groupsCount > 0) {
                  e.currentTarget.style.background = 'rgba(18, 163, 131, 0.25)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (hasStudent && groupsCount > 0) {
                  e.currentTarget.style.background = 'rgba(18, 163, 131, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(18, 163, 131, 0.4)';
                }
              }}
            >
              <RefreshCw size={13} />
              <span>Recalcular ({groupsCount})</span>
            </button>

            {/* Limpiar Caché LMS */}
            <button
              type="button"
              onClick={() => onAction('clean_cache_lms')}
              disabled={!hasStudent}
              style={{
                height: '32px',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                opacity: !hasStudent ? 0.35 : 1,
                cursor: !hasStudent ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Nunito', sans-serif",
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={!hasStudent ? 'Carga un estudiante primero' : 'Generar comando para limpiar caché de SIS/LMS'}
              onMouseEnter={(e) => {
                if (hasStudent) {
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.25)';
                  e.currentTarget.style.borderColor = '#38bdf8';
                }
              }}
              onMouseLeave={(e) => {
                if (hasStudent) {
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                }
              }}
            >
              <Database size={13} />
              <span>Caché LMS</span>
            </button>

            {/* Limpiar Caché CRM */}
            <button
              type="button"
              onClick={() => onAction('clean_cache_crm')}
              disabled={!hasStudent}
              style={{
                height: '32px',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: 'rgba(192, 132, 252, 0.12)',
                border: '1px solid rgba(192, 132, 252, 0.35)',
                color: '#c084fc',
                opacity: !hasStudent ? 0.35 : 1,
                cursor: !hasStudent ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Nunito', sans-serif",
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={!hasStudent ? 'Carga un estudiante primero' : 'Generar comando para limpiar caché de CRM'}
              onMouseEnter={(e) => {
                if (hasStudent) {
                  e.currentTarget.style.background = 'rgba(192, 132, 252, 0.25)';
                  e.currentTarget.style.borderColor = '#c084fc';
                }
              }}
              onMouseLeave={(e) => {
                if (hasStudent) {
                  e.currentTarget.style.background = 'rgba(192, 132, 252, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.35)';
                }
              }}
            >
              <Layers size={13} />
              <span>Caché CRM</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
