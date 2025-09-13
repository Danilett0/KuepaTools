import React from "react";
import * as XLSX from "xlsx";

function ExcelReader({ onDataRead, isVisible, onClose }) {
  const fileInputRef = React.useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // Obtener la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Extraer datos de la primera columna que no estén vacíos
        const firstColumnData = jsonData
          .map((row) => row[0]) // Obtener primera columna
          .filter((cell) => cell !== undefined && cell !== null && cell !== "") // Filtrar valores vacíos
          .map((cell) => String(cell).trim()) // Convertir a string y eliminar espacios
          .filter((cell) => cell !== "" && cell !== "_id"); // Filtra vacíos Y "_id"

        console.log("Datos leídos del Excel:", firstColumnData);

        // Devolver los datos al componente padre
        onDataRead(firstColumnData);

        // Limpiar el input para permitir subir el mismo archivo de nuevo si es necesario
        event.target.value = "";
      } catch (error) {
        console.error("Error al leer el archivo Excel:", error);
        alert(
          "Error al leer el archivo Excel. Asegúrate de que sea un archivo válido."
        );
      }
    };

    reader.readAsBinaryString(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          maxWidth: "500px",
          width: "90%",
          textAlign: "center",
        }}
      >
        <h4 style={{ marginBottom: "20px", color: "#333" }}>
          Importar IDs desde Excel
        </h4>
        <p style={{ marginBottom: "25px", color: "#666", lineHeight: "1.5" }}>
          Selecciona un archivo Excel (.xlsx, .xls) que contenga los IDs en la
          primera columna. Se crearán automáticamente los campos de entrada
          necesarios según la cantidad de datos.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        <div style={{ display: "flex", gap: "10px", flexDirection: "column", width: "100%" }}>
          <button
            className="btn btn-primary"
            onClick={triggerFileUpload}
            style={{ padding: "10px 20px" }}
          >
            📁 Seleccionar archivo Excel
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: "10px 20px", backgroundColor: "#dc4646" }}
          >
            Cancelar
          </button>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#f8f9fa",
            borderRadius: "5px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          <strong>Formato esperado:</strong>
          <br />
          • Los IDs deben estar en la primera columna (A)
          <br />
          • Una ID por fila
          <br />
          • Se ignorarán las celdas vacías
          <br />• Se crearán campos dinámicamente según la cantidad de datos
        </div>
      </div>
    </div>
  );
}

export default ExcelReader;
