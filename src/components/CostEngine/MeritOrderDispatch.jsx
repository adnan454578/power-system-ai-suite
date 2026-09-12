import React, { useState } from 'react';
import { 
  BarChart3, 
  Layers, 
  Zap, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert, 
  RefreshCw,
  Power
} from 'lucide-react';
import { simulateMeritOrderDispatch, POWER_PLANT_PRESETS } from '../../services/powerCalculations';

const INITIAL_GENERATORS = [
  { id: 'GEN-SOLAR', name: 'Valley Solar PV Park', category: 'Renewable', capacity_mw: 2800, heat_rate_btu_kwh: 0, fuel_price_per_mmbtu: 0, variable_om_per_mwh: 0, emissions_tco2_per_mwh: 0, availability_factor: 0.85, is_outage: false, color: '#00F0FF' },
  { id: 'GEN-WIND', name: 'Highland Wind Farm', category: 'Renewable', capacity_mw: 3200, heat_rate_btu_kwh: 0, fuel_price_per_mmbtu: 0, variable_om_per_mwh: 1.5, emissions_tco2_per_mwh: 0, availability_factor: 0.80, is_outage: false, color: '#10B981' },
  { id: 'GEN-HYDRO', name: 'Cascade Hydro Station', category: 'Hydro', capacity_mw: 1800, heat_rate_btu_kwh: 0, fuel_price_per_mmbtu: 0, variable_om_per_mwh: 2.0, emissions_tco2_per_mwh: 0, availability_factor: 0.95, is_outage: false, color: '#3B82F6' },
  { id: 'GEN-NUCLEAR', name: 'Apex Nuclear SMR', category: 'Nuclear', capacity_mw: 2400, heat_rate_btu_kwh: 10200, fuel_price_per_mmbtu: 0.75, variable_om_per_mwh: 2.4, emissions_tco2_per_mwh: 0, availability_factor: 0.98, is_outage: false, color: '#A855F7' },
  { id: 'GEN-CCGT-1', name: 'Bay CCGT Gas Plant 1', category: 'Thermal', capacity_mw: 3000, heat_rate_btu_kwh: 6400, fuel_price_per_mmbtu: 4.5, variable_om_per_mwh: 3.5, emissions_tco2_per_mwh: 0.36, availability_factor: 0.95, is_outage: false, color: '#F59E0B' },
  { id: 'GEN-CCGT-2', name: 'Delta CCGT Gas Plant 2', category: 'Thermal', capacity_mw: 2500, heat_rate_btu_kwh: 6800, fuel_price_per_mmbtu: 4.8, variable_om_per_mwh: 3.8, emissions_tco2_per_mwh: 0.38, availability_factor: 0.92, is_outage: false, color: '#F97316' },
  { id: 'GEN-COAL', name: 'Keystone Coal Plant', category: 'Thermal', capacity_mw: 2800, heat_rate_btu_kwh: 8600, fuel_price_per_mmbtu: 2.8, variable_om_per_mwh: 4.8, emissions_tco2_per_mwh: 0.88, availability_factor: 0.90, is_outage: false, color: '#64748B' },
  { id: 'GEN-OCGT', name: 'Metro Peaker OCGT', category: 'Thermal', capacity_mw: 1500, heat_rate_btu_kwh: 9800, fuel_price_per_mmbtu: 5.5, variable_om_per_mwh: 5.8, emissions_tco2_per_mwh: 0.55, availability_factor: 0.95, is_outage: false, color: '#EF4444' }
];

export default function MeritOrderDispatch() {
  const [demandMw, setDemandMw] = useState(13500);
  const [carbonTax, setCarbonTax] = useState(25);
  const [generators, setGenerators] = useState(INITIAL_GENERATORS);

  // Toggle unit outage
  const toggleOutage = (id) => {
    setGenerators(prev => prev.map(g => g.id === id ? { ...g, is_outage: !g.is_outage } : g));
  };

  const dispatchResult = simulateMeritOrderDispatch(generators, demandMw, carbonTax);
  const maxCapacity = dispatchResult.totalCapacityAvailable || 1;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner & Demand Slider */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF' }}>
              Merit Order Economic Dispatch Simulator
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Generators are stacked by Short-Run Marginal Cost (SRMC). Marginal dispatched unit sets the Market Clearing Price.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>System Demand:</span>
              <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {demandMw.toLocaleString()} MW
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CO₂ Price:</span>
              <span className="mono" style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>${carbonTax}/t</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={carbonTax} 
                onChange={(e) => setCarbonTax(parseFloat(e.target.value))}
                style={{ width: '70px' }}
              />
            </div>
          </div>
        </div>

        {/* Big Demand Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>Adjust System Real-Time Load (5,000 MW - 20,000 MW):</span>
            <span className="mono" style={{ color: '#FFF' }}>{(demandMw / 1000).toFixed(1)} GW</span>
          </div>
          <input 
            type="range" 
            min="4000" 
            max="19000" 
            step="250"
            value={demandMw}
            onChange={(e) => setDemandMw(parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="metric-card" style={{ borderTop: '3px solid var(--accent-amber)' }}>
          <span className="metric-label">Market Clearing Price (MCP)</span>
          <span className="metric-value" style={{ color: 'var(--accent-amber)' }}>${dispatchResult.marketClearingPrice}</span>
          <span className="metric-sub">$/MWh Marginal Unit Bid</span>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid var(--accent-cyan)' }}>
          <span className="metric-label">Total Dispatched Power</span>
          <span className="metric-value" style={{ color: 'var(--accent-cyan)' }}>{dispatchResult.totalDispatchedMw.toLocaleString()}</span>
          <span className="metric-sub">MW / {dispatchResult.totalCapacityAvailable.toLocaleString()} MW Avail</span>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid var(--accent-emerald)' }}>
          <span className="metric-label">Renewable Penetration</span>
          <span className="metric-value" style={{ color: 'var(--accent-emerald)' }}>{dispatchResult.renewablePenetrationPct}%</span>
          <span className="metric-sub">Zero-marginal cost generation</span>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid #FFF' }}>
          <span className="metric-label">Hourly Fleet Cost</span>
          <span className="metric-value" style={{ color: '#FFF', fontSize: '1.35rem' }}>
            ${(dispatchResult.totalSystemCostHourly / 1000).toFixed(1)}k
          </span>
          <span className="metric-sub">Avg: ${dispatchResult.averageSystemCost}/MWh</span>
        </div>
      </div>

      {/* Visual Merit Order Curve Chart */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} color="var(--accent-cyan)" /> Merit Order Supply Curve & Clearing Intersection
        </h4>

        {/* Visual Merit Stacking Blocks */}
        <div style={{ position: 'relative', height: '180px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden', padding: '10px' }}>
          
          {/* Demand Line Marker */}
          {dispatchResult.totalCapacityAvailable > 0 && (
            <div style={{
              position: 'absolute',
              left: `${Math.min(98, (demandMw / dispatchResult.totalCapacityAvailable) * 100)}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              background: 'var(--accent-cyan)',
              zIndex: 10,
              boxShadow: '0 0 10px var(--accent-cyan)'
            }}>
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '6px',
                background: 'var(--accent-cyan)',
                color: '#000',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap'
              }}>
                Demand: {demandMw.toLocaleString()} MW
              </div>
            </div>
          )}

          {/* Stepped Merit Stack Blocks */}
          <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', gap: '2px' }}>
            {dispatchResult.units.map(unit => {
              const widthPct = unit.availableCapacity > 0 ? (unit.availableCapacity / dispatchResult.totalCapacityAvailable) * 100 : 0;
              const maxSrmc = Math.max(...dispatchResult.units.map(u => u.srmc), 80);
              const heightPct = Math.max(12, Math.min(95, (unit.srmc / maxSrmc) * 100));
              const isDispatched = unit.dispatchedMw > 0;

              return (
                <div
                  key={unit.id}
                  title={`${unit.name}: ${unit.dispatchedMw}/${unit.availableCapacity} MW @ $${unit.srmc}/MWh`}
                  style={{
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    background: isDispatched ? unit.color : 'rgba(255,255,255,0.06)',
                    opacity: unit.is_outage ? 0.2 : isDispatched ? 0.9 : 0.4,
                    borderRadius: '4px 4px 0 0',
                    border: isDispatched ? `1px solid ${unit.color}` : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '4px',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                >
                  <div className="mono" style={{ fontSize: '0.62rem', fontWeight: 700, color: isDispatched ? '#000' : '#94A3B8' }}>
                    ${unit.srmc}
                  </div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 600, color: isDispatched ? '#000' : '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {unit.name.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>0 MW (Base Load)</span>
          <span>Horizontal Axis: Cumulative Capacity (MW) • Vertical Axis: SRMC ($/MWh)</span>
          <span>{dispatchResult.totalCapacityAvailable.toLocaleString()} MW (Peak Capacity)</span>
        </div>
      </div>

      {/* Generator Fleet Dispatch Table */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', overflowX: 'auto' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', marginBottom: '14px' }}>
          Generator Fleet Merit Table & Infra-Marginal Rents
        </h4>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px' }}>Rank</th>
              <th style={{ padding: '8px' }}>Asset Name</th>
              <th style={{ padding: '8px' }}>Type</th>
              <th style={{ padding: '8px' }}>Avail / Total MW</th>
              <th style={{ padding: '8px' }}>SRMC ($/MWh)</th>
              <th style={{ padding: '8px' }}>Dispatched MW</th>
              <th style={{ padding: '8px' }}>Status</th>
              <th style={{ padding: '8px' }}>Hourly Rent ($)</th>
              <th style={{ padding: '8px' }}>Outage Toggle</th>
            </tr>
          </thead>
          <tbody>
            {dispatchResult.units.map((unit, idx) => (
              <tr 
                key={unit.id}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: unit.id === dispatchResult.marginalUnitId ? 'rgba(245, 158, 11, 0.08)' : 'transparent'
                }}
              >
                <td className="mono" style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>#{idx + 1}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600, color: unit.color }}>{unit.name}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span className="badge" style={{ background: `${unit.color}15`, color: unit.color, fontSize: '0.65rem' }}>
                    {unit.category}
                  </span>
                </td>
                <td className="mono" style={{ padding: '10px 8px' }}>{unit.availableCapacity} / {unit.capacity_mw} MW</td>
                <td className="mono" style={{ padding: '10px 8px', fontWeight: 700, color: '#FFF' }}>${unit.srmc}</td>
                <td className="mono" style={{ padding: '10px 8px', color: unit.dispatchedMw > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  {unit.dispatchedMw} MW ({unit.utilizationPct}%)
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <span className={`badge ${unit.status === 'Base Dispatched' ? 'badge-stable' : unit.status === 'Marginal Dispatched' ? 'badge-warning' : unit.status === 'Outage' ? 'badge-critical' : 'badge-cyan'}`} style={{ fontSize: '0.65rem' }}>
                    {unit.status}
                  </span>
                </td>
                <td className="mono" style={{ padding: '10px 8px', color: unit.infraMarginalRentHourly > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                  +${unit.infraMarginalRentHourly.toLocaleString()}
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <button
                    onClick={() => toggleOutage(unit.id)}
                    className={unit.is_outage ? 'btn-danger' : 'btn-secondary'}
                    style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                  >
                    <Power size={12} /> {unit.is_outage ? 'Force Online' : 'Trip Unit'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
