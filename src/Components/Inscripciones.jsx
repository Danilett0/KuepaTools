import React, { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

// Componente ExcelReader integrado
function ExcelReader({ onDataRead, isVisible, onClose }) {
  const fileInputRef = React.useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Obtener la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Extraer datos de la primera columna que no estén vacíos
        const firstColumnData = jsonData
          .map(row => row[0]) // Obtener primera columna
          .filter(cell => cell !== undefined && cell !== null && cell !== '') // Filtrar valores vacíos
          .map(cell => String(cell).trim()) // Convertir a string y eliminar espacios
          .filter(cell => cell !== ''); // Filtrar strings vacíos después del trim
        
        console.log('Datos leídos del Excel:', firstColumnData);
        
        // Devolver los datos al componente padre
        onDataRead(firstColumnData);
        
        // Limpiar el input para permitir subir el mismo archivo de nuevo si es necesario
        event.target.value = '';
        
      } catch (error) {
        console.error('Error al leer el archivo Excel:', error);
        alert('Error al leer el archivo Excel. Asegúrate de que sea un archivo válido.');
      }
    };
    
    reader.readAsBinaryString(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center'
      }}>
        <h4 style={{ marginBottom: '20px', color: '#333' }}>
          Importar IDs desde Excel
        </h4>
        <p style={{ marginBottom: '25px', color: '#666', lineHeight: '1.5' }}>
          Selecciona un archivo Excel (.xlsx, .xls) que contenga los IDs en la primera columna.
          Se crearán automáticamente los campos de entrada necesarios según la cantidad de datos.
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={triggerFileUpload}
            style={{ padding: '10px 20px' }}
          >
            📁 Seleccionar archivo Excel
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '10px 20px' }}
          >
            Cancelar
          </button>
        </div>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '5px',
          fontSize: '14px',
          color: '#666'
        }}>
          <strong>Formato esperado:</strong><br />
          • Los IDs deben estar en la primera columna (A)<br />
          • Una ID por fila<br />
          • Se ignorarán las celdas vacías<br />
          • Se crearán campos dinámicamente según la cantidad de datos
        </div>
      </div>
    </div>
  );
}

function ComandosBemoInscripciones() {
  const [showForm1, setShowForm1] = useState(false);
  const [showForm2, setShowForm2] = useState(true); // Este DEBE estar en true
  const [groupId, setGroupId] = useState("");
  const [groupId2, setGroupId2] = useState("");
  const [studentIds, setStudentIds] = useState(Array(10).fill(""));
  const [studentIds2, setStudentIds2] = useState(Array(10).fill(""));
  const [minInputsForm1] = useState(10); // Mínimo de inputs para Form1
  const [minInputsForm2] = useState(10); // Mínimo de inputs para Form2
  const [generatedCommand, setGeneratedCommand] = useState("");
  const [generatedCommand2, setGeneratedCommand2] = useState("");
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

  const handleEnroll = (isForm2 = false) => {
    if (isForm2) {
      const estudiante = groupId2.trim();
      if (!estudiante) {
        alert("Por favor ingrese el ID del estudiante antes de generar el comando.");
        return;
      }
      const grupos = studentIds2.filter((id) => id.trim() !== "");
      if (grupos.length === 0) {
        alert("Por favor ingrese al menos un ID de grupo antes de generar el comando.");
        return;
      }
      const comandos = grupos
        .map((grupo) => `bemo run:prod enroll:user["${grupo}","${estudiante}"]`)
        .join("\n");
      setGeneratedCommand2(comandos);
    } else {
      const gId = groupId.trim();
      if (!gId) {
        alert("Por favor ingrese el ID del grupo académico antes de generar el comando.");
        return;
      }
      const filteredStudentIds = studentIds.filter((id) => id.trim() !== "");
      if (filteredStudentIds.length === 0) {
        alert("Por favor ingrese al menos un ID de estudiante antes de generar el comando.");
        return;
      }
      const command = `bemo run:prod enroll:user["${gId}","${filteredStudentIds.join(
        '","'
      )}"]`;
      setGeneratedCommand(command);
    }
  };

  const handleRemove = (isForm2 = false) => {
    if (isForm2) {
      const estudiante = groupId2.trim();
      if (!estudiante) {
        alert("Por favor ingrese el ID del estudiante antes de generar el comando.");
        return;
      }
      const grupos = studentIds2.filter((id) => id.trim() !== "");
      if (grupos.length === 0) {
        alert("Por favor ingrese al menos un ID de grupo antes de generar el comando.");
        return;
      }
      const comandos = grupos
        .map(
          (grupo) =>
            `bemo run:prod pull:user:from:group["${grupo}","${estudiante}"]`
        )
        .join("\n");
      setGeneratedCommand2(comandos);
    } else {
      const gId = groupId.trim();
      if (!gId) {
        alert("Por favor ingrese el ID del grupo académico antes de generar el comando.");
        return;
      }
      const filteredStudentIds = studentIds.filter((id) => id.trim() !== "");
      if (filteredStudentIds.length === 0) {
        alert("Por favor ingrese al menos un ID de estudiante antes de generar el comando.");
        return;
      }
      const command = `bemo run:prod pull:user:from:group["${gId}","${filteredStudentIds.join(
        '","'
      )}"]`;
      setGeneratedCommand(command);
    }
  };

  const handleClear = (isForm2 = false) => {
    if (isForm2) {
      setGroupId2("");
      setStudentIds2(Array(minInputsForm2).fill(""));
      setGeneratedCommand2("");
    } else {
      setGroupId("");
      setStudentIds(Array(minInputsForm1).fill(""));
      setGeneratedCommand("");
    }
  };

  const handleExcelExport = (isForm2 = false) => {
    setCurrentForm(isForm2);
    setShowExcelReader(true);
  };

  const handleExcelDataRead = (data) => {
    console.log('Datos recibidos del Excel:', data);
    
    if (currentForm) {
      // Form2: Los datos van a studentIds2 (IDs de grupos)
      const requiredInputs = Math.max(data.length, minInputsForm2);
      const newStudentIds2 = Array(requiredInputs).fill("");
      
      data.forEach((id, index) => {
        newStudentIds2[index] = id;
      });
      
      setStudentIds2(newStudentIds2);
      alert(`Se importaron ${data.length} registros correctamente. Se crearon ${requiredInputs} campos de entrada.`);
      
    } else {
      // Form1: Los datos van a studentIds (IDs de estudiantes)
      const requiredInputs = Math.max(data.length, minInputsForm1);
      const newStudentIds = Array(requiredInputs).fill("");
      
      data.forEach((id, index) => {
        newStudentIds[index] = id;
      });
      
      setStudentIds(newStudentIds);
      alert(`Se importaron ${data.length} registros correctamente. Se crearon ${requiredInputs} campos de entrada.`);
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
            className="btn btn-primary btn-lg"
            style={{ opacity: showForm2 ? '1' : '0.5', transition: 'opacity 0.3s ease' }}
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
            className="btn btn-primary btn-lg"
            style={{ opacity: showForm1 ? '1' : '0.5', transition: 'opacity 0.3s ease' }}
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
                  maxHeight: studentIds.length > 20 ? '400px' : 'auto',
                  overflowY: studentIds.length > 20 ? 'auto' : 'visible',
                  border: studentIds.length > 20 ? '1px solid #ddd' : 'none',
                  borderRadius: studentIds.length > 20 ? '5px' : '0',
                  padding: studentIds.length > 20 ? '10px' : '0'
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
                style={{ opacity: !generatedCommand || generatedCommand.includes('enroll:user') ? '1' : '0.7', transition: 'opacity 0.3s ease' }}
              >
                Inscribir estudiantes al grupo
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleRemove(false)}
                style={{ opacity: !generatedCommand || generatedCommand.includes('pull:user:from:group') ? '1' : '0.7', transition: 'opacity 0.3s ease' }}
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
            {generatedCommand && (
              <div className="command-output">
                <strong>Comando generado:</strong>
                <p className="command-text">{generatedCommand}</p>
              </div>
            )}
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
                  maxHeight: studentIds2.length > 20 ? '400px' : 'auto',
                  overflowY: studentIds2.length > 20 ? 'auto' : 'visible',
                  border: studentIds2.length > 20 ? '1px solid #ddd' : 'none',
                  borderRadius: studentIds2.length > 20 ? '5px' : '0',
                  padding: studentIds2.length > 20 ? '10px' : '0'
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
                style={{ opacity: !generatedCommand2 || generatedCommand2.includes('enroll:user') ? '1' : '0.7', transition: 'opacity 0.3s ease' }}
              >
                Generar comandos para inscribirlos
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleRemove(true)}
                style={{ opacity: !generatedCommand2 || generatedCommand2.includes('pull:user:from:group') ? '1' : '0.7', transition: 'opacity 0.3s ease' }}
              >
                Generar comandos para sacarlo
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
            {generatedCommand2 && (
              <div className="command-output">
                <strong>Comando generado:</strong>
                <p className="command-text">{generatedCommand2}</p>
              </div>
            )}
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