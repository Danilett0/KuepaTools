/**
 * ClearStorageModal
 * Confirmation modal triggered by double-clicking the app logo.
 * Clears all localStorage and reloads the page on confirm.
 */
export default function ClearStorageModal({ onClose, onConfirm }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(9,9,9,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-low)',
          border: '1px solid var(--glass-border)',
          borderRadius: '20px',
          padding: '32px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(18,163,131,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Icono */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(255,71,87,0.12)',
            border: '1px solid rgba(255,71,87,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </div>
        </div>

        {/* Texto */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: 'var(--on-surface)', fontFamily: "'Nunito', sans-serif" }}>
            Limpiar todo el Storage
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--on-surface-variant)', lineHeight: 1.6, fontFamily: "'Space Grotesk', sans-serif" }}>
            Se borrarán <strong style={{ color: 'var(--on-surface)' }}>todos los datos guardados</strong> de la aplicación: formularios, IDs, preferencias y estados. Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              color: 'var(--on-surface-variant)',
              fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--on-surface-variant)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              background: '#ff4757',
              border: '1px solid #ff4757',
              color: '#fff',
              fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0303d'}
            onMouseLeave={e => e.currentTarget.style.background = '#ff4757'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6l-1 14H6L5 6" />
            </svg>
            Limpiar todo
          </button>
        </div>
      </div>
    </div>
  );
}
