import React, { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Thermometer, 
  Sun, 
  Wind, 
  ShieldCheck, 
  Sliders,
  BarChart2
} from 'lucide-react';
import ConfidenceBandChart from './ConfidenceBandChart';
import RenewableForecast from './RenewableForecast';
import { generate24HourLoadForecast, generate7DayLoadForecast } from '../../services/forecastingEngine';

export default function LoadForecastStudio() {
  const [forecastTempC, setForecastTempC] = useState(33); // Hot summer day
  const [dayType, setDayType] = useState('weekday'); // 'weekday' | 'weekend' | 'holiday'
  const [confidenceIntervalPct, setConfidenceIntervalPct] = useState(90); // 90 or 95

  const loadForecast24h = generate24HourLoadForecast({
    forecastTempC,
    dayType,
    confidenceIntervalPct
  });

  const weeklyForecast = generate7DayLoadForecast(16200, 9800, forecastTempC);

  return (
    <div style={{ maxWidth: '1400px', margin: '16px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner & Scenario Sandbox Controls */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--accent-purple)" /> Load & Renewable Energy Forecasting Studio
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Short-Term Load Forecasting (STLF) with weather diurnal sensitivity and confidence bands
            </p>
          </div>

          {/* Quick Scenario Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Thermometer size={16} color="var(--accent-amber)" />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Temp:</span>
              <span className="mono" style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{forecastTempC}°C</span>
              <input 
                type="range" 
                min="10" 
                max="45" 
                step="1"
                value={forecastTempC}
                onChange={(e) => setForecastTempC(parseInt(e.target.value, 10))}
                style={{ width: '80px' }}
              />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 6px', borderRadius: '10px', display: 'flex', gap: '4px' }}>
              {['weekday', 'weekend', 'holiday'].map(dt => (
                <button
                  key={dt}
                  onClick={() => setDayType(dt)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    background: dayType === dt ? 'var(--accent-purple)' : 'transparent',
                    color: dayType === dt ? '#FFF' : 'var(--text-secondary)'
                  }}
                >
                  {dt}
                </button>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 6px', borderRadius: '10px', display: 'flex', gap: '4px' }}>
              {[90, 95].map(ci => (
                <button
                  key={ci}
                  onClick={() => setConfidenceIntervalPct(ci)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: confidenceIntervalPct === ci ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                    color: confidenceIntervalPct === ci ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                  }}
                >
                  {ci}% CI
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast KPI Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div className="metric-card" style={{ borderTop: '3px solid var(--accent-purple)' }}>
            <span className="metric-label">Projected Peak Demand</span>
            <span className="metric-value" style={{ color: 'var(--accent-purple)' }}>
              {loadForecast24h.metrics.peakMw.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>MW</span>
            </span>
            <span className="metric-sub">Expected at 19:00 Evening Peak</span>
          </div>

          <div className="metric-card" style={{ borderTop: '3px solid #FFF' }}>
            <span className="metric-label">Off-Peak Valley</span>
            <span className="metric-value" style={{ color: '#FFF' }}>
              {loadForecast24h.metrics.valleyMw.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>MW</span>
            </span>
            <span className="metric-sub">03:00 - 04:00 Night Base</span>
          </div>

          <div className="metric-card" style={{ borderTop: '3px solid var(--accent-cyan)' }}>
            <span className="metric-label">24-Hour Total Energy</span>
            <span className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
              {loadForecast24h.metrics.totalEnergyGwh} <span style={{ fontSize: '0.9rem' }}>GWh</span>
            </span>
            <span className="metric-sub">Average: {loadForecast24h.metrics.averageMw.toLocaleString()} MW</span>
          </div>

          <div className="metric-card" style={{ borderTop: '3px solid var(--accent-emerald)' }}>
            <span className="metric-label">System Load Factor</span>
            <span className="metric-value" style={{ color: 'var(--accent-emerald)' }}>
              {loadForecast24h.metrics.loadFactorPct}%
            </span>
            <span className="metric-sub">Weather Mod: {loadForecast24h.metrics.tempAdjustmentPct > 0 ? `+${loadForecast24h.metrics.tempAdjustmentPct}%` : `${loadForecast24h.metrics.tempAdjustmentPct}%`}</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Day Ahead Demand Forecast with Shaded Confidence Band */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--accent-purple)" /> 24-Hour Day-Ahead Demand Curve (Confidence Bounds)
          </h4>
          <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-purple)' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--accent-purple)' }} /> Mean Forecast
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(168,85,247,0.7)' }}>
              <span style={{ width: '12px', height: '8px', background: 'rgba(168,85,247,0.3)', borderRadius: '2px' }} /> {confidenceIntervalPct}% Band
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <span style={{ width: '12px', height: '2px', background: '#94A3B8' }} /> Baseline
            </span>
          </div>
        </div>

        <ConfidenceBandChart forecastData={loadForecast24h} />
      </div>

      {/* Renewable Generation Forecasts (Solar & Wind) */}
      <RenewableForecast />

      {/* 7-Day Ahead Weekly Demand Profile */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={18} color="var(--accent-cyan)" /> 7-Day Ahead Weekly Peak & Valley Outlook
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {weeklyForecast.map((day, idx) => (
            <div
              key={idx}
              style={{
                background: idx === 0 ? 'rgba(168, 85, 247, 0.12)' : 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '10px',
                border: idx === 0 ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFF' }}>{day.day}</span>
                <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 5px', background: day.type === 'weekend' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 240, 255, 0.15)', color: day.type === 'weekend' ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
                  {day.tempC}°C
                </span>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Peak: <strong className="mono" style={{ color: 'var(--accent-purple)' }}>{day.peakMw.toLocaleString()} MW</strong>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Energy: <strong className="mono" style={{ color: '#FFF' }}>{day.totalEnergyGwh} GWh</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
