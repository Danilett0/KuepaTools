import "./Styles/styles.css";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CambiosEstadoBemo from "./Components/CambioEstados.jsx";
import AuditarEstadisticas from "./Components/AuditarEstadisticas.jsx";
import Inscripciones from "./Components/Inscripciones.jsx";
import Informacion from "./Components/Informacion.jsx";
import BuscarIdInc from "./Components/BuscarIdInc.jsx";
import Lottie from "lottie-react";
import groovyWalkAnimation from "./medit.json";
import { Users, RefreshCw, BarChart2, Shield, ChevronDown, ChevronRight, Info, Search } from "lucide-react";

function App() {
  const [activeComponent, setActiveComponent] = useState("inscripciones-estudiante");
  const [expandedMenu, setExpandedMenu] = useState("inscripciones");

  const renderComponent = () => {
    switch (activeComponent) {
      case "inscripciones-estudiante":
        return <Inscripciones key="inscripciones-estudiante" formType="estudiante" />;
      case "inscripciones-grupo":
        return <Inscripciones key="inscripciones-grupo" formType="grupo" />;
      case "inscripciones-multi":
        return <Inscripciones key="inscripciones-multi" formType="multi" />;
      case "inscripciones-especificos":
        return <Inscripciones key="inscripciones-especificos" formType="especificos" />;
      case "cambios-estado":
        return <CambiosEstadoBemo key="cambios-estado" />;
      case "auditar-estadisticas":
        return <AuditarEstadisticas key="auditar-estadisticas" />;
      case "informacion":
        return <Informacion key="informacion" />;
      case "buscar-id":
        return <BuscarIdInc key="buscar-id" />;
      default:
        return <Inscripciones key="default" formType="estudiante" />;
    }
  };

  const navItems = [
    { 
      id: "inscripciones", 
      label: "Inscripciones", 
      icon: Users,
      subItems: [
        { id: "inscripciones-estudiante", label: "Inscribir grupos a un estudiante" },
        { id: "inscripciones-grupo", label: "Inscribir varios estudiantes a un grupo" },
        { id: "inscripciones-multi", label: "Inscribir varios estudiantes a varios grupos" },
        { id: "inscripciones-especificos", label: "Varios estudiantes a grupos específicos" }
      ]
    },
    { id: "cambios-estado", label: "Cambios de Estado", icon: RefreshCw },
    { id: "auditar-estadisticas", label: "Auditar Estadísticas", icon: BarChart2 },
    { id: "buscar-id", label: "Buscar ID por INC", icon: Search },
  ];

  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="sidebar-title">
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#090909' }}>
            <Shield size={24} />
          </div>
          KuepaTools
        </div>
        <div className="sidebar-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedMenu === item.id;
            const isActive = activeComponent.startsWith(item.id) || activeComponent === item.id;

            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  className={`sidebar-item ${isActive && !item.subItems ? 'active' : ''}`}
                  style={item.subItems && isActive ? { color: 'var(--primary)' } : {}}
                  onClick={() => {
                    if (item.subItems) {
                      setExpandedMenu(isExpanded ? null : item.id);
                      if (!isExpanded && !activeComponent.startsWith(item.id)) {
                        setActiveComponent(item.subItems[0].id);
                      }
                    } else {
                      setActiveComponent(item.id);
                      setExpandedMenu(null);
                    }
                  }}
                >
                  <Icon size={20} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.subItems && (
                    isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  )}
                </div>
                {item.subItems && isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '28px', marginTop: '4px' }}>
                    {item.subItems.map((sub) => (
                      <div
                        key={sub.id}
                        className={`sidebar-item ${activeComponent === sub.id ? 'active' : ''}`}
                        style={{ padding: '10px 16px', fontSize: '13px' }}
                        onClick={() => setActiveComponent(sub.id)}
                      >
                        {sub.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="sidebar-bottom" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
          <div
            className={`sidebar-item ${activeComponent === 'informacion' ? 'active' : ''}`}
            onClick={() => {
              setActiveComponent('informacion');
              setExpandedMenu(null);
            }}
          >
            <Info size={20} />
            <span style={{ flex: 1 }}>Información</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Lottie
          className="Lotty"
          animationData={groovyWalkAnimation}
          loop={true}
          speed={0.3}
        />
        <div className="app-container" style={activeComponent === 'informacion' ? { maxWidth: '100%', height: '100%' } : {}}>
          {renderComponent()}
        </div>
      </main>

      <ToastContainer theme="dark" toastStyle={{ background: 'var(--surface-low)', color: 'var(--on-surface)', borderRadius: '12px', border: '1px solid var(--glass-border)' }} />
    </div>
  );
}

export default App;