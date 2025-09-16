import React, { useState } from "react";
import "../Styles/styles.css";
import { sendCommands } from "../services/apiService";
import { showSuccess, showError } from "../services/toastService";

function SegundaPagina() {
  const [secondStudentId, setSecondStudentId] = useState("");
  const [secondProgramId, setSecondProgramId] = useState("");

  const handleAction = async () => {
    if (!secondProgramId.trim() || !secondStudentId.trim()) {
      showError("Por favor, complete ambos campos.");
      return;
    }

    const commands = [
      `bemo run:prod audit:level["${secondProgramId}","${secondStudentId}"]`,
      `bemo run:prod audit:statistics["${secondProgramId}","${secondStudentId}"]`,
      `bemo run:prod audit:compacts["${secondProgramId}","${secondStudentId}"]`,
    ];

    const result = await sendCommands(commands);

    if (result.success) {
      showSuccess("Comandos enviados exitosamente");
    } else {
      showError("Error al enviar los comandos: " + result.error);
    }
  };

  return (
    <div className="page-container">
      <div className="content-container">
        <h3 className="title">
          Genere los comandos para auditar estadisticas de estudiante de Nueva
          America
        </h3>
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
      </div>
    </div>
  );
}

export default SegundaPagina;
