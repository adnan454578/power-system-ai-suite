import React, { useState } from 'react';

export default function ConfidenceBandChart({ forecastData }) {
  const [hoveredHour, setHoveredHour] = useState(null);
  const { hours = [], metrics = {} } = forecastData || {};

  if (!hours.length) return null;

  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max for scaling
  const allValues = hours.flatMap(h => [h.ucbMw, h.lcbMw, h.forecastMw, h.baselineMw]);
  const minVal = Math.floor(Math.min(...allValues) / 1000) * 1000 - 1000;
  const maxVal = Math.ceil(Math.max(...allValues) / 1000) * 1000 + 1000;

  const getX = (hourIdx) => padding.left + (hourIdx / (hours.length - 1)) * chartWidth;
  const getY = (val) => padding.top + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;

  // Build confidence band polygon: Top points left-to-right (UCB), then bottom points right-to-left (LCB)
  const ucbPoints = hours.map((h, i) => `${getX(i)},${getY(h.ucbMw)}`);
  const lcbPoints = [...hours].reverse().map((h, i) => `${getX(hours.length - 1 - i)},${getY(h.lcbMw)}`);
  const bandPolygon = `${ucbPoints.join(' ')} ${lcbPoints.join(' ')}`;

  // Forecast Polyline
  const forecastPoints = hours.map((h, i) => `${getX(i)},${getY(h.forecastMw)}`).join(' ');
  // Baseline Polyline
  const baselinePoints = hours.map((h, i) => `${getX(i)},${getY(h.baselineMw)}`).join(' ');

  const activeHourData = hoveredHour !== null ? hours[hoveredHour] : hours[18]; // Default to peak hour

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Chart Canvas Area */}
      <div style={{ position: 'relative', width: '100%', height: '260px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '10px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          
          {/* Y-Axis Grid Lines & Labels */}
          {[minVal, minVal + (maxVal - minVal) * 0.33, minVal + (maxVal - minVal) * 0.66, maxVal].map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="2,2" />
                <text x={padding.left - 8} y={y + 4} fill="#64748B" fontSize="10" fontFamily="JetBrains Mono" textAnchor="end">
                  {Math.round(val / 1000)}k
                </text>
              </g>
            );
          })}

          {/* 90% Confidence Interval Shaded Area */}
          <polygon
            points={bandPolygon}
            fill="rgba(168, 85, 247, 0.18)"
            stroke="rgba(168, 85, 247, 0.4)"
            strokeDasharray="3,3"
            strokeWidth="1"
          />

          {/* Baseline Reference Curve (Dashed White) */}
          <polyline
            points={baselinePoints}
            fill="none"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeDasharray="4,4"
            strokeWidth="1.5"
          />

          {/* Mean Forecast Curve (Vibrant Purple) */}
          <polyline
            points={forecastPoints}
            fill="none"
            stroke="var(--accent-purple)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Interactive Hover Dots & Vertical Guide */}
          {hours.map((h, i) => {
            const x = getX(i);
            const y = getY(h.forecastMw);
            const isHovered = hoveredHour === i;

            return (
              <g key={i} onMouseEnter={() => setHoveredHour(i)} style={{ cursor: 'pointer' }}>
                <rect x={x - 12} y={padding.top} width={24} height={chartHeight} fill="transparent" />
                
                {isHovered && (
                  <>
                    <line x1={x} y1={padding.top} x2={x} y2={padding.top + chartHeight} stroke="var(--accent-cyan)" strokeWidth="1.5" strokeDasharray="3,3" />
                    <circle cx={x} cy={getY(h.ucbMw)} r="3" fill="var(--accent-purple)" />
                    <circle cx={x} cy={getY(h.lcbMw)} r="3" fill="var(--accent-purple)" />
                  </>
                )}

                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : (i % 3 === 0 ? 3.5 : 2)}
                  fill={isHovered ? 'var(--accent-cyan)' : 'var(--accent-purple)'}
                  stroke="#000"
                  strokeWidth="1.5"
                />

                {/* X-Axis Hour Labels */}
                {i % 3 === 0 && (
                  <text x={x} y={height - 8} fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                    {h.time}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Hour Details Strip */}
      {activeHourData && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 14px', borderRadius: '10px', fontSize: '0.78rem', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ color: '#FFF', fontWeight: 700 }}>
            Time: <strong className="mono" style={{ color: 'var(--accent-cyan)' }}>{activeHourData.time}</strong> (Ambient Temp: {activeHourData.tempC}°C)
          </span>
          <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>
            Mean Forecast: <strong className="mono" style={{ color: '#FFF' }}>{activeHourData.forecastMw.toLocaleString()} MW</strong>
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            90% Band: <strong className="mono" style={{ color: 'var(--accent-purple)' }}>[{activeHourData.lcbMw.toLocaleString()} – {activeHourData.ucbMw.toLocaleString()} MW]</strong>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            Baseline: <strong className="mono">{activeHourData.baselineMw.toLocaleString()} MW</strong>
          </span>
        </div>
      )}
    </div>
  );
}
