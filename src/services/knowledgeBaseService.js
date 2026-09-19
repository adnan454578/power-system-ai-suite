/**
 * Knowledge Base & Topic Training Service
 * Enables users to train GridMind on specific topics, power plants, tariffs,
 * standards, equipment, or custom domains.
 * 
 * Supports Hybrid Persistence:
 * - Supabase PostgreSQL Cloud Database (trained_topics table)
 * - Browser localStorage cache & offline resilience
 * - Automatic background syncing & fallback
 */

import { supabaseManager } from './supabaseClient.js';

const STORAGE_KEY = 'gridmind_trained_topics_v1';

const DEFAULT_TRAINED_TOPICS = [
  {
    id: 'topic_bpdb_tariff_2026',
    title: 'Bangladesh BPDB Electricity Tariffs & Subsidies',
    category: 'Tariff & Policy',
    tags: ['bangladesh', 'bpdb', 'tariff', 'subsidies', 'bdt', 'berc'],
    updatedAt: '2026-09-10',
    source: 'seed',
    content: `**Bangladesh Power Development Board (BPDB) Tariff Structure:**
• **Retail Tariff Levels:**
  - Residential (Life-line 0-50 kWh): ৳4.35 / kWh
  - Residential Flat (above 300 kWh): ৳11.46 – ৳13.26 / kWh
  - Commercial / Offices: ৳13.50 – ৳16.00 / kWh
  - Heavy Industrial (11kV / 33kV): ৳9.70 – ৳11.80 / kWh (Peak: ৳14.50/kWh, Off-Peak: ৳8.90/kWh)
  - Agricultural Irrigation: ৳4.82 / kWh
• **Bulk Supply Tariff (BST):** Weighted average generation & transmission supply tariff is approximately ৳6.70 – ৳7.80 / kWh.
• **Capacity Payments:** Government contracts with IPPs include capacity charges averaging $12 – $18 / kW-month, regardless of plant dispatch.
• **Fuel Mix Impact:** High reliance on imported LNG ($10–$14/MMBtu) and HFO (৳75–৳85/liter) significantly increases bulk generation costs.`
  },
  {
    id: 'topic_transformer_impedance',
    title: 'Transformer Impedance & Short-Circuit Testing',
    category: 'Electrical Equipment',
    tags: ['transformer', 'impedance', 'percentage impedance', 'open circuit', 'short circuit'],
    updatedAt: '2026-09-10',
    source: 'seed',
    content: `**Transformer Percentage Impedance (%Z) & Testing:**
• **Definition:** %Z is the percentage of rated primary voltage required to circulate rated full-load current through the short-circuited secondary winding.
$$%Z = \\frac{V_{sc}}{V_{rated}} \\times 100$$
• **Typical Values:**
  - Distribution Transformers (11kV / 0.4kV, < 2.5 MVA): 4% – 5%
  - Medium Power Transformers (33kV / 11kV, 10–25 MVA): 7% – 9%
  - Large Transmission Transformers (230kV / 132kV, 150–250 MVA): 10% – 14%
  - Generator Step-Up (GSU, 15.75kV / 400kV): 12% – 16%
• **Fault Current Calculation:**
$$I_{sc} = \\frac{I_{fl}}{\\%Z / 100} = \\frac{S_{rated}}{\\sqrt{3} \\cdot V_{LL} \\cdot (\\%Z / 100)}$$
• **Loss Separation:**
  - Open-Circuit (No-Load) Test at rated voltage determines Core/Iron Loss ($P_0$).
  - Short-Circuit Test at rated current determines Full-Load Copper/I²R Loss ($P_k$).`
  },
  {
    id: 'topic_frequency_regulation',
    title: 'Primary Frequency Droop & Automatic Generation Control (AGC)',
    category: 'Grid Operations',
    tags: ['frequency', 'droop', 'speed governor', 'agc', 'inertia', '50 hz'],
    updatedAt: '2026-09-10',
    source: 'seed',
    content: `**Grid Frequency Regulation Hierarchy:**
• **Inertial Response (0 – 2 seconds):** Stored kinetic energy in rotating turbine-generator rotors ($E_k = \\frac{1}{2} J \\omega^2$). Limits Rate of Change of Frequency (RoCoF).
• **Primary Frequency Response / Droop (2 – 10 seconds):**
  - Governor droop characteristic $R$ (typically 4% to 5%):
  $$\\Delta P = -\\frac{P_{rated}}{R} \\cdot \\frac{\\Delta f}{f_0}$$
  - A 4% droop means a 4% frequency decline ($2.0\\text{ Hz}$ on 50Hz) causes a 100% active power increase.
• **Secondary Frequency Control / AGC (30s – 15 minutes):** Central SCADA / EMS algorithm restores system frequency strictly to 50.00 Hz and returns tie-line exchanges to scheduled interchange.
• **Tertiary Control / Reserve Dispatch (15 – 60 minutes):** Re-dispatches spinning and non-spinning reserves to restore secondary control margins.`
  },
  {
    id: 'topic_solar_pv_lcoe_bangladesh',
    title: 'Utility-Scale Solar PV Economics & Land Constraints in Bangladesh',
    category: 'Renewable Economics',
    tags: ['solar', 'pv', 'lcoe', 'bangladesh', 'land', 'tariff', 'capex'],
    updatedAt: '2026-09-10',
    source: 'seed',
    content: `**Utility-Scale Solar PV in Bangladesh:**
• **Overnight CAPEX:** $800 – $950 / kWp (৳96,000 – ৳114,000 / kWp).
• **Capacity Utilization Factor (CUF):** 18% – 21% (Global horizontal irradiance averages $4.5 – 5.0\\text{ kWh/m}^2/\\text{day}$).
• **Levelized Cost of Electricity (LCOE):** ৳8.50 – ৳11.00 / kWh ($70 – $92 / MWh).
• **Land Requirement:** Approximately 3.0 to 3.5 acres per MW of installed solar PV.
• **Key Challenges:**
  - High agricultural land cost and land acquisition complexity.
  - Silt deposition / dust on panels during dry winter requires frequent water cleaning.
  - High ambient temperature coefficients derate crystalline silicon panel output during summer months.`
  }
];

class KnowledgeBaseService {
  constructor() {
    this.topics = this.loadLocalCache();
    this.listeners = new Set();
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.lastError = null;

    // Trigger initial background sync if Supabase credentials exist
    if (supabaseManager.isConfigured()) {
      this.syncFromSupabase().catch(err => {
        console.warn('Initial Supabase KB sync notice:', err.message);
      });
    }
  }

  // ── Listener Subscription for Reactive UI ─────────────────────────
  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    return () => {};
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.getStatus());
      } catch (e) {
        console.error('KB listener notification error:', e);
      }
    }
  }

  // ── Local Storage Cache Layer ──────────────────────────────────────
  loadLocalCache() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load cached topics from localStorage:', e);
    }
    return [...DEFAULT_TRAINED_TOPICS];
  }

  saveLocalCache() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.topics));
      }
    } catch (e) {
      console.error('Failed to save topics to localStorage:', e);
    }
  }

  // ── Status & Metrics ───────────────────────────────────────────────
  getStatus() {
    const isConfigured = supabaseManager.isConfigured();
    const cloudTopics = this.topics.filter(t => t.source === 'cloud' || t.source === 'supabase');
    const localTopics = this.topics.filter(t => t.source !== 'cloud' && t.source !== 'supabase');

    return {
      isConfigured,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
      totalCount: this.topics.length,
      cloudCount: cloudTopics.length,
      localCount: localTopics.length,
      storageMode: isConfigured ? 'supabase' : 'local'
    };
  }

  getTopics() {
    return [...this.topics];
  }

  getTopicById(id) {
    return this.topics.find(t => t.id === id) || null;
  }

  // ── Supabase Cloud Synchronization ─────────────────────────────────
  /**
   * Fetch all topics from Supabase `trained_topics` table
   * Updates in-memory list and refreshes localStorage cache
   */
  async syncFromSupabase() {
    if (!supabaseManager.isConfigured()) {
      return { success: false, message: 'Supabase is not configured' };
    }

    const client = supabaseManager.getClient();
    if (!client) {
      return { success: false, message: 'Supabase client unavailable' };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notifyListeners();

    try {
      const { data, error } = await client
        .from('trained_topics')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (Array.isArray(data) && data.length > 0) {
        // Map database records to our client topic format
        const cloudTopics = data.map(row => ({
          id: row.id,
          title: row.title,
          category: row.category || 'General',
          tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? row.tags.split(',').map(t => t.trim()) : []),
          content: row.content,
          source: 'cloud',
          metadata: row.metadata || {},
          updatedAt: row.updated_at ? row.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]
        }));

        this.topics = cloudTopics;
        this.saveLocalCache();
        this.lastSyncTime = new Date().toLocaleTimeString();
        this.notifyListeners();
        return { success: true, count: cloudTopics.length };
      } else {
        // Table exists but is currently empty: offer to seed with default engineering knowledge
        this.lastSyncTime = new Date().toLocaleTimeString();
        this.notifyListeners();
        return { success: true, count: 0, isEmpty: true };
      }
    } catch (err) {
      this.lastError = err.message;
      console.warn('Supabase sync warning, using local cache:', err.message);
      this.notifyListeners();
      return { success: false, error: err.message };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Upload all local & default topics to Supabase `trained_topics` table
   */
  async syncLocalToSupabase() {
    if (!supabaseManager.isConfigured()) {
      throw new Error('Supabase is not configured. Please enter your Supabase URL and Anon Key first.');
    }

    const client = supabaseManager.getClient();
    if (!client) {
      throw new Error('Supabase client unavailable.');
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const payload = this.topics.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category || 'General',
        tags: Array.isArray(t.tags) ? t.tags : (typeof t.tags === 'string' ? t.tags.split(',').map(s => s.trim()) : []),
        content: t.content,
        source: 'cloud',
        metadata: t.metadata || {},
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await client
        .from('trained_topics')
        .upsert(payload, { onConflict: 'id' })
        .select();

      if (error) throw error;

      // Mark all in-memory topics as cloud synced
      this.topics = this.topics.map(t => ({ ...t, source: 'cloud' }));
      this.saveLocalCache();
      this.lastSyncTime = new Date().toLocaleTimeString();
      return { success: true, count: payload.length };
    } catch (err) {
      this.lastError = err.message;
      throw err;
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  // ── Topic CRUD Operations (Supabase-First + Local Fallback) ─────────
  async addTopic({ title, category = 'General', tags = [], content, metadata = {} }) {
    if (!title || !content) {
      throw new Error('Title and Content are required to train a topic.');
    }

    const isCloud = supabaseManager.isConfigured();
    const newTopic = {
      id: 'topic_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      category: category.trim() || 'Custom Training',
      tags: Array.isArray(tags) 
        ? tags.map(t => String(t).trim().toLowerCase()).filter(Boolean)
        : typeof tags === 'string' 
          ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) 
          : [],
      content: content.trim(),
      source: isCloud ? 'cloud' : 'local',
      metadata,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    // Optimistically update memory and localStorage cache
    this.topics.unshift(newTopic);
    this.saveLocalCache();
    this.notifyListeners();

    // Persist to Supabase if configured
    if (isCloud) {
      try {
        const client = supabaseManager.getClient();
        if (client) {
          const { error } = await client.from('trained_topics').insert({
            id: newTopic.id,
            title: newTopic.title,
            category: newTopic.category,
            tags: newTopic.tags,
            content: newTopic.content,
            source: 'cloud',
            metadata: newTopic.metadata,
            updated_at: new Date().toISOString()
          });

          if (error) {
            console.warn('Supabase insert warning (retained in local cache):', error.message);
            newTopic.source = 'local';
            this.saveLocalCache();
          }
        }
      } catch (err) {
        console.warn('Supabase addTopic error, persisted locally:', err.message);
        newTopic.source = 'local';
        this.saveLocalCache();
      }
    }

    return newTopic;
  }

  async updateTopic(id, updates) {
    const idx = this.topics.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const tags = Array.isArray(updates.tags) 
      ? updates.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean)
      : typeof updates.tags === 'string'
        ? updates.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : this.topics[idx].tags;

    const updated = {
      ...this.topics[idx],
      ...updates,
      tags,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    this.topics[idx] = updated;
    this.saveLocalCache();
    this.notifyListeners();

    // Persist to Supabase
    if (supabaseManager.isConfigured()) {
      try {
        const client = supabaseManager.getClient();
        if (client) {
          await client.from('trained_topics').update({
            title: updated.title,
            category: updated.category,
            tags: updated.tags,
            content: updated.content,
            metadata: updated.metadata || {},
            updated_at: new Date().toISOString()
          }).eq('id', id);
        }
      } catch (err) {
        console.warn('Supabase update error (retained locally):', err.message);
      }
    }

    return updated;
  }

  async deleteTopic(id) {
    this.topics = this.topics.filter(t => t.id !== id);
    this.saveLocalCache();
    this.notifyListeners();

    // Remove from Supabase
    if (supabaseManager.isConfigured()) {
      try {
        const client = supabaseManager.getClient();
        if (client) {
          await client.from('trained_topics').delete().eq('id', id);
        }
      } catch (err) {
        console.warn('Supabase delete error:', err.message);
      }
    }

    return true;
  }

  async resetToDefaults() {
    this.topics = [...DEFAULT_TRAINED_TOPICS];
    this.saveLocalCache();
    this.notifyListeners();

    // If Supabase is connected, offer to sync defaults to cloud
    if (supabaseManager.isConfigured()) {
      try {
        await this.syncLocalToSupabase();
      } catch (err) {
        console.warn('Supabase reset defaults sync notice:', err.message);
      }
    }

    return this.topics;
  }

  // ── Search & Prompt Context Injection ──────────────────────────────
  searchTopics(query) {
    if (!query || typeof query !== 'string') return [];
    const qLower = query.toLowerCase().trim();
    const queryTokens = qLower.split(/[\s,?.!;:()]+/).filter(t => t.length > 2);

    const scored = [];

    for (const topic of this.topics) {
      let score = 0;
      const titleLower = (topic.title || '').toLowerCase();
      const contentLower = (topic.content || '').toLowerCase();
      const categoryLower = (topic.category || '').toLowerCase();
      const tags = (topic.tags || []).map(t => String(t).toLowerCase());

      // Exact title match or title contains full query
      if (titleLower.includes(qLower) || qLower.includes(titleLower)) score += 100;

      // Tag exact match
      for (const tag of tags) {
        if (qLower.includes(tag)) score += 50;
        if (queryTokens.includes(tag)) score += 35;
      }

      // Token matches in title
      for (const token of queryTokens) {
        if (titleLower.includes(token)) score += 25;
        if (categoryLower.includes(token)) score += 15;
        if (contentLower.includes(token)) score += 8;
      }

      if (score > 20) {
        scored.push({ topic, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.topic);
  }

  /**
   * Format trained topics as context injection for LLM system prompt
   */
  getSystemPromptSnippet(maxTopics = 6) {
    const selected = this.topics.slice(0, maxTopics);
    if (selected.length === 0) return '';

    const sourceTag = supabaseManager.isConfigured() ? 'SUPABASE CLOUD DATABASE' : 'LOCAL CACHE';
    let text = `\n\n[USER TRAINED DOMAIN KNOWLEDGE BASE (${sourceTag})]:\n`;
    text += `The user has explicitly trained GridMind with the following verified engineering domain knowledge. Always prioritize and accurately incorporate these facts when asked:\n`;
    
    selected.forEach((t, i) => {
      text += `\n--- Topic ${i + 1}: ${t.title} [Category: ${t.category}] ---\n${t.content}\n`;
    });

    return text;
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
