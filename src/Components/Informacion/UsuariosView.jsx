import { useMemo } from 'react';
import { Search, Copy, Phone, BookOpen, Mail } from 'lucide-react';
import { useUsuariosSearch } from '../../hooks/useUsuariosSearch';
import { copiarAlPortapapeles, renderPagination } from './Shared';

const getStatusStyle = (statusName) => {
  if (!statusName || statusName === 'Desconocido') return { background: 'rgba(255,255,255,0.1)', color: 'var(--on-surface-variant)' };
  const nameLower = statusName.toLowerCase();
  
  if (nameLower.includes('mora') || nameLower.includes('no exitosa') || nameLower.includes('retiro') || nameLower.includes('suspendido') || nameLower.includes('riesgo') || nameLower.includes('aplazado') || nameLower.includes('pausa') || nameLower.includes('baja')) {
    return { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
  }
  if (nameLower.includes('graduado') || nameLower.includes('certificado') || nameLower.includes('finalización')) {
    return { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
  }
  if (nameLower.includes('regular') || nameLower.includes('al día') || nameLower.includes('activo') || nameLower.includes('paz y salvo')) {
    return { background: 'rgba(18, 163, 131, 0.15)', color: 'var(--primary)' };
  }
  return { background: 'rgba(18, 163, 131, 0.15)', color: 'var(--primary)' };
};

export default function UsuariosView({ programasData, estadosData }) {
  const {
    searchTerm,
    setSearchTerm,
    usuariosFiltro,
    setUsuariosFiltro,
    usuariosPagina,
    setUsuariosPagina,
    serverUsers,
    totalServerUsers,
    loadingUsuarios
  } = useUsuariosSearch(10);

  const programasMap = useMemo(() =>
    Object.fromEntries(programasData.map(p => [p._id.$oid, p]))
  , [programasData]);

  const estadosMap = useMemo(() =>
    Object.fromEntries(estadosData.map(e => [e._id.$oid, e.name.trim()]))
  , [estadosData]);

  const totalPages = Math.ceil(totalServerUsers / 10);
  const pageUsers = serverUsers;

  return (
    <div className="consulta-contenido" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ color: 'var(--primary)', fontSize: '20px', margin: 0 }}>
          Usuarios — {usuariosFiltro === 'nueva-america' ? 'Nueva América' : 'Kuepa'}
          <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', fontFamily: "'Space Grotesk', sans-serif" }}>
          Total: <span style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{totalServerUsers}</span> usuarios
        </span>
        </h3>
        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
          <input
            type="text"
            className="inscripciones-input"
            placeholder="Buscar por usuario o código..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setUsuariosPagina(0); }}
            style={{ width: '100%', padding: '10px 16px 10px 40px' }}
          />
        </div>
      </div>

      {/* Sub-filtro alianza */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'nueva-america', label: 'Nueva América', available: true },
          { id: 'kuepa', label: 'Kuepa', available: true }
        ].map(op => (
          <button
            key={op.id}
            className="btn-clear"
            disabled={!op.available}
            title={!op.available ? 'Próximamente' : ''}
            style={{
              padding: '8px 18px',
              background: usuariosFiltro === op.id ? (op.id === 'kuepa' ? '#ef4444' : 'var(--primary-container)') : 'var(--surface-low)',
              color: usuariosFiltro === op.id ? '#fff' : 'var(--on-surface-variant)',
              borderColor: usuariosFiltro === op.id ? (op.id === 'kuepa' ? '#ef4444' : 'var(--primary)') : 'var(--glass-border)',
              borderRadius: '100px',
              whiteSpace: 'nowrap',
              opacity: op.available ? 1 : 0.45,
              cursor: op.available ? 'pointer' : 'not-allowed'
            }}
            onClick={() => {
              if (!op.available) return;
              setUsuariosFiltro(op.id);
              setSearchTerm('');
              setUsuariosPagina(0);
            }}
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* Lista de usuarios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {loadingUsuarios ? (
          <div style={{ textAlign: 'center', color: '#eab308', padding: '60px 20px', background: 'rgba(255,200,0,0.05)', borderRadius: '12px', border: '1px solid rgba(255,200,0,0.1)' }}>
            Descargando base de datos (puede tardar unos segundos)...
          </div>
        ) : pageUsers.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '60px 20px' }}>
            {usuariosFiltro === 'kuepa'
              ? 'Los datos de Kuepa estarán disponibles próximamente.'
              : `No se encontraron usuarios con "${searchTerm}".`
            }
          </div>
        ) : (
          pageUsers.map(user => (
            <div
              key={user._id.$oid}
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
              {/* Username + código */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div 
                  style={{ color: 'var(--on-surface)', fontSize: '14px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                  title="Copiar Nombre"
                  onClick={() => copiarAlPortapapeles(user.profile?.full_name || 'Sin Nombre')}
                >
                  {user.profile?.full_name || 'Sin Nombre'}
                </div>
                {/* Info rápida */}
                <div style={{ display: 'flex', gap: '14px', marginTop: '3px', flexWrap: 'wrap' }}>
                  <span 
                    style={{ color: 'var(--on-surface-variant)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    title="Copiar Código"
                    onClick={() => copiarAlPortapapeles(String(user.incremental_user_code))}
                  >
                    ID {user.incremental_user_code}
                  </span>
                  <span 
                    style={{ color: 'var(--on-surface-variant)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Space Grotesk, monospace', cursor: 'pointer' }}
                    title="Copiar ID"
                    onClick={() => copiarAlPortapapeles(user._id.$oid)}
                  >
                    <span style={{ opacity: 0.4 }}>|</span> {user._id.$oid}
                    <button
                      className="btn-clear"
                      style={{ padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
                    >
                      <Copy size={12} />
                    </button>
                  </span>
                  <span 
                    style={{ color: 'var(--on-surface-variant)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    title="Copiar Teléfono"
                    onClick={() => copiarAlPortapapeles(user.profile?.phone || '')}
                  >
                    <Phone size={11} /> {user.profile?.phone || 'Sin teléfono'}
                  </span>
                  <span 
                    style={{ color: 'var(--on-surface-variant)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    title="Copiar Correo"
                    onClick={() => copiarAlPortapapeles(user.profile?.email || '')}
                  >
                    <Mail size={11} /> {user.profile?.email || 'Sin correo'}
                  </span>
                </div>
                {/* Programas */}
                {user.programs?.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {user.programs.map((prog, idx) => {
                      const pid = prog.structure?.$oid || prog.structure;
                      const programa = programasMap[pid];
                      const label = programa ? programa.name : (pid ? String(pid).slice(-8) + '…' : 'Desconocido');
                      const statuses = prog.business_statuses || [];
                      return (
                        <div key={`${pid}-${idx}`} style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', background: 'var(--surface-void)', padding: '6px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                          <button
                            onClick={() => copiarAlPortapapeles(pid)}
                            title={`Copiar ID: ${pid}`}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: '2px 4px',
                              fontSize: '11px',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary)'}
                          >
                            <BookOpen size={10} style={{ flexShrink: 0 }} />
                            <span>{label}</span>
                          </button>
                          {statuses.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', paddingLeft: '14px' }}>
                              {statuses.map((statusObj, sidx) => {
                                const sid = statusObj?.business_status?.$oid || statusObj?.business_status || statusObj?.$oid || statusObj;
                                const statusName = estadosMap[sid] || 'Desconocido';
                                const style = getStatusStyle(statusName);
                                return (
                                  <span key={`${sid}-${sidx}`} style={{ background: style.background, color: style.color, fontSize: '9px', padding: '2px 6px', borderRadius: '100px' }}>
                                    {statusName}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {(!user.programs || user.programs.length === 0) && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--on-surface-variant)', opacity: 0.6 }}>Sin programas</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {renderPagination(usuariosPagina, totalPages, totalServerUsers, pageUsers.length, setUsuariosPagina)}
    </div>
  );
}
