import React, { useState } from 'react';
import { 
  Cpu, 
  GitCompare, 
  Zap, 
  Sliders, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Flame,
  Check,
  RotateCcw
} from 'lucide-react';
import { HARDWARE_CATALOG, MODEL_CATALOG } from '../data/mockData';
import { HardwareSpec, HardwareConstraintFilter } from '../types';

interface HardwareSandboxViewProps {
  onNavigate?: (view: string) => void;
}

export const HardwareSandboxView: React.FC<HardwareSandboxViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'recommender'>('sandbox');
  
  // Sandbox Multi-Select State (default 3 chips)
  const [selectedHwIds, setSelectedHwIds] = useState<string[]>([
    'nvidia-h100-sxm',
    'nvidia-l40s',
    'qualcomm-cloud-ai-100'
  ]);

  // Selected Target Workload Model
  const [selectedModelId, setSelectedModelId] = useState<string>('llama-3-8b-instruct');

  // Recommender Sliders State
  const [constraints, setConstraints] = useState<HardwareConstraintFilter>({
    maxMonthlyBudgetUsd: 1500,
    minThroughput: 80,
    maxLatencyMs: 25,
    maxPowerWatts: 400,
    formFactor: 'All',
    workloadType: 'LLM / Token Streaming'
  });

  const toggleHardware = (id: string) => {
    if (selectedHwIds.includes(id)) {
      if (selectedHwIds.length > 1) {
        setSelectedHwIds(selectedHwIds.filter(x => x !== id));
      }
    } else {
      if (selectedHwIds.length < 4) {
        setSelectedHwIds([...selectedHwIds, id]);
      }
    }
  };

  const selectedHwSpecs: HardwareSpec[] = selectedHwIds
    .map(id => HARDWARE_CATALOG.find(h => h.id === id))
    .filter(Boolean) as HardwareSpec[];

  // Calculate simulated model performance per hardware
  const getSimulatedMetrics = (hw: HardwareSpec) => {
    const isLLM = selectedModelId.includes('llama') || selectedModelId.includes('mistral');
    const isVision = selectedModelId.includes('yolo') || selectedModelId.includes('mobilenet');

    let baseLatency = isLLM ? 18.5 : 4.2;
    let baseThroughput = isLLM ? 120 : 240;
    
    // Scale by memory bandwidth and TFLOPs
    const memScale = hw.memoryBandwidthGBs / 1000;
    const computeScale = hw.fp16Tflops / 300;

    const latencyMs = Math.max(1.2, baseLatency / (isLLM ? (memScale * 0.7 + computeScale * 0.3) : (computeScale * 0.7 + memScale * 0.3)));
    const throughputFps = Math.max(10, baseThroughput * (isLLM ? (memScale * 0.75 + computeScale * 0.25) : (computeScale * 0.75 + memScale * 0.25)));
    const tokensPerSec = isLLM ? throughputFps : undefined;
    const efficiency = throughputFps / Math.max(1, hw.tdpWatts);
    const monthlyCost = (hw.hourlyCloudCostUsd || 0.8) * 24 * 30;
    const costPerMillion = (monthlyCost / (throughputFps * 3600 * 24 * 30)) * 1_000_000;

    return {
      latencyMs,
      throughputFps,
      tokensPerSec,
      efficiency,
      monthlyCost,
      costPerMillion,
      vramUsageGb: isLLM ? 9.6 : 1.8,
      ttftMs: isLLM ? latencyMs * 1.8 : undefined,
      itlMs: isLLM ? latencyMs * 0.6 : undefined
    };
  };

  // Recommender score calculation
  const rankedRecommendations = HARDWARE_CATALOG.map(hw => {
    const metrics = getSimulatedMetrics(hw);
    
    let fitScore = 100;
    const reasons: string[] = [];
    const warnings: string[] = [];

    if (metrics.monthlyCost > constraints.maxMonthlyBudgetUsd) {
      fitScore -= 40;
      warnings.push(`Exceeds budget ($${(metrics.monthlyCost || 0).toFixed(0)}/mo vs $${constraints.maxMonthlyBudgetUsd}/mo limit)`);
    } else {
      reasons.push(`Under budget ($${(metrics.monthlyCost || 0).toFixed(0)}/mo)`);
    }

    if (metrics.throughputFps < constraints.minThroughput) {
      fitScore -= 30;
      warnings.push(`Throughput below SLA (${(metrics.throughputFps || 0).toFixed(0)} vs ${constraints.minThroughput} required)`);
    } else {
      reasons.push(`Meets throughput SLA (${(metrics.throughputFps || 0).toFixed(0)} FPS / Tok/s)`);
    }

    if (metrics.latencyMs > constraints.maxLatencyMs) {
      fitScore -= 25;
      warnings.push(`Latency higher than SLA (${(metrics.latencyMs || 0).toFixed(1)}ms vs ${constraints.maxLatencyMs}ms)`);
    } else {
      reasons.push(`Sub-SLA latency (${(metrics.latencyMs || 0).toFixed(1)}ms)`);
    }

    if (hw.tdpWatts > constraints.maxPowerWatts) {
      fitScore -= 20;
      warnings.push(`Exceeds TDP envelope (${hw.tdpWatts}W vs ${constraints.maxPowerWatts}W)`);
    }

    if (constraints.formFactor !== 'All' && hw.formFactor !== constraints.formFactor) {
      fitScore -= 50;
      warnings.push(`Form factor mismatch (${hw.formFactor})`);
    }

    return {
      hardware: hw,
      metrics,
      fitScore: Math.max(0, fitScore),
      reasons,
      warnings
    };
  }).sort((a, b) => b.fitScore - a.fitScore);

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                Multi-Hardware Comparison Sandbox
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Live Silicon Delta Engine</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              Multi-Hardware Delta Sandbox & Recommendation Matcher
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Compare 2-4 accelerators side-by-side or calculate the optimal hardware match from latency, power, and SLA budget constraints.
            </p>
          </div>

          {/* Target Workload Model Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Workload:</span>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            >
              {MODEL_CATALOG.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#1E293B]">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Side-by-Side Silicon Sandbox ({selectedHwIds.length} Selected)</span>
          </button>

          <button
            onClick={() => setActiveTab('recommender')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'recommender'
                ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Constraint-Driven Hardware Recommender</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SIDE-BY-SIDE SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6">
          {/* Accelerator Selector Chips */}
          <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-4">
            <span className="text-xs font-mono text-slate-400 block mb-2 font-bold">
              Select Accelerators to Compare (Max 4):
            </span>
            <div className="flex flex-wrap gap-2">
              {HARDWARE_CATALOG.map((hw) => {
                const isSelected = selectedHwIds.includes(hw.id);
                return (
                  <button
                    key={hw.id}
                    onClick={() => toggleHardware(hw.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-[#07090E] shadow-md shadow-cyan-500/20'
                        : 'bg-[#131B2E] text-slate-300 hover:text-white border border-[#27354F]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{hw.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison Matrix Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {selectedHwSpecs.map((hw) => {
              const metrics = getSimulatedMetrics(hw);
              return (
                <div key={hw.id} className="bg-[#0D1322] border border-[#1E293B] hover:border-cyan-500/50 rounded-3xl p-6 space-y-5 transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 bg-cyan-950/80 border border-cyan-800/60 rounded">
                          {hw.vendor}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{hw.formFactor}</span>
                      </div>
                      <h3 className="text-lg font-bold font-mono text-white mt-1">{hw.name}</h3>
                      <p className="text-xs text-slate-400">{hw.architecture} • {hw.processNode}</p>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-[#07090E] p-4 rounded-2xl border border-[#1E293B] space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Inference Latency:</span>
                        <span className="font-bold text-white text-sm">{(metrics.latencyMs || 0).toFixed(2)} ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Throughput:</span>
                        <span className="font-bold text-cyan-300 text-sm">{(metrics.throughputFps || 0).toFixed(0)} {metrics.tokensPerSec ? 'Tok/s' : 'FPS'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Efficiency:</span>
                        <span className="font-bold text-emerald-300">{(metrics.efficiency || 0).toFixed(2)} FPS/Watt</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Power Draw (TDP):</span>
                        <span className="font-bold text-amber-300">{hw.tdpWatts} W</span>
                      </div>
                    </div>

                    {/* Hardware Hardware Specs */}
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Memory:</span>
                        <span>{hw.memoryGb} GB {hw.memoryType}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Bandwidth:</span>
                        <span className="text-cyan-300 font-bold">{hw.memoryBandwidthGBs} GB/s</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">FP16 Compute:</span>
                        <span>{hw.fp16Tflops} TFLOPs</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">INT8 TOPS:</span>
                        <span>{hw.int8Tops} TOPS</span>
                      </div>
                    </div>

                    {/* Cost / TCO Metrics */}
                    <div className="pt-3 border-t border-[#1E293B] space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Est. Cloud Hourly:</span>
                        <span className="text-white font-bold">${hw.hourlyCloudCostUsd ? hw.hourlyCloudCostUsd.toFixed(2) : '0.00'}/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Monthly 24/7 Cost:</span>
                        <span className="text-emerald-400 font-bold">${(metrics.monthlyCost || 0).toFixed(0)}/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cost / 1M Inferences:</span>
                        <span className="text-cyan-300 font-bold">${(metrics.costPerMillion || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate && onNavigate('app-analyze')}
                    className="w-full py-2 bg-[#131B2E] hover:bg-cyan-500 hover:text-[#07090E] text-cyan-300 font-bold text-xs rounded-xl border border-cyan-800/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Run Optimization Benchmark</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CONSTRAINT-DRIVEN HARDWARE RECOMMENDER */}
      {activeTab === 'recommender' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Controls: Sliders */}
          <div className="lg:col-span-4 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-5">
            <div className="pb-3 border-b border-[#1E293B]">
              <h3 className="text-lg font-bold font-mono text-white">SLA & Budget Constraints</h3>
              <p className="text-xs text-slate-400 mt-0.5">Adjust target thresholds to compute optimal hardware rankings.</p>
            </div>

            {/* Max Budget Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Max Monthly Cloud Budget:</span>
                <span className="text-emerald-400 font-bold">${constraints.maxMonthlyBudgetUsd}/mo</span>
              </div>
              <input
                type="range"
                min="200"
                max="5000"
                step="100"
                value={constraints.maxMonthlyBudgetUsd}
                onChange={(e) => setConstraints({ ...constraints, maxMonthlyBudgetUsd: Number(e.target.value) })}
                className="w-full accent-emerald-400 bg-[#131B2E] cursor-pointer"
              />
            </div>

            {/* Min Throughput Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Min Required Throughput:</span>
                <span className="text-cyan-400 font-bold">{constraints.minThroughput} {constraints.workloadType.includes('LLM') ? 'Tokens/s' : 'FPS'}</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={constraints.minThroughput}
                onChange={(e) => setConstraints({ ...constraints, minThroughput: Number(e.target.value) })}
                className="w-full accent-cyan-400 bg-[#131B2E] cursor-pointer"
              />
            </div>

            {/* Max Latency SLA Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Max Latency SLA:</span>
                <span className="text-amber-400 font-bold">{constraints.maxLatencyMs} ms</span>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                step="2"
                value={constraints.maxLatencyMs}
                onChange={(e) => setConstraints({ ...constraints, maxLatencyMs: Number(e.target.value) })}
                className="w-full accent-amber-400 bg-[#131B2E] cursor-pointer"
              />
            </div>

            {/* Max Power Watts Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Max Power Envelope (TDP):</span>
                <span className="text-rose-400 font-bold">{constraints.maxPowerWatts} W</span>
              </div>
              <input
                type="range"
                min="30"
                max="1000"
                step="20"
                value={constraints.maxPowerWatts}
                onChange={(e) => setConstraints({ ...constraints, maxPowerWatts: Number(e.target.value) })}
                className="w-full accent-rose-400 bg-[#131B2E] cursor-pointer"
              />
            </div>

            {/* Form Factor Filter */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block">Target Form Factor</label>
              <select
                value={constraints.formFactor}
                onChange={(e) => setConstraints({ ...constraints, formFactor: e.target.value })}
                className="w-full bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="All">All Form Factors</option>
                <option value="Data Center">Data Center</option>
                <option value="Workstation / PCIe">Workstation / PCIe</option>
                <option value="Edge / Embedded">Edge / Embedded</option>
              </select>
            </div>
          </div>

          {/* Right Results: Ranked Recommendations */}
          <div className="lg:col-span-8 space-y-4">
            <span className="text-xs font-mono text-slate-400 block font-bold">
              Ranked Pareto-Optimal Hardware Matches ({rankedRecommendations.length} Evaluated):
            </span>

            <div className="space-y-4">
              {rankedRecommendations.map((rec, index) => (
                <div 
                  key={rec.hardware.id}
                  className={`bg-[#0D1322] border rounded-3xl p-6 transition-all ${
                    index === 0 
                      ? 'border-emerald-500/80 bg-emerald-950/10 ring-1 ring-emerald-500/30' 
                      : 'border-[#1E293B] hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
                    <div>
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <span className="text-[10px] font-mono font-bold bg-emerald-500 text-[#07090E] px-2 py-0.5 rounded uppercase">
                            #1 Top Match
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-cyan-400">{rec.hardware.vendor}</span>
                        <span className="text-xs font-mono text-slate-400">({rec.hardware.formFactor})</span>
                      </div>
                      <h4 className="text-xl font-bold font-mono text-white mt-0.5">{rec.hardware.name}</h4>
                    </div>

                    {/* Fit Score Badge */}
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Pareto Fit Score</span>
                      <span className={`text-2xl font-black font-mono ${
                        rec.fitScore >= 80 ? 'text-emerald-400' : rec.fitScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {rec.fitScore} / 100
                      </span>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs font-mono">
                    <div className="bg-[#07090E] p-3 rounded-xl border border-[#1E293B]">
                      <span className="text-slate-400 block text-[10px]">Latency:</span>
                      <span className="font-bold text-white text-sm">{(rec.metrics.latencyMs || 0).toFixed(1)} ms</span>
                    </div>
                    <div className="bg-[#07090E] p-3 rounded-xl border border-[#1E293B]">
                      <span className="text-slate-400 block text-[10px]">Throughput:</span>
                      <span className="font-bold text-cyan-300 text-sm">{(rec.metrics.throughputFps || 0).toFixed(0)} FPS</span>
                    </div>
                    <div className="bg-[#07090E] p-3 rounded-xl border border-[#1E293B]">
                      <span className="text-slate-400 block text-[10px]">Monthly TCO:</span>
                      <span className="font-bold text-emerald-300 text-sm">${(rec.metrics.monthlyCost || 0).toFixed(0)}/mo</span>
                    </div>
                    <div className="bg-[#07090E] p-3 rounded-xl border border-[#1E293B]">
                      <span className="text-slate-400 block text-[10px]">Power:</span>
                      <span className="font-bold text-amber-300 text-sm">{rec.hardware.tdpWatts} W</span>
                    </div>
                  </div>

                  {/* Reasons & Warnings */}
                  <div className="space-y-1.5 text-xs font-mono">
                    {rec.reasons.map((r, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                    {rec.warnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
