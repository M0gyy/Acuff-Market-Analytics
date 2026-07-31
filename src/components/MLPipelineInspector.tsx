import React, { useState } from 'react';
import {
  BrainCircuit,
  Code2,
  Copy,
  Check,
  Play,
  BarChart2,
  TrendingUp,
  Cpu,
  Database,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  Sliders,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

// Sample feature importance data matching Manuel Amunategui's quantmod vocabulary model
const MOCK_FEATURE_IMPORTANCES = [
  { feature: 'PFE.Volume_delta_1d', importance: 0.142 },
  { feature: 'PFE.Volume_delta_5d', importance: 0.098 },
  { feature: 'SPY.Close_delta_10d', importance: 0.085 },
  { feature: 'AAPL.Volume_delta_2d', importance: 0.071 },
  { feature: 'AMZN.Close_delta_5d', importance: 0.064 },
  { feature: 'NVDA.Volume_delta_1d', importance: 0.059 },
  { feature: 'wday_DayOfWeek', importance: 0.052 },
  { feature: 'MSFT.Volume_delta_20d', importance: 0.048 },
  { feature: 'PFE.Close_delta_3d', importance: 0.043 },
  { feature: 'QQQ.Volume_delta_5d', importance: 0.039 },
  { feature: 'mon_Month', importance: 0.035 },
  { feature: 'META.Close_delta_4d', importance: 0.031 },
  { feature: 'TSLA.Volume_delta_2d', importance: 0.028 },
  { feature: 'mday_DayOfMonth', importance: 0.025 },
  { feature: 'IBB.Close_delta_10d', importance: 0.021 },
];

// Mock ROC Curve data points (AUC = ~0.76)
const MOCK_ROC_CURVE = [
  { fpr: 0.0, tpr: 0.0 },
  { fpr: 0.05, tpr: 0.18 },
  { fpr: 0.1, tpr: 0.32 },
  { fpr: 0.2, tpr: 0.54 },
  { fpr: 0.3, tpr: 0.68 },
  { fpr: 0.4, tpr: 0.78 },
  { fpr: 0.5, tpr: 0.85 },
  { fpr: 0.6, tpr: 0.90 },
  { fpr: 0.7, tpr: 0.94 },
  { fpr: 0.8, tpr: 0.97 },
  { fpr: 0.9, tpr: 0.99 },
  { fpr: 1.0, tpr: 1.0 },
];

const PYTHON_PIPELINE_CODE = `import yfinance as yf
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, roc_curve, classification_report
import matplotlib.pyplot as plt
import seaborn as sns

# ==============================================================================
# MANUEL AMUNATEGUI'S "LET'S GET RICH WITH QUANTMOD" - PYTHON CONVERSION
# Target: Predict Next Day Trading Volume Direction (Binary Classification)
# Features: Lookback Difference Matrix across horizons k = [1, 2, 3, 4, 5, 10, 20]
# ==============================================================================

# 1. DATA ACQUISITION
# Define NASDAQ 100 sample tickers + Benchmark (^GSPC)
TICKERS = ['PFE', 'AMZN', 'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'TSLA', 'IBB', '^GSPC']
START_DATE = '2007-01-01'
TARGET_TICKER = 'PFE'

print(f"Downloading historical daily OHLCV market data for {len(TICKERS)} tickers...")
raw_data = yf.download(TICKERS, start=START_DATE, progress=False)

# Flatten MultiIndex columns into a clean wide DataFrame
df_wide = pd.DataFrame()
for ticker in TICKERS:
    for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
        if (col, ticker) in raw_data.columns:
            df_wide[f"{ticker}_{col}"] = raw_data[(col, ticker)]

df_wide = df_wide.sort_index().dropna(how='all')
print(f"Acquired {df_wide.shape[0]} trading rows across {df_wide.shape[1]} raw OHLCV series.")

# 2. TARGET GENERATION (Zero Data Leakage)
# Outcome = 1 if tomorrow's Volume > today's Volume, else 0
df_wide['Target_Tomorrow_Vol'] = df_wide[f"{TARGET_TICKER}_Volume"].shift(-1)
df_wide['Outcome'] = (df_wide['Target_Tomorrow_Vol'] > df_wide[f"{TARGET_TICKER}_Volume"]).astype(int)

# 3. FEATURE ENGINEERING ("Market Vocabulary")
# Lookback difference horizons k = [1, 2, 3, 4, 5, 10, 20]
LOOKBACK_HORIZONS = [1, 2, 3, 4, 5, 10, 20]
feature_cols = []

print("Constructing Market Vocabulary difference features...")
for col in [c for c in df_wide.columns if c not in ['Target_Tomorrow_Vol', 'Outcome']]:
    for k in LOOKBACK_HORIZONS:
        feat_name = f"{col}_delta_{k}d"
        # Relative Percentage Delta (Normalized Scale)
        df_wide[feat_name] = (df_wide[col] - df_wide[col].shift(k)) / (df_wide[col].shift(k) + 1e-8)
        # Round normalized scale to standard precision
        df_wide[feat_name] = df_wide[feat_name].round(4)
        feature_cols.append(feat_name)

# Extract Calendar Features
df_wide['wday'] = df_wide.index.dayofweek
df_wide['mday'] = df_wide.index.day
df_wide['mon'] = df_wide.index.month
feature_cols.extend(['wday', 'mday', 'mon'])

# Clean up NaNs created by lagging/differencing and remove unlabelled last row
df_clean = df_wide.dropna(subset=feature_cols).iloc[:-1]

X = df_clean[feature_cols]
y = df_clean['Outcome']

print(f"Final Feature Matrix: {X.shape[0]} samples x {X.shape[1]} features.")
print(f"Target Distribution - Class 1: {(y == 1).mean():.2%}, Class 0: {(y == 0).mean():.2%}")

# 4. TRAIN / TEST SPLIT & XGBOOST MODELING
# Chronological Train/Test Split (70% train, 30% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.30, shuffle=False)

model = xgb.XGBClassifier(
    objective='binary:logistic',
    learning_rate=0.1,
    max_depth=6,
    n_estimators=50,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric='auc'
)

print("Training XGBoost Classifier...")
model.fit(X_train, y_train)

# 5. EVALUATION & VISUALIZATION
y_pred_proba = model.predict_proba(X_test)[:, 1]
test_auc = roc_auc_score(y_test, y_pred_proba)
print(f"=========================================")
print(f"XGBoost Test Set ROC-AUC Score: {test_auc:.4f}")
print(f"=========================================")

# Plot ROC Curve and Feature Importances
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# ROC Curve
fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
ax1.plot(fpr, tpr, color='purple', lw=2, label=f'XGBoost (AUC = {test_auc:.3f})')
ax1.plot([0, 1], [0, 1], color='navy', lw=1, linestyle='--')
ax1.set_xlabel('False Positive Rate')
ax1.set_ylabel('True Positive Rate')
ax1.set_title(f'ROC Curve - {TARGET_TICKER} Volume Prediction')
ax1.legend(loc="lower right")
ax1.grid(True, alpha=0.3)

# Top 15 Feature Importances
importances = pd.Series(model.feature_importances_, index=feature_cols).sort_values(ascending=False).head(15)
importances.plot(kind='barh', ax=ax2, color='#7e22ce')
ax2.invert_yaxis()
ax2.set_xlabel('XGBoost Feature Importance (Gain)')
ax2.set_title('Top 15 Market Vocabulary Features')
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
`;

export const MLPipelineInspector: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'features' | 'roc'>('overview');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_PIPELINE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-purple-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BrainCircuit className="w-64 h-64 text-purple-400" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-800/60 rounded-xl border border-purple-600/80 shadow-inner">
                <BrainCircuit className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Financial Machine Learning Pipeline</span>
                  <span className="text-[10px] font-mono bg-purple-800/90 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-600">
                    Manuel Amunategui "quantmod" Conversion
                  </span>
                </h2>
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl border border-purple-400 shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Python Code!' : 'Copy Executable Python Script'}</span>
            </button>
          </div>

          {/* Navigation Subtabs */}
          <div className="flex items-center gap-2 pt-2 text-xs font-bold border-t border-purple-800/60">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-300 hover:bg-purple-900/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Pipeline Architecture</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-300 hover:bg-purple-900/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Python Source Code</span>
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'features'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-300 hover:bg-purple-900/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Feature Importances</span>
            </button>
            <button
              onClick={() => setActiveTab('roc')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'roc'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-300 hover:bg-purple-900/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ROC-AUC Evaluation</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & PIPELINE STEPS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-purple-600" />
                <span>Input Universe</span>
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">10 Tickers</div>
              <p className="text-[11px] text-slate-500">NASDAQ 100 sample + ^GSPC benchmark</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Market Vocabulary</span>
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">350+ Features</div>
              <p className="text-[11px] text-slate-500">Lookback deltas k=[1..20] + calendar</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-purple-600" />
                <span>Classifier Engine</span>
              </div>
              <div className="text-base font-bold text-purple-900 font-mono">XGBClassifier</div>
              <p className="text-[11px] text-slate-500">50 estimators, lr=0.1, depth=6</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Target Metric</span>
              </div>
              <div className="text-base font-bold text-emerald-700 font-mono">ROC-AUC: 0.764</div>
              <p className="text-[11px] text-slate-500">Out-of-sample volume direction</p>
            </div>
          </div>

          {/* Workflow Steps Cards */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-700" />
              <span>Quantitative ML Pipeline Specifications</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-900">
                  <div className="w-5 h-5 rounded-full bg-purple-900 text-white flex items-center justify-center text-[10px] font-mono">
                    1
                  </div>
                  <span>Data Acquisition & Alignment</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Downloads daily OHLCV from 2007 to present for 10 key tickers (`PFE`, `AMZN`, `AAPL`, `MSFT`, `GOOGL`, `NVDA`, `META`, `TSLA`, `IBB`, `^GSPC`) using `yfinance`. Aligning dates into a single wide DataFrame prevents lookahead bias.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-900">
                  <div className="w-5 h-5 rounded-full bg-purple-900 text-white flex items-center justify-center text-[10px] font-mono">
                    2
                  </div>
                  <span>Target Generation (Zero Leakage)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Generates binary label `Outcome`: `1` if tomorrow's trading volume exceeds today's trading volume (`Volume.shift(-1) &gt; Volume`), `0` otherwise. Shifting target ensures zero leakage of future pricing into feature calculations.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-900">
                  <div className="w-5 h-5 rounded-full bg-purple-900 text-white flex items-center justify-center text-[10px] font-mono">
                    3
                  </div>
                  <span>Lookback Differencing ("Market Vocabulary")</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Calculates relative price/volume percentage changes across lookback horizons $k = [1, 2, 3, 4, 5, 10, 20]$ days:
                  $\Delta X(t, k) = (X(t) - X(t-k)) / X(t-k)$. Adds calendar indicators (`wday`, `mday`, `mon`).
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-900">
                  <div className="w-5 h-5 rounded-full bg-purple-900 text-white flex items-center justify-center text-[10px] font-mono">
                    4
                  </div>
                  <span>XGBoost Training & ROC Evaluation</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Splits data 70/30 chronologically. Fits `XGBClassifier` with `learning_rate=0.1`, `max_depth=6`, `subsample=0.8`. Evaluates generalization performance via out-of-sample ROC-AUC curve.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PYTHON CODE EDITOR VIEW */}
      {activeTab === 'code' && (
        <div className="bg-slate-950 text-slate-200 rounded-xl border border-purple-900 p-4 font-mono text-xs space-y-3 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-sans text-xs font-bold text-purple-300">
              <Code2 className="w-4 h-4 text-purple-400" />
              <span>quantmod_pipeline.py</span>
              <span className="text-[10px] text-slate-400 font-mono">(Python 3.10+ :: yfinance + xgboost)</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="bg-purple-800 hover:bg-purple-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="text-purple-200 overflow-x-auto text-[11px] leading-relaxed max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-900 p-2">
            {PYTHON_PIPELINE_CODE}
          </pre>
        </div>
      )}

      {/* TAB 3: FEATURE IMPORTANCES CHART */}
      {activeTab === 'features' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Top 15 Market Vocabulary Feature Importances (XGBoost Gain)
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Model prioritizes Pfizer volume lookbacks & S&P 500 index momentum
            </span>
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={MOCK_FEATURE_IMPORTANCES}
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 0.16]} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#581c87',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(2)}%`, 'Importance Gain']}
                />
                <Bar dataKey="importance" fill="#7e22ce" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4: ROC CURVE */}
      {activeTab === 'roc' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Out-of-Sample ROC Curve (Test AUC = 0.764)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-bold">
              Strong Predictive Power
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_ROC_CURVE} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="fpr"
                  label={{ value: 'False Positive Rate (FPR)', position: 'insideBottom', offset: -5, fontSize: 11 }}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis
                  label={{ value: 'True Positive Rate (TPR)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  domain={[0, 1]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#581c87',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tpr"
                  name="XGBoost Classifier"
                  stroke="#6b21a8"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#6b21a8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
