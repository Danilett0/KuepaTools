import "./Styles/styles.css";
import { useState } from "react";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Users, RefreshCw, BarChart2, Search, BookOpen, GraduationCap, Bot, Database } from "lucide-react";
import { useEffect } from "react";
import Sidebar from "./Components/Sidebar.jsx";
import AppRouter from "./Components/AppRouter.jsx";
import KuepaCommandPalette from "./Components/ui/KuepaCommandPalette.jsx";
import Login from "./Components/Login.jsx";
import ResetPassword from "./Components/ResetPassword.jsx";
import { useAppStore } from "./store/useAppStore.js";

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
      { id: "herramientas-estudiante", label: "Grupos por estudiante" },
    ],
  },
];

function App() {
  const activeComponent = useAppStore(state => state.activeComponent);
  const setShowClearModal = useAppStore(state => state.setShowClearModal);
  const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Use Alt + K (Option + K on Mac) instead of Ctrl + K to avoid browser conflicts
      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  useEffect(() => {
    const cleanup = useAppStore.getState().initializeAuth();
    return cleanup;
  }, []);

  const handleConfirmClear = () => {
    localStorage.clear();
    setShowClearModal(false);
    toast.success("Storage limpiado. Recargando...", { autoClose: 3000 });
    setTimeout(() => window.location.reload(), 1500);
  };

  const session = useAppStore(state => state.session);
  const isAuthInitialized = useAppStore(state => state.isAuthInitialized);
  const isPasswordRecovery = useAppStore(state => state.isPasswordRecovery);
  const userRole = useAppStore(state => state.userRole);

  if (!isAuthInitialized) {
    return <div style={{ height: '100vh', width: '100vw', background: 'var(--surface-void)' }} />; // Avoid flashing the login page while fetching session
  }

  if (isPasswordRecovery) {
    return (
      <>
        <ResetPassword />
        <ToastContainer
          theme="dark"
          toastStyle={{
            background: "var(--surface-low)",
            color: "var(--on-surface)",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
          }}
        />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Login />
        <ToastContainer
          theme="dark"
          toastStyle={{
            background: "var(--surface-low)",
            color: "var(--on-surface)",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
          }}
        />
      </>
    );
  }

  return (
    <div className="app-wrapper">
      <Sidebar
        onConfirmClear={handleConfirmClear}
        navItems={NAV_ITEMS}
      />

      <main className="main-content">
        {userRole === 'admin' && <KuepaCommandPalette />}
        <div
          className="app-container"
          style={activeComponent === "informacion" ? { maxWidth: "100%", height: "100%" } : {}}
        >
          <AppRouter />
        </div>
      </main>

      {/* Floating AI Button (Only for admin) */}
      {userRole === 'admin' && (
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          backgroundColor: 'var(--primary)',
          color: '#000',
          border: 'none',
          boxShadow: '0 8px 24px rgba(18, 163, 131, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
        title="Abrir Kuepa AI (Alt+K)"
      >
        <Bot size={28} />
      </button>
      )}

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