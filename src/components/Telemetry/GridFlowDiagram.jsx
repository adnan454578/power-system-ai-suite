import React from 'react';
import { Network, Activity, Zap, Server } from 'lucide-react';

export default function GridFlowDiagram({ buses = [], lines = [] }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>Transmission Substation Flow Network</span>
        </div>
        <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>400 kV Backbone</span>
      </div>

      {/* Grid Substation Nodes List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
        {buses.map(bus => (
          <div
            key={bus.id}
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server size={14} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFF' }}>{bus.id}</span>
              </div>
              <span className="badge badge-stable" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                {bus.voltageKv} kV
              </span>
            </div>
            
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{bus.name}</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
              <span>Gen: <strong className="mono" style={{ color: 'var(--accent-cyan)' }}>{bus.genMw} MW</strong></span>
              <span>Load: <strong className="mono" style={{ color: 'var(--accent-amber)' }}>{bus.loadMw} MW</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Transmission Lines Loading Bar Section */}
      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Inter-Bus Transmission Line Loading & Congestion:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {lines.map((line, idx) => {
            const isHigh = line.loadingPct > 80;
            const barColor = isHigh ? 'var(--accent-rose)' : line.loadingPct > 60 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: '#FFF' }}>{line.from} ➔ {line.to}</span>
                  <span className="mono" style={{ color: barColor, fontWeight: 700 }}>
                    {line.flowMw} MW / {line.capacityMw} MW ({line.loadingPct}%)
                  </span>
                </div>
                <div style={{ height: '5px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, line.loadingPct)}%`, background: barColor, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
