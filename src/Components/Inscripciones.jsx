import React, { useState } from "react";
import { Eraser, UserPlus, UserMinus, ChevronDown, ChevronRight } from "lucide-react";
import CommandsDisplay from "./CommandsDisplay";
import { showError, showSuccess } from "../services/toastService";
import users from "../data/users.json";
import { toast } from "react-toastify";

function ComandosBemoInscripciones({ formType = "estudiante" }) {
  const showForm2 = formType === "estudiante";
  const showForm1 = formType === "grupo";
  
  const [groupId, setGroupId] = useState("");
  const [groupId2, setGroupId2] = useState("");
  const [txareaIds, setTxareaIds] = useState("");
  const [studentIds, setStudentIds] = useState(Array(8).fill(""));
  const [studentIds2, setStudentIds2] = useState(Array(8).fill(""));
  const [minInputsForm1] = useState(8);
  const [minInputsForm2] = useState(8);

  const [showManualInputsForm1, setShowManualInputsForm1] = useState(false);
  const [showManualInputsForm2, setShowManualInputsForm2] = useState(false);

  const [generatedCommands, setGeneratedCommands] = useState([]);

  const handleStudentIdChange = (index, value, isForm2 = false) => {
    if (isForm2) {
      const updatedStudentIds = [...studentIds2];
      updatedStudentIds[index] = value;
      setStudentIds2(updatedStudentIds);
    } else {
      const updatedStudentIds = [...studentIds];
      updatedStudentIds[index] = value;
      setStudentIds(updatedStudentIds);
    }
  };

  const handleEnroll = (isForm2 = false) => {
    if (isForm2) {
      const estudiante = groupId2.trim();
      if (!estudiante) {
        showError("Por favor ingrese el ID del estudiante antes de generar el comando.");
        return;
      }
      const grupos = studentIds2.filter((id) => id.trim() !== "");
      if (grupos.length === 0) {
        showError("Por favor ingrese al menos un ID de grupo antes de generar el comando.");
        return;
      }
      const comandos = grupos.map(
        (grupo) => `magik run:prod enroll:user["${grupo}","${estudiante}"]`
      );
      setGeneratedCommands(comandos);
      showSuccess(`${comandos.length} comando${comandos.length !== 1 ? "s" : ""} generado${comandos.length !== 1 ? "s" : ""}`);
    } else {
      const gId = groupId.trim();
      if (!gId) {
        showError("Por favor ingrese el ID del grupo académico antes de generar el comando.");
        return;
      }
      const filteredStudentIds = studentIds.filter((id) => id.trim() !== "");
      if (filteredStudentIds.length === 0) {
        showError("Por favor ingrese al menos un ID de estudiante antes de generar el comando.");
        return;
      }
      const command = `magik run:prod enroll:user["${gId}","${filteredStudentIds.join('","')}"]`;
      setGeneratedCommands([command]);
      showSuccess("Comando generado");
    }
  };

  const handleRemove = (isForm2 = false) => {
    if (isForm2) {
      const estudiante = groupId2.trim();
      if (!estudiante) {
        showError("Por favor ingrese el ID del estudiante antes de generar el comando.");
        return;
      }
      const grupos = studentIds2.filter((id) => id.trim() !== "");
      if (grupos.length === 0) {
        showError("Por favor ingrese al menos un ID de grupo antes de generar el comando.");
        return;
      }
      const comandos = grupos.map(
        (grupo) => `magik run:prod pull:user:from:group["${grupo}","${estudiante}"]`
      );
      setGeneratedCommands(comandos);
      showSuccess(`${comandos.length} comando${comandos.length !== 1 ? "s" : ""} generado${comandos.length !== 1 ? "s" : ""}`);
    } else {
      const gId = groupId.trim();
      if (!gId) {
        showError("Por favor ingrese el ID del grupo académico antes de generar el comando.");
        return;
      }
      const filteredStudentIds = studentIds.filter((id) => id.trim() !== "");
      if (filteredStudentIds.length === 0) {
        showError("Por favor ingrese al menos un ID de estudiante antes de generar el comando.");
        return;
      }
      const command = `magik run:prod pull:user:from:group["${gId}","${filteredStudentIds.join('","')}"]`;
      setGeneratedCommands([command]);
      showSuccess("Comando generado");
    }
  };

  const handleClear = (isForm2 = false) => {
    setTxareaIds("");
    setGeneratedCommands([]);
    if (isForm2) {
      setGroupId2("");
      setStudentIds2(Array(minInputsForm2).fill(""));
    } else {
      setGroupId("");
      setStudentIds(Array(minInputsForm1).fill(""));
    }
  };

  const BuscarId = (isForm2 = false) => {
    if (isForm2 && groupId2.trim() !== "") {
      const codigo = Number(groupId2.trim());
      const encontrado = users.find(
        (user) => user.incremental_user_code === codigo
      );
      if (encontrado) {
        setGroupId2(encontrado._id.$oid);
      } else {
        toast.error("INC de estudiante no encontrado.");
      }
    } else {
      toast.error("Por favor ingrese el INC del estudiante a buscar.");
    }
  };

  const handleGenerate = (isForm2 = false) => {
    if (!txareaIds || txareaIds.trim() === "") return;

    const flatIds = txareaIds
      .split(/\s+/)
      .map((e) => e.trim())
      .filter((e) => {
        const isCorrectLength = e.length >= 24 && e.length <= 26;
        const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(e);
        return isCorrectLength && isAlphanumeric;
      });

    if (flatIds.length === 0) {
      setTxareaIds("");
      return;
    }

    const minInputs = isForm2 ? minInputsForm2 : minInputsForm1;
    const requiredInputs = Math.max(flatIds.length, minInputs);
    const newIds = Array(requiredInputs).fill("");
    flatIds.forEach((id, index) => { newIds[index] = id; });

    if (isForm2) {
      setStudentIds2(newIds);
    } else {
      setStudentIds(newIds);
    }

    showSuccess(`Se importaron ${flatIds.length} registros correctamente.`);
    setTxareaIds("");
  };

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-content">
        {showForm1 && (
          <div className="inscripciones-form-container" style={{ marginTop: 0 }}>
            <h5 className="inscripciones-title" style={{ fontSize: "20px", color: "var(--primary)", fontWeight: "800" }}>
              Inscribir varios estudiantes a un grupo
            </h5>
            <div className="inscripciones-form">
              <div className="input-wrapper">
                <label className="input-label">ID Grupo Académico</label>
                <input
                  type="text"
                  id="groupId"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="inscripciones-input"
                />
              </div>
              <hr className="inscripciones-divider" />
              
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  cursor: "pointer", 
                  color: "var(--primary)", 
                  fontSize: "14px", 
                  fontWeight: "700",
                  marginTop: "8px",
                  marginBottom: showManualInputsForm1 ? "16px" : "8px",
                  userSelect: "none"
                }}
                onClick={() => setShowManualInputsForm1(!showManualInputsForm1)}
              >
                {showManualInputsForm1 ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                {showManualInputsForm1 ? "Ocultar ingreso manual" : "Ingresar IDs manualmente"}
                {studentIds.filter(id => id.trim() !== "").length > 0 && !showManualInputsForm1 && (
                  <span style={{ 
                    background: "var(--primary)", 
                    color: "#090909", 
                    padding: "2px 8px", 
                    borderRadius: "100px", 
                    fontSize: "11px", 
                    marginLeft: "auto"
                  }}>
                    {studentIds.filter(id => id.trim() !== "").length} detectados
                  </span>
                )}
              </div>

              {showManualInputsForm1 && (
                <div
                  className="inscripciones-grid"
                  style={{
                    maxHeight: studentIds.length > 20 ? "400px" : "auto",
                    overflowY: studentIds.length > 20 ? "auto" : "visible",
                    border: studentIds.length > 20 ? "1px solid var(--glass-border)" : "none",
                    borderRadius: studentIds.length > 20 ? "12px" : "0",
                    padding: studentIds.length > 20 ? "10px" : "0",
                  }}
                >
                  {studentIds.map((studentId, index) => (
                    <div className="input-wrapper" key={index}>
                      <label className="input-label">ID Estudiante {index + 1}</label>
                      <input
                        type="text"
                        id={`studentId-${index}`}
                        value={studentId}
                        onChange={(e) => handleStudentIdChange(index, e.target.value)}
                        className="inscripciones-input"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="input-wrapper" style={{ marginTop: "16px" }}>
                <label className="input-label">Lista de los ID que seran detectados automaticamente</label>
                <textarea
                  className="txareaids"
                  value={txareaIds}
                  onChange={(e) => setTxareaIds(e.target.value)}
                  onBlur={() => handleGenerate(false)}
                  style={{ minHeight: "150px" }}
                />
              </div>
            </div>
            <div className="inscripciones-buttons">
              <button className="btn btn-primary" onClick={() => handleEnroll(false)}>
                <UserPlus size={20} /> Inscribir estudiantes
              </button>
              <button className="btn btn-danger" onClick={() => handleRemove(false)}>
                <UserMinus size={20} /> Eliminar estudiantes
              </button>
              <button className="btn btn-warning btn-icon" onClick={() => handleClear(false)} title="Limpiar">
                <Eraser size={20} />
              </button>
            </div>

            <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
          </div>
        )}

        {showForm2 && (
          <div className="inscripciones-form-container" style={{ marginTop: 0 }}>
            <h5 className="inscripciones-title" style={{ fontSize: "20px", color: "var(--primary)", fontWeight: "800" }}>
              Inscribir grupos a un estudiante
            </h5>
            <div className="inscripciones-form">
              <div className="buscarIds">
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <label className="input-label">ID Estudiante</label>
                  <input
                    type="text"
                    id="groupId2"
                    value={groupId2}
                    onChange={(e) => setGroupId2(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        BuscarId(true);
                      }
                    }}
                    onBlur={() => {
                      if (groupId2.trim().length > 0 && groupId2.trim().length < 7) {
                        BuscarId(true);
                      }
                    }}
                    className="inscripciones-input"
                  />
                </div>
              </div>
              <hr className="inscripciones-divider" />
              
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  cursor: "pointer", 
                  color: "var(--primary)", 
                  fontSize: "14px", 
                  fontWeight: "700",
                  marginTop: "8px",
                  marginBottom: showManualInputsForm2 ? "16px" : "8px",
                  userSelect: "none"
                }}
                onClick={() => setShowManualInputsForm2(!showManualInputsForm2)}
              >
                {showManualInputsForm2 ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                {showManualInputsForm2 ? "Ocultar ingreso manual" : "Ingresar IDs manualmente"}
                {studentIds2.filter(id => id.trim() !== "").length > 0 && !showManualInputsForm2 && (
                  <span style={{ 
                    background: "var(--primary)", 
                    color: "#090909", 
                    padding: "2px 8px", 
                    borderRadius: "100px", 
                    fontSize: "11px", 
                    marginLeft: "auto"
                  }}>
                    {studentIds2.filter(id => id.trim() !== "").length} detectados
                  </span>
                )}
              </div>

              {showManualInputsForm2 && (
                <div
                  className="inscripciones-grid"
                  style={{
                    maxHeight: studentIds2.length > 20 ? "400px" : "auto",
                    overflowY: studentIds2.length > 20 ? "auto" : "visible",
                    border: studentIds2.length > 20 ? "1px solid var(--glass-border)" : "none",
                    borderRadius: studentIds2.length > 20 ? "12px" : "0",
                    padding: studentIds2.length > 20 ? "10px" : "0",
                  }}
                >
                  {studentIds2.map((studentId, index) => (
                    <div className="input-wrapper" key={index}>
                      <label className="input-label">ID Grupo {index + 1}</label>
                      <input
                        type="text"
                        id={`studentId2-${index}`}
                        value={studentId}
                        onChange={(e) => handleStudentIdChange(index, e.target.value, true)}
                        className="inscripciones-input"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="input-wrapper" style={{ marginTop: "16px" }}>
                <label className="input-label">Lista de los ID que seran detectados automaticamente</label>
                <textarea
                  className="txareaids"
                  value={txareaIds}
                  onChange={(e) => setTxareaIds(e.target.value)}
                  onBlur={() => handleGenerate(true)}
                  style={{ minHeight: "150px" }}
                />
              </div>
            </div>
            <div className="inscripciones-buttons">
              <button className="btn btn-primary" onClick={() => handleEnroll(true)}>
                <UserPlus size={20} /> Inscribir a grupos
              </button>
              <button className="btn btn-danger" onClick={() => handleRemove(true)}>
                <UserMinus size={20} /> Retirar de grupos
              </button>
              <button className="btn btn-warning btn-icon" onClick={() => handleClear(true)} title="Limpiar">
                <Eraser size={20} />
              </button>
            </div>

            <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ComandosBemoInscripciones;
