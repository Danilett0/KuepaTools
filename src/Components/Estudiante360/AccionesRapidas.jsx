import React from 'react';
import { Activity, RefreshCw, Sparkles, Database, Layers, CheckSquare, Wrench, UserMinus, Calculator, Copy } from 'lucide-react';

export default function AccionesRapidas({
  hasStudent,
  hasProgram,
  groupsCount,
  selectedGroupIds = [],
  onClearSelection,
  onAction,
}) {
  const isBatchMode = selectedGroupIds.length > 0;

  return (
    <div
      style={{
        background: 'var(--surface-low)',
        border: `1px solid ${isBatchMode ? 'var(--primary)' : 'var(--glass-border)'}`,
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '10px',
        boxShadow: isBatchMode ? '0 0 20px rgba(18, 163, 131, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.25s ease',
        minWidth: 0,
      }}
    >
      {/* ── Cabecera de la barra ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {isBatchMode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <CheckSquare size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Acciones en lote ({selectedGroupIds.length} materias)
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={15} color="var(--primary)" />
              <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--on-surface)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Acciones Rápidas de Diagnóstico y Remediación
              </span>
            </div>
            {!hasStudent && (
              <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', opacity: 0.7 }}>
                Requiere cargar estudiante
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Botonera: Modo Lote vs Modo Global ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {isBatchMode ? (
          <>
            {/* Auditar Seleccionadas */}
            <button
              type="button"
              onClick={() => onAction('audit_group', { groupIds: selectedGroupIds })}
              style={{
                height: '42px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '10px',
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
              <Activity size={14} />
              <span>Auditar ({selectedGroupIds.length})</span>
            </button>

            {/* Recalcular Seleccionadas */}
            <button
              type="button"
              onClick={() => onAction('recalculate_grade', { groupIds: selectedGroupIds })}
              style={{
                height: '42px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '10px',
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
              <Calculator size={14} />
              <span>Recalcular ({selectedGroupIds.length})</span>
            </button>

            {/* Corregir Entregables Seleccionadas */}
            <button
              type="button"
              onClick={() => onAction('fix_deliverable', { groupIds: selectedGroupIds })}
              style={{
                height: '42px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '10px',
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
              <Wrench size={14} />
              <span>Entregables ({selectedGroupIds.length})</span>
            </button>

            {/* Retirar Seleccionadas */}
            <button
              type="button"
              onClick={() => onAction('remove_user', { groupIds: selectedGroupIds })}
              style={{
                height: '42px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '10px',
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
              <UserMinus size={14} />
              <span>Retirar ({selectedGroupIds.length})</span>
            </button>

            {/* Copiar IDs Seleccionadas */}
            <button
              type="button"
              onClick={() => onAction('copy_group_ids', { groupIds: selectedGroupIds })}
              style={{
                height: '42px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '10px',
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
              <Copy size={14} />
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
                height: '42px',
                padding: '0 14px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px',
                border: 'none',
                background: !hasStudent || !hasProgram
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
                color: !hasStudent || !hasProgram ? 'var(--on-surface-variant)' : '#090909',
                boxShadow: !hasStudent || !hasProgram ? 'none' : '0 4px 15px rgba(18, 163, 131, 0.3)',
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
              <Activity size={15} />
              <span>Auditar Avance</span>
            </button>

            {/* Recalcular Todos los Grupos */}
            <button
              type="button"
              onClick={() => onAction('recalculate_all_grades')}
              disabled={!hasStudent || groupsCount === 0}
              style={{
                height: '42px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '10px',
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
              <RefreshCw size={14} />
              <span>Recalcular ({groupsCount})</span>
            </button>

            {/* Limpiar Caché LMS */}
            <button
              type="button"
              onClick={() => onAction('clean_cache_lms')}
              disabled={!hasStudent}
              style={{
                height: '42px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '10px',
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
              <Database size={14} />
              <span>Caché LMS</span>
            </button>

            {/* Limpiar Caché CRM */}
            <button
              type="button"
              onClick={() => onAction('clean_cache_crm')}
              disabled={!hasStudent}
              style={{
                height: '42px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '10px',
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
              <Layers size={14} />
              <span>Caché CRM</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
