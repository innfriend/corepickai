import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  BookOpen, 
  Activity, 
  Database, 
  Cpu, 
  DollarSign, 
  Sliders, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { MeasurementBadge } from './MeasurementBadge';
import { MeasurementProvenance } from '../types';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
  defaultTopic?: 'vram' | 'roofline' | 'latency_tps' | 'cost_tco' | 'quant_accuracy' | 'provenance';
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  defaultTopic = 'provenance'
}) => {
  const [activeTopic, setActiveTopic] = useState<string>(defaultTopic);

  if (!isOpen) return null;

  const topics = [
    { id: 'provenance', label: '1. Trust & Result Provenance', icon: ShieldCheck },
    { id: 'vram', label: '2. VRAM Allocation Formula', icon: Database },
    { id: 'roofline', label: '3. Roofline & Bound Types', icon: Activity },
    { id: 'latency_tps', label: '4. TTFT, ITL & Throughput', icon: Cpu },
    { id: 'cost_tco', label: '5. Cost / 1M Tokens & TCO', icon: DollarSign },
    { id: 'quant_accuracy', label: '6. Quantization & MMLU', icon: Sliders },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0A0F1D] border border-[#1E293B] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#070A14]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-white">How is this calculated?</h3>
              <p className="text-xs text-slate-400">CorePick Transparent Performance Engineering Methodology</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#11192C] text-slate-400 hover:text-white hover:bg-[#1A233A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Sidebar + Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Topic Navigation */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#1E293B] p-3 space-y-1 bg-[#070A12] overflow-y-auto">
            {topics.map((t) => {
              const Icon = t.icon;
              const isActive = activeTopic === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTopic(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#11192C]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Detailed Content View */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-slate-300 text-xs sm:text-sm">
            {activeTopic === 'vram' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    How is VRAM Estimated?
                  </h4>
                  <MeasurementBadge status="ESTIMATED" />
                </div>

                <div className="p-4 rounded-xl bg-[#060A12] border border-[#1E293B] font-mono text-cyan-300 text-xs">
                  Total VRAM = Model Weights + KV Cache + Activations + Runtime Overhead
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#11192C] border border-[#1E293B]">
                    <div className="font-bold text-white font-mono text-xs">1. Model Weights (M_weights)</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Calculated from total parameter count multiplied by bits-per-parameter:
                      <br />
                      <code className="text-cyan-300 font-mono">Param Count × (Bitwidth / 8)</code>. E.g., Llama-3-8B in FP16 requires 8.03B × 2 bytes = 16.06 GB; in INT4 AWQ it requires 8.03B × 0.5 bytes = 4.01 GB.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#11192C] border border-[#1E293B]">
                    <div className="font-bold text-white font-mono text-xs">2. Key-Value (KV) Cache (M_kv)</div>
                    <p className="text-xs text-slate-400 mt-1">
                      For transformer models with Grouped-Query Attention (GQA):
                      <br />
                      <code className="text-cyan-300 font-mono">2 × Layers × (KV_Heads × Head_Dim) × Context_Length × Batch_Size × Precision_Bytes</code>.
                      PagedAttention minimizes fragmentation to approximately 4%.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#11192C] border border-[#1E293B]">
                    <div className="font-bold text-white font-mono text-xs">3. Runtime & CUDA Context Overhead</div>
                    <p className="text-xs text-slate-400 mt-1">
                      CUDA context, cuBLAS/cuDNN execution workspace, and runtime memory buffer pools (typically 0.8 GB to 1.5 GB).
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">CUDA OOM Safety Margin:</span> CorePick sets an OOM warning if estimated allocation exceeds 90% of total physical device memory to account for dynamic burst activations during high concurrency.
                  </div>
                </div>
              </div>
            )}

            {activeTopic === 'roofline' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Roofline Model & Bound Classification
                  </h4>
                  <MeasurementBadge status="ESTIMATED" />
                </div>

                <div className="p-4 rounded-xl bg-[#060A12] border border-[#1E293B] font-mono text-indigo-300 text-xs space-y-1">
                  <div>Arithmetic Intensity (I) = Total FLOPs / Memory Bytes Transferred</div>
                  <div>Ridge Point (I_ridge) = Hardware Peak Compute (TFLOP/s) / Hardware Memory Bandwidth (GB/s)</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#11192C] border border-amber-800/50">
                    <div className="font-bold text-amber-300 font-mono text-xs">Memory Bandwidth Bound (I &lt; I_ridge)</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Arithmetic intensity is below the hardware ridge point. The compute Tensor Cores spend idle cycles waiting for weights to stream from DRAM/HBM.
                      <br />
                      <strong className="text-slate-200">Solution:</strong> Weight quantization (AWQ/INT4), KV-cache compression, or increasing batch size.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#11192C] border border-cyan-800/50">
                    <div className="font-bold text-cyan-300 font-mono text-xs">Compute Ceiling Bound (I &ge; I_ridge)</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Data reuse is high enough to saturate Tensor Cores. Performance is limited by arithmetic hardware throughput.
                      <br />
                      <strong className="text-slate-200">Solution:</strong> Upgrading accelerator tier, FP8 Tensor Cores, or multi-GPU Tensor Parallelism.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Attainable performance is mathematically modeled as: 
                  <code className="text-indigo-300 font-mono ml-1">Attainable TFLOP/s = min(Peak TFLOP/s, I × Memory Bandwidth)</code>.
                </p>
              </div>
            )}

            {activeTopic === 'latency_tps' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-emerald-400" />
                    TTFT & Inter-Token Latency (TPS)
                  </h4>
                  <MeasurementBadge status="CALIBRATED_ESTIMATE" />
                </div>

                <div className="p-4 rounded-xl bg-[#060A12] border border-[#1E293B] font-mono text-emerald-300 text-xs space-y-1">
                  <div>TTFT (Time to First Token) = (2 × Parameters × Prompt Tokens) / (Prefill Compute TFLOPs) + Kernel Overhead</div>
                  <div>ITL (Inter-Token Latency) = (Model Weight Bytes + KV Cache Read) / (Memory Bandwidth GB/s) + GEMM Time</div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#11192C] border border-[#1E293B]">
                    <div className="font-bold text-white font-mono text-xs">Prefill Phase vs. Decode Phase</div>
                    <p className="text-xs text-slate-400 mt-1">
                      <strong>Prefill (Prompt ingestion)</strong> processes all prompt tokens in parallel via dense GEMM—it is heavily <em>compute-bound</em>.
                      <br />
                      <strong>Decode (Autoregressive generation)</strong> emits 1 token at a time per sequence, requiring all model weights to be fetched from memory for every single token—it is strictly <em>memory-bandwidth bound</em> at batch size = 1.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#11192C] border border-[#1E293B]">
                    <div className="font-bold text-white font-mono text-xs">Tokens Per Second (TPS) Formula</div>
                    <p className="text-xs text-slate-400 mt-1">
                      <code className="text-emerald-300 font-mono">TPS = (1 / ITL_in_seconds) × Batch_Concurrency</code>.
                      Calibrated against actual benchmark kernel launch latencies (typically 15-40 microseconds per kernel).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTopic === 'cost_tco' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Cloud TCO & Cost Per 1M Tokens Model
                  </h4>
                  <MeasurementBadge status="ASSUMPTION" />
                </div>

                <div className="p-4 rounded-xl bg-[#060A12] border border-[#1E293B] font-mono text-emerald-300 text-xs">
                  Cost per 1M Tokens = (Hourly Instance Rate / Effective Tokens Generated per Hour) × 1,000,000
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <p>
                    Where <code className="text-emerald-300 font-mono">Tokens per Hour = Sustained TPS × 3600 × Target System Utilization Rate</code> (e.g. 70% duty cycle).
                  </p>
                  <p>
                    Cloud hardware rates are tracked across major hyperscalers (AWS, GCP, Azure, Lambda Labs, RunPod). All pricing calculations clearly display provider, region, pricing model (On-Demand vs 1-Yr Reserved vs Spot), and last verified date.
                  </p>
                </div>
              </div>
            )}

            {activeTopic === 'quant_accuracy' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    Quantization Accuracy & Benchmark Standards
                  </h4>
                  <MeasurementBadge status="MEASURED" />
                </div>

                <div className="p-3 rounded-lg bg-[#11192C] border border-[#1E293B] space-y-2">
                  <div className="font-bold text-white font-mono text-xs">How Accuracy is Measured vs. Estimated</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    CorePick reports MMLU (Massive Multitask Language Understanding 5-shot) and GSM8k scores. We strictly distinguish between:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 pl-1">
                    <li><strong className="text-emerald-300">Measured Accuracy:</strong> Evaluated using lm-evaluation-harness on real model checkpoints.</li>
                    <li><strong className="text-amber-300">Simulated / Estimated Delta:</strong> Analytical sensitivity estimates based on published literature and calibration dataset residuals.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTopic === 'provenance' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    The 5-Level Result Provenance System
                  </h4>
                  <MeasurementBadge status="MEASURED" />
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  To eliminate AI hype and ambiguous benchmark marketing, every number in CorePick is marked with an unambiguous status:
                </p>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-[#070A12] border border-emerald-900/50 space-y-1">
                    <MeasurementBadge status="MEASURED" />
                    <p className="text-xs text-slate-400">
                      Actual execution on real physical hardware under specified runtime, driver, and batch parameters.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#070A12] border border-cyan-900/50 space-y-1">
                    <MeasurementBadge status="CALIBRATED_ESTIMATE" />
                    <p className="text-xs text-slate-400">
                      Analytical roofline model adjusted with verified empirical kernel launch benchmarks.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#070A12] border border-amber-900/50 space-y-1">
                    <MeasurementBadge status="ESTIMATED" />
                    <p className="text-xs text-slate-400">
                      Calculated purely using published vendor hardware specs and model architectural FLOPs/bytes.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#070A12] border border-slate-800 space-y-1">
                    <MeasurementBadge status="ASSUMPTION" />
                    <p className="text-xs text-slate-400">
                      Configurable user workload assumptions (batch size, context length, daily request volume, cloud rates).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#070A12] border border-slate-800 space-y-1">
                    <MeasurementBadge status="ILLUSTRATIVE" />
                    <p className="text-xs text-slate-400">
                      Sample exploration or simulation values provided for demonstration purposes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#1E293B] bg-[#070A14] text-xs font-mono">
          <span className="text-slate-400">
            CorePick Performance Methodology v2.6.0
          </span>
          <button
            onClick={() => {
              onClose();
              onNavigate?.('app-methodology');
            }}
            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Full Methodology Docs →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
