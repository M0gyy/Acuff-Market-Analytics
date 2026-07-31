import { OHLCV, QuantitativeMetrics } from '../types';

export const POPULAR_TICKERS = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 224.50 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 428.10 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 118.25 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 172.80 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 186.40 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 218.90 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', basePrice: 545.30 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', basePrice: 482.15 },
];

/**
 * Generate reproducible historical financial time-series data for a given ticker and date range.
 */
export function generateMarketData(symbol: string, startDateStr: string, endDateStr: string): OHLCV[] {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return [];
  }

  // Determine base seed price based on ticker string hash
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed += symbol.charCodeAt(i);
  }
  
  const known = POPULAR_TICKERS.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
  let currentPrice = known ? known.basePrice : 100 + (seed % 150);

  const data: OHLCV[] = [];
  const curr = new Date(start);

  // Generate day-by-day series
  while (curr <= end) {
    const dayOfWeek = curr.getDay();
    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dateStr = curr.toISOString().split('T')[0];
      
      // Pseudo-random walk with trend and volatility
      const volatility = 0.018;
      const drift = 0.0004;
      
      // Deterministic noise using pseudo-random based on date and seed
      const dayHash = Math.sin(curr.getTime() * 0.0000001 + seed) * 10000;
      const pseudoRand1 = (dayHash - Math.floor(dayHash));
      const pseudoRand2 = (Math.cos(dayHash) - Math.floor(Math.cos(dayHash)));
      
      const changePercent = drift + (pseudoRand1 - 0.49) * volatility;
      
      const open = currentPrice;
      const close = Math.max(1, open * (1 + changePercent));
      const high = Math.max(open, close) * (1 + pseudoRand2 * 0.012);
      const low = Math.min(open, close) * (1 - (1 - pseudoRand2) * 0.012);
      const volume = Math.floor(15000000 + (pseudoRand1 * 35000000));

      data.push({
        date: dateStr,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
      });

      currentPrice = close;
    }
    curr.setDate(curr.getDate() + 1);
  }

  return calculateTechnicalIndicators(data);
}

/**
 * Calculates quantmod and TTR indicators (SMA, EMA, BBands, MACD, RSI, Stoch, ATR, Williams %R, ROC)
 * plus PerformanceAnalytics time-series metrics (Returns, Cumulative Returns, Drawdowns).
 */
export function calculateTechnicalIndicators(data: OHLCV[]): OHLCV[] {
  if (data.length === 0) return [];

  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);

  // 1. Moving Averages & BBands
  const periodBB = 20;
  const numStd = 2;
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  // 2. MACD (12, 26, 9)
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const macdSignal = calculateEMA(macdLine, 9);

  // 3. RSI (14-period)
  const rsiValues = calculateRSI(closes, 14);

  // 4. Stochastic Oscillator (14-period %K, 3-period %D)
  const stochK: number[] = [];
  const stochPeriod = 14;
  for (let i = 0; i < data.length; i++) {
    if (i < stochPeriod - 1) {
      stochK.push(50);
    } else {
      const sliceHighs = highs.slice(i - stochPeriod + 1, i + 1);
      const sliceLows = lows.slice(i - stochPeriod + 1, i + 1);
      const maxH = Math.max(...sliceHighs);
      const minL = Math.min(...sliceLows);
      const k = maxH === minL ? 50 : ((closes[i] - minL) / (maxH - minL)) * 100;
      stochK.push(k);
    }
  }
  const stochD = calculateEMA(stochK, 3);

  // 5. ATR (Average True Range 14-period)
  const trueRanges: number[] = [highs[0] - lows[0]];
  for (let i = 1; i < data.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }
  const atrValues = calculateEMA(trueRanges, 14);

  // 6. Williams %R (14-period)
  const wprValues: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < stochPeriod - 1) {
      wprValues.push(-50);
    } else {
      const sliceHighs = highs.slice(i - stochPeriod + 1, i + 1);
      const sliceLows = lows.slice(i - stochPeriod + 1, i + 1);
      const maxH = Math.max(...sliceHighs);
      const minL = Math.min(...sliceLows);
      const wpr = maxH === minL ? -50 : ((maxH - closes[i]) / (maxH - minL)) * -100;
      wprValues.push(wpr);
    }
  }

  // 7. ROC (Rate of Change - 12 period)
  const rocValues: number[] = [];
  const rocPeriod = 12;
  for (let i = 0; i < data.length; i++) {
    if (i < rocPeriod) {
      rocValues.push(0);
    } else {
      const prevClose = closes[i - rocPeriod];
      const roc = prevClose === 0 ? 0 : ((closes[i] - prevClose) / prevClose) * 100;
      rocValues.push(roc);
    }
  }

  // Performance analytics time-series
  const initialClose = closes[0];
  let peakClose = closes[0];
  let benchmarkVal = 100;

  return data.map((item, i) => {
    // BB calculations
    let sma20: number | undefined;
    let bbUpper: number | undefined;
    let bbLower: number | undefined;
    let bbMiddle: number | undefined;

    if (i >= periodBB - 1) {
      const slice = closes.slice(i - periodBB + 1, i + 1);
      const sum = slice.reduce((acc, val) => acc + val, 0);
      sma20 = sum / periodBB;
      
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - sma20!, 2), 0) / periodBB;
      const stdDev = Math.sqrt(variance);

      bbMiddle = Number(sma20.toFixed(2));
      bbUpper = Number((sma20 + numStd * stdDev).toFixed(2));
      bbLower = Number((sma20 - numStd * stdDev).toFixed(2));
    }

    // Daily returns & drawdowns
    const prevClose = i > 0 ? closes[i - 1] : item.open;
    const dailyReturn = (item.close - prevClose) / prevClose;
    const cumReturn = ((item.close - initialClose) / initialClose) * 100;

    if (item.close > peakClose) {
      peakClose = item.close;
    }
    const drawdown = ((item.close - peakClose) / peakClose) * 100;

    // Simulated S&P 500 benchmark cumulative return
    const benchReturn = 0.0003 + (Math.sin(i * 0.08) * 0.005);
    benchmarkVal = benchmarkVal * (1 + benchReturn);
    const benchmarkCumReturn = ((benchmarkVal - 100) / 100) * 100;

    return {
      ...item,
      sma20: sma20 ? Number(sma20.toFixed(2)) : undefined,
      bbMiddle,
      bbUpper,
      bbLower,
      macd: Number(macdLine[i].toFixed(3)),
      macdSignal: Number(macdSignal[i].toFixed(3)),
      macdHist: Number((macdLine[i] - macdSignal[i]).toFixed(3)),
      rsi: Number(rsiValues[i].toFixed(1)),
      ema20: Number(ema20[i].toFixed(2)),
      ema50: Number(ema50[i].toFixed(2)),
      stochK: Number(stochK[i].toFixed(1)),
      stochD: Number(stochD[i].toFixed(1)),
      atr: Number(atrValues[i].toFixed(2)),
      wpr: Number(wprValues[i].toFixed(1)),
      roc: Number(rocValues[i].toFixed(2)),
      dailyReturn: Number(dailyReturn.toFixed(4)),
      cumReturn: Number(cumReturn.toFixed(2)),
      benchmarkCumReturn: Number(benchmarkCumReturn.toFixed(2)),
      drawdown: Number(drawdown.toFixed(2)),
    };
  });
}

/**
 * Calculates quantitative risk & performance metrics as found in R's PerformanceAnalytics package.
 */
export function calculateQuantitativeMetrics(data: OHLCV[]): QuantitativeMetrics {
  if (data.length < 2) {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      annualizedVolatility: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdown: 0,
      var95: 0,
      calmarRatio: 0,
      beta: 1.0,
      alpha: 0,
    };
  }

  const returns = data.slice(1).map(d => d.dailyReturn || 0);
  const n = returns.length;

  const totalReturn = data[data.length - 1].cumReturn || 0;
  const avgReturn = returns.reduce((a, b) => a + b, 0) / n;
  const annualizedReturn = avgReturn * 252 * 100;

  // Standard Deviation
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const annualizedVolatility = stdDev * Math.sqrt(252) * 100;

  // Sharpe Ratio (Assuming 2% risk-free rate)
  const rfDaily = 0.02 / 252;
  const sharpeRatio = stdDev > 0 ? ((avgReturn - rfDaily) / stdDev) * Math.sqrt(252) : 0;

  // Sortino Ratio (Downside Deviation)
  const downsideReturns = returns.filter(r => r < rfDaily);
  const downsideVar = downsideReturns.length > 0
    ? downsideReturns.reduce((a, b) => a + Math.pow(b - rfDaily, 2), 0) / n
    : 0.0001;
  const downsideStd = Math.sqrt(downsideVar);
  const sortinoRatio = downsideStd > 0 ? ((avgReturn - rfDaily) / downsideStd) * Math.sqrt(252) : 0;

  // Max Drawdown
  const drawdowns = data.map(d => d.drawdown || 0);
  const maxDrawdown = Math.min(...drawdowns);

  // Value at Risk 95% (Parametric VaR)
  const var95 = (1.645 * stdDev - avgReturn) * 100;

  // Calmar Ratio
  const absMaxDD = Math.abs(maxDrawdown);
  const calmarRatio = absMaxDD > 0 ? annualizedReturn / absMaxDD : 0;

  // Beta & Alpha approximation vs benchmark
  const beta = 1.05 + (avgReturn * 10);
  const alpha = (annualizedReturn - (0.02 + beta * (8 - 2)));

  return {
    totalReturn: Number(totalReturn.toFixed(2)),
    annualizedReturn: Number(annualizedReturn.toFixed(2)),
    annualizedVolatility: Number(annualizedVolatility.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    sortinoRatio: Number(sortinoRatio.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    var95: Number(var95.toFixed(2)),
    calmarRatio: Number(calmarRatio.toFixed(2)),
    beta: Number(beta.toFixed(2)),
    alpha: Number(alpha.toFixed(2)),
  };
}

function calculateEMA(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      sum += values[i];
      ema.push(values[i]);
    } else if (i === period - 1) {
      sum += values[i];
      ema.push(sum / period);
    } else {
      const prev = ema[i - 1];
      const currentEma = values[i] * k + prev * (1 - k);
      ema.push(currentEma);
    }
  }
  return ema;
}

function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      rsi.push(50);
      continue;
    }

    const diff = closes[i] - closes[i - 1];
    if (i <= period) {
      if (diff >= 0) gains += diff;
      else losses -= diff;

      if (i === period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      } else {
        rsi.push(50);
      }
    } else {
      const currentGain = diff >= 0 ? diff : 0;
      const currentLoss = diff < 0 ? -diff : 0;

      gains = (gains * (period - 1) + currentGain) / period;
      losses = (losses * (period - 1) + currentLoss) / period;

      const rs = losses === 0 ? 100 : gains / losses;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

