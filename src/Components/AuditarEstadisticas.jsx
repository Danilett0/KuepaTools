import React, { useState } from "react";
import "../Styles/styles.css";
import { sendCommands } from "../services/apiService";
import { showSuccess, showError } from "../services/toastService";

function SegundaPagina() {
  const [secondStudentId, setSecondStudentId] = useState("");
  const [secondProgramId, setSecondProgramId] = useState("");

  const [grupoAcademicoId, setGrupoAcademicoId] = useState("");

  const handleAction = async () => {
    if (!secondProgramId.trim() || !secondStudentId.trim()) {
      showError("Por favor, complete ambos campos.");
      return;
    }

    const commands = [
      `magik run:prod audit:level["${secondProgramId}","${secondStudentId}"]`,
      `magik run:prod audit:statistics["${secondProgramId}","${secondStudentId}"]`,
      `magik run:prod audit:compacts["${secondProgramId}","${secondStudentId}"]`,
    ];

    // Función auxiliar para esperar X milisegundos
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        console.log(`Enviando comando: ${cmd}`);

        const result = await sendCommands([cmd]);

        if (!result.success) {
          showError("Error al enviar el comando: " + result.error);
          return;
        }

        if (i < commands.length - 1) {
          await delay(10000);
        }
      }

      // Si todos fueron exitosos
      showSuccess("Comandos enviados exitosamente");
    } catch (error) {
      showError("Error inesperado: " + error.message);
    }
  };

  const auditarGrupo = async () => {
    if (!grupoAcademicoId.trim()) {
      showError("Por favor, complete el campo de ID grupo académico.");
      return;
    }

    const command = `magik run:prod audit:group["${grupoAcademicoId}"]`;

    try {
      const result = await sendCommands([command]);

      if (result.success) {
        showSuccess("Comando enviado exitosamente");
      } else {
        showError("Error al enviar el comando: " + result.error);
      }
    } catch (error) {
      showError("Error inesperado: " + error.message);
    }
  };

  return (
    <div className="page-container" style={{ flexDirection: "column" }}>
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
          <button onClick={handleAction} className="button">
            ▶
          </button>
        </div>
      </div>
      <br />{" "}
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
          <button onClick={auditarGrupo} className="button">
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

export default SegundaPagina;
