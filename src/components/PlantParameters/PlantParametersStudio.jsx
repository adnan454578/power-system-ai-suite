import React from 'react';
import { 
  Cpu, 
  Activity, 
  Zap, 
  Gauge, 
  Thermometer, 
  Radio, 
  CheckCircle2, 
  RotateCw,
  Compass,
  Layers,
  Server
} from 'lucide-react';

export default function PlantParametersStudio({ gridSnapshot = {} }) {
  const { generatorUnit = {}, hardwareState = {}, frequency = 50.0 } = gridSnapshot;
  const electrical = generatorUnit.electrical || {
    lineVoltageKv: 15.75,
    phaseVoltageKv: 9.093,
    currentAmperes: 14500,
    currentKiloAmps: 14.50,
    activePowerMw: 350.0,
    reactivePowerMvar: 182.0,
    apparentPowerMva: 394.0,
    powerFactor: 0.887,
    powerFactorType: 'Lagging (Inductive)',
    frequencyHz: 50.0,
    rpm: 3000.0,
    torqueKiloNm: 1114.0
  };

  const { registers = {} } = hardwareState;

  return (
    <div style={{ maxWidth: '1400px', margin: '16px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner: Plant Generator Unit Status & Hardware Link */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid var(--accent-emerald)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={24} color="var(--accent-forest)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {generatorUnit.name || 'Turbine Generator Unit #1'}
                </h3>
                <span className="badge badge-stable" style={{ fontSize: '0.7rem' }}>
                  <CheckCircle2 size={12} /> {generatorUnit.status || 'Online Synchronized'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                3-Phase Synchronous Generator (2-Pole Cylindrical Rotor, 50 Hz, Rated 450 MW / 520 MVA)
              </p>
            </div>
          </div>

          {/* Hardware Connection Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div className="pulse-dot" style={{ background: 'var(--accent-emerald)' }} />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>HARDWARE LINK</div>
              <div className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-forest)' }}>
                {hardwareState.protocol || 'Modbus TCP / RTU'} ({hardwareState.ipAddress || '192.168.1.150:502'})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Electrical Meters Grid: 8 Core Parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        
        {/* 1. Terminal Line Voltage */}
        <div className="metric-card" style={{ borderTop: '3px solid #0284C7' }}>
          <div className="metric-label">
            <span>Terminal Voltage (V_LL)</span>
            <Zap size={16} color="#0284C7" />
          </div>
          <div className="metric-value" style={{ color: '#0284C7' }}>
            {electrical.lineVoltageKv} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>kV</span>
          </div>
          <div className="metric-sub mono">
            Phase V_LN: {electrical.phaseVoltageKv} kV (V_ab, V_bc, V_ca)
          </div>
        </div>

        {/* 2. Stator Current */}
        <div className="metric-card" style={{ borderTop: '3px solid #059669' }}>
          <div className="metric-label">
            <span>3-Phase Stator Current (I_L)</span>
            <Activity size={16} color="#059669" />
          </div>
          <div className="metric-value" style={{ color: '#059669' }}>
            {electrical.currentAmperes.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>A</span>
          </div>
          <div className="metric-sub mono">
            Line Current: {electrical.currentKiloAmps} kA (Balanced)
          </div>
        </div>

        {/* 3. Active Power (P) */}
        <div className="metric-card" style={{ borderTop: '3px solid #10B981' }}>
          <div className="metric-label">
            <span>Active Power (P)</span>
            <Zap size={16} color="#10B981" />
          </div>
          <div className="metric-value" style={{ color: '#10B981' }}>
            {electrical.activePowerMw} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>MW</span>
          </div>
          <div className="metric-sub mono">
            P = √3·V_LL·I_L·cosφ ({((electrical.activePowerMw / 450) * 100).toFixed(1)}% Load)
          </div>
        </div>

        {/* 4. Reactive Power (Q) */}
        <div className="metric-card" style={{ borderTop: '3px solid #D97706' }}>
          <div className="metric-label">
            <span>Reactive Power (Q)</span>
            <Compass size={16} color="#D97706" />
          </div>
          <div className="metric-value" style={{ color: '#D97706' }}>
            {electrical.reactivePowerMvar} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>MVAr</span>
          </div>
          <div className="metric-sub mono">
            Q = √3·V_LL·I_L·sinφ (Inductive VARs)
          </div>
        </div>

        {/* 5. Apparent Power (S) */}
        <div className="metric-card" style={{ borderTop: '3px solid #7C3AED' }}>
          <div className="metric-label">
            <span>Apparent Power (S)</span>
            <Layers size={16} color="#7C3AED" />
          </div>
          <div className="metric-value" style={{ color: '#7C3AED' }}>
            {electrical.apparentPowerMva} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>MVA</span>
          </div>
          <div className="metric-sub mono">
            S = √(P² + Q²) (Total Loading)
          </div>
        </div>

        {/* 6. Power Factor (cos phi) */}
        <div className="metric-card" style={{ borderTop: '3px solid #2563EB' }}>
          <div className="metric-label">
            <span>Power Factor (cos φ)</span>
            <Gauge size={16} color="#2563EB" />
          </div>
          <div className="metric-value" style={{ color: '#2563EB' }}>
            {electrical.powerFactor}
          </div>
          <div className="metric-sub mono" style={{ color: 'var(--accent-forest)', fontWeight: 600 }}>
            {electrical.powerFactorType}
          </div>
        </div>

        {/* 7. Machine Mechanical Speed (RPM) */}
        <div className="metric-card" style={{ borderTop: '3px solid #059669' }}>
          <div className="metric-label">
            <span>Shaft Mechanical Speed</span>
            <RotateCw size={16} color="#059669" />
          </div>
          <div className="metric-value mono" style={{ color: 'var(--accent-forest)' }}>
            {electrical.rpm} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>RPM</span>
          </div>
          <div className="metric-sub mono">
            N = (120·f)/Poles (Torque: {electrical.torqueKiloNm} kNm)
          </div>
        </div>

        {/* 8. Terminal Frequency (f) */}
        <div className="metric-card" style={{ borderTop: '3px solid #10B981' }}>
          <div className="metric-label">
            <span>Terminal Frequency (f)</span>
            <Activity size={16} color="#10B981" />
          </div>
          <div className="metric-value mono" style={{ color: 'var(--accent-forest)' }}>
            {electrical.frequencyHz.toFixed(3)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Hz</span>
          </div>
          <div className="metric-sub mono">
            Synchronous 50.00 Hz Base
          </div>
        </div>

      </div>

      {/* Secondary Row: Thermal/Excitation States & Hardware Modbus Register Bridge */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
        
        {/* Thermal & Excitation Diagnostics Card */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Thermometer size={18} color="var(--accent-forest)" /> Rotor, Stator & Excitation Diagnostics
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Stator Winding Temp</div>
              <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {generatorUnit.statorTempC}°C
              </div>
              <span className="badge badge-stable" style={{ fontSize: '0.62rem', marginTop: '2px' }}>Class F (In-Limits)</span>
            </div>

            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rotor Body Temp</div>
              <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {generatorUnit.rotorTempC}°C
              </div>
              <span className="badge badge-stable" style={{ fontSize: '0.62rem', marginTop: '2px' }}>Normal Cooling</span>
            </div>

            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Excitation Field Current (If)</div>
              <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D97706' }}>
                {generatorUnit.fieldCurrentIf} A DC
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>V_f = {generatorUnit.fieldVoltageVf} V</div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bearing Temp & Vibration</div>
              <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-forest)' }}>
                {generatorUnit.bearingTempC}°C
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Vib: {generatorUnit.vibrationMmS} mm/s (Good)</div>
            </div>
          </div>
        </div>

        {/* Live Hardware Modbus Registers Telemetry Feed */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="var(--accent-forest)" /> Live Hardware SCADA / Modbus Registers (Holding 40001+)
            </h4>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
              {hardwareState.packetRateHz} Hz Refresh
            </span>
          </div>

          <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', maxHeight: '220px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '4px 6px' }}>Register Address</th>
                  <th style={{ padding: '4px 6px' }}>Parameter Name</th>
                  <th style={{ padding: '4px 6px' }}>Raw Value</th>
                  <th style={{ padding: '4px 6px' }}>Scaled Physical Value</th>
                </tr>
              </thead>
              <tbody className="mono">
                {Object.entries(registers).map(([regKey, val], idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '4px 6px', color: 'var(--accent-forest)', fontWeight: 600 }}>{regKey.split('_')[0]}_{regKey.split('_')[1]}</td>
                    <td style={{ padding: '4px 6px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>{regKey.replace(/^REG_\d+_/, '').replace(/_/g, ' ')}</td>
                    <td style={{ padding: '4px 6px', color: '#64748B' }}>0x{val.toString(16).toUpperCase().padStart(4, '0')} ({val})</td>
                    <td style={{ padding: '4px 6px', color: 'var(--accent-forest)', fontWeight: 700 }}>
                      {regKey.includes('VOLTAGE') ? `${(val / 1000).toFixed(2)} kV` :
                       regKey.includes('ACTIVE_PWR') ? `${(val / 1000).toFixed(2)} MW` :
                       regKey.includes('RPM') ? `${(val / 10).toFixed(1)} RPM` :
                       regKey.includes('FREQ') ? `${(val / 100).toFixed(2)} Hz` :
                       regKey.includes('FACTOR') ? `${(val / 1000).toFixed(3)}` : val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Packets Received: <strong>{hardwareState.packetsReceived.toLocaleString()}</strong></span>
            <span>Latency: <strong>12 ms</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
}
