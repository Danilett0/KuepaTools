import { Copy, Briefcase, BookOpen } from 'lucide-react';
import { toast } from 'react-toastify';

export const copiarAlPortapapeles = (texto) => {
  navigator.clipboard.writeText(texto);
  toast.success('Copiado al portapapeles', { autoClose: 2000 });
};

export const renderPagination = (currentPage, totalPages, totalItems, pageItemsLength, setPageFn) => {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', paddingTop: '20px', marginTop: 'auto' }}>
      <button
        className="btn-clear"
        disabled={currentPage === 0}
        onClick={() => setPageFn(p => p - 1)}
        style={{ padding: '8px 16px', opacity: currentPage === 0 ? 0.4 : 1, cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
      >
        ← Anterior
      </button>
      <span style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>
        Página {currentPage + 1} de {totalPages}
        <span style={{ marginLeft: '8px', opacity: 0.6 }}>({pageItemsLength} de {totalItems})</span>
      </span>
      <button
        className="btn-clear"
        disabled={currentPage >= totalPages - 1}
        onClick={() => setPageFn(p => p + 1)}
        style={{ padding: '8px 16px', opacity: currentPage >= totalPages - 1 ? 0.4 : 1, cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
      >
        Siguiente →
      </button>
    </div>
  );
};

export const renderListItems = (items, type = 'programa', searchTerm = '') => {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '60px 20px' }}>
        No se encontraron resultados con el término "{searchTerm}".
      </div>
    );
  }

  return items.map(item => (
    <div 
      key={item._id.$oid || item._id} 
      style={{
        background: 'var(--surface-low)',
        border: '1px solid var(--glass-border)',
        borderRadius: '10px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transition: 'border-color 0.2s ease, background 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.background = 'var(--surface-low)';
      }}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {type === 'alianza' ? <Briefcase size={16} style={{ color: 'var(--primary)' }} /> : <BookOpen size={16} style={{ color: 'var(--primary)' }} />}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--on-surface)', fontSize: '15px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', gap: '14px', marginTop: '3px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--on-surface-variant)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Space Grotesk, monospace' }}>
            ID: {item._id.$oid || item._id}
          </span>
        </div>
      </div>

      <button 
        className="btn-clear"
        onClick={() => copiarAlPortapapeles(item._id.$oid || item._id)}
        title="Copiar ID"
        style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)', background: 'var(--surface-void)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
      >
        <Copy size={16} />
      </button>
    </div>
  ));
};
