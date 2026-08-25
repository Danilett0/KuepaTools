import { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Copy, Terminal, User, List, Search } from "lucide-react";
import { toast } from "react-toastify";
import AllianceSwitcher from "./ui/AllianceSwitcher";
import ClearButton from "./ui/ClearButton";
import IncAutocomplete from "./ui/IncAutocomplete";
import { ALLIANCE_IDS } from "../utils/constants";
import { useAppStore } from "../store/useAppStore";
import { supabase } from "../services/supabaseClient";

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

// ── Card 4: Grupos por Estudiante ──────────────────────────────────────────
function StudentGroupsCard() {
  const [alianza, setAlianza] = useLocalStorage("herr_studgroups_alianza", "na");
  const [incText, setIncText] = useLocalStorage("herr_studgroups_incText", "");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

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
      setGroups([]);
    }
  };

  const handleClear = () => {
    setIncText("");
    setStudentId("");
    setStudentName("");
    setNameFilter("");
    setSelectedLevel("");
    setGroups([]);
  };

  useEffect(() => {
    async function fetchGroups() {
      if (!studentId) {
        setGroups([]);
        return;
      }
      setLoading(true);
      try {
        let query = supabase
          .from('structures')
          .select(`
            mongo_id, 
            name,
            parent:parent_id (
              pensum_level_id,
              level:pensum_level_id ( name )
            )
          `)
          .contains('users', [studentId]);

        if (nameFilter.trim()) {
          query = query.ilike('name', `%${nameFilter.trim()}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        let finalData = data || [];
        setGroups(finalData);
      } catch (err) {
        console.error("Error fetching structures:", err);
        toast.error("Error al buscar grupos");
      } finally {
        setLoading(false);
      }
    }
    
    const timer = setTimeout(() => {
      fetchGroups();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [studentId, nameFilter]);

  // Derivar niveles únicos (por nombre) a partir de los grupos del estudiante
  const uniqueLevelNames = Array.from(new Set(
    groups
      .filter(g => g.parent && g.parent.level && g.parent.level.name)
      .map(g => g.parent.level.name)
  )).sort();

  // Filtrar grupos en memoria para renderizar
  const displayedGroups = groups.filter(g => {
    if (selectedLevel && g.parent?.level?.name !== selectedLevel) return false;
    return true;
  });

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
            <Search size={16} style={{ color: "#090909" }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--on-surface)", fontFamily: "'Nunito', sans-serif" }}>
            Consultar Grupos por Estudiante
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

        {/* Filtro opcional por nombre */}
        <div className="input-wrapper">
          <label className="input-label">Filtro por Nombre (Opcional)</label>
          <input
            className="inscripciones-input"
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Ej: Matemáticas"
            style={{ fontSize: "13px", fontFamily: "'Space Grotesk', monospace" }}
          />
        </div>

        {/* Filtro por Nivel / Cuatrimestre */}
        <div className="input-wrapper" style={{ gridColumn: "1 / -1" }}>
          <label className="input-label">Filtrar por Nivel / Cuatrimestre (Opcional)</label>
          <select
            className="inscripciones-input"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            style={{ 
              fontSize: "13px", 
              fontFamily: "'Space Grotesk', sans-serif",
              cursor: uniqueLevelNames.length === 0 ? "not-allowed" : "pointer",
              opacity: uniqueLevelNames.length === 0 ? 0.5 : 1,
              color: selectedLevel === "" ? "var(--on-surface-variant)" : "var(--on-surface)",
              appearance: "none",
              backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2312a383' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem center",
              backgroundSize: "1em",
              paddingRight: "2.5rem"
            }}
            disabled={uniqueLevelNames.length === 0}
          >
            <option value="" style={{ background: "var(--surface-void)", color: "var(--on-surface-variant)" }}>-- Todos los niveles --</option>
            {uniqueLevelNames.map(lvlName => (
              <option key={lvlName} value={lvlName} style={{ background: "var(--surface-void)", color: "var(--on-surface)" }}>
                {lvlName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Resultados ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label className="input-label">
            Grupos Encontrados {displayedGroups.length > 0 && <span style={{ color: "var(--primary)" }}>({displayedGroups.length})</span>}
          </label>
          {displayedGroups.length > 0 && (
            <button
              onClick={() => {
                const ids = displayedGroups.map(g => g.mongo_id).join("\n");
                navigator.clipboard.writeText(ids);
                toast.success("IDs copiados al portapapeles");
              }}
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
              <Copy size={13} /> Copiar Todos los IDs
            </button>
          )}
        </div>
        
        <div className="commands" style={{
          marginTop: 0, minHeight: "80px", maxHeight: "250px", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: "8px",
          borderColor: studentId ? "rgba(18,163,131,0.4)" : "var(--glass-border)",
        }}>
          {!studentId && (
            <span style={{ color: "rgba(202,225,215,0.35)", fontStyle: "italic", fontSize: "13px", margin: "auto" }}>
              Ingresa un estudiante para ver sus grupos…
            </span>
          )}
          {studentId && loading && (
            <span style={{ color: "var(--on-surface-variant)", fontSize: "13px", margin: "auto" }}>
              Cargando grupos...
            </span>
          )}
          {studentId && !loading && displayedGroups.length === 0 && (
            <span style={{ color: "var(--on-surface-variant)", fontSize: "13px", margin: "auto" }}>
              El estudiante no está asignado a ningún grupo que coincida.
            </span>
          )}
          {studentId && !loading && displayedGroups.map((g, index) => (
            <div key={index} style={{
              background: "rgba(0,0,0,0.2)", padding: "8px 12px",
              borderRadius: "6px", fontFamily: "'Space Grotesk', monospace",
              fontSize: "13px", color: "var(--on-surface)",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <span>
                <span style={{ color: "var(--primary)", marginRight: "8px" }}>{g.mongo_id}</span>
                - {g.name}
                {g.parent && g.parent.level && (
                  <span style={{ marginLeft: "8px", color: "var(--on-surface-variant)", fontSize: "11px", border: "1px solid var(--glass-border)", padding: "2px 6px", borderRadius: "4px" }}>
                    {g.parent.level.name}
                  </span>
                )}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(g.mongo_id);
                  toast.success("ID copiado");
                }}
                title="Copiar este ID"
                style={{ background: "transparent", border: "none", color: "var(--on-surface-variant)", cursor: "pointer", marginLeft: "10px" }}
              >
                <Copy size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
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

export function StudentGroupsPage() {
  return (
    <div className="inscripciones-container">
      <StudentGroupsCard />
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
        <StudentGroupsCard />
      </div>
    </div>
  );
}

export default HerramientasAcademicos;
