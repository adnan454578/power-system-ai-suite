import React from 'react';
import { Activity, ShieldAlert, Zap } from 'lucide-react';

export default function FrequencyGauge({ frequency = 50.00, rocof = 0.0, nominal = 50.00, ace = 0.0 }) {
  // Angle range: -90 deg (48.5 Hz) to +90 deg (51.5 Hz)
  const minFreq = 48.5;
  const maxFreq = 51.5;
  const clampedFreq = Math.max(minFreq, Math.min(maxFreq, frequency));
  const normalized = (clampedFreq - minFreq) / (maxFreq - minFreq); // 0.0 to 1.0
  const angleDeg = -90 + normalized * 180; // -90 to +90 deg

  const freqDiff = Math.abs(frequency - nominal);
  let statusColor = 'var(--accent-emerald)';
  let statusText = 'Nominal Steady State';

  if (freqDiff > 0.3) {
    statusColor = 'var(--accent-rose)';
    statusText = 'Critical Contingency Trip';
  } else if (freqDiff > 0.1) {
    statusColor = 'var(--accent-amber)';
    statusText = 'Primary Governor Action';
  }

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color={statusColor} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>Grid Frequency Telemetry</span>
        </div>
        <span className="badge" style={{ background: `${statusColor}20`, color: statusColor, fontSize: '0.68rem' }}>
          {statusText}
        </span>
      </div>

      {/* SVG Semi-Circle Gauge */}
      <div style={{ position: 'relative', width: '220px', height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <svg viewBox="0 0 200 110" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Critical Low Band (< 49.5) */}
          <path
            d="M 20 100 A 80 80 0 0 1 45 45"
            fill="none"
            stroke="rgba(239, 68, 68, 0.4)"
            strokeWidth="14"
          />

          {/* Normal Band (49.8 - 50.2) */}
          <path
            d="M 75 25 A 80 80 0 0 1 125 25"
            fill="none"
            stroke="rgba(16, 185, 129, 0.6)"
            strokeWidth="14"
          />

          {/* Critical High Band (> 50.5) */}
          <path
            d="M 155 45 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(239, 68, 68, 0.4)"
            strokeWidth="14"
          />

          {/* Center Point */}
          <circle cx="100" cy="100" r="6" fill={statusColor} />

          {/* Needle */}
          <g transform={`rotate(${angleDeg}, 100, 100)`} style={{ transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <line x1="100" y1="100" x2="100" y2="30" stroke={statusColor} strokeWidth="3.5" strokeLinecap="round" />
            <polygon points="100,24 96,34 104,34" fill={statusColor} />
          </g>
        </svg>

        {/* Big Frequency Readout In Center */}
        <div style={{ position: 'absolute', bottom: '0px', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: '1.9rem', fontWeight: 900, color: statusColor, lineHeight: 1 }}>
            {frequency.toFixed(3)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
            Hertz (Nom: {nominal.toFixed(2)} Hz)
          </div>
        </div>
      </div>

      {/* RoCoF and ACE Metrics footer */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RoCoF (df/dt)</div>
          <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: Math.abs(rocof) > 0.05 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
            {rocof > 0 ? `+${rocof.toFixed(3)}` : rocof.toFixed(3)} <span style={{ fontSize: '0.65rem' }}>Hz/s</span>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Area Control Error</div>
          <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>
            {ace > 0 ? `+${ace}` : ace} <span style={{ fontSize: '0.65rem' }}>MW</span>
          </div>
        </div>
      </div>
    </div>
  );
}
