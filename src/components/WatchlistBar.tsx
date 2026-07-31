import React, { useState } from 'react';
import { Watchlist, WatchlistItem } from '../types';
import {
  Globe,
  Plus,
  Trash2,
  Upload,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface WatchlistBarProps {
  watchlists: Watchlist[];
  activeWatchlistId: string;
  selectedTicker: string;
  onSelectWatchlist: (id: string) => void;
  onSelectTicker: (ticker: string) => void;
  onOpenImportModal: () => void;
  onAddSymbolToActiveWatchlist: (symbol: string) => void;
  onRemoveSymbolFromActiveWatchlist: (symbol: string) => void;
}

export const WatchlistBar: React.FC<WatchlistBarProps> = ({
  watchlists,
  activeWatchlistId,
  selectedTicker,
  onSelectWatchlist,
  onSelectTicker,
  onOpenImportModal,
  onAddSymbolToActiveWatchlist,
  onRemoveSymbolFromActiveWatchlist,
}) => {
  const [newSymbolInput, setNewSymbolInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const activeWatchlist =
    watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbolInput.trim()) {
      onAddSymbolToActiveWatchlist(newSymbolInput.trim().toUpperCase());
      setNewSymbolInput('');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800 px-6 py-2 text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-sans shadow-md">
      {/* Active Watchlist Selector Dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Watchlist:</span>
        </div>

        <div className="relative">
          <select
            value={activeWatchlistId}
            onChange={(e) => onSelectWatchlist(e.target.value)}
            className="bg-slate-900 text-indigo-200 border border-slate-700 rounded-lg px-3 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
          >
            {watchlists.map((wl) => (
              <option key={wl.id} value={wl.id}>
                {wl.sourceType === 'google_finance' ? '🌐 ' : '📊 '}
                {wl.name} ({wl.symbols.length})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-indigo-400 absolute right-2.5 top-2 pointer-events-none" />
        </div>

        <button
          onClick={onOpenImportModal}
          className="flex items-center gap-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 text-xs font-bold px-3 py-1 rounded-lg border border-indigo-700/60 transition cursor-pointer shrink-0"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-300" />
          <span>Sync / Import</span>
        </button>
      </div>

      {/* Multi-line Ticker Strip */}
      <div className="flex-1 flex flex-wrap items-center gap-1.5 py-1">
        {activeWatchlist && activeWatchlist.symbols.map((item) => {
          const isSelected = selectedTicker.toUpperCase() === item.symbol.toUpperCase();
          const isPositive = (item.changePercent || 0) >= 0;

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectTicker(item.symbol)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-mono transition cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs font-bold'
                  : 'bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-600 hover:bg-slate-850'
              }`}
            >
              <span className="font-bold">{item.symbol}</span>
              {item.price && (
                <span className="text-slate-300 font-sans">${item.price.toFixed(2)}</span>
              )}

              {item.changePercent !== undefined && (
                <span
                  className={`flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isPositive
                      ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/60'
                      : 'bg-rose-950/90 text-rose-400 border border-rose-800/60'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {item.changePercent}%
                </span>
              )}

              {/* Remove button on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSymbolFromActiveWatchlist(item.symbol);
                }}
                className="text-slate-500 hover:text-rose-400 transition p-0.5"
                title={`Remove ${item.symbol} from watchlist`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Inline Add Ticker Button */}
        {isAdding ? (
          <form onSubmit={handleAddSubmit} className="flex items-center gap-1 shrink-0">
            <input
              type="text"
              value={newSymbolInput}
              onChange={(e) => setNewSymbolInput(e.target.value)}
              placeholder="Ticker..."
              autoFocus
              className="w-20 bg-slate-950 border border-purple-600 rounded px-2 py-0.5 text-xs text-white font-mono uppercase focus:outline-none"
            />
            <button
              type="submit"
              className="bg-purple-700 text-white px-2 py-0.5 rounded text-xs font-bold cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white px-1 cursor-pointer"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-700 transition cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Symbol</span>
          </button>
        )}
      </div>
    </div>
  );
};
