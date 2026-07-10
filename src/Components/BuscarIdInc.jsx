import React, { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import usuariosCompletos from '../data/usuarios_completos.json';

const BuscarIdInc = () => {
  const [incText, setIncText] = useState('');
  const [alianza, setAlianza] = useState('na'); // 'na' o 'kuepa'
  const [resultado, setResultado] = useState('');

  useEffect(() => {
    if (!incText.trim()) {
      setResultado('');
      return;
    }

    const lines = incText.split('\n').map(line => line.trim()).filter(line => line !== '');

    const allianceId = alianza === 'kuepa'
      ? '602169e217b5c8a27f9e9c06'
      : '6303ed663138387a1669d82a';

    const resultados = lines.map(incStr => {
      const incNum = Number(incStr);
      if (isNaN(incNum)) return 'usuario no encontrado';

      const user = usuariosCompletos.find(
        u => u.incremental_user_code === incNum && u.alliance_id?.$oid === allianceId
      );

      if (user && user._id && user._id.$oid) {
        return user._id.$oid;
      }
      return 'usuario no se ha encontrado';
    });

    setResultado(resultados.join('\n'));
  }, [incText, alianza]);

  const copiarAlPortapapeles = () => {
    if (!resultado) return;
    navigator.clipboard.writeText(resultado);
    toast.success('Resultados copiados al portapapeles');
  };

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="inscripciones-form-container animate-slide-up" style={{ marginTop: 0, height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>

          <div className="inscripciones-form" style={{ display: 'flex', flexDirection: 'row', gap: '24px', flex: 1, minHeight: '60vh' }}>

            {/* Lado izquierdo */}
            <div className="input-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: 0 }}>
              {/* Cabecera Izquierda: Alianza */}
              <div style={{ display: 'flex', marginBottom: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setAlianza('na')}
                  style={{ flex: 1, padding: '12px', background: alianza === 'na' ? 'var(--primary-container)' : 'var(--surface-low)', color: alianza === 'na' ? '#fff' : 'var(--on-surface-variant)', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px' }}
                >
                  NUEVA AMÉRICA
                </button>
                <button
                  onClick={() => setAlianza('kuepa')}
                  style={{ flex: 1, padding: '12px', background: alianza === 'kuepa' ? 'var(--primary-container)' : 'var(--surface-low)', color: alianza === 'kuepa' ? '#fff' : 'var(--on-surface-variant)', border: 'none', borderLeft: '1px solid var(--glass-border)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px' }}
                >
                  KUEPA
                </button>
              </div>

              <textarea
                className="inscripciones-input"
                value={incText}
                onChange={(e) => setIncText(e.target.value)}
                placeholder="Ejemplo:&#10;292828&#10;237575&#10;297832"
                style={{ flex: 1, resize: 'none', fontFamily: 'monospace' }}
              />
            </div>

            {/* Lado derecho */}
            <div className="input-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: 0 }}>
              {/* Cabecera Derecha: Limpiar y Copiar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '12px' }}>
                <button
                  className="btn-clear"
                  onClick={() => { setIncText(''); setResultado(''); }}
                  title="Limpiar campos"
                  style={{ flex: 1, padding: '12px', background: 'var(--surface-low)', color: 'var(--on-surface-variant)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  LIMPIAR
                </button>
                <button
                  className="btn-clear"
                  onClick={copiarAlPortapapeles}
                  title="Copiar resultados"
                  style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#fff', background: 'var(--primary-container)', border: '1px solid var(--primary-container)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <Copy size={14} /> COPIAR
                </button>
              </div>
              <textarea
                className="inscripciones-input"
                value={resultado}
                readOnly
                placeholder="Los resultados aparecerán aquí..."
                style={{ flex: 1, resize: 'none', fontFamily: 'monospace', background: 'var(--surface-void)', color: 'var(--on-surface-variant)' }}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BuscarIdInc;
