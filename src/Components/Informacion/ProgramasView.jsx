import React, { useState, useMemo } from 'react';
import { BookOpen, Layers } from 'lucide-react';
import { CopyChip, InfoSearchBar, InfoEmptyState, renderPagination } from './Shared';

export default function ProgramasView({ alianzasData = [], programasData = [], isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [programasPagina, setProgramasPagina] = useState(0);
  const [alianzaFiltro, setAlianzaFiltro] = useState('');
  const PAGE_SIZE = 12;

  // Mapa de alianzas por ID para rápido lookup
  const alianzasMap = useMemo(() => {
    const map = new Map();
    alianzasData.forEach((a) => {
      const id = a._id?.$oid || a._id;
      if (id) map.set(String(id), a.name);
    });
    return map;
  }, [alianzasData]);

  // Alianzas que tienen programas y su respectivo conteo
  const alianzasConConteo = useMemo(() => {
    const counts = new Map();
    programasData.forEach((p) => {
      const aId = String(p.alliance_id?.$oid || p.alliance_id || '');
      if (aId) {
        counts.set(aId, (counts.get(aId) || 0) + 1);
      }
    });

    return alianzasData
      .filter((a) => {
        const aId = String(a._id?.$oid || a._id || '');
        return counts.has(aId);
      })
      .map((a) => {
        const aId = String(a._id?.$oid || a._id || '');
        return {
          id: aId,
          name: a.name,
          count: counts.get(aId) || 0,
        };
      });
  }, [alianzasData, programasData]);

  const filtroActual = alianzaFiltro || (alianzasConConteo.length > 0 ? alianzasConConteo[0].id : null);

  const filteredProgramas = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return programasData.filter((p) => {
      const pAllianceId = String(p.alliance_id?.$oid || p.alliance_id || '');
      const matchAlliance = pAllianceId === filtroActual;
      if (!matchAlliance) return false;

      if (!term) return true;
      const name = (p.name || '').toLowerCase();
      const pId = String(p._id?.$oid || p._id || '').toLowerCase();
      return name.includes(term) || pId.includes(term);
    });
  }, [programasData, filtroActual, searchTerm]);

  const totalPages = Math.ceil(filteredProgramas.length / PAGE_SIZE);
  const currentItems = useMemo(() => {
    const start = programasPagina * PAGE_SIZE;
    return filteredProgramas.slice(start, start + PAGE_SIZE);
  }, [filteredProgramas, programasPagina, PAGE_SIZE]);

  const currentAllianceName = alianzasMap.get(filtroActual) || 'Alianza';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0, gap: '14px' }}>
      {/* ── Toolbar Superior ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ color: 'var(--on-surface)', fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Programas ({currentAllianceName})</span>
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
              {filteredProgramas.length}
            </span>
          </h3>
        </div>

        <InfoSearchBar
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setProgramasPagina(0);
          }}
          onClear={() => {
            setSearchTerm('');
            setProgramasPagina(0);
          }}
          placeholder="Buscar programa o Mongo ID..."
          width="300px"
        />
      </div>

      {/* ── Selector Horizontal de Alianzas con Conteo ── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--primary) rgba(255, 255, 255, 0.05)',
        }}
      >
        {alianzasConConteo.map((alianza) => {
          const isActive = filtroActual === alianza.id;
          return (
            <button
              key={alianza.id}
              type="button"
              onClick={() => {
                setAlianzaFiltro(alianza.id);
                setSearchTerm('');
                setProgramasPagina(0);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
                background: isActive ? 'rgba(18, 163, 131, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                border: `1px solid ${isActive ? 'rgba(18, 163, 131, 0.4)' : 'var(--glass-border)'}`,
                boxShadow: isActive ? '0 2px 8px rgba(18, 163, 131, 0.2)' : 'none',
              }}
            >
              <span>{alianza.name}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '100px',
                  background: isActive ? 'rgba(18, 163, 131, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  color: isActive ? '#fff' : 'var(--on-surface-variant)',
                }}
              >
                {alianza.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Grid Adaptativo de Programas ── */}
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
          Cargando catálogo maestro de programas...
        </div>
      ) : filteredProgramas.length === 0 ? (
        <InfoEmptyState
          icon={Layers}
          title="Sin programas coincidentes"
          message={`No encontramos programas en ${currentAllianceName} que coincidan con "${searchTerm}".`}
        />
      ) : (
        <div className="info-card-grid">
          {currentItems.map((item) => {
            const rawId = item._id?.$oid || item._id;

            return (
              <div key={rawId} className="info-card">
                {/* Icono de Programa */}
                <div className="info-card-avatar" style={{ background: 'rgba(14, 165, 233, 0.12)', borderColor: 'rgba(14, 165, 233, 0.25)', color: '#38bdf8' }}>
                  <BookOpen size={16} />
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
                      successMessage="ID de programa copiado"
                    />
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--on-surface-variant)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: '1px solid var(--glass-border)',
                      }}
                    >
                      {currentAllianceName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Paginador ── */}
      {renderPagination(
        programasPagina,
        totalPages,
        filteredProgramas.length,
        currentItems.length,
        setProgramasPagina
      )}
    </div>
  );
}
