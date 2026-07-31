import React, { useState } from 'react';
import { OHLCV, ChartSettings } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Activity, RefreshCw, Layers } from 'lucide-react';

interface FinancialChartProps {
  data: OHLCV[];
  settings: ChartSettings;
  isLoading: boolean;
  onRefresh: () => void;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  data,
  settings,
  isLoading,
  onRefresh,
}) => {
  const [hoveredData, setHoveredData] = useState<OHLCV | null>(null);

  if (isLoading) {
    return (
      <div className="h-[520px] w-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-2xs p-8">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <span className="text-sm font-semibold text-slate-700">
          Querying quantmod::getSymbols("{settings.ticker}", src = "yahoo")...
        </span>
        <span className="text-xs text-slate-400 mt-1">
          Indexing time-series into xts structure
        </span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[520px] w-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-2xs p-8 text-center">
        <Activity className="w-10 h-10 text-slate-300 mb-2" />
        <p className="text-sm font-semibold text-slate-600">No time-series market data available.</p>
        <p className="text-xs text-slate-400 mt-1">Please enter a valid ticker symbol (e.g., AAPL, MSFT, NVDA).</p>
      </div>
    );
  }

  // Calculate Y-Axis bounds with padding
  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));
  const pricePadding = (maxPrice - minPrice) * 0.08;
  const yDomainMin = Math.max(0, Math.floor(minPrice - pricePadding));
  const yDomainMax = Math.ceil(maxPrice + pricePadding);

  const activePoint = hoveredData || data[data.length - 1];
  const isUpDay = activePoint ? activePoint.close >= activePoint.open : true;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Card Header (Matching bslib::card_header) */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{settings.ticker}</span>
              <span className="text-xs font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                {settings.startDate} to {settings.endDate}
              </span>
            </h3>

          </div>
        </div>

        {/* Live Candle Stat Bar */}
        {activePoint && (
          <div className="flex items-center gap-4 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <div>
              <span className="text-slate-400 mr-1">O</span>
              <span className="font-semibold text-slate-700">${activePoint.open.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">H</span>
              <span className="font-semibold text-slate-700">${activePoint.high.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">L</span>
              <span className="font-semibold text-slate-700">${activePoint.low.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">C</span>
              <span className={`font-bold ${isUpDay ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${activePoint.close.toFixed(2)}
              </span>
            </div>
            <div className="pl-2 border-l border-slate-200 text-slate-500">
              Vol: {(activePoint.volume / 1000000).toFixed(1)}M
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {settings.indicator !== 'none' && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-600" />
              {settings.indicator.toUpperCase()}
            </span>
          )}
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition cursor-pointer"
            title="Reload Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Chart Area */}
      <div className="p-4 h-[440px] w-full relative bg-white">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            onMouseMove={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                setHoveredData(state.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoveredData(null)}
          >
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b21a8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6b21a8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              minTickGap={30}
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              orientation="right"
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip content={<CustomTooltip indicator={settings.indicator} />} />

            {/* Bollinger Bands corridor overlay if enabled */}
            {settings.indicator === 'bbands' && (
              <>
                <Area
                  type="monotone"
                  dataKey="bbUpper"
                  stroke="#3b82f6"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  fill="none"
                  name="BB Upper"
                />
                <Line
                  type="monotone"
                  dataKey="bbLower"
                  stroke="#3b82f6"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                  name="BB Lower"
                />
                <Line
                  type="monotone"
                  dataKey="bbMiddle"
                  stroke="#1d4ed8"
                  strokeWidth={1.5}
                  dot={false}
                  name="BB Middle (SMA20)"
                />
              </>
            )}

            {/* EMA 20 & EMA 50 Moving Average Crossover System */}
            {settings.indicator === 'ema_cross' && (
              <>
                <Line
                  type="monotone"
                  dataKey="ema20"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="EMA 20 (Fast)"
                />
                <Line
                  type="monotone"
                  dataKey="ema50"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={false}
                  name="EMA 50 (Slow)"
                />
              </>
            )}

            {/* Price line or Candlestick representation */}
            {settings.chartType === 'line' ? (
              <Area
                type="monotone"
                dataKey="close"
                stroke="#6b21a8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorClose)"
                name="Close Price"
              />
            ) : (
              /* Custom Candlestick rendering */
              <Line
                type="monotone"
                dataKey="close"
                stroke="#7e22ce"
                strokeWidth={2}
                dot={<CandlestickDot />}
                name="Price Action"
              />
            )}

            {/* Volume sub-bars in background */}
            <Bar
              dataKey="volume"
              yAxisId="volume"
              fill="#cbd5e1"
              opacity={0.35}
              barSize={4}
            />
            <YAxis
              yAxisId="volume"
              orientation="left"
              domain={[0, 'dataMax * 4']}
              hide={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Custom Candlestick rendering component for Recharts
const CandlestickDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload || cx === undefined || cy === undefined) return null;

  const isGreen = payload.close >= payload.open;
  const color = isGreen ? '#10b981' : '#ef4444';

  const highLowRange = payload.high - payload.low;
  if (highLowRange === 0) return null;

  const scale = 30 / highLowRange;
  const wickTop = cy - (payload.high - payload.close) * scale;
  const wickBottom = cy + (payload.close - payload.low) * scale;
  const bodyTop = cy - Math.abs(payload.close - payload.open) * (scale / 2);
  const bodyHeight = Math.max(3, Math.abs(payload.close - payload.open) * scale);

  return (
    <g>
      <line
        x1={cx}
        y1={wickTop}
        x2={cx}
        y2={wickBottom}
        stroke={color}
        strokeWidth={1.2}
      />
      <rect
        x={cx - 3}
        y={bodyTop}
        width={6}
        height={bodyHeight}
        fill={color}
        stroke={color}
        rx={1}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload, indicator }: any) => {
  if (active && payload && payload.length) {
    const data: OHLCV = payload[0].payload;
    const isUp = data.close >= data.open;

    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl text-xs font-mono space-y-1.5 border border-slate-700 min-w-[180px]">
        <div className="text-slate-400 border-b border-slate-800 pb-1 font-sans flex justify-between">
          <span>{data.date}</span>
          <span className={isUp ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {isUp ? '+BULL' : '-BEAR'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div><span className="text-slate-400">Open:</span> ${data.open}</div>
          <div><span className="text-slate-400">Close:</span> ${data.close}</div>
          <div><span className="text-slate-400">High:</span> ${data.high}</div>
          <div><span className="text-slate-400">Low:</span> ${data.low}</div>
        </div>

        {indicator === 'bbands' && data.bbMiddle && (
          <div className="pt-1 border-t border-slate-800 text-[11px] text-blue-300">
            <div>Upper BB: ${data.bbUpper}</div>
            <div>Mid (SMA20): ${data.bbMiddle}</div>
            <div>Lower BB: ${data.bbLower}</div>
          </div>
        )}

        {indicator === 'macd' && data.macd !== undefined && (
          <div className="pt-1 border-t border-slate-800 text-[11px]">
            <div className="text-teal-300">MACD: {data.macd}</div>
            <div className="text-amber-300">Signal: {data.macdSignal}</div>
            <div className={data.macdHist! >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              Hist: {data.macdHist}
            </div>
          </div>
        )}

        {indicator === 'rsi' && data.rsi !== undefined && (
          <div className="pt-1 border-t border-slate-800 text-[11px] text-purple-300">
            RSI (14): {data.rsi}
            {data.rsi >= 70 && <span className="text-rose-400 ml-1 font-bold">(Overbought)</span>}
            {data.rsi <= 30 && <span className="text-emerald-400 ml-1 font-bold">(Oversold)</span>}
          </div>
        )}
      </div>
    );
  }
  return null;
};
