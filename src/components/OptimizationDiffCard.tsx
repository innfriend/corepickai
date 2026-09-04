import React from 'react';
import { 
  TrendingDown, 
  Zap, 
  DollarSign, 
  Cpu, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { ConceptTooltip } from './ConceptTooltip';

interface OptimizationDiffCardProps {
  modelName: string;
  baseline: {
    precision: string;
    vramGb: number;
    latencyMs: number;
    throughputFps: number;
    costPerMillion: number;
    hardwareName: string;
  };
  optimized: {
    precision: string;
    vramGb: number;
    latencyMs: number;
    throughputFps: number;
    costPerMillion: number;
    hardwareName: string;
  };
  plainEnglishVerdict?: string;
}

export const OptimizationDiffCard: React.FC<OptimizationDiffCardProps> = ({
  modelName,
  baseline,
  optimized,
  plainEnglishVerdict
}) => {
  const bVram = baseline?.vramGb ?? 16;
  const oVram = optimized?.vramGb ?? 4.2;
  const bLatency = baseline?.latencyMs ?? 25.0;
  const oLatency = optimized?.latencyMs ?? 8.0;
  const bThroughput = baseline?.throughputFps ?? 40;
  const oThroughput = optimized?.throughputFps ?? 120;
  const bCost = typeof baseline?.costPerMillion === 'number' ? baseline.costPerMillion : 0.45;
  const oCost = typeof optimized?.costPerMillion === 'number' ? optimized.costPerMillion : 0.12;

  const vramSavingsPct = Math.round(((bVram - oVram) / Math.max(0.01, bVram)) * 100);
  const speedupFactor = (bLatency / Math.max(0.01, oLatency)).toFixed(1);
  const latencyReductionPct = Math.round(((bLatency - oLatency) / Math.max(0.01, bLatency)) * 100);
  const throughputGainPct = Math.round(((oThroughput - bThroughput) / Math.max(0.01, bThroughput)) * 100);
  const costSavingsPct = Math.round(((bCost - oCost) / Math.max(0.01, bCost)) * 100);

  const defaultVerdict = `By applying AWQ 4-bit quantization and SwiGLU kernel fusion, ${modelName || 'the model'} memory footprint drops by ${vramSavingsPct}%. The model now comfortably fits on a single ${optimized?.hardwareName || 'accelerator'} with a ${speedupFactor}x latency reduction, slashing monthly cloud GPU costs by ${costSavingsPct}%.`;

  return (
    <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <span>Optimization Impact (Before vs. After)</span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                {speedupFactor}x Faster
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Tangible hardware, memory, speed, and cloud cost metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Target: <strong className="text-white">{optimized.hardwareName}</strong></span>
        </div>
      </div>

      {/* 4 Metric Dials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: VRAM Memory */}
        <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>VRAM Memory</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              -{vramSavingsPct}%
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1 font-mono">
            <div className="text-xs text-slate-500 line-through">{bVram} GB ({baseline?.precision || 'FP16'})</div>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <div className="text-base font-bold text-emerald-400">{oVram} GB ({optimized?.precision || 'INT8'})</div>
          </div>
          <div className="text-[10px] text-slate-400 font-sans">
            Fits inside standard consumer/workstation GPUs.
          </div>
        </div>

        {/* Metric 2: P99 Latency */}
        <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <ConceptTooltip conceptKey="ttft">P99 Latency</ConceptTooltip>
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
              {speedupFactor}x Speedup
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1 font-mono">
            <div className="text-xs text-slate-500 line-through">{bLatency} ms</div>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <div className="text-base font-bold text-amber-300">{oLatency} ms</div>
          </div>
          <div className="text-[10px] text-slate-400 font-sans">
            Compressed latency under sub-20ms interactive SLAs.
          </div>
        </div>

        {/* Metric 3: Throughput */}
        <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Throughput</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              +{throughputGainPct}%
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1 font-mono">
            <div className="text-xs text-slate-500 line-through">{bThroughput} FPS</div>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <div className="text-base font-bold text-cyan-300">{oThroughput} FPS</div>
          </div>
          <div className="text-[10px] text-slate-400 font-sans">
            Continuous batching & kernel register reuse.
          </div>
        </div>

        {/* Metric 4: Cloud TCO Cost */}
        <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <ConceptTooltip conceptKey="tco">Cost / 1M</ConceptTooltip>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              -{costSavingsPct}% Cost
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1 font-mono">
            <div className="text-xs text-slate-500 line-through">${bCost.toFixed(2)}</div>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <div className="text-base font-bold text-emerald-400">${oCost.toFixed(2)}</div>
          </div>
          <div className="text-[10px] text-slate-400 font-sans">
            Direct monthly infrastructure cloud bill savings.
          </div>
        </div>
      </div>

      {/* Plain-English Executive Summary Box */}
      <div className="bg-[#07090E] border border-cyan-950 rounded-2xl p-4 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wide">
            Plain-English Impact & Hardware Sizing Verdict
          </h4>
          <p className="text-xs text-slate-200 font-sans leading-relaxed">
            {plainEnglishVerdict || defaultVerdict}
          </p>
        </div>
      </div>
    </div>
  );
};
