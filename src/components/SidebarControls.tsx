import React from 'react';
import { TechnicalIndicator, ChartSettings } from '../types';
import { POPULAR_TICKERS } from '../services/financialData';
import { INPUT_CONTROL_TOOLTIPS, INDICATOR_TOOLTIPS } from '../data/indicatorDescriptions';
import { QuantTooltip } from './QuantTooltip';
import { IndicatorExplanationCard } from './IndicatorExplanationCard';
import { Search, Calendar, Sliders, Zap, CheckCircle2, LineChart, Code2 } from 'lucide-react';

interface SidebarControlsProps {
  settings: ChartSettings;
  onUpdateSettings: (newSettings: Partial<ChartSettings>) => void;
  dataFetchCount: number;
  indicatorUpdateCount: number;
  onOpenCodeInspector: () => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  settings,
  onUpdateSettings,
  dataFetchCount,
  indicatorUpdateCount,
  onOpenCodeInspector,
}) => {
  const currentIndicatorInfo = INDICATOR_TOOLTIPS[settings.indicator] || INDICATOR_TOOLTIPS.none;

  return (
    <div className="w-full lg:w-80 bg-slate-50 border-r border-slate-200 p-5 flex flex-col justify-between shrink-0 shadow-sm overflow-y-auto">
      <div className="space-y-5">
        {/* Header */}
        <div className="pb-3 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mt-2 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-700" />
            Control Panel
          </h2>
        </div>

        {/* Stock Ticker Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              Stock Ticker Symbol
            </span>
            <QuantTooltip
              title={INPUT_CONTROL_TOOLTIPS.ticker.title}
              summary={INPUT_CONTROL_TOOLTIPS.ticker.summary}
              details={INPUT_CONTROL_TOOLTIPS.ticker.details}
              rFunction="getSymbols('AAPL', src = 'yahoo', auto.assign = FALSE)"
            />
          </label>
          <div className="relative">
            <input
              type="text"
              value={settings.ticker}
              onChange={(e) => onUpdateSettings({ ticker: e.target.value.toUpperCase() })}
              placeholder="e.g., AAPL, MSFT, NVDA"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent uppercase shadow-2xs"
            />
            <div className="absolute right-2.5 top-2.5 text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              Yahoo
            </div>
          </div>

          {/* Quick Ticker Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {POPULAR_TICKERS.slice(0, 6).map((t) => (
              <button
                key={t.symbol}
                onClick={() => onUpdateSettings({ ticker: t.symbol })}
                className={`text-xs px-2 py-1 rounded-md font-mono cursor-pointer transition ${
                  settings.ticker === t.symbol
                    ? 'bg-purple-700 text-white font-bold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Analysis Period
            </span>
            <QuantTooltip
              title={INPUT_CONTROL_TOOLTIPS.dates.title}
              summary={INPUT_CONTROL_TOOLTIPS.dates.summary}
              details={INPUT_CONTROL_TOOLTIPS.dates.details}
              rFunction="market_data['2023-01-01/2024-01-01']"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase block mb-1">Start Date</span>
              <input
                type="date"
                value={settings.startDate}
                onChange={(e) => onUpdateSettings({ startDate: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase block mb-1">End Date</span>
              <input
                type="date"
                value={settings.endDate}
                onChange={(e) => onUpdateSettings({ endDate: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Chart Style Toggle */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <LineChart className="w-3.5 h-3.5 text-slate-500" />
              Chart Render Type
            </span>
            <QuantTooltip
              title={INPUT_CONTROL_TOOLTIPS.chartType.title}
              summary={INPUT_CONTROL_TOOLTIPS.chartType.summary}
              details={INPUT_CONTROL_TOOLTIPS.chartType.details}
              rFunction="chartSeries(xts_data, type = 'candlesticks', theme = chartTheme('white'))"
            />
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-lg">
            <button
              onClick={() => onUpdateSettings({ chartType: 'candlestick' })}
              className={`text-xs py-1.5 px-2 rounded-md font-medium cursor-pointer transition ${
                settings.chartType === 'candlestick'
                  ? 'bg-white text-purple-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Candlesticks
            </button>
            <button
              onClick={() => onUpdateSettings({ chartType: 'line' })}
              className={`text-xs py-1.5 px-2 rounded-md font-medium cursor-pointer transition ${
                settings.chartType === 'line'
                  ? 'bg-white text-purple-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Close Line
            </button>
          </div>
        </div>

        {/* Technical Indicator Selection */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              Technical Indicator Overlay
            </span>
            <QuantTooltip
              title={currentIndicatorInfo.name}
              summary={currentIndicatorInfo.summary}
              details={currentIndicatorInfo.details}
              rFunction={currentIndicatorInfo.rFunction}
              parameters={currentIndicatorInfo.parameters}
              interpretation={currentIndicatorInfo.interpretation}
            />
          </label>
          <select
            value={settings.indicator}
            onChange={(e) => onUpdateSettings({ indicator: e.target.value as TechnicalIndicator })}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs cursor-pointer"
          >
            <option value="none">None (Price Action Only)</option>
            <option value="macd">quantmod :: addMACD (12, 26, 9)</option>
            <option value="bbands">quantmod :: addBBands (20, 2SD)</option>
            <option value="rsi">quantmod :: addRSI (14-period)</option>
            <option value="ema_cross">quantmod :: addEMA (20 / 50 Crossover)</option>
            <option value="stoch">TTR :: stoch (Stochastic %K / %D)</option>
            <option value="atr">TTR :: ATR (Average True Range Volatility)</option>
            <option value="wpr">TTR :: WPR (Williams %R Momentum)</option>
            <option value="roc">TTR :: ROC (Rate of Change %)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
