import React, { useState } from 'react';
import { 
  Flame, 
  Layers, 
  Cpu, 
  Zap, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Play, 
  Check, 
  Terminal, 
  ShieldCheck, 
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { MODEL_CATALOG, HARDWARE_CATALOG } from '../data/mockData';

interface OptimizationLabViewProps {
  onNavigate: (view: string) => void;
  onOpenAdvisor?: (prompt?: string) => void;
}

interface OptimizationTrial {
  id: string;
  round: number;
  name: string;
  description: string;
  throughputTps: number;
  ttftMs: number;
  itlMs: number;
  vramGb: number;
  perplexityChangePct: number;
  correctnessPassed: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'TESTING';
}

export const OptimizationLabView: React.FC<OptimizationLabViewProps> = ({ onNavigate, onOpenAdvisor }) => {
  const [selectedModelId, setSelectedModelId] = useState<string>('meta-llama-3-8b');
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>('nvidia-h100-sxm');

  const [activeLoopStep, setActiveLoopStep] = useState<number>(0);
  const [isRunningExperiment, setIsRunningExperiment] = useState<boolean>(false);

  const [trials, setTrials] = useState<OptimizationTrial[]>([
    {
      id: 'trial-1',
      round: 1,
      name: 'Baseline Stock Weights (FP16)',
      description: 'Standard un-quantized weights, default PyTorch SDPA kernel, batch 8.',
      throughputTps: 118.4,
      ttftMs: 142.0,
      itlMs: 24.5,
      vramGb: 28.2,
      perplexityChangePct: 0.0,
      correctnessPassed: true,
      status: 'ACCEPTED'
    },
    {
      id: 'trial-2',
      round: 2,
      name: 'vLLM PagedAttention + RoPE Fusion',
      description: 'Continuous batching with virtual block allocation; fused Rotary Embeddings.',
      throughputTps: 246.8,
      ttftMs: 96.0,
      itlMs: 18.2,
      vramGb: 24.1,
      perplexityChangePct: +0.02,
      correctnessPassed: true,
      status: 'ACCEPTED'
    },
    {
      id: 'trial-3',
      round: 3,
      name: 'FP8 Weight + KV-Cache Compression',
      description: 'E4M3 per-tensor scales for linear weights; 8-bit dynamic cache.',
      throughputTps: 412.5,
      ttftMs: 64.2,
      itlMs: 11.4,
      vramGb: 16.8,
      perplexityChangePct: +0.14,
      correctnessPassed: true,
      status: 'ACCEPTED'
    }
  ]);

  const loopSteps = [
    { name: 'Profile Workload', desc: 'Identify memory vs compute bottleneck' },
    { name: 'Generate Candidate', desc: 'Synthesize fused kernels / precision' },
    { name: 'Correctness Test', desc: 'Validate Perplexity & token equivalence' },
    { name: 'Physical Benchmark', desc: 'Measure TTFT, ITL, & sustained TPS' },
    { name: 'Compare & Decide', desc: 'Keep if Pareto-superior; else revert' },
    { name: 'Iterate', desc: 'Explore next optimization layer' }
  ];

  const handleRunNewTrial = () => {
    setIsRunningExperiment(true);
    setActiveLoopStep(0);

    const stepInterval = setInterval(() => {
      setActiveLoopStep((prev) => {
        if (prev < loopSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setIsRunningExperiment(false);
          // Append new trial
          const newTrial: OptimizationTrial = {
            id: `trial-${trials.length + 1}`,
            round: trials.length + 1,
            name: 'Speculative Decoding (EAGLE Draft Model)',
            description: 'Draft-verify speculative decoding with 1-layer target token proposer.',
            throughputTps: 588.0,
            ttftMs: 68.0,
            itlMs: 6.8,
            vramGb: 18.4,
            perplexityChangePct: 0.0,
            correctnessPassed: true,
            status: 'ACCEPTED'
          };
          setTrials((curr) => [...curr, newTrial]);
          return 0;
        }
      });
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[#1E293B] bg-[#0A0D14]/80 backdrop-blur px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                COREPICK OPTIMIZATION LAB
              </span>
              <span className="text-xs font-mono text-slate-400">
                Empirical Configuration Loop & Search Orchestrator
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              Iterative Optimization Orchestrator
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-2xl">
              Systematic empirical tuning loop: Profile → Generate Candidate → Check Correctness → Benchmark → Compare → Keep or Reject → Iterate.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAdvisor?.('How does speculative decoding improve decode throughput while preserving correctness?')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#131B2E] hover:bg-[#1E293B] text-cyan-300 text-xs font-mono rounded-xl border border-[#27354F] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Ask Advisor</span>
            </button>
            <button
              onClick={() => onNavigate('app-optimizer')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg cursor-pointer"
            >
              <span>Global Optimizer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ROADMAP CALLOUT: KERNEL AUTOTUNING */}
        <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-[#0D1322] p-5 rounded-2xl border border-amber-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-black">
                COMING SOON
              </span>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Automated Kernel Autotuning Engine (CUDA, HIP, Triton)
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">
              CorePick is building an automated micro-kernel synthesis compiler that inspects slow FlashAttention, MLP, and MoE dispatch layers, generates customized Triton/CUDA block tiling templates, and validates exact mathematical equivalence against PyTorch baseline.
            </p>
          </div>
          <button
            onClick={() => onNavigate('app-docs')}
            className="px-3.5 py-2 bg-[#07090E] hover:bg-[#131B2E] text-amber-300 text-xs font-mono rounded-xl border border-amber-800/60 whitespace-nowrap self-start md:self-auto cursor-pointer"
          >
            Read Architecture Whitepaper
          </button>
        </div>

        {/* THE 6-STAGE OPTIMIZATION LOOP VISUALIZER */}
        <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Empirical Optimization Loop
            </h2>
            <button
              onClick={handleRunNewTrial}
              disabled={isRunningExperiment}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningExperiment ? 'Running Step...' : 'Execute Next Optimization Round'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {loopSteps.map((step, idx) => {
              const isActive = isRunningExperiment && activeLoopStep === idx;
              const isPassed = !isRunningExperiment || activeLoopStep > idx;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border font-mono transition-all ${
                    isActive
                      ? 'bg-amber-950/50 border-amber-500 shadow-md scale-102'
                      : (isPassed ? 'bg-[#07090E] border-[#27354F]' : 'bg-[#07090E]/50 border-[#1E293B] opacity-50')
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500 font-bold">STAGE 0{idx + 1}</span>
                    {isActive && <Activity className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                  </div>
                  <h4 className="text-xs font-bold text-white mb-0.5">{step.name}</h4>
                  <p className="text-[10px] text-slate-400 leading-tight">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* EXPERIMENT ROUNDS / TRIALS TABLE */}
        <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] overflow-hidden">
          <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Trial Progression History ({trials.length} Rounds Evaluated)
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              Total Speedup: {(trials[trials.length - 1].throughputTps / trials[0].throughputTps).toFixed(2)}x
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#07090E] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#1E293B]">
                <tr>
                  <th className="py-3 px-4">Round & Configuration</th>
                  <th className="py-3 px-3">Throughput</th>
                  <th className="py-3 px-3">TTFT (ms)</th>
                  <th className="py-3 px-3">ITL (ms)</th>
                  <th className="py-3 px-3">VRAM Footprint</th>
                  <th className="py-3 px-3">Correctness</th>
                  <th className="py-3 px-4 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {trials.map((t) => (
                  <tr key={t.id} className="hover:bg-[#131B2E]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#131B2E] text-slate-300 font-bold text-[10px] flex items-center justify-center">
                          R{t.round}
                        </span>
                        <div>
                          <p className="font-bold text-white">{t.name}</p>
                          <p className="text-[10px] text-slate-500">{t.description}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      {t.throughputTps.toFixed(1)} tok/s
                    </td>

                    <td className="py-3 px-3 text-cyan-300">
                      {t.ttftMs.toFixed(1)} ms
                    </td>

                    <td className="py-3 px-3 text-cyan-300">
                      {t.itlMs.toFixed(1)} ms/tok
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      {t.vramGb.toFixed(1)} GB
                    </td>

                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Pass ({t.perplexityChangePct >= 0 ? `+${t.perplexityChangePct}%` : `${t.perplexityChangePct}%`} PPL)
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        KEEP / ACCEPTED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
