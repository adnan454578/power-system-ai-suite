/**
 * LLM Service — Direct Gemini API & Open Generative Intelligence Integration
 * Resilient, high-performance Google Gemini REST client:
 * - 25-second adaptive request timeout (prevents premature cutoffs)
 * - Safe CORS handling (URL-based API key, no unnecessary preflight failures)
 * - Multi-model auto-fallback (gemini-1.5-flash ↔ gemini-2.0-flash ↔ gemini-1.5-pro)
 * - Comprehensive error diagnostics (Quota 429, Region 403, Invalid Key 400, Network/Ad-blocker)
 * - Multimodal image and document vision support
 * - Automatic cleaning of previous error banners in conversation history
 */

import { knowledgeBaseService } from './knowledgeBaseService.js';

const STORAGE_KEY = 'gridmind_gemini_api_key';
const MODEL_STORAGE_KEY = 'gridmind_gemini_model';

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Recommended — Latest & Fastest)', tag: 'Recommended' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Multimodal Vision)', tag: 'Fast' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Engineering Reasoning)', tag: 'Advanced' }
];

const DEFAULT_MODEL = 'gemini-3.6-flash';
const GENERATE_TIMEOUT_MS = 25000; // 25 seconds (realistic for generation)
const TEST_TIMEOUT_MS = 12000; // 12 seconds for ping

export class LLMService {
  constructor() {
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';
    this.apiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '') || envKey;

    // Migrate deprecated model IDs to current ones
    const DEPRECATED_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    const storedModel = (typeof localStorage !== 'undefined' ? localStorage.getItem(MODEL_STORAGE_KEY) : '') || '';
    if (!storedModel || DEPRECATED_MODELS.includes(storedModel)) {
      this.modelName = DEFAULT_MODEL;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MODEL_STORAGE_KEY, DEFAULT_MODEL);
      }
    } else {
      this.modelName = storedModel;
    }
  }

  getApiKey() {
    return this.apiKey || '';
  }

  setApiKey(key) {
    this.apiKey = (key || '').trim();
    if (typeof localStorage !== 'undefined') {
      if (this.apiKey) {
        localStorage.setItem(STORAGE_KEY, this.apiKey);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  getModel() {
    return this.modelName || DEFAULT_MODEL;
  }

  setModel(model) {
    if (model && AVAILABLE_MODELS.some(m => m.id === model)) {
      this.modelName = model;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MODEL_STORAGE_KEY, model);
      }
    }
  }

  getAvailableModels() {
    return AVAILABLE_MODELS;
  }

  hasApiKey() {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Comprehensive error diagnostic analyzer
   */
  diagnoseError(res, data, err) {
    if (err?.name === 'AbortError') {
      return {
        message: 'Gemini request timed out after 25 seconds. Google servers may be slow or your network connection has high latency.',
        type: 'timeout'
      };
    }

    if (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_CONNECTION_REFUSED')) {
        return {
          message: 'Network connection failed. Google Gemini API could not be reached. Please check your internet, VPN, or disable browser ad-blockers for this tab.',
          type: 'network'
        };
      }
      return { message: `Network/Fetch error: ${msg}`, type: 'network' };
    }

    if (res && !res.ok) {
      const errorObj = data?.error;
      const msg = errorObj?.message || res.statusText || 'Unknown error';
      const status = errorObj?.code || res.status;

      // 400 Invalid Key
      if (status === 400 && (msg.toLowerCase().includes('api key not valid') || msg.toLowerCase().includes('api_key_invalid'))) {
        return {
          message: 'Invalid Google Gemini API key. Please check and re-enter your key from Google AI Studio (aistudio.google.com/app/apikey).',
          type: 'invalid_key'
        };
      }

      // 429 Quota Exceeded / Rate limit
      if (status === 429 || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted')) {
        return {
          message: 'Gemini Free Tier Quota Exceeded (HTTP 429: Rate limit). Google AI Studio limits free requests to 15 RPM. Please wait 30 seconds before sending another message.',
          type: 'quota'
        };
      }

      // 403 Region unsupported
      if (status === 403 && (msg.toLowerCase().includes('user location') || msg.toLowerCase().includes('location is not supported'))) {
        return {
          message: 'Google Gemini API is not supported in your geographic region/country (HTTP 403: Location not supported). Please connect through a VPN or continue using the built-in offline engine.',
          type: 'region_blocked'
        };
      }

      // 404 Model not found
      if (status === 404 || msg.toLowerCase().includes('not found')) {
        return {
          message: `Model "${this.modelName}" not found or deprecated on Gemini API (${msg}).`,
          type: 'model_not_found'
        };
      }

      // 503 Overloaded
      if (status === 503 || status === 500) {
        return {
          message: `Google Gemini servers are temporarily overloaded (HTTP ${status}). Please retry in a few moments.`,
          type: 'server_overloaded'
        };
      }

      return {
        message: `Google API returned HTTP ${status}: ${msg}`,
        type: 'api_error'
      };
    }

    return {
      message: 'Gemini API was unreachable or timed out. Switched to offline engineering engine.',
      type: 'unknown'
    };
  }

  /**
   * Fast & accurate connection test for Settings Modal
   */
  async testConnection(testKey = this.apiKey, testModel = this.modelName) {
    const key = (testKey || '').trim();
    if (!key) {
      return { success: false, message: 'No API key entered. Paste your key from Google AI Studio.' };
    }

    const modelsToTest = [
      testModel || DEFAULT_MODEL,
      testModel !== 'gemini-3.6-flash' ? 'gemini-3.6-flash' : 'gemini-2.5-flash'
    ];

    let lastDiagnostic = null;

    for (const model of modelsToTest) {
      // Direct endpoint is preferred (no dependence on Vite dev proxy)
      const endpoints = [
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        `/gemini-api/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
      ];

      for (const ep of endpoints) {
        const startTime = Date.now();
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS);

          const res = await fetch(ep, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Respond with the word OK' }] }]
            }),
            signal: controller.signal
          });
          clearTimeout(timer);

          let data = null;
          try {
            data = await res.json();
          } catch (_) {
            // Non-JSON response (e.g., 404 HTML from missing proxy)
            continue;
          }

          if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const elapsed = Date.now() - startTime;
            this.modelName = model;
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(MODEL_STORAGE_KEY, model);
            }
            return {
              success: true,
              model,
              latencyMs: elapsed,
              message: `Connected successfully to Google Gemini (${model}) in ${elapsed}ms!`
            };
          }

          lastDiagnostic = this.diagnoseError(res, data, null);
          if (lastDiagnostic.type === 'invalid_key') {
            return { success: false, message: lastDiagnostic.message };
          }
        } catch (e) {
          lastDiagnostic = this.diagnoseError(null, null, e);
        }
      }
    }

    return {
      success: false,
      message: lastDiagnostic?.message || 'Could not connect to Gemini API. Check your internet connection or try saving your key anyway.'
    };
  }

  /**
   * Format contents with alternating roles and multimodal inlineData,
   * cleanly stripping previous connection error messages from history.
   */
  formatContents(chatHistory, userMessage, attachedFile = null) {
    const rawMessages = [];

    (chatHistory || []).forEach(msg => {
      let text = (msg.text || '').trim();
      if (!text) return;

      // Clean out previous connection error banners from history so they don't pollute Gemini prompt
      if (text.includes('Gemini AI Connection Note:') || text.includes('Switched to offline engineering engine')) {
        text = text.replace(/⚠️\s*\*\*Gemini AI Connection Note:\*\*[\s\S]*?\*Answering using[^*]*\*:\s*/gi, '').trim();
        text = text.replace(/⚠️\s*\*\*Gemini AI Connection Note:\*\*`[^`]*`/gi, '').trim();
        if (!text) return;
      }

      const role = msg.sender === 'bot' ? 'model' : 'user';
      rawMessages.push({ role, text });
    });

    // Ensure conversation starts with user
    while (rawMessages.length > 0 && rawMessages[0].role !== 'user') {
      rawMessages.shift();
    }

    // Merge consecutive messages from same role to ensure strict alternating pattern
    const sanitized = [];
    rawMessages.forEach(msg => {
      if (sanitized.length === 0) {
        sanitized.push({ ...msg });
      } else {
        const last = sanitized[sanitized.length - 1];
        if (last.role === msg.role) {
          last.text += '\n\n' + msg.text;
        } else {
          sanitized.push({ ...msg });
        }
      }
    });

    const recentHistory = sanitized.slice(-8);

    const contents = recentHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const latestUserParts = [];

    // Multimodal vision: send base64 for ANY image type
    const hasBase64 = attachedFile?.base64Data && attachedFile.base64Data.length > 10;
    const isImage = hasBase64 && (
      attachedFile?.mimeType?.startsWith('image/') ||
      attachedFile?.category?.toLowerCase().includes('image')
    );
    const isPdf = hasBase64 && (
      attachedFile?.mimeType === 'application/pdf' ||
      (attachedFile?.fileName || '').toLowerCase().endsWith('.pdf')
    );

    if (isImage || isPdf) {
      latestUserParts.push({
        inlineData: {
          mimeType: attachedFile.mimeType || (isImage ? 'image/jpeg' : 'application/pdf'),
          data: attachedFile.base64Data
        }
      });
    }

    let textPrompt = (userMessage || '').trim();
    if (!textPrompt) {
      if (isImage) {
        textPrompt = `Please provide a comprehensive summary and analysis of this uploaded image/photo: ${attachedFile.fileName}. Describe ALL visible content in detail.`;
      } else if (attachedFile) {
        textPrompt = `Please provide a comprehensive summary of this uploaded file: ${attachedFile.fileName} (${attachedFile.fileType}). Cover all key content, data, and findings.`;
      } else {
        textPrompt = 'Provide a comprehensive system analysis';
      }
    }

    // For non-image files: inject extracted text content so Gemini can read it
    if (attachedFile && !isImage && !isPdf) {
      const rawSnippet = (attachedFile.rawText || attachedFile.rawSnippet || '').slice(0, 12000);
      const tableSection = attachedFile.markdownTable ? `\n\nData Preview Table:\n${attachedFile.markdownTable}` : '';
      textPrompt = `[Attached File: ${attachedFile.fileName} (${attachedFile.fileType})]\n\nExtracted Content:\n${rawSnippet}${tableSection}\n\nUser Request: ${textPrompt}`;
    } else if (attachedFile && (isImage || isPdf)) {
      // For images/PDFs, just add filename context to text prompt
      textPrompt = `File: ${attachedFile.fileName}\n\n${textPrompt}`;
    }

    latestUserParts.push({ text: textPrompt });

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts = [...contents[contents.length - 1].parts, ...latestUserParts];
    } else {
      contents.push({
        role: 'user',
        parts: latestUserParts
      });
    }

    return contents;
  }

  /**
   * Resilient Gemini generateResponse with 25s timeout and detailed diagnostics
   */
  async generateResponse(userMessage, systemContext = {}) {
    if (!this.hasApiKey()) {
      return null;
    }

    const { gridSnapshot, attachedFile, chatHistory = [] } = systemContext;

    let systemText = `You are GridMind AI, an elite, universal Power System Engineering & Artificial Intelligence Assistant.
You can accurately answer ANY question in the world, including electrical power systems, generation cost calculation, tariffs in BDT (৳) and USD ($), mathematical derivations, physics, programming, data analysis, general knowledge, and any topic the user asks about.
Current Currency Context: Bangladeshi Taka (BDT ৳) and US Dollars (USD $). Exchange Rate: 1 USD = 120.00 BDT.

When cost calculations are relevant or requested, provide accurate figures in both BDT (৳/kWh, Crore ৳) and USD ($/MWh, Million $).
Format responses with clean Markdown, clear headings, bullet points, and LaTeX-style formulas ($$ equation $$) where appropriate.

FILE / PHOTO SUMMARIZATION RULES:
- If an IMAGE is attached, carefully describe ALL visible content: text, labels, numbers, charts, diagrams, people, objects, colors, layout, and any readable information. Provide a comprehensive structured summary.
- If a DOCUMENT (CSV, PDF, Word, Excel, JSON, code, text) is attached, read the provided content and produce a detailed structured summary covering: document type, key topics, important data points, statistics, tables, and any notable findings.
- Always produce a thorough, well-structured Markdown summary — never say "I cannot read this file".
- After the summary, suggest 3 relevant follow-up questions the user could ask about this file.`;

    if (gridSnapshot) {
      const elec = gridSnapshot.generatorUnit?.electrical;
      systemText += `\n\n[LIVE TELEMETRY]: Freq: ${gridSnapshot.frequency || 50.0}Hz, P: ${elec?.activePowerMw || 350}MW, V: ${elec?.lineVoltageKv || 15.75}kV, I: ${elec?.currentAmperes || 14500}A, PF: ${elec?.powerFactor || 0.887}`;
    }

    if (attachedFile) {
      systemText += `\n\n[DOCUMENT]: ${attachedFile.fileName} (${attachedFile.fileType})\nSummary: ${attachedFile.summary}`;
    }

    const kbSnippet = knowledgeBaseService.getSystemPromptSnippet(3);
    if (kbSnippet) {
      systemText += kbSnippet;
    }

    const contents = this.formatContents(chatHistory, userMessage, attachedFile);

    const payload = {
      systemInstruction: {
        parts: [{ text: systemText }]
      },
      contents,
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 4096,
        topP: 0.95
      }
    };

    // Priority model sequence: Active model → gemini-3.6-flash → gemini-2.5-flash
    const primaryModel = this.modelName || DEFAULT_MODEL;
    const fallbackModel = primaryModel === 'gemini-3.6-flash' ? 'gemini-2.5-flash' : 'gemini-3.6-flash';
    const modelsToTry = [primaryModel, fallbackModel];

    let lastDiagnostic = null;

    for (const model of modelsToTry) {
      // Direct Google endpoint first (no reliance on local dev proxy)
      const endpoints = [
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
        `/gemini-api/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`
      ];

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          clearTimeout(timer);

          let data = null;
          try {
            data = await res.json();
          } catch (_) {
            // HTML error page from proxy or static host; try next endpoint
            continue;
          }

          if (!res.ok) {
            lastDiagnostic = this.diagnoseError(res, data, null);

            // If key is invalid or quota is exceeded, no point continuing to hammer the API
            if (lastDiagnostic.type === 'invalid_key' || lastDiagnostic.type === 'quota' || lastDiagnostic.type === 'region_blocked') {
              return {
                error: lastDiagnostic.message,
                source: 'error',
                diagnosticType: lastDiagnostic.type
              };
            }

            continue; // Try next endpoint or model
          }

          const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (botText) {
            this.modelName = model;
            return { text: botText, source: 'gemini' };
          }
        } catch (err) {
          lastDiagnostic = this.diagnoseError(null, null, err);
          continue;
        }
      }
    }

    // Return detailed diagnostic error so the user knows the exact reason
    const errorMessage = lastDiagnostic?.message || 'Gemini API was unreachable or timed out after 25 seconds. Switched to offline engineering engine.';
    return {
      error: errorMessage,
      source: 'error',
      diagnosticType: lastDiagnostic?.type || 'unknown'
    };
  }
}

export const llmService = new LLMService();

