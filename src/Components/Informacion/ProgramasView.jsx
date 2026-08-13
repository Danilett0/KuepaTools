import { useState } from 'react';
import { Search } from 'lucide-react';
import { renderListItems, renderPagination } from './Shared';

export default function ProgramasView({ alianzasData, programasData, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [programasPagina, setProgramasPagina] = useState(0);
  const [alianzaFiltro, setAlianzaFiltro] = useState('');
  const PAGE_SIZE = 10;

  const alianzasDisponibles = alianzasData.filter(a => 
    programasData.some(p => (p.alliance_id.$oid || p.alliance_id) === a._id.$oid)
  );
  
  const filtroActual = alianzaFiltro || (alianzasDisponibles.length > 0 ? alianzasDisponibles[0]._id.$oid : null);

  const filteredProgramas = programasData.filter(p => 
    (p.alliance_id.$oid || p.alliance_id) === filtroActual && p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="consulta-contenido" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ color: 'var(--primary)', fontSize: '20px', margin: 0 }}>Programas Kuepa ({filteredProgramas.length})</h3>
        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
          <input 
            type="text" 
            className="inscripciones-input" 
            placeholder="Buscar programa..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setProgramasPagina(0);
            }}
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
              setProgramasPagina(0);
            }}
          >
            {alianza.name}
          </button>
        ))}
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px',
        overflowY: 'auto',
        paddingRight: '8px',
        flex: 1,
        minHeight: 0
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#eab308', padding: '60px 20px', background: 'rgba(255,200,0,0.05)', borderRadius: '12px', border: '1px solid rgba(255,200,0,0.1)' }}>
            Descargando base de datos (puede tardar unos segundos)...
          </div>
        ) : (
          renderListItems(filteredProgramas.slice(programasPagina * PAGE_SIZE, (programasPagina + 1) * PAGE_SIZE), 'programa', searchTerm)
        )}
      </div>
      {renderPagination(programasPagina, Math.ceil(filteredProgramas.length / PAGE_SIZE), filteredProgramas.length, filteredProgramas.slice(programasPagina * PAGE_SIZE, (programasPagina + 1) * PAGE_SIZE).length, setProgramasPagina)}
    </div>
  );
}
