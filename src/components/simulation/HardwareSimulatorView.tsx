import React, { useState, useMemo } from 'react';
import { HARDWARE_CATALOG, MODEL_CATALOG } from '../../data/mockData';
import { simulateInference } from '../../simulation/performanceEngine';
import { RooflineChart } from './RooflineChart';
import { VramBreakdownChart } from './VramBreakdownChart';
import { MeasurementBadge } from '../MeasurementBadge';
import {
  HardwareProfile,
  ModelArchitecture,
  PrecisionType,
  RuntimeEngine
} from '../../types';
import {
  Cpu,
  Layers,
  Zap,
  DollarSign,
  Clock,
  HardDrive,
  BarChart3,
  Sliders,
  Sparkles,
  Info,
  ChevronDown,
  RefreshCw,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const HardwareSimulatorView: React.FC = () => {
  // Simulator State
  const [selectedModelId, setSelectedModelId] = useState<string>('llama-3-70b-instruct');
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>('nvidia-h100-sxm');
  const [selectedPrecision, setSelectedPrecision] = useState<PrecisionType>('FP8');
  const [selectedRuntime, setSelectedRuntime] = useState<RuntimeEngine>('vLLM');
  const [batchSize, setBatchSize] = useState<number>(8);
  const [contextLength, setContextLength] = useState<number>(2048);
  const [outputTokens, setOutputTokens] = useState<number>(256);
  const [concurrency, setConcurrency] = useState<number>(1);
  const [tensorParallelSize, setTensorParallelSize] = useState<number>(1);
  const [kvPrecision, setKvPrecision] = useState<'FP16' | 'FP8' | 'INT4'>('FP8');
  const [enableFlashAttention, setEnableFlashAttention] = useState<boolean>(true);
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Active models & hardware
  const currentModel = useMemo(() => {
    return MODEL_CATALOG.find((m) => m.id === selectedModelId) || MODEL_CATALOG[0];
  }, [selectedModelId]);

  const currentHardware = useMemo(() => {
    return HARDWARE_CATALOG.find((h) => h.id === selectedHardwareId) || HARDWARE_CATALOG[0];
  }, [selectedHardwareId]);

  // Compute simulation result
  const simulationResult = useMemo(() => {
    return simulateInference({
      model: {
        id: currentModel.id,
        name: currentModel.name,
        category: currentModel.category,
        framework: currentModel.framework,
        parameterCountM: currentModel.parameterCountM,
        parameterCountBillions: currentModel.parameterCountBillions || (currentModel.parameterCountM / 1000),
        parameterCountFormatted: currentModel.parameterCountFormatted,
        layers: currentModel.layers || 32,
        hiddenDim: currentModel.hiddenDim || 4096,
        attentionHeads: currentModel.attentionHeads || 32,
        kvHeads: currentModel.kvHeads || 8,
        description: currentModel.description
      },
      hardware: currentHardware,
      precision: (selectedPrecision as any) || 'FP16',
      batchSize: batchSize,
      contextLength: contextLength,
      outputTokens: outputTokens,
      concurrency: concurrency,
      runtime: selectedRuntime as any,
      tensorParallelSize: tensorParallelSize,
      kvPrecision: kvPrecision,
      enableFlashAttention: enableFlashAttention
    });
  }, [
    currentModel,
    currentHardware,
    selectedPrecision,
    batchSize,
    contextLength,
    outputTokens,
    concurrency,
    selectedRuntime,
    tensorParallelSize,
    kvPrecision,
    enableFlashAttention
  ]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Core Philosophy & Provenance Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-xl p-5 border border-indigo-900/40 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Inference Performance Simulation Console
            </h2>
            <MeasurementBadge status="SIMULATED" size="md" />
          </div>
          <p className="text-xs text-slate-300 max-w-3xl">
            Simulate token throughput, time-to-first-token, memory footprint, operational intensity, and cloud costs across any model, GPU accelerator, precision format, and runtime engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-cyan-700/60 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Info className="w-4 h-4 text-cyan-400" />
            <span>How to Use Guide</span>
          </button>
          <button
            onClick={() => setShowFormulaModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-indigo-700/60 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 font-medium transition-colors cursor-pointer"
          >
            <FileCode2 className="w-4 h-4" />
            <span>View Analytical Formulas</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls (1/3) & Right Metrics/Charts (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Workload & Hardware Configuration Form */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Simulation Inputs
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Physics & Roofline</span>
            </div>

            {/* 1. Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Model Architecture</span>
                <span className="text-[10px] text-slate-400">
                  {currentModel.parameterCountFormatted}
                </span>
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {MODEL_CATALOG.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.parameterCountFormatted})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Hardware Accelerator Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Target Hardware</span>
                <span className="text-[10px] text-slate-400">
                  {currentHardware.memoryGB}GB ({currentHardware.memoryBandwidthGBs} GB/s)
                </span>
              </label>
              <select
                value={selectedHardwareId}
                onChange={(e) => setSelectedHardwareId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {HARDWARE_CATALOG.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {h.memoryGB}GB ({h.vendor})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Precision & Tensor Parallelism */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Weight Precision</label>
                <select
                  value={selectedPrecision}
                  onChange={(e) => setSelectedPrecision(e.target.value as PrecisionType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="FP16">FP16 (16-bit)</option>
                  <option value="BF16">BF16 (16-bit)</option>
                  <option value="FP8">FP8 (8-bit E4M3)</option>
                  <option value="INT8">INT8 (Quantized)</option>
                  <option value="INT4">INT4 (AWQ/GPTQ)</option>
                  <option value="FP32">FP32 (Full Precision)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Tensor Parallel (TP)</label>
                <select
                  value={tensorParallelSize}
                  onChange={(e) => setTensorParallelSize(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value={1}>1 GPU (Single)</option>
                  <option value={2}>2 GPUs (TP=2)</option>
                  <option value={4}>4 GPUs (TP=4)</option>
                  <option value={8}>8 GPUs (TP=8 Node)</option>
                </select>
              </div>
            </div>

            {/* 4. Runtime Inference Engine */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Inference Serving Runtime</span>
                <span className="text-[10px] text-emerald-400">PagedAttention</span>
              </label>
              <select
                value={selectedRuntime}
                onChange={(e) => setSelectedRuntime(e.target.value as RuntimeEngine)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="vLLM">vLLM (PagedAttention + CUDA Graphs)</option>
                <option value="TensorRT-LLM">TensorRT-LLM (In-Flight Batching)</option>
                <option value="SGLang">SGLang (RadixAttention Cache)</option>
                <option value="TGI">HuggingFace TGI</option>
                <option value="ONNX Runtime">ONNX Runtime GenAI</option>
                <option value="CoreML">Apple CoreML / Metal</option>
                <option value="QNN">Qualcomm QNN Engine</option>
              </select>
            </div>

            {/* 5. Workload Sliders */}
            <div className="space-y-3.5 pt-2 border-t border-slate-800">
              {/* Batch Size */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Batch Size</span>
                  <span className="text-indigo-400 font-semibold">{batchSize} sequences</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={64}
                  step={1}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1 (Lowest latency)</span>
                  <span>64 (Max throughput)</span>
                </div>
              </div>

              {/* Context Length */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Prompt Context Length</span>
                  <span className="text-indigo-400 font-semibold">{contextLength.toLocaleString()} tokens</span>
                </div>
                <input
                  type="range"
                  min={128}
                  max={16384}
                  step={128}
                  value={contextLength}
                  onChange={(e) => setContextLength(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>128</span>
                  <span>4K</span>
                  <span>16K</span>
                </div>
              </div>

              {/* Output Generation Tokens */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Output Generated Tokens</span>
                  <span className="text-indigo-400 font-semibold">{outputTokens} tokens</span>
                </div>
                <input
                  type="range"
                  min={32}
                  max={2048}
                  step={32}
                  value={outputTokens}
                  onChange={(e) => setOutputTokens(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>32</span>
                  <span>512</span>
                  <span>2K</span>
                </div>
              </div>

              {/* KV Cache Quantization */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">KV-Cache Precision</span>
                  <span className="text-purple-400 font-semibold">{kvPrecision}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['FP16', 'FP8', 'INT4'] as const).map((prec) => (
                    <button
                      key={prec}
                      type="button"
                      onClick={() => setKvPrecision(prec)}
                      className={`px-2 py-1 text-xs rounded border text-center transition-all ${
                        kvPrecision === prec
                          ? 'bg-purple-950/80 border-purple-600 text-purple-300 font-semibold shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {prec}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostics & Bottleneck Box */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Bottleneck & Diagnosis
              </h3>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Primary Limit:</span>
                <span className="text-xs font-bold text-amber-400">
                  {simulationResult.bottleneck}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                {simulationResult.bottleneck === 'Memory Bandwidth' &&
                  `Decoding speed is bounded by streaming ${currentModel.parameterCountFormatted} weights over ${currentHardware.memoryBandwidthGBs * tensorParallelSize} GB/s memory bus.`}
                {simulationResult.bottleneck === 'Compute Bound' &&
                  `Prefill / GEMM matrix operations have saturated the ${simulationResult.roofline.computeCeilingTflops.toFixed(0)} TFLOPS compute ceiling.`}
                {simulationResult.bottleneck === 'VRAM Capacity' &&
                  `The active workload requires ${simulationResult.vramRequiredGb.toFixed(1)} GB, exceeding available ${currentHardware.memoryGB * tensorParallelSize} GB VRAM.`}
                {simulationResult.bottleneck === 'Interconnect Bandwidth' &&
                  `AllReduce communication across GPUs is bounded by interconnect bandwidth.`}
              </p>
            </div>

            {/* Recommendations */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-300">
                Architectural Recommendations:
              </span>
              <ul className="space-y-1">
                {simulationResult.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Performance Outputs & Interactive Charts (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Key KPI Metrics Grid (6 Metric Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {/* 1. Time to First Token (TTFT) */}
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Time to First Token (TTFT)
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white">
                  {simulationResult.performance.ttftMs.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-medium">ms</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Prefill phase ({contextLength} tokens)
              </p>
            </div>

            {/* 2. Inter-Token Latency (ITL) */}
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Inter-Token Latency (ITL)
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-400">
                  {simulationResult.performance.itlMs.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-medium">ms / tok</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Per-token decode interval
              </p>
            </div>

            {/* 3. Token Generation Throughput (Per User) */}
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  Single-Stream TPS
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-400">
                  {simulationResult.performance.tokensPerSecPerRequest.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-medium">tok / s</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Individual user perceived speed
              </p>
            </div>

            {/* 4. Total Aggregate System Throughput */}
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                  Aggregate Throughput
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-indigo-300">
                  {Math.round(simulationResult.performance.aggregateTokensPerSec).toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-medium">tok / s</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Batch {batchSize} concurrent generation
              </p>
            </div>

            {/* 5. Cost per 1M Tokens */}
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Estimated Inference Cost
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white">
                  ${simulationResult.efficiency.costPerMillionTokensUsd.toFixed(3)}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ 1M tok</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Based on ${((currentHardware.hourlyCloudCostUsd || 3.50) * tensorParallelSize).toFixed(2)}/hr GPU cost
              </p>
            </div>

            {/* 6. Energy per Token */}
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  Energy Efficiency
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-yellow-400">
                  {simulationResult.efficiency.energyPerTokenJoules.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 font-medium">J / tok</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {(currentHardware.tdpWatts * tensorParallelSize)}W TDP envelope
              </p>
            </div>
          </div>

          {/* Roofline Model Interactive Visualization */}
          <RooflineChart
            hardware={currentHardware}
            simulation={simulationResult}
            modelName={currentModel.name}
            precision={selectedPrecision}
            tensorParallelSize={tensorParallelSize}
          />

          {/* VRAM Memory Allocation Breakdown */}
          <VramBreakdownChart
            hardware={currentHardware}
            simulation={simulationResult}
            tensorParallelSize={tensorParallelSize}
          />
        </div>
      </div>

      {/* Analytical Formulas & Calculation Transparency Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  CorePick Analytical Simulation Formulas
                </h3>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <h4 className="font-semibold text-indigo-300 mb-1">
                  1. Arithmetic Intensity & Roofline Envelope
                </h4>
                <code className="text-emerald-400 block bg-slate-900 p-2 rounded mt-1 font-mono">
                  Operational Intensity (FLOPs/Byte) = Total FLOPs / Total Memory Traffic Bytes
                  <br />
                  Attainable TFLOPS = Min(Peak TFLOPS, Memory Bandwidth (TB/s) × Operational Intensity)
                </code>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <h4 className="font-semibold text-indigo-300 mb-1">
                  2. KV Cache Memory Calculation
                </h4>
                <code className="text-purple-400 block bg-slate-900 p-2 rounded mt-1 font-mono">
                  KV Size (Bytes) = 2 × Layers × KV_Heads × Head_Dim × Seq_Len × PrecisionBytes
                </code>
                <p className="text-[11px] text-slate-400 mt-1">
                  With Grouped-Query Attention (GQA), KV cache size is reduced by a factor of (Attention Heads / KV Heads), saving up to 8x VRAM.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <h4 className="font-semibold text-indigo-300 mb-1">
                  3. Decode Inter-Token Latency (ITL)
                </h4>
                <code className="text-amber-400 block bg-slate-900 p-2 rounded mt-1 font-mono">
                  ITL (ms) = Max(WeightBytes / EffectiveMemoryBandwidth, FLOPs / EffectiveCompute)
                </code>
                <p className="text-[11px] text-slate-400 mt-1">
                  During decoding at low batch sizes, the model is strictly memory bandwidth bound because all weights must be transferred for every emitted token.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <h4 className="font-semibold text-indigo-300 mb-1">
                  4. Multi-GPU Tensor Parallelism Communication Overhead
                </h4>
                <code className="text-cyan-400 block bg-slate-900 p-2 rounded mt-1 font-mono">
                  AllReduce Comm Volume = 2 × ((TP - 1) / TP) × Layers × HiddenDim × 2 Bytes × Batch
                </code>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ring All-Reduce exchanges intermediate activations over NVLink (900 GB/s) or PCIe (64-128 GB/s).
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive How to Use Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-800/60 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    How to Use the Inference Simulator
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Step-by-step walkthrough for Roofline modeling & VRAM analysis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-cyan-300 font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 inline-flex items-center justify-center text-[10px]">1</span>
                  Select Model & Target Silicon
                </h4>
                <p className="text-slate-400 pl-7 text-[11px]">
                  Pick your model architecture (LLaMA-3, DeepSeek-V3, Qwen 2.5, etc.) and physical accelerator (NVIDIA B200, H100, AMD MI300X, Apple M4 Max).
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-cyan-300 font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 inline-flex items-center justify-center text-[10px]">2</span>
                  Configure Precision & Tensor Parallelism (TP)
                </h4>
                <p className="text-slate-400 pl-7 text-[11px]">
                  Choose weight format (FP16, FP8, INT4) and number of GPUs (TP=1..8). Watch the VRAM breakdown update in real time to verify that weights fit without OOM.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-cyan-300 font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 inline-flex items-center justify-center text-[10px]">3</span>
                  Adjust Batch Size & Context Window
                </h4>
                <p className="text-slate-400 pl-7 text-[11px]">
                  Slide Batch Size to simulate concurrency. At batch size 1, generation is memory-bandwidth bound (low latency). At batch size 16–32, it shifts toward compute-bound (high throughput).
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-cyan-300 font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 inline-flex items-center justify-center text-[10px]">4</span>
                  Evaluate Roofline & Top SLA Metrics
                </h4>
                <p className="text-slate-400 pl-7 text-[11px]">
                  Check <strong className="text-cyan-300">TTFT</strong> (Time to First Token), <strong className="text-cyan-300">ITL</strong> (Inter-Token Latency), and <strong className="text-emerald-300">Cost / 1M Tokens</strong> against your production SLA targets.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-mono">
                Tip: Click "Tool User Manual & Docs" in the sidebar for in-depth manuals for all 10 tools.
              </span>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
              >
                Got It, Let's Simulate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
