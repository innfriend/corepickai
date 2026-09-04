import React, { useState } from 'react';
import { MeasurementBadge } from './MeasurementBadge';
import { Sliders, Activity, Database, Cpu, DollarSign, ArrowUpRight, TrendingUp, Info } from 'lucide-react';
import { PrecisionType, SensitivityFactor } from '../types';

interface WhatIfSensitivityAnalysisProps {
  onNavigate?: (view: string) => void;
}

export const WhatIfSensitivityAnalysis: React.FC<WhatIfSensitivityAnalysisProps> = ({ onNavigate }) => {
  // Knobs
  const [batchSize, setBatchSize] = useState<number>(4);
  const [contextLength, setContextLength] = useState<number>(4096);
  const [precision, setPrecision] = useState<PrecisionType>('INT4');
  const [customMemoryBw, setCustomMemoryBw] = useState<number>(1008); // RTX 4090 baseline GB/s
  const [customComputeTflops, setCustomComputeTflops] = useState<number>(330); // RTX 4090 FP16 TFLOPs
  const [cloudHourlyCost, setCloudHourlyCost] = useState<number>(0.74);

  // Model parameters (Llama-3-8B benchmark model)
  const paramCountB = 8.03;
  const layersCount = 32;
  const kvHeads = 8;
  const headDim = 128;

  // Precision multiplier
  const precisionBytes = precision === 'INT4' || precision === 'AWQ' ? 0.5 
    : precision === 'INT8' || precision === 'FP8' || precision === 'SmoothQuant' ? 1.0 
    : 2.0;

  // Analytical Calculations
  const weightGb = paramCountB * precisionBytes;
  const kvCacheGb = (2 * layersCount * (kvHeads * headDim) * contextLength * batchSize * 2) / (1024 * 1024 * 1024);
  const runtimeOverheadGb = 1.0;
  const totalVramGb = weightGb + kvCacheGb + runtimeOverheadGb;

  // Arithmetic Intensity (FLOPs / Byte moved)
  // Total FLOPs per token = 2 * params
  // Total bytes moved per token = weights + (kv_cache_read * batch)
  const flopsPerToken = 2 * paramCountB * 1e9;
  const bytesPerToken = (weightGb * 1e9) + ((kvCacheGb / batchSize) * 1e9);
  const arithmeticIntensity = (flopsPerToken / bytesPerToken).toFixed(2);

  // Estimated Latency & Throughput
  const effectiveMemoryBw = customMemoryBw * 0.78; // controller efficiency
  const decodeTimePerTokenMs = (weightGb / effectiveMemoryBw) * 1000 + (flopsPerToken / (customComputeTflops * 1e12)) * 1000;
  const tokensPerSec = Math.round((1000 / decodeTimePerTokenMs) * batchSize);
  const ttftMs = Math.round(((2 * paramCountB * (contextLength / 2)) / (customComputeTflops * 1000)) * 1000 + 30);

  // Estimated Cost / 1M tokens
  const tokensPerHour = tokensPerSec * 3600 * 0.7; // 70% utilization
  const costPerMillion = Number(((cloudHourlyCost / tokensPerHour) * 1000000).toFixed(3));

  const sensitivityFactors: SensitivityFactor[] = [
    {
      parameter: 'Context Length (KV-Cache)',
      impactLevel: 'High impact',
      description: 'Quadratic attention memory growth & KV cache bandwidth pressure during decode step.',
      sensitivityScore: 92,
      recommendation: 'Enable FlashInfer/PagedAttention or INT8 KV-cache quantization to suppress memory blowup.'
    },
    {
      parameter: 'Batch Size Concurrency',
      impactLevel: 'High impact',
      description: 'Increases arithmetic intensity from memory-bound territory toward compute ceiling, amortizing weight load.',
      sensitivityScore: 88,
      recommendation: 'Target batch sizes 4-16 to optimize throughput per dollar before queuing latency degrades SLAs.'
    },
    {
      parameter: 'Weight Precision (Quantization)',
      impactLevel: 'Medium impact',
      description: 'Directly cuts DRAM weight traffic by 50% (FP16 → INT8) and 75% (FP16 → INT4).',
      sensitivityScore: 78,
      recommendation: 'Use AWQ INT4 or FP8 E4M3 on modern Tensor Core hardware.'
    },
    {
      parameter: 'Memory Bus Bandwidth',
      impactLevel: 'Medium impact',
      description: 'Primary throughput limiter for batch size = 1 autoregressive decoding.',
      sensitivityScore: 74,
      recommendation: 'Prioritize HBM3e (3,350 GB/s) over GDDR6X for extreme concurrency.'
    },
    {
      parameter: 'Compute Peak Capacity (TFLOP/s)',
      impactLevel: 'Low impact',
      description: 'Minor impact on decode phase (<15% time spent in compute), but critical for prefill TTFT.',
      sensitivityScore: 35,
      recommendation: 'Do not overprovision pure TFLOP/s if inference workload is token generation heavy.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0B101B] border border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold font-mono text-white">Analytical What-If Sensitivity Engine</h2>
            <MeasurementBadge status="ESTIMATED" size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Interactively simulate how shifting hardware memory bandwidth, compute ceilings, batch concurrency, and context length impact throughput, VRAM, and TCO.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">Target Model: Llama-3-8B</span>
        </div>
      </div>

      {/* Main Grid: Knobs vs Live Output & Sensitivity Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Sliders (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-5">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
            <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              What-If Variables
            </span>
            <MeasurementBadge status="ASSUMPTION" size="sm" />
          </div>

          {/* Precision */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Weight Precision</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['FP16', 'FP8', 'INT8', 'INT4'] as PrecisionType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPrecision(p)}
                  className={`py-1.5 text-xs font-mono rounded border transition-all cursor-pointer ${
                    precision === p
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                      : 'bg-[#070A12] text-slate-400 border-[#1E293B] hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Batch Size Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Batch Concurrency</span>
              <span className="text-cyan-400 font-bold">{batchSize} sequences</span>
            </div>
            <input
              type="range"
              min="1"
              max="64"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-[#1E293B] rounded cursor-pointer"
            />
          </div>

          {/* Context Length Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Context Length</span>
              <span className="text-cyan-400 font-bold">{contextLength.toLocaleString()} tokens</span>
            </div>
            <input
              type="range"
              min="512"
              max="32768"
              step="512"
              value={contextLength}
              onChange={(e) => setContextLength(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-[#1E293B] rounded cursor-pointer"
            />
          </div>

          {/* Memory Bandwidth Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Memory Bus Bandwidth</span>
              <span className="text-cyan-400 font-bold">{customMemoryBw} GB/s</span>
            </div>
            <input
              type="range"
              min="100"
              max="3350"
              step="50"
              value={customMemoryBw}
              onChange={(e) => setCustomMemoryBw(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-[#1E293B] rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>GDDR6 (300 GB/s)</span>
              <span>RTX 4090 (1,008 GB/s)</span>
              <span>H100 HBM3 (3,350 GB/s)</span>
            </div>
          </div>

          {/* Compute Capacity Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Compute Capacity (Tensor Cores)</span>
              <span className="text-cyan-400 font-bold">{customComputeTflops} TFLOP/s</span>
            </div>
            <input
              type="range"
              min="20"
              max="2000"
              step="20"
              value={customComputeTflops}
              onChange={(e) => setCustomComputeTflops(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-[#1E293B] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Live Impact Output & Sensitivity Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Live Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0D1322] border border-[#1E293B]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Estimated TPS</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">~{tokensPerSec}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">tok/sec decode</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1322] border border-[#1E293B]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Estimated TTFT</div>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">~{ttftMs} ms</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">prefill chunk</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1322] border border-[#1E293B]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Estimated VRAM</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">~{totalVramGb.toFixed(1)} GB</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">weights + KV</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1322] border border-[#1E293B]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Arith. Intensity</div>
              <div className="text-xl font-bold font-mono text-indigo-400 mt-0.5">{arithmeticIntensity}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">FLOPs / Byte</div>
            </div>
          </div>

          {/* Section: What Affects Performance Most? */}
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-mono text-white">What Affects Performance Most?</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Analytical Sensitivity Ranking</span>
            </div>

            <div className="space-y-3">
              {sensitivityFactors.map((factor, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#080D17] border border-[#1E293B] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                      <span className="text-slate-500 font-mono">{idx + 1}.</span>
                      {factor.parameter}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      factor.impactLevel === 'High impact' 
                        ? 'bg-red-950/60 text-red-300 border-red-800/60'
                        : factor.impactLevel === 'Medium impact'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {factor.impactLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {factor.description}
                  </p>
                  <div className="text-[10px] font-mono text-cyan-300/90 pt-1 border-t border-[#1E293B]/60">
                    💡 <strong>Engineering Note:</strong> {factor.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
