import { useState, useRef, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Copy, Terminal, User, Search, List } from "lucide-react";
import { toast } from "react-toastify";
import { useUsuariosCompletos } from "../hooks/useUsuariosCompletos";
import AllianceSwitcher from "./ui/AllianceSwitcher";
import ClearButton from "./ui/ClearButton";

// ── Utilidad: extrae el ID del grupo académico ──────────────────────────────
function extractGroupId(input) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  // Si es URL, extraer el ID de 24 chars hex que sigue a "details/"
  const urlMatch = trimmed.match(/details\/([a-f0-9]{24})/i);
  if (urlMatch) return urlMatch[1];
  // Si es directamente un ObjectId válido (24 caracteres hexadecimales)
  if (/^[a-f0-9]{24}$/i.test(trimmed)) return trimmed;
  // Cualquier otro valor no es válido
  return "";
}

// ── Card 1: Deshacer publicación ────────────────────────────────────────────
function UndoPublicationCard() {
  const [inputValue, setInputValue] = useLocalStorage("herr_undo_groupInput", "");

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
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [incNotFound, setIncNotFound] = useState(false);
  const suggestionRef = useRef(null);

  const { data: usuarios, loading } = useUsuariosCompletos();

  const resolvedGroupId = extractGroupId(groupId);

  const allianceId = alianza === "kuepa"
    ? "602169e217b5c8a27f9e9c06"
    : "6303ed663138387a1669d82a";

  // ── Busca por INC y auto-rellena el ID ───────────────────────────────────
  useEffect(() => {
    const val = incText.trim();
    setIncNotFound(false);
    setStudentId("");
    setStudentName("");
    setSuggestions([]);

    if (!val || !usuarios.length) return;

    const incNum = Number(val);
    if (!isNaN(incNum) && val.length >= 3) {
      // Si es número exacto, busca directamente
      const exactUser = usuarios.find(
        (u) => u.incremental_user_code === incNum && u.alliance_id?.$oid === allianceId
      );
      if (exactUser) {
        setStudentId(exactUser._id.$oid);
        setStudentName(exactUser.profile?.full_name || "");
        setIncNotFound(false);
        setSuggestions([]);
        return;
      }

      // Sugerencias parciales (primeros 6)
      const partial = usuarios
        .filter(
          (u) =>
            String(u.incremental_user_code).startsWith(val) &&
            u.alliance_id?.$oid === allianceId
        )
        .slice(0, 6);
      setSuggestions(partial);
      if (!partial.length && val.length >= 5) setIncNotFound(true);
    }
  }, [incText, alianza, usuarios, allianceId]);

  // ── Cierra sugerencias al hacer click fuera ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectSuggestion = (user) => {
    setIncText(String(user.incremental_user_code));
    setStudentId(user._id.$oid);
    setStudentName(user.profile?.full_name || "");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setGroupId("");
    setIncText("");
    setStudentId("");
    setStudentName("");
    setSuggestions([]);
    setIncNotFound(false);
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
            background: "#7c3aed",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={16} style={{ color: "#fff" }} />
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
        <div className="input-wrapper" style={{ position: "relative" }} ref={suggestionRef}>
          <label className="input-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            INC del Estudiante
            {loading && (
              <span style={{ fontSize: "10px", color: "#eab308", fontStyle: "italic", fontWeight: 400 }}>
                cargando usuarios…
              </span>
            )}
          </label>
          <div style={{ position: "relative" }}>
            <input
              className="inscripciones-input"
              type="text"
              value={incText}
              onChange={(e) => { setIncText(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Ej: 292828"
              style={{ fontSize: "13px", fontFamily: "'Space Grotesk', monospace", paddingRight: "40px" }}
            />
            <Search size={14} style={{
              position: "absolute", right: "14px", top: "50%",
              transform: "translateY(-50%)", color: "var(--on-surface-variant)", pointerEvents: "none",
            }} />
          </div>

          {/* Sugerencias */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
              background: "var(--surface-low)", border: "1px solid var(--glass-border)",
              borderRadius: "10px", overflow: "hidden", marginTop: "4px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}>
              {suggestions.map((u) => (
                <div
                  key={u._id.$oid}
                  onMouseDown={() => selectSuggestion(u)}
                  style={{
                    padding: "10px 14px", cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "background 0.15s",
                    display: "flex", flexDirection: "column", gap: "2px",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: "13px", color: "var(--on-surface)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
                    #{u.incremental_user_code}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--primary)" }}>
                    {u.profile?.full_name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Estado bajo el input */}
          {studentName && (
            <span style={{ fontSize: "11px", color: "var(--primary)", marginLeft: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              ✓ {studentName}
            </span>
          )}
          {incNotFound && (
            <span style={{ fontSize: "11px", color: "#ef4444", marginLeft: "4px" }}>
              Usuario no encontrado
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
