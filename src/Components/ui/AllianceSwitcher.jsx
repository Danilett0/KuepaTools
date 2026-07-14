/**
 * AllianceSwitcher — Componente global de selección de alianza.
 *
 * Props:
 *  - value (string): Valor actual ("na" | "kuepa" ó IDs de MongoDB según el modo).
 *  - onChange (fn): Callback que recibe el nuevo valor al cambiar.
 *  - mode ("short" | "long"):
 *      "short" → usa valores "na" y "kuepa" (modo por defecto).
 *      "long"  → usa los IDs largos de MongoDB.
 *  - size ("sm" | "md"):
 *      "sm" → padding compacto, fuente pequeña (default).
 *      "md" → padding más amplio.
 */

const NA_SHORT = "na";
const KUEPA_SHORT = "kuepa";
const NA_LONG = "6303ed663138387a1669d82a";
const KUEPA_LONG = "602169e217b5c8a27f9e9c06";

const STYLES = {
  sm: { fontSize: "11px", padding: "3px 10px", borderRadius: "6px" },
  md: { fontSize: "12px", padding: "4px 14px", borderRadius: "6px" },
};

function AllianceSwitcher({ value, onChange, mode = "short", size = "sm" }) {
  const naValue = mode === "long" ? NA_LONG : NA_SHORT;
  const kuepaValue = mode === "long" ? KUEPA_LONG : KUEPA_SHORT;
  const btnStyle = STYLES[size] || STYLES.sm;

  const isNA = value === naValue;
  const isKuepa = value === kuepaValue;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        background: "var(--glass-border)",
        borderRadius: "8px",
        padding: "3px",
      }}
    >
      <button
        type="button"
        onClick={() => onChange(naValue)}
        style={{
          ...btnStyle,
          fontWeight: "600",
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s ease",
          background: isNA ? "#22c55e" : "transparent",
          color: isNA ? "#0a0a0a" : "var(--text-muted)",
          boxShadow: isNA ? "0 1px 4px rgba(34,197,94,0.4)" : "none",
        }}
      >
        Nueva América
      </button>
      <button
        type="button"
        onClick={() => onChange(kuepaValue)}
        style={{
          ...btnStyle,
          fontWeight: "600",
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s ease",
          background: isKuepa ? "#ef4444" : "transparent",
          color: isKuepa ? "#fff" : "var(--text-muted)",
          boxShadow: isKuepa ? "0 1px 4px rgba(239,68,68,0.4)" : "none",
        }}
      >
        Kuepa
      </button>
    </div>
  );
}

export default AllianceSwitcher;
