import React, { useState } from 'react';
import { Copy, Check, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-toastify';
import { tableToTSV, isMongoObjectId } from '../../utils/tableParser';

/**
 * AiTableBlock
 * Renders structured tabular data (from Excel copy-paste or Markdown)
 * with sticky headers, monospace ID badges, zebra striping, and TSV copy.
 */
export default function AiTableBlock({ table, title = 'Tabla de Datos' }) {
  const [copied, setCopied] = useState(false);
  const [copiedCell, setCopiedCell] = useState(null);

  if (!table || !table.headers || !table.rows) return null;

  const handleCopyTable = () => {
    const tsv = tableToTSV(table);
    navigator.clipboard.writeText(tsv);
    setCopied(true);
    toast.success(`Tabla copiada (${table.rows.length} filas) ✨`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCell = (e, val, key) => {
    e.stopPropagation();
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedCell(key);
    toast.success(`Copiado: ${val}`, { autoClose: 1500 });
    setTimeout(() => setCopiedCell(null), 1500);
  };

  return (
    <div
      className="ai-table-block"
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin: '8px 0',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(9, 14, 26, 0.9) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        width: '100%',
        fontFamily: "'Space Grotesk', sans-serif"
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileSpreadsheet size={14} color="#38bdf8" />
          </div>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
            {title}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyTable}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 11px',
            borderRadius: '7px',
            background: copied ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.06)',
            border: copied ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
            color: copied ? '#86efac' : 'rgba(255, 255, 255, 0.8)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.16s ease'
          }}
          title="Copiar datos tabulares como TSV (para pegar en Excel / Sheets)"
        >
          {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
          <span>{copied ? 'Copiada' : 'Copiar TSV'}</span>
        </button>
      </div>

      {/* Table Content with Sticky Header and Horizontal Scroll */}
      <div
        style={{
          maxHeight: '380px',
          overflowX: 'auto',
          overflowY: 'auto',
          width: '100%',
          scrollbarWidth: 'thin'
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '12px',
            lineHeight: '1.4'
          }}
        >
          <thead>
            <tr
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: 'rgba(10, 16, 28, 0.96)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              {table.headers.map((header, hIdx) => (
                <th
                  key={hIdx}
                  style={{
                    padding: '9px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#38bdf8',
                    borderRight: hIdx < table.headers.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="ai-table-row"
                style={{
                  background: rIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                  borderBottom: rIdx < table.rows.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                  transition: 'background 0.14s ease'
                }}
              >
                {/* Cells */}
                {row.map((cell, cIdx) => {
                  const cellKey = `${rIdx}-${cIdx}`;
                  const isId = isMongoObjectId(cell);
                  const isCellCopied = copiedCell === cellKey;

                  return (
                    <td
                      key={cIdx}
                      style={{
                        padding: '8px 14px',
                        color: isId ? '#93c5fd' : '#f8fafc',
                        fontFamily: isId ? "'Fira Code', monospace" : 'inherit',
                        fontSize: isId ? '11px' : '12px',
                        borderRight: cIdx < row.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isId ? (
                        <button
                          type="button"
                          onClick={(e) => handleCopyCell(e, cell, cellKey)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: isCellCopied ? 'rgba(34, 197, 94, 0.25)' : 'rgba(0, 0, 0, 0.35)',
                            border: isCellCopied ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: isCellCopied ? '#86efac' : '#7dd3fc',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontFamily: "'Fira Code', monospace",
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Clic para copiar este ID"
                        >
                          <span>{cell}</span>
                          {isCellCopied ? (
                            <Check size={10} strokeWidth={2.5} color="#86efac" />
                          ) : (
                            <Copy size={10} style={{ opacity: 0.5 }} />
                          )}
                        </button>
                      ) : (
                        <span>{cell || '—'}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .ai-table-row:hover {
          background: rgba(56, 189, 248, 0.06) !important;
        }
      `}</style>
    </div>
  );
}
