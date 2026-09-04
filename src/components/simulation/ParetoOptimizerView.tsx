import React, { useState, useMemo } from 'react';
import { HARDWARE_CATALOG, MODEL_CATALOG } from '../../data/mockData';
import { simulateInference } from '../../simulation/performanceEngine';
import { MeasurementBadge } from '../MeasurementBadge';
import { PrecisionType, HardwareProfile } from '../../types';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Sparkles,
  Zap,
  DollarSign,
  Clock,
  Layers,
  Award
} from 'lucide-react';

interface CandidateConfig {
  id: string;
  hardware: HardwareProfile;
  precision: PrecisionType;
  tensorParallelSize: number;
  tokensPerSec: number;
  ttftMs: number;
  itlMs: number;
  costPerMillionTokens: number;
  isOom: boolean;
  vramRequiredGb: number;
  isParetoOptimal: boolean;
  recommendationRank?: number;
}

export const ParetoOptimizerView: React.FC = () => {
  const [selectedModelId, setSelectedModelId] = useState<string>('llama-3-70b-instruct');
  const [maxTtftMs, setMaxTtftMs] = useState<number>(350);
  const [maxItlMs, setMaxItlMs] = useState<number>(30);
  const [maxCostPerMillion, setMaxCostPerMillion] = useState<number>(5.0);
  const [targetBatchSize, setTargetBatchSize] = useState<number>(8);

  const currentModel = useMemo(() => {
    return MODEL_CATALOG.find((m) => m.id === selectedModelId) || MODEL_CATALOG[0];
  }, [selectedModelId]);

  // Generate and evaluate exhaustive search space of candidates
  const candidateResults = useMemo(() => {
    const precisions = ['FP16', 'FP8', 'INT8', 'INT4'] as const;
    const tpOptions = [1, 2, 4, 8];
    const rawCandidates: CandidateConfig[] = [];

    HARDWARE_CATALOG.forEach((hw) => {
      precisions.forEach((prec) => {
        tpOptions.forEach((tp) => {
          // Skip impossible configurations (e.g. consumer cards with TP=8)
          if (hw.formFactor === 'Mobile SoC' && tp > 1) return;
          if (hw.formFactor === 'Workstation / PCIe' && tp > 2) return;

          const sim = simulateInference({
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
            hardware: hw,
            precision: prec,
            batchSize: targetBatchSize,
            contextLength: 2048,
            outputTokens: 256,
            concurrency: 1,
            runtime: 'vLLM',
            tensorParallelSize: tp,
            kvPrecision: prec === 'INT4' ? 'INT4' : (prec === 'FP8' ? 'FP8' : 'FP16'),
            enableFlashAttention: true
          });

          if (!sim.isOom) {
            rawCandidates.push({
              id: `${hw.id}-${prec}-tp${tp}`,
              hardware: hw,
              precision: prec,
              tensorParallelSize: tp,
              tokensPerSec: sim.performance.aggregateTokensPerSec,
              ttftMs: sim.performance.ttftMs,
              itlMs: sim.performance.itlMs,
              costPerMillionTokens: sim.efficiency.costPerMillionTokensUsd,
              isOom: sim.isOom,
              vramRequiredGb: sim.vramRequiredGb,
              isParetoOptimal: false
            });
          }
        });
      });
    });

    // Identify 2D/3D Pareto Frontier (Maximize Tokens/Sec, Minimize Cost, Meet Latency SLAs)
    // A point A dominates B if A is faster and cheaper
    const marked = rawCandidates.map((candA) => {
      const isDominated = rawCandidates.some((candB) => {
        if (candA.id === candB.id) return false;
        return (
          candB.tokensPerSec >= candA.tokensPerSec &&
          candB.costPerMillionTokens <= candA.costPerMillionTokens &&
          candB.itlMs <= candA.itlMs &&
          (candB.tokensPerSec > candA.tokensPerSec || candB.costPerMillionTokens < candA.costPerMillionTokens)
        );
      });

      return {
        ...candA,
        isParetoOptimal: !isDominated
      };
    });

    // Filter by SLA constraints & sort Pareto-optimal points first
    return marked.sort((a, b) => {
      if (a.isParetoOptimal && !b.isParetoOptimal) return -1;
      if (!a.isParetoOptimal && b.isParetoOptimal) return 1;
      return a.costPerMillionTokens - b.costPerMillionTokens;
    });
  }, [currentModel, targetBatchSize]);

  // SLA Matching subset
  const filteredCandidates = useMemo(() => {
    return candidateResults.filter(
      (c) =>
        c.ttftMs <= maxTtftMs &&
        c.itlMs <= maxItlMs &&
        c.costPerMillionTokens <= maxCostPerMillion
    );
  }, [candidateResults, maxTtftMs, maxItlMs, maxCostPerMillion]);

  // Prepare chart scatter points
  const scatterData = candidateResults.map((c) => ({
    name: `${c.hardware.model} (${c.precision}${c.tensorParallelSize > 1 ? ` TP=${c.tensorParallelSize}` : ''})`,
    cost: Number(c.costPerMillionTokens.toFixed(3)),
    throughput: Math.round(c.tokensPerSec),
    itl: Number(c.itlMs.toFixed(1)),
    isPareto: c.isParetoOptimal,
    passesSla: c.ttftMs <= maxTtftMs && c.itlMs <= maxItlMs && c.costPerMillionTokens <= maxCostPerMillion
  }));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-xl p-5 border border-indigo-900/40 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Pareto Optimal Hardware & Precision Optimizer
            </h2>
            <MeasurementBadge status="SIMULATED" size="md" />
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Automatically discover the mathematically Pareto-optimal configurations balancing throughput, latency SLAs, and dollar cost for your target model.
          </p>
        </div>
      </div>

      {/* SLA Target Controls Bar */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 backdrop-blur-md shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Model Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Model Architecture</label>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            {MODEL_CATALOG.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.parameterCountFormatted})
              </option>
            ))}
          </select>
        </div>

        {/* Max Allowed ITL */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Max Allowed ITL</span>
            <span className="text-amber-400 font-semibold">&le; {maxItlMs} ms</span>
          </div>
          <input
            type="range"
            min={10}
            max={80}
            step={2}
            value={maxItlMs}
            onChange={(e) => setMaxItlMs(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-1"
          />
          <span className="text-[10px] text-slate-500">Target per-token latency</span>
        </div>

        {/* Max Allowed TTFT */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Max Allowed TTFT</span>
            <span className="text-cyan-400 font-semibold">&le; {maxTtftMs} ms</span>
          </div>
          <input
            type="range"
            min={100}
            max={1000}
            step={50}
            value={maxTtftMs}
            onChange={(e) => setMaxTtftMs(Number(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-1"
          />
          <span className="text-[10px] text-slate-500">Target first token response</span>
        </div>

        {/* Cost Budget */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Cost Ceiling</span>
            <span className="text-emerald-400 font-semibold">&le; ${maxCostPerMillion.toFixed(2)} / 1M</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={10.0}
            step={0.5}
            value={maxCostPerMillion}
            onChange={(e) => setMaxCostPerMillion(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-1"
          />
          <span className="text-[10px] text-slate-500">Budget threshold</span>
        </div>
      </div>

      {/* Main Content: Pareto Frontier Plot (Top) & Ranked Recommendations Table (Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pareto Frontier Scatter Chart (7/12) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-xl border border-slate-800 p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Pareto Frontier: Throughput vs. Dollar Cost
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Optimal configurations lie along the top-left envelope (High TPS, Low Cost)
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                Pareto Optimal
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                Sub-Optimal
              </span>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  type="number"
                  dataKey="cost"
                  name="Cost ($ / 1M tokens)"
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(v) => `$${v}`}
                  label={{
                    value: 'Cost per 1M Tokens ($)',
                    position: 'insideBottom',
                    offset: -12,
                    fill: '#94a3b8',
                    fontSize: 12
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="throughput"
                  name="Throughput (Tokens / sec)"
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  label={{
                    value: 'Throughput (Tokens / s)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 5,
                    fill: '#94a3b8',
                    fontSize: 12
                  }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-2xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.name}</p>
                          <p className="text-indigo-300">
                            Throughput: <strong>{data.throughput.toLocaleString()} tok/s</strong>
                          </p>
                          <p className="text-emerald-400">
                            Cost: <strong>${data.cost} / 1M tokens</strong>
                          </p>
                          <p className="text-amber-400">
                            ITL: <strong>{data.itl} ms / token</strong>
                          </p>
                          {data.isPareto && (
                            <p className="text-xs font-bold text-emerald-400 pt-1 border-t border-slate-800">
                              ★ Pareto Optimal Configuration
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isPareto ? '#10b981' : (entry.passesSla ? '#6366f1' : '#475569')}
                      r={entry.isPareto ? 6 : 4}
                      stroke={entry.isPareto ? '#fff' : '#1e293b'}
                      strokeWidth={entry.isPareto ? 1.5 : 0.5}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 3 Pareto Recommendations (5/12) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-xl border border-slate-800 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Award className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Optimal Recommendations for SLA
              </h3>
            </div>

            <div className="space-y-3 mt-4">
              {filteredCandidates.slice(0, 3).map((cand, idx) => (
                <div
                  key={cand.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-600/60 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {cand.hardware.name}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300 font-semibold">
                      {cand.precision} {cand.tensorParallelSize > 1 ? `(TP=${cand.tensorParallelSize})` : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Throughput</span>
                      <strong className="text-indigo-300">
                        {Math.round(cand.tokensPerSec).toLocaleString()} tok/s
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">ITL Latency</span>
                      <strong className="text-amber-400">
                        {cand.itlMs.toFixed(1)} ms
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Cost / 1M</span>
                      <strong className="text-emerald-400">
                        ${cand.costPerMillionTokens.toFixed(3)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}

              {filteredCandidates.length === 0 && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300 text-center">
                  No configuration meets all strict SLAs. Try relaxing the max ITL or cost budget sliders.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Evaluated <strong>{candidateResults.length}</strong> candidate architectural permutations.
          </div>
        </div>
      </div>
    </div>
  );
};
