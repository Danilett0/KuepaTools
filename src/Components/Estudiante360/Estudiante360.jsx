import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserCheck, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAppStore } from '../../store/useAppStore';
import { useCatalogos } from '../../hooks/useCatalogos';
import { ALLIANCE_IDS } from '../../utils/constants';
import AllianceSwitcher from '../ui/AllianceSwitcher';
import ClearButton from '../ui/ClearButton';
import IncAutocomplete from '../ui/IncAutocomplete';
import CommandsDisplay from '../CommandsDisplay';
import FichaPerfil from './FichaPerfil';
import ProgramasYGrupos from './ProgramasYGrupos';
import AccionesRapidas from './AccionesRapidas';
import HubVacio from './HubVacio';
import Student360Loader from './Student360Loader';
import { fetchStudent360Data, generate360Commands, formatIdsForClipboard } from '../../services/student360Service';

export default function Estudiante360() {
  const [alianza, setAlianza] = useLocalStorage('estudiante360-alianza', 'na');
  const [studentInput, setStudentInput] = useLocalStorage('estudiante360-input', '');
  const [studentData, setStudentData] = useLocalStorage('estudiante360-student-data', null);
  const [selectedProgramId, setSelectedProgramId] = useLocalStorage('estudiante360-program-id', '');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [generatedCommands, setGeneratedCommands] = useState([]);
  const [loading, setLoading] = useState(false);

  const aiPrefilledData = useAppStore((state) => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore((state) => state.setAiPrefilledData);

  const allianceId = alianza === 'kuepa' ? ALLIANCE_IDS.kuepa : ALLIANCE_IDS.na;
  const lastLoadedKeyRef = useRef(
    studentData ? `${(studentInput || '').trim()}:${allianceId}` : ''
  );
  const { estados: estadosData } = useCatalogos();

  const statusOptions = useMemo(() => {
    if (!estadosData) return [];
    return estadosData
      .filter((e) => e.alliance_id?.$oid === allianceId)
      .map((e) => ({ value: e._id.$oid, label: e.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [estadosData, allianceId]);

  const enrichedPrograms = useMemo(() => {
    if (!studentData?.programs) return [];
    return studentData.programs.map((prog) => {
      const statusId =
        prog.raw?.status?.$oid ||
        (typeof prog.raw?.status === 'string' ? prog.raw.status : '') ||
        prog.raw?.status_id ||
        '';
      const statusName =
        statusOptions.find((s) => s.value === String(statusId))?.label ||
        prog.raw?.status_name ||
        prog.raw?.statusName ||
        (typeof prog.raw?.status === 'string' && isNaN(prog.raw.status) && prog.raw.status.length < 25
          ? prog.raw.status
          : '') ||
        '';
      return {
        ...prog,
        statusId,
        statusName,
      };
    });
  }, [studentData?.programs, statusOptions]);

  const selectedProgram = useMemo(() => {
    if (enrichedPrograms.length === 0) return null;
    return enrichedPrograms.find((p) => p.programId === selectedProgramId) || enrichedPrograms[0];
  }, [enrichedPrograms, selectedProgramId]);

  const selectedProgramName = selectedProgram?.name || '';
  const currentStatusName = selectedProgram?.statusName || '';

  // ── Carga de datos del estudiante ──────────────────────────────────────────
  const loadStudent = useCallback(
    async (identifier, force = false) => {
      const trimmed = (identifier || '').trim();
      if (!trimmed) {
        setStudentData(null);
        setSelectedProgramId('');
        setSelectedGroupIds([]);
        setGeneratedCommands([]);
        lastLoadedKeyRef.current = '';
        return;
      }

      const requestKey = `${trimmed}:${allianceId}`;
      if (!force && lastLoadedKeyRef.current === requestKey && studentData) {
        return;
      }

      setLoading(true);
      setGeneratedCommands([]);
      setSelectedGroupIds([]);
      try {
        const data = await fetchStudent360Data(trimmed, allianceId);
        if (!data) {
          toast.warning('No se encontró el estudiante en la alianza seleccionada.');
          setStudentData(null);
          setSelectedProgramId('');
          setSelectedGroupIds([]);
          setGeneratedCommands([]);
          lastLoadedKeyRef.current = '';
        } else {
          lastLoadedKeyRef.current = requestKey;
          setStudentData(data);
          setSelectedGroupIds([]);
          setGeneratedCommands([]);
          // Auto-seleccionar el programa si sigue existiendo o asignar el primero
          if (data.programs.length > 0) {
            const hasExisting = data.programs.some((p) => p.programId === selectedProgramId);
            if (!hasExisting) {
              setSelectedProgramId(data.programs[0].programId);
            }
          } else {
            setSelectedProgramId('');
          }
        }
      } catch (err) {
        console.error('Error cargando estudiante 360:', err);
        toast.error(`Error al consultar estudiante: ${err.message}`);
        setStudentData(null);
        setSelectedGroupIds([]);
        setGeneratedCommands([]);
        lastLoadedKeyRef.current = '';
      } finally {
        setLoading(false);
      }
    },
    [allianceId, studentData, selectedProgramId, setStudentData, setSelectedProgramId]
  );

  const isFirstMountRef = useRef(true);
  const typingDebounceRef = useRef(null);

  // Sincronizar consulta únicamente al montar (restaurar caché) o al cambiar de alianza
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      const trimmed = (studentInput || '').trim();
      if (trimmed) {
        const currentKey = `${trimmed}:${allianceId}`;
        const matchesCache =
          studentData &&
          (String(studentData.student?.inc) === trimmed || studentData.student?.mongoId === trimmed) &&
          studentData.student?.allianceId === allianceId;

        if (!matchesCache) {
          loadStudent(trimmed);
        } else {
          lastLoadedKeyRef.current = currentKey;
        }
      }
      return;
    }

    // Cambio explícito de alianza: recargar datos del estudiante con la nueva alianza
    const trimmed = (studentInput || '').trim();
    if (trimmed) {
      loadStudent(trimmed, true);
    }
  }, [alianza, allianceId]);

  // Limpiar temporizadores de tipeo al desmontar
  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
    };
  }, []);

  // Manejar AI Prefill si viene desde la Command Palette
  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.ids && aiPrefilledData.ids.length > 0) {
      const incomingId = aiPrefilledData.ids[0];
      setStudentInput(incomingId);
      loadStudent(incomingId, true);
      setAiPrefilledData(null);
    }
  }, [aiPrefilledData, loadStudent, setAiPrefilledData, setStudentInput]);

  const handleClear = useCallback(() => {
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }
    setStudentInput('');
    setStudentData(null);
    setSelectedProgramId('');
    setSelectedGroupIds([]);
    setGeneratedCommands([]);
    lastLoadedKeyRef.current = '';
  }, [setStudentInput, setStudentData, setSelectedProgramId]);

  // Control de entrada de texto con debounce de inactividad (1000ms)
  const handleInputChange = (val) => {
    setStudentInput(val);
    const trimmed = (val || '').trim();

    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }

    if (!trimmed) {
      setStudentData(null);
      setSelectedProgramId('');
      setSelectedGroupIds([]);
      setGeneratedCommands([]);
      lastLoadedKeyRef.current = '';
      return;
    }

    // Si es un Mongo ObjectId completo de 24 caracteres hex
    if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
      typingDebounceRef.current = setTimeout(() => {
        loadStudent(trimmed);
      }, 400);
      return;
    }

    // Código INC digitado manualmente: esperar 1000ms de inactividad tras la última tecla
    typingDebounceRef.current = setTimeout(() => {
      if (trimmed.length >= 2) {
        const currentKey = `${trimmed}:${allianceId}`;
        const isAlreadyLoaded =
          studentData &&
          (String(studentData.student?.inc) === trimmed || studentData.student?.mongoId === trimmed) &&
          studentData.student?.allianceId === allianceId;

        if (!isAlreadyLoaded && lastLoadedKeyRef.current !== currentKey) {
          loadStudent(trimmed);
        }
      }
    }, 1000);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const trimmed = (studentInput || '').trim();
      if (trimmed) {
        if (typingDebounceRef.current) {
          clearTimeout(typingDebounceRef.current);
          typingDebounceRef.current = null;
        }
        loadStudent(trimmed, true);
      }
    }
  };

  const handleSelectSuggestion = (user) => {
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }
    if (user) {
      const code = String(user.incremental_user_code);
      if (
        studentData &&
        (String(studentData.student?.inc) === code || studentData.student?.mongoId === user._id?.$oid) &&
        studentData.student?.allianceId === allianceId
      ) {
        return;
      }
      setStudentInput(code);
      loadStudent(code, true);
    }
  };

  // Cambio de programa: limpia automáticamente comandos y selección de materias
  const handleSelectProgram = useCallback((progId) => {
    setSelectedProgramId(progId);
    setGeneratedCommands([]);
    setSelectedGroupIds([]);
  }, []);

  const handleToggleGroup = useCallback((groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
    setGeneratedCommands([]);
  }, []);

  const handleSelectAllGroups = useCallback((groupIdsToSelect) => {
    setSelectedGroupIds(groupIdsToSelect);
    setGeneratedCommands([]);
  }, []);

  const handleClearGroupSelection = useCallback(() => {
    setSelectedGroupIds([]);
    setGeneratedCommands([]);
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
        statusId: extraParams.statusId,
      };

      const cmds = generate360Commands(actionType, params);
      setGeneratedCommands(cmds);
      if (actionType === 'change_program_status' && extraParams.statusName) {
        toast.success(`Comando generado: Cambiar a ${extraParams.statusName}`);
      } else {
        toast.success(`${cmds.length} comando${cmds.length !== 1 ? 's' : ''} generado${cmds.length !== 1 ? 's' : ''}`);
      }
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
        gap: '10px',
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '12px 18px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header y Barra de Búsqueda ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #06a080 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#090909',
            }}
          >
            <UserCheck size={16} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--on-surface)', margin: 0, lineHeight: 1.2 }}>
              Ficha Técnica Estudiante 360°
            </h1>
            <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
              Diagnóstico, materias y remediación operativa en un clic
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AllianceSwitcher
            value={alianza}
            size="sm"
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

      {/* ── Barra Superior de Búsqueda y Acciones Rápidas ── */}
      <div className="estudiante360-topbar">
        {/* Input Autocomplete de INC / ID */}
        <div
          style={{
            background: 'var(--surface-low)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '8px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '6px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <label className="input-label" style={{ marginBottom: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              Buscar Estudiante por Código INC o Mongo ObjectId
            </label>
            {loading && (
              <span style={{ fontSize: '10px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                <Loader2 size={11} className="animate-spin" />
                <span>Cargando...</span>
              </span>
            )}
          </div>
          <IncAutocomplete
            alianzaId={allianceId}
            value={studentInput}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onSelect={handleSelectSuggestion}
            autoSelectExact={false}
            debounceMs={1000}
            placeholder="Pega Mongo ObjectId (24 car.) o escribe código INC..."
            inputStyle={{ height: '32px', fontSize: '12px' }}
          />
        </div>

        {/* Acciones Rápidas de Diagnóstico y Remediación */}
        <AccionesRapidas
          hasStudent={Boolean(studentData)}
          hasProgram={Boolean(selectedProgramId)}
          selectedProgramName={selectedProgramName}
          currentStatusName={currentStatusName}
          statusOptions={statusOptions}
          groupsCount={studentData?.groups?.length || 0}
          selectedGroupIds={selectedGroupIds}
          onClearSelection={handleClearGroupSelection}
          onAction={handleAction}
        />
      </div>

      {/* ── Estado de Carga Tecnológico & Animado ── */}
      {loading && <Student360Loader identifier={studentInput} />}

      {/* ── Estado Inicial / Sin Estudiante ── */}
      {!loading && !studentData && (
        <HubVacio
          onSelectExample={(code) => {
            if (typingDebounceRef.current) {
              clearTimeout(typingDebounceRef.current);
              typingDebounceRef.current = null;
            }
            setStudentInput(code);
            loadStudent(code, true);
          }}
        />
      )}

      {/* ── Vista Detallada 360° ── */}
      {!loading && studentData && (
        <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
          <div style={{ position: 'relative', zIndex: 30 }}>
            <FichaPerfil
              student={studentData.student}
              programs={enrichedPrograms}
              selectedProgramId={selectedProgramId}
              currentStatusName={currentStatusName}
              onSelectProgram={handleSelectProgram}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <ProgramasYGrupos
              groups={studentData.groups}
              selectedGroupIds={selectedGroupIds}
              onToggleGroup={handleToggleGroup}
              onSelectAllGroups={handleSelectAllGroups}
              onDeselectAllGroups={handleClearGroupSelection}
              onAction={handleAction}
            />
          </div>
        </div>
      )}

      {/* ── Visor de Comandos Generados ── */}
      <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
    </div>
  );
}
