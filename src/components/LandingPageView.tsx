import React, { useState } from 'react';
import { 
  Zap, 
  Cpu, 
  Activity, 
  GitCompare, 
  Flame, 
  Terminal, 
  Code2, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Server, 
  TrendingUp, 
  Sliders, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Maximize2,
  BookOpen,
  Users,
  DollarSign,
  Smartphone,
  Upload,
  GitMerge,
  Download,
  AlertTriangle,
  Database,
  Box,
  SlidersHorizontal,
  Mail
} from 'lucide-react';
import { HARDWARE_CATALOG, MODEL_CATALOG } from '../data/mockData';
import { MeasurementBadge } from './MeasurementBadge';
import { MethodologyModal } from './MethodologyModal';

interface LandingPageViewProps {
  onNavigate: (view: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onNavigate }) => {
  const [selectedHwIndex, setSelectedHwIndex] = useState(0);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  const sampleHws = [
    {
      tabLabel: 'Intel Gaudi 3',
      name: 'Intel Gaudi 3 AI Accelerator (128GB HBM2e)',
      vendor: 'Intel',
      type: 'Data Center Accelerator',
      latencyLabel: '~1.18 ms',
      throughputLabel: '~847 FPS',
      powerLabel: '~310 W (Estimated)',
      costLabel: '$0.93 / 1M',
      provenance: 'CALIBRATED_ESTIMATE' as const,
      relativePerf: '1.8 PFLOPS FP8 • 24x 200GbE RoCE',
      badge: 'High Cost-Efficiency ($2.85/hr)',
    },
    {
      tabLabel: 'NVIDIA H100',
      name: 'NVIDIA H100 SXM5 (80GB HBM3)',
      vendor: 'NVIDIA',
      type: 'Data Center GPU',
      latencyLabel: '1.12 ms',
      throughputLabel: '892 FPS',
      powerLabel: '340 W',
      costLabel: '$1.51 / 1M',
      provenance: 'MEASURED' as const,
      relativePerf: 'Measured 4.9× vs A100',
      badge: 'High Throughput',
    },
    {
      tabLabel: 'AMD MI300X',
      name: 'AMD Instinct MI300X (192GB HBM3)',
      vendor: 'AMD',
      type: 'Data Center GPU',
      latencyLabel: '~1.08 ms',
      throughputLabel: '~925 FPS',
      powerLabel: '~360 W',
      costLabel: '$1.42 / 1M',
      provenance: 'CALIBRATED_ESTIMATE' as const,
      relativePerf: 'Massive 192GB VRAM',
      badge: '192GB HBM3 Capacity',
    },
    {
      tabLabel: 'Intel Xeon AMX',
      name: 'Intel Xeon Platinum 8592+ (w/ Intel AMX)',
      vendor: 'Intel',
      type: 'Server CPU w/ Matrix Accelerator',
      latencyLabel: '~14.20 ms',
      throughputLabel: '~70.4 FPS',
      powerLabel: '~210 W (Package)',
      costLabel: '$0.75 / 1M (CPU Serving)',
      provenance: 'MEASURED' as const,
      relativePerf: 'Hardware AMX BF16 / INT8 Acceleration',
      badge: 'GPU-Free Enterprise CPU Serving',
    },
    {
      tabLabel: 'NVIDIA RTX 4090',
      name: 'NVIDIA GeForce RTX 4090 (24GB GDDR6X)',
      vendor: 'NVIDIA',
      type: 'Workstation GPU',
      latencyLabel: '~2.34 ms',
      throughputLabel: '~427 FPS',
      powerLabel: '~195 W (Estimated)',
      costLabel: '$0.48 / 1M',
      provenance: 'ESTIMATED' as const,
      relativePerf: '~2.4× over CPU baseline',
      badge: 'Workstation Cost-Perf',
    },
    {
      tabLabel: 'Apple M3 Max',
      name: 'Apple M3 Max (128GB Unified)',
      vendor: 'Apple',
      type: 'Unified SoC',
      latencyLabel: '~5.40 ms',
      throughputLabel: '~185 FPS',
      powerLabel: '~48.0 W',
      costLabel: '$0.12 / 1M (Local)',
      provenance: 'ESTIMATED' as const,
      relativePerf: 'Zero-Cloud Local',
      badge: '128GB Unified Memory',
    },
    {
      tabLabel: 'Qualcomm Snapdragon',
      name: 'Qualcomm Snapdragon X Elite (45 TOPS NPU)',
      vendor: 'Qualcomm',
      type: 'Hexagon NPU',
      latencyLabel: '~8.64 ms',
      throughputLabel: '~115 FPS',
      powerLabel: '~14.5 W',
      costLabel: '$0.04 / 1M (Edge)',
      provenance: 'ESTIMATED' as const,
      relativePerf: 'Ultra-Low Power',
      badge: 'Edge Copilot+ NPU',
    }
  ];

  const activeHw = sampleHws[selectedHwIndex];

  const workflowSteps = [
    { id: 'app-models', label: '1. MODEL', desc: 'Select or Parse HF', icon: Layers },
    { id: 'app-optimizer', label: '2. WORKLOAD', desc: 'Define Context & SLO', icon: SlidersHorizontal },
    { id: 'app-fleet', label: '3. HARDWARE', desc: 'Filter GPU / NPU Pool', icon: Cpu },
    { id: 'app-simulator', label: '4. SIMULATE', desc: 'Roofline & Latency', icon: Activity },
    { id: 'app-benchmarks', label: '5. BENCHMARK', desc: 'Empirical Evidence', icon: ShieldCheck },
    { id: 'app-optimizer', label: '6. OPTIMIZE', desc: 'Ranked Pareto Choices', icon: TrendingUp },
    { id: 'app-k8s-generator', label: '7. DEPLOY', desc: 'K8s & vLLM Flags', icon: Box },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto select-none">
      {/* Methodology Drawer Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Glow backdrop effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Top Tagline */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D1527] border border-cyan-800/50 text-cyan-300 text-xs font-mono font-medium shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>AI Inference Infrastructure Optimization Platform</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-mono">
            Optimize AI Inference for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Your Specific Workload.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Determine, predict, benchmark, and optimize the best inference configuration for your specific model, context length, latency SLO, and budget targets.
          </p>

          {/* Core Positioning Callout */}
          <div className="p-3.5 rounded-xl bg-[#090E1A] border border-[#1E293B] text-xs font-mono text-slate-400 max-w-2xl text-left">
            <strong className="text-cyan-300">CorePick Architecture:</strong> Hardware Intelligence + Model Intelligence + Workload Modeling + Performance Prediction + Benchmark Evidence + Configuration Optimization + Deployment Generation.
          </div>

          {/* Primary Call-to-Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('app-optimizer')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-extrabold font-mono text-xs sm:text-sm rounded-xl shadow-xl shadow-cyan-500/20 transition-all cursor-pointer hover:scale-[1.02] flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Start Workload Optimization</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('app-simulator')}
              className="px-5 py-3 bg-[#131B2E] hover:bg-[#1C2740] text-slate-200 hover:text-white font-bold font-mono text-xs sm:text-sm rounded-xl border border-[#27354F] transition-all flex items-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>What-If Simulator</span>
            </button>

            <button
              onClick={() => onNavigate('app-benchmarks')}
              className="px-5 py-3 bg-[#0B101D] hover:bg-[#121A2D] text-slate-300 hover:text-cyan-300 font-bold font-mono text-xs sm:text-sm rounded-xl border border-cyan-900/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Benchmarks</span>
            </button>
          </div>
        </div>

        {/* Visual Workflow Pipeline */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500">
              END-TO-END INFERENCE OPTIMIZATION WORKFLOW
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id + idx}
                  onClick={() => onNavigate(step.id)}
                  className="p-3 rounded-xl bg-[#0B101D] border border-[#1E293B] hover:border-cyan-500/50 hover:bg-[#11192E] transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">0{idx + 1}</span>
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-white group-hover:text-cyan-300">{step.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{step.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trust & Provenance Classification System Section */}
        <div className="mt-14 max-w-5xl mx-auto p-6 rounded-3xl bg-[#090D18] border border-[#1E293B] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm sm:text-base font-bold font-mono text-white">Trust & Result Provenance Classification</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every number displayed by CorePick carries an explicit status so you always know what is measured vs. estimated.
              </p>
            </div>
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>How is this calculated?</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#070A12] border border-emerald-900/40 space-y-1">
              <MeasurementBadge status="MEASURED" size="sm" />
              <p className="text-[11px] text-slate-400">Actual execution on target physical hardware.</p>
            </div>

            <div className="p-3 rounded-xl bg-[#070A12] border border-cyan-900/40 space-y-1">
              <MeasurementBadge status="CALIBRATED_ESTIMATE" size="sm" />
              <p className="text-[11px] text-slate-400">Analytical prediction calibrated against benchmarks.</p>
            </div>

            <div className="p-3 rounded-xl bg-[#070A12] border border-amber-900/40 space-y-1">
              <MeasurementBadge status="ESTIMATED" size="sm" />
              <p className="text-[11px] text-slate-400">Calculated via roofline model & hardware specs.</p>
            </div>

            <div className="p-3 rounded-xl bg-[#070A12] border border-slate-800 space-y-1">
              <MeasurementBadge status="ASSUMPTION" size="sm" />
              <p className="text-[11px] text-slate-400">User-provided or configured parameter assumption.</p>
            </div>

            <div className="p-3 rounded-xl bg-[#070A12] border border-slate-800 space-y-1">
              <MeasurementBadge status="ILLUSTRATIVE" size="sm" />
              <p className="text-[11px] text-slate-400">Sample/demo exploration value.</p>
            </div>
          </div>
        </div>

        {/* Live Hardware Optimization Benchmark Previewer */}
        <div className="mt-12 bg-gradient-to-b from-[#0F172A] to-[#0A0E1A] border border-[#1E293B] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1E293B]">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono">Hardware Inference Performance Explorer</h3>
                <MeasurementBadge status={activeHw.provenance} size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                <span>Model: <strong>YOLOv8x (Detection)</strong> • Resolution: 640x640</span>
                <span>• Active: <strong className="text-cyan-300">{activeHw.name}</strong></span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 font-bold">{activeHw.vendor}</span>
                <span className="text-slate-500 text-[11px] font-mono">({activeHw.type})</span>
              </p>
            </div>

            {/* Hardware Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
              {sampleHws.map((hw, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedHwIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedHwIndex === idx
                      ? 'bg-cyan-500 text-[#07090E] font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-[#131B2E] text-slate-400 hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  {hw.tabLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Comparison Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Inference Latency</span>
                <MeasurementBadge status={activeHw.provenance} size="sm" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-cyan-400">{activeHw.latencyLabel}</div>
              <span className="text-[11px] text-slate-400 font-mono">P99 jitter factor included</span>
            </div>

            <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Throughput</span>
                <MeasurementBadge status={activeHw.provenance} size="sm" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-emerald-400">{activeHw.throughputLabel}</div>
              <span className="text-[11px] text-slate-400 font-mono">Batch Size: 1</span>
            </div>

            <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Power / Energy</span>
                <MeasurementBadge status="ESTIMATED" size="sm" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-indigo-400">{activeHw.powerLabel}</div>
              <span className="text-[11px] text-slate-400 font-mono">TDP load estimate</span>
            </div>

            <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Cost / 1M Inferences</span>
                <MeasurementBadge status="ASSUMPTION" size="sm" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-amber-400">{activeHw.costLabel}</div>
              <span className="text-[11px] text-emerald-400 font-mono">{activeHw.badge}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#1E293B] text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{activeHw.relativePerf}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('app-fleet')}
                className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Explore Full Silicon Fleet (Intel, NVIDIA, AMD, etc.) →</span>
              </button>
              <button
                onClick={() => onNavigate('app-results')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Explore Pareto Frontier →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Technical Disclaimer Footer Banner */}
        <div className="mt-12 max-w-5xl mx-auto p-4 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 font-mono">Performance Disclaimer:</span> Performance estimates are analytical and may differ from actual results. Actual inference performance depends on model implementation, kernels, runtime, software versions, workload characteristics, and hardware utilization.
            </div>
          </div>
          <button
            onClick={() => onNavigate('app-disclaimer')}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 font-mono text-[11px] font-bold transition-all cursor-pointer"
          >
            Read Full Disclaimer →
          </button>
        </div>
      </section>

      {/* Global Site Footer */}
      <footer className="w-full border-t border-[#1E293B] bg-[#05070B] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 mt-12 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 p-0.5">
              <div className="w-full h-full bg-[#0A0D14] rounded-[6px] flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-mono font-bold text-white text-sm">CorePick AI</span>
              <p className="text-[11px] text-slate-500">Hardware-Aware Inference & Profiling Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-mono text-slate-400">
            <button
              onClick={() => onNavigate('contact')}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer text-cyan-400 font-semibold"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Us</span>
            </button>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <button
              onClick={() => onNavigate('app-disclaimer')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Benchmark Disclaimer
            </button>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <button
              onClick={() => onNavigate('app-methodology')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Methodology
            </button>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <button
              onClick={() => onNavigate('docs')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Documentation
            </button>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <button
              onClick={() => onNavigate('app-optimizer')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Optimizer
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono text-center md:text-right">
            © 2026 CorePick Architecture Systems
          </div>
        </div>
      </footer>
    </div>
  );
};
