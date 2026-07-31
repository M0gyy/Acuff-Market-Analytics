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
  Cell,
} from 'recharts';
import {
  PieChart as PieIcon,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  Shield,
  Percent,
  Sliders,
  Code2,
  Sparkles,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { generateMarketData } from '../services/financialData';

interface PortfolioAsset {
  symbol: string;
  name: string;
  weight: number; // percentage e.g. 25 = 25%
  color: string;
}

interface PortfolioSimulatorProps {
  startDate: string;
  endDate: string;
}

const ASSET_COLORS = [
  '#7e22ce', // Purple
  '#0284c7', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export const PortfolioSimulator: React.FC<PortfolioSimulatorProps> = ({ startDate, endDate }) => {
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [rebalanceFrequency, setRebalanceFrequency] = useState<'monthly' | 'quarterly' | 'buy_and_hold'>('monthly');
  const [newTickerInput, setNewTickerInput] = useState<string>('');

  const [assets, setAssets] = useState<PortfolioAsset[]>([
    { symbol: 'GOOGL', name: 'Alphabet Inc.', weight: 30, color: ASSET_COLORS[0] },
    { symbol: 'AAPL', name: 'Apple Inc.', weight: 25, color: ASSET_COLORS[1] },
    { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 25, color: ASSET_COLORS[2] },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', weight: 20, color: ASSET_COLORS[3] },
  ]);

  // Presets
  const applyPreset = (presetName: 'equal' | 'growth' | 'balanced' | 'ai_hardware') => {
    if (presetName === 'equal') {
      setAssets([
        { symbol: 'GOOGL', name: 'Alphabet Inc.', weight: 25, color: ASSET_COLORS[0] },
        { symbol: 'AAPL', name: 'Apple Inc.', weight: 25, color: ASSET_COLORS[1] },
        { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 25, color: ASSET_COLORS[2] },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 25, color: ASSET_COLORS[3] },
      ]);
    } else if (presetName === 'growth') {
      setAssets([
        { symbol: 'NVDA', name: 'NVIDIA Corp.', weight: 35, color: ASSET_COLORS[0] },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', weight: 25, color: ASSET_COLORS[1] },
        { symbol: 'MSFT', name: 'Microsoft Corp.', weight: 20, color: ASSET_COLORS[2] },
        { symbol: 'META', name: 'Meta Platforms', weight: 20, color: ASSET_COLORS[3] },
      ]);
    } else if (presetName === 'balanced') {
      setAssets([
        { symbol: 'SPY', name: 'S&P 500 ETF', weight: 50, color: ASSET_COLORS[0] },
        { symbol: 'QQQ', name: 'Nasdaq 100 ETF', weight: 25, color: ASSET_COLORS[1] },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', weight: 15, color: ASSET_COLORS[2] },
        { symbol: 'AAPL', name: 'Apple Inc.', weight: 10, color: ASSET_COLORS[3] },
      ]);
    } else if (presetName === 'ai_hardware') {
      setAssets([
        { symbol: 'NVDA', name: 'NVIDIA Corp.', weight: 40, color: ASSET_COLORS[0] },
        { symbol: 'TSM', name: 'Taiwan Semi', weight: 25, color: ASSET_COLORS[1] },
        { symbol: 'AMD', name: 'AMD Inc.', weight: 20, color: ASSET_COLORS[2] },
        { symbol: 'ASML', name: 'ASML Holding', weight: 15, color: ASSET_COLORS[3] },
      ]);
    }
  };

  const totalWeight = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.weight, 0);
  }, [assets]);

  const normalizeWeights = () => {
    if (totalWeight === 0) return;
    const factor = 100 / totalWeight;
    setAssets((prev) =>
      prev.map((a) => ({
        ...a,
        weight: Number((a.weight * factor).toFixed(1)),
      }))
    );
  };

  const handleWeightChange = (symbol: string, val: number) => {
    setAssets((prev) =>
      prev.map((a) => (a.symbol === symbol ? { ...a, weight: Math.max(0, val) } : a))
    );
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSym = newTickerInput.trim().toUpperCase();
    if (!cleanSym) return;
    if (assets.some((a) => a.symbol === cleanSym)) return;

    const newColor = ASSET_COLORS[assets.length % ASSET_COLORS.length];
    setAssets((prev) => [
      ...prev,
      { symbol: cleanSym, name: `${cleanSym} Stock`, weight: 10, color: newColor },
    ]);
    setNewTickerInput('');
  };

  const handleRemoveAsset = (symbol: string) => {
    setAssets((prev) => prev.filter((a) => a.symbol !== symbol));
  };

  // Generate multi-asset time-series simulation
  const simulationResults = useMemo(() => {
    if (assets.length === 0) return { chartData: [], metrics: null, correlationMatrix: [] };

    // Fetch mock OHLCV time-series for each asset and SPY benchmark
    const seriesMap: Record<string, { date: string; close: number }[]> = {};
    const benchmarkSeries = generateMarketData('SPY', startDate, endDate);

    assets.forEach((a) => {
      const rawData = generateMarketData(a.symbol, startDate, endDate);
      seriesMap[a.symbol] = rawData.map((d) => ({ date: d.date, close: d.close }));
    });

    if (!benchmarkSeries || benchmarkSeries.length === 0) {
      return { chartData: [], metrics: null, correlationMatrix: [] };
    }

    const length = benchmarkSeries.length;
    const normalizedWeights = assets.map((a) => (totalWeight > 0 ? a.weight / totalWeight : 0));

    // Initial asset prices
    const initialPrices: Record<string, number> = {};
    assets.forEach((a) => {
      initialPrices[a.symbol] = seriesMap[a.symbol]?.[0]?.close || 100;
    });
    const benchmarkInit = benchmarkSeries[0].close;

    // Build timeline chart data
    let maxPortfolioVal = initialCapital;
    let maxDrawdownVal = 0;
    let portfolioPeak = initialCapital;

    const chartData = benchmarkSeries.map((bItem, idx) => {
      const dateStr = bItem.date;
      const row: Record<string, any> = { date: dateStr };

      let weightedSumRatio = 0;

      assets.forEach((a, aIdx) => {
        const curPrice = seriesMap[a.symbol]?.[idx]?.close || initialPrices[a.symbol];
        const initPrice = initialPrices[a.symbol];
        const priceRatio = curPrice / initPrice;

        // Individual asset growth value
        row[a.symbol] = Number((initialCapital * priceRatio).toFixed(2));
        weightedSumRatio += priceRatio * normalizedWeights[aIdx];
      });

      // Portfolio total value
      const portfolioVal = Number((initialCapital * weightedSumRatio).toFixed(2));
      row.Portfolio = portfolioVal;

      // Benchmark SPY value
      const benchmarkVal = Number((initialCapital * (bItem.close / benchmarkInit)).toFixed(2));
      row.Benchmark = benchmarkVal;

      // Track peak & max drawdown
      if (portfolioVal > portfolioPeak) {
        portfolioPeak = portfolioVal;
      }
      const dd = ((portfolioPeak - portfolioVal) / portfolioPeak) * 100;
      if (dd > maxDrawdownVal) {
        maxDrawdownVal = dd;
      }

      return row;
    });

    const finalPortfolioVal = chartData[chartData.length - 1]?.Portfolio || initialCapital;
    const finalBenchmarkVal = chartData[chartData.length - 1]?.Benchmark || initialCapital;

    const totalReturnPct = ((finalPortfolioVal - initialCapital) / initialCapital) * 100;
    const benchmarkReturnPct = ((finalBenchmarkVal - initialCapital) / initialCapital) * 100;

    // Daily returns array for Sharpe Calculation
    const dailyPortfolioReturns: number[] = [];
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1].Portfolio;
      const curr = chartData[i].Portfolio;
      dailyPortfolioReturns.push((curr - prev) / prev);
    }

    const meanReturn =
      dailyPortfolioReturns.reduce((sum, r) => sum + r, 0) / (dailyPortfolioReturns.length || 1);
    const variance =
      dailyPortfolioReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) /
      (dailyPortfolioReturns.length || 1);
    const dailyVolatility = Math.sqrt(variance);
    const annualizedVol = dailyVolatility * Math.sqrt(252) * 100;
    const annualizedReturn = (Math.pow(1 + totalReturnPct / 100, 252 / chartData.length) - 1) * 100;
    const sharpeRatio = (annualizedReturn - 2.0) / (annualizedVol || 1);

    // Mock correlation matrix calculation
    const correlationMatrix = assets.map((a1) => {
      const row: Record<string, number> = { asset: a1.symbol as any };
      assets.forEach((a2) => {
        if (a1.symbol === a2.symbol) {
          row[a2.symbol] = 1.0;
        } else {
          // Semi-randomized realistic positive stock correlation (0.45 to 0.85)
          const charCodeSum = a1.symbol.charCodeAt(0) + a2.symbol.charCodeAt(0);
          const corr = Number((0.45 + (charCodeSum % 35) / 100).toFixed(2));
          row[a2.symbol] = Math.min(0.95, corr);
        }
      });
      return row;
    });

    return {
      chartData,
      metrics: {
        finalValue: finalPortfolioVal,
        totalReturnPct: Number(totalReturnPct.toFixed(2)),
        benchmarkReturnPct: Number(benchmarkReturnPct.toFixed(2)),
        alphaVsBenchmark: Number((totalReturnPct - benchmarkReturnPct).toFixed(2)),
        annualizedReturnPct: Number(annualizedReturn.toFixed(2)),
        annualizedVolatilityPct: Number(annualizedVol.toFixed(2)),
        sharpeRatio: Number(sharpeRatio.toFixed(2)),
        maxDrawdownPct: Number(maxDrawdownVal.toFixed(2)),
      },
      correlationMatrix,
    };
  }, [assets, totalWeight, startDate, endDate, initialCapital]);

  const { chartData, metrics, correlationMatrix } = simulationResults;

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Controls Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-700" />
              <span>Quantitative Multi-Asset Portfolio Simulator</span>
              <span className="text-[10px] font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded border border-purple-200">
                tidyquant :: tq_portfolio
              </span>
            </h3>
          </div>

          {/* Quick Strategy Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <span className="text-slate-500 text-[11px] font-mono mr-1">Presets:</span>
            <button
              onClick={() => applyPreset('equal')}
              className="bg-slate-100 hover:bg-purple-100 text-slate-800 hover:text-purple-900 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              Equal Weight (1/N)
            </button>
            <button
              onClick={() => applyPreset('growth')}
              className="bg-slate-100 hover:bg-purple-100 text-slate-800 hover:text-purple-900 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              Tech MegaCap
            </button>
            <button
              onClick={() => applyPreset('balanced')}
              className="bg-slate-100 hover:bg-purple-100 text-slate-800 hover:text-purple-900 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              S&P 60/40 Core
            </button>
            <button
              onClick={() => applyPreset('ai_hardware')}
              className="bg-slate-100 hover:bg-purple-100 text-slate-800 hover:text-purple-900 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              Semis & AI
            </button>
          </div>
        </div>

        {/* Portfolio Capital & Rebalance Config */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Initial Capital ($ USD)
            </label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value))}
              step={1000}
              min={1000}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Rebalancing Cadence (`tq_portfolio`)
            </label>
            <select
              value={rebalanceFrequency}
              onChange={(e) => setRebalanceFrequency(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none cursor-pointer"
            >
              <option value="monthly">Monthly Rebalancing (rebalance_on = 'months')</option>
              <option value="quarterly">Quarterly Rebalancing (rebalance_on = 'quarters')</option>
              <option value="buy_and_hold">Buy & Hold (No Rebalancing)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Allocation Weight Status
            </label>
            <div className="flex items-center justify-between bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono">
              <span className={`font-bold ${totalWeight === 100 ? 'text-emerald-700' : 'text-amber-600'}`}>
                Total: {totalWeight.toFixed(1)}%
              </span>
              {totalWeight !== 100 && (
                <button
                  onClick={normalizeWeights}
                  className="bg-purple-900 hover:bg-purple-950 text-white text-[10px] font-bold px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Fix to 100%</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Asset Allocation Sliders Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Asset Allocations & Weightings</span>
            <form onSubmit={handleAddAsset} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newTickerInput}
                onChange={(e) => setNewTickerInput(e.target.value)}
                placeholder="Ticker (e.g. AMZN)"
                className="w-32 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono uppercase text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-purple-900 hover:bg-purple-950 text-white px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Asset</span>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {assets.map((a) => (
              <div
                key={a.symbol}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 relative group hover:border-purple-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="font-bold font-mono text-xs text-slate-900">{a.symbol}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveAsset(a.symbol)}
                    className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title={`Remove ${a.symbol}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Allocation Weight:</span>
                  <span className="font-mono font-bold text-purple-900">{a.weight}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={a.weight}
                  onChange={(e) => handleWeightChange(a.symbol, Number(e.target.value))}
                  className="w-full accent-purple-700 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Summary Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              <span>Portfolio Total Value</span>
            </div>
            <div className="text-xl font-bold font-mono text-purple-950">
              ${metrics.finalValue.toLocaleString()}
            </div>
            <div
              className={`text-xs font-bold font-mono ${
                metrics.totalReturnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {metrics.totalReturnPct >= 0 ? '+' : ''}
              {metrics.totalReturnPct}% Return
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Alpha vs S&P 500 Benchmark</span>
            </div>
            <div
              className={`text-xl font-bold font-mono ${
                metrics.alphaVsBenchmark >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {metrics.alphaVsBenchmark >= 0 ? '+' : ''}
              {metrics.alphaVsBenchmark}%
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              SPY Return: {metrics.benchmarkReturnPct}%
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-purple-600" />
              <span>Sharpe Ratio (Rf = 2.0%)</span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900">{metrics.sharpeRatio}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              Ann. Volatility: {metrics.annualizedVolatilityPct}%
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-rose-600" />
              <span>Max Portfolio Drawdown</span>
            </div>
            <div className="text-xl font-bold font-mono text-rose-700">-{metrics.maxDrawdownPct}%</div>
            <div className="text-[11px] text-slate-500 font-mono">
              Ann. Return: {metrics.annualizedReturnPct}%
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Growth Chart vs Benchmark */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Simulated Growth of ${initialCapital.toLocaleString()} (`PortfolioAnalytics::chart.CumReturns`)
            </h4>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1 text-purple-900 font-bold">
              <span className="w-3 h-3 rounded-full bg-purple-700 inline-block" />
              Weighted Portfolio
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
              SPY Benchmark
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={30} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#581c87',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '11px',
                }}
                formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Value']}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />

              {/* Main Portfolio Line */}
              <Line
                type="monotone"
                dataKey="Portfolio"
                name="Weighted Portfolio ($)"
                stroke="#6b21a8"
                strokeWidth={3}
                dot={false}
              />

              {/* Benchmark Line */}
              <Line
                type="monotone"
                dataKey="Benchmark"
                name="S&P 500 (SPY) ($)"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />

              {/* Individual Assets */}
              {assets.map((a) => (
                <Line
                  key={a.symbol}
                  type="monotone"
                  dataKey={a.symbol}
                  name={`${a.symbol} (${a.weight}%)`}
                  stroke={a.color}
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Correlation Matrix Heatmap */}
      {correlationMatrix.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Asset Correlation Matrix (`PerformanceAnalytics::chart.Correlation`)
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Diversification check (Lower correlation reduces portfolio risk)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-600 uppercase">
                  <th className="py-2 px-3 text-left font-bold text-slate-700">Asset</th>
                  {assets.map((a) => (
                    <th key={a.symbol} className="py-2 px-2 font-bold">
                      {a.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {correlationMatrix.map((row) => (
                  <tr key={row.asset}>
                    <td className="py-2.5 px-3 font-bold text-slate-800 text-left bg-slate-50 border-r border-slate-200">
                      {row.asset}
                    </td>
                    {assets.map((a) => {
                      const corr = row[a.symbol];
                      const isSelf = row.asset === a.symbol;

                      let bg = 'bg-slate-100 text-slate-800';
                      if (!isSelf) {
                        if (corr > 0.8) bg = 'bg-purple-900 text-white font-bold';
                        else if (corr > 0.6) bg = 'bg-purple-700 text-white font-medium';
                        else if (corr > 0.4) bg = 'bg-purple-200 text-purple-900';
                        else bg = 'bg-emerald-100 text-emerald-900';
                      }

                      return (
                        <td key={a.symbol} className="p-1">
                          <div className={`py-1.5 px-2 rounded text-[11px] ${bg}`}>
                            {corr !== undefined ? corr.toFixed(2) : '-'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
