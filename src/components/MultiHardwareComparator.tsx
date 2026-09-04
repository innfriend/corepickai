import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  GitCompare, 
  Play, 
  Pause, 
  RotateCcw, 
  Cpu, 
  Zap, 
  Activity, 
  DollarSign, 
  Layers, 
  Gauge, 
  Trophy, 
  Flame, 
  Check, 
  Sparkles, 
  Sliders,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { HardwareSpec, ModelArchitecture } from '../types';
import { HARDWARE_CATALOG, MODEL_CATALOG } from '../data/mockData';

interface MultiHardwareComparatorProps {
  initialModelId?: string;
  onNavigate?: (view: string) => void;
}

const SAMPLE_PROMPTS = [
  {
    id: 'code',
    title: 'Python Microservice Architecture',
    text: 'Write a complete production FastAPI microservice with Redis connection pooling, JWT authentication middleware, rate limiting, and asynchronous background worker endpoints.',
    tokenTarget: 120,
  },
  {
    id: 'reasoning',
    title: 'Quantum Computing Explanation',
    text: 'Explain quantum entanglement and superposition to a senior distributed systems engineer, with analogies to state synchronization across network partitions.',
    tokenTarget: 95,
  },
  {
    id: 'json_extraction',
    title: 'Complex Financial JSON Extraction',
    text: 'Extract EBITDA, operating cash flows, Capex amortization, and debt covenants from the attached SEC 10-K filing into a validated strict JSON schema.',
    tokenTarget: 80,
  }
];

export const MultiHardwareComparator: React.FC<MultiHardwareComparatorProps> = ({
  initialModelId,
  onNavigate,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId || MODEL_CATALOG[0].id);
  const [selectedHardwareIds, setSelectedHardwareIds] = useState<string[]>([
    'nvidia-h100-sxm5',
    'nvidia-rtx-4090',
    'apple-m3-max',
    'qualcomm-snapdragon-x-elite',
  ]);
  const [activePromptId, setActivePromptId] = useState<string>('code');
  const [batchSize, setBatchSize] = useState<number>(1);
  const [precision, setPrecision] = useState<'FP16' | 'INT8' | 'INT4'>('INT4');

  // Streaming Animation State
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [tokenCounts, setTokenCounts] = useState<Record<string, number>>({});
  const [streamCompleted, setStreamCompleted] = useState<Record<string, boolean>>({});

  const selectedModel = useMemo(() => {
    return MODEL_CATALOG.find((m) => m.id === selectedModelId) || MODEL_CATALOG[0];
  }, [selectedModelId]);

  const activePrompt = useMemo(() => {
    return SAMPLE_PROMPTS.find((p) => p.id === activePromptId) || SAMPLE_PROMPTS[0];
  }, [activePromptId]);

  const selectedHardwareSpecs = useMemo(() => {
    return selectedHardwareIds
      .map((id) => HARDWARE_CATALOG.find((h) => h.id === id))
      .filter((h): h is HardwareSpec => !!h);
  }, [selectedHardwareIds]);

  // Compute realistic hardware performance metrics for the selected model & precision
  const hardwareMetrics = useMemo(() => {
    return selectedHardwareSpecs.map((hw) => {
      const gflops = selectedModel.totalFlopsGflops;
      const paramM = selectedModel.parameterCountM;
      
      // Precision multiplier
      const precScale = precision === 'INT4' ? 2.4 : precision === 'INT8' ? 1.7 : 1.0;
      const computeTflops = (hw.fp16Tflops || 50) * (precision === 'INT4' ? 2.0 : precision === 'INT8' ? 1.5 : 1.0);
      const bandwidthGBs = hw.memoryBandwidthGBs || 500;

      // Model size in memory
      const bytesPerParam = precision === 'INT4' ? 0.5 : precision === 'INT8' ? 1.0 : 2.0;
      const vramRequiredGb = +((paramM * 1e6 * bytesPerParam) / 1e9 + 1.2 * batchSize).toFixed(1);
      const isOOM = vramRequiredGb > hw.memoryGb;

      // TTFT (Time to First Token in ms)
      const promptTokens = 45;
      const prefillFlops = (paramM * 2 * promptTokens) / 1e3; // GFLOPs
      const ttftMs = isOOM ? 9999 : Math.max(8, +( (prefillFlops / computeTflops) * 1.5 + (paramM * bytesPerParam / bandwidthGBs) * 10 ).toFixed(1));

      // Output Tokens Per Second (TPS)
      // Memory bound token generation: TPS ~= Bandwidth / Model Weight Size
      const weightTransferPerTokenGB = (paramM * 1e6 * bytesPerParam) / 1e9;
      const rawTps = isOOM ? 0 : Math.min(220, Math.max(4, +((bandwidthGBs / weightTransferPerTokenGB) * 0.85 * (1 / Math.sqrt(batchSize))).toFixed(1)));
      const interTokenLatencyMs = rawTps > 0 ? +(1000 / rawTps).toFixed(1) : 999;

      // Power & TCO
      const powerWatts = isOOM ? 0 : Math.round(hw.tdpWatts * 0.85);
      const hourlyCost = hw.hourlyCloudCostUsd || (hw.tdpWatts > 300 ? 3.5 : 0.8);
      const costPerMillionTokens = isOOM ? 0 : +((hourlyCost / (rawTps * 3600)) * 1e6).toFixed(2);
      const joulesPerToken = isOOM ? 0 : +((powerWatts / rawTps)).toFixed(2);

      return {
        hardware: hw,
        isOOM,
        vramRequiredGb,
        vramPct: Math.min(100, Math.round((vramRequiredGb / hw.memoryGb) * 100)),
        ttftMs,
        tps: rawTps,
        interTokenLatencyMs,
        powerWatts,
        hourlyCost,
        costPerMillionTokens,
        joulesPerToken,
      };
    });
  }, [selectedHardwareSpecs, selectedModel, precision, batchSize]);

  // Find winners
  const fastestTps = useMemo(() => {
    const valid = hardwareMetrics.filter((m) => !m.isOOM);
    return valid.length ? [...valid].sort((a, b) => b.tps - a.tps)[0].hardware.id : null;
  }, [hardwareMetrics]);

  const lowestTtft = useMemo(() => {
    const valid = hardwareMetrics.filter((m) => !m.isOOM);
    return valid.length ? [...valid].sort((a, b) => a.ttftMs - b.ttftMs)[0].hardware.id : null;
  }, [hardwareMetrics]);

  const lowestCost = useMemo(() => {
    const valid = hardwareMetrics.filter((m) => !m.isOOM);
    return valid.length ? [...valid].sort((a, b) => a.costPerMillionTokens - b.costPerMillionTokens)[0].hardware.id : null;
  }, [hardwareMetrics]);

  // Live Token Streaming Engine
  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      interval = setInterval(() => {
        setTokenCounts((prev) => {
          const next = { ...prev };
          let allDone = true;

          hardwareMetrics.forEach((m) => {
            if (m.isOOM) return;
            const current = next[m.hardware.id] || 0;
            if (current < activePrompt.tokenTarget) {
              // Add increment scaled to its TPS
              const increment = Math.max(1, Math.round(m.tps / 12));
              next[m.hardware.id] = Math.min(activePrompt.tokenTarget, current + increment);
              allDone = false;
            }
          });

          if (allDone) {
            setIsStreaming(false);
          }
          return next;
        });
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isStreaming, hardwareMetrics, activePrompt]);

  const handleStartStream = () => {
    setTokenCounts({});
    setStreamCompleted({});
    setIsStreaming(true);
  };

  const handleResetStream = () => {
    setIsStreaming(false);
    setTokenCounts({});
    setStreamCompleted({});
  };

  const toggleHardware = (hwId: string) => {
    if (selectedHardwareIds.includes(hwId)) {
      if (selectedHardwareIds.length > 2) {
        setSelectedHardwareIds(selectedHardwareIds.filter((id) => id !== hwId));
      }
    } else {
      if (selectedHardwareIds.length < 4) {
        setSelectedHardwareIds([...selectedHardwareIds, hwId]);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 flex items-center gap-1">
                <GitCompare className="w-3 h-3" />
                <span>Multi-Accelerator A/B Benchmark</span>
              </span>
              <span className="text-xs font-mono text-slate-400">Live Side-by-Side Comparator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono flex items-center gap-2">
              <Activity className="w-6 h-6 text-cyan-400" />
              <span>Multi-Hardware Latency & Token Stream Comparator</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Compare 2 to 4 target accelerators side-by-side in real-time. Benchmark Time to First Token (TTFT), token generation throughput (TPS), VRAM memory saturation, and TCO per million tokens.
            </p>
          </div>

          {/* Precision and Batch Controls */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-1 bg-[#07090E] border border-[#1E293B] rounded-xl p-1">
              <span className="text-slate-400 px-2">Precision:</span>
              {(['FP16', 'INT8', 'INT4'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPrecision(p)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    precision === p ? 'bg-cyan-500 text-[#07090E] shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[#07090E] border border-[#1E293B] rounded-xl p-1">
              <span className="text-slate-400 px-2">Batch:</span>
              {[1, 4, 16, 32].map((b) => (
                <button
                  key={b}
                  onClick={() => setBatchSize(b)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    batchSize === b ? 'bg-cyan-500 text-[#07090E]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accelerator Chip Selector Chips (Up to 4 chips) */}
        <div className="space-y-2 pt-2 border-t border-[#1E293B]">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Select Target Hardware to Compare (2 to 4 devices):</span>
            <span className="text-cyan-400">{selectedHardwareIds.length} / 4 Selected</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {HARDWARE_CATALOG.map((hw) => {
              const isSelected = selectedHardwareIds.includes(hw.id);
              return (
                <button
                  key={hw.id}
                  onClick={() => toggleHardware(hw.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/80 font-bold shadow-md shadow-cyan-950/40'
                      : 'bg-[#07090E] text-slate-400 border border-[#1E293B] hover:border-slate-700'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{hw.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Interactive Token Streaming Simulator Bar */}
        <div className="p-4 bg-gradient-to-r from-[#07090E] via-[#0E1628] to-[#07090E] border border-cyan-900/50 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Test Workload:</span>
              <select
                value={activePromptId}
                onChange={(e) => {
                  setActivePromptId(e.target.value);
                  handleResetStream();
                }}
                className="bg-[#131B2E] border border-[#27354F] text-cyan-300 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {SAMPLE_PROMPTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.tokenTarget} tokens)
                  </option>
                ))}
              </select>
            </div>

            {/* Play / Reset Controls */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={isStreaming ? () => setIsStreaming(false) : handleStartStream}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold cursor-pointer transition-all ${
                  isStreaming
                    ? 'bg-amber-500 text-[#07090E] shadow-md shadow-amber-500/20'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-[#07090E] shadow-md shadow-cyan-500/20 hover:scale-[1.02]'
                }`}
              >
                {isStreaming ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause Stream</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run Synchronized Stream Benchmark</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResetStream}
                className="p-2 rounded-xl bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F] cursor-pointer"
                title="Reset simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-xs text-slate-300 italic">
            "{activePrompt.text}"
          </div>
        </div>
      </div>

      {/* Multi-Hardware Cards Grid (Side-by-Side) */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${hardwareMetrics.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        {hardwareMetrics.map((item) => {
          const { hardware, isOOM, vramRequiredGb, vramPct, ttftMs, tps, interTokenLatencyMs, powerWatts, costPerMillionTokens, joulesPerToken } = item;
          const currentTokens = tokenCounts[hardware.id] || 0;
          const isWinnerTps = fastestTps === hardware.id;
          const isWinnerTtft = lowestTtft === hardware.id;
          const isWinnerCost = lowestCost === hardware.id;

          return (
            <div
              key={hardware.id}
              className={`bg-[#0D1322] border rounded-3xl p-6 space-y-6 flex flex-col justify-between transition-all duration-200 shadow-xl ${
                isWinnerTps
                  ? 'border-cyan-500/80 ring-1 ring-cyan-500/50 shadow-cyan-950/40'
                  : 'border-[#1E293B] hover:border-[#27354F]'
              }`}
            >
              <div className="space-y-4">
                {/* Hardware Header & Form Factor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#131B2E] text-cyan-300 border border-[#27354F]">
                      {hardware.vendor} • {hardware.type}
                    </span>
                    {isWinnerTps && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span>Fastest TPS</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono">{hardware.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {hardware.memoryGb}GB {hardware.memoryType} • {hardware.memoryBandwidthGBs} GB/s Bus
                  </p>
                </div>

                {/* Simulated Live Token Streaming Box */}
                <div className="p-3.5 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Live Stream:</span>
                    </span>
                    <span className="font-bold text-cyan-300">
                      {currentTokens} / {activePrompt.tokenTarget} tokens
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-[#131B2E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-100"
                      style={{ width: `${(currentTokens / activePrompt.tokenTarget) * 100}%` }}
                    />
                  </div>

                  <div className="h-16 overflow-hidden text-[10px] text-slate-400 leading-relaxed bg-black/40 p-2 rounded-lg border border-white/5 select-none">
                    {isOOM ? (
                      <span className="text-rose-400 font-bold">ERR: CUDA Out-of-Memory. Model requires {vramRequiredGb}GB VRAM.</span>
                    ) : currentTokens === 0 ? (
                      <span className="text-slate-600 italic">Ready for streaming simulation...</span>
                    ) : (
                      <span>
                        {activePrompt.text.slice(0, Math.floor(currentTokens * 4.2))}
                        {currentTokens < activePrompt.tokenTarget && (
                          <span className="inline-block w-1.5 h-3 bg-cyan-400 animate-pulse ml-0.5" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Core Performance Diagnostic Grid */}
                {isOOM ? (
                  <div className="p-4 bg-rose-950/60 border border-rose-800/60 rounded-2xl text-rose-300 font-mono text-xs space-y-1">
                    <span className="font-bold uppercase text-[10px]">OOM Barrier</span>
                    <p className="text-[11px] leading-relaxed">
                      Requires {vramRequiredGb} GB, but target has {hardware.memoryGb} GB. Quantize to INT4 or upgrade accelerator.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 font-mono text-xs">
                    {/* Throughput TPS */}
                    <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Throughput (TPS):</span>
                      <span className="text-base font-extrabold text-cyan-300 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        {tps} <span className="text-[10px] font-normal text-slate-400">tok/s</span>
                      </span>
                    </div>

                    {/* TTFT & ITL */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-[#07090E] border border-[#1E293B] rounded-xl">
                        <span className="text-[10px] text-slate-500 block uppercase">TTFT (Prefill)</span>
                        <span className="font-bold text-white text-xs">{ttftMs} ms</span>
                      </div>
                      <div className="p-2.5 bg-[#07090E] border border-[#1E293B] rounded-xl">
                        <span className="text-[10px] text-slate-500 block uppercase">Inter-Token (ITL)</span>
                        <span className="font-bold text-emerald-300 text-xs">{interTokenLatencyMs} ms</span>
                      </div>
                    </div>

                    {/* VRAM Saturation */}
                    <div className="p-2.5 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">VRAM Footprint:</span>
                        <span className="font-bold text-purple-300">
                          {vramRequiredGb} / {hardware.memoryGb} GB ({vramPct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#131B2E] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${vramPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Cloud TCO & Power */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 bg-[#07090E] border border-[#1E293B] rounded-xl">
                        <span className="text-[10px] text-slate-500 block uppercase">Cost / 1M Tokens</span>
                        <span className="font-bold text-emerald-400">${costPerMillionTokens}</span>
                      </div>
                      <div className="p-2.5 bg-[#07090E] border border-[#1E293B] rounded-xl">
                        <span className="text-[10px] text-slate-500 block uppercase">Power Draw</span>
                        <span className="font-bold text-amber-400">{powerWatts} W</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Action */}
              <button
                onClick={() => onNavigate?.('app-analyze')}
                className="w-full py-2.5 bg-[#131B2E] hover:bg-cyan-950 text-cyan-300 border border-[#27354F] hover:border-cyan-500/60 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-4"
              >
                <span>Run Full Profiler on this Chip</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
