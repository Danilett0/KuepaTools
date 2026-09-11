import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAppStore } from '../../store/useAppStore';
import { ALLIANCE_IDS } from '../../utils/constants';
import AllianceSwitcher from '../ui/AllianceSwitcher';
import ClearButton from '../ui/ClearButton';
import IncAutocomplete from '../ui/IncAutocomplete';
import CommandsDisplay from '../CommandsDisplay';
import FichaPerfil from './FichaPerfil';
import ProgramasYGrupos from './ProgramasYGrupos';
import AccionesRapidas from './AccionesRapidas';
import { fetchStudent360Data, generate360Commands, formatIdsForClipboard } from '../../services/student360Service';

export default function Estudiante360() {
  const [alianza, setAlianza] = useLocalStorage('estudiante360-alianza', 'na');
  const [studentInput, setStudentInput] = useLocalStorage('estudiante360-input', '');
  const [studentData, setStudentData] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [generatedCommands, setGeneratedCommands] = useState([]);
  const [loading, setLoading] = useState(false);

  const aiPrefilledData = useAppStore((state) => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore((state) => state.setAiPrefilledData);

  const allianceId = alianza === 'kuepa' ? ALLIANCE_IDS.kuepa : ALLIANCE_IDS.na;

  // ── Carga de datos del estudiante ──────────────────────────────────────────
  const loadStudent = useCallback(
    async (identifier) => {
      const trimmed = (identifier || '').trim();
      if (!trimmed) {
        setStudentData(null);
        setSelectedProgramId('');
        setSelectedGroupIds([]);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchStudent360Data(trimmed, allianceId);
        if (!data) {
          toast.warning('No se encontró el estudiante en la alianza seleccionada.');
          setStudentData(null);
          setSelectedProgramId('');
          setSelectedGroupIds([]);
        } else {
          setStudentData(data);
          setSelectedGroupIds([]);
          // Auto-seleccionar el primer programa si existe
          if (data.programs.length > 0) {
            setSelectedProgramId(data.programs[0].programId);
          } else {
            setSelectedProgramId('');
          }
        }
      } catch (err) {
        console.error('Error cargando estudiante 360:', err);
        toast.error(`Error al consultar estudiante: ${err.message}`);
        setStudentData(null);
        setSelectedGroupIds([]);
      } finally {
        setLoading(false);
      }
    },
    [allianceId]
  );

  // Re-cargar si cambia la alianza y hay un input
  useEffect(() => {
    if (studentInput.trim()) {
      loadStudent(studentInput);
    }
  }, [alianza, loadStudent]);

  // Manejar AI Prefill si viene desde la Command Palette
  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.ids && aiPrefilledData.ids.length > 0) {
      const incomingId = aiPrefilledData.ids[0];
      setStudentInput(incomingId);
      loadStudent(incomingId);
      setAiPrefilledData(null);
    }
  }, [aiPrefilledData, loadStudent, setAiPrefilledData, setStudentInput]);

  const handleClear = useCallback(() => {
    setStudentInput('');
    setStudentData(null);
    setSelectedProgramId('');
    setSelectedGroupIds([]);
    setGeneratedCommands([]);
  }, [setStudentInput]);

  const handleToggleGroup = useCallback((groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }, []);

  const handleSelectAllGroups = useCallback((groupIdsToSelect) => {
    setSelectedGroupIds(groupIdsToSelect);
  }, []);

  const handleClearGroupSelection = useCallback(() => {
    setSelectedGroupIds([]);
  }, []);

  // Manejo centralizado de acciones rápidas
  const handleAction = (actionType, extraParams = {}) => {
    if (actionType === 'copy_group_ids') {
      const idsToCopy = extraParams.groupIds || selectedGroupIds || [];
      if (idsToCopy.length === 0) {
        toast.warning('No hay materias seleccionadas para copiar.');
        return;
      }
      const text = formatIdsForClipboard(idsToCopy);
      navigator.clipboard.writeText(text).then(() => {
        toast.success(`${idsToCopy.length} ID${idsToCopy.length !== 1 ? 's' : ''} copiado${idsToCopy.length !== 1 ? 's' : ''} al portapapeles`);
      });
      return;
    }

    if (!studentData && actionType !== 'clean_cache_lms' && actionType !== 'clean_cache_crm') {
      toast.warning('Primero selecciona o busca un estudiante.');
      return;
    }

    try {
      const params = {
        studentId: studentData?.student?.mongoId,
        programId: extraParams.programId || selectedProgramId,
        groupId: extraParams.groupId,
        groupIds:
          extraParams.groupIds ||
          (selectedGroupIds.length > 0
            ? selectedGroupIds
            : studentData?.groups?.map((g) => g.groupId) || []),
      };

      const cmds = generate360Commands(actionType, params);
      setGeneratedCommands(cmds);
      toast.success(`${cmds.length} comando${cmds.length !== 1 ? 's' : ''} generado${cmds.length !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  return (
    <div
      className="content-container animate-slide-down"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 80px)',
        boxSizing: 'border-box',
        paddingBottom: '60px',
      }}
    >
      {/* ── Header y Barra de Búsqueda ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #06a080 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#090909',
            }}
          >
            <UserCheck size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--on-surface)', margin: 0, lineHeight: 1.2 }}>
              Ficha Técnica Estudiante 360°
            </h1>
            <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
              Centro de diagnóstico, materias activas y remediación operativa en un clic
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AllianceSwitcher
            value={alianza}
            size="md"
            onChange={(val) => {
              if (alianza !== val) {
                setAlianza(val);
                setGeneratedCommands([]);
              }
            }}
          />
          <ClearButton onClick={handleClear} title="Limpiar consulta" />
        </div>
      </div>

      <hr className="inscripciones-divider" style={{ width: '100%', margin: 0 }} />

      {/* ── Barra Superior de Búsqueda y Acciones Rápidas ── */}
      {/* ── Barra Superior de Búsqueda y Acciones Rápidas ── */}
      <div className="estudiante360-topbar">
        {/* Input Autocomplete de INC / ID */}
        <div
          style={{
            background: 'var(--surface-low)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <label className="input-label" style={{ marginBottom: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              Buscar Estudiante por Código INC o Mongo ObjectId
            </label>
            {loading && (
              <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <Loader2 size={12} className="animate-spin" />
                <span>Cargando...</span>
              </span>
            )}
          </div>
          <IncAutocomplete
            alianzaId={allianceId}
            value={studentInput}
            onChange={(val) => {
              setStudentInput(val);
              const trimmed = val.trim();
              if (!trimmed) {
                setStudentData(null);
              } else if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
                // Auto-búsqueda inmediata si es un Mongo ObjectId válido
                loadStudent(trimmed);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && studentInput.trim()) {
                loadStudent(studentInput.trim());
              }
            }}
            onSelect={(user) => {
              if (user) {
                setStudentInput(String(user.incremental_user_code));
                loadStudent(String(user.incremental_user_code));
              }
            }}
            placeholder="Pega Mongo ObjectId (24 car.) o escribe código INC..."
            inputStyle={{ height: '42px' }}
          />
        </div>

        {/* Acciones Rápidas de Diagnóstico y Remediación */}
        <AccionesRapidas
          hasStudent={Boolean(studentData)}
          hasProgram={Boolean(selectedProgramId)}
          groupsCount={studentData?.groups?.length || 0}
          selectedGroupIds={selectedGroupIds}
          onClearSelection={handleClearGroupSelection}
          onAction={handleAction}
        />
      </div>

      {/* ── Estado de Carga ── */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', gap: '12px', color: 'var(--primary)' }}>
          <Loader2 size={28} className="animate-spin" />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Extrayendo perfil, programas y asignaturas...</span>
        </div>
      )}

      {/* ── Vista Detallada 360° ── */}
      {!loading && studentData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <FichaPerfil student={studentData.student} />

          <ProgramasYGrupos
            programs={studentData.programs}
            groups={studentData.groups}
            selectedProgramId={selectedProgramId}
            onSelectProgram={setSelectedProgramId}
            selectedGroupIds={selectedGroupIds}
            onToggleGroup={handleToggleGroup}
            onSelectAllGroups={handleSelectAllGroups}
            onDeselectAllGroups={handleClearGroupSelection}
            onAction={handleAction}
          />
        </div>
      )}

      {/* ── Visor de Comandos Generados ── */}
      <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
    </div>
  );
}
