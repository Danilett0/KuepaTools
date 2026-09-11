import React, { useState } from 'react';
import { User, Copy, Check, Mail, Phone, ExternalLink, Shield, ClipboardList } from 'lucide-react';
import { toast } from 'react-toastify';
import { ALLIANCE_IDS } from '../../utils/constants';
import { formatStudentTicketSummary } from '../../services/student360Service';

export default function FichaPerfil({ student }) {
  const [copied, setCopied] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);

  if (!student) return null;

  const copyMongoId = () => {
    navigator.clipboard.writeText(student.mongoId).then(() => {
      setCopied(true);
      toast.success('ObjectId copiado al portapapeles');
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const isNA = student.allianceId === ALLIANCE_IDS.na;
  const allianceName = isNA ? 'Nueva América' : 'Kuepa';
  const sisUrl = student.mongoId ? `https://sis.kuepa.com/students/details/${student.mongoId}` : '#';

  const copyTicketSummary = () => {
    const summary = formatStudentTicketSummary(student, allianceName);

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
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Identidad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #06a080 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#090909',
              fontWeight: 800,
              fontSize: '22px',
              boxShadow: '0 4px 15px rgba(18, 163, 131, 0.3)',
              flexShrink: 0,
            }}
          >
            {student.fullName ? student.fullName.charAt(0).toUpperCase() : <User size={26} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--on-surface)', margin: 0 }}>
                {student.fullName || 'Estudiante sin nombre'}
              </h2>
              <span
                style={{
                  background: isNA ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isNA ? '#22c55e' : '#ef4444',
                  border: `1px solid ${isNA ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  padding: '3px 10px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                }}
              >
                {allianceName}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--primary)',
                  fontWeight: 800,
                  background: 'rgba(18, 163, 131, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(18, 163, 131, 0.25)',
                }}
              >
                INC: #{student.inc || 'N/A'}
              </span>

              <div
                onClick={copyMongoId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid var(--glass-border)',
                  fontSize: '12px',
                  color: '#cbd5e1',
                  fontFamily: "'Space Grotesk', monospace",
                  transition: 'all 0.2s',
                }}
                title="Clic para copiar Mongo ObjectId"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <span>{student.mongoId}</span>
                {copied ? <Check size={13} color="var(--primary)" /> : <Copy size={13} />}
              </div>
            </div>
          </div>
        </div>

        {/* Contacto y Enlace Directo SIS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {student.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px' }}>
              <Mail size={15} color="var(--primary)" />
              <span>{student.email}</span>
            </div>
          )}

          {student.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px' }}>
              <Phone size={15} color="var(--primary)" />
              <span>{student.phone}</span>
            </div>
          )}

          {/* Botón Copiar Resumen de Ticket */}
          <button
            type="button"
            onClick={copyTicketSummary}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: copiedTicket ? 'rgba(18, 163, 131, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${copiedTicket ? 'var(--primary)' : 'var(--glass-border)'}`,
              color: copiedTicket ? 'var(--primary)' : 'var(--on-surface)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Nunito', sans-serif",
            }}
            title="Copiar datos del estudiante formateados para ticket de soporte"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.background = 'rgba(18, 163, 131, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = copiedTicket ? 'var(--primary)' : 'var(--glass-border)';
              e.currentTarget.style.color = copiedTicket ? 'var(--primary)' : 'var(--on-surface)';
              e.currentTarget.style.background = copiedTicket ? 'rgba(18, 163, 131, 0.2)' : 'rgba(255, 255, 255, 0.05)';
            }}
          >
            {copiedTicket ? <Check size={13} color="var(--primary)" /> : <ClipboardList size={13} />}
            <span>{copiedTicket ? '¡Copiado!' : 'Copiar para Ticket'}</span>
          </button>

          <a
            href={sisUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              color: 'var(--on-surface)',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            title="Abrir perfil del estudiante en SIS"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.background = 'rgba(18, 163, 131, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.color = 'var(--on-surface)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <span>Ver en SIS</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
