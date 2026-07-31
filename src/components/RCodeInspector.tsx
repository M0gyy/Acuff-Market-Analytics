import React, { useState } from 'react';
import { X, Copy, Check, FileCode, ExternalLink, Terminal } from 'lucide-react';

interface RCodeInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  rCode: string;
}

export const RCodeInspector: React.FC<RCodeInspectorProps> = ({ isOpen, onClose, rCode }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/50 text-purple-400 rounded-lg border border-purple-700/50">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>app.R</span>
                <span className="text-xs bg-slate-800 text-purple-400 px-2 py-0.5 rounded font-mono font-medium">
                  R Shiny Code Base
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Complete, runnable Quantitative Market Explorer script with quantmod & xts logic
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Script'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code View Body */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed space-y-4 bg-slate-950">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-400 text-[11px] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              To run locally in RStudio or standard R environment: install packages{' '}
              <code className="text-purple-300">install.packages(c("shiny", "bslib", "quantmod", "xts"))</code> and execute <code className="text-purple-300">shiny::runApp()</code>.
            </span>
          </div>

          <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto text-emerald-400">
            <code>{rCode}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Target Environment: R 4.x+ | Shiny 1.8+</span>
          <a
            href="https://shiny.posit.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-teal-400 transition"
          >
            <span>Posit Shiny Documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
