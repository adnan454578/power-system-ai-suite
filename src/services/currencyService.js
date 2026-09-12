/**
 * Currency & Financial Conversion Engine
 * Manages dual currency exchange rates between US Dollar (USD $) and Bangladeshi Taka (BDT ৳),
 * with conversion helpers for power system units ($/MWh, ¢/kWh, ৳/kWh, Million $, Crore ৳).
 */

export class CurrencyService {
  constructor(defaultRate = 120.0) {
    this.exchangeRateBdtPerUsd = defaultRate; // 1 USD = 120.00 BDT
    this.activeCurrency = 'USD'; // 'USD' | 'BDT'
    this.listeners = [];
  }

  getExchangeRate() {
    return this.exchangeRateBdtPerUsd;
  }

  setExchangeRate(rate) {
    if (rate > 0) {
      this.exchangeRateBdtPerUsd = rate;
      this.notify();
    }
  }

  getActiveCurrency() {
    return this.activeCurrency;
  }

  setActiveCurrency(curr) {
    if (curr === 'USD' || curr === 'BDT') {
      this.activeCurrency = curr;
      this.notify();
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      currency: this.activeCurrency,
      exchangeRate: this.exchangeRateBdtPerUsd
    }));
  }

  // Convert USD amount to BDT
  usdToBdt(usdAmount) {
    return (usdAmount || 0) * this.exchangeRateBdtPerUsd;
  }

  // Convert BDT amount to USD
  bdtToUsd(bdtAmount) {
    return this.exchangeRateBdtPerUsd > 0 ? (bdtAmount || 0) / this.exchangeRateBdtPerUsd : 0;
  }

  // Convert $/MWh to ৳/kWh: ($/MWh * rate) / 1000 = ৳/kWh
  usdMwhToBdtKwh(usdPerMwh) {
    return ((usdPerMwh || 0) * this.exchangeRateBdtPerUsd) / 1000;
  }

  // Convert ৳/kWh to $/MWh: (৳/kWh * 1000) / rate = $/MWh
  bdtKwhToUsdMwh(bdtPerKwh) {
    return this.exchangeRateBdtPerUsd > 0 ? ((bdtPerKwh || 0) * 1000) / this.exchangeRateBdtPerUsd : 0;
  }

  // Convert USD Millions to BDT Crore: (USD * rate) / 10,000,000 = Crore ৳
  usdToCroreBdt(usdTotal) {
    return (usdTotal * this.exchangeRateBdtPerUsd) / 10000000; // 1 Crore = 10,000,000 BDT
  }

  formatCost(usdAmount, showBoth = true) {
    const bdtAmount = this.usdToBdt(usdAmount);
    if (!showBoth) {
      return this.activeCurrency === 'BDT'
        ? `৳ ${bdtAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$ ${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$ ${usdAmount.toFixed(2)} (৳ ${bdtAmount.toFixed(2)})`;
  }

  formatLcoeUnit(usdPerMwh) {
    const bdtPerKwh = this.usdMwhToBdtKwh(usdPerMwh);
    const usdCentsPerKwh = usdPerMwh / 10;
    return {
      usdPerMwh: Number(usdPerMwh.toFixed(2)),
      usdCentsPerKwh: Number(usdCentsPerKwh.toFixed(2)),
      bdtPerKwh: Number(bdtPerKwh.toFixed(2)),
      bdtPerMwh: Number((usdPerMwh * this.exchangeRateBdtPerUsd).toFixed(2)),
      formattedSummary: `৳ ${bdtPerKwh.toFixed(2)} / kWh ($ ${usdPerMwh.toFixed(2)} / MWh)`
    };
  }
}

export const currencyService = new CurrencyService(120.0);
