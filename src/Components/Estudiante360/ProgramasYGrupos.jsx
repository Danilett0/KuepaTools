import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Copy,
  Check,
  Search,
  CheckCircle2,
  Filter,
  CheckSquare,
  Square,
  X,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  normalizeText,
  sortAcademicLevels,
  compareAcademicLevels,
  detectDuplicateGroupIds,
  buildSisGroupUrl,
} from '../../services/student360Service';

export default function ProgramasYGrupos({
  groups = [],
  selectedGroupIds = [],
  onToggleGroup,
  onSelectAllGroups,
  onDeselectAllGroups,
  onAction,
}) {
  const [groupFilter, setGroupFilter] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [copiedGroupId, setCopiedGroupId] = useState(null);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const levelDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target)) {
        setIsLevelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const duplicateGroupIds = useMemo(() => detectDuplicateGroupIds(groups), [groups]);

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
    if (selectedLevel === 'DUPLICATES') {
      list = list.filter((g) => duplicateGroupIds.has(g.groupId));
    } else if (selectedLevel !== 'ALL') {
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
  }, [groups, groupFilter, selectedLevel, duplicateGroupIds]);

  const areAllFilteredSelected =
    filteredGroups.length > 0 &&
    filteredGroups.every((g) => selectedGroupIds.includes(g.groupId));

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        background: 'var(--surface-low)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
        {/* Cabecera: Título, Dropdown de Niveles, Alerta de Duplicados y Buscador */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: '15.5px', color: 'var(--on-surface)', whiteSpace: 'nowrap' }}>
                Grupos y Asignaturas ({filteredGroups.length}{filteredGroups.length !== groups.length ? ` de ${groups.length}` : ''})
              </span>
            </div>

            {/* Dropdown de Cuatrimestre / Nivel */}
            {levels.list.length > 0 && (
              <div ref={levelDropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '30px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: `1px solid ${isLevelDropdownOpen || (selectedLevel !== 'ALL' && selectedLevel !== 'DUPLICATES') ? 'var(--primary)' : 'var(--glass-border)'}`,
                    background: isLevelDropdownOpen || (selectedLevel !== 'ALL' && selectedLevel !== 'DUPLICATES') ? 'rgba(18, 163, 131, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedLevel !== 'ALL' && selectedLevel !== 'DUPLICATES' ? 'var(--primary)' : 'var(--on-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    maxWidth: '240px',
                  }}
                  title={`Filtro actual: ${selectedLevel === 'ALL' ? 'Todos los niveles' : selectedLevel === 'DUPLICATES' ? 'Solo materias duplicadas' : selectedLevel}`}
                  onMouseEnter={(e) => {
                    if (!isLevelDropdownOpen && selectedLevel === 'ALL') e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isLevelDropdownOpen && selectedLevel === 'ALL') e.currentTarget.style.borderColor = 'var(--glass-border)';
                  }}
                >
                  <Filter size={12} color={selectedLevel !== 'ALL' && selectedLevel !== 'DUPLICATES' ? 'var(--primary)' : 'var(--on-surface-variant)'} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedLevel === 'ALL'
                      ? 'Todos los niveles'
                      : selectedLevel === 'DUPLICATES'
                      ? 'Solo duplicadas'
                      : selectedLevel}
                  </span>
                  {selectedLevel !== 'ALL' && selectedLevel !== 'DUPLICATES' && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        background: 'rgba(18, 163, 131, 0.2)',
                        color: 'var(--primary)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {levels.counts[selectedLevel] || 0}
                    </span>
                  )}
                  <ChevronDown
                    size={12}
                    color="var(--on-surface-variant)"
                    style={{
                      transform: isLevelDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* Menú Desplegable */}
                {isLevelDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      minWidth: '220px',
                      maxHeight: '320px',
                      overflowY: 'auto',
                      background: '#131822',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      boxShadow: '0 16px 36px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                      zIndex: 500,
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      animation: 'dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) both',
                    }}
                  >
                    {/* Opción: Todos los niveles */}
                    <div
                      onClick={() => {
                        setSelectedLevel('ALL');
                        setIsLevelDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        background: selectedLevel === 'ALL' ? 'rgba(18, 163, 131, 0.15)' : 'transparent',
                        color: selectedLevel === 'ALL' ? 'var(--primary)' : '#e2e8f0',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        fontWeight: selectedLevel === 'ALL' ? 700 : 500,
                        transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedLevel !== 'ALL') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (selectedLevel !== 'ALL') e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {selectedLevel === 'ALL' && <Check size={12} color="var(--primary)" />}
                        Todos los niveles
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          color: 'var(--on-surface-variant)',
                          fontWeight: 700,
                        }}
                      >
                        {groups.length}
                      </span>
                    </div>

                    {levels.list.length > 0 && (
                      <div style={{ height: '1px', background: 'var(--glass-border)', margin: '3px 4px' }} />
                    )}

                    {levels.list.map((lvl) => {
                      const isSelected = selectedLevel === lvl;
                      const count = levels.counts[lvl] || 0;
                      return (
                        <div
                          key={lvl}
                          onClick={() => {
                            setSelectedLevel(lvl);
                            setIsLevelDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            background: isSelected ? 'rgba(18, 163, 131, 0.15)' : 'transparent',
                            color: isSelected ? 'var(--primary)' : '#e2e8f0',
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            fontWeight: isSelected ? 700 : 500,
                            transition: 'all 0.12s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isSelected && <Check size={12} color="var(--primary)" />}
                            {lvl}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              background: isSelected ? 'rgba(18, 163, 131, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              color: isSelected ? 'var(--primary)' : 'var(--on-surface-variant)',
                              fontWeight: isSelected ? 700 : 500,
                            }}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Mensaje de materias duplicadas al lado del dropdown */}
            {duplicateGroupIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedLevel((prev) => (prev === 'DUPLICATES' ? 'ALL' : 'DUPLICATES'))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  height: '30px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#f87171',
                  background: selectedLevel === 'DUPLICATES' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${selectedLevel === 'DUPLICATES' ? '#f87171' : 'rgba(239, 68, 68, 0.35)'}`,
                  padding: '0 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: selectedLevel === 'DUPLICATES' ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none',
                }}
                title={
                  selectedLevel === 'DUPLICATES'
                    ? 'Mostrando solo materias duplicadas. Clic para ver todas las materias.'
                    : 'Clic para filtrar y ver solo las materias con inscripción duplicada'
                }
              >
                <AlertTriangle size={12} color="#f87171" style={{ flexShrink: 0 }} />
                <span>
                  {duplicateGroupIds.size} materia{duplicateGroupIds.size !== 1 ? 's' : ''} duplicada{duplicateGroupIds.size !== 1 ? 's' : ''}
                </span>
                {selectedLevel === 'DUPLICATES' && (
                  <X size={11} color="#f87171" style={{ marginLeft: '2px' }} />
                )}
              </button>
            )}
          </div>

          <div style={{ position: 'relative', width: '260px', maxWidth: '100%' }}>
            <input
              type="text"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              placeholder="Buscar materia o código..."
              className="inscripciones-input"
              style={{
                height: '34px',
                fontSize: '12px',
                padding: '0 32px 0 10px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderColor: groupFilter.trim() ? 'var(--primary)' : 'var(--glass-border)',
                width: '100%',
              }}
            />
            <Search
              size={13}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--on-surface-variant)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

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

        {/* ── Grid de Asignaturas en 2 Columnas con Checkboxes ── */}
        <div className="estudiante360-groups-grid">
          {filteredGroups.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '36px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
              {groups.length === 0
                ? 'El estudiante no está matriculado en ningún grupo activo.'
                : 'No se encontraron materias con el filtro aplicado.'}
            </div>
          ) : (
            filteredGroups.map((g, idx) => {
              const isChecked = selectedGroupIds.includes(g.groupId);
              const isDuplicate = duplicateGroupIds.has(g.groupId);

              return (
                <div
                  key={g.groupId}
                  className="estudiante360-card-enter"
                  onClick={() => onToggleGroup(g.groupId)}
                  style={{
                    animationDelay: `${Math.min(idx * 30, 450)}ms`,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${
                      isChecked
                        ? 'var(--primary)'
                        : isDuplicate
                        ? 'rgba(239, 68, 68, 0.45)'
                        : 'var(--glass-border)'
                    }`,
                    background: isChecked
                      ? 'rgba(18, 163, 131, 0.12)'
                      : isDuplicate
                      ? 'rgba(239, 68, 68, 0.04)'
                      : 'rgba(0, 0, 0, 0.3)',
                    boxShadow: isChecked
                      ? '0 0 12px rgba(18, 163, 131, 0.18)'
                      : isDuplicate
                      ? '0 0 10px rgba(239, 68, 68, 0.1)'
                      : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isChecked) {
                      e.currentTarget.style.borderColor = isDuplicate ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255,255,255,0.2)';
                      e.currentTarget.style.background = isDuplicate ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isChecked) {
                      e.currentTarget.style.borderColor = isDuplicate ? 'rgba(239, 68, 68, 0.45)' : 'var(--glass-border)';
                      e.currentTarget.style.background = isDuplicate ? 'rgba(239, 68, 68, 0.04)' : 'rgba(0, 0, 0, 0.3)';
                    }
                  }}
                >
                  {/* Checkbox y Nombre (con espacio ampliado para evitar cortes) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '5px',
                        border: `1.5px solid ${isChecked ? 'var(--primary)' : isDuplicate ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255,255,255,0.3)'}`,
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
                        fontSize: '12px',
                        color: isChecked ? 'var(--primary)' : 'var(--on-surface)',
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                      }}
                      title={g.name}
                    >
                      {g.name}
                    </span>
                  </div>

                  {/* Badges de Duplicado, Nivel, Group ID y Enlace SIS */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0,
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isDuplicate && (
                      <span
                        className="duplicate-badge-pulse"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#f87171',
                          padding: '2px 6px',
                          borderRadius: '5px',
                          fontSize: '10px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                        title="Asignatura duplicada: el estudiante está inscrito en más de un grupo para esta misma materia"
                      >
                        <AlertTriangle size={10} color="#f87171" />
                        Duplicada
                      </span>
                    )}

                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.28)',
                        color: '#38bdf8',
                        padding: '2px 7px',
                        borderRadius: '5px',
                        fontSize: '10px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
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
                        gap: '4px',
                        fontSize: '11px',
                        fontFamily: "'Space Grotesk', monospace",
                        color: copiedGroupId === g.groupId ? 'var(--primary)' : '#cbd5e1',
                        background: copiedGroupId === g.groupId ? 'rgba(18, 163, 131, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${copiedGroupId === g.groupId ? 'var(--primary)' : 'var(--glass-border)'}`,
                        padding: '2px 6px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={`ID completo: ${g.groupId} (Clic para copiar)`}
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
                      <span>...{g.groupId ? g.groupId.slice(-6) : ''}</span>
                      {copiedGroupId === g.groupId ? <Check size={11} color="var(--primary)" /> : <Copy size={11} />}
                    </div>

                    {g.groupId && (
                      <a
                        href={buildSisGroupUrl(g.groupId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#94a3b8',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--glass-border)',
                          padding: '2px 6px',
                          borderRadius: '5px',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                        }}
                        title={`Abrir grupo ${g.groupId} en SIS`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.color = 'var(--primary)';
                          e.currentTarget.style.background = 'rgba(18, 163, 131, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--glass-border)';
                          e.currentTarget.style.color = '#94a3b8';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                      >
                        <span>SIS</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
  );
}
