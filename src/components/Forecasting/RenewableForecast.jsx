import React, { useState } from 'react';
import { Sun, Wind, CloudSun, Gauge } from 'lucide-react';
import { generate24HourSolarForecast, generate24HourWindForecast } from '../../services/forecastingEngine';

export default function RenewableForecast() {
  const [clearnessIndex, setClearnessIndex] = useState(0.85); // 0.3 (cloudy) to 1.0 (clear)
  const [meanWindSpeed, setMeanWindSpeed] = useState(8.5); // m/s

  const solarData = generate24HourSolarForecast({ clearnessIndex });
  const windData = generate24HourWindForecast({ meanWindSpeedMs: meanWindSpeed });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
      
      {/* Solar PV Generation Forecast Card */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={20} color="var(--accent-cyan)" />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF' }}>Solar GHI & Generation Forecast</h4>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>3,500 MW Solar Park Fleet</p>
            </div>
          </div>
          <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
            Peak: {solarData.metrics.peakSolarMw.toLocaleString()} MW
          </span>
        </div>

        {/* Cloud / Clearness Slider */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Sky Clearness Index (kt):</span>
            <span className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
              {clearnessIndex >= 0.8 ? 'Clear Sky (0.85)' : clearnessIndex >= 0.6 ? 'Scattered Clouds' : 'Overcast (0.4)'}
            </span>
          </div>
          <input 
            type="range" 
            min="0.30" 
            max="1.00" 
            step="0.05"
            value={clearnessIndex}
            onChange={(e) => setClearnessIndex(parseFloat(e.target.value))}
          />
        </div>

        {/* Hourly Solar Bar Preview */}
        <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '3px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '10px 8px' }}>
          {solarData.hours.map((h, i) => {
            const heightPct = (h.solarMw / 3500) * 100;
            return (
              <div 
                key={i} 
                title={`${h.time}: ${h.solarMw} MW (${h.ghiWm2} W/m²)`}
                style={{
                  flex: 1,
                  height: `${Math.max(2, heightPct)}%`,
                  background: h.solarMw > 0 ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '2px',
                  transition: 'height 0.3s ease'
                }}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>00:00 (Night)</span>
          <span>Midday Peak: {solarData.metrics.totalSolarGwh} GWh Total</span>
          <span>23:00 (Night)</span>
        </div>
      </div>

      {/* Wind Power Forecast Card */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wind size={20} color="var(--accent-emerald)" />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF' }}>Wind Speed & Weibull Power Forecast</h4>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>4,000 MW Wind Fleet</p>
            </div>
          </div>
          <span className="badge badge-stable" style={{ fontSize: '0.68rem' }}>
            Peak: {windData.metrics.peakWindMw.toLocaleString()} MW
          </span>
        </div>

        {/* Wind Speed Slider */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Mean Hub Wind Speed:</span>
            <span className="mono" style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
              {meanWindSpeed} m/s
            </span>
          </div>
          <input 
            type="range" 
            min="3.0" 
            max="18.0" 
            step="0.5"
            value={meanWindSpeed}
            onChange={(e) => setMeanWindSpeed(parseFloat(e.target.value))}
          />
        </div>

        {/* Hourly Wind Bar Preview */}
        <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '3px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '10px 8px' }}>
          {windData.hours.map((h, i) => {
            const heightPct = (h.windMw / 4000) * 100;
            return (
              <div 
                key={i} 
                title={`${h.time}: ${h.windMw} MW (${h.windSpeedMs} m/s)`}
                style={{
                  flex: 1,
                  height: `${Math.max(4, heightPct)}%`,
                  background: 'var(--accent-emerald)',
                  borderRadius: '2px',
                  transition: 'height 0.3s ease'
                }}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>00:00 (Night Wind)</span>
          <span>Daily Energy: {windData.metrics.totalWindGwh} GWh</span>
          <span>23:00 (Diurnal)</span>
        </div>
      </div>

    </div>
  );
}
