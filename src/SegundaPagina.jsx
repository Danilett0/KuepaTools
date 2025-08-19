import React, { useState } from 'react';
import './styles.css';

function SegundaPagina() {
  const [secondStudentId, setSecondStudentId] = useState('');
  const [secondProgramId, setSecondProgramId] = useState('');
  const [generatedCommands, setGeneratedCommands] = useState([]);

  const handleAction = () => {
    if (!secondProgramId.trim() || !secondStudentId.trim()) {
      alert('Por favor, complete ambos campos.');
      return;
    }

    const commands = [
      `bemo run:prod audit:level["${secondProgramId}","${secondStudentId}"]`,
      `bemo run:prod audit:statistics["${secondProgramId}","${secondStudentId}"]`,
      `bemo run:prod audit:compacts["${secondProgramId}","${secondStudentId}"]`
    ];

    setGeneratedCommands(commands);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            placeholder="ID Programa"
            value={secondProgramId}
            onChange={(e) => setSecondProgramId(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="ID Estudiante"
            value={secondStudentId}
            onChange={(e) => setSecondStudentId(e.target.value)}
            className="input"
          />
          <button onClick={handleAction} className="button">
            ▶
          </button>
        </div>
        {generatedCommands.length > 0 && (
          <div className="commands">
            <strong>Comandos generados:</strong>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{generatedCommands.join('\n')}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default SegundaPagina;
