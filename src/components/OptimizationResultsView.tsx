import React, { useState } from 'react';
import { 
  GitCompare, 
  Flame, 
  Sliders, 
  DollarSign, 
  Code2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Cpu, 
  Activity, 
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  Server,
  Thermometer
} from 'lucide-react';
import { OptimizationJob, BenchmarkResult, FlamegraphNode, DeploymentCodeSnippet } from '../types';
import { CLOUD_TCO_MODELS, SAMPLE_CODE_SNIPPETS } from '../data/mockData';
import { OptimizationDiffCard } from './OptimizationDiffCard';
import { ConceptTooltip } from './ConceptTooltip';
import { ThermalHeatmapVisualizer } from './ThermalHeatmapVisualizer';
import { QuantizationAccuracySimulator } from './QuantizationAccuracySimulator';
import { MultiHardwareComparator } from './MultiHardwareComparator';
import { ProductionContainerGenerator } from './ProductionContainerGenerator';

interface OptimizationResultsViewProps {
  job: OptimizationJob;
}

export const OptimizationResultsView: React.FC<OptimizationResultsViewProps> = ({
  job,
}) => {
  const [activeTab, setActiveTab] = useState<'pareto' | 'thermal' | 'quant_sim' | 'comparator' | 'k8s_deploy' | 'table' | 'flamegraph' | 'batch' | 'tco' | 'export'>('pareto');
  const [selectedSnippetTab, setSelectedSnippetTab] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // TCO Calculator state
  const [monthlyInferencesMillions, setMonthlyInferencesMillions] = useState<number>(50);
  const [activeHoursPerDay, setActiveHoursPerDay] = useState<number>(24);

  // Flamegraph Selected Node State
  const [selectedFlameNode, setSelectedFlameNode] = useState<FlamegraphNode | null>(
    job.flamegraph[0]?.children?.[1] || job.flamegraph[0] || null
  );

  const snippets = SAMPLE_CODE_SNIPPETS[job.modelId] || SAMPLE_CODE_SNIPPETS['yolov8x-det'] || [];
  const currentSnippet = snippets[selectedSnippetTab] || snippets[0];

  const handleCopyCode = () => {
    if (currentSnippet?.code) {
      navigator.clipboard.writeText(currentSnippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const defaultFallbackResult: BenchmarkResult = {
    hardwareId: 'nvidia-rtx-4090',
    hardwareName: 'NVIDIA GeForce RTX 4090',
    vendor: 'NVIDIA',
    hardwareType: 'GPU',
    runtimeEngine: 'TensorRT',
    precision: 'INT8',
    batchSize: 1,
    latencyMs: 3.2,
    p99LatencyMs: 3.8,
    throughputFps: 312,
    powerConsumptionWatts: 280,
    memoryUsedMb: 2400,
    costPerMillionInferencesUsd: 0.12,
    efficiencyScore: 88,
    isParetoOptimal: true,
  };

  const results = (job.results && job.results.length > 0) ? job.results : [defaultFallbackResult];
  const paretoOptimalResults = results.filter((r) => r.isParetoOptimal);
  const bestLatencyResult = [...results].sort((a, b) => (a.latencyMs || 0) - (b.latencyMs || 0))[0] || defaultFallbackResult;
  const bestEfficiencyResult = [...results].sort((a, b) => ((b.throughputFps || 0) / Math.max(1, b.powerConsumptionWatts || 1)) - ((a.throughputFps || 0) / Math.max(1, a.powerConsumptionWatts || 1)))[0] || defaultFallbackResult;

  // Batch sweep data for selected hardware
  const defaultHwId = Object.keys(job.batchSweepData || {})[0] || 'nvidia-rtx-4090';
  const [selectedSweepHw, setSelectedSweepHw] = useState<string>(defaultHwId);
  const currentSweep = (job.batchSweepData && job.batchSweepData[selectedSweepHw]) || (job.batchSweepData && job.batchSweepData[defaultHwId]) || [];

  const baselineCost = +(Number(bestLatencyResult.costPerMillionInferencesUsd || 0.12) * 3.6).toFixed(2);
  const optimizedCost = Number(bestLatencyResult.costPerMillionInferencesUsd ?? 0.12);

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner / Job Metadata */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                {job.modelCategory}
              </span>
              <span className="text-xs font-mono text-slate-400">Job ID: {job.id}</span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Completed</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1.5">
              {job.modelName} — Optimization Report
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Objective: <strong className="text-cyan-300 uppercase">{job.objective.replace('_', ' ')}</strong> • Target Precisions: {job.targetPrecisions.join(', ')}
            </p>
          </div>

          {/* Export Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('export')}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#07090E] text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer transition-transform hover:scale-105"
            >
              <Code2 className="w-4 h-4" />
              <span>Get Deployment Code</span>
            </button>
          </div>
        </div>

        {/* Compiler Insight Summary Pill & Thermal Telemetry Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {job.aiInsights && (
            <div className="md:col-span-2 bg-[#07090E] border border-cyan-900/40 rounded-2xl p-4 flex items-start gap-3 text-xs">
              <Cpu className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-mono font-bold text-cyan-300">Automated Compiler Analysis:</span>
                <p className="text-slate-300 leading-relaxed">{job.aiInsights.summary}</p>
              </div>
            </div>
          )}

          <div
            onClick={() => setActiveTab('thermal')}
            className="bg-gradient-to-br from-rose-950/40 via-[#0E1726] to-[#07090E] border border-rose-900/40 hover:border-rose-500/60 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Thermometer className="w-4 h-4 text-rose-400 animate-pulse" />
              </div>
              <div>
                <span className="font-mono font-bold text-rose-300 block">Thermal Heatmap</span>
                <span className="text-[11px] text-slate-400">Bottlenecks & compute capacity</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Tangible Optimization Diff Card (Before vs. After Baseline Scorecard) */}
      <OptimizationDiffCard
        modelName={job.modelName}
        baseline={{
          precision: 'FP16',
          vramGb: job.modelCategory?.includes('LLM') ? 16.0 : (job.modelCategory?.includes('Vision') ? 4.8 : 2.5),
          latencyMs: +(Number(bestLatencyResult.latencyMs || 8.0) * 2.9).toFixed(1),
          throughputFps: Math.max(1, Math.round((bestLatencyResult.throughputFps || 100) * 0.35)),
          costPerMillion: baselineCost,
          hardwareName: 'Baseline Framework'
        }}
        optimized={{
          precision: bestLatencyResult.precision || 'INT8',
          vramGb: job.modelCategory?.includes('LLM') ? 4.2 : (job.modelCategory?.includes('Vision') ? 1.2 : 0.8),
          latencyMs: bestLatencyResult.latencyMs || 3.2,
          throughputFps: bestLatencyResult.throughputFps || 312,
          costPerMillion: optimizedCost,
          hardwareName: bestLatencyResult.hardwareName || 'NVIDIA RTX 4090'
        }}
        plainEnglishVerdict={job.aiInsights?.recommendation}
      />

      {/* Dedicated Interactive Tab Navigation Bar */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-2.5 shadow-xl sticky top-2 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'pareto', label: 'Pareto Frontier Visualizer', icon: GitCompare },
            { id: 'thermal', label: 'Layer Thermal Heatmap', icon: Thermometer },
            { id: 'quant_sim', label: 'Accuracy & Quant Simulator', icon: Sparkles, badge: 'New' },
            { id: 'comparator', label: 'A/B Multi-Chip Comparator', icon: Activity, badge: 'New' },
            { id: 'k8s_deploy', label: 'Production Container & K8s', icon: Server, badge: 'New' },
            { id: 'table', label: 'Hardware Matrix Table', icon: Cpu },
            { id: 'flamegraph', label: 'Kernel Flamegraph', icon: Flame },
            { id: 'batch', label: 'Batch Sweep Finder', icon: Sliders },
            { id: 'tco', label: 'Cloud TCO & ROI Calculator', icon: DollarSign },
            { id: 'export', label: 'Code & SDK Export', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/25 scale-[1.02]'
                    : 'bg-[#131B2E] text-slate-300 hover:text-white hover:bg-[#1E293B] border border-transparent hover:border-[#27354F]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && !isActive && (
                  <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800/60 font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: PARETO FRONTIER */}
      {activeTab === 'pareto' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scatter Plot Visualizer (2 Cols) */}
          <div className="lg:col-span-2 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-cyan-400" />
                  <span>Multi-Dimensional Pareto Frontier (Latency vs Power vs Throughput)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Optimal configurations along the efficiency boundary are highlighted in glowing emerald.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/60">
                {paretoOptimalResults.length} Pareto Nodes
              </span>
            </div>

            {/* Custom SVG Pareto Canvas */}
            <div className="relative w-full h-80 bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between select-none">
              {/* Axes Labels */}
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>▲ Power (Watts) / High Energy</span>
                <span>Latency (ms) vs Power (W) Scatter Boundary</span>
              </div>

              {/* Grid Lines and Data Points */}
              <div className="relative w-full h-56 border-b border-l border-[#1E293B]">
                {/* Horizontal guide lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-dashed border-cyan-500 w-full" />
                  <div className="border-b border-dashed border-cyan-500 w-full" />
                  <div className="border-b border-dashed border-cyan-500 w-full" />
                </div>

                {/* Pareto Frontier Curve Overlay (SVG Path) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path
                    d="M 25 210 Q 90 140 180 60 T 380 20"
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.6)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>

                {/* Scatter Points */}
                {results.map((res, idx) => {
                  // Coordinate mapping: X = Latency, Y = Power (inverted)
                  const xPct = Math.min(92, Math.max(8, (res.latencyMs / 18) * 85));
                  const yPct = Math.min(90, Math.max(10, 100 - (res.powerConsumptionWatts / 750) * 85));

                  return (
                    <div
                      key={idx}
                      style={{ left: `${xPct}%`, top: `${yPct}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                          res.isParetoOptimal
                            ? 'bg-emerald-400 ring-4 ring-emerald-500/30 scale-110 animate-pulse'
                            : 'bg-cyan-500/80 ring-2 ring-cyan-500/20 hover:scale-125'
                        }`}
                      />

                      {/* Tooltip Card */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-30 w-48 p-3 bg-[#0D1322] border border-cyan-500/80 rounded-xl shadow-2xl font-mono text-[10px] space-y-1 pointer-events-none">
                        <div className="font-bold text-white truncate">{res.hardwareName}</div>
                        <div className="text-cyan-300">Latency: {res.latencyMs} ms</div>
                        <div className="text-emerald-300">Throughput: {res.throughputFps} FPS</div>
                        <div className="text-amber-300">Power: {res.powerConsumptionWatts} W</div>
                        <div className="text-slate-400">Cost/1M: ${res.costPerMillionInferencesUsd}</div>
                        {res.isParetoOptimal && (
                          <div className="text-emerald-400 font-bold pt-1 border-t border-[#1E293B]">
                            ★ Pareto Optimal Frontier
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0 ms (Ultra Fast)</span>
                <span>Inference Latency (ms) ►</span>
                <span>20 ms</span>
              </div>
            </div>
          </div>

          {/* Pareto Frontier Insights Card */}
          <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white font-mono">Pareto Frontier Highlights</h3>

              <div className="space-y-3">
                <div className="p-4 bg-[#07090E] border border-emerald-800/40 rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-emerald-400 font-bold">Fastest Single Batch</span>
                    <span className="text-white">{bestLatencyResult.latencyMs} ms</span>
                  </div>
                  <div className="font-mono text-slate-300">{bestLatencyResult.hardwareName}</div>
                  <p className="text-[11px] text-slate-500 font-sans">Delivers {bestLatencyResult.throughputFps} FPS in INT8 mode.</p>
                </div>

                <div className="p-4 bg-[#07090E] border border-cyan-800/40 rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-cyan-400 font-bold">Best Energy Efficiency</span>
                    <span className="text-white">
                      {((bestEfficiencyResult.throughputFps || 0) / Math.max(1, bestEfficiencyResult.powerConsumptionWatts || 1)).toFixed(2)} FPS/W
                    </span>
                  </div>
                  <div className="font-mono text-slate-300">{bestEfficiencyResult.hardwareName || 'NVIDIA RTX 4090'}</div>
                  <p className="text-[11px] text-slate-500 font-sans">Consumes only {bestEfficiencyResult.powerConsumptionWatts || 280}W active power.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('table')}
              className="w-full py-3 bg-[#131B2E] hover:bg-[#1E293B] text-cyan-300 hover:text-white font-bold text-xs rounded-xl border border-cyan-500/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Inspect Full Metric Comparison Matrix</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: HARDWARE MATRIX TABLE */}
      {activeTab === 'table' && (
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white font-mono">Hardware Benchmark & Resource Matrix</h3>
              <p className="text-xs text-slate-400">Comparing compiler runtime engines across verified test hardware.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#07090E] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E293B]">
                <tr>
                  <th className="py-3 px-4">Hardware Target</th>
                  <th className="py-3 px-4">Vendor & Engine</th>
                  <th className="py-3 px-4">Precision</th>
                  <th className="py-3 px-4">Latency (ms)</th>
                  <th className="py-3 px-4">Throughput (FPS)</th>
                  <th className="py-3 px-4">Power (W)</th>
                  <th className="py-3 px-4">Cost / 1M</th>
                  <th className="py-3 px-4">Pareto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60 text-slate-300">
                {results.map((res, idx) => (
                  <tr key={idx} className="hover:bg-[#131B2E] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {res.hardwareName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-cyan-300 font-semibold">{res.vendor}</span> • {res.runtimeEngine}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#1A2338] text-slate-200 text-[10px]">
                        {res.precision}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-400">
                      {res.latencyMs} ms
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      {res.throughputFps}
                    </td>
                    <td className="py-3 px-4 text-amber-300">
                      {res.powerConsumptionWatts} W
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-bold">
                      ${res.costPerMillionInferencesUsd}
                    </td>
                    <td className="py-3 px-4">
                      {res.isParetoOptimal ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Optimal
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Dominated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: THERMAL HEATMAP & COMPUTE BOTTLENECKS */}
      {activeTab === 'thermal' && (
        <ThermalHeatmapVisualizer job={job} />
      )}

      {/* TAB: ACCURACY & QUANTIZATION DEGRADATION SIMULATOR */}
      {activeTab === 'quant_sim' && (
        <QuantizationAccuracySimulator job={job} initialModelId={job.modelId} />
      )}

      {/* TAB: MULTI-HARDWARE A/B COMPARATOR & STREAMING BENCHMARK */}
      {activeTab === 'comparator' && (
        <MultiHardwareComparator initialModelId={job.modelId} />
      )}

      {/* TAB: PRODUCTION CONTAINER & KUBERNETES GENERATOR */}
      {activeTab === 'k8s_deploy' && (
        <ProductionContainerGenerator job={job} initialModelId={job.modelId} />
      )}

      {/* TAB 3: KERNEL FLAMEGRAPH */}
      {activeTab === 'flamegraph' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Interactive Kernel Flamegraph</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Click any layer block to view microsecond execution time and roofline memory bottlenecks.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                Total Latency: {job.flamegraph[0]?.durationMs || 4.2} ms
              </span>
            </div>

            {/* Flamegraph Visual Hierarchy Blocks */}
            <div className="space-y-3 font-mono text-xs select-none">
              {/* Root Layer */}
              <div
                onClick={() => setSelectedFlameNode(job.flamegraph[0])}
                className="w-full p-3 bg-gradient-to-r from-cyan-900 to-indigo-900 border border-cyan-500/60 rounded-xl cursor-pointer hover:brightness-125 transition-all text-center font-bold text-white"
              >
                {job.flamegraph[0]?.name} (100% • {job.flamegraph[0]?.durationMs} ms)
              </div>

              {/* Child Sub-Layers */}
              <div className="grid grid-cols-12 gap-1.5">
                {job.flamegraph[0]?.children?.map((child) => {
                  const spanCols = Math.max(2, Math.round((child.percentTotal / 100) * 12));
                  const isSelected = selectedFlameNode?.id === child.id;
                  return (
                    <div
                      key={child.id}
                      onClick={() => setSelectedFlameNode(child)}
                      style={{ gridColumn: `span ${spanCols}` }}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all truncate text-center font-semibold text-[11px] ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500 text-[#07090E] font-bold shadow-lg'
                          : child.isBottleneck
                          ? 'bg-red-950/80 border-red-700/60 text-red-300 hover:bg-red-900'
                          : 'bg-[#131B2E] border-[#27354F] text-slate-300 hover:bg-[#1C2740]'
                      }`}
                    >
                      <div>{child.name}</div>
                      <div className="text-[9px] opacity-80">{child.durationMs}ms ({child.percentTotal}%)</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-[#1E293B]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-900 border border-red-700" />
                <span>Memory Bottleneck Operator</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#131B2E] border border-[#27354F]" />
                <span>Standard Vectorized Kernel</span>
              </div>
            </div>
          </div>

          {/* Node Inspector Detail Panel */}
          {selectedFlameNode && (
            <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
              <div className="border-b border-[#1E293B] pb-3">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                  Operator Layer Inspector
                </span>
                <h4 className="text-base font-bold text-white font-mono mt-1">
                  {selectedFlameNode.name}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Duration</span>
                  <div className="text-amber-300 font-bold">{selectedFlameNode.durationMs} ms</div>
                </div>
                <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Share of Total</span>
                  <div className="text-cyan-300 font-bold">{selectedFlameNode.percentTotal}%</div>
                </div>
                <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Memory Bandwidth</span>
                  <div className="text-emerald-300 font-bold">{selectedFlameNode.memoryBandwidthGBs} GB/s</div>
                </div>
                <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Arithmetic Intensity</span>
                  <div className="text-indigo-300 font-bold">{selectedFlameNode.arithmeticIntensityFlopsPerByte} FLOP/B</div>
                </div>
              </div>

              {selectedFlameNode.isBottleneck && (
                <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl space-y-2 text-xs">
                  <div className="font-mono font-bold text-red-400">⚠ Bottleneck Identified</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{selectedFlameNode.bottleneckReason}</p>
                  <div className="pt-2 border-t border-red-900/40 font-mono text-emerald-300 text-[11px]">
                    <strong>Suggested Fix:</strong> {selectedFlameNode.suggestedOptimization}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BATCH SWEEP FINDER */}
      {activeTab === 'batch' && (
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Batch Size Sweep Analyzer (Throughput vs Latency Saturation)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Find the sweet spot where GPU throughput saturates before latency degrades beyond your SLA.
              </p>
            </div>

            {/* Hardware Switcher */}
            <div className="flex items-center gap-2">
              {Object.keys(job.batchSweepData).map((hwId) => (
                <button
                  key={hwId}
                  onClick={() => setSelectedSweepHw(hwId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer ${
                    selectedSweepHw === hwId
                      ? 'bg-cyan-500 text-[#07090E]'
                      : 'bg-[#131B2E] text-slate-400 hover:text-white'
                  }`}
                >
                  {hwId}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#07090E] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E293B]">
                <tr>
                  <th className="py-3 px-4">Batch Size</th>
                  <th className="py-3 px-4">Throughput (FPS)</th>
                  <th className="py-3 px-4">Avg Latency (ms)</th>
                  <th className="py-3 px-4">P99 Latency (ms)</th>
                  <th className="py-3 px-4">VRAM Usage</th>
                  <th className="py-3 px-4">Power (Watts)</th>
                  <th className="py-3 px-4">Efficiency (FPS/W)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60 text-slate-300">
                {currentSweep.map((pt, idx) => (
                  <tr key={idx} className="hover:bg-[#131B2E] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">Batch = {pt.batchSize}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">{pt.throughputFps} FPS</td>
                    <td className="py-3 px-4 text-cyan-400">{pt.latencyMs} ms</td>
                    <td className="py-3 px-4 text-slate-300">{pt.p99LatencyMs} ms</td>
                    <td className="py-3 px-4 text-slate-400">{pt.gpuMemoryMb} MB</td>
                    <td className="py-3 px-4 text-amber-300">{pt.powerWatts} W</td>
                    <td className="py-3 px-4 text-indigo-300 font-bold">{pt.efficiencyFpsPerWatt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CLOUD TCO & ROI CALCULATOR */}
      {activeTab === 'tco' && (
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Cloud TCO & On-Premises ROI Calculator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Simulate monthly cloud infrastructure spend across AWS, GCP, Azure vs. On-Premise dedicated workstations.
            </p>
          </div>

          {/* Interactive Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-[#07090E] border border-[#1E293B] rounded-2xl">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Monthly Request Volume</span>
                <span className="text-cyan-400 font-bold">{monthlyInferencesMillions} Million Requests</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={monthlyInferencesMillions}
                onChange={(e) => setMonthlyInferencesMillions(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Active Workload Hours / Day</span>
                <span className="text-emerald-400 font-bold">{activeHoursPerDay} Hours / Day</span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                value={activeHoursPerDay}
                onChange={(e) => setActiveHoursPerDay(parseInt(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Cloud Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#07090E] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E293B]">
                <tr>
                  <th className="py-3 px-4">Provider & Instance</th>
                  <th className="py-3 px-4">Hardware Config</th>
                  <th className="py-3 px-4">Hourly Price</th>
                  <th className="py-3 px-4">Estimated Monthly Spend</th>
                  <th className="py-3 px-4">Cost / 1M Inferences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60 text-slate-300">
                {CLOUD_TCO_MODELS.map((m, idx) => {
                  const estMonthly = Math.round(m.hourlyPriceUsd * activeHoursPerDay * 30.5);
                  return (
                    <tr key={idx} className="hover:bg-[#131B2E] transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        <span className="text-cyan-400 mr-2">{m.provider}</span>
                        {m.instanceType}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{m.hardware}</td>
                      <td className="py-3 px-4 text-slate-400">${m.hourlyPriceUsd} / hr</td>
                      <td className="py-3 px-4 font-bold text-amber-400">
                        ${estMonthly.toLocaleString()} / mo
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        ${m.costPerMillionInferencesUsd}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: CODE EXPORTER */}
      {activeTab === 'export' && (
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>Production Deployment Code Exporter</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero-overhead inference engine wrappers, Docker containers, and Kubernetes manifests.
              </p>
            </div>

            {/* Language & Engine Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {snippets.map((snip, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSnippetTab(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedSnippetTab === idx
                      ? 'bg-cyan-500 text-[#07090E]'
                      : 'bg-[#131B2E] text-slate-400 hover:text-white'
                  }`}
                >
                  {snip.filename}
                </button>
              ))}
            </div>
          </div>

          {/* Code Viewer Box */}
          <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0A0E1A] border-b border-[#1E293B] text-xs font-mono">
              <span className="text-cyan-300 font-bold">{currentSnippet?.title}</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white rounded-lg border border-[#27354F] transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed">
              <code>{currentSnippet?.code}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
