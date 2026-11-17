import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Zap, Settings, Loader2, Key, Trash2, Edit2, RefreshCw, Check, X, Copy, Sparkles, Cpu, MessageSquare, Camera, Square } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../services/supabaseClient';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { toast } from 'react-toastify';
import AllianceSwitcher from './AllianceSwitcher';
import { ALLIANCE_IDS } from '../../utils/constants';
import { setGlobalSetting, getGlobalSetting } from '../../services/settingsService';
import { AVAILABLE_AI_MODELS, DEFAULT_AI_MODEL, prepareRetryHistory } from '../../services/aiService';
import AiAssistantHero from './AiAssistantHero';
import KuepaAiIcon from './KuepaAiIcon';
import AiMessageRenderer from './AiMessageRenderer';
import AiTableBlock from './AiTableBlock';
import { extractTableFromText } from '../../utils/tableParser';
import { cleanMarkdownForClipboard } from '../../utils/textFormatters';
import { matchAcademicTerm } from '../../utils/academicTerms';
import { copyElementAsImage } from '../../services/ticketExportService';

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
  const [pastedTable, setPastedTable] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [analyzingState, setAnalyzingState] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useLocalStorage('gemini_api_key', '');
  const [isFetchingKey, setIsFetchingKey] = useState(false);
  const [aiAlliance, setAiAlliance] = useLocalStorage('ai_alliance', 'na');
  const [copiedCommandKeys, setCopiedCommandKeys] = useState({});
  const [copiedTicketKeys, setCopiedTicketKeys] = useState({});
  const [copiedTicketImageKeys, setCopiedTicketImageKeys] = useState({});
  const [copiedResponseKeys, setCopiedResponseKeys] = useState({});
  const [copyingImageIndex, setCopyingImageIndex] = useState(null);
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
    setPastedTable(null);
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
              let query = supabase.from('alianzas').select('mongo_id, name').order('name');
              const cleanTerm = (searchTerm || '').trim();
              const isGeneric = !cleanTerm || /^(?:todas?|todos?|alianzas?|lista(?:do)?|catalogo|catálogo)$/i.test(cleanTerm);
              if (!isGeneric) {
                const words = cleanTerm.split(/\s+(?:y|o|en|de)\s+|\s+/).filter(w => w.length > 2);
                if (words.length > 1) {
                  query = query.or(words.map(w => `name.ilike.%${w}%`).join(','));
                } else {
                  query = query.ilike('name', `%${cleanTerm}%`);
                }
              }
              const { data } = await query.limit(100);
              if (data && data.length) {
                dbResultsStr = data.map(d => `ID: ${d.mongo_id}, Nombre: ${d.name}`).join(' | ');
              } else {
                dbResultsStr = `No se encontraron alianzas registradas con el término "${cleanTerm}". (Sedes maestras: Kuepa: ${ALLIANCE_IDS.kuepa} | Nueva América: ${ALLIANCE_IDS.na})`;
              }
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
            } else if (table === 'programas_estudiante') {
              const studentId = result.query.student_id || result.query.student_ids?.[0];
              if (studentId) {
                const resolvedUser = await orchestrator.getUser(studentId);
                if (resolvedUser && resolvedUser.programs && resolvedUser.programs.length > 0) {
                  const programIds = resolvedUser.programs.map(p => p.structure?.$oid || p.structure).filter(Boolean);
                  const { resolveProgramNames } = await import('../../services/studentHydrator.js');
                  const nameMap = await resolveProgramNames(programIds, ALLIANCE_IDS[aiAlliance]);
                  const progs = resolvedUser.programs.map((p, i) => {
                    const id = p.structure?.$oid || p.structure;
                    const name = p.name || nameMap[id] || id;
                    return `    • ${i + 1}. ${name} (ID: ${id})`;
                  });
                  dbResultsStr = `- Estudiante "${resolvedUser.profile?.full_name || studentId}":\n${progs.join('\n')}`;
                } else {
                  dbResultsStr = `- Estudiante "${studentId}": Sin programas registrados.`;
                }
              } else {
                dbResultsStr = "Falta especificar el student_id para consultar los programas.";
              }
            } else if (table === 'estudiante_info') {
              const studentId = result.query.student_id || result.query.student_ids?.[0];
              if (studentId) {
                const resolvedUser = await orchestrator.getUser(studentId);
                if (resolvedUser) {
                  const inc = resolvedUser.incremental_user_code || 'N/A';
                  const name = resolvedUser.profile?.full_name || 'Sin nombre';
                  const email = resolvedUser.profile?.email || 'N/A';
                  const oId = resolvedUser._id?.$oid || resolvedUser._id;
                  dbResultsStr = `- Ficha de Estudiante:\n  • Nombre: ${name}\n  • INC: ${inc}\n  • ObjectID: ${oId}\n  • Email: ${email}`;
                } else {
                  dbResultsStr = `Estudiante "${studentId}" no encontrado en la base de datos.`;
                }
              }
            }
          } catch (e) {
            if (currentAbortController.signal.aborted) return;
            console.error("Error consultando BD para IA:", e);
            dbResultsStr = "Error técnico al consultar la base de datos.";
          }

          if (currentAbortController.signal.aborted) return;

          const searchLabel = searchTerm ? `'${searchTerm}'` : (table || 'todos los grupos');
          const isInformationalQuery = table === 'programas_estudiante' || table === 'estudiante_info' || /^(?:¿?\s*(?:qu[eé]|cu[aá]l|dime|c[oó]mo|qui[eé]n|listar|mostrar))\b/i.test(lastMsgText.trim());

          let systemMsgText = `[RESULTADOS DE BD PARA ${searchLabel}]:\n${dbResultsStr}\n\n`;

          if (isInformationalQuery) {
            systemMsgText += `INSTRUCCIONES DE RESPUESTA:
- Responde a la consulta del usuario de forma clara, amable y estructurada usando type: "INFO".
- Presenta los datos obtenidos usando viñetas y formato legible con nombres y sus IDs.
- Si había una acción pendiente previa, indícale amablemente cómo puede proceder indicando la opción deseada.`;
          } else {
            systemMsgText += `INSTRUCCIONES DE ACCIÓN:
- Utiliza estos grupos reales de la BD para resolver los IDs de los grupos actuales de CADA estudiante.
- Evalúa a cada estudiante por separado. Si un estudiante no tiene grupos, ignóralo, pero procesa y genera las acciones para todos los estudiantes que sí tengan grupos inscritos. NUNCA canceles la operación completa si uno no tiene grupos.
- Si el usuario solicitó retirar de todos los grupos o desinscribir, emite la acción remove_user para cada uno de los grupos listados arriba.
- Si el usuario solicitó trasladar materias, retira (remove_user) al estudiante de los grupos antiguos listados arriba que coincidan con las materias solicitadas, e inscríbelo (enroll_user) en los nuevos grupos indicados en el mensaje original.
- Si el usuario solicitó eliminar un cuatrimestre o nivel (ej: C3), retira (remove_user) al estudiante de todos los grupos listados arriba pertenecientes a ese nivel.
- Conserva e incluye cualquier otra acción solicitada en el mensaje original (como cambios de estado).
- Genera el conjunto COMPLETO de acciones en el arreglo "actions".`;
          }

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
        const aiMessage = { id: (Date.now() + 2).toString(), role: 'ai', text: finalResult.message || '', parsedResult: finalResult };
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
    let textToAnalyze = overrideText !== null ? overrideText : inputValue;
    if (pastedTable && overrideText === null) {
      textToAnalyze = [textToAnalyze.trim(), pastedTable.rawText].filter(Boolean).join('\n\n');
      setPastedTable(null);
    }
    const minLength = chatHistory.length > 0 ? 1 : (pastedTable ? 1 : 3);
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

  const handleRetry = async (targetIndex) => {
    if (!apiKey || analyzingState) return;
    const updatedHistory = prepareRetryHistory(chatHistory, targetIndex);
    if (!updatedHistory.length) return;

    if (editingIndex !== null) {
      setEditingIndex(null);
      setEditingText('');
    }

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

  // Auto-detect tabular paste (from Excel, Sheets, etc.) in the command palette
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (!isCommandPaletteOpen || editingIndex !== null) return;
      const target = e.target;
      if (target && target.tagName === 'INPUT' && target !== inputRef.current) return;
      const clipboardText = e.clipboardData?.getData('text');
      if (!clipboardText) return;
      const extracted = extractTableFromText(clipboardText);
      if (extracted && extracted.table) {
        e.preventDefault();
        setPastedTable({
          table: extracted.table,
          rawText: extracted.rawTableText || clipboardText.trim()
        });
        const extraText = [extracted.prefixText, extracted.suffixText].filter(Boolean).join('\n');
        if (extraText) {
          setInputValue(prev => prev ? `${prev}\n${extraText}` : extraText);
        }
        toast.success(`Tabla pegada y formateada (${extracted.table.rows.length} filas) ✨`, { autoClose: 2000 });
        inputRef.current?.focus();
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isCommandPaletteOpen, editingIndex]);

  // Fallback: detect if raw table was inserted into inputValue (e.g. context menu paste)
  useEffect(() => {
    if (!inputValue || pastedTable || editingIndex !== null) return;
    const extracted = extractTableFromText(inputValue);
    if (extracted && extracted.table) {
      setPastedTable({
        table: extracted.table,
        rawText: extracted.rawTableText || inputValue.trim()
      });
      const extraText = [extracted.prefixText, extracted.suffixText].filter(Boolean).join('\n');
      setInputValue(extraText);
      toast.success(`Tabla pegada y formateada (${extracted.table.rows.length} filas) ✨`, { autoClose: 2000 });
    }
  }, [inputValue, pastedTable, editingIndex]);

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

  const handleCopyTicketResponse = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTicketKeys(prev => ({ ...prev, [key]: true }));
      toast.success("Respuesta para el ticket copiada al portapapeles ✨");
    });
  };

  const handleCopyTicketImage = async (cardElement, index) => {
    if (!cardElement) return;
    try {
      setCopyingImageIndex(index);
      await copyElementAsImage(cardElement, {
        backgroundColor: '#090d16',
        pixelRatio: 2
      });
      setCopiedTicketImageKeys(prev => ({ ...prev, [index]: true }));
      toast.success("¡Imagen copiada al portapapeles! Lista para pegar en Slack o Jira ✨");
      setTimeout(() => {
        setCopiedTicketImageKeys(prev => ({ ...prev, [index]: false }));
      }, 2500);
    } catch (err) {
      console.error("Error al copiar imagen del ticket:", err);
      toast.error("No se pudo copiar la imagen al portapapeles");
    } finally {
      setCopyingImageIndex(null);
    }
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
              backgroundColor: 'rgba(0, 0, 0, 0.72)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
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
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              style={{
                width: '100%',
                maxWidth: '1160px',
                height: (chatHistory.length > 0 || analyzingState) ? '80vh' : 'auto',
                maxHeight: '860px',
                background: 'radial-gradient(ellipse 90% 45% at 50% -12%, rgba(16, 185, 129, 0.16) 0%, transparent 70%), #07090e',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 32px 90px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
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
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'linear-gradient(180deg, rgba(13, 18, 28, 0.85) 0%, rgba(8, 11, 18, 0.95) 100%)' }}
                  >
                    <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                            Gemini API Key (Google AI Studio)
                          </label>
                          {apiKey && (
                            <span style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={12} strokeWidth={2.5} /> Sincronizada con base de datos
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', background: '#05070c', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '0 12px', flex: 1, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
                            <Key size={14} color="#34d399" />
                            <input
                              type="password"
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              onBlur={handleApiKeyBlur}
                              disabled={isFetchingKey}
                              placeholder={isFetchingKey ? "Cargando desde DB..." : "AIzaSy..."}
                              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', padding: '10px 12px', fontSize: '13px', fontFamily: "'Fira Code', monospace", opacity: isFetchingKey ? 0.5 : 1 }}
                            />
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                          Tu clave se almacena de forma segura encriptada en la configuración global de tu equipo.
                        </span>
                      </div>

                      {/* Model Selector */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Space Grotesk', sans-serif" }}>
                          <Cpu size={14} color="#38bdf8" /> Modelo de Inteligencia Artificial
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
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
                                  padding: '10px 14px',
                                  borderRadius: '10px',
                                  background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                  border: isSelected ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.06)',
                                  boxShadow: isSelected ? '0 0 16px rgba(16, 185, 129, 0.15)' : 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '3px',
                                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#34d399' : '#f8fafc', fontFamily: "'Space Grotesk', sans-serif" }}>
                                    {m.label}
                                  </span>
                                  {isSelected && <Check size={14} color="#34d399" strokeWidth={2.5} />}
                                </div>
                                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 22px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                background: 'rgba(255, 255, 255, 0.015)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AllianceSwitcher value={aiAlliance} onChange={setAiAlliance} size="sm" />
                  
                  {/* Active Model Badge */}
                  <div
                    onClick={() => setShowSettings(!showSettings)}
                    title={`Modelo activo: ${currentModelObj.label} (${currentModelObj.tag}). Clic para configurar.`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: showSettings ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.1)',
                      border: showSettings ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(16, 185, 129, 0.25)',
                      color: '#34d399',
                      padding: '5px 12px',
                      borderRadius: '100px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      userSelect: 'none',
                      boxShadow: showSettings ? '0 0 14px rgba(16, 185, 129, 0.25)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      if (!showSettings) {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                      }
                    }}
                  >
                    <Zap size={11} fill="#34d399" color="#34d399" />
                    <span>{currentModelObj.shortName}</span>
                    <Settings size={12} style={{ opacity: 0.7, marginLeft: '2px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {(chatHistory.length > 0 || analyzingState) && (
                    <button
                      onClick={handleClearChat}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        padding: '5px 11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#f87171',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                      }}
                      title={analyzingState ? "Cancelar petición en curso y limpiar memoria" : "Limpiar historial de conversación"}
                    >
                      <Trash2 size={12} />
                      <span>{analyzingState ? 'Cancelar y Limpiar' : 'Limpiar Chat'}</span>
                    </button>
                  )}

                  <div
                    onClick={() => setIsCommandPaletteOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                    title="Cerrar paleta (Escape)"
                  >
                    <kbd style={{ fontFamily: 'inherit', fontWeight: 700 }}>ESC</kbd>
                    <X size={13} />
                  </div>
                </div>
              </div>

              {/* AI Assistant Empty State */}
              {chatHistory.length === 0 && !analyzingState && (
                <AiAssistantHero />
              )}

              {/* Chat History Area (Scrollable) */}
              {(chatHistory.length > 0 || analyzingState) && (
              <div
                className="chat-history-scroll"
                style={{
                  padding: '24px 28px',
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '22px',
                  background: 'radial-gradient(ellipse 100% 40% at 50% 100%, rgba(16, 185, 129, 0.03) 0%, transparent 60%)'
                }}
              >
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
                      const tableData = extractTableFromText(msg.text);
                      const hasTable = Boolean(tableData);

                      return (
                        <div key={msg.id || index} style={{ display: 'flex', justifyContent: hasTable ? 'stretch' : 'flex-end', width: '100%' }}>
                          {isBeingEdited ? (
                            <div
                              style={{
                                background: 'linear-gradient(135deg, rgba(16, 24, 39, 0.95) 0%, rgba(9, 14, 24, 0.98) 100%)',
                                padding: '16px',
                                borderRadius: '18px 18px 4px 18px',
                                width: '100%',
                                maxWidth: hasTable ? '100%' : '85%',
                                border: '1.5px solid #10b981',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(16, 185, 129, 0.2)',
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
                                width: hasTable ? '100%' : 'auto',
                                maxWidth: hasTable ? '100%' : '85%', 
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
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleRetry(index)}
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
                                        title="Reintentar"
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = 'rgba(56, 189, 248, 0.25)';
                                          e.currentTarget.style.color = '#38bdf8';
                                          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        }}
                                      >
                                        <RefreshCw size={12} />
                                      </button>
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
                                    </>
                                  )}
                                </div>
                              </div>

                              {tableData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                  {tableData.prefixText && (
                                    <div style={{ color: '#f8fafc', fontSize: '14.5px', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                      {tableData.prefixText}
                                    </div>
                                  )}
                                  <AiTableBlock table={tableData.table} title="Tabla Pegada de Excel" />
                                  {tableData.suffixText && (
                                    <div style={{ color: '#f8fafc', fontSize: '14.5px', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                      {tableData.suffixText}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{ color: '#f8fafc', fontSize: '14.5px', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'pre-wrap', lineHeight: '1.6', letterSpacing: '0.01em' }}>
                                  {msg.text}
                                </div>
                              )}
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
                              margin: '12px 0 6px',
                              userSelect: 'none',
                            }}>
                              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent)' }} />
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: '#34d399',
                                fontFamily: "'Space Grotesk', sans-serif",
                                padding: '3px 12px',
                                borderRadius: '100px',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                background: 'rgba(16, 185, 129, 0.08)',
                                boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)',
                                whiteSpace: 'nowrap',
                              }}>
                                ✦ NUEVO LOTE
                              </span>
                              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent)' }} />
                            </div>
                          )}
                        <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', width: '100%' }}>
                            {/* Quantum AI Badge */}
                            <div style={{
                              marginTop: '2px',
                              width: '34px',
                              height: '34px',
                              borderRadius: '11px',
                              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 78, 59, 0.45) 100%)',
                              border: '1px solid rgba(52, 211, 153, 0.4)',
                              boxShadow: '0 0 18px rgba(16, 185, 129, 0.22), inset 0 1px 1px rgba(255,255,255,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <KuepaAiIcon size={18} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {parsedResult?.type === 'INCOMPLETE' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24' }}>
                                    <span style={{ fontSize: '13.5px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Necesito más información:</span>
                                  </div>
                                  <div style={{
                                    padding: '16px',
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(180, 83, 9, 0.04) 100%)',
                                    borderRadius: '14px',
                                    border: '1px solid rgba(245, 158, 11, 0.25)',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                                  }}>
                                    <AiMessageRenderer text={parsedResult?.message || msg.text || ''} onOptionSelect={handleAnalyze} />
                                    {parsedResult.options && parsedResult.options.length > 0 && (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                                        {parsedResult.options.map((opt, optIdx) => (
                                          <button
                                            key={opt.value || optIdx}
                                            type="button"
                                            onClick={() => handleAnalyze(opt.value)}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              background: 'rgba(245, 158, 11, 0.14)',
                                              border: '1px solid rgba(245, 158, 11, 0.35)',
                                              color: '#fde047',
                                              padding: '7px 14px',
                                              borderRadius: '9px',
                                              fontSize: '12.5px',
                                              fontWeight: 600,
                                              cursor: 'pointer',
                                              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                                              fontFamily: "'Space Grotesk', sans-serif"
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.25)';
                                              e.currentTarget.style.borderColor = '#fde047';
                                              e.currentTarget.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.14)';
                                              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
                                              e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                          >
                                            <span>{opt.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : isCommandBlock ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {/* Code Block Header / Bar */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    background: 'linear-gradient(180deg, rgba(18, 26, 42, 0.9) 0%, rgba(11, 17, 28, 0.9) 100%)',
                                    borderRadius: '12px 12px 0 0',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderBottom: 'none'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      {/* Terminal Window Dots */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ff5f56' }} />
                                        <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ffbd2e' }} />
                                        <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#27c93f' }} />
                                      </div>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.01em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                        {parsedResult.commands.length} Comando{parsedResult.commands.length > 1 ? 's' : ''} Generado{parsedResult.commands.length > 1 ? 's' : ''}
                                      </span>
                                      <span style={{
                                        fontSize: '10.5px',
                                        fontWeight: 700,
                                        color: '#34d399',
                                        background: 'rgba(16, 185, 129, 0.12)',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(16, 185, 129, 0.25)',
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        letterSpacing: '0.04em'
                                      }}>
                                        KUEPA CLI
                                      </span>
                                    </div>

                                    <button 
                                      type="button"
                                      onClick={() => handleCopyCommands(parsedResult.commands, index)}
                                      style={{
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: '#022c22',
                                        border: 'none',
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
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

                                  {Boolean(parsedResult.message || msg.text) && (
                                    <div style={{
                                      padding: '10px 14px',
                                      background: 'rgba(56, 189, 248, 0.07)',
                                      borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                                      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                                    }}>
                                      <AiMessageRenderer text={parsedResult.message || msg.text} onOptionSelect={handleAnalyze} />
                                    </div>
                                  )}

                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: '#04060b',
                                    borderRadius: '0 0 12px 12px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderTop: (parsedResult.message || msg.text) ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                                    overflow: 'hidden'
                                  }}>
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
                                              ? 'rgba(34, 197, 94, 0.12)' 
                                              : (i % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'), 
                                            borderBottom: i < parsedResult.commands.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                                            transition: 'background 0.2s ease',
                                            position: 'relative'
                                          }}
                                        >
                                          {/* Number badge */}
                                          <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '42px',
                                            background: isCopied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                                            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: isCopied ? '#86efac' : 'rgba(255, 255, 255, 0.35)',
                                            fontFamily: "'Fira Code', 'Consolas', monospace",
                                            userSelect: 'none',
                                            flexShrink: 0
                                          }}>
                                            {i + 1}
                                          </div>

                                          {/* Command Text */}
                                          <div style={{ 
                                            flex: 1,
                                            padding: '11px 44px 11px 14px',
                                            color: isCopied ? '#86efac' : '#38bdf8', 
                                            fontSize: '13px', 
                                            wordBreak: 'break-all', 
                                            whiteSpace: 'pre-wrap', 
                                            fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
                                            lineHeight: '1.55',
                                            transition: 'color 0.2s ease'
                                          }}>
                                            {renderCommandSyntax(cmd, isCopied)}
                                          </div>

                                          {/* Individual copy button */}
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

                                  {/* Ticket / Slack response card */}
                                  {parsedResult.ticketResponse && (
                                    <div
                                      data-ticket-card="true"
                                      id={`ticket-card-${index}`}
                                      style={{
                                        marginTop: '10px',
                                        padding: '16px',
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 78, 59, 0.14) 100%)',
                                        border: '1px solid rgba(52, 211, 153, 0.28)',
                                        borderLeft: '3px solid #10b981',
                                        borderRadius: '14px',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                      }}
                                    >
                                      <div className="no-export" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(52, 211, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MessageSquare size={13} color="#34d399" />
                                          </div>
                                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#a7f3d0', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
                                            Respuesta para el Ticket / Slack
                                          </span>
                                        </div>
                                        <div className="no-export" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <button
                                            type="button"
                                            className="no-export"
                                            onClick={(e) => {
                                              const cardEl = e.currentTarget.closest('[data-ticket-card="true"]');
                                              const targetEl = cardEl?.querySelector('[data-ticket-body="true"]') || cardEl;
                                              handleCopyTicketImage(targetEl, index);
                                            }}
                                            disabled={copyingImageIndex === index}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              background: copiedTicketImageKeys[index] ? 'rgba(34, 197, 94, 0.25)' : 'rgba(56, 189, 248, 0.15)',
                                              border: copiedTicketImageKeys[index] ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(56, 189, 248, 0.3)',
                                              color: copiedTicketImageKeys[index] ? '#86efac' : '#38bdf8',
                                              padding: '5px 12px',
                                              borderRadius: '8px',
                                              fontSize: '11.5px',
                                              fontWeight: 700,
                                              cursor: copyingImageIndex === index ? 'wait' : 'pointer',
                                              transition: 'all 0.18s ease'
                                            }}
                                            title="Copiar tarjeta como imagen para pegar directo en Slack o Jira (Ctrl+V)"
                                          >
                                            {copyingImageIndex === index ? (
                                              <Loader2 size={12} className="animate-spin" />
                                            ) : copiedTicketImageKeys[index] ? (
                                              <Check size={12} strokeWidth={2.5} />
                                            ) : (
                                              <Camera size={12} />
                                            )}
                                            {copyingImageIndex === index ? 'Generando...' : copiedTicketImageKeys[index] ? 'Imagen Copiada' : 'Copiar Imagen'}
                                          </button>
                                          <button
                                            type="button"
                                            className="no-export"
                                            onClick={() => handleCopyTicketResponse(parsedResult.ticketResponse, index)}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              background: copiedTicketKeys[index] ? 'rgba(34, 197, 94, 0.25)' : 'rgba(52, 211, 153, 0.15)',
                                              border: copiedTicketKeys[index] ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(52, 211, 153, 0.3)',
                                              color: copiedTicketKeys[index] ? '#86efac' : '#34d399',
                                              padding: '5px 12px',
                                              borderRadius: '8px',
                                              fontSize: '11.5px',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                              transition: 'all 0.18s ease'
                                            }}
                                            title="Copiar respuesta al portapapeles"
                                          >
                                            {copiedTicketKeys[index] ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
                                            {copiedTicketKeys[index] ? 'Copiada' : 'Copiar Respuesta'}
                                          </button>
                                        </div>
                                      </div>
                                      <div
                                        data-ticket-body="true"
                                        style={{
                                          fontSize: '13.5px',
                                          color: '#f8fafc',
                                          lineHeight: '1.6',
                                          whiteSpace: 'pre-wrap',
                                          fontFamily: "'Space Grotesk', sans-serif",
                                          padding: '12px 16px',
                                          background: 'rgba(0, 0, 0, 0.35)',
                                          borderRadius: '8px',
                                          border: '1px solid rgba(255, 255, 255, 0.05)'
                                        }}
                                      >
                                        {parsedResult.ticketResponse}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : parsedResult?.type === 'ROUTE' && parsedResult.targetComponent ? (
                                <div
                                  onClick={() => handleExecute(parsedResult, chatHistory[index-1]?.text)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px 20px',
                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
                                    borderRadius: '14px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    marginTop: '4px',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Search size={20} color="#38bdf8" />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', fontFamily: "'Space Grotesk', sans-serif" }}>
                                        Consultar en Formulario Visual
                                      </span>
                                      {parsedResult.ids?.length > 0 && (
                                        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '4px' }}>
                                          Autocompletando IDs: {parsedResult.ids.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <ArrowRight size={18} color="#38bdf8" />
                                </div>
                              ) : (
                                <div>
                                  <AiMessageRenderer text={msg.text || parsedResult?.message || ''} onOptionSelect={handleAnalyze} />
                                  {parsedResult?.options && parsedResult.options.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                                      {parsedResult.options.map((opt, optIdx) => (
                                        <button
                                          key={opt.value || optIdx}
                                          type="button"
                                          onClick={() => handleAnalyze(opt.value)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            background: 'rgba(16, 185, 129, 0.12)',
                                            border: '1px solid rgba(52, 211, 153, 0.35)',
                                            color: '#34d399',
                                            padding: '7px 14px',
                                            borderRadius: '9px',
                                            fontSize: '12.5px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                                            fontFamily: "'Space Grotesk', sans-serif"
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.22)';
                                            e.currentTarget.style.borderColor = '#34d399';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)';
                                            e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.35)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                          }}
                                        >
                                          <span>{opt.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* AI Response Action Footer */}
                                  {!isCommandBlock && (msg.text || parsedResult?.message) && (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      marginTop: '12px'
                                    }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const rawText = msg.text || parsedResult?.message || '';
                                          if (!rawText) return;
                                          const textToCopy = cleanMarkdownForClipboard(rawText);
                                          navigator.clipboard.writeText(textToCopy);
                                          setCopiedResponseKeys(prev => ({ ...prev, [index]: true }));
                                          toast.success('Respuesta copiada (texto limpio) ✨');
                                          setTimeout(() => {
                                            setCopiedResponseKeys(prev => ({ ...prev, [index]: false }));
                                          }, 2000);
                                        }}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '4px 10px',
                                          borderRadius: '6px',
                                          background: copiedResponseKeys[index] ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                          border: copiedResponseKeys[index] ? '1px solid rgba(34, 197, 94, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                                          color: copiedResponseKeys[index] ? '#86efac' : 'rgba(255, 255, 255, 0.65)',
                                          fontSize: '11px',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                          transition: 'all 0.15s ease',
                                          fontFamily: "'Space Grotesk', sans-serif"
                                        }}
                                        title="Copiar texto completo de la respuesta"
                                      >
                                        {copiedResponseKeys[index] ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
                                        <span>{copiedResponseKeys[index] ? 'Copiado' : 'Copiar todo'}</span>
                                      </button>
                                    </div>
                                  )}
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
                    const retryMax = retryMatch ? retryMatch[2] : 5;

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        style={{ display: 'flex', justifyContent: 'flex-start', margin: '8px 0' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                                   ? 'conic-gradient(from 0deg, transparent, transparent, #10b981)' 
                                   : analyzingState === 'resolving_students' 
                                   ? 'conic-gradient(from 0deg, transparent, transparent, #38bdf8)'
                                   : isRetryState
                                   ? 'conic-gradient(from 0deg, transparent, transparent, #f59e0b)'
                                   : 'conic-gradient(from 0deg, transparent, transparent, #fbbf24)',
                                 opacity: 0.8,
                                 filter: 'blur(3px)'
                               }}
                             />
                             <div style={{ position: 'relative', background: '#07090e', borderRadius: '50%', padding: '10px', zIndex: 2, display: 'flex', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
                               {analyzingState === 'ai' ? <KuepaAiIcon size={18} /> : 
                                analyzingState === 'resolving_students' ? <Search size={18} color="#38bdf8" /> : 
                                isRetryState ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <RefreshCw size={18} color="#f59e0b" />
                                  </motion.div>
                                ) :
                                <Zap size={18} color="#fbbf24" />}
                             </div>
                          </div>
                          
                          {/* Magic Waveform Bubble */}
                          <div style={{ 
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)', 
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            padding: '10px 20px', 
                            borderRadius: '100px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px'
                          }}>
                            {/* AI Magic Waveform */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '20px' }}>
                              {[0, 1, 2, 3, 4, 5, 6].map(i => {
                                const delay = i * 0.12;
                                const colors = analyzingState === 'ai'
                                  ? ['#10b981', '#34d399', '#10b981']
                                  : analyzingState === 'resolving_students'
                                  ? ['#0284c7', '#38bdf8', '#0284c7']
                                  : isRetryState
                                  ? ['#d97706', '#fbbf24', '#d97706']
                                  : ['#eab308', '#fde047', '#eab308'];

                                return (
                                  <motion.div
                                    key={i}
                                    animate={{ 
                                      height: ['6px', '20px', '6px'],
                                      backgroundColor: colors
                                    }}
                                    transition={{ 
                                      repeat: Infinity, 
                                      duration: 1.1, 
                                      delay: delay, 
                                      ease: "easeInOut" 
                                    }}
                                    style={{
                                      width: '3.5px',
                                      borderRadius: '4px',
                                      backgroundColor: colors[0],
                                      boxShadow: `0 0 8px ${colors[0]}80`
                                    }}
                                  />
                                );
                              })}
                            </div>
                            
                            {/* Texto limpio y moderno */}
                            <span style={{
                              color: '#f8fafc',
                              fontSize: '13.5px',
                              fontWeight: 600,
                              letterSpacing: '0.02em',
                              fontFamily: "'Space Grotesk', sans-serif"
                            }}>
                              {analyzingState === 'resolving_students' && "Buscando al estudiante en la base de datos..."}
                              {analyzingState === 'ai' && "Generando magia..."}
                              {isRetryState && `Modelo saturado, reintentando (${retryAttempt}/${retryMax})...`}
                              {analyzingState === 'db_processing' && "Cruzando información académica..."}
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

              {/* Input Area (Bottom - Floating Dock Capsule) */}
              <div style={{
                padding: '16px 24px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'linear-gradient(180deg, rgba(7, 9, 14, 0.4) 0%, rgba(4, 6, 10, 0.95) 100%)'
              }}>
                <div
                  className="input-capsule"
                  style={{
                    background: 'linear-gradient(180deg, rgba(16, 24, 39, 0.8) 0%, rgba(9, 14, 24, 0.95) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: '16px',
                    padding: '14px 16px 12px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    transition: 'border-color 0.25s ease, box-shadow 0.25s ease'
                  }}
                >
                  {/* Transformed Table Preview when pasted */}
                  {pastedTable && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            ✦ Tabla lista para procesar ({pastedTable.table.rows.length} filas)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPastedTable(null)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          title="Descartar tabla pegada"
                        >
                          <X size={12} /> Descartar tabla
                        </button>
                      </div>
                      <div style={{ maxHeight: '240px', overflowY: 'auto', borderRadius: '10px' }}>
                        <AiTableBlock table={pastedTable.table} title="Tabla Pegada de Excel" />
                      </div>
                    </div>
                  )}

                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={editingIndex !== null}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (analyzingState) {
                          if (abortControllerRef.current) {
                            abortControllerRef.current.abort();
                            abortControllerRef.current = null;
                          }
                          setAnalyzingState(null);
                        } else if ((inputValue.trim() || pastedTable) && apiKey && editingIndex === null) {
                          handleAnalyze();
                        }
                      }
                    }}
                    placeholder={
                      editingIndex !== null
                        ? "Editando mensaje arriba... Presiona Guardar o Cancelar"
                        : pastedTable
                        ? "Escribe una instrucción (opcional, ej: retirar del grupo)... o presiona Enter para procesar"
                        : apiKey
                        ? "Escribe tu instrucción o pega datos de Excel directamente aquí..."
                        : "Configura tu API Key primero en la barra superior..."
                    }
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--on-surface)',
                      fontSize: '14.5px',
                      fontFamily: "'Space Grotesk', sans-serif",
                      minHeight: '26px',
                      maxHeight: '340px',
                      resize: 'none',
                      lineHeight: '1.55',
                      padding: 0,
                      opacity: editingIndex !== null ? 0.4 : 1,
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                    rows={1}
                  />

                  {/* Capsule Footer Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.01em' }}>
                        Enter para enviar · Shift+Enter para salto de línea
                      </span>
                    </div>

                    {(() => {
                      const canSend = Boolean((inputValue.trim() || pastedTable) && apiKey && editingIndex === null);
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (analyzingState) {
                              if (abortControllerRef.current) {
                                abortControllerRef.current.abort();
                                abortControllerRef.current = null;
                              }
                              setAnalyzingState(null);
                              toast.info("Petición cancelada");
                            } else if (canSend) {
                              handleAnalyze();
                            }
                          }}
                          disabled={!canSend && !analyzingState}
                          style={{
                            background: analyzingState
                              ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                              : !canSend
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: analyzingState
                              ? '#ffffff'
                              : !canSend
                              ? 'rgba(255, 255, 255, 0.25)' 
                              : '#022c22',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (!canSend && !analyzingState) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: analyzingState
                              ? '0 4px 14px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                              : !canSend
                              ? 'none' 
                              : '0 4px 14px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => {
                            if (canSend && !analyzingState) {
                              e.currentTarget.style.transform = 'scale(1.06)';
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (canSend && !analyzingState) {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                            }
                          }}
                          title={analyzingState ? "Detener petición en curso" : "Enviar mensaje"}
                        >
                          {analyzingState ? <Square size={13} fill="#fff" /> : <ArrowRight size={17} strokeWidth={2.5} />}
                        </button>
                      );
                    })()}
                  </div>
                </div>
                <style>{`
                  .input-capsule:focus-within {
                    border-color: rgba(52, 211, 153, 0.45) !important;
                    box-shadow: 0 0 24px rgba(16, 185, 129, 0.2), 0 8px 30px rgba(0, 0, 0, 0.4) !important;
                  }
                  .input-capsule textarea::-webkit-scrollbar {
                    display: none;
                  }
                  .chat-history-scroll::-webkit-scrollbar {
                    width: 6px;
                  }
                  .chat-history-scroll::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .chat-history-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.12);
                    border-radius: 10px;
                  }
                  .chat-history-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.22);
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
