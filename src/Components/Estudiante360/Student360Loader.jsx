import React from 'react';
import { Cpu, Sparkles, Layers, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

export default function Student360Loader({ identifier = '' }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(17, 21, 26, 0.95) 0%, rgba(10, 13, 17, 0.98) 100%)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '38px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        minHeight: '380px',
        width: '100%',
        boxSizing: 'border-box',
      }}
      className="animate-slide-down"
    >
      <style>{`
        @keyframes scannerSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scannerSpinReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes scannerWave {
          0% { transform: scale(0.85); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes scannerBeam {
          0% { transform: translateY(-40px); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(40px); opacity: 0; }
        }
        @keyframes shimmerLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes stagePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

      {/* Radial ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(18, 163, 131, 0.18) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 75%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Visual Core: Holographic Neural Scanner ── */}
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {/* Sonar Wave 1 */}
        <div
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '1.5px solid rgba(18, 163, 131, 0.4)',
            animation: 'scannerWave 2.4s infinite ease-out',
          }}
        />

        {/* Sonar Wave 2 (Desfasada) */}
        <div
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            animation: 'scannerWave 2.4s infinite ease-out 1.2s',
          }}
        />

        {/* Anillo Exterior Punteado Giratorio */}
        <div
          style={{
            position: 'absolute',
            width: '116px',
            height: '116px',
            borderRadius: '50%',
            border: '1.5px dashed rgba(18, 163, 131, 0.45)',
            animation: 'scannerSpin 14s linear infinite',
          }}
        />

        {/* Anillo Intermedio Sólido Contragiratorio */}
        <div
          style={{
            position: 'absolute',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            animation: 'scannerSpinReverse 9s linear infinite',
          }}
        />

        {/* Rayo Láser de Escaneo */}
        <div
          style={{
            position: 'absolute',
            width: '80px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
            boxShadow: '0 0 10px var(--primary)',
            animation: 'scannerBeam 2s infinite ease-in-out',
            zIndex: 2,
          }}
        />

        {/* Núcleo Central Iluminado */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(18, 163, 131, 0.35) 0%, rgba(6, 160, 128, 0.15) 100%)',
            border: '1px solid var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            boxShadow: '0 0 24px rgba(18, 163, 131, 0.5), inset 0 0 10px rgba(18, 163, 131, 0.3)',
            zIndex: 3,
          }}
        >
          <Cpu size={24} />
        </div>
      </div>

      {/* ── Título y Telemetría de Búsqueda ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} color="var(--primary)" />
          <h2
            style={{
              fontSize: '17px',
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Decodificando Cartografía Estudiantil 360°
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            Consultando registros para:
          </span>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--primary)',
              fontWeight: 800,
              fontFamily: "'Space Grotesk', monospace",
              background: 'rgba(18, 163, 131, 0.12)',
              border: '1px solid rgba(18, 163, 131, 0.3)',
              padding: '1px 8px',
              borderRadius: '5px',
            }}
          >
            {identifier ? (identifier.length === 24 ? `ID: ${identifier.slice(0, 6)}...${identifier.slice(-4)}` : `#${identifier}`) : '...'}
          </span>
        </div>
      </div>

      {/* ── Pipeline de Diagnóstico en Tiempo Real (3 Etapas) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
          width: '100%',
          maxWidth: '780px',
          zIndex: 1,
        }}
      >
        {/* Etapa 1 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(18, 163, 131, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--primary)',
              boxShadow: '0 0 8px var(--primary)',
              animation: 'stagePulse 1.4s infinite ease-in-out',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--on-surface)' }}>
              1. Identidad & Alianza
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              Validando en Supabase central
            </span>
          </div>
        </div>

        {/* Etapa 2 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 8px #38bdf8',
              animation: 'stagePulse 1.4s infinite ease-in-out 0.4s',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--on-surface)' }}>
              2. Pensum & Estructura
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              Indexando niveles y programas
            </span>
          </div>
        </div>

        {/* Etapa 3 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(192, 132, 252, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#c084fc',
              boxShadow: '0 0 8px #c084fc',
              animation: 'stagePulse 1.4s infinite ease-in-out 0.8s',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--on-surface)' }}>
              3. Asignaturas Activas
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              Mapeando grupos y duplicados
            </span>
          </div>
        </div>
      </div>

      {/* ── Barra de Progreso Cibernética ── */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '100px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '45%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, var(--primary), #38bdf8, transparent)',
            borderRadius: '100px',
            animation: 'shimmerLine 1.6s infinite ease-in-out',
          }}
        />
      </div>
    </div>
  );
}
