import React, { useState } from 'react';
import { 
  Zap, 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Cpu,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { calculateLCOE, POWER_PLANT_PRESETS } from '../../services/powerCalculations';
import { currencyService } from '../../services/currencyService';

export default function InteractiveToolWidget({ widget, onTriggerGridEvent, onNavigateTab }) {
  if (!widget) return null;
  const { type, data } = widget;

  if (type === 'total_cost_card') {
    return <TotalCostCardWidget costData={data} onNavigateTab={onNavigateTab} />;
  }

  if (type === 'lcoe_calculator') {
    return <LcoeInlineWidget initialData={data} onNavigateTab={onNavigateTab} />;
  }

  if (type === 'hardware_summary') {
    return <HardwareInlineWidget hardwareData={data} onNavigateTab={onNavigateTab} />;
  }

  if (type === 'merit_dispatch') {
    return <MeritDispatchInlineWidget dispatchData={data} onNavigateTab={onNavigateTab} />;
  }

  return null;
}

// 1. Total Cost Card Widget (BDT ৳ & USD $)
function TotalCostCardWidget({ costData, onNavigateTab }) {
  const { 
    capacityMw = 200, 
    lcoeBdtPerKwh = 6.85, 
    lcoeUsdPerMwh = 57.08, 
    totalCapexCroreBdt = 2640, 
    totalCapexMillionUsd = 220, 
    annualOperatingCostCroreBdt = 712, 
    annualOperatingCostMillionUsd = 59.3,
    exchangeRate = 120
  } = costData || {};

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
      border: '1px solid #A7F3D0',
      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.12)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={18} color="var(--accent-forest)" />
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-forest)' }}>
            Financial Total Cost Overview ({capacityMw} MW Plant)
          </span>
        </div>
        <span className="badge badge-stable" style={{ fontSize: '0.68rem' }}>
          Rate: 1 USD = {exchangeRate} BDT
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>LEVELIZED TARIFF (LCOE)</div>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest)' }}>
            ৳ {lcoeBdtPerKwh} <span style={{ fontSize: '0.68rem' }}>/kWh</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>$ {lcoeUsdPerMwh} / MWh</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOTAL OVERNIGHT CAPEX</div>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284C7' }}>
            ৳ {totalCapexCroreBdt.toLocaleString()} <span style={{ fontSize: '0.68rem' }}>Cr</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>$ {totalCapexMillionUsd} Million</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ANNUAL OPEX TOTAL</div>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706' }}>
            ৳ {annualOperatingCostCroreBdt.toLocaleString()} <span style={{ fontSize: '0.68rem' }}>Cr/yr</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>$ {annualOperatingCostMillionUsd} M/yr</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => onNavigateTab && onNavigateTab('cost')}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-forest)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        >
          Open Fuel & LCOE Suite <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// 2. Hardware Inline Widget
function HardwareInlineWidget({ hardwareData, onNavigateTab }) {
  const { electrical = {}, hardware = {} } = hardwareData;

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      borderRadius: '12px',
      background: '#F0FDF4',
      border: '1px solid #A7F3D0',
      boxShadow: '0 2px 10px rgba(16, 185, 129, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="var(--accent-forest)" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-forest)' }}>
            Live Generator Telemetry Stream
          </span>
        </div>
        <button 
          onClick={() => onNavigateTab && onNavigateTab('parameters')}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-forest)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        >
          Open Generator Parameters Center <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
        <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TERMINAL VOLTAGE</div>
          <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284C7' }}>
            {electrical.lineVoltageKv} <span style={{ fontSize: '0.65rem' }}>kV</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STATOR CURRENT</div>
          <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
            {electrical.currentAmperes?.toLocaleString()} <span style={{ fontSize: '0.65rem' }}>A</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ACTIVE POWER (P)</div>
          <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-forest)' }}>
            {electrical.activePowerMw} <span style={{ fontSize: '0.65rem' }}>MW</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>REACTIVE POWER (Q)</div>
          <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D97706' }}>
            {electrical.reactivePowerMvar} <span style={{ fontSize: '0.65rem' }}>MVAr</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MACHINE SPEED</div>
          <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-forest)' }}>
            {electrical.rpm} <span style={{ fontSize: '0.65rem' }}>RPM</span>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>POWER FACTOR</div>
          <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563EB' }}>
            {electrical.powerFactor}
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. LCOE Interactive Widget
function LcoeInlineWidget({ initialData, onNavigateTab }) {
  const [params, setParams] = useState(initialData.params || POWER_PLANT_PRESETS.gas_ccgt);
  const [carbonTax, setCarbonTax] = useState(25);
  
  const result = calculateLCOE(params, carbonTax);

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      borderRadius: '12px',
      background: '#F0FDF4',
      border: '1px solid #A7F3D0',
      boxShadow: '0 2px 10px rgba(16, 185, 129, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="var(--accent-forest)" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-forest)' }}>
            LCOE & Total Cost Simulator — {params.name}
          </span>
        </div>
        <button 
          onClick={() => onNavigateTab && onNavigateTab('cost')}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-forest)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        >
          Open Full Cost Suite <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '14px' }}>
        <div style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BDT TARIFF</div>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest)' }}>
            ৳ {result.totalLcoeBdtKwh} <span style={{ fontSize: '0.7rem' }}>/kWh</span>
          </div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>USD TARIFF</div>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ${result.totalLCOE} <span style={{ fontSize: '0.7rem' }}>/MWh</span>
          </div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL OVERNIGHT CAPEX</div>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284C7' }}>
            ৳ {result.totals.totalCapexCroreBdt.toLocaleString()} <span style={{ fontSize: '0.7rem' }}>Cr</span>
          </div>
        </div>
      </div>

      {/* Interactive Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>CAPEX ($/kW):</span>
            <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>${params.capex_per_kw} (৳{(params.capex_per_kw * result.exchangeRate).toLocaleString()})</span>
          </div>
          <input 
            type="range" 
            min="400" 
            max="6000" 
            step="50"
            value={params.capex_per_kw} 
            onChange={(e) => setParams({ ...params, capex_per_kw: parseFloat(e.target.value) })} 
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>Capacity Factor (%):</span>
            <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{Math.round(params.capacity_factor * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0.10" 
            max="0.95" 
            step="0.01"
            value={params.capacity_factor} 
            onChange={(e) => setParams({ ...params, capacity_factor: parseFloat(e.target.value) })} 
          />
        </div>
      </div>
    </div>
  );
}

// 4. Merit Order Inline Widget
function MeritDispatchInlineWidget({ dispatchData, onNavigateTab }) {
  const { demandMw, marketClearingPrice, marketClearingPriceBdtKwh, renewablePenetrationPct } = dispatchData;

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      borderRadius: '12px',
      background: '#FFFBEB',
      border: '1px solid #FDE68A'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} color="#D97706" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#B45309' }}>
            Merit Order Dispatch Summary
          </span>
        </div>
        <button 
          onClick={() => onNavigateTab && onNavigateTab('cost')}
          style={{ background: 'transparent', border: 'none', color: '#B45309', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        >
          View Full Curve <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>CLEARING PRICE (MCP)</div>
          <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D97706' }}>
            ৳ {marketClearingPriceBdtKwh} <span style={{ fontSize: '0.65rem' }}>/kWh</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>${marketClearingPrice}/MWh</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>DEMAND CLEARED</div>
          <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {demandMw.toLocaleString()} <span style={{ fontSize: '0.65rem' }}>MW</span>
          </div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RENEWABLE SHARE</div>
          <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-forest)' }}>
            {renewablePenetrationPct}%
          </div>
        </div>
      </div>
    </div>
  );
}
