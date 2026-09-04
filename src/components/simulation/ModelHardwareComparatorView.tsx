import React, { useState, useMemo } from 'react';
import { HARDWARE_CATALOG, MODEL_CATALOG } from '../../data/mockData';
import { simulateInference } from '../../simulation/performanceEngine';
import { MeasurementBadge } from '../MeasurementBadge';
import { PrecisionType, RuntimeEngine } from '../../types';
import {
  Scale,
  Plus,
  Trash2,
  Trophy,
  Zap,
  DollarSign,
  Clock,
  HardDrive,
  BarChart3,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sliders
} from 'lucide-react';

interface ComparisonTarget {
  id: string;
  hardwareId: string;
  precision: PrecisionType;
  tensorParallelSize: number;
}

export const ModelHardwareComparatorView: React.FC = () => {
  const [selectedModelId, setSelectedModelId] = useState<string>('llama-3-70b-instruct');
  const [batchSize, setBatchSize] = useState<number>(8);
  const [contextLength, setContextLength] = useState<number>(2048);
  const [outputTokens, setOutputTokens] = useState<number>(256);
  const [runtime, setRuntime] = useState<RuntimeEngine>('vLLM');

  // Multi-hardware comparison targets (up to 4)
  const [targets, setTargets] = useState<ComparisonTarget[]>([
    { id: 'target-1', hardwareId: 'nvidia-h100-sxm', precision: 'FP8', tensorParallelSize: 1 },
    { id: 'target-2', hardwareId: 'nvidia-h200-sxm', precision: 'FP8', tensorParallelSize: 1 },
    { id: 'target-3', hardwareId: 'nvidia-b200', precision: 'FP8', tensorParallelSize: 1 },
    { id: 'target-4', hardwareId: 'amd-mi300x', precision: 'FP8', tensorParallelSize: 1 }
  ]);

  const currentModel = useMemo(() => {
    return MODEL_CATALOG.find((m) => m.id === selectedModelId) || MODEL_CATALOG[0];
  }, [selectedModelId]);

  // Compute simulations for all targets
  const targetResults = useMemo(() => {
    return targets.map((target) => {
      const hw = HARDWARE_CATALOG.find((h) => h.id === target.hardwareId) || HARDWARE_CATALOG[0];
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
        precision: target.precision,
        batchSize: batchSize,
        contextLength: contextLength,
        outputTokens: outputTokens,
        concurrency: 1,
        runtime: runtime,
        tensorParallelSize: target.tensorParallelSize,
        kvPrecision: target.precision === 'INT4' ? 'INT4' : (target.precision === 'FP8' ? 'FP8' : 'FP16'),
        enableFlashAttention: true
      });

      return {
        target,
        hardware: hw,
        simulation: sim
      };
    });
  }, [targets, currentModel, batchSize, contextLength, outputTokens, runtime]);

  // Find best performers
  const bestTps = Math.max(...targetResults.map((r) => r.simulation.performance.aggregateTokensPerSec));
  const bestTtft = Math.min(...targetResults.map((r) => r.simulation.performance.ttftMs));
  const bestCost = Math.min(...targetResults.map((r) => r.simulation.efficiency.costPerMillionTokensUsd));
  const bestVram = Math.min(...targetResults.map((r) => r.simulation.vramRequiredGb));

  const addTarget = () => {
    if (targets.length >= 4) return;
    const newId = `target-${Date.now()}`;
    const nextHw = HARDWARE_CATALOG[targets.length % HARDWARE_CATALOG.length].id;
    setTargets([...targets, { id: newId, hardwareId: nextHw, precision: 'FP8', tensorParallelSize: 1 }]);
  };

  const removeTarget = (id: string) => {
    if (targets.length <= 2) return;
    setTargets(targets.filter((t) => t.id !== id));
  };

  const updateTargetHw = (id: string, hardwareId: string) => {
    setTargets(targets.map((t) => (t.id === id ? { ...t, hardwareId } : t)));
  };

  const updateTargetPrec = (id: string, precision: PrecisionType) => {
    setTargets(targets.map((t) => (t.id === id ? { ...t, precision } : t)));
  };

  const updateTargetTp = (id: string, tensorParallelSize: number) => {
    setTargets(targets.map((t) => (t.id === id ? { ...t, tensorParallelSize } : t)));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-xl p-5 border border-indigo-900/40 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Scale className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Model × Hardware Matrix Comparator
            </h2>
            <MeasurementBadge status="SIMULATED" size="md" />
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Compare throughput, TTFT, cost, and memory efficiency across multiple GPU architectures and precision configs side-by-side.
          </p>
        </div>

        {targets.length < 4 && (
          <button
            onClick={addTarget}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-indigo-600 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-semibold transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hardware Target</span>
          </button>
        )}
      </div>

      {/* Global Workload Bar */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 backdrop-blur-md shadow-lg grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Model Selection */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Target Model
          </label>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {MODEL_CATALOG.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.parameterCountFormatted})
              </option>
            ))}
          </select>
        </div>

        {/* Batch Size */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Batch Size ({batchSize})
          </label>
          <input
            type="range"
            min={1}
            max={64}
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
          />
        </div>

        {/* Context Length */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Context: {contextLength.toLocaleString()} tok
          </label>
          <input
            type="range"
            min={512}
            max={16384}
            step={512}
            value={contextLength}
            onChange={(e) => setContextLength(Number(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
          />
        </div>

        {/* Runtime */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Runtime Engine
          </label>
          <select
            value={runtime}
            onChange={(e) => setRuntime(e.target.value as RuntimeEngine)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="vLLM">vLLM (PagedAttention)</option>
            <option value="TensorRT-LLM">TensorRT-LLM</option>
            <option value="SGLang">SGLang</option>
            <option value="ONNX Runtime">ONNX Runtime</option>
          </select>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${targets.length} gap-4`}>
        {targetResults.map((item, idx) => {
          const { target, hardware, simulation } = item;
          const isTopTps = simulation.performance.aggregateTokensPerSec === bestTps;
          const isTopTtft = simulation.performance.ttftMs === bestTtft;
          const isTopCost = simulation.efficiency.costPerMillionTokensUsd === bestCost;

          return (
            <div
              key={target.id}
              className={`bg-slate-900/90 rounded-xl border p-4.5 backdrop-blur-md shadow-xl flex flex-col justify-between transition-all ${
                isTopTps ? 'border-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'border-slate-800'
              }`}
            >
              <div>
                {/* Card Header & Configuration */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div className="flex-1 pr-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                      Target #{idx + 1}
                    </span>
                    <select
                      value={target.hardwareId}
                      onChange={(e) => updateTargetHw(target.id, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-white font-semibold mt-1"
                    >
                      {HARDWARE_CATALOG.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {targets.length > 2 && (
                    <button
                      onClick={() => removeTarget(target.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                      title="Remove Target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sub-config: Precision & TP */}
                <div className="grid grid-cols-2 gap-2 my-3">
                  <div>
                    <label className="text-[10px] text-slate-400">Precision</label>
                    <select
                      value={target.precision}
                      onChange={(e) => updateTargetPrec(target.id, e.target.value as PrecisionType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-300 mt-0.5"
                    >
                      <option value="FP16">FP16</option>
                      <option value="BF16">BF16</option>
                      <option value="FP8">FP8</option>
                      <option value="INT8">INT8</option>
                      <option value="INT4">INT4</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Tensor Parallel</label>
                    <select
                      value={target.tensorParallelSize}
                      onChange={(e) => updateTargetTp(target.id, Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-300 mt-0.5"
                    >
                      <option value={1}>1 GPU</option>
                      <option value={2}>2 GPUs</option>
                      <option value={4}>4 GPUs</option>
                      <option value={8}>8 GPUs</option>
                    </select>
                  </div>
                </div>

                {/* Hardware Specs pill */}
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-0.5 mb-4">
                  <p>
                    VRAM: <strong className="text-slate-200">{hardware.memoryGB * target.tensorParallelSize} GB</strong> ({hardware.memoryType || 'HBM'})
                  </p>
                  <p>
                    Bandwidth: <strong className="text-slate-200">{(hardware.memoryBandwidthGBs * target.tensorParallelSize).toLocaleString()} GB/s</strong>
                  </p>
                  <p>
                    Hourly Cost: <strong className="text-slate-200">${((hardware.hourlyCloudCostUsd || 3.5) * target.tensorParallelSize).toFixed(2)}/hr</strong>
                  </p>
                </div>

                {/* Key Metrics Checklist */}
                <div className="space-y-2.5 text-xs">
                  {/* Aggregate TPS */}
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isTopTps 
                      ? 'bg-indigo-950/40 border-indigo-700/60' 
                      : 'bg-slate-950/40 border-slate-800'
                  }`}>
                    <span className="text-slate-400 flex items-center gap-1">
                      {isTopTps && <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
                      Aggregate TPS
                    </span>
                    <span className="font-bold text-white text-sm">
                      {Math.round(simulation.performance.aggregateTokensPerSec).toLocaleString()}{' '}
                      <span className="text-[10px] font-normal text-slate-400">tok/s</span>
                    </span>
                  </div>

                  {/* Single-Stream TPS */}
                  <div className="p-2.5 rounded-lg border bg-slate-950/40 border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">User TPS</span>
                    <span className="font-semibold text-emerald-400">
                      {simulation.performance.tokensPerSecPerRequest.toFixed(1)}{' '}
                      <span className="text-[10px] font-normal text-slate-400">tok/s</span>
                    </span>
                  </div>

                  {/* TTFT */}
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isTopTtft 
                      ? 'bg-cyan-950/40 border-cyan-700/60' 
                      : 'bg-slate-950/40 border-slate-800'
                  }`}>
                    <span className="text-slate-400 flex items-center gap-1">
                      {isTopTtft && <Trophy className="w-3.5 h-3.5 text-cyan-400" />}
                      TTFT (Time-to-first)
                    </span>
                    <span className="font-semibold text-white">
                      {simulation.performance.ttftMs.toFixed(1)}{' '}
                      <span className="text-[10px] font-normal text-slate-400">ms</span>
                    </span>
                  </div>

                  {/* ITL */}
                  <div className="p-2.5 rounded-lg border bg-slate-950/40 border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Inter-Token Latency</span>
                    <span className="font-semibold text-amber-400">
                      {simulation.performance.itlMs.toFixed(1)}{' '}
                      <span className="text-[10px] font-normal text-slate-400">ms</span>
                    </span>
                  </div>

                  {/* Cost per 1M tokens */}
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    isTopCost 
                      ? 'bg-emerald-950/40 border-emerald-700/60' 
                      : 'bg-slate-950/40 border-slate-800'
                  }`}>
                    <span className="text-slate-400 flex items-center gap-1">
                      {isTopCost && <Trophy className="w-3.5 h-3.5 text-emerald-400" />}
                      Cost / 1M Tokens
                    </span>
                    <span className="font-bold text-emerald-300">
                      ${simulation.efficiency.costPerMillionTokensUsd.toFixed(3)}
                    </span>
                  </div>

                  {/* VRAM Status */}
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    simulation.isOom 
                      ? 'bg-rose-950/50 border-rose-800' 
                      : 'bg-slate-950/40 border-slate-800'
                  }`}>
                    <span className="text-slate-400">VRAM Usage</span>
                    <span className={`font-semibold ${simulation.isOom ? 'text-rose-400' : 'text-slate-200'}`}>
                      {simulation.vramRequiredGb.toFixed(1)} / {hardware.memoryGB * target.tensorParallelSize} GB
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Bottleneck Tag */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Bottleneck:</span>
                <span className="font-medium text-amber-400">
                  {simulation.bottleneck}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
