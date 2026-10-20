import React from 'react';
import { UserCheck, Zap } from 'lucide-react';

export default function HubVacio({ onSelectExample = () => {} }) {
  return (
    <div
      className="animate-slide-down"
      style={{
        background: 'var(--surface-low)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '52px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Icono central minimalista */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'rgba(18, 163, 131, 0.1)',
          border: '1px solid rgba(18, 163, 131, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          boxShadow: '0 0 20px rgba(18, 163, 131, 0.15)',
        }}
      >
        <UserCheck size={28} />
      </div>

      {/* Textos descriptivos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '520px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: 'var(--on-surface)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Consulta de Estudiante 360°
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--on-surface-variant)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Ingresa un código INC, cédula o Mongo ObjectId en la barra superior para decodificar
          la información académica, programas y materias del estudiante.
        </p>
      </div>

      {/* Atajos sutiles de prueba */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '6px',
        }}
      >
        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>
          Accesos rápidos:
        </span>

        <button
          type="button"
          onClick={() => onSelectExample('19999')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(18, 163, 131, 0.08)',
            border: '1px solid rgba(18, 163, 131, 0.25)',
            padding: '4px 10px',
            borderRadius: '6px',
            color: 'var(--primary)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'Space Grotesk', monospace",
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(18, 163, 131, 0.18)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(18, 163, 131, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(18, 163, 131, 0.25)';
          }}
          title="Cargar estudiante INC #19999"
        >
          <Zap size={11} color="var(--primary)" />
          <span>INC 19999</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectExample('546')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--glass-border)',
            padding: '4px 10px',
            borderRadius: '6px',
            color: '#cbd5e1',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'Space Grotesk', monospace",
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.color = '#cbd5e1';
          }}
          title="Cargar estudiante INC #546"
        >
          <Zap size={11} color="var(--on-surface-variant)" />
          <span>INC 546</span>
        </button>
      </div>
    </div>
  );
}
