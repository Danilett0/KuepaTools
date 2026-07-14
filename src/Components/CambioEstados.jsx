import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import "../Styles/styles.css";
import CommandsDisplay from "./CommandsDisplay";
import { ChevronDown, Zap } from "lucide-react";
import { toast } from "react-toastify";
import AllianceSwitcher from "./ui/AllianceSwitcher";
import { useUsuariosCompletos } from "../hooks/useUsuariosCompletos";
import { useCatalogos } from "../hooks/useCatalogos";

// ─── Datos de alianzas y estados ────────────────────────────────────────────

const alianzaOptions = [
  { value: "nueva_america", label: "Nueva América" },
  { value: "kuepa", label: "Kuepa" },
];

const ALLIANCE_MONGO_MAP = {
  na: "6303ed663138387a1669d82a",
  kuepa: "602169e217b5c8a27f9e9c06",
};

const stateOptionsByAlianza = {
  nueva_america: [
    { value: "640a563e1cbb9f11665ef129", label: "Al día" },
    { value: "632b97df8f3bba0fc2708b78", label: "Nuevo" },
    { value: "6303ed683138387a1669d8a3", label: "Regular" },
    { value: "648b908a55ba6c0c84c5013f", label: "Aplazado" },
    { value: "639b2fe70605300cc60ccf5d", label: "Regular en verificacion" },
    { value: "650dfeba1bc4f0480d1fa128", label: "Matricula no exitosa" },
    { value: "650dfeb91bc4f0480d1fa118", label: "Requisitos Académicos" },
    { value: "650dfeba1bc4f0480d1fa11d", label: "Graduado" },
  ],
  kuepa: [
    { value: "6244cb5f122b0b804c7e1088", label: "Regular en verificacion" },
    { value: "60e8b7445348bf79648860ed", label: "Al día" },
    { value: "63d82c1967c1dc1a075dbdf0", label: "Matricula no exitosa" },
    { value: "63a9fa5c3110b56b5be740ed", label: "Trasladado" },
    { value: "68c989dbca60fe3f1793603e", label: "Retiro académico" },
    { value: "638e52cbc288e599d70a2488", label: "Prematriculado" },
    { value: "60e8b7445348bf79648860e6", label: "Graduado" },
    { value: "6244cb5f122b0b804c7e1084", label: "Nuevo" },
    { value: "60e8b7445348bf79648860eb", label: "Abandono" },
  ],
};

// ─── Dropdown personalizado reutilizable ─────────────────────────────────────

function CustomDropdown({ label, value, options, onChange, disabled, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        className="inscripciones-input"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "48px",
          padding: "0 16px",
          cursor: disabled ? "not-allowed" : "pointer",
          color: selected ? "var(--on-surface)" : "var(--on-surface-variant)",
          borderColor: open ? "var(--primary)" : "var(--glass-border)",
          boxShadow: open ? "0 0 0 2px var(--gold-glow)" : "none",
          userSelect: "none",
          opacity: disabled ? 0.4 : 1,
          transition: "all 0.3s ease",
        }}
        onClick={() => {
          if (!disabled) setOpen((o) => !o);
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={18}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        />
      </div>

      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: "100%",
            background: "var(--surface-low)",
            border: "1px solid var(--glass-border)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            zIndex: 200,
            overflow: "hidden",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                padding: "13px 16px",
                cursor: "pointer",
                background: value === opt.value ? "var(--primary-container)" : "transparent",
                color: value === opt.value ? "#fff" : "var(--on-surface)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "14px",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) e.currentTarget.style.background = "transparent";
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

function CambiosEstadoBemo() {
  // ── Modo ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useLocalStorage("cambioEstados-mode", "varios");

  // ── Estado modo "varios" (comportamiento actual) ───────────────────────────
  const [studentIdsText, setStudentIdsText] = useLocalStorage("cambioEstados-studentIdsText", "");
  const [programIdsText, setProgramIdsText] = useLocalStorage("cambioEstados-programIdsText", "");
  const [selectedAlianza, setSelectedAlianza] = useLocalStorage("cambioEstados-selectedAlianza", "");
  const [selectedState, setSelectedState] = useLocalStorage("cambioEstados-selectedState", "");

  // ── Estado modo "uno" ─────────────────────────────────────────────────────
  const [singleStudentId, setSingleStudentId] = useLocalStorage("cambioEstados-singleStudentId", "");
  const [singleProgramId, setSingleProgramId] = useLocalStorage("cambioEstados-singleProgramId", "");
  const [singleAlliance, setSingleAlliance] = useLocalStorage("cambioEstados-singleAlliance", "na");
  const [singleState, setSingleState] = useLocalStorage("cambioEstados-singleState", "");
  const [singleManualProgram, setSingleManualProgram] = useState(false);

  // ── Comandos generados ───────────────────────────────────────────────────
  const [generatedCommands, setGeneratedCommands] = useState([]);

  // ── Datos externos ───────────────────────────────────────────────────────
  const { data: usuariosCompletos } = useUsuariosCompletos();
  const { programas: programasData } = useCatalogos();

  const programasMap = useMemo(() =>
    programasData ? Object.fromEntries(programasData.map((p) => [p._id.$oid, p])) : {}
    , [programasData]);

  // ── Usuario encontrado en modo "uno" ─────────────────────────────────────
  const singleSelectedUser = useMemo(() => {
    const input = singleStudentId.trim();
    if (!input || !usuariosCompletos?.length) return null;

    const allianceId = ALLIANCE_MONGO_MAP[singleAlliance];
    return usuariosCompletos.find((u) => {
      const uAlliance = u.alliance_id?.$oid || u.alliance_id;
      if (uAlliance !== allianceId) return false;
      return (
        String(u.incremental_user_code) === input ||
        (u._id?.$oid || u._id) === input
      );
    }) || null;
  }, [singleStudentId, singleAlliance, usuariosCompletos]);

  const handleSingleStudentBlur = useCallback(() => {
    const input = singleStudentId.trim();
    if (!input || !singleSelectedUser) return;
    if (String(singleSelectedUser.incremental_user_code) === input) {
      setSingleStudentId(singleSelectedUser._id?.$oid || singleSelectedUser._id);
    }
  }, [singleStudentId, singleSelectedUser, setSingleStudentId]);

  // ── Mapeo de alianza para estados ─────────────────────────────────────────
  const singleAlianzaKey = singleAlliance === "na" ? "nueva_america" : "kuepa";
  const singleStateOptions = stateOptionsByAlianza[singleAlianzaKey] || [];

  // ── Limpiar ───────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    if (mode === "varios") {
      setStudentIdsText("");
      setProgramIdsText("");
      setSelectedAlianza("");
      setSelectedState("");
    } else {
      setSingleStudentId("");
      setSingleProgramId("");
      setSingleState("");
      setSingleManualProgram(false);
    }
    setGeneratedCommands([]);
  }, [mode, setStudentIdsText, setProgramIdsText, setSelectedAlianza, setSelectedState, setSingleStudentId, setSingleProgramId, setSingleState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClear();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClear]);

  // ── Generar comandos ──────────────────────────────────────────────────────
  const handleGenerate = () => {
    if (mode === "varios") {
      if (!selectedAlianza) { toast.error("Por favor seleccione una alianza."); return; }
      if (!selectedState) { toast.error("Por favor seleccione un estado nuevo."); return; }

      const getIds = (text) => text ? text.split(/\s+/).map((e) => e.trim()).filter(Boolean) : [];
      const students = getIds(studentIdsText);
      const programs = getIds(programIdsText);

      if (students.length === 0) { toast.error("Por favor ingrese al menos un ID de estudiante."); return; }
      if (programs.length === 0) { toast.error("Por favor ingrese al menos un ID de programa."); return; }
      if (students.length !== programs.length) {
        toast.error(`La cantidad de estudiantes (${students.length}) no coincide con la cantidad de programas (${programs.length}).`);
        return;
      }

      const grouped = {};
      students.forEach((studentId, i) => {
        const programId = programs[i];
        if (!grouped[programId]) grouped[programId] = [];
        grouped[programId].push(studentId);
      });

      const commands = Object.entries(grouped).map(([programId, ids]) => {
        const joined = ids.join('","');
        return `magik run:prod status:change["${programId}","${selectedState}","${joined}"]`;
      });

      setGeneratedCommands(commands);
      toast.success(`${commands.length} comando${commands.length !== 1 ? "s" : ""} generado${commands.length !== 1 ? "s" : ""}`);

    } else {
      // modo "uno"
      const studentId = singleSelectedUser
        ? (singleSelectedUser._id?.$oid || singleSelectedUser._id)
        : singleStudentId.trim();

      if (!studentId) { toast.error("Por favor ingrese el ID del estudiante."); return; }
      if (!singleProgramId.trim()) { toast.error("Por favor seleccione o ingrese un ID de programa."); return; }
      if (!singleState) { toast.error("Por favor seleccione un nuevo estado."); return; }

      const cmd = `magik run:prod status:change["${singleProgramId.trim()}","${singleState}","${studentId}"]`;
      setGeneratedCommands([cmd]);
      toast.success("Comando generado");
    }
  };

  // ── Estados actuales del modo varios ─────────────────────────────────────
  const currentStateOptions = stateOptionsByAlianza[selectedAlianza] || [];
  const isDropdownEnabled = studentIdsText.trim() !== "" && programIdsText.trim() !== "";
  const isStateDropdownEnabled = isDropdownEnabled && selectedAlianza !== "";

  // ── Programas del usuario seleccionado (modo uno) ─────────────────────────
  const userPrograms = singleSelectedUser?.programs || [];
  const hasUserPrograms = userPrograms.length > 0 && !singleManualProgram;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="inscripciones-container">
      <div className="inscripciones-content">
        <div className="inscripciones-form-container" style={{ marginTop: 0 }}>

          {/* ── Barra superior ─────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            {/* Izquierda: toggle de modo */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", gap: "4px", background: "var(--glass-border)", borderRadius: "8px", padding: "3px" }}>
                {["uno", "varios"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setGeneratedCommands([]); }}
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      padding: "4px 16px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      background: mode === m ? "var(--primary)" : "transparent",
                      color: mode === m ? "#0a0a0a" : "var(--text-muted)",
                      boxShadow: mode === m ? "0 1px 4px var(--gold-glow)" : "none",
                    }}
                  >
                    {m === "uno" ? "Cambiar uno" : "Cambiar varios"}
                  </button>
                ))}
              </div>
            </div>

            {/* Derecha: Limpiar */}
            <button onClick={handleClear} className="btn-clear" title="Limpiar campos">
              Limpiar
            </button>
          </div>

          {/* ── Divisor ────────────────────────────────────────────── */}
          <div style={{ height: "1px", background: "var(--glass-border)", marginBottom: "24px", width: "100%" }} />

          {/* ── MODO VARIOS ───────────────────────────────────────── */}
          {mode === "varios" && (
            <>
              <div style={{ display: "flex", gap: "16px" }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <label className="input-label" style={{ marginBottom: "8px" }}>ID DE ESTUDIANTES</label>
                  <textarea
                    className="txareaids"
                    value={studentIdsText}
                    onChange={(e) => setStudentIdsText(e.target.value)}
                    style={{ minHeight: "280px", resize: "vertical" }}
                    placeholder="Ingrese un ID por línea..."
                  />
                </div>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <label className="input-label" style={{ marginBottom: "8px" }}>ID DE LOS PROGRAMAS</label>
                  <textarea
                    className="txareaids"
                    value={programIdsText}
                    onChange={(e) => setProgramIdsText(e.target.value)}
                    style={{ minHeight: "280px", resize: "vertical" }}
                    placeholder="Ingrese un ID por línea..."
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <label className="input-label" style={{ marginBottom: "8px" }}>Alianza</label>
                  <CustomDropdown
                    value={selectedAlianza}
                    options={alianzaOptions}
                    onChange={(val) => { setSelectedAlianza(val); setSelectedState(""); }}
                    disabled={!isDropdownEnabled}
                    placeholder="Seleccione una alianza"
                  />
                </div>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <label className="input-label" style={{ marginBottom: "8px" }}>Nuevo estado del estudiante</label>
                  <CustomDropdown
                    value={selectedState}
                    options={currentStateOptions}
                    onChange={setSelectedState}
                    disabled={!isStateDropdownEnabled}
                    placeholder="Seleccione un estado"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── MODO UNO ──────────────────────────────────────────── */}
          {mode === "uno" && (
            <div className="inscripciones-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {/* Columna 1: Estudiante + alianza */}
              <div className="input-wrapper">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", height: "32px", flexWrap: "wrap" }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>ID Estudiante</label>
                  <AllianceSwitcher
                    value={singleAlliance}
                    onChange={(val) => {
                      setSingleAlliance(val);
                      setSingleStudentId("");
                      setSingleProgramId("");
                      setSingleState("");
                      setSingleManualProgram(false);
                      setGeneratedCommands([]);
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={singleStudentId}
                  onChange={(e) => setSingleStudentId(e.target.value)}
                  onBlur={handleSingleStudentBlur}
                  className="inscripciones-input"
                  placeholder="Ingrese id"
                  style={{ height: "48px", padding: "0 16px" }}
                />
                {singleStudentId && !singleSelectedUser && (
                  <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px" }}>
                    Estudiante no encontrado
                  </div>
                )}
                {singleSelectedUser && (
                  <div style={{ fontSize: "12px", color: "var(--primary)", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {singleSelectedUser.profile?.full_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Columna 2: Programa */}
              <div className="input-wrapper">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", height: "32px" }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>ID Programa</label>
                  {userPrograms.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSingleManualProgram((prev) => !prev)}
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
                      {singleManualProgram ? "← Ver lista" : "Ingreso manual"}
                    </button>
                  )}
                </div>
                {hasUserPrograms ? (
                  <select
                    value={singleProgramId}
                    onChange={(e) => setSingleProgramId(e.target.value)}
                    className="inscripciones-input"
                    style={{ height: "48px", padding: "0 16px", appearance: "auto" }}
                  >
                    <option value="" style={{ backgroundColor: "#1c1b1b", color: "#cae1d7" }}>Selecciona un programa</option>
                    {userPrograms.map((prog, idx) => {
                      const pid = prog.structure?.$oid || prog.structure;
                      if (!pid) return null;
                      const pName = programasMap[pid]?.name || pid;
                      return (
                        <option key={`${pid}-${idx}`} value={pid} style={{ backgroundColor: "#1c1b1b", color: "#e5e2e1" }}>
                          {pName}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={singleProgramId}
                    onChange={(e) => setSingleProgramId(e.target.value)}
                    className="inscripciones-input"
                    placeholder="ID Programa"
                    style={{ height: "48px", padding: "0 16px" }}
                  />
                )}
              </div>

              {/* Columna 3: Nuevo estado */}
              <div className="input-wrapper">
                <div style={{ display: "flex", alignItems: "center", marginBottom: "8px", height: "32px" }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Nuevo Estado</label>
                </div>
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

          {/* ── Botón generar ─────────────────────────────────────── */}
          <div style={{ marginTop: "28px" }}>
            <button className="btn btn-primary" onClick={handleGenerate}>
              <Zap size={20} /> Generar comandos
            </button>
          </div>

          <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
        </div>
      </div>
    </div>
  );
}

export default CambiosEstadoBemo;
