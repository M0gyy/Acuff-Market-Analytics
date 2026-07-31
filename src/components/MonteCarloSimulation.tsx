import React, { useState, useMemo } from 'react';
import { OHLCV } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar, CartesianGrid } from 'recharts';
import { Play, RefreshCw, Dices, ShieldAlert, TrendingUp, TrendingDown, DollarSign, Code, Info } from 'lucide-react';

interface MonteCarloSimulationProps {
  data: OHLCV[];
  ticker: string;
}

export const MonteCarloSimulation: React.FC<MonteCarloSimulationProps> = ({ data, ticker }) => {
  const lastPrice = data.length > 0 ? data[data.length - 1].close : 100;

  // Calculate historical log return annualized volatility & mean return
  const historicalReturns = useMemo(() => {
    if (data.length < 2) return { drift: 0.08, vol: 0.20 };
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const r = Math.log(data[i].close / data[i - 1].close);
      returns.push(r);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    const dailyVol = Math.sqrt(variance);
    const annDrift = mean * 252;
    const annVol = dailyVol * Math.sqrt(252);
    return { drift: annDrift, vol: annVol };
  }, [data]);

  const [numSimulations, setNumSimulations] = useState<number>(500);
  const [horizonDays, setHorizonDays] = useState<number>(90);
  const [drift, setDrift] = useState<number>(Math.round(historicalReturns.drift * 100));
  const [volatility, setVolatility] = useState<number>(Math.max(10, Math.round(historicalReturns.vol * 100)));
  const [seed, setSeed] = useState<number>(1);

  // Generate Geometric Brownian Motion Simulation Paths
  const simulationResults = useMemo(() => {
    const dt = 1 / 252;
    const mu = drift / 100;
    const sigma = volatility / 100;

    // Normal random number generator (Box-Muller transform)
    const gaussianRandom = (seedOffset: number) => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    const paths: number[][] = [];
    const terminalPrices: number[] = [];

    for (let sim = 0; sim < numSimulations; sim++) {
      const path: number[] = [lastPrice];
      let currentP = lastPrice;
      for (let day = 1; day <= horizonDays; day++) {
        const z = gaussianRandom(sim * horizonDays + day);
        const logReturn = (mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z;
        currentP = currentP * Math.exp(logReturn);
        path.push(currentP);
      }
      paths.push(path);
      terminalPrices.push(currentP);
    }

    // Sort terminal prices for percentile calculations
    terminalPrices.sort((a, b) => a - b);

    // Percentiles over time for fan chart
    const fanChartData = [];
    for (let day = 0; day <= horizonDays; day++) {
      const dayPrices = paths.map((p) => p[day]).sort((a, b) => a - b);
      const p5 = dayPrices[Math.floor(numSimulations * 0.05)];
      const p25 = dayPrices[Math.floor(numSimulations * 0.25)];
      const p50 = dayPrices[Math.floor(numSimulations * 0.50)];
      const p75 = dayPrices[Math.floor(numSimulations * 0.75)];
      const p95 = dayPrices[Math.floor(numSimulations * 0.95)];

      fanChartData.push({
        day: `Day ${day}`,
        p5: parseFloat(p5.toFixed(2)),
        p25: parseFloat(p25.toFixed(2)),
        p50: parseFloat(p50.toFixed(2)),
        p75: parseFloat(p75.toFixed(2)),
        p95: parseFloat(p95.toFixed(2)),
      });
    }

    // Metrics
    const medianTerminal = terminalPrices[Math.floor(numSimulations * 0.50)];
    const p5Terminal = terminalPrices[Math.floor(numSimulations * 0.05)];
    const p95Terminal = terminalPrices[Math.floor(numSimulations * 0.95)];

    const var95Dollar = lastPrice - p5Terminal;
    const var95Pct = (var95Dollar / lastPrice) * 100;

    // CVaR 95% (mean of worst 5% outcomes)
    const worst5Pct = terminalPrices.slice(0, Math.floor(numSimulations * 0.05));
    const avgWorstTerminal = worst5Pct.length > 0 ? worst5Pct.reduce((a, b) => a + b, 0) / worst5Pct.length : p5Terminal;
    const cvar95Dollar = lastPrice - avgWorstTerminal;
    const cvar95Pct = (cvar95Dollar / lastPrice) * 100;

    const probProfit = (terminalPrices.filter((p) => p > lastPrice).length / numSimulations) * 100;

    // Terminal Price Histogram Bins
    const minP = terminalPrices[0];
    const maxP = terminalPrices[terminalPrices.length - 1];
    const numBins = 15;
    const binWidth = (maxP - minP) / numBins || 1;
    const histogram: { range: string; count: number; isProfitable: boolean }[] = [];

    for (let b = 0; b < numBins; b++) {
      const binStart = minP + b * binWidth;
      const binEnd = binStart + binWidth;
      const count = terminalPrices.filter((p) => p >= binStart && (b === numBins - 1 ? p <= binEnd : p < binEnd)).length;
      histogram.push({
        range: `$${binStart.toFixed(0)}-$${binEnd.toFixed(0)}`,
        count,
        isProfitable: binEnd > lastPrice,
      });
    }

    return {
      fanChartData,
      medianTerminal,
      p5Terminal,
      p95Terminal,
      var95Dollar,
      var95Pct,
      cvar95Dollar,
      cvar95Pct,
      probProfit,
      histogram,
      samplePaths: paths.slice(0, 5), // first 5 sample paths for preview
    };
  }, [numSimulations, horizonDays, drift, volatility, lastPrice, seed]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Inputs */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Geometric Brownian Motion (GBM) Monte Carlo Engine
                <span className="text-xs font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-semibold">
                  {ticker} @ ${lastPrice.toFixed(2)}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Simulates stochastic price paths using Ito process: dS = μS dt + σS dW
              </p>
            </div>
          </div>

          <button
            onClick={() => setSeed((prev) => prev + 1)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Run Simulation</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Simulations</label>
            <select
              value={numSimulations}
              onChange={(e) => setNumSimulations(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={250}>250 Paths</option>
              <option value={500}>500 Paths</option>
              <option value={1000}>1,000 Paths</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Horizon (Days)</label>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={30}>30 Days (1 Month)</option>
              <option value={90}>90 Days (1 Quarter)</option>
              <option value={180}>180 Days (6 Months)</option>
              <option value={365}>365 Days (1 Year)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Ann. Drift (μ): <span className="text-indigo-600 font-mono">{drift}%</span>
            </label>
            <input
              type="range"
              min={-30}
              max={50}
              value={drift}
              onChange={(e) => setDrift(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Ann. Volatility (σ): <span className="text-indigo-600 font-mono">{volatility}%</span>
            </label>
            <input
              type="range"
              min={5}
              max={80}
              value={volatility}
              onChange={(e) => setVolatility(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Key Risk & Expectation Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Median Outcome (50th)</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-slate-900">
            ${simulationResults.medianTerminal.toFixed(2)}
          </div>
          <div className="text-[11px] font-semibold mt-1 text-slate-500 font-mono">
            Return: {(((simulationResults.medianTerminal - lastPrice) / lastPrice) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">95% Value at Risk (VaR)</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-rose-600">
            -${simulationResults.var95Dollar.toFixed(2)}
          </div>
          <div className="text-[11px] font-semibold mt-1 text-rose-600 font-mono">
            {simulationResults.var95Pct.toFixed(1)}% Max Loss (95% Conf)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expected Shortfall (CVaR)</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-amber-600">
            -${simulationResults.cvar95Dollar.toFixed(2)}
          </div>
          <div className="text-[11px] font-semibold mt-1 text-amber-600 font-mono">
            {simulationResults.cvar95Pct.toFixed(1)}% Tail Loss Beyond VaR
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Probability of Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-emerald-600">
            {simulationResults.probProfit.toFixed(1)}%
          </div>
          <div className="text-[11px] font-semibold mt-1 text-slate-500 font-mono">
            Paths Ending Above ${lastPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Main Fan Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Simulated Price Trajectories (Percentile Fan)</h4>
            <p className="text-xs text-slate-500">Distribution of projected prices across {numSimulations} stochastic runs over {horizonDays} trading days</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono font-semibold">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> 95th Bull</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span> 50th Median</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500 inline-block"></span> 5th Bear</span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationResults.fanChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(val: any) => [`$${val}`, 'Price']}
              />
              <Line type="monotone" dataKey="p95" stroke="#10b981" strokeWidth={2} dot={false} name="95th Percentile" />
              <Line type="monotone" dataKey="p75" stroke="#34d399" strokeWidth={1} strokeDasharray="3 3" dot={false} name="75th Percentile" />
              <Line type="monotone" dataKey="p50" stroke="#4f46e5" strokeWidth={2.5} dot={false} name="Median (50th)" />
              <Line type="monotone" dataKey="p25" stroke="#f87171" strokeWidth={1} strokeDasharray="3 3" dot={false} name="25th Percentile" />
              <Line type="monotone" dataKey="p5" stroke="#f43f5e" strokeWidth={2} dot={false} name="5th Percentile" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Terminal Price Density Histogram & R Code Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Terminal Price Distribution (Frequency)</h4>
          <p className="text-xs text-slate-500">Frequency of terminal prices at Day {horizonDays}</p>
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simulationResults.histogram} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Path Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* R Code Snippet */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-white space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-indigo-400 font-bold border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>R xts Monte Carlo Generator</span>
            </div>
            <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">R Shiny Backend</span>
          </div>
          <pre className="bg-slate-900 p-3 rounded-lg text-indigo-200 overflow-x-auto text-[11px] leading-relaxed">
{`library(xts)
library(PerformanceAnalytics)

# Parameters
S0 <- ${lastPrice.toFixed(2)}
mu <- ${drift / 100}
sigma <- ${volatility / 100}
N <- ${numSimulations}
days <- ${horizonDays}
dt <- 1/252

# Geometric Brownian Motion Matrix
sim_matrix <- matrix(nrow = days + 1, ncol = N)
sim_matrix[1, ] <- S0

for (i in 1:N) {
  Z <- rnorm(days)
  ret <- (mu - 0.5 * sigma^2)*dt + sigma*sqrt(dt)*Z
  sim_matrix[2:(days+1), i] <- S0 * cumprod(exp(ret))
}

# VaR 95% Calculation
terminal_prices <- sim_matrix[days + 1, ]
VaR_95 <- S0 - quantile(terminal_prices, 0.05)
cat("VaR (95%):", VaR_95)`}
          </pre>
        </div>
      </div>
    </div>
  );
};
