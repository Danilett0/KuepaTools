import "./Styles/styles.css";
import { useState, useEffect, useRef } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CambiosEstadoBemo from "./Components/CambioEstados.jsx";
import AuditarEstadisticas from "./Components/AuditarEstadisticas.jsx";
import Inscripciones from "./Components/Inscripciones.jsx";
import EnvioComandos from "./Components/EnvioComandos.jsx";
import Lottie from "lottie-react";
import groovyWalkAnimation from "./medit.json";

function App() {
  const [activeComponent, setActiveComponent] = useState("inscripciones");
  const [showFunctionsMenu, setShowFunctionsMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowFunctionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderComponent = () => {
    switch (activeComponent) {
      case "inscripciones":
        return <Inscripciones />;
      case "cambios-estado":
        return <CambiosEstadoBemo />;
      case "auditar-estadisticas":
        return <AuditarEstadisticas />;
      case "envio-comandos":
        return <EnvioComandos />;
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
      <div style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          display: "flex",
          gap: "10px",
          alignItems: "center"
        }}
        ref={menuRef}
      >
        <div
          onClick={() => setShowFunctionsMenu(!showFunctionsMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        >
          <span style={{ fontWeight: '500' }}>Funcionalidades BEMO</span>
          <i className="fas fa-chevron-down" style={{ fontSize: '12px' }} />
        </div>

        {showFunctionsMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            marginTop: '8px',
            backgroundColor: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            padding: '8px 0',
            minWidth: '200px',
          }}>
            <div
              onClick={() => {
                setActiveComponent("inscripciones");
                setShowFunctionsMenu(false);
              }}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                backgroundColor: activeComponent === "inscripciones" ? '#f8f9fa' : 'transparent',
                color: activeComponent === "inscripciones" ? '#0056b3' : '#333',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = activeComponent === "inscripciones" ? '#f8f9fa' : 'transparent'}
            >
              <i className="fas fa-users" style={{ marginRight: '8px' }} />
              Inscripciones a Grupos
            </div>
            <div
              onClick={() => {
                setActiveComponent("cambios-estado");
                setShowFunctionsMenu(false);
              }}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                backgroundColor: activeComponent === "cambios-estado" ? '#f8f9fa' : 'transparent',
                color: activeComponent === "cambios-estado" ? '#0056b3' : '#333',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = activeComponent === "cambios-estado" ? '#f8f9fa' : 'transparent'}
            >
              <i className="fas fa-exchange-alt" style={{ marginRight: '8px' }} />
              Cambios de Estado
            </div>
            <div
              onClick={() => {
                setActiveComponent("auditar-estadisticas");
                setShowFunctionsMenu(false);
              }}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                backgroundColor: activeComponent === "auditar-estadisticas" ? '#f8f9fa' : 'transparent',
                color: activeComponent === "auditar-estadisticas" ? '#0056b3' : '#333',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = activeComponent === "auditar-estadisticas" ? '#f8f9fa' : 'transparent'}
            >
              <i className="fas fa-chart-line" style={{ marginRight: '8px' }} />
              Auditar Estadísticas
            </div>
            <div
              onClick={() => {
                setActiveComponent("envio-comandos");
                setShowFunctionsMenu(false);
              }}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                backgroundColor: activeComponent === "envio-comandos" ? '#f8f9fa' : 'transparent',
                color: activeComponent === "envio-comandos" ? '#0056b3' : '#333',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = activeComponent === "envio-comandos" ? '#f8f9fa' : 'transparent'}
            >
              <i className="fas fa-terminal" style={{ marginRight: '8px' }} />
              Envio Comandos Libre
            </div>
          </div>
        )}
      </div>

      <Lottie
        style={{ right: "80px" }}
        className="Lotty"
        animationData={groovyWalkAnimation}
        loop={true}
        speed={0.3}
      />

      <div className="app-container" style={{ marginTop: '5%' }}>
        {renderComponent()}
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;