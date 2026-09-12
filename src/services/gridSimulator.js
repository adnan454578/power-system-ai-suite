/**
 * Real-Time Power Grid & Generating Plant Hardware Telemetry Simulator
 * Generates live electrical parameters (3-Phase Voltage, Current, P, Q, S, PF, Machine RPM, Frequency),
 * thermal states, and hardware Modbus/SCADA register packets.
 */

import { calculateGeneratorElectricalParameters } from './powerCalculations';

export class PowerGridSimulator {
  constructor(initialConfig = {}) {
    this.nominalFrequency = initialConfig.nominalFrequency || 50.00; // Hz
    this.baseDemandMw = initialConfig.baseDemandMw || 14500; // MW
    this.inertiaH = 4.5;
    
    // State variables
    this.frequency = this.nominalFrequency;
    this.rocof = 0.0;
    this.currentDemandMw = this.baseDemandMw;
    this.actualGenerationMw = this.baseDemandMw;
    this.ace = 0.0;
    this.spinningReserveMw = 2200;
    
    // Generation Mix state (MW)
    this.generationMix = {
      solar: 2800,
      wind: 3200,
      hydro: 1800,
      nuclear: 2400,
      gas_ccgt: 3500,
      coal: 1200,
      battery: 0
    };

    // Main Synchronous Generator State (Unit 1 - 450MW CCGT Gas Turbine Generator)
    this.generatorUnit = {
      id: 'GEN-UNIT-01',
      name: 'Turbine Generator Unit #1 (CCGT)',
      status: 'Online Synchronized',
      poles: 2, // 2-pole synchronous machine (3000 RPM nominal at 50Hz)
      nominalVoltageKv: 15.75, // 15.75 kV terminal voltage
      ratedCapacityMw: 450,
      activePowerMw: 350.0,
      powerFactor: 0.885, // Lagging
      statorTempC: 78.4,
      rotorTempC: 84.2,
      bearingTempC: 56.1,
      coolingOilPressureBar: 4.8,
      fieldVoltageVf: 240.5, // Excitation DC Volts
      fieldCurrentIf: 1420.0, // Excitation DC Amperes
      vibrationMmS: 1.8 // Machine vibration mm/s
    };

    // Hardware Telemetry Connection State
    this.hardwareState = {
      isConnected: true,
      protocol: 'Modbus TCP / RTU (SCADA Bridge)',
      ipAddress: '192.168.1.150:502',
      unitId: 1,
      baudRate: 115200,
      packetRateHz: 10, // 10 packets / second
      packetsReceived: 12480,
      lastPacketTimestamp: Date.now(),
      registers: {}
    };

    // Bus Network Nodes
    this.buses = [
      { id: 'BUS-1', name: 'Northern Hydro & Wind Hub', voltageKv: 400.2, loadMw: 2100, genMw: 3600, status: 'Normal' },
      { id: 'BUS-2', name: 'Eastern Solar Valley', voltageKv: 398.8, loadMw: 1800, genMw: 2800, status: 'Normal' },
      { id: 'BUS-3', name: 'Central Industrial Metropolis', voltageKv: 397.4, loadMw: 6200, genMw: 1200, status: 'Normal' },
      { id: 'BUS-4', name: 'Southern Coastal Thermal & SMR', voltageKv: 401.1, loadMw: 2900, genMw: 5900, status: 'Normal' },
      { id: 'BUS-5', name: 'Western BESS & Peaker Complex', voltageKv: 400.0, loadMw: 1500, genMw: 1000, status: 'Normal' }
    ];

    // Transmission Lines
    this.lines = [
      { from: 'BUS-1', to: 'BUS-3', capacityMw: 2500, flowMw: 1500, loadingPct: 60.0 },
      { from: 'BUS-2', to: 'BUS-3', capacityMw: 2000, flowMw: 1000, loadingPct: 50.0 },
      { from: 'BUS-4', to: 'BUS-3', capacityMw: 3500, flowMw: 3000, loadingPct: 85.7 },
      { from: 'BUS-5', to: 'BUS-3', capacityMw: 1800, flowMw: -500, loadingPct: 27.8 },
      { from: 'BUS-1', to: 'BUS-2', capacityMw: 1200, flowMw: 0, loadingPct: 0.0 }
    ];

    this.activeEvent = null;
    this.eventTimer = 0;
    this.history = [];
    this.initializeHistory();
  }

  initializeHistory() {
    const now = Date.now();
    for (let i = 40; i >= 0; i--) {
      const timestamp = new Date(now - i * 1000).toLocaleTimeString();
      this.history.push({
        time: timestamp,
        frequency: this.nominalFrequency + (Math.random() * 0.04 - 0.02),
        rocof: 0,
        demand: this.baseDemandMw + (Math.random() * 100 - 50),
        generation: this.baseDemandMw + (Math.random() * 100 - 50),
        rpm: 3000.0,
        voltageKv: 15.75,
        currentAmps: 14500,
        activePowerMw: 350.0,
        reactivePowerMvar: 180.0
      });
    }
  }

  triggerEvent(eventType, params = {}) {
    this.activeEvent = {
      type: eventType,
      params,
      timestamp: Date.now(),
      durationSec: params.durationSec || 20
    };
    this.eventTimer = this.activeEvent.durationSec;

    switch (eventType) {
      case 'generator_trip': {
        const dropMw = params.dropMw || 600;
        this.generationMix.gas_ccgt = Math.max(500, this.generationMix.gas_ccgt - dropMw);
        this.rocof = -((dropMw / this.baseDemandMw) / (2 * this.inertiaH));
        break;
      }
      case 'solar_cloud': {
        const dropMw = params.dropMw || 800;
        this.generationMix.solar = Math.max(200, this.generationMix.solar - dropMw);
        break;
      }
      case 'demand_spike': {
        const surgeMw = params.surgeMw || 900;
        this.currentDemandMw += surgeMw;
        break;
      }
      case 'bess_fast_injection': {
        const injectMw = params.injectMw || 400;
        this.generationMix.battery = injectMw;
        break;
      }
      default:
        break;
    }
  }

  step(dt = 1.0) {
    // 1. Demand & Renewable Fluctuations
    const naturalNoise = (Math.random() - 0.49) * 40;
    if (!this.activeEvent || this.activeEvent.type !== 'demand_spike') {
      this.currentDemandMw = this.baseDemandMw + naturalNoise;
    }

    const solarNoise = (Math.random() - 0.5) * 15;
    const windNoise = (Math.random() - 0.5) * 25;
    this.generationMix.solar = Math.max(100, this.generationMix.solar + solarNoise);
    this.generationMix.wind = Math.max(200, this.generationMix.wind + windNoise);

    // 2. Total Generation & Imbalance
    this.actualGenerationMw = 
      this.generationMix.solar +
      this.generationMix.wind +
      this.generationMix.hydro +
      this.generationMix.nuclear +
      this.generationMix.gas_ccgt +
      this.generationMix.coal +
      this.generationMix.battery;

    const powerImbalanceMw = this.actualGenerationMw - this.currentDemandMw;

    // 3. Frequency Swing Equation (df/dt)
    const deltaF_dot = (powerImbalanceMw / this.baseDemandMw) * (this.nominalFrequency / (2 * this.inertiaH));
    this.rocof = deltaF_dot;
    this.frequency += deltaF_dot * dt;

    // 4. Governor & AGC Secondary Control
    const freqError = this.nominalFrequency - this.frequency;
    this.ace = -powerImbalanceMw + (freqError * 120);

    const governorRamp = freqError * 150 * dt;
    this.generationMix.gas_ccgt = Math.min(4500, Math.max(1000, this.generationMix.gas_ccgt + governorRamp * 0.7));
    this.generationMix.hydro = Math.min(2500, Math.max(800, this.generationMix.hydro + governorRamp * 0.3));

    if (Math.abs(freqError) > 0.05 && (!this.activeEvent || this.activeEvent.type !== 'bess_fast_injection')) {
      this.generationMix.battery = Math.min(500, Math.max(-200, freqError * 800));
    } else if (!this.activeEvent) {
      this.generationMix.battery *= 0.85;
    }

    this.frequency = Math.max(48.5, Math.min(51.5, this.frequency));

    if (this.activeEvent) {
      this.eventTimer -= dt;
      if (this.eventTimer <= 0) {
        this.activeEvent = null;
        this.generationMix.solar = 2800;
        this.generationMix.gas_ccgt = 3500;
        this.currentDemandMw = this.baseDemandMw;
        this.generationMix.battery = 0;
      }
    }

    // 5. Update Generator Unit 1 Electrical & Mechanical Parameters
    this.generatorUnit.activePowerMw = Number((this.generationMix.gas_ccgt * 0.10 + (Math.random() * 1.5 - 0.75)).toFixed(2)); // Unit 1 takes 10% of CCGT fleet
    
    // Voltage fluctuations
    const voltageNoise = (Math.random() - 0.5) * 0.04;
    const currentLineVoltageKv = Number((this.generatorUnit.nominalVoltageKv + voltageNoise).toFixed(3));
    
    // Power factor variation
    const pfNoise = (Math.random() - 0.5) * 0.004;
    const currentPf = Number((0.885 + pfNoise).toFixed(3));

    // Calculate full 3-phase parameters
    const electricalParams = calculateGeneratorElectricalParameters(
      this.generatorUnit.activePowerMw,
      currentPf,
      currentLineVoltageKv,
      this.generatorUnit.poles,
      this.frequency
    );

    // Thermal states
    this.generatorUnit.statorTempC = Number((72.0 + (this.generatorUnit.activePowerMw / 450) * 16.0 + (Math.random() * 0.3 - 0.15)).toFixed(1));
    this.generatorUnit.rotorTempC = Number((78.0 + (this.generatorUnit.activePowerMw / 450) * 18.0 + (Math.random() * 0.3 - 0.15)).toFixed(1));
    this.generatorUnit.fieldCurrentIf = Number((1200 + (this.generatorUnit.activePowerMw / 450) * 450 + (Math.random() * 5 - 2.5)).toFixed(1));

    // 6. Update Hardware Bridge Registers
    this.hardwareState.packetsReceived += 1;
    this.hardwareState.lastPacketTimestamp = Date.now();
    this.hardwareState.registers = {
      REG_40001_VOLTAGE_LL_V: Math.round(electricalParams.lineVoltageKv * 1000),
      REG_40002_VOLTAGE_LN_V: Math.round(electricalParams.phaseVoltageKv * 1000),
      REG_40003_CURRENT_A: Math.round(electricalParams.currentAmperes),
      REG_40004_ACTIVE_PWR_KW: Math.round(electricalParams.activePowerMw * 1000),
      REG_40005_REACT_PWR_KVAR: Math.round(electricalParams.reactivePowerMvar * 1000),
      REG_40006_APP_PWR_KVA: Math.round(electricalParams.apparentPowerMva * 1000),
      REG_40007_POWER_FACTOR_X1000: Math.round(electricalParams.powerFactor * 1000),
      REG_40008_FREQUENCY_X100: Math.round(electricalParams.frequencyHz * 100),
      REG_40009_MACHINE_RPM_X10: Math.round(electricalParams.rpm * 10),
      REG_40010_STATOR_TEMP_C: Math.round(this.generatorUnit.statorTempC),
      REG_40011_FIELD_CURRENT_A: Math.round(this.generatorUnit.fieldCurrentIf)
    };

    // 7. Update History
    const timestamp = new Date().toLocaleTimeString();
    this.history.push({
      time: timestamp,
      frequency: Number(this.frequency.toFixed(3)),
      rocof: Number(this.rocof.toFixed(4)),
      demand: Math.round(this.currentDemandMw),
      generation: Math.round(this.actualGenerationMw),
      rpm: electricalParams.rpm,
      voltageKv: electricalParams.lineVoltageKv,
      currentAmps: electricalParams.currentAmperes,
      activePowerMw: electricalParams.activePowerMw,
      reactivePowerMvar: electricalParams.reactivePowerMvar,
      solar: Math.round(this.generationMix.solar),
      wind: Math.round(this.generationMix.wind),
      gas: Math.round(this.generationMix.gas_ccgt)
    });

    if (this.history.length > 50) {
      this.history.shift();
    }

    return this.getSnapshot();
  }

  getSnapshot() {
    const electricalParams = calculateGeneratorElectricalParameters(
      this.generatorUnit.activePowerMw,
      this.generatorUnit.powerFactor,
      this.generatorUnit.nominalVoltageKv,
      this.generatorUnit.poles,
      this.frequency
    );

    return {
      timestamp: Date.now(),
      frequency: Number(this.frequency.toFixed(3)),
      rocof: Number(this.rocof.toFixed(4)),
      nominalFrequency: this.nominalFrequency,
      freqStatus: Math.abs(this.frequency - this.nominalFrequency) < 0.1 ? 'Stable' : Math.abs(this.frequency - this.nominalFrequency) < 0.3 ? 'Warning' : 'Critical Contingency',
      demandMw: Math.round(this.currentDemandMw),
      generationMw: Math.round(this.actualGenerationMw),
      imbalanceMw: Math.round(this.actualGenerationMw - this.currentDemandMw),
      aceMw: Number(this.ace.toFixed(1)),
      spinningReserveMw: this.spinningReserveMw,
      reserveMarginPct: Number(((this.spinningReserveMw / this.currentDemandMw) * 100).toFixed(1)),
      generationMix: { ...this.generationMix },
      generatorUnit: {
        ...this.generatorUnit,
        electrical: electricalParams
      },
      hardwareState: { ...this.hardwareState },
      buses: [...this.buses],
      lines: [...this.lines],
      activeEvent: this.activeEvent,
      eventTimer: Math.max(0, Math.round(this.eventTimer)),
      history: [...this.history]
    };
  }
}
