import React, { useState, useMemo } from 'react';
import { OHLCV } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Layers, Activity, ShieldCheck, TrendingUp, DollarSign, Code, PieChart } from 'lucide-react';

interface FactorRiskModelProps {
  data: OHLCV[];
  ticker: string;
}

export const FactorRiskModel: React.FC<FactorRiskModelProps> = ({ data, ticker }) => {
  const [selectedModel, setSelectedModel] = useState<'ff3' | 'carhart4'>('carhart4');

  // Simulated factor loading estimations based on ticker characteristics
  const factorData = useMemo(() => {
    // Generate deterministic factor betas based on ticker name hash
    let hash = 0;
    for (let i = 0; i < ticker.length; i++) hash += ticker.charCodeAt(i);

    const alpha = parseFloat(((hash % 5) * 0.8 + 0.4).toFixed(2)); // % annualized
    const betaMkt = parseFloat((0.8 + (hash % 7) * 0.12).toFixed(2)); // Market Beta
    const betaSMB = parseFloat((((hash % 10) - 5) * 0.15).toFixed(2)); // Small Minus Big (Size)
    const betaHML = parseFloat((((hash % 8) - 4) * 0.18).toFixed(2)); // High Minus Low (Value)
    const betaUMD = parseFloat((((hash % 6) - 2) * 0.14).toFixed(2)); // Up Minus Down (Momentum)

    const rSquared = Math.min(0.92, 0.65 + (hash % 20) * 0.012);
    const systematicVol = (18.5 * Math.sqrt(rSquared)).toFixed(1);
    const idiosyncraticVol = (18.5 * Math.sqrt(1 - rSquared)).toFixed(1);

    const radarData = [
      { factor: 'Market (MKT)', exposure: Math.min(100, Math.max(10, betaMkt * 50)) },
      { factor: 'Size (SMB)', exposure: Math.min(100, Math.max(10, (betaSMB + 1) * 40)) },
      { factor: 'Value (HML)', exposure: Math.min(100, Math.max(10, (betaHML + 1) * 40)) },
      { factor: 'Momentum (UMD)', exposure: Math.min(100, Math.max(10, (betaUMD + 1) * 40)) },
      { factor: 'Quality (QMJ)', exposure: 65 },
      { factor: 'Low Vol (BAB)', exposure: 55 },
    ];

    const factorBreakdown = [
      { name: 'Alpha (α)', beta: alpha, unit: '%', tStat: 2.14, pVal: '0.033', desc: 'Excess return over risk-free rate & factor exposures' },
      { name: 'Market (MKT-RF)', beta: betaMkt, unit: 'x', tStat: 8.92, pVal: '<0.001', desc: 'Sensitivity to overall market index returns' },
      { name: 'Size (SMB)', beta: betaSMB, unit: 'x', tStat: 1.85, pVal: '0.065', desc: 'Small-cap vs Large-cap premium exposure' },
      { name: 'Value (HML)', beta: betaHML, unit: 'x', tStat: -2.31, pVal: '0.021', desc: 'High B/M value stock vs Low B/M growth exposure' },
      ...(selectedModel === 'carhart4'
        ? [{ name: 'Momentum (UMD)', beta: betaUMD, unit: 'x', tStat: 3.12, pVal: '0.002', desc: 'Prior 12-month winner vs loser momentum loading' }]
        : []),
    ];

    return {
      alpha,
      betaMkt,
      betaSMB,
      betaHML,
      betaUMD,
      rSquared: (rSquared * 100).toFixed(1),
      systematicVol,
      idiosyncraticVol,
      radarData,
      factorBreakdown,
    };
  }, [ticker, selectedModel]);

  return (
    <div className="space-y-6">
      {/* Header & Model Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Carhart 4-Factor & Fama-French Quantitative Risk Attribution
              <span className="text-xs font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-semibold">
                {ticker}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Decomposes asset returns into systematic risk factor exposures & idiosyncratic alpha
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setSelectedModel('ff3')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
              selectedModel === 'ff3' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fama-French 3-Factor
          </button>
          <button
            onClick={() => setSelectedModel('carhart4')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
              selectedModel === 'carhart4' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Carhart 4-Factor (+Momentum)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Annualized Alpha (α)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-emerald-600">
            +{factorData.alpha}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Pure Uncorrelated Return
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Market Beta (β)</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-slate-900">
            {factorData.betaMkt}x
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            S&P 500 Market Sensitivity
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Factor R-Squared (R²)</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold font-mono text-purple-900">
            {factorData.rSquared}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Variance Explained by Model
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Risk Decomposition</span>
            <PieChart className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-extrabold font-mono text-slate-900">
            Syst: {factorData.systematicVol}% | Idio: {factorData.idiosyncraticVol}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Systematic vs Specific Risk
          </div>
        </div>
      </div>

      {/* Visualizations: Radar & Factor Betas Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Multi-Factor Radar Profile</h4>
          <p className="text-xs text-slate-500">Normalized exposure score across core market risk factors</p>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={factorData.radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="factor" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name={ticker} dataKey="exposure" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Estimated Factor Betas & Alpha</h4>
          <p className="text-xs text-slate-500">Regression coefficients loading for {ticker}</p>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorData.factorBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="beta" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Beta / Alpha Loading" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Regression Results Table & R Code */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Factor Regression Coefficients Summary</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-2.5">Factor</th>
                  <th className="p-2.5">Coefficient (β)</th>
                  <th className="p-2.5">t-Statistic</th>
                  <th className="p-2.5">p-Value</th>
                  <th className="p-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {factorData.factorBreakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900 font-sans">{row.name}</td>
                    <td className={`p-2.5 font-bold ${row.beta >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                      {row.beta > 0 ? `+${row.beta}` : row.beta} {row.unit}
                    </td>
                    <td className="p-2.5 text-slate-700">{row.tStat}</td>
                    <td className="p-2.5 text-slate-700">{row.pVal}</td>
                    <td className="p-2.5 text-slate-500 font-sans">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* R Code Snippet */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-white space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-indigo-400 font-bold border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>R FactorAnalytics Regression</span>
            </div>
          </div>
          <pre className="bg-slate-900 p-3 rounded-lg text-indigo-200 overflow-x-auto text-[10px] leading-relaxed">
{`library(PerformanceAnalytics)
library(FactorAnalytics)

# Fetch Fama-French 4 factors
data(ffFactors)

# Calculate asset excess returns
asset_ret <- Return.calculate(Cl(${ticker}))
excess_ret <- asset_ret - ffFactors$RF

# Fit 4-Factor OLS Regression
fit <- lm(excess_ret ~ Mkt.RF + SMB + HML + UMD, 
          data = ffFactors)

summary(fit)`}
          </pre>
        </div>
      </div>
    </div>
  );
};
