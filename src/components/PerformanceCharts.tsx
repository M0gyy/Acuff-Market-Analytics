import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from 'recharts';
import { OHLCV, QuantitativeMetrics } from '../types';
import { TrendingUp, TrendingDown, ShieldAlert, BarChart3, Percent, Layers } from 'lucide-react';
import { MonthlyReturnsHeatmap } from './MonthlyReturnsHeatmap';

interface PerformanceChartsProps {
  data: OHLCV[];
  metrics: QuantitativeMetrics;
  ticker: string;
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ data, metrics, ticker }) => {
  if (data.length === 0) return null;

  // Compute returns distribution buckets for histogram
  const returns = data.slice(1).map((d) => d.dailyReturn || 0);
  const minR = Math.min(...returns, -0.04);
  const maxR = Math.max(...returns, 0.04);
  const step = (maxR - minR) / 12;

  const buckets: { range: string; count: number; midpoint: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const low = minR + i * step;
    const high = low + step;
    const count = returns.filter((r) => r >= low && r < high).length;
    buckets.push({
      range: `${(low * 100).toFixed(1)}%`,
      count,
      midpoint: Number(((low + high) / 2 * 100).toFixed(2)),
    });
  }

  return (
    <div className="space-y-6">
      {/* Performance & Risk Summary Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-900/60 text-purple-300 border border-purple-700/50">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>R PerformanceAnalytics Summary</span>
                <span className="text-xs font-mono bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">
                  {ticker} xts Time-Series
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Risk-adjusted performance metrics, downside volatility, and parametric Value-at-Risk (VaR)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2.5 py-1 rounded-md">
              Ann. Return: +{metrics.annualizedReturn}%
            </span>
            <span className="bg-purple-950/80 text-purple-300 border border-purple-800/80 px-2.5 py-1 rounded-md">
              Sharpe: {metrics.sharpeRatio}
            </span>
          </div>
        </div>

        {/* 6 Key Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
          <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Sharpe Ratio</div>
            <div className="text-lg font-bold text-purple-300 mt-0.5">{metrics.sharpeRatio}</div>
            <div className="text-[10px] text-slate-400 mt-1">Rf = 2.0%</div>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Sortino Ratio</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{metrics.sortinoRatio}</div>
            <div className="text-[10px] text-slate-400 mt-1">Downside Risk</div>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Max Drawdown</div>
            <div className="text-lg font-bold text-rose-400 mt-0.5">{metrics.maxDrawdown}%</div>
            <div className="text-[10px] text-slate-400 mt-1">Peak to Trough</div>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Daily VaR (95%)</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{metrics.var95}%</div>
            <div className="text-[10px] text-slate-400 mt-1">1-Day Max Loss</div>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Ann. Volatility</div>
            <div className="text-lg font-bold text-slate-200 mt-0.5">{metrics.annualizedVolatility}%</div>
            <div className="text-[10px] text-slate-400 mt-1">Std Dev x √252</div>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Beta vs SPY</div>
            <div className="text-lg font-bold text-indigo-300 mt-0.5">{metrics.beta}</div>
            <div className="text-[10px] text-slate-400 mt-1">Alpha: +{metrics.alpha}%</div>
          </div>
        </div>
      </div>

      {/* Grid of Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative Returns Comparison Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Cumulative Growth vs Benchmark (`PerformanceAnalytics::chart.CumReturns`)
              </h4>
            </div>
            <span className="text-[11px] font-mono font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {ticker} vs S&P 500
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={25} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)}%`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="cumReturn"
                  name={`${ticker} Cumulative Return`}
                  stroke="#7e22ce"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="benchmarkCumReturn"
                  name="S&P 500 Benchmark"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Underwater Drawdown Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Underwater Peak-to-Trough Drawdown (`PerformanceAnalytics::chart.Drawdown`)
              </h4>
            </div>
            <span className="text-[11px] font-mono font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Max DD: {metrics.maxDrawdown}%
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={25} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" domain={['dataMin', 0]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Drawdown']}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#be123c"
                  strokeWidth={2}
                  fill="url(#drawdownGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
