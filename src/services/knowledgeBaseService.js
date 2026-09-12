/**
 * Knowledge Base & Topic Training Service
 * Enables users to train GridMind on specific topics, power plants, tariffs,
 * standards, equipment, or custom domains.
 * Persists in localStorage and integrates with both Gemini LLM and the local engine.
 */

const STORAGE_KEY = 'gridmind_trained_topics_v1';

const DEFAULT_TRAINED_TOPICS = [
  {
    id: 'topic_bpdb_tariff_2026',
    title: 'Bangladesh BPDB Electricity Tariffs & Subsidies',
    category: 'Tariff & Policy',
    tags: ['bangladesh', 'bpdb', 'tariff', 'subsidies', 'bdt', 'berc'],
    updatedAt: '2026-09-10',
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
    this.topics = this.loadTopics();
  }

  loadTopics() {
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
      console.warn('Failed to load custom topics from localStorage:', e);
    }
    return [...DEFAULT_TRAINED_TOPICS];
  }

  saveTopics() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.topics));
      }
    } catch (e) {
      console.error('Failed to save topics to localStorage:', e);
    }
  }

  getTopics() {
    return [...this.topics];
  }

  getTopicById(id) {
    return this.topics.find(t => t.id === id) || null;
  }

  addTopic({ title, category = 'General', tags = [], content }) {
    if (!title || !content) {
      throw new Error('Title and Content are required to train a topic.');
    }
    const newTopic = {
      id: 'topic_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      category: category.trim() || 'Custom Training',
      tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      content: content.trim(),
      updatedAt: new Date().toISOString().split('T')[0]
    };
    this.topics.unshift(newTopic);
    this.saveTopics();
    return newTopic;
  }

  updateTopic(id, updates) {
    const idx = this.topics.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const tags = Array.isArray(updates.tags) 
      ? updates.tags 
      : typeof updates.tags === 'string'
        ? updates.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : this.topics[idx].tags;

    this.topics[idx] = {
      ...this.topics[idx],
      ...updates,
      tags,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    this.saveTopics();
    return this.topics[idx];
  }

  deleteTopic(id) {
    this.topics = this.topics.filter(t => t.id !== id);
    this.saveTopics();
    return true;
  }

  resetToDefaults() {
    this.topics = [...DEFAULT_TRAINED_TOPICS];
    this.saveTopics();
    return this.topics;
  }

  /**
   * Search knowledge base for matches to a query string
   * Returns matching topics sorted by relevance score
   */
  searchTopics(query) {
    if (!query || typeof query !== 'string') return [];
    const qLower = query.toLowerCase().trim();
    const queryTokens = qLower.split(/[\s,?.!;:()]+/).filter(t => t.length > 2);

    const scored = [];

    for (const topic of this.topics) {
      let score = 0;
      const titleLower = topic.title.toLowerCase();
      const contentLower = topic.content.toLowerCase();
      const categoryLower = topic.category.toLowerCase();
      const tags = (topic.tags || []).map(t => t.toLowerCase());

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

    let text = `\n\n[USER TRAINED CUSTOM KNOWLEDGE BASE]:\n`;
    text += `The user has explicitly trained GridMind with the following domain knowledge. Always prioritize and accurately incorporate these facts when asked:\n`;
    
    selected.forEach((t, i) => {
      text += `\n--- Topic ${i + 1}: ${t.title} [Category: ${t.category}] ---\n${t.content}\n`;
    });

    return text;
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
