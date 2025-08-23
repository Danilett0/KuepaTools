import React, { useState } from 'react';
import '../Styles/styles.css';

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
    <div className="page-container">
      <div className="content-container">
        <h3 className="title">Genere los comandos para auditar estadisticas de estudiante de Nueva America</h3>
        <div className="input-group">
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
            <p className="command-text">{generatedCommands.join('\n')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SegundaPagina;
