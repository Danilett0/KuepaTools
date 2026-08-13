import React, { useState, useCallback, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { showError, showSuccess } from '../../services/toastService';
import CommandsDisplay from '../CommandsDisplay';
import ClearButton from '../ui/ClearButton';

export default function FormGrupo() {
  const [groupId, setGroupId] = useLocalStorage('groupId-grupo', '');
  const [txareaIds, setTxareaIds] = useLocalStorage('txareaIds-grupo', '');
  const [studentIds, setStudentIds] = useLocalStorage('studentIds-grupo', Array(8).fill(''));
  const [inputMode, setInputMode] = useState('paste');
  const [generatedCommands, setGeneratedCommands] = useState([]);

  const minInputs = 8;

  useEffect(() => {
    if (generatedCommands.length > 0) setGeneratedCommands([]);
  }, [groupId, studentIds, txareaIds]);

  const handleClear = useCallback(() => {
    setGeneratedCommands([]);
    setTxareaIds('');
    setGroupId('');
    setStudentIds(Array(minInputs).fill(''));
  }, [minInputs, setGroupId, setStudentIds, setTxareaIds]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  const handleStudentIdChange = (index, value) => {
    const updated = [...studentIds];
    updated[index] = value;
    setStudentIds(updated);
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
    setStudentIds(newIds);
    showSuccess(`Se importaron ${flatIds.length} registros correctamente.`);
    setTxareaIds('');
  };

  const handleAction = (isRemove) => {
    const gId = groupId.trim();
    if (!gId) {
      showError('Por favor ingrese el ID del grupo académico.');
      return;
    }
    const filteredIds = studentIds.filter(id => id.trim() !== '');
    if (filteredIds.length === 0) {
      showError('Por favor ingrese al menos un ID de estudiante.');
      return;
    }
    const action = isRemove ? 'pull:user:from:group' : 'enroll:user';
    const command = `magik run:prod ${action}["${gId}","${filteredIds.join('","')}"]`;
    setGeneratedCommands([command]);
    showSuccess('Comando generado');
  };

  return (
    <div className="inscripciones-form-container" style={{ marginTop: 0 }}>
      <div className="inscripciones-form">
        <div className="buscarIds">
          <div className="input-wrapper" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>ID del grupo académico</label>
              <ClearButton onClick={handleClear} title="Limpiar formulario" />
            </div>
            <input
              type="text"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="inscripciones-input"
              placeholder="Ej. 63e14e3af870ee0c8777b6a7"
              style={{ borderColor: groupId.trim().length > 0 && groupId.trim().length < 24 ? '#ff4757' : undefined }}
            />
          </div>
        </div>

        <div className="segmented-control">
          <button className={`segmented-btn ${inputMode === 'paste' ? 'active' : ''}`} onClick={() => setInputMode('paste')}>Pegar lista de IDs</button>
          <button className={`segmented-btn ${inputMode === 'manual' ? 'active' : ''}`} onClick={() => setInputMode('manual')}>
            Ingreso manual
            {studentIds.filter(id => id.trim() !== '').length > 0 && (
              <span style={{
                background: inputMode === 'manual' ? 'var(--primary)' : 'var(--glass-border)',
                color: inputMode === 'manual' ? '#090909' : 'var(--on-surface-variant)',
                padding: '2px 6px', borderRadius: '100px', fontSize: '10px', marginLeft: '6px'
              }}>
                {studentIds.filter(id => id.trim() !== '').length}
              </span>
            )}
          </button>
        </div>

        {inputMode === 'manual' && (
          <div className="inscripciones-grid" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
            {studentIds.map((studentId, index) => (
              <div className="input-wrapper" key={index}>
                <label className="input-label">ID Estudiante {index + 1}</label>
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
          <UserPlus size={18} /> Inscribir al grupo
        </button>
      </div>

      <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
    </div>
  );
}
