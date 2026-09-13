import React, { useState, useEffect } from 'react';
import { getAgregaciones, createAgregacion, updateAgregacion, deleteAgregacion } from '../services/agregacionesService';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Copy, Check, Save, X, Code, Database, Terminal, FileCode2 } from 'lucide-react';

export default function AgregacionesPanel() {
  const [agregaciones, setAgregaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgr, setSelectedAgr] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({ name: '', description: '', collection: '', content: '' });

  useEffect(() => {
    fetchAgregaciones();
  }, []);

  const fetchAgregaciones = async () => {
    try {
      setLoading(true);
      const data = await getAgregaciones();
      setAgregaciones(data || []);
      if (data && data.length > 0 && !selectedAgr) {
        setSelectedAgr(data[0]);
      }
    } catch (err) {
      toast.error('Error al cargar agregaciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!selectedAgr?.content) return;
    navigator.clipboard.writeText(selectedAgr.content)
      .then(() => {
        setCopiedCode(true);
        toast.success('Pipeline copiado al portapapeles', { autoClose: 1600 });
        setTimeout(() => setCopiedCode(false), 1500);
      })
      .catch(() => toast.error('Error al copiar'));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.content || !formData.collection) {
      toast.error('Nombre, colección y contenido son obligatorios');
      return;
    }

    try {
      if (selectedAgr?.id && isEditing !== 'new') {
        const updated = await updateAgregacion(selectedAgr.id, formData);
        setAgregaciones(agregaciones.map((a) => (a.id === updated.id ? updated : a)));
        setSelectedAgr(updated);
        toast.success('Agregación actualizada');
      } else {
        const created = await createAgregacion(formData);
        setAgregaciones([created, ...agregaciones]);
        setSelectedAgr(created);
        toast.success('Agregación creada');
      }
      setIsEditing(false);
    } catch (err) {
      toast.error('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta agregación?')) return;
    try {
      await deleteAgregacion(id);
      const remaining = agregaciones.filter((a) => a.id !== id);
      setAgregaciones(remaining);
      if (selectedAgr?.id === id) {
        setSelectedAgr(remaining.length > 0 ? remaining[0] : null);
      }
      toast.success('Agregación eliminada');
    } catch (err) {
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  const startEdit = (agr) => {
    setFormData({
      name: agr.name || '',
      description: agr.description || '',
      collection: agr.collection || '',
      content: agr.content || '',
    });
    setIsEditing('edit');
  };

  const startNew = () => {
    setFormData({ name: '', description: '', collection: '', content: '' });
    setIsEditing('new');
  };

  const filteredAgregaciones = agregaciones.filter((a) => {
    if (!sidebarFilter.trim()) return true;
    const term = sidebarFilter.toLowerCase();
    return (
      (a.name || '').toLowerCase().includes(term) ||
      (a.collection || '').toLowerCase().includes(term) ||
      (a.description || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
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
        Cargando pipelines de agregación guardados...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '18px', height: '100%', flex: 1, minHeight: 0 }}>
      {/* ── Sidebar Izquierda: Lista de Pipelines ── */}
      <div
        style={{
          width: '310px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          borderRight: '1px solid var(--glass-border)',
          paddingRight: '16px',
          minWidth: 0,
        }}
      >
        {/* Botón Crear Agregación */}
        <button
          type="button"
          onClick={startNew}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--primary) 0%, #06a080 100%)',
            color: '#090909',
            fontWeight: 800,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(18, 163, 131, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
        >
          <Plus size={16} />
          <span>Nueva Agregación</span>
        </button>

        {/* Buscador de lista de agregaciones */}
        {agregaciones.length > 5 && (
          <input
            type="text"
            className="inscripciones-input"
            placeholder="Filtrar pipelines..."
            value={sidebarFilter}
            onChange={(e) => setSidebarFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '12px', height: '32px' }}
          />
        )}

        {/* Lista de Items */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            paddingRight: '4px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--primary) rgba(255, 255, 255, 0.05)',
          }}
        >
          {filteredAgregaciones.length === 0 ? (
            <div style={{ color: 'var(--on-surface-variant)', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>
              No hay agregaciones disponibles.
            </div>
          ) : (
            filteredAgregaciones.map((agr) => {
              const isSelected = selectedAgr?.id === agr.id && !isEditing;
              return (
                <div
                  key={agr.id}
                  onClick={() => {
                    setSelectedAgr(agr);
                    setIsEditing(false);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(18, 163, 131, 0.12)' : 'var(--surface-low)',
                    border: `1px solid ${isSelected ? 'rgba(18, 163, 131, 0.35)' : 'var(--glass-border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--surface-low)';
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                    }
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: isSelected ? 'var(--primary)' : 'var(--on-surface)', marginBottom: '4px' }}>
                    {agr.name}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {agr.collection && (
                      <span
                        style={{
                          fontSize: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        <Database size={9} />
                        <span>{agr.collection}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Contenido Principal / Visor / Editor ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {isEditing ? (
          /* Modo Edición / Creación */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--on-surface)', fontSize: '16px', fontWeight: 800 }}>
                {isEditing === 'new' ? 'Crear Nuevo Pipeline' : 'Editar Pipeline de Agregación'}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-clear"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '6px 12px' }}
                >
                  <X size={14} /> Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #06a080 100%)',
                    color: '#090909',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ marginBottom: '4px', display: 'block' }}>Nombre</label>
                <input
                  className="inscripciones-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Búsqueda de usuarios morosos..."
                  style={{ padding: '10px 12px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '4px', display: 'block' }}>Colección MongoDB</label>
                <input
                  className="inscripciones-input"
                  type="text"
                  value={formData.collection}
                  onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                  placeholder="Ej. users, enrollments, structures..."
                  style={{ padding: '10px 12px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label className="input-label" style={{ marginBottom: '4px', display: 'block' }}>Descripción (Opcional)</label>
              <input
                className="inscripciones-input"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve explicación del objetivo del pipeline..."
                style={{ padding: '10px 12px', fontSize: '13px' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
              <label className="input-label" style={{ marginBottom: '4px', display: 'block' }}>Pipeline (JSON Array)</label>
              <textarea
                className="inscripciones-input"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="[\n  { $match: { ... } },\n  { $group: { ... } }\n]"
                style={{
                  width: '100%',
                  flex: 1,
                  fontFamily: "'Space Grotesk', monospace",
                  fontSize: '13px',
                  resize: 'none',
                  padding: '12px',
                  lineHeight: '1.5',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        ) : selectedAgr ? (
          /* Modo Visualización IDE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
            {/* Cabecera del Pipeline */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h2 style={{ margin: '0 0 6px 0', color: 'var(--on-surface)', fontSize: '18px', fontWeight: 800 }}>
                  {selectedAgr.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedAgr.collection && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#38bdf8',
                        fontWeight: 700,
                      }}
                    >
                      <Database size={11} />
                      Colección: {selectedAgr.collection}
                    </span>
                  )}
                  {selectedAgr.description && (
                    <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                      {selectedAgr.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => startEdit(selectedAgr)}
                  className="btn-clear"
                  title="Editar agregación"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                >
                  <Edit2 size={13} />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedAgr.id)}
                  className="btn-clear"
                  title="Eliminar agregación"
                  style={{ padding: '6px 10px', fontSize: '12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={13} />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>

            {/* Ventana de Código Estilo Terminal IDE */}
            <div
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: '#070a10',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Barra superior de la ventana */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', opacity: 0.8 }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontFamily: "'Space Grotesk', monospace", marginLeft: '4px' }}>
                    pipeline.json
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: copiedCode ? 'rgba(18, 163, 131, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${copiedCode ? 'var(--primary)' : 'var(--glass-border)'}`,
                    color: copiedCode ? 'var(--primary)' : 'var(--on-surface-variant)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCode ? 'Copiado' : 'Copiar Pipeline'}</span>
                </button>
              </div>

              {/* Contenido del Código */}
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '14px 18px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--primary) rgba(255, 255, 255, 0.05)',
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "'Space Grotesk', monospace",
                    fontSize: '12.5px',
                    color: '#c9d1d9',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: '1.6',
                  }}
                >
                  {selectedAgr.content}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          /* Estado Vacío */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--on-surface-variant)',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <FileCode2 size={24} />
            </div>
            <p style={{ margin: 0, fontSize: '13px' }}>Selecciona una agregación de la lista o crea una nueva.</p>
          </div>
        )}
      </div>
    </div>
  );
}
