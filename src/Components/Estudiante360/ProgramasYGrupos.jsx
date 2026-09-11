import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  GraduationCap,
  Copy,
  Check,
  Search,
  CheckCircle2,
  Filter,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  normalizeText,
  sortAcademicLevels,
  compareAcademicLevels,
} from '../../services/student360Service';

export default function ProgramasYGrupos({
  programs,
  groups,
  selectedProgramId,
  onSelectProgram,
  selectedGroupIds = [],
  onToggleGroup,
  onSelectAllGroups,
  onDeselectAllGroups,
  onAction,
}) {
  const [groupFilter, setGroupFilter] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [copiedGroupId, setCopiedGroupId] = useState(null);

  const copyGroupId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedGroupId(id);
      toast.success('ID de grupo copiado');
      setTimeout(() => setCopiedGroupId(null), 1500);
    });
  };

  const levels = useMemo(() => {
    const counts = {};
    groups.forEach((g) => {
      const lvl = g.levelName || 'Sin nivel';
      if (!counts[lvl]) {
        counts[lvl] = 0;
      }
      counts[lvl]++;
    });
    const list = sortAcademicLevels(Object.keys(counts));
    return { list, counts };
  }, [groups]);

  const filteredGroups = useMemo(() => {
    let list = groups;
    if (selectedLevel !== 'ALL') {
      list = list.filter((g) => (g.levelName || 'Sin nivel') === selectedLevel);
    }
    const term = normalizeText(groupFilter);
    if (term) {
      list = list.filter(
        (g) =>
          normalizeText(g.name).includes(term) ||
          normalizeText(g.levelName).includes(term) ||
          normalizeText(g.groupId).includes(term)
      );
    }
    return [...list].sort((a, b) => {
      const lvlA = a.levelName || 'Sin nivel';
      const lvlB = b.levelName || 'Sin nivel';
      const lvlComp = compareAcademicLevels(lvlA, lvlB);
      if (lvlComp !== 0) return lvlComp;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [groups, groupFilter, selectedLevel]);

  const areAllFilteredSelected =
    filteredGroups.length > 0 &&
    filteredGroups.every((g) => selectedGroupIds.includes(g.groupId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Sección Superior Horizontal: Programas Académicos ── */}
      <div
        style={{
          background: 'var(--surface-low)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--on-surface)' }}>
              Programas Inscritos ({programs.length})
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            Selecciona un programa para contextualizar la remediación operativa
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: programs.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '12px',
          }}
        >
          {programs.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
              No se registran programas asociados.
            </div>
          ) : (
            programs.map((prog) => {
              const isSelected = prog.programId === selectedProgramId;
              return (
                <div
                  key={prog.programId}
                  onClick={() => onSelectProgram(prog.programId)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                    background: isSelected ? 'rgba(18, 163, 131, 0.12)' : 'rgba(0, 0, 0, 0.3)',
                    boxShadow: isSelected ? '0 0 16px rgba(18, 163, 131, 0.2)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: isSelected ? 'var(--primary)' : 'var(--on-surface)',
                          lineHeight: '1.3',
                        }}
                      >
                        {prog.name}
                      </span>
                      {isSelected ? (
                        <span
                          style={{
                            background: 'var(--primary)',
                            color: '#090909',
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0,
                          }}
                        >
                          <CheckCircle2 size={11} />
                          Activo
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--on-surface-variant)',
                            opacity: 0.7,
                            flexShrink: 0,
                          }}
                        >
                          Clic para seleccionar
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#cbd5e1',
                          fontFamily: "'Space Grotesk', monospace",
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--glass-border)',
                        }}
                      >
                        ID: {prog.programId}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(prog.programId);
                          toast.success('ID de programa copiado');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--on-surface-variant)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Copiar ID del programa"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Sección de Asignaturas con Selección Rápida en Lote ── */}
      <div
        style={{
          background: 'var(--surface-low)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Cabecera: Título, Seleccionar Todos y Filtro */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--on-surface)' }}>
              Grupos y Asignaturas ({filteredGroups.length}{filteredGroups.length !== groups.length ? ` de ${groups.length}` : ''})
            </span>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              placeholder="Filtrar por materia o nivel..."
              className="inscripciones-input"
              style={{
                height: '38px',
                fontSize: '13px',
                padding: '0 32px 0 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderColor: groupFilter.trim() ? 'var(--primary)' : 'var(--glass-border)',
                width: '100%',
              }}
            />
            <Search
              size={14}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--on-surface-variant)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Chips de filtro por Cuatrimestre / Nivel */}
        {levels.list.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={12} /> Nivel:
            </span>
            <button
              type="button"
              onClick={() => setSelectedLevel('ALL')}
              style={{
                background: selectedLevel === 'ALL' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedLevel === 'ALL' ? '#090909' : 'var(--on-surface-variant)',
                border: `1px solid ${selectedLevel === 'ALL' ? 'var(--primary)' : 'var(--glass-border)'}`,
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={`Todas las materias (${groups.length})`}
            >
              Todos
            </button>
            {levels.list.map((lvl) => {
              const isSelected = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  style={{
                    background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#090909' : 'var(--on-surface-variant)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={`${lvl} (${levels.counts[lvl]} materias)`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        )}

        {/* Barra de Control y Selección de Asignaturas */}
        <div
          style={{
            background: selectedGroupIds.length > 0 ? 'rgba(18, 163, 131, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${selectedGroupIds.length > 0 ? 'rgba(18, 163, 131, 0.3)' : 'var(--glass-border)'}`,
            borderRadius: '10px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Izquierda: Conteo de materias seleccionadas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={15} color={selectedGroupIds.length > 0 ? 'var(--primary)' : 'var(--on-surface-variant)'} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: selectedGroupIds.length > 0 ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
              {selectedGroupIds.length > 0
                ? `${selectedGroupIds.length} materia${selectedGroupIds.length !== 1 ? 's' : ''} seleccionada${selectedGroupIds.length !== 1 ? 's' : ''} de ${groups.length}`
                : `0 materias seleccionadas de ${groups.length}`}
            </span>
          </div>

          {/* Derecha: Botón unificado de Selección y Limpiar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const visibleIds = filteredGroups.map((g) => g.groupId);
                if (areAllFilteredSelected) {
                  onSelectAllGroups(selectedGroupIds.filter((id) => !visibleIds.includes(id)));
                } else {
                  onSelectAllGroups(Array.from(new Set([...selectedGroupIds, ...visibleIds])));
                }
              }}
              style={{
                background: areAllFilteredSelected ? 'rgba(18, 163, 131, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${areAllFilteredSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                color: areAllFilteredSelected ? 'var(--primary)' : 'var(--on-surface)',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              {areAllFilteredSelected ? <CheckSquare size={12} /> : <Square size={12} />}
              <span>
                {filteredGroups.length === groups.length
                  ? areAllFilteredSelected
                    ? 'Deseleccionar Todos'
                    : `Seleccionar Todos (${groups.length})`
                  : areAllFilteredSelected
                  ? `Deseleccionar Visibles (${filteredGroups.length})`
                  : `Seleccionar Visibles (${filteredGroups.length})`}
              </span>
            </button>

            {selectedGroupIds.length > 0 && (
              <button
                type="button"
                onClick={onDeselectAllGroups}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--on-surface-variant)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                }}
                title="Limpiar selección"
              >
                <X size={12} />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Grid Ultracompacto de Asignaturas con Checkboxes ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
            gap: '8px',
            overflowY: 'auto',
            maxHeight: '560px',
            paddingRight: '6px',
            paddingBottom: '16px',
          }}
        >
          {filteredGroups.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '36px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
              {groups.length === 0
                ? 'El estudiante no está matriculado en ningún grupo activo.'
                : 'No se encontraron materias con el filtro aplicado.'}
            </div>
          ) : (
            filteredGroups.map((g) => {
              const isChecked = selectedGroupIds.includes(g.groupId);
              return (
                <div
                  key={g.groupId}
                  onClick={() => onToggleGroup(g.groupId)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--glass-border)'}`,
                    background: isChecked ? 'rgba(18, 163, 131, 0.12)' : 'rgba(0, 0, 0, 0.3)',
                    boxShadow: isChecked ? '0 0 12px rgba(18, 163, 131, 0.18)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isChecked) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isChecked) {
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                    }
                  }}
                >
                  {/* Checkbox y Nombre */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '5px',
                        border: `1.5px solid ${isChecked ? 'var(--primary)' : 'rgba(255,255,255,0.3)'}`,
                        background: isChecked ? 'var(--primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#090909',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </div>

                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '13px',
                        color: isChecked ? 'var(--primary)' : 'var(--on-surface)',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={g.name}
                    >
                      {g.name}
                    </span>
                  </div>

                  {/* Nivel / Cuatrimestre alineado a la derecha, ID y botón Copiar ID */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.28)',
                        color: '#38bdf8',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        minWidth: '95px',
                        display: 'inline-block',
                      }}
                    >
                      {g.levelName}
                    </span>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        copyGroupId(g.groupId);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontFamily: "'Space Grotesk', monospace",
                        color: copiedGroupId === g.groupId ? 'var(--primary)' : '#cbd5e1',
                        background: copiedGroupId === g.groupId ? 'rgba(18, 163, 131, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${copiedGroupId === g.groupId ? 'var(--primary)' : 'var(--glass-border)'}`,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title="Clic para copiar ID del grupo"
                      onMouseEnter={(e) => {
                        if (copiedGroupId !== g.groupId) {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.color = 'var(--primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedGroupId !== g.groupId) {
                          e.currentTarget.style.borderColor = 'var(--glass-border)';
                          e.currentTarget.style.color = '#cbd5e1';
                        }
                      }}
                    >
                      <span>{g.groupId}</span>
                      {copiedGroupId === g.groupId ? <Check size={11} color="var(--primary)" /> : <Copy size={11} />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
