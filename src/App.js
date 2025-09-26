import "./Styles/styles.css";
import { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CambiosEstadoBemo from "./Components/CambioEstados.jsx";
import AuditarEstadisticas from "./Components/AuditarEstadisticas.jsx";
import Inscripciones from "./Components/Inscripciones.jsx";
import Login from "./Components/Login.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Lottie from "lottie-react";
import groovyWalkAnimation from "./medit.json";

function AppContent() {
  const { isAuthenticated, logout, userData } = useAuth();
  const [activeComponent, setActiveComponent] = useState("inscripciones");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFunctionsMenu, setShowFunctionsMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowDropdown(false);
        setShowFunctionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleLogout = () => {
    logout();
  };

  const handleChangePasswordClick = () => {
    setShowChangePasswordModal(true);
    setShowDropdown(false);
    // Resetear el formulario
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePasswordFormChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Validar longitud mínima
    if (passwordForm.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch(process.env.REACT_APP_API_CHANGE_PASSWORD, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData?.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Contraseña actualizada exitosamente');
        setShowChangePasswordModal(false);
        // Resetear formulario
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(data.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      toast.error('Error de conexión. Intenta nuevamente');
    } finally {
      setIsChangingPassword(false);
    }
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
          onClick={() => {
            setShowFunctionsMenu(!showFunctionsMenu);
            setShowDropdown(false);
          }}
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
          </div>
        )}

        <div 
          onClick={() => {
            setShowDropdown(!showDropdown);
            setShowFunctionsMenu(false);
          }}
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
          <span style={{ fontWeight: '500' }}>{userData?.name}</span>
          <i className="fas fa-chevron-down" style={{ fontSize: '12px' }} />
        </div>
        
        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '8px',
            backgroundColor: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            padding: '8px 0',
            minWidth: '200px',
          }}>
            <div style={{
              padding: '8px 16px',
              borderBottom: '1px solid #eee',
              color: '#666',
              fontSize: '14px',
            }}>
              Última sesión: {new Date().toLocaleDateString()}
            </div>
            <div
              onClick={handleChangePasswordClick}
              style={{
                padding: '8px 16px',
                color: '#6c757d',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <i className="fas fa-key" style={{ marginRight: '8px' }} />
              Cambiar contraseña
            </div>
            <div
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                color: '#dc3545',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }} />
              Cerrar sesión
            </div>
          </div>
        )}
      </div>

      {/* Modal para cambio de contraseña */}
      {showChangePasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#333',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-key" style={{ color: '#6c757d' }} />
              Cambiar Contraseña
            </h3>
            <form onSubmit={handlePasswordFormSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Contraseña actual:
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
                  disabled={isChangingPassword}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    opacity: isChangingPassword ? 0.6 : 1
                  }}
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Nueva contraseña:
                </label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                  disabled={isChangingPassword}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    opacity: isChangingPassword ? 0.6 : 1
                  }}
                  placeholder="Ingresa tu nueva contraseña"
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Confirmar nueva contraseña:
                </label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                  disabled={isChangingPassword}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    opacity: isChangingPassword ? 0.6 : 1
                  }}
                  placeholder="Confirma tu nueva contraseña"
                />
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  disabled={isChangingPassword}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#666',
                    cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    opacity: isChangingPassword ? 0.6 : 1
                  }}
                  onMouseOver={(e) => !isChangingPassword && (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                  onMouseOut={(e) => !isChangingPassword && (e.currentTarget.style.backgroundColor = 'white')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: isChangingPassword ? '#6c757d' : '#0056b3',
                    color: 'white',
                    cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => !isChangingPassword && (e.currentTarget.style.backgroundColor = '#004494')}
                  onMouseOut={(e) => !isChangingPassword && (e.currentTarget.style.backgroundColor = '#0056b3')}
                >
                  {isChangingPassword ? (
                    <>
                      <i className="fas fa-spinner fa-spin" />
                      Cambiando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Lottie
        style={{ right: "80px" }}
        className="Lotty"
        animationData={groovyWalkAnimation}
        loop={true}
        speed={0.3} // 0.5 significa que va a la mitad de la velocidad normal
      />

      <div className="app-container" style={{ marginTop: '5%' }}>
        {renderComponent()}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;