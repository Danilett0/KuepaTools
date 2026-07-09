import React, { useState } from 'react';
import { Search, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import alianzasData from '../data/alianzas.json';
import programasData from '../data/programas.json';

const Informacion = () => {
  const [consultaActiva, setConsultaActiva] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alianzaFiltro, setAlianzaFiltro] = useState('');

  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto);
    toast.success('ID copiado al portapapeles', { autoClose: 2000 });
  };

  const renderGridCards = (items) => {
    if (items.length === 0) {
      return (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--on-surface-variant)', padding: '60px 20px' }}>
          No se encontraron resultados con el término "{searchTerm}".
        </div>
      );
    }

    return items.map(item => (
      <div key={item._id.$oid || item._id} style={{
        background: 'var(--surface-low)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.boxShadow = '0 6px 12px var(--gold-glow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      }}
      >
        <h4 style={{ margin: '0', color: 'var(--on-surface)', fontSize: '17px', fontWeight: '700' }}>{item.name}</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-void)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', marginTop: 'auto' }}>
          <span style={{ color: 'var(--on-surface-variant)', fontSize: '13px', fontFamily: 'Space Grotesk, monospace', userSelect: 'all' }}>
            {item._id.$oid || item._id}
          </span>
          <button 
            className="btn-clear"
            onClick={() => copiarAlPortapapeles(item._id.$oid || item._id)}
            title="Copiar ID"
            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Copy size={16} />
          </button>
        </div>
      </div>
    ));
  };

  const renderContenido = () => {
    switch (consultaActiva) {
      case 'alianzas':
        const filteredAlianzas = alianzasData.filter(a => 
          a.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <div className="consulta-contenido animate-slide-down" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ color: 'var(--primary)', fontSize: '20px', margin: 0 }}>Alianzas Kuepa ({filteredAlianzas.length})</h3>
              <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
                <input 
                  type="text" 
                  className="inscripciones-input" 
                  placeholder="Buscar por nombre..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 16px 10px 40px' }}
                />
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '16px',
              overflowY: 'auto',
              paddingRight: '8px',
              alignContent: 'start'
            }}>
              {renderGridCards(filteredAlianzas)}
            </div>
          </div>
        );
        
      case 'programas':
        const alianzasDisponibles = alianzasData.filter(a => 
          programasData.some(p => (p.alliance_id.$oid || p.alliance_id) === a._id.$oid)
        );
        const filtroActual = alianzaFiltro || (alianzasDisponibles.length > 0 ? alianzasDisponibles[0]._id.$oid : null);

        const filteredProgramas = programasData.filter(p => 
          (p.alliance_id.$oid || p.alliance_id) === filtroActual && p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <div className="consulta-contenido animate-slide-down" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ color: 'var(--primary)', fontSize: '20px', margin: 0 }}>Programas Kuepa ({filteredProgramas.length})</h3>
              <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
                <input 
                  type="text" 
                  className="inscripciones-input" 
                  placeholder="Buscar programa..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 16px 10px 40px' }}
                />
              </div>
            </div>

            {/* Sub-opciones por Alianza */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
              {alianzasDisponibles.map(alianza => (
                <button
                  key={alianza._id.$oid}
                  className="btn-clear"
                  style={{ 
                    padding: '8px 16px', 
                    background: filtroActual === alianza._id.$oid ? 'var(--primary-container)' : 'var(--surface-low)',
                    color: filtroActual === alianza._id.$oid ? '#fff' : 'var(--on-surface-variant)',
                    borderColor: filtroActual === alianza._id.$oid ? 'var(--primary)' : 'var(--glass-border)',
                    borderRadius: '100px',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => {
                    setAlianzaFiltro(alianza._id.$oid);
                    setSearchTerm('');
                  }}
                >
                  {alianza.name}
                </button>
              ))}
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '16px',
              overflowY: 'auto',
              paddingRight: '8px',
              alignContent: 'start'
            }}>
              {renderGridCards(filteredProgramas)}
            </div>
          </div>
        );

      default:
        return (
          <div className="animate-slide-down" style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center' }}>
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
    <div className="content-container animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', minHeight: '100%' }}>
      <div className="inscripciones-title" style={{ textAlign: 'left', margin: 0, fontSize: '24px', color: 'var(--on-surface)' }}>
        Información y Consultas
      </div>
      
      <div className="opciones-consultas" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${consultaActiva === 'alianzas' ? 'btn-primary' : 'btn-black'}`}
          onClick={() => {
            setConsultaActiva('alianzas');
            setSearchTerm('');
          }}
          style={{ padding: '10px 20px' }}
        >
          Alianzas Kuepa
        </button>
        <button 
          className={`btn ${consultaActiva === 'programas' ? 'btn-primary' : 'btn-black'}`}
          onClick={() => {
            setConsultaActiva('programas');
            setSearchTerm('');
          }}
          style={{ padding: '10px 20px' }}
        >
          Programas Kuepa
        </button>
      </div>

      <hr className="inscripciones-divider" style={{ width: '100%', margin: '0' }} />

      <div className="resultados-consultas" style={{ 
        background: 'rgba(0, 0, 0, 0.2)', 
        padding: '32px', 
        borderRadius: '16px', 
        flex: 1,
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
