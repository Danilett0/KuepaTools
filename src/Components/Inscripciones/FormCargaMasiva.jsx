import React, { useState, useCallback, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { showError, showSuccess } from '../../services/toastService';
import CommandsDisplay from '../CommandsDisplay';
import ClearButton from '../ui/ClearButton';

export default function FormCargaMasiva() {
  const [txareaMultiStudents, setTxareaMultiStudents] = useLocalStorage('txareaMultiStudents-multi', '');
  const [txareaMultiGroups, setTxareaMultiGroups] = useLocalStorage('txareaMultiGroups-multi', '');
  const [generatedCommands, setGeneratedCommands] = useState([]);

  useEffect(() => {
    if (generatedCommands.length > 0) setGeneratedCommands([]);
  }, [txareaMultiStudents, txareaMultiGroups]);

  const handleClear = useCallback(() => {
    setGeneratedCommands([]);
    setTxareaMultiStudents('');
    setTxareaMultiGroups('');
  }, [setTxareaMultiStudents, setTxareaMultiGroups]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  const validateIds = (text) => {
    if (!text || text.trim() === '') return { valid: false, ids: [], error: 'vacío' };
    const ids = text.split(/\s+/).map(e => e.trim()).filter(e => e !== '');
    if (ids.length === 0) return { valid: false, ids: [], error: 'vacío' };
    for (const id of ids) {
      if (id.length < 24 || id.length > 26 || !/^[a-zA-Z0-9]+$/.test(id)) {
        return { valid: false, ids: [], error: 'inválido' };
      }
    }
    return { valid: true, ids };
  };

  const handleAction = (isRemove) => {
    const studentsValidation = validateIds(txareaMultiStudents);
    if (!studentsValidation.valid) {
      showError(studentsValidation.error === 'inválido' ? 'Hay registros no válidos en ESTUDIANTES.' : 'Ingrese al menos un ID de estudiante.');
      return;
    }
    const groupsValidation = validateIds(txareaMultiGroups);
    if (!groupsValidation.valid) {
      showError(groupsValidation.error === 'inválido' ? 'Hay registros no válidos en GRUPOS.' : 'Ingrese al menos un ID de grupo.');
      return;
    }
    if (studentsValidation.ids.length !== groupsValidation.ids.length) {
      showError(`La cantidad de estudiantes (${studentsValidation.ids.length}) no coincide con la de grupos (${groupsValidation.ids.length}).`);
      return;
    }

    const groupedStudents = {};
    studentsValidation.ids.forEach((studentId, index) => {
      const groupId = groupsValidation.ids[index];
      if (!groupedStudents[groupId]) groupedStudents[groupId] = [];
      groupedStudents[groupId].push(studentId);
    });

    const commands = [];
    const action = isRemove ? 'pull:user:from:group' : 'enroll:user';
    for (const [groupId, students] of Object.entries(groupedStudents)) {
      commands.push(`magik run:prod ${action}["${groupId}","${students.join('","')}"]`);
    }

    setGeneratedCommands(commands);
    showSuccess(`${commands.length} comando${commands.length !== 1 ? 's' : ''} generado${commands.length !== 1 ? 's' : ''}`);
  };

  return (
    <div className="inscripciones-form-container" style={{ marginTop: 0 }}>
      <div className="inscripciones-form">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <label className="input-label" style={{ marginBottom: 0 }}>Carga masiva por pares</label>
          <ClearButton onClick={handleClear} title="Limpiar formulario" />
        </div>
        <hr className="inscripciones-divider" style={{ marginTop: 0, marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="input-wrapper" style={{ flex: 1 }}>
            <label className="input-label" style={{ marginBottom: '8px' }}>Lista de Estudiantes</label>
            <textarea
              className="txareaids"
              value={txareaMultiStudents}
              onChange={(e) => setTxareaMultiStudents(e.target.value)}
              style={{ minHeight: '300px', resize: 'vertical' }}
              placeholder="Ingrese un ID por línea..."
            />
          </div>
          <div className="input-wrapper" style={{ flex: 1 }}>
            <label className="input-label" style={{ marginBottom: '8px' }}>Lista de Grupos</label>
            <textarea
              className="txareaids"
              value={txareaMultiGroups}
              onChange={(e) => setTxareaMultiGroups(e.target.value)}
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
