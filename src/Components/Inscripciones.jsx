import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useLocalStorage } from '../hooks/useLocalStorage';
import FormEstudiante from './Inscripciones/FormEstudiante';
import FormGrupo from './Inscripciones/FormGrupo';
import FormCargaMasiva from './Inscripciones/FormCargaMasiva';
import FormCargaCombinada from './Inscripciones/FormCargaCombinada';
import { Users, UserPlus, Upload, Shuffle } from 'lucide-react';
import AllianceSwitcher from './ui/AllianceSwitcher';

const TABS = [
  {
    id: 'inscripciones-estudiante',
    label: 'Grupos → Estudiante',
    icon: UserPlus,
    subtitle: 'Inscribe o retira un estudiante de múltiples grupos',
  },
  {
    id: 'inscripciones-grupo',
    label: 'Estudiante → Grupos',
    icon: Users,
    subtitle: 'Inscribe o retira varios estudiantes en un mismo grupo',
  },
  {
    id: 'inscripciones-multi',
    label: 'Pares 1-a-1',
    icon: Upload,
    subtitle: 'Pares estudiante ↔ grupo por índice (mismo orden en ambas listas)',
  },
  {
    id: 'inscripciones-especificos',
    label: 'Producto Cartesiano',
    icon: Shuffle,
    subtitle: 'Todos los estudiantes inscritos en todos los grupos seleccionados',
  },
];

export default function Inscripciones({ formType }) {
  const setActiveComponent = useAppStore((state) => state.setActiveComponent);

  // Alianza state lifted here — shared with FormEstudiante via props
  const [alianza, setAlianza] = useLocalStorage('alianza-estudiante', 'na');
  // clearToken — increment to signal child forms to clear
  const [clearToken, setClearToken] = useState(0);

  const activeTab = TABS.find((t) => t.id === `inscripciones-${formType}`) || TABS[0];
  const ActiveIcon = activeTab.icon;

  const handleClear = () => setClearToken((t) => t + 1);

  const renderForm = () => {
    switch (formType) {
      case 'estudiante':
        return <FormEstudiante alianza={alianza} setAlianza={setAlianza} clearToken={clearToken} />;
      case 'grupo':
        return <FormGrupo clearToken={clearToken} />;
      case 'multi':
        return <FormCargaMasiva clearToken={clearToken} />;
      case 'especificos':
        return <FormCargaCombinada clearToken={clearToken} />;
      default:
        return <FormEstudiante alianza={alianza} setAlianza={setAlianza} clearToken={clearToken} />;
    }
  };

  return (
    <div className="inscripciones-main animate-slide-down" style={{ padding: '18px 24px', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* ── Header ── */}
      <div className="inscripciones-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="inscripciones-mode-badge">
            <ActiveIcon size={17} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--on-surface)', margin: 0, lineHeight: 1.2 }}>
              Inscripciones
            </h1>
            <span style={{ fontSize: '11.5px', color: 'var(--on-surface-variant)' }}>
              {activeTab.subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* ── Barra de Pestañas ── */}
      <div className="inscripciones-tabs">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = `inscripciones-${formType}` === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`inscripciones-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveComponent(tab.id)}
            >
              <TabIcon size={14} style={{ color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)' }} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* ── Controles del lado derecho ── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {formType === 'estudiante' && (
            <AllianceSwitcher
              value={alianza}
              onChange={(val) => {
                if (alianza !== val) {
                  setAlianza(val);
                  handleClear(); // reset form on alliance change
                }
              }}
            />
          )}
          <button
            type="button"
            onClick={handleClear}
            title="Limpiar (Esc)"
            style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--on-surface-variant)', borderRadius: '8px', padding: '7px 14px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* ── Panel de Contenido ── */}
      <div className="inscripciones-panel">
        {renderForm()}
      </div>
    </div>
  );
}
