import "./Styles/styles.css";
import { useState } from "react";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Users, RefreshCw, BarChart2, Search, BookOpen, GraduationCap } from "lucide-react";
import Sidebar from "./Components/Sidebar.jsx";
import AppRouter from "./Components/AppRouter.jsx";

const NAV_ITEMS = [
  {
    id: "inscripciones",
    label: "Inscripciones",
    icon: Users,
    subItems: [
      { id: "inscripciones-estudiante", label: "Inscribir grupos a un estudiante" },
      { id: "inscripciones-grupo", label: "Inscribir varios estudiantes a un grupo" },
      { id: "inscripciones-multi", label: "Inscribir varios estudiantes a varios grupos" },
      { id: "inscripciones-especificos", label: "Varios estudiantes a grupos específicos" },
    ],
  },
  { id: "cambios-estado", label: "Cambios de Estado", icon: RefreshCw },
  { id: "auditar-estadisticas", label: "Auditar Estadísticas", icon: BarChart2 },
  { id: "buscar-id", label: "Búscar ID Estudiantes", icon: Search },
  { id: "programas-estudiante", label: "Programas Estudiante", icon: BookOpen },
  {
    id: "herramientas-academicos",
    label: "Grupos",
    icon: GraduationCap,
    subItems: [
      { id: "herramientas-undo", label: "Deshacer Publicación" },
      { id: "herramientas-final", label: "Re-calcular Nota Estudiante" },
      { id: "herramientas-extraer", label: "Extraer Grupos académicos" },
    ],
  },
];

function App() {
  const [activeComponent, setActiveComponent] = useState("inscripciones-estudiante");
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleConfirmClear = () => {
    localStorage.clear();
    setShowClearModal(false);
    toast.success("Storage limpiado. Recargando...", { autoClose: 3000 });
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="app-wrapper">
      <Sidebar
        activeComponent={activeComponent}
        expandedMenu={expandedMenu}
        showClearModal={showClearModal}
        setActiveComponent={setActiveComponent}
        setExpandedMenu={setExpandedMenu}
        setShowClearModal={setShowClearModal}
        onConfirmClear={handleConfirmClear}
        navItems={NAV_ITEMS}
      />

      <main className="main-content">
        <div
          className="app-container"
          style={activeComponent === "informacion" ? { maxWidth: "100%", height: "100%" } : {}}
        >
          <AppRouter activeComponent={activeComponent} />
        </div>
      </main>

      <ToastContainer
        theme="dark"
        toastStyle={{
          background: "var(--surface-low)",
          color: "var(--on-surface)",
          borderRadius: "12px",
          border: "1px solid var(--glass-border)",
        }}
      />
    </div>
  );
}

export default App;