import React, { useState } from 'react';
import { Calculator, BarChart3, Layers, Sliders } from 'lucide-react';
import LCOECalculator from './LCOECalculator';
import MeritOrderDispatch from './MeritOrderDispatch';

export default function CostEngineHub() {
  const [subTab, setSubTab] = useState('lcoe'); // 'lcoe' | 'merit'

  return (
    <div style={{ maxWidth: '1400px', margin: '16px auto', padding: '0 16px' }}>
      {/* Sub-navigation tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setSubTab('lcoe')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: subTab === 'lcoe' ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(59, 130, 246, 0.25))' : 'transparent',
            color: subTab === 'lcoe' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            borderBottom: subTab === 'lcoe' ? '2px solid var(--accent-cyan)' : '2px solid transparent'
          }}
        >
          <Calculator size={16} />
          <span>LCOE & LCOS Generation Cost Calculator</span>
        </button>

        <button
          onClick={() => setSubTab('merit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: subTab === 'merit' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 88, 12, 0.25))' : 'transparent',
            color: subTab === 'merit' ? 'var(--accent-amber)' : 'var(--text-secondary)',
            borderBottom: subTab === 'merit' ? '2px solid var(--accent-amber)' : '2px solid transparent'
          }}
        >
          <BarChart3 size={16} />
          <span>Merit Order Economic Dispatch & MCP</span>
        </button>
      </div>

      {subTab === 'lcoe' ? <LCOECalculator /> : <MeritOrderDispatch />}
    </div>
  );
}
