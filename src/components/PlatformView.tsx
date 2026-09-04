import React, { useState } from 'react';
import { Cpu, Layers, Zap, Flame, Shield, Server, Check, ArrowRight, Sparkles } from 'lucide-react';

interface PlatformViewProps {
  onNavigate: (view: string) => void;
}

export const PlatformView: React.FC<PlatformViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'compiler' | 'roofline' | 'quantization' | 'runtimes'>('compiler');

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="bg-[#0D1322] border border-[#1E293B] p-6 sm:p-8 rounded-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Architecture & Compiler Specifications</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            CorePick Neural Execution Engine
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
            A vendor-neutral intermediate representation (IR) abstraction layer and automated kernel compilation pipeline designed for low-latency, deterministic AI inference.
          </p>

          {/* Engine Tabs */}
          <div className="flex items-center gap-2 pt-4 overflow-x-auto border-t border-[#1E293B]">
            {[
              { id: 'compiler', label: 'Graph Optimization & Fusion' },
              { id: 'roofline', label: 'Memory Roofline Modeling' },
              { id: 'quantization', label: 'Multi-Precision Quantization' },
              { id: 'runtimes', label: 'Hardware Abstraction Layer' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-[#07090E] shadow-md shadow-cyan-500/20'
                    : 'bg-[#131B2E] text-slate-400 hover:text-white hover:bg-[#1E293B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'compiler' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>Zero-Memory-Roundtrip Operator Fusion</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard inference engines suffer massive memory latency overhead from intermediate buffer allocations between activation layers. CorePick re-writes computational graphs using custom polyhedral loop transformations.
              </p>
              <div className="space-y-2">
                {[
                  'Conv2D + BatchNorm + SiLU / ReLU into vectorized CUDA / Hexagon kernels',
                  'QKV Projection GEMM fusion for transformer self-attention blocks',
                  'PointWise element-wise pooling & normalization in-register execution',
                  'Host-to-Device memory copy elimination via asynchronous pinned buffers',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0A0E1A] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between font-mono text-xs text-cyan-300 space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 block mb-2">// Sample Graph Re-write Rule</span>
                <pre className="p-3 bg-[#07090E] rounded-xl border border-[#1E293B] overflow-x-auto text-[11px] leading-relaxed text-emerald-300">
{`rule ConvActivationFusion {
  match:
    %x = Conv2D(%in, %weights, stride=2)
    %norm = BatchNorm(%x, %mean, %var)
    %act = SiLU(%norm)
  replace:
    %act = CorePick::FusedFusedConvSiLU(
      %in, %fused_weights, 
      precision=INT8, 
      tile_m=128, tile_n=64
    )
}`}
                </pre>
              </div>
              <div className="text-[11px] text-slate-400 bg-cyan-950/30 p-3 rounded-xl border border-cyan-800/40">
                Average Speedup: <strong className="text-cyan-300">34% to 58%</strong> across CNN & Vision Transformer backbones.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roofline' && (
          <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Memory Bandwidth vs Compute Bound Roofline Model</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                Every operator has a theoretical arithmetic intensity threshold (FLOPs per Byte). CorePick maps your model against target hardware memory channels to pinpoint exact architectural bottlenecks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-[#07090E] border border-[#1E293B] rounded-xl p-4 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold">HBM3 / GDDR6X Bandwidth</span>
                <div className="text-xl font-bold text-cyan-400">Up to 3,350 GB/s</div>
                <p className="text-[11px] text-slate-500 font-sans">Critical for autoregressive token decoding where arithmetic intensity is &lt; 10 FLOPs/Byte.</p>
              </div>

              <div className="bg-[#07090E] border border-[#1E293B] rounded-xl p-4 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Tensor Core Peak Compute</span>
                <div className="text-xl font-bold text-emerald-400">Up to 1,978 INT8 TOPS</div>
                <p className="text-[11px] text-slate-500 font-sans">Ideal for large-batch matrix multiplications and dense vision backbones.</p>
              </div>

              <div className="bg-[#07090E] border border-[#1E293B] rounded-xl p-4 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold">L2 / SRAM Cache Capacity</span>
                <div className="text-xl font-bold text-indigo-400">50 MB – 128 MB</div>
                <p className="text-[11px] text-slate-500 font-sans">Optimized for tile-based convolution and FlashAttention online softmax caches.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quantization' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'INT8 PTQ Calibration',
                desc: 'KL-Divergence and Entropy calibration with zero accuracy drop on vision & speech models.',
                speedup: '2.5x – 3.2x',
                memDrop: '50% – 60%',
              },
              {
                title: 'INT4 AWQ / Marlin',
                desc: 'Activation-aware weight quantization preserving salient token weights for LLMs.',
                speedup: '3.8x – 4.5x',
                memDrop: '70% – 75%',
              },
              {
                title: 'FP8 (E4M3 / E5M2)',
                desc: 'Native Hopper and Ada Lovelace Transformer Engine tensor core acceleration.',
                speedup: '2.0x – 2.4x',
                memDrop: '50%',
              },
              {
                title: 'BF16 Mixed Precision',
                desc: 'Wide dynamic range precision for high-fidelity generative diffusion backbones.',
                speedup: '1.8x – 2.0x',
                memDrop: '50%',
              },
            ].map((q, idx) => (
              <div key={idx} className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold font-mono text-white">{q.title}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{q.desc}</p>
                <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400">Speedup: {q.speedup}</span>
                  <span className="text-emerald-400">RAM: -{q.memDrop}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'runtimes' && (
          <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>Unified Cross-Vendor Runtime Compatibility</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate native, zero-dependency engine packages tailored specifically for your deployment target.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#07090E] border border-[#1E293B] rounded-xl">
                <div className="font-bold text-white mb-1">TensorRT 10.x</div>
                <div className="text-slate-400">NVIDIA Data Center & RTX</div>
              </div>
              <div className="p-4 bg-[#07090E] border border-[#1E293B] rounded-xl">
                <div className="font-bold text-white mb-1">Qualcomm QNN</div>
                <div className="text-slate-400">Snapdragon X & Hexagon</div>
              </div>
              <div className="p-4 bg-[#07090E] border border-[#1E293B] rounded-xl">
                <div className="font-bold text-white mb-1">OpenVINO 2024</div>
                <div className="text-slate-400">Intel Xeon AMX & Ultra NPU</div>
              </div>
              <div className="p-4 bg-[#07090E] border border-[#1E293B] rounded-xl">
                <div className="font-bold text-white mb-1">Apple CoreML</div>
                <div className="text-slate-400">M-Series Neural Engine</div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-end pt-4">
          <button
            onClick={() => onNavigate('app-analyze')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-[#07090E] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer hover:scale-105 transition-all"
          >
            <span>Launch Profiler Wizard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
