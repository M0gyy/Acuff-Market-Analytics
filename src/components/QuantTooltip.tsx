import React, { useState } from 'react';
import { HelpCircle, Info, Code2, BookOpen, X } from 'lucide-react';

interface QuantTooltipProps {
  title: string;
  summary: string;
  details?: string;
  rFunction?: string;
  parameters?: string;
  interpretation?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

export const QuantTooltip: React.FC<QuantTooltipProps> = ({
  title,
  summary,
  details,
  rFunction,
  parameters,
  interpretation,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block align-middle ml-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-slate-400 hover:text-purple-700 transition cursor-pointer p-0.5 rounded-full hover:bg-purple-100"
        aria-label={`Tooltip for ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute z-50 left-6 -top-2 w-72 bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-purple-800/80 text-xs font-sans space-y-2 transition-all animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-bold text-purple-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{title}</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[11px] text-slate-200 leading-snug">{summary}</p>

          {details && (
            <p className="text-[10px] text-slate-400 leading-normal">{details}</p>
          )}

          {rFunction && (
            <div className="bg-slate-950 p-2 rounded border border-purple-900/60 font-mono text-[10px] text-purple-200">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Code2 className="w-3 h-3 text-purple-400" />
                <span>R Execution Syntax</span>
              </div>
              <div className="text-purple-300 font-bold">{rFunction}</div>
            </div>
          )}

          {parameters && (
            <div className="text-[10px] font-mono text-slate-300 pt-1 border-t border-slate-800">
              <span className="text-slate-400 font-bold">Params:</span> {parameters}
            </div>
          )}

          {interpretation && (
            <div className="text-[10px] text-emerald-300 pt-1 border-t border-slate-800 leading-snug">
              <span className="font-bold text-emerald-400">Trading Signal:</span> {interpretation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
