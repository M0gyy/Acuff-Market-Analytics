export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Calculated indicators (quantmod & TTR)
  sma20?: number;
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  rsi?: number;
  ema20?: number;
  ema50?: number;
  stochK?: number;
  stochD?: number;
  atr?: number;
  wpr?: number;
  roc?: number;
  // Performance analytics time-series metrics
  dailyReturn?: number;
  cumReturn?: number;
  benchmarkCumReturn?: number;
  drawdown?: number;
}

export type TechnicalIndicator =
  | 'none'
  | 'macd'
  | 'bbands'
  | 'rsi'
  | 'ema_cross'
  | 'stoch'
  | 'atr'
  | 'wpr'
  | 'roc';

export type ActivePlotTab = 'chart' | 'indicators' | 'performance' | 'drawdown' | 'returns_dist' | 'portfolio' | 'volatility' | 'options' | 'hybrid_arima' | 'ml_pipeline' | 'monte_carlo' | 'factor_model' | 'correlation' | 'backtest' | 'table' | 'media';

export type LayoutType = 'sidebar' | 'navbar' | 'grid' | 'split';

export interface LayoutOption {
  id: LayoutType;
  name: string;
  bslibFunction: string;
  description: string;
}

export interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high52: number;
  low52: number;
  volume: number;
}

export interface QuantitativeMetrics {
  totalReturn: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  var95: number;
  calmarRatio: number;
  beta: number;
  alpha: number;
}

export interface ChartSettings {
  ticker: string;
  startDate: string;
  endDate: string;
  indicator: TechnicalIndicator;
  chartType: 'candlestick' | 'line';
}

export interface MediaSource {
  title: string;
  url: string;
}

export interface MediaAnalysisResult {
  ticker: string;
  analysis: string;
  sources: MediaSource[];
  timestamp: string;
}

export interface WatchlistItem {
  symbol: string;
  name?: string;
  price?: number;
  changePercent?: number;
  source?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  description: string;
  sourceType: 'google_finance' | 'yahoo_finance' | 'tradingview' | 'custom_csv' | 'preset';
  symbols: WatchlistItem[];
  lastUpdated: string;
}


