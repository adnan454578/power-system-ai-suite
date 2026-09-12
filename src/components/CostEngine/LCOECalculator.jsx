import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Fuel, 
  Flame, 
  Sliders, 
  RotateCcw, 
  DollarSign, 
  ShieldCheck, 
  Wrench, 
  Info,
  Droplets,
  Coins,
  Edit3,
  Check
} from 'lucide-react';
import { calculateLCOE, POWER_PLANT_PRESETS, FUEL_TYPES } from '../../services/powerCalculations';
import { currencyService } from '../../services/currencyService';

export default function LCOECalculator() {
  const [selectedPresetKey, setSelectedPresetKey] = useState('gas_ccgt');
  const [plantParams, setPlantParams] = useState({ 
    ...POWER_PLANT_PRESETS.gas_ccgt,
    typical_size_mw: 200,
    lifetime_years: 25,
    wacc: 0.075,
    fixed_om: {
      salaries_per_kw_yr: 12.0,
      overhaul_reserve_per_kw_yr: 10.0,
      insurance_per_kw_yr: 4.5,
      land_lease_per_kw_yr: 2.5
    },
    variable_om: {
      consumables_per_mwh: 1.2,
      water_treatment_per_mwh: 0.8,
      maintenance_per_mwh: 1.5
    }
  });

  const [carbonTax, setCarbonTax] = useState(25);
  const [currencyMode, setCurrencyMode] = useState(currencyService.getActiveCurrency());
  const [exchangeRate, setExchangeRate] = useState(currencyService.getExchangeRate());

  useEffect(() => {
    const unsub = currencyService.subscribe((state) => {
      setCurrencyMode(state.currency);
      setExchangeRate(state.exchangeRate);
    });
    return unsub;
  }, []);

  const handleSelectPreset = (key) => {
    setSelectedPresetKey(key);
    if (key === 'custom') {
      // Keep existing values or set clean editable slate
      return;
    }
    const preset = POWER_PLANT_PRESETS[key];
    setPlantParams({
      ...preset,
      typical_size_mw: preset.typical_size_mw || 200,
      lifetime_years: preset.lifetime_years || 25,
      wacc: preset.wacc || 0.075,
      fixed_om: {
        salaries_per_kw_yr: preset.fixed_om?.salaries_per_kw_yr ?? 12.0,
        overhaul_reserve_per_kw_yr: preset.fixed_om?.overhaul_reserve_per_kw_yr ?? 10.0,
        insurance_per_kw_yr: preset.fixed_om?.insurance_per_kw_yr ?? 4.5,
        land_lease_per_kw_yr: preset.fixed_om?.land_lease_per_kw_yr ?? 2.5
      },
      variable_om: {
        consumables_per_mwh: preset.variable_om?.consumables_per_mwh ?? 1.2,
        water_treatment_per_mwh: preset.variable_om?.water_treatment_per_mwh ?? 0.8,
        maintenance_per_mwh: preset.variable_om?.maintenance_per_mwh ?? 1.5
      }
    });
  };

  const handleSelectFuelType = (fuelKey) => {
    const fuel = FUEL_TYPES[fuelKey];
    if (!fuel) return;
    setPlantParams({
      ...plantParams,
      fuel_type: fuelKey,
      fuel_price_per_mmbtu: fuel.equivalent_price_mmbtu || fuel.defaultPrice
    });
  };

  const handleExchangeRateChange = (newRate) => {
    const num = parseFloat(newRate);
    if (!isNaN(num) && num > 0) {
      setExchangeRate(num);
      currencyService.setExchangeRate(num);
    }
  };

  const handleCurrencyToggle = (curr) => {
    setCurrencyMode(curr);
    currencyService.setActiveCurrency(curr);
  };

  const lcoeResult = calculateLCOE(plantParams, carbonTax);

  const isBdt = currencyMode === 'BDT';

  // Format Helpers
  const displayCapex = isBdt ? Math.round(plantParams.capex_per_kw * exchangeRate) : plantParams.capex_per_kw;
  const displayFuelPrice = isBdt ? Number((plantParams.fuel_price_per_mmbtu * exchangeRate).toFixed(1)) : plantParams.fuel_price_per_mmbtu;
  const displayCarbonTax = isBdt ? Math.round(carbonTax * exchangeRate) : carbonTax;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner: Archetypes & Dual Currency Exchange Controller */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} color="var(--accent-forest)" /> Generation Technology Archetypes & Manual Cost Modeler
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Enter ANY cost manually in BDT (৳) or USD ($) • Direct Numeric Inputs + Interactive Sliders • Full LCOE Breakdown
            </p>
          </div>

          {/* Currency Switcher & Live Exchange Rate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ background: '#F8FAFC', padding: '4px 6px', borderRadius: '10px', display: 'flex', border: '1px solid var(--border-subtle)', gap: '4px' }}>
              <button
                onClick={() => handleCurrencyToggle('BDT')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: isBdt ? 'var(--accent-emerald)' : 'transparent',
                  color: isBdt ? '#FFFFFF' : 'var(--text-secondary)'
                }}
              >
                BDT (৳)
              </button>
              <button
                onClick={() => handleCurrencyToggle('USD')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: !isBdt ? 'var(--accent-emerald)' : 'transparent',
                  color: !isBdt ? '#FFFFFF' : 'var(--text-secondary)'
                }}
              >
                USD ($)
              </button>
            </div>

            <div style={{ background: '#ECFDF5', padding: '6px 12px', borderRadius: '10px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-forest)', fontWeight: 600 }}>1 USD =</span>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => handleExchangeRateChange(e.target.value)}
                style={{
                  width: '65px',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid #A7F3D0',
                  background: '#FFFFFF',
                  color: 'var(--accent-forest)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  outline: 'none',
                  textAlign: 'center'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-forest)', fontWeight: 700 }}>BDT</span>
            </div>

            <button 
              onClick={() => handleSelectPreset(selectedPresetKey)}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
              title="Reset Parameters"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Plant Archetypes Buttons + Custom Manual Entry Option */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {/* Custom Manual Card */}
          <button
            onClick={() => handleSelectPreset('custom')}
            style={{
              padding: '12px 10px',
              borderRadius: '12px',
              border: selectedPresetKey === 'custom' ? `2px solid var(--accent-emerald)` : '1px solid var(--border-subtle)',
              background: selectedPresetKey === 'custom' ? '#ECFDF5' : '#FFFFFF',
              boxShadow: selectedPresetKey === 'custom' ? '0 2px 10px rgba(16, 185, 129, 0.15)' : 'none',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#10B98115', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
              <Edit3 size={18} />
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: selectedPresetKey === 'custom' ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
              ✍️ Custom Manual
            </div>
            <span className="badge badge-stable" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
              Full Manual Entry
            </span>
          </button>

          {Object.entries(POWER_PLANT_PRESETS).map(([key, preset]) => {
            const isSelected = selectedPresetKey === key;
            return (
              <button
                key={key}
                onClick={() => handleSelectPreset(key)}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  border: isSelected ? `2px solid var(--accent-emerald)` : '1px solid var(--border-subtle)',
                  background: isSelected ? '#ECFDF5' : '#FFFFFF',
                  boxShadow: isSelected ? '0 2px 10px rgba(16, 185, 129, 0.15)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${preset.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: preset.color
                }}>
                  <Zap size={18} />
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? 'var(--accent-forest)' : 'var(--text-primary)', lineHeight: 1.2 }}>
                  {preset.name.split(' (')[0]}
                </div>
                <span className="badge" style={{ fontSize: '0.62rem', padding: '2px 6px', background: `${preset.color}15`, color: preset.color }}>
                  {preset.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Parameters Inputs on Left, Dual Currency Output on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Comprehensive Manual Cost Inputs */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-forest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} /> Cost Parameters ({isBdt ? 'Bangladeshi Taka ৳' : 'US Dollar $'})
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Type numbers directly or use sliders
            </span>
          </div>

          {/* Plant Capacity & Capital Expenditure (CAPEX) */}
          <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={16} color="var(--accent-forest)" /> Capital Cost & Sizing
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Plant Size in MW */}
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Rated Plant Capacity (MW):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    step="1"
                    value={plantParams.typical_size_mw || 200}
                    onChange={(e) => setPlantParams({ ...plantParams, typical_size_mw: parseFloat(e.target.value) || 1 })}
                    style={inputNumberStyle}
                  />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>MW</span>
                </div>
              </div>

              {/* Capacity Factor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Capacity Factor (CF):</span>
                  <span className="mono" style={{ color: 'var(--accent-forest)', fontWeight: 700 }}>
                    {((plantParams.capacity_factor || 0.7) * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="0.10"
                    max="0.98"
                    step="0.01"
                    value={plantParams.capacity_factor || 0.7}
                    onChange={(e) => setPlantParams({ ...plantParams, capacity_factor: parseFloat(e.target.value) })}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="10"
                    max="98"
                    step="1"
                    value={Math.round((plantParams.capacity_factor || 0.7) * 100)}
                    onChange={(e) => setPlantParams({ ...plantParams, capacity_factor: (parseFloat(e.target.value) || 10) / 100 })}
                    style={{ width: '60px', ...inputNumberStyle }}
                  />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>%</span>
                </div>
              </div>
            </div>

            {/* Overnight CAPEX */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Overnight CAPEX ({isBdt ? '৳ / kW' : '$ / kW'}):</span>
                <span className="mono" style={{ color: 'var(--accent-forest)', fontWeight: 700 }}>
                  {isBdt ? `৳ ${displayCapex.toLocaleString()} / kW` : `$ ${plantParams.capex_per_kw} / kW`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min={isBdt ? 30000 : 250}
                  max={isBdt ? 840000 : 7000}
                  step={isBdt ? 5000 : 50}
                  value={displayCapex}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPlantParams({
                      ...plantParams,
                      capex_per_kw: isBdt ? Math.round(val / exchangeRate) : val
                    });
                  }}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  min="50"
                  step={isBdt ? 1000 : 25}
                  value={displayCapex}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setPlantParams({
                      ...plantParams,
                      capex_per_kw: isBdt ? Math.round(val / exchangeRate) : val
                    });
                  }}
                  style={{ width: '110px', ...inputNumberStyle }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {isBdt ? '৳/kW' : '$/kW'}
                </span>
              </div>
            </div>

            {/* Lifetime and WACC */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Project Lifetime (Years):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    step="1"
                    value={plantParams.lifetime_years || 25}
                    onChange={(e) => setPlantParams({ ...plantParams, lifetime_years: parseInt(e.target.value, 10) || 25 })}
                    style={inputNumberStyle}
                  />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Years</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Discount Rate / WACC (%):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    step="0.1"
                    value={((plantParams.wacc || 0.075) * 100).toFixed(1)}
                    onChange={(e) => setPlantParams({ ...plantParams, wacc: (parseFloat(e.target.value) || 7.5) / 100 })}
                    style={inputNumberStyle}
                  />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fuel Commodity & Price Settings */}
          <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              <Fuel size={16} color="var(--accent-forest)" /> Fuel Price & Heat Rate (Efficiency)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Fuel Commodity:
                </label>
                <select
                  value={plantParams.fuel_type || 'natural_gas'}
                  onChange={(e) => handleSelectFuelType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: '#FFFFFF',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  {Object.entries(FUEL_TYPES).map(([fKey, fuel]) => (
                    <option key={fKey} value={fKey}>
                      {fuel.name} ({isBdt ? fuel.unitBdt : fuel.unitUsd})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Fuel Price:</span>
                  <span className="mono" style={{ color: 'var(--accent-forest)', fontWeight: 700 }}>
                    {isBdt ? `৳ ${displayFuelPrice} / MMBtu` : `$ ${plantParams.fuel_price_per_mmbtu} / MMBtu`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max={isBdt ? 3600 : 30.0} 
                    step={isBdt ? 25 : 0.25}
                    value={displayFuelPrice || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setPlantParams({
                        ...plantParams,
                        fuel_price_per_mmbtu: isBdt ? val / exchangeRate : val
                      });
                    }}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="0"
                    step={isBdt ? 5 : 0.1}
                    value={displayFuelPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPlantParams({
                        ...plantParams,
                        fuel_price_per_mmbtu: isBdt ? val / exchangeRate : val
                      });
                    }}
                    style={{ width: '85px', ...inputNumberStyle }}
                  />
                </div>
              </div>
            </div>

            {/* Heat Rate Input */}
            {plantParams.heat_rate_btu_kwh > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Heat Rate:</span>
                  <span className="mono" style={{ color: 'var(--accent-forest)', fontWeight: 700 }}>
                    {plantParams.heat_rate_btu_kwh} Btu/kWh ({((3412.14 / plantParams.heat_rate_btu_kwh) * 100).toFixed(1)}% Efficiency)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="range" 
                    min="5000" 
                    max="14000" 
                    step="50"
                    value={plantParams.heat_rate_btu_kwh}
                    onChange={(e) => setPlantParams({ ...plantParams, heat_rate_btu_kwh: parseInt(e.target.value, 10) })}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="3000"
                    max="20000"
                    step="50"
                    value={plantParams.heat_rate_btu_kwh}
                    onChange={(e) => setPlantParams({ ...plantParams, heat_rate_btu_kwh: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '85px', ...inputNumberStyle }}
                  />
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Btu/kWh</span>
                </div>
              </div>
            )}
          </div>

          {/* Granular Fixed & Variable O&M Inputs */}
          <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              <Wrench size={16} color="var(--accent-forest)" /> Granular O&M Cost Manual Inputs
            </div>

            {/* Fixed O&M */}
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '2px' }}>
              Fixed O&M ({isBdt ? '৳ / kW-year' : '$ / kW-year'}):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                  Labor & Salaries:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    step={isBdt ? 50 : 0.5}
                    value={isBdt ? Math.round((plantParams.fixed_om?.salaries_per_kw_yr || 12) * exchangeRate) : (plantParams.fixed_om?.salaries_per_kw_yr || 12)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPlantParams({
                        ...plantParams,
                        fixed_om: { ...plantParams.fixed_om, salaries_per_kw_yr: isBdt ? val / exchangeRate : val }
                      });
                    }}
                    style={inputNumberStyle}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{isBdt ? '৳' : '$'}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                  Major Overhaul Reserve:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    step={isBdt ? 50 : 0.5}
                    value={isBdt ? Math.round((plantParams.fixed_om?.overhaul_reserve_per_kw_yr || 10) * exchangeRate) : (plantParams.fixed_om?.overhaul_reserve_per_kw_yr || 10)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPlantParams({
                        ...plantParams,
                        fixed_om: { ...plantParams.fixed_om, overhaul_reserve_per_kw_yr: isBdt ? val / exchangeRate : val }
                      });
                    }}
                    style={inputNumberStyle}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{isBdt ? '৳' : '$'}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                  Insurance & Compliance:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    step={isBdt ? 20 : 0.2}
                    value={isBdt ? Math.round((plantParams.fixed_om?.insurance_per_kw_yr || 4.5) * exchangeRate) : (plantParams.fixed_om?.insurance_per_kw_yr || 4.5)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPlantParams({
                        ...plantParams,
                        fixed_om: { ...plantParams.fixed_om, insurance_per_kw_yr: isBdt ? val / exchangeRate : val }
                      });
                    }}
                    style={inputNumberStyle}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{isBdt ? '৳' : '$'}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                  Land Lease & Municipal:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    step={isBdt ? 10 : 0.1}
                    value={isBdt ? Math.round((plantParams.fixed_om?.land_lease_per_kw_yr || 2.5) * exchangeRate) : (plantParams.fixed_om?.land_lease_per_kw_yr || 2.5)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPlantParams({
                        ...plantParams,
                        fixed_om: { ...plantParams.fixed_om, land_lease_per_kw_yr: isBdt ? val / exchangeRate : val }
                      });
                    }}
                    style={inputNumberStyle}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{isBdt ? '৳' : '$'}</span>
                </div>
              </div>
            </div>

            {/* Variable O&M */}
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '4px' }}>
              Variable O&M ({isBdt ? '৳ / kWh' : '$ / MWh'}):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                  Lube Oil & Consumables:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    step={isBdt ? 0.05 : 0.1}
                    value={isBdt ? Number(((plantParams.variable_om?.consumables_per_mwh || 1.2) * exchangeRate / 1000).toFixed(2)) : (plantParams.variable_om?.consumables_per_mwh || 1.2)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPlantParams({
                        ...plantParams,
                        variable_om: { ...plantParams.variable_om, consumables_per_mwh: isBdt ? (val * 1000) / exchangeRate : val }
                      });
                    }}
                    style={inputNumberStyle}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{isBdt ? '৳/kWh' : '$/MWh'}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                  Maintenance & Spares:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    step={isBdt ? 0.05 : 0.1}
                    value={isBdt ? Number(((plantParams.variable_om?.maintenance_per_mwh || 1.5) * exchangeRate / 1000).toFixed(2)) : (plantParams.variable_om?.maintenance_per_mwh || 1.5)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPlantParams({
                        ...plantParams,
                        variable_om: { ...plantParams.variable_om, maintenance_per_mwh: isBdt ? (val * 1000) / exchangeRate : val }
                      });
                    }}
                    style={inputNumberStyle}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{isBdt ? '৳/kWh' : '$/MWh'}</span>
                </div>
              </div>
            </div>

            {/* Carbon Tax */}
            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Carbon Tax ({isBdt ? '৳ / tCO₂' : '$ / tCO₂'}):</span>
                <span className="mono" style={{ color: 'var(--accent-forest)', fontWeight: 700 }}>
                  {isBdt ? `৳ ${displayCarbonTax} / tCO₂` : `$ ${carbonTax} / tCO₂`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="range" 
                  min="0" 
                  max={isBdt ? 12000 : 100} 
                  step={isBdt ? 100 : 1}
                  value={displayCarbonTax}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setCarbonTax(isBdt ? Math.round(val / exchangeRate) : val);
                  }}
                  style={{ flex: 1 }}
                />
                <input 
                  type="number"
                  min="0"
                  step={isBdt ? 50 : 1}
                  value={displayCarbonTax}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setCarbonTax(isBdt ? Math.round(val / exchangeRate) : val);
                  }}
                  style={{ width: '85px', ...inputNumberStyle }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dual Currency Total Cost Output Cards & Breakdown Stack */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div className="metric-card" style={{ borderTop: '3px solid var(--accent-emerald)', background: '#ECFDF5' }}>
              <span className="metric-label">Levelized Tariff (LCOE)</span>
              <span className="metric-value" style={{ color: 'var(--accent-forest)' }}>৳ {lcoeResult.totalLcoeBdtKwh}</span>
              <span className="metric-sub">৳ / kWh ($ {lcoeResult.totalLCOE} / MWh)</span>
            </div>

            <div className="metric-card" style={{ borderTop: '3px solid #0284C7' }}>
              <span className="metric-label">Total Overnight CAPEX</span>
              <span className="metric-value" style={{ color: '#0284C7' }}>৳ {lcoeResult.totals.totalCapexCroreBdt.toLocaleString()}</span>
              <span className="metric-sub">Crore BDT ($ {lcoeResult.totals.totalCapexMillionUsd} M)</span>
            </div>

            <div className="metric-card" style={{ borderTop: '3px solid #D97706' }}>
              <span className="metric-label">Annual Operating Cost</span>
              <span className="metric-value" style={{ color: '#D97706' }}>৳ {lcoeResult.totals.annualOperatingCostCroreBdt.toLocaleString()}</span>
              <span className="metric-sub">Crore BDT / yr ($ {lcoeResult.totals.annualOperatingCostMillionUsd} M)</span>
            </div>
          </div>

          {/* Dual Currency Per-Unit Cost Breakdown Stack */}
          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Per-Unit Cost Breakdown Stack
              </h5>
              <span className="badge badge-stable" style={{ fontSize: '0.68rem' }}>
                {isBdt ? '৳ / kWh' : '$ / MWh'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Capital */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                  <span style={{ color: '#0284C7', fontWeight: 600 }}>Capital Recovery Amortization</span>
                  <span className="mono" style={{ color: 'var(--text-primary)' }}>
                    ৳ {lcoeResult.breakdownBdt.capital}/kWh ($ {lcoeResult.breakdown.capital}/MWh) • {lcoeResult.percentages.capital}%
                  </span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${lcoeResult.percentages.capital}%`, background: '#0284C7' }} />
                </div>
              </div>

              {/* Fuel */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                  <span style={{ color: '#D97706', fontWeight: 600 }}>Fuel Energy Cost</span>
                  <span className="mono" style={{ color: 'var(--text-primary)' }}>
                    ৳ {lcoeResult.breakdownBdt.fuel}/kWh ($ {lcoeResult.breakdown.fuel}/MWh) • {lcoeResult.percentages.fuel}%
                  </span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${lcoeResult.percentages.fuel}%`, background: '#D97706' }} />
                </div>
              </div>

              {/* Fixed O&M */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--accent-forest)', fontWeight: 600 }}>Fixed O&M (Labor, Insurance, Overhaul)</span>
                  <span className="mono" style={{ color: 'var(--text-primary)' }}>
                    ৳ {lcoeResult.breakdownBdt.fixedOm}/kWh ($ {lcoeResult.breakdown.fixedOm}/MWh) • {lcoeResult.percentages.fixedOm}%
                  </span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${lcoeResult.percentages.fixedOm}%`, background: 'var(--accent-emerald)' }} />
                </div>
              </div>

              {/* Variable O&M */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                  <span style={{ color: '#059669', fontWeight: 600 }}>Variable O&M (Lubricants, Water, Wear Parts)</span>
                  <span className="mono" style={{ color: 'var(--text-primary)' }}>
                    ৳ {lcoeResult.breakdownBdt.variableOm}/kWh ($ {lcoeResult.breakdown.variableOm}/MWh) • {lcoeResult.percentages.variableOm}%
                  </span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${lcoeResult.percentages.variableOm}%`, background: '#059669' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#ECFDF5', padding: '12px 14px', borderRadius: '10px', border: '1px solid #A7F3D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-forest)' }}>
              Short-Run Marginal Cost (SRMC Dispatch Bid):
            </span>
            <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-forest)' }}>
              ৳ {lcoeResult.srmcBdtKwh} / kWh ($ {lcoeResult.srmc} / MWh)
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}

const inputNumberStyle = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: '8px',
  border: '1px solid var(--border-subtle)',
  background: '#FFFFFF',
  color: 'var(--text-primary)',
  fontSize: '0.8rem',
  fontWeight: 700,
  outline: 'none',
  textAlign: 'right'
};
