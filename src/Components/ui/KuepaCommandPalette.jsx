import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Bot, Zap, Settings, Loader2, Key, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { analyzeIntentWithGemini } from '../../services/aiService';
import { findUser } from '../../services/usuariosService';
import { supabase } from '../../services/supabaseClient';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { toast } from 'react-toastify';
import AllianceSwitcher from './AllianceSwitcher';
import { ALLIANCE_IDS, STATE_OPTIONS_BY_ALIANZA } from '../../utils/constants';

export default function KuepaCommandPalette() {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, setActiveComponent, setAiPrefilledData, setExpandedMenu } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [analyzingState, setAnalyzingState] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useLocalStorage('gemini_api_key', '');
  const [aiAlliance, setAiAlliance] = useLocalStorage('ai_alliance', 'na');
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setInputValue('');
      setParsedResult(null);
      setChatHistory([]);
    }
  }, [isCommandPaletteOpen]);

  // Analyze intent manually when Enter is pressed
  const handleAnalyze = async () => {
    if (inputValue.trim().length < 3 || !apiKey || analyzingState) return;
    
    setAnalyzingState('ai');
    
    const newUserMessage = { role: 'user', text: inputValue };
    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    setInputValue('');
    
    try {
      const geminiResult = await analyzeIntentWithGemini(updatedHistory, apiKey);
      
      if (geminiResult && geminiResult.type === 'INCOMPLETE') {
        setChatHistory([...updatedHistory, { role: 'ai', text: geminiResult.message }]);
        setParsedResult(geminiResult);
        setAnalyzingState(null);
        return;
      }
      
      // RESOLUCIÓN MÁGICA: Convertir INCs cortos a ObjectIDs y programas semánticos
      if (geminiResult && geminiResult.type === 'COMMANDS' && geminiResult.commands) {
        setAnalyzingState('db_ids');
        const resolvedCommands = await Promise.all(geminiResult.commands.map(async (cmd) => {
          let newCmd = cmd;
          let studentUser = null;
          
          // 1. Resolver IDs cortos (INCs de 1 a 7 dígitos)
          const incRegex = /["'](\d{1,7})["']/g;
          const incMatches = [...newCmd.matchAll(incRegex)];
          
          for (const match of incMatches) {
            const inc = match[1];
            try {
              studentUser = await findUser(inc, ALLIANCE_IDS[aiAlliance]);
              if (studentUser && studentUser._id && studentUser._id.$oid) {
                newCmd = newCmd.replace(match[0], `"${studentUser._id.$oid}"`);
              } else {
                toast.warning(`El estudiante con ID ${inc} no fue encontrado en tu base de datos.`);
              }
            } catch (err) {
              console.error("Error resolviendo ID mágico:", err);
            }
          }

          const normalizeStr = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

          // 2. Resolver programas faltantes basados en los programas del usuario
          const programRegex = /\[FALTA_ID_?(DE_)?PROGRAMA(?:_([^\]]+))?\]/gi;
          const progMatches = [...newCmd.matchAll(programRegex)];
          
          if (progMatches.length > 0 && studentUser && studentUser.programs?.length > 0) {
            setAnalyzingState('db_programs');
            try {
              const { data: progCatalog } = await supabase.from('programas')
                .select('mongo_id, name')
                .eq('alliance_id', ALLIANCE_IDS[aiAlliance]);
              const programasMap = {};
              if (progCatalog) {
                progCatalog.forEach(p => { programasMap[p.mongo_id] = p.name; });
              }

              const studentProgIds = studentUser.programs
                .map(p => p.structure?.$oid || p.structure)
                .filter(Boolean);
              
              const studentProgs = studentProgIds.map(id => ({
                id,
                name: normalizeStr(programasMap[id] || '')
              }));

              for (const match of progMatches) {
                if (match[2]) {
                  // Tenemos un hint semántico (ej: TECNOLOGO_DE_CONTADURIA)
                  const semanticHint = normalizeStr(match[2].replace(/_/g, ' ')); 
                  const keywords = semanticHint.split(' ').filter(w => w.length > 3);
                  
                  let bestMatch = null;
                  let maxMatches = 0;
                  
                  studentProgs.forEach(p => {
                    const matches = keywords.filter(k => p.name.includes(k)).length;
                    if (matches > maxMatches) {
                      maxMatches = matches;
                      bestMatch = p;
                    }
                  });

                  // Fallback: Si ningún keyword hace match, intentar match directo simple
                  if (!bestMatch) {
                    bestMatch = studentProgs.find(p => p.name.includes(semanticHint));
                  }

                  if (bestMatch) {
                    newCmd = newCmd.replace(match[0], bestMatch.id); // Sin comillas dobles inyectadas
                  } else {
                    toast.warning(`El estudiante no tiene matriculado ningún programa asociado a "${match[2]}".`);
                  }
                } else {
                  // NO tenemos hint semántico
                  if (studentProgs.length === 1) {
                    // Si solo tiene un programa, asumimos que es ese
                    newCmd = newCmd.replace(match[0], studentProgs[0].id); // Sin comillas dobles
                  } else {
                    toast.warning("El estudiante tiene múltiples programas. Por favor, especifica el nombre del programa en tu instrucción (ej: 'en técnico').");
                  }
                }
              }
            } catch (err) {
              console.error("Error resolviendo programa semántico:", err);
            }
          }

          // 3. Resolver Estados (ej: "Graduado" -> ObjectID)
          const stateKeywords = ["Desertor", "Retirado", "Activo", "Graduado"];
          const hasState = stateKeywords.some(kw => newCmd.includes(`"${kw}"`));
          if (hasState) {
            setAnalyzingState('db_states');
            try {
              const estadosCatalog = STATE_OPTIONS_BY_ALIANZA[aiAlliance] || [];
              if (estadosCatalog.length > 0) {
                for (const stateName of stateKeywords) {
                  if (newCmd.includes(`"${stateName}"`)) {
                    // Match fuzzy ignorando tildes y mayúsculas
                    const matchedState = estadosCatalog.find(e => normalizeStr(e.label).includes(normalizeStr(stateName)));
                    if (matchedState) {
                      newCmd = newCmd.replace(`"${stateName}"`, `"${matchedState.value}"`);
                    }
                  }
                }
              }
            } catch (err) {
              console.error("Error resolviendo estado semántico:", err);
            }
          }

          return newCmd;
        }));
        geminiResult.commands = resolvedCommands;
      }
      setParsedResult(geminiResult);
    } catch (error) {
      console.error("Gemini Error:", error);
      toast.error(error.message || "Ocurrió un error al conectar con la IA");
      setParsedResult(null);
    } finally {
      setAnalyzingState(null);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  const handleCopyCommands = (commands) => {
    const textToCopy = commands.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success(commands.length > 1 ? "Comandos copiados al portapapeles ✨" : "Comando copiado al portapapeles ✨");
      setIsCommandPaletteOpen(false);
    });
  };

  const handleExecute = () => {
    if (parsedResult?.type === 'COMMANDS' && parsedResult.commands?.length > 0) {
      handleCopyCommands(parsedResult.commands);
      return;
    }

    if (parsedResult?.type === 'ROUTE' && parsedResult.targetComponent) {
      // Navegar a la herramienta con los datos prellenados
      setAiPrefilledData({
        intent: parsedResult.intent,
        ids: parsedResult.ids || [],
        suggestedState: parsedResult.suggestedState || null,
        rawText: inputValue
      });
      setActiveComponent(parsedResult.targetComponent);
      setExpandedMenu(null);
      setIsCommandPaletteOpen(false);
    }
  };

  const getActionLabel = (intent) => {
    switch (intent) {
      case 'ENROLL': return 'Inscribir a Estudiante';
      case 'CHANGE_STATE': return 'Cambiar Estado / Retirar';
      case 'SEARCH_ID': return 'Buscar Información (ID)';
      case 'UNDO_PUBLICATION': return 'Deshacer Publicación';
      case 'FINAL_USER': return 'Re-calcular Nota';
      case 'AUDIT_STATS': return 'Auditar Estadísticas';
      case 'EXTRACT_GROUPS': return 'Extraer Grupos';
      case 'GET_PROGRAMS': return 'Ver Programas de Usuario';
      case 'INFO': return 'Información del Sistema';
      default: return 'Desconocido';
    }
  };

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
            }}
          />
          
          {/* Palette Modal */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '15vh',
              zIndex: 10000,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: '100%',
                maxWidth: '760px',
                backgroundColor: 'var(--surface-void)',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
                pointerEvents: 'auto',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Settings Area (Expandable) */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', borderBottom: '1px solid var(--glass-border)' }}
                  >
                    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)' }}>
                      <label style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Gemini API Key (Google AI Studio)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-void)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0 12px', flex: 1 }}>
                          <Key size={14} color="var(--on-surface-variant)" />
                          <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', padding: '10px', fontSize: '13px', fontFamily: "'Space Grotesk', monospace" }}
                          />
                        </div>
                        {apiKey && <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>Integrado ✨</span>}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Al ingresar tu clave, la paleta usará IA real para comprender lenguaje natural avanzado.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Area */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ marginTop: '4px' }}>
                    {analyzingState === 'ai' ? (
                      <Loader2 size={24} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : analyzingState ? (
                      <Zap size={24} color="#eab308" style={{ animation: 'pulse 1.5s infinite' }} />
                    ) : (
                      <Bot size={24} color={apiKey ? "var(--primary)" : "var(--on-surface-variant)"} />
                    )}
                  </div>
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (parsedResult) setParsedResult(null); // Clear results if user types again
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (parsedResult) {
                          handleExecute(); // If already analyzed, Enter copies/executes
                        } else {
                          handleAnalyze(); // If not analyzed, Enter sends to AI
                        }
                      }
                    }}
                    placeholder={apiKey ? "Habla con Kuepa AI (ej: saca al 1234 del grupo...)\nUsa Shift+Enter para salto de línea" : "Ej: inscribe al 123456 en 98765..."}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--on-surface)',
                      fontSize: '16px',
                      fontFamily: "'Space Grotesk', sans-serif",
                      minHeight: '80px',
                      resize: 'none',
                      lineHeight: '1.5'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AllianceSwitcher value={aiAlliance} onChange={setAiAlliance} size="sm" />
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showSettings ? 'var(--primary)' : 'var(--on-surface-variant)', transition: 'color 0.2s' }}
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', color: 'var(--on-surface-variant)', fontSize: '11px', fontWeight: 600, alignItems: 'center' }}>
                    {chatHistory.length > 0 && (
                      <>
                        <button
                          onClick={() => {
                            setChatHistory([]);
                            setParsedResult(null);
                            setInputValue('');
                            inputRef.current?.focus();
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--error, #ef4444)',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <Trash2 size={12} /> Limpiar Memoria
                        </button>
                        <div style={{ width: '1px', height: '14px', background: 'var(--glass-border)', margin: '0 4px' }} />
                      </>
                    )}
                    <kbd style={{ padding: '4px 8px', background: 'var(--surface-low)', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>ENTER</kbd>
                    <span style={{ display: 'flex', alignItems: 'center' }}>{parsedResult ? "para copiar" : "para enviar a IA"}</span>
                    <div style={{ width: '1px', height: '14px', background: 'var(--glass-border)', margin: '0 4px' }} />
                    <kbd style={{ padding: '4px 8px', background: 'var(--surface-low)', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>ESC</kbd>
                    <span style={{ display: 'flex', alignItems: 'center' }}>para cerrar</span>
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              <AnimatePresence>
                {analyzingState && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ 
                      padding: '12px 24px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      color: analyzingState === 'ai' ? 'var(--primary)' : '#eab308', 
                      fontSize: '12px', 
                      fontWeight: 600,
                      background: 'rgba(0,0,0,0.1)',
                      borderBottom: '1px solid var(--glass-border)'
                    }}>
                      {analyzingState === 'ai' ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Zap size={14} style={{ animation: 'pulse 1.5s infinite' }} />
                      )}
                      
                      {analyzingState === 'ai' && "Generando comandos base con la Inteligencia Artificial..."}
                      {analyzingState === 'db_ids' && "Traduciendo códigos cortos de estudiante a IDs en la base de datos..."}
                      {analyzingState === 'db_programs' && "Haciendo match semántico de programas matriculados..."}
                      {analyzingState === 'db_states' && "Reemplazando palabras clave por identificadores de Estado reales..."}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results Area */}
              <div style={{ padding: '16px', minHeight: '120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {!apiKey ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--on-surface-variant)' }}>
                    Configura tu API Key (⚙️) para activar Kuepa AI.
                  </div>
                ) : parsedResult?.type === 'INCOMPLETE' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308' }}>
                      <Bot size={18} />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Kuepa AI necesita más información:</span>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                      <span style={{ color: 'var(--on-surface)', fontSize: '14px' }}>
                        {parsedResult.message}
                      </span>
                    </div>
                  </div>
                ) : parsedResult?.type === 'COMMANDS' && parsedResult.commands?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                        {parsedResult.commands.length} Comando(s) Generado(s)
                      </span>
                      <button 
                        onClick={() => handleCopyCommands(parsedResult.commands)}
                        style={{
                          background: 'var(--primary)',
                          color: '#000',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        Copiar {parsedResult.commands.length > 1 ? 'Todos' : ''} <ArrowRight size={14} />
                      </button>
                    </div>
                    {parsedResult.commands.map((cmd, i) => (
                      <div key={i} style={{ padding: '12px', background: 'var(--surface-void)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <code style={{ color: 'var(--primary)', fontSize: '14px', fontFamily: "'Space Grotesk', monospace" }}>
                          {cmd}
                        </code>
                      </div>
                    ))}
                  </div>
                ) : parsedResult?.type === 'ROUTE' && parsedResult.targetComponent ? (
                  <div
                    onClick={handleExecute}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Search size={20} color="var(--on-surface-variant)" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--on-surface)' }}>
                          Consultar en Formulario Visual
                        </span>
                        {parsedResult.ids?.length > 0 && (
                          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                            Autocompletando IDs: {parsedResult.ids.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={18} color="var(--on-surface-variant)" />
                  </div>
                ) : chatHistory.length > 0 && !analyzingState ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--on-surface-variant)' }}>
                    No pude generar comandos para esta instrucción.
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--on-surface-variant)' }}>
                    Empieza a escribir para que Kuepa AI genere el código...
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
