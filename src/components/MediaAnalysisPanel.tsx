import React, { useState, useEffect } from 'react';
import { MediaAnalysisResult } from '../types';
import {
  Globe,
  Newspaper,
  Search,
  Sparkles,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
} from 'lucide-react';

interface MediaAnalysisPanelProps {
  ticker: string;
}

export const MediaAnalysisPanel: React.FC<MediaAnalysisPanelProps> = ({ ticker }) => {
  const [data, setData] = useState<MediaAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState<string>('');

  const fetchAnalysis = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/media-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, customPrompt: query }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to fetch media analysis.');
      }

      const result: MediaAnalysisResult = await res.json();
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error executing Google News media search.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [ticker]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuery.trim()) {
      fetchAnalysis(customQuery.trim());
    }
  };

  // Extract sentiment direction and score from text if available
  const isBullish = data?.analysis.toUpperCase().includes('BULLISH');
  const isBearish = data?.analysis.toUpperCase().includes('BEARISH');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-purple-800/60 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-900/80 rounded-xl border border-purple-700/60 text-purple-300">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-900/60 px-2.5 py-0.5 rounded-full border border-purple-700/50">
                  Google Search Grounded Intelligence
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Gemini 3.6 Flash + Real-time Web
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1 text-white flex items-center gap-2">
                <span>Expert Media & News Analysis:</span>
                <span className="text-purple-300 underline underline-offset-4 font-mono">{ticker}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={() => fetchAnalysis(customQuery)}
            disabled={loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Searching Google...' : 'Refresh Live News'}</span>
          </button>
        </div>

        {/* Interactive Query Input */}
        <form onSubmit={handleCustomSubmit} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder={`Ask media analyst custom question about ${ticker} (e.g. "What are upcoming earnings catalysts?", "Analyst price target revisions?")...`}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-purple-800/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !customQuery.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Query Media</span>
          </button>
        </form>
      </div>

      {/* Main Analysis Results View */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-2xs text-center flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mb-4" />
          <h3 className="text-sm font-bold text-slate-800">
            Scanning Google Financial News & Media Citations for {ticker}...
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Querying real-time financial reporting from Bloomberg, Reuters, Wall Street Journal, CNBC, and SEC filings...
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl text-xs">
          <div className="font-bold text-sm mb-1">Media Analysis Request Failed</div>
          <p>{error}</p>
          <button
            onClick={() => fetchAnalysis()}
            className="mt-3 bg-rose-700 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-rose-800 transition"
          >
            Retry Search
          </button>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sentiment Summary Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Financial Media Sentiment
              </div>
              <div className="flex items-center gap-3">
                {isBullish ? (
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl flex items-center gap-1.5 font-bold text-sm">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span>BULLISH MEDIA BIAS</span>
                  </div>
                ) : isBearish ? (
                  <div className="p-2.5 bg-rose-100 text-rose-800 rounded-xl flex items-center gap-1.5 font-bold text-sm">
                    <TrendingDown className="w-5 h-5 text-rose-600" />
                    <span>BEARISH MEDIA BIAS</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl flex items-center gap-1.5 font-bold text-sm">
                    <Minus className="w-5 h-5 text-amber-600" />
                    <span>BALANCED / NEUTRAL</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="text-xs font-semibold text-slate-700">Sentiment Intensity Scale</div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="w-1/3 bg-rose-500 opacity-80" />
                  <div className="w-1/3 bg-amber-400 opacity-80" />
                  <div className="w-1/3 bg-emerald-500 opacity-80" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>-100 (Extreme Bear)</span>
                  <span>0 (Neutral)</span>
                  <span>+100 (Extreme Bull)</span>
                </div>
              </div>
            </div>

            {/* Google Search Grounded Citations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200">
                <Newspaper className="w-4 h-4 text-purple-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Verified Media Sources & Citations
                </h4>
              </div>

              {data.sources.length === 0 ? (
                <div className="text-xs text-slate-500 italic">
                  Google Search grounding retrieved real-time financial reporting context.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-purple-50 text-xs font-medium text-slate-800 hover:text-purple-900 border border-slate-200/80 transition group"
                    >
                      <span className="line-clamp-2">{src.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0 mt-0.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Markdown Text Analysis Content */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-700" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Expert Media Synthesizer & Market Commentary
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Generated: {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="prose prose-slate max-w-none text-xs text-slate-700 leading-relaxed space-y-3 font-sans whitespace-pre-wrap">
              {data.analysis}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
