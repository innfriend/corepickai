import React, { useState } from 'react';
import { MODEL_CATALOG, HARDWARE_CATALOG } from '../data/mockData';
import { PrecisionType, HardwareFitConfig, HardwareFitEvaluation } from '../types';
import { MeasurementBadge } from './MeasurementBadge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sliders, 
  Cpu, 
  Database, 
  DollarSign, 
  Zap, 
  ArrowRight, 
  HelpCircle,
  Sparkles,
  ShieldAlert,
  Info
} from 'lucide-react';

interface HardwareFitAnalyzerProps {
  onNavigate: (view: string) => void;
  onOpenWizardWithModel?: (modelId: string) => void;
}

export const HardwareFitAnalyzer: React.FC<HardwareFitAnalyzerProps> = ({ 
  onNavigate,
  onOpenWizardWithModel
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(MODEL_CATALOG[0].id);
  const [selectedHwId, setSelectedHwId] = useState<string>(HARDWARE_CATALOG[2].id); // RTX 4090
  const [selectedPrecision, setSelectedPrecision] = useState<PrecisionType>('INT4');
  const [batchSize, setBatchSize] = useState<number>(1);
  const [contextLength, setContextLength] = useState<number>(4096);

  // Target SLA Constraints
  const [minThroughputTps, setMinThroughputTps] = useState<number>(50);
  const [maxTtftMs, setMaxTtftMs] = useState<number>(500);
  const [maxVramGb, setMaxVramGb] = useState<number>(24);
  const [maxCostPerMillionUsd, setMaxCostPerMillionUsd] = useState<number>(0.50);

  const selectedModel = MODEL_CATALOG.find(m => m.id === selectedModelId) || MODEL_CATALOG[0];
  const selectedHw = HARDWARE_CATALOG.find(h => h.id === selectedHwId) || HARDWARE_CATALOG[0];

  // Dynamic Fit Evaluation Math
  const evaluateFit = (): HardwareFitEvaluation => {
    const paramsB = selectedModel.parameterCountM / 1000;
    
    // Precision bytes multiplier
    const bytesPerParam = selectedPrecision === 'INT4' || selectedPrecision === 'AWQ' ? 0.5 
      : selectedPrecision === 'INT8' || selectedPrecision === 'SmoothQuant' || selectedPrecision === 'FP8' ? 1.0 
      : 2.0;

    const weightsGb = paramsB * bytesPerParam;
    const kvCacheGb = (2 * selectedModel.layersCount * 128 * 8 * contextLength * batchSize * 2) / (1024 * 1024 * 1024);
    const runtimeOverheadGb = 1.2;
    const totalVramGb = weightsGb + kvCacheGb + runtimeOverheadGb;

    // Estimated Tokens Per Second (Memory bandwidth bound decode at low batch)
    const effectiveBwGBs = selectedHw.memoryBandwidthGBs * 0.75; // 75% memory controller efficiency
    const timePerTokenMs = (weightsGb / effectiveBwGBs) * 1000 + 1.5; // weight stream + compute overhead
    const estimatedTps = Math.round((1000 / timePerTokenMs) * batchSize);

    // Estimated TTFT
    const prefillTflopsNeeded = (2 * paramsB * 1000 * (contextLength / 2)) / 1000;
    const computeCapacity = selectedPrecision === 'INT4' ? (selectedHw.int4Tops || selectedHw.int8Tops * 1.8)
      : selectedPrecision === 'INT8' ? selectedHw.int8Tops
      : selectedHw.fp16Tflops;
    const estimatedTtftMs = Math.round((prefillTflopsNeeded / (computeCapacity * 0.45)) * 1000 + 35);

    // Estimated Cost per 1M tokens
    const hourlyCost = selectedHw.hourlyCloudCostUsd || 1.50;
    const tokensPerHour = estimatedTps * 3600 * 0.7; // 70% utilization assumption
    const estimatedCostPerMillion = Number(((hourlyCost / tokensPerHour) * 1000000).toFixed(3));

    // SLA Checks
    const meetsThroughput = estimatedTps >= minThroughputTps;
    const meetsTtft = estimatedTtftMs <= maxTtftMs;
    const meetsVram = totalVramGb <= selectedHw.memoryGb && totalVramGb <= maxVramGb;
    const meetsCost = estimatedCostPerMillion <= maxCostPerMillionUsd;

    let overallStatus: HardwareFitEvaluation['overallStatus'] = 'POTENTIALLY_MEETS_TARGET';
    let statusSummary = 'Potentially meets target based on current model assumptions.';

    if (!meetsVram) {
      overallStatus = 'EXCEEDS_VRAM_LIMIT';
      statusSummary = `Estimated VRAM requirement (~${totalVramGb.toFixed(1)} GB) exceeds physical or budgeted memory capacity (${Math.min(selectedHw.memoryGb, maxVramGb)} GB).`;
    } else if (!meetsThroughput) {
      overallStatus = 'BELOW_THROUGHPUT_SLA';
      statusSummary = `Estimated throughput (~${estimatedTps} tok/s) is below required target (≥ ${minThroughputTps} tok/s).`;
    } else if (!meetsCost) {
      overallStatus = 'EXCEEDS_COST_BUDGET';
      statusSummary = `Estimated cost ($${estimatedCostPerMillion.toFixed(2)}/1M tokens) exceeds maximum target budget ($${maxCostPerMillionUsd.toFixed(2)}).`;
    }

    return {
      hardwareId: selectedHw.id,
      hardwareName: selectedHw.name,
      vendor: selectedHw.vendor,
      precision: selectedPrecision,
      runtime: 'vLLM (PagedAttention)',
      estimatedTps,
      estimatedTtftMs,
      estimatedVramGb: Number(totalVramGb.toFixed(1)),
      estimatedCostPerMillionUsd: estimatedCostPerMillion,
      meetsThroughput,
      meetsTtft,
      meetsVram,
      meetsCost,
      overallStatus,
      statusSummary,
      provenance: 'ESTIMATED',
      recommendationExplanation: `Configuring ${selectedModel.name} in ${selectedPrecision} precision on ${selectedHw.name} achieves an estimated arithmetic intensity of ${(selectedModel.totalFlopsGflops / (weightsGb * 1024)).toFixed(2)} FLOPs/Byte. Memory bandwidth is the primary bottleneck for decode tokens.`,
      keyTradeoff: selectedPrecision === 'INT4' || selectedPrecision === 'AWQ'
        ? 'Weight quantization decreases VRAM requirement significantly (~50-75% reduction), but requires calibration on target domain dataset to verify actual accuracy retention.'
        : 'FP16 precision guarantees numerical fidelity, but requires ~2-4x higher memory bandwidth and VRAM allocation.'
    };
  };

  const evalResult = evaluateFit();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0B101B] border border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold font-mono text-white">Model × Hardware Fit Analysis</h2>
            <MeasurementBadge status="ESTIMATED" size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Evaluate whether a specific model, quantization strategy, and accelerator satisfy your production latency, throughput, VRAM, and TCO constraints.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('app-comparator')}
            className="px-3 py-1.5 rounded-lg bg-[#131B2E] hover:bg-[#1A233A] border border-[#1E293B] text-xs font-mono text-cyan-300 transition-colors cursor-pointer"
          >
            Multi-Chip A/B Comparator →
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Evaluation Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Workload & SLA Knobs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
              <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Workload Configuration
              </span>
              <span className="text-[10px] font-mono text-slate-400">Assumption Mode</span>
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Model</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-[#070A12] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
              >
                {MODEL_CATALOG.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.parameterCountFormatted}, {m.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Hardware Selector */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Accelerator</label>
              <select
                value={selectedHwId}
                onChange={(e) => setSelectedHwId(e.target.value)}
                className="w-full bg-[#070A12] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
              >
                {HARDWARE_CATALOG.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {h.memoryGb}GB {h.memoryType} ({h.memoryBandwidthGBs} GB/s)
                  </option>
                ))}
              </select>
            </div>

            {/* Precision & Quantization */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Precision Strategy</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['FP16', 'FP8', 'INT8', 'INT4'] as PrecisionType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPrecision(p)}
                    className={`py-1.5 text-xs font-mono rounded border transition-all cursor-pointer ${
                      selectedPrecision === p
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold shadow-sm'
                        : 'bg-[#070A12] text-slate-400 border-[#1E293B] hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch & Context Length */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Batch Size</span>
                  <span className="text-white font-bold">{batchSize}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="32"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-[#1E293B] rounded"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Context Tokens</span>
                  <span className="text-white font-bold">{contextLength.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="32768"
                  step="512"
                  value={contextLength}
                  onChange={(e) => setContextLength(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-[#1E293B] rounded"
                />
              </div>
            </div>
          </div>

          {/* Target SLA Constraints Input */}
          <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1E293B] space-y-3">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
              <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Target SLAs & Budget
              </span>
              <span className="text-[10px] font-mono text-slate-400">User Goals</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Min Throughput</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={minThroughputTps}
                    onChange={(e) => setMinThroughputTps(Number(e.target.value))}
                    className="w-full bg-[#070A12] border border-[#1E293B] rounded px-2 py-1 font-mono text-white text-xs"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">tok/s</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Max TTFT</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={maxTtftMs}
                    onChange={(e) => setMaxTtftMs(Number(e.target.value))}
                    className="w-full bg-[#070A12] border border-[#1E293B] rounded px-2 py-1 font-mono text-white text-xs"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">ms</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Max VRAM</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={maxVramGb}
                    onChange={(e) => setMaxVramGb(Number(e.target.value))}
                    className="w-full bg-[#070A12] border border-[#1E293B] rounded px-2 py-1 font-mono text-white text-xs"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">GB</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Max Cost / 1M Tok</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={maxCostPerMillionUsd}
                    onChange={(e) => setMaxCostPerMillionUsd(Number(e.target.value))}
                    className="w-full bg-[#070A12] border border-[#1E293B] rounded px-2 py-1 font-mono text-white text-xs"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">$</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Evaluation Verdict & Constraint Scorecard (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Status Verdict Card */}
          <div className={`p-5 rounded-2xl border ${
            evalResult.overallStatus === 'POTENTIALLY_MEETS_TARGET'
              ? 'bg-emerald-950/20 border-emerald-700/60'
              : 'bg-amber-950/20 border-amber-700/60'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {evalResult.overallStatus === 'POTENTIALLY_MEETS_TARGET' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">FIT EVALUATION STATUS</span>
                    <MeasurementBadge status="ESTIMATED" size="sm" />
                  </div>
                  <h3 className={`text-base sm:text-lg font-bold font-mono mt-0.5 ${
                    evalResult.overallStatus === 'POTENTIALLY_MEETS_TARGET' ? 'text-emerald-300' : 'text-amber-300'
                  }`}>
                    {evalResult.statusSummary}
                  </h3>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1E293B] text-xs text-slate-300 leading-relaxed">
              <p className="font-mono text-slate-400">
                <strong className="text-white">Analysis:</strong> {evalResult.recommendationExplanation}
              </p>
            </div>
          </div>

          {/* 4-Point SLA Breakdown Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Throughput */}
            <div className={`p-3.5 rounded-xl border ${
              evalResult.meetsThroughput ? 'bg-[#0D1322] border-[#1E293B]' : 'bg-red-950/20 border-red-800/60'
            }`}>
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
                <span>Throughput Target</span>
                <span className={evalResult.meetsThroughput ? 'text-emerald-400' : 'text-red-400'}>
                  {evalResult.meetsThroughput ? '✓ Satisfied' : '✗ Below Target'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-white">~{evalResult.estimatedTps}</span>
                <span className="text-xs text-slate-400 font-mono">tok/s (Target: ≥ {minThroughputTps})</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Estimated decode speed @ batch {batchSize}</div>
            </div>

            {/* TTFT */}
            <div className={`p-3.5 rounded-xl border ${
              evalResult.meetsTtft ? 'bg-[#0D1322] border-[#1E293B]' : 'bg-red-950/20 border-red-800/60'
            }`}>
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
                <span>TTFT (Time to First Token)</span>
                <span className={evalResult.meetsTtft ? 'text-emerald-400' : 'text-red-400'}>
                  {evalResult.meetsTtft ? '✓ Satisfied' : '✗ Exceeds Max'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-white">~{evalResult.estimatedTtftMs}</span>
                <span className="text-xs text-slate-400 font-mono">ms (Target: ≤ {maxTtftMs} ms)</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Prefill chunk latency on {selectedHw.name}</div>
            </div>

            {/* VRAM Allocation */}
            <div className={`p-3.5 rounded-xl border ${
              evalResult.meetsVram ? 'bg-[#0D1322] border-[#1E293B]' : 'bg-red-950/20 border-red-800/60'
            }`}>
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
                <span>VRAM Footprint</span>
                <span className={evalResult.meetsVram ? 'text-emerald-400' : 'text-red-400'}>
                  {evalResult.meetsVram ? '✓ Fits Memory' : '✗ OOM Barrier'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-white">~{evalResult.estimatedVramGb}</span>
                <span className="text-xs text-slate-400 font-mono">GB / {selectedHw.memoryGb} GB Device</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Model weights + KV Cache @ {contextLength} ctx</div>
            </div>

            {/* TCO Cost */}
            <div className={`p-3.5 rounded-xl border ${
              evalResult.meetsCost ? 'bg-[#0D1322] border-[#1E293B]' : 'bg-red-950/20 border-red-800/60'
            }`}>
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
                <span>Cost / 1M Tokens</span>
                <span className={evalResult.meetsCost ? 'text-emerald-400' : 'text-red-400'}>
                  {evalResult.meetsCost ? '✓ In Budget' : '✗ Exceeds Budget'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-white">${evalResult.estimatedCostPerMillionUsd.toFixed(2)}</span>
                <span className="text-xs text-slate-400 font-mono">(Target: ≤ ${maxCostPerMillionUsd.toFixed(2)})</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Based on ${selectedHw.hourlyCloudCostUsd || 1.50}/hr cloud rate</div>
            </div>
          </div>

          {/* Trade-off Warning */}
          <div className="p-4 rounded-xl bg-[#080D17] border border-[#1E293B] text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-white font-mono font-bold">
              <Info className="w-4 h-4 text-cyan-400" />
              Key Trade-off & Accuracy Notice
            </div>
            <p className="leading-relaxed">
              {evalResult.keyTradeoff}
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-[#1E293B]/70">
              <button
                onClick={() => onNavigate('app-quant-simulator')}
                className="text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Audit Quantization Accuracy Delta →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
