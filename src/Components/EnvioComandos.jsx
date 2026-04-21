import React, { useState } from "react";
import CommandsDisplay from "./CommandsDisplay";
import { showError, showSuccess } from "../services/toastService";

function EnvioComandos() {
  const [commands, setCommands] = useState("");
  const [generatedCommands, setGeneratedCommands] = useState([]);

  const handleGenerate = () => {
    if (!commands.trim()) {
      showError("Por favor ingrese al menos un comando.");
      return;
    }

    const commandList = commands
      .split(/\n/)
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0);

    if (commandList.length === 0) {
      showError("No hay comandos válidos.");
      return;
    }

    setGeneratedCommands(commandList);
    showSuccess(`${commandList.length} comando${commandList.length !== 1 ? "s" : ""} listo${commandList.length !== 1 ? "s" : ""} para copiar`);
  };

  const handleClear = () => {
    setCommands("");
    setGeneratedCommands([]);
  };

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-content">
        <div className="inscripciones-form-container" style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
          <h5 className="inscripciones-title">Envio Comandos Libre</h5>
          <div className="inscripciones-form">
            <p style={{ marginBottom: "10px", color: "#666" }}>
              Ingrese los comandos, uno por línea. Luego presione "Generar" para visualizarlos y copiarlos.
            </p>
            <textarea
              className="txareaids"
              value={commands}
              placeholder="magik run:prod ..."
              onChange={(e) => setCommands(e.target.value)}
              style={{ minHeight: "300px", width: "100%", padding: "10px" }}
            />
          </div>
          <div className="inscripciones-buttons">
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              style={{ transition: "opacity 0.3s ease" }}
            >
              Generar comandos
            </button>
            <button
              className="btn btn-warning"
              onClick={handleClear}
              style={{ flex: "none" }}
            >
              🧹
            </button>
          </div>

          <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
        </div>
      </div>
    </div>
  );
}

export default EnvioComandos;
