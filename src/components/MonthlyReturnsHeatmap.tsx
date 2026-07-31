import React, { useMemo } from 'react';
import { OHLCV } from '../types';
import { Calendar, Code2, Sparkles } from 'lucide-react';

interface MonthlyReturnsHeatmapProps {
  data: OHLCV[];
  ticker: string;
}

interface MonthReturn {
  year: number;
  month: number; // 0-11
  returnPct: number | null;
}

export const MonthlyReturnsHeatmap: React.FC<MonthlyReturnsHeatmapProps> = ({ data, ticker }) => {
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Calculate monthly returns grid from daily OHLCV
  const { years, matrix, yearTotals } = useMemo(() => {
    if (!data || data.length === 0) {
      return { years: [], matrix: {}, yearTotals: {} };
    }

    // Group dates by year and month
    const yearMonthMap: Record<number, Record<number, { first: number; last: number }>> = {};

    data.forEach((d) => {
      const dateObj = new Date(d.date);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();

      if (!yearMonthMap[year]) {
        yearMonthMap[year] = {};
      }
      if (!yearMonthMap[year][month]) {
        yearMonthMap[year][month] = { first: d.open, last: d.close };
      } else {
        yearMonthMap[year][month].last = d.close;
      }
    });

    const yearsList = Object.keys(yearMonthMap)
      .map(Number)
      .sort((a, b) => b - a); // descending years

    const grid: Record<number, (number | null)[]> = {};
    const ytdMap: Record<number, number> = {};

    yearsList.forEach((y) => {
      grid[y] = Array(12).fill(null);
      let yearStartPrice: number | null = null;
      let yearEndPrice: number | null = null;

      for (let m = 0; m < 12; m++) {
        const mData = yearMonthMap[y]?.[m];
        if (mData) {
          if (yearStartPrice === null) yearStartPrice = mData.first;
          yearEndPrice = mData.last;
          const ret = ((mData.last - mData.first) / mData.first) * 100;
          grid[y][m] = Number(ret.toFixed(2));
        }
      }

      if (yearStartPrice && yearEndPrice) {
        ytdMap[y] = Number((((yearEndPrice - yearStartPrice) / yearStartPrice) * 100).toFixed(2));
      } else {
        ytdMap[y] = 0;
      }
    });

    return { years: yearsList, matrix: grid, yearTotals: ytdMap };
  }, [data]);

  const getHeatmapBg = (val: number | null) => {
    if (val === null) return 'bg-slate-100 text-slate-400';
    if (val > 8) return 'bg-emerald-700 text-white font-bold';
    if (val > 4) return 'bg-emerald-600 text-white font-semibold';
    if (val > 2) return 'bg-emerald-500 text-white';
    if (val > 0) return 'bg-emerald-100 text-emerald-900 font-medium';
    if (val === 0) return 'bg-slate-100 text-slate-600';
    if (val > -2) return 'bg-rose-100 text-rose-900 font-medium';
    if (val > -4) return 'bg-rose-500 text-white';
    if (val > -8) return 'bg-rose-600 text-white font-semibold';
    return 'bg-rose-700 text-white font-bold';
  };

  if (years.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-700" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Monthly Performance Calendar Matrix (`PerformanceAnalytics::table.CalendarReturns`)
          </h4>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold">
            {ticker} Returns Heatmap
          </span>
          <span className="text-slate-500 hidden sm:inline">R package: PerformanceAnalytics</span>
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse font-mono text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-600 uppercase">
              <th className="py-2 px-3 text-left font-bold text-slate-700">Year</th>
              {MONTH_NAMES.map((m) => (
                <th key={m} className="py-2 px-1 font-bold">
                  {m}
                </th>
              ))}
              <th className="py-2 px-3 font-bold text-purple-900 bg-purple-100/80">YTD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {years.map((y) => {
              const ytd = yearTotals[y];
              const isYtdPos = ytd >= 0;

              return (
                <tr key={y} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-800 text-left bg-slate-50 border-r border-slate-200">
                    {y}
                  </td>
                  {matrix[y].map((val, idx) => (
                    <td key={idx} className="p-1">
                      <div
                        className={`py-1.5 px-1 rounded text-[10px] transition-transform hover:scale-105 shadow-2xs ${getHeatmapBg(
                          val
                        )}`}
                        title={val !== null ? `${MONTH_NAMES[idx]} ${y}: ${val}%` : 'No data'}
                      >
                        {val !== null ? `${val > 0 ? '+' : ''}${val}%` : '-'}
                      </div>
                    </td>
                  ))}
                  <td className="p-1 bg-slate-50 border-l border-slate-200 font-bold">
                    <div
                      className={`py-1.5 px-2 rounded text-[11px] font-bold ${
                        isYtdPos
                          ? 'bg-purple-950 text-purple-200 border border-purple-800'
                          : 'bg-rose-950 text-rose-200 border border-rose-800'
                      }`}
                    >
                      {isYtdPos ? '+' : ''}
                      {ytd}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* R Shiny Integration Code Note */}
      <div className="bg-slate-900 p-3 rounded-lg border border-purple-900 text-slate-300 font-mono text-[11px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong className="text-purple-300 font-sans">R Execution snippet:</strong>{' '}
            <code className="text-purple-200">table.CalendarReturns(R_xts_returns, digits = 2)</code>
          </span>
        </div>
        <span className="text-[10px] text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800 hidden md:inline">
          R Shiny Matrix Render
        </span>
      </div>
    </div>
  );
};
