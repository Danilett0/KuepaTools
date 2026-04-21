import React, { useState } from "react";
import "../Styles/styles.css";
import CommandsDisplay from "./CommandsDisplay";
import { showSuccess, showError } from "../services/toastService";

function SegundaPagina() {
  const [secondStudentId, setSecondStudentId] = useState("");
  const [secondProgramId, setSecondProgramId] = useState("");
  const [grupoAcademicoId, setGrupoAcademicoId] = useState("");

  const [commandsEstudiante, setCommandsEstudiante] = useState([]);
  const [commandsGrupo, setCommandsGrupo] = useState([]);

  const handleAction = () => {
    if (!secondProgramId.trim() || !secondStudentId.trim()) {
      showError("Por favor, complete ambos campos.");
      return;
    }

    const commands = [
      `magik run:prod audit:level["${secondProgramId}","${secondStudentId}"]`,
      `magik run:prod audit:statistics["${secondProgramId}","${secondStudentId}"]`,
      `magik run:prod audit:compacts["${secondProgramId}","${secondStudentId}"]`,
    ];

    setCommandsEstudiante(commands);
    showSuccess("3 comandos generados");
  };

  const auditarGrupo = () => {
    if (!grupoAcademicoId.trim()) {
      showError("Por favor, complete el campo de ID grupo académico.");
      return;
    }

    const command = `magik run:prod audit:group["${grupoAcademicoId}"]`;
    setCommandsGrupo([command]);
    showSuccess("Comando generado");
  };

  return (
    <div className="page-container">
      <div className="content-container">
        <h3 className="title">Auditar estadisticas estudiante</h3>
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
          <button onClick={handleAction} className="button">▶</button>
          <button
            onClick={() => { setSecondStudentId(""); setSecondProgramId(""); setCommandsEstudiante([]); }}
            className="btn btn-warning btn-icon"
          >
            🧹
          </button>
        </div>
        <CommandsDisplay commands={commandsEstudiante} onClear={() => setCommandsEstudiante([])} />
      </div>

      <div className="content-container">
        <h3 className="title">Auditar grupo académico</h3>
        <div className="input-group">
          <input
            type="text"
            placeholder="ID grupo académico"
            value={grupoAcademicoId}
            onChange={(e) => setGrupoAcademicoId(e.target.value)}
            className="input"
          />
          <button onClick={auditarGrupo} className="button">▶</button>
          <button
            onClick={() => { setGrupoAcademicoId(""); setCommandsGrupo([]); }}
            className="btn btn-warning btn-icon"
          >
            🧹
          </button>
        </div>
        <CommandsDisplay commands={commandsGrupo} onClear={() => setCommandsGrupo([])} />
      </div>
    </div>
  );
}

export default SegundaPagina;
