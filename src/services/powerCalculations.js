/**
 * Power Sector Calculations Engine
 * Models for LCOE/LCOS, Dual Currency (USD $ & BDT ৳), Fuel Type selection with calorific heat rates,
 * Granular Fixed & Variable O&M breakdown, Merit Order Dispatch,
 * and 3-Phase Synchronous Generator Electrical/Mechanical equations.
 */

import { currencyService } from './currencyService.js';

export const FUEL_TYPES = {
  natural_gas: {
    id: 'natural_gas',
    name: 'Natural Gas (Pipeline)',
    unitUsd: '$/MMBtu',
    unitBdt: '৳/MMBtu',
    defaultPrice: 4.5,
    heatingValueMjKg: 50.0,
    emissions_tco2_per_mmbtu: 0.053,
    color: '#F59E0B'
  },
  lng: {
    id: 'lng',
    name: 'Liquefied Natural Gas (LNG)',
    unitUsd: '$/MMBtu',
    unitBdt: '৳/MMBtu',
    defaultPrice: 11.5,
    heatingValueMjKg: 52.5,
    emissions_tco2_per_mmbtu: 0.058,
    color: '#0284C7'
  },
  hfo: {
    id: 'hfo',
    name: 'Heavy Fuel Oil (HFO 380 cSt)',
    unitUsd: '$/metric ton',
    unitBdt: '৳/metric ton',
    defaultPrice: 480,
    heatingValueMjKg: 40.5,
    emissions_tco2_per_mmbtu: 0.074,
    equivalent_price_mmbtu: 12.2,
    color: '#78716C'
  },
  diesel_lfo: {
    id: 'diesel_lfo',
    name: 'Light Fuel Oil (Diesel / LFO)',
    unitUsd: '$/liter',
    unitBdt: '৳/liter',
    defaultPrice: 0.88,
    heatingValueMjKg: 43.0,
    emissions_tco2_per_mmbtu: 0.070,
    equivalent_price_mmbtu: 23.5,
    color: '#EA580C'
  },
  coal_subbituminous: {
    id: 'coal_subbituminous',
    name: 'Coal (Sub-bituminous / Anthracite)',
    unitUsd: '$/metric ton',
    unitBdt: '৳/metric ton',
    defaultPrice: 95,
    heatingValueMjKg: 24.0,
    emissions_tco2_per_mmbtu: 0.095,
    equivalent_price_mmbtu: 3.8,
    color: '#475569'
  },
  biomass: {
    id: 'biomass',
    name: 'Biomass / Wood Pellets',
    unitUsd: '$/metric ton',
    unitBdt: '৳/metric ton',
    defaultPrice: 75,
    heatingValueMjKg: 17.5,
    emissions_tco2_per_mmbtu: 0.008,
    equivalent_price_mmbtu: 4.2,
    color: '#16A34A'
  },
  uranium: {
    id: 'uranium',
    name: 'Nuclear Uranium (UO₂ Fuel)',
    unitUsd: '$/kg UO₂',
    unitBdt: '৳/kg UO₂',
    defaultPrice: 1500,
    heatingValueMjKg: 500000,
    emissions_tco2_per_mmbtu: 0.0,
    equivalent_price_mmbtu: 0.75,
    color: '#7C3AED'
  },
  zero_fuel: {
    id: 'zero_fuel',
    name: 'Zero Fuel (Clean Solar/Wind/Hydro)',
    unitUsd: 'N/A',
    unitBdt: 'N/A',
    defaultPrice: 0.0,
    heatingValueMjKg: 0.0,
    emissions_tco2_per_mmbtu: 0.0,
    color: '#10B981'
  }
};

export const POWER_PLANT_PRESETS = {
  solar_pv: {
    id: 'solar_pv',
    name: 'Solar PV (Utility Single-Axis)',
    category: 'Renewable',
    fuel_type: 'zero_fuel',
    capex_per_kw: 850,
    fixed_om: {
      salaries_per_kw_yr: 4.5,
      overhaul_reserve_per_kw_yr: 3.0,
      insurance_per_kw_yr: 4.5,
      land_lease_per_kw_yr: 2.0
    },
    variable_om: {
      consumables_per_mwh: 0.0,
      water_cooling_per_mwh: 0.0,
      maintenance_per_mwh: 0.0
    },
    heat_rate_btu_kwh: 0,
    fuel_price_per_mmbtu: 0,
    capacity_factor: 0.28,
    lifetime_years: 25,
    wacc: 0.065,
    emissions_tco2_per_mwh: 0,
    typical_size_mw: 100,
    nominal_voltage_kv: 33.0,
    poles: 0,
    nominal_rpm: 0,
    color: '#059669'
  },
  onshore_wind: {
    id: 'onshore_wind',
    name: 'Onshore Wind Turbine',
    category: 'Renewable',
    fuel_type: 'zero_fuel',
    capex_per_kw: 1300,
    fixed_om: {
      salaries_per_kw_yr: 8.0,
      overhaul_reserve_per_kw_yr: 11.0,
      insurance_per_kw_yr: 6.5,
      land_lease_per_kw_yr: 2.5
    },
    variable_om: {
      consumables_per_mwh: 0.8,
      water_cooling_per_mwh: 0.0,
      maintenance_per_mwh: 0.7
    },
    heat_rate_btu_kwh: 0,
    fuel_price_per_mmbtu: 0,
    capacity_factor: 0.38,
    lifetime_years: 25,
    wacc: 0.065,
    emissions_tco2_per_mwh: 0,
    typical_size_mw: 150,
    nominal_voltage_kv: 33.0,
    poles: 4,
    nominal_rpm: 1500,
    color: '#10B981'
  },
  gas_ccgt: {
    id: 'gas_ccgt',
    name: 'Combined Cycle Gas Turbine (CCGT)',
    category: 'Thermal',
    fuel_type: 'natural_gas',
    capex_per_kw: 1100,
    fixed_om: {
      salaries_per_kw_yr: 5.5,
      overhaul_reserve_per_kw_yr: 6.0,
      insurance_per_kw_yr: 3.5,
      land_lease_per_kw_yr: 1.0
    },
    variable_om: {
      consumables_per_mwh: 1.2,
      water_cooling_per_mwh: 0.9,
      maintenance_per_mwh: 1.4
    },
    heat_rate_btu_kwh: 6400,
    fuel_price_per_mmbtu: 4.5,
    capacity_factor: 0.70,
    lifetime_years: 30,
    wacc: 0.075,
    emissions_tco2_per_mwh: 0.36,
    typical_size_mw: 450,
    nominal_voltage_kv: 15.75,
    poles: 2,
    nominal_rpm: 3000,
    color: '#0284C7'
  },
  hfo_plant: {
    id: 'hfo_plant',
    name: 'HFO Heavy Fuel Oil Engine Plant',
    category: 'Thermal',
    fuel_type: 'hfo',
    capex_per_kw: 920,
    fixed_om: {
      salaries_per_kw_yr: 6.5,
      overhaul_reserve_per_kw_yr: 8.5,
      insurance_per_kw_yr: 4.0,
      land_lease_per_kw_yr: 1.0
    },
    variable_om: {
      consumables_per_mwh: 2.8,
      water_cooling_per_mwh: 1.1,
      maintenance_per_mwh: 2.5
    },
    heat_rate_btu_kwh: 7800,
    fuel_price_per_mmbtu: 12.2,
    capacity_factor: 0.65,
    lifetime_years: 25,
    wacc: 0.080,
    emissions_tco2_per_mwh: 0.72,
    typical_size_mw: 200,
    nominal_voltage_kv: 11.0,
    poles: 8,
    nominal_rpm: 750,
    color: '#78716C'
  },
  diesel_generator: {
    id: 'diesel_generator',
    name: 'High-Speed Diesel Peaker (LFO)',
    category: 'Thermal',
    fuel_type: 'diesel_lfo',
    capex_per_kw: 650,
    fixed_om: {
      salaries_per_kw_yr: 4.0,
      overhaul_reserve_per_kw_yr: 5.0,
      insurance_per_kw_yr: 3.0,
      land_lease_per_kw_yr: 1.0
    },
    variable_om: {
      consumables_per_mwh: 3.5,
      water_cooling_per_mwh: 0.8,
      maintenance_per_mwh: 3.2
    },
    heat_rate_btu_kwh: 9200,
    fuel_price_per_mmbtu: 23.5,
    capacity_factor: 0.15,
    lifetime_years: 20,
    wacc: 0.085,
    emissions_tco2_per_mwh: 0.68,
    typical_size_mw: 80,
    nominal_voltage_kv: 11.0,
    poles: 4,
    nominal_rpm: 1500,
    color: '#EA580C'
  },
  supercritical_coal: {
    id: 'supercritical_coal',
    name: 'Supercritical Coal Plant',
    category: 'Thermal',
    fuel_type: 'coal_subbituminous',
    capex_per_kw: 2200,
    fixed_om: {
      salaries_per_kw_yr: 15.0,
      overhaul_reserve_per_kw_yr: 16.0,
      insurance_per_kw_yr: 8.0,
      land_lease_per_kw_yr: 3.0
    },
    variable_om: {
      consumables_per_mwh: 1.8,
      water_cooling_per_mwh: 1.4,
      maintenance_per_mwh: 1.6
    },
    heat_rate_btu_kwh: 8600,
    fuel_price_per_mmbtu: 3.8,
    capacity_factor: 0.75,
    lifetime_years: 40,
    wacc: 0.085,
    emissions_tco2_per_mwh: 0.95,
    typical_size_mw: 600,
    nominal_voltage_kv: 22.0,
    poles: 2,
    nominal_rpm: 3000,
    color: '#475569'
  },
  nuclear_smr: {
    id: 'nuclear_smr',
    name: 'Nuclear SMR (Small Modular Reactor)',
    category: 'Nuclear',
    fuel_type: 'uranium',
    capex_per_kw: 5500,
    fixed_om: {
      salaries_per_kw_yr: 45.0,
      overhaul_reserve_per_kw_yr: 35.0,
      insurance_per_kw_yr: 25.0,
      land_lease_per_kw_yr: 5.0
    },
    variable_om: {
      consumables_per_mwh: 1.2,
      water_cooling_per_mwh: 0.6,
      maintenance_per_mwh: 0.6
    },
    heat_rate_btu_kwh: 10200,
    fuel_price_per_mmbtu: 0.75,
    capacity_factor: 0.92,
    lifetime_years: 50,
    wacc: 0.070,
    emissions_tco2_per_mwh: 0,
    typical_size_mw: 300,
    nominal_voltage_kv: 18.0,
    poles: 2,
    nominal_rpm: 3000,
    color: '#7C3AED'
  },
  hydro_dam: {
    id: 'hydro_dam',
    name: 'Hydroelectric (Reservoir Dam)',
    category: 'Hydro',
    fuel_type: 'zero_fuel',
    capex_per_kw: 3200,
    fixed_om: {
      salaries_per_kw_yr: 14.0,
      overhaul_reserve_per_kw_yr: 12.0,
      insurance_per_kw_yr: 7.0,
      land_lease_per_kw_yr: 2.0
    },
    variable_om: {
      consumables_per_mwh: 0.5,
      water_cooling_per_mwh: 0.0,
      maintenance_per_mwh: 1.5
    },
    heat_rate_btu_kwh: 0,
    fuel_price_per_mmbtu: 0,
    capacity_factor: 0.52,
    lifetime_years: 60,
    wacc: 0.060,
    emissions_tco2_per_mwh: 0,
    typical_size_mw: 500,
    nominal_voltage_kv: 15.75,
    poles: 12,
    nominal_rpm: 500,
    color: '#2563EB'
  }
};

export function calculateCRF(discountRate, lifetimeYears) {
  if (discountRate <= 0) return 1 / lifetimeYears;
  const r = discountRate;
  const n = lifetimeYears;
  const factor = Math.pow(1 + r, n);
  return (r * factor) / (factor - 1);
}

/**
 * Calculates Levelized Cost of Electricity (LCOE) with Dual Currency (USD $ & BDT ৳)
 */
export function calculateLCOE(params, carbonTaxPerTon = 25) {
  const {
    capex_per_kw = 1000,
    fixed_om = { salaries_per_kw_yr: 5, overhaul_reserve_per_kw_yr: 5, insurance_per_kw_yr: 3, land_lease_per_kw_yr: 1 },
    variable_om = { consumables_per_mwh: 1.0, water_cooling_per_mwh: 0.5, maintenance_per_mwh: 1.0 },
    fixed_om_per_kw_yr = null,
    variable_om_per_mwh = null,
    heat_rate_btu_kwh = 0,
    fuel_price_per_mmbtu = 0,
    fuel_type = 'natural_gas',
    capacity_factor = 0.5,
    lifetime_years = 25,
    wacc = 0.07,
    emissions_tco2_per_mwh = 0,
    typical_size_mw = 100
  } = params;

  const rate = currencyService.getExchangeRate();
  const annualMwhPerKw = (8760 * Math.max(0.01, capacity_factor)) / 1000;

  // 1. Capital Recovery Cost ($/MWh)
  const crf = calculateCRF(wacc, lifetime_years);
  const annualizedCapexPerKw = capex_per_kw * crf;
  const capitalCostPerMwh = annualizedCapexPerKw / annualMwhPerKw;

  // 2. Granular Fixed O&M ($/MWh)
  const totalFixedOmPerKwYr = fixed_om_per_kw_yr !== null 
    ? fixed_om_per_kw_yr 
    : Object.values(fixed_om).reduce((a, b) => a + (Number(b) || 0), 0);
  
  const fixedOmPerMwh = totalFixedOmPerKwYr / annualMwhPerKw;

  // 3. Granular Variable O&M ($/MWh)
  const totalVariableOmPerMwh = variable_om_per_mwh !== null
    ? variable_om_per_mwh
    : Object.values(variable_om).reduce((a, b) => a + (Number(b) || 0), 0);

  // 4. Fuel Cost ($/MWh)
  const mmbtuPerMwh = heat_rate_btu_kwh / 1000;
  const fuelCostPerMwh = mmbtuPerMwh * fuel_price_per_mmbtu;

  // 5. Environmental / Carbon Cost ($/MWh)
  const carbonCostPerMwh = emissions_tco2_per_mwh * carbonTaxPerTon;

  // Total LCOE ($/MWh)
  const totalLCOE = capitalCostPerMwh + fixedOmPerMwh + totalVariableOmPerMwh + fuelCostPerMwh + carbonCostPerMwh;
  const srmc = totalVariableOmPerMwh + fuelCostPerMwh + carbonCostPerMwh;

  // BDT Equivalents
  const totalLcoeBdtKwh = currencyService.usdMwhToBdtKwh(totalLCOE);
  const totalLcoeBdtMwh = totalLCOE * rate;
  const srmcBdtKwh = currencyService.usdMwhToBdtKwh(srmc);

  // Total Plant Capital Cost in USD Millions and BDT Crores
  const totalPlantCapexUsd = typical_size_mw * 1000 * capex_per_kw;
  const totalCapexMillionUsd = totalPlantCapexUsd / 1e6;
  const totalCapexCroreBdt = currencyService.usdToCroreBdt(totalPlantCapexUsd);

  // Annual Generation and Total Operating Cost
  const annualGenMwh = typical_size_mw * 8760 * capacity_factor;
  const annualOperatingCostUsd = annualGenMwh * (fuelCostPerMwh + fixedOmPerMwh + totalVariableOmPerMwh + carbonCostPerMwh);
  const annualOperatingCostCroreBdt = currencyService.usdToCroreBdt(annualOperatingCostUsd);

  return {
    totalLCOE: Number(totalLCOE.toFixed(2)),
    totalLcoeCentsKwh: Number((totalLCOE / 10).toFixed(2)),
    totalLcoeBdtKwh: Number(totalLcoeBdtKwh.toFixed(2)),
    totalLcoeBdtMwh: Number(totalLcoeBdtMwh.toFixed(2)),
    srmc: Number(srmc.toFixed(2)),
    srmcBdtKwh: Number(srmcBdtKwh.toFixed(2)),
    exchangeRate: rate,
    breakdown: {
      capital: Number(capitalCostPerMwh.toFixed(2)),
      fixedOm: Number(fixedOmPerMwh.toFixed(2)),
      variableOm: Number(totalVariableOmPerMwh.toFixed(2)),
      fuel: Number(fuelCostPerMwh.toFixed(2)),
      carbon: Number(carbonCostPerMwh.toFixed(2))
    },
    breakdownBdt: {
      capital: Number(currencyService.usdMwhToBdtKwh(capitalCostPerMwh).toFixed(2)),
      fixedOm: Number(currencyService.usdMwhToBdtKwh(fixedOmPerMwh).toFixed(2)),
      variableOm: Number(currencyService.usdMwhToBdtKwh(totalVariableOmPerMwh).toFixed(2)),
      fuel: Number(currencyService.usdMwhToBdtKwh(fuelCostPerMwh).toFixed(2)),
      carbon: Number(currencyService.usdMwhToBdtKwh(carbonCostPerMwh).toFixed(2))
    },
    granularFixedOm: {
      salaries: Number(((fixed_om.salaries_per_kw_yr || 0) / annualMwhPerKw).toFixed(2)),
      overhaul: Number(((fixed_om.overhaul_reserve_per_kw_yr || 0) / annualMwhPerKw).toFixed(2)),
      insurance: Number(((fixed_om.insurance_per_kw_yr || 0) / annualMwhPerKw).toFixed(2)),
      land: Number(((fixed_om.land_lease_per_kw_yr || 0) / annualMwhPerKw).toFixed(2))
    },
    granularVarOm: {
      consumables: Number((variable_om.consumables_per_mwh || 0).toFixed(2)),
      water: Number((variable_om.water_cooling_per_mwh || 0).toFixed(2)),
      maintenance: Number((variable_om.maintenance_per_mwh || 0).toFixed(2))
    },
    percentages: {
      capital: Number(((capitalCostPerMwh / totalLCOE) * 100).toFixed(1)),
      fixedOm: Number(((fixedOmPerMwh / totalLCOE) * 100).toFixed(1)),
      variableOm: Number(((totalVariableOmPerMwh / totalLCOE) * 100).toFixed(1)),
      fuel: Number(((fuelCostPerMwh / totalLCOE) * 100).toFixed(1)),
      carbon: Number(((carbonCostPerMwh / totalLCOE) * 100).toFixed(1))
    },
    totals: {
      totalCapexMillionUsd: Number(totalCapexMillionUsd.toFixed(2)),
      totalCapexCroreBdt: Number(totalCapexCroreBdt.toFixed(2)),
      annualOperatingCostMillionUsd: Number((annualOperatingCostUsd / 1e6).toFixed(2)),
      annualOperatingCostCroreBdt: Number(annualOperatingCostCroreBdt.toFixed(2))
    },
    metrics: {
      crf: Number(crf.toFixed(4)),
      annualMwhPerKw: Number(annualMwhPerKw.toFixed(3)),
      annualGenerationGwh_100MW: Number(((annualMwhPerKw * 100000) / 1000).toFixed(1))
    }
  };
}

/**
 * 3-Phase Synchronous Generator Electrical & Mechanical Calculations
 */
export function calculateGeneratorElectricalParameters(activePowerMw, powerFactor = 0.88, lineVoltageKv = 15.75, poles = 2, freqHz = 50.00) {
  const pWatts = activePowerMw * 1e6;
  const vVolts = lineVoltageKv * 1e3;
  const pf = Math.max(0.1, Math.min(1.0, powerFactor));
  
  const apparentPowerMva = activePowerMw / pf;
  const sinPhi = Math.sqrt(Math.max(0, 1 - pf * pf));
  const reactivePowerMvar = apparentPowerMva * sinPhi;
  const currentAmperes = pWatts / (Math.sqrt(3) * vVolts * pf);
  const phaseVoltageKv = lineVoltageKv / Math.sqrt(3);
  const rpm = poles > 0 ? (120 * freqHz) / poles : 0;
  const omegaM = (2 * Math.PI * rpm) / 60;
  const torqueNm = omegaM > 0 ? pWatts / omegaM : 0;

  return {
    activePowerMw: Number(activePowerMw.toFixed(2)),
    reactivePowerMvar: Number(reactivePowerMvar.toFixed(2)),
    apparentPowerMva: Number(apparentPowerMva.toFixed(2)),
    powerFactor: Number(pf.toFixed(3)),
    powerFactorType: 'Lagging (Inductive)',
    lineVoltageKv: Number(lineVoltageKv.toFixed(3)),
    phaseVoltageKv: Number(phaseVoltageKv.toFixed(3)),
    currentAmperes: Number(currentAmperes.toFixed(1)),
    currentKiloAmps: Number((currentAmperes / 1000).toFixed(3)),
    frequencyHz: Number(freqHz.toFixed(3)),
    poles,
    rpm: Number(rpm.toFixed(1)),
    torqueKiloNm: Number((torqueNm / 1000).toFixed(2))
  };
}

export function simulateMeritOrderDispatch(generators, demandMw, carbonTax = 25) {
  const rate = currencyService.getExchangeRate();
  const evaluatedUnits = generators.map(unit => {
    const mmbtuPerMwh = (unit.heat_rate_btu_kwh || 0) / 1000;
    const fuelCost = mmbtuPerMwh * (unit.fuel_price_per_mmbtu || 0);
    const carbonCost = (unit.emissions_tco2_per_mwh || 0) * carbonTax;
    const srmc = Number(((unit.variable_om_per_mwh || 0) + fuelCost + carbonCost).toFixed(2));
    const availableCapacity = unit.is_outage ? 0 : (unit.capacity_mw * (unit.availability_factor ?? 1.0));

    return {
      ...unit,
      srmc,
      srmcBdtKwh: Number(currencyService.usdMwhToBdtKwh(srmc).toFixed(2)),
      fuelCost: Number(fuelCost.toFixed(2)),
      carbonCost: Number(carbonCost.toFixed(2)),
      availableCapacity: Math.round(availableCapacity)
    };
  }).sort((a, b) => a.srmc - b.srmc);

  let cumulativeCapacity = 0;
  let remainingDemand = demandMw;
  let marketClearingPrice = 0;
  let marginalUnitId = null;
  let totalSystemCostHourly = 0;
  let totalDispatchedMw = 0;

  const dispatchResults = evaluatedUnits.map(unit => {
    const startMw = cumulativeCapacity;
    cumulativeCapacity += unit.availableCapacity;
    const endMw = cumulativeCapacity;

    let dispatchedMw = 0;
    let status = 'Standby';

    if (unit.is_outage) {
      status = 'Outage';
    } else if (remainingDemand > 0) {
      if (remainingDemand >= unit.availableCapacity) {
        dispatchedMw = unit.availableCapacity;
        remainingDemand -= unit.availableCapacity;
        status = 'Base Dispatched';
      } else {
        dispatchedMw = remainingDemand;
        remainingDemand = 0;
        status = 'Marginal Dispatched';
        marketClearingPrice = unit.srmc;
        marginalUnitId = unit.id;
      }
    }

    if (dispatchedMw > 0 && marketClearingPrice < unit.srmc) {
      marketClearingPrice = unit.srmc;
      marginalUnitId = unit.id;
    }

    const hourlyCost = dispatchedMw * unit.srmc;
    totalSystemCostHourly += hourlyCost;
    totalDispatchedMw += dispatchedMw;

    return {
      ...unit,
      startMw,
      endMw,
      dispatchedMw: Math.round(dispatchedMw),
      utilizationPct: unit.availableCapacity > 0 ? Number(((dispatchedMw / unit.availableCapacity) * 100).toFixed(1)) : 0,
      hourlyCost: Number(hourlyCost.toFixed(2)),
      hourlyCostBdt: Number((hourlyCost * rate).toFixed(2)),
      status
    };
  });

  const finalResults = dispatchResults.map(unit => {
    const infraMarginalRentHourly = unit.dispatchedMw > 0 ? (marketClearingPrice - unit.srmc) * unit.dispatchedMw : 0;
    return {
      ...unit,
      infraMarginalRentHourly: Number(infraMarginalRentHourly.toFixed(2)),
      infraMarginalRentHourlyBdt: Number((infraMarginalRentHourly * rate).toFixed(2))
    };
  });

  const unservedDemandMw = Math.max(0, demandMw - totalDispatchedMw);
  const averageSystemCost = totalDispatchedMw > 0 ? totalSystemCostHourly / totalDispatchedMw : 0;
  const renewableDispatchedMw = finalResults
    .filter(u => u.category === 'Renewable' || u.category === 'Hydro')
    .reduce((sum, u) => sum + u.dispatchedMw, 0);

  const renewablePenetrationPct = totalDispatchedMw > 0 ? (renewableDispatchedMw / totalDispatchedMw) * 100 : 0;

  return {
    demandMw,
    totalDispatchedMw,
    unservedDemandMw,
    totalCapacityAvailable: cumulativeCapacity,
    marketClearingPrice: Number(marketClearingPrice.toFixed(2)),
    marketClearingPriceBdtKwh: Number(currencyService.usdMwhToBdtKwh(marketClearingPrice).toFixed(2)),
    marginalUnitId,
    totalSystemCostHourlyUsd: Number(totalSystemCostHourly.toFixed(2)),
    totalSystemCostHourlyBdt: Number((totalSystemCostHourly * rate).toFixed(2)),
    averageSystemCostUsd: Number(averageSystemCost.toFixed(2)),
    averageSystemCostBdtKwh: Number(currencyService.usdMwhToBdtKwh(averageSystemCost).toFixed(2)),
    renewablePenetrationPct: Number(renewablePenetrationPct.toFixed(1)),
    units: finalResults
  };
}

export function generateLCOESensitivity(basePreset, paramKey, minVal, maxVal, steps = 10, carbonTax = 25) {
  const stepSize = (maxVal - minVal) / (steps - 1);
  const dataPoints = [];

  for (let i = 0; i < steps; i++) {
    const val = minVal + i * stepSize;
    const testParams = { ...basePreset, [paramKey]: val };
    const lcoeResult = calculateLCOE(testParams, carbonTax);
    dataPoints.push({
      paramValue: Number(val.toFixed(2)),
      totalLCOE: lcoeResult.totalLCOE,
      totalLcoeBdtKwh: lcoeResult.totalLcoeBdtKwh,
      capital: lcoeResult.breakdown.capital,
      fuel: lcoeResult.breakdown.fuel,
      om: lcoeResult.breakdown.fixedOm + lcoeResult.breakdown.variableOm,
      carbon: lcoeResult.breakdown.carbon
    });
  }

  return dataPoints;
}
