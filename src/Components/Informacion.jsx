import React, { useState } from 'react';
import { useCatalogos } from '../hooks/useCatalogos';
import AgregacionesPanel from './AgregacionesPanel';
import AlianzasView from './Informacion/AlianzasView';
import ProgramasView from './Informacion/ProgramasView';
import UsuariosView from './Informacion/UsuariosView';

const Informacion = () => {
  const [consultaActiva, setConsultaActiva] = useState(null);
  const { alianzas: alianzasData, programas: programasData, estados: estadosData, loading: loadingCatalogos } = useCatalogos();

  const renderContenido = () => {
    switch (consultaActiva) {
      case 'agregaciones':
        return <AgregacionesPanel />;
      case 'alianzas':
        return <AlianzasView alianzasData={alianzasData} isLoading={loadingCatalogos} />;
      case 'programas':
        return <ProgramasView alianzasData={alianzasData} programasData={programasData} isLoading={loadingCatalogos} />;
      case 'usuarios':
        return <UsuariosView programasData={programasData} estadosData={estadosData} />;
      default:
        return (
          <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center' }}>
            <div style={{ padding: '16px', background: 'var(--surface-low)', borderRadius: '50%', display: 'inline-flex' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <p>Selecciona una opción en la parte superior para cargar la información.</p>
          </div>
        );
    }
  };

  return (
    <div className="content-container animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: 'calc(100vh - 80px)', minHeight: 0, overflow: 'hidden' }}>
      <div className="inscripciones-title" style={{ textAlign: 'left', margin: 0, fontSize: '24px', color: 'var(--on-surface)' }}>
        Información y Consultas
      </div>
      
      <div className="opciones-consultas" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${consultaActiva === 'alianzas' ? 'btn-primary' : 'btn-black'}`}
          onClick={() => setConsultaActiva('alianzas')}
          style={{ padding: '10px 20px', transition: 'none', transform: 'none' }}
        >
          Alianzas Kuepa
        </button>
        <button 
          className={`btn ${consultaActiva === 'programas' ? 'btn-primary' : 'btn-black'}`}
          onClick={() => setConsultaActiva('programas')}
          style={{ padding: '10px 20px', transition: 'none', transform: 'none' }}
        >
          Programas Kuepa
        </button>
        <button 
          className={`btn ${consultaActiva === 'usuarios' ? 'btn-primary' : 'btn-black'}`}
          onClick={() => setConsultaActiva('usuarios')}
          style={{ padding: '10px 20px', transition: 'none', transform: 'none' }}
        >
          Usuarios
        </button>
        <button 
          className={`btn ${consultaActiva === 'agregaciones' ? 'btn-primary' : 'btn-black'}`}
          onClick={() => setConsultaActiva('agregaciones')}
          style={{ padding: '10px 20px', transition: 'none', transform: 'none' }}
        >
          Agregaciones
        </button>
      </div>

      <hr className="inscripciones-divider" style={{ width: '100%', margin: '0' }} />

      <div className="resultados-consultas" style={{ 
        background: 'rgba(0, 0, 0, 0.2)', 
        padding: '32px', 
        borderRadius: '16px', 
        flex: 1,
        minHeight: 0,
        border: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {renderContenido()}
      </div>
    </div>
  );
};

export default Informacion;
