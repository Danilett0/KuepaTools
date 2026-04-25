import React, { useState } from "react";
import { toast } from "react-toastify";
import { Copy, Check, X } from "lucide-react";

function CommandsDisplay({ commands, onClear }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!commands || commands.length === 0) return null;

  const copyOne = (cmd, index) => {
    navigator.clipboard.writeText(cmd.trim()).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  };

  const copyAll = () => {
    const text = commands.map((c) => c.trim()).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAll(true);
      toast.success("Todos los comandos copiados al portapapeles");
      setTimeout(() => setCopiedAll(false), 1500);
    });
  };

  return (
    <div
      className="animate-slide-down"
      style={{
        marginTop: "24px",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        border: "1px solid var(--glass-border)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          backgroundColor: "var(--surface-low)",
          color: "var(--on-surface)",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "14px" }}>
          📋 {commands.length} comando{commands.length !== 1 ? "s" : ""}{" "}
          generado{commands.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={copyAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 16px",
              borderRadius: "100px",
              border: "none",
              backgroundColor: copiedAll ? "var(--primary-container)" : "var(--primary)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
              transition: "all 0.2s ease",
            }}
          >
            {copiedAll ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar todo</>}
          </button>
          <button
            onClick={onClear}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 16px",
              borderRadius: "100px",
              border: "1px solid var(--glass-border)",
              backgroundColor: "transparent",
              color: "var(--on-surface-variant)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 71, 87, 0.1)";
              e.currentTarget.style.color = "#ff4757";
              e.currentTarget.style.borderColor = "rgba(255, 71, 87, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--on-surface-variant)";
              e.currentTarget.style.borderColor = "var(--glass-border)";
            }}
          >
            <X size={16} /> Cerrar
          </button>
        </div>
      </div>

      {/* Commands list */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          padding: "16px",
          maxHeight: "420px",
          overflowY: "auto",
        }}
      >
        {commands
          .map((c) => c.trim())
          .filter((c) => c.length > 0)
          .map((cmd, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                padding: "12px 16px",
                marginBottom: "8px",
                backgroundColor: "var(--surface-low)",
                borderRadius: "12px",
                border: "1px solid var(--glass-border)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--glass-border)"}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    color: "var(--on-surface-variant)",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    minWidth: "24px",
                    textAlign: "right",
                    flexShrink: 0,
                    opacity: 0.6,
                  }}
                >
                  {index + 1}
                </span>
                <code
                  style={{
                    color: "var(--primary)",
                    fontSize: "14px",
                    fontFamily: "'Space Grotesk', monospace",
                    wordBreak: "break-all",
                    flex: 1,
                    lineHeight: "1.5",
                  }}
                >
                  {cmd}
                </code>
              </div>
              <button
                onClick={() => copyOne(cmd, index)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: copiedIndex === index ? "var(--primary)" : "rgba(255, 255, 255, 0.05)",
                  color: copiedIndex === index ? "#fff" : "var(--on-surface)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
                title="Copiar comando"
                onMouseEnter={(e) => {
                  if (copiedIndex !== index) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (copiedIndex !== index) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }
                }}
              >
                {copiedIndex === index ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

export default CommandsDisplay;
