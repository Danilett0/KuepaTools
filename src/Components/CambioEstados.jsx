import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import "../Styles/styles.css";
import CommandsDisplay from "./CommandsDisplay";
import { showSuccess, showError } from "../services/toastService";
import { ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

const stateOptions = [
  { value: "640a563e1cbb9f11665ef129", label: "Al día" },
  { value: "632b97df8f3bba0fc2708b78", label: "Nuevo" },
  { value: "6303ed683138387a1669d8a3", label: "Regular" },
  { value: "648b908a55ba6c0c84c5013f", label: "Aplazado" },
  { value: "639b2fe70605300cc60ccf5d", label: "Regular en verificacion" },
  { value: "650dfeba1bc4f0480d1fa128", label: "Matricula no exitosa" },
  { value: "650dfeb91bc4f0480d1fa118", label: "Requisitos Académicos" },
  { value: "650dfeba1bc4f0480d1fa11d", label: "Graduado" }
];

function CambiosEstadoBemo() {
  const [studentId, setStudentId] = useLocalStorage("cambioEstados-studentId", "");
  const [programId, setProgramId] = useLocalStorage("cambioEstados-programId", "");
  const [selectedState, setSelectedState] = useLocalStorage("cambioEstados-selectedState", "");
  const [generatedCommands, setGeneratedCommands] = useState([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = useCallback(() => {
    setStudentId("");
    setProgramId("");
    setSelectedState("");
    setGeneratedCommands([]);
  }, [setStudentId, setProgramId, setSelectedState]);

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
    const trimmedStudentId = studentId.trim();
    const trimmedProgramId = programId.trim();
    const trimmedState = selectedState.trim();

    if (trimmedStudentId && trimmedProgramId && trimmedState) {
      const command = `magik run:prod status:change["${trimmedProgramId}","${trimmedState}","${trimmedStudentId}"]`;
      setGeneratedCommands([command]);
    } else {
      setGeneratedCommands([]);
    }
  }, [studentId, programId, selectedState]);

  const selectedLabel = stateOptions.find(opt => opt.value === selectedState)?.label || "Seleccione un estado";
  const isDropdownEnabled = studentId.trim() !== "" && programId.trim() !== "";

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="inscripciones-title" style={{ fontSize: "20px", color: "var(--primary)", fontWeight: "800", margin: 0 }}>
            Generar cambio de estado a un estudiante
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
          <div className="inscripciones-grid">
            <div className="input-wrapper">
              <label className="input-label">ID Estudiante</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="inscripciones-input"
              />
            </div>
            <div className="input-wrapper">
              <label className="input-label">ID Programa</label>
              <input
                type="text"
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="inscripciones-input"
              />
            </div>
          </div>

          {/* Custom Dropdown */}
          <div className="input-wrapper" style={{ marginTop: "8px" }}>
            <label className="input-label">Nuevo estado del estudiante</label>
            <div className="custom-dropdown-container" ref={dropdownRef} style={{ position: "relative" }}>
              <div
                className="inscripciones-input"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: isDropdownEnabled ? "pointer" : "not-allowed",
                  color: selectedState ? "var(--on-surface)" : "var(--on-surface-variant)",
                  borderColor: isDropdownOpen ? "var(--primary)" : "var(--glass-border)",
                  boxShadow: isDropdownOpen ? "0 0 0 2px var(--gold-glow)" : "none",
                  userSelect: "none",
                  opacity: isDropdownEnabled ? (selectedState ? 1 : 0.6) : 0.3,
                  transition: "all 0.3s ease"
                }}
                onClick={() => {
                  if (isDropdownEnabled) {
                    setIsDropdownOpen(!isDropdownOpen);
                  } else {
                    toast.error("Ingrese ID Estudiante e ID Programa primero");
                  }
                }}
              >
                {selectedLabel}
                <ChevronDown size={20} style={{ transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease", opacity: isDropdownEnabled ? 1 : 0.3 }} />
              </div>

              {isDropdownOpen && isDropdownEnabled && (
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
                  {stateOptions.map((option) => (
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
                        if (selectedState !== option.value) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedState !== option.value) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Los botones han sido eliminados */}

        <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
      </div>
    </div>
  );
}

export default CambiosEstadoBemo;
