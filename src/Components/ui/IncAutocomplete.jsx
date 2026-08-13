import { useState, useRef, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { searchByIncPrefix, findUser } from "../../services/usuariosService";

const DEBOUNCE_MS = 800;
const MIN_CHARS = 1;

/**
 * IncAutocomplete — Buscador de estudiante por código INC con autocompletado.
 *
 * Props:
 *  - alianzaId  {string}   MongoDB ObjectId de la alianza para filtrar usuarios.
 *  - value      {string}   Texto actual del input (controlled).
 *  - onChange   {fn}       Llamado cuando el usuario escribe (recibe el string crudo).
 *  - onSelect   {fn}       Llamado cuando se confirma un usuario: onSelect(user | null).
 *                          Pasa null si el campo se borra o no se encuentra nada.
 *  - placeholder {string}  Texto de placeholder del input.
 *  - style      {object}   Estilos extras para el input.
 *  - inputStyle {object}   Alias de style para mayor claridad.
 */
export default function IncAutocomplete({
  alianzaId,
  value,
  onChange,
  onSelect,
  placeholder = "Ej: 292828",
  style,
  inputStyle,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // ── Cerrar sugerencias al hacer click fuera ───────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Búsqueda con debounce al cambiar el valor ─────────────────────────────
  useEffect(() => {
    const val = value.trim();

    // Reset state on every change
    setNotFound(false);
    setSuggestions([]);
    onSelect?.(null);

    if (!val || val.length < MIN_CHARS) {
      setSearching(false);
      return;
    }

    const incNum = Number(val);
    if (isNaN(incNum)) return;

    // Cancel previous debounce timer
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        // First try exact match
        const exact = await findUser(val, alianzaId);
        if (exact) {
          onSelect?.(exact);
          setSuggestions([]);
          setNotFound(false);
          return;
        }

        // Partial prefix search
        const partial = await searchByIncPrefix(val, alianzaId, 6);
        setSuggestions(partial);
        setShowSuggestions(true);

        if (!partial.length && val.length >= 5) {
          setNotFound(true);
          onSelect?.(null);
        }
      } catch (err) {
        console.error("IncAutocomplete search error:", err);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, alianzaId]);

  const selectSuggestion = useCallback((user) => {
    onChange(String(user.incremental_user_code));
    onSelect?.(user);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [onChange, onSelect]);

  const combinedStyle = { ...(style || {}), ...(inputStyle || {}) };
  const isLoading = searching;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* ── Label de estado ── */}
      {isLoading && (
        <span
          style={{
            fontSize: "10px",
            color: "#eab308",
            fontStyle: "italic",
            fontWeight: 400,
            position: "absolute",
            top: "-18px",
            left: 0,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          buscando…
        </span>
      )}

      {/* ── Input ── */}
      <div style={{ position: "relative" }}>
        <input
          className="inscripciones-input"
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
            onSelect?.(null);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          style={{
            fontSize: "13px",
            fontFamily: "'Space Grotesk', monospace",
            paddingRight: "40px",
            ...combinedStyle,
          }}
        />
        <Search
          size={14}
          style={{
            position: "absolute",
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--on-surface-variant)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Sugerencias desplegables ── */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--surface-low)",
            border: "1px solid var(--glass-border)",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {suggestions.map((u) => (
            <div
              key={u._id.$oid}
              onMouseDown={() => selectSuggestion(u)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                transition: "background 0.15s",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--on-surface)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                }}
              >
                #{u.incremental_user_code}
              </span>
              <span style={{ fontSize: "11px", color: "var(--primary)" }}>
                {u.profile?.full_name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Estado "no encontrado" ── */}
      {notFound && (
        <span
          style={{
            fontSize: "11px",
            color: "#ef4444",
            marginLeft: "4px",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          Usuario no encontrado
        </span>
      )}
    </div>
  );
}
