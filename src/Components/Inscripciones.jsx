import React, { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import ExcelReader from "./ExcelReader";
import { sendCommands } from "../services/apiService";
import { showSuccess, showError } from "../services/toastService";
// Componente ExcelReader integrado

function ComandosBemoInscripciones() {
  const [showForm1, setShowForm1] = useState(false);
  const [showForm2, setShowForm2] = useState(true); // Este DEBE estar en true
  const [groupId, setGroupId] = useState("");
  const [groupId2, setGroupId2] = useState("");
  const [studentIds, setStudentIds] = useState(Array(10).fill(""));
  const [studentIds2, setStudentIds2] = useState(Array(10).fill(""));
  const [minInputsForm1] = useState(10); // Mínimo de inputs para Form1
  const [minInputsForm2] = useState(10); // Mínimo de inputs para Form2

  const [showExcelReader, setShowExcelReader] = useState(false);
  const [currentForm, setCurrentForm] = useState(null); // Para saber cuál formulario está activo

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

  const handleEnroll = async (isForm2 = false) => {
    if (isForm2) {
      const estudiante = groupId2.trim();
      if (!estudiante) {
        showError(
          "Por favor ingrese el ID del estudiante antes de generar el comando."
        );
        return;
      }
      const grupos = studentIds2.filter((id) => id.trim() !== "");
      if (grupos.length === 0) {
        showError(
          "Por favor ingrese al menos un ID de grupo antes de generar el comando."
        );
        return;
      }
      const comandos = grupos.map(
        (grupo) => `magik run:prod enroll:user["${grupo}","${estudiante}"]`
      );

      const result = await sendCommands(comandos);
      if (result.success) {
        showSuccess("Comandos enviados exitosamente");
        handleClear(true);
      } else {
        showError("Error al enviar los comandos: " + result.error);
      }
    } else {
      const gId = groupId.trim();
      if (!gId) {
        showError(
          "Por favor ingrese el ID del grupo académico antes de generar el comando."
        );
        return;
      }
      const filteredStudentIds = studentIds.filter((id) => id.trim() !== "");
      if (filteredStudentIds.length === 0) {
        showError(
          "Por favor ingrese al menos un ID de estudiante antes de generar el comando."
        );
        return;
      }
      const command = ` magik run:prod enroll:user["${gId}","${filteredStudentIds.join(
        '","'
      )}"]`;

      const result = await sendCommands([command]);
      if (result.success) {
        showSuccess("Comando enviado exitosamente");
        handleClear(false);
      } else {
        showError("Error al enviar el comando: " + result.error);
      }
    }
  };

  const handleRemove = async (isForm2 = false) => {
    if (isForm2) {
      const estudiante = groupId2.trim();
      if (!estudiante) {
        showError(
          "Por favor ingrese el ID del estudiante antes de generar el comando."
        );
        return;
      }
      const grupos = studentIds2.filter((id) => id.trim() !== "");
      if (grupos.length === 0) {
        showError(
          "Por favor ingrese al menos un ID de grupo antes de generar el comando."
        );
        return;
      }
      const comandos = grupos.map(
        (grupo) =>
          ` magik run:prod pull:user:from:group["${grupo}","${estudiante}"]`
      );

      const result = await sendCommands(comandos);
      if (result.success) {
        showSuccess("Comandos enviados exitosamente");
        handleClear(true);
      } else {
        showError("Error al enviar los comandos: " + result.error);
      }
    } else {
      const gId = groupId.trim();
      if (!gId) {
        showError(
          "Por favor ingrese el ID del grupo académico antes de generar el comando."
        );
        return;
      }
      const filteredStudentIds = studentIds.filter((id) => id.trim() !== "");
      if (filteredStudentIds.length === 0) {
        showError(
          "Por favor ingrese al menos un ID de estudiante antes de generar el comando."
        );
        return;
      }
      const command = ` magik run:prod pull:user:from:group["${gId}","${filteredStudentIds.join(
        '","'
      )}"]`;

      const result = await sendCommands([command]);
      if (result.success) {
        showSuccess("Comando enviado exitosamente");
        handleClear(false);
      } else {
        showError("Error al enviar el comando: " + result.error);
      }
    }
  };

  const handleClear = (isForm2 = false) => {
    if (isForm2) {
      setGroupId2("");
      setStudentIds2(Array(minInputsForm2).fill(""));
    } else {
      setGroupId("");
      setStudentIds(Array(minInputsForm1).fill(""));
    }
  };

  const handleExcelExport = (isForm2 = false) => {
    setCurrentForm(isForm2);
    setShowExcelReader(true);
  };

  const handleExcelDataRead = (data) => {
    console.log("Datos recibidos del Excel:", data);

    if (currentForm) {
      // Form2: Los datos van a studentIds2 (IDs de grupos)
      const requiredInputs = Math.max(data.length, minInputsForm2);
      const newStudentIds2 = Array(requiredInputs).fill("");

      data.forEach((id, index) => {
        newStudentIds2[index] = id;
      });

      setStudentIds2(newStudentIds2);
      showSuccess(
        `Se importaron ${data.length} registros correctamente. Se crearon ${requiredInputs} campos de entrada.`
      );
    } else {
      // Form1: Los datos van a studentIds (IDs de estudiantes)
      const requiredInputs = Math.max(data.length, minInputsForm1);
      const newStudentIds = Array(requiredInputs).fill("");

      data.forEach((id, index) => {
        newStudentIds[index] = id;
      });

      setStudentIds(newStudentIds);
      showSuccess(
        `Se importaron ${data.length} registros correctamente. Se crearon ${requiredInputs} campos de entrada.`
      );
    }

    setShowExcelReader(false);
    setCurrentForm(null);
  };

  const closeExcelReader = () => {
    setShowExcelReader(false);
    setCurrentForm(null);
  };

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-content">
        <div className="inscripciones-buttons-main">
          <button
            className="btn btn-black btn-lg"
            style={{
              opacity: showForm2 ? "1" : "0.5",
              transition: "opacity 0.3s ease",
            }}
            onClick={() => {
              if (!showForm2) {
                setShowForm2(true);
                setShowForm1(false);
              }
            }}
          >
            Inscribir grupos a un estudiante
          </button>
          <button
            className="btn btn-black btn-lg"
            style={{
              opacity: showForm1 ? "1" : "0.5",
              transition: "opacity 0.3s ease",
            }}
            onClick={() => {
              if (!showForm1) {
                setShowForm1(true);
                setShowForm2(false);
              }
            }}
          >
            Incribir varios estudiantes a un grupo
          </button>
        </div>
        {showForm1 && (
          <div className="inscripciones-form-container">
            <h5 className="inscripciones-title">
              Ingrese el grupo academico, seguido de los estudiantes que desea
              inscribirle o retirarle
            </h5>
            <div className="inscripciones-form">
              <input
                type="text"
                id="groupId"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="inscripciones-input"
                placeholder="ID GRUPO ACADEMICO"
              />
              <hr className="inscripciones-divider" />
              <div
                className="inscripciones-grid"
                style={{
                  maxHeight: studentIds.length > 20 ? "400px" : "auto",
                  overflowY: studentIds.length > 20 ? "auto" : "visible",
                  border: studentIds.length > 20 ? "1px solid #ddd" : "none",
                  borderRadius: studentIds.length > 20 ? "5px" : "0",
                  padding: studentIds.length > 20 ? "10px" : "0",
                }}
              >
                {studentIds.map((studentId, index) => (
                  <input
                    key={index}
                    type="text"
                    id={`studentId-${index}`}
                    value={studentId}
                    onChange={(e) =>
                      handleStudentIdChange(index, e.target.value)
                    }
                    className="inscripciones-input"
                    placeholder="ID Estudiante"
                  />
                ))}
              </div>
            </div>
            <div className="inscripciones-buttons">
              <button
                className="btn btn-primary"
                onClick={() => handleEnroll(false)}
                style={{
                  transition: "opacity 0.3s ease",
                }}
              >
                Inscribir estudiantes al grupo
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleRemove(false)}
                style={{
                  transition: "opacity 0.3s ease",
                }}
              >
                Eliminar estudiantes del grupo
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleExcelExport(false)}
                style={{ flex: "none", padding: "8px 12px" }}
                title="Importar IDs de estudiantes desde Excel"
              >
                <FileSpreadsheet size={20} />
              </button>
              <button
                className="btn btn-warning"
                onClick={() => handleClear(false)}
                style={{ flex: "none" }}
              >
                🧹
              </button>
            </div>
          </div>
        )}

        {showForm2 && (
          <div className="inscripciones-form-container">
            <h5 className="inscripciones-title">
              Ingrese el estudiante al cual desea inscribirle o retirarle grupos
              academicos
            </h5>

            <div className="inscripciones-form">
              <input
                type="text"
                id="groupId2"
                value={groupId2}
                onChange={(e) => setGroupId2(e.target.value)}
                className="inscripciones-input"
                placeholder="ID Estudiante"
              />
              <hr className="inscripciones-divider" />
              <div
                className="inscripciones-grid"
                style={{
                  maxHeight: studentIds2.length > 20 ? "400px" : "auto",
                  overflowY: studentIds2.length > 20 ? "auto" : "visible",
                  border: studentIds2.length > 20 ? "1px solid #ddd" : "none",
                  borderRadius: studentIds2.length > 20 ? "5px" : "0",
                  padding: studentIds2.length > 20 ? "10px" : "0",
                }}
              >
                {studentIds2.map((studentId, index) => (
                  <input
                    key={index}
                    type="text"
                    id={`studentId2-${index}`}
                    value={studentId}
                    onChange={(e) =>
                      handleStudentIdChange(index, e.target.value, true)
                    }
                    className="inscripciones-input"
                    placeholder="ID Grupo"
                  />
                ))}
              </div>
            </div>
            <div className="inscripciones-buttons">
              <button
                className="btn btn-primary"
                onClick={() => handleEnroll(true)}
              >
                Inscribir estudiante a grupos
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleRemove(true)}
              >
                Retirar estudiante de grupos
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleExcelExport(true)}
                style={{ flex: "none", padding: "8px 12px" }}
                title="Importar IDs de grupos desde Excel"
              >
                <FileSpreadsheet size={20} />
              </button>
              <button
                className="btn btn-warning"
                onClick={() => handleClear(true)}
                style={{ flex: "none" }}
              >
                🧹
              </button>
            </div>
          </div>
        )}
      </div>

      <ExcelReader
        isVisible={showExcelReader}
        onDataRead={handleExcelDataRead}
        onClose={closeExcelReader}
      />
    </div>
  );
}

export default ComandosBemoInscripciones;
