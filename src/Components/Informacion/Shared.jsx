import React, { useState } from 'react';
import { Copy, Check, Search, X, FolderOpen, Database, Briefcase, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * Copia texto al portapapeles y despliega notificación toast.
 * @param {string} texto
 * @param {string} [mensaje]
 */
export const copiarAlPortapapeles = (texto, mensaje = 'Copiado al portapapeles') => {
  if (!texto) return;
  navigator.clipboard.writeText(texto)
    .then(() => toast.success(mensaje, { autoClose: 1800 }))
    .catch(() => toast.error('Error al copiar'));
};

/**
 * Micro-chip interactivo para Mongo ObjectIds, códigos y llaves.
 * Incorpora animación de checkmark verde por 1.5s.
 */
export function CopyChip({
  text,
  label = '',
  icon: Icon = Database,
  title = 'Clic para copiar',
  successMessage = 'ID copiado al portapapeles',
  mono = true,
  style = {},
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(String(text)).then(() => {
      setCopied(true);
      toast.success(successMessage, { autoClose: 1600 });
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className={`info-chip-interactive ${copied ? 'copied' : ''}`}
      onClick={handleClick}
      title={title}
      style={{
        ...style,
        fontFamily: mono ? "'Space Grotesk', monospace" : 'inherit',
      }}
    >
      {Icon && <Icon size={11} style={{ color: copied ? 'var(--primary)' : 'var(--on-surface-variant)', flexShrink: 0 }} />}
      {label && <span style={{ opacity: 0.75 }}>{label}</span>}
      <span style={{ fontWeight: 600 }}>{text}</span>
      {copied ? (
        <Check size={11} style={{ color: 'var(--primary)', flexShrink: 0 }} />
      ) : (
        <Copy size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
      )}
    </div>
  );
}

/**
 * Barra de búsqueda reutilizable con icono y botón de borrado inmediato.
 */
export function InfoSearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Buscar...',
  style = {},
  width = '320px',
}) {
  return (
    <div className="info-search-box" style={{ width, ...style }}>
      <Search
        size={16}
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--on-surface-variant)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        className="info-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="info-search-clear"
          onClick={onClear}
          title="Limpiar búsqueda"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Vista de estado vacío moderna con iconografía tecnológica.
 */
export function InfoEmptyState({
  icon: Icon = FolderOpen,
  title = 'No se encontraron resultados',
  message = 'Intenta ajustar los criterios de búsqueda o los filtros.',
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        color: 'var(--on-surface-variant)',
        padding: '50px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flex: 1,
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
        }}
      >
        <Icon size={24} />
      </div>
      <div>
        <h4 style={{ margin: '0 0 4px 0', color: 'var(--on-surface)', fontSize: '15px', fontWeight: 700 }}>
          {title}
        </h4>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--on-surface-variant)', maxWidth: '340px' }}>
          {message}
        </p>
      </div>
    </div>
  );
}

/**
 * Paginador moderno de alta fidelidad.
 */
export const renderPagination = (currentPage, totalPages, totalItems, pageItemsLength, setPageFn) => {
  if (totalPages <= 1 && totalItems <= pageItemsLength) return null;

  return (
    <div className="info-pagination-container">
      <button
        className="info-pagination-btn"
        disabled={currentPage === 0}
        onClick={() => setPageFn((p) => Math.max(0, p - 1))}
      >
        <ChevronLeft size={14} />
        <span>Anterior</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--on-surface)', fontSize: '12px', fontWeight: 700 }}>
          Página {currentPage + 1} de {Math.max(1, totalPages)}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--primary)',
            background: 'rgba(18, 163, 131, 0.12)',
            padding: '2px 8px',
            borderRadius: '100px',
            border: '1px solid rgba(18, 163, 131, 0.25)',
            fontWeight: 800,
          }}
        >
          {pageItemsLength} de {totalItems}
        </span>
      </div>

      <button
        className="info-pagination-btn"
        disabled={currentPage >= totalPages - 1}
        onClick={() => setPageFn((p) => Math.min(totalPages - 1, p + 1))}
      >
        <span>Siguiente</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
};
