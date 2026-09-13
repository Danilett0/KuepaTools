import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { UserPlus, UserMinus, CheckCircle2, AlertTriangle, Minus } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { showError, showSuccess } from '../../services/toastService';
import CommandsDisplay from '../CommandsDisplay';

function parseIds(text) {
  if (!text || text.trim() === '') return [];
  return text.split(/\s+/).map((e) => e.trim()).filter((e) => e !== '');
}

function validateIds(text) {
  if (!text || text.trim() === '') return { valid: false, ids: [], error: 'vacío' };
  const ids = parseIds(text);
  if (ids.length === 0) return { valid: false, ids: [], error: 'vacío' };
  for (const id of ids) {
    if (id.length < 24 || id.length > 26 || !/^[a-zA-Z0-9]+$/.test(id)) {
      return { valid: false, ids: [], error: 'inválido' };
    }
  }
  return { valid: true, ids };
}

export default function FormCargaMasiva({ clearToken }) {
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
    const handleKeyDown = (e) => { if (e.key === 'Escape') handleClear(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  // Respond to clearToken from parent tab bar
  useEffect(() => {
    if (clearToken > 0) handleClear();
  }, [clearToken]);

  // ── Live parity indicator ──
  const studentCount = useMemo(() => parseIds(txareaMultiStudents).length, [txareaMultiStudents]);
  const groupCount = useMemo(() => parseIds(txareaMultiGroups).length, [txareaMultiGroups]);
  const parityMatch = studentCount > 0 && groupCount > 0 && studentCount === groupCount;
  const parityEmpty = studentCount === 0 && groupCount === 0;

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

  const parityClass = parityEmpty ? 'empty' : parityMatch ? 'match' : 'mismatch';
  const ParityIcon = parityEmpty ? Minus : parityMatch ? CheckCircle2 : AlertTriangle;
  const parityLabel = parityEmpty
    ? 'Ingresa IDs para verificar paridad'
    : parityMatch
    ? `${studentCount} estudiantes ↔ ${groupCount} grupos — Paridad OK`
    : `${studentCount} estudiantes ≠ ${groupCount} grupos — No coinciden`;

  return (
    <>
      {/* ── Live parity bar ── */}
      <div className={`inscr-parity-bar ${parityClass}`}>
        <ParityIcon size={15} />
        <span>{parityLabel}</span>
      </div>

      {/* ── Dual pane ── */}
      <div className="inscr-dual-pane" style={{ minHeight: '280px' }}>
        <div className="inscr-pane-card">
          <div className="inscr-pane-header">
            <span className="inscr-field-label">Lista de Estudiantes</span>
            {studentCount > 0 && <span className="inscr-count-badge">{studentCount}</span>}
          </div>
          <textarea
            className="inscr-textarea"
            value={txareaMultiStudents}
            onChange={(e) => setTxareaMultiStudents(e.target.value)}
            style={{ flex: 1, minHeight: '220px', resize: 'none' }}
            placeholder="Ingrese un ID por línea..."
          />
        </div>
        <div className="inscr-pane-card">
          <div className="inscr-pane-header">
            <span className="inscr-field-label">Lista de Grupos</span>
            {groupCount > 0 && <span className="inscr-count-badge">{groupCount}</span>}
          </div>
          <textarea
            className="inscr-textarea"
            value={txareaMultiGroups}
            onChange={(e) => setTxareaMultiGroups(e.target.value)}
            style={{ flex: 1, minHeight: '220px', resize: 'none' }}
            placeholder="Ingrese un ID por línea..."
          />
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="inscr-actions-row">
        <button className="inscr-btn-danger" onClick={() => handleAction(true)}>
          <UserMinus size={15} /> Retirar estudiantes
        </button>
        <button className="inscr-btn-primary" onClick={() => handleAction(false)}>
          <UserPlus size={15} /> Inscribir estudiantes
        </button>
      </div>

      <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
    </>
  );
}
