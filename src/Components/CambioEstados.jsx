import React, { useState } from "react";
import "../Styles/styles.css";
import CommandsDisplay from "./CommandsDisplay";
import { showSuccess, showError } from "../services/toastService";

function CambiosEstadoBemo() {
  const [studentId, setStudentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [generatedCommands, setGeneratedCommands] = useState([]);

  const handleGenerateCommand = () => {
    const trimmedStudentId = studentId.trim();
    const trimmedProgramId = programId.trim();

    if (!trimmedStudentId || !trimmedProgramId || !selectedState.trim()) {
      showError("Por favor, complete todos los campos correctamente.");
      return;
    }

    const command = `magik run:prod status:change["${trimmedProgramId}","${selectedState}","${trimmedStudentId}"]`;
    setGeneratedCommands([command]);
    showSuccess("Comando generado");
  };

  const handleClear = () => {
    setStudentId("");
    setProgramId("");
    setSelectedState("");
    setGeneratedCommands([]);
  };

  return (
    <div className="content-container">
      <h3 style={{ textAlign: "center", margin: 0 }}>
        Genere un cambio de estado con Bemo para estudiante de Nueva America
      </h3>
      <div className="input-group">
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
          <option value="648b908a55ba6c0c84c5013f">Aplazado</option>
          <option value="639b2fe70605300cc60ccf5d">Regular en verificacion</option>
          <option value="650dfeba1bc4f0480d1fa128">Matricula no exitosa</option>
          <option value="650dfeb91bc4f0480d1fa118">Requisitos Académicos</option>
        </select>
        <button onClick={handleGenerateCommand} className="button">▶</button>
        <button onClick={handleClear} className="btn btn-warning btn-icon">🧹</button>
      </div>

      <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
    </div>
  );
}

export default CambiosEstadoBemo;
