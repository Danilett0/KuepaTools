import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Copy,
  Check,
  Mail,
  Phone,
  ExternalLink,
  ClipboardList,
  GraduationCap,
  CheckCircle2,
  ChevronDown,
  Database,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ALLIANCE_IDS } from '../../utils/constants';
import { formatStudentTicketSummary, getStatusTheme } from '../../services/student360Service';

export default function FichaPerfil({
  student,
  programs = [],
  selectedProgramId = '',
  currentStatusName = '',
  onSelectProgram = () => { },
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
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

  const copyEmail = () => {
    if (!student.email) return;
    navigator.clipboard.writeText(student.email).then(() => {
      setCopiedEmail(true);
      toast.success('Correo copiado al portapapeles');
      setTimeout(() => setCopiedEmail(false), 1500);
    });
  };

  const copyPhone = () => {
    if (!student.phone) return;
    navigator.clipboard.writeText(student.phone).then(() => {
      setCopiedPhone(true);
      toast.success('Teléfono copiado al portapapeles');
      setTimeout(() => setCopiedPhone(false), 1500);
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

  const isNA = student.allianceId === ALLIANCE_IDS.na;
  const allianceName = isNA ? 'Nueva América' : 'Kuepa';
  const sisUrl = student.mongoId ? `https://sis.kuepa.com/students/details/${student.mongoId}` : '#';
  const activeProgram = programs.find((p) => p.programId === selectedProgramId) || programs[0];
  const activeProgramStatus = activeProgram?.statusName || currentStatusName || '';
  const activeStatusTheme = getStatusTheme(activeProgramStatus);

  const copyTicketSummary = () => {
    const summary = formatStudentTicketSummary(student, allianceName, activeProgram?.name);

    navigator.clipboard.writeText(summary).then(() => {
      setCopiedTicket(true);
      toast.success('Resumen para ticket copiado al portapapeles');
      setTimeout(() => setCopiedTicket(false), 2000);
    });
  };

  return (
    <div
      style={{
        background: 'var(--surface-low)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* ── Columna Izquierda: Identidad y Contacto del Estudiante ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: '1 1 auto' }}>
        {/* Avatar */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #06a080 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#090909',
            fontWeight: 800,
            fontSize: '16px',
            boxShadow: '0 2px 12px rgba(18, 163, 131, 0.35)',
            flexShrink: 0,
          }}
        >
          {student.fullName ? student.fullName.charAt(0).toUpperCase() : <User size={18} />}
        </div>

        {/* Bloque de Información en 2 Filas Estructuradas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
          {/* Fila 1: Nombre, Alianza y Ticket INC */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: 'var(--on-surface)',
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              {student.fullName || 'Estudiante sin nombre'}
            </h2>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: isNA ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: isNA ? '#4ade80' : '#f87171',
                border: `1px solid ${isNA ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                padding: '2px 8px',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: isNA ? '#4ade80' : '#f87171',
                }}
              />
              {allianceName}
            </span>

            {student.inc && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--primary)',
                  fontWeight: 800,
                  background: 'rgba(18, 163, 131, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(18, 163, 131, 0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                INC: {student.inc}
              </span>
            )}
          </div>

          {/* Fila 2: Chips Interactivos (Mongo ID, Email, Teléfono) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Chip Mongo ObjectId */}
            {student.mongoId && (
              <div
                onClick={copyMongoId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: `1px solid ${copiedId ? 'var(--primary)' : 'var(--glass-border)'}`,
                  fontSize: '11px',
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

            {/* Chip Email */}
            {student.email && (
              <div
                onClick={copyEmail}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: `1px solid ${copiedEmail ? 'var(--primary)' : 'var(--glass-border)'}`,
                  fontSize: '11px',
                  color: copiedEmail ? 'var(--primary)' : '#94a3b8',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                title={`Correo: ${student.email} (Clic para copiar)`}
                onMouseEnter={(e) => {
                  if (!copiedEmail) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.color = 'var(--on-surface)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copiedEmail) {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
              >
                <Mail size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>{student.email}</span>
                {copiedEmail ? (
                  <Check size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
                ) : (
                  <Copy size={11} style={{ opacity: 0.6, flexShrink: 0 }} />
                )}
              </div>
            )}

            {/* Chip Teléfono */}
            {student.phone && (
              <div
                onClick={copyPhone}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: `1px solid ${copiedPhone ? 'var(--primary)' : 'var(--glass-border)'}`,
                  fontSize: '11px',
                  color: copiedPhone ? 'var(--primary)' : '#94a3b8',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                title={`Teléfono: ${student.phone} (Clic para copiar)`}
                onMouseEnter={(e) => {
                  if (!copiedPhone) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.color = 'var(--on-surface)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copiedPhone) {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
              >
                <Phone size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>{student.phone}</span>
                {copiedPhone ? (
                  <Check size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
                ) : (
                  <Copy size={11} style={{ opacity: 0.6, flexShrink: 0 }} />
                )}
              </div>
            )}
          </div>
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
            <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  height: '28px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: `1px solid ${isDropdownOpen ? 'var(--primary)' : 'var(--glass-border)'}`,
                  background: isDropdownOpen ? 'rgba(18, 163, 131, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--on-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontSize: '11px',
                  fontWeight: 700,
                  maxWidth: '340px',
                }}
                title={`Programa activo: ${activeProgram?.name || 'Selecciona un programa'}`}
                onMouseEnter={(e) => {
                  if (!isDropdownOpen) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  if (!isDropdownOpen) e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}
              >
                <GraduationCap size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#f1f5f9',
                  }}
                >
                  {activeProgram?.name || 'Seleccionar Programa'}
                </span>

                {programs.length > 1 && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      background: 'rgba(18, 163, 131, 0.15)',
                      color: 'var(--primary)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}
                  >
                    {programs.findIndex((p) => p.programId === activeProgram?.programId) + 1}/{programs.length}
                  </span>
                )}

                <ChevronDown
                  size={12}
                  color="var(--on-surface-variant)"
                  style={{
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                />
              </button>

              {/* Menú Flotante del Dropdown */}
              {isDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '380px',
                    maxWidth: '90vw',
                    background: '#12161a',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    zIndex: 100,
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 8px 6px 8px',
                      borderBottom: '1px solid var(--glass-border)',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--on-surface-variant)' }}>
                      PROGRAMAS INSCRITOS ({programs.length})
                    </span>
                    <X
                      size={13}
                      color="var(--on-surface-variant)"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setIsDropdownOpen(false)}
                    />
                  </div>

                  <div
                    style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
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
                            gap: '8px',
                            padding: '7px 10px',
                            borderRadius: '7px',
                            background: isSelected ? 'rgba(18, 163, 131, 0.12)' : 'transparent',
                            border: `1px solid ${isSelected ? 'rgba(18, 163, 131, 0.4)' : 'transparent'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            {isSelected ? (
                              <CheckCircle2 size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                            ) : (
                              <GraduationCap size={13} color="var(--on-surface-variant)" style={{ flexShrink: 0 }} />
                            )}
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? 'var(--primary)' : 'var(--on-surface)',
                                lineHeight: 1.3,
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
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  background: getStatusTheme(prog.statusName).bg,
                                  color: getStatusTheme(prog.statusName).text,
                                  border: `1px solid ${getStatusTheme(prog.statusName).border}`,
                                  padding: '1px 6px',
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
                                gap: '3px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                fontSize: '9px',
                                color: isCopied ? 'var(--primary)' : '#94a3b8',
                                border: `1px solid ${isCopied ? 'var(--primary)' : 'var(--glass-border)'}`,
                                transition: 'all 0.15s ease',
                              }}
                              title={`Copiar ID del programa: ${prog.programId}`}
                            >
                              <span>...{prog.programId.slice(-4)}</span>
                              {isCopied ? <Check size={9} color="var(--primary)" /> : <Copy size={9} />}
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

        {/* Fila 2 Derecha: Acciones Rápidas Copiar Ticket y Ver en SIS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={copyTicketSummary}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              height: '26px',
              padding: '0 9px',
              borderRadius: '6px',
              background: copiedTicket ? 'rgba(18, 163, 131, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${copiedTicket ? 'var(--primary)' : 'var(--glass-border)'}`,
              color: copiedTicket ? 'var(--primary)' : 'var(--on-surface)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: "'Nunito', sans-serif",
              whiteSpace: 'nowrap',
            }}
            title="Copiar datos del estudiante formateados para ticket de soporte"
          >
            {copiedTicket ? <Check size={11} color="var(--primary)" /> : <ClipboardList size={11} />}
            <span>{copiedTicket ? '¡Copiado!' : 'Copiar Ticket'}</span>
          </button>

          <a
            href={sisUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              height: '26px',
              padding: '0 9px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              color: 'var(--on-surface)',
              fontSize: '11px',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box',
              whiteSpace: 'nowrap',
            }}
            title="Abrir perfil del estudiante en SIS"
          >
            <span>Ver en SIS</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}
