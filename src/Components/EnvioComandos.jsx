import React, { useState } from "react";
import CommandsDisplay from "./CommandsDisplay";
import { showError, showSuccess } from "../services/toastService";
import { Play, Eraser } from "lucide-react";

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
          <h5 className="inscripciones-title" style={{ fontSize: "20px", color: "var(--primary)", fontWeight: "800" }}>Envio Comandos Libre</h5>
          <div className="inscripciones-form">
            <p style={{ marginBottom: "16px", color: "var(--on-surface-variant)" }}>
              Ingrese los comandos, uno por línea. Luego presione "Generar" para visualizarlos y copiarlos.
            </p>
            <textarea
              className="txareaids"
              value={commands}
              placeholder="magik run:prod ..."
              onChange={(e) => setCommands(e.target.value)}
              style={{ minHeight: "300px", width: "100%", padding: "16px" }}
            />
          </div>
          <div className="inscripciones-buttons">
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              style={{ transition: "all 0.3s ease", flex: 1 }}
            >
              <Play size={20} /> Generar comandos
            </button>
            <button
              className="btn btn-warning btn-icon"
              onClick={handleClear}
              style={{ flex: "none" }}
              title="Limpiar"
            >
              <Eraser size={20} />
            </button>
          </div>

          <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
        </div>
      </div>
    </div>
  );
}

export default EnvioComandos;
