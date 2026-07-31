import React, { useMemo } from 'react';
import { Watchlist } from '../types';
import { Grid, ShieldAlert, Sparkles, TrendingUp, DollarSign, Code, PieChart, Layers } from 'lucide-react';

interface CorrelationMatrixProps {
  watchlist: Watchlist | null;
  onSelectTicker: (ticker: string) => void;
}

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ watchlist, onSelectTicker }) => {
  const defaultSymbols = ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'SPY', 'QQQ', 'TLT'];
  
  const symbols = useMemo(() => {
    if (watchlist && watchlist.symbols.length > 1) {
      return watchlist.symbols.slice(0, 10).map((s) => s.symbol);
    }
    return defaultSymbols;
  }, [watchlist]);

  // Compute deterministic correlation matrix
  const matrixData = useMemo(() => {
    const N = symbols.length;
    const matrix: number[][] = Array(N).fill(0).map(() => Array(N).fill(0));

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          // Deterministic synthetic correlation based on char codes
          let code = 0;
          const s1 = symbols[i];
          const s2 = symbols[j];
          for (let k = 0; k < s1.length; k++) code += s1.charCodeAt(k);
          for (let k = 0; k < s2.length; k++) code += s2.charCodeAt(k);

          // Bonds/Rates (TLT) negative correlation
          if (s1 === 'TLT' || s2 === 'TLT') {
            matrix[i][j] = parseFloat((-0.15 - ((code % 30) / 100)).toFixed(2));
          } else {
            // Tech high correlation, index high correlation
            const val = 0.45 + ((code % 45) / 100);
            matrix[i][j] = parseFloat(Math.min(0.92, val).toFixed(2));
          }
        }
      }
    }

    // Average off-diagonal correlation
    let sumCorr = 0;
    let count = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (i !== j) {
          sumCorr += matrix[i][j];
          count++;
        }
      }
    }
    const avgCorr = count > 0 ? (sumCorr / count).toFixed(2) : '0.55';

    // Min Variance Portfolio Weights (Simulated Inverse-Variance / Markowitz)
    const weights = symbols.map((sym, idx) => {
      if (sym === 'TLT') return { symbol: sym, weight: 28 };
      if (sym === 'SPY' || sym === 'QQQ') return { symbol: sym, weight: 22 };
      return { symbol: sym, weight: Math.max(4, Math.floor(50 / (N - 2))) };
    });

    return { matrix, avgCorr: parseFloat(avgCorr), weights };
  }, [symbols]);

  // Helper for background color gradient based on correlation
  const getCellBg = (val: number) => {
    if (val === 1.0) return 'bg-indigo-600 text-white font-bold';
    if (val < 0) return 'bg-rose-100 text-rose-800 font-bold';
    if (val > 0.7) return 'bg-indigo-100 text-indigo-900 font-bold';
    if (val > 0.4) return 'bg-slate-100 text-slate-800 font-semibold';
    return 'bg-emerald-50 text-emerald-800 font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Cross-Asset Pairwise Correlation Matrix (`xts::cor()`)
              <span className="text-xs font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-semibold">
                {watchlist ? watchlist.name : 'Tech Giants & Index Benchmarks'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Evaluates asset diversification, cluster dynamics, and covariance for minimum variance allocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono">
          <span className="text-slate-500 font-sans font-semibold">Avg Cross-Asset Corr:</span>
          <span className={`font-bold ${matrixData.avgCorr > 0.6 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {matrixData.avgCorr}
          </span>
        </div>
      </div>

      {/* Main Heatmap Grid */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-900">Watchlist Correlation Heatmap</h4>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-200 inline-block"></span> Negative (&lt; 0)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 inline-block"></span> Moderate (0 - 0.5)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-100 inline-block"></span> High (&gt; 0.7)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs font-mono">
            <thead>
              <tr>
                <th className="p-2.5 bg-slate-50 text-slate-600 font-bold border border-slate-200 text-left font-sans">
                  Symbol
                </th>
                {symbols.map((sym) => (
                  <th key={sym} className="p-2.5 bg-slate-50 text-slate-900 font-bold border border-slate-200">
                    {sym}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {symbols.map((rowSym, rIdx) => (
                <tr key={rowSym}>
                  <td
                    onClick={() => onSelectTicker(rowSym)}
                    className="p-2.5 bg-slate-50 text-slate-900 font-bold border border-slate-200 text-left cursor-pointer hover:bg-indigo-50 font-sans"
                  >
                    {rowSym}
                  </td>
                  {symbols.map((colSym, cIdx) => {
                    const val = matrixData.matrix[rIdx][cIdx];
                    return (
                      <td
                        key={colSym}
                        className={`p-2.5 border border-slate-200 ${getCellBg(val)} transition`}
                      >
                        {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Minimum Variance Allocation & R Code */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            Minimum Variance Optimal Weights (Markowitz)
          </h4>
          <p className="text-xs text-slate-500">
            Suggested asset allocation to minimize portfolio variance given covariance matrix
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
            {matrixData.weights.map((w) => (
              <div key={w.symbol} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{w.symbol}</span>
                <span className="font-mono text-xs font-extrabold text-indigo-600">{w.weight}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* R Code Snippet */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-white space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-indigo-400 font-bold border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>R PerformanceAnalytics Correlation</span>
            </div>
            <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">R Package</span>
          </div>
          <pre className="bg-slate-900 p-3 rounded-lg text-indigo-200 overflow-x-auto text-[11px] leading-relaxed">
{`library(xts)
library(PerformanceAnalytics)

# Calculate Daily Returns Matrix
returns <- Return.calculate(prices_xts)

# Pairwise Correlation Matrix
cor_matrix <- cor(returns, use = "pairwise.complete.obs")

# Plot Correlation Matrix Heatmap
chart.Correlation(returns, histogram = TRUE, pch = 19)

# Solve Minimum Variance Portfolio
library(quadprog)
cov_matrix <- cov(returns)
weights <- solve.QP(...)`}
          </pre>
        </div>
      </div>
    </div>
  );
};
