-- ============================================================================
-- GridMind AI - Supabase Database Schema for Train Mode (Knowledge Base)
-- ============================================================================
-- Run this SQL in your Supabase Project: Dashboard > SQL Editor > New query
-- This creates the trained_topics table with full Row Level Security (RLS)
-- and search indexes for power system engineering knowledge.
-- ============================================================================

-- 1. Create trained_topics table
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

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.trained_topics ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive policies for public anon access (Read, Insert, Update, Delete)
-- Note: If you want user authentication later, these can be restricted per user_id
DROP POLICY IF EXISTS "Allow anon read trained_topics" ON public.trained_topics;
CREATE POLICY "Allow anon read trained_topics"
  ON public.trained_topics
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow anon insert trained_topics" ON public.trained_topics;
CREATE POLICY "Allow anon insert trained_topics"
  ON public.trained_topics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update trained_topics" ON public.trained_topics;
CREATE POLICY "Allow anon update trained_topics"
  ON public.trained_topics
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete trained_topics" ON public.trained_topics;
CREATE POLICY "Allow anon delete trained_topics"
  ON public.trained_topics
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 4. Fast Indexes for Filtering and Ordering
CREATE INDEX IF NOT EXISTS idx_trained_topics_category 
  ON public.trained_topics (category);

CREATE INDEX IF NOT EXISTS idx_trained_topics_updated_at 
  ON public.trained_topics (updated_at DESC);

-- Optional Full-Text Search index for rapid domain knowledge retrieval
CREATE INDEX IF NOT EXISTS idx_trained_topics_fts 
  ON public.trained_topics USING gin (to_tsvector('english', title || ' ' || content));

-- 5. Seed Initial Default Engineering Topics (Run if table is empty)
INSERT INTO public.trained_topics (id, title, category, tags, content, source, updated_at)
VALUES 
  (
    'topic_bpdb_tariff_2026',
    'Bangladesh BPDB Electricity Tariffs & Subsidies',
    'Tariff & Policy',
    ARRAY['bangladesh', 'bpdb', 'tariff', 'subsidies', 'bdt', 'berc'],
    '**Bangladesh Power Development Board (BPDB) Tariff Structure:**
• **Retail Tariff Levels:**
  - Residential (Life-line 0-50 kWh): ৳4.35 / kWh
  - Residential Flat (above 300 kWh): ৳11.46 – ৳13.26 / kWh
  - Commercial / Offices: ৳13.50 – ৳16.00 / kWh
  - Heavy Industrial (11kV / 33kV): ৳9.70 – ৳11.80 / kWh (Peak: ৳14.50/kWh, Off-Peak: ৳8.90/kWh)
  - Agricultural Irrigation: ৳4.82 / kWh
• **Bulk Supply Tariff (BST):** Weighted average generation & transmission supply tariff is approximately ৳6.70 – ৳7.80 / kWh.
• **Capacity Payments:** Government contracts with IPPs include capacity charges averaging $12 – $18 / kW-month, regardless of plant dispatch.
• **Fuel Mix Impact:** High reliance on imported LNG ($10–$14/MMBtu) and HFO (৳75–৳85/liter) significantly increases bulk generation costs.',
    'seed',
    NOW()
  ),
  (
    'topic_transformer_impedance',
    'Transformer Impedance & Short-Circuit Testing',
    'Electrical Equipment',
    ARRAY['transformer', 'impedance', 'percentage impedance', 'open circuit', 'short circuit'],
    '**Transformer Percentage Impedance (%Z) & Testing:**
• **Definition:** %Z is the percentage of rated primary voltage required to circulate rated full-load current through the short-circuited secondary winding.
$$%Z = \frac{V_{sc}}{V_{rated}} \times 100$$
• **Typical Values:**
  - Distribution Transformers (11kV / 0.4kV, < 2.5 MVA): 4% – 5%
  - Medium Power Transformers (33kV / 11kV, 10–25 MVA): 7% – 9%
  - Large Transmission Transformers (230kV / 132kV, 150–250 MVA): 10% – 14%
  - Generator Step-Up (GSU, 15.75kV / 400kV): 12% – 16%
• **Fault Current Calculation:**
$$I_{sc} = \frac{I_{fl}}{\%Z / 100} = \frac{S_{rated}}{\sqrt{3} \cdot V_{LL} \cdot (\%Z / 100)}$$
• **Loss Separation:**
  - Open-Circuit (No-Load) Test at rated voltage determines Core/Iron Loss ($P_0$).
  - Short-Circuit Test at rated current determines Full-Load Copper/I²R Loss ($P_k$).',
    'seed',
    NOW()
  ),
  (
    'topic_frequency_regulation',
    'Primary Frequency Droop & Automatic Generation Control (AGC)',
    'Grid Operations',
    ARRAY['frequency', 'droop', 'speed governor', 'agc', 'inertia', '50 hz'],
    '**Grid Frequency Regulation Hierarchy:**
• **Inertial Response (0 – 2 seconds):** Stored kinetic energy in rotating turbine-generator rotors ($E_k = \frac{1}{2} J \omega^2$). Limits Rate of Change of Frequency (RoCoF).
• **Primary Frequency Response / Droop (2 – 10 seconds):**
  - Governor droop characteristic $R$ (typically 4% to 5%):
  $$\Delta P = -\frac{P_{rated}}{R} \cdot \frac{\Delta f}{f_0}$$
  - A 4% droop means a 4% frequency decline ($2.0\text{ Hz}$ on 50Hz) causes a 100% active power increase.
• **Secondary Frequency Control / AGC (30s – 15 minutes):** Central SCADA / EMS algorithm restores system frequency strictly to 50.00 Hz and returns tie-line exchanges to scheduled interchange.
• **Tertiary Control / Reserve Dispatch (15 – 60 minutes):** Re-dispatches spinning and non-spinning reserves to restore secondary control margins.',
    'seed',
    NOW()
  ),
  (
    'topic_solar_pv_lcoe_bangladesh',
    'Utility-Scale Solar PV Economics & Land Constraints in Bangladesh',
    'Renewable Economics',
    ARRAY['solar', 'pv', 'lcoe', 'bangladesh', 'land', 'tariff', 'capex'],
    '**Utility-Scale Solar PV in Bangladesh:**
• **Overnight CAPEX:** $800 – $950 / kWp (৳96,000 – ৳114,000 / kWp).
• **Capacity Utilization Factor (CUF):** 18% – 21% (Global horizontal irradiance averages $4.5 – 5.0\text{ kWh/m}^2/\text{day}$).
• **Levelized Cost of Electricity (LCOE):** ৳8.50 – ৳11.00 / kWh ($70 – $92 / MWh).
• **Land Requirement:** Approximately 3.0 to 3.5 acres per MW of installed solar PV.
• **Key Challenges:**
  - High agricultural land cost and land acquisition complexity.
  - Silt deposition / dust on panels during dry winter requires frequent water cleaning.
  - High ambient temperature coefficients derate crystalline silicon panel output during summer months.',
    'seed',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
