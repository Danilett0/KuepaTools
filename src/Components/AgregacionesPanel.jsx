import React, { useState, useEffect } from 'react';
import { getAgregaciones, createAgregacion, updateAgregacion, deleteAgregacion } from '../services/agregacionesService';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Copy, Save, X, Code } from 'lucide-react';

export default function AgregacionesPanel() {
  const [agregaciones, setAgregaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgr, setSelectedAgr] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', description: '', collection: '', content: '' });

  useEffect(() => {
    fetchAgregaciones();
  }, []);

  const fetchAgregaciones = async () => {
    try {
      setLoading(true);
      const data = await getAgregaciones();
      setAgregaciones(data);
      if (data.length > 0 && !selectedAgr) {
        setSelectedAgr(data[0]);
      }
    } catch (err) {
      toast.error('Error al cargar agregaciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (selectedAgr?.content) {
      navigator.clipboard.writeText(selectedAgr.content)
        .then(() => toast.success('Código copiado al portapapeles'))
        .catch(() => toast.error('Error al copiar'));
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.content || !formData.collection) {
      toast.error('Nombre, colección y contenido son obligatorios');
      return;
    }
    
    try {
      if (selectedAgr?.id && isEditing !== 'new') {
        const updated = await updateAgregacion(selectedAgr.id, formData);
        setAgregaciones(agregaciones.map(a => a.id === updated.id ? updated : a));
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
      setAgregaciones(agregaciones.filter(a => a.id !== id));
      if (selectedAgr?.id === id) setSelectedAgr(null);
      toast.success('Agregación eliminada');
    } catch (err) {
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  const startEdit = (agr) => {
    setFormData({ name: agr.name, description: agr.description || '', collection: agr.collection || '', content: agr.content });
    setIsEditing('edit');
  };

  const startNew = () => {
    setFormData({ name: '', description: '', collection: '', content: '' });
    setSelectedAgr(null);
    setIsEditing('new');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', color: '#eab308', padding: '60px 20px' }}>
        Cargando agregaciones...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', flex: 1, minHeight: 0 }}>
      {/* Sidebar List */}
      <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '1px solid var(--glass-border)', paddingRight: '20px', overflowY: 'auto' }}>
        <button 
          onClick={startNew}
          className="btn btn-primary"
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> Nueva Agregación
        </button>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {agregaciones.length === 0 && (
            <div style={{ color: 'var(--on-surface-variant)', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
              No hay agregaciones guardadas.
            </div>
          )}
          {agregaciones.map(agr => (
            <div 
              key={agr.id}
              onClick={() => { setSelectedAgr(agr); setIsEditing(false); }}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: selectedAgr?.id === agr.id ? 'var(--primary-container)' : 'var(--surface-low)',
                border: `1px solid ${selectedAgr?.id === agr.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontWeight: '600', color: selectedAgr?.id === agr.id ? '#fff' : 'var(--on-surface)', marginBottom: '4px' }}>
                {agr.name}
              </div>
              {agr.description && selectedAgr?.id === agr.id && (
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {agr.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto', paddingRight: '12px' }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>{isEditing === 'new' ? 'Crear Agregación' : 'Editar Agregación'}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-black" onClick={() => setIsEditing(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}>
                  <X size={16} /> Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}>
                  <Save size={16} /> Guardar
                </button>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface-variant)' }}>Nombre</label>
              <input 
                className="inscripciones-input"
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Buscar por Structure ID..."
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface-variant)' }}>Descripción (Opcional)</label>
              <input 
                className="inscripciones-input"
                type="text" 
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descripción del propósito..."
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface-variant)' }}>Colección a la que pertenece</label>
              <input 
                className="inscripciones-input"
                type="text" 
                value={formData.collection}
                onChange={e => setFormData({ ...formData, collection: e.target.value })}
                placeholder="Ej. users, enrollments, etc."
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface-variant)' }}>Pipeline (JSON)</label>
              <textarea 
                className="inscripciones-input"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="[\n  { $match: { ... } }\n]"
                style={{ width: '100%', flex: 1, minHeight: '300px', fontFamily: 'monospace', resize: 'vertical' }}
              />
            </div>
          </div>
        ) : selectedAgr ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', color: 'var(--on-surface)' }}>{selectedAgr.name}</h2>
                {selectedAgr.collection && (
                  <div style={{ display: 'inline-block', background: 'var(--surface-low)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: 'var(--primary)', marginBottom: '8px', border: '1px solid var(--glass-border)' }}>
                    Colección: {selectedAgr.collection}
                  </div>
                )}
                {selectedAgr.description && (
                  <p style={{ margin: 0, color: 'var(--on-surface-variant)' }}>{selectedAgr.description}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => startEdit(selectedAgr)} className="btn-clear" title="Editar" style={{ padding: '8px', background: 'var(--surface-low)', borderRadius: '8px', color: 'var(--on-surface-variant)' }}>
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(selectedAgr.id)} className="btn-clear" title="Eliminar" style={{ padding: '8px', background: 'var(--surface-low)', borderRadius: '8px', color: '#ef4444' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', background: '#0d1117', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '6px' }}><Code size={14} /> Pipeline</span>
                <button onClick={handleCopy} className="btn-clear" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--primary)' }}>
                  <Copy size={14} /> Copiar
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', color: '#c9d1d9', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {selectedAgr.content}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--on-surface-variant)' }}>
            <Code size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Selecciona una agregación de la lista o crea una nueva.</p>
          </div>
        )}
      </div>
    </div>
  );
}
