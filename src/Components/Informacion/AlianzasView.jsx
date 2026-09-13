import React, { useState, useMemo } from 'react';
import { Briefcase, Building2 } from 'lucide-react';
import { CopyChip, InfoSearchBar, InfoEmptyState, renderPagination } from './Shared';

export default function AlianzasView({ alianzasData = [], isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [alianzasPagina, setAlianzasPagina] = useState(0);
  const PAGE_SIZE = 12;

  const filteredAlianzas = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return alianzasData;
    return alianzasData.filter((a) => {
      const name = (a.name || '').toLowerCase();
      const id = String(a._id?.$oid || a._id || '').toLowerCase();
      return name.includes(term) || id.includes(term);
    });
  }, [alianzasData, searchTerm]);

  const totalPages = Math.ceil(filteredAlianzas.length / PAGE_SIZE);
  const currentItems = useMemo(() => {
    const start = alianzasPagina * PAGE_SIZE;
    return filteredAlianzas.slice(start, start + PAGE_SIZE);
  }, [filteredAlianzas, alianzasPagina, PAGE_SIZE]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0, gap: '14px' }}>
      {/* ── Toolbar Superior ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ color: 'var(--on-surface)', fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Alianzas Registradas</span>
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
              {filteredAlianzas.length}
            </span>
          </h3>
        </div>

        <InfoSearchBar
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setAlianzasPagina(0);
          }}
          onClear={() => {
            setSearchTerm('');
            setAlianzasPagina(0);
          }}
          placeholder="Buscar alianza o Mongo ID..."
          width="300px"
        />
      </div>

      {/* ── Grid Adaptativo de Alianzas ── */}
      {isLoading ? (
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
          Cargando catálogo maestro de alianzas...
        </div>
      ) : filteredAlianzas.length === 0 ? (
        <InfoEmptyState
          icon={Building2}
          title="Sin coincidencias de alianzas"
          message={`No encontramos alianzas con el término "${searchTerm}".`}
        />
      ) : (
        <div className="info-card-grid">
          {currentItems.map((item) => {
            const rawId = item._id?.$oid || item._id;
            const initial = item.name ? item.name.charAt(0).toUpperCase() : 'A';

            return (
              <div key={rawId} className="info-card">
                {/* Avatar / Inicial de Alianza */}
                <div className="info-card-avatar">
                  {initial}
                </div>

                {/* Contenido */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div
                    style={{
                      color: 'var(--on-surface)',
                      fontSize: '14px',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={item.name}
                  >
                    {item.name}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <CopyChip
                      text={rawId}
                      label="ID"
                      successMessage="ID de alianza copiado"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Paginador ── */}
      {renderPagination(
        alianzasPagina,
        totalPages,
        filteredAlianzas.length,
        currentItems.length,
        setAlianzasPagina
      )}
    </div>
  );
}
