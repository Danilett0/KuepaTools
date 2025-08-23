import "./App.css";
import "./Styles/styles.css";
import React, { useState } from "react";
import CambiosEstadoBemo from "./Components/CambioEstados.jsx";
import AuditarEstadisticas from "./Components/AuditarEstadisticas.jsx";
import Inscripciones from "./Components/Inscripciones.jsx";

function App() {
  // Cambiar el estado inicial a "inscripciones" para que coincida con el default
  const [activeComponent, setActiveComponent] = useState("inscripciones");

  const renderComponent = () => {
    
    switch (activeComponent) {
      case "inscripciones":
        return <Inscripciones />;
      case "cambios-estado":
        return <CambiosEstadoBemo />;
      case "auditar-estadisticas":
        return <AuditarEstadisticas />;
      default:
        return <Inscripciones />;
    }
  };

  return (
    <div className="body">
      <div className="app-container">
        <div
          onClick={() => setActiveComponent("inscripciones")}
          className="home-link"
          style={{ cursor: "pointer" }}
        >
          <h1 className="app-title">Generador de comandos <br/> Bemo 😎</h1>
        </div>
        <div className="nav-buttons">
          <button
            onClick={() => setActiveComponent("inscripciones")}
            className="nav-button nav-button-primary"
            style={{ 
              opacity: activeComponent === "inscripciones" ? '1' : '0.5',
              transition: 'opacity 0.3s ease'
            }}
          >
            Inscribir | Eliminar Estudiantes de Grupos
          </button>
          <button
            onClick={() => setActiveComponent("cambios-estado")}
            className="nav-button nav-button-success"
            style={{ 
              opacity: activeComponent === "cambios-estado" ? '1' : '0.5',
              transition: 'opacity 0.3s ease'
            }}
          >
            Cambios de Estado y Estadísticas
          </button>
          <button
            onClick={() => setActiveComponent("auditar-estadisticas")}
            className="nav-button nav-button-warning"
            style={{ 
              opacity: activeComponent === "auditar-estadisticas" ? '1' : '0.7',
              transition: 'opacity 0.3s ease'
            }}
          >
            Auditar Estadísticas
          </button>
        </div>
        {renderComponent()}
      </div>
    </div>
  );
}

export default App;