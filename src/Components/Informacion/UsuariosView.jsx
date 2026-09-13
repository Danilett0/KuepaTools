import React, { useMemo } from 'react';
import { Users, Phone, Mail, BookOpen, ExternalLink, Database, UserCheck, Sparkles } from 'lucide-react';
import { useUsuariosSearch } from '../../hooks/useUsuariosSearch';
import { useAppStore } from '../../store/useAppStore';
import { getStatusTheme } from '../../services/student360Service';
import { CopyChip, InfoSearchBar, InfoEmptyState, renderPagination, copiarAlPortapapeles } from './Shared';

export default function UsuariosView({ programasData = [], estadosData = [] }) {
  const {
    searchTerm,
    setSearchTerm,
    usuariosFiltro,
    setUsuariosFiltro,
    usuariosPagina,
    setUsuariosPagina,
    serverUsers,
    totalServerUsers,
    loadingUsuarios,
  } = useUsuariosSearch(10);

  const setActiveComponent = useAppStore((state) => state.setActiveComponent);

  const programasMap = useMemo(
    () => Object.fromEntries(programasData.map((p) => [p._id?.$oid || p._id, p])),
    [programasData]
  );

  const estadosMap = useMemo(
    () => Object.fromEntries(estadosData.map((e) => [e._id?.$oid || e._id, e.name.trim()])),
    [estadosData]
  );

  const totalPages = Math.ceil(totalServerUsers / 10);
  const pageUsers = serverUsers;

  const handleOpenStudent360 = (user) => {
    const identifier = String(user.incremental_user_code || user._id?.$oid || user._id || '').trim();
    if (!identifier) return;

    const alianzaCode = usuariosFiltro === 'kuepa' ? 'kuepa' : 'na';
    try {
      localStorage.setItem('estudiante360-input', JSON.stringify(identifier));
      localStorage.setItem('estudiante360-alianza', JSON.stringify(alianzaCode));
    } catch {
      // ignore
    }
    setActiveComponent('estudiante-360');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0, gap: '14px' }}>
      {/* ── Toolbar Superior ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h3 style={{ color: 'var(--on-surface)', fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Usuarios</span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--primary)',
                background: 'rgba(18, 163, 131, 0.14)',
                padding: '2px 8px',
                borderRadius: '100px',
                fontWeight: 800,
                border: '1px solid rgba(18, 163, 131, 0.25)',
              }}
            >
              {totalServerUsers.toLocaleString()} registrados
            </span>
          </h3>

          {/* Sub-filtro de Alianza Segmentado */}
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '3px',
              borderRadius: '100px',
              border: '1px solid var(--glass-border)',
              gap: '4px',
            }}
          >
            {[
              { id: 'nueva-america', label: 'Nueva América', available: true },
              { id: 'kuepa', label: 'Kuepa', available: true },
            ].map((op) => {
              const isActive = usuariosFiltro === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  disabled={!op.available}
                  onClick={() => {
                    if (!op.available) return;
                    setUsuariosFiltro(op.id);
                    setSearchTerm('');
                    setUsuariosPagina(0);
                  }}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '100px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: op.available ? 'pointer' : 'not-allowed',
                    border: 'none',
                    transition: 'all 0.18s ease',
                    background: isActive ? (op.id === 'kuepa' ? '#ef4444' : 'var(--primary)') : 'transparent',
                    color: isActive ? '#fff' : 'var(--on-surface-variant)',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {op.label}
                </button>
              );
            })}
          </div>
        </div>

        <InfoSearchBar
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setUsuariosPagina(0);
          }}
          onClear={() => {
            setSearchTerm('');
            setUsuariosPagina(0);
          }}
          placeholder="Nombre, email, teléfono, INC exacto o ID Mongo..."
          width="320px"
        />
      </div>

      {/* ── Listado de Usuarios ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          paddingRight: '6px',
          paddingBottom: '4px',
          flex: 1,
          minHeight: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--primary) rgba(255, 255, 255, 0.05)',
        }}
      >
        {loadingUsuarios ? (
          <div
            style={{
              textAlign: 'center',
              color: '#eab308',
              padding: '50px 20px',
              background: 'rgba(234, 179, 8, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(234, 179, 8, 0.15)',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Consultando registros en base de datos...
          </div>
        ) : pageUsers.length === 0 ? (
          <InfoEmptyState
            icon={Users}
            title="Sin usuarios encontrados"
            message={
              usuariosFiltro === 'kuepa'
                ? 'Los datos de Kuepa estarán disponibles próximamente.'
                : `No encontramos usuarios con el criterio "${searchTerm}".`
            }
          />
        ) : (
          pageUsers.map((user) => {
            const rawId = user._id?.$oid || user._id;
            const fullName = user.profile?.full_name || 'Estudiante sin nombre';
            const initial = fullName.charAt(0).toUpperCase() || 'U';
            const incCode = user.incremental_user_code ? String(user.incremental_user_code) : null;
            const phone = user.profile?.phone || '';
            const email = user.profile?.email || '';
            const programs = Array.isArray(user.programs) ? user.programs : [];

            return (
              <div key={rawId} className="info-user-card">
                {/* Avatar Inicial */}
                <div className="info-user-avatar">
                  {initial}
                </div>

                {/* Contenido Principal */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Fila 1: Nombre + Botón Ver en 360° */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div
                      style={{
                        color: 'var(--on-surface)',
                        fontSize: '15px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        letterSpacing: '-0.01em',
                      }}
                      title="Clic para copiar nombre"
                      onClick={() => copiarAlPortapapeles(fullName, 'Nombre copiado')}
                    >
                      {fullName}
                    </div>

                    {/* Botón rápido a Estudiante 360 */}
                    <button
                      type="button"
                      onClick={() => handleOpenStudent360(user)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: 'rgba(18, 163, 131, 0.12)',
                        border: '1px solid rgba(18, 163, 131, 0.3)',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title="Abrir ficha operativa completa en Estudiante 360°"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary)';
                        e.currentTarget.style.color = '#090909';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(18, 163, 131, 0.12)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                    >
                      <UserCheck size={12} />
                      <span>Ver en 360°</span>
                    </button>
                  </div>

                  {/* Fila 2: Chips Interactivos (INC, ObjectId, Teléfono, Correo) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {incCode && (
                      <CopyChip
                        text={incCode}
                        label="INC"
                        title="Código de estudiante INC (Clic para copiar)"
                        successMessage="Código INC copiado"
                      />
                    )}

                    <CopyChip
                      text={rawId}
                      label="Mongo"
                      icon={Database}
                      title="Mongo ObjectId (Clic para copiar)"
                      successMessage="Mongo ObjectId copiado"
                    />

                    {phone && (
                      <CopyChip
                        text={phone}
                        icon={Phone}
                        mono={false}
                        title="Teléfono (Clic para copiar)"
                        successMessage="Teléfono copiado"
                      />
                    )}

                    {email && (
                      <CopyChip
                        text={email}
                        icon={Mail}
                        mono={false}
                        title="Correo electrónico (Clic para copiar)"
                        successMessage="Correo copiado"
                      />
                    )}
                  </div>

                  {/* Fila 3: Programas Inscritos y Estados */}
                  {programs.length > 0 ? (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {programs.map((prog, idx) => {
                        const pid = prog.structure?.$oid || prog.structure;
                        const programa = programasMap[pid];
                        const label = programa ? programa.name : (pid ? String(pid).slice(-8) + '…' : 'Desconocido');
                        const statuses = Array.isArray(prog.business_statuses) ? prog.business_statuses : [];

                        return (
                          <div
                            key={`${pid}-${idx}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'rgba(0, 0, 0, 0.25)',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              border: '1px solid var(--glass-border)',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              onClick={() => copiarAlPortapapeles(pid, 'ID de programa copiado')}
                              style={{
                                color: 'var(--on-surface)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title={`ID Programa: ${pid} (Clic para copiar)`}
                            >
                              <BookOpen size={11} color="var(--primary)" />
                              <span>{label}</span>
                            </span>

                            {statuses.map((statusObj, sidx) => {
                              const sid =
                                statusObj?.business_status?.$oid ||
                                statusObj?.business_status ||
                                statusObj?.$oid ||
                                statusObj;
                              const statusName = estadosMap[sid] || 'Desconocido';
                              const theme = getStatusTheme(statusName);

                              return (
                                <span
                                  key={`${sid}-${sidx}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: theme.bg,
                                    color: theme.text,
                                    border: `1px solid ${theme.border}`,
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '100px',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '4px',
                                      height: '4px',
                                      borderRadius: '50%',
                                      background: theme.dot,
                                    }}
                                  />
                                  {statusName}
                                </span>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', opacity: 0.6 }}>
                      Sin programas asignados
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Paginador ── */}
      {renderPagination(usuariosPagina, totalPages, totalServerUsers, pageUsers.length, setUsuariosPagina)}
    </div>
  );
}
