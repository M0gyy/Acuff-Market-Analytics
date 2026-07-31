import React from 'react';
import { TechnicalIndicator } from '../types';
import { INDICATOR_TOOLTIPS } from '../data/indicatorDescriptions';
import { Info, Code2, BookOpen, Layers, CheckCircle } from 'lucide-react';

interface IndicatorExplanationCardProps {
  indicator: TechnicalIndicator;
}

export const IndicatorExplanationCard: React.FC<IndicatorExplanationCardProps> = ({ indicator }) => {
  const info = INDICATOR_TOOLTIPS[indicator] || INDICATOR_TOOLTIPS.none;

  return (
    <div className="bg-purple-950/90 text-white rounded-xl p-4 border border-purple-800/80 shadow-md space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-purple-800/60">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Quantitative Tool Guide
          </h4>
        </div>
        <span className="text-[10px] font-mono text-purple-300 bg-purple-900/80 px-2 py-0.5 rounded border border-purple-700/60">
          {info.package}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-bold text-purple-200 flex items-center justify-between">
          <span>{info.name}</span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">[{info.category}]</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {info.summary}
        </p>
        <p className="text-[11px] text-slate-300 leading-normal">
          {info.details}
        </p>
      </div>

      <div className="bg-slate-950 p-2.5 rounded-lg border border-purple-900/80 font-mono text-[11px]">
        <div className="text-[9px] text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1 font-sans font-bold">
          <Code2 className="w-3.5 h-3.5 text-purple-400" />
          <span>R Package Execution Code</span>
        </div>
        <code className="text-purple-300 font-bold text-[11px]">{info.rFunction}</code>
      </div>

      <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-purple-800/60 text-xs">
        <div className="text-[11px] text-slate-300 font-mono">
          <span className="text-purple-300 font-bold">Parameters:</span> {info.parameters}
        </div>
        <div className="text-[11px] text-emerald-300 leading-snug">
          <span className="text-emerald-400 font-bold">Trading Signal:</span> {info.interpretation}
        </div>
      </div>
    </div>
  );
};
