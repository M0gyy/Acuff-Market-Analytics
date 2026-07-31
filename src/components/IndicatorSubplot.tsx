import React from 'react';
import { OHLCV, TechnicalIndicator } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { TrendingUp, BarChart2, Activity, Zap, Compass, Shield } from 'lucide-react';

interface IndicatorSubplotProps {
  data: OHLCV[];
  indicator: TechnicalIndicator;
}

export const IndicatorSubplot: React.FC<IndicatorSubplotProps> = ({ data, indicator }) => {
  if (indicator === 'none' || indicator === 'bbands') {
    return null;
  }

  const latest = data[data.length - 1];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
      {/* MACD Subplot */}
      {indicator === 'macd' && (
        <div>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                quantmod :: addMACD(fast = 12, slow = 26, signal = 9)
              </h4>
            </div>
            {latest && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="font-semibold text-purple-700">MACD: {latest.macd}</span>
                <span className="text-amber-600 font-semibold">Signal: {latest.macdSignal}</span>
                <span className={`font-bold ${latest.macdHist! >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Hist: {latest.macdHist}
                </span>
              </div>
            )}
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" hide={true} />
                <YAxis
                  orientation="right"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <ReferenceLine y={0} stroke="#e2e8f0" strokeDasharray="2 2" />
                <Tooltip content={<MacdTooltip />} />

                <Bar
                  dataKey="macdHist"
                  name="Histogram"
                  fill="#10b981"
                  barSize={4}
                />
                <Line
                  type="monotone"
                  dataKey="macd"
                  stroke="#7e22ce"
                  strokeWidth={1.5}
                  dot={false}
                  name="MACD"
                />
                <Line
                  type="monotone"
                  dataKey="macdSignal"
                  stroke="#d97706"
                  strokeWidth={1.5}
                  dot={false}
                  name="Signal"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* RSI Subplot */}
      {indicator === 'rsi' && (
        <div>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                quantmod :: addRSI(n = 14)
              </h4>
            </div>
            {latest && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-purple-600 font-bold">RSI (14): {latest.rsi}</span>
                {latest.rsi! >= 70 && (
                  <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Overbought (≥70)
                  </span>
                )}
                {latest.rsi! <= 30 && (
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Oversold (≤30)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" hide={true} />
                <YAxis
                  domain={[0, 100]}
                  ticks={[30, 50, 70]}
                  orientation="right"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                <ReferenceLine y={50} stroke="#e2e8f0" strokeDasharray="2 2" />

                <Line
                  type="monotone"
                  dataKey="rsi"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                  name="RSI 14"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stochastic Oscillator Subplot */}
      {indicator === 'stoch' && (
        <div>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                TTR :: stoch(nFastK = 14, nSlowD = 3)
              </h4>
            </div>
            {latest && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-purple-700 font-bold">%K: {latest.stochK}</span>
                <span className="text-amber-600 font-bold">%D: {latest.stochD}</span>
              </div>
            )}
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" hide={true} />
                <YAxis domain={[0, 100]} ticks={[20, 80]} orientation="right" tick={{ fontSize: 9, fill: '#64748b' }} />
                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={20} stroke="#10b981" strokeDasharray="3 3" />

                <Line type="monotone" dataKey="stochK" stroke="#7e22ce" strokeWidth={1.5} dot={false} name="%K" />
                <Line type="monotone" dataKey="stochD" stroke="#d97706" strokeWidth={1.5} dot={false} name="%D" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ATR Volatility Subplot */}
      {indicator === 'atr' && (
        <div>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                TTR :: ATR(HLC, n = 14) - Volatility Range
              </h4>
            </div>
            {latest && (
              <div className="text-xs font-mono text-indigo-700 font-bold">
                ATR (14): ${latest.atr}
              </div>
            )}
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" hide={true} />
                <YAxis orientation="right" tick={{ fontSize: 9, fill: '#64748b' }} />
                <Line type="monotone" dataKey="atr" stroke="#4f46e5" strokeWidth={2} dot={false} name="ATR" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Williams %R Subplot */}
      {indicator === 'wpr' && (
        <div>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                TTR :: WPR(HLC, n = 14) - Williams %R Momentum
              </h4>
            </div>
            {latest && (
              <div className="text-xs font-mono text-purple-700 font-bold">
                Williams %R: {latest.wpr}
              </div>
            )}
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" hide={true} />
                <YAxis domain={[-100, 0]} ticks={[-80, -20]} orientation="right" tick={{ fontSize: 9, fill: '#64748b' }} />
                <ReferenceLine y={-20} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={-80} stroke="#10b981" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="wpr" stroke="#6b21a8" strokeWidth={2} dot={false} name="WPR" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Rate of Change (ROC) Subplot */}
      {indicator === 'roc' && (
        <div>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                TTR :: ROC(x, n = 12) - Rate of Change %
              </h4>
            </div>
            {latest && (
              <div className={`text-xs font-mono font-bold ${latest.roc! >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ROC (12): {latest.roc}%
              </div>
            )}
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" hide={true} />
                <YAxis orientation="right" tick={{ fontSize: 9, fill: '#64748b' }} unit="%" />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Line type="monotone" dataKey="roc" stroke="#7e22ce" strokeWidth={2} dot={false} name="ROC" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const MacdTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: OHLCV = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs font-mono shadow-md border border-slate-700">
        <div className="text-slate-400 font-sans mb-1">{data.date}</div>
        <div className="text-purple-300">MACD: {data.macd}</div>
        <div className="text-amber-300">Signal: {data.macdSignal}</div>
        <div className={data.macdHist! >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
          Hist: {data.macdHist}
        </div>
      </div>
    );
  }
  return null;
};
