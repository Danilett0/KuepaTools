import { useState } from 'react';
import { Search } from 'lucide-react';
import { renderListItems, renderPagination } from './Shared';

export default function AlianzasView({ alianzasData, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [alianzasPagina, setAlianzasPagina] = useState(0);
  const PAGE_SIZE = 10;

  const filteredAlianzas = alianzasData.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="consulta-contenido" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ color: 'var(--primary)', fontSize: '20px', margin: 0 }}>Alianzas Kuepa ({filteredAlianzas.length})</h3>
        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
          <input 
            type="text" 
            className="inscripciones-input" 
            placeholder="Buscar por nombre..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setAlianzasPagina(0);
            }}
            style={{ width: '100%', padding: '10px 16px 10px 40px' }}
          />
        </div>
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
          renderListItems(filteredAlianzas.slice(alianzasPagina * PAGE_SIZE, (alianzasPagina + 1) * PAGE_SIZE), 'alianza', searchTerm)
        )}
      </div>
      {renderPagination(alianzasPagina, Math.ceil(filteredAlianzas.length / PAGE_SIZE), filteredAlianzas.length, filteredAlianzas.slice(alianzasPagina * PAGE_SIZE, (alianzasPagina + 1) * PAGE_SIZE).length, setAlianzasPagina)}
    </div>
  );
}
