import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { UserPlus, UserMinus, Shuffle } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { showError, showSuccess } from '../../services/toastService';
import CommandsDisplay from '../CommandsDisplay';

function parseIds(text) {
  if (!text || text.trim() === '') return [];
  return Array.from(new Set(
    text.split(/\s+/).map((e) => e.trim()).filter((e) => e !== '')
  ));
}

function validateIds(text) {
  if (!text || text.trim() === '') return { valid: false, ids: [], error: 'vacío' };
  const rawIds = text.split(/\s+/).map((e) => e.trim()).filter((e) => e !== '');
  if (rawIds.length === 0) return { valid: false, ids: [], error: 'vacío' };
  const ids = Array.from(new Set(rawIds));
  for (const id of ids) {
    if (id.length < 24 || id.length > 26 || !/^[a-zA-Z0-9]+$/.test(id)) {
      return { valid: false, ids: [], error: 'inválido' };
    }
  }
  return { valid: true, ids };
}

export default function FormCargaCombinada({ clearToken }) {
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
    const handleKeyDown = (e) => { if (e.key === 'Escape') handleClear(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  // Respond to clearToken from parent tab bar
  useEffect(() => {
    if (clearToken > 0) handleClear();
  }, [clearToken]);

  // ── Live producto cartesiano preview ──
  const studentCount = useMemo(() => parseIds(txareaEspecStudents).length, [txareaEspecStudents]);
  const groupCount = useMemo(() => parseIds(txareaEspecGroups).length, [txareaEspecGroups]);
  const productCount = studentCount * groupCount;

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
    const commands = groupsValidation.ids.map((groupId) => {
      const action = isRemove ? 'pull:user:from:group' : 'enroll:user';
      return `magik run:prod ${action}["${groupId}","${studentsJoined}"]`;
    });

    setGeneratedCommands(commands);
    showSuccess(`${commands.length} comando${commands.length !== 1 ? 's' : ''} generado${commands.length !== 1 ? 's' : ''}`);
  };

  return (
    <>
      {/* ── Live Producto Cartesiano Bar ── */}
      <div className={`inscr-parity-bar ${productCount > 0 ? 'inscr-product-bar' : 'empty'}`}>
        <Shuffle size={15} />
        {productCount > 0
          ? <span>{studentCount} estudiantes × {groupCount} grupos = <strong>{productCount} inscripciones</strong></span>
          : <span>Ingresa IDs para calcular el producto cartesiano</span>
        }
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
            value={txareaEspecStudents}
            onChange={(e) => setTxareaEspecStudents(e.target.value)}
            style={{ flex: 1, minHeight: '220px', resize: 'none' }}
            placeholder="Ingrese un ID por línea (se eliminan duplicados)..."
          />
        </div>
        <div className="inscr-pane-card">
          <div className="inscr-pane-header">
            <span className="inscr-field-label">Lista de Grupos</span>
            {groupCount > 0 && <span className="inscr-count-badge">{groupCount}</span>}
          </div>
          <textarea
            className="inscr-textarea"
            value={txareaEspecGroups}
            onChange={(e) => setTxareaEspecGroups(e.target.value)}
            style={{ flex: 1, minHeight: '220px', resize: 'none' }}
            placeholder="Ingrese un ID por línea (se eliminan duplicados)..."
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
