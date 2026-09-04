import React, { useState, useMemo } from 'react';
import { HARDWARE_CATALOG, MODEL_CATALOG } from '../../data/mockData';
import { simulateInference } from '../../simulation/performanceEngine';
import { MeasurementBadge } from '../MeasurementBadge';
import { PrecisionType, RuntimeEngine } from '../../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Sliders,
  TrendingUp,
  Cpu,
  Layers,
  Zap,
  Clock,
  HardDrive,
  BarChart2
} from 'lucide-react';

export const WhatIfAnalysisView: React.FC = () => {
  const [selectedModelId, setSelectedModelId] = useState<string>('llama-3-70b-instruct');
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>('nvidia-h100-sxm');
  const [precision, setPrecision] = useState<PrecisionType>('FP8');
  const [contextLength, setContextLength] = useState<number>(2048);
  const [outputTokens, setOutputTokens] = useState<number>(256);
  const [sweepMode, setSweepMode] = useState<'batchSize' | 'contextLength'>('batchSize');

  const currentModel = useMemo(() => {
    return MODEL_CATALOG.find((m) => m.id === selectedModelId) || MODEL_CATALOG[0];
  }, [selectedModelId]);

  const currentHardware = useMemo(() => {
    return HARDWARE_CATALOG.find((h) => h.id === selectedHardwareId) || HARDWARE_CATALOG[0];
  }, [selectedHardwareId]);

  // Compute Sweep Curve
  const sweepData = useMemo(() => {
    if (sweepMode === 'batchSize') {
      const batches = [1, 2, 4, 8, 16, 32, 48, 64];
      return batches.map((b) => {
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
          hardware: currentHardware,
          precision: precision,
          batchSize: b,
          contextLength: contextLength,
          outputTokens: outputTokens,
          concurrency: 1,
          runtime: 'vLLM',
          tensorParallelSize: 1,
          kvPrecision: precision === 'INT4' ? 'INT4' : (precision === 'FP8' ? 'FP8' : 'FP16'),
          enableFlashAttention: true
        });

        return {
          label: `Batch ${b}`,
          xVal: b,
          throughput: Math.round(sim.performance.aggregateTokensPerSec),
          userTps: Number(sim.performance.tokensPerSecPerRequest.toFixed(1)),
          itl: Number(sim.performance.itlMs.toFixed(1)),
          ttft: Number(sim.performance.ttftMs.toFixed(1)),
          vram: Number(sim.vramRequiredGb.toFixed(1)),
          isOom: sim.isOom
        };
      });
    } else {
      const contexts = [512, 1024, 2048, 4096, 8192, 16384, 32768];
      return contexts.map((ctx) => {
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
          hardware: currentHardware,
          precision: precision,
          batchSize: 8,
          contextLength: ctx,
          outputTokens: outputTokens,
          concurrency: 1,
          runtime: 'vLLM',
          tensorParallelSize: 1,
          kvPrecision: precision === 'INT4' ? 'INT4' : (precision === 'FP8' ? 'FP8' : 'FP16'),
          enableFlashAttention: true
        });

        return {
          label: `${ctx >= 1024 ? `${ctx / 1024}k` : ctx}`,
          xVal: ctx,
          throughput: Math.round(sim.performance.aggregateTokensPerSec),
          userTps: Number(sim.performance.tokensPerSecPerRequest.toFixed(1)),
          itl: Number(sim.performance.itlMs.toFixed(1)),
          ttft: Number(sim.performance.ttftMs.toFixed(1)),
          vram: Number(sim.vramRequiredGb.toFixed(1)),
          isOom: sim.isOom
        };
      });
    }
  }, [sweepMode, currentModel, currentHardware, precision, contextLength, outputTokens]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-xl p-5 border border-indigo-900/40 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              What-If Parameter Sensitivity Sweeper
            </h2>
            <MeasurementBadge status="SIMULATED" size="md" />
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Analyze the inflection points where batch sizing, context scaling, and memory limits transition between memory-bandwidth and compute constraints.
          </p>
        </div>

        {/* Sweep Mode Toggle */}
        <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-1">
          <button
            onClick={() => setSweepMode('batchSize')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              sweepMode === 'batchSize'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Batch Size Sweep
          </button>
          <button
            onClick={() => setSweepMode('contextLength')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              sweepMode === 'contextLength'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Context Scaling Sweep
          </button>
        </div>
      </div>

      {/* Target Config Bar */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 backdrop-blur-md shadow-lg grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-300">Model</label>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 mt-1"
          >
            {MODEL_CATALOG.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.parameterCountFormatted})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300">Hardware Accelerator</label>
          <select
            value={selectedHardwareId}
            onChange={(e) => setSelectedHardwareId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 mt-1"
          >
            {HARDWARE_CATALOG.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.memoryGB}GB)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300">Precision</label>
          <select
            value={precision}
            onChange={(e) => setPrecision(e.target.value as PrecisionType)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 mt-1"
          >
            <option value="FP16">FP16</option>
            <option value="FP8">FP8</option>
            <option value="INT8">INT8</option>
            <option value="INT4">INT4</option>
          </select>
        </div>
      </div>

      {/* Dual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Throughput (Aggregate vs Single User) */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {sweepMode === 'batchSize' ? 'Throughput Scaling Curve' : 'Context Length vs. Throughput'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Aggregate System Throughput vs. Per-User Perceived Latency
              </p>
            </div>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sweepData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  label={{
                    value: sweepMode === 'batchSize' ? 'Batch Size' : 'Context Length (Tokens)',
                    position: 'insideBottom',
                    offset: -12,
                    fill: '#94a3b8',
                    fontSize: 12
                  }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  label={{
                    value: 'Tokens / Sec',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 5,
                    fill: '#94a3b8',
                    fontSize: 12
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.label}</p>
                          <p className="text-indigo-400">
                            Aggregate TPS: <strong>{data.throughput} tok/s</strong>
                          </p>
                          <p className="text-emerald-400">
                            Single-User TPS: <strong>{data.userTps} tok/s</strong>
                          </p>
                          <p className="text-slate-400">
                            VRAM Usage: <strong>{data.vram} GB</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="throughput"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  name="Aggregate Throughput (tok/s)"
                  dot={{ r: 4, fill: '#6366f1' }}
                />
                <Line
                  type="monotone"
                  dataKey="userTps"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Single Stream TPS (tok/s)"
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Latency (TTFT & ITL) */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Latency Response Profiles
              </h3>
              <p className="text-[11px] text-slate-400">
                Time-to-First-Token (TTFT) and Inter-Token Latency (ITL)
              </p>
            </div>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sweepData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  label={{
                    value: sweepMode === 'batchSize' ? 'Batch Size' : 'Context Length (Tokens)',
                    position: 'insideBottom',
                    offset: -12,
                    fill: '#94a3b8',
                    fontSize: 12
                  }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  label={{
                    value: 'Latency (ms)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 5,
                    fill: '#94a3b8',
                    fontSize: 12
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.label}</p>
                          <p className="text-cyan-400">
                            TTFT: <strong>{data.ttft} ms</strong>
                          </p>
                          <p className="text-amber-400">
                            ITL: <strong>{data.itl} ms / token</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="ttft"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="TTFT (ms)"
                  dot={{ r: 4, fill: '#06b6d4' }}
                />
                <Line
                  type="monotone"
                  dataKey="itl"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="ITL (ms/tok)"
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
