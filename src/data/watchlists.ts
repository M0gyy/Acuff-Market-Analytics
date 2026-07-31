import { Watchlist } from '../types';

export const DEFAULT_PRESET_WATCHLISTS: Watchlist[] = [
  {
    id: 'gf-tech-giants',
    name: 'Google Finance Tech & AI',
    description: 'Top technology leaders tracked on Google Finance (Google, Apple, Microsoft, NVIDIA, Amazon, Meta, Tesla)',
    sourceType: 'google_finance',
    lastUpdated: 'Live Sync',
    symbols: [
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 172.80, changePercent: 1.45, source: 'Google Finance' },
      { symbol: 'AAPL', name: 'Apple Inc.', price: 224.50, changePercent: 0.85, source: 'Google Finance' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 428.10, changePercent: -0.32, source: 'Google Finance' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 118.25, changePercent: 3.12, source: 'Google Finance' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 186.40, changePercent: 1.10, source: 'Google Finance' },
      { symbol: 'META', name: 'Meta Platforms Inc.', price: 485.30, changePercent: 2.15, source: 'Google Finance' },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 218.90, changePercent: -1.85, source: 'Google Finance' },
    ],
  },
  {
    id: 'gf-sp500-leaders',
    name: 'Google Finance S&P Leaders',
    description: 'Core benchmark index leaders and sector anchors from Google Finance portfolios',
    sourceType: 'google_finance',
    lastUpdated: 'Live Sync',
    symbols: [
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', price: 545.30, changePercent: 0.65, source: 'Google Finance' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 482.15, changePercent: 1.05, source: 'Google Finance' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 208.75, changePercent: -0.25, source: 'Google Finance' },
      { symbol: 'LLY', name: 'Eli Lilly & Co.', price: 845.20, changePercent: 1.80, source: 'Google Finance' },
      { symbol: 'AVGO', name: 'Broadcom Inc.', price: 158.40, changePercent: 2.40, source: 'Google Finance' },
      { symbol: 'COST', name: 'Costco Wholesale Corp.', price: 832.10, changePercent: 0.45, source: 'Google Finance' },
    ],
  },
  {
    id: 'semiconductors',
    name: 'Semiconductors & AI Hardware',
    description: 'Global chipmakers and AI computing infrastructure stocks',
    sourceType: 'preset',
    lastUpdated: 'Preset',
    symbols: [
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 118.25, changePercent: 3.12, source: 'Market Data' },
      { symbol: 'TSM', name: 'Taiwan Semiconductor', price: 168.90, changePercent: 2.05, source: 'Market Data' },
      { symbol: 'ASML', name: 'ASML Holding NV', price: 920.50, changePercent: -0.80, source: 'Market Data' },
      { symbol: 'AMD', name: 'Advanced Micro Devices', price: 152.30, changePercent: 1.75, source: 'Market Data' },
      { symbol: 'QCOM', name: 'Qualcomm Inc.', price: 178.60, changePercent: 0.90, source: 'Market Data' },
      { symbol: 'MU', name: 'Micron Technology', price: 108.40, changePercent: 2.80, source: 'Market Data' },
    ],
  },
];
