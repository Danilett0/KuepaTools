import React, { useState } from "react";
import { sendCommands } from "../services/apiService";
import { showSuccess, showError } from "../services/toastService";

function EnvioComandos() {
  const [commands, setCommands] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!commands.trim()) {
      showError("Por favor ingrese al menos un comando.");
      return;
    }

    // Split by newlines and filter empty lines
    const commandList = commands
      .split(/\n/)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    if (commandList.length === 0) {
      showError("No hay comandos válidos para enviar.");
      return;
    }

    setLoading(true);
    try {
      const result = await sendCommands(commandList);
      if (result.success) {
       
        showSuccess(`Se enviaron ${commandList.length} comandos exitosamente.`);
        setCommands("");
      } else {
        showError("Error al enviar los comandos: " + result.error);
      }
    } catch (error) {
      console.error("Error sending commands:", error);
      showError("Error inesperado al enviar comandos.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCommands("");
  };

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-content">
        <div className="inscripciones-form-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          <h5 className="inscripciones-title">
            Envio Comandos Libre
          </h5>
          <div className="inscripciones-form">
            <p style={{ marginBottom: '10px', color: '#666' }}>
              Ingrese los comandos que desea ejecutar, uno por línea.
            </p>
            <textarea
              className="txareaids"
              value={commands}
              placeholder="magik run:prod ..."
              onChange={(e) => setCommands(e.target.value)}
              style={{ minHeight: '300px', width: '100%', padding: '10px' }}
            />
          </div>
          <div className="inscripciones-buttons">
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={loading}
              style={{
                transition: "opacity 0.3s ease",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Enviando...
                </>
              ) : (
                "Enviar Comandos"
              )}
            </button>
            <button
              className="btn btn-warning"
              onClick={handleClear}
              disabled={loading}
              style={{ flex: "none" }}
            >
              🧹
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnvioComandos;
