import React from 'react';
import { Search, BookOpen, Sparkles, Terminal, Activity, Calculator, Wrench, Database } from 'lucide-react';

export default function HubVacio() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }} className="animate-slide-down">
      {/* ── Fila 1: Tres Pasos del Flujo Operativo ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '10px',
        }}
      >
        {/* Paso 1 */}
        <div
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(18, 163, 131, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <Search size={16} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--on-surface)' }}>
                1. Identificación
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 800, background: 'rgba(18, 163, 131, 0.1)', padding: '2px 7px', borderRadius: '4px' }}>
              INC / ObjectId
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
            Resuelve en milisegundos la identidad del estudiante, su alianza (<span style={{ color: '#22c55e', fontWeight: 700 }}>Nueva América</span> / <span style={{ color: '#ef4444', fontWeight: 700 }}>Kuepa</span>), correo y teléfono de contacto.
          </p>
        </div>

        {/* Paso 2 */}
        <div
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}
              >
                <BookOpen size={16} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--on-surface)' }}>
                2. Contextualización
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, background: 'rgba(56, 189, 248, 0.1)', padding: '2px 7px', borderRadius: '4px' }}>
              Multi-Programa
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
            Inspecciona programas matriculados en simultáneo, filtra grupos por cuatrimestres o ciclos y realiza selecciones por lote en un clic.
          </p>
        </div>

        {/* Paso 3 */}
        <div
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(192, 132, 252, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc',
                }}
              >
                <Terminal size={16} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--on-surface)' }}>
                3. Remediación Magik
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#c084fc', fontWeight: 800, background: 'rgba(192, 132, 252, 0.1)', padding: '2px 7px', borderRadius: '4px' }}>
              CLI Automático
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
            Genera comandos seguros y atómicos para auditar avances, recalcular notas finales, corregir entregables y purgar cachés en producción.
          </p>
        </div>
      </div>

      {/* ── Fila 2: Catálogo de Capacidades de Remediación ── */}
      <div
        style={{
          background: 'var(--surface-low)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="var(--primary)" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--on-surface)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Capacidades de Diagnóstico y Remediación Disponibles
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', opacity: 0.65 }}>
            Ingresa un estudiante arriba para activar las acciones
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '8px',
          }}
        >
          {/* Item 1 */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(18, 163, 131, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
              <Activity size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)' }}>Auditoría de Avance</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "'Space Grotesk', monospace" }}>audit:statistics & compacts</span>
            </div>
          </div>

          {/* Item 2 */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
              <Calculator size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)' }}>Recálculo de Notas</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "'Space Grotesk', monospace" }}>final:user en materias activas</span>
            </div>
          </div>

          {/* Item 3 */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(234, 179, 8, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308', flexShrink: 0 }}>
              <Wrench size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)' }}>Corrección Entregables</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "'Space Grotesk', monospace" }}>attempts:fix para tareas trabadas</span>
            </div>
          </div>

          {/* Item 4 */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
              <Database size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)' }}>Invalidación de Caché</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "'Space Grotesk', monospace" }}>cache:clean:sislms & CRM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
