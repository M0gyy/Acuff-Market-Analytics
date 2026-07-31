import React, { useState, useMemo } from 'react';
import { Watchlist, OHLCV } from '../types';
import { generateMarketData } from '../services/financialData';
import {
  Activity,
  Flame,
  Zap,
  TrendingUp,
  BarChart2,
  Code2,
  Info,
  Filter,
  ArrowUpDown,
  Layers,
  Sparkles,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface VolatilityHeatmapProps {
  watchlists: Watchlist[];
  activeWatchlistId: string;
  startDate: string;
  endDate: string;
  onSelectWatchlist: (id: string) => void;
  onSelectTicker: (ticker: string) => void;
}

type VolatilityMetric = 'rel_atr_pct' | 'abs_atr' | 'ann_vol_pct' | 'atr_change_pct';

export const VolatilityHeatmap: React.FC<VolatilityHeatmapProps> = ({
  watchlists,
  activeWatchlistId,
  startDate,
  endDate,
  onSelectWatchlist,
  onSelectTicker,
}) => {
  const [metric, setMetric] = useState<VolatilityMetric>('rel_atr_pct');
  const [sortBy, setSortBy] = useState<'desc' | 'asc'>('desc');
  const [hoveredCell, setHoveredCell] = useState<{ symbol: string; date: string; value: number } | null>(null);

  // Active Watchlist
  const activeWatchlist = useMemo(() => {
    return watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];
  }, [watchlists, activeWatchlistId]);

  // Compute time-series ATR data for all symbols in active watchlist
  const watchlistVolatilityData = useMemo(() => {
    if (!activeWatchlist || activeWatchlist.symbols.length === 0) return { symbolsData: [], matrixDates: [], summaryList: [] };

    const symbolsData: Record<string, { ohlcv: OHLCV[]; summary: any }> = {};

    activeWatchlist.symbols.forEach((s) => {
      const data = generateMarketData(s.symbol, startDate, endDate);
      if (data && data.length > 0) {
        const closes = data.map((d) => d.close);
        const atrs = data.map((d) => d.atr || 0);

        // Daily Relative ATR % = (ATR / Close) * 100
        const relAtrPcts = data.map((d) => (d.close > 0 && d.atr ? (d.atr / d.close) * 100 : 0));

        // Daily returns for annualized volatility
        const dailyReturns: number[] = [];
        for (let i = 1; i < data.length; i++) {
          const prev = closes[i - 1];
          if (prev > 0) {
            dailyReturns.push((closes[i] - prev) / prev);
          }
        }

        const meanReturn = dailyReturns.reduce((acc, r) => acc + r, 0) / (dailyReturns.length || 1);
        const variance = dailyReturns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / (dailyReturns.length || 1);
        const dailyStdDev = Math.sqrt(variance);
        const annVolPct = dailyStdDev * Math.sqrt(252) * 100;

        const latestIndex = data.length - 1;
        const latestClose = closes[latestIndex] || s.price;
        const latestAtr = atrs[latestIndex] || 0;
        const latestRelAtrPct = relAtrPcts[latestIndex] || 0;

        // 20-day Average Relative ATR %
        const recentRelAtrSlice = relAtrPcts.slice(Math.max(0, relAtrPcts.length - 20));
        const avg20RelAtrPct = recentRelAtrSlice.reduce((a, b) => a + b, 0) / (recentRelAtrSlice.length || 1);

        // ATR Trend (expanding if latest > 20d avg)
        const isExpanding = latestRelAtrPct > avg20RelAtrPct;

        symbolsData[s.symbol] = {
          ohlcv: data,
          summary: {
            symbol: s.symbol,
            name: s.name,
            currentPrice: latestClose,
            currentAtr: Number(latestAtr.toFixed(2)),
            relAtrPct: Number(latestRelAtrPct.toFixed(2)),
            avg20RelAtrPct: Number(avg20RelAtrPct.toFixed(2)),
            annVolPct: Number(annVolPct.toFixed(2)),
            isExpanding,
          },
        };
      }
    });

    // Sub-sample dates (e.g. up to 14 uniform time steps across range) for clean Heatmap Grid
    const sampleSymbol = Object.keys(symbolsData)[0];
    let matrixDates: string[] = [];

    if (sampleSymbol && symbolsData[sampleSymbol].ohlcv.length > 0) {
      const fullDates = symbolsData[sampleSymbol].ohlcv.map((d) => d.date);
      const step = Math.max(1, Math.floor(fullDates.length / 14));
      matrixDates = fullDates.filter((_, idx) => idx % step === 0).slice(-14);
    }

    // Sort summary list
    let summaryList = Object.values(symbolsData).map((d) => d.summary);
    summaryList.sort((a, b) => {
      const key = metric === 'rel_atr_pct' ? 'relAtrPct' : metric === 'ann_vol_pct' ? 'annVolPct' : 'currentAtr';
      return sortBy === 'desc' ? b[key] - a[key] : a[key] - b[key];
    });

    return { symbolsData, matrixDates, summaryList };
  }, [activeWatchlist, startDate, endDate, metric, sortBy]);

  const { symbolsData, matrixDates, summaryList } = watchlistVolatilityData;

  // Heatmap Color Scale Function based on Relative ATR % (or selected metric)
  const getCellColor = (val: number, metricType: VolatilityMetric) => {
    if (metricType === 'rel_atr_pct') {
      if (val >= 4.0) return 'bg-rose-700 text-white font-bold shadow-2xs'; // Extreme Volatility
      if (val >= 3.0) return 'bg-rose-500 text-white font-semibold';
      if (val >= 2.2) return 'bg-amber-500 text-white font-medium';
      if (val >= 1.5) return 'bg-emerald-500 text-white font-medium';
      if (val >= 1.0) return 'bg-emerald-200 text-emerald-900';
      return 'bg-emerald-100 text-emerald-800'; // Low Volatility
    } else if (metricType === 'ann_vol_pct') {
      if (val >= 50) return 'bg-rose-700 text-white font-bold';
      if (val >= 35) return 'bg-rose-500 text-white font-semibold';
      if (val >= 25) return 'bg-amber-500 text-white font-medium';
      if (val >= 18) return 'bg-emerald-500 text-white font-medium';
      return 'bg-emerald-200 text-emerald-900';
    } else {
      if (val >= 10) return 'bg-purple-800 text-white font-bold';
      if (val >= 5) return 'bg-purple-600 text-white';
      if (val >= 2) return 'bg-purple-300 text-purple-900';
      return 'bg-purple-100 text-purple-800';
    }
  };

  // Recharts Trajectory Time Series Data
  const chartTrajectoryData = useMemo(() => {
    if (matrixDates.length === 0 || summaryList.length === 0) return [];

    return matrixDates.map((dateStr) => {
      const row: Record<string, any> = { date: dateStr };
      summaryList.forEach((s) => {
        const item = symbolsData[s.symbol]?.ohlcv.find((d) => d.date === dateStr);
        if (item) {
          const relAtr = item.close > 0 && item.atr ? (item.atr / item.close) * 100 : 0;
          row[s.symbol] = Number(relAtr.toFixed(2));
        }
      });
      return row;
    });
  }, [matrixDates, summaryList, symbolsData]);

  const ASSET_LINE_COLORS = ['#7e22ce', '#0284c7', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Watchlist Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Flame className="w-4 h-4 text-purple-700" />
              <span>Watchlist Volatility & Relative ATR Heatmap Matrix</span>
              <span className="text-[10px] font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded border border-purple-200">
                TTR :: ATR Heatmap
              </span>
            </h3>
          </div>

          {/* Watchlist Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Watchlist:
            </span>
            {watchlists.map((wl) => (
              <button
                key={wl.id}
                onClick={() => onSelectWatchlist(wl.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  wl.id === activeWatchlistId
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900'
                }`}
              >
                <span>{wl.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({wl.symbols.length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Metric Toggles & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-purple-600" /> Metric:
            </span>

            <button
              onClick={() => setMetric('rel_atr_pct')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                metric === 'rel_atr_pct'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Relative ATR % (ATR / Price)
            </button>

            <button
              onClick={() => setMetric('ann_vol_pct')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                metric === 'ann_vol_pct'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Annualized Volatility % (σ)
            </button>

            <button
              onClick={() => setMetric('abs_atr')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                metric === 'abs_atr'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Absolute ATR ($)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
              <span>Sort: {sortBy === 'desc' ? 'Highest Volatility First' : 'Lowest Volatility First'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MATRIX GRID HEATMAP TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {activeWatchlist.name} — Relative ATR % Heatmap Matrix
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 font-medium text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 inline-block" /> Low Vol
            </span>
            <span className="flex items-center gap-1 font-medium text-amber-800">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Moderate
            </span>
            <span className="flex items-center gap-1 font-bold text-rose-800">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-700 inline-block" /> High ATR Spike
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-600 uppercase">
                <th className="py-2.5 px-3 text-left font-bold text-slate-700 min-w-[120px]">Symbol</th>
                {matrixDates.map((dateStr) => (
                  <th key={dateStr} className="py-2 px-1.5 font-bold min-w-[55px]">
                    {dateStr.slice(5)}
                  </th>
                ))}
                <th className="py-2.5 px-3 font-bold text-purple-900 bg-purple-100/80">Current Relative ATR%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {summaryList.map((s) => {
                const symbolData = symbolsData[s.symbol];
                if (!symbolData) return null;

                return (
                  <tr key={s.symbol} className="hover:bg-slate-50/90 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-900 text-left bg-slate-50 border-r border-slate-200">
                      <button
                        onClick={() => onSelectTicker(s.symbol)}
                        className="text-purple-900 hover:text-purple-600 underline font-mono flex items-center gap-1.5 cursor-pointer"
                        title={`Analyze ${s.symbol} in main chart`}
                      >
                        <Eye className="w-3 h-3 text-purple-500" />
                        <span>{s.symbol}</span>
                      </button>
                    </td>

                    {matrixDates.map((dateStr) => {
                      const dayItem = symbolData.ohlcv.find((d) => d.date === dateStr);
                      const val =
                        dayItem && dayItem.close > 0 && dayItem.atr
                          ? metric === 'rel_atr_pct'
                            ? (dayItem.atr / dayItem.close) * 100
                            : metric === 'abs_atr'
                            ? dayItem.atr
                            : s.annVolPct
                          : 0;

                      return (
                        <td key={dateStr} className="p-1">
                          <div
                            onMouseEnter={() => setHoveredCell({ symbol: s.symbol, date: dateStr, value: val })}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`py-1.5 px-1 rounded text-[10px] transition-transform hover:scale-105 shadow-2xs ${getCellColor(
                              val,
                              metric
                            )}`}
                          >
                            {val.toFixed(1)}%
                          </div>
                        </td>
                      );
                    })}

                    <td className="p-1.5 bg-slate-50 border-l border-slate-200 font-bold">
                      <div className="py-1 px-2 rounded bg-purple-950 text-purple-200 border border-purple-800 text-[11px]">
                        {s.relAtrPct}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECHARTS COMPARATIVE VOLATILITY RANKING BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-700" />
              <span>Watchlist Relative ATR % Ranking</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">Current vs 20-Day Avg ATR %</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryList} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="symbol" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#581c87',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Relative ATR']}
                />
                <Bar dataKey="relAtrPct" name="Current ATR %" fill="#7e22ce" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg20RelAtrPct" name="20D Avg ATR %" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MULTI-SYMBOL ATR TRAJECTORY TIME-SERIES LINE CHART */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-700" />
              <span>Relative ATR % Trajectories Over Time</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">Volatility Trajectory</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartTrajectoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={20} />
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
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {summaryList.slice(0, 6).map((s, idx) => (
                  <Line
                    key={s.symbol}
                    type="monotone"
                    dataKey={s.symbol}
                    stroke={ASSET_LINE_COLORS[idx % ASSET_LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* VOLATILITY METRICS DETAILED SUMMARY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 pb-3 border-b border-slate-200">
          <Info className="w-4 h-4 text-purple-700" />
          <span>Watchlist Volatility Statistics Breakdown</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-600 uppercase">
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">Company Name</th>
                <th className="py-2.5 px-3">Price ($)</th>
                <th className="py-2.5 px-3">ATR ($)</th>
                <th className="py-2.5 px-3">Rel. ATR %</th>
                <th className="py-2.5 px-3">20D Avg ATR %</th>
                <th className="py-2.5 px-3">Ann. Volatility (σ)</th>
                <th className="py-2.5 px-3">Volatility Trend</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {summaryList.map((s) => (
                <tr key={s.symbol} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-bold text-purple-900">{s.symbol}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-sans">{s.name}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">${s.currentPrice.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-slate-700">${s.currentAtr}</td>
                  <td className="py-2.5 px-3 font-bold text-purple-900">{s.relAtrPct}%</td>
                  <td className="py-2.5 px-3 text-slate-600">{s.avg20RelAtrPct}%</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{s.annVolPct}%</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.isExpanding
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {s.isExpanding ? '📈 Expanding ATR' : '📉 Contracting ATR'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onSelectTicker(s.symbol)}
                      className="bg-purple-900 hover:bg-purple-950 text-white px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
