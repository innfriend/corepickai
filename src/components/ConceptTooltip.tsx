import React, { useState } from 'react';
import { HelpCircle, Info, Sparkles, X } from 'lucide-react';

export interface ConceptExplanation {
  term: string;
  plainEnglish: string;
  analogy?: string;
  recommendedAction?: string;
}

export const HPC_GLOSSARY: Record<string, ConceptExplanation> = {
  'arithmetic_intensity': {
    term: 'Arithmetic Intensity (FLOPs / Byte)',
    plainEnglish: 'The ratio of math operations performed relative to bytes loaded from VRAM. Low intensity means the GPU is idling while waiting for memory transfers.',
    analogy: 'Like cooking: if you spend 10 minutes walking to the pantry for every 10 seconds of cooking, your kitchen is memory-bound.',
    recommendedAction: 'Apply INT4/INT8 quantization or layer fusion to reduce memory transfers.'
  },
  'memory_bound': {
    term: 'Memory-Bound Execution',
    plainEnglish: 'The GPU compute cores are fast, but memory bandwidth (VRAM bus) cannot feed weights quickly enough. Common in LLM autoregressive token generation.',
    analogy: 'A super-fast sports car stuck in a single-lane traffic jam.',
    recommendedAction: 'Use AWQ INT4 quantization or PagedAttention to cut memory bus traffic by ~75%.'
  },
  'compute_bound': {
    term: 'Compute-Bound Execution',
    plainEnglish: 'The GPU compute ALUs / Tensor Cores are running at 100% saturation. Common in large convolutional vision models and high-batch prefill phases.',
    analogy: 'A factory assembly line running at maximum speed with zero raw material delays.',
    recommendedAction: 'Enable FP8/FP16 Tensor Cores or distributed tensor parallelism.'
  },
  'ridge_point': {
    term: 'Roofline Ridge Point',
    plainEnglish: 'The exact arithmetic intensity threshold where a GPU transitions from being limited by memory bandwidth to being limited by compute capacity.',
    recommendedAction: 'Layers to the left of the ridge point should be quantized; layers to the right should be parallelized.'
  },
  'ttft': {
    term: 'Time-To-First-Token (TTFT)',
    plainEnglish: 'The initial latency before an LLM streams its very first output word (the prompt ingestion/prefill phase).',
    recommendedAction: 'Use FlashAttention-2 and prefill batching to compress TTFT under 20ms.'
  },
  'kv_cache': {
    term: 'KV-Cache Memory',
    plainEnglish: 'VRAM allocated to store past attention keys and values so the model does not recompute entire conversations on every token.',
    recommendedAction: 'Enable PagedAttention (vLLM) and FP8 KV-cache quantization to prevent VRAM Out-Of-Memory errors.'
  },
  'awq': {
    term: 'AWQ (Activation-aware Weight Quantization)',
    plainEnglish: 'An advanced 4-bit compression algorithm that preserves the top 1% critical weights, shrinking model VRAM by 75% with zero perceptible quality drop.',
    recommendedAction: 'Best overall quantization format for Llama-3, Mistral, and transformer checkpoints.'
  },
  'operator_fusion': {
    term: 'Operator Kernel Fusion',
    plainEnglish: 'Merging multiple separate mathematical operations (e.g. Conv + BatchNorm + Activation) into a single CUDA kernel call, preventing intermediate VRAM writes.',
    recommendedAction: 'Enable SwiGLU and LayerNorm fusion passes in compiler settings.'
  },
  'tco': {
    term: 'Total Cost of Ownership (TCO)',
    plainEnglish: 'The true dollar cost to serve 1 Million model inferences, accounting for hardware depreciation, cloud on-demand pricing, power draw, and throughput.',
    recommendedAction: 'Compare consumer GPUs (RTX 4090) vs Enterprise (H100) to find the lowest $/1M tokens for your batch size.'
  }
};

interface ConceptTooltipProps {
  conceptKey: keyof typeof HPC_GLOSSARY | string;
  children?: React.ReactNode;
  inline?: boolean;
}

export const ConceptTooltip: React.FC<ConceptTooltipProps> = ({ conceptKey, children, inline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const data: ConceptExplanation = HPC_GLOSSARY[conceptKey] || {
    term: conceptKey,
    plainEnglish: 'Technical metric used in GPU inference optimization.',
  };

  return (
    <span className="relative inline-flex items-center gap-1 group">
      {children ? (
        <span 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="border-b border-dotted border-cyan-400/60 cursor-help hover:text-cyan-300 transition-colors"
        >
          {children}
        </span>
      ) : null}

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="text-slate-400 hover:text-cyan-400 p-0.5 rounded-full hover:bg-cyan-950/60 transition-colors cursor-pointer"
        title={`Explain: ${data.term}`}
      >
        <HelpCircle className="w-3.5 h-3.5 text-cyan-400/80" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-transparent" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute left-0 bottom-full mb-2 z-50 w-72 sm:w-80 p-4 bg-[#0D1322] border border-cyan-700/60 rounded-2xl shadow-2xl shadow-black/80 text-left text-xs font-sans space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
              <span className="font-mono font-bold text-white flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{data.term}</span>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-slate-200 leading-relaxed text-[11px]">
              {data.plainEnglish}
            </p>

            {data.analogy && (
              <div className="p-2 bg-[#07090E] rounded-xl border border-[#1E293B] text-[10px] text-amber-300/90 leading-normal">
                <strong className="text-amber-400 font-mono">Simple Analogy:</strong> {data.analogy}
              </div>
            )}

            {data.recommendedAction && (
              <div className="pt-1 text-[10px] font-mono text-emerald-400 flex items-start gap-1.5">
                <span className="font-bold">Recommendation:</span>
                <span>{data.recommendedAction}</span>
              </div>
            )}
          </div>
        </>
      )}
    </span>
  );
};
