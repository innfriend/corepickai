import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  RotateCw, 
  Cpu, 
  Database, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Server, 
  ArrowRight,
  ShieldAlert,
  GitPullRequest
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ProductionMonitorViewProps {
  onNavigate: (view: string) => void;
}

export const ProductionMonitorView: React.FC<ProductionMonitorViewProps> = ({ onNavigate }) => {
  const [telemetryHistory, setTelemetryHistory] = useState([
    { time: '14:00', tps: 840, ttft: 110, vramPct: 68, rps: 18 },
    { time: '14:05', tps: 920, ttft: 115, vramPct: 70, rps: 22 },
    { time: '14:10', tps: 890, ttft: 112, vramPct: 69, rps: 20 },
    { time: '14:15', tps: 1150, ttft: 140, vramPct: 78, rps: 28 },
    { time: '14:20', tps: 1420, ttft: 185, vramPct: 88, rps: 36 },
    { time: '14:25', tps: 1680, ttft: 220, vramPct: 94, rps: 45 },
  ]);

  const [hasWorkloadDrift, setHasWorkloadDrift] = useState<boolean>(true);

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[#1E293B] bg-[#0A0D14]/80 backdrop-blur px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                PRODUCTION MONITOR & CONTINUAL OPTIMIZATION
              </span>
              <span className="text-xs font-mono text-slate-400">
                Live Inference Telemetry & Drift Detection
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              Production Telemetry & Drift Monitor
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-2xl">
              Continuously observe production token metrics, detect prompt distribution shifts, and automatically trigger re-optimization pipelines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('app-optimizer')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg cursor-pointer"
            >
              <span>Trigger Re-Optimization</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ACTIVE WORKLOAD DRIFT ALERT BOX */}
        {hasWorkloadDrift && (
          <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-[#0D1322] p-5 rounded-2xl border border-amber-600/60 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse-slow">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-black">
                  WORKLOAD SHIFT DETECTED
                </span>
                <span className="text-xs font-mono text-amber-300 font-semibold">
                  Prompt Length Drift (+340% increase)
                </span>
              </div>
              <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">
                Average prompt length shifted from 512 tokens to 2,800 tokens over the last 30 minutes. VRAM usage reached 94% on NVIDIA H100 SXM5 nodes. Current KV-cache allocation will exhaust memory under peak traffic.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                onClick={() => onNavigate('app-optimizer')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs font-mono rounded-xl shadow-lg cursor-pointer"
              >
                <span>Re-Optimize for New Workload</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* LIVE METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="bg-[#0D1322] p-4 rounded-2xl border border-[#1E293B]">
            <span className="text-[10px] text-slate-400 block">Sustained Throughput:</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              1,680 <span className="text-xs font-normal text-slate-500">tok/s</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
              ↑ 42% over baseline
            </span>
          </div>

          <div className="bg-[#0D1322] p-4 rounded-2xl border border-[#1E293B]">
            <span className="text-[10px] text-slate-400 block">Current TTFT (p95):</span>
            <div className="text-xl font-extrabold text-amber-400 mt-1">
              220 <span className="text-xs font-normal text-slate-500">ms</span>
            </div>
            <span className="text-[10px] text-amber-400 font-semibold mt-1 block">
              Approaching SLO ceiling (250ms)
            </span>
          </div>

          <div className="bg-[#0D1322] p-4 rounded-2xl border border-[#1E293B]">
            <span className="text-[10px] text-slate-400 block">Cluster VRAM Capacity:</span>
            <div className="text-xl font-extrabold text-rose-400 mt-1">
              94.2%
            </div>
            <span className="text-[10px] text-rose-400 font-semibold mt-1 block">
              KV-cache eviction risk
            </span>
          </div>

          <div className="bg-[#0D1322] p-4 rounded-2xl border border-[#1E293B]">
            <span className="text-[10px] text-slate-400 block">Active Serving Replicas:</span>
            <div className="text-xl font-extrabold text-cyan-300 mt-1">
              8 Replicas
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              8x NVIDIA H100 SXM5
            </span>
          </div>
        </div>

        {/* TELEMETRY CHART */}
        <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Real-Time Inference Telemetry Stream
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Stream Active
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0D14', borderColor: '#27354F', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="tps" name="Aggregate tok/s" stroke="#10B981" fillOpacity={1} fill="url(#tpsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CONTINUAL RE-OPTIMIZATION PIPELINE DIAGRAM */}
        <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white uppercase tracking-wider">
                Automated Continual Optimization Architecture
              </h3>
            </div>
            <span className="text-slate-400">Zero-Downtime Traffic Migration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#07090E] rounded-xl border border-[#1E293B] space-y-1">
              <span className="text-cyan-400 font-bold block text-[10px]">STEP 1: TELEMETRY DRIFT</span>
              <p className="text-slate-300">CorePick sidecar monitors p95 TTFT, ITL, and average prompt tokens.</p>
            </div>
            <div className="p-3.5 bg-[#07090E] rounded-xl border border-[#1E293B] space-y-1">
              <span className="text-cyan-400 font-bold block text-[10px]">STEP 2: SIMULATION CHECK</span>
              <p className="text-slate-300">Analytical engine runs parameter search for the updated distribution.</p>
            </div>
            <div className="p-3.5 bg-[#07090E] rounded-xl border border-[#1E293B] space-y-1">
              <span className="text-cyan-400 font-bold block text-[10px]">STEP 3: CANARY DEPLOY</span>
              <p className="text-slate-300">Spin up new candidate pod (e.g. FP8 + Chunked Prefill) on 5% traffic.</p>
            </div>
            <div className="p-3.5 bg-[#07090E] rounded-xl border border-[#1E293B] space-y-1">
              <span className="text-cyan-400 font-bold block text-[10px]">STEP 4: FULL ROLLOUT</span>
              <p className="text-slate-300">If latency & cost objectives pass, migrate 100% traffic seamlessly.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
