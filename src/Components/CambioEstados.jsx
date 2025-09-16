import React, { useState } from "react";
import "../Styles/styles.css";
import { sendCommands } from "../services/apiService";
import { showSuccess, showError } from "../services/toastService";

function CambiosEstadoBemo() {
  const [studentId, setStudentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const handleGenerateCommand = async () => {
    const trimmedStudentId = studentId.trim();
    const trimmedProgramId = programId.trim();

    if (!trimmedStudentId || !trimmedProgramId || !selectedState.trim()) {
      showError("Por favor, complete todos los campos correctamente.");
      return;
    }

    const command = `bemo run:prod status:change["${trimmedProgramId}","${selectedState}","${trimmedStudentId}"]`;

    const result = await sendCommands([command]);

    if (result.success) {
      showSuccess("Comando enviado exitosamente");
      // Limpiar los campos después de un envío exitoso
      setStudentId("");
      setProgramId("");
      setSelectedState("");
    } else {
      showError("Error al enviar el comando: " + result.error);
    }
  };

  return (
    <div className="content-container">
      <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
        Genere un cambio de estado con Bemo para estudiante de Nueva America
      </h3>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
    </div>
  );
}

export default CambiosEstadoBemo;
