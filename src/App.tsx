import React, { useState, useEffect, useMemo } from 'react';
import { ChartSettings, OHLCV, LayoutType, ActivePlotTab, Watchlist } from './types';
import { generateMarketData, calculateQuantitativeMetrics } from './services/financialData';
import { DEFAULT_PRESET_WATCHLISTS } from './data/watchlists';
import { SidebarControls } from './components/SidebarControls';
import { FinancialChart } from './components/FinancialChart';
import { IndicatorSubplot } from './components/IndicatorSubplot';
import { MetricsCards } from './components/MetricsCards';
import { PerformanceCharts } from './components/PerformanceCharts';
import { MediaAnalysisPanel } from './components/MediaAnalysisPanel';
import { PortfolioSimulator } from './components/PortfolioSimulator';
import { MLPipelineInspector } from './components/MLPipelineInspector';
import { VolatilityHeatmap } from './components/VolatilityHeatmap';
import { OptionAnalyticsPanel } from './components/OptionAnalyticsPanel';
import { HybridARIMASentiment } from './components/HybridARIMASentiment';
import { DataTable } from './components/DataTable';
import { MonteCarloSimulation } from './components/MonteCarloSimulation';
import { FactorRiskModel } from './components/FactorRiskModel';
import { CorrelationMatrix } from './components/CorrelationMatrix';
import { StrategyBacktester } from './components/StrategyBacktester';
import { LayoutSelector } from './components/LayoutSelector';
import { RCodeInspector } from './components/RCodeInspector';
import { QuantTooltip } from './components/QuantTooltip';
import { IndicatorExplanationCard } from './components/IndicatorExplanationCard';
import { WatchlistBar } from './components/WatchlistBar';
import { WatchlistImportModal } from './components/WatchlistImportModal';
import { INPUT_CONTROL_TOOLTIPS, INDICATOR_TOOLTIPS } from './data/indicatorDescriptions';
import {
  Activity,
  Code,
  LineChart,
  BarChart2,
  Table as TableIcon,
  Sliders,
  Sparkles,
  Zap,
  Globe,
  TrendingDown,
  Percent,
  Award,
  PieChart,
  BrainCircuit,
  Flame,
  Calculator,
  Brain,
  Dices,
  Layers,
  Grid,
  PlaySquare,
} from 'lucide-react';

export default function App() {
  const today = new Date().toISOString().split('T')[0];
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [layout, setLayout] = useState<LayoutType>('sidebar');
  const [activePlotTab, setActivePlotTab] = useState<ActivePlotTab>('chart');

  const [settings, setSettings] = useState<ChartSettings>({
    ticker: 'AAPL',
    startDate: oneYearAgo,
    endDate: today,
    indicator: 'none',
    chartType: 'candlestick',
  });

  const [rawMarketData, setRawMarketData] = useState<OHLCV[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataFetchCount, setDataFetchCount] = useState<number>(0);
  const [indicatorUpdateCount, setIndicatorUpdateCount] = useState<number>(0);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Watchlists state with localStorage persistence
  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => {
    const saved = localStorage.getItem('quant_watchlists');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to presets on parse error
      }
    }
    return DEFAULT_PRESET_WATCHLISTS;
  });

  const [activeWatchlistId, setActiveWatchlistId] = useState<string>(
    watchlists[0]?.id || 'gf-tech-giants'
  );

  useEffect(() => {
    localStorage.setItem('quant_watchlists', JSON.stringify(watchlists));
  }, [watchlists]);

  const handleImportWatchlist = (newWatchlist: Watchlist) => {
    setWatchlists((prev) => [newWatchlist, ...prev]);
    setActiveWatchlistId(newWatchlist.id);
    if (newWatchlist.symbols.length > 0) {
      setSettings((prev) => ({ ...prev, ticker: newWatchlist.symbols[0].symbol }));
    }
  };

  const handleAddSymbolToActiveWatchlist = (symbol: string) => {
    const cleanSymbol = symbol.toUpperCase();
    setWatchlists((prev) =>
      prev.map((wl) => {
        if (wl.id === activeWatchlistId) {
          if (wl.symbols.some((s) => s.symbol === cleanSymbol)) return wl;
          return {
            ...wl,
            symbols: [
              ...wl.symbols,
              {
                symbol: cleanSymbol,
                price: Number((100 + Math.random() * 200).toFixed(2)),
                changePercent: Number(((Math.random() - 0.4) * 3).toFixed(2)),
                source: 'User Added',
              },
            ],
          };
        }
        return wl;
      })
    );
  };

  const handleRemoveSymbolFromActiveWatchlist = (symbol: string) => {
    setWatchlists((prev) =>
      prev.map((wl) => {
        if (wl.id === activeWatchlistId) {
          return {
            ...wl,
            symbols: wl.symbols.filter((s) => s.symbol !== symbol),
          };
        }
        return wl;
      })
    );
  };

  // Compute quantitative performance metrics
  const quantMetrics = useMemo(() => {
    return calculateQuantitativeMetrics(rawMarketData);
  }, [rawMarketData]);

  // Dynamic R Shiny Code snippet reflecting chosen bslib layout & R packages
  const appRCode = useMemo(() => {
    let uiDefinition = '';

    if (layout === 'sidebar') {
      uiDefinition = `ui <- page_sidebar(
  title = "Quantitative Market Explorer",
  theme = bs_theme(version = 5, bootswatch = "vapor", primary = "#581c87"),
  
  sidebar = sidebar(
    title = "Control Panel",
    width = 320,
    textInput("ticker", "Stock Ticker Symbol", value = "${settings.ticker}"),
    dateRangeInput("dates", "Analysis Period", start = "${settings.startDate}", end = "${settings.endDate}"),
    hr(),
    selectInput("indicator", "Technical Indicator Overlay", 
      choices = c(
        "None" = "none", 
        "MACD" = "macd", 
        "Bollinger Bands" = "bbands", 
        "RSI" = "rsi",
        "EMA Crossover" = "ema_cross",
        "Stochastic %K/%D" = "stoch",
        "ATR Volatility" = "atr",
        "Williams %R" = "wpr",
        "ROC Rate of Change" = "roc"
      ),
      selected = "${settings.indicator}"
    )
  ),
  
  navset_card_tab(
    nav_panel("Price Action", plotOutput("chart", height = "520px")),
    nav_panel("PerformanceAnalytics", plotOutput("cum_returns_plot", height = "520px")),
    nav_panel("Drawdown Analysis", plotOutput("drawdown_plot", height = "520px")),
    nav_panel("Google News Media", uiOutput("media_analysis_ui"))
  )
)`;
    } else if (layout === 'navbar') {
      uiDefinition = `ui <- page_navbar(
  title = "Quantitative Market Explorer",
  theme = bs_theme(version = 5, bootswatch = "vapor", primary = "#581c87"),
  
  nav_panel("Price Action", icon = icon("chart-line"), plotOutput("chart", height = "500px")),
  nav_panel("Performance & Risk", icon = icon("chart-area"), plotOutput("cum_returns_plot", height = "500px")),
  nav_panel("Drawdown Analytics", icon = icon("water"), plotOutput("drawdown_plot", height = "500px")),
  nav_panel("Google Media News", icon = icon("newspaper"), uiOutput("media_analysis_ui")),
  nav_panel("xts Data Table", icon = icon("table"), DT::dataTableOutput("data_table"))
)`;
    } else if (layout === 'grid') {
      uiDefinition = `ui <- page_fillable(
  title = "Quantitative Market Explorer (Bento Grid)",
  theme = bs_theme(version = 5, bootswatch = "vapor", primary = "#581c87"),
  
  layout_columns(
    col_widths = c(8, 4),
    
    card(card_header("Primary Time-Series Chart"), plotOutput("chart", height = "480px")),
    
    layout_column_wrap(
      width = 1,
      card(card_header("Performance Metrics"), uiOutput("metrics_ui")),
      card(card_header("Google Media Grounding"), uiOutput("media_analysis_ui"))
    )
  )
)`;
    } else {
      uiDefinition = `ui <- page_fluid(
  title = "Quantitative Market Explorer (Split Screen)",
  theme = bs_theme(version = 5, bootswatch = "vapor", primary = "#581c87"),
  
  layout_columns(
    col_widths = c(6, 6),
    card(card_header("Price Chart"), plotOutput("chart", height = "450px")),
    card(card_header("Performance & Risk Analytics"), plotOutput("cum_returns_plot", height = "450px"))
  )
)`;
    }

    return `# ==============================================================================
# Quantitative Market Explorer - R Shiny Dashboard
# Recommended R Packages: quantmod, xts, TTR, PerformanceAnalytics, bslib, DT
# Layout Paradigm: ${layout.toUpperCase()} (${layout === 'sidebar' ? 'bslib::page_sidebar' : layout === 'navbar' ? 'bslib::page_navbar' : layout === 'grid' ? 'bslib::page_fillable' : 'bslib::page_fluid'})
# ==============================================================================

library(shiny)
library(bslib)
library(quantmod)
library(xts)
library(TTR)
library(PerformanceAnalytics)
library(DT)

# ------------------------------------------------------------------------------
# 1. UI Architecture
# ------------------------------------------------------------------------------
${uiDefinition}

# ------------------------------------------------------------------------------
# 2. Server & Reactive Engine
# ------------------------------------------------------------------------------
server <- function(input, output, session) {

  # Data Engine Reactive Stream (Isolated from indicator updates)
  market_data <- reactive({
    req(input$ticker, input$dates[1], input$dates[2])
    symbol <- toupper(trimws(input$ticker))
    
    getSymbols(
      Symbols = symbol,
      from = input$dates[1],
      to = input$dates[2],
      src = "yahoo",
      auto.assign = FALSE
    )
  })

  # Cumulative Returns Plot (PerformanceAnalytics)
  output$cum_returns_plot <- renderPlot({
    df_xts <- market_data()
    req(df_xts)
    returns <- Return.calculate(Cl(df_xts))
    chart.CumReturns(returns, main = paste("Cumulative Growth -", input$ticker), wealth.index = TRUE)
  })

  # Drawdown Plot (PerformanceAnalytics)
  output$drawdown_plot <- renderPlot({
    df_xts <- market_data()
    req(df_xts)
    returns <- Return.calculate(Cl(df_xts))
    chart.Drawdown(returns, main = paste("Underwater Drawdown -", input$ticker))
  })
}

shinyApp(ui = ui, server = server)`;
  }, [layout, settings]);

  // Reactive Effect for Market Data Fetching
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const data = generateMarketData(settings.ticker, settings.startDate, settings.endDate);
      setRawMarketData(data);
      setIsLoading(false);
      setDataFetchCount((prev) => prev + 1);
    }, 200);

    return () => clearTimeout(timer);
  }, [settings.ticker, settings.startDate, settings.endDate]);

  // Indicator changes update counter
  useEffect(() => {
    setIndicatorUpdateCount((prev) => prev + 1);
  }, [settings.indicator, settings.chartType]);

  const handleUpdateSettings = (newSettings: Partial<ChartSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleRefreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const data = generateMarketData(settings.ticker, settings.startDate, settings.endDate);
      setRawMarketData(data);
      setIsLoading(false);
      setDataFetchCount((prev) => prev + 1);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col text-slate-800">
      {/* Navbar Header with Integrated Layout Selector */}
      <header className="bg-slate-950 text-white border-b border-purple-900/60 px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-900/40 border border-purple-700/60 shadow-inner">
            <Activity className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white">
                Acuff Market Analytics
              </h1>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden md:block">
              Institutional quantitative analytics engine
            </p>
          </div>
        </div>

        {/* Integrated Layout Switcher */}
        <div className="flex items-center gap-2">
          <LayoutSelector currentLayout={layout} onSelectLayout={setLayout} />
        </div>

        {/* Global Benchmark Badges & Action Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="hidden xl:flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold">S&P 500:</span>
              <span className="text-emerald-400 font-bold">5,412.30 (+0.42%)</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold">NASDAQ:</span>
              <span className="text-emerald-400 font-bold">17,025.10 (+0.68%)</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold">DOW:</span>
              <span className="text-emerald-400 font-bold">39,127.14 (+0.25%)</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold">US10Y:</span>
              <span className="text-indigo-300 font-bold">4.18%</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold">VIX:</span>
              <span className="text-amber-400 font-bold">14.22</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold">BTC:</span>
              <span className="text-emerald-400 font-bold">$64,820</span>
            </div>
          </div>

          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="flex items-center gap-1.5 bg-purple-900/70 hover:bg-purple-800 text-purple-100 border border-purple-600/70 text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <Code className="w-3.5 h-3.5 text-purple-300" />
            <span>R Code</span>
          </button>
        </div>
      </header>

      {/* Google Finance Watchlist & Custom Watchlists Bar */}
      <WatchlistBar
        watchlists={watchlists}
        activeWatchlistId={activeWatchlistId}
        selectedTicker={settings.ticker}
        onSelectWatchlist={setActiveWatchlistId}
        onSelectTicker={(ticker) => handleUpdateSettings({ ticker })}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onAddSymbolToActiveWatchlist={handleAddSymbolToActiveWatchlist}
        onRemoveSymbolFromActiveWatchlist={handleRemoveSymbolFromActiveWatchlist}
      />

      {/* Top Horizontal Quick Control Toolbar for Grid, Split & Navbar modes */}
      {layout !== 'sidebar' && (
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <label className="text-slate-500 uppercase font-bold text-[10px] tracking-wider flex items-center">
                Ticker:
                <QuantTooltip
                  title={INPUT_CONTROL_TOOLTIPS.ticker.title}
                  summary={INPUT_CONTROL_TOOLTIPS.ticker.summary}
                  details={INPUT_CONTROL_TOOLTIPS.ticker.details}
                  rFunction="getSymbols('AAPL', src = 'yahoo', auto.assign = FALSE)"
                />
              </label>
              <input
                type="text"
                value={settings.ticker}
                onChange={(e) => handleUpdateSettings({ ticker: e.target.value.toUpperCase() })}
                className="w-24 px-2 py-1 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 uppercase"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-slate-500 uppercase font-bold text-[10px] tracking-wider flex items-center">
                Dates:
                <QuantTooltip
                  title={INPUT_CONTROL_TOOLTIPS.dates.title}
                  summary={INPUT_CONTROL_TOOLTIPS.dates.summary}
                  details={INPUT_CONTROL_TOOLTIPS.dates.details}
                  rFunction="market_data['2023-01-01/2024-01-01']"
                />
              </label>
              <input
                type="date"
                value={settings.startDate}
                onChange={(e) => handleUpdateSettings({ startDate: e.target.value })}
                className="px-2 py-1 border border-slate-300 rounded text-xs font-mono"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={settings.endDate}
                onChange={(e) => handleUpdateSettings({ endDate: e.target.value })}
                className="px-2 py-1 border border-slate-300 rounded text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-500 uppercase font-bold text-[10px] tracking-wider flex items-center">
                Indicator:
                <QuantTooltip
                  title={INDICATOR_TOOLTIPS[settings.indicator]?.name || 'Indicator Overlay'}
                  summary={INDICATOR_TOOLTIPS[settings.indicator]?.summary || ''}
                  details={INDICATOR_TOOLTIPS[settings.indicator]?.details}
                  rFunction={INDICATOR_TOOLTIPS[settings.indicator]?.rFunction}
                  parameters={INDICATOR_TOOLTIPS[settings.indicator]?.parameters}
                  interpretation={INDICATOR_TOOLTIPS[settings.indicator]?.interpretation}
                />
              </label>
              <select
                value={settings.indicator}
                onChange={(e) =>
                  handleUpdateSettings({ indicator: e.target.value as any })
                }
                className="px-2 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-800 bg-slate-50 cursor-pointer"
              >
                <option value="none">None (Price Only)</option>
                <option value="macd">quantmod :: MACD</option>
                <option value="bbands">quantmod :: BBands</option>
                <option value="rsi">quantmod :: RSI</option>
                <option value="ema_cross">quantmod :: EMA 20/50</option>
                <option value="stoch">TTR :: Stochastic %K/%D</option>
                <option value="atr">TTR :: ATR Volatility</option>
                <option value="wpr">TTR :: Williams %R</option>
                <option value="roc">TTR :: Rate of Change</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
          </div>
        </div>
      )}

      {/* Main Plot View Tab Selector */}
      <div className="bg-slate-950 text-white px-6 flex flex-wrap items-center gap-1 border-b border-slate-800 py-0.5">
        <button
          onClick={() => setActivePlotTab('chart')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'chart'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <LineChart className="w-4 h-4 text-indigo-400" />
          <span>Price Action & Chart</span>
        </button>

        <button
          onClick={() => setActivePlotTab('indicators')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'indicators'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          <span>TTR Technical Indicators</span>
        </button>

        <button
          onClick={() => setActivePlotTab('performance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'performance'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Award className="w-4 h-4 text-indigo-400" />
          <span>Performance & Risk Analytics</span>
        </button>

        <button
          onClick={() => setActivePlotTab('portfolio')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'portfolio'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <PieChart className="w-4 h-4 text-indigo-400" />
          <span>Portfolio Simulator</span>
        </button>

        <button
          onClick={() => setActivePlotTab('volatility')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'volatility'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Flame className="w-4 h-4 text-indigo-400" />
          <span>Volatility Heatmap (ATR)</span>
        </button>

        <button
          onClick={() => setActivePlotTab('options')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'options'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Calculator className="w-4 h-4 text-indigo-400" />
          <span>Option Pricing (Black-Scholes / IV)</span>
        </button>

        <button
          onClick={() => setActivePlotTab('hybrid_arima')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'hybrid_arima'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Brain className="w-4 h-4 text-indigo-400" />
          <span>Hybrid ARIMA + Sentiment Engine</span>
        </button>

        <button
          onClick={() => setActivePlotTab('ml_pipeline')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'ml_pipeline'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <span>ML Volume Classifier</span>
        </button>

        <button
          onClick={() => setActivePlotTab('monte_carlo')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'monte_carlo'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Dices className="w-4 h-4 text-indigo-400" />
          <span>Monte Carlo Paths (VaR/CVaR)</span>
        </button>

        <button
          onClick={() => setActivePlotTab('factor_model')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'factor_model'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Factor Risk Model (4-Factor)</span>
        </button>

        <button
          onClick={() => setActivePlotTab('correlation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'correlation'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Grid className="w-4 h-4 text-indigo-400" />
          <span>Cross-Asset Correlation</span>
        </button>

        <button
          onClick={() => setActivePlotTab('backtest')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'backtest'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <PlaySquare className="w-4 h-4 text-indigo-400" />
          <span>Strategy Backtester (`quantstrat`)</span>
        </button>

        <button
          onClick={() => setActivePlotTab('media')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'media'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Google Media News & Analysis</span>
        </button>

        <button
          onClick={() => setActivePlotTab('table')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
            activePlotTab === 'table'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <TableIcon className="w-4 h-4 text-indigo-400" />
          <span>xts Data Table</span>
        </button>
      </div>

      {/* RENDER VIEW ACCORDING TO SELECTED LAYOUT */}

      {/* 1. SIDEBAR LAYOUT */}
      {layout === 'sidebar' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <SidebarControls
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            dataFetchCount={dataFetchCount}
            indicatorUpdateCount={indicatorUpdateCount}
            onOpenCodeInspector={() => setIsCodeModalOpen(true)}
          />

          <main className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-5">
            <MetricsCards data={rawMarketData} symbol={settings.ticker} metrics={quantMetrics} />

            {activePlotTab === 'chart' && (
              <>
                <FinancialChart
                  data={rawMarketData}
                  settings={settings}
                  isLoading={isLoading}
                  onRefresh={handleRefreshData}
                />
                <IndicatorSubplot data={rawMarketData} indicator={settings.indicator} />
              </>
            )}

            {activePlotTab === 'indicators' && (
              <div className="space-y-4">
                <IndicatorSubplot data={rawMarketData} indicator={settings.indicator} />
                <FinancialChart
                  data={rawMarketData}
                  settings={settings}
                  isLoading={isLoading}
                  onRefresh={handleRefreshData}
                />
              </div>
            )}

            {activePlotTab === 'performance' && (
              <PerformanceCharts
                data={rawMarketData}
                metrics={quantMetrics}
                ticker={settings.ticker}
              />
            )}

            {activePlotTab === 'portfolio' && (
              <PortfolioSimulator startDate={settings.startDate} endDate={settings.endDate} />
            )}

            {activePlotTab === 'volatility' && (
              <VolatilityHeatmap
                watchlists={watchlists}
                activeWatchlistId={activeWatchlistId}
                startDate={settings.startDate}
                endDate={settings.endDate}
                onSelectWatchlist={(id) => setActiveWatchlistId(id)}
                onSelectTicker={(ticker) => setSettings((prev) => ({ ...prev, ticker }))}
              />
            )}

            {activePlotTab === 'options' && (
              <OptionAnalyticsPanel
                currentStockPrice={quantMetrics?.lastClose}
                ticker={settings.ticker}
              />
            )}

            {activePlotTab === 'hybrid_arima' && (
              <HybridARIMASentiment
                ticker={settings.ticker}
                startDate={settings.startDate}
                endDate={settings.endDate}
              />
            )}

            {activePlotTab === 'ml_pipeline' && (
              <MLPipelineInspector />
            )}

            {activePlotTab === 'monte_carlo' && (
              <MonteCarloSimulation data={rawMarketData} ticker={settings.ticker} />
            )}

            {activePlotTab === 'factor_model' && (
              <FactorRiskModel data={rawMarketData} ticker={settings.ticker} />
            )}

            {activePlotTab === 'correlation' && (
              <CorrelationMatrix
                watchlist={watchlists.find((w) => w.id === activeWatchlistId) || null}
                onSelectTicker={(ticker) => setSettings((prev) => ({ ...prev, ticker }))}
              />
            )}

            {activePlotTab === 'backtest' && (
              <StrategyBacktester data={rawMarketData} ticker={settings.ticker} />
            )}

            {activePlotTab === 'media' && (
              <MediaAnalysisPanel ticker={settings.ticker} />
            )}

            {activePlotTab === 'table' && (
              <DataTable data={rawMarketData} ticker={settings.ticker} />
            )}
          </main>
        </div>
      )}

      {/* 2. NAVBAR LAYOUT */}
      {layout === 'navbar' && (
        <main className="flex-1 p-6 overflow-y-auto space-y-5">
          <MetricsCards data={rawMarketData} symbol={settings.ticker} metrics={quantMetrics} />

          {activePlotTab === 'chart' && (
            <FinancialChart
              data={rawMarketData}
              settings={settings}
              isLoading={isLoading}
              onRefresh={handleRefreshData}
            />
          )}

          {activePlotTab === 'indicators' && (
            <div className="space-y-4">
              <IndicatorSubplot data={rawMarketData} indicator={settings.indicator} />
              <FinancialChart
                data={rawMarketData}
                settings={settings}
                isLoading={isLoading}
                onRefresh={handleRefreshData}
              />
            </div>
          )}

          {activePlotTab === 'performance' && (
            <PerformanceCharts
              data={rawMarketData}
              metrics={quantMetrics}
              ticker={settings.ticker}
            />
          )}

          {activePlotTab === 'portfolio' && (
            <PortfolioSimulator startDate={settings.startDate} endDate={settings.endDate} />
          )}

          {activePlotTab === 'volatility' && (
            <VolatilityHeatmap
              watchlists={watchlists}
              activeWatchlistId={activeWatchlistId}
              startDate={settings.startDate}
              endDate={settings.endDate}
              onSelectWatchlist={(id) => setActiveWatchlistId(id)}
              onSelectTicker={(ticker) => setSettings((prev) => ({ ...prev, ticker }))}
            />
          )}

          {activePlotTab === 'options' && (
            <OptionAnalyticsPanel
              currentStockPrice={quantMetrics?.lastClose}
              ticker={settings.ticker}
            />
          )}

          {activePlotTab === 'hybrid_arima' && (
            <HybridARIMASentiment
              ticker={settings.ticker}
              startDate={settings.startDate}
              endDate={settings.endDate}
            />
          )}

          {activePlotTab === 'ml_pipeline' && (
            <MLPipelineInspector />
          )}

          {activePlotTab === 'monte_carlo' && (
            <MonteCarloSimulation data={rawMarketData} ticker={settings.ticker} />
          )}

          {activePlotTab === 'factor_model' && (
            <FactorRiskModel data={rawMarketData} ticker={settings.ticker} />
          )}

          {activePlotTab === 'correlation' && (
            <CorrelationMatrix
              watchlist={watchlists.find((w) => w.id === activeWatchlistId) || null}
              onSelectTicker={(ticker) => setSettings((prev) => ({ ...prev, ticker }))}
            />
          )}

          {activePlotTab === 'backtest' && (
            <StrategyBacktester data={rawMarketData} ticker={settings.ticker} />
          )}

          {activePlotTab === 'media' && (
            <MediaAnalysisPanel ticker={settings.ticker} />
          )}

          {activePlotTab === 'table' && (
            <DataTable data={rawMarketData} ticker={settings.ticker} />
          )}
        </main>
      )}

      {/* 3. BENTO GRID LAYOUT */}
      {layout === 'grid' && (
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column (8 cols): Primary Active Tab Content */}
            <div className="lg:col-span-8 space-y-5">
              {activePlotTab === 'chart' && (
                <>
                  <FinancialChart
                    data={rawMarketData}
                    settings={settings}
                    isLoading={isLoading}
                    onRefresh={handleRefreshData}
                  />
                  <IndicatorSubplot data={rawMarketData} indicator={settings.indicator} />
                </>
              )}

              {activePlotTab === 'performance' && (
                <PerformanceCharts
                  data={rawMarketData}
                  metrics={quantMetrics}
                  ticker={settings.ticker}
                />
              )}

              {activePlotTab === 'portfolio' && (
                <PortfolioSimulator startDate={settings.startDate} endDate={settings.endDate} />
              )}

              {activePlotTab === 'volatility' && (
                <VolatilityHeatmap
                  watchlists={watchlists}
                  activeWatchlistId={activeWatchlistId}
                  startDate={settings.startDate}
                  endDate={settings.endDate}
                  onSelectWatchlist={(id) => setActiveWatchlistId(id)}
                  onSelectTicker={(ticker) => setSettings((prev) => ({ ...prev, ticker }))}
                />
              )}

              {activePlotTab === 'options' && (
                <OptionAnalyticsPanel
                  currentStockPrice={quantMetrics?.lastClose}
                  ticker={settings.ticker}
                />
              )}

              {activePlotTab === 'hybrid_arima' && (
                <HybridARIMASentiment
                  ticker={settings.ticker}
                  startDate={settings.startDate}
                  endDate={settings.endDate}
                />
              )}

              {activePlotTab === 'ml_pipeline' && (
                <MLPipelineInspector />
              )}

              {activePlotTab === 'monte_carlo' && (
                <MonteCarloSimulation data={rawMarketData} ticker={settings.ticker} />
              )}

              {activePlotTab === 'factor_model' && (
                <FactorRiskModel data={rawMarketData} ticker={settings.ticker} />
              )}

              {activePlotTab === 'correlation' && (
                <CorrelationMatrix
                  watchlist={watchlists.find((w) => w.id === activeWatchlistId) || null}
                  onSelectTicker={(ticker) => setSettings((prev) => ({ ...prev, ticker }))}
                />
              )}

              {activePlotTab === 'backtest' && (
                <StrategyBacktester data={rawMarketData} ticker={settings.ticker} />
              )}

              {activePlotTab === 'media' && (
                <MediaAnalysisPanel ticker={settings.ticker} />
              )}

              {activePlotTab === 'table' && (
                <DataTable data={rawMarketData} ticker={settings.ticker} />
              )}
            </div>

            {/* Right Column (4 cols): Metrics & Quick Media Summary */}
            <div className="lg:col-span-4 space-y-5">
              <MetricsCards data={rawMarketData} symbol={settings.ticker} metrics={quantMetrics} />
              <IndicatorSubplot data={rawMarketData} indicator={settings.indicator} />
            </div>
          </div>
        </main>
      )}

      {/* 4. SPLIT SCREEN DUAL VIEW */}
      {layout === 'split' && (
        <main className="flex-1 p-6 overflow-y-auto space-y-5">
          <MetricsCards data={rawMarketData} symbol={settings.ticker} metrics={quantMetrics} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Pane: Price Action Chart */}
            <div className="space-y-4">
              <FinancialChart
                data={rawMarketData}
                settings={settings}
                isLoading={isLoading}
                onRefresh={handleRefreshData}
              />
              <IndicatorSubplot data={rawMarketData} indicator={settings.indicator} />
            </div>

            {/* Right Pane: Media Analysis & Performance Charts */}
            <div className="space-y-4">
              {activePlotTab === 'media' ? (
                <MediaAnalysisPanel ticker={settings.ticker} />
              ) : (
                <PerformanceCharts
                  data={rawMarketData}
                  metrics={quantMetrics}
                  ticker={settings.ticker}
                />
              )}
            </div>
          </div>
        </main>
      )}

      {/* R Code Inspector Modal */}
      <RCodeInspector
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        rCode={appRCode}
      />

      {/* Watchlist Sync & Import Modal */}
      <WatchlistImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportWatchlist={handleImportWatchlist}
      />
    </div>
  );
}
