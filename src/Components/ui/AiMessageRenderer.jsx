import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Info, 
  Copy, 
  Check, 
  Users, 
  GraduationCap, 
  Sparkles, 
  Database, 
  AlertCircle,
  Hash,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { extractTableFromText } from '../../utils/tableParser';
import AiTableBlock from './AiTableBlock';

/**
 * CopyCodePill
 * Interactive copyable code badge for ObjectIds, codes, and parameters.
 */
function CopyCodePill({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Copiado: ${value}`, { autoClose: 2000 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ai-copy-code-pill"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: '6px',
        background: copied ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 0, 0, 0.45)',
        border: copied ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
        color: copied ? '#86efac' : '#38bdf8',
        fontFamily: "'Fira Code', 'Consolas', monospace",
        fontSize: '11.5px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'all',
        verticalAlign: 'baseline',
        lineHeight: '1.4'
      }}
      title="Clic para copiar al portapapeles"
    >
      <span>{value}</span>
      {copied ? (
        <Check size={11} strokeWidth={2.5} color="#86efac" />
      ) : (
        <Copy size={11} style={{ opacity: 0.6 }} className="copy-icon" />
      )}
    </button>
  );
}

/**
 * Returns an appropriate icon based on the entity key name.
 */
function getCatalogItemIcon(key = '') {
  const lower = String(key).toLowerCase();
  if (
    lower.includes('primaria') || 
    lower.includes('secundaria') || 
    lower.includes('placement') || 
    lower.includes('test') || 
    lower.includes('bachillerato') ||
    lower.includes('técnico') ||
    lower.includes('tecnico') ||
    lower.includes('tecnólogo') ||
    lower.includes('tecnologo') ||
    lower.includes('profesional') ||
    lower.includes('programa') ||
    lower.includes('carrera') ||
    lower.includes('contad') ||
    lower.includes('gestión') ||
    lower.includes('gestion') ||
    lower.includes('ingeni') ||
    lower.includes('licenciatura') ||
    lower.includes('diplomado')
  ) {
    return <GraduationCap size={15} color="#38bdf8" />;
  }
  if (lower.includes('mujer') || lower.includes('empleo') || lower.includes('talento') || lower.includes('socios') || lower.includes('estudiante') || lower.includes('alumno')) {
    return <Users size={15} color="#a78bfa" />;
  }
  if (lower.includes('kuepa') || lower.includes('tech') || lower.includes('admin') || lower.includes('nexus')) {
    return <Sparkles size={15} color="#34d399" />;
  }
  if (lower.includes('512') || lower.includes('colsubsidio') || lower.includes('ctf') || lower.includes('suba') || lower.includes('américa') || lower.includes('america')) {
    return <Building2 size={15} color="#fbbf24" />;
  }
  return <Database size={15} color="#34d399" />;
}

/**
 * Tokenizes text and renders inline Markdown:
 * - **bold**
 * - `code`
 * - (INC 12345) / (INC: 12345)
 * - (count) e.g. (18)
 */
function renderInlineFormatted(text = '') {
  if (!text) return null;

  // Regex matches: **bold**, `code`, (INC 12345), or (number) count badges
  const regex = /(\*\*.*?\*\*|`[^`]+`|\(INC\s*#?\s*\d+\)|\([0-9]+\))/gi;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} style={{ color: '#ffffff', fontWeight: 700 }}>
          {boldText}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeVal = part.slice(1, -1);
      return <CopyCodePill key={index} value={codeVal} />;
    }

    const incMatch = part.match(/^\(INC\s*#?\s*(\d+)\)$/i);
    if (incMatch) {
      return (
        <span
          key={index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '1px 8px',
            borderRadius: '6px',
            background: 'rgba(56, 189, 248, 0.14)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            fontSize: '11.5px',
            fontWeight: 700,
            fontFamily: "'Fira Code', monospace",
            margin: '0 4px',
            verticalAlign: 'baseline'
          }}
        >
          INC {incMatch[1]}
        </span>
      );
    }

    if (/^\([0-9]+\)$/.test(part)) {
      const count = part.slice(1, -1);
      return (
        <span
          key={index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '1px 7px',
            borderRadius: '100px',
            background: 'rgba(16, 185, 129, 0.16)',
            border: '1px solid rgba(52, 211, 153, 0.35)',
            color: '#34d399',
            fontSize: '11.5px',
            fontWeight: 700,
            fontFamily: "'Fira Code', monospace",
            margin: '0 4px',
            verticalAlign: 'baseline'
          }}
        >
          {count}
        </span>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

/**
 * Detects if a line represents a catalog, program, alliance, or database item.
 * Supports:
 * - "• Técnico Profesional en Procesos Contables (ID: 6345d3be3ed50d10092860c3)"
 * - "• **512:** `5fc1417018d8cca721c0ba02`"
 * - "• **Kuepa Colombia:** `602169e217b5c8a27f9e9c06`"
 * - "• Programa - ID: 6345d3be3ed50d10092860c3"
 * - "1. Técnico Profesional... (ID: 6345...)"
 * - "ID: 6345..., Nombre: Técnico..."
 */
function parseCatalogItem(line = '') {
  if (!line) return null;

  const prefixMatch = line.match(/^(?:[•\-\*\.\u2022]|\d+[\.\)])\s*(.*)$/);
  if (!prefixMatch) return null;
  const content = prefixMatch[1].trim();

  // Pattern A: "Nombre (ID: 6345d3be3ed50d10092860c3)" or "**Nombre** (ID: `6345...`)"
  const idInParensMatch = content.match(/^(.*?)\s*\((?:ID|Id|id|MongoID):\s*`?([a-f0-9]{24}|[a-zA-Z0-9_\-]+)`?\)\s*(.*)$/i);
  if (idInParensMatch) {
    const rawKey = idInParensMatch[1].replace(/\*\*/g, '').replace(/[:\-–\u2013\s]+$/, '').trim();
    if (rawKey) {
      return {
        key: rawKey,
        value: idInParensMatch[2].trim(),
        extra: (idInParensMatch[3] || '').trim()
      };
    }
  }

  // Pattern B: "ID: 6345..., Nombre: Técnico..."
  const dbFormatMatch = content.match(/^ID:\s*`?([a-f0-9]{24})`?,\s*Nombre:\s*(.*)$/i);
  if (dbFormatMatch) {
    return {
      key: dbFormatMatch[2].replace(/\*\*/g, '').trim(),
      value: dbFormatMatch[1].trim(),
      extra: ''
    };
  }

  // Pattern C: "**Nombre:** `6345...`" or "Nombre: `6345...`" or "Nombre: 6345d3be3ed50d10092860c3"
  const kvMatch = content.match(/^(.*?)\s*[:\-–\u2013]?\s*(?:`([^`]+)`|([a-f0-9]{24}))\s*(.*)$/i);
  if (kvMatch && (kvMatch[2] || kvMatch[3])) {
    const rawKey = kvMatch[1].replace(/\*\*/g, '').replace(/[:\-–\u2013\s]+$/, '').trim();
    const val = (kvMatch[2] || kvMatch[3] || '').trim();
    if (rawKey && val && (val.length >= 8 || /^[a-f0-9]{24}$/i.test(val))) {
      return {
        key: rawKey,
        value: val,
        extra: (kvMatch[4] || '').trim()
      };
    }
  }

  return null;
}

/**
 * Parses raw text into semantic blocks:
 * - catalog lists (key-value pairs of alliances, programs, IDs)
 * - callouts (notes, tips, warnings)
 * - prompt questions (actionable next steps)
 * - bullet lists
 * - numbered steps
 * - headers
 * - regular paragraphs
 */
function parseMessageToBlocks(text = '') {
  if (!text) return [];

  // Check if text contains a tabular data structure (TSV from Excel, CSV, or Markdown table)
  const tableData = extractTableFromText(text);
  if (tableData) {
    const prefixBlocks = tableData.prefixText ? parseMessageToBlocks(tableData.prefixText) : [];
    const suffixBlocks = tableData.suffixText ? parseMessageToBlocks(tableData.suffixText) : [];
    return [
      ...prefixBlocks,
      { type: 'table', table: tableData.table },
      ...suffixBlocks
    ];
  }

  const lines = text.split('\n');
  const blocks = [];

  let currentCatalogList = null;
  let currentBulletList = null;
  let currentNumberedList = null;

  const flushLists = () => {
    if (currentCatalogList && currentCatalogList.length > 0) {
      blocks.push({ type: 'catalog', items: currentCatalogList });
      currentCatalogList = null;
    }
    if (currentBulletList && currentBulletList.length > 0) {
      blocks.push({ type: 'bullets', items: currentBulletList });
      currentBulletList = null;
    }
    if (currentNumberedList && currentNumberedList.length > 0) {
      blocks.push({ type: 'numbered', items: currentNumberedList });
      currentNumberedList = null;
    }
  };

  const noteRegex = /^[\*\>\(\s]*\s*(Nota|Importante|Atención|Atencion|Tip|Advertencia)\s*[:\-–\u2013]?\s*(.*?)(?:\)*\*?)$/i;
  const bulletRegex = /^[•\-\*\u2022]\s+(.*)$/;
  const numberedRegex = /^(\d+)[\.\)]\s+(.*)$/;
  const headerRegex = /^(#{1,3})\s+(.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushLists();
      continue;
    }

    // Callout / Note detection:
    const noteMatch = line.match(noteRegex);
    if (noteMatch && noteMatch[2]) {
      flushLists();
      const variant = /importante|atenci|advert/i.test(noteMatch[1]) ? 'warning' : 'info';
      let content = noteMatch[2].trim();
      content = content.replace(/\s*[\)\*]+$/, '');
      blocks.push({
        type: 'callout',
        variant,
        label: noteMatch[1],
        content
      });
      continue;
    }

    // Catalog / Program / Alliance Key-Value Item detection:
    const catalogItem = parseCatalogItem(line);
    if (catalogItem) {
      if (currentBulletList) {
        blocks.push({ type: 'bullets', items: currentBulletList });
        currentBulletList = null;
      }
      if (currentNumberedList) {
        blocks.push({ type: 'numbered', items: currentNumberedList });
        currentNumberedList = null;
      }
      if (!currentCatalogList) {
        currentCatalogList = [];
      }
      currentCatalogList.push(catalogItem);
      continue;
    }

    // Prompt Question detection (e.g. ¿Sobre cuál de estos programas deseas realizar alguna gestión?)
    const isPromptQuestion = /^[¿\?].*(?:cu[aá]l|deseas|gesti[oó]n|ind[ií]came|qu[eé]\s+programa|selecciona|necesitas).*\??$/i.test(line);
    if (isPromptQuestion) {
      flushLists();
      blocks.push({
        type: 'prompt_question',
        text: line
      });
      continue;
    }

    // Standard Bullet list item:
    const bulletMatch = line.match(bulletRegex);
    if (bulletMatch) {
      if (currentCatalogList) {
        blocks.push({ type: 'catalog', items: currentCatalogList });
        currentCatalogList = null;
      }
      if (!currentBulletList) {
        currentBulletList = [];
      }
      currentBulletList.push(bulletMatch[1]);
      continue;
    }

    // Numbered step item:
    const numberedMatch = line.match(numberedRegex);
    if (numberedMatch) {
      flushLists();
      if (!currentNumberedList) {
        currentNumberedList = [];
      }
      currentNumberedList.push({
        num: numberedMatch[1],
        text: numberedMatch[2]
      });
      continue;
    }

    // Markdown Headers:
    const headerMatch = line.match(headerRegex);
    if (headerMatch) {
      flushLists();
      blocks.push({
        type: 'header',
        level: headerMatch[1].length,
        text: headerMatch[2]
      });
      continue;
    }

    // Paragraph
    flushLists();
    blocks.push({
      type: 'paragraph',
      text: line
    });
  }

  flushLists();
  return blocks;
}

/**
 * CatalogListBlock
 * Renders a grid of catalog cards with an optional "Copiar todo" button.
 */
function CatalogListBlock({ items = [], onOptionSelect = null }) {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = () => {
    const text = items.map(it => `• ${it.key}: ${it.value}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success(`Copiados ${items.length} elementos al portapapeles ✨`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '6px 0', width: '100%' }}>
      {items.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Resultados ({items.length})
          </span>
          <button
            type="button"
            onClick={handleCopyAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: copiedAll ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: copiedAll ? '1px solid rgba(34, 197, 94, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: copiedAll ? '#86efac' : 'rgba(255, 255, 255, 0.65)',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            title="Copiar todos los elementos de la lista"
          >
            {copiedAll ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
            <span>{copiedAll ? 'Copiados' : 'Copiar lista'}</span>
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '8px',
          width: '100%'
        }}
      >
        {items.map((item, itemIdx) => {
          const isAcademic = /técnic|tecnólog|profesional|contad|bachiller|primaria|secundaria|programa|carrera|curso|ingenier/i.test(item.key);

          return (
            <div
              key={itemIdx}
              className="ai-catalog-card"
              onClick={() => {
                if (onOptionSelect) {
                  onOptionSelect(item.key);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                cursor: onOptionSelect ? 'pointer' : 'default'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: isAcademic ? 'rgba(56, 189, 248, 0.14)' : 'rgba(16, 185, 129, 0.14)',
                  border: isAcademic ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(52, 211, 153, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getCatalogItemIcon(item.key)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#f8fafc',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={item.key}
                  >
                    {item.key}
                  </span>
                  {item.extra && (
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '1px' }}>
                      {item.extra}
                    </span>
                  )}
                </div>
              </div>

              {item.value && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <CopyCodePill value={item.value} />
                  {onOptionSelect && !/^(?:grupo\s*id|alianza\s*id|estudiante\s*id|id|objectid|mongo_?id)$/i.test(item.key.trim()) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOptionSelect(item.key);
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Space Grotesk', sans-serif"
                      }}
                      title="Seleccionar este elemento"
                    >
                      Elegir
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Main AiMessageRenderer Component
 */
export default function AiMessageRenderer({ text = '', onOptionSelect = null }) {
  if (!text) {
    return <span style={{ opacity: 0.5 }}>Procesando...</span>;
  }

  const blocks = parseMessageToBlocks(text);

  // Extract all catalog items for quick option chips if a prompt question is present
  const allCatalogItems = blocks
    .filter(b => b.type === 'catalog')
    .flatMap(b => b.items);

  return (
    <div
      className="ai-rendered-message"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        color: '#f8fafc',
        fontSize: '14.5px',
        lineHeight: '1.6',
        fontFamily: "'Space Grotesk', sans-serif"
      }}
    >
      {blocks.map((block, idx) => {
        if (block.type === 'header') {
          return (
            <h4
              key={idx}
              style={{
                fontSize: block.level === 1 ? '18px' : block.level === 2 ? '16px' : '15px',
                fontWeight: 700,
                color: '#ffffff',
                margin: '8px 0 2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ width: '4px', height: '14px', borderRadius: '2px', background: '#34d399' }} />
              <span>{renderInlineFormatted(block.text)}</span>
            </h4>
          );
        }

        if (block.type === 'table') {
          return <AiTableBlock key={idx} table={block.table} />;
        }

        if (block.type === 'catalog') {
          return <CatalogListBlock key={idx} items={block.items} onOptionSelect={onOptionSelect} />;
        }

        if (block.type === 'prompt_question') {
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px 0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(14, 165, 233, 0.02) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  fontWeight: 600
                }}
              >
                <Sparkles size={15} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span>{renderInlineFormatted(block.text)}</span>
              </div>

              {onOptionSelect && allCatalogItems.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginLeft: '4px' }}>
                  {allCatalogItems.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      type="button"
                      onClick={() => onOptionSelect(item.key)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Space Grotesk', sans-serif"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)';
                        e.currentTarget.style.borderColor = '#38bdf8';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <ChevronRight size={12} />
                      <span>{item.key}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (block.type === 'callout') {
          const isWarning = block.variant === 'warning';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: isWarning 
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(180, 83, 9, 0.04) 100%)' 
                  : 'linear-gradient(135deg, rgba(56, 189, 248, 0.09) 0%, rgba(14, 165, 233, 0.03) 100%)',
                border: isWarning 
                  ? '1px solid rgba(245, 158, 11, 0.28)' 
                  : '1px solid rgba(56, 189, 248, 0.25)',
                margin: '8px 0',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {isWarning ? <AlertCircle size={16} color="#fbbf24" /> : <Info size={16} color="#38bdf8" />}
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.55', color: 'rgba(255, 255, 255, 0.88)', flex: 1 }}>
                <span style={{ fontWeight: 700, color: isWarning ? '#fde047' : '#7dd3fc', marginRight: '6px' }}>
                  {block.label}:
                </span>
                {renderInlineFormatted(block.content)}
              </div>
            </div>
          );
        }

        if (block.type === 'bullets') {
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0 4px 6px' }}>
              {block.items.map((bulletText, bulletIdx) => (
                <div key={bulletIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                  <span style={{ color: '#34d399', fontSize: '15px', lineHeight: '1.4', flexShrink: 0 }}>•</span>
                  <span style={{ fontSize: '14px', lineHeight: '1.55', color: '#e2e8f0' }}>
                    {renderInlineFormatted(bulletText)}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        if (block.type === 'numbered') {
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '6px 0' }}>
              {block.items.map((step, stepIdx) => (
                <div key={stepIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.16)',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      color: '#34d399',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: "'Fira Code', monospace",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    {step.num}
                  </span>
                  <span style={{ fontSize: '14px', lineHeight: '1.55', color: '#e2e8f0', flex: 1 }}>
                    {renderInlineFormatted(step.text)}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        // Paragraph
        return (
          <div key={idx} style={{ fontSize: '14px', lineHeight: '1.6', color: '#e2e8f0' }}>
            {renderInlineFormatted(block.text)}
          </div>
        );
      })}

      <style>{`
        .ai-catalog-card:hover {
          background: rgba(16, 185, 129, 0.06) !important;
          border-color: rgba(52, 211, 153, 0.3) !important;
          transform: translateY(-1px);
        }
        .ai-copy-code-pill:hover {
          background: rgba(56, 189, 248, 0.2) !important;
          border-color: rgba(56, 189, 248, 0.45) !important;
          color: #7dd3fc !important;
        }
      `}</style>
    </div>
  );
}
