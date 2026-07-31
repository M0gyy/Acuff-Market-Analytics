export interface TooltipInfo {
  name: string;
  rFunction: string;
  package: string;
  category: string;
  summary: string;
  details: string;
  parameters: string;
  interpretation: string;
}
export const INDICATOR_TOOLTIPS: Record<string, TooltipInfo> = {
  none: {
    name: 'Price Action Only',
    rFunction: 'plot(Cl(xts_data))',
    package: 'quantmod',
    category: 'Price Charting',
    summary: 'Clean candlestick or line chart without indicator overlays.',
    details: 'Displays raw High, Low, Open, Close (OHLC) price bars and volume histogram.',
    parameters: 'None',
    interpretation: 'Use for pure price structure analysis, support/resistance levels, and chart patterns.',
  },
  macd: {
    name: 'Moving Average Convergence Divergence',
    rFunction: 'addMACD(fast = 12, slow = 26, signal = 9)',
    package: 'quantmod / TTR',
    category: 'Momentum & Trend',
    summary: 'Trend-following momentum indicator that shows the relationship between two exponential moving averages.',
    details: 'Subtracts the 26-period EMA from the 12-period EMA to create the MACD line. A 9-period EMA of the MACD is plotted as a signal line.',
    parameters: 'Fast EMA = 12, Slow EMA = 26, Signal EMA = 9',
    interpretation: 'Bullish Crossover: MACD line crosses above Signal line. Bearish Crossover: MACD line crosses below Signal line. Histogram height represents divergence.',
  },
  bbands: {
    name: 'Bollinger Bands',
    rFunction: 'addBBands(n = 20, sd = 2)',
    package: 'quantmod / TTR',
    category: 'Volatility Bands',
    summary: 'Volatility bands placed above and below a central moving average.',
    details: 'Consists of an N-period Simple Moving Average (SMA) flanked by upper and lower bands set 2 standard deviations away.',
    parameters: 'SMA Period = 20, Standard Deviations = 2.0',
    interpretation: 'Bands widen during high volatility and contract during low volatility (squeeze). Touch of upper band indicates overbought price; lower band indicates oversold.',
  },
  rsi: {
    name: 'Relative Strength Index',
    rFunction: 'addRSI(n = 14)',
    package: 'quantmod / TTR',
    category: 'Momentum Oscillator',
    summary: 'Measures the speed and change of price movements on a 0 to 100 scale.',
    details: 'Calculates the ratio of average upward price changes to average downward price changes over a 14-day lookback window.',
    parameters: 'Lookback Period = 14 days',
    interpretation: 'RSI ≥ 70: Overbought territory (potential pullback). RSI ≤ 30: Oversold territory (potential reversal or rally). RSI = 50 indicates neutral equilibrium.',
  },
  ema_cross: {
    name: 'Exponential Moving Average Crossover',
    rFunction: 'addEMA(n = 20); addEMA(n = 50)',
    package: 'quantmod / TTR',
    category: 'Trend Following',
    summary: 'Dual moving average system highlighting short-term vs medium-term trend direction.',
    details: 'Plots a 20-day fast EMA (green) alongside a 50-day slow EMA (red). EMAs give greater weight to recent prices.',
    parameters: 'Fast EMA = 20, Slow EMA = 50',
    interpretation: 'Golden Cross (20 EMA > 50 EMA): Strong bullish momentum. Death Cross (20 EMA < 50 EMA): Bearish downtrend signal.',
  },
  stoch: {
    name: 'Stochastic Oscillator',
    rFunction: 'stoch(HLC, nFastK = 14, nSlowD = 3)',
    package: 'TTR',
    category: 'Momentum Oscillator',
    summary: 'Compares a specific closing price of a security to its price range over a given period of time.',
    details: 'Calculates %K as position within 14-day High-Low range, smoothed by a 3-period %D moving average line.',
    parameters: '%K Lookback = 14, %D Moving Average = 3',
    interpretation: 'Values above 80 signal overbought conditions; values below 20 signal oversold conditions. Crossovers between %K and %D confirm timing.',
  },
  atr: {
    name: 'Average True Range',
    rFunction: 'ATR(HLC, n = 14)',
    package: 'TTR',
    category: 'Volatility Measure',
    summary: 'Technical analysis indicator that measures market volatility by decomposing the entire range of an asset.',
    details: 'Calculates the greatest of: Current High minus Low, Current High minus Previous Close, or Current Low minus Previous Close over 14 periods.',
    parameters: 'Averaging Period = 14 days',
    interpretation: 'Rising ATR indicates expanding volatility and potential breakout. Falling ATR indicates contracting price range and consolidation.',
  },
  wpr: {
    name: 'Williams %R',
    rFunction: 'addWPR(n = 14)',
    package: 'quantmod / TTR',
    category: 'Momentum Oscillator',
    summary: 'Bound momentum oscillator ranging from 0 to -100 measuring overbought and oversold levels.',
    details: 'Calculates relative position of closing price to highest high of the last 14 days.',
    parameters: 'Lookback Period = 14 days',
    interpretation: 'Readings between 0 and -20 indicate overbought state. Readings between -80 and -100 indicate oversold state.',
  },
  roc: {
    name: 'Rate of Change',
    rFunction: 'addROC(n = 12)',
    package: 'quantmod / TTR',
    category: 'Momentum Rate',
    summary: 'Pure momentum oscillator that measures the percentage change in price between periods.',
    details: 'Compares the current price with the price N periods ago: ((Close - Close_N) / Close_N) * 100.',
    parameters: 'Lookback Window = 12 periods',
    interpretation: 'Positive ROC above 0 indicates upward momentum acceleration. Negative ROC below 0 indicates downward price acceleration.',
  },
};

export const INPUT_CONTROL_TOOLTIPS = {
  ticker: {
    title: 'Stock Ticker Symbol (quantmod :: getSymbols)',
    summary: 'Queries real-time and historical daily time-series matrix from Yahoo Finance.',
    details: 'In R, `getSymbols("AAPL", src = "yahoo", auto.assign = FALSE)` converts downloaded financial market data directly into an extensible time-series (`xts`) object with Open, High, Low, Close, and Volume columns.',
  },
  dates: {
    title: 'Analysis Period (xts Index Subsetting)',
    summary: 'Defines the start and end boundary dates for the time-series window.',
    details: '`xts` allows matrix indexing by date strings, e.g. `market_data["2023-01-01/2024-01-01"]`. Adjusting dates recalculates period returns, volatility, Sharpe ratio, and drawdowns.',
  },
  chartType: {
    title: 'Chart Render Engine (quantmod :: chartSeries)',
    summary: 'Selects between Candlesticks and Close Line rendering.',
    details: 'Candlesticks display OHLC bodies highlighting daily price movement. Close Line plots a continuous line graph of closing prices.',
  },
  layout: {
    title: 'bslib Layout Archetype',
    summary: 'Applies R Shiny Bootstrap 5 layouts (`page_sidebar`, `page_navbar`, `page_fillable`, `page_fluid`).',
    details: 'Switching layouts restructures UI cards dynamically, matching official `bslib` responsive design patterns.',
  },
};
