import React, { useState, useCallback, useEffect } from 'react';
import { UserPlus, UserMinus, ClipboardList, Hash, School } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { showError, showSuccess } from '../../services/toastService';
import CommandsDisplay from '../CommandsDisplay';

export default function FormGrupo({ clearToken }) {
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

  // Respond to clearToken from parent tab bar
  useEffect(() => {
    if (clearToken > 0) handleClear();
  }, [clearToken]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') handleClear(); };
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
      txareaIds.split(/\s+/).map((e) => e.trim()).filter((e) => e.length >= 24 && e.length <= 26 && /^[a-zA-Z0-9]+$/.test(e))
    ));
    if (flatIds.length === 0) { setTxareaIds(''); return; }
    const newIds = Array(Math.max(flatIds.length, minInputs)).fill('');
    flatIds.forEach((id, i) => { newIds[i] = id; });
    setStudentIds(newIds);
    showSuccess(`Se importaron ${flatIds.length} registros correctamente.`);
    setTxareaIds('');
  };

  const handleAction = (isRemove) => {
    const gId = groupId.trim();
    if (!gId) { showError('Por favor ingrese el ID del grupo académico.'); return; }
    const filteredIds = studentIds.filter((id) => id.trim() !== '');
    if (filteredIds.length === 0) { showError('Por favor ingrese al menos un ID de estudiante.'); return; }
    const action = isRemove ? 'pull:user:from:group' : 'enroll:user';
    const command = `magik run:prod ${action}["${gId}","${filteredIds.join('","')}"]`;
    setGeneratedCommands([command]);
    showSuccess('Comando generado');
  };

  const filledCount = studentIds.filter((id) => id.trim() !== '').length;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* ── Campo: Grupo ── */}
        <div className="inscr-field-block">
          <label className="inscr-field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <School size={12} style={{ color: 'var(--primary)' }} />
            ID del Grupo Académico
          </label>
          <input
            type="text"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className={`inscr-input ${groupId.trim().length > 0 && groupId.trim().length < 24 ? 'invalid' : ''}`}
            placeholder="Ej. 63e14e3af870ee0c8777b6a7"
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
            Pegar lista de IDs de estudiantes
          </button>
          <button
            type="button"
            className={`inscr-mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
            onClick={() => setInputMode('manual')}
          >
            <Hash size={14} />
            Ingreso manual
            {filledCount > 0 && (
              <span className="inscr-count-badge">{filledCount}</span>
            )}
          </button>
        </div>

        {/* ── Modo: Pegar ── */}
        {inputMode === 'paste' && (
          <div className="inscr-field-block">
            <label className="inscr-field-label">IDs de Estudiantes (uno por línea)</label>
            <textarea
              className="inscr-textarea"
              value={txareaIds}
              onChange={(e) => setTxareaIds(e.target.value)}
              onBlur={handleGeneratePaste}
              style={{ minHeight: '200px' }}
              placeholder="Pega aquí los IDs de los estudiantes, uno por línea o separados por espacios..."
            />
          </div>
        )}

        {/* ── Modo: Manual ── */}
        {inputMode === 'manual' && (
          <div className="inscr-grid-manual">
            {studentIds.map((studentId, index) => (
              <div className="inscr-field-block" key={index}>
                <label className="inscr-field-label">Estudiante {index + 1}</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => handleStudentIdChange(index, e.target.value)}
                  className={`inscr-input ${studentId.trim().length > 0 && studentId.trim().length < 24 ? 'invalid' : ''}`}
                  placeholder="ID del estudiante"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Acciones ── */}
      <div className="inscr-actions-row">
        <button className="inscr-btn-danger" onClick={() => handleAction(true)}>
          <UserMinus size={15} /> Retirar del grupo
        </button>
        <button className="inscr-btn-primary" onClick={() => handleAction(false)}>
          <UserPlus size={15} /> Inscribir al grupo
        </button>
      </div>

      <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
    </>
  );
}
