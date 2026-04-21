import React, { useState } from "react";
import { toast } from "react-toastify";

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
      style={{
        marginTop: "24px",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        border: "1px solid #313244",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          backgroundColor: "#1e1e2e",
          color: "#cdd6f4",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "14px" }}>
          📋 {commands.length} comando{commands.length !== 1 ? "s" : ""}{" "}
          generado{commands.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={copyAll}
            style={{
              padding: "5px 14px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: copiedAll ? "#40a02b" : "#89b4fa",
              color: "#1e1e2e",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "12px",
              transition: "background-color 0.2s ease",
            }}
          >
            {copiedAll ? "✓ Copiado" : "Copiar todo"}
          </button>
          <button
            onClick={onClear}
            style={{
              padding: "5px 14px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#f38ba8",
              color: "#1e1e2e",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            ✕ Cerrar
          </button>
        </div>
      </div>

      {/* Commands list */}
      <div
        style={{
          backgroundColor: "#181825",
          padding: "12px",
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
                gap: "12px",
                padding: "8px 12px",
                marginBottom: "6px",
                backgroundColor: "#1e1e2e",
                borderRadius: "6px",
                border: "1px solid #313244",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    color: "#6c7086",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    minWidth: "22px",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                <code
                  style={{
                    color: "#cba6f7",
                    fontSize: "13px",
                    fontFamily: "'Courier New', Consolas, monospace",
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
                  padding: "4px 12px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor:
                    copiedIndex === index ? "#40a02b" : "#45475a",
                  color: copiedIndex === index ? "#fff" : "#cdd6f4",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  transition: "background-color 0.2s ease",
                  flexShrink: 0,
                  minWidth: "58px",
                }}
              >
                {copiedIndex === index ? "✓" : "Copiar"}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

export default CommandsDisplay;
