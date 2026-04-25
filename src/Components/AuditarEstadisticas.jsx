import React, { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import "../Styles/styles.css";
import CommandsDisplay from "./CommandsDisplay";

function SegundaPagina() {
  const [secondStudentId, setSecondStudentId] = useLocalStorage("auditar-secondStudentId", "");
  const [secondProgramId, setSecondProgramId] = useLocalStorage("auditar-secondProgramId", "");

  const [commandsEstudiante, setCommandsEstudiante] = useState([]);

  useEffect(() => {
    const student = secondStudentId.trim();
    const program = secondProgramId.trim();

    if (student && program) {
      const commands = [
        `magik run:prod audit:level["${program}","${student}"]`,
        `magik run:prod audit:statistics["${program}","${student}"]`,
        `magik run:prod audit:compacts["${program}","${student}"]`,
      ];
      setCommandsEstudiante(commands);
    } else {
      setCommandsEstudiante([]);
    }
  }, [secondStudentId, secondProgramId]);

  const handleClear = useCallback(() => {
    setSecondStudentId("");
    setSecondProgramId("");
    setCommandsEstudiante([]);
  }, [setSecondStudentId, setSecondProgramId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClear]);

  return (
    <div className="inscripciones-container" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Estudiante */}
      <div className="inscripciones-content">
        <h3 className="inscripciones-title" style={{ fontSize: "20px", color: "var(--primary)", fontWeight: "800" }}>
          Auditar estadísticas de estudiante
        </h3>
        <div className="inscripciones-form">
          <p style={{ marginBottom: "8px", color: "var(--on-surface-variant)" }}>
            Ingrese los IDs. Los comandos se generarán automáticamente.
          </p>
          <div className="inscripciones-grid">
            <div className="input-wrapper">
              <label className="input-label">ID Estudiante</label>
              <input
                type="text"
                value={secondStudentId}
                onChange={(e) => setSecondStudentId(e.target.value)}
                className="inscripciones-input"
              />
            </div>
            <div className="input-wrapper">
              <label className="input-label">ID Programa</label>
              <input
                type="text"
                value={secondProgramId}
                onChange={(e) => setSecondProgramId(e.target.value)}
                className="inscripciones-input"
              />
            </div>
          </div>
        </div>
        
        {/* Buttons removed entirely for automatic generation */}

        <CommandsDisplay commands={commandsEstudiante} onClear={() => setCommandsEstudiante([])} />
      </div>
    </div>
  );
}

export default SegundaPagina;
