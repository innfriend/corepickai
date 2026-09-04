import React, { useState } from 'react';
import { 
  Database, 
  Layers, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  BookOpen, 
  ArrowRight, 
  Sparkles,
  Sliders,
  Maximize2,
  TrendingUp,
  Server,
  Zap
} from 'lucide-react';
import { MeasurementBadge } from './MeasurementBadge';
import { HARDWARE_CATALOG, MODEL_CATALOG } from '../data/mockData';

interface KvCacheCompressionSizerProps {
  onNavigate?: (view: string) => void;
  onOpenWizardWithModel?: (modelId: string) => void;
}

export const KvCacheCompressionSizer: React.FC<KvCacheCompressionSizerProps> = ({
  onNavigate,
  onOpenWizardWithModel
}) => {
  // Config state
  const [selectedModelId, setSelectedModelId] = useState<string>('llama-3-8b');
  const [selectedGpuId, setSelectedGpuId] = useState<string>('nvidia-rtx-4090');
  const [contextLength, setContextLength] = useState<number>(16384);
  const [batchSize, setBatchSize] = useState<number>(4);
  const [weightPrecision, setWeightPrecision] = useState<'FP16' | 'FP8' | 'INT4'>('INT4');
  const [pagedBlockSize, setPagedBlockSize] = useState<number>(16);

  const model = MODEL_CATALOG.find(m => m.id === selectedModelId) || MODEL_CATALOG[0];
  const gpu = HARDWARE_CATALOG.find(h => h.id === selectedGpuId) || HARDWARE_CATALOG[0];

  const paramCountB = model.parametersB ?? (model.parameterCountM / 1000);
  const numLayers = model.layers ?? model.layersCount ?? 32;
  const hiddenDim = model.hiddenDim ?? 4096;
  const numAttentionHeads = model.attentionHeads ?? 32;
  const numKvHeads = model.kvHeads ?? 8;
  const headDim = hiddenDim / numAttentionHeads;
  const gqaRatio = numAttentionHeads / numKvHeads;

  // Weight Memory Footprint (GB)
  const weightPrecisionBytes = weightPrecision === 'INT4' ? 0.5 : (weightPrecision === 'FP8' ? 1.0 : 2.0);
  const modelWeightMemoryGb = (paramCountB * 1e9 * weightPrecisionBytes) / (1024 ** 3);
  const cudaOverheadGb = 1.1;

  // Available VRAM for KV Cache on selected GPU
  const totalGpuMemoryGb = gpu.memoryGb;
  const availableVramForKvGb = Math.max(0, totalGpuMemoryGb - modelWeightMemoryGb - cudaOverheadGb);

  // Exact KV Cache Formula per token across precisions:
  // KV bytes per token per sequence = 2 (Key + Value) * Layers * (KV_Heads * Head_Dim) * Bytes_Per_Element
  const kvBytesPerTokenFP16 = 2 * numLayers * (numKvHeads * headDim) * 2.0;
  const kvBytesPerTokenFP8 = 2 * numLayers * (numKvHeads * headDim) * 1.0;
  const kvBytesPerTokenINT4 = 2 * numLayers * (numKvHeads * headDim) * 0.5;

  // Total KV Cache Memory (GB) at current context & batch size (with 4% PagedAttention block fragmentation)
  const pagedFragmentation = 1.04;
  const totalKvCacheGbFP16 = (kvBytesPerTokenFP16 * contextLength * batchSize * pagedFragmentation) / (1024 ** 3);
  const totalKvCacheGbFP8 = (kvBytesPerTokenFP8 * contextLength * batchSize * pagedFragmentation) / (1024 ** 3);
  const totalKvCacheGbINT4 = (kvBytesPerTokenINT4 * contextLength * batchSize * pagedFragmentation) / (1024 ** 3);

  // Max Context Length Supported on this GPU before OOM (at current batch size)
  const maxContextFP16 = Math.floor((availableVramForKvGb * (1024 ** 3)) / (kvBytesPerTokenFP16 * batchSize * pagedFragmentation));
  const maxContextFP8 = Math.floor((availableVramForKvGb * (1024 ** 3)) / (kvBytesPerTokenFP8 * batchSize * pagedFragmentation));
  const maxContextINT4 = Math.floor((availableVramForKvGb * (1024 ** 3)) / (kvBytesPerTokenINT4 * batchSize * pagedFragmentation));

  // Max Batch Concurrency Supported at current context length
  const maxBatchFP16 = Math.floor((availableVramForKvGb * (1024 ** 3)) / (kvBytesPerTokenFP16 * contextLength * pagedFragmentation));
  const maxBatchFP8 = Math.floor((availableVramForKvGb * (1024 ** 3)) / (kvBytesPerTokenFP8 * contextLength * pagedFragmentation));
  const maxBatchINT4 = Math.floor((availableVramForKvGb * (1024 ** 3)) / (kvBytesPerTokenINT4 * contextLength * pagedFragmentation));

  // Memory Status checks for current setting
  const totalUsedFP16 = modelWeightMemoryGb + totalKvCacheGbFP16 + cudaOverheadGb;
  const totalUsedFP8 = modelWeightMemoryGb + totalKvCacheGbFP8 + cudaOverheadGb;
  const totalUsedINT4 = modelWeightMemoryGb + totalKvCacheGbINT4 + cudaOverheadGb;

  const isOomFP16 = totalUsedFP16 > totalGpuMemoryGb;
  const isOomFP8 = totalUsedFP8 > totalGpuMemoryGb;
  const isOomINT4 = totalUsedINT4 > totalGpuMemoryGb;

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                Memory Compression Sizer
              </span>
              <MeasurementBadge status="ESTIMATED" size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              KV-Cache & Context Window Compression Sizer
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Model long-context Key-Value memory growth. Discover how FP8 and INT4 KV-cache compression and Grouped-Query Attention (GQA) unlock up to 4× larger context windows and higher concurrent user concurrency without triggering CUDA Out-Of-Memory (OOM).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate?.('app-tp-sizer')}
              className="px-3 py-1.5 rounded-xl bg-[#131B2E] border border-[#27354F] text-xs font-mono text-cyan-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>Multi-GPU Sizer</span>
            </button>
          </div>
        </div>

        {/* Top Control Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-[#1E293B]">
          {/* Model Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 flex justify-between">
              <span>Model Architecture</span>
              <span className="text-cyan-400">GQA {gqaRatio}:1</span>
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            >
              {MODEL_CATALOG.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.parameterCountFormatted}, {m.layersCount}L)
                </option>
              ))}
            </select>
          </div>

          {/* Target GPU */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 flex justify-between">
              <span>Target GPU Silicon</span>
              <span className="text-emerald-400">{gpu.memoryGb} GB VRAM</span>
            </label>
            <select
              value={selectedGpuId}
              onChange={(e) => setSelectedGpuId(e.target.value)}
              className="w-full bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            >
              {HARDWARE_CATALOG.filter(h => h.type === 'GPU' || h.type === 'EDGE_SOC' || h.type === 'ACCELERATOR').map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.memoryGb}GB {h.memoryType})
                </option>
              ))}
            </select>
          </div>

          {/* Model Weight Precision */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 flex justify-between">
              <span>Weight Precision</span>
              <span className="text-slate-400">Weights: {modelWeightMemoryGb.toFixed(1)} GB</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['FP16', 'FP8', 'INT4'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setWeightPrecision(p)}
                  className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    weightPrecision === p
                      ? 'bg-cyan-500 text-[#07090E]'
                      : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* PagedAttention Block Size */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400">
              PagedAttention Block Size
            </label>
            <div className="grid grid-cols-2 gap-1">
              {[16, 32].map((bs) => (
                <button
                  key={bs}
                  onClick={() => setPagedBlockSize(bs)}
                  className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    pagedBlockSize === bs
                      ? 'bg-indigo-500 text-white'
                      : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
                  }`}
                >
                  {bs} Tokens / Block
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sliders for Context & Batch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-[#1E293B]/70">
          {/* Context Length Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Target Sequence Context Length:</span>
              <span className="text-cyan-400 font-bold bg-[#131B2E] px-2.5 py-1 rounded-lg border border-[#27354F]">
                {contextLength.toLocaleString()} tokens ({(contextLength / 1024).toFixed(1)}k)
              </span>
            </div>
            <input
              type="range"
              min={1024}
              max={131072}
              step={1024}
              value={contextLength}
              onChange={(e) => setContextLength(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-[#1E293B] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1k (Chat)</span>
              <span>16k</span>
              <span>32k</span>
              <span>64k (Doc RAG)</span>
              <span>128k (Repo Agent)</span>
            </div>
          </div>

          {/* Batch Concurrency Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Active Concurrent Streams (Batch Size):</span>
              <span className="text-emerald-400 font-bold bg-[#131B2E] px-2.5 py-1 rounded-lg border border-[#27354F]">
                {batchSize} concurrent users
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={64}
              step={1}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full accent-emerald-400 h-1.5 bg-[#1E293B] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1 Stream (Single user)</span>
              <span>8 Streams</span>
              <span>16 Streams</span>
              <span>32 Streams</span>
              <span>64 Streams</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side KV Precision Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FP16 Standard KV Cache */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 ${
          isOomFP16 
            ? 'bg-[#0E0709] border-rose-900/50' 
            : 'bg-[#0D1322] border-cyan-900/40'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                FP16 KV Cache (Standard)
              </span>
              <span className="text-[10px] font-mono text-slate-400">16-bit / 2 Bytes</span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-mono font-extrabold text-white">
                {totalKvCacheGbFP16.toFixed(2)} <span className="text-xs font-normal text-slate-400">GB KV</span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Total VRAM: <span className={isOomFP16 ? 'text-rose-400 font-bold' : 'text-slate-200'}>{totalUsedFP16.toFixed(1)} GB</span> / {totalGpuMemoryGb} GB
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>KV Per Token:</span>
                <span className="text-white">{(kvBytesPerTokenFP16 / 1024).toFixed(2)} KB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Context Ceiling:</span>
                <span className="text-cyan-300 font-bold">
                  {maxContextFP16 > 0 ? `${(maxContextFP16 / 1024).toFixed(1)}k tokens` : '0 (OOM)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Batch Ceiling:</span>
                <span className="text-cyan-300 font-bold">
                  {maxBatchFP16 > 0 ? `${maxBatchFP16} streams` : '0 (OOM)'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E293B]">
            {isOomFP16 ? (
              <span className="text-xs font-mono text-rose-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>OOM: Exceeds VRAM by {(totalUsedFP16 - totalGpuMemoryGb).toFixed(1)} GB</span>
              </span>
            ) : (
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Fits within {totalGpuMemoryGb}GB VRAM</span>
              </span>
            )}
          </div>
        </div>

        {/* FP8 Compressed KV Cache */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 ${
          isOomFP8 
            ? 'bg-[#0E0709] border-rose-900/50' 
            : 'bg-[#0D1322] border-indigo-900/60 shadow-lg shadow-indigo-950/20'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>FP8 KV Cache (vLLM / SGLang)</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
                2x Compression
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-mono font-extrabold text-indigo-300">
                {totalKvCacheGbFP8.toFixed(2)} <span className="text-xs font-normal text-slate-400">GB KV</span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Total VRAM: <span className={isOomFP8 ? 'text-rose-400 font-bold' : 'text-slate-200'}>{totalUsedFP8.toFixed(1)} GB</span> / {totalGpuMemoryGb} GB
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>KV Per Token:</span>
                <span className="text-white">{(kvBytesPerTokenFP8 / 1024).toFixed(2)} KB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Context Ceiling:</span>
                <span className="text-indigo-300 font-bold">
                  {maxContextFP8 > 0 ? `${(maxContextFP8 / 1024).toFixed(1)}k tokens (2x)` : '0 (OOM)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Batch Ceiling:</span>
                <span className="text-indigo-300 font-bold">
                  {maxBatchFP8 > 0 ? `${maxBatchFP8} streams (2x)` : '0 (OOM)'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E293B]">
            {isOomFP8 ? (
              <span className="text-xs font-mono text-rose-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>OOM: Exceeds VRAM by {(totalUsedFP8 - totalGpuMemoryGb).toFixed(1)} GB</span>
              </span>
            ) : (
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Recommended: 50% Memory Reduction</span>
              </span>
            )}
          </div>
        </div>

        {/* INT4 Quantized KV Cache */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 ${
          isOomINT4 
            ? 'bg-[#0E0709] border-rose-900/50' 
            : 'bg-[#0D1322] border-emerald-900/50'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                INT4 KV Cache (Aggressive)
              </span>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                4x Compression
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-mono font-extrabold text-emerald-300">
                {totalKvCacheGbINT4.toFixed(2)} <span className="text-xs font-normal text-slate-400">GB KV</span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Total VRAM: <span className={isOomINT4 ? 'text-rose-400 font-bold' : 'text-slate-200'}>{totalUsedINT4.toFixed(1)} GB</span> / {totalGpuMemoryGb} GB
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>KV Per Token:</span>
                <span className="text-white">{(kvBytesPerTokenINT4 / 1024).toFixed(2)} KB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Context Ceiling:</span>
                <span className="text-emerald-300 font-bold">
                  {maxContextINT4 > 0 ? `${(maxContextINT4 / 1024).toFixed(1)}k tokens (4x)` : '0 (OOM)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Batch Ceiling:</span>
                <span className="text-emerald-300 font-bold">
                  {maxBatchINT4 > 0 ? `${maxBatchINT4} streams (4x)` : '0 (OOM)'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E293B]">
            {isOomINT4 ? (
              <span className="text-xs font-mono text-rose-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>OOM: Exceeds VRAM by {(totalUsedINT4 - totalGpuMemoryGb).toFixed(1)} GB</span>
              </span>
            ) : (
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Max Capacity: Fits {maxBatchINT4} streams</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Memory Allocation Bar Comparison */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          Physical GPU VRAM Fill Comparison ({gpu.name} — {totalGpuMemoryGb} GB)
        </h3>

        <div className="space-y-4">
          {/* FP16 Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold">FP16 KV Cache (Standard)</span>
              <span className="text-slate-300">{totalUsedFP16.toFixed(1)} / {totalGpuMemoryGb} GB ({((totalUsedFP16 / totalGpuMemoryGb) * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full h-4 bg-[#070A12] rounded-lg overflow-hidden flex border border-[#1E293B]">
              <div style={{ width: `${(modelWeightMemoryGb / totalGpuMemoryGb) * 100}%` }} className="bg-cyan-500" title={`Weights: ${modelWeightMemoryGb.toFixed(1)} GB`} />
              <div style={{ width: `${(totalKvCacheGbFP16 / totalGpuMemoryGb) * 100}%` }} className="bg-indigo-500" title={`KV Cache: ${totalKvCacheGbFP16.toFixed(1)} GB`} />
              <div style={{ width: `${(cudaOverheadGb / totalGpuMemoryGb) * 100}%` }} className="bg-emerald-500" title="CUDA Runtime" />
            </div>
          </div>

          {/* FP8 Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-indigo-400 font-bold">FP8 KV Cache (50% KV Reduction)</span>
              <span className="text-slate-300">{totalUsedFP8.toFixed(1)} / {totalGpuMemoryGb} GB ({((totalUsedFP8 / totalGpuMemoryGb) * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full h-4 bg-[#070A12] rounded-lg overflow-hidden flex border border-[#1E293B]">
              <div style={{ width: `${(modelWeightMemoryGb / totalGpuMemoryGb) * 100}%` }} className="bg-cyan-500" title={`Weights: ${modelWeightMemoryGb.toFixed(1)} GB`} />
              <div style={{ width: `${(totalKvCacheGbFP8 / totalGpuMemoryGb) * 100}%` }} className="bg-indigo-500" title={`KV Cache: ${totalKvCacheGbFP8.toFixed(1)} GB`} />
              <div style={{ width: `${(cudaOverheadGb / totalGpuMemoryGb) * 100}%` }} className="bg-emerald-500" title="CUDA Runtime" />
            </div>
          </div>

          {/* INT4 Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold">INT4 KV Cache (75% KV Reduction)</span>
              <span className="text-slate-300">{totalUsedINT4.toFixed(1)} / {totalGpuMemoryGb} GB ({((totalUsedINT4 / totalGpuMemoryGb) * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full h-4 bg-[#070A12] rounded-lg overflow-hidden flex border border-[#1E293B]">
              <div style={{ width: `${(modelWeightMemoryGb / totalGpuMemoryGb) * 100}%` }} className="bg-cyan-500" title={`Weights: ${modelWeightMemoryGb.toFixed(1)} GB`} />
              <div style={{ width: `${(totalKvCacheGbINT4 / totalGpuMemoryGb) * 100}%` }} className="bg-indigo-500" title={`KV Cache: ${totalKvCacheGbINT4.toFixed(1)} GB`} />
              <div style={{ width: `${(cudaOverheadGb / totalGpuMemoryGb) * 100}%` }} className="bg-emerald-500" title="CUDA Runtime" />
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Principles & GQA Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Math Card */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-3">
          <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Exact KV-Cache Mathematical Formula
          </h4>
          <pre className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] font-mono text-xs text-cyan-300 overflow-x-auto">
            KV_Bytes_Per_Token = 2 * Num_Layers * (KV_Heads * Head_Dim) * Bytes_Per_Element{"\n"}
            Total_KV_Memory_GB = (KV_Bytes_Per_Token * Context_Length * Batch_Size * 1.04) / (1024^3)
          </pre>
          <p className="text-xs text-slate-400 leading-relaxed">
            In standard Multi-Head Attention (MHA), KV heads equals attention heads ($H$). In modern Grouped-Query Attention (GQA, e.g. Llama-3 8:1 ratio), KV memory is reduced by <strong>{gqaRatio}×</strong> automatically, allowing vastly longer context windows.
          </p>
        </div>

        {/* vLLM FP8 KV Cache Engine Command */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              vLLM FP8 KV Cache Production Launch Flag
            </h4>
            <span className="text-[10px] font-mono text-emerald-400">FP8 Ready</span>
          </div>
          <pre className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] font-mono text-xs text-emerald-300 overflow-x-auto select-all">
{`python3 -m vllm.entrypoints.openai.api_server \\
  --model meta-llama/Meta-${model.name.replace(/\s+/g, '-')} \\
  --kv-cache-dtype fp8 \\
  --block-size ${pagedBlockSize} \\
  --max-model-len ${contextLength} \\
  --max-num-seqs ${batchSize} \\
  --gpu-memory-utilization 0.92 \\
  --port 8000`}
          </pre>
          <p className="text-xs text-slate-400">
            Adding <code className="text-emerald-300 font-mono">--kv-cache-dtype fp8</code> instructs vLLM to store Key and Value tensors in 8-bit FP8 format, freeing 50% of KV VRAM without requiring weight retraining.
          </p>
        </div>
      </div>
    </div>
  );
};
