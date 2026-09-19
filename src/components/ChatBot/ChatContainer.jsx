import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Bot, 
  Sparkles, 
  Trash2, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Activity, 
  Zap, 
  DollarSign,
  Download,
  Key,
  X,
  Paperclip,
  Settings,
  GraduationCap,
  Plus,
  Edit2,
  Trash,
  RefreshCw,
  Image as ImageIcon,
  Check,
  History,
  Clock,
  ChevronLeft,
  MessageSquare,
  BookOpen,
  FolderOpen,
  Search,
  FileUp,
  FileSpreadsheet,
  FileCode,
  ArrowRight,
  Database,
  Cloud,
  Copy,
  ExternalLink,
  HardDrive
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import { processChatMessage } from '../../services/aiAssistantEngine';
import { fileReaderService } from '../../services/multiModalFileReader';
import { llmService, AVAILABLE_MODELS } from '../../services/llmService';
import { knowledgeBaseService } from '../../services/knowledgeBaseService';
import { supabaseManager } from '../../services/supabaseClient';

const SAMPLE_CSV = `Timestamp,LineVoltage_kV,Current_A,ActivePower_MW,ReactivePower_MVAr,Frequency_Hz,MachineSpeed_RPM,PowerFactor
00:00,15.74,13200,310.5,160.2,50.01,3000.6,0.889
01:00,15.75,12800,298.0,155.0,50.00,3000.0,0.887
02:00,15.76,12400,285.4,148.2,50.02,3001.2,0.888
03:00,15.75,12100,278.0,144.1,50.01,3000.6,0.888
04:00,15.74,12500,290.0,150.0,49.99,2999.4,0.889
05:00,15.73,13800,325.0,170.0,49.98,2998.8,0.886
06:00,15.72,15200,360.0,190.5,49.97,2998.2,0.884
07:00,15.70,16500,395.0,210.0,49.95,2997.0,0.883
08:00,15.71,17200,415.0,222.0,49.96,2997.6,0.882
09:00,15.72,17800,430.0,230.5,49.98,2998.8,0.881
10:00,15.73,18200,442.0,238.0,50.00,3000.0,0.880
11:00,15.74,18100,440.0,236.5,50.01,3000.6,0.881
12:00,15.75,17600,425.0,228.0,50.00,3000.0,0.882
13:00,15.74,17400,420.0,225.0,49.99,2999.4,0.882
14:00,15.73,17600,426.0,229.0,49.98,2998.8,0.881
15:00,15.72,17900,434.0,234.0,49.97,2998.2,0.881
16:00,15.71,18300,445.0,240.0,49.96,2997.6,0.880
17:00,15.70,18500,450.0,243.0,49.94,2996.4,0.880
18:00,15.69,18450,448.5,242.0,49.95,2997.0,0.880
19:00,15.70,18300,445.0,240.0,49.96,2997.6,0.880
20:00,15.72,17500,422.0,226.0,49.98,2998.8,0.882
21:00,15.73,16200,388.0,205.0,50.00,3000.0,0.884
22:00,15.74,14800,352.0,184.0,50.01,3000.6,0.886
23:00,15.75,13600,320.0,165.0,50.01,3000.6,0.888`;

const SAMPLE_COST_CSV = `Plant_Name,Capacity_MW,Technology,Fuel_Type,Overnight_CAPEX_USD_kW,Fuel_Price_USD_MMBtu,Heat_Rate_Btu_kWh,Fixed_OM_USD_kW_yr,Variable_OM_USD_MWh,Capacity_Factor
Meghnaghat CCGT,450,Combined Cycle Gas,Natural Gas,950,4.50,6600,12.00,1.80,0.78
Rampal Ultra Supercritical,660,Coal Supercritical,Coal,2100,3.80,8600,35.00,3.50,0.82
Sirajganj HFO Peaker,100,Reciprocating Engine,Heavy Fuel Oil,1100,15.50,8100,18.00,4.20,0.45
Payra Solar Park,100,Photovoltaic Solar,Solar,850,0.00,0,9.50,0.00,0.22`;

const QUICK_PROMPTS = [
  { label: '⚡ What is electrical frequency?', prompt: 'What is electrical frequency and why does it change?' },
  { label: '🇧🇩 BPDB Bangladesh Tariffs in BDT', prompt: 'What are the current BPDB electricity tariffs and bulk supply rates in Bangladesh?' },
  { label: '💰 Manual Cost Calc (CAPEX $1200, Fuel $7)', prompt: 'Calculate total cost with CAPEX 1200, fuel 7, cf 80%, capacity 300MW in BDT and USD' },
  { label: '📡 Live Generator Hardware Telemetry', prompt: 'What is the generator voltage, current, active power, reactive power, and machine RPM right now from the hardware?' },
  { label: '⚡ Transformer Impedance & Losses', prompt: 'Explain how transformer percentage impedance and copper losses are calculated' }
];

// ─────────────────────────────────────────────
// Chat History / Session Utilities
// ─────────────────────────────────────────────
const CHAT_SESSIONS_KEY = 'gridmind_chat_sessions_v2';
const ACTIVE_SESSION_KEY = 'gridmind_active_session_v2';
const MAX_SESSIONS = 30;

const WELCOME_MESSAGE = {
  sender: 'bot',
  timestamp: 'Just now',
  text: `👋 **Welcome to GridMind Universal AI Copilot!**\n\nI am fully equipped to handle **ALL** tasks you need:\n• **Read ANY File (CSV, Image, Photo, PDF, Text)**: Statistical profiling, markdown tables, visual inspection, and selective **Total Cost in BDT (৳) & USD ($)**.\n• **Train Me on ANY Specific Topic**: Click **"🎓 Train GridMind"** or type \`Train topic: [Title] | Details: [Content]\` to teach me custom engineering knowledge, local tariffs, or company rules.\n• **Manual Cost Calculations**: Enter or type ANY custom CAPEX, fuel price, O&M numbers and get instant dual-currency LCOE & Total Costs.\n• **Open Questions & Electrical Science**: Ask anything about frequency, voltage, current, power factor, transformers, harmonics, or live SCADA telemetry!\n\nType your question below or upload any CSV/Image/Document:`,
  widget: null
};

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
}

function loadSessions() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CHAT_SESSIONS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) { /* ignore */ }
  return [];
}

function saveSession(session) {
  try {
    if (typeof localStorage !== 'undefined') {
      let sessions = loadSessions();
      const idx = sessions.findIndex(s => s.id === session.id);
      if (idx >= 0) sessions[idx] = session;
      else sessions.unshift(session);
      if (sessions.length > MAX_SESSIONS) sessions = sessions.slice(0, MAX_SESSIONS);
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
    }
  } catch (e) { /* ignore */ }
}

function deleteSession(sessionId) {
  try {
    if (typeof localStorage !== 'undefined') {
      let sessions = loadSessions();
      sessions = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
    }
  } catch (e) { /* ignore */ }
}

function formatSessionTitle(messages) {
  const firstUser = messages.find(m => m.sender === 'user');
  if (firstUser?.text) return firstUser.text.slice(0, 55) + (firstUser.text.length > 55 ? '…' : '');
  return 'New Conversation';
}

function getSessionPreviewSnippet(messages) {
  if (!messages || messages.length === 0) return 'New Conversation';
  const lastUserOrBot = [...messages].reverse().find(m => m.text && m.text !== WELCOME_MESSAGE.text);
  if (lastUserOrBot?.text) {
    const clean = lastUserOrBot.text.replace(/[#*`_\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
    return clean.slice(0, 85) + (clean.length > 85 ? '…' : '');
  }
  return 'No messages yet';
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ChatContainer({ gridSnapshot, onTriggerGridEvent, onNavigateTab }) {
  // ── Session Management
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(ACTIVE_SESSION_KEY) || generateSessionId();
      }
    } catch (_) {}
    return generateSessionId();
  });

  const [messages, setMessages] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const sessions = loadSessions();
        const id = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (id) {
          const session = sessions.find(s => s.id === id);
          if (session?.messages?.length) return session.messages;
        }
      }
    } catch (_) {}
    return [WELCOME_MESSAGE];
  });

  const [allSessions, setAllSessions] = useState(loadSessions);

  // ── UI State
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // History Sidebar
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(llmService.getApiKey());
  const [selectedModel, setSelectedModel] = useState(llmService.getModel());
  const [isApiSaved, setIsApiSaved] = useState(llmService.hasApiKey());
  const [testResult, setTestResult] = useState(null);
  const [isTestingKey, setIsTestingKey] = useState(false);

  // Train Knowledge Base Modal State
  const [showTrainer, setShowTrainer] = useState(false);
  const [trainedTopics, setTrainedTopics] = useState(knowledgeBaseService.getTopics());
  const [searchTopicQuery, setSearchTopicQuery] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('Power Engineering');
  const [newTopicTags, setNewTopicTags] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [trainerStatusMsg, setTrainerStatusMsg] = useState('');
  // Trainer file upload state
  const [trainerFile, setTrainerFile] = useState(null);
  const [isProcessingTrainerFile, setIsProcessingTrainerFile] = useState(false);
  const [isDraggingTrainerFile, setIsDraggingTrainerFile] = useState(false);

  // Supabase Database State for Train Mode
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseManager.getConfig().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(supabaseManager.getConfig().anonKey);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [dbStats, setDbStats] = useState(knowledgeBaseService.getStatus());
  const [settingsTab, setSettingsTab] = useState('gemini'); // 'gemini' | 'supabase'

  // Reactive subscription to Knowledge Base status & cloud sync
  useEffect(() => {
    const unsub = knowledgeBaseService.subscribe((status) => {
      setTrainedTopics(knowledgeBaseService.getTopics());
      setDbStats(status);
    });
    return unsub;
  }, []);

  const fileInputRef = useRef(null);
  const trainerFileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // ── Persist session whenever messages change
  useEffect(() => {
    if (messages.length <= 1) return;
    const session = {
      id: currentSessionId,
      title: formatSessionTitle(messages),
      preview: getSessionPreviewSnippet(messages),
      messages,
      updatedAt: new Date().toISOString(),
      messageCount: messages.length
    };
    saveSession(session);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ACTIVE_SESSION_KEY, currentSessionId);
      }
    } catch (_) {}
    setAllSessions(loadSessions());
  }, [messages, currentSessionId]);

  // ── Start new session
  const handleNewSession = () => {
    const newId = generateSessionId();
    setCurrentSessionId(newId);
    setMessages([WELCOME_MESSAGE]);
    setInputVal('');
    setAttachedFile(null);
    setShowHistory(false);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ACTIVE_SESSION_KEY, newId);
      }
    } catch (_) {}
  };

  // ── Load a history session
  const handleLoadSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setShowHistory(false);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ACTIVE_SESSION_KEY, session.id);
      }
    } catch (_) {}
  };

  // ── Delete a history session
  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    deleteSession(sessionId);
    setAllSessions(loadSessions());
    if (sessionId === currentSessionId) handleNewSession();
  };

  // ── Export / Download session transcript
  const handleExportSession = (e, session) => {
    e.stopPropagation();
    let md = `# GridMind Universal AI Copilot – Chat Transcript\n\n`;
    md += `**Session:** ${session.title}\n`;
    md += `**Session ID:** \`${session.id}\`\n`;
    md += `**Date:** ${new Date(session.updatedAt).toLocaleString()}\n`;
    md += `**Total Messages:** ${session.messages?.length || 0}\n\n`;
    md += `---\n\n`;

    (session.messages || []).forEach((m, idx) => {
      const isUser = m.sender === 'user';
      md += `### ${idx + 1}. [${isUser ? '👤 User' : '🤖 GridMind Copilot'}] — ${m.timestamp || ''}\n\n`;
      if (m.filePreview) {
        md += `📎 **Attached Document:** \`${m.filePreview.name}\` (${m.filePreview.type})\n\n`;
      }
      md += `${m.text || ''}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (session.title || 'chat').slice(0, 32).replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `gridmind_chat_${safeTitle}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Clear all history sessions
  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to permanently clear ALL saved chat sessions? This cannot be undone.')) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(CHAT_SESSIONS_KEY);
        }
      } catch (_) {}
      setAllSessions([]);
      handleNewSession();
    }
  };

  const filteredSessions = allSessions.filter(s => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (s.title && s.title.toLowerCase().includes(q)) || 
           (s.preview && s.preview.toLowerCase().includes(q)) ||
           (s.messages && s.messages.some(m => m.text && m.text.toLowerCase().includes(q)));
  });

  const handleSendMessage = async (textToSend = inputVal) => {
    if (!textToSend.trim() && !attachedFile) return;

    const currentAttached = attachedFile;
    const userMsg = {
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend || `Please analyze this uploaded document: ${currentAttached?.fileName}`,
      filePreview: currentAttached ? { 
        name: currentAttached.fileName, 
        type: currentAttached.fileType,
        previewUrl: currentAttached.previewUrl || null 
      } : null
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setAttachedFile(null);
    setIsTyping(true);

    try {
      const botResponse = await processChatMessage(textToSend, { 
        gridSnapshot, 
        attachedFile: currentAttached,
        chatHistory: messages 
      });
      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        text: `Error processing query: ${err.message || 'Unknown error'}. Please try again.`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const fileExt = file.name.split('.').pop()?.toUpperCase() || 'File';
    const isImage = file.type?.startsWith('image/');

    // Show a "reading file" status message immediately
    const readingMsg = {
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `${isImage ? '🖼️' : '📂'} **Reading \`${file.name}\`** (${fileExt}, ${Math.round(file.size / 1024)} KB)…\n\nExtracting content and generating a comprehensive summary. Please wait…`,
      filePreview: null
    };
    setMessages(prev => [...prev, readingMsg]);

    try {
      const processed = await fileReaderService.processFile(file);

      // Build the user-side message (shows the file chip)
      const userFileMsg = {
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Please give me a full summary of this ${isImage ? 'image/photo' : 'file'}: ${processed.fileName}`,
        filePreview: {
          name: processed.fileName,
          type: processed.fileType,
          previewUrl: processed.previewUrl || null
        }
      };

      // Remove the "reading" placeholder and add the user message
      setMessages(prev => [...prev.slice(0, -1), userFileMsg]);
      setIsTyping(true);

      // Auto-trigger AI summarization with the processed file as context
      const summarizePrompt = isImage
        ? `Carefully analyze and summarize this uploaded image/photo: "${processed.fileName}". Describe all visible content in full detail including any text, charts, data, people, objects, layout, colors, and relevant information.`
        : `Provide a comprehensive, well-structured summary of this uploaded file: "${processed.fileName}" (${processed.fileType}). Cover all key content, data points, statistics, tables, findings, and any important information. Then suggest 3 follow-up questions I could ask.`;

      const botResponse = await processChatMessage(summarizePrompt, {
        gridSnapshot,
        attachedFile: processed,
        chatHistory: messages
      });

      // Merge any local cost widget from the file
      const finalWidget = botResponse.widget || (processed.costs ? { type: 'total_cost_card', data: processed.costs } : null);

      setMessages(prev => [...prev, { ...botResponse, widget: finalWidget }]);

      // Keep file attached so user can ask follow-up questions
      setAttachedFile(processed);

    } catch (err) {
      console.error('File processing error:', err);
      setMessages(prev => [...prev.slice(0, -1), {
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        text: `⚠️ **Error processing file:** ${err.message}\n\nPlease try a different file or format.`
      }]);
    } finally {
      setIsProcessingFile(false);
      setIsTyping(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveApiKey = () => {
    llmService.setApiKey(apiKeyInput);
    llmService.setModel(selectedModel);
    setIsApiSaved(llmService.hasApiKey());
    setShowSettings(false);
    setTestResult(null);
    
    setMessages(prev => [...prev, {
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: llmService.hasApiKey() 
        ? `✨ **Gemini Generative AI Key & Model Saved!** Model: \`${selectedModel}\`. GridMind will use Google Gemini with live telemetry, image vision, and automatic local fallback.` 
        : `Switched to **Built-in Power Engineering & Math Reasoning Engine**.`
    }]);
  };

  const handleTestApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({ success: false, message: 'Please paste an API key first.' });
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const result = await llmService.testConnection(apiKeyInput, selectedModel);
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: `Test failed: ${err.message}` });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleLoadSampleCSV = async () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const file = new File([blob], 'generator_24h_telemetry_sample.csv', { type: 'text/csv' });
    const processed = await fileReaderService.processFile(file);
    setAttachedFile(processed);
    handleSendMessage('Summarize the attached generator telemetry dataset and report the average active power and voltage');
  };

  const handleLoadSampleCostCSV = async () => {
    const blob = new Blob([SAMPLE_COST_CSV], { type: 'text/csv' });
    const file = new File([blob], 'bangladesh_generation_cost_benchmarks.csv', { type: 'text/csv' });
    const processed = await fileReaderService.processFile(file);
    setAttachedFile(processed);
    handleSendMessage('Analyze this generation cost CSV and compute the total cost breakdown in BDT and USD');
  };

  const handleClearHistory = () => {
    // If there's an active conversation with multiple messages, save it to history before resetting
    if (messages.length > 1) {
      const session = {
        id: currentSessionId,
        title: formatSessionTitle(messages),
        preview: getSessionPreviewSnippet(messages),
        messages,
        updatedAt: new Date().toISOString(),
        messageCount: messages.length
      };
      saveSession(session);
      setAllSessions(loadSessions());
    }

    const newId = generateSessionId();
    setCurrentSessionId(newId);
    setMessages([
      {
        sender: 'bot',
        timestamp: 'Just now',
        text: '👋 **Fresh Session Started.** Your previous conversation was safely saved to Chat History!\n\nAsk me any question about power systems, engineering, mathematics, or upload any file:'
      }
    ]);
    setInputVal('');
    setAttachedFile(null);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ACTIVE_SESSION_KEY, newId);
      }
    } catch (_) {}
  };

  // ── Universal Trainer File Processor (Supports ANY file type & Drag-and-Drop)
  const processTrainerFile = async (file, autoTrainImmediately = false) => {
    if (!file) return;

    setIsProcessingTrainerFile(true);
    setTrainerStatusMsg(`📂 Ingesting "${file.name}" & extracting technical domain knowledge…`);
    try {
      const processed = await fileReaderService.processFile(file);
      const baseName = (processed.fileName || file.name).replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
      const autoTitle = baseName.charAt(0).toUpperCase() + baseName.slice(1);

      // Build structured training content
      let content = '';
      if (processed.summary) {
        content += `${processed.summary}\n\n`;
      }
      if (processed.markdownTable) {
        content += `### Tabular Data Preview\n\n${processed.markdownTable}\n\n`;
      }
      if (processed.rawText && processed.rawText.length > 20) {
        content += `### Extracted Document Knowledge\n\n${processed.rawText.slice(0, 8000)}`;
        if (processed.rawText.length > 8000) content += '\n\n*(Document continues – key engineering sections indexed)*';
      }

      const fileStats = {
        name: processed.fileName,
        type: processed.fileType,
        sizeKb: processed.fileSizeKb,
        charCount: content.length,
        lines: content.split('\n').length
      };
      setTrainerFile(fileStats);

      if (autoTrainImmediately) {
        const autoCat = processed.fileType.includes('Spreadsheet') || processed.fileType.includes('CSV') 
          ? 'Data & Telemetry' 
          : processed.fileType.includes('Image') 
            ? 'Visual Equipment' 
            : 'Engineering Knowledge';
        
        const ext = file.name.split('.').pop()?.toLowerCase() || 'data';
        const added = await knowledgeBaseService.addTopic({
          title: autoTitle,
          category: autoCat,
          tags: [processed.fileType.toLowerCase(), 'file-upload', ext],
          content,
          metadata: {
            fileName: processed.fileName,
            fileType: processed.fileType,
            fileSizeKb: processed.fileSizeKb
          }
        });
        setTrainedTopics(knowledgeBaseService.getTopics());
        const loc = added?.source === 'cloud' ? 'Supabase Cloud Database' : 'Local Knowledge Base';
        setTrainerStatusMsg(`🎉 Auto-Trained "${autoTitle}" from file directly into ${loc}!`);
        setTimeout(() => setTrainerStatusMsg(''), 5000);
      } else {
        if (!newTopicTitle.trim()) {
          setNewTopicTitle(autoTitle);
        }
        if (processed.fileType) {
          setNewTopicCategory(processed.fileType);
        }
        setNewTopicContent(prev => prev ? prev + '\n\n---\n\n' + content : content);
        setTrainerStatusMsg(`✅ File "${processed.fileName}" (${processed.fileSizeKb} KB, ~${content.length} chars) loaded! Review & edit below, then click Save & Train.`);
      }
    } catch (err) {
      console.error('Trainer file error:', err);
      setTrainerStatusMsg(`⚠️ Error reading file: ${err.message}`);
    } finally {
      setIsProcessingTrainerFile(false);
      if (trainerFileInputRef.current) trainerFileInputRef.current.value = '';
    }
  };

  const handleTrainerFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processTrainerFile(file, false);
  };

  const handleTrainerDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTrainerFile(true);
  };

  const handleTrainerDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTrainerFile(false);
  };

  const handleTrainerDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTrainerFile(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processTrainerFile(file, false);
    }
  };

  // Knowledge Base Topic Handlers
  const handleSaveTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) {
      setTrainerStatusMsg('⚠️ Title and Content are required.');
      return;
    }

    try {
      if (editingTopicId) {
        await knowledgeBaseService.updateTopic(editingTopicId, {
          title: newTopicTitle,
          category: newTopicCategory,
          tags: newTopicTags,
          content: newTopicContent
        });
        setTrainerStatusMsg('✅ Topic updated successfully!');
      } else {
        const added = await knowledgeBaseService.addTopic({
          title: newTopicTitle,
          category: newTopicCategory,
          tags: newTopicTags,
          content: newTopicContent
        });
        const target = added.source === 'cloud' ? 'Supabase cloud database' : 'local knowledge base';
        setTrainerStatusMsg(`✅ Topic trained and saved to ${target}!`);
      }

      setTrainedTopics(knowledgeBaseService.getTopics());
      setDbStats(knowledgeBaseService.getStatus());
      setNewTopicTitle('');
      setNewTopicCategory('Power Engineering');
      setNewTopicTags('');
      setNewTopicContent('');
      setEditingTopicId(null);
      setTrainerFile(null);
      setTimeout(() => setTrainerStatusMsg(''), 3500);
    } catch (e) {
      setTrainerStatusMsg(`⚠️ Error: ${e.message}`);
    }
  };

  const handleEditTopic = (t) => {
    setEditingTopicId(t.id);
    setNewTopicTitle(t.title);
    setNewTopicCategory(t.category);
    setNewTopicTags(Array.isArray(t.tags) ? t.tags.join(', ') : (t.tags || ''));
    setNewTopicContent(t.content);
    setTrainerFile(null);
    setTrainerStatusMsg('Editing topic. Modify below and click "Save Topic".');
  };

  const handleDeleteTopic = async (id) => {
    await knowledgeBaseService.deleteTopic(id);
    setTrainedTopics(knowledgeBaseService.getTopics());
    setDbStats(knowledgeBaseService.getStatus());
    if (editingTopicId === id) {
      setEditingTopicId(null);
      setNewTopicTitle('');
      setNewTopicContent('');
    }
    setTrainerStatusMsg('🗑️ Topic deleted.');
    setTimeout(() => setTrainerStatusMsg(''), 2500);
  };

  const handleTestTrainedTopicInChat = (topic) => {
    setShowTrainer(false);
    handleSendMessage(`Tell me all details about ${topic.title}`);
  };

  // ── Supabase Cloud Database Handlers ──
  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestStatus(null);
    try {
      const res = await supabaseManager.testConnection(supabaseUrlInput, supabaseKeyInput);
      setSupabaseTestStatus(res);
    } catch (e) {
      setSupabaseTestStatus({ success: false, message: e.message });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSaveSupabaseConfig = async () => {
    supabaseManager.saveConfig(supabaseUrlInput, supabaseKeyInput);
    setTrainerStatusMsg('💾 Supabase credentials saved! Syncing with cloud database…');
    try {
      const syncRes = await knowledgeBaseService.syncFromSupabase();
      if (syncRes.success) {
        setTrainerStatusMsg(`✅ Synced with Supabase! (${syncRes.count} cloud topics loaded)`);
        setSupabaseTestStatus({ success: true, message: `Connected! ${syncRes.count} topics loaded from cloud.` });
      } else {
        setTrainerStatusMsg(`⚠️ Credentials saved, but sync failed: ${syncRes.error || syncRes.message}`);
      }
    } catch (e) {
      setTrainerStatusMsg(`⚠️ Error connecting to Supabase: ${e.message}`);
    }
    setDbStats(knowledgeBaseService.getStatus());
    setTrainedTopics(knowledgeBaseService.getTopics());
    setTimeout(() => setTrainerStatusMsg(''), 4000);
  };

  const handleDisconnectSupabase = () => {
    supabaseManager.clearConfig();
    setSupabaseUrlInput('');
    setSupabaseKeyInput('');
    setSupabaseTestStatus(null);
    setTrainerStatusMsg('Disconnected from Supabase. GridMind will use local storage.');
    setDbStats(knowledgeBaseService.getStatus());
    setTimeout(() => setTrainerStatusMsg(''), 3000);
  };

  const handleSyncLocalToSupabase = async () => {
    if (!supabaseManager.isConfigured()) {
      setTrainerStatusMsg('⚠️ Supabase is not configured yet. Please enter your URL and Anon Key first.');
      return;
    }
    setIsSyncingSupabase(true);
    setTrainerStatusMsg('☁️ Syncing all local topics to Supabase table…');
    try {
      const res = await knowledgeBaseService.syncLocalToSupabase();
      setTrainerStatusMsg(`🎉 Successfully uploaded ${res.count} topics to Supabase cloud!`);
      setTrainedTopics(knowledgeBaseService.getTopics());
      setDbStats(knowledgeBaseService.getStatus());
    } catch (err) {
      setTrainerStatusMsg(`⚠️ Failed to sync to Supabase: ${err.message}`);
    } finally {
      setIsSyncingSupabase(false);
      setTimeout(() => setTrainerStatusMsg(''), 5000);
    }
  };

  const handleCopySqlSchema = () => {
    const sql = `-- ============================================================================
-- GridMind AI - Supabase Database Schema for Train Mode
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trained_topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}',
  content TEXT NOT NULL,
  source TEXT DEFAULT 'cloud',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trained_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read trained_topics" ON public.trained_topics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert trained_topics" ON public.trained_topics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update trained_topics" ON public.trained_topics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete trained_topics" ON public.trained_topics FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_trained_topics_category ON public.trained_topics (category);
CREATE INDEX IF NOT EXISTS idx_trained_topics_updated_at ON public.trained_topics (updated_at DESC);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };


  const filteredTopics = trainedTopics.filter(t => {
    if (!searchTopicQuery.trim()) return true;
    const q = searchTopicQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || 
           t.category.toLowerCase().includes(q) || 
           t.content.toLowerCase().includes(q) ||
           (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)));
  });

  return (
    <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 120px)', maxWidth: '1300px', margin: '16px auto 0', padding: '0 16px', position: 'relative' }}>

      {/* ── History Sidebar Panel ── */}
      <div style={{
        width: showHistory ? '320px' : '0px',
        minWidth: showHistory ? '320px' : '0px',
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
        marginRight: showHistory ? '14px' : '0px',
      }}>
        <div className="glass-panel" style={{ width: '308px', height: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          {/* History Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', borderRadius: '16px 16px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="#fff" />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Previous Chats</span>
              <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, borderRadius: '10px', padding: '2px 8px' }}>{allSessions.length}</span>
            </div>
            <button onClick={() => setShowHistory(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#fff', padding: '4px', display: 'flex', alignItems: 'center' }} title="Collapse History">
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* New Chat Button */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', background: '#F8FAFC' }}>
            <button onClick={handleNewSession} className="btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(16,185,129,0.2)' }}>
              <Plus size={15} /> Start New Conversation
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={historySearch} 
                onChange={e => setHistorySearch(e.target.value)} 
                placeholder="Search conversations…" 
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: '#FFFFFF', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }} 
              />
              {historySearch && (
                <button onClick={() => setHistorySearch('')} style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Session List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
            {filteredSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 14px', color: 'var(--text-muted)' }}>
                <MessageSquare size={32} style={{ opacity: 0.25, marginBottom: '10px' }} />
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No conversations found</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {historySearch ? 'Try searching another keyword' : 'Your previous chat sessions will appear here automatically.'}
                </p>
              </div>
            ) : (
              filteredSessions.map(session => {
                const isActive = session.id === currentSessionId;
                const preview = session.preview || getSessionPreviewSnippet(session.messages);
                return (
                  <div
                    key={session.id}
                    onClick={() => handleLoadSession(session)}
                    style={{ 
                      padding: '10px 12px', 
                      borderRadius: '10px', 
                      marginBottom: '6px', 
                      cursor: 'pointer', 
                      background: isActive ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : '#FFFFFF', 
                      border: isActive ? '1.5px solid #10B981' : '1px solid var(--border-subtle)', 
                      boxShadow: isActive ? '0 2px 8px rgba(16,185,129,0.15)' : '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '5px' 
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                        {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />}
                        <p style={{ fontSize: '0.8rem', fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--accent-forest)' : 'var(--text-primary)', margin: 0, lineHeight: '1.35', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {session.title || 'Conversation'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button 
                          onClick={e => handleExportSession(e, session)} 
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px', borderRadius: '4px' }} 
                          title="Export chat transcript (Markdown)"
                        >
                          <Download size={12} />
                        </button>
                        <button 
                          onClick={e => handleDeleteSession(e, session.id)} 
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '3px', borderRadius: '4px', opacity: 0.7 }} 
                          title="Delete this chat"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Preview Snippet */}
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {preview}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <Clock size={10} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{formatRelativeTime(session.updatedAt)}</span>
                      <span style={{ fontSize: '0.64rem', color: isActive ? 'var(--accent-forest)' : 'var(--text-secondary)', marginLeft: 'auto', background: isActive ? '#A7F3D0' : '#F1F5F9', padding: '1px 6px', borderRadius: '8px', fontWeight: 600 }}>
                        {session.messageCount || session.messages?.length || 0} msgs
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Clear All Bar */}
          {allSessions.length > 0 && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-subtle)', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{allSessions.length} total saved</span>
              <button onClick={handleClearAllHistory} style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Trash2 size={11} /> Clear All History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      
      {/* Top Banner: Multi-Format File Upload, Trainer & AI Engine Status */}
      <div className="glass-panel" style={{ padding: '12px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={20} color="var(--accent-forest)" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                GridMind Universal AI Copilot
              </h3>
              <span className={`badge ${isApiSaved ? 'badge-cyan' : 'badge-stable'}`} style={{ fontSize: '0.62rem' }}>
                {isApiSaved ? 'Gemini 3.6 / 2.5 Active' : 'Offline Knowledge Engine'}
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Universal CSV/Image/Photo Ingestion • Trainable Knowledge Base • Manual Dual-Currency Cost Engine
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* History Button */}
          <button
            onClick={() => setShowHistory(v => !v)}
            className="btn-secondary"
            style={{ 
              fontSize: '0.78rem', 
              padding: '6px 13px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontWeight: 700,
              background: showHistory ? 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)' : '#FFFFFF', 
              color: showHistory ? '#fff' : 'var(--text-primary)', 
              border: showHistory ? '1px solid #0284C7' : '1px solid var(--border-subtle)',
              boxShadow: showHistory ? '0 2px 8px rgba(2,132,199,0.3)' : '0 1px 3px rgba(0,0,0,0.04)'
            }}
            title="Toggle Previous Chat History"
          >
            <History size={15} color={showHistory ? '#fff' : 'var(--accent-forest)'} /> 
            <span>Chat History</span>
            <span style={{ 
              background: showHistory ? 'rgba(255,255,255,0.28)' : 'var(--accent-forest)', 
              color: '#fff', 
              fontSize: '0.66rem', 
              fontWeight: 800,
              padding: '1px 7px', 
              borderRadius: '10px' 
            }}>
              {allSessions.length}
            </span>
          </button>

          {/* Train GridMind Button */}
          <button
            onClick={() => setShowTrainer(true)}
            className="btn-primary"
            style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
            title="Train GridMind on Specific Topics"
          >
            <GraduationCap size={15} /> 
            <span>Train GridMind ({trainedTopics.length})</span>
          </button>

          {/* API Key Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Configure Generative AI API Key"
          >
            <Settings size={14} color="var(--accent-forest)" /> {isApiSaved ? 'Gemini: Active' : 'API Key'}
          </button>

          {/* Sample CSV Buttons */}
          <button onClick={handleLoadSampleCSV} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px' }} title="Load Sample 24h CSV Telemetry">
            <Download size={14} color="var(--accent-forest)" /> Telemetry CSV
          </button>

          <button onClick={handleLoadSampleCostCSV} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px' }} title="Load Sample Generation Cost CSV">
            <DollarSign size={14} color="var(--accent-forest)" /> Cost CSV
          </button>

          {/* Universal File Input — accepts ALL file types */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.csv,.tsv,.pdf,.docx,.doc,.rtf,.odt,.xlsx,.xls,.ods,.txt,.md,.json,.jsonl,.yaml,.yml,.log,.py,.js,.ts,.jsx,.tsx,.html,.css,.xml,.sql,.sh,.bat,.cpp,.c,.h,.java,.rb,.php,.rs,.go,.env,.ini,.toml,*"
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile}
            className="btn-secondary"
            style={{
              fontSize: '0.75rem',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: isProcessingFile ? 0.6 : 1,
              cursor: isProcessingFile ? 'not-allowed' : 'pointer'
            }}
            title="Upload ANY file — images, CSV, PDF, Word, Excel, JSON, code, text, logs…"
          >
            {isProcessingFile
              ? <><RefreshCw size={14} className="spin" color="var(--accent-forest)" /> Summarizing…</>
              : <><UploadCloud size={14} color="var(--accent-forest)" /> Upload Any File / Photo</>
            }
          </button>

          <button onClick={handleClearHistory} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px' }} title="Clear Chat History">
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Settings Modal (Gemini API Key + Live Connection Test) */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(6px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '540px', width: '100%', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="var(--accent-forest)" /> System Configuration & AI Services
              </h4>
              <button onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Sub-Tabs: Gemini AI vs Supabase Database */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px', paddingBottom: '6px' }}>
              <button
                onClick={() => setSettingsTab('gemini')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: settingsTab === 'gemini' ? '#ECFDF5' : 'transparent',
                  color: settingsTab === 'gemini' ? 'var(--accent-forest)' : 'var(--text-secondary)',
                  borderBottom: settingsTab === 'gemini' ? '2px solid var(--accent-emerald)' : '2px solid transparent'
                }}
              >
                <Key size={14} /> Google Gemini AI
              </button>
              <button
                onClick={() => setSettingsTab('supabase')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: settingsTab === 'supabase' ? '#ECFDF5' : 'transparent',
                  color: settingsTab === 'supabase' ? 'var(--accent-forest)' : 'var(--text-secondary)',
                  borderBottom: settingsTab === 'supabase' ? '2px solid var(--accent-emerald)' : '2px solid transparent'
                }}
              >
                <Database size={14} /> Supabase Database {dbStats.isConfigured ? '🟢' : '🟡'}
              </button>
            </div>

            {settingsTab === 'gemini' ? (
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
                  Enter your Google Gemini API key (from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-forest)', textDecoration: 'underline' }}>Google AI Studio</a>).
                  GridMind will automatically use Gemini 2.0 Flash / 1.5 Flash with image vision, trained knowledge base injection, and automatic model failover.
                </p>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Gemini API Key:
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="AIzaSy..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: '#F8FAFC',
                      fontSize: '0.85rem',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Active Gemini Model:
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      setTestResult(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: '#FFFFFF',
                      fontSize: '0.82rem',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={handleTestApiKey}
                    disabled={isTestingKey || !apiKeyInput.trim()}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                  >
                    {isTestingKey ? <RefreshCw size={14} className="spin" /> : <Activity size={14} />}
                    <span>{isTestingKey ? 'Testing Connection to Google Gemini...' : 'Test Connection with Google API'}</span>
                  </button>

                  {testResult && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      background: testResult.success ? '#ECFDF5' : '#FEF2F2',
                      border: `1px solid ${testResult.success ? '#A7F3D0' : '#FECACA'}`,
                      color: testResult.success ? 'var(--accent-forest)' : '#DC2626'
                    }}>
                      <strong>{testResult.success ? '✅ Success:' : '❌ Warning:'}</strong> {testResult.message}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button onClick={() => setShowSettings(false)} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveApiKey} className="btn-primary" style={{ fontSize: '0.8rem' }}>
                    Save Gemini Settings
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
                  Connect your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-forest)', textDecoration: 'underline' }}>Supabase PostgreSQL</a> database to store and sync all training data (topics, files, tariffs) in the cloud.
                </p>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Supabase Project URL:
                  </label>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => {
                      setSupabaseUrlInput(e.target.value);
                      setSupabaseTestStatus(null);
                    }}
                    placeholder="https://your-project.supabase.co"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: '#F8FAFC',
                      fontSize: '0.83rem',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Supabase Anon / Public Key:
                  </label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => {
                      setSupabaseKeyInput(e.target.value);
                      setSupabaseTestStatus(null);
                    }}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: '#F8FAFC',
                      fontSize: '0.83rem',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                {/* Supabase Test & Status Banner */}
                <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleTestSupabase}
                      disabled={isTestingSupabase || !supabaseUrlInput.trim() || !supabaseKeyInput.trim()}
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 12px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                    >
                      {isTestingSupabase ? <RefreshCw size={14} className="spin" /> : <Activity size={14} />}
                      <span>{isTestingSupabase ? 'Testing Connection…' : 'Test Supabase Connection'}</span>
                    </button>

                    {dbStats.isConfigured && (
                      <button
                        onClick={handleDisconnectSupabase}
                        className="btn-secondary"
                        style={{ fontSize: '0.76rem', color: '#DC2626', borderColor: '#FECACA' }}
                        title="Disconnect Supabase"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>

                  {supabaseTestStatus && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      background: supabaseTestStatus.success ? '#ECFDF5' : '#FEF2F2',
                      border: `1px solid ${supabaseTestStatus.success ? '#A7F3D0' : '#FECACA'}`,
                      color: supabaseTestStatus.success ? 'var(--accent-forest)' : '#DC2626'
                    }}>
                      <strong>{supabaseTestStatus.success ? '✅ Success:' : '❌ Warning:'}</strong> {supabaseTestStatus.message}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={handleCopySqlSchema}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-forest)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                    {copiedSql ? 'SQL Schema Copied!' : 'Copy SQL Schema'}
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowSettings(false)} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                      Cancel
                    </button>
                    <button onClick={handleSaveSupabaseConfig} className="btn-primary" style={{ fontSize: '0.8rem' }}>
                      Save & Connect Supabase
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Train GridMind Modal (Topic Training Studio) */}
      {showTrainer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(6px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <GraduationCap size={22} color="var(--accent-forest)" /> Train GridMind Knowledge Base
                  </h4>
                  <span className={`badge ${dbStats.isConfigured ? 'badge-cyan' : 'badge-stable'}`} style={{ fontSize: '0.66rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {dbStats.isConfigured ? <Cloud size={11} /> : <HardDrive size={11} />}
                    {dbStats.isConfigured ? `Supabase Cloud (${dbStats.cloudCount || dbStats.totalCount} topics)` : 'Local Storage Mode'}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Teach GridMind custom power plants, standards, tariffs, equipment notes, or any domain. Data persists in {dbStats.isConfigured ? 'Supabase PostgreSQL Cloud Database' : 'Local Storage'}!
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowDbConfig(v => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: showDbConfig ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                    background: showDbConfig ? '#ECFDF5' : '#FFFFFF',
                    color: showDbConfig ? 'var(--accent-forest)' : 'var(--text-primary)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  title="Configure Supabase Cloud Database"
                >
                  <Database size={14} color="var(--accent-forest)" />
                  <span>{showDbConfig ? 'Close DB Settings' : 'Supabase Settings'}</span>
                </button>
                <button onClick={() => { setShowTrainer(false); setShowDbConfig(false); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: Split view */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', flex: 1, overflow: 'hidden' }}>
              
              {/* Left Column: Trained Topics List */}
              <div style={{ borderRight: '1px solid var(--border-subtle)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#F8FAFC', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Active Trained Topics ({filteredTopics.length})
                  </span>
                  <button 
                    onClick={() => {
                      knowledgeBaseService.resetToDefaults();
                      setTrainedTopics(knowledgeBaseService.getTopics());
                      setTrainerStatusMsg('Reset to standard engineering topics.');
                    }} 
                    style={{ background: 'transparent', border: 'none', fontSize: '0.68rem', color: 'var(--accent-forest)', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Reset Defaults
                  </button>
                </div>

                <input
                  type="text"
                  value={searchTopicQuery}
                  onChange={(e) => setSearchTopicQuery(e.target.value)}
                  placeholder="Search topics by title, tag, or content..."
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: '#FFFFFF',
                    fontSize: '0.78rem',
                    outline: 'none'
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, maxHeight: '420px' }}>
                  {filteredTopics.map((topic) => (
                    <div
                      key={topic.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: editingTopicId === topic.id ? '#ECFDF5' : '#FFFFFF',
                        border: editingTopicId === topic.id ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          {topic.title}
                        </strong>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleEditTopic(topic)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-forest)', padding: '2px' }}
                            title="Edit this topic"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(topic.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '2px' }}
                            title="Delete this topic"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="badge badge-stable" style={{ fontSize: '0.62rem' }}>
                          {topic.category}
                        </span>
                        <span className={`badge ${topic.source === 'cloud' || topic.source === 'supabase' ? 'badge-cyan' : 'badge-amber'}`} style={{ fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {topic.source === 'cloud' || topic.source === 'supabase' ? <Cloud size={10} /> : <HardDrive size={10} />}
                          {topic.source === 'cloud' || topic.source === 'supabase' ? 'Supabase' : 'Local'}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          {topic.updatedAt}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '4px 0 2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {topic.content}
                      </p>

                      <button
                        onClick={() => handleTestTrainedTopicInChat(topic)}
                        style={{
                          background: '#F1F5F9',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.68rem',
                          color: 'var(--accent-forest)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          alignSelf: 'flex-start',
                          marginTop: '2px'
                        }}
                      >
                        Ask GridMind about this →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Conditional View (Supabase Database Settings OR Topic Training Form) */}
              {showDbConfig ? (
                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', minHeight: 0, background: '#FFFFFF' }}>
                  {/* Panel Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Database size={18} color="#FFF" />
                      </div>
                      <div>
                        <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          Supabase Database Configuration
                        </h5>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          PostgreSQL persistence for training data across all sessions & devices
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDbConfig(false)}
                      className="btn-secondary"
                      style={{ fontSize: '0.74rem', padding: '5px 10px' }}
                    >
                      Back to Training
                    </button>
                  </div>

                  {/* Current Connection Status Box */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: dbStats.isConfigured ? 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)' : '#F8FAFC',
                    border: `1px solid ${dbStats.isConfigured ? '#A7F3D0' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {dbStats.isConfigured ? <Cloud size={20} color="var(--accent-forest)" /> : <HardDrive size={20} color="var(--accent-amber)" />}
                      <div>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          Status: {dbStats.isConfigured ? 'Connected to Supabase PostgreSQL' : 'Local Storage Mode (Browser Cache)'}
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {dbStats.isConfigured 
                            ? `${dbStats.cloudCount || dbStats.totalCount} topics stored in cloud table "trained_topics"`
                            : 'Knowledge is currently saved in this browser. Connect Supabase to store permanently in cloud.'}
                        </span>
                      </div>
                    </div>

                    {dbStats.isConfigured && (
                      <button
                        onClick={handleSyncLocalToSupabase}
                        disabled={isSyncingSupabase}
                        className="btn-primary"
                        style={{ fontSize: '0.74rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        {isSyncingSupabase ? <RefreshCw size={13} className="spin" /> : <Cloud size={13} />}
                        <span>{isSyncingSupabase ? 'Syncing…' : 'Push Local to Supabase'}</span>
                      </button>
                    )}
                  </div>

                  {/* URL & Anon Key Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                        Supabase Project URL:
                      </label>
                      <input
                        type="text"
                        value={supabaseUrlInput}
                        onChange={(e) => {
                          setSupabaseUrlInput(e.target.value);
                          setSupabaseTestStatus(null);
                        }}
                        placeholder="https://your-project-id.supabase.co"
                        style={{
                          width: '100%',
                          padding: '8px 11px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: '#F8FAFC',
                          fontSize: '0.82rem',
                          outline: 'none',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                        Supabase Anon / Public Key:
                      </label>
                      <input
                        type="password"
                        value={supabaseKeyInput}
                        onChange={(e) => {
                          setSupabaseKeyInput(e.target.value);
                          setSupabaseTestStatus(null);
                        }}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        style={{
                          width: '100%',
                          padding: '8px 11px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: '#F8FAFC',
                          fontSize: '0.82rem',
                          outline: 'none',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <button
                        onClick={handleTestSupabase}
                        disabled={isTestingSupabase || !supabaseUrlInput.trim() || !supabaseKeyInput.trim()}
                        className="btn-secondary"
                        style={{ fontSize: '0.76rem', padding: '6px 12px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                      >
                        {isTestingSupabase ? <RefreshCw size={13} className="spin" /> : <Activity size={13} />}
                        <span>{isTestingSupabase ? 'Testing Connection…' : 'Test Connection'}</span>
                      </button>

                      <button
                        onClick={handleSaveSupabaseConfig}
                        disabled={!supabaseUrlInput.trim() || !supabaseKeyInput.trim()}
                        className="btn-primary"
                        style={{ fontSize: '0.76rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Check size={14} /> Save & Connect
                      </button>

                      {dbStats.isConfigured && (
                        <button
                          onClick={handleDisconnectSupabase}
                          className="btn-secondary"
                          style={{ fontSize: '0.74rem', color: '#DC2626', borderColor: '#FECACA' }}
                          title="Disconnect Supabase"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>

                    {/* Test Status Banner */}
                    {supabaseTestStatus && (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        background: supabaseTestStatus.success ? '#ECFDF5' : '#FEF2F2',
                        border: `1px solid ${supabaseTestStatus.success ? '#A7F3D0' : '#FECACA'}`,
                        color: supabaseTestStatus.success ? 'var(--accent-forest)' : '#DC2626',
                        lineHeight: '1.4'
                      }}>
                        <strong>{supabaseTestStatus.success ? '✅ Success:' : '❌ Notice:'}</strong> {supabaseTestStatus.message}
                      </div>
                    )}
                  </div>

                  {/* Database Schema Setup & Quick Copy */}
                  <div style={{
                    marginTop: 'auto',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: '#F8FAFC',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        PostgreSQL Table Schema
                      </span>
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.7rem', color: 'var(--accent-forest)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                      >
                        <span>Open Supabase Console</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>

                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                      Run in your Supabase project (Dashboard &gt; SQL Editor). Creates <code>trained_topics</code> with RLS and search indexes:
                    </p>

                    <button
                      onClick={handleCopySqlSchema}
                      className="btn-secondary"
                      style={{
                        alignSelf: 'flex-start',
                        fontSize: '0.74rem',
                        padding: '5px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: copiedSql ? '#ECFDF5' : '#FFFFFF',
                        color: copiedSql ? 'var(--accent-forest)' : 'var(--text-primary)',
                        borderColor: copiedSql ? 'var(--accent-emerald)' : 'var(--border-subtle)'
                      }}
                    >
                      {copiedSql ? <Check size={13} color="var(--accent-forest)" /> : <Copy size={13} />}
                      <span>{copiedSql ? 'SQL Copied to Clipboard!' : 'Copy SQL Schema Script'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', minHeight: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {editingTopicId ? <Edit2 size={15} color="var(--accent-forest)" /> : <Plus size={15} color="var(--accent-forest)" />}
                      {editingTopicId ? 'Edit Trained Topic' : 'Train a New Topic'}
                    </h5>
                    {editingTopicId && (
                      <button
                        onClick={() => {
                          setEditingTopicId(null);
                          setNewTopicTitle('');
                          setNewTopicContent('');
                          setTrainerStatusMsg('');
                        }}
                        style={{ background: 'transparent', border: 'none', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  {trainerStatusMsg && (
                    <div style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', background: trainerStatusMsg.includes('⚠️') ? '#FEF2F2' : '#ECFDF5', border: `1px solid ${trainerStatusMsg.includes('⚠️') ? '#FECACA' : '#A7F3D0'}`, color: trainerStatusMsg.includes('⚠️') ? '#DC2626' : 'var(--accent-forest)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isProcessingTrainerFile && <RefreshCw size={13} className="spin" />}
                      {trainerStatusMsg}
                    </div>
                  )}

                  {/* ── FILE UPLOAD FOR TRAINER (ANY FILE TYPE SUPPORTED) ── */}
                  <div 
                    onDragOver={handleTrainerDragOver}
                    onDragLeave={handleTrainerDragLeave}
                    onDrop={handleTrainerDrop}
                    style={{ 
                      padding: '16px 18px', 
                      borderRadius: '14px', 
                      border: isDraggingTrainerFile ? '2px dashed #059669' : '2px dashed #A7F3D0', 
                      background: isDraggingTrainerFile ? '#ECFDF5' : 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '10px',
                      transition: 'all 0.2s ease',
                      boxShadow: isDraggingTrainerFile ? '0 4px 16px rgba(16,185,129,0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileUp size={18} color="var(--accent-forest)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Upload ANY File to Auto-Train</span>
                      </div>
                      <span style={{ fontSize: '0.66rem', color: '#047857', background: '#DCFCE7', border: '1px solid #86EFAC', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        Supports ANY File Format
                      </span>
                    </div>

                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                      Drag & drop or browse <strong>ANY</strong> file type — CSV, PDF, Word (.docx), Excel (.xlsx), Text (.txt, .md), JSON, YAML, Logs, Images (.png, .jpg), Code, or Engineering Specs. Knowledge is automatically extracted and indexed into GridMind!
                    </p>

                    <input 
                      type="file" 
                      ref={trainerFileInputRef} 
                      onChange={handleTrainerFileUpload} 
                      accept="*" 
                      style={{ display: 'none' }} 
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => trainerFileInputRef.current?.click()}
                        disabled={isProcessingTrainerFile}
                        style={{ 
                          background: isProcessingTrainerFile ? '#9CA3AF' : 'linear-gradient(135deg, #059669, #10B981)', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: '8px', 
                          padding: '8px 16px', 
                          fontSize: '0.8rem', 
                          fontWeight: 700, 
                          cursor: isProcessingTrainerFile ? 'not-allowed' : 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(16,185,129,0.25)'
                        }}
                      >
                        {isProcessingTrainerFile ? <><RefreshCw size={14} className="spin" /> Reading & Extracting…</> : <><FolderOpen size={14} /> Choose Any File</>}
                      </button>

                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        or drag & drop here
                      </span>

                      {trainerFile && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '6px 12px', borderRadius: '8px', border: '1px solid #86EFAC', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                          <FileText size={15} color="var(--accent-forest)" />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {trainerFile.name}
                            </span>
                            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                              {trainerFile.type} • {trainerFile.sizeKb} KB
                            </span>
                          </div>
                          <button onClick={() => setTrainerFile(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }} title="Remove file">
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                      Topic Title:
                    </label>
                    <input
                      type="text"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      placeholder="e.g., Payra 1320MW Thermal Plant Specifications"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: '#FFFFFF',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                        Category:
                      </label>
                      <input
                        type="text"
                        value={newTopicCategory}
                        onChange={(e) => setNewTopicCategory(e.target.value)}
                        placeholder="e.g., Power Plant, Tariffs, SCADA"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: '#FFFFFF',
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                        Tags (comma-separated):
                      </label>
                      <input
                        type="text"
                        value={newTopicTags}
                        onChange={(e) => setNewTopicTags(e.target.value)}
                        placeholder="e.g., coal, payra, 1320mw, ultra-supercritical"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          background: '#FFFFFF',
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                      Training Notes, Facts, Formulas & Rules (Markdown Supported):
                    </label>
                    <textarea
                      rows={8}
                      value={newTopicContent}
                      onChange={(e) => setNewTopicContent(e.target.value)}
                      placeholder="Type detailed facts, equipment ratings, tariff rates, or operating rules. When asked, GridMind will respond accurately using this knowledge..."
                      style={{
                        width: '100%',
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: '#FFFFFF',
                        fontSize: '0.82rem',
                        lineHeight: '1.5',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'var(--font-body)'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSaveTopic}
                    className="btn-primary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Check size={16} /> {editingTopicId ? 'Update Trained Topic' : (dbStats.isConfigured ? 'Save & Train Topic (Supabase Cloud)' : 'Save & Train Topic')}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="glass-panel" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Quick History Resume Banner if previous chats exist */}
        {allSessions.length > 0 && messages.length <= 1 && !showHistory && (
          <div style={{
            margin: '0 0 10px',
            padding: '10px 16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
            border: '1px solid #A7F3D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(16,185,129,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} color="var(--accent-forest)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                You have <strong>{allSessions.length}</strong> previous chat conversation{allSessions.length > 1 ? 's' : ''} saved in history.
              </span>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              style={{
                background: 'var(--accent-forest)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 4px rgba(5,150,105,0.2)'
              }}
            >
              <span>View Previous Chats</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {messages.map((msg, index) => (
          <ChatMessage 
            key={index} 
            message={msg} 
            onTriggerGridEvent={onTriggerGridEvent}
            onNavigateTab={onNavigateTab}
          />
        ))}

        {isTyping && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '8px 0' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="#FFF" />
            </div>
            <div className="glass-panel" style={{ padding: '10px 18px', borderRadius: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div className="pulse-dot" style={{ background: 'var(--accent-emerald)' }} />
              <div className="pulse-dot" style={{ background: 'var(--accent-emerald)', animationDelay: '0.2s' }} />
              <div className="pulse-dot" style={{ background: 'var(--accent-emerald)', animationDelay: '0.4s' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>Thinking & calculating...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '10px 4px 6px',
        whiteSpace: 'nowrap'
      }}>
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.prompt)}
            className="btn-secondary"
            style={{
              fontSize: '0.78rem',
              padding: '6px 12px',
              borderRadius: '20px',
              flexShrink: 0
            }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Attached File Pill Preview (Image Thumbnail or File Chip) */}
      {attachedFile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          padding: '8px 14px',
          borderRadius: '10px',
          margin: '4px 0',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-forest)', fontWeight: 600 }}>
            {attachedFile.previewUrl ? (
              <img
                src={attachedFile.previewUrl}
                alt="Upload preview"
                style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #A7F3D0' }}
              />
            ) : (
              <Paperclip size={16} />
            )}
            <div>
              <span>Attached: <strong>{attachedFile.fileName}</strong> ({attachedFile.fileType})</span>
              {attachedFile.dimensions?.width > 0 && (
                <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Resolution: {attachedFile.dimensions.width}×{attachedFile.dimensions.height} px
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => setAttachedFile(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input Box */}
      <div className="glass-panel" style={{
        marginTop: '6px',
        padding: '8px 12px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        border: '1px solid var(--border-mint)',
        boxShadow: '0 2px 12px rgba(16, 185, 129, 0.1)'
      }}>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask ANY question (e.g. 'What is frequency?', 'Calculate cost with capex 1200, fuel 8', 'Explain transformer %Z')..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontFamily: 'var(--font-body)',
            padding: '8px 10px'
          }}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputVal.trim() && !attachedFile}
          className="btn-primary"
          style={{
            padding: '10px 18px',
            opacity: inputVal.trim() || attachedFile ? 1 : 0.5,
            cursor: inputVal.trim() || attachedFile ? 'pointer' : 'not-allowed'
          }}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </div>
      </div>
    </div>
  );
}
