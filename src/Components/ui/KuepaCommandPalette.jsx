import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Bot, Zap, Settings, Loader2, Key, Trash2, Edit2 } from 'lucide-react';
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
  const [chatHistory, setChatHistory] = useState([]);
  const [analyzingState, setAnalyzingState] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useLocalStorage('gemini_api_key', '');
  const [aiAlliance, setAiAlliance] = useLocalStorage('ai_alliance', 'na');
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Focus input when opened and scroll to bottom
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setInputValue('');
      setChatHistory([]);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      scrollToBottom();
    }
  }, [chatHistory, analyzingState, isCommandPaletteOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      if (inputValue) {
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      }
    }
  }, [inputValue]);

  // Analyze intent manually when Enter is pressed
  const handleAnalyze = async (overrideText = null) => {
    const textToAnalyze = overrideText !== null ? overrideText : inputValue;
    const minLength = chatHistory.length > 0 ? 1 : 3; // Permitir respuestas cortas ("1", "2") cuando hay conversación activa
    if (textToAnalyze.trim().length < minLength || !apiKey || analyzingState) return;
    
    const newUserMessage = { id: Date.now().toString(), role: 'user', text: textToAnalyze };
    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    
    if (overrideText === null) {
      setInputValue('');
    }
    
    try {
      const { AgentOrchestrator } = await import('../../services/AgentOrchestrator');
      const orchestrator = new AgentOrchestrator(apiKey, aiAlliance);

      // Loop for QUERY resolutions
      let currentHistory = [...updatedHistory];
      let isFinalResult = false;
      let finalResult = null;

      while (!isFinalResult) {
        // En lugar de llamar a Gemini directo, llamamos a nuestro Orquestador
        // NOTA: Para el loop interno de queries, le pasamos solo el último mensaje como userText,
        // pero la magia real ya está encapsulada.
        const lastMsgText = currentHistory[currentHistory.length - 1].text;
        const historyForOrchestrator = currentHistory.slice(0, -1);
        
        const result = await orchestrator.processMessage(lastMsgText, historyForOrchestrator, setAnalyzingState);

        if (result.type === 'QUERY' && result.query) {
          setAnalyzingState('db_processing');
          const { table, searchTerm } = result.query;
          let dbResultsStr = "No se encontraron resultados.";
          
          try {
            if (table === 'alianzas') {
              const { data } = await supabase.from('alianzas').select('mongo_id, name').ilike('name', `%${searchTerm || ''}%`).limit(10);
              if (data && data.length) dbResultsStr = data.map(d => `ID: ${d.mongo_id}, Nombre: ${d.name}`).join(' | ');
            } else if (table === 'programas') {
              const { data } = await supabase.from('programas').select('mongo_id, name').eq('alliance_id', ALLIANCE_IDS[aiAlliance]).ilike('name', `%${searchTerm || ''}%`).limit(10);
              if (data && data.length) dbResultsStr = data.map(d => `ID: ${d.mongo_id}, Nombre: ${d.name}`).join(' | ');
            } else if (table === 'estados') {
              let results = [];
              for (const [aly, cat] of Object.entries(STATE_OPTIONS_BY_ALIANZA)) {
                const filtered = cat.filter(e => e.label.toLowerCase().includes((searchTerm || '').toLowerCase()));
                if (filtered.length) {
                  results.push(`Alianza ${aly.toUpperCase()}: ` + filtered.map(d => `ID: ${d.value} (${d.label})`).join(', '));
                }
              }
              if (results.length) dbResultsStr = results.join(' || ');
            }
          } catch (e) {
            console.error("Error consultando BD para IA:", e);
            dbResultsStr = "Error técnico al consultar la base de datos.";
          }

          const systemMsgText = `[RESULTADOS DE BD PARA '${searchTerm}']: ${dbResultsStr}\nResponde al usuario basándote EXCLUSIVAMENTE en esto. No inventes.`;
          
          currentHistory = [
            ...currentHistory, 
            { id: Date.now().toString(), role: 'ai', text: `*(Consulté la base de datos buscando ${searchTerm}...)*`, isHidden: true }, 
            { id: (Date.now()+1).toString(), role: 'user', text: systemMsgText, isHidden: true }
          ];
          // Volver a loopear para que el orquestador resuelva con el nuevo contexto
        } else {
          isFinalResult = true;
          finalResult = result;
        }
      }

      // Procesar el resultado final del orquestador
      if (finalResult && (finalResult.type === 'INCOMPLETE' || finalResult.type === 'INFO')) {
        const aiMessage = { id: (Date.now() + 2).toString(), role: 'ai', text: finalResult.message, parsedResult: finalResult };
        setChatHistory([...currentHistory, aiMessage]);
      } else if (finalResult && finalResult.type === 'COMMANDS') {
        const aiMessage = { id: (Date.now() + 2).toString(), role: 'ai', text: '', parsedResult: finalResult };
        setChatHistory([...currentHistory, aiMessage]);
      } else if (finalResult && finalResult.type === 'ROUTE') {
        const aiMessage = { id: (Date.now() + 2).toString(), role: 'ai', text: '', parsedResult: finalResult };
        setChatHistory([...currentHistory, aiMessage]);
      } else {
        throw new Error("Respuesta de IA no reconocida.");
      }
      
    } catch (error) {
      console.error("Agent Error:", error);
      toast.error(error.message || "Ocurrió un error al conectar con la IA");
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
    });
  };

  const handleExecute = (parsedResult, contextText) => {
    if (parsedResult?.type === 'ROUTE' && parsedResult.targetComponent) {
      // Navegar a la herramienta con los datos prellenados
      setAiPrefilledData({
        intent: parsedResult.intent,
        ids: parsedResult.ids || [],
        suggestedState: parsedResult.suggestedState || null,
        rawText: contextText || ''
      });
      setActiveComponent(parsedResult.targetComponent);
      setExpandedMenu(null);
      setIsCommandPaletteOpen(false);
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
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              pointerEvents: 'none',
              padding: '24px'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: '100%',
                maxWidth: '760px',
                height: '80vh',
                maxHeight: '800px',
                backgroundColor: 'var(--surface-void)',
                borderRadius: '20px',
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

              {/* Chat Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
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
                  <span style={{ display: 'flex', alignItems: 'center' }}>para enviar</span>
                  <div style={{ width: '1px', height: '14px', background: 'var(--glass-border)', margin: '0 4px' }} />
                  <kbd style={{ padding: '4px 8px', background: 'var(--surface-low)', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>ESC</kbd>
                  <span style={{ display: 'flex', alignItems: 'center' }}>cerrar</span>
                </div>
              </div>

              {/* Chat History Area (Scrollable) */}
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(0,0,0,0.2)' }}>
                {!apiKey ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--on-surface-variant)' }}>
                    Configura tu API Key (⚙️) para activar Kuepa AI.
                  </div>
                ) : chatHistory.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--on-surface-variant)' }}>
                    Empieza a escribir para interactuar con Kuepa AI...
                  </div>
                ) : (
                  (() => {
                    // Pre-calculate which COMMANDS messages need a "NUEVO" divider
                    let commandBatchCount = 0;
                    const commandBatchIndices = {};
                    chatHistory.forEach((msg, idx) => {
                      if (!msg.isHidden && msg.role === 'ai' && msg.parsedResult?.type === 'COMMANDS' && msg.parsedResult.commands?.length > 0) {
                        commandBatchCount++;
                        commandBatchIndices[idx] = commandBatchCount;
                      }
                    });

                    return chatHistory.map((msg, index) => {
                    if (msg.isHidden) return null;
                    if (msg.role === 'user') {
                      return (
                        <div key={msg.id || index} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div style={{ background: 'var(--surface-low)', padding: '12px 16px', borderRadius: '16px 16px 0 16px', maxWidth: '85%', border: '1px solid var(--glass-border)', position: 'relative' }} className="user-message">
                            <div style={{ color: 'var(--on-surface)', fontSize: '15px', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                              {msg.text}
                            </div>
                            <button
                              onClick={() => {
                                setInputValue(msg.text);
                                inputRef.current?.focus();
                              }}
                              style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                background: 'var(--primary)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                              }}
                              className="edit-btn"
                              title="Editar mensaje"
                            >
                              <Edit2 size={14} />
                            </button>
                            <style>{`
                              .user-message:hover .edit-btn { opacity: 1 !important; }
                            `}</style>
                          </div>
                        </div>
                      );
                    } else if (msg.role === 'ai') {
                      const parsedResult = msg.parsedResult;
                      const isCommandBlock = parsedResult?.type === 'COMMANDS' && parsedResult.commands?.length > 0;
                      const batchNumber = commandBatchIndices[index];
                      const showNuevoDivider = isCommandBlock && batchNumber > 1;

                      return (
                        <React.Fragment key={msg.id || index}>
                          {/* ── NUEVO divider between command batches ── */}
                          {showNuevoDivider && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              margin: '8px 0',
                              userSelect: 'none',
                            }}>
                              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)' }} />
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: 'var(--primary)',
                                fontFamily: "'Space Grotesk', sans-serif",
                                padding: '4px 14px',
                                borderRadius: '100px',
                                border: '1px solid rgba(18, 163, 131, 0.3)',
                                background: 'rgba(18, 163, 131, 0.08)',
                                boxShadow: '0 0 12px rgba(18, 163, 131, 0.15)',
                                whiteSpace: 'nowrap',
                              }}>
                                ✦ NUEVO
                              </span>
                              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)' }} />
                            </div>
                          )}
                        <div style={{ display: 'flex', justifyContent: 'flex-start', maxWidth: '90%' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
                            <div style={{ marginTop: '4px', background: 'rgba(18, 163, 131, 0.1)', borderRadius: '50%', padding: '6px' }}>
                              <Bot size={20} color="var(--primary)" />
                            </div>
                            <div style={{ flex: 1 }}>
                              {parsedResult?.type === 'INCOMPLETE' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Necesito más información:</span>
                                  </div>
                                  <div style={{ padding: '14px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                                    <span style={{ color: 'var(--on-surface)', fontSize: '15px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                      {parsedResult.message}
                                    </span>
                                  </div>
                                </div>
                              ) : isCommandBlock ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
                                      {parsedResult.commands.length} Comando(s) Generado(s)
                                    </span>
                                    <button 
                                      onClick={() => handleCopyCommands(parsedResult.commands)}
                                      style={{
                                        background: 'var(--primary)',
                                        color: '#000',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
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
                                      <code style={{ color: 'var(--primary)', fontSize: '14px', fontFamily: "'Space Grotesk', monospace", wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                                        {cmd}
                                      </code>
                                    </div>
                                  ))}
                                </div>
                              ) : parsedResult?.type === 'ROUTE' && parsedResult.targetComponent ? (
                                <div
                                  onClick={() => handleExecute(parsedResult, chatHistory[index-1]?.text)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px',
                                    background: 'var(--surface-low)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    marginTop: '4px'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-low)'}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                              ) : (
                                <div style={{ color: 'var(--on-surface-variant)', fontSize: '15px' }}>
                                  {msg.text || "Procesando..."}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        </React.Fragment>
                      );
                    }
                    return null;
                  });
                  })()
                )}
                
                {/* Loader in chat */}
                {analyzingState && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ marginTop: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', padding: '6px' }}>
                        {analyzingState === 'ai' ? (
                          <Loader2 size={20} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                        ) : analyzingState === 'resolving_students' ? (
                          <Search size={20} color="#60a5fa" style={{ animation: 'pulse 1.5s infinite' }} />
                        ) : (
                          <Zap size={20} color="#eab308" style={{ animation: 'pulse 1.5s infinite' }} />
                        )}
                      </div>
                      <div style={{ 
                        background: 'var(--surface-low)', 
                        padding: '14px 20px', 
                        borderRadius: '0 16px 16px 16px', 
                        border: '1px solid var(--glass-border)',
                        color: analyzingState === 'ai' ? 'var(--primary)' : analyzingState === 'resolving_students' ? '#60a5fa' : '#eab308',
                        fontSize: '14px',
                        fontWeight: 600
                      }}>
                        {analyzingState === 'resolving_students' && "Buscando datos del estudiante en la base de datos..."}
                        {analyzingState === 'ai' && "Generando respuesta con Inteligencia Artificial..."}
                        {analyzingState === 'db_processing' && "Traduciendo y validando información en la base de datos..."}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area (Bottom) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderTop: '1px solid var(--glass-border)' }}>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAnalyze();
                    }
                  }}
                  placeholder={apiKey ? "Habla con Kuepa AI (ej: saca al 1234 del grupo...)\nUsa Shift+Enter para salto de línea" : "Configura tu API Key primero..."}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--on-surface)',
                    fontSize: '15px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    minHeight: '24px',
                    maxHeight: '200px',
                    resize: 'none',
                    lineHeight: '1.5',
                  }}
                  rows={1}
                />
                <button
                  onClick={() => handleAnalyze()}
                  disabled={!inputValue.trim() || analyzingState || !apiKey}
                  style={{
                    background: (!inputValue.trim() || analyzingState || !apiKey) ? 'var(--surface-low)' : 'var(--primary)',
                    color: (!inputValue.trim() || analyzingState || !apiKey) ? 'var(--on-surface-variant)' : '#000',
                    border: 'none',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (!inputValue.trim() || analyzingState || !apiKey) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                  {analyzingState ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={24} />}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
