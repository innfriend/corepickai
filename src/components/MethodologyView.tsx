import React from 'react';
import { MeasurementBadge } from './MeasurementBadge';
import { 
  BookOpen, 
  Database, 
  Activity, 
  Cpu, 
  DollarSign, 
  Sliders, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface MethodologyViewProps {
  onNavigate: (view: string) => void;
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0B101B] border border-[#1E293B] space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">CorePick Engineering Methodology</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Transparent mathematical formulas, hardware specification provenance, and estimation calibration models.
            </p>
          </div>
        </div>

        {/* Technical Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300 font-mono">Performance & Accuracy Disclaimer:</span>
            <p>
              Performance estimates are analytical and may differ from actual results. Actual inference performance depends on model implementation, kernels, runtime, software versions, workload characteristics, system configuration and hardware utilization. Use CorePick Benchmark to validate results on target hardware. Quantization accuracy depends on model architecture, calibration data, quantization method and evaluation methodology. Accuracy figures are measured only when explicitly identified as measured.
            </p>
          </div>
        </div>
      </div>

      {/* Core Principle Callout */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0D1527] to-[#0A0E18] border border-cyan-900/40 text-center space-y-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400">CORE ARCHITECTURAL PRINCIPLE</span>
        <h2 className="text-lg sm:text-xl font-bold font-mono text-white">
          "Estimate transparently. Measure honestly. Explain every recommendation."
        </h2>
        <p className="text-xs text-slate-400 max-w-2xl mx-auto">
          CorePick does not pretend to know what it cannot measure. We provide clear analytical estimates with full formula transparency, and offer a path for engineers to validate on target hardware.
        </p>
      </div>

      {/* Provenance Badge Guide */}
      <div className="p-6 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-4">
        <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          Trust & Result Provenance Classification
        </h3>
        <p className="text-xs text-slate-400">
          Every number and performance claim in CorePick displays a provenance status badge indicating how it was derived:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-2">
            <MeasurementBadge status="MEASURED" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Actual execution on target physical accelerator (e.g. H100, RTX 4090, Apple M3) under specified runtime, driver, and batch parameters.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-2">
            <MeasurementBadge status="CALIBRATED_ESTIMATE" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Analytical roofline prediction adjusted with verified empirical kernel launch benchmarks and memory bus efficiency coefficients.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-2">
            <MeasurementBadge status="ESTIMATED" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculated purely using published vendor specifications, architectural model parameters, and theoretical arithmetic intensity.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-2">
            <MeasurementBadge status="ASSUMPTION" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Configurable user workload assumptions such as target batch size, context length, daily request volume, or cloud instance pricing.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-2">
            <MeasurementBadge status="ILLUSTRATIVE" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Sample or simulated demo values provided for preliminary exploration when no live hardware agent is connected.
            </p>
          </div>
        </div>
      </div>

      {/* Mathematical Formulations */}
      <div className="space-y-6">
        {/* Section 1: VRAM */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              1. VRAM Memory Footprint Model
            </h3>
            <MeasurementBadge status="ESTIMATED" size="sm" />
          </div>
          <pre className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] font-mono text-xs text-cyan-300 overflow-x-auto">
            Total_VRAM = M_weights + M_kv_cache + M_activations + M_runtime_overhead
          </pre>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 leading-relaxed pl-1">
            <li><strong>Model Weights (M_weights):</strong> Parameter Count × (Bitwidth / 8). FP16 = 2 bytes/param; INT4 = 0.5 bytes/param.</li>
            <li><strong>KV Cache (M_kv):</strong> 2 × Layers × (KV Heads × Head Dim) × Context Length × Batch Size × Bytes per Element.</li>
            <li><strong>Runtime Overhead:</strong> CUDA context and runtime workspace allocations (0.8 GB to 1.5 GB).</li>
          </ul>
        </div>

        {/* Section 2: Roofline */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              2. Roofline & Arithmetic Intensity Model
            </h3>
            <MeasurementBadge status="ESTIMATED" size="sm" />
          </div>
          <pre className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] font-mono text-xs text-indigo-300 overflow-x-auto">
            Arithmetic_Intensity (I) = FLOPs / Bytes_Transferred{"\n"}
            Ridge_Point (I_ridge) = Hardware_Peak_TFLOPs / Hardware_Memory_Bandwidth_GBs{"\n"}
            Attainable_TFLOPs = min(Peak_TFLOPs, I * Memory_Bandwidth_GBs)
          </pre>
          <p className="text-xs text-slate-400 leading-relaxed">
            If I &lt; I_ridge, the operator is <strong>Memory Bandwidth Bound</strong>. Compute units spend idle cycles awaiting memory bus streaming. Increasing compute TFLOPs will not accelerate decode speed unless memory traffic is reduced via quantization or batching.
          </p>
        </div>

        {/* Section 3: Token Latency & Throughput */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              3. Time to First Token (TTFT) and Inter-Token Latency (ITL)
            </h3>
            <MeasurementBadge status="CALIBRATED_ESTIMATE" size="sm" />
          </div>
          <pre className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] font-mono text-xs text-emerald-300 overflow-x-auto">
            TTFT_ms = (2 * Parameters * Prompt_Tokens) / (Effective_Prefill_TFLOPs * 1e3) + Kernel_Overhead_ms{"\n"}
            ITL_ms  = (Weight_Bytes_Moved + KV_Read_Bytes) / (Effective_Memory_Bandwidth_GBs * 1e6) + GEMM_ms{"\n"}
            TPS     = (1000 / ITL_ms) * Batch_Size
          </pre>
          <p className="text-xs text-slate-400 leading-relaxed">
            Autoregressive decoding is inherently memory-bound for small batches (Batch &le; 4). As batch size scales, arithmetic intensity increases and throughput scales near-linearly until memory capacity or compute saturation is reached.
          </p>
        </div>

        {/* Section 4: Cloud TCO */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              4. Cloud Total Cost of Ownership (TCO)
            </h3>
            <MeasurementBadge status="ASSUMPTION" size="sm" />
          </div>
          <pre className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] font-mono text-xs text-emerald-300 overflow-x-auto">
            Cost_Per_Million_Tokens = (Hourly_Instance_Cost / (Sustained_TPS * 3600 * Utilization_Rate)) * 1,000,000
          </pre>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cloud instances are benchmarked at an assumed 70% average duty cycle. Dedicated bare-metal and spot instance pricing are documented with regional and temporal freshness tags.
          </p>
        </div>
      </div>

      {/* Navigation CTA */}
      <div className="flex justify-between items-center p-6 rounded-2xl bg-[#0B101B] border border-[#1E293B]">
        <div>
          <h4 className="text-sm font-bold font-mono text-white">Ready to explore models and hardware?</h4>
          <p className="text-xs text-slate-400">Launch the profiler wizard or browse verified hardware benchmarks.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('app-analyze')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold font-mono text-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
          >
            <span>Start Profiling</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
