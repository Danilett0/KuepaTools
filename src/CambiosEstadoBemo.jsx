import React, { useState } from 'react';
import './styles.css';

function CambiosEstadoBemo() {
  const [studentId, setStudentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [generatedCommand, setGeneratedCommand] = useState('');

  const handleGenerateCommand = () => {
    const trimmedStudentId = studentId.trim();
    const trimmedProgramId = programId.trim();

    if (!trimmedStudentId || !trimmedProgramId || !selectedState.trim()) {
      setGeneratedCommand('Por favor, complete todos los campos correctamente.');
      return;
    }
    const command = `bemo run:prod status:change["${trimmedProgramId}","${selectedState}","${trimmedStudentId}"]`;
    setGeneratedCommand(command);
  };

  return (
    <div style={{
      backgroundColor: '#042344',
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Cambios de estado</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            placeholder="ID Estudiante"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="ID Programa"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="input"
          />
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="input"
          >
            <option value="">Seleccione un estado</option>
            <option value="640a563e1cbb9f11665ef129">Al día</option>
            <option value="632b97df8f3bba0fc2708b78">Nuevo</option>
            <option value="6303ed683138387a1669d8a3">Regular</option>
            <option value="650dfeba1bc4f0480d1fa128">Matricula no exitosa</option>
          </select>
          <button onClick={handleGenerateCommand} className="button">
            ▶
          </button>
        </div>
        {generatedCommand && (
          <div className="commands">
            <strong>Comando generado:</strong>
            <p style={{ margin: '10px 0', whiteSpace: 'pre-line' }}>{generatedCommand}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CambiosEstadoBemo;
