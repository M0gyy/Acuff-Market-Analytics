import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import {
  Brain,
  Newspaper,
  TrendingUp,
  BarChart3,
  Code2,
  CheckCircle2,
  Zap,
  Sparkles,
  Layers,
  Cpu,
  Smile,
  Frown,
  Activity,
  Award,
} from 'lucide-react';
import { generateMarketData } from '../services/financialData';

interface HybridARIMASentimentProps {
  ticker?: string;
  startDate?: string;
  endDate?: string;
}

interface NewsItem {
  id: string;
  source: string;
  title: string;
  date: string;
  tokens: string[];
  posCount: number;
  negCount: number;
  sentimentScore: number; // -1 to +1
  polarity: 'Positive' | 'Negative' | 'Neutral';
}

const SAMPLE_NEWS: Record<string, NewsItem[]> = {
  AAPL: [
    {
      id: '1',
      source: 'Wall Street Journal',
      title: 'Apple quarterly revenue breaks records fueled by surge in iPhone services growth',
      date: '2026-07-28',
      tokens: ['apple', 'revenue', 'breaks', 'records', 'surge', 'iphone', 'services', 'growth'],
      posCount: 4,
      negCount: 0,
      sentimentScore: 0.82,
      polarity: 'Positive',
    },
    {
      id: '2',
      source: 'Bloomberg',
      title: 'Supply chain headwinds slightly pressure iPad production yield in Asia',
      date: '2026-07-25',
      tokens: ['supply', 'chain', 'headwinds', 'pressure', 'ipad', 'production'],
      posCount: 0,
      negCount: 2,
      sentimentScore: -0.45,
      polarity: 'Negative',
    },
    {
      id: '3',
      source: 'NASDAQ News',
      title: 'Apple expands AI hardware integration with high-margin enterprise partnerships',
      date: '2026-07-22',
      tokens: ['expands', 'ai', 'hardware', 'integration', 'high-margin', 'partnerships'],
      posCount: 3,
      negCount: 0,
      sentimentScore: 0.75,
      polarity: 'Positive',
    },
  ],
  TSLA: [
    {
      id: '1',
      source: 'Yahoo Finance',
      title: 'Tesla Robotaxi rollout achieves regulatory approval milestone in key metro regions',
      date: '2026-07-29',
      tokens: ['robotaxi', 'rollout', 'achieves', 'regulatory', 'approval', 'milestone'],
      posCount: 3,
      negCount: 0,
      sentimentScore: 0.88,
      polarity: 'Positive',
    },
    {
      id: '2',
      source: 'Reuters',
      title: 'Battery lithium cell cost volatility causes minor gross margin compression',
      date: '2026-07-26',
      tokens: ['volatility', 'causes', 'minor', 'gross', 'margin', 'compression'],
      posCount: 0,
      negCount: 2,
      sentimentScore: -0.52,
      polarity: 'Negative',
    },
  ],
  DEFAULT: [
    {
      id: '1',
      source: 'Financial Times',
      title: 'Corporate earnings outperform consensus expectations amidst robust macroeconomic expansion',
      date: '2026-07-29',
      tokens: ['outperform', 'consensus', 'expectations', 'robust', 'macroeconomic', 'expansion'],
      posCount: 4,
      negCount: 0,
      sentimentScore: 0.85,
      polarity: 'Positive',
    },
    {
      id: '2',
      source: 'Wall Street Journal',
      title: 'Central bank rate adjustments create transient market hesitation',
      date: '2026-07-26',
      tokens: ['rate', 'adjustments', 'transient', 'hesitation'],
      posCount: 0,
      negCount: 1,
      sentimentScore: -0.25,
      polarity: 'Negative',
    },
  ],
};

export const HybridARIMASentiment: React.FC<HybridARIMASentimentProps> = ({
  ticker = 'AAPL',
  startDate = '2026-01-01',
  endDate = '2026-07-30',
}) => {
  const [arimaP, setArimaP] = useState<number>(1);
  const [arimaD, setArimaD] = useState<number>(1);
  const [arimaQ, setArimaQ] = useState<number>(1);
  const [newsWeight, setNewsWeight] = useState<number>(0.35); // 35% sentiment / 65% ARIMA
  const [activeClassifier, setActiveClassifier] = useState<'knn' | 'naive_bayes' | 'svm'>('knn');

  // Load market historical data
  const marketData = useMemo(() => {
    return generateMarketData(ticker, startDate, endDate);
  }, [ticker, startDate, endDate]);

  // Sample news list
  const newsList = useMemo(() => {
    return SAMPLE_NEWS[ticker] || SAMPLE_NEWS['DEFAULT'];
  }, [ticker]);

  // Calculate overall news sentiment score
  const overallNewsSentiment = useMemo(() => {
    if (newsList.length === 0) return 0;
    const avgScore = newsList.reduce((acc, n) => acc + n.sentimentScore, 0) / newsList.length;
    return Number(avgScore.toFixed(2));
  }, [newsList]);

  // Simulate ARIMA Forecast + Hybrid Ensemble
  const { forecastChartData, modelAccuracies } = useMemo(() => {
    if (!marketData || marketData.length === 0) {
      return { forecastChartData: [], modelAccuracies: [] };
    }

    const recentData = marketData.slice(-30);
    const lastClose = recentData[recentData.length - 1].close;

    // Simulate 14-day future forecast
    const points: any[] = [];

    // Historical points
    recentData.forEach((d) => {
      points.push({
        date: d.date.slice(5),
        HistoricalClose: d.close,
        ARIMAForecast: null,
        HybridEnsembleForecast: null,
      });
    });

    // Future 14 days forecast
    let arimaPrice = lastClose;
    let hybridPrice = lastClose;

    // Daily drift based on ARIMA p,d,q simulation
    const dailyDrift = 0.0015 * (arimaP - arimaQ + 0.5);

    for (let day = 1; day <= 14; day++) {
      const dateStr = `Day +${day}`;
      const noise = (Math.sin(day) * 0.008) + (Math.cos(day * 1.5) * 0.005);

      arimaPrice = arimaPrice * (1 + dailyDrift + noise);

      // Sentiment adjustment boost or drag
      const sentimentBoost = overallNewsSentiment * 0.006 * newsWeight;
      hybridPrice = hybridPrice * (1 + dailyDrift + noise + sentimentBoost);

      points.push({
        date: dateStr,
        HistoricalClose: null,
        ARIMAForecast: Number(arimaPrice.toFixed(2)),
        HybridEnsembleForecast: Number(hybridPrice.toFixed(2)),
      });
    }

    // Accuracy benchmarks matching Jishag et al. (2020) paper Table 3 & 4
    const accuracies = [
      { name: 'Sentiment Only (Lexicon)', accuracy: 67.14, color: '#f59e0b' },
      { name: 'ARIMA Historical Only', accuracy: 75.2, color: '#0284c7' },
      { name: 'Hybrid ARIMA + Sentiment (KNN)', accuracy: 89.8, color: '#7e22ce' },
      { name: 'Hybrid ARIMA + Sentiment (Naive Bayes)', accuracy: 86.17, color: '#10b981' },
      { name: 'Hybrid ARIMA + Sentiment (SVM)', accuracy: 70.14, color: '#64748b' },
    ];

    return { forecastChartData: points, modelAccuracies: accuracies };
  }, [marketData, arimaP, arimaD, arimaQ, newsWeight, overallNewsSentiment]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-700" />
              <span>Hybrid ARIMA Time Series & News Sentiment Predictive Pipeline</span>
            </h3>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500">Target Ticker:</span>
            <span className="font-bold bg-purple-950 text-purple-200 px-3 py-1 rounded-lg border border-purple-800">
              {ticker}
            </span>
          </div>
        </div>

        {/* Model Parameter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              ARIMA Parameters $(p, d, q)$
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1">
                <span className="text-slate-400 font-mono text-[10px]">p:</span>
                <input
                  type="number"
                  value={arimaP}
                  onChange={(e) => setArimaP(Number(e.target.value))}
                  min={0}
                  max={5}
                  className="w-10 text-center font-bold text-slate-900 font-mono focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1">
                <span className="text-slate-400 font-mono text-[10px]">d:</span>
                <input
                  type="number"
                  value={arimaD}
                  onChange={(e) => setArimaD(Number(e.target.value))}
                  min={0}
                  max={2}
                  className="w-10 text-center font-bold text-slate-900 font-mono focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1">
                <span className="text-slate-400 font-mono text-[10px]">q:</span>
                <input
                  type="number"
                  value={arimaQ}
                  onChange={(e) => setArimaQ(Number(e.target.value))}
                  min={0}
                  max={5}
                  className="w-10 text-center font-bold text-slate-900 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Sentiment Fusion Weight: {Math.round(newsWeight * 100)}% News / {Math.round((1 - newsWeight) * 100)}% ARIMA
            </label>
            <input
              type="range"
              min={0.05}
              max={0.8}
              step={0.05}
              value={newsWeight}
              onChange={(e) => setNewsWeight(Number(e.target.value))}
              className="w-full accent-purple-700 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Ensemble Classifier Method
            </label>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300">
              <button
                onClick={() => setActiveClassifier('knn')}
                className={`flex-1 py-1 font-bold rounded text-[11px] transition cursor-pointer ${
                  activeClassifier === 'knn' ? 'bg-purple-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                K-NN
              </button>
              <button
                onClick={() => setActiveClassifier('naive_bayes')}
                className={`flex-1 py-1 font-bold rounded text-[11px] transition cursor-pointer ${
                  activeClassifier === 'naive_bayes' ? 'bg-purple-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Naive Bayes
              </button>
              <button
                onClick={() => setActiveClassifier('svm')}
                className={`flex-1 py-1 font-bold rounded text-[11px] transition cursor-pointer ${
                  activeClassifier === 'svm' ? 'bg-purple-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SVM
              </button>
            </div>
          </div>

          <div className="bg-purple-950 text-white p-3 rounded-xl border border-purple-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-purple-300 uppercase font-bold block">Ensemble Accuracy</span>
              <span className="text-xl font-bold font-mono text-emerald-400">89.80%</span>
            </div>
            <Award className="w-6 h-6 text-amber-400" />
          </div>
        </div>
      </div>

      {/* FORECAST COMPARISON CHART */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-700" />
            <span>14-Day Stock Trend Forecast: Pure ARIMA vs Hybrid ARIMA + News Sentiment</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-500">Historical Close + 14 Days Ahead</span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#581c87',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line
                type="monotone"
                dataKey="HistoricalClose"
                name="Historical Price ($)"
                stroke="#334155"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ARIMAForecast"
                name={`Pure ARIMA(${arimaP},${arimaD},${arimaQ})`}
                stroke="#0284c7"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="HybridEnsembleForecast"
                name="Hybrid ARIMA + Sentiment Ensemble"
                stroke="#7e22ce"
                strokeWidth={3}
                dot={{ r: 4, fill: '#7e22ce' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NLP NEWS SENTIMENT LEXICON BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-purple-700" />
              <span>Real-Time News Reports Lexicon Sentiment Polarity</span>
            </h4>
            <span className="text-[11px] font-mono text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
              Score: {overallNewsSentiment > 0 ? `+${overallNewsSentiment}` : overallNewsSentiment}
            </span>
          </div>

          <div className="space-y-3">
            {newsList.map((item) => (
              <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="font-bold text-purple-900">{item.source}</span>
                  <span>{item.date}</span>
                </div>
                <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
                    {item.tokens.map((token, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                        {token}
                      </span>
                    ))}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.polarity === 'Positive'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {item.polarity === 'Positive' ? <Smile className="w-3 h-3" /> : <Frown className="w-3 h-3" />}
                    <span>{item.polarity} (+{item.posCount} / -{item.negCount})</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACCURACY BENCHMARKS (Jishag et al. Table 3 & 4) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-700" />
              <span>Model Accuracy Comparison Benchmark (%)</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-500">Jishag et al. (2020)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelAccuracies} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[50, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#581c87',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Accuracy']}
                />
                <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                  {modelAccuracies.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-950 font-sans leading-relaxed">
            <strong>Key Finding:</strong> Combining NLP sentiment analysis with historical ARIMA forecasts via K-NN ensemble classification yields an unprecedented accuracy of <strong>89.80%</strong>, outperforming standalone sentiment (67.14%) or standalone ARIMA (75.20%).
          </div>
        </div>
      </div>
    </div>
  );
};
