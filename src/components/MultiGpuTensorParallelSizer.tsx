import React, { useState } from 'react';
import { 
  Network, 
  Layers, 
  Cpu, 
  Database, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  BookOpen, 
  ArrowRight, 
  Sparkles,
  Server,
  Zap,
  Sliders,
  Info
} from 'lucide-react';
import { MeasurementBadge } from './MeasurementBadge';
import { HARDWARE_CATALOG, MODEL_CATALOG } from '../data/mockData';

interface MultiGpuTensorParallelSizerProps {
  onNavigate?: (view: string) => void;
  onOpenWizardWithModel?: (modelId: string) => void;
}

export const MultiGpuTensorParallelSizer: React.FC<MultiGpuTensorParallelSizerProps> = ({
  onNavigate,
  onOpenWizardWithModel
}) => {
  // Config state
  const [selectedModelId, setSelectedModelId] = useState<string>('llama-3-70b');
  const [selectedGpuId, setSelectedGpuId] = useState<string>('nvidia-l40s');
  const [tensorParallelSize, setTensorParallelSize] = useState<number>(2);
  const [precision, setPrecision] = useState<'FP16' | 'FP8' | 'INT8' | 'INT4'>('FP16');
  const [contextLength, setContextLength] = useState<number>(4096);
  const [batchSize, setBatchSize] = useState<number>(8);
  const [interconnectType, setInterconnectType] = useState<'NVLINK_4' | 'NVLINK_3' | 'PCIE_5' | 'PCIE_4' | 'ETHERNET_ROCE'>('NVLINK_4');

  const model = MODEL_CATALOG.find(m => m.id === selectedModelId) || MODEL_CATALOG[0];
  const gpu = HARDWARE_CATALOG.find(h => h.id === selectedGpuId) || HARDWARE_CATALOG[0];

  // Interconnect bandwidth (bidirectional per GPU in GB/s)
  const interconnectBandwidths: Record<string, { name: string; bandwidthGBs: number; latencyUs: number; description: string }> = {
    NVLINK_4: { name: 'NVIDIA NVLink 4.0 (H100)', bandwidthGBs: 900, latencyUs: 1.2, description: 'Direct high-speed mesh interconnect on SXM5 boards' },
    NVLINK_3: { name: 'NVIDIA NVLink 3.0 (A100)', bandwidthGBs: 600, latencyUs: 1.8, description: 'Direct high-speed crossbar on A100 SXM4 boards' },
    PCIE_5: { name: 'PCIe Gen 5.0 x16', bandwidthGBs: 64, latencyUs: 4.5, description: 'Standard high-bandwidth server motherboard bus' },
    PCIE_4: { name: 'PCIe Gen 4.0 x16', bandwidthGBs: 32, latencyUs: 6.2, description: 'Consumer & standard server workstation bus' },
    ETHERNET_ROCE: { name: '400Gbps RoCE / InfiniBand', bandwidthGBs: 50, latencyUs: 8.5, description: 'Cross-node network interconnect for multi-node clusters' }
  };

  const selectedInterconnect = interconnectBandwidths[interconnectType];

  // Precision bytes multiplier
  const precisionBytes: Record<string, number> = {
    FP16: 2.0,
    FP8: 1.0,
    INT8: 1.0,
    INT4: 0.5
  };
  const bytesPerParam = precisionBytes[precision];

  // Model parameters
  const paramCountBillions = model.parametersB ?? (model.parameterCountM / 1000);
  const numLayers = model.layers ?? model.layersCount ?? 32;
  const hiddenDim = model.hiddenDim ?? 4096;
  const kvHeads = model.kvHeads ?? 8;
  const attentionHeads = model.attentionHeads ?? 32;
  const headDim = hiddenDim / attentionHeads;

  // 1. Total Unsharded Weights Memory (GB)
  const totalWeightMemoryGb = (paramCountBillions * 1e9 * bytesPerParam) / (1024 ** 3);

  // 2. Weight Memory Per Shard (GB)
  const weightMemoryPerGpuGb = totalWeightMemoryGb / tensorParallelSize;

  // 3. KV Cache calculation (with GQA head sharding)
  // If KV heads < TP, heads are replicated; otherwise sharded
  const effectiveKvHeadsPerGpu = Math.max(1, Math.ceil(kvHeads / tensorParallelSize));
  const bytesPerKvElement = precision === 'INT4' ? 0.5 : (precision === 'FP8' ? 1.0 : 2.0);
  const kvCachePerGpuGb = (2 * numLayers * (effectiveKvHeadsPerGpu * headDim) * contextLength * batchSize * bytesPerKvElement * 1.04) / (1024 ** 3); // 1.04 for 4% PagedAttention fragmentation
  const totalKvCacheGb = kvCachePerGpuGb * tensorParallelSize;

  // 4. Activation memory & CUDA context overhead per GPU
  const activationMemoryPerGpuGb = (batchSize * contextLength * hiddenDim * 2) / (tensorParallelSize * (1024 ** 3));
  const cudaRuntimeOverheadGb = 1.1; // Typical CUDA context, cuBLAS workspace, PyTorch caching allocator

  // 5. Total VRAM required per GPU
  const totalRequiredVramPerGpuGb = weightMemoryPerGpuGb + kvCachePerGpuGb + activationMemoryPerGpuGb + cudaRuntimeOverheadGb;
  const totalClusterVramGb = totalRequiredVramPerGpuGb * tensorParallelSize;
  const availableVramPerGpuGb = gpu.memoryGb;
  const memoryUtilizationPct = (totalRequiredVramPerGpuGb / availableVramPerGpuGb) * 100;
  const isOom = totalRequiredVramPerGpuGb > availableVramPerGpuGb;
  const isTight = !isOom && memoryUtilizationPct > 88;

  // 6. All-Reduce Inter-GPU Communication Volume per decode step
  // In Megabytes per token = 2 * ((TP - 1) / TP) * Hidden_Dim * Layers * bytesPerParam
  const allReduceBytesPerToken = 2 * ((tensorParallelSize - 1) / tensorParallelSize) * hiddenDim * numLayers * bytesPerParam;
  const allReduceMbPerToken = allReduceBytesPerToken / (1024 * 1024);
  
  // Communication latency per token (ms) = (Bytes / Bandwidth) + (Layers * Interconnect_Latency)
  const commTransferTimeMs = (allReduceBytesPerToken / (selectedInterconnect.bandwidthGBs * 1e9)) * 1000;
  const commLatencyOverheadMs = (numLayers * (selectedInterconnect.latencyUs / 1000));
  const totalCommOverheadPerTokenMs = commTransferTimeMs + commLatencyOverheadMs;

  // Theoretical decode speed impact
  const singleGpuBandwidth = gpu.memoryBandwidthGBs;
  const aggregateClusterBandwidth = singleGpuBandwidth * tensorParallelSize;
  const idealComputeTimePerTokenMs = (weightMemoryPerGpuGb * 1024) / (singleGpuBandwidth); // Memory bound decode
  const effectiveLatencyPerTokenMs = idealComputeTimePerTokenMs + totalCommOverheadPerTokenMs;
  const estimatedClusterTps = (1000 / effectiveLatencyPerTokenMs) * (batchSize > 1 ? Math.min(batchSize, 16) : 1);

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                Cluster Architecture Sizer
              </span>
              <MeasurementBadge status="ESTIMATED" size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              Multi-GPU Tensor Parallelism (TP) Sizer
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Transparently calculate how LLM weights, KV cache, and activations shard across 1, 2, 4, or 8 GPUs. Model inter-GPU All-Reduce interconnect traffic and verify OOM safety boundaries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate?.('app-methodology')}
              className="px-3 py-1.5 rounded-xl bg-[#131B2E] border border-[#27354F] text-xs font-mono text-cyan-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>TP Formulas</span>
            </button>
          </div>
        </div>

        {/* Top Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-[#1E293B]">
          {/* Model Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Target Model</span>
              <span className="text-cyan-400">{paramCountBillions}B Params</span>
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            >
              {MODEL_CATALOG.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.parameterCountFormatted})
                </option>
              ))}
            </select>
          </div>

          {/* GPU Hardware Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Target GPU Card</span>
              <span className="text-cyan-400">{gpu.memoryGb} GB VRAM</span>
            </label>
            <select
              value={selectedGpuId}
              onChange={(e) => setSelectedGpuId(e.target.value)}
              className="w-full bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            >
              {HARDWARE_CATALOG.filter(h => h.type === 'GPU' || h.type === 'ACCELERATOR').map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.memoryGb}GB {h.memoryType})
                </option>
              ))}
            </select>
          </div>

          {/* Tensor Parallelism Degree (TP) */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400">
              Tensor Parallelism (TP Degree)
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 4, 8].map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTensorParallelSize(tp)}
                  className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    tensorParallelSize === tp
                      ? 'bg-cyan-500 text-[#07090E] shadow-md shadow-cyan-500/20'
                      : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
                  }`}
                >
                  TP={tp}
                </button>
              ))}
            </div>
          </div>

          {/* Weight & KV Precision */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400">
              Weight Precision
            </label>
            <div className="grid grid-cols-4 gap-1">
              {(['FP16', 'FP8', 'INT8', 'INT4'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPrecision(p)}
                  className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    precision === p
                      ? 'bg-cyan-500 text-[#07090E]'
                      : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Workload Sliders & Interconnect Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#1E293B]/70">
          {/* Context Length Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Context Length</span>
              <span className="text-cyan-400 font-bold">{contextLength.toLocaleString()} tokens</span>
            </div>
            <input
              type="range"
              min={1024}
              max={65536}
              step={1024}
              value={contextLength}
              onChange={(e) => setContextLength(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-[#1E293B] rounded-lg cursor-pointer"
            />
          </div>

          {/* Batch Size Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Concurrent Batch Size</span>
              <span className="text-cyan-400 font-bold">{batchSize} sequences</span>
            </div>
            <input
              type="range"
              min={1}
              max={64}
              step={1}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-[#1E293B] rounded-lg cursor-pointer"
            />
          </div>

          {/* Interconnect Bus */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 flex justify-between">
              <span>GPU Interconnect Bus</span>
              <span className="text-emerald-400 font-bold">{selectedInterconnect.bandwidthGBs} GB/s</span>
            </label>
            <select
              value={interconnectType}
              onChange={(e) => setInterconnectType(e.target.value as any)}
              className="w-full bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-cyan-500"
            >
              {Object.entries(interconnectBandwidths).map(([key, item]) => (
                <option key={key} value={key}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary Status Banner (Verdict) */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isOom
          ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
          : isTight
          ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
          : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
      }`}>
        <div className="flex items-center gap-3">
          {isOom ? (
            <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0" />
          ) : isTight ? (
            <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="text-sm font-bold font-mono uppercase tracking-wider">
              {isOom
                ? `OUT OF MEMORY (OOM) — Exceeds VRAM by ${(totalRequiredVramPerGpuGb - availableVramPerGpuGb).toFixed(1)} GB per GPU`
                : isTight
                ? `TIGHT MEMORY MARGIN (${memoryUtilizationPct.toFixed(1)}% Capacity) — Recommended to increase TP or lower batch`
                : `SAFE DEPLOYMENT FIT (${memoryUtilizationPct.toFixed(1)}% VRAM Utilized per GPU)`}
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {isOom
                ? `Running ${model.name} (${precision}) on ${tensorParallelSize}x ${gpu.name} requires ${totalRequiredVramPerGpuGb.toFixed(1)} GB/GPU, but device physical limit is ${availableVramPerGpuGb} GB.`
                : `Cluster of ${tensorParallelSize}x ${gpu.name} provides ${tensorParallelSize * availableVramPerGpuGb} GB total VRAM. Each GPU uses ${totalRequiredVramPerGpuGb.toFixed(1)} GB.`}
            </p>
          </div>
        </div>

        {isOom && tensorParallelSize < 8 && (
          <button
            onClick={() => setTensorParallelSize(tensorParallelSize * 2)}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white font-mono font-bold text-xs hover:bg-rose-600 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Upgrade to TP={tensorParallelSize * 2}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cluster Visual VRAM Distribution */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              Per-GPU VRAM Allocation ({tensorParallelSize} GPU Cluster)
            </h3>
            <p className="text-xs text-slate-400">
              Breakdown of physical memory allocation across each individual accelerator in the tensor parallel group.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" /> Weights ({weightMemoryPerGpuGb.toFixed(1)} GB)
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> KV Cache ({kvCachePerGpuGb.toFixed(1)} GB)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Activations & CUDA ({ (activationMemoryPerGpuGb + cudaRuntimeOverheadGb).toFixed(1) } GB)
            </span>
          </div>
        </div>

        {/* Visual Multi-GPU Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: tensorParallelSize }).map((_, idx) => {
            const weightsPct = (weightMemoryPerGpuGb / availableVramPerGpuGb) * 100;
            const kvPct = (kvCachePerGpuGb / availableVramPerGpuGb) * 100;
            const actPct = ((activationMemoryPerGpuGb + cudaRuntimeOverheadGb) / availableVramPerGpuGb) * 100;
            const freePct = Math.max(0, 100 - (weightsPct + kvPct + actPct));

            return (
              <div key={idx} className="p-4 rounded-2xl bg-[#070A12] border border-[#1E293B] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#131B2E] text-cyan-400 font-bold">GPU #{idx}</span>
                    <span className="text-slate-300 font-semibold">{gpu.name}</span>
                  </div>
                  <span className={`font-bold ${isOom ? 'text-rose-400' : 'text-slate-400'}`}>
                    {totalRequiredVramPerGpuGb.toFixed(1)} / {availableVramPerGpuGb} GB
                  </span>
                </div>

                {/* Stacked Memory Bar */}
                <div className="w-full h-5 bg-[#131B2E] rounded-lg overflow-hidden flex border border-[#1E293B]">
                  <div 
                    style={{ width: `${Math.min(100, weightsPct)}%` }} 
                    className="bg-cyan-500 transition-all duration-300"
                    title={`Weights: ${weightMemoryPerGpuGb.toFixed(1)} GB`}
                  />
                  <div 
                    style={{ width: `${Math.min(100, kvPct)}%` }} 
                    className="bg-indigo-500 transition-all duration-300"
                    title={`KV Cache: ${kvCachePerGpuGb.toFixed(1)} GB`}
                  />
                  <div 
                    style={{ width: `${Math.min(100, actPct)}%` }} 
                    className="bg-emerald-500 transition-all duration-300"
                    title={`Activations & Runtime: ${(activationMemoryPerGpuGb + cudaRuntimeOverheadGb).toFixed(1)} GB`}
                  />
                </div>

                {/* Status Indicator */}
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
                  <span>Usage: {memoryUtilizationPct.toFixed(1)}%</span>
                  <span>{isOom ? '⚠️ OOM' : `${Math.max(0, availableVramPerGpuGb - totalRequiredVramPerGpuGb).toFixed(1)} GB Free`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interconnect & All-Reduce Communication Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric 1: Communication Volume */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>All-Reduce Volume / Token</span>
            <Network className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-white">
            {allReduceMbPerToken.toFixed(2)} MB <span className="text-xs font-normal text-slate-400">/ step</span>
          </div>
          <p className="text-xs text-slate-400">
            Ring / Tree All-Reduce traffic exchanged across the {tensorParallelSize} GPUs for each generated token.
          </p>
        </div>

        {/* Metric 2: Comm Latency Overhead */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Interconnect Latency Overhead</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-300">
            {totalCommOverheadPerTokenMs.toFixed(3)} ms <span className="text-xs font-normal text-slate-400">/ token</span>
          </div>
          <p className="text-xs text-slate-400">
            Estimated time spent waiting on {selectedInterconnect.name} ({selectedInterconnect.bandwidthGBs} GB/s).
          </p>
        </div>

        {/* Metric 3: Cluster Aggregate Bandwidth */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Aggregate Memory Bandwidth</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-indigo-300">
            {(aggregateClusterBandwidth / 1000).toFixed(2)} TB/s
          </div>
          <p className="text-xs text-slate-400">
            {tensorParallelSize}x {gpu.memoryBandwidthGBs} GB/s aggregate HBM/GDDR bandwidth powering decode kernels.
          </p>
        </div>
      </div>

      {/* Transparent Math Breakdown & vLLM CLI Snippet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulas */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-3">
          <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Mathematical Tensor Parallelism Formulations
          </h4>
          <pre className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] font-mono text-xs text-cyan-300 overflow-x-auto space-y-1">
            <div>1. Weight_Per_GPU = (Total_Parameters * Bytes_Per_Param) / TP</div>
            <div>2. KV_Per_GPU     = (2 * Layers * (KV_Heads/TP) * Head_Dim * Ctx * Batch * Bytes)</div>
            <div>3. All_Reduce_Vol = 2 * ((TP - 1) / TP) * Hidden_Dim * Layers * Bytes</div>
            <div>4. Comm_Time      = (All_Reduce_Vol / Interconnect_BW) + (Layers * Latency_us)</div>
          </pre>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tensor Parallelism shards GEMM linear projection matrices across row-parallel and column-parallel layers (Megatron-LM style). Only 2 All-Reduce operations are required per transformer layer (Attention output projection + MLP down-projection).
          </p>
        </div>

        {/* Generated vLLM Launch Command */}
        <div className="p-6 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Generated vLLM Production Launch Command
            </h4>
            <span className="text-[10px] font-mono text-slate-400">TP={tensorParallelSize} Ready</span>
          </div>
          <pre className="p-3.5 rounded-xl bg-[#070A12] border border-[#1E293B] font-mono text-xs text-emerald-300 overflow-x-auto select-all">
{`python3 -m vllm.entrypoints.openai.api_server \\
  --model meta-llama/Meta-${model.name.replace(/\s+/g, '-')} \\
  --tensor-parallel-size ${tensorParallelSize} \\
  --gpu-memory-utilization 0.90 \\
  --max-model-len ${contextLength} \\
  --max-num-seqs ${batchSize} \\
  --dtype ${precision === 'INT4' || precision === 'INT8' ? 'float16' : precision.toLowerCase()} \\
  ${precision === 'INT4' ? '--quantization awq \\\n  ' : ''}--port 8000`}
          </pre>
          <p className="text-xs text-slate-400">
            Copy and run this exact configuration on your cluster to spin up high-throughput OpenAI-compatible endpoints.
          </p>
        </div>
      </div>
    </div>
  );
};
