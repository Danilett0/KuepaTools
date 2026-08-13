import React, { useState, useCallback, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { showError, showSuccess } from '../../services/toastService';
import CommandsDisplay from '../CommandsDisplay';
import ClearButton from '../ui/ClearButton';
import AllianceSwitcher from '../ui/AllianceSwitcher';
import IncAutocomplete from '../ui/IncAutocomplete';
import { ALLIANCE_IDS } from '../../utils/constants';
import { useAppStore } from '../../store/useAppStore';

export default function FormEstudiante() {
  const aiPrefilledData = useAppStore(state => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore(state => state.setAiPrefilledData);
  const [groupId2, setGroupId2] = useLocalStorage('groupId2-estudiante', '');
  const [txareaIds, setTxareaIds] = useLocalStorage('txareaIds-estudiante', '');
  const [studentIds2, setStudentIds2] = useLocalStorage('studentIds2-estudiante', Array(8).fill(''));
  const [alianza, setAlianza] = useLocalStorage('alianza-estudiante', 'na');
  const [inputMode, setInputMode] = useState('paste');
  const [generatedCommands, setGeneratedCommands] = useState([]);
  
  const minInputs = 8;
  const loading = false; // Mocked as original

  useEffect(() => {
    if (generatedCommands.length > 0) setGeneratedCommands([]);
  }, [groupId2, studentIds2, txareaIds, alianza]);

  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.intent === 'ENROLL') {
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 0) {
        setGroupId2(aiPrefilledData.ids[0]); // student ID
      }
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 1) {
        setInputMode('manual');
        setStudentIds2(prev => {
          const updated = [...prev];
          updated[0] = aiPrefilledData.ids[1]; // group ID
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClear();
    };
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
      txareaIds.split(/\s+/).map(e => e.trim()).filter(e => {
        return e.length >= 24 && e.length <= 26 && /^[a-zA-Z0-9]+$/.test(e);
      })
    ));
    if (flatIds.length === 0) {
      setTxareaIds('');
      return;
    }
    const requiredInputs = Math.max(flatIds.length, minInputs);
    const newIds = Array(requiredInputs).fill('');
    flatIds.forEach((id, index) => { newIds[index] = id; });
    setStudentIds2(newIds);
    showSuccess(`Se importaron ${flatIds.length} registros correctamente.`);
    setTxareaIds('');
  };

  const handleAction = (isRemove) => {
    const estudiante = groupId2.trim();
    if (!estudiante) {
      showError('Por favor ingrese el ID del estudiante.');
      return;
    }
    const grupos = studentIds2.filter(id => id.trim() !== '');
    if (grupos.length === 0) {
      showError('Por favor ingrese al menos un ID de grupo.');
      return;
    }
    const action = isRemove ? 'pull:user:from:group' : 'enroll:user';
    const comandos = grupos.map(grupo => `magik run:prod ${action}["${grupo}","${estudiante}"]`);
    setGeneratedCommands(comandos);
    showSuccess(`${comandos.length} comando${comandos.length !== 1 ? 's' : ''} generado${comandos.length !== 1 ? 's' : ''}`);
  };

  return (
    <div className="inscripciones-form-container" style={{ marginTop: 0 }}>
      <div className="inscripciones-form">
        <div className="buscarIds">
          <div className="input-wrapper" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>INC / ID del estudiante</label>
                <AllianceSwitcher value={alianza} onChange={(val) => { if (alianza !== val) { handleClear(); setAlianza(val); } }} />
              </div>
              <ClearButton onClick={handleClear} title="Limpiar formulario" />
            </div>
            <IncAutocomplete
              alianzaId={alianza === 'kuepa' ? ALLIANCE_IDS.kuepa : ALLIANCE_IDS.na}
              value={groupId2}
              onChange={setGroupId2}
              onSelect={(user) => { if (user) setGroupId2(user._id.$oid); }}
              placeholder="Ej. INC o ID largo del estudiante"
            />
          </div>
        </div>

        <div className="segmented-control">
          <button className={`segmented-btn ${inputMode === 'paste' ? 'active' : ''}`} onClick={() => setInputMode('paste')}>Pegar lista de IDs</button>
          <button className={`segmented-btn ${inputMode === 'manual' ? 'active' : ''}`} onClick={() => setInputMode('manual')}>
            Ingreso manual
            {studentIds2.filter(id => id.trim() !== '').length > 0 && (
              <span style={{
                background: inputMode === 'manual' ? 'var(--primary)' : 'var(--glass-border)',
                color: inputMode === 'manual' ? '#090909' : 'var(--on-surface-variant)',
                padding: '2px 6px', borderRadius: '100px', fontSize: '10px', marginLeft: '6px'
              }}>
                {studentIds2.filter(id => id.trim() !== '').length}
              </span>
            )}
          </button>
        </div>

        {inputMode === 'manual' && (
          <div className="inscripciones-grid" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
            {studentIds2.map((studentId, index) => (
              <div className="input-wrapper" key={index}>
                <label className="input-label">ID Grupo {index + 1}</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => handleStudentIdChange(index, e.target.value)}
                  className="inscripciones-input"
                  style={{ borderColor: studentId.trim().length > 0 && studentId.trim().length < 24 ? '#ff4757' : undefined }}
                />
              </div>
            ))}
          </div>
        )}

        {inputMode === 'paste' && (
          <div className="input-wrapper" style={{ marginTop: '8px' }}>
            <textarea
              className="txareaids"
              value={txareaIds}
              onChange={(e) => setTxareaIds(e.target.value)}
              onBlur={handleGeneratePaste}
              style={{ minHeight: '150px' }}
              placeholder="Pega aquí los IDs..."
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
        <button className="btn btn-outline-danger" onClick={() => handleAction(true)}>
          <UserMinus size={18} /> Retirar
        </button>
        <button className="btn btn-primary" onClick={() => handleAction(false)}>
          <UserPlus size={18} /> Inscribir a grupos
        </button>
      </div>

      <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
    </div>
  );
}
