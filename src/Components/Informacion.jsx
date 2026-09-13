import React, { useState } from 'react';
import { useCatalogos } from '../hooks/useCatalogos';
import AgregacionesPanel from './AgregacionesPanel';
import AlianzasView from './Informacion/AlianzasView';
import ProgramasView from './Informacion/ProgramasView';
import UsuariosView from './Informacion/UsuariosView';
import { Database, Briefcase, BookOpen, Users, Code, Layers } from 'lucide-react';

const Informacion = () => {
  const [consultaActiva, setConsultaActiva] = useState('alianzas');
  const { alianzas: alianzasData = [], programas: programasData = [], estados: estadosData = [], loading: loadingCatalogos } = useCatalogos();

  const tabs = [
    {
      id: 'alianzas',
      label: 'Alianzas Kuepa',
      icon: Briefcase,
      count: alianzasData.length || null,
    },
    {
      id: 'programas',
      label: 'Programas Kuepa',
      icon: BookOpen,
      count: programasData.length || null,
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: Users,
      count: null,
    },
    {
      id: 'agregaciones',
      label: 'Agregaciones',
      icon: Code,
      count: null,
    },
  ];

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
        return null;
    }
  };

  return (
    <div className="info-main-container animate-slide-down">
      {/* ── Header de Alta Fidelidad Estilo Estudiante 360° ── */}
      <div className="info-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="info-header-badge">
            <Database size={17} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <h1 className="info-header-title">
              Información y Consultas
            </h1>
            <span className="info-header-subtitle">
              Catálogos maestros, alianzas activas, programas, usuarios y pipelines
            </span>
          </div>
        </div>

        {/* Badges de Métricas Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--on-surface-variant)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              padding: '3px 10px',
              borderRadius: '100px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
            <span>Alianzas: <strong style={{ color: 'var(--on-surface)' }}>{alianzasData.length}</strong></span>
          </span>

          <span
            style={{
              fontSize: '11px',
              color: 'var(--on-surface-variant)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              padding: '3px 10px',
              borderRadius: '100px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
            <span>Programas: <strong style={{ color: 'var(--on-surface)' }}>{programasData.length}</strong></span>
          </span>
        </div>
      </div>

      {/* ── Barra de Navegación Segmentada ── */}
      <div className="info-tabs-bar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = consultaActiva === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={`info-tab-button ${isActive ? 'active' : ''}`}
              onClick={() => setConsultaActiva(tab.id)}
            >
              <Icon size={15} style={{ color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)' }} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="info-tab-counter">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Contenedor Panel de Resultados ── */}
      <div className="info-content-panel">
        {renderContenido()}
      </div>
    </div>
  );
};

export default Informacion;
