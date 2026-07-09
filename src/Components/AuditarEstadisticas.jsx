import React, { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import "../Styles/styles.css";
import CommandsDisplay from "./CommandsDisplay";

function SegundaPagina() {
  const [secondStudentId, setSecondStudentId] = useLocalStorage("auditar-secondStudentId", "");
  const [secondProgramId, setSecondProgramId] = useLocalStorage("auditar-secondProgramId", "");
  const [groupId, setGroupId] = useLocalStorage("auditar-groupId", "");

  const [commands, setCommands] = useState([]);

  useEffect(() => {
    const student = secondStudentId.trim();
    const program = secondProgramId.trim();
    const group = groupId.trim();

    if (student && program) {
      const newCommands = [
        `magik run:prod audit:level["${program}","${student}"]`,
        `magik run:prod audit:statistics["${program}","${student}"]`,
      ];
      
      if (group) {
        newCommands.push(`magik run:prod audit:subject ["${group}", "${student}"]`);
      }

      newCommands.push(`magik run:prod audit:compacts["${program}","${student}"]`);
      
      setCommands(newCommands);
    } else {
      setCommands([]);
    }
  }, [secondStudentId, secondProgramId, groupId]);

  const handleClear = useCallback(() => {
    setSecondStudentId("");
    setSecondProgramId("");
    setGroupId("");
    setCommands([]);
  }, [setSecondStudentId, setSecondProgramId, setGroupId]);

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
      <div className="inscripciones-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="inscripciones-title" style={{ fontSize: "20px", color: "var(--primary)", fontWeight: "800", margin: 0 }}>
            Auditar estadísticas de estudiante
          </h3>
          <button
            onClick={handleClear}
            className="btn-clear"
            title="Limpiar campos"
          >
            Limpiar
          </button>
        </div>
        <div className="inscripciones-form">
          <div className="inscripciones-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
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
            <div className="input-wrapper">
              <label className="input-label">ID Grupo (Opcional)</label>
              <input
                type="text"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="inscripciones-input"
              />
            </div>
          </div>
        </div>

        <CommandsDisplay commands={commands} onClear={() => setCommands([])} />
      </div>
    </div>
  );
}

export default SegundaPagina;
