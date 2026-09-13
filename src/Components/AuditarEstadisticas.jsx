import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useUsuariosCompletos } from "../hooks/useUsuariosCompletos";
import { useCatalogos } from "../hooks/useCatalogos";
import "../Styles/styles.css";
import { BarChart2 } from "lucide-react";
import CommandsDisplay from "./CommandsDisplay";
import AllianceSwitcher from "./ui/AllianceSwitcher";
import IncAutocomplete from "./ui/IncAutocomplete";
import { useAppStore } from "../store/useAppStore";
import { ALLIANCE_IDS } from "../utils/constants";

function AuditarEstadisticas() {
  const { findUser } = useUsuariosCompletos();
  const [alliance, setAlliance] = useLocalStorage("auditar-alliance", ALLIANCE_IDS.na);
  const [secondStudentId, setSecondStudentId] = useLocalStorage("auditar-secondStudentId", "");
  const [secondProgramId, setSecondProgramId] = useLocalStorage("auditar-secondProgramId", "");
  const [groupId, setGroupId] = useLocalStorage("auditar-groupId", "");
  const [manualProgram, setManualProgram] = useState(false);

  const { programas: programasData } = useCatalogos();
  const [commands, setCommands] = useState([]);
  
  const aiPrefilledData = useAppStore(state => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore(state => state.setAiPrefilledData);

  const programasMap = useMemo(() =>
    programasData ? Object.fromEntries(programasData.map(p => [p._id.$oid, p])) : {}
    , [programasData]);

  // Resolved user — fetched on blur, not preloaded
  const [selectedUser, setSelectedUser] = useState(null);

  const handleStudentIdBlur = useCallback(async () => {
    const studentValue = secondStudentId.trim();
    if (!studentValue) { setSelectedUser(null); return; }

    const user = await findUser(studentValue, alliance);
    setSelectedUser(user);

    // Auto-replace INC with long ID
    if (user && String(user.incremental_user_code) === studentValue) {
      setSecondStudentId(user._id?.$oid || user._id);
    }
  }, [secondStudentId, alliance, setSecondStudentId]);

  // ── AI Prefill ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.intent === 'AUDIT_STATS') {
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 0) {
        setSecondStudentId(aiPrefilledData.ids[0]);
      }
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 1) {
        setSecondProgramId(aiPrefilledData.ids[1]);
      }
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 2) {
        setGroupId(aiPrefilledData.ids[2]);
      }
      setAiPrefilledData(null);
    }
  }, [aiPrefilledData, setSecondStudentId, setSecondProgramId, setGroupId, setAiPrefilledData]);

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
    setSelectedUser(null);
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

  const userPrograms = selectedUser?.programs || [];
  const hasUserPrograms = userPrograms.length > 0 && !manualProgram;

  return (
    <div
      className="inscripciones-main animate-slide-down"
      style={{ padding: "18px 24px", maxWidth: "1100px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}
    >
      {/* ── Header ── */}
      <div className="inscripciones-header-row">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="inscripciones-mode-badge">
            <BarChart2 size={17} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "18px", fontWeight: 800, color: "var(--on-surface)", margin: 0, lineHeight: 1.2 }}>
              Auditar Estadísticas
            </h1>
            <span style={{ fontSize: "11.5px", color: "var(--on-surface-variant)" }}>
              Auditoría de nivel, estadísticas, materias y compactos de un estudiante
            </span>
          </div>
        </div>
      </div>

      {/* ── Barra de Pestañas / Acciones ── */}
      <div className="inscripciones-tabs">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 14px" }}>
          <BarChart2 size={14} style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", fontFamily: "'Nunito', sans-serif" }}>
            Auditoría Individual
          </span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          <AllianceSwitcher
            value={alliance}
            mode="long"
            onChange={(val) => { setAlliance(val); handleClear(); }}
          />
          <button
            type="button"
            onClick={handleClear}
            title="Limpiar (Esc)"
            style={{
              background: "transparent",
              border: "1px solid var(--glass-border)",
              color: "var(--on-surface-variant)",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--on-surface)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--on-surface-variant)"; e.currentTarget.style.background = "transparent"; }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* ── Panel Principal ── */}
      <div className="inscripciones-panel">
        <div className="inscr-grid-3">
          {/* Col 1: Usuario */}
          <div className="inscr-field-block">
            <label className="inscr-field-label">Usuario</label>
            <IncAutocomplete
              alianzaId={alliance}
              value={secondStudentId}
              onChange={setSecondStudentId}
              onBlur={handleStudentIdBlur}
              onSelect={(user) => {
                if (user) {
                  setSecondStudentId(user._id?.$oid || user._id);
                  setSelectedUser(user);
                } else {
                  setSelectedUser(null);
                }
                setSecondProgramId("");
              }}
              placeholder="INC o ID del estudiante"
              inputStyle={{ height: "42px", padding: "0 40px 0 14px", boxSizing: "border-box" }}
            />
          </div>

          {/* Col 2: Programa */}
          <div className="inscr-field-block">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label className="inscr-field-label">Programa</label>
              {userPrograms.length > 0 && (
                <button
                  type="button"
                  onClick={() => setManualProgram((prev) => !prev)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {manualProgram ? "← Ver lista" : "Ingreso manual"}
                </button>
              )}
            </div>

            {hasUserPrograms ? (
              <select
                value={userPrograms.some(p => (p.structure?.$oid || p.structure) === secondProgramId) ? secondProgramId : ""}
                onChange={(e) => setSecondProgramId(e.target.value)}
                className="inscr-select"
              >
                <option value="">Selecciona un programa</option>
                {userPrograms.map((prog, idx) => {
                  const pid = prog.structure?.$oid || prog.structure;
                  if (!pid) return null;
                  const pName = programasMap[pid]?.name || pid;
                  return <option key={`${pid}-${idx}`} value={pid}>{pName}</option>;
                })}
              </select>
            ) : (
              <input
                type="text"
                value={secondProgramId}
                onChange={(e) => setSecondProgramId(e.target.value)}
                className="inscr-input"
                placeholder="ID del programa"
              />
            )}
          </div>

          {/* Col 3: Grupo (Opcional) */}
          <div className="inscr-field-block">
            <label className="inscr-field-label">Grupo (Opcional)</label>
            <input
              type="text"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="inscr-input"
              placeholder="ID del grupo académico..."
            />
          </div>
        </div>

        <CommandsDisplay commands={commands} onClear={() => setCommands([])} />
      </div>
    </div>
  );
}

export default AuditarEstadisticas;
