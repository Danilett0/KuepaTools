import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import "../Styles/styles.css";
import CommandsDisplay from "./CommandsDisplay";
import { ChevronDown, Zap } from "lucide-react";
import { toast } from "react-toastify";

const alianzaOptions = [
  { value: "nueva_america", label: "Nueva América" },
  { value: "kuepa", label: "Kuepa" }
];

const stateOptionsByAlianza = {
  nueva_america: [
    { value: "640a563e1cbb9f11665ef129", label: "Al día" },
    { value: "632b97df8f3bba0fc2708b78", label: "Nuevo" },
    { value: "6303ed683138387a1669d8a3", label: "Regular" },
    { value: "648b908a55ba6c0c84c5013f", label: "Aplazado" },
    { value: "639b2fe70605300cc60ccf5d", label: "Regular en verificacion" },
    { value: "650dfeba1bc4f0480d1fa128", label: "Matricula no exitosa" },
    { value: "650dfeb91bc4f0480d1fa118", label: "Requisitos Académicos" },
    { value: "650dfeba1bc4f0480d1fa11d", label: "Graduado" }
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
    { value: "60e8b7445348bf79648860eb", label: "Abandono" }
  ]
};

function CambiosEstadoBemo() {
  const [studentIdsText, setStudentIdsText] = useLocalStorage("cambioEstados-studentIdsText", "");
  const [programIdsText, setProgramIdsText] = useLocalStorage("cambioEstados-programIdsText", "");
  const [selectedAlianza, setSelectedAlianza] = useLocalStorage("cambioEstados-selectedAlianza", "");
  const [selectedState, setSelectedState] = useLocalStorage("cambioEstados-selectedState", "");
  const [generatedCommands, setGeneratedCommands] = useState([]);

  const [isAlianzaDropdownOpen, setIsAlianzaDropdownOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const alianzaDropdownRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (alianzaDropdownRef.current && !alianzaDropdownRef.current.contains(event.target)) {
        setIsAlianzaDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = useCallback(() => {
    setStudentIdsText("");
    setProgramIdsText("");
    setSelectedAlianza("");
    setSelectedState("");
    setGeneratedCommands([]);
  }, [setStudentIdsText, setProgramIdsText, setSelectedAlianza, setSelectedState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClear]);

  useEffect(() => {
    if (generatedCommands.length > 0) {
      setGeneratedCommands([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlianza, selectedState, studentIdsText, programIdsText]);

  const handleGenerate = () => {
    if (!selectedAlianza) {
      toast.error("Por favor seleccione una alianza.");
      return;
    }
    if (!selectedState) {
      toast.error("Por favor seleccione un estado nuevo.");
      return;
    }

    const getIds = (text) => text ? text.split(/\s+/).map(e => e.trim()).filter(e => e !== "") : [];

    const students = getIds(studentIdsText);
    const programs = getIds(programIdsText);

    if (students.length === 0) {
      toast.error("Por favor ingrese al menos un ID de estudiante.");
      return;
    }
    if (programs.length === 0) {
      toast.error("Por favor ingrese al menos un ID de programa.");
      return;
    }
    if (students.length !== programs.length) {
      toast.error(`La cantidad de estudiantes (${students.length}) no coincide con la cantidad de programas (${programs.length}).`);
      return;
    }

    const groupedStudents = {};
    students.forEach((studentId, index) => {
      const programId = programs[index];
      if (!groupedStudents[programId]) {
        groupedStudents[programId] = [];
      }
      groupedStudents[programId].push(studentId);
    });

    const commands = [];
    for (const [programId, studentIdsList] of Object.entries(groupedStudents)) {
      const studentsJoined = studentIdsList.join('","');
      commands.push(`magik run:prod status:change["${programId}","${selectedState}","${studentsJoined}"]`);
    }

    setGeneratedCommands(commands);
    toast.success(`${commands.length} comando${commands.length !== 1 ? "s" : ""} generado${commands.length !== 1 ? "s" : ""}`);
  };

  const currentStateOptions = stateOptionsByAlianza[selectedAlianza] || [];
  const selectedAlianzaLabel = alianzaOptions.find(opt => opt.value === selectedAlianza)?.label || "Seleccione una alianza";
  const selectedLabel = currentStateOptions.find(opt => opt.value === selectedState)?.label || "Seleccione un estado";
  const isDropdownEnabled = studentIdsText.trim() !== "" && programIdsText.trim() !== "";
  const isStateDropdownEnabled = isDropdownEnabled && selectedAlianza !== "";

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="inscripciones-title" style={{ fontSize: "20px", color: "var(--primary)", fontWeight: "800", margin: 0 }}>
            Generar cambio de estado masivo
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
          <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <label className="input-label" style={{ textAlign: "center", display: "block", marginBottom: "8px" }}>ID DE ESTUDIANTES</label>
              <textarea
                className="txareaids"
                value={studentIdsText}
                onChange={(e) => setStudentIdsText(e.target.value)}
                style={{ minHeight: "300px", resize: "vertical" }}
                placeholder="Ingrese un ID por línea..."
              />
            </div>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <label className="input-label" style={{ textAlign: "center", display: "block", marginBottom: "8px" }}>ID DE LOS PROGRAMAS</label>
              <textarea
                className="txareaids"
                value={programIdsText}
                onChange={(e) => setProgramIdsText(e.target.value)}
                style={{ minHeight: "300px", resize: "vertical" }}
                placeholder="Ingrese un ID por línea..."
              />
            </div>
          </div>

          {/* Dropdowns en fila */}
          <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>

            {/* Selector Alianza */}
            <div className="input-wrapper" style={{ flex: 1 }}>
              <label className="input-label">Alianza</label>
              <div className="custom-dropdown-container" ref={alianzaDropdownRef} style={{ position: "relative" }}>
                <div
                  className="inscripciones-input"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: isDropdownEnabled ? "pointer" : "not-allowed",
                    color: selectedAlianza ? "var(--on-surface)" : "var(--on-surface-variant)",
                    borderColor: isAlianzaDropdownOpen ? "var(--primary)" : "var(--glass-border)",
                    boxShadow: isAlianzaDropdownOpen ? "0 0 0 2px var(--gold-glow)" : "none",
                    userSelect: "none",
                    opacity: isDropdownEnabled ? (selectedAlianza ? 1 : 0.6) : 0.3,
                    transition: "all 0.3s ease"
                  }}
                  onClick={() => {
                    if (isDropdownEnabled) {
                      setIsAlianzaDropdownOpen(!isAlianzaDropdownOpen);
                    } else {
                      toast.error("Ingrese IDs de estudiantes y programas primero");
                    }
                  }}
                >
                  {selectedAlianzaLabel}
                  <ChevronDown size={20} style={{ transform: isAlianzaDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease", opacity: isDropdownEnabled ? 1 : 0.3 }} />
                </div>
                {isAlianzaDropdownOpen && isDropdownEnabled && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      width: "100%",
                      marginTop: "8px",
                      background: "var(--surface-low)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "12px",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                      zIndex: 101,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    {alianzaOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => {
                          setSelectedAlianza(option.value);
                          setSelectedState("");
                          setIsAlianzaDropdownOpen(false);
                        }}
                        style={{
                          padding: "14px 16px",
                          cursor: "pointer",
                          background: selectedAlianza === option.value ? "var(--primary-container)" : "transparent",
                          color: selectedAlianza === option.value ? "#fff" : "var(--on-surface)",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: "15px",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          if (selectedAlianza !== option.value) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }}
                        onMouseLeave={(e) => {
                          if (selectedAlianza !== option.value) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selector Estado */}
            <div className="input-wrapper" style={{ flex: 1 }}>
              <label className="input-label">Nuevo estado del estudiante</label>
              <div className="custom-dropdown-container" ref={dropdownRef} style={{ position: "relative" }}>
                <div
                  className="inscripciones-input"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: isStateDropdownEnabled ? "pointer" : "not-allowed",
                    color: selectedState ? "var(--on-surface)" : "var(--on-surface-variant)",
                    borderColor: isDropdownOpen ? "var(--primary)" : "var(--glass-border)",
                    boxShadow: isDropdownOpen ? "0 0 0 2px var(--gold-glow)" : "none",
                    userSelect: "none",
                    opacity: isStateDropdownEnabled ? (selectedState ? 1 : 0.6) : 0.3,
                    transition: "all 0.3s ease"
                  }}
                  onClick={() => {
                    if (isStateDropdownEnabled) {
                      setIsDropdownOpen(!isDropdownOpen);
                    } else if (!isDropdownEnabled) {
                      toast.error("Ingrese IDs de estudiantes y programas primero");
                    } else {
                      toast.error("Seleccione una alianza primero");
                    }
                  }}
                >
                  {selectedLabel}
                  <ChevronDown size={20} style={{ transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease", opacity: isStateDropdownEnabled ? 1 : 0.3 }} />
                </div>
                {isDropdownOpen && isStateDropdownEnabled && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      width: "100%",
                      marginTop: "8px",
                      background: "var(--surface-low)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "12px",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                      zIndex: 100,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      maxHeight: "240px",
                      overflowY: "auto"
                    }}
                  >
                    {currentStateOptions.length === 0 ? (
                      <div style={{ padding: "14px 16px", color: "var(--on-surface-variant)", fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px", textAlign: "center" }}>
                        Sin estados disponibles
                      </div>
                    ) : (
                      currentStateOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => {
                            setSelectedState(option.value);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            padding: "14px 16px",
                            cursor: "pointer",
                            background: selectedState === option.value ? "var(--primary-container)" : "transparent",
                            color: selectedState === option.value ? "#fff" : "var(--on-surface)",
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: "15px",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            if (selectedState !== option.value) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                          }}
                          onMouseLeave={(e) => {
                            if (selectedState !== option.value) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {option.label}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className="inscripciones-buttons" style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
          >
            <Zap size={20} /> Generar comandos
          </button>
        </div>

        <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
      </div>
    </div>
  );
}

export default CambiosEstadoBemo;
