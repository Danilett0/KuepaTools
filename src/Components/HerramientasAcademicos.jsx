import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  GraduationCap, Terminal, User, List, Search, FileSpreadsheet, ShieldAlert,
  Users, Copy, Loader2, Check
} from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import AllianceSwitcher from "./ui/AllianceSwitcher";
import IncAutocomplete from "./ui/IncAutocomplete";
import { ALLIANCE_IDS } from "../utils/constants";
import { useAppStore } from "../store/useAppStore";
import { useUsuariosCompletos } from "../hooks/useUsuariosCompletos";
import { generateAuditGroupSubjectCommand, fetchGroupStructure, fetchStudentsInfo } from "../services/groupAuditService";

// ── Utilidad: extrae el ObjectId del grupo académico ─────────────────────────
function extractGroupId(input) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/\b([a-f0-9]{24})\b/i);
  return match ? match[1] : "";
}

const GRUPOS_TABS = [
  { id: "herramientas-undo", label: "Deshacer Publicación", icon: Terminal, subtitle: "Genera comandos para deshacer la publicación de grupos académicos" },
  { id: "herramientas-final", label: "Re-calcular Nota", icon: User, subtitle: "Finaliza o re-calcula la nota de un estudiante en su grupo académico" },
  { id: "herramientas-extraer", label: "Extraer Grupos", icon: List, subtitle: "Extrae grupos académicos y estructuras a partir de IDs o archivos Excel" },
  { id: "herramientas-estudiante", label: "Grupos por Estudiante", icon: Users, subtitle: "Consulta los grupos académicos asignados a un estudiante" },
  { id: "herramientas-auditar-grupo", label: "Auditar Grupo", icon: ShieldAlert, subtitle: "Audita estudiantes y materias asignadas a un grupo académico" },
];

// ── Card 1: Deshacer publicación ────────────────────────────────────────────
function UndoPublicationCard({ clearToken }) {
  const [inputValue, setInputValue] = useLocalStorage("herr_undo_groupInput", "");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  
  const aiPrefilledData = useAppStore(state => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore(state => state.setAiPrefilledData);

  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.intent === 'UNDO_PUBLICATION') {
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 0) {
        setInputValue(aiPrefilledData.ids[0]);
      }
      setAiPrefilledData(null);
    }
  }, [aiPrefilledData, setInputValue, setAiPrefilledData]);

  const groupIds = useMemo(() => Array.from(new Set(inputValue.match(/\b([a-f0-9]{24})\b/ig) || [])), [inputValue]);
  const command = groupIds.length > 0 
    ? `magik run:prod undo:publication [${groupIds.map(id => `"${id}"`).join(",")}]` 
    : "";

  const handleClear = useCallback(() => setInputValue(""), [setInputValue]);

  useEffect(() => {
    if (clearToken > 0) handleClear();
  }, [clearToken, handleClear]);

  const handleCopy = () => {
    if (!command) return;
    navigator.clipboard.writeText(command);
    setCopied(true);
    toast.success("Comando copiado al portapapeles");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      let allText = "";
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        allText += json.flat().join(" ") + " ";
      });
      
      const ids = Array.from(new Set(allText.match(/\b([a-f0-9]{24})\b/ig) || []));
      if (ids.length > 0) {
        setInputValue(prev => {
          const prevIds = prev.match(/\b([a-f0-9]{24})\b/ig) || [];
          return Array.from(new Set([...prevIds, ...ids])).filter(Boolean).join('\n');
        });
        toast.success(`Se extrajeron ${ids.length} grupos del archivo`);
      } else {
        toast.warning("No se encontraron IDs válidos en el archivo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al leer el archivo Excel");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Input ── */}
      <div className="inscr-field-block">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label className="inscr-field-label">
            ID o URL del Grupo Académico
            {groupIds.length > 0 && <span className="inscr-count-badge" style={{ marginLeft: "8px" }}>{groupIds.length} grupos</span>}
          </label>
          
          <div>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              style={{ display: "none" }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "transparent", color: "var(--primary)",
                border: "1px solid var(--glass-border)", borderRadius: "8px",
                padding: "4px 10px", fontSize: "11px", fontWeight: 700,
                fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "rgba(18, 163, 131, 0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "transparent"; }}
            >
              <FileSpreadsheet size={13} /> Subir Excel
            </button>
          </div>
        </div>
        <textarea
          className="inscr-textarea"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={"6765d926107fc303893724e9\nhttps://sis.kuepa.com/academic-group/details/6765d926107fc303893724e9"}
          style={{ minHeight: groupIds.length > 1 ? "100px" : "56px", resize: "vertical" }}
        />
        {inputValue.trim() && groupIds.length === 0 && (
          <span style={{ fontSize: "11.5px", color: "#ef4444", fontFamily: "'Space Grotesk', sans-serif" }}>
            No se pudo extraer ningún ObjectId válido
          </span>
        )}
      </div>

      {/* ── Comando generado ── */}
      <div className="inscr-field-block">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label className="inscr-field-label">Comando generado</label>
          {command && (
            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: copied ? "rgba(18, 163, 131, 0.25)" : "rgba(18, 163, 131, 0.15)",
                color: "var(--primary)",
                border: "1px solid rgba(18, 163, 131, 0.3)", borderRadius: "8px",
                padding: "4px 12px", fontSize: "11px", fontWeight: 700,
                fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "all 0.2s ease"
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copiado" : "Copiar"}
            </button>
          )}
        </div>
        <div style={{
          minHeight: "46px", maxHeight: "150px", overflowY: "auto",
          display: "flex", alignItems: "center", padding: "10px 14px",
          background: "rgba(0, 0, 0, 0.25)", border: "1px solid var(--glass-border)",
          borderRadius: "10px", fontFamily: "'Space Grotesk', monospace", fontSize: "12.5px",
          color: command ? "var(--on-surface)" : "var(--on-surface-variant)",
          wordBreak: "break-all"
        }}>
          {command ? (
            <span style={{ color: "var(--primary)" }}>{command}</span>
          ) : (
            <span style={{ fontStyle: "italic", opacity: 0.6 }}>Ingresa un ID o URL para generar el comando…</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card 2: Finalizar usuario en grupo ──────────────────────────────────────
function FinalUserCard({ alianza, clearToken }) {
  const [groupId, setGroupId] = useLocalStorage("herr_final_groupId", "");
  const [incText, setIncText] = useLocalStorage("herr_final_incText", "");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [bulkMode, setBulkMode] = useLocalStorage("herr_final_bulkMode", false);
  const [bulkText, setBulkText] = useLocalStorage("herr_final_bulkText", "");
  const fileInputRef = useRef(null);

  const aiPrefilledData = useAppStore(state => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore(state => state.setAiPrefilledData);
  const { findUsersByIncList } = useUsuariosCompletos();

  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.intent === 'FINAL_USER') {
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 0) {
        setIncText(aiPrefilledData.ids[0]);
      }
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 1) {
        setGroupId(aiPrefilledData.ids[1]);
      }
      setAiPrefilledData(null);
    }
  }, [aiPrefilledData, setIncText, setGroupId, setAiPrefilledData]);

  const resolvedGroupId = extractGroupId(groupId);
  const allianceId = alianza === "kuepa" ? ALLIANCE_IDS.kuepa : ALLIANCE_IDS.na;

  const handleSelectUser = (user) => {
    if (user) {
      setStudentId(user._id.$oid || user._id);
      setStudentName(user.profile?.full_name || "");
    } else {
      setStudentId("");
      setStudentName("");
    }
  };

  const handleClear = useCallback(() => {
    setGroupId("");
    setIncText("");
    setStudentId("");
    setStudentName("");
    setBulkText("");
  }, [setGroupId, setIncText, setBulkText]);

  useEffect(() => {
    if (clearToken > 0) handleClear();
  }, [clearToken, handleClear]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      let allText = "";
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        allText += json.flat().join(" ") + " ";
      });
      
      const extractedIds = Array.from(new Set(allText.match(/\b([a-f0-9]{24})\b|\b(\d{4,12})\b/ig) || [])).filter(Boolean);
      
      if (extractedIds.length > 0) {
        const mongoIds = extractedIds.filter(id => id.length === 24);
        const incs = extractedIds.filter(id => id.length !== 24).map(Number).filter(n => !isNaN(n));
        
        let resolvedIds = [...mongoIds];
        
        if (incs.length > 0) {
          const toastId = toast.loading("Resolviendo INCs en la base de datos...");
          try {
            const foundUsers = await findUsersByIncList(incs, allianceId);
            const foundMongoIds = foundUsers.map(u => u._id.$oid || u._id);
            resolvedIds = [...resolvedIds, ...foundMongoIds];
            
            if (foundUsers.length < incs.length) {
              toast.update(toastId, { render: `Se resolvieron ${foundUsers.length} de ${incs.length} INCs`, type: "warning", isLoading: false, autoClose: 4000 });
            } else {
              toast.update(toastId, { render: `Todos los INCs fueron resueltos`, type: "success", isLoading: false, autoClose: 2000 });
            }
          } catch (err) {
            console.error("Error resolviendo INCs:", err);
            toast.update(toastId, { render: "Error al resolver INCs", type: "error", isLoading: false, autoClose: 3000 });
          }
        }
        
        const finalIds = Array.from(new Set(resolvedIds));
        
        if (finalIds.length > 0) {
          setBulkText(finalIds.join('\n'));
          setBulkMode(true);
          if (incs.length === 0) {
            toast.success(`Se extrajeron ${finalIds.length} estudiantes del archivo`);
          }
        } else {
          toast.warning("No se pudieron resolver IDs válidos");
        }
      } else {
        toast.warning("No se encontraron IDs válidos en el archivo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al leer el archivo Excel");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const rawObjectIdMatch = incText.trim().match(/\b([a-f0-9]{24})\b/i);
  const resolvedStudentId = studentId || (rawObjectIdMatch ? rawObjectIdMatch[1] : "");

  const studentIds = bulkMode 
    ? Array.from(new Set(bulkText.match(/\b([a-f0-9]{24})\b/ig) || [])).filter(Boolean)
    : (resolvedStudentId ? [resolvedStudentId] : []);

  const commands = resolvedGroupId && studentIds.length > 0
    ? studentIds.map(id => `magik run:prod:force final:user ["${resolvedGroupId}", "${id}"]`).join("\n")
    : "";

  const handleCopy = () => {
    if (!commands) return;
    navigator.clipboard.writeText(commands);
    setCopied(true);
    toast.success(studentIds.length > 1 ? "Comandos copiados al portapapeles" : "Comando copiado al portapapeles");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Inputs Grid ── */}
      <div className="inscr-grid-2">
        {/* Input grupo */}
        <div className="inscr-field-block">
          <label className="inscr-field-label">ID o URL del Grupo Académico</label>
          <input
            className="inscr-input"
            type="text"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="6765d926… ó https://sis.kuepa.com/academic-group/…"
          />
          {groupId.trim() && !resolvedGroupId && (
            <span style={{ fontSize: "11.5px", color: "#ef4444" }}>ID de grupo inválido</span>
          )}
          {resolvedGroupId && (
            <span style={{ fontSize: "11px", color: "var(--primary)", fontFamily: "'Space Grotesk', monospace" }}>
              ✓ Grupo: {resolvedGroupId}
            </span>
          )}
        </div>

        {/* Input estudiante */}
        <div className="inscr-field-block">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="inscr-field-label">
              {bulkMode ? "Lista de Estudiantes" : "Estudiante"}
              {bulkMode && studentIds.length > 0 && (
                <span className="inscr-count-badge" style={{ marginLeft: "8px" }}>
                  {studentIds.length}
                </span>
              )}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                style={{ display: "none" }} 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: "transparent", color: "var(--primary)",
                  border: "1px solid var(--glass-border)", borderRadius: "8px",
                  padding: "4px 10px", fontSize: "11px", fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "rgba(18, 163, 131, 0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "transparent"; }}
              >
                <FileSpreadsheet size={13} /> Subir Excel
              </button>
              <button
                type="button"
                onClick={() => setBulkMode(!bulkMode)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: bulkMode ? "rgba(18, 163, 131, 0.15)" : "transparent",
                  color: bulkMode ? "var(--primary)" : "var(--on-surface-variant)",
                  border: `1px solid ${bulkMode ? "var(--primary)" : "var(--glass-border)"}`,
                  borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "all 0.2s ease"
                }}
              >
                {bulkMode ? "← Individual" : "Modo Masivo"}
              </button>
            </div>
          </div>
          
          {bulkMode ? (
            <textarea
              className="inscr-textarea"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"Pega ObjectIds de estudiantes aquí (uno por línea):\n64f1a2b3c4d5e6f7a8b9c0d1\n64f1a2b3c4d5e6f7a8b9c0d2..."}
              style={{ minHeight: "100px", resize: "vertical" }}
            />
          ) : (
            <div>
              <IncAutocomplete
                alianzaId={allianceId}
                value={incText}
                onChange={setIncText}
                onSelect={handleSelectUser}
                placeholder="INC o ID del estudiante"
                inputStyle={{ height: "42px", padding: "0 40px 0 14px", boxSizing: "border-box" }}
              />
              {studentName && (
                <span style={{ fontSize: "11px", color: "var(--primary)", marginTop: "4px", display: "block" }}>
                  ✓ {studentName}
                </span>
              )}
              {rawObjectIdMatch && !studentName && (
                <span style={{ fontSize: "11px", color: "var(--primary)", marginTop: "4px", display: "block", fontFamily: "'Space Grotesk', monospace" }}>
                  ✓ ObjectId: {rawObjectIdMatch[1]}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Comando generado ── */}
      <div className="inscr-field-block">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label className="inscr-field-label">
            Comando generado {studentIds.length > 0 && <span className="inscr-count-badge" style={{ marginLeft: "8px" }}>{studentIds.length}</span>}
          </label>
          {commands && (
            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: copied ? "rgba(18, 163, 131, 0.25)" : "rgba(18, 163, 131, 0.15)",
                color: "var(--primary)",
                border: "1px solid rgba(18, 163, 131, 0.3)", borderRadius: "8px",
                padding: "4px 12px", fontSize: "11px", fontWeight: 700,
                fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "all 0.2s ease"
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />} {studentIds.length > 1 ? (copied ? "Copiados" : "Copiar Todos") : (copied ? "Copiado" : "Copiar")}
            </button>
          )}
        </div>
        <div style={{
          minHeight: "46px", maxHeight: "180px", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: "6px", padding: "10px 14px",
          background: "rgba(0, 0, 0, 0.25)", border: "1px solid var(--glass-border)",
          borderRadius: "10px", fontFamily: "'Space Grotesk', monospace", fontSize: "12px",
          color: commands ? "var(--on-surface)" : "var(--on-surface-variant)",
          wordBreak: "break-all"
        }}>
          {commands ? (
            commands.split('\n').map((cmd, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ color: "var(--primary)" }}>{cmd}</span>
                {studentIds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(cmd); toast.success("Línea copiada"); }}
                    style={{ background: "none", border: "none", color: "var(--on-surface-variant)", cursor: "pointer", padding: "2px", flexShrink: 0 }}
                    title="Copiar esta línea"
                  >
                    <Copy size={11} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <span style={{ fontStyle: "italic", opacity: 0.6, alignSelf: "center", margin: "auto" }}>
              Completa el grupo y estudiante para generar el comando…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card 3: Extraer Grupos Académicos ──────────────────────────────────────
function ExtractGroupsCard({ clearToken }) {
  const [inputText, setInputText] = useLocalStorage("herr_extract_input", "");
  const [extractedIds, setExtractedIds] = useState([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const fileInputRef = useRef(null);

  const aiPrefilledData = useAppStore(state => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore(state => state.setAiPrefilledData);

  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.intent === 'EXTRACT_GROUPS') {
      if (aiPrefilledData.ids && aiPrefilledData.ids.length > 0) {
        setInputText(aiPrefilledData.ids.join('\n'));
      }
      setAiPrefilledData(null);
    }
  }, [aiPrefilledData, setInputText, setAiPrefilledData]);

  useEffect(() => {
    if (!inputText.trim()) {
      setExtractedIds([]);
      return;
    }
    const regex = /\b[a-zA-Z0-9]{24,26}\b/g;
    const matches = inputText.match(regex) || [];
    setExtractedIds(Array.from(new Set(matches)));
  }, [inputText]);

  const handleClear = useCallback(() => {
    setInputText("");
    setExtractedIds([]);
  }, [setInputText]);

  useEffect(() => {
    if (clearToken > 0) handleClear();
  }, [clearToken, handleClear]);

  const handleCopyAll = () => {
    if (extractedIds.length === 0) return;
    navigator.clipboard.writeText(extractedIds.join("\n"));
    setCopiedAll(true);
    toast.success("IDs copiados al portapapeles");
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      let allText = "";
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        allText += json.flat().join(" ") + " ";
      });
      setInputText(prev => (prev ? prev + "\n" + allText : allText));
      toast.success("Archivo procesado");
    } catch (err) {
      console.error(err);
      toast.error("Error al leer el archivo Excel");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="inscr-dual-pane" style={{ minHeight: "340px" }}>
      {/* Panel Izquierdo: Entrada */}
      <div className="inscr-pane-card">
        <div className="inscr-pane-header">
          <span className="inscr-field-label">Texto / URLs con IDs</span>
          <div>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              style={{ display: "none" }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "transparent", color: "var(--primary)",
                border: "1px solid var(--glass-border)", borderRadius: "8px",
                padding: "4px 10px", fontSize: "11px", fontWeight: 700,
                fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "rgba(18, 163, 131, 0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "transparent"; }}
            >
              <FileSpreadsheet size={13} /> Subir Excel
            </button>
          </div>
        </div>

        <textarea
          className="inscr-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pega texto, HTML, URLs o listas desordenadas aquí..."
          style={{ flex: 1, minHeight: "260px", resize: "none" }}
        />
      </div>

      {/* Panel Derecho: IDs Extraídos */}
      <div className="inscr-pane-card">
        <div className="inscr-pane-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="inscr-field-label">IDs Extraídos Únicos</span>
            {extractedIds.length > 0 && <span className="inscr-count-badge">{extractedIds.length}</span>}
          </div>

          <button
            type="button"
            onClick={handleCopyAll}
            disabled={extractedIds.length === 0}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: extractedIds.length > 0 ? (copiedAll ? "rgba(18, 163, 131, 0.25)" : "rgba(18, 163, 131, 0.15)") : "transparent",
              color: extractedIds.length > 0 ? "var(--primary)" : "var(--on-surface-variant)",
              border: `1px solid ${extractedIds.length > 0 ? "rgba(18, 163, 131, 0.35)" : "var(--glass-border)"}`,
              borderRadius: "8px", padding: "4px 12px", fontSize: "11px", fontWeight: 700,
              fontFamily: "'Nunito', sans-serif", cursor: extractedIds.length > 0 ? "pointer" : "not-allowed",
              transition: "all 0.2s ease"
            }}
          >
            {copiedAll ? <Check size={12} /> : <Copy size={12} />} {copiedAll ? "Copiados" : "Copiar Todos"}
          </button>
        </div>

        <div style={{
          flex: 1, minHeight: "260px", borderRadius: "10px",
          border: "1px solid var(--glass-border)", background: "rgba(0, 0, 0, 0.25)",
          overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "4px",
          scrollbarWidth: "thin", scrollbarColor: "var(--primary) rgba(255, 255, 255, 0.04)"
        }}>
          {extractedIds.length === 0 ? (
            <div style={{ margin: "auto", color: "var(--on-surface-variant)", fontSize: "12px", fontStyle: "italic" }}>
              Los IDs válidos aparecerán aquí automáticamente
            </div>
          ) : (
            extractedIds.map((id, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "4px 8px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.02)",
                fontFamily: "'Space Grotesk', monospace", fontSize: "12.5px"
              }}>
                <span style={{ color: "var(--primary)" }}>{id}</span>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(id); toast.success("ID copiado"); }}
                  style={{ background: "none", border: "none", color: "var(--on-surface-variant)", cursor: "pointer", padding: "2px" }}
                  title="Copiar ID"
                >
                  <Copy size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card 4: Grupos por estudiante ──────────────────────────────────────────
function StudentGroupsCard({ alianza, clearToken }) {
  const [incText, setIncText] = useLocalStorage("herr_studgroups_inc", "");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const allianceId = alianza === "kuepa" ? ALLIANCE_IDS.kuepa : ALLIANCE_IDS.na;

  const handleSelectUser = (user) => {
    if (user) {
      setStudentId(user._id.$oid || user._id);
      setStudentName(user.profile?.full_name || "");
    } else {
      setStudentId("");
      setStudentName("");
    }
  };

  const handleClear = useCallback(() => {
    setIncText("");
    setStudentId("");
    setStudentName("");
    setNameFilter("");
    setSelectedLevel("");
    setGroups([]);
  }, [setIncText]);

  useEffect(() => {
    if (clearToken > 0) handleClear();
  }, [clearToken, handleClear]);

  const rawObjectIdMatch = incText.trim().match(/\b([a-f0-9]{24})\b/i);
  const effectiveStudentId = studentId || (rawObjectIdMatch ? rawObjectIdMatch[1] : "");

  useEffect(() => {
    if (!effectiveStudentId) {
      setGroups([]);
      return;
    }

    async function fetchGroups() {
      setLoading(true);
      try {
        const { supabase } = await import("../services/supabaseClient");
        let query = supabase
          .from("academic_groups")
          .select("mongo_id, name, parent")
          .contains("students", [effectiveStudentId]);

        if (nameFilter.trim()) {
          query = query.ilike("name", `%${nameFilter.trim()}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setGroups(data || []);
      } catch (err) {
        console.error("Error consultando grupos del estudiante:", err);
        toast.error("Error al consultar grupos en Supabase");
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchGroups, 300);
    return () => clearTimeout(timer);
  }, [effectiveStudentId, nameFilter]);

  const uniqueLevelNames = useMemo(() => Array.from(new Set(
    groups
      .filter(g => g.parent && g.parent.level && g.parent.level.name)
      .map(g => g.parent.level.name)
  )).sort(), [groups]);

  const displayedGroups = useMemo(() => groups.filter(g => {
    if (selectedLevel && g.parent?.level?.name !== selectedLevel) return false;
    return true;
  }), [groups, selectedLevel]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Filtros Grid ── */}
      <div className="inscr-grid-3">
        {/* Input INC estudiante */}
        <div className="inscr-field-block">
          <label className="inscr-field-label">INC del Estudiante</label>
          <IncAutocomplete
            alianzaId={allianceId}
            value={incText}
            onChange={setIncText}
            onSelect={handleSelectUser}
            placeholder="INC o ID del estudiante"
            inputStyle={{ height: "42px", padding: "0 40px 0 14px", boxSizing: "border-box" }}
          />
          {studentName && (
            <span style={{ fontSize: "11px", color: "var(--primary)", marginTop: "4px" }}>
              ✓ {studentName}
            </span>
          )}
          {rawObjectIdMatch && !studentName && (
            <span style={{ fontSize: "11px", color: "var(--primary)", marginTop: "4px", display: "block", fontFamily: "'Space Grotesk', monospace" }}>
              ✓ ObjectId: {rawObjectIdMatch[1]}
            </span>
          )}
        </div>

        {/* Filtro por Nombre */}
        <div className="inscr-field-block">
          <label className="inscr-field-label">Filtro por Nombre (Opcional)</label>
          <input
            className="inscr-input"
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Ej: Matemáticas"
          />
        </div>

        {/* Filtro por Nivel */}
        <div className="inscr-field-block">
          <label className="inscr-field-label">Nivel / Cuatrimestre</label>
          <select
            className="inscr-select"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            disabled={uniqueLevelNames.length === 0}
          >
            <option value="">-- Todos los niveles --</option>
            {uniqueLevelNames.map(lvl => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Resultados ── */}
      <div className="inscr-field-block">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label className="inscr-field-label" style={{ margin: 0 }}>Grupos Encontrados</label>
            {displayedGroups.length > 0 && <span className="inscr-count-badge">{displayedGroups.length}</span>}
          </div>

          {displayedGroups.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const ids = displayedGroups.map(g => g.mongo_id).join("\n");
                navigator.clipboard.writeText(ids);
                setCopiedAll(true);
                toast.success("IDs copiados al portapapeles");
                setTimeout(() => setCopiedAll(false), 1500);
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: copiedAll ? "rgba(18, 163, 131, 0.25)" : "rgba(18, 163, 131, 0.15)",
                color: "var(--primary)",
                border: "1px solid rgba(18, 163, 131, 0.3)", borderRadius: "8px",
                padding: "4px 12px", fontSize: "11px", fontWeight: 700,
                fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "all 0.2s ease"
              }}
            >
              {copiedAll ? <Check size={12} /> : <Copy size={12} />} {copiedAll ? "Copiados" : "Copiar Todos los IDs"}
            </button>
          )}
        </div>

        <div style={{
          minHeight: "120px", maxHeight: "280px", overflowY: "auto",
          padding: "10px 14px", background: "rgba(0, 0, 0, 0.25)", border: "1px solid var(--glass-border)",
          borderRadius: "10px", display: "flex", flexDirection: "column", gap: "6px",
          scrollbarWidth: "thin", scrollbarColor: "var(--primary) rgba(255, 255, 255, 0.04)"
        }}>
          {!effectiveStudentId && (
            <span style={{ margin: "auto", color: "var(--on-surface-variant)", fontSize: "12.5px", fontStyle: "italic" }}>
              Ingresa un estudiante para ver sus grupos…
            </span>
          )}
          {effectiveStudentId && loading && (
            <span style={{ margin: "auto", color: "var(--on-surface-variant)", fontSize: "12.5px" }}>
              Cargando grupos...
            </span>
          )}
          {effectiveStudentId && !loading && displayedGroups.length === 0 && (
            <span style={{ margin: "auto", color: "var(--on-surface-variant)", fontSize: "12.5px" }}>
              El estudiante no tiene grupos asignados que coincidan.
            </span>
          )}
          {studentId && !loading && displayedGroups.map((g, idx) => (
            <div
              key={idx}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.04)", fontSize: "12.5px", color: "var(--on-surface)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Space Grotesk', monospace", color: "var(--primary)", fontWeight: 700 }}>
                  {g.mongo_id}
                </span>
                <span>{g.name}</span>
                {g.parent?.level?.name && (
                  <span style={{
                    fontSize: "10.5px", color: "var(--on-surface-variant)",
                    background: "rgba(255, 255, 255, 0.05)", padding: "1px 6px",
                    borderRadius: "4px", border: "1px solid var(--glass-border)"
                  }}>
                    {g.parent.level.name}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(g.mongo_id); toast.success("ID copiado"); }}
                style={{ background: "none", border: "none", color: "var(--on-surface-variant)", cursor: "pointer", padding: "4px" }}
                title="Copiar ID"
              >
                <Copy size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Card 5: Auditar Estudiantes de Grupo ────────────────────────────────────
function AuditGroupStudentsCard({ clearToken }) {
  const [groupIdInput, setGroupIdInput] = useLocalStorage("herr_audit_group_input", "");
  const [groupData, setGroupData] = useState(null);
  const [studentIds, setStudentIds] = useState([]);
  const [studentsInfo, setStudentsInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualText, setManualText] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const resolvedGroupId = extractGroupId(groupIdInput);

  useEffect(() => {
    let isCancelled = false;

    async function loadGroup() {
      if (!resolvedGroupId) {
        setGroupData(null);
        setStudentIds([]);
        setStudentsInfo([]);
        return;
      }

      setLoading(true);
      try {
        const structure = await fetchGroupStructure(resolvedGroupId);
        if (isCancelled) return;

        if (structure) {
          setGroupData(structure);
          const ids = structure.studentIds || [];
          setStudentIds(ids);

          if (ids.length > 0) {
            const info = await fetchStudentsInfo(ids);
            if (!isCancelled) setStudentsInfo(info);
          } else {
            setStudentsInfo([]);
          }
        } else {
          setGroupData(null);
          setStudentIds([]);
          setStudentsInfo([]);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error al consultar estructura del grupo:", err);
          toast.error("Error al consultar el grupo en la base de datos");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    const timer = setTimeout(loadGroup, 350);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [resolvedGroupId]);

  const activeStudentIds = isManualMode
    ? Array.from(new Set(manualText.match(/\b([a-f0-9]{24})\b/ig) || []))
    : studentIds;

  let command = "";
  if (resolvedGroupId && activeStudentIds.length > 0) {
    try {
      command = generateAuditGroupSubjectCommand(resolvedGroupId, activeStudentIds);
    } catch {
      command = "";
    }
  }

  const handleClear = useCallback(() => {
    setGroupIdInput("");
    setGroupData(null);
    setStudentIds([]);
    setStudentsInfo([]);
    setManualText("");
    setIsManualMode(false);
  }, [setGroupIdInput]);

  useEffect(() => {
    if (clearToken > 0) handleClear();
  }, [clearToken, handleClear]);

  const handleCopy = () => {
    if (!command) return;
    navigator.clipboard.writeText(command);
    setCopied(true);
    toast.success("Comando copiado al portapapeles");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      let allText = "";
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        allText += json.flat().join(" ") + " ";
      });

      const extracted = Array.from(new Set(allText.match(/\b([a-f0-9]{24})\b/ig) || []));
      if (extracted.length > 0) {
        setIsManualMode(true);
        setManualText(prev => {
          const prevIds = prev.match(/\b([a-f0-9]{24})\b/ig) || [];
          return Array.from(new Set([...prevIds, ...extracted])).join("\n");
        });
        toast.success(`Se cargaron ${extracted.length} estudiantes desde el archivo`);
      } else {
        toast.warning("No se encontraron ObjectIds válidos en el archivo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al leer el archivo Excel");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveStudent = (idToRemove) => {
    if (isManualMode) {
      const remaining = activeStudentIds.filter(id => id !== idToRemove);
      setManualText(remaining.join("\n"));
    } else {
      setStudentIds(prev => prev.filter(id => id !== idToRemove));
    }
  };

  const infoMap = useMemo(() => new Map(studentsInfo.map(s => [s.mongoId, s])), [studentsInfo]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Input Grupo ── */}
      <div className="inscr-field-block">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label className="inscr-field-label">ID o URL del Grupo</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              style={{ display: "none" }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "transparent", color: "var(--primary)",
                border: "1px solid var(--glass-border)", borderRadius: "8px",
                padding: "4px 10px", fontSize: "11px", fontWeight: 700,
                fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "rgba(18, 163, 131, 0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "transparent"; }}
            >
              <FileSpreadsheet size={13} /> Subir Excel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isManualMode) setManualText(studentIds.join("\n"));
                setIsManualMode(!isManualMode);
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: isManualMode ? "rgba(18, 163, 131, 0.15)" : "transparent",
                color: isManualMode ? "var(--primary)" : "var(--on-surface-variant)",
                border: `1px solid ${isManualMode ? "var(--primary)" : "var(--glass-border)"}`,
                borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 700,
                fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "all 0.2s ease"
              }}
            >
              {isManualMode ? "← Modo Automático" : "Editar Lista Manual"}
            </button>
          </div>
        </div>

        <input
          className="inscr-input"
          type="text"
          value={groupIdInput}
          onChange={(e) => setGroupIdInput(e.target.value)}
          placeholder="6765d926107fc303893724e9 ó https://sis.kuepa.com/academic-group/…"
        />

        {groupIdInput.trim() && !resolvedGroupId && (
          <span style={{ fontSize: "11.5px", color: "#ef4444" }}>
            No se pudo extraer ningún ObjectId válido
          </span>
        )}

        {resolvedGroupId && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
            <span style={{ fontSize: "11px", color: "var(--primary)", fontFamily: "'Space Grotesk', monospace" }}>
              ✓ Grupo: {resolvedGroupId}
            </span>
            {groupData && (
              <span style={{
                fontSize: "11px", color: "var(--on-surface)",
                background: "rgba(255, 255, 255, 0.05)", padding: "2px 8px",
                borderRadius: "6px", border: "1px solid var(--glass-border)"
              }}>
                {groupData.name} {groupData.levelName ? `(${groupData.levelName})` : ""}
              </span>
            )}
            {loading && (
              <span style={{ fontSize: "11px", color: "var(--on-surface-variant)" }}>
                Consultando estudiantes...
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Estudiantes ── */}
      {isManualMode ? (
        <div className="inscr-field-block">
          <label className="inscr-field-label">Lista de Estudiantes (un ObjectId por línea)</label>
          <textarea
            className="inscr-textarea"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder={"64f1a2b3c4d5e6f7a8b9c0d1\n64f1a2b3c4d5e6f7a8b9c0d2..."}
            style={{ minHeight: "120px", resize: "vertical" }}
          />
        </div>
      ) : (
        resolvedGroupId && (
          <div className="inscr-field-block">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label className="inscr-field-label" style={{ margin: 0 }}>Estudiantes del Grupo</label>
              {activeStudentIds.length > 0 && <span className="inscr-count-badge">{activeStudentIds.length}</span>}
            </div>

            {loading ? (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--on-surface-variant)", fontSize: "12.5px" }}>
                Cargando estudiantes del grupo...
              </div>
            ) : activeStudentIds.length === 0 ? (
              <div style={{
                padding: "16px", borderRadius: "10px", border: "1px dashed var(--glass-border)",
                textAlign: "center", color: "var(--on-surface-variant)", fontSize: "12.5px"
              }}>
                No se encontraron estudiantes asociados en este grupo.
                <button
                  type="button"
                  onClick={() => setIsManualMode(true)}
                  style={{
                    background: "none", border: "none", color: "var(--primary)",
                    marginLeft: "8px", fontWeight: 700, cursor: "pointer", textDecoration: "underline"
                  }}
                >
                  Ingresar manualmente
                </button>
              </div>
            ) : (
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "150px", overflowY: "auto",
                padding: "8px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "10px",
                border: "1px solid var(--glass-border)", scrollbarWidth: "thin"
              }}>
                {activeStudentIds.map(sId => {
                  const info = infoMap.get(sId);
                  return (
                    <div
                      key={sId}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "6px", padding: "3px 8px", fontSize: "11.5px",
                        color: "var(--on-surface)", fontFamily: "'Space Grotesk', monospace"
                      }}
                    >
                      <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                        {info?.inc ? `#${info.inc}` : sId.slice(-6)}
                      </span>
                      {info?.fullName && (
                        <span style={{ maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {info.fullName}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(sId)}
                        title="Quitar"
                        style={{
                          background: "none", border: "none", color: "var(--on-surface-variant)",
                          cursor: "pointer", padding: "0 2px", fontSize: "14px", lineHeight: 1
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--on-surface-variant)"}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* ── Comando generado ── */}
      <div className="inscr-field-block">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label className="inscr-field-label">
            Comando generado {activeStudentIds.length > 0 && <span className="inscr-count-badge" style={{ marginLeft: "8px" }}>{activeStudentIds.length} estudiantes</span>}
          </label>
          {command && (
            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: copied ? "rgba(18, 163, 131, 0.25)" : "rgba(18, 163, 131, 0.15)",
                color: "var(--primary)",
                border: "1px solid rgba(18, 163, 131, 0.3)", borderRadius: "8px",
                padding: "4px 12px", fontSize: "11px", fontWeight: 700,
                fontFamily: "'Nunito', sans-serif", cursor: "pointer", transition: "all 0.2s ease"
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copiado" : "Copiar Comando"}
            </button>
          )}
        </div>
        <div style={{
          minHeight: "46px", maxHeight: "150px", overflowY: "auto",
          display: "flex", alignItems: "center", padding: "10px 14px",
          background: "rgba(0, 0, 0, 0.25)", border: "1px solid var(--glass-border)",
          borderRadius: "10px", fontFamily: "'Space Grotesk', monospace", fontSize: "12px",
          color: command ? "var(--on-surface)" : "var(--on-surface-variant)",
          wordBreak: "break-all"
        }}>
          {command ? (
            <span style={{ color: "var(--primary)" }}>{command}</span>
          ) : (
            <span style={{ fontStyle: "italic", opacity: 0.6 }}>
              Ingresa el ID o URL del grupo para generar el comando…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Layout unificado para Grupos Académicos ──────────────────────────────────
export function GruposLayout({ activeTab = "herramientas-undo" }) {
  const [alianza, setAlianza] = useLocalStorage("grupos-global-alianza", "na");
  const [clearToken, setClearToken] = useState(0);
  const setActiveComponent = useAppStore(state => state.setActiveComponent);

  const currentTab = useMemo(
    () => GRUPOS_TABS.find(t => t.id === activeTab) || GRUPOS_TABS[0],
    [activeTab]
  );

  const handleGlobalClear = useCallback(() => {
    setClearToken(t => t + 1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleGlobalClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGlobalClear]);

  const showAllianceSwitcher = activeTab === "herramientas-final" || activeTab === "herramientas-estudiante";

  return (
    <div
      className="inscripciones-main animate-slide-down"
      style={{ padding: "18px 24px", maxWidth: "1100px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}
    >
      {/* ── Header ── */}
      <div className="inscripciones-header-row">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="inscripciones-mode-badge">
            <GraduationCap size={17} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "18px", fontWeight: 800, color: "var(--on-surface)", margin: 0, lineHeight: 1.2 }}>
              Grupos Académicos
            </h1>
            <span style={{ fontSize: "11.5px", color: "var(--on-surface-variant)" }}>
              {currentTab.subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* ── Barra de Pestañas / Acciones ── */}
      <div className="inscripciones-tabs">
        {GRUPOS_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              className={`inscripciones-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => setActiveComponent(tab.id)}
            >
              <Icon size={14} style={{ color: isActive ? "var(--primary)" : "var(--on-surface-variant)" }} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          {showAllianceSwitcher && (
            <AllianceSwitcher
              value={alianza}
              onChange={(val) => { setAlianza(val); handleGlobalClear(); }}
            />
          )}
          <button
            type="button"
            onClick={handleGlobalClear}
            title="Limpiar (Esc)"
            style={{
              background: "transparent",
              border: "1px solid var(--glass-border)",
              color: "var(--on-surface-variant)",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--on-surface)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--on-surface-variant)"; e.currentTarget.style.background = "transparent"; }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* ── Panel Principal ── */}
      <div className="inscripciones-panel">
        {activeTab === "herramientas-undo" && <UndoPublicationCard clearToken={clearToken} />}
        {activeTab === "herramientas-final" && <FinalUserCard alianza={alianza} clearToken={clearToken} />}
        {activeTab === "herramientas-extraer" && <ExtractGroupsCard clearToken={clearToken} />}
        {activeTab === "herramientas-estudiante" && <StudentGroupsCard alianza={alianza} clearToken={clearToken} />}
        {activeTab === "herramientas-auditar-grupo" && <AuditGroupStudentsCard clearToken={clearToken} />}
      </div>
    </div>
  );
}

// ── Wrappers de página para cada sub-ruta de navegación ──────────────────────
export function UndoPublicationPage() {
  return <GruposLayout activeTab="herramientas-undo" />;
}

export function FinalUserPage() {
  return <GruposLayout activeTab="herramientas-final" />;
}

export function ExtractGroupsPage() {
  return <GruposLayout activeTab="herramientas-extraer" />;
}

export function StudentGroupsPage() {
  return <GruposLayout activeTab="herramientas-estudiante" />;
}

export function AuditGroupStudentsPage() {
  return <GruposLayout activeTab="herramientas-auditar-grupo" />;
}

export default function HerramientasAcademicos() {
  return <GruposLayout activeTab="herramientas-undo" />;
}
