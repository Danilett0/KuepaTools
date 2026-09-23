import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Bot, Zap, Settings, Loader2, Key, Trash2, Edit2, RefreshCw, Check, X, Copy, Sparkles, Cpu, Ticket } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../services/supabaseClient';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { toast } from 'react-toastify';
import AllianceSwitcher from './AllianceSwitcher';
import { ALLIANCE_IDS } from '../../utils/constants';
import { setGlobalSetting, getGlobalSetting } from '../../services/settingsService';
import { AVAILABLE_AI_MODELS, DEFAULT_AI_MODEL } from '../../services/aiService';
import AiAssistantHero from './AiAssistantHero';
import { matchAcademicTerm } from '../../utils/academicTerms';

const renderCommandSyntax = (cmd, isCopied) => {
  if (isCopied) {
    return <span style={{ color: '#86efac', fontWeight: 500 }}>{cmd}</span>;
  }
  const regex = /^(\S+(?:\s+\S+)?)\s+([^\[\s]+)(\[.*\])?(.*)$/;
  const match = cmd.match(regex);
  if (match) {
    const [, runner, action, args, rest] = match;
    return (
      <span>
        <span style={{ color: '#c084fc', fontWeight: 600 }}>{runner} </span>
        <span style={{ color: '#34d399', fontWeight: 600 }}>{action}</span>
        {args && <span style={{ color: '#38bdf8' }}>{args}</span>}
        {rest && <span style={{ color: '#94a3b8' }}>{rest}</span>}
      </span>
    );
  }
  return <span style={{ color: '#38bdf8' }}>{cmd}</span>;
};

export default function KuepaCommandPalette() {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, setActiveComponent, setAiPrefilledData, setExpandedMenu } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [analyzingState, setAnalyzingState] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useLocalStorage('gemini_api_key', '');
  const [isFetchingKey, setIsFetchingKey] = useState(false);
  const [aiAlliance, setAiAlliance] = useLocalStorage('ai_alliance', 'na');
  const [copiedCommandKeys, setCopiedCommandKeys] = useState({});
  const [aiModel, setAiModel] = useLocalStorage('gemini_model', DEFAULT_AI_MODEL);

  const currentModelObj = AVAILABLE_AI_MODELS.find(m => m.id === aiModel) || AVAILABLE_AI_MODELS[0];

  // Auto-migrate from deprecated/invalid models if present in localStorage
  useEffect(() => {
    if (!AVAILABLE_AI_MODELS.some(m => m.id === aiModel)) {
      setAiModel(DEFAULT_AI_MODEL);
    }
  }, [aiModel, setAiModel]);

  const inputRef = useRef(null);
  const editInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleClearChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAnalyzingState(null);
    setChatHistory([]);
    setEditingIndex(null);
    setEditingText('');
    setInputValue('');
    setCopiedCommandKeys({});
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Focus input when opened, scroll to bottom, and load DB key if missing
  useEffect(() => {
    const loadKeyFromDb = async () => {
      if (!apiKey) {
        setIsFetchingKey(true);
        const dbKey = await getGlobalSetting('gemini_api_key');
        if (dbKey) {
          setApiKey(dbKey.replace(/['"]/g, '').trim());
        }
        setIsFetchingKey(false);
      }
    };

    if (isCommandPaletteOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      handleClearChat();
      loadKeyFromDb();
    } else {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setAnalyzingState(null);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

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

  // Auto-resize and focus edit textarea
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.style.height = 'auto';
      editInputRef.current.style.height = `${editInputRef.current.scrollHeight}px`;
      editInputRef.current.focus();
      const len = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(len, len);
    }
  }, [editingIndex]);

  // Execute Orchestrator Pipeline with given conversation history
  const runAgentPipeline = async (historyToProcess) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const currentAbortController = new AbortController();
    abortControllerRef.current = currentAbortController;

    try {
      const { AgentOrchestrator } = await import('../../services/AgentOrchestrator');
      const cleanApiKey = apiKey.replace(/['"]/g, '').trim();
      const orchestrator = new AgentOrchestrator(cleanApiKey, aiAlliance, { 
        model: aiModel,
        signal: currentAbortController.signal 
      });

      // Loop for QUERY resolutions
      let currentHistory = [...historyToProcess];
      let isFinalResult = false;
      let finalResult = null;

      while (!isFinalResult) {
        if (currentAbortController.signal.aborted) return;

        const lastMsgText = currentHistory[currentHistory.length - 1].text;
        const historyForOrchestrator = currentHistory.slice(0, -1);
        
        const result = await orchestrator.processMessage(lastMsgText, historyForOrchestrator, (state) => {
          if (!currentAbortController.signal.aborted) {
            setAnalyzingState(state);
          }
        });

        if (currentAbortController.signal.aborted) return;

        if (result.type === 'QUERY' && result.query) {
          if (currentAbortController.signal.aborted) return;
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
              const { data } = await supabase.from('estados').select('mongo_id, name').ilike('name', `%${searchTerm || ''}%`).limit(20);
              if (data && data.length) {
                dbResultsStr = data.map(d => `ID: ${d.mongo_id}, Nombre: ${d.name}`).join(' | ');
              }
            } else if (table === 'grupos_estudiante') {
              let studentIds = [];
              if (Array.isArray(result.query.student_ids) && result.query.student_ids.length > 0) {
                studentIds = result.query.student_ids;
              } else if (result.query.student_id) {
                studentIds = String(result.query.student_id).split(/[\s,]+/).filter(Boolean);
              }

              if (studentIds.length > 0) {
                const resultsPerStudent = await Promise.all(studentIds.map(async (rawId) => {
                  if (currentAbortController.signal.aborted) return '';
                  let sId = rawId;
                  let studentName = rawId;
                  if (/^\d+$/.test(sId) && sId.length < 24) {
                    const resolvedUser = await orchestrator.getUser(sId);
                    if (resolvedUser?._id?.$oid) {
                      sId = resolvedUser._id.$oid;
                      studentName = resolvedUser.profile?.full_name || rawId;
                    }
                  } else {
                    const resolvedUser = await orchestrator.getUser(sId);
                    if (resolvedUser?.profile?.full_name) {
                      studentName = resolvedUser.profile.full_name;
                    }
                  }

                  const { data } = await supabase
                    .from('structures')
                    .select('mongo_id, name, parent:parent_id(level:pensum_level_id(name))')
                    .contains('users', [sId]);

                  if (data && data.length) {
                    let mapped = data;
                    if (searchTerm) {
                      mapped = data.filter(g => 
                        matchAcademicTerm(g.name, g.parent?.level?.name, searchTerm)
                      );
                    }
                    if (mapped.length) {
                      const groupsList = mapped.map(d => `    • GrupoID: ${d.mongo_id} | Nombre: ${d.name} | Nivel: ${d.parent?.level?.name || 'N/A'}`).join('\n');
                      return `- Estudiante "${studentName}" (ID: ${sId}):\n${groupsList}`;
                    } else {
                      return `- Estudiante "${studentName}" (ID: ${sId}): Sin grupos que coincidan con "${searchTerm}".`;
                    }
                  } else {
                    return `- Estudiante "${studentName}" (ID: ${sId}): Sin grupos inscritos actualmente.`;
                  }
                }));

                if (currentAbortController.signal.aborted) return;
                dbResultsStr = resultsPerStudent.filter(Boolean).join('\n\n');
              } else {
                dbResultsStr = "Falta especificar el student_id para consultar los grupos.";
              }
            }
          } catch (e) {
            if (currentAbortController.signal.aborted) return;
            console.error("Error consultando BD para IA:", e);
            dbResultsStr = "Error técnico al consultar la base de datos.";
          }

          if (currentAbortController.signal.aborted) return;

          const searchLabel = searchTerm ? `'${searchTerm}'` : 'todos los grupos';
          const systemMsgText = `[RESULTADOS DE BD PARA ${searchLabel}]:
${dbResultsStr}

INSTRUCCIONES DE ACCIÓN:
- Utiliza estos grupos reales de la BD para resolver los IDs de los grupos actuales de CADA estudiante.
- Evalúa a cada estudiante por separado. Si un estudiante no tiene grupos, ignóralo, pero procesa y genera las acciones para todos los estudiantes que sí tengan grupos inscritos. NUNCA canceles la operación completa si uno no tiene grupos.
- Si el usuario solicitó retirar de todos los grupos o desinscribir, emite la acción remove_user para cada uno de los grupos listados arriba.
- Si el usuario solicitó trasladar materias, retira (remove_user) al estudiante de los grupos antiguos listados arriba que coincidan con las materias solicitadas, e inscríbelo (enroll_user) en los nuevos grupos indicados en el mensaje original.
- Si el usuario solicitó eliminar un cuatrimestre o nivel (ej: C3), retira (remove_user) al estudiante de todos los grupos listados arriba pertenecientes a ese nivel.
- Conserva e incluye cualquier otra acción solicitada en el mensaje original (como cambios de estado).
- Genera el conjunto COMPLETO de acciones en el arreglo "actions".`;

          currentHistory = [
            ...currentHistory, 
            { id: Date.now().toString(), role: 'ai', text: `*(Consulté la base de datos buscando ${searchTerm || 'grupos actuales'}...)*`, isHidden: true }, 
            { id: (Date.now()+1).toString(), role: 'user', text: systemMsgText, isHidden: true }
          ];
        } else {
          isFinalResult = true;
          finalResult = result;
        }
      }

      if (currentAbortController.signal.aborted) return;

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
      if (error.name === 'AbortError' || currentAbortController.signal.aborted) {
        return;
      }
      console.error("Agent Error:", error);
      toast.error(error.message || "Ocurrió un error al conectar con la IA");
    } finally {
      if (abortControllerRef.current === currentAbortController) {
        setAnalyzingState(null);
        abortControllerRef.current = null;
      }
    }
  };

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
    
    await runAgentPipeline(updatedHistory);
  };

  // Handlers for editing past messages
  const handleStartEdit = (index, text) => {
    setEditingIndex(index);
    setEditingText(text);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const handleSaveEdit = async (targetIndex, newText) => {
    const trimmed = newText.trim();
    const minLength = targetIndex > 0 ? 1 : 3;
    if (trimmed.length < minLength || !apiKey || analyzingState) return;

    // Truncar historial descartando cualquier respuesta previa posterior a este mensaje
    const baseHistory = chatHistory.slice(0, targetIndex);
    const updatedUserMessage = {
      id: chatHistory[targetIndex]?.id || Date.now().toString(),
      role: 'user',
      text: trimmed
    };
    const updatedHistory = [...baseHistory, updatedUserMessage];

    setEditingIndex(null);
    setEditingText('');
    setChatHistory(updatedHistory);

    await runAgentPipeline(updatedHistory);
  };

  // Close on Escape (or cancel edit if editing)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        if (editingIndex !== null) {
          setEditingIndex(null);
          setEditingText('');
          return;
        }
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen, editingIndex]);

  const handleCopyCommands = (commands, batchIndex) => {
    const textToCopy = commands.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (batchIndex !== undefined) {
        setCopiedCommandKeys(prev => {
          const next = { ...prev };
          commands.forEach((_, i) => {
            next[`${batchIndex}-${i}`] = true;
          });
          return next;
        });
      }
      toast.success(commands.length > 1 ? "Comandos copiados al portapapeles ✨" : "Comando copiado al portapapeles ✨");
    });
  };

  const handleCopySingleCommand = (cmd, key) => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedCommandKeys(prev => ({ ...prev, [key]: true }));
      toast.success("Comando copiado al portapapeles ✨");
    });
  };

  const handleApiKeyBlur = async () => {
    // Solo guardamos en DB si la key no está vacía.
    // Esto evita que limpiar el input (o un render inicial) sobreescriba la BD a vacío.
    if (apiKey && apiKey.trim() !== '') {
      const cleanKey = apiKey.replace(/['"]/g, '').trim();
      if (cleanKey !== apiKey) {
        setApiKey(cleanKey);
      }
      const success = await setGlobalSetting('gemini_api_key', cleanKey);
      if (success) {
        toast.success("API Key sincronizada globalmente ✨");
      } else {
        toast.error("Error guardando la API Key en la nube");
      }
    }
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
              layout
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: '100%',
                maxWidth: '940px',
                height: (chatHistory.length > 0 || analyzingState) ? '85vh' : 'auto',
                maxHeight: '880px',
                background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(18, 163, 131, 0.15), transparent 70%), var(--surface-void)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 1px rgba(255,255,255,0.15)',
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
                    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Gemini API Key (Google AI Studio)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-void)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0 12px', flex: 1 }}>
                            <Key size={14} color="var(--on-surface-variant)" />
                            <input
                              type="password"
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              onBlur={handleApiKeyBlur}
                              disabled={isFetchingKey}
                              placeholder={isFetchingKey ? "Cargando desde DB..." : "AIzaSy..."}
                              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', padding: '10px', fontSize: '13px', fontFamily: "'Space Grotesk', monospace", opacity: isFetchingKey ? 0.5 : 1 }}
                            />
                          </div>
                          {apiKey && <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>Integrado ✨</span>}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Al ingresar tu clave, la paleta usará IA real para comprender lenguaje natural avanzado.</span>
                      </div>

                      {/* Model Selector */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px', borderTop: '1px solid var(--glass-border)' }}>
                        <label style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Cpu size={14} /> Modelo de Inteligencia Artificial
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                          {AVAILABLE_AI_MODELS.map((m) => {
                            const isSelected = aiModel === m.id;
                            return (
                              <div
                                key={m.id}
                                onClick={() => {
                                  setAiModel(m.id);
                                  toast.info(`Modelo activo: ${m.label}`);
                                }}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '10px',
                                  background: isSelected ? 'rgba(18, 163, 131, 0.15)' : 'var(--surface-void)',
                                  border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--on-surface)' }}>
                                    {m.label}
                                  </span>
                                  {isSelected && <Check size={14} color="var(--primary)" strokeWidth={2.5} />}
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                                  {m.tag}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AllianceSwitcher value={aiAlliance} onChange={setAiAlliance} size="sm" />
                  
                  {/* Active Model Badge */}
                  <div
                    onClick={() => setShowSettings(!showSettings)}
                    title={`Modelo activo: ${currentModelObj.label} (${currentModelObj.tag}). Clic para configurar.`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(18, 163, 131, 0.12)',
                      border: '1px solid rgba(18, 163, 131, 0.3)',
                      color: 'var(--primary)',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(18, 163, 131, 0.22)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(18, 163, 131, 0.12)'}
                  >
                    <Zap size={11} fill="var(--primary)" />
                    <span>{currentModelObj.shortName}</span>
                  </div>

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showSettings ? 'var(--primary)' : 'var(--on-surface-variant)', transition: 'color 0.2s' }}
                    title="Configuración de IA"
                  >
                    <Settings size={18} />
                  </button>

                  <button
                    onClick={() => {
                      setIsCommandPaletteOpen(false);
                      setActiveComponent('escalamiento-jira');
                      setExpandedMenu(null);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: 'var(--on-surface-variant)',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      marginLeft: '4px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'rgba(18,163,131,0.4)'; e.currentTarget.style.background = 'rgba(18,163,131,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--on-surface-variant)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
                    title="Abrir Asistente de Escalamiento Jira (Nivel 2)"
                  >
                    <Ticket size={13} />
                    <span>Escalar Jira</span>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', color: 'var(--on-surface-variant)', fontSize: '11px', fontWeight: 600, alignItems: 'center' }}>
                  {(chatHistory.length > 0 || analyzingState) && (
                    <>
                      <button
                        onClick={handleClearChat}
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
                        title={analyzingState ? "Cancelar petición en curso y limpiar memoria" : "Limpiar historial"}
                      >
                        <Trash2 size={12} /> {analyzingState ? 'Cancelar y Limpiar' : 'Limpiar Memoria'}
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

              {/* Futuristic AI Assistant Animated Hero */}
              {chatHistory.length === 0 && !analyzingState && (
                <AiAssistantHero />
              )}

              {/* Chat History Area (Scrollable) */}
              {(chatHistory.length > 0 || analyzingState) && (
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(0,0,0,0.2)' }}>
                {chatHistory.length > 0 && (
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
                      const isBeingEdited = editingIndex === index;

                      return (
                        <div key={msg.id || index} style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                          {isBeingEdited ? (
                            <div
                              style={{
                                background: 'var(--surface-low)',
                                padding: '16px',
                                borderRadius: '16px 16px 4px 16px',
                                width: '100%',
                                maxWidth: '85%',
                                border: '1.5px solid var(--primary)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(18, 163, 131, 0.2)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                position: 'relative'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
                                  Editando Mensaje
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', opacity: 0.8 }}>
                                  Enter para enviar · Shift+Enter nueva línea
                                </span>
                              </div>
                              <textarea
                                ref={editInputRef}
                                value={editingText}
                                onChange={(e) => {
                                  setEditingText(e.target.value);
                                  e.target.style.height = 'auto';
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveEdit(index, editingText);
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handleCancelEdit();
                                  }
                                }}
                                rows={Math.min(16, Math.max(2, editingText.split('\n').length))}
                                style={{
                                  width: '100%',
                                  background: 'rgba(0, 0, 0, 0.35)',
                                  border: '1px solid var(--glass-border)',
                                  borderRadius: '10px',
                                  padding: '12px 14px',
                                  color: 'var(--on-surface)',
                                  fontSize: '15px',
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  lineHeight: '1.5',
                                  maxHeight: '340px',
                                  resize: 'none',
                                  outline: 'none',
                                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
                                  scrollbarWidth: 'none'
                                }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  style={{
                                    padding: '7px 14px',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--on-surface-variant)',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--on-surface)'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--on-surface-variant)'}
                                >
                                  <X size={14} /> Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(index, editingText)}
                                  disabled={!editingText.trim() || analyzingState}
                                  style={{
                                    padding: '7px 16px',
                                    borderRadius: '8px',
                                    background: (!editingText.trim() || analyzingState) ? 'var(--surface-low)' : 'var(--primary)',
                                    color: (!editingText.trim() || analyzingState) ? 'var(--on-surface-variant)' : '#000',
                                    border: 'none',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: (!editingText.trim() || analyzingState) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <Check size={14} strokeWidth={2.5} /> Guardar y reenviar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="user-message-card"
                              style={{ 
                                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.65) 0%, rgba(15, 23, 42, 0.8) 100%)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                padding: '14px 18px', 
                                borderRadius: '18px 18px 4px 18px', 
                                maxWidth: '85%', 
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 8px 28px -6px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                                position: 'relative',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {/* Header micro-bar */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.45)' }} />
                                  <span style={{ 
                                    fontSize: '11px', 
                                    fontWeight: 700, 
                                    letterSpacing: '0.08em', 
                                    textTransform: 'uppercase', 
                                    color: 'rgba(255, 255, 255, 0.5)', 
                                    fontFamily: "'Space Grotesk', sans-serif" 
                                  }}>
                                    Tú
                                  </span>
                                </div>
                                
                                {/* Micro action toolbar */}
                                <div className="user-msg-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0, transition: 'opacity 0.2s ease' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(msg.text);
                                      toast.success('Mensaje copiado al portapapeles');
                                    }}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.08)',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                      color: 'rgba(255, 255, 255, 0.7)',
                                      borderRadius: '6px',
                                      width: '24px',
                                      height: '24px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s'
                                    }}
                                    title="Copiar texto"
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                                      e.currentTarget.style.color = '#fff';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                                    }}
                                  >
                                    <Copy size={12} />
                                  </button>
                                  {!analyzingState && editingIndex === null && (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(index, msg.text)}
                                      style={{
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '6px',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                      }}
                                      title="Editar y reenviar"
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(18, 163, 131, 0.25)';
                                        e.currentTarget.style.color = 'var(--primary)';
                                        e.currentTarget.style.borderColor = 'rgba(18, 163, 131, 0.4)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                      }}
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div style={{ color: '#f8fafc', fontSize: '14.5px', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'pre-wrap', lineHeight: '1.6', letterSpacing: '0.01em' }}>
                                {msg.text}
                              </div>
                              <style>{`
                                .user-message-card:hover .user-msg-actions { opacity: 1 !important; }
                                .user-message-card:hover { border-color: rgba(255, 255, 255, 0.18) !important; }
                              `}</style>
                            </div>
                          )}
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
                        <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', maxWidth: '95%' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', width: '100%' }}>
                            {/* Quantum AI Badge */}
                            <div style={{
                              marginTop: '2px',
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 78, 59, 0.5) 100%)',
                              border: '1px solid rgba(52, 211, 153, 0.4)',
                              boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Sparkles size={16} color="#34d399" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                          {parsedResult.commands.length} Comando{parsedResult.commands.length > 1 ? 's' : ''} Generado{parsedResult.commands.length > 1 ? 's' : ''}
                                        </span>
                                      </div>
                                      <span style={{ 
                                        fontSize: '11px', 
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.6)', 
                                        background: 'rgba(255, 255, 255, 0.05)', 
                                        padding: '3px 9px', 
                                        borderRadius: '8px', 
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        fontFamily: "'Space Grotesk', sans-serif"
                                      }}>
                                        CLI Kuepa
                                      </span>
                                    </div>
                                    <button 
                                      type="button"
                                      onClick={() => handleCopyCommands(parsedResult.commands, index)}
                                      style={{
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: '#022c22',
                                        border: 'none',
                                        padding: '7px 16px',
                                        borderRadius: '9px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)';
                                      }}
                                    >
                                      <Copy size={13} strokeWidth={2.5} />
                                      Copiar {parsedResult.commands.length > 1 ? `Todos (${parsedResult.commands.length})` : ''}
                                    </button>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {parsedResult.commands.map((cmd, i) => {
                                      const itemKey = `${index}-${i}`;
                                      const isCopied = Boolean(copiedCommandKeys[itemKey]);
                                      return (
                                        <div 
                                          key={i} 
                                          style={{ 
                                            display: 'flex',
                                            alignItems: 'stretch',
                                            background: isCopied 
                                              ? 'linear-gradient(180deg, rgba(34, 197, 94, 0.15) 0%, rgba(20, 83, 45, 0.22) 100%)' 
                                              : 'linear-gradient(180deg, rgba(14, 20, 32, 0.85) 0%, rgba(8, 12, 20, 0.95) 100%)', 
                                            borderRadius: '10px', 
                                            border: isCopied ? '1.5px solid rgba(34, 197, 94, 0.55)' : '1px solid rgba(255, 255, 255, 0.08)',
                                            boxShadow: isCopied ? '0 0 16px rgba(34, 197, 94, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.25)',
                                            overflow: 'hidden',
                                            transition: 'all 0.25s ease',
                                            position: 'relative'
                                          }}
                                        >
                                          {/* Number badge */}
                                          <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0 12px',
                                            background: isCopied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                            borderRight: isCopied ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: isCopied ? '#86efac' : 'rgba(255, 255, 255, 0.4)',
                                            fontFamily: "'Fira Code', 'Consolas', monospace",
                                            userSelect: 'none',
                                            transition: 'all 0.25s ease'
                                          }}>
                                            #{i + 1}
                                          </div>

                                          {/* Command Text (Full Width with Syntax Highlighting) */}
                                          <div style={{ 
                                            flex: 1,
                                            padding: '11px 44px 11px 16px',
                                            color: isCopied ? '#86efac' : '#38bdf8', 
                                            fontSize: '13px', 
                                            wordBreak: 'break-all', 
                                            whiteSpace: 'pre-wrap', 
                                            fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
                                            lineHeight: '1.55',
                                            transition: 'color 0.25s ease'
                                          }}>
                                            {renderCommandSyntax(cmd, isCopied)}
                                          </div>

                                          {/* Individual copy button (Fixed Top-Right, Icon Only) */}
                                          <button
                                            type="button"
                                            onClick={() => handleCopySingleCommand(cmd, itemKey)}
                                            style={{
                                              position: 'absolute',
                                              top: '8px',
                                              right: '8px',
                                              background: isCopied ? 'rgba(34, 197, 94, 0.28)' : 'rgba(255, 255, 255, 0.06)',
                                              border: isCopied ? '1px solid rgba(34, 197, 94, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                                              color: isCopied ? '#86efac' : 'rgba(255, 255, 255, 0.6)',
                                              borderRadius: '6px',
                                              width: '28px',
                                              height: '28px',
                                              padding: 0,
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              transition: 'all 0.15s ease',
                                              zIndex: 2
                                            }}
                                            onMouseEnter={(e) => {
                                              if (!isCopied) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                                                e.currentTarget.style.color = '#fff';
                                              }
                                            }}
                                            onMouseLeave={(e) => {
                                              if (!isCopied) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                                              }
                                            }}
                                            title={isCopied ? "Comando ya copiado (clic para volver a copiar)" : "Copiar comando"}
                                          >
                                            {isCopied ? (
                                              <Check size={14} strokeWidth={2.5} />
                                            ) : (
                                              <Copy size={13} />
                                            )}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
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
                                <div style={{ color: 'var(--on-surface-variant)', fontSize: '15px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
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
                
                {/* Premium Animated Loader in chat */}
                <AnimatePresence>
                  {analyzingState && (() => {
                    const isRetryState = typeof analyzingState === 'string' && analyzingState.startsWith('ai_retry');
                    const retryMatch = isRetryState ? analyzingState.match(/ai_retry_(\d+)_(\d+)/) : null;
                    const retryAttempt = retryMatch ? retryMatch[1] : 1;
                    const retryMax = retryMatch ? retryMatch[2] : 3;

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        style={{ display: 'flex', justifyContent: 'flex-start', margin: '8px 0' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {/* Glowing Orb Icon */}
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <motion.div
                               animate={{ rotate: 360 }}
                               transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                               style={{
                                 position: 'absolute',
                                 inset: '-6px',
                                 borderRadius: '50%',
                                 background: analyzingState === 'ai' 
                                   ? 'conic-gradient(from 0deg, transparent, transparent, var(--primary))' 
                                   : analyzingState === 'resolving_students' 
                                   ? 'conic-gradient(from 0deg, transparent, transparent, #60a5fa)'
                                   : isRetryState
                                   ? 'conic-gradient(from 0deg, transparent, transparent, #f59e0b)'
                                   : 'conic-gradient(from 0deg, transparent, transparent, #eab308)',
                                 opacity: 0.8,
                                 filter: 'blur(2px)'
                               }}
                             />
                             <div style={{ position: 'relative', background: 'var(--surface-void)', borderRadius: '50%', padding: '10px', zIndex: 2, display: 'flex', border: '1px solid var(--glass-border)' }}>
                               {analyzingState === 'ai' ? <Bot size={20} color="var(--primary)" /> : 
                                analyzingState === 'resolving_students' ? <Search size={20} color="#60a5fa" /> : 
                                isRetryState ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <RefreshCw size={20} color="#f59e0b" />
                                  </motion.div>
                                ) :
                                <Zap size={20} color="#eab308" />}
                             </div>
                          </div>
                          
                          {/* Magic Waveform Bubble */}
                          <div style={{ 
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)', 
                            backdropFilter: 'blur(12px)',
                            padding: '12px 24px', 
                            borderRadius: '100px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 0 20px rgba(18,163,131,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                          }}>
                            {/* AI Magic Waveform */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '24px' }}>
                              {[0, 1, 2, 3, 4, 5, 6].map(i => {
                                const delay = i * 0.15;
                                const colors = analyzingState === 'ai'
                                  ? ['var(--primary)', '#34d399', 'var(--primary)']
                                  : analyzingState === 'resolving_students'
                                  ? ['#3b82f6', '#93c5fd', '#3b82f6']
                                  : isRetryState
                                  ? ['#f59e0b', '#fde68a', '#f59e0b']
                                  : ['#eab308', '#fde047', '#eab308'];

                                return (
                                  <motion.div
                                    key={i}
                                    animate={{ 
                                      height: ['8px', '24px', '8px'],
                                      backgroundColor: colors
                                    }}
                                    transition={{ 
                                      repeat: Infinity, 
                                      duration: 1.2, 
                                      delay: delay, 
                                      ease: "easeInOut" 
                                    }}
                                    style={{
                                      width: '4px',
                                      borderRadius: '4px',
                                      backgroundColor: colors[0],
                                      boxShadow: `0 0 10px ${colors[0]}80`
                                    }}
                                  />
                                );
                              })}
                            </div>
                            
                            {/* Texto limpio y moderno */}
                            <span style={{
                              color: 'var(--on-surface)',
                              fontSize: '14px',
                              fontWeight: 600,
                              letterSpacing: '0.5px',
                              fontFamily: "'Space Grotesk', sans-serif",
                              opacity: 0.9
                            }}>
                              {analyzingState === 'resolving_students' && "Buscando al estudiante..."}
                              {analyzingState === 'ai' && "Generando magia..."}
                              {isRetryState && `Modelo saturado, reintentando (${retryAttempt}/${retryMax})...`}
                              {analyzingState === 'db_processing' && "Cruzando información..."}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
              )}

              {/* Input Area (Bottom - Unified Capsule) */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.07)', background: 'rgba(5, 8, 15, 0.4)' }}>
                <div
                  className="input-capsule"
                  style={{
                    background: 'linear-gradient(180deg, rgba(16, 24, 39, 0.75) 0%, rgba(9, 14, 24, 0.9) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '14px 16px 12px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    transition: 'border-color 0.25s ease, box-shadow 0.25s ease'
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={editingIndex !== null}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAnalyze();
                      }
                    }}
                    placeholder={
                      editingIndex !== null
                        ? "Editando mensaje arriba... Presiona Guardar o Cancelar"
                        : apiKey
                        ? "Habla con Kuepa AI (ej: saca al 1234 del grupo...)"
                        : "Configura tu API Key primero..."
                    }
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--on-surface)',
                      fontSize: '15px',
                      fontFamily: "'Space Grotesk', sans-serif",
                      minHeight: '26px',
                      maxHeight: '340px',
                      resize: 'none',
                      lineHeight: '1.5',
                      padding: 0,
                      opacity: editingIndex !== null ? 0.4 : 1,
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                    rows={1}
                  />

                  {/* Capsule Footer Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.01em' }}>
                      Shift + Enter para salto de línea
                    </span>
                    <button
                      onClick={() => handleAnalyze()}
                      disabled={!inputValue.trim() || analyzingState || !apiKey || editingIndex !== null}
                      style={{
                        background: (!inputValue.trim() || analyzingState || !apiKey || editingIndex !== null) 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: (!inputValue.trim() || analyzingState || !apiKey || editingIndex !== null) 
                          ? 'rgba(255, 255, 255, 0.25)' 
                          : '#022c22',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: (!inputValue.trim() || analyzingState || !apiKey || editingIndex !== null) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: (!inputValue.trim() || analyzingState || !apiKey || editingIndex !== null) 
                          ? 'none' 
                          : '0 4px 14px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        if (inputValue.trim() && !analyzingState && apiKey && editingIndex === null) {
                          e.currentTarget.style.transform = 'scale(1.06)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (inputValue.trim() && !analyzingState && apiKey && editingIndex === null) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                        }
                      }}
                      title="Enviar mensaje"
                    >
                      {analyzingState ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={17} strokeWidth={2.5} />}
                    </button>
                  </div>
                </div>
                <style>{`
                  .input-capsule:focus-within {
                    border-color: rgba(52, 211, 153, 0.45) !important;
                    box-shadow: 0 0 24px rgba(16, 185, 129, 0.2), 0 8px 30px rgba(0, 0, 0, 0.35) !important;
                  }
                  .input-capsule textarea::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
