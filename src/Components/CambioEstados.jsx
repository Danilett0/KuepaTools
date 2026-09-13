import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import "../Styles/styles.css";
import CommandsDisplay from "./CommandsDisplay";
import { ChevronDown, RefreshCw, Search, User, Users, CheckCircle2, AlertTriangle, Minus } from "lucide-react";
import AllianceSwitcher from "./ui/AllianceSwitcher";
import { findUser, findUsersByIncList } from "../services/usuariosService";
import { useCatalogos } from "../hooks/useCatalogos";
import IncAutocomplete from "./ui/IncAutocomplete";
import { ALLIANCE_IDS } from "../utils/constants";
import { useAppStore } from "../store/useAppStore";

// ─── Constantes ──────────────────────────────────────────────────────────────

const alianzaOptions = [
  { value: "nueva_america", label: "Nueva América" },
  { value: "kuepa", label: "Kuepa" },
];

const ALLIANCE_MONGO_MAP = {
  na: ALLIANCE_IDS.na,
  kuepa: ALLIANCE_IDS.kuepa,
};

// ─── Dropdown personalizado reutilizable ─────────────────────────────────────

function CustomDropdown({ value, options, onChange, disabled, placeholder }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => { if (!open) setSearchTerm(""); }, [open]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        className="inscr-input"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "42px",
          cursor: disabled ? "not-allowed" : "pointer",
          color: selected ? "var(--on-surface)" : "var(--on-surface-variant)",
          borderColor: open ? "var(--primary)" : "var(--glass-border)",
          boxShadow: open ? "0 0 0 2px var(--gold-glow)" : "none",
          userSelect: "none",
          opacity: disabled ? 0.4 : 1,
          transition: "all 0.2s ease",
        }}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
      >
        <span style={{ fontSize: "13px" }}>{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={16}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}
        />
      </div>

      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            background: "#161616",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            boxShadow: "0 14px 36px rgba(0, 0, 0, 0.7), 0 0 16px rgba(0, 0, 0, 0.4)",
            zIndex: 9999,
            overflow: "hidden",
            maxHeight: "260px",
            display: "flex",
            flexDirection: "column",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div style={{ padding: "8px", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={14} color="var(--on-surface-variant)" style={{ marginLeft: "6px", flexShrink: 0 }} />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--on-surface)", fontSize: "13px", fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "thin", scrollbarColor: "var(--primary) rgba(255, 255, 255, 0.05)" }}>
            {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  background: value === opt.value ? "rgba(18,163,131,0.18)" : "transparent",
                  color: value === opt.value ? "var(--primary)" : "var(--on-surface)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "13px",
                  transition: "background 0.15s ease",
                  fontWeight: value === opt.value ? 700 : 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => { if (value !== opt.value) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { if (value !== opt.value) e.currentTarget.style.background = "transparent"; }}
              >
                <span>{opt.label}</span>
                {value === opt.value && <CheckCircle2 size={14} color="var(--primary)" style={{ flexShrink: 0 }} />}
              </div>
            )) : (
              <div style={{ padding: "13px 16px", color: "var(--on-surface-variant)", fontSize: "13px", textAlign: "center" }}>
                Sin resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseIds(text) {
  if (!text || !text.trim()) return [];
  return text.split(/\s+/).map((e) => e.trim()).filter(Boolean);
}

// ─── Componente principal ────────────────────────────────────────────────────

function CambiosEstadoBemo() {
  const [mode, setMode] = useLocalStorage("cambioEstados-mode", "varios");

  // Modo "varios"
  const [studentIdsText, setStudentIdsText] = useLocalStorage("cambioEstados-studentIdsText", "");
  const [programIdsText, setProgramIdsText] = useLocalStorage("cambioEstados-programIdsText", "");
  const [selectedAlianza, setSelectedAlianza] = useLocalStorage("cambioEstados-selectedAlianza", "");
  const [selectedState, setSelectedState] = useLocalStorage("cambioEstados-selectedState", "");

  // Modo "uno"
  const [singleStudentId, setSingleStudentId] = useLocalStorage("cambioEstados-singleStudentId", "");
  const [singleProgramId, setSingleProgramId] = useLocalStorage("cambioEstados-singleProgramId", "");
  const [singleAlliance, setSingleAlliance] = useLocalStorage("cambioEstados-singleAlliance", "na");
  const [singleState, setSingleState] = useLocalStorage("cambioEstados-singleState", "");
  const [singleManualProgram, setSingleManualProgram] = useState(false);

  const [generatedCommands, setGeneratedCommands] = useState([]);

  // AI Prefill
  const aiPrefilledData = useAppStore((state) => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore((state) => state.setAiPrefilledData);

  const singleAlianzaKey = singleAlliance === "na" ? "nueva_america" : "kuepa";

  const { programas: programasData, estados: estadosData } = useCatalogos();

  const stateOptionsByAlianza = useMemo(() => {
    if (!estadosData) return { nueva_america: [], kuepa: [] };
    const sortByLabel = (a, b) => a.label.localeCompare(b.label);
    const naStates = estadosData.filter((e) => e.alliance_id?.$oid === ALLIANCE_MONGO_MAP.na).map((e) => ({ value: e._id.$oid, label: e.name })).sort(sortByLabel);
    const kuepaStates = estadosData.filter((e) => e.alliance_id?.$oid === ALLIANCE_MONGO_MAP.kuepa).map((e) => ({ value: e._id.$oid, label: e.name })).sort(sortByLabel);
    return { nueva_america: naStates, kuepa: kuepaStates };
  }, [estadosData]);

  const singleStateOptions = stateOptionsByAlianza[singleAlianzaKey] || [];

  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.intent === "CHANGE_STATE") {
      setMode("uno");
      if (aiPrefilledData.ids?.length > 0) setSingleStudentId(aiPrefilledData.ids[0]);
      if (aiPrefilledData.suggestedState) {
        const matched = singleStateOptions.find((o) => o.label.toLowerCase() === aiPrefilledData.suggestedState.toLowerCase());
        if (matched) setSingleState(matched.value);
      }
      setAiPrefilledData(null);
    }
  }, [aiPrefilledData, setMode, setSingleStudentId, singleStateOptions, setSingleState, setAiPrefilledData]);

  const programasMap = useMemo(() =>
    programasData ? Object.fromEntries(programasData.map((p) => [p._id.$oid, p])) : {}
    , [programasData]);

  const [singleSelectedUser, setSingleSelectedUser] = useState(null);

  const handleSingleStudentBlur = useCallback(async () => {
    const input = singleStudentId.trim();
    if (!input) { setSingleSelectedUser(null); return; }
    const allianceId = ALLIANCE_MONGO_MAP[singleAlliance];
    const user = await findUser(input, allianceId);
    setSingleSelectedUser(user);
    if (user && String(user.incremental_user_code) === input) {
      setSingleStudentId(user._id?.$oid || user._id);
    }
  }, [singleStudentId, singleAlliance, setSingleStudentId]);

  const handleMultiStudentBlur = useCallback(async () => {
    if (!studentIdsText.trim() || !selectedAlianza) return;
    const allianceKey = selectedAlianza === "nueva_america" ? "na" : "kuepa";
    const allianceId = ALLIANCE_MONGO_MAP[allianceKey];
    const lines = studentIdsText.split("\n");
    const incTokens = [];
    lines.forEach((line) => {
      line.trim().split(/\s+/).forEach((part) => {
        if (/^\d+$/.test(part) && part.length < 24) incTokens.push(Number(part));
      });
    });
    if (!incTokens.length) return;
    try {
      const found = await findUsersByIncList(incTokens, allianceId);
      const byInc = Object.fromEntries(found.map((u) => [u.incremental_user_code, u]));
      let replacedCount = 0;
      const newLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        const parts = trimmed.split(/\s+/);
        const newParts = parts.map((part) => {
          if (/^\d+$/.test(part) && part.length < 24) {
            const user = byInc[Number(part)];
            if (user) { replacedCount++; return user._id?.$oid || user._id; }
          }
          return part;
        });
        return newParts.join(" ");
      });
      if (replacedCount > 0) setStudentIdsText(newLines.join("\n"));
    } catch (err) {
      console.error("Error resolving INC in multi mode:", err);
    }
  }, [studentIdsText, selectedAlianza, setStudentIdsText]);

  const handleClear = useCallback(() => {
    if (mode === "varios") {
      setStudentIdsText(""); setProgramIdsText(""); setSelectedAlianza(""); setSelectedState("");
    } else {
      setSingleStudentId(""); setSingleProgramId(""); setSingleState("");
      setSingleManualProgram(false); setSingleSelectedUser(null);
    }
    setGeneratedCommands([]);
  }, [mode, setStudentIdsText, setProgramIdsText, setSelectedAlianza, setSelectedState, setSingleStudentId, setSingleProgramId, setSingleState]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") handleClear(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClear]);

  // Auto-generate commands
  useEffect(() => {
    if (mode === "varios") {
      const studentsText = studentIdsText.trim();
      const programsText = programIdsText.trim();
      if (!selectedAlianza || !selectedState || !studentsText || !programsText) { setGeneratedCommands([]); return; }
      const students = parseIds(studentsText);
      const programs = parseIds(programsText);
      if (students.length === 0 || programs.length === 0 || students.length !== programs.length) { setGeneratedCommands([]); return; }
      const grouped = {};
      students.forEach((studentId, i) => {
        const programId = programs[i];
        if (!grouped[programId]) grouped[programId] = [];
        grouped[programId].push(studentId);
      });
      const commands = Object.entries(grouped).map(([programId, ids]) =>
        `magik run:prod status:change["${programId}","${selectedState}","${ids.join('","')}"]`
      );
      setGeneratedCommands(commands);
    } else {
      const studentId = singleSelectedUser ? (singleSelectedUser._id?.$oid || singleSelectedUser._id) : singleStudentId.trim();
      const progId = singleProgramId.trim();
      if (!studentId || !progId || !singleState) { setGeneratedCommands([]); return; }
      setGeneratedCommands([`magik run:prod status:change["${progId}","${singleState}","${studentId}"]`]);
    }
  }, [mode, studentIdsText, programIdsText, selectedAlianza, selectedState, singleSelectedUser, singleStudentId, singleProgramId, singleState]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const currentStateOptions = stateOptionsByAlianza[selectedAlianza] || [];
  const userPrograms = singleSelectedUser?.programs || [];
  const hasUserPrograms = userPrograms.length > 0 && !singleManualProgram;

  // Live parity for "varios" mode
  const studentCount = useMemo(() => parseIds(studentIdsText).length, [studentIdsText]);
  const programCount = useMemo(() => parseIds(programIdsText).length, [programIdsText]);
  const parityMatch = studentCount > 0 && programCount > 0 && studentCount === programCount;
  const parityEmpty = studentCount === 0 && programCount === 0;
  const parityClass = parityEmpty ? "empty" : parityMatch ? "match" : "mismatch";
  const ParityIcon = parityEmpty ? Minus : parityMatch ? CheckCircle2 : AlertTriangle;
  const parityLabel = parityEmpty
    ? "Ingresa IDs para verificar paridad"
    : parityMatch
    ? `${studentCount} estudiantes ↔ ${programCount} programas — Paridad OK`
    : `${studentCount} estudiantes ≠ ${programCount} programas — No coinciden`;

  return (
    <div
      className="inscripciones-main animate-slide-down"
      style={{ padding: "18px 24px", maxWidth: "1100px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}
    >
      {/* ── Header ── */}
      <div className="inscripciones-header-row">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="inscripciones-mode-badge">
            <RefreshCw size={17} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "18px", fontWeight: 800, color: "var(--on-surface)", margin: 0, lineHeight: 1.2 }}>
              Cambios de Estado
            </h1>
            <span style={{ fontSize: "11.5px", color: "var(--on-surface-variant)" }}>
              {mode === "uno" ? "Cambia el estado de un estudiante en su programa" : "Cambios masivos de estado por pares estudiante ↔ programa"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Barra de Pestañas ── */}
      <div className="inscripciones-tabs">
        {[
          { id: "uno", label: "Un Estudiante", icon: User },
          { id: "varios", label: "Carga Masiva", icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`inscripciones-tab-btn ${mode === id ? "active" : ""}`}
            onClick={() => { setMode(id); setGeneratedCommands([]); }}
          >
            <Icon size={14} style={{ color: mode === id ? "var(--primary)" : "var(--on-surface-variant)" }} />
            <span>{label}</span>
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          {mode === "uno" && (
            <AllianceSwitcher
              value={singleAlliance}
              onChange={(val) => {
                setSingleAlliance(val);
                setSingleStudentId(""); setSingleProgramId(""); setSingleState("");
                setSingleManualProgram(false); setSingleSelectedUser(null); setGeneratedCommands([]);
              }}
            />
          )}
          <button
            type="button"
            onClick={handleClear}
            title="Limpiar (Esc)"
            style={{ background: "transparent", border: "1px solid var(--glass-border)", color: "var(--on-surface-variant)", borderRadius: "8px", padding: "7px 14px", fontSize: "11px", cursor: "pointer", fontFamily: "Nunito, sans-serif", fontWeight: 700 }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* ── Panel ── */}
      <div className="inscripciones-panel">

        {/* ── MODO: UN ESTUDIANTE ── */}
        {mode === "uno" && (
          <div className="inscr-grid-3">
            {/* Col 1: Usuario */}
            <div className="inscr-field-block">
              <label className="inscr-field-label">Usuario</label>
              <IncAutocomplete
                alianzaId={ALLIANCE_MONGO_MAP[singleAlliance]}
                value={singleStudentId}
                onChange={setSingleStudentId}
                onBlur={handleSingleStudentBlur}
                onSelect={(user) => {
                  if (user) { setSingleStudentId(user._id?.$oid || user._id); setSingleSelectedUser(user); }
                  else { setSingleSelectedUser(null); }
                  setSingleProgramId("");
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
                    onClick={() => setSingleManualProgram((prev) => !prev)}
                    style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}
                  >
                    {singleManualProgram ? "← Ver lista" : "Ingreso manual"}
                  </button>
                )}
              </div>
              {hasUserPrograms ? (
                <select
                  value={singleProgramId}
                  onChange={(e) => setSingleProgramId(e.target.value)}
                  className="inscr-select"
                >
                  <option value="">Selecciona un programa</option>
                  {userPrograms.map((prog, idx) => {
                    const pid = prog.structure?.$oid || prog.structure;
                    if (!pid) return null;
                    const pName = programasMap[pid]?.name || pid;
                    return (
                      <option key={`${pid}-${idx}`} value={pid}>{pName}</option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  value={singleProgramId}
                  onChange={(e) => setSingleProgramId(e.target.value)}
                  className="inscr-input"
                  placeholder="ID del programa"
                />
              )}
            </div>

            {/* Col 3: Estado */}
            <div className="inscr-field-block">
              <label className="inscr-field-label">Nuevo Estado</label>
              <CustomDropdown
                value={singleState}
                options={singleStateOptions}
                onChange={setSingleState}
                disabled={false}
                placeholder="Selecciona un estado"
              />
            </div>
          </div>
        )}

        {/* ── MODO: CARGA MASIVA ── */}
        {mode === "varios" && (
          <>
            {/* Fila de selectores: Alianza + Estado */}
            <div className="inscr-grid-2">
              <div className="inscr-field-block">
                <label className="inscr-field-label">Alianza</label>
                <CustomDropdown
                  value={selectedAlianza}
                  options={alianzaOptions}
                  onChange={(val) => { setSelectedAlianza(val); setSelectedState(""); setStudentIdsText(""); setProgramIdsText(""); }}
                  disabled={false}
                  placeholder="Seleccione una alianza"
                />
              </div>
              <div className="inscr-field-block">
                <label className="inscr-field-label">Nuevo Estado</label>
                <CustomDropdown
                  value={selectedState}
                  options={currentStateOptions}
                  onChange={setSelectedState}
                  disabled={selectedAlianza === ""}
                  placeholder="Seleccione un estado"
                />
              </div>
            </div>

            {/* Live parity bar */}
            <div className={`inscr-parity-bar ${parityClass}`}>
              <ParityIcon size={15} />
              <span>{parityLabel}</span>
            </div>

            {/* Dual pane */}
            <div className="inscr-dual-pane" style={{ minHeight: "240px" }}>
              <div className="inscr-pane-card">
                <div className="inscr-pane-header">
                  <span className="inscr-field-label">Lista de Estudiantes</span>
                  {studentCount > 0 && <span className="inscr-count-badge">{studentCount}</span>}
                </div>
                <textarea
                  className="inscr-textarea"
                  value={studentIdsText}
                  onChange={(e) => setStudentIdsText(e.target.value)}
                  onBlur={handleMultiStudentBlur}
                  style={{ flex: 1, minHeight: "200px", resize: "none" }}
                  placeholder="Ingrese un ID por línea (acepta INC)..."
                />
              </div>
              <div className="inscr-pane-card">
                <div className="inscr-pane-header">
                  <span className="inscr-field-label">Lista de Programas</span>
                  {programCount > 0 && <span className="inscr-count-badge">{programCount}</span>}
                </div>
                <textarea
                  className="inscr-textarea"
                  value={programIdsText}
                  onChange={(e) => setProgramIdsText(e.target.value)}
                  style={{ flex: 1, minHeight: "200px", resize: "none" }}
                  placeholder="Ingrese un ID por línea..."
                />
              </div>
            </div>
          </>
        )}

        <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
      </div>
    </div>
  );
}

export default CambiosEstadoBemo;
