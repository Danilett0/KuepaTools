import React, { useState, useCallback, useEffect } from 'react';
import { UserPlus, UserMinus, ClipboardList, Hash } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { showError, showSuccess } from '../../services/toastService';
import CommandsDisplay from '../CommandsDisplay';
import IncAutocomplete from '../ui/IncAutocomplete';
import { ALLIANCE_IDS } from '../../utils/constants';
import { useAppStore } from '../../store/useAppStore';

export default function FormEstudiante({ alianza, setAlianza, clearToken }) {
  const aiPrefilledData = useAppStore((state) => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore((state) => state.setAiPrefilledData);
  const [groupId2, setGroupId2] = useLocalStorage('groupId2-estudiante', '');
  const [txareaIds, setTxareaIds] = useLocalStorage('txareaIds-estudiante', '');
  const [studentIds2, setStudentIds2] = useLocalStorage('studentIds2-estudiante', Array(8).fill(''));
  const [inputMode, setInputMode] = useState('paste');
  const [generatedCommands, setGeneratedCommands] = useState([]);

  const minInputs = 8;

  useEffect(() => {
    if (generatedCommands.length > 0) setGeneratedCommands([]);
  }, [groupId2, studentIds2, txareaIds, alianza]);

  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.intent === 'ENROLL') {
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 0) {
        setGroupId2(aiPrefilledData.ids[0]);
      }
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 1) {
        setInputMode('manual');
        setStudentIds2((prev) => {
          const updated = [...prev];
          updated[0] = aiPrefilledData.ids[1];
          return updated;
        });
      }
      setAiPrefilledData(null);
    }
  }, [aiPrefilledData, setGroupId2, setStudentIds2, setInputMode, setAiPrefilledData]);

  const handleClear = useCallback(() => {
    setGeneratedCommands([]);
    setTxareaIds('');
    setGroupId2('');
    setStudentIds2(Array(minInputs).fill(''));
  }, [minInputs, setGroupId2, setStudentIds2, setTxareaIds]);

  // Respond to clearToken from parent (tab bar Limpiar button)
  useEffect(() => {
    if (clearToken > 0) handleClear();
  }, [clearToken]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') handleClear(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  const handleStudentIdChange = (index, value) => {
    const updated = [...studentIds2];
    updated[index] = value;
    setStudentIds2(updated);
  };

  const handleGeneratePaste = () => {
    if (!txareaIds || txareaIds.trim() === '') return;
    const flatIds = Array.from(new Set(
      txareaIds.split(/\s+/).map((e) => e.trim()).filter((e) => e.length >= 24 && e.length <= 26 && /^[a-zA-Z0-9]+$/.test(e))
    ));
    if (flatIds.length === 0) { setTxareaIds(''); return; }
    const newIds = Array(Math.max(flatIds.length, minInputs)).fill('');
    flatIds.forEach((id, i) => { newIds[i] = id; });
    setStudentIds2(newIds);
    showSuccess(`Se importaron ${flatIds.length} registros correctamente.`);
    setTxareaIds('');
  };

  const handleAction = (isRemove) => {
    const estudiante = groupId2.trim();
    if (!estudiante) { showError('Por favor ingrese el ID del estudiante.'); return; }
    const grupos = studentIds2.filter((id) => id.trim() !== '');
    if (grupos.length === 0) { showError('Por favor ingrese al menos un ID de grupo.'); return; }
    const action = isRemove ? 'pull:user:from:group' : 'enroll:user';
    const comandos = grupos.map((grupo) => `magik run:prod ${action}["${grupo}","${estudiante}"]`);
    setGeneratedCommands(comandos);
    showSuccess(`${comandos.length} comando${comandos.length !== 1 ? 's' : ''} generado${comandos.length !== 1 ? 's' : ''}`);
  };

  const filledGroupCount = studentIds2.filter((id) => id.trim() !== '').length;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* ── Campo: Estudiante ── */}
        <div className="inscr-field-block">
          <label className="inscr-field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Hash size={12} style={{ color: 'var(--primary)' }} />
            INC / ID del Estudiante
          </label>
          <IncAutocomplete
            alianzaId={alianza === 'kuepa' ? ALLIANCE_IDS.kuepa : ALLIANCE_IDS.na}
            value={groupId2}
            onChange={setGroupId2}
            onSelect={(user) => { if (user) setGroupId2(user._id.$oid); }}
            placeholder="Ej. INC o ID largo del estudiante"
            inputStyle={{ height: '42px', padding: '0 40px 0 14px', boxSizing: 'border-box' }}
          />
        </div>

        {/* ── Selector de Modo ── */}
        <div className="inscr-mode-selector">
          <button
            type="button"
            className={`inscr-mode-btn ${inputMode === 'paste' ? 'active' : ''}`}
            onClick={() => setInputMode('paste')}
          >
            <ClipboardList size={14} />
            Pegar lista de IDs de grupos
          </button>
          <button
            type="button"
            className={`inscr-mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
            onClick={() => setInputMode('manual')}
          >
            <Hash size={14} />
            Ingreso manual
            {filledGroupCount > 0 && (
              <span className="inscr-count-badge">{filledGroupCount}</span>
            )}
          </button>
        </div>

        {/* ── Modo: Pegar ── */}
        {inputMode === 'paste' && (
          <div className="inscr-field-block">
            <label className="inscr-field-label">IDs de Grupos (uno por línea)</label>
            <textarea
              className="inscr-textarea"
              value={txareaIds}
              onChange={(e) => setTxareaIds(e.target.value)}
              onBlur={handleGeneratePaste}
              style={{ minHeight: '200px' }}
              placeholder="Pega aquí los IDs de los grupos, uno por línea o separados por espacios..."
            />
          </div>
        )}

        {/* ── Modo: Manual ── */}
        {inputMode === 'manual' && (
          <div className="inscr-grid-manual">
            {studentIds2.map((groupId, index) => (
              <div className="inscr-field-block" key={index}>
                <label className="inscr-field-label">Grupo {index + 1}</label>
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => handleStudentIdChange(index, e.target.value)}
                  className={`inscr-input ${groupId.trim().length > 0 && groupId.trim().length < 24 ? 'invalid' : ''}`}
                  placeholder="ID del grupo"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Acciones ── */}
      <div className="inscr-actions-row">
        <button className="inscr-btn-danger" onClick={() => handleAction(true)}>
          <UserMinus size={15} /> Retirar de grupos
        </button>
        <button className="inscr-btn-primary" onClick={() => handleAction(false)}>
          <UserPlus size={15} /> Inscribir a grupos
        </button>
      </div>

      <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
    </>
  );
}
