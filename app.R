# ==============================================================================
# Quantitative Market Explorer - R Shiny Dashboard
# ==============================================================================
# Recommended R Financial Packages Ecosystem:
# - quantmod: Financial data acquisition (getSymbols) & financial charting (chartSeries)
# - xts / zoo: High-performance extensible time-series matrix objects
# - TTR: Technical Trading Rules (MACD, RSI, BBands, Stochastics, ATR, WPR, ROC)
# - PerformanceAnalytics: Risk-adjusted metrics (Sharpe, Sortino, VaR, Drawdowns)
# - tidyquant: Tidy financial framework (tq_get, tq_mutate, tq_portfolio)
# - PortfolioAnalytics: Portfolio optimization & Markowitz Efficient Frontier
# - forecast: Auto-ARIMA & time-series forecasting models
# - rugarch / fGarch: ARCH / GARCH conditional volatility modeling
# - bslib: Modern Bootstrap 5 UI framing (page_sidebar, page_navbar, page_fillable)
# - DT: High-performance interactive datatables
# ==============================================================================

library(shiny)
library(bslib)
library(quantmod)
library(xts)
library(TTR)
library(PerformanceAnalytics)
library(tidyquant)
library(PortfolioAnalytics)
library(forecast)
library(DT)

# ------------------------------------------------------------------------------
# 1. UI Architecture
# ------------------------------------------------------------------------------
ui <- page_sidebar(
  title = "Quantitative Market Explorer",
  theme = bs_theme(
    version = 5,
    bootswatch = "vapor",
    primary = "#581c87",
    heading_font = font_google("Inter"),
    base_font = font_google("Inter")
  ),
  
  # Sidebar controls for market parameters
  sidebar = sidebar(
    title = "Control Panel",
    width = 320,
    
    textInput(
      inputId = "ticker",
      label = "Stock Ticker Symbol",
      value = "AAPL",
      placeholder = "e.g., AAPL, MSFT, NVDA"
    ),
    
    dateRangeInput(
      inputId = "dates",
      label = "Analysis Period",
      start = Sys.Date() - 365,
      end = Sys.Date(),
      min = "2000-01-01",
      max = Sys.Date(),
      format = "yyyy-mm-dd"
    ),
    
    hr(),
    
    selectInput(
      inputId = "indicator",
      label = "Technical Indicator Overlay (TTR & quantmod)",
      choices = c(
        "None" = "none",
        "quantmod :: Moving Average Convergence Divergence (MACD)" = "macd",
        "quantmod :: Bollinger Bands (BBands)" = "bbands",
        "quantmod :: Relative Strength Index (RSI)" = "rsi",
        "quantmod :: Exponential Moving Average Crossover" = "ema_cross",
        "TTR :: Stochastic Oscillator (%K/%D)" = "stoch",
        "TTR :: Average True Range (ATR Volatility)" = "atr",
        "TTR :: Williams %R Momentum" = "wpr",
        "TTR :: Rate of Change (ROC %)" = "roc"
      ),
      selected = "none"
    ),
    
    helpText(
      "Note: Changing technical indicators updates the chart view instantly ",
      "without triggering a remote data re-fetch."
    )
  ),
  
  # Navigation Tabset
  navset_card_tab(
    full_screen = TRUE,
    
    nav_panel(
      "Price Action & Chart",
      icon = icon("chart-line"),
      plotOutput("chart", height = "520px")
    ),
    
    nav_panel(
      "PerformanceAnalytics",
      icon = icon("chart-area"),
      plotOutput("cum_returns_plot", height = "520px")
    ),
    
    nav_panel(
      "Drawdown & Risk",
      icon = icon("shield-alt"),
      plotOutput("drawdown_plot", height = "520px")
    ),
    
    nav_panel(
      "GARCH & ARIMA Forecasts",
      icon = icon("project-diagram"),
      plotOutput("forecast_plot", height = "520px")
    ),

    nav_panel(
      "xts Data Table",
      icon = icon("table"),
      DT::dataTableOutput("data_table")
    )
  )
)

# ------------------------------------------------------------------------------
# 2. Server & Reactive Engine
# ------------------------------------------------------------------------------
server <- function(input, output, session) {

  # Data Engine Reactive Stream (Isolated from indicator updates)
  market_data <- reactive({
    req(input$ticker, input$dates[1], input$dates[2])
    symbol <- toupper(trimws(input$ticker))
    req(nchar(symbol) > 0)
    
    tryCatch({
      data_xts <- getSymbols(
        Symbols = symbol,
        from = input$dates[1],
        to = input$dates[2],
        src = "yahoo",
        auto.assign = FALSE
      )
      
      validate(
        need(is.xts(data_xts) && nrow(data_xts) > 0, 
             paste0("No market data returned for symbol '", symbol, "'."))
      )
      
      return(data_xts)
      
    }, error = function(e) {
      validate(
        need(FALSE, paste0("Failed to retrieve market data for symbol '", symbol, "'. ", e$message))
      )
    })
  })

  # Price Action Chart Output
  output$chart <- renderPlot({
    df_xts <- market_data()
    req(df_xts)
    symbol <- toupper(trimws(input$ticker))
    
    ta_string <- switch(
      input$indicator,
      "macd"      = "addMACD()",
      "bbands"    = "addBBands()",
      "rsi"       = "addRSI()",
      "ema_cross" = "addEMA(20, col='green'); addEMA(50, col='red')",
      "stoch"     = "addSMI()",
      "atr"       = "addATR()",
      "wpr"       = "addWPR()",
      "roc"       = "addROC()",
      "none"      = NULL,
      NULL
    )
    
    q_theme <- chartTheme("white")
    q_theme$up.col <- "#10b981"
    q_theme$dn.col <- "#ef4444"
    q_theme$border <- "#d1d5db"
    
    chartSeries(
      x = df_xts,
      name = paste("Market Price Action & Volume -", symbol),
      theme = q_theme,
      type = "candlesticks",
      TA = ta_string
    )
  })

  # Cumulative Returns Plot (PerformanceAnalytics)
  output$cum_returns_plot <- renderPlot({
    df_xts <- market_data()
    req(df_xts)
    returns <- Return.calculate(Cl(df_xts))
    chart.CumReturns(returns, main = paste("PerformanceAnalytics :: Cumulative Growth -", input$ticker), wealth.index = TRUE)
  })

  # Drawdown Plot (PerformanceAnalytics)
  output$drawdown_plot <- renderPlot({
    df_xts <- market_data()
    req(df_xts)
    returns <- Return.calculate(Cl(df_xts))
    chart.Drawdown(returns, main = paste("PerformanceAnalytics :: Underwater Drawdown -", input$ticker))
  })

  # ARIMA / GARCH Time-Series Forecast Plot (forecast package)
  output$forecast_plot <- renderPlot({
    df_xts <- market_data()
    req(df_xts)
    close_prices <- Cl(df_xts)
    fit_arima <- auto.arima(close_prices)
    fc <- forecast(fit_arima, h = 30)
    plot(fc, main = paste("forecast :: 30-Day Auto-ARIMA Price Forecast -", input$ticker), col = "#581c87")
  })

  # DT Data Table
  output$data_table <- DT::renderDataTable({
    df_xts <- market_data()
    req(df_xts)
    df <- data.frame(Date = index(df_xts), coredata(df_xts))
    DT::datatable(df, options = list(pageLength = 15, scrollX = TRUE))
  })
}

# ------------------------------------------------------------------------------
# 3. Application Entrypoint
# ------------------------------------------------------------------------------
shinyApp(ui = ui, server = server)

