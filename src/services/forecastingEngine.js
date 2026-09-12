/**
 * Load, Solar, Wind & Electricity Price Forecasting Engine
 * Mathematical models for 24h/7d Short Term Load Forecast (STLF),
 * Solar GHI Irradiance curves, Wind Weibull Power Curves, and Confidence Bands.
 */

/**
 * 24-Hour Day-Ahead Load Forecasting Model with Temperature & Day-of-Week sensitivity
 */
export function generate24HourLoadForecast(params = {}) {
  const {
    basePeakMw = 16200,
    baseValleyMw = 9800,
    forecastTempC = 31, // Celsius
    referenceTempC = 24, // Baseline comfortable temp
    coolingCoeff = 0.024, // 2.4% increase per °C above 24°C
    heatingCoeff = 0.018, // 1.8% increase per °C below 16°C
    dayType = 'weekday', // 'weekday' | 'weekend' | 'holiday'
    confidenceIntervalPct = 90
  } = params;

  // Temperature sensitivity factor
  let tempFactor = 1.0;
  if (forecastTempC > referenceTempC) {
    tempFactor += (forecastTempC - referenceTempC) * coolingCoeff;
  } else if (forecastTempC < 16) {
    tempFactor += (16 - forecastTempC) * heatingCoeff;
  }

  // Day type modifier
  const dayFactor = dayType === 'weekend' ? 0.86 : dayType === 'holiday' ? 0.81 : 1.0;

  // 24-hour normalized load shape (fraction between 0.0 and 1.0)
  // Characteristic dual-peak curve: Morning peak around 10-12, Evening peak around 19-21
  const hourlyNormalizedShape = [
    0.15, 0.08, 0.02, 0.00, 0.03, 0.12, // 00:00 - 05:00 (Night Valley)
    0.35, 0.65, 0.82, 0.90, 0.94, 0.92, // 06:00 - 11:00 (Morning Ramp & Peak)
    0.88, 0.85, 0.87, 0.89, 0.93, 0.97, // 12:00 - 17:00 (Afternoon Surge)
    1.00, 0.98, 0.92, 0.78, 0.52, 0.30  // 18:00 - 23:00 (Evening Peak & Drop)
  ];

  const zScore = confidenceIntervalPct === 95 ? 1.96 : 1.645; // 90% default

  const hours = [];
  let peakMw = 0;
  let valleyMw = Infinity;
  let totalMwh = 0;

  for (let h = 0; h < 24; h++) {
    const shape = hourlyNormalizedShape[h];
    const baseDemand = baseValleyMw + shape * (basePeakMw - baseValleyMw);
    const meanForecast = Math.round(baseDemand * tempFactor * dayFactor);
    
    // Standard error increases further out into the day (uncertainty propagation)
    const stdError = Math.round(meanForecast * (0.02 + (h / 24) * 0.035));
    const ucb = Math.round(meanForecast + zScore * stdError);
    const lcb = Math.round(meanForecast - zScore * stdError);
    
    // Baseline (without temp shock)
    const baseline = Math.round(baseDemand * dayFactor);

    if (meanForecast > peakMw) peakMw = meanForecast;
    if (meanForecast < valleyMw) valleyMw = meanForecast;
    totalMwh += meanForecast;

    const timeLabel = `${String(h).padStart(2, '0')}:00`;
    hours.push({
      hour: h,
      time: timeLabel,
      forecastMw: meanForecast,
      baselineMw: baseline,
      ucbMw: ucb,
      lcbMw: lcb,
      stdErrorMw: stdError,
      tempC: forecastTempC - Math.round(5 * Math.sin(((h - 9) * Math.PI) / 12)) // Daily temp diurnal swing
    });
  }

  const averageMw = Math.round(totalMwh / 24);
  const loadFactor = Number(((averageMw / peakMw) * 100).toFixed(1));

  return {
    hours,
    metrics: {
      peakMw,
      valleyMw,
      averageMw,
      totalEnergyGwh: Number((totalMwh / 1000).toFixed(2)),
      loadFactorPct: loadFactor,
      tempAdjustmentPct: Number(((tempFactor - 1) * 100).toFixed(1))
    }
  };
}

/**
 * 24-Hour Solar Irradiance & Generation Forecast
 */
export function generate24HourSolarForecast(params = {}) {
  const {
    installedCapacityMw = 3500,
    clearnessIndex = 0.85, // 1.0 = clear sky, 0.3 = overcast
    panelEfficiency = 0.21,
    tempDerateCoeff = 0.004 // -0.4% per °C above 25°C
  } = params;

  const hours = [];
  let totalSolarMwh = 0;
  let peakSolarMw = 0;

  for (let h = 0; h < 24; h++) {
    let ghi = 0; // W/m^2
    // Solar irradiance occurs between 06:00 and 18:00 (sunrise to sunset approx)
    if (h >= 6 && h <= 18) {
      const solarAngle = ((h - 6) / 12) * Math.PI; // 0 at 6am, PI/2 at 12pm, PI at 6pm
      const clearSkyGhi = 1050 * Math.sin(solarAngle);
      ghi = Math.max(0, Math.round(clearSkyGhi * clearnessIndex));
    }

    // Power output (MW)
    const capacityFactor = ghi / 1000;
    const ambientTemp = 20 + 12 * Math.sin(((h - 6) / 14) * Math.PI);
    const tempDerate = 1 - Math.max(0, (ambientTemp + (ghi / 800) * 25 - 25) * tempDerateCoeff);
    const solarMw = Math.round(installedCapacityMw * capacityFactor * tempDerate);

    if (solarMw > peakSolarMw) peakSolarMw = solarMw;
    totalSolarMwh += solarMw;

    hours.push({
      hour: h,
      time: `${String(h).padStart(2, '0')}:00`,
      ghiWm2: ghi,
      solarMw,
      capacityFactorPct: Number((capacityFactor * 100).toFixed(1))
    });
  }

  return {
    hours,
    metrics: {
      peakSolarMw,
      totalSolarGwh: Number((totalSolarMwh / 1000).toFixed(2)),
      dailyCapacityFactorPct: Number(((totalSolarMwh / (installedCapacityMw * 24)) * 100).toFixed(1))
    }
  };
}

/**
 * 24-Hour Wind Speed & Power Curve Forecast
 */
export function generate24HourWindForecast(params = {}) {
  const {
    installedCapacityMw = 4000,
    meanWindSpeedMs = 8.5, // m/s
    cutInSpeed = 3.0,
    ratedSpeed = 12.0,
    cutOutSpeed = 25.0
  } = params;

  const hours = [];
  let totalWindMwh = 0;
  let peakWindMw = 0;

  for (let h = 0; h < 24; h++) {
    // Wind diurnal profile (often higher at night and early morning)
    const diurnalMod = 1 + 0.22 * Math.cos(((h - 2) / 24) * 2 * Math.PI) + (Math.random() * 0.15 - 0.075);
    const windSpeed = Number((meanWindSpeedMs * diurnalMod).toFixed(1));

    // Power curve calculation
    let powerFactor = 0;
    if (windSpeed < cutInSpeed || windSpeed >= cutOutSpeed) {
      powerFactor = 0;
    } else if (windSpeed >= ratedSpeed && windSpeed < cutOutSpeed) {
      powerFactor = 1.0;
    } else {
      // Cubic progression
      powerFactor = (Math.pow(windSpeed, 3) - Math.pow(cutInSpeed, 3)) / (Math.pow(ratedSpeed, 3) - Math.pow(cutInSpeed, 3));
    }

    const windMw = Math.round(installedCapacityMw * powerFactor);
    if (windMw > peakWindMw) peakWindMw = windMw;
    totalWindMwh += windMw;

    hours.push({
      hour: h,
      time: `${String(h).padStart(2, '0')}:00`,
      windSpeedMs: windSpeed,
      windMw,
      capacityFactorPct: Number((powerFactor * 100).toFixed(1))
    });
  }

  return {
    hours,
    metrics: {
      peakWindMw,
      totalWindGwh: Number((totalWindMwh / 1000).toFixed(2)),
      dailyCapacityFactorPct: Number(((totalWindMwh / (installedCapacityMw * 24)) * 100).toFixed(1))
    }
  };
}

/**
 * 7-Day Ahead Weekly Load & Peak Forecast
 */
export function generate7DayLoadForecast(basePeakMw = 16200, baseValleyMw = 9800, baseTempC = 28) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayProfiles = [
    { type: 'weekday', tempDiff: 0 },
    { type: 'weekday', tempDiff: 1.5 },
    { type: 'weekday', tempDiff: 3.0 }, // Heatwave peak
    { type: 'weekday', tempDiff: 2.0 },
    { type: 'weekday', tempDiff: 0.5 },
    { type: 'weekend', tempDiff: -1.0 },
    { type: 'weekend', tempDiff: -1.5 }
  ];

  return days.map((dayName, idx) => {
    const prof = dayProfiles[idx];
    const dayTemp = baseTempC + prof.tempDiff;
    const forecast = generate24HourLoadForecast({
      basePeakMw,
      baseValleyMw,
      forecastTempC: dayTemp,
      dayType: prof.type
    });

    return {
      day: dayName,
      dayIndex: idx,
      type: prof.type,
      tempC: dayTemp,
      peakMw: forecast.metrics.peakMw,
      valleyMw: forecast.metrics.valleyMw,
      totalEnergyGwh: forecast.metrics.totalEnergyGwh,
      loadFactorPct: forecast.metrics.loadFactorPct
    };
  });
}
