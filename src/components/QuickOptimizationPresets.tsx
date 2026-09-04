import React from 'react';
import { 
  Zap, 
  DollarSign, 
  Smartphone, 
  Gauge, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { OptimizationObjective, PrecisionType } from '../types';

export interface OptimizationPreset {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  icon: any;
  targetObjective: OptimizationObjective;
  modelId: string;
  hardwareIds: string[];
  precisions: PrecisionType[];
  description: string;
  expectedOutcome: {
    latency: string;
    vramReduction: string;
    costImpact: string;
  };
}

export const OPTIMIZATION_PRESETS: OptimizationPreset[] = [
  {
    id: 'realtime-chat',
    name: 'Sub-20ms Interactive LLM Chat',
    badge: 'Real-Time SLA',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    icon: Zap,
    targetObjective: 'lowest_latency',
    modelId: 'llama-3-8b-instruct',
    hardwareIds: ['nvidia-rtx-4090', 'nvidia-h100-sxm'],
    precisions: ['INT8', 'FP16'],
    description: 'Auto-applies AWQ 4-bit quantization with SwiGLU & FlashAttention-2 fusion for instant conversational token streaming.',
    expectedOutcome: {
      latency: '< 14ms TTFT',
      vramReduction: '-74% VRAM',
      costImpact: 'Fits in single 24GB GPU'
    }
  },
  {
    id: 'lowest-tco',
    name: 'Lowest Cloud Cost ($ <0.50/1M Tokens)',
    badge: 'FinOps Winner',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    icon: DollarSign,
    targetObjective: 'lowest_cost',
    modelId: 'llama-3-8b-instruct',
    hardwareIds: ['nvidia-rtx-4090', 'nvidia-l40s', 'nvidia-a10g'],
    precisions: ['INT8'],
    description: 'Finds the Pareto-optimal silicon match between consumer GPUs (4090) vs. enterprise nodes to eliminate idle cloud spend.',
    expectedOutcome: {
      latency: '24ms P99',
      vramReduction: '-68% VRAM',
      costImpact: '$0.42 / 1M tokens'
    }
  },
  {
    id: 'edge-mobile',
    name: 'Edge NPU & Battery (< 15W TDP)',
    badge: 'Mobile & Robotics',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    icon: Smartphone,
    targetObjective: 'lowest_power',
    modelId: 'yolov8x-det',
    hardwareIds: ['qualcomm-snapdragon-x-elite', 'apple-m3-max', 'nvidia-jetson-orin-agx'],
    precisions: ['INT8', 'FP16'],
    description: 'Compiles quantized DSP binaries for Qualcomm Hexagon HTP and Apple Neural Engine within strict thermal budgets.',
    expectedOutcome: {
      latency: '2.8ms Vision',
      vramReduction: '-75% Memory',
      costImpact: '9.4W Power Draw'
    }
  },
  {
    id: 'max-throughput',
    name: 'Max Concurrency & Batching Throughput',
    badge: 'High Throughput',
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    icon: Gauge,
    targetObjective: 'highest_throughput',
    modelId: 'stable-diffusion-xl',
    hardwareIds: ['nvidia-h100-sxm', 'google-tpu-v5e', 'nvidia-a100-80gb'],
    precisions: ['FP16'],
    description: 'Enables TensorRT-LLM continuous batching and PagedAttention to maximize queries/second across cluster nodes.',
    expectedOutcome: {
      latency: '8.4ms Batch',
      vramReduction: 'Max Tensor Cores',
      costImpact: '1,420 tokens/sec'
    }
  }
];

interface QuickOptimizationPresetsProps {
  onSelectPreset: (preset: OptimizationPreset) => void;
  selectedPresetId?: string;
}

export const QuickOptimizationPresets: React.FC<QuickOptimizationPresetsProps> = ({
  onSelectPreset,
  selectedPresetId
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            1-Click Goal Recipes (Instant Presets)
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          Click any preset to auto-configure optimal settings
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {OPTIMIZATION_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/10 scale-[1.02]'
                  : 'bg-[#0D1322] border-[#1E293B] hover:border-cyan-800/80 hover:bg-[#111827]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-cyan-500 text-[#07090E]' : 'bg-[#131B2E] text-cyan-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${preset.badgeColor}`}>
                  {preset.badge}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold font-mono text-white leading-snug">
                  {preset.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#1E293B] grid grid-cols-3 gap-1 text-[10px] font-mono">
                <div className="text-cyan-300 font-bold">{preset.expectedOutcome.latency}</div>
                <div className="text-emerald-400 font-bold text-center">{preset.expectedOutcome.vramReduction}</div>
                <div className="text-amber-300 font-bold text-right truncate">{preset.expectedOutcome.costImpact}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
