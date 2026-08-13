import { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Copy, Terminal, User, List } from "lucide-react";
import { toast } from "react-toastify";
import AllianceSwitcher from "./ui/AllianceSwitcher";
import ClearButton from "./ui/ClearButton";
import IncAutocomplete from "./ui/IncAutocomplete";
import { ALLIANCE_IDS } from "../utils/constants";
import { useAppStore } from "../store/useAppStore";

// ── Utilidad: extrae el ID del grupo académico ──────────────────────────────
function extractGroupId(input) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  // Extrae un ObjectId válido (24 caracteres hexadecimales) de cualquier parte del texto
  const match = trimmed.match(/\b([a-f0-9]{24})\b/i);
  if (match) return match[1];
  return "";
}

// ── Card 1: Deshacer publicación ────────────────────────────────────────────
function UndoPublicationCard() {
  const [inputValue, setInputValue] = useLocalStorage("herr_undo_groupInput", "");
  
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

  const groupId = extractGroupId(inputValue);
  const command = groupId ? `magik run:prod undo:publication ["${groupId}"]` : "";

  const handleClear = () => setInputValue("");

  const handleCopy = () => {
    if (!command) return;
    navigator.clipboard.writeText(command);
    toast.success("Comando copiado al portapapeles");
  };

  return (
    <div className="inscripciones-content animate-slide-down" style={{ marginBottom: 0 }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "var(--primary-container)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Terminal size={16} style={{ color: "#fff" }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--on-surface)", fontFamily: "'Nunito', sans-serif" }}>
            Deshacer Publicación
          </span>
        </div>
        <ClearButton onClick={handleClear} />
      </div>

      {/* ── Divisor ─────────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "var(--glass-border)", marginBottom: "20px" }} />

      {/* ── Input ───────────────────────────────────────────────────── */}
      <div className="input-wrapper" style={{ marginBottom: "20px" }}>
        <label className="input-label">ID o URL del Grupo Académico</label>
        <input
          className="inscripciones-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="6765d926107fc303893724e9  ó  https://sis.kuepa.com/academic-group/details/…"
          style={{ fontSize: "13px", fontFamily: "'Space Grotesk', monospace" }}
        />
        {inputValue.trim() && !groupId && (
          <span style={{ fontSize: "11px", color: "#ef4444", marginLeft: "4px", fontFamily: "'Space Grotesk', sans-serif" }}>
            No se pudo extraer un ID válido
          </span>
        )}
      </div>

      {/* ── Comando generado ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label className="input-label">Comando generado</label>
          {command && (
            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "var(--primary-container)", color: "#fff",
                border: "1px solid var(--primary)", borderRadius: "8px",
                padding: "5px 12px", fontSize: "12px", fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <Copy size={13} /> Copiar
            </button>
          )}
        </div>
        <div className="commands" style={{
          marginTop: 0, minHeight: "54px",
          display: "flex", alignItems: "center",
          opacity: command ? 1 : 0.4,
        }}>
          {command ? (
            <span style={{ letterSpacing: "0.02em" }}>{command}</span>
          ) : (
            <span style={{ color: "rgba(202,225,215,0.35)", fontStyle: "italic", fontSize: "13px" }}>
              Ingresa un ID o URL para generar el comando…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card 2: Finalizar usuario en grupo ──────────────────────────────────────
function FinalUserCard() {
  const [groupId, setGroupId] = useLocalStorage("herr_final_groupId", "");
  const [alianza, setAlianza] = useLocalStorage("herr_final_alianza", "na");
  const [incText, setIncText] = useLocalStorage("herr_final_incText", "");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");

  const aiPrefilledData = useAppStore(state => state.aiPrefilledData);
  const setAiPrefilledData = useAppStore(state => state.setAiPrefilledData);

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

  const allianceId = alianza === "kuepa"
    ? ALLIANCE_IDS.kuepa
    : ALLIANCE_IDS.na;

  const handleSelectUser = (user) => {
    if (user) {
      setStudentId(user._id.$oid);
      setStudentName(user.profile?.full_name || "");
    } else {
      setStudentId("");
      setStudentName("");
    }
  };

  const handleClear = () => {
    setGroupId("");
    setIncText("");
    setStudentId("");
    setStudentName("");
  };

  const command =
    resolvedGroupId && studentId
      ? `magik run:prod:force final:user ["${resolvedGroupId}", "${studentId}"]`
      : "";

  const handleCopy = () => {
    if (!command) return;
    navigator.clipboard.writeText(command);
    toast.success("Comando copiado al portapapeles");
  };

  return (
    <div className="inscripciones-content animate-slide-down" style={{ marginBottom: 0 }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={16} style={{ color: "#090909" }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--on-surface)", fontFamily: "'Nunito', sans-serif" }}>
            Re-calcular Nota Estudiante en Grupo
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AllianceSwitcher value={alianza} size="md" onChange={(val) => { setAlianza(val); handleClear(); }} />
          <ClearButton onClick={handleClear} />
        </div>
      </div>

      {/* ── Divisor ─────────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "var(--glass-border)", marginBottom: "20px" }} />

      {/* ── Inputs en grid ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>

        {/* Input grupo */}
        <div className="input-wrapper">
          <label className="input-label">ID o URL del Grupo Académico</label>
          <input
            className="inscripciones-input"
            type="text"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="6765d926… ó https://sis.kuepa.com/…"
            style={{ fontSize: "13px", fontFamily: "'Space Grotesk', monospace" }}
          />
          {groupId.trim() && !resolvedGroupId && (
            <span style={{ fontSize: "11px", color: "#ef4444", marginLeft: "4px" }}>ID inválido</span>
          )}
          {resolvedGroupId && (
            <span style={{ fontSize: "11px", color: "var(--primary)", marginLeft: "4px", fontFamily: "'Space Grotesk', monospace" }}>
              ✓ {resolvedGroupId}
            </span>
          )}
        </div>

        {/* Input INC estudiante con autocomplete */}
        <div className="input-wrapper">
          <label className="input-label">INC del Estudiante</label>
          <IncAutocomplete
            alianzaId={allianceId}
            value={incText}
            onChange={setIncText}
            onSelect={handleSelectUser}
            placeholder="Ej: 292828"
          />
          {studentName && (
            <span style={{ fontSize: "11px", color: "var(--primary)", marginLeft: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              ✓ {studentName}
            </span>
          )}
        </div>
      </div>

      {/* ── Comando generado ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label className="input-label">Comando generado</label>
          {command && (
            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "var(--primary-container)", color: "#fff",
                border: "1px solid var(--primary)", borderRadius: "8px",
                padding: "5px 12px", fontSize: "12px", fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <Copy size={13} /> Copiar
            </button>
          )}
        </div>
        <div className="commands" style={{
          marginTop: 0, minHeight: "54px",
          display: "flex", alignItems: "center",
          opacity: command ? 1 : 0.4,
          borderColor: command ? "rgba(124,58,237,0.4)" : "var(--glass-border)",
        }}>
          {command ? (
            <span style={{ letterSpacing: "0.02em" }}>{command}</span>
          ) : (
            <span style={{ color: "rgba(202,225,215,0.35)", fontStyle: "italic", fontSize: "13px" }}>
              Completa los dos campos para generar el comando…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card 3: Extraer Grupos Académicos ──────────────────────────────────────
function ExtractGroupsCard() {
  const [inputText, setInputText] = useLocalStorage("herr_extract_input", "");
  const [extractedIds, setExtractedIds] = useState([]);

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
    // Busca secuencias alfanuméricas de 24 a 26 caracteres (típicamente ObjectIDs)
    const regex = /\b[a-zA-Z0-9]{24,26}\b/g;
    const matches = inputText.match(regex) || [];
    const uniqueIds = Array.from(new Set(matches));
    setExtractedIds(uniqueIds);
  }, [inputText]);

  const handleClear = () => {
    setInputText("");
    setExtractedIds([]);
  };

  const handleCopyAll = () => {
    if (extractedIds.length === 0) return;
    const textToCopy = extractedIds.join("\n");
    navigator.clipboard.writeText(textToCopy);
    toast.success("IDs copiados al portapapeles");
  };

  return (
    <div className="inscripciones-content animate-slide-down" style={{ marginBottom: 0 }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "var(--primary-container)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <List size={16} style={{ color: "#fff" }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--on-surface)", fontFamily: "'Nunito', sans-serif" }}>
            Extraer Grupos Académicos
          </span>
        </div>
        <ClearButton onClick={handleClear} />
      </div>

      {/* ── Divisor ─────────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "var(--glass-border)", marginBottom: "20px" }} />

      {/* ── Input ───────────────────────────────────────────────────── */}
      <div className="input-wrapper" style={{ marginBottom: "20px" }}>
        <label className="input-label">Texto libre (pega aquí un párrafo o lista con los IDs)</label>
        <textarea
          className="inscripciones-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ej: El grupo 1 es 6765d926107fc303893724e9 y el otro es 6765d926107fc303893724ea..."
          style={{ minHeight: "120px", resize: "vertical", fontSize: "13px", fontFamily: "'Space Grotesk', monospace" }}
        />
      </div>

      {/* ── Resultados ──────────────────────────────────────────────── */}
      {extractedIds.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label className="input-label">
              IDs Extraídos <span style={{ color: "var(--primary)" }}>({extractedIds.length})</span>
            </label>
            <button
              onClick={handleCopyAll}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "var(--primary-container)", color: "#fff",
                border: "1px solid var(--primary)", borderRadius: "8px",
                padding: "5px 12px", fontSize: "12px", fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <Copy size={13} /> Copiar Todos
            </button>
          </div>
          
          <div className="commands" style={{
            marginTop: 0, minHeight: "80px", maxHeight: "250px", overflowY: "auto",
            display: "flex", flexDirection: "column", gap: "8px",
            borderColor: "rgba(18,163,131,0.4)",
          }}>
            {extractedIds.map((id, index) => (
              <div key={index} style={{
                background: "rgba(0,0,0,0.2)", padding: "8px 12px",
                borderRadius: "6px", fontFamily: "'Space Grotesk', monospace",
                fontSize: "13px", color: "var(--on-surface)",
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <span>{id}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(id);
                    toast.success("ID copiado");
                  }}
                  title="Copiar este ID"
                  style={{ background: "transparent", border: "none", color: "var(--on-surface-variant)", cursor: "pointer" }}
                >
                  <Copy size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Wrappers de página para cada sub-ruta ──────────────────────────────────
export function UndoPublicationPage() {
  return (
    <div className="inscripciones-container">
      <UndoPublicationCard />
    </div>
  );
}

export function FinalUserPage() {
  return (
    <div className="inscripciones-container">
      <FinalUserCard />
    </div>
  );
}

export function ExtractGroupsPage() {
  return (
    <div className="inscripciones-container">
      <ExtractGroupsCard />
    </div>
  );
}

// ── Componente principal (vista completa) ───────────────────────────────────
function HerramientasAcademicos() {
  return (
    <div className="inscripciones-container">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <UndoPublicationCard />
        <FinalUserCard />
        <ExtractGroupsCard />
      </div>
    </div>
  );
}

export default HerramientasAcademicos;
