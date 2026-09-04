import React, { useState } from 'react';
import { 
  Zap, 
  Activity, 
  Cpu, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Play, 
  Plus, 
  ChevronRight, 
  Server, 
  Network, 
  Sliders, 
  Code2, 
  SlidersHorizontal, 
  BookOpen, 
  Sparkles,
  Box,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  Info,
  FileCode,
  Database
} from 'lucide-react';
import { MODEL_CATALOG, SAMPLE_OPTIMIZATION_JOBS, HARDWARE_CATALOG } from '../data/mockData';
import { OptimizationJob, OptimizationOpportunity } from '../types';
import { MeasurementBadge } from './MeasurementBadge';
import { MetricCard } from './MetricCard';
import { MethodologyModal } from './MethodologyModal';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onSelectJob: (job: OptimizationJob) => void;
  onOpenWizardWithModel: (modelId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectJob,
  onOpenWizardWithModel,
}) => {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [activeModelId, setActiveModelId] = useState<string>(MODEL_CATALOG[0].id); // Llama-3-8B
  const [activeHwId, setActiveHwId] = useState<string>(HARDWARE_CATALOG[2].id); // RTX 4090

  const activeModel = MODEL_CATALOG.find(m => m.id === activeModelId) || MODEL_CATALOG[0];
  const activeHw = HARDWARE_CATALOG.find(h => h.id === activeHwId) || HARDWARE_CATALOG[0];

  const optimizationOpportunities: OptimizationOpportunity[] = [
    {
      id: 'opt-1',
      impact: 'HIGH IMPACT',
      title: 'Reduce Weight Precision (AWQ INT4)',
      description: 'Switching weights from FP16 (16.0 GB) to AWQ INT4 (4.0 GB) dramatically slashes DRAM traffic during token generation.',
      potentialGain: 'Potential ~50-75% VRAM Reduction & ~2.1× Throughput Boost',
      rationale: 'Autoregressive decoding is strictly memory-bandwidth bound at batch size = 1. Smaller weights mean faster DRAM byte transfer per token.',
      caveat: 'Quantization accuracy must be verified on calibration/evaluation dataset before production deployment.',
      actionCta: 'Simulate Quantization & MMLU Impact',
      actionTargetView: 'app-quant-simulator'
    },
    {
      id: 'opt-2',
      impact: 'MEDIUM IMPACT',
      title: 'Increase Batch Concurrency (Batch 4 - 16)',
      description: 'Batching parallel requests amortizes model weight loading across multiple output tokens simultaneously.',
      potentialGain: 'Potential ~3-4× Total Token Throughput (tok/s)',
      rationale: 'Shifts arithmetic intensity from memory-bound region toward the hardware roofline ridge point.',
      caveat: 'Increases per-request latency (TTFT / queue wait) slightly as concurrency scales.',
      actionCta: 'Run Batch Sweep Analysis',
      actionTargetView: 'app-results'
    },
    {
      id: 'opt-3',
      impact: 'MEDIUM IMPACT',
      title: 'Enable PagedAttention & Fused FlashAttention-2',
      description: 'Zero memory fragmentation for dynamic KV caches and fused $QKV$ attention kernel execution.',
      potentialGain: 'Potential ~20-35% Memory Traffic Reduction',
      rationale: 'Eliminates redundant intermediate attention tensor materialization in DRAM.',
      caveat: 'Requires modern CUDA Tensor Core architecture (Compute Capability ≥ 8.0).',
      actionCta: 'Generate vLLM / Triton Config',
      actionTargetView: 'app-k8s-generator'
    },
    {
      id: 'opt-4',
      impact: 'LOW IMPACT',
      title: 'Upgrade Compute TFLOPs (Without More Bandwidth)',
      description: 'Purchasing higher arithmetic TFLOPs without increasing memory bus bandwidth provides negligible decode acceleration.',
      potentialGain: 'Limited benefit for autoregressive decode step',
      rationale: 'Workload arithmetic intensity (~0.95 FLOPs/Byte) is far below hardware ridge points. Tensor Cores remain memory starved.',
      caveat: 'Prefill chunk phase (TTFT) does benefit from higher compute capacity.',
      actionCta: 'Inspect Roofline Bound Classification',
      actionTargetView: 'app-inspector'
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 select-none">
      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0B101B] border border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              Inference Performance Intelligence
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Hardware-Aware Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Active Workload: <strong className="text-white">{activeModel.name}</strong> on <strong className="text-cyan-300">{activeHw.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsMethodologyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#131B2E] hover:bg-[#1A233A] border border-[#1E293B] text-xs font-mono text-slate-300 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Methodology</span>
          </button>

          <button
            onClick={() => onNavigate('app-analyze')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] text-xs font-bold font-mono shadow-lg shadow-cyan-500/20 cursor-pointer transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>New Profiling Run</span>
          </button>
        </div>
      </div>

      {/* Primary Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Estimated Decode Throughput"
          value="~35.7"
          unit="tok/s"
          status="CALIBRATED_ESTIMATE"
          subtitle="Batch Size = 1 @ 4K Context"
          trend={{ value: "Calibrated to vLLM", isPositive: true }}
          icon={Activity}
          onExplainMethodology={() => setIsMethodologyOpen(true)}
        />

        <MetricCard
          label="Estimated TTFT (Prefill Latency)"
          value="~310"
          unit="ms"
          status="ESTIMATED"
          subtitle="Prompt Length: 512 tokens"
          trend={{ value: "Compute Bound", isPositive: true }}
          icon={Clock}
          onExplainMethodology={() => setIsMethodologyOpen(true)}
        />

        <MetricCard
          label="Estimated VRAM Footprint"
          value="~9.0"
          unit="GB"
          status="ESTIMATED"
          subtitle="Weights + 4K KV-Cache (24GB device)"
          trend={{ value: "37.5% capacity", isPositive: true }}
          icon={Layers}
          onExplainMethodology={() => setIsMethodologyOpen(true)}
        />

        <MetricCard
          label="Estimated Cloud TCO"
          value="$0.48"
          unit="/ 1M tokens"
          status="ASSUMPTION"
          subtitle="$0.74/hr instance rate @ 70% load"
          trend={{ value: "Workstation tier", isPositive: true }}
          icon={DollarSign}
          onExplainMethodology={() => setIsMethodologyOpen(true)}
        />
      </div>

      {/* Primary Hardware Bound & Roofline Status Alert */}
      <div className="p-5 rounded-2xl bg-[#0D1322] border border-amber-800/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase text-amber-300">
              Primary Bottleneck: Memory Bandwidth Bound
            </span>
            <MeasurementBadge status="ESTIMATED" size="sm" />
          </div>
          <button
            onClick={() => onNavigate('app-inspector')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Roofline Inspector →</span>
          </button>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed space-y-1">
          <p>
            <strong className="text-white font-mono">Why?</strong> Arithmetic intensity during decode (<code className="text-cyan-300 font-mono">~0.95 FLOPs/Byte</code>) is significantly below the hardware ridge point (<code className="text-cyan-300 font-mono">327.6 FLOPs/Byte</code>). The GPU spends idle cycles waiting for weights to stream from GDDR6X memory. Increasing compute capacity is unlikely to improve performance unless memory traffic is reduced.
          </p>
        </div>
      </div>

      {/* Actionable Optimization Opportunities Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Actionable Optimization Opportunities
            </h3>
            <p className="text-xs text-slate-400">
              Analytical recommendations to accelerate throughput and reduce cost (Potential impacts, not guarantees).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {optimizationOpportunities.map((opp) => (
            <div 
              key={opp.id}
              className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] hover:border-cyan-500/40 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    opp.impact === 'HIGH IMPACT'
                      ? 'bg-red-950/70 text-red-300 border-red-800/60'
                      : opp.impact === 'MEDIUM IMPACT'
                      ? 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {opp.impact}
                  </span>
                  <MeasurementBadge status="ESTIMATED" size="sm" />
                </div>

                <h4 className="text-sm font-bold font-mono text-white">
                  {opp.title}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {opp.description}
                </p>

                <div className="p-2.5 rounded-lg bg-[#070A12] border border-[#1E293B] text-[11px] text-emerald-400 font-mono">
                  ✨ {opp.potentialGain}
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  <strong>Caveat:</strong> {opp.caveat}
                </p>
              </div>

              {opp.actionCta && opp.actionTargetView && (
                <div className="pt-2 border-t border-[#1E293B]">
                  <button
                    onClick={() => onNavigate(opp.actionTargetView!)}
                    className="w-full py-2 rounded-xl bg-[#11192C] hover:bg-[#1A233A] text-xs font-mono font-bold text-cyan-300 border border-cyan-800/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{opp.actionCta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Engineering Tooling Hub */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Sizing & Production Architecture Tools</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Analytical & Empirical Suite</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            onClick={() => onNavigate('app-tp-sizer')}
            className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] hover:border-cyan-500/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex justify-between items-center">
              <Server className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                TP = 1..8
              </span>
            </div>
            <h4 className="text-sm font-bold font-mono text-white group-hover:text-cyan-300">
              Multi-GPU TP Sizer
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculate tensor parallel VRAM sharding, NVLink all-reduce latency, and launch flags.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('app-hf-parser')}
            className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] hover:border-cyan-500/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex justify-between items-center">
              <FileCode className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <MeasurementBadge status="ESTIMATED" size="sm" />
            </div>
            <h4 className="text-sm font-bold font-mono text-white group-hover:text-indigo-300">
              HF config.json Parser
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extract exact layer dimensions, GQA ratios, parameter counts, and precision memory bounds.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('app-kv-sizer')}
            className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] hover:border-cyan-500/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex justify-between items-center">
              <Database className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                FP8 / INT4
              </span>
            </div>
            <h4 className="text-sm font-bold font-mono text-white group-hover:text-emerald-300">
              KV-Cache & Context Sizer
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Model long-context growth, PagedAttention fragmentation, and 4× batch concurrency gains.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Diagnostics & Benchmarks Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('app-quant-simulator')}
          className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] hover:border-cyan-500/50 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex justify-between items-center">
            <Sliders className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <MeasurementBadge status="ESTIMATED" size="sm" />
          </div>
          <h4 className="text-sm font-bold font-mono text-white group-hover:text-cyan-300">
            Quantization & Accuracy Sim
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Layer-by-layer FP8 / INT8 / INT4 mixed precision and MMLU delta simulation.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('app-comparator')}
          className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] hover:border-cyan-500/50 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex justify-between items-center">
            <Activity className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <MeasurementBadge status="CALIBRATED_ESTIMATE" size="sm" />
          </div>
          <h4 className="text-sm font-bold font-mono text-white group-hover:text-emerald-300">
            Multi-Chip A/B Streamer
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Live token-by-token comparison across NVIDIA, Apple, Qualcomm, and AMD.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('app-k8s-generator')}
          className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] hover:border-cyan-500/50 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex justify-between items-center">
            <Box className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono text-slate-400">Exportable</span>
          </div>
          <h4 className="text-sm font-bold font-mono text-white group-hover:text-indigo-300">
            1-Click K8s & Docker
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generated production manifests for vLLM, TensorRT-LLM, Triton, and ONNX.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('app-benchmarks')}
          className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] hover:border-cyan-500/50 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex justify-between items-center">
            <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <MeasurementBadge status="MEASURED" size="sm" />
          </div>
          <h4 className="text-sm font-bold font-mono text-white group-hover:text-cyan-300">
            Verified Physical Benchmarks
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Compare analytical predictions with real GPU hardware execution telemetry.
          </p>
        </div>
      </div>
    </div>
  );
};
