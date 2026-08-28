import React, { useState, useRef } from "react";
import { Database, Upload, Play, AlertCircle, CheckCircle2, Loader2, FileJson } from "lucide-react";
import { toast } from "react-toastify";
import { supabase } from "../services/supabaseClient";

const MIGRATION_TYPES = [
  { id: "users", label: "Usuarios", table: "users" },
  { id: "structures", label: "Estructuras", table: "structures" },
  { id: "pensum_levels", label: "Niveles de Pensum", table: "pensum_levels" },
];

export default function Migrations() {
  const [selectedType, setSelectedType] = useState(MIGRATION_TYPES[0].id);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/json" && !selectedFile.name.endsWith(".json")) {
        toast.error("Por favor, selecciona un archivo JSON válido.");
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
      throw new Error("No se encontraron usuarios válidos (falta mongo_id o incremental_user_code).");
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
      throw new Error("No se encontraron estructuras válidas (falta mongo_id).");
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
      throw new Error("No se encontraron niveles de pensum válidos (falta mongo_id).");
    }

    setProgress({ current: 0, total: validData.length, status: "Upserting niveles de pensum..." });

    await processInBatches(validData, 500, async (batch) => {
      const { error } = await supabase.from('pensum_levels').upsert(batch, { onConflict: 'mongo_id', ignoreDuplicates: false });
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

      // Validación ultra-estricta escaneando hasta 50 documentos para detectar el esquema real
      const sampleSize = Math.min(jsonData.length, 50);
      const sampleDocs = jsonData.slice(0, sampleSize);

      const hasUserFields = sampleDocs.some(doc => doc.incremental_user_code !== undefined || doc.profile !== undefined);
      const hasStructureFields = sampleDocs.some(doc => doc.parent !== undefined || doc.config !== undefined);
      const hasName = sampleDocs.some(doc => doc.name !== undefined);

      if (selectedType === "users") {
        if (!hasUserFields) {
          throw new Error("❌ Rechazado: El archivo NO corresponde a Usuarios (faltan campos clave como 'profile' o 'incremental_user_code').");
        }
        await migrateUsers(jsonData);
      } else if (selectedType === "structures") {
        if (hasUserFields) {
          throw new Error("❌ Rechazado: Intentas subir un archivo de Usuarios en la sección de Estructuras.");
        }
        if (!hasStructureFields) {
          throw new Error("❌ Rechazado: El archivo NO corresponde a Estructuras (faltan campos clave como 'config' o 'parent'). Parece ser de Niveles de Pensum.");
        }
        await migrateStructures(jsonData);
      } else if (selectedType === "pensum_levels") {
        if (hasUserFields) {
          throw new Error("❌ Rechazado: Intentas subir un archivo de Usuarios en la sección de Niveles de Pensum.");
        }
        if (hasStructureFields) {
          throw new Error("❌ Rechazado: Intentas subir un archivo de Estructuras en la sección de Niveles de Pensum.");
        }
        if (!hasName) {
          throw new Error("❌ Rechazado: El archivo no tiene el formato válido para Niveles de Pensum (falta el campo 'name').");
        }
        await migratePensumLevels(jsonData);
      }

      toast.success("¡Migración completada con éxito!");
      setProgress({ current: 100, total: 100, status: "Completado" });
    } catch (err) {
      console.error(err);
      toast.error(`Error en la migración: ${err.message}`);
      setProgress({ current: 0, total: 0, status: "Error" });
    } finally {
      setIsProcessing(false);
      // Opcionalmente, resetear archivo:
      // setFile(null);
      // if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: "24px", maxWidth: "800px", margin: "0 auto", overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "12px",
          background: "var(--primary-container)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Database size={24} style={{ color: "#fff" }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "var(--on-surface)", fontFamily: "'Nunito', sans-serif" }}>
            Migraciones de Base de Datos
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--on-surface-variant)" }}>
            Actualiza registros masivos subiendo archivos JSON directamente al sistema.
          </p>
        </div>
      </div>

      <div style={{ background: "var(--surface-low)", border: "1px solid var(--glass-border)", borderRadius: "16px", padding: "24px" }}>
        
        {/* Selector de Tipo */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--on-surface)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            1. Selecciona qué vas a migrar
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            {MIGRATION_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                disabled={isProcessing}
                style={{
                  display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
                  padding: "12px", borderRadius: "12px",
                  background: selectedType === type.id ? "var(--primary-container)" : "var(--surface-void)",
                  border: `1px solid ${selectedType === type.id ? "var(--primary)" : "var(--glass-border)"}`,
                  color: selectedType === type.id ? "#fff" : "var(--on-surface)",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  opacity: isProcessing && selectedType !== type.id ? 0.5 : 1,
                  fontWeight: 600, fontSize: "14px", transition: "all 0.2s ease"
                }}
              >
                {selectedType === type.id ? <CheckCircle2 size={16} /> : <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid currentColor", opacity: 0.5 }} />}
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Carga de Archivo */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--on-surface)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            2. Selecciona el archivo JSON
          </label>
          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--glass-border)",
              borderRadius: "12px",
              padding: "32px",
              textAlign: "center",
              cursor: isProcessing ? "not-allowed" : "pointer",
              background: "var(--surface-void)",
              transition: "border-color 0.2s ease",
              borderColor: file ? "var(--primary)" : "var(--glass-border)"
            }}
          >
            <input 
              type="file" 
              accept=".json,application/json" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: "none" }} 
              disabled={isProcessing}
            />
            {file ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <FileJson size={32} style={{ color: "var(--primary)" }} />
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--on-surface)" }}>{file.name}</span>
                <span style={{ fontSize: "13px", color: "var(--on-surface-variant)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <Upload size={32} style={{ color: "var(--on-surface-variant)" }} />
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--on-surface)" }}>Haz clic para cargar el archivo JSON</span>
                <span style={{ fontSize: "13px", color: "var(--on-surface-variant)" }}>El nombre del archivo no importa</span>
              </div>
            )}
          </div>
        </div>

        {/* Acciones e Información de Progreso */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px", background: "rgba(255, 171, 0, 0.1)", borderRadius: "8px", border: "1px solid rgba(255, 171, 0, 0.2)" }}>
            <AlertCircle size={20} style={{ color: "#ffab00", flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--on-surface)", lineHeight: "1.5" }}>
                <strong>Importante:</strong> Esta acción modificará la base de datos de producción directamente en lotes de 500 registros. 
                El proceso de transformación y limpieza se aplicará automáticamente según el tipo de migración seleccionado.
              </p>
            </div>
          </div>

          {isProcessing || progress.status ? (
            <div style={{ background: "var(--surface-void)", padding: "16px", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--on-surface)" }}>{progress.status}</span>
                <span style={{ fontSize: "13px", fontFamily: "'Space Grotesk', monospace", color: "var(--on-surface)" }}>{progress.current} / {progress.total || "?"}</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "var(--surface-low)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ 
                  height: "100%", 
                  background: "var(--primary)", 
                  width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : "0%",
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>
          ) : null}

          <button
            onClick={handleMigrate}
            disabled={!file || isProcessing}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "16px", borderRadius: "12px",
              background: !file || isProcessing ? "var(--surface-void)" : "var(--primary)",
              color: !file || isProcessing ? "var(--on-surface-variant)" : "#090909",
              border: `1px solid ${!file || isProcessing ? "var(--glass-border)" : "var(--primary)"}`,
              cursor: !file || isProcessing ? "not-allowed" : "pointer",
              fontWeight: 700, fontSize: "16px", transition: "all 0.2s ease"
            }}
          >
            {isProcessing ? <Loader2 className="lucide-spin" size={20} /> : <Play size={20} />}
            {isProcessing ? "Procesando..." : "Ejecutar Migración"}
          </button>
        </div>

      </div>
    </div>
  );
}
