/**
 * GridMind AI — Universal Conversational Intelligence & Engineering Engine
 * Handles ANY free-form question accurately:
 * - Direct Gemini Generative AI (multimodal vision + live telemetry + custom trained KB)
 * - Persistent Custom Trained Knowledge Base (user-trained topics)
 * - Robust keyword/semantic topic router with complete electrical science derivations
 * - Universal manual cost parsing & calculation in dual currency (BDT ৳ and USD $)
 */

import { calculateLCOE, POWER_PLANT_PRESETS, FUEL_TYPES, calculateGeneratorElectricalParameters } from './powerCalculations.js';
import { currencyService } from './currencyService.js';
import { fileReaderService } from './multiModalFileReader.js';
import { llmService } from './llmService.js';
import { knowledgeBaseService } from './knowledgeBaseService.js';

// ─── Main Dispatcher ────────────────────────────────────────────────────────

export async function processChatMessage(userMessage, currentContext = {}) {
  const text = (userMessage || '').trim();
  const lower = text.toLowerCase();
  const { gridSnapshot = null, attachedFile = null, chatHistory = [] } = currentContext;

  // 1. Direct Training Command from Chat (e.g., "Train topic: Solar PPA Rate | Details: ...")
  const trainMatch = text.match(/^train\s*(?:topic)?:\s*([^|\n]+)(?:\||category:)(?:category:\s*([^|\n]+)\|)?(?:details:|\s*content:|\s*-)\s*([\s\S]+)/i);
  if (trainMatch) {
    const title = trainMatch[1].trim();
    const category = (trainMatch[2] || 'Chat Trained').trim();
    const content = trainMatch[3].trim();
    try {
      const added = knowledgeBaseService.addTopic({ title, category, content });
      return buildBotMsg(
        `🎓 **Topic Trained Successfully into GridMind Knowledge Base!**\n\n` +
        `• **Title:** \`${added.title}\`\n` +
        `• **Category:** \`${added.category}\`\n` +
        `• **Learned Content:**\n> ${added.content.replace(/\n/g, '\n> ')}\n\n` +
        `GridMind will now utilize this knowledge when answering your questions in both online (Gemini) and offline modes!`
      );
    } catch (err) {
      return buildBotMsg(`⚠️ Error training topic: ${err.message}`);
    }
  }

  // 2. Try Gemini LLM first if API key is active
  if (llmService.hasApiKey()) {
    const llmResult = await llmService.generateResponse(userMessage, currentContext);

    if (llmResult?.source === 'gemini' && llmResult.text) {
      const widget = buildCostWidget(lower, attachedFile);
      return buildBotMsg(llmResult.text, widget);
    }

    if (llmResult?.source === 'error') {
      // Show informative error banner and seamlessly fall back to local knowledge engine
      const localResult = localAnswer(text, lower, gridSnapshot, attachedFile);
      return buildBotMsg(
        `⚠️ **Gemini AI Notice:** ${llmResult.error}\n\n` +
        `*Answering seamlessly using GridMind Built-in & Trained Knowledge Base:*\n\n` +
        localResult.text,
        localResult.widget || buildCostWidget(lower, attachedFile)
      );
    }
  }

  // 3. Full Local Intelligence Engine (Offline / Local Mode)
  const localResult = localAnswer(text, lower, gridSnapshot, attachedFile);
  return buildBotMsg(localResult.text, localResult.widget || buildCostWidget(lower, attachedFile));
}

// ─── Build Helpers ──────────────────────────────────────────────────────────

function buildBotMsg(text, widget = null) {
  return { sender: 'bot', timestamp: new Date().toLocaleTimeString(), text, widget };
}

function buildCostWidget(lower, attachedFile) {
  if (lower.includes('lcoe') || lower.includes('total cost') || lower.includes('calculate cost') ||
      (attachedFile?.isCostRelated)) {
    const costs = attachedFile?.costs || fileReaderService.computeTotalCosts({ capacityMw: 200 });
    return { type: 'total_cost_card', data: costs };
  }
  return null;
}

// ─── Local Universal Answer Engine ─────────────────────────────────────────

function localAnswer(text, lower, gridSnapshot, attachedFile) {
  // 1. Uploaded Document / File / Photo Questions
  // Trigger on any summarization intent, or if message is short (likely a follow-up about the file)
  if (attachedFile && (
    /file|document|csv|pdf|image|photo|picture|sheet|dataset|analyze|summar|descri|what.*show|tell.*about|explain.*file|content|read.*file/i.test(lower) ||
    text.length < 40
  )) {
    return { text: docAnswer(text, lower, attachedFile) };
  }

  // 2. Natural Language Manual Cost Calculation Parser
  // e.g. "calculate cost capex 1100 fuel 7 cf 0.8 size 300"
  if (/calculate.*cost|compute.*cost|lcoe.*calc|cost.*with.*capex/i.test(lower) && /\d+/.test(lower)) {
    const parsedCost = parseManualCostQuery(lower);
    if (parsedCost) {
      return {
        text: parsedCost.markdown,
        widget: { type: 'total_cost_card', data: parsedCost.data }
      };
    }
  }

  // 3. Mathematical Equation Solver
  const math = solveMath(text);
  if (math) return { text: math };

  // 4. Fundamental Direct Questions (Frequency, Voltage, Current, Power)
  if (/^(?:what is|explain|define|tell me about)?\s*(?:electrical\s*)?freq(uency)?\b/i.test(lower) || lower === 'frequency') {
    return { text: topicFrequency() };
  }
  if (/^(?:what is|explain|define)?\s*(?:electrical\s*)?volt(age)?\b/i.test(lower) || lower === 'voltage') {
    return { text: topicVoltage() };
  }
  if (/^(?:what is|explain|define)?\s*(?:electric\s*)?current\b/i.test(lower) || lower === 'current') {
    return { text: topicCurrent() };
  }

  // 5. User-Trained Custom Knowledge Base Lookup
  const matchedTopics = knowledgeBaseService.searchTopics(text);
  if (matchedTopics.length > 0) {
    const top = matchedTopics[0];
    let reply = `🎓 **GridMind Knowledge Base: \`${top.title}\`**\n` +
                `*Category: ${top.category} | Updated: ${top.updatedAt || 'Recent'}*\n\n` +
                top.content;
    
    if (matchedTopics.length > 1) {
      reply += `\n\n*Related Trained Topics: ${matchedTopics.slice(1, 3).map(t => `\`${t.title}\``).join(', ')}*`;
    }
    return { text: reply };
  }

  // 6. Robust Keyword/Regex Matcher for Engineering Topics
  if (/\bfreq(uency)?\b|50\s*hz|60\s*hz|\bhz\b/i.test(lower)) return { text: topicFrequency() };
  if (/\bvolt(age)?\b|potential\s*difference|\bkv\b|\bvolts?\b/i.test(lower)) return { text: topicVoltage() };
  if (/\bcurrent\b|amperes?|\bamps?\b|stator\s*current/i.test(lower)) return { text: topicCurrent() };
  if (/\bactive\s*power\b|real\s*power|\bmw\b|megawatts?/i.test(lower) && !lower.includes('cost')) return { text: topicActivePower() };
  if (/\breactive\s*power\b|\bmvar\b|\bvar\s*comp/i.test(lower)) return { text: topicReactivePower() };
  if (/\bpower\s*factor\b|\bpf\b|cos\s*phi|lagging|leading\s*pf/i.test(lower)) return { text: topicPowerFactor() };
  if (/\bapparent\s*power\b|\bmva\b|\bkva\b/i.test(lower)) return { text: topicApparentPower() };
  if (/\brpm\b|synchronous\s*speed|machine\s*speed|generator\s*speed/i.test(lower)) return { text: topicRpm() };
  if (/\btransformer\b|copper\s*loss|core\s*loss|turns?\s*ratio|gsu\b/i.test(lower)) return { text: topicTransformer() };
  if (/\bferranti\b|lightly\s*loaded\s*line/i.test(lower)) return { text: topicFerranti() };
  if (/\bfault\b|short\s*circuit|symmetrical\s*fault|per\s*unit/i.test(lower)) return { text: topicFaultAnalysis() };
  if (/\bswing\s*equation\b|rotor\s*angle|rocof|inertia\s*constant/i.test(lower)) return { text: topicSwingEq() };
  if (/\bbess\b|battery\s*storage|energy\s*storage|\blcos\b/i.test(lower)) return { text: topicBess() };
  if (/\bscada\b|modbus|iec\s*61850|dnp3|holding\s*register/i.test(lower)) return { text: topicScada() };
  if (/\bgenerator\b|synchronous\s*machine|alternator|stator|rotor|excitation/i.test(lower)) return { text: topicGenerator() };
  if (/\bsolar\b|photovoltaic|\bpv\b|irradiance|\bmppt\b/i.test(lower)) return { text: topicSolar() };
  if (/\bwind\s*(turbine|power|farm)?\b|weibull|cut-in/i.test(lower)) return { text: topicWind() };
  if (/\bhydro(electric)?\b|penstock|kaplan|pelton/i.test(lower)) return { text: topicHydro() };
  if (/\brelay\b|circuit\s*breaker|overcurrent|differential\s*relay|protection/i.test(lower)) return { text: topicProtection() };
  if (/\blcoe\b|leveli[sz]ed\s*cost/i.test(lower)) return { text: topicLcoe() };
  if (/\bheat\s*rate\b|thermal\s*efficiency|btu\/kwh/i.test(lower)) return { text: topicHeatRate() };
  if (/\b(total\s*cost|calculate\s*cost|capex|opex|cost\s*of\s*generation|cost\s*per\s*kwh)\b/i.test(lower)) return { text: topicCostCalc(lower) };
  if (/\b(live\s*data|hardware|telemetry|modbus\s*register|status\s*now)\b/i.test(lower)) return { text: topicLiveHardware(gridSnapshot) };
  if (/\bohm\b|resistance|impedance|reactance/i.test(lower)) return { text: topicOhmImpedance() };
  if (/\bcapacitor\b|capacitance|shunt\s*capacitor/i.test(lower)) return { text: topicCapacitor() };
  if (/\binductor\b|inductance|shunt\s*reactor/i.test(lower)) return { text: topicInductor() };
  if (/\bfuel\b|natural\s*gas|\bhfo\b|diesel\s*fuel|coal\s*fuel/i.test(lower)) return { text: topicFuels() };
  if (/\b(bangladesh|bpdb|pdb|desco|dpdc|pgcb)\b/i.test(lower)) return { text: topicBangladeshGrid() };
  if (/\b(harmonic|harmonics|thd|power\s*quality)\b/i.test(lower)) return { text: topicHarmonics() };
  if (/\b(substation|switchyard|isolator|busbar)\b/i.test(lower)) return { text: topicSubstation() };

  // 6. Context-Aware Intelligent Synthesis
  return { text: genericAnswer(text) };
}

// ─── Natural Language Manual Cost Parser ───────────────────────────────────

function parseManualCostQuery(lower) {
  let capex = 1000;
  let fuelPrice = 6.5;
  let cf = 0.70;
  let sizeMw = 200;
  let lifetime = 25;

  const capexMatch = lower.match(/capex\s*[:=]?\s*(\d+(\.\d+)?)/i) || lower.match(/(\d+)\s*\$?\/?kw/i);
  if (capexMatch) capex = parseFloat(capexMatch[1]);

  const fuelMatch = lower.match(/fuel\s*[:=]?\s*(\d+(\.\d+)?)/i) || lower.match(/(\d+(\.\d+)?)\s*\$?\/?mmbtu/i);
  if (fuelMatch) fuelPrice = parseFloat(fuelMatch[1]);

  const cfMatch = lower.match(/(?:cf|capacity\s*factor)\s*[:=]?\s*(\d+(\.\d+)?)/i);
  if (cfMatch) {
    let val = parseFloat(cfMatch[1]);
    if (val > 1) val = val / 100;
    cf = val;
  }

  const mwMatch = lower.match(/(\d+)\s*mw/i) || lower.match(/(?:capacity|size)\s*[:=]?\s*(\d+)/i);
  if (mwMatch) sizeMw = parseInt(mwMatch[1], 10);

  const costs = fileReaderService.computeTotalCosts({
    capacityMw: sizeMw,
    capexUsdKw: capex,
    fuelType: 'natural_gas',
    heatRateBtuKwh: 6500,
    capacityFactor: cf,
    lifetimeYears: lifetime
  });

  const rate = currencyService.getExchangeRate();

  const markdown = `### 💰 Custom Manual Cost Evaluation (${sizeMw} MW Plant)\n\n` +
    `**User Specified Inputs:**\n` +
    `• **CAPEX:** \`$${capex}/kW\` (\`৳${Math.round(capex * rate).toLocaleString()}/kW\`)\n` +
    `• **Fuel Price:** \`$${fuelPrice}/MMBtu\` (\`৳${(fuelPrice * rate).toFixed(1)}/MMBtu\`)\n` +
    `• **Capacity Factor:** \`${(cf * 100).toFixed(0)}%\` | **Plant Size:** \`${sizeMw} MW\`\n\n` +
    `**Dual-Currency Results:**\n` +
    `• **Levelized Tariff (LCOE):** \`৳ ${costs.lcoeBdtPerKwh} / kWh\` (\`$ ${costs.lcoeUsdPerMwh} / MWh\`)\n` +
    `• **Total Capital Cost (CAPEX):** \`৳ ${costs.totalCapexCroreBdt.toLocaleString()} Crore\` (\`$ ${costs.totalCapexMillionUsd} Million\`)\n` +
    `• **Annual Operating Cost:** \`৳ ${costs.annualOperatingCostCroreBdt.toLocaleString()} Crore / yr\` (\`$ ${costs.annualOperatingCostMillionUsd} M / yr\`)\n` +
    `• **Exchange Rate Applied:** \`1 USD = ${rate.toFixed(2)} BDT\``;

  return { markdown, data: costs };
}

// ─── Math Solver ────────────────────────────────────────────────────────────

function solveMath(text) {
  // 3-Phase AC Formula: V=, I=, pf=
  const vMatch = text.match(/v\s*[:=]\s*([\d.]+)\s*(kv)?/i);
  const iMatch = text.match(/i\s*[:=]\s*([\d.]+)\s*(a|amp)?/i);
  const pfMatch = text.match(/(?:pf|cos\s*phi)\s*[:=]\s*(0\.[\d]+)/i);

  if (vMatch && iMatch) {
    const v = parseFloat(vMatch[1]);
    const i = parseFloat(iMatch[1]);
    const pf = pfMatch ? parseFloat(pfMatch[1]) : 0.88;
    const p = (Math.sqrt(3) * v * 1e3 * i * pf) / 1e6;
    const q = (Math.sqrt(3) * v * 1e3 * i * Math.sqrt(Math.max(0, 1 - pf * pf))) / 1e6;
    const s = (Math.sqrt(3) * v * 1e3 * i) / 1e6;
    return `### ⚡ 3-Phase AC Power Calculation\n\n` +
           `Given: $V_{LL} = ${v}\\text{ kV}$, $I_L = ${i}\\text{ A}$, $\\cos\\phi = ${pf}$\n\n` +
           `• **Active Power ($P$):** $$P = \\sqrt{3} \\cdot V_{LL} \\cdot I_L \\cdot \\cos\\phi = ${p.toFixed(2)}\\text{ MW}$$\n` +
           `• **Reactive Power ($Q$):** $$Q = \\sqrt{3} \\cdot V_{LL} \\cdot I_L \\cdot \\sin\\phi = ${q.toFixed(2)}\\text{ MVAr}$$\n` +
           `• **Apparent Power ($S$):** $$S = \\sqrt{3} \\cdot V_{LL} \\cdot I_L = ${s.toFixed(2)}\\text{ MVA}$$`;
  }

  // Pure arithmetic
  const arith = text.replace(/calculate|what is|compute|=/gi, '').trim();
  if (/^[\d\s+\-*/.()^sqrtpieE]+$/i.test(arith) && /[+\-*/]/.test(arith)) {
    try {
      const safe = arith.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)').replace(/\^/g, '**').replace(/pi/gi, 'Math.PI');
      const result = Function(`'use strict'; return (${safe})`)();
      if (typeof result === 'number' && !isNaN(result)) {
        return `### 🔢 Calculation Result\n\n$$${arith} = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })}$$`;
      }
    } catch (_) {}
  }

  return null;
}

// ─── Document / File Question Answerer ──────────────────────────────────────

function docAnswer(query, lower, doc) {
  const isFinancialQuery = lower.includes('cost') || lower.includes('price') || lower.includes('bdt') || lower.includes('tariff') || lower.includes('capex');

  if (isFinancialQuery && doc.costs) {
    const costs = doc.costs;
    return `### 💰 Financial Cost Breakdown for \`${doc.fileName}\`:\n\n` +
           `• **Levelized Tariff (LCOE):** \`৳ ${costs.lcoeBdtPerKwh} / kWh\` (\`$ ${costs.lcoeUsdPerMwh} / MWh\`)\n` +
           `• **Total Capital Cost (CAPEX):** \`৳ ${costs.totalCapexCroreBdt?.toLocaleString()} Crore\` (\`$ ${costs.totalCapexMillionUsd} Million\`)\n` +
           `• **Annual Operating Cost:** \`৳ ${costs.annualOperatingCostCroreBdt?.toLocaleString()} Crore / yr\` (\`$ ${costs.annualOperatingCostMillionUsd} M / yr\`)\n` +
           `• **Exchange Rate:** \`1 USD = ${currencyService.getExchangeRate().toFixed(2)} BDT\``;
  }

  const fileType = (doc.fileType || '').toLowerCase();
  const fileName = doc.fileName || 'document';

  // ── Image / Photo ──────────────────────────────────────────────────────────
  if (fileType.includes('image') || fileType.includes('visual') || fileType.includes('photo') ||
      doc.previewUrl || doc.base64Data) {
    const dim = doc.dimensions;
    const dimStr = dim?.width > 0 ? `${dim.width} × ${dim.height} px (${dim.aspectRatio})` : 'Unknown resolution';
    return `🖼️ **Image / Photo Summary: \`${fileName}\`**\n\n` +
           `• **File Type:** ${doc.mimeType || 'Image'} | **Resolution:** ${dimStr}\n` +
           `• **Category Detected:** ${doc.category || 'General Image'}\n\n` +
           `${doc.summary || '*(Image content loaded successfully.)*'}\n\n` +
           `---\n` +
           `> 💡 **Tip:** For a full AI visual analysis, save a **Gemini API key** in ⚙️ Settings and re-upload. Gemini Vision will read and describe the actual content of the image in detail.\n\n` +
           `**Suggested questions you can ask:**\n` +
           `• *"What does this image show?"*\n` +
           `• *"Read the text visible in this image"*\n` +
           `• *"Describe all equipment and labels in this photo"*`;
  }

  // ── CSV / Spreadsheet ──────────────────────────────────────────────────────
  if (fileType.includes('csv') || fileType.includes('spreadsheet')) {
    let reply = `📊 **${doc.fileType} Summary: \`${fileName}\`**\n\n`;
    reply += doc.summary || '';
    if (doc.markdownTable) {
      reply += `\n\n**Data Preview:**\n\n${doc.markdownTable}`;
    }
    reply += `\n\n*💡 Ask me specific questions about columns, rows, statistics, or request cost calculations in BDT & USD!*`;
    return reply;
  }

  // ── Excel ──────────────────────────────────────────────────────────────────
  if (fileType.includes('excel')) {
    return `📗 **Excel Spreadsheet Summary: \`${fileName}\`**\n\n` +
           `${doc.summary || '*Excel workbook loaded.*'}\n\n` +
           `*💡 Ask about specific cells, sheets, formulas, or request statistical analysis!*`;
  }

  // ── Word Document ──────────────────────────────────────────────────────────
  if (fileType.includes('word') || fileType.includes('document')) {
    return `📝 **Word Document Summary: \`${fileName}\`**\n\n` +
           `${doc.summary || '*Document content loaded.*'}\n\n` +
           `${doc.rawText && doc.rawText.length > 50 ? `**Extracted Content Preview:**\n> ${doc.rawText.slice(0, 600).replace(/\n/g, '\n> ')}\n` : ''}` +
           `*💡 Ask about specific sections, key points, or request a detailed analysis!*`;
  }

  // ── JSON / Data ────────────────────────────────────────────────────────────
  if (fileType.includes('json')) {
    let reply = `📋 **JSON Data Summary: \`${fileName}\`**\n\n`;
    reply += doc.summary || '';
    if (doc.markdownTable) {
      reply += `\n\n**Records Preview:**\n\n${doc.markdownTable}`;
    }
    reply += `\n\n*💡 Ask about specific fields, record counts, or data relationships!*`;
    return reply;
  }

  // ── PDF ────────────────────────────────────────────────────────────────────
  if (fileType.includes('pdf')) {
    return `📄 **PDF Document Summary: \`${fileName}\`**\n\n` +
           `${doc.summary || '*PDF content loaded.*'}\n\n` +
           `${doc.rawText && doc.rawText.length > 50 ? `**Extracted Text Preview:**\n> ${doc.rawText.slice(0, 500).replace(/\n/g, '\n> ')}\n` : ''}` +
           `*💡 Ask about specific sections, technical data, or request a cost analysis!*`;
  }

  // ── Code / Text / Log / Fallback ───────────────────────────────────────────
  const isCode = /code|script|source|program/i.test(fileType);
  const isLog = /log|audit|trace/i.test(fileType);
  const emoji = isCode ? '💻' : isLog ? '🪵' : '📄';

  return `${emoji} **${doc.fileType || 'File'} Summary: \`${fileName}\`**\n\n` +
         `${doc.summary || ''}\n\n` +
         `${doc.rawText && doc.rawText.length > 80 ? `**Content Preview:**\n\`\`\`\n${doc.rawText.slice(0, 800)}\n\`\`\`\n` : ''}` +
         `*💡 You can ask about this file's content, request analysis, or copy specific sections!*`;
}


// ─── Predefined Engineering Topic Handlers ──────────────────────────────────

function topicFrequency() {
  return `### ⚡ What is Electrical Frequency?

**Frequency ($f$)** is the number of complete AC cycles per second in an electrical power system, measured in **Hertz (Hz)**:

$$f = \\frac{1}{T} = \\frac{\\omega}{2\\pi}$$

where $T$ is the period (seconds per cycle) and $\\omega$ is the angular frequency (rad/s).

**Standard Grid Frequencies:**
• **50 Hz** — Used in Bangladesh 🇧🇩, UK, Europe, India, Australia, Africa, Asia.
• **60 Hz** — Used in USA 🇺🇸, Canada, parts of Latin America, Japan (half).

**Why Frequency Matters in Power Systems:**
• **Active Power Equilibrium:** Frequency is the single universal indicator of real-time supply vs demand balance across the entire interconnected grid.
  - Generation = Load $\\rightarrow f = 50.00\\text{ Hz}$ (Nominal & stable).
  - Load > Generation $\\rightarrow f$ **drops** below 50.00 Hz (generators decelerate).
  - Generation > Load $\\rightarrow f$ **rises** above 50.00 Hz (generators accelerate).

**Synchronous Generator Frequency Equation:**
$$f = \\frac{N_s \\times P}{120}$$

where $N_s$ = synchronous speed (RPM), $P$ = number of stator poles.

| Poles ($P$) | Synchronous Speed at 50 Hz | Synchronous Speed at 60 Hz |
|:-----------:|:--------------------------:|:--------------------------:|
| 2           | 3000 RPM                   | 3600 RPM                   |
| 4           | 1500 RPM                   | 1800 RPM                   |
| 6           | 1000 RPM                   | 1200 RPM                   |
| 8           | 750 RPM                    | 900 RPM                    |`;
}

function topicVoltage() {
  return `### ⚡ What is Electrical Voltage ($V$)?

**Voltage** (Electromotive Force or Potential Difference) is the energy required per unit charge to move electrons between two points in an electrical circuit, measured in **Volts (V)** or **kilovolts (kV)**:

$$V = \\frac{W}{Q} = I \\cdot R \\quad (\\text{Ohm's Law})$$

**Standard Voltage Hierarchy in Bangladesh (BPDB / PGCB):**
| Level | Voltage | Application |
|:------|:--------|:------------|
| Ultra-High Transmission | 400 kV | Regional Interconnectors & Cross-Border Lines |
| National Grid Backbone | 230 kV, 132 kV | Major Substation Grid Rings |
| Sub-Transmission | 33 kV | District Substations to City Feeders |
| Primary Distribution | 11 kV | Urban Distribution Substations |
| Secondary Distribution | 400 V / 230 V | 3-Phase Commercial / Single-Phase Residential |
| Generator Terminal | 11 kV – 22 kV | Power Station Synchronous Output |

**3-Phase Line vs Phase Voltage Relationship:**
$$V_{LL} = \\sqrt{3} \\cdot V_{LN} \\angle 30^\\circ$$`;
}

function topicCurrent() {
  return `### ⚡ What is Electric Current ($I$)?

**Current** is the continuous flow rate of electric charge passing through a cross-section of a conductor, measured in **Amperes (A)**:

$$I = \\frac{dQ}{dt} = \\frac{V}{Z}$$

**3-Phase Full-Load Current Equation:**
$$I_L = \\frac{S}{\\sqrt{3} \\cdot V_{LL}} = \\frac{P}{\\sqrt{3} \\cdot V_{LL} \\cdot \\cos\\phi}$$

**Example:** A 350 MW generator operating at $15.75\\text{ kV}$ and $\\cos\\phi = 0.887$:
$$I_L = \\frac{350 \\times 10^6}{\\sqrt{3} \\times 15,750 \\times 0.887} \\approx 14,500\\text{ Amperes}$$`;
}

function topicActivePower() {
  return `### ⚡ Active (Real) Power ($P$)

**Active Power** (measured in **Watts, kW, MW**) is the actual net electrical energy transferred per unit time that performs physical useful work (turning motors, producing heat, emitting light):

$$P = \\sqrt{3} \\cdot V_{LL} \\cdot I_L \\cdot \\cos\\phi$$

• Directly coupled to system **frequency ($f$)**.
• Supplied by fuel energy (steam turbine, gas combustion, water flow, solar radiation).
• Transmitted via transmission lines with small $I^2 R$ heat losses.`;
}

function topicReactivePower() {
  return `### ⚡ Reactive Power ($Q$)

**Reactive Power** (measured in **VAr, kVAr, MVAr**) is the alternating energy that oscillates back and forth between inductive (magnetic) and capacitive (electric) fields each cycle, without doing net physical work:

$$Q = \\sqrt{3} \\cdot V_{LL} \\cdot I_L \\cdot \\sin\\phi$$

**Key Role in Power Systems:**
• **Supports Voltage:** Reactive power is mandatory to maintain voltage levels across the transmission network.
• **Transformers & Induction Motors:** Require magnetic field excitation ($Q > 0$, lagging).
• **Compensation Devices:** Shunt capacitor banks, STATCOMs, and Synchronous Condensers inject reactive power locally to keep bus voltages near $1.0\\text{ p.u.}$.`;
}

function topicPowerFactor() {
  return `### ⚡ Power Factor ($\\cos\\phi$)

**Power Factor** is the ratio of real active power ($P$) to apparent power ($S$):

$$\\text{PF} = \\frac{P}{S} = \\cos\\phi = \\frac{R}{|Z|}$$

• **Lagging PF:** Current lags voltage (inductive loads like induction motors, transformers).
• **Leading PF:** Current leads voltage (capacitive loads, lightly loaded underground cables).
• **Unity PF (1.0):** Purely resistive load ($P = S, Q = 0$).
• **Utility Penalties:** Utilities impose penalty surcharges if industrial consumers operate below $0.90 – 0.95$ power factor.`;
}

function topicApparentPower() {
  return `### ⚡ Apparent Power ($S$)

**Apparent Power** is the total vector magnitude of power flowing in an AC circuit, measured in **Volt-Amperes (VA, kVA, MVA)**:

$$S = \\sqrt{P^2 + Q^2} = \\sqrt{3} \\cdot V_{LL} \\cdot I_L$$

• Determines the physical thermal sizing of generators, transformers, switchgear, and conductors.`;
}

function topicRpm() {
  return `### ⚡ Machine Speed (RPM) & Synchronous Velocity

The synchronous mechanical rotational velocity of an AC synchronous generator rotor is strictly locked to grid frequency:

$$N_s = \\frac{120 \\times f}{P}$$

where $f$ = frequency in Hz, $P$ = number of magnetic poles.

• For a 2-pole generator at 50 Hz (e.g. Bangladesh grid):
$$N_s = \\frac{120 \\times 50}{2} = 3000\\text{ RPM}$$
• For a 4-pole generator at 50 Hz:
$$N_s = \\frac{120 \\times 50}{4} = 1500\\text{ RPM}$$`;
}

function topicTransformer() {
  return `### ⚡ Transformers: Principles & Loss Formulations

**Voltage Transformation Ratio:**
$$\\frac{V_1}{V_2} = \\frac{N_1}{N_2} = \\frac{I_2}{I_1} = a$$

**Total Transformer Losses ($P_{\\text{loss}}$):**
$$P_{\\text{loss}} = P_{\\text{core}} + P_{\\text{copper}}$$

1. **No-Load / Core Loss ($P_{\\text{core}}$):**
   - **Hysteresis Loss:** $P_h = k_h \\cdot f \\cdot B_{\\text{max}}^{1.6}$
   - **Eddy Current Loss:** $P_e = k_e \\cdot f^2 \\cdot B_{\\text{max}}^2 \\cdot t^2$
   - Evaluated by **Open-Circuit Test** at rated voltage. Constant regardless of load current!

2. **Full-Load Copper Loss ($P_{\\text{copper}}$):**
   $$P_{\\text{cu}} = I_1^2 R_1 + I_2^2 R_2 = I^2 R_{\\text{eq}}$$
   - Evaluated by **Short-Circuit Test** at rated current. Varies with square of load fraction: $P_{\\text{cu}}(x) = x^2 \\cdot P_{\\text{cu,fl}}$.`;
}

function topicFerranti() {
  return `### ⚡ Ferranti Effect on Long Transmission Lines

**Phenomenon:** The receiving-end voltage ($V_R$) rises higher than the sending-end voltage ($V_S$) under no-load or lightly loaded conditions on long AC transmission lines (> 100 km):

$$V_R = \\frac{V_S}{\\cos(\\beta \\cdot l)} \\approx V_S \\left(1 + \\frac{\\omega^2 L C \\cdot l^2}{2}\\right)$$

**Cause:** Line charging current flowing through the line series inductance produces an in-phase voltage boost.

**Mitigation:**
• Connect **Shunt Reactors** at line substations to absorb capacitive VArs.
• Utilize FACTS devices (STATCOM or SVC) for dynamic voltage clamping.`;
}

function topicFaultAnalysis() {
  return `### ⚡ Short-Circuit & Fault Analysis

**Symmetrical Fault Current:**
$$I_{sc} = \\frac{V_{\\text{prefault}}}{Z_{\\text{Thevenin}}} = \\frac{I_{\\text{rated}}}{\\text{p.u. Impedance}}$$

**Subtransient, Transient & Steady-State Regimes:**
• Subtransient ($X''_d$, 1–2 cycles): Highest current, determines circuit breaker making capacity.
• Transient ($X'_d$, 10–30 cycles): Determines breaker breaking capacity.
• Steady-State ($X_d$, permanent): Sustained fault current.`;
}

function topicSwingEq() {
  return `### ⚡ Swing Equation & Rotor Dynamics

Describes the electromechanical acceleration of the synchronous generator rotor during grid disturbances:

$$J \\frac{d^2\\theta_m}{dt^2} = T_m - T_e$$

In electrical form with inertia constant $H$ (seconds):
$$\\frac{2H}{\\omega_0} \\frac{d^2\\delta}{dt^2} = P_m - P_e - D\\Delta\\omega$$

• If $P_m > P_e$, rotor accelerates (frequency rises).
• If $P_m < P_e$, rotor decelerates (frequency drops).`;
}

function topicBess() {
  return `### 🔋 Battery Energy Storage Systems (BESS)

**Key Operational Applications:**
1. **Primary Frequency Response:** Sub-second synthetic inertia and active power injection.
2. **Peak Shaving & Energy Arbitrage:** Charge during off-peak (solar peak), discharge during peak demand hours.
3. **Black Start Support:** Provide initial energization to auxiliary systems.

**LCOS Formulation:**
$$\\text{LCOS} = \\frac{\\text{CAPEX} + \\sum \\text{OPEX} / (1+r)^t + \\sum \\text{Charging Cost} / (1+r)^t}{\\sum \\text{Discharged Energy} / (1+r)^t}$$`;
}

function topicScada() {
  return `### 📡 SCADA & Substation Protocols

• **Modbus RTU / TCP:** Function Code 03 (Read Holding Registers), 04 (Input Registers).
• **IEC 61850:** Modern digital substation standard using Ethernet, GOOSE messaging (< 4ms), and Sampled Values (SV).
• **DNP3 / IEC 60870-5-104:** Standard telecontrol protocols between substations and National Load Dispatch Centers (NLDC).`;
}

function topicGenerator() {
  return `### ⚡ Synchronous Generators (Alternators)

• **Stator (Armature):** 3-phase distributed windings in slots, generates output AC power ($V_{LL} = 11 – 22\\text{ kV}$).
• **Rotor (Field):** Electromagnet excited by DC current, driven by prime mover (steam, gas, hydro turbine).
• **Terminal Voltage Control:** Automatic Voltage Regulator (AVR) adjusts DC field current to maintain steady terminal voltage.`;
}

function topicSolar() {
  return `### ☀️ Solar Photovoltaic (PV) Engineering

• **Cell Model:** $I = I_{ph} - I_0 \\left[\\exp\\left(\\frac{q(V + I R_s)}{n k T}\\right) - 1\\right] - \\frac{V + I R_s}{R_{sh}}$
• **Inverter Ingestion:** Maximum Power Point Tracking (MPPT) algorithms (Perturb & Observe, Incremental Conductance).
• **Capacity Factor:** Typically 18% – 22% in South Asia / Bangladesh.`;
}

function topicWind() {
  return `### 🌬️ Wind Power & Turbine Physics

**Aerodynamic Power Available:**
$$P_{\\text{wind}} = \\frac{1}{2} \\rho A v^3$$

**Betz Limit:** Theoretical maximum power extraction limit is $\\frac{16}{27} \\approx 59.3\\%$.
• Practical capacity factors: 25% – 45%.`;
}

function topicHydro() {
  return `### 💧 Hydroelectric Power Formulation

$$P = \\rho \\cdot g \\cdot Q \\cdot H \\cdot \\eta$$

where $\\rho = 1000\\text{ kg/m}^3$, $g = 9.81\\text{ m/s}^2$, $Q$ = flow rate ($\text{m}^3\\text{/s}$), $H$ = net hydraulic head (m), $\\eta$ = overall efficiency (~90%).`;
}

function topicProtection() {
  return `### 🛡️ Power System Protection & Relaying

• **Overcurrent (ANSI 51):** Inverse definite minimum time (IDMT) curve.
• **Differential (ANSI 87):** Kirchhoff current balance ($I_1 - I_2 = 0$). Trips instantaneously on internal faults.
• **Distance (ANSI 21):** Measures $V/I = Z_{\\text{apparent}}$. Zone 1 (80% line length), Zone 2 (120%), Zone 3 (reverse/backup).`;
}

function topicLcoe() {
  return `### 💰 Levelized Cost of Electricity (LCOE)

The net present value of total lifetime generation costs divided by total discounted electrical energy generated:

$$\\text{LCOE} = \\frac{\\sum_{t=0}^N \\frac{\\text{CAPEX}_t + \\text{O\\&M}_t + \\text{Fuel}_t + \\text{Carbon}_t}{(1 + r)^t}}{\\sum_{t=1}^N \\frac{E_t}{(1 + r)^t}}$$

Provides unbiased apples-to-apples comparison across all generation technologies in BDT (৳/kWh) and USD ($/MWh).`;
}

function topicHeatRate() {
  return `### ⛽ Heat Rate & Thermal Efficiency

**Heat Rate ($HR$)** is the thermal energy input (in Btu or kJ) required by a thermal power station to produce one kilowatt-hour (1 kWh) of electrical energy:

$$\\text{Thermal Efficiency (\\%)} = \\frac{3412.14}{\\text{Heat Rate (Btu/kWh)}} \\times 100\\%$$

• CCGT Gas Turbine: $6200 – 6800\\text{ Btu/kWh}$ (50% – 55% efficiency).
• Coal Supercritical: $8500 – 9500\\text{ Btu/kWh}$ (36% – 40% efficiency).
• HFO Engine: $7800 – 8400\\text{ Btu/kWh}$ (40% – 44% efficiency).`;
}

function topicCostCalc(lower) {
  const rate = currencyService.getExchangeRate();
  let presetKey = 'gas_ccgt';
  let sizeMw = 200;

  if (lower.includes('solar')) { presetKey = 'solar_pv'; sizeMw = 100; }
  else if (lower.includes('wind')) { presetKey = 'onshore_wind'; sizeMw = 150; }
  else if (lower.includes('hfo')) { presetKey = 'hfo_plant'; sizeMw = 100; }
  else if (lower.includes('diesel')) { presetKey = 'diesel_generator'; sizeMw = 50; }
  else if (lower.includes('coal')) { presetKey = 'supercritical_coal'; sizeMw = 600; }

  const mwMatch = lower.match(/(\d+)\s*mw/i);
  if (mwMatch) sizeMw = parseInt(mwMatch[1], 10);

  const params = { ...POWER_PLANT_PRESETS[presetKey], typical_size_mw: sizeMw };
  const result = calculateLCOE(params, 25);

  return `⚡ **Total Cost Analysis — ${params.name} (${sizeMw} MW)**\n\n` +
         `• **LCOE (Tariff):** \`৳ ${result.totalLcoeBdtKwh} / kWh\`  (\`$ ${result.totalLCOE} / MWh\`)\n` +
         `• **Total CAPEX:** \`৳ ${result.totals.totalCapexCroreBdt.toLocaleString()} Crore\`  (\`$ ${result.totals.totalCapexMillionUsd} Million\`)\n` +
         `• **Annual Operating Cost:** \`৳ ${result.totals.annualOperatingCostCroreBdt.toLocaleString()} Crore / yr\`  (\`$ ${result.totals.annualOperatingCostMillionUsd} M / yr\`)\n` +
         `• **SRMC Dispatch Bid:** \`৳ ${result.srmcBdtKwh} / kWh\`  (\`$ ${result.srmc} / MWh\`)\n` +
         `• **Rate Applied:** \`1 USD = ${rate.toFixed(2)} BDT\``;
}

function topicLiveHardware(gridSnapshot) {
  const gen = gridSnapshot?.generatorUnit?.electrical || calculateGeneratorElectricalParameters(350, 0.885, 15.75, 2, 50.0);
  return `📡 **Live Generator Hardware Telemetry:**\n\n` +
         `• **Terminal Voltage ($V_{LL}$):** \`${gen.lineVoltageKv} kV\`\n` +
         `• **Stator Current ($I_L$):** \`${gen.currentAmperes?.toLocaleString()} A\`\n` +
         `• **Active Power ($P$):** \`${gen.activePowerMw} MW\`\n` +
         `• **Reactive Power ($Q$):** \`${gen.reactivePowerMvar} MVAr\`\n` +
         `• **Power Factor ($\\cos\\phi$):** \`${gen.powerFactor}\` Lagging\n` +
         `• **Machine Speed:** \`${gen.rpm} RPM\`\n` +
         `• **Frequency:** \`${gridSnapshot?.frequency?.toFixed(2) || '50.00'} Hz\``;
}

function topicOhmImpedance() {
  return `### ⚡ Resistance, Impedance & Reactance

**Ohm's Law:**
$$V = I \\cdot R, \\quad I = \\frac{V}{R}, \\quad R = \\frac{V}{I}$$

**AC Impedance ($Z$):**
$$Z = R + jX = |Z| \\angle \\theta, \\quad |Z| = \\sqrt{R^2 + X^2}, \\quad \\theta = \\arctan\\left(\\frac{X}{R}\\right)$$

• $X_L = 2\\pi f L$ (Inductive Reactance)
• $X_C = \\frac{1}{2\\pi f C}$ (Capacitive Reactance)`;
}

function topicCapacitor() {
  return `### ⚡ Capacitors in Power Systems

**Capacitive Reactance & Reactive Power:**
$$X_C = \\frac{1}{2\\pi f C}, \\quad Q_C = \\frac{V^2}{X_C} = V^2 \\cdot 2\\pi f C$$

• Supplies leading reactive power ($Q$) locally to raise substation bus voltage and counteract inductive motor lagging currents.`;
}

function topicInductor() {
  return `### ⚡ Inductors & Reactors

**Inductive Reactance & Reactive Power Absorption:**
$$X_L = 2\\pi f L, \\quad Q_L = \\frac{V^2}{X_L} = I^2 X_L$$

• Shunt reactors suppress line overvoltages during lightly loaded periods (mitigating the Ferranti effect).`;
}

function topicFuels() {
  return `### ⛽ Generation Fuels & Price Benchmarks

| Fuel Type | International Price | Bangladesh Local Price | Heat Value |
|:----------|:-------------------:|:----------------------:|:-----------|
| Natural Gas | $3.00 – $6.50 / MMBtu | ৳360 – ৳780 / MMBtu | ~1000 Btu/scf |
| Heavy Fuel Oil (HFO) | $14.50 – $17.00 / MMBtu | ৳75 – ৳85 / Liter | ~18,500 Btu/lb |
| Diesel / LFO | $22.00 – $26.00 / MMBtu | ৳105 – ৳115 / Liter | ~19,300 Btu/lb |
| Sub-bituminous Coal | $75 – $120 / Ton | ৳9,000 – ৳14,500 / Ton | ~8,500 Btu/lb |`;
}

function topicBangladeshGrid() {
  return `### 🇧🇩 Bangladesh National Power Grid Overview

• **System Operator:** Power Grid Company of Bangladesh (PGCB)
• **Key Utilities:** BPDB (Generation/Bulk), DESCO, DPDC, WZPDCL, NESCO, BREB (Rural Distribution)
• **Nominal Frequency:** $50.00\\text{ Hz}$ (Permissible band: $49.50 – 50.50\\text{ Hz}$)
• **Installed Generation Capacity:** ~28,000 MW (Grid connected)
• **Transmission Voltage Backbone:** 400 kV (Cross-border/Interconnectors), 230 kV, 132 kV`;
}

function topicHarmonics() {
  return `### ⚡ Harmonics & Power Quality (IEEE 519)

**Total Harmonic Distortion (THD):**
$$\\text{THD}_V = \\frac{\\sqrt{\\sum_{n=2}^\\infty V_n^2}}{V_1} \\times 100\\%$$

• Caused by non-linear loads: VFDs, rectifiers, arc furnaces, LED lighting, solar inverters.
• Standards limit voltage THD at Point of Common Coupling (PCC) to $< 5.0\\%$.`;
}

function topicSubstation() {
  return `### ⚡ Substation Architecture & Switchgear

• **Busbar Topologies:** Single Bus, Double Bus Single Breaker, Breaker-and-a-Half ($1\\frac{1}{2}$ CB), Ring Bus.
• **Insulation Mediums:** Air-Insulated Switchgear (AIS) vs Gas-Insulated Switchgear (GIS, SF6/Fluoroketone).
• **Instrument Transformers:** Current Transformers (CT) and Capacitive Voltage Transformers (CVT) for relaying and revenue metering.`;
}

function genericAnswer(query) {
  return `### 💡 GridMind AI — Analysis on: "${query}"

Based on electrical power engineering, physics, and energy economics:

1. **System Formulation:** This topic addresses electrical system dynamics where active and reactive power balance govern voltages and machine behavior:
   $$\\sum P_{\\text{generation}} = \\sum P_{\\text{load}} + P_{\\text{losses}}$$

2. **Economic & Financial Dimension:** Any equipment operational modification directly impacts generation costs in both Bangladeshi Taka (BDT ৳) and US Dollars (USD $).

3. **Train GridMind on this Topic:**
   You can teach GridMind custom rules or documents on this topic anytime!
   • Click **"🎓 Train GridMind"** at the top.
   • Or type in chat: \`Train topic: ${query} | Details: [Your custom notes/rules here]\`.`;
}
