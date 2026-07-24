import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useUsuariosCompletos } from "../hooks/useUsuariosCompletos";
import { useCatalogos } from "../hooks/useCatalogos";
import "../Styles/styles.css";
import CommandsDisplay from "./CommandsDisplay";
import AllianceSwitcher from "./ui/AllianceSwitcher";
import ClearButton from "./ui/ClearButton";

function SegundaPagina() {
  const [alliance, setAlliance] = useLocalStorage("auditar-alliance", "6303ed663138387a1669d82a");
  const [secondStudentId, setSecondStudentId] = useLocalStorage("auditar-secondStudentId", "");
  const [secondProgramId, setSecondProgramId] = useLocalStorage("auditar-secondProgramId", "");
  const [groupId, setGroupId] = useLocalStorage("auditar-groupId", "");
  const [manualProgram, setManualProgram] = useState(false);

  const { data: usuariosCompletos } = useUsuariosCompletos();
  const { programas: programasData } = useCatalogos();

  const [commands, setCommands] = useState([]);

  const programasMap = useMemo(() =>
    programasData ? Object.fromEntries(programasData.map(p => [p._id.$oid, p])) : {}
    , [programasData]);

  const selectedUser = useMemo(() => {
    const studentValue = secondStudentId.trim();
    if (!studentValue) return null;

    return usuariosCompletos.find(u => {
      const uAlliance = u.alliance_id?.$oid || u.alliance_id;
      if (uAlliance !== alliance) return false;

      return String(u.incremental_user_code) === studentValue || (u._id?.$oid || u._id) === studentValue;
    }) || null;
  }, [secondStudentId, alliance, usuariosCompletos]);

  const handleStudentIdBlur = () => {
    const studentValue = secondStudentId.trim();
    if (!studentValue || !selectedUser) return;

    if (String(selectedUser.incremental_user_code) === studentValue) {
      setSecondStudentId(selectedUser._id?.$oid || selectedUser._id);
    }
  };

  useEffect(() => {
    const resolvedStudentId = selectedUser ? (selectedUser._id?.$oid || selectedUser._id) : secondStudentId.trim();
    const student = resolvedStudentId;
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
  }, [secondStudentId, secondProgramId, groupId, selectedUser]);

  const handleClear = useCallback(() => {
    setSecondStudentId("");
    setSecondProgramId("");
    setGroupId("");
    setCommands([]);
    setManualProgram(false);
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
    <div className="inscripciones-container">
      <div className="inscripciones-content">
        <div className="inscripciones-form-container" style={{ marginTop: 0 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <ClearButton onClick={handleClear} />
          </div>

          <div style={{ height: "1px", background: "var(--glass-border)", marginBottom: "24px", width: "100%" }} />

          <div className="inscripciones-form">
            <div className="inscripciones-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="input-wrapper" style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", height: "32px", flexWrap: "wrap" }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>ID Estudiante</label>
                  <AllianceSwitcher
                    value={alliance}
                    mode="long"
                    onChange={(val) => { setAlliance(val); handleClear(); }}
                  />
                </div>
                <input
                  type="text"
                  value={secondStudentId}
                  onChange={(e) => setSecondStudentId(e.target.value)}
                  onBlur={handleStudentIdBlur}
                  className="inscripciones-input"
                  placeholder="Ingrese id"
                  style={{ height: "48px", padding: "0 16px" }}
                />
              </div>

              <div className="input-wrapper">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", height: "32px" }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>ID Programa</label>
                  {selectedUser && selectedUser.programs?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setManualProgram((prev) => !prev)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                        padding: 0,
                        whiteSpace: "nowrap",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {manualProgram ? "← Ver lista" : "Ingreso manual"}
                    </button>
                  )}
                </div>

                {selectedUser && selectedUser.programs?.length > 0 && !manualProgram ? (
                  <select
                    value={selectedUser.programs.some(p => (p.structure?.$oid || p.structure) === secondProgramId) ? secondProgramId : ""}
                    onChange={(e) => setSecondProgramId(e.target.value)}
                    className="inscripciones-input"
                    style={{ appearance: "auto", height: "48px", padding: "0 16px" }}
                  >
                    <option value="" style={{ backgroundColor: "#1c1b1b", color: "#cae1d7", padding: "12px 16px" }}>Selecciona un programa</option>
                    {selectedUser.programs.map((prog, idx) => {
                      const pid = prog.structure?.$oid || prog.structure;
                      if (!pid) return null;
                      const pName = programasMap[pid]?.name || pid;
                      return <option key={`${pid}-${idx}`} value={pid} style={{ backgroundColor: "#1c1b1b", color: "#e5e2e1", padding: "12px 16px", fontSize: "14px" }}>{pName}</option>;
                    })}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={secondProgramId}
                    onChange={(e) => setSecondProgramId(e.target.value)}
                    className="inscripciones-input"
                    placeholder="ID Programa"
                    style={{ height: "48px", padding: "0 16px" }}
                  />
                )}
              </div>

              <div className="input-wrapper">
                <div style={{ display: "flex", alignItems: "center", marginBottom: "8px", height: "32px" }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>ID Grupo (Opcional)</label>
                </div>
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="inscripciones-input"
                  style={{ height: "48px", padding: "0 16px" }}
                />
              </div>
            </div>
          </div>

          <CommandsDisplay commands={commands} onClear={() => setCommands([])} />
        </div>
      </div>
    </div>
  );
}

export default SegundaPagina;
