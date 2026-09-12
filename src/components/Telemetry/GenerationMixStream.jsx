import React from 'react';
import { Layers, Sun, Wind, Droplets, Atom, Flame, Factory, BatteryCharging } from 'lucide-react';

export default function GenerationMixStream({ generationMix = {}, totalGenMw = 14500, demandMw = 14500 }) {
  const {
    solar = 2800,
    wind = 3200,
    hydro = 1800,
    nuclear = 2400,
    gas_ccgt = 3500,
    coal = 1200,
    battery = 0
  } = generationMix;

  const total = Math.max(1, totalGenMw);

  const sources = [
    { key: 'wind', name: 'Wind', mw: wind, color: '#10B981', icon: Wind },
    { key: 'solar', name: 'Solar PV', mw: solar, color: '#00F0FF', icon: Sun },
    { key: 'hydro', name: 'Hydro', mw: hydro, color: '#3B82F6', icon: Droplets },
    { key: 'nuclear', name: 'Nuclear SMR', mw: nuclear, color: '#A855F7', icon: Atom },
    { key: 'gas_ccgt', name: 'Gas CCGT', mw: gas_ccgt, color: '#F59E0B', icon: Flame },
    { key: 'coal', name: 'Coal', mw: coal, color: '#64748B', icon: Factory },
    { key: 'battery', name: 'BESS Battery', mw: battery, color: '#EC4899', icon: BatteryCharging }
  ];

  const renewableMw = solar + wind + hydro;
  const renewablePct = ((renewableMw / total) * 100).toFixed(1);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>Live Generation Fuel Mix</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-stable" style={{ fontSize: '0.68rem' }}>
            {renewablePct}% Clean Energy
          </span>
          <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
            {totalGenMw.toLocaleString()} MW Total
          </span>
        </div>
      </div>

      {/* Multi-segmented Live Stack Bar */}
      <div>
        <div style={{ height: '18px', width: '100%', borderRadius: '9px', overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
          {sources.map(s => {
            if (s.mw <= 0) return null;
            const pct = (s.mw / total) * 100;
            return (
              <div
                key={s.key}
                title={`${s.name}: ${s.mw.toLocaleString()} MW (${pct.toFixed(1)}%)`}
                style={{
                  width: `${pct}%`,
                  background: s.color,
                  transition: 'width 0.5s ease',
                  position: 'relative'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Fuel Type Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
        {sources.map(s => {
          const pct = ((Math.max(0, s.mw) / total) * 100).toFixed(1);
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '8px 10px',
                borderRadius: '10px',
                border: `1px solid ${s.color}25`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.name}</span>
                <Icon size={14} color={s.color} />
              </div>
              <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF' }}>
                {s.mw.toLocaleString()} <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>MW</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: s.color, fontWeight: 700 }}>
                {pct}% of mix
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
