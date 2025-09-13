import "./Styles/styles.css";
import React, { useState } from "react";
import CambiosEstadoBemo from "./Components/CambioEstados.jsx";
import AuditarEstadisticas from "./Components/AuditarEstadisticas.jsx";
import Inscripciones from "./Components/Inscripciones.jsx";
import Login from "./Components/Login.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Lottie from "lottie-react";
import groovyWalkAnimation from "./medit.json";

function AppContent() {
  const { isAuthenticated, logout } = useAuth();
  const [activeComponent, setActiveComponent] = useState("inscripciones");

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleLogout = () => {
    logout();
  };

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
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          padding: "8px 16px",
          backgroundColor: "#dc3545",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          zIndex: 1000,
          fontWeight: "bold",
          transition: "background-color 0.3s ease",
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
        onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
      >
        Cerrar Sesión
      </button>
      
      <Lottie style={{left: "20px"}} className="Lotty" animationData={groovyWalkAnimation} loop={true} />

      <div className="nav-buttons">
        <button
          onClick={() => setActiveComponent("inscripciones")}
          className="nav-button nav-button-primary"
          style={{
            opacity: activeComponent === "inscripciones" ? "1" : "0.5",
            transition: "opacity 0.3s ease",
          }}
        >
          Inscribsiones a Grupos
        </button>
        <button
          onClick={() => setActiveComponent("cambios-estado")}
          className="nav-button nav-button-success"
          style={{
            opacity: activeComponent === "cambios-estado" ? "1" : "0.5",
            transition: "opacity 0.3s ease",
          }}
        >
          Cambios de Estado
        </button>
        <button
          onClick={() => setActiveComponent("auditar-estadisticas")}
          className="nav-button nav-button-warning"
          style={{
            opacity: activeComponent === "auditar-estadisticas" ? "1" : "0.7",
            transition: "opacity 0.3s ease",
          }}
        >
          Auditar Estadísticas
        </button>
      </div>

      <Lottie style={{right: "20px"}} className="Lotty" animationData={groovyWalkAnimation} loop={true} />

      <div className="app-container">
        <div
          onClick={() => setActiveComponent("inscripciones")}
          className="home-link"
          style={{ cursor: "pointer" }}
        ></div>

        {renderComponent()}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
