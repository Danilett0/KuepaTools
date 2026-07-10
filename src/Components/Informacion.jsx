import React, { useState, useMemo } from 'react';
import { Search, Copy, Phone, BookOpen, Mail, Briefcase } from 'lucide-react';
import { toast } from 'react-toastify';
import alianzasData from '../data/alianzas.json';
import programasData from '../data/programas.json';
import estadosData from '../data/estados.json';
import usuariosCompletos from '../data/usuarios_completos.json';

const Informacion = () => {
  const [consultaActiva, setConsultaActiva] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alianzaFiltro, setAlianzaFiltro] = useState('');
  const [usuariosFiltro, setUsuariosFiltro] = useState('nueva-america');
  const [usuariosPagina, setUsuariosPagina] = useState(0);
  const [alianzasPagina, setAlianzasPagina] = useState(0);
  const [programasPagina, setProgramasPagina] = useState(0);
  const PAGE_SIZE = 10;

  // Filtrado de usuarios — debe estar a nivel de componente (reglas de hooks)
  const usersSource = useMemo(() => {
    const allianceId = usuariosFiltro === 'nueva-america' 
      ? '6303ed663138387a1669d82a' // Nueva América
      : '602169e217b5c8a27f9e9c06'; // Kuepa Colombia
      
    return usuariosCompletos.filter(u => u.alliance_id?.$oid === allianceId);
  }, [usuariosFiltro]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return usersSource;
    return usersSource.filter(u => {
      const email = u.profile?.email || '';
      const name = u.profile?.full_name || '';
      const code = String(u.incremental_user_code || '');
      return email.toLowerCase().includes(term) || name.toLowerCase().includes(term) || code.includes(term);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, usersSource]);
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pageUsers = filteredUsers.slice(usuariosPagina * PAGE_SIZE, (usuariosPagina + 1) * PAGE_SIZE);

  // Mapa rápido de ID de programa → { name, _id.$oid }
  const programasMap = useMemo(() =>
    Object.fromEntries(programasData.map(p => [p._id.$oid, p]))
  , []);

  // Mapa rápido de ID de estado → name
  const estadosMap = useMemo(() =>
    Object.fromEntries(estadosData.map(e => [e._id.$oid, e.name.trim()]))
  , []);

  const getStatusStyle = (statusName) => {
    if (!statusName || statusName === 'Desconocido') return { background: 'rgba(255,255,255,0.1)', color: 'var(--on-surface-variant)' };
    const nameLower = statusName.toLowerCase();
    
    // Inactivos o negativos (Rojo)
    if (nameLower.includes('mora') || nameLower.includes('no exitosa') || nameLower.includes('retiro') || nameLower.includes('suspendido') || nameLower.includes('riesgo') || nameLower.includes('aplazado') || nameLower.includes('pausa') || nameLower.includes('baja')) {
      return { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    }
    
    // Especiales (Azul)
    if (nameLower.includes('graduado') || nameLower.includes('certificado') || nameLower.includes('finalización')) {
      return { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
    }
    
    // Activos / Positivos (Verde)
    if (nameLower.includes('regular') || nameLower.includes('al día') || nameLower.includes('activo') || nameLower.includes('paz y salvo')) {
      return { background: 'rgba(18, 163, 131, 0.15)', color: 'var(--primary)' };
    }
    
    // Default (Verde por defecto si asumimos que es algo bueno, o Gris si es ambiguo)
    return { background: 'rgba(18, 163, 131, 0.15)', color: 'var(--primary)' };
  };

  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto);
    toast.success('ID copiado al portapapeles', { autoClose: 2000 });
  };

  const renderPagination = (currentPage, totalPages, totalItems, pageItemsLength, setPageFn) => {
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

  const renderListItems = (items, type = 'programa') => {
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

  const renderContenido = () => {
    switch (consultaActiva) {
      case 'alianzas':
        const filteredAlianzas = alianzasData.filter(a => 
          a.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <div className="consulta-contenido animate-slide-down" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
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
              {renderListItems(filteredAlianzas.slice(alianzasPagina * PAGE_SIZE, (alianzasPagina + 1) * PAGE_SIZE), 'alianza')}
            </div>
            {renderPagination(alianzasPagina, Math.ceil(filteredAlianzas.length / PAGE_SIZE), filteredAlianzas.length, filteredAlianzas.slice(alianzasPagina * PAGE_SIZE, (alianzasPagina + 1) * PAGE_SIZE).length, setAlianzasPagina)}
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
          <div className="consulta-contenido animate-slide-down" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
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
              {renderListItems(filteredProgramas.slice(programasPagina * PAGE_SIZE, (programasPagina + 1) * PAGE_SIZE), 'programa')}
            </div>
            {renderPagination(programasPagina, Math.ceil(filteredProgramas.length / PAGE_SIZE), filteredProgramas.length, filteredProgramas.slice(programasPagina * PAGE_SIZE, (programasPagina + 1) * PAGE_SIZE).length, setProgramasPagina)}
          </div>
        );

      case 'usuarios': {

        return (
          <div className="consulta-contenido animate-slide-down" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ color: 'var(--primary)', fontSize: '20px', margin: 0 }}>
                Usuarios — {usuariosFiltro === 'nueva-america' ? 'Nueva América' : 'Kuepa'}
                <span style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginLeft: '8px', fontWeight: 400 }}>
                  ({filteredUsers.length} total)
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
                    background: usuariosFiltro === op.id ? 'var(--primary-container)' : 'var(--surface-low)',
                    color: usuariosFiltro === op.id ? '#fff' : 'var(--on-surface-variant)',
                    borderColor: usuariosFiltro === op.id ? 'var(--primary)' : 'var(--glass-border)',
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
              {pageUsers.length === 0 ? (
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
                      {/* Info rápida: código, teléfono, y correo */}
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
                      {/* Programas como badges clickeables */}
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
            {renderPagination(usuariosPagina, totalPages, filteredUsers.length, pageUsers.length, setUsuariosPagina)}
          </div>
        );
      }

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
    <div className="content-container animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: 'calc(100vh - 80px)', minHeight: 0, overflow: 'hidden' }}>
      <div className="inscripciones-title" style={{ textAlign: 'left', margin: 0, fontSize: '24px', color: 'var(--on-surface)' }}>
        Información y Consultas
      </div>
      
      <div className="opciones-consultas" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${consultaActiva === 'alianzas' ? 'btn-primary' : 'btn-black'}`}
          onClick={() => {
            setConsultaActiva('alianzas');
            setSearchTerm('');
            setAlianzasPagina(0);
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
            setProgramasPagina(0);
          }}
          style={{ padding: '10px 20px' }}
        >
          Programas Kuepa
        </button>
        <button 
          className={`btn ${consultaActiva === 'usuarios' ? 'btn-primary' : 'btn-black'}`}
          onClick={() => {
            setConsultaActiva('usuarios');
            setSearchTerm('');
            setUsuariosFiltro('nueva-america');
            setUsuariosPagina(0);
          }}
          style={{ padding: '10px 20px' }}
        >
          Usuarios
        </button>
      </div>

      <hr className="inscripciones-divider" style={{ width: '100%', margin: '0' }} />

      <div className="resultados-consultas" style={{ 
        background: 'rgba(0, 0, 0, 0.2)', 
        padding: '32px', 
        borderRadius: '16px', 
        flex: 1,
        minHeight: 0,
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
