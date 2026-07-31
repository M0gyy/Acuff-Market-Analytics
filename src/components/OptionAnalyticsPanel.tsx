import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  Calculator,
  Code2,
  TrendingUp,
  Percent,
  Sliders,
  DollarSign,
  Activity,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

interface OptionAnalyticsPanelProps {
  currentStockPrice?: number;
  ticker?: string;
}

// Standard normal cumulative distribution function
function normCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let probability =
    d *
    t *
    (0.3193815 +
      t *
      (-0.3565638 +
        t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) probability = 1 - probability;
  return probability;
}

// Standard normal probability density function
function normPDF(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp((-x * x) / 2);
}

// Black-Scholes formula calculation
function calcBlackScholes(
  S: number,
  K: number,
  r: number,
  T: number,
  sigma: number,
  type: 'call' | 'put'
) {
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    return { price: 0, d1: 0, d2: 0, delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  let price = 0;
  let delta = 0;
  let theta = 0;
  let rho = 0;

  const N_d1 = normCDF(d1);
  const N_d2 = normCDF(d2);
  const n_d1 = normPDF(d1);

  const N_neg_d1 = normCDF(-d1);
  const N_neg_d2 = normCDF(-d2);

  if (type === 'call') {
    price = S * N_d1 - K * Math.exp(-r * T) * N_d2;
    delta = N_d1;
    theta =
      (-S * n_d1 * sigma) / (2 * Math.sqrt(T)) -
      r * K * Math.exp(-r * T) * N_d2;
    rho = (K * T * Math.exp(-r * T) * N_d2) / 100;
  } else {
    price = K * Math.exp(-r * T) * N_neg_d2 - S * N_neg_d1;
    delta = N_d1 - 1;
    theta =
      (-S * n_d1 * sigma) / (2 * Math.sqrt(T)) +
      r * K * Math.exp(-r * T) * N_neg_d2;
    rho = (-K * T * Math.exp(-r * T) * N_neg_d2) / 100;
  }

  const gamma = n_d1 / (S * sigma * Math.sqrt(T));
  const vega = (S * n_d1 * Math.sqrt(T)) / 100; // per 1% change in vol

  return {
    price: Number(price.toFixed(3)),
    d1: Number(d1.toFixed(4)),
    d2: Number(d2.toFixed(4)),
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(4)),
    vega: Number(vega.toFixed(4)),
    theta: Number((theta / 365).toFixed(4)), // daily theta decay
    rho: Number(rho.toFixed(4)),
  };
}

// Bisection root solver for Implied Volatility (R uniroot equivalent)
function solveImpliedVol(
  marketPrice: number,
  S: number,
  K: number,
  r: number,
  T: number,
  type: 'call' | 'put'
): number {
  let low = 0.001;
  let high = 5.0; // 500% max vol
  let mid = 0.2;

  for (let i = 0; i < 50; i++) {
    mid = (low + high) / 2;
    const bsPrice = calcBlackScholes(S, K, r, T, mid, type).price;
    const diff = bsPrice - marketPrice;

    if (Math.abs(diff) < 0.0001) {
      return Number((mid * 100).toFixed(2));
    }

    if (diff > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Number((mid * 100).toFixed(2));
}

export const OptionAnalyticsPanel: React.FC<OptionAnalyticsPanelProps> = ({
  currentStockPrice = 185.5,
  ticker = 'AAPL',
}) => {
  const [stockPrice, setStockPrice] = useState<number>(currentStockPrice || 185.5);
  const [strikePrice, setStrikePrice] = useState<number>(185.0);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(4.5); // 4.5%
  const [daysToExpiry, setDaysToExpiration] = useState<number>(30); // 30 days
  const [volatility, setVolatility] = useState<number>(25.0); // 25%
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [marketOptionPriceInput, setMarketOptionPriceInput] = useState<number>(5.2);

  // Time in years T
  const T = useMemo(() => Math.max(0.001, daysToExpiry / 365), [daysToExpiry]);
  const r = useMemo(() => riskFreeRate / 100, [riskFreeRate]);
  const sigma = useMemo(() => volatility / 100, [volatility]);

  // Calculated Option Fair Value & Greeks
  const bsResults = useMemo(() => {
    return calcBlackScholes(stockPrice, strikePrice, r, T, sigma, optionType);
  }, [stockPrice, strikePrice, r, T, sigma, optionType]);

  // Calculated Implied Volatility from Market Price Input
  const calculatedIV = useMemo(() => {
    return solveImpliedVol(marketOptionPriceInput, stockPrice, strikePrice, r, T, optionType);
  }, [marketOptionPriceInput, stockPrice, strikePrice, r, T, optionType]);

  // Payoff Chart Data across stock price spectrum
  const payoffChartData = useMemo(() => {
    const points = [];
    const minS = Math.max(1, stockPrice * 0.7);
    const maxS = stockPrice * 1.3;
    const step = (maxS - minS) / 30;

    for (let sVal = minS; sVal <= maxS; sVal += step) {
      const bs = calcBlackScholes(sVal, strikePrice, r, T, sigma, optionType);
      const intrinsicValue = optionType === 'call' ? Math.max(0, sVal - strikePrice) : Math.max(0, strikePrice - sVal);
      const profitLoss = Number((intrinsicValue - bsResults.price).toFixed(2));

      points.push({
        stockPrice: Number(sVal.toFixed(1)),
        OptionTheoreticalPrice: bs.price,
        IntrinsicPayoffAtExpiry: Number(intrinsicValue.toFixed(2)),
        NetProfitLossAtExpiry: profitLoss,
      });
    }

    return points;
  }, [stockPrice, strikePrice, r, T, sigma, optionType, bsResults.price]);

  // Volatility Smile Data across strikes
  const volatilitySmileData = useMemo(() => {
    const points = [];
    const baseStrike = stockPrice;
    const strikes = [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2].map((m) => Number((baseStrike * m).toFixed(1)));

    strikes.forEach((kVal) => {
      // Simulate typical market volatility skew (higher IV for OTM puts / deep OTM calls)
      const moneynessRatio = kVal / baseStrike;
      const skewVol = volatility + Math.pow(moneynessRatio - 1, 2) * 40 + (1 - moneynessRatio) * 8;
      const bs = calcBlackScholes(stockPrice, kVal, r, T, skewVol / 100, optionType);

      points.push({
        strike: kVal,
        ImpliedVolPct: Number(skewVol.toFixed(2)),
        OptionPrice: bs.price,
        Delta: bs.delta,
      });
    });

    return points;
  }, [stockPrice, volatility, r, T, optionType]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-700" />
              <span>Black-Scholes European Option Pricing & Implied Volatility Engine</span>
              <span className="text-[10px] font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded border border-purple-200">
                Gentle (2020) :: Chapter 1.4.2
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500">Underlying Ticker:</span>
            <span className="font-bold bg-slate-900 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-800">
              {ticker} @ ${stockPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Inputs Grid Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Underlying Price ($S$)
            </label>
            <input
              type="number"
              value={stockPrice}
              onChange={(e) => setStockPrice(Number(e.target.value))}
              step={0.5}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Strike Price ($K$)
            </label>
            <input
              type="number"
              value={strikePrice}
              onChange={(e) => setStrikePrice(Number(e.target.value))}
              step={0.5}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Risk-Free Rate ($r\%$)
            </label>
            <input
              type="number"
              value={riskFreeRate}
              onChange={(e) => setRiskFreeRate(Number(e.target.value))}
              step={0.25}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Days to Expiration ($T$)
            </label>
            <input
              type="number"
              value={daysToExpiry}
              onChange={(e) => setDaysToExpiration(Number(e.target.value))}
              min={1}
              max={730}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Volatility ($\sigma\%$)
            </label>
            <input
              type="number"
              value={volatility}
              onChange={(e) => setVolatility(Number(e.target.value))}
              step={1}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Option Type
            </label>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-300">
              <button
                onClick={() => setOptionType('call')}
                className={`flex-1 py-1 font-bold rounded text-xs transition cursor-pointer ${
                  optionType === 'call'
                    ? 'bg-purple-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                CALL
              </button>
              <button
                onClick={() => setOptionType('put')}
                className={`flex-1 py-1 font-bold rounded text-xs transition cursor-pointer ${
                  optionType === 'put'
                    ? 'bg-rose-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PUT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fair Value & Greeks Output Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-purple-600" />
            <span>Black-Scholes Price</span>
          </div>
          <div className="text-xl font-bold font-mono text-purple-950">${bsResults.price}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            d1: {bsResults.d1} | d2: {bsResults.d2}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delta ($\Delta$)</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">{bsResults.delta}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            $\partial C / \partial S$ Sensitivity
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-sky-600" />
            <span>Gamma ($\Gamma$)</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">{bsResults.gamma}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            $\partial^2 C / \partial S^2$ Curvature
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-amber-600" />
            <span>Vega (&Nu;)</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">{bsResults.vega}</div>
          <div className="text-[10px] text-slate-500 font-mono">Per +1% Volatility</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-rose-600" />
            <span>Theta (&Theta;) / Day</span>
          </div>
          <div className="text-lg font-bold font-mono text-rose-700">{bsResults.theta}</div>
          <div className="text-[10px] text-slate-500 font-mono">Daily Time Decay</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Rho (&rho;)</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">{bsResults.rho}</div>
          <div className="text-[10px] text-slate-500 font-mono">Per +1% Rate</div>
        </div>
      </div>

      {/* Implied Volatility Solver Card (`uniroot`) */}
      <div className="bg-gradient-to-r from-slate-900 to-purple-950 text-white rounded-xl p-4 border border-purple-800/80 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Implied Volatility Solver (<code className="font-mono">uniroot</code> Root Finder)
            </span>
          </div>
          <span className="text-[10px] font-mono bg-purple-900/90 text-purple-200 px-2.5 py-0.5 rounded border border-purple-700">
            Solves BS(&sigma;) = C_market
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-center">
          <div className="space-y-1">
            <label className="block text-[10px] text-purple-300 font-bold uppercase">
              Observed Option Market Price (C_market)
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-purple-400 font-bold">$</span>
              <input
                type="number"
                value={marketOptionPriceInput}
                onChange={(e) => setMarketOptionPriceInput(Number(e.target.value))}
                step={0.1}
                min={0.01}
                className="bg-slate-900 border border-purple-700 rounded-lg px-3 py-1 text-white font-mono font-bold focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-center p-3 bg-slate-900/80 rounded-xl border border-purple-800">
            <ArrowRight className="w-5 h-5 text-purple-400 mr-2" />
            <div className="text-center">
              <span className="text-[10px] text-purple-300 block uppercase font-bold">Inferred Implied Volatility (IV)</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{calculatedIV}%</span>
            </div>
          </div>

          <div className="text-[11px] text-purple-200/80 leading-relaxed font-sans">
            Finds the exact volatility parameter &sigma; that equates the theoretical Black-Scholes formula to the observed market trading price using numerical root iteration (<code className="font-mono">uniroot</code> in R).
          </div>
        </div>
      </div>

      {/* Payoff Diagram & Volatility Smile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payoff & Value Curve */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-700" />
              <span>Option Theoretical Value vs Underlying Stock Price ($S$)</span>
            </h4>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payoffChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="stockPrice" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#581c87',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="OptionTheoreticalPrice"
                  name="Black-Scholes Premium ($)"
                  stroke="#7e22ce"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="IntrinsicPayoffAtExpiry"
                  name="Intrinsic Payoff @ Expiry ($)"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volatility Smile Skew Curve */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-700" />
              <span>Volatility Smile / Skew Across Strike Prices ($K$)</span>
            </h4>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volatilitySmileData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="strike" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#581c87',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ImpliedVolPct"
                  name="Implied Volatility (%)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0284c7' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
