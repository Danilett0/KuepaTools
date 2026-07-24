import React, { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { UserPlus, UserMinus } from "lucide-react";
import CommandsDisplay from "./CommandsDisplay";
import { showError, showSuccess } from "../services/toastService";
import { useUsuariosCompletos } from "../hooks/useUsuariosCompletos";
import { toast } from "react-toastify";
import AllianceSwitcher from "./ui/AllianceSwitcher";
import ClearButton from "./ui/ClearButton";

function ComandosBemoInscripciones({ formType = "estudiante" }) {
  const showForm2 = formType === "estudiante";
  const showForm1 = formType === "grupo";
  const showForm3 = formType === "multi";
  const showForm4 = formType === "especificos";

  const { data: usuariosCompletos, loading } = useUsuariosCompletos();

  const [groupId, setGroupId] = useLocalStorage(`groupId-${formType}`, "");
  const [groupId2, setGroupId2] = useLocalStorage(`groupId2-${formType}`, "");
  const [txareaIds, setTxareaIds] = useLocalStorage(`txareaIds-${formType}`, "");
  const [studentIds, setStudentIds] = useLocalStorage(`studentIds-${formType}`, Array(8).fill(""));
  const [studentIds2, setStudentIds2] = useLocalStorage(`studentIds2-${formType}`, Array(8).fill(""));

  const [txareaMultiStudents, setTxareaMultiStudents] = useLocalStorage(`txareaMultiStudents-${formType}`, "");
  const [txareaMultiGroups, setTxareaMultiGroups] = useLocalStorage(`txareaMultiGroups-${formType}`, "");

  const [txareaEspecStudents, setTxareaEspecStudents] = useLocalStorage(`txareaEspecStudents-${formType}`, "");
  const [txareaEspecGroups, setTxareaEspecGroups] = useLocalStorage(`txareaEspecGroups-${formType}`, "");

  const minInputsForm1 = 8;
  const minInputsForm2 = 8;

  const [inputModeForm1, setInputModeForm1] = useState("paste"); // "manual" o "paste"
  const [inputModeForm2, setInputModeForm2] = useState("paste"); // "manual" o "paste"
  const [alianza, setAlianza] = useLocalStorage(`alianza-${formType}`, "na"); // "na" = Nueva América, "kuepa" = Kuepa

  const [generatedCommands, setGeneratedCommands] = useState([]);

  useEffect(() => {
    if (generatedCommands.length > 0) {
      setGeneratedCommands([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, groupId2, studentIds, studentIds2, txareaIds, txareaMultiStudents, txareaMultiGroups, txareaEspecStudents, txareaEspecGroups, alianza]);

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

  const handleClear = useCallback((isForm2 = false) => {
    setGeneratedCommands([]);
    if (showForm4) {
      setTxareaEspecStudents("");
      setTxareaEspecGroups("");
    } else if (showForm3) {
      setTxareaMultiStudents("");
      setTxareaMultiGroups("");
    } else if (isForm2) {
      setTxareaIds("");
      setGroupId2("");
      setStudentIds2(Array(minInputsForm2).fill(""));
    } else {
      setTxareaIds("");
      setGroupId("");
      setStudentIds(Array(minInputsForm1).fill(""));
    }
  }, [minInputsForm1, minInputsForm2, setGroupId, setGroupId2, setStudentIds, setStudentIds2, setTxareaIds, showForm3, setTxareaMultiStudents, setTxareaMultiGroups, showForm4, setTxareaEspecStudents, setTxareaEspecGroups]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showForm4) {
          handleClear(false);
        } else if (showForm3) {
          handleClear(false);
        } else {
          handleClear(showForm2);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm2, showForm3, showForm4, handleClear]);

  const BuscarId = (isForm2 = false) => {
    if (loading) {
      toast.info("Cargando base de datos, por favor espera...");
      return;
    }
    if (isForm2 && groupId2.trim() !== "") {
      const codigo = Number(groupId2.trim());
      const allianceId = alianza === "kuepa"
        ? "602169e217b5c8a27f9e9c06"
        : "6303ed663138387a1669d82a";

      const encontrado = usuariosCompletos.find(
        (user) => user.incremental_user_code === codigo && user.alliance_id?.$oid === allianceId
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

    const flatIds = Array.from(new Set(
      txareaIds
        .split(/\s+/)
        .map((e) => e.trim())
        .filter((e) => {
          const isCorrectLength = e.length >= 24 && e.length <= 26;
          const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(e);
          return isCorrectLength && isAlphanumeric;
        })
    ));

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

  const handleMultiGenerate = (isRemove = false) => {
    const validateIds = (text) => {
      if (!text || text.trim() === "") return { valid: false, ids: [], error: "vacío" };
      const ids = text.split(/\s+/).map(e => e.trim()).filter(e => e !== "");
      if (ids.length === 0) return { valid: false, ids: [], error: "vacío" };

      for (const id of ids) {
        const isCorrectLength = id.length >= 24 && id.length <= 26;
        const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(id);
        if (!isCorrectLength || !isAlphanumeric) {
          return { valid: false, ids: [], error: "inválido" };
        }
      }
      return { valid: true, ids };
    };

    const studentsValidation = validateIds(txareaMultiStudents);
    if (!studentsValidation.valid) {
      if (studentsValidation.error === "inválido") {
        showError("Hay registros no válidos que no se reconocen como ID en el campo de ESTUDIANTES.");
      } else {
        showError("Por favor ingrese al menos un ID de estudiante.");
      }
      return;
    }

    const groupsValidation = validateIds(txareaMultiGroups);
    if (!groupsValidation.valid) {
      if (groupsValidation.error === "inválido") {
        showError("Hay registros no válidos que no se reconocen como ID en el campo de GRUPOS.");
      } else {
        showError("Por favor ingrese al menos un ID de grupo.");
      }
      return;
    }

    if (studentsValidation.ids.length !== groupsValidation.ids.length) {
      showError(`La cantidad de estudiantes (${studentsValidation.ids.length}) no coincide con la cantidad de grupos (${groupsValidation.ids.length}).`);
      return;
    }

    const groupedStudents = {};
    studentsValidation.ids.forEach((studentId, index) => {
      const groupId = groupsValidation.ids[index];
      if (!groupedStudents[groupId]) {
        groupedStudents[groupId] = [];
      }
      groupedStudents[groupId].push(studentId);
    });

    const commands = [];
    const action = isRemove ? "pull:user:from:group" : "enroll:user";

    for (const [groupId, students] of Object.entries(groupedStudents)) {
      const studentsJoined = students.join('","');
      commands.push(`magik run:prod ${action}["${groupId}","${studentsJoined}"]`);
    }

    setGeneratedCommands(commands);
    showSuccess(`${commands.length} comando${commands.length !== 1 ? "s" : ""} generado${commands.length !== 1 ? "s" : ""}`);
  };

  const handleEspecGenerate = (isRemove = false) => {
    const validateIds = (text) => {
      if (!text || text.trim() === "") return { valid: false, ids: [], error: "vacío" };
      const rawIds = text.split(/\s+/).map(e => e.trim()).filter(e => e !== "");
      if (rawIds.length === 0) return { valid: false, ids: [], error: "vacío" };

      const ids = Array.from(new Set(rawIds));
      for (const id of ids) {
        const isCorrectLength = id.length >= 24 && id.length <= 26;
        const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(id);
        if (!isCorrectLength || !isAlphanumeric) {
          return { valid: false, ids: [], error: "inválido" };
        }
      }
      return { valid: true, ids };
    };

    const studentsValidation = validateIds(txareaEspecStudents);
    if (!studentsValidation.valid) {
      if (studentsValidation.error === "inválido") {
        showError("Hay registros no válidos que no se reconocen como ID en el campo de ESTUDIANTES.");
      } else {
        showError("Por favor ingrese al menos un ID de estudiante.");
      }
      return;
    }

    const groupsValidation = validateIds(txareaEspecGroups);
    if (!groupsValidation.valid) {
      if (groupsValidation.error === "inválido") {
        showError("Hay registros no válidos que no se reconocen como ID en el campo de GRUPOS.");
      } else {
        showError("Por favor ingrese al menos un ID de grupo.");
      }
      return;
    }

    const studentsJoined = studentsValidation.ids.join('","');
    const commands = groupsValidation.ids.map(groupId => {
      const action = isRemove ? "pull:user:from:group" : "enroll:user";
      return `magik run:prod ${action}["${groupId}","${studentsJoined}"]`;
    });

    setGeneratedCommands(commands);
    showSuccess(`${commands.length} comando${commands.length !== 1 ? "s" : ""} generado${commands.length !== 1 ? "s" : ""}`);
  };

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-content">
        {showForm1 && (
          <div className="inscripciones-form-container" style={{ marginTop: 0 }}>
            <div className="inscripciones-form">
              <div className="buscarIds">
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>ID del grupo académico</label>
                    <ClearButton onClick={() => handleClear(false)} title="Limpiar todo el formulario" />
                  </div>
                  <input
                    type="text"
                    id="groupId"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="inscripciones-input"
                    placeholder="Ej. 63e14e3af870ee0c8777b6a7"
                    style={{ borderColor: groupId.trim().length > 0 && groupId.trim().length < 24 ? "#ff4757" : undefined }}
                  />
                </div>
              </div>

              <div className="segmented-control">
                <button
                  className={`segmented-btn ${inputModeForm1 === 'paste' ? 'active' : ''}`}
                  onClick={() => setInputModeForm1('paste')}
                >
                  Pegar lista de IDs
                </button>
                <button
                  className={`segmented-btn ${inputModeForm1 === 'manual' ? 'active' : ''}`}
                  onClick={() => setInputModeForm1('manual')}
                >
                  Ingreso manual
                  {studentIds.filter(id => id.trim() !== "").length > 0 && (
                    <span style={{
                      background: inputModeForm1 === 'manual' ? "var(--primary)" : "var(--glass-border)",
                      color: inputModeForm1 === 'manual' ? "#090909" : "var(--on-surface-variant)",
                      padding: "2px 6px",
                      borderRadius: "100px",
                      fontSize: "10px",
                      marginLeft: "6px"
                    }}>
                      {studentIds.filter(id => id.trim() !== "").length}
                    </span>
                  )}
                </button>
              </div>

              {inputModeForm1 === 'manual' && (
                <div
                  className="inscripciones-grid"
                  style={{
                    maxHeight: "250px",
                    overflowY: "auto",
                    paddingRight: "8px",
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
                        style={{ borderColor: studentId.trim().length > 0 && studentId.trim().length < 24 ? "#ff4757" : undefined }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {inputModeForm1 === 'paste' && (
                <div className="input-wrapper" style={{ marginTop: "8px" }}>
                  <textarea
                    className="txareaids"
                    value={txareaIds}
                    onChange={(e) => setTxareaIds(e.target.value)}
                    onBlur={() => handleGenerate(false)}
                    style={{ minHeight: "150px" }}
                    placeholder="Pega aquí los IDs separados por espacios, comas o saltos de línea..."
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline-danger" onClick={() => handleRemove(false)}>
                <UserMinus size={18} /> Retirar
              </button>
              <button className="btn btn-primary" onClick={() => handleEnroll(false)}>
                <UserPlus size={18} /> Inscribir al grupo
              </button>
            </div>

            <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
          </div>
        )}

        {showForm2 && (
          <div className="inscripciones-form-container" style={{ marginTop: 0 }}>
            <div className="inscripciones-form">
              <div className="buscarIds">
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <label className="input-label" style={{ marginBottom: 0 }}>ID del estudiante</label>
                      <AllianceSwitcher
                        value={alianza}
                        onChange={(val) => {
                          if (alianza !== val) { handleClear(true); setAlianza(val); }
                        }}
                      />
                    </div>
                    <ClearButton onClick={() => handleClear(true)} title="Limpiar todo el formulario" />
                  </div>
                  {loading && (
                    <div style={{ marginBottom: '6px', color: '#eab308', fontSize: '11px', fontStyle: 'italic' }}>
                      Cargando base de datos...
                    </div>
                  )}
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
                    placeholder="Ej. 63e14e3af870ee0c8777b6a7"
                  />
                </div>
              </div>

              <div className="segmented-control">
                <button
                  className={`segmented-btn ${inputModeForm2 === 'paste' ? 'active' : ''}`}
                  onClick={() => setInputModeForm2('paste')}
                >
                  Pegar lista de IDs
                </button>
                <button
                  className={`segmented-btn ${inputModeForm2 === 'manual' ? 'active' : ''}`}
                  onClick={() => setInputModeForm2('manual')}
                >
                  Ingreso manual
                  {studentIds2.filter(id => id.trim() !== "").length > 0 && (
                    <span style={{
                      background: inputModeForm2 === 'manual' ? "var(--primary)" : "var(--glass-border)",
                      color: inputModeForm2 === 'manual' ? "#090909" : "var(--on-surface-variant)",
                      padding: "2px 6px",
                      borderRadius: "100px",
                      fontSize: "10px",
                      marginLeft: "6px"
                    }}>
                      {studentIds2.filter(id => id.trim() !== "").length}
                    </span>
                  )}
                </button>
              </div>

              {inputModeForm2 === 'manual' && (
                <div
                  className="inscripciones-grid"
                  style={{
                    maxHeight: "250px",
                    overflowY: "auto",
                    paddingRight: "8px",
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
                        style={{ borderColor: studentId.trim().length > 0 && studentId.trim().length < 24 ? "#ff4757" : undefined }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {inputModeForm2 === 'paste' && (
                <div className="input-wrapper" style={{ marginTop: "8px" }}>
                  <textarea
                    className="txareaids"
                    value={txareaIds}
                    onChange={(e) => setTxareaIds(e.target.value)}
                    onBlur={() => handleGenerate(true)}
                    style={{ minHeight: "150px" }}
                    placeholder="Pega aquí los IDs separados por espacios, comas o saltos de línea..."
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline-danger" onClick={() => handleRemove(true)}>
                <UserMinus size={18} /> Retirar
              </button>
              <button className="btn btn-primary" onClick={() => handleEnroll(true)}>
                <UserPlus size={18} /> Inscribir a grupos
              </button>
            </div>

            <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
          </div>
        )}

        {showForm3 && (
          <div className="inscripciones-form-container" style={{ marginTop: 0 }}>
            <div className="inscripciones-form">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Carga masiva por pares</label>
                <ClearButton onClick={() => handleClear(false)} title="Limpiar todo el formulario" />
              </div>
              <hr className="inscripciones-divider" style={{ marginTop: 0, marginBottom: "16px" }} />
              <div style={{ display: "flex", gap: "16px" }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <label className="input-label" style={{ marginBottom: "8px" }}>Lista de Estudiantes</label>
                  <textarea
                    className="txareaids"
                    value={txareaMultiStudents}
                    onChange={(e) => setTxareaMultiStudents(e.target.value)}
                    style={{ minHeight: "300px", resize: "vertical" }}
                    placeholder="Ingrese un ID por línea..."
                  />
                </div>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <label className="input-label" style={{ marginBottom: "8px" }}>Lista de Grupos</label>
                  <textarea
                    className="txareaids"
                    value={txareaMultiGroups}
                    onChange={(e) => setTxareaMultiGroups(e.target.value)}
                    style={{ minHeight: "300px", resize: "vertical" }}
                    placeholder="Ingrese un ID por línea..."
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                className="btn btn-outline-danger"
                onClick={() => handleMultiGenerate(true)}
              >
                <UserMinus size={18} /> Retirar estudiantes
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleMultiGenerate(false)}
              >
                <UserPlus size={18} /> Inscribir estudiantes
              </button>
            </div>

            <CommandsDisplay commands={generatedCommands} onClear={() => setGeneratedCommands([])} />
          </div>
        )}

        {showForm4 && (
          <div className="inscripciones-form-container" style={{ marginTop: 0 }}>
            <div className="inscripciones-form">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Carga combinada</label>
                <ClearButton onClick={() => handleClear(false)} title="Limpiar todo el formulario" />
              </div>
              <hr className="inscripciones-divider" style={{ marginTop: 0, marginBottom: "16px" }} />
              <div style={{ display: "flex", gap: "16px" }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <label className="input-label" style={{ marginBottom: "8px" }}>Lista de Estudiantes</label>
                  <textarea
                    className="txareaids"
                    value={txareaEspecStudents}
                    onChange={(e) => setTxareaEspecStudents(e.target.value)}
                    style={{ minHeight: "300px", resize: "vertical" }}
                    placeholder="Ingrese un ID por línea..."
                  />
                </div>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <label className="input-label" style={{ marginBottom: "8px" }}>Lista de Grupos</label>
                  <textarea
                    className="txareaids"
                    value={txareaEspecGroups}
                    onChange={(e) => setTxareaEspecGroups(e.target.value)}
                    style={{ minHeight: "300px", resize: "vertical" }}
                    placeholder="Ingrese un ID por línea..."
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                className="btn btn-outline-danger"
                onClick={() => handleEspecGenerate(true)}
              >
                <UserMinus size={18} /> Retirar estudiantes
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleEspecGenerate(false)}
              >
                <UserPlus size={18} /> Inscribir estudiantes
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
