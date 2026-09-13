import React, { useState, useRef } from "react";
import { Database, Upload, Play, AlertCircle, CheckCircle2, Loader2, FileJson, Copy, ChevronDown, ChevronUp, Users, GitBranch, Layers, Link2, Tag, BookOpen } from "lucide-react";
import { toast } from "react-toastify";
import { supabase } from "../services/supabaseClient";

const MIGRATION_TYPES = [
  { id: "users",        label: "Usuarios",         table: "users",         icon: Users,    desc: "Perfiles, correos y programas" },
  { id: "structures",   label: "Estructuras",      table: "structures",    icon: GitBranch,desc: "Jerarquía de grupos académicos" },
  { id: "pensum_levels",label: "Niveles de Pensum",table: "pensum_levels", icon: Layers,   desc: "Niveles curriculares por alianza" },
  { id: "alliances",    label: "Alianzas",         table: "alianzas",      icon: Link2,    desc: "Entidades aliadas al sistema" },
  { id: "estados",      label: "Estados",          table: "estados",       icon: Tag,      desc: "Estados de negocio y matrícula" },
  { id: "programas",    label: "Programas",        table: "programas",     icon: BookOpen, desc: "Oferta académica disponible" },
];

export default function Migrations() {
  const [selectedType, setSelectedType] = useState(MIGRATION_TYPES[0].id);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [isQueryExpanded, setIsQueryExpanded] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/json" && !selectedFile.name.endsWith(".json")) {
        toast.error("Por favor, selecciona un archivo JSON vÃ¡lido.");
        setFile(null);
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
  };

  const processInBatches = async (data, batchSize, processBatchFn) => {
    let totalProcessed = 0;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await processBatchFn(batch, i);
      totalProcessed += batch.length;
      setProgress((prev) => ({ ...prev, current: totalProcessed }));
    }
  };

  const migrateUsers = async (data) => {
    const transformed = data.map(doc => ({
      mongo_id: doc._id?.$oid || doc._id,
      alliance_id: doc.alliance_id?.$oid || doc.alliance_id || null,
      incremental_user_code: doc.incremental_user_code,
      full_name: doc.profile?.full_name?.trim() || null,
      email: doc.profile?.email?.trim() || null,
      phone: doc.profile?.phone?.trim() || null,
      programs: doc.programs || []
    }));

    const validData = transformed.filter(u => u.mongo_id && u.incremental_user_code != null);

    if (validData.length === 0) {
      throw new Error("No se encontraron usuarios vÃ¡lidos (falta mongo_id o incremental_user_code).");
    }

    setProgress({ current: 0, total: validData.length, status: "Upserting usuarios..." });

    await processInBatches(validData, 500, async (batch) => {
      const { error } = await supabase.from('users').upsert(batch, { onConflict: 'mongo_id', ignoreDuplicates: false });
      if (error) throw error;
    });
  };

  const migrateStructures = async (data) => {
    const transformed = data.map(doc => {
      const userIds = (doc.config?.users || [])
        .map(u => u.user?.$oid || u.user)
        .filter(Boolean);

      return {
        mongo_id: doc._id?.$oid || doc._id,
        name: doc.name || 'Sin nombre',
        users: userIds,
        parent_id: doc.parent?.$oid || doc.parent || null,
        pensum_level_id: doc.config?.pensum_level?.$oid || doc.config?.pensum_level || null,
        alliance_id: doc.alliance_id?.$oid || doc.alliance_id || null
      };
    });

    const allMongoIds = new Set(transformed.map(s => s.mongo_id));
    const validData = transformed.filter(s => s.mongo_id);

    if (validData.length === 0) {
      throw new Error("No se encontraron estructuras vÃ¡lidas (falta mongo_id).");
    }

    // Pass 1
    setProgress({ current: 0, total: validData.length, status: "Pase 1: Insertando sin parent_id..." });
    const pass1Data = validData.map(s => ({ ...s, parent_id: null }));
    await processInBatches(pass1Data, 500, async (batch) => {
      const { error } = await supabase.from('structures').upsert(batch, { onConflict: 'mongo_id', ignoreDuplicates: false });
      if (error) throw error;
    });

    // Pass 2
    const pass2Data = validData.filter(s => s.parent_id !== null && allMongoIds.has(s.parent_id));
    if (pass2Data.length > 0) {
      setProgress({ current: 0, total: pass2Data.length, status: "Pase 2: Actualizando con parent_ids..." });
      await processInBatches(pass2Data, 500, async (batch) => {
        const { error } = await supabase.from('structures').upsert(batch, { onConflict: 'mongo_id', ignoreDuplicates: false });
        if (error) throw error;
      });
    }
  };

  const migratePensumLevels = async (data) => {
    const transformed = data.map(doc => ({
      mongo_id: doc._id?.$oid || doc._id,
      name: doc.name || 'Sin nombre',
      alliance_id: doc.alliance_id?.$oid || doc.alliance_id || null
    }));

    const validData = transformed.filter(s => s.mongo_id);

    if (validData.length === 0) {
      throw new Error("No se encontraron niveles de pensum vÃ¡lidos (falta mongo_id).");
    }

    setProgress({ current: 0, total: validData.length, status: "Upserting niveles de pensum..." });

    await processInBatches(validData, 500, async (batch) => {
      const { error } = await supabase.from('pensum_levels').upsert(batch, { onConflict: 'mongo_id', ignoreDuplicates: false });
      if (error) throw error;
    });
  };

  const migrateAlliances = async (data) => {
    const transformed = data.map(doc => ({
      mongo_id: doc._id?.$oid || doc._id,
      name: doc.name || 'Sin nombre'
    }));

    const validData = transformed.filter(a => a.mongo_id);

    if (validData.length === 0) {
      throw new Error("No se encontraron alianzas vÃ¡lidas (falta mongo_id).");
    }

    setProgress({ current: 0, total: validData.length, status: "Upserting alianzas..." });

    await processInBatches(validData, 500, async (batch) => {
      const { error } = await supabase.from('alianzas').upsert(batch, { onConflict: 'mongo_id', ignoreDuplicates: false });
      if (error) throw error;
    });
  };

  const migrateEstados = async (data) => {
    const transformed = data.map(doc => ({
      mongo_id: doc._id?.$oid || doc._id,
      name: doc.name || 'Sin nombre',
      alliance_id: doc.alliance?.$oid || doc.alliance || null
    }));

    const validData = transformed.filter(a => a.mongo_id);

    if (validData.length === 0) {
      throw new Error("No se encontraron estados vÃ¡lidos (falta mongo_id).");
    }

    setProgress({ current: 0, total: validData.length, status: "Upserting estados..." });

    await processInBatches(validData, 500, async (batch) => {
      const { error } = await supabase.from('estados').upsert(batch, { onConflict: 'mongo_id', ignoreDuplicates: false });
      if (error) throw error;
    });
  };

  const migrateProgramas = async (data) => {
    const transformed = data.map(doc => ({
      mongo_id: doc._id?.$oid || doc._id,
      name: doc.name || 'Sin nombre',
      alliance_id: doc.alliance_id?.$oid || doc.alliance_id || null
    }));

    const validData = transformed.filter(a => a.mongo_id);

    if (validData.length === 0) {
      throw new Error("No se encontraron programas vÃ¡lidos (falta mongo_id).");
    }

    setProgress({ current: 0, total: validData.length, status: "Upserting programas..." });

    await processInBatches(validData, 500, async (batch) => {
      const { error } = await supabase.from('programas').upsert(batch, { onConflict: 'mongo_id', ignoreDuplicates: false });
      if (error) throw error;
    });
  };

  const handleMigrate = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: 0, status: "Leyendo archivo..." });

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      if (!Array.isArray(jsonData)) {
        throw new Error("El archivo JSON debe contener un arreglo de documentos.");
      }

      setProgress({ current: 0, total: jsonData.length, status: "Validando y transformando datos..." });

      // ValidaciÃ³n ultra-estricta escaneando hasta 50 documentos para detectar el esquema real
      const sampleSize = Math.min(jsonData.length, 50);
      const sampleDocs = jsonData.slice(0, sampleSize);

      const hasUserFields = sampleDocs.some(doc => doc.incremental_user_code !== undefined || doc.profile !== undefined);
      const hasStructureFields = sampleDocs.some(doc => doc.parent !== undefined || doc.config !== undefined);
      const hasName = sampleDocs.some(doc => doc.name !== undefined);

      if (selectedType === "users") {
        if (!hasUserFields) {
          throw new Error("âŒ Rechazado: El archivo NO corresponde a Usuarios (faltan campos clave como 'profile' o 'incremental_user_code').");
        }
        await migrateUsers(jsonData);
      } else if (selectedType === "structures") {
        if (hasUserFields) {
          throw new Error("âŒ Rechazado: Intentas subir un archivo de Usuarios en la secciÃ³n de Estructuras.");
        }
        if (!hasStructureFields) {
          throw new Error("âŒ Rechazado: El archivo NO corresponde a Estructuras (faltan campos clave como 'config' o 'parent'). Parece ser de Niveles de Pensum.");
        }
        await migrateStructures(jsonData);
      } else if (selectedType === "pensum_levels") {
        if (hasUserFields) {
          throw new Error("âŒ Rechazado: Intentas subir un archivo de Usuarios en la secciÃ³n de Niveles de Pensum.");
        }
        if (hasStructureFields) {
          throw new Error("âŒ Rechazado: Intentas subir un archivo de Estructuras en la secciÃ³n de Niveles de Pensum.");
        }
        if (!hasName) {
          throw new Error("âŒ Rechazado: El archivo no tiene el formato vÃ¡lido para Niveles de Pensum (falta el campo 'name').");
        }
        await migratePensumLevels(jsonData);
      } else if (selectedType === "alliances") {
        if (hasUserFields) {
          throw new Error("âŒ Rechazado: Intentas subir un archivo de Usuarios en la secciÃ³n de Alianzas.");
        }
        if (hasStructureFields) {
          throw new Error("âŒ Rechazado: Intentas subir un archivo de Estructuras en la secciÃ³n de Alianzas.");
        }
        if (!hasName) {
          throw new Error("âŒ Rechazado: El archivo no tiene el formato vÃ¡lido para Alianzas (falta el campo 'name').");
        }
        await migrateAlliances(jsonData);
      } else if (selectedType === "estados") {
        if (hasUserFields) {
          throw new Error("âŒ Rechazado: Intentas subir un archivo de Usuarios en la secciÃ³n de Estados.");
        }
        if (hasStructureFields) {
          throw new Error("âŒ Rechazado: Intentas subir un archivo de Estructuras en la secciÃ³n de Estados.");
        }
        if (!hasName) {
          throw new Error("âŒ Rechazado: El archivo no tiene el formato vÃ¡lido para Estados (falta el campo 'name').");
        }
        await migrateEstados(jsonData);
      } else if (selectedType === "programas") {
        if (hasUserFields) {
          throw new Error("âŒ Rechazado: Intentas subir un archivo de Usuarios en la secciÃ³n de Programas.");
        }
        if (hasStructureFields) {
          throw new Error("âŒ Rechazado: Intentas subir un archivo de Estructuras en la secciÃ³n de Programas.");
        }
        if (!hasName) {
          throw new Error("âŒ Rechazado: El archivo no tiene el formato vÃ¡lido para Programas (falta el campo 'name').");
        }
        await migrateProgramas(jsonData);
      }

      toast.success("Â¡MigraciÃ³n completada con Ã©xito!");
      setProgress({ current: 100, total: 100, status: "Completado" });
    } catch (err) {
      console.error(err);
      toast.error(`Error en la migraciÃ³n: ${err.message}`);
      setProgress({ current: 0, total: 0, status: "Error" });
    } finally {
      setIsProcessing(false);
      // Opcionalmente, resetear archivo:
      // setFile(null);
      // if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getMongoQuery = () => {
    if (selectedType === "users") {
      return {
        filter: `{deleted:false, alliance_id:{$in:[ObjectId('6303ed663138387a1669d82a'), ObjectId('602169e217b5c8a27f9e9c06')]}}`,
        project: `{incremental_user_code:1, "programs.structure":1, "profile.email":1, "profile.phone":1, "profile.full_name":1, alliance_id:1, "programs.business_statuses.business_status":1, created_at:1}`
      };
    } else if (selectedType === "structures") {
      return {
        filter: `{structure_category_id: {$in: [ObjectId("602ab2860d179ecd25c3a7bb"),ObjectId("6303ed683138387a1669d84b"),ObjectId("602ab2860d179ecd25c3a7ba"),ObjectId("6303ed683138387a1669d84a")]}}`,
        project: `{ "config.users.user": 1, name: 1, "config.pensum_level": 1, alliance_id: 1, parent: 1 }`
      };
    } else if (selectedType === "pensum_levels") {
      return {
        filter: `{ deleted: false }`,
        project: `{ name: 1, alliance_id: 1 }`
      };
    } else if (selectedType === "alliances") {
      return {
        filter: `{ deleted: false }`,
        project: `{ _id: 1, name: 1 }`
      };
    } else if (selectedType === "estados") {
      return {
        filter: `{ deleted: false }`,
        project: `{ name: 1, alliance_id: 1 }`
      };
    } else if (selectedType === "programas") {
      return {
        filter: `{structure_category_id:{$in:[ObjectId('602ab2860d179ecd25c3a7b8'), ObjectId('6303ed683138387a1669d848')]} , deleted:false}`,
        project: `{_id:1, name:1, alliance_id:1}`
      };
    }
    return null;
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        padding: '18px 24px',
        width: '100%',
        maxWidth: '860px',
        margin: '0 auto',
      }}
    >
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(18,163,131,0.3)',
        }}>
          <Database size={22} style={{ color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, fontFamily: "'Nunito', sans-serif", color: 'var(--on-surface)', lineHeight: 1.2 }}>
            Migraciones de Base de Datos
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--on-surface-variant)', fontFamily: "'Space Grotesk', sans-serif" }}>
            Actualiza registros masivos subiendo archivos JSON directamente al sistema.
          </p>
        </div>
      </div>

      {/* â”€â”€ Main card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>

        {/* â”€â”€ 1. Tipo de migraciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div>
          <p style={{
            margin: '0 0 14px',
            fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            1 Â· Selecciona quÃ© vas a migrar
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {MIGRATION_TYPES.map(type => {
              const active = selectedType === type.id;
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  disabled={isProcessing}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: active
                      ? 'linear-gradient(135deg, rgba(18,163,131,0.18) 0%, rgba(18,163,131,0.07) 100%)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(18,163,131,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing && !active ? 0.45 : 1,
                    textAlign: 'left',
                    transition: 'all 0.18s ease',
                    boxShadow: active ? '0 4px 16px rgba(18,163,131,0.12)' : 'none',
                  }}
                  onMouseEnter={e => { if (!active && !isProcessing) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; } }}
                  onMouseLeave={e => { if (!active && !isProcessing) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; } }}
                >
                  {/* Icon pill */}
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? 'rgba(18,163,131,0.2)' : 'rgba(255,255,255,0.06)',
                    color: active ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.18s ease',
                  }}>
                    <Icon size={14} />
                  </div>

                  {/* Label + desc */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 700,
                      color: active ? 'var(--primary)' : 'rgba(255,255,255,0.8)',
                      fontFamily: "'Space Grotesk', sans-serif",
                      transition: 'color 0.18s ease',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {type.label}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: active ? 'rgba(18,163,131,0.65)' : 'rgba(255,255,255,0.25)',
                      fontFamily: "'Space Grotesk', sans-serif",
                      lineHeight: 1.3,
                      transition: 'color 0.18s ease',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {type.desc}
                    </span>
                  </div>

                  {/* Active check */}
                  {active && (
                    <CheckCircle2 size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* â”€â”€ Divider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />

        {/* â”€â”€ 2. Archivo JSON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div>
          <p style={{
            margin: '0 0 14px',
            fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            2 Â· Selecciona el archivo JSON
          </p>
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${file ? 'rgba(18,163,131,0.6)' : 'rgba(255,255,255,0.09)'}`,
              borderRadius: '14px',
              padding: '32px 24px',
              textAlign: 'center',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              background: file ? 'rgba(18,163,131,0.05)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="file"
              accept=".json,application/json"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={isProcessing}
            />
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'rgba(18,163,131,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileJson size={24} style={{ color: 'var(--primary)' }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)' }}>{file.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB â€” clic para cambiar
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Upload size={22} style={{ color: 'rgba(255,255,255,0.35)' }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface)' }}>
                  Haz clic para cargar el archivo JSON
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Grotesk', sans-serif" }}>
                  El nombre del archivo no importa
                </span>
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€ Query helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {getMongoQuery() && (
          <div style={{
            borderRadius: '12px',
            background: 'rgba(255,171,0,0.07)',
            border: '1px solid rgba(255,171,0,0.18)',
            overflow: 'hidden',
          }}>
            <div
              onClick={() => setIsQueryExpanded(!isQueryExpanded)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px',
                cursor: 'pointer', userSelect: 'none',
              }}
            >
              <AlertCircle size={17} style={{ color: '#ffab00', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', flex: 1 }}>
                Para obtener estos datos ejecuta esta consulta en Mongo Compass
              </p>
              {isQueryExpanded
                ? <ChevronUp size={17} style={{ color: 'rgba(255,255,255,0.35)' }} />
                : <ChevronDown size={17} style={{ color: 'rgba(255,255,255,0.35)' }} />
              }
            </div>
            {isQueryExpanded && (
              <div className="animate-fade-in" style={{
                borderTop: '1px solid rgba(255,171,0,0.12)',
                padding: '16px',
                display: 'flex', flexDirection: 'column', gap: '12px',
              }}>
                {[['FILTER', getMongoQuery().filter], ['PROJECT', getMongoQuery().project]].map(([label, value]) => (
                  <div key={label}>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {label}
                    </span>
                    <div style={{ position: 'relative', marginTop: '6px' }}>
                      <pre style={{
                        margin: 0, padding: '12px 40px 12px 14px',
                        background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
                        fontSize: '12px', fontFamily: "'Space Grotesk', monospace",
                        color: 'rgba(255,255,255,0.55)',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        {value}
                      </pre>
                      <button
                        onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copiado`); }}
                        title={`Copiar ${label}`}
                        style={{
                          position: 'absolute', top: '8px', right: '8px',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.45)', padding: '5px', borderRadius: '6px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* â”€â”€ Progress bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {(isProcessing || progress.status) && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)', fontFamily: "'Space Grotesk', sans-serif" }}>
                {progress.status}
              </span>
              <span style={{ fontSize: '13px', fontFamily: "'Space Grotesk', monospace", color: 'var(--primary)' }}>
                {progress.current} / {progress.total || 'â€”'}
              </span>
            </div>
            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: '100px',
                background: 'linear-gradient(90deg, var(--primary), var(--primary-container))',
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
                transition: 'width 0.3s ease',
                boxShadow: '0 0 8px rgba(18,163,131,0.5)',
              }} />
            </div>
          </div>
        )}

        {/* â”€â”€ CTA button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <button
          onClick={handleMigrate}
          disabled={!file || isProcessing}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '14px 24px',
            borderRadius: '12px',
            background: !file || isProcessing
              ? 'rgba(255,255,255,0.04)'
              : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
            color: !file || isProcessing ? 'rgba(255,255,255,0.25)' : '#060606',
            border: `1px solid ${!file || isProcessing ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
            cursor: !file || isProcessing ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '15px',
            fontFamily: "'Nunito', sans-serif",
            transition: 'all 0.2s ease',
            boxShadow: !file || isProcessing ? 'none' : '0 4px 16px rgba(18,163,131,0.35)',
          }}
        >
          {isProcessing ? <Loader2 className="lucide-spin" size={19} /> : <Play size={19} />}
          {isProcessing ? 'Procesando...' : 'Ejecutar MigraciÃ³n'}
        </button>

      </div>
    </div>
  );
}