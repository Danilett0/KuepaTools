import React, { useState } from 'react';
import {
  Radar,
  Search,
  Fingerprint,
  Layers,
  Terminal,
  Activity,
  Calculator,
  Wrench,
  Database,
  Sparkles,
  Zap,
  ArrowRight,
  BookOpen,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

export default function HubVacio({ onSelectExample = () => {} }) {
  const [activeTab, setActiveTab] = useState('all');

  const capabilities = [
    {
      id: 'audit',
      title: 'Auditoría Integral de Avance',
      command: 'magik run:prod audit:level & statistics',
      description: 'Calcula porcentajes reales de pensum, horas aprobadas y compactos en SIS.',
      icon: Activity,
      color: '#12a383',
      bg: 'rgba(18, 163, 131, 0.12)',
      border: 'rgba(18, 163, 131, 0.25)',
      syntax: 'magik run:prod audit:statistics["structureId","studentId"]',
    },
    {
      id: 'grade',
      title: 'Recálculo Forzado de Notas',
      command: 'magik run:prod:force final:user',
      description: 'Dispara la liquidación de calificaciones finales sobre grupos activos seleccionados.',
      icon: Calculator,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.25)',
      syntax: 'magik run:prod:force final:user ["groupId","studentId"]',
    },
    {
      id: 'deliverable',
      title: 'Corrección de Entregables',
      command: 'magik run:prod attempts:fix',
      description: 'Destraba entregas en limbo y revalida estados de corrección en la base de datos.',
      icon: Wrench,
      color: '#eab308',
      bg: 'rgba(234, 179, 8, 0.12)',
      border: 'rgba(234, 179, 8, 0.25)',
      syntax: 'magik run:prod attempts:fix ["groupId","studentId"]',
    },
    {
      id: 'cache',
      title: 'Invalidación Global de Caché',
      command: 'magik run:prod cache:clean:sislms',
      description: 'Purga las llaves de memoria en Redis y CRM para reflejar cambios en tiempo real.',
      icon: Database,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.25)',
      syntax: 'magik run:prod cache:clean:sislms ["*"]',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }} className="animate-slide-down">
      <style>{`
        @keyframes hubRadarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes hubBeaconBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }
        @keyframes hubPulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(18, 163, 131, 0.2); }
          50% { box-shadow: 0 0 30px rgba(18, 163, 131, 0.45); }
        }
        @keyframes hubOrbitDash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 100; }
        }
        .hub-interactive-card {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .hub-interactive-card:hover {
          transform: translateY(-3px);
          border-color: rgba(18, 163, 131, 0.4) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), 0 0 14px rgba(18, 163, 131, 0.15) !important;
          background: rgba(255, 255, 255, 0.04) !important;
        }
        .hub-quick-example-btn {
          transition: all 0.15s ease;
        }
        .hub-quick-example-btn:hover {
          background: rgba(18, 163, 131, 0.25) !important;
          border-color: var(--primary) !important;
          transform: scale(1.02);
          color: #ffffff !important;
        }
      `}</style>

      {/* ── SECCIÓN HERO: Radar de Diagnóstico 360° & Cockpit Operativo ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(17, 21, 26, 0.95) 0%, rgba(10, 13, 17, 0.98) 100%)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '24px 28px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        {/* Glow de fondo radial */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '10%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(18, 163, 131, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Lado Izquierdo / Contenido Principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 1, flex: '1 1 500px', minWidth: '280px' }}>
          {/* Badge Beacon Live */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                background: 'rgba(18, 163, 131, 0.12)',
                border: '1px solid rgba(18, 163, 131, 0.3)',
                padding: '3px 10px',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--primary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  boxShadow: '0 0 8px var(--primary)',
                  animation: 'hubBeaconBlink 1.8s infinite ease-in-out',
                }}
              />
              Radar 360° Activo • En Espera de Entrada
            </span>

            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              Soporta ObjectId (24 car.) o INC
            </span>
          </div>

          {/* Título y Subtítulo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
              }}
            >
              Centro de Diagnóstico & Remediación Estudiante 360°
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--on-surface-variant)',
                margin: 0,
                lineHeight: 1.5,
                maxWidth: '680px',
              }}
            >
              Ingresa un identificador arriba para decodificar al instante la cartografía académica del estudiante:
              programas matriculados, asignaturas por cuatrimestres o ciclos, detección de grupos duplicados y generación de comandos Magik en producción.
            </p>
          </div>

          {/* Atajos Rápidos de Prueba */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
            <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 700 }}>
              Accesos rápidos para pruebas:
            </span>

            <button
              type="button"
              className="hub-quick-example-btn"
              onClick={() => onSelectExample('19999')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(18, 163, 131, 0.12)',
                border: '1px solid rgba(18, 163, 131, 0.3)',
                padding: '4px 11px',
                borderRadius: '7px',
                color: 'var(--primary)',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', monospace",
              }}
              title="Cargar estudiante de prueba INC #19999 (Leidy Ocampo)"
            >
              <Zap size={12} color="var(--primary)" />
              <span>INC #19999 (Leidy Ocampo)</span>
            </button>

            <button
              type="button"
              className="hub-quick-example-btn"
              onClick={() => onSelectExample('546')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '4px 11px',
                borderRadius: '7px',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', monospace",
              }}
              title="Cargar estudiante de prueba INC #546"
            >
              <Zap size={12} color="#38bdf8" />
              <span>INC #546</span>
            </button>
          </div>
        </div>

        {/* Lado Derecho: Radar Visual Holográfico Animado */}
        <div
          style={{
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '140px',
            height: '140px',
            flexShrink: 0,
          }}
        >
          {/* Anillo Exterior Punteado */}
          <div
            style={{
              position: 'absolute',
              width: '136px',
              height: '136px',
              borderRadius: '50%',
              border: '1px dashed rgba(18, 163, 131, 0.35)',
              animation: 'hubRadarSweep 28s linear infinite',
            }}
          />

          {/* Anillo Intermedio Sólido */}
          <div
            style={{
              position: 'absolute',
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              animation: 'hubRadarSweep 18s linear infinite reverse',
            }}
          />

          {/* Anillo Interior con Pulso */}
          <div
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(18, 163, 131, 0.2) 0%, rgba(18, 163, 131, 0.02) 80%)',
              border: '1px solid rgba(18, 163, 131, 0.4)',
              animation: 'hubPulseGlow 3s infinite ease-in-out',
            }}
          />

          {/* Haz de Radar Giratorio (Conic Gradient) */}
          <div
            style={{
              position: 'absolute',
              width: '128px',
              height: '128px',
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, rgba(18, 163, 131, 0.35) 0deg, rgba(18, 163, 131, 0.05) 50deg, transparent 65deg)',
              animation: 'hubRadarSweep 4s linear infinite',
              pointerEvents: 'none',
            }}
          />

          {/* Blips / Puntos de Detección en la Órbita */}
          <div
            style={{
              position: 'absolute',
              top: '28px',
              right: '24px',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e',
            }}
            title="Nodo: Identidad Resuelta"
          />
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              left: '26px',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 8px #38bdf8',
            }}
            title="Nodo: Pensum Indexado"
          />
          <div
            style={{
              position: 'absolute',
              top: '64px',
              left: '18px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#c084fc',
              boxShadow: '0 0 6px #c084fc',
            }}
            title="Nodo: CLI Engine Ready"
          />

          {/* Núcleo Central del Radar */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(18, 163, 131, 0.4) 0%, rgba(6, 160, 128, 0.2) 100%)',
              border: '1px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              boxShadow: '0 0 16px rgba(18, 163, 131, 0.5)',
              zIndex: 2,
            }}
          >
            <Radar size={20} />
          </div>
        </div>
      </div>

      {/* ── SECCIÓN INTERMEDIA: 3 Pilares Arquitectónicos del Flujo ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Pilar 1 */}
        <div
          className="hub-interactive-card"
          style={{
            background: 'var(--surface-low)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(18, 163, 131, 0.15)',
                  border: '1px solid rgba(18, 163, 131, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <Fingerprint size={17} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--on-surface)' }}>
                1. Identificación Instantánea
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                color: 'var(--primary)',
                fontWeight: 800,
                background: 'rgba(18, 163, 131, 0.12)',
                border: '1px solid rgba(18, 163, 131, 0.25)',
                padding: '2px 7px',
                borderRadius: '5px',
              }}
            >
              &lt; 150ms
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.45 }}>
            Resuelve en milisegundos la identidad del estudiante, su alianza (<span style={{ color: '#4ade80', fontWeight: 700 }}>Nueva América</span> / <span style={{ color: '#f87171', fontWeight: 700 }}>Kuepa</span>), ticket INC y genera el resumen oficial para soporte en 1 clic.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontFamily: "'Space Grotesk', monospace" }}>
              inc_code • mongo_id • alliance_id
            </span>
          </div>
        </div>

        {/* Pilar 2 */}
        <div
          className="hub-interactive-card"
          style={{
            background: 'var(--surface-low)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}
              >
                <Layers size={17} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--on-surface)' }}>
                2. Cartografía & Duplicados
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                color: '#38bdf8',
                fontWeight: 800,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '2px 7px',
                borderRadius: '5px',
              }}
            >
              Multi-Pensum
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.45 }}>
            Agrupa asignaturas por cuatrimestres o ciclos, detecta automáticamente inscripciones redundantes en la misma materia (alerta visual ⚠️) y enlaza directamente al SIS.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontFamily: "'Space Grotesk', monospace" }}>
              pensum_level • duplicate_detection
            </span>
          </div>
        </div>

        {/* Pilar 3 */}
        <div
          className="hub-interactive-card"
          style={{
            background: 'var(--surface-low)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(192, 132, 252, 0.15)',
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc',
                }}
              >
                <Terminal size={17} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--on-surface)' }}>
                3. Motor Magik CLI
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                color: '#c084fc',
                fontWeight: 800,
                background: 'rgba(192, 132, 252, 0.12)',
                border: '1px solid rgba(192, 132, 252, 0.25)',
                padding: '2px 7px',
                borderRadius: '5px',
              }}
            >
              CLI Automático
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.45 }}>
            Sintetiza comandos atómicos y seguros para auditar estadísticas de avance, forzar recálculos de notas finales y destrabar entregables en producción.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontFamily: "'Space Grotesk', monospace" }}>
              magik run:prod atomic_commands
            </span>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN INFERIOR: Catálogo de Capacidades de Producción ── */}
      <div
        style={{
          background: 'var(--surface-low)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Sparkles size={15} color="var(--primary)" />
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--on-surface)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Capacidades de Diagnóstico y Remediación Disponibles
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', opacity: 0.7 }}>
            Pasa el cursor sobre cada capacidad para inspeccionar la sintaxis CLI
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '10px',
          }}
        >
          {capabilities.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                className="hub-interactive-card"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'default',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: item.bg,
                      border: `1px solid ${item.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color,
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={16} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--on-surface)' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '10px', color: item.color, fontWeight: 700, fontFamily: "'Space Grotesk', monospace" }}>
                      {item.command}
                    </span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                  {item.description}
                </p>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    padding: '5px 8px',
                    fontSize: '9.5px',
                    color: '#94a3b8',
                    fontFamily: "'Space Grotesk', monospace",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 'auto',
                  }}
                  title={item.syntax}
                >
                  <span style={{ color: item.color, marginRight: '4px' }}>&gt;</span>
                  {item.syntax}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
