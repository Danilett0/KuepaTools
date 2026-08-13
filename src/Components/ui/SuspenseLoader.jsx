import React from 'react';
import { Loader2 } from 'lucide-react';

export default function SuspenseLoader({ message = 'Cargando componente...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      color: 'var(--primary)',
      padding: '40px',
      background: 'rgba(0,0,0,0.1)',
      borderRadius: '16px'
    }}>
      <Loader2 className="spinner" size={40} style={{ animation: 'spin 1s linear infinite' }} />
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <p style={{ marginTop: '16px', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
        {message}
      </p>
    </div>
  );
}
