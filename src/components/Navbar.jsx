import React from 'react';
import { 
  Zap, 
  MessageSquareCode, 
  Calculator, 
  Activity, 
  TrendingUp, 
  Play, 
  Pause, 
  RotateCcw,
  Cpu
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  gridSnapshot, 
  isSimulationRunning, 
  setIsSimulationRunning,
  onResetSimulation 
}) {
  const { frequency = 50.0, demandMw = 14500, generationMw = 14500, generatorUnit = {} } = gridSnapshot || {};
  const electrical = generatorUnit.electrical || { rpm: 3000.0, lineVoltageKv: 15.75 };
  
  const freqDeviation = Math.abs(frequency - 50.0);
  const isAlarm = freqDeviation > 0.2;

  return (
    <header className="glass-panel" style={{ margin: '12px 16px 0', padding: '12px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', zIndex: 50 }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '12px', 
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
        }}>
          <Zap size={24} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              GridMind <span style={{ color: 'var(--accent-forest)' }}>AI</span>
            </h1>
            <span className="badge badge-stable" style={{ fontSize: '0.65rem' }}>Eco-Grid Suite</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Plant Parameters • LCOE & Fuels • Hardware Telemetry • CSV AI
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'chat' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'chat' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'chat' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            borderBottom: activeTab === 'chat' ? '2px solid var(--accent-emerald)' : '2px solid transparent'
          }}
        >
          <MessageSquareCode size={16} />
          <span>AI Assistant & CSV</span>
        </button>

        <button
          onClick={() => setActiveTab('parameters')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'parameters' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'parameters' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'parameters' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            borderBottom: activeTab === 'parameters' ? '2px solid var(--accent-emerald)' : '2px solid transparent'
          }}
        >
          <Cpu size={16} />
          <span>Generator Parameters</span>
        </button>

        <button
          onClick={() => setActiveTab('cost')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'cost' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'cost' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'cost' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            borderBottom: activeTab === 'cost' ? '2px solid var(--accent-emerald)' : '2px solid transparent'
          }}
        >
          <Calculator size={16} />
          <span>Fuel & LCOE Cost</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'telemetry' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'telemetry' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'telemetry' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            borderBottom: activeTab === 'telemetry' ? '2px solid var(--accent-emerald)' : '2px solid transparent'
          }}
        >
          <Activity size={16} />
          <span>Grid Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('forecasting')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'forecasting' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'forecasting' ? 'var(--accent-forest)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'forecasting' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            borderBottom: activeTab === 'forecasting' ? '2px solid var(--accent-emerald)' : '2px solid transparent'
          }}
        >
          <TrendingUp size={16} />
          <span>Forecasting</span>
        </button>
      </nav>

      {/* Live Plant Ticker: 50.00 Hz, 3000 RPM, 15.75 kV */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Frequency & RPM Widget */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '10px',
          background: isAlarm ? '#FEF2F2' : '#ECFDF5',
          border: `1px solid ${isAlarm ? '#FECACA' : '#A7F3D0'}`
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isAlarm ? 'var(--accent-rose)' : 'var(--accent-emerald)',
            boxShadow: `0 0 6px ${isAlarm ? 'var(--accent-rose)' : 'var(--accent-emerald)'}`
          }} />
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Freq / Machine Speed
            </div>
            <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 800, color: isAlarm ? 'var(--accent-rose)' : 'var(--accent-forest)' }}>
              {frequency.toFixed(2)} Hz • {electrical.rpm} RPM
            </div>
          </div>
        </div>

        {/* Play/Pause Simulator */}
        <button
          onClick={() => setIsSimulationRunning(!isSimulationRunning)}
          title={isSimulationRunning ? 'Pause Stream' : 'Resume Stream'}
          style={{
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            background: '#FFFFFF',
            color: isSimulationRunning ? 'var(--accent-forest)' : 'var(--accent-amber)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {isSimulationRunning ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={onResetSimulation}
          title="Reset Telemetry"
          style={{
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            background: '#FFFFFF',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </header>
  );
}
