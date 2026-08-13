import React, { useState, useCallback, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { showError, showSuccess } from '../../services/toastService';
import CommandsDisplay from '../CommandsDisplay';
import ClearButton from '../ui/ClearButton';

export default function FormCargaCombinada() {
  const [txareaEspecStudents, setTxareaEspecStudents] = useLocalStorage('txareaEspecStudents-especificos', '');
  const [txareaEspecGroups, setTxareaEspecGroups] = useLocalStorage('txareaEspecGroups-especificos', '');
  const [generatedCommands, setGeneratedCommands] = useState([]);

  useEffect(() => {
    if (generatedCommands.length > 0) setGeneratedCommands([]);
  }, [txareaEspecStudents, txareaEspecGroups]);

  const handleClear = useCallback(() => {
    setGeneratedCommands([]);
    setTxareaEspecStudents('');
    setTxareaEspecGroups('');
  }, [setTxareaEspecStudents, setTxareaEspecGroups]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  const validateIds = (text) => {
    if (!text || text.trim() === '') return { valid: false, ids: [], error: 'vacío' };
    const rawIds = text.split(/\s+/).map(e => e.trim()).filter(e => e !== '');
    if (rawIds.length === 0) return { valid: false, ids: [], error: 'vacío' };
    const ids = Array.from(new Set(rawIds));
    for (const id of ids) {
      if (id.length < 24 || id.length > 26 || !/^[a-zA-Z0-9]+$/.test(id)) {
        return { valid: false, ids: [], error: 'inválido' };
      }
    }
    return { valid: true, ids };
  };

  const handleAction = (isRemove) => {
    const studentsValidation = validateIds(txareaEspecStudents);
    if (!studentsValidation.valid) {
      showError(studentsValidation.error === 'inválido' ? 'Hay registros no válidos en ESTUDIANTES.' : 'Ingrese al menos un ID de estudiante.');
      return;
    }
    const groupsValidation = validateIds(txareaEspecGroups);
    if (!groupsValidation.valid) {
      showError(groupsValidation.error === 'inválido' ? 'Hay registros no válidos en GRUPOS.' : 'Ingrese al menos un ID de grupo.');
      return;
    }

    const studentsJoined = studentsValidation.ids.join('","');
    const commands = groupsValidation.ids.map(groupId => {
      const action = isRemove ? 'pull:user:from:group' : 'enroll:user';
      return `magik run:prod ${action}["${groupId}","${studentsJoined}"]`;
    });

    setGeneratedCommands(commands);
    showSuccess(`${commands.length} comando${commands.length !== 1 ? 's' : ''} generado${commands.length !== 1 ? 's' : ''}`);
  };

  return (
    <div className="inscripciones-form-container" style={{ marginTop: 0 }}>
      <div className="inscripciones-form">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <label className="input-label" style={{ marginBottom: 0 }}>Carga combinada</label>
          <ClearButton onClick={handleClear} title="Limpiar formulario" />
        </div>
        <hr className="inscripciones-divider" style={{ marginTop: 0, marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="input-wrapper" style={{ flex: 1 }}>
            <label className="input-label" style={{ marginBottom: '8px' }}>Lista de Estudiantes</label>
            <textarea
              className="txareaids"
              value={txareaEspecStudents}
              onChange={(e) => setTxareaEspecStudents(e.target.value)}
              style={{ minHeight: '300px', resize: 'vertical' }}
              placeholder="Ingrese un ID por línea..."
            />
          </div>
          <div className="input-wrapper" style={{ flex: 1 }}>
            <label className="input-label" style={{ marginBottom: '8px' }}>Lista de Grupos</label>
            <textarea
              className="txareaids"
              value={txareaEspecGroups}
              onChange={(e) => setTxareaEspecGroups(e.target.value)}
              style={{ minHeight: '300px', resize: 'vertical' }}
              placeholder="Ingrese un ID por línea..."
            />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
        <button className="btn btn-outline-danger" onClick={() => handleAction(true)}>
          <UserMinus size={18} /> Retirar estudiantes
        </button>
        <button className="btn btn-primary" onClick={() => handleAction(false)}>
          <UserPlus size={18} /> Inscribir estudiantes
        </button>
      </div>
      <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
    </div>
  );
}
