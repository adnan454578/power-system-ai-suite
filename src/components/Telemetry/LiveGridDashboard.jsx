import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Zap, 
  Play, 
  RotateCcw, 
  Sun, 
  Flame, 
  TrendingUp,
  BatteryCharging
} from 'lucide-react';
import FrequencyGauge from './FrequencyGauge';
import GenerationMixStream from './GenerationMixStream';
import GridFlowDiagram from './GridFlowDiagram';

export default function LiveGridDashboard({ 
  gridSnapshot = {}, 
  onTriggerGridEvent, 
  onResetSimulation 
}) {
  const {
    frequency = 50.0,
    rocof = 0.0,
    nominalFrequency = 50.0,
    demandMw = 14500,
    generationMw = 14500,
    imbalanceMw = 0,
    aceMw = 0,
    spinningReserveMw = 2200,
    reserveMarginPct = 15.2,
    generationMix = {},
    buses = [],
    lines = [],
    activeEvent = null,
    eventTimer = 0,
    history = []
  } = gridSnapshot;

  // Render SVG live waveform of recent frequency history
  const renderWaveform = () => {
    if (history.length < 2) return null;
    const width = 600;
    const height = 120;
    const minF = 49.2;
    const maxF = 50.8;

    const points = history.map((pt, idx) => {
      const x = (idx / (history.length - 1)) * width;
      const normalizedY = (pt.frequency - minF) / (maxF - minF);
      const y = height - normalizedY * height;
      return `${x},${y}`;
    }).join(' ');

    const nominalY = height - ((50.0 - minF) / (maxF - minF)) * height;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Nominal 50.00 Hz Center Line */}
        <line x1="0" y1={nominalY} x2={width} y2={nominalY} stroke="rgba(255,255,255,0.2)" strokeDasharray="4,4" strokeWidth="1" />
        
        {/* Upper & Lower Limits */}
        <line x1="0" y1={height * 0.15} x2={width} y2={height * 0.15} stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" />
        <line x1="0" y1={height * 0.85} x2={width} y2={height * 0.85} stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" />

        {/* Dynamic Waveform Polyline */}
        <polyline
          fill="none"
          stroke={Math.abs(frequency - 50.0) > 0.2 ? 'var(--accent-rose)' : 'var(--accent-cyan)'}
          strokeWidth="2.5"
          points={points}
          style={{ transition: 'stroke 0.3s ease' }}
        />
      </svg>
    );
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '16px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner & Contingency Trigger Panel */}
      <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="var(--accent-emerald)" /> Real-Time Power Grid Telemetry & Dynamic Stability Hub
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              1-Second Resolution Stream: Dynamic Governor Response, RoCoF Inertia, and Contingency Simulation
            </p>
          </div>

          {activeEvent ? (
            <div className="badge badge-critical" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              Contingency In Progress: {activeEvent.type.toUpperCase()} ({eventTimer}s remaining)
            </div>
          ) : (
            <div className="badge badge-stable" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              Grid Synchronized (All In-Limits)
            </div>
          )}
        </div>

        {/* Contingency Injector Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Inject Grid Disturbance:
          </span>

          <button
            onClick={() => onTriggerGridEvent('generator_trip', { dropMw: 600 })}
            className="btn-danger"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <Flame size={14} /> Trip 600MW Thermal Unit
          </button>

          <button
            onClick={() => onTriggerGridEvent('solar_cloud', { dropMw: 800 })}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', borderColor: 'rgba(0, 240, 255, 0.4)' }}
          >
            <Sun size={14} color="var(--accent-cyan)" /> Solar Cloud Ramp (-800MW)
          </button>

          <button
            onClick={() => onTriggerGridEvent('demand_spike', { surgeMw: 900 })}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', borderColor: 'rgba(245, 158, 11, 0.4)' }}
          >
            <TrendingUp size={14} color="var(--accent-amber)" /> Demand Surge (+900MW)
          </button>

          <button
            onClick={() => onTriggerGridEvent('bess_fast_injection', { injectMw: 400 })}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', borderColor: 'rgba(236, 72, 153, 0.4)' }}
          >
            <BatteryCharging size={14} color="#EC4899" /> Fast BESS Stabilize (+400MW)
          </button>

          <button
            onClick={onResetSimulation}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', marginLeft: 'auto' }}
          >
            <RotateCcw size={14} /> Reset Grid
          </button>
        </div>
      </div>

      {/* Grid Key Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="metric-card" style={{ borderTop: '3px solid var(--accent-emerald)' }}>
          <span className="metric-label">Grid Frequency</span>
          <span className="metric-value" style={{ color: Math.abs(frequency - 50.0) > 0.2 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
            {frequency.toFixed(3)} <span style={{ fontSize: '1rem' }}>Hz</span>
          </span>
          <span className="metric-sub">RoCoF: {rocof > 0 ? `+${rocof.toFixed(3)}` : rocof.toFixed(3)} Hz/s</span>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid var(--accent-cyan)' }}>
          <span className="metric-label">Live Active Demand</span>
          <span className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
            {demandMw.toLocaleString()} <span style={{ fontSize: '1rem' }}>MW</span>
          </span>
          <span className="metric-sub">Imbalance: {imbalanceMw > 0 ? `+${imbalanceMw}` : imbalanceMw} MW</span>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid var(--accent-amber)' }}>
          <span className="metric-label">Actual Generation</span>
          <span className="metric-value" style={{ color: 'var(--accent-amber)' }}>
            {generationMw.toLocaleString()} <span style={{ fontSize: '1rem' }}>MW</span>
          </span>
          <span className="metric-sub">ACE: {aceMw > 0 ? `+${aceMw}` : aceMw} MW</span>
        </div>

        <div className="metric-card" style={{ borderTop: '3px solid var(--accent-purple)' }}>
          <span className="metric-label">Spinning Reserves</span>
          <span className="metric-value" style={{ color: 'var(--accent-purple)' }}>
            {spinningReserveMw.toLocaleString()} <span style={{ fontSize: '1rem' }}>MW</span>
          </span>
          <span className="metric-sub">Reserve Margin: {reserveMarginPct}%</span>
        </div>
      </div>

      {/* Main 2-Column Split: Frequency Gauge & Live Waveform | Generation Mix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Frequency Gauge & Live Oscilloscope Waveform */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <FrequencyGauge 
            frequency={frequency} 
            rocof={rocof} 
            nominal={nominalFrequency} 
            ace={aceMw} 
          />

          {/* Live Waveform Oscilloscope */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF' }}>
                Live Frequency Oscilloscope (Last 40s)
              </span>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                Center: 50.000 Hz
              </span>
            </div>

            <div style={{ height: '120px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', padding: '8px', border: '1px solid var(--border-subtle)' }}>
              {renderWaveform()}
            </div>
          </div>
        </div>

        {/* Right Column: Generation Mix & Fuel Stacks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <GenerationMixStream 
            generationMix={generationMix} 
            totalGenMw={generationMw} 
            demandMw={demandMw} 
          />
        </div>
      </div>

      {/* Substation Grid Flow Diagram */}
      <GridFlowDiagram buses={buses} lines={lines} />
    </div>
  );
}
