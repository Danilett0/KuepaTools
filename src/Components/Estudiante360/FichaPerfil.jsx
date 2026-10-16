import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Copy,
  Check,
  GraduationCap,
  CheckCircle2,
  Circle,
  ChevronDown,
  Database,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getStatusTheme } from '../../services/student360Service';

export default function FichaPerfil({
  student,
  programs = [],
  selectedProgramId = '',
  currentStatusName = '',
  onSelectProgram = () => { },
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedInc, setCopiedInc] = useState(false);
  const [copiedProgId, setCopiedProgId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!student) return null;

  const copyMongoId = () => {
    if (!student.mongoId) return;
    navigator.clipboard.writeText(student.mongoId).then(() => {
      setCopiedId(true);
      toast.success('ObjectId copiado al portapapeles');
      setTimeout(() => setCopiedId(false), 1500);
    });
  };

  const copyInc = () => {
    if (!student.inc) return;
    navigator.clipboard.writeText(String(student.inc)).then(() => {
      setCopiedInc(true);
      toast.success('Código INC copiado al portapapeles');
      setTimeout(() => setCopiedInc(false), 1500);
    });
  };

  const copyProgramId = (e, progId) => {
    e.stopPropagation();
    navigator.clipboard.writeText(progId).then(() => {
      setCopiedProgId(progId);
      toast.success('ID de programa copiado');
      setTimeout(() => setCopiedProgId(null), 1500);
    });
  };

  const activeProgram = programs.find((p) => p.programId === selectedProgramId) || programs[0];
  const activeProgramStatus = activeProgram?.statusName || currentStatusName || '';
  const activeStatusTheme = getStatusTheme(activeProgramStatus);

  return (
    <div
      className="profile-card-enter"
      style={{
        position: 'relative',
        zIndex: isDropdownOpen ? 100 : 10,
        background: 'var(--surface-low)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '18px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* ── Columna Izquierda: Identidad y Contacto del Estudiante ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', minWidth: 0, flex: '1 1 auto' }}>
        {/* Avatar */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #06a080 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#090909',
            fontWeight: 800,
            fontSize: '17px',
            boxShadow: '0 2px 12px rgba(18, 163, 131, 0.35)',
            flexShrink: 0,
          }}
        >
          {student.fullName ? student.fullName.charAt(0).toUpperCase() : <User size={18} />}
        </div>

        {/* Identidad del Estudiante e Identificadores en la Misma Fila */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', minWidth: 0 }}>
          <h2
            style={{
              fontSize: '16.5px',
              fontWeight: 800,
              color: 'var(--on-surface)',
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            {student.fullName || 'Estudiante sin nombre'}
          </h2>

          {student.inc && (
            <span
              onClick={copyInc}
              style={{
                fontSize: '11.5px',
                color: 'var(--primary)',
                fontWeight: 800,
                background: 'rgba(18, 163, 131, 0.12)',
                padding: '3px 10px',
                borderRadius: '6px',
                border: `1px solid ${copiedInc ? 'var(--primary)' : 'rgba(18, 163, 131, 0.25)'}`,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
              title={`Código INC: ${student.inc} (Clic para copiar)`}
            >
              <span>INC: {student.inc}</span>
              {copiedInc && <Check size={11} color="var(--primary)" />}
            </span>
          )}

          {/* Chip Mongo ObjectId */}
          {student.mongoId && (
            <div
              className="micro-chip-enter"
              onClick={copyMongoId}
              style={{
                animationDelay: '60ms',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '3px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: `1px solid ${copiedId ? 'var(--primary)' : 'var(--glass-border)'}`,
                fontSize: '11.5px',
                color: copiedId ? 'var(--primary)' : '#94a3b8',
                fontFamily: "'Space Grotesk', monospace",
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              title={`Mongo ObjectId: ${student.mongoId} (Clic para copiar)`}
              onMouseEnter={(e) => {
                if (!copiedId) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = 'var(--on-surface)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (!copiedId) {
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }
              }}
            >
              <Database size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>{student.mongoId}</span>
              {copiedId ? (
                <Check size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
              ) : (
                <Copy size={11} style={{ opacity: 0.6, flexShrink: 0 }} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Columna Derecha: Programa Activo y Acciones Rápidas ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
        {/* Fila 1 Derecha: Badge de Estado del Programa y Selector Dropdown */}
        {programs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeProgramStatus && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 9px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  background: activeStatusTheme.bg,
                  color: activeStatusTheme.text,
                  border: `1px solid ${activeStatusTheme.border}`,
                  whiteSpace: 'nowrap',
                  boxShadow: `0 0 10px ${activeStatusTheme.bg}`,
                }}
                title={`Estado del programa activo: ${activeProgramStatus}`}
              >
                <span
                  style={{
                    width: '6.5px',
                    height: '6.5px',
                    borderRadius: '50%',
                    background: activeStatusTheme.dot,
                    boxShadow: `0 0 6px ${activeStatusTheme.dot}`,
                    flexShrink: 0,
                  }}
                />
                {activeProgramStatus}
              </span>
            )}

            {/* Selector Dropdown de Programas */}
            <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0, zIndex: isDropdownOpen ? 1000 : 1 }}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '34px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: isDropdownOpen ? '1px solid var(--primary)' : '1px solid rgba(18, 163, 131, 0.35)',
                  background: isDropdownOpen ? 'rgba(18, 163, 131, 0.2)' : 'rgba(18, 163, 131, 0.08)',
                  boxShadow: isDropdownOpen ? '0 0 14px rgba(18, 163, 131, 0.3)' : 'none',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  fontSize: '12px',
                  fontWeight: 700,
                  maxWidth: '380px',
                }}
                title={`Programa activo: ${activeProgram?.name || 'Selecciona un programa'}`}
                onMouseEnter={(e) => {
                  if (!isDropdownOpen) {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'rgba(18, 163, 131, 0.14)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDropdownOpen) {
                    e.currentTarget.style.borderColor = 'rgba(18, 163, 131, 0.35)';
                    e.currentTarget.style.background = 'rgba(18, 163, 131, 0.08)';
                  }
                }}
              >
                <GraduationCap size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#f8fafc',
                  }}
                >
                  {activeProgram?.name || 'Seleccionar Programa'}
                </span>

                {programs.length > 1 && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      background: 'rgba(18, 163, 131, 0.22)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(18, 163, 131, 0.4)',
                      padding: '1px 6px',
                      borderRadius: '5px',
                      flexShrink: 0,
                    }}
                  >
                    {programs.findIndex((p) => p.programId === activeProgram?.programId) + 1}/{programs.length}
                  </span>
                )}

                <ChevronDown
                  size={13}
                  color={isDropdownOpen ? 'var(--primary)' : 'var(--on-surface-variant)'}
                  style={{
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    flexShrink: 0,
                  }}
                />
              </button>

              {/* Menú Flotante del Dropdown */}
              {isDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '410px',
                    maxWidth: 'min(440px, 94vw)',
                    background: '#131822',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 10px 24px rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    animation: 'dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) both',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 6px 10px 6px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <GraduationCap size={14} color="var(--primary)" />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--on-surface-variant)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Programas Inscritos
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          background: 'rgba(18, 163, 131, 0.2)',
                          color: 'var(--primary)',
                          padding: '1px 6px',
                          borderRadius: '10px',
                        }}
                      >
                        {programs.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '4px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--on-surface-variant)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--on-surface-variant)';
                      }}
                      title="Cerrar selector"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div
                    style={{
                      maxHeight: '280px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      paddingRight: '2px',
                      scrollbarWidth: 'thin',
                    }}
                  >
                    {programs.map((prog) => {
                      const isSelected = prog.programId === activeProgram?.programId;
                      const isCopied = copiedProgId === prog.programId;

                      return (
                        <div
                          key={prog.programId}
                          onClick={() => {
                            onSelectProgram(prog.programId);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: isSelected ? 'rgba(18, 163, 131, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isSelected ? 'rgba(18, 163, 131, 0.45)' : 'rgba(255, 255, 255, 0.05)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
                            {isSelected ? (
                              <CheckCircle2 size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                            ) : (
                              <Circle size={15} color="rgba(255, 255, 255, 0.25)" style={{ flexShrink: 0 }} />
                            )}
                            <span
                              style={{
                                fontSize: '12.5px',
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? '#ffffff' : '#cbd5e1',
                                lineHeight: 1.35,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={prog.name}
                            >
                              {prog.name}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {prog.statusName && (
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  background: getStatusTheme(prog.statusName).bg,
                                  color: getStatusTheme(prog.statusName).text,
                                  border: `1px solid ${getStatusTheme(prog.statusName).border}`,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {prog.statusName}
                              </span>
                            )}
                            <div
                              onClick={(e) => copyProgramId(e, prog.programId)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: isCopied ? 'rgba(18, 163, 131, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                padding: '3px 7px',
                                borderRadius: '5px',
                                fontSize: '9.5px',
                                fontWeight: 600,
                                fontFamily: 'monospace',
                                color: isCopied ? 'var(--primary)' : '#94a3b8',
                                border: `1px solid ${isCopied ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                                transition: 'all 0.15s ease',
                                cursor: 'pointer',
                              }}
                              title={`Copiar ID del programa: ${prog.programId}`}
                            >
                              <span>...{prog.programId.slice(-4)}</span>
                              {isCopied ? <Check size={10} color="var(--primary)" /> : <Copy size={10} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
