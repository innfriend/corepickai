import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Cpu, 
  Zap, 
  Activity, 
  HelpCircle, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Server, 
  Database, 
  RotateCcw,
  ArrowRightLeft,
  Check
} from 'lucide-react';
import { HARDWARE_CATALOG, MODEL_CATALOG } from '../data/mockData';
import { HardwareProfile, ModelWorkload, PrecisionType, RuntimeEngine } from '../types';
import { simulateInference, explainPerformanceDelta } from '../simulation/performanceEngine';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot } from 'recharts';

interface WhatIfSimulatorViewProps {
  onNavigate: (view: string) => void;
  onOpenAdvisor?: (prompt?: string) => void;
}

export const WhatIfSimulatorView: React.FC<WhatIfSimulatorViewProps> = ({ onNavigate, onOpenAdvisor }) => {
  // Global Model Selection
  const [selectedModelId, setSelectedModelId] = useState<string>('meta-llama-3-8b');
  const activeModel = useMemo(() => {
    return MODEL_CATALOG.find(m => m.id === selectedModelId) || MODEL_CATALOG[0];
  }, [selectedModelId]);

  // Config A (Baseline / Before)
  const [hwAId, setHwAId] = useState<string>('nvidia-h100-sxm');
  const [precA, setPrecA] = useState<PrecisionType>('FP16');
  const [batchA, setBatchA] = useState<number>(4);
  const [contextA, setContextA] = useState<number>(2048);
  const [outTokensA, setOutTokensA] = useState<number>(256);
  const [concurrencyA, setConcurrencyA] = useState<number>(4);
  const [runtimeA, setRuntimeA] = useState<RuntimeEngine>('vLLM');
  const [tpA, setTpA] = useState<number>(1);

  // Config B (Target / After)
  const [hwBId, setHwBId] = useState<string>('nvidia-h200-sxm');
  const [precB, setPrecB] = useState<PrecisionType>('FP8');
  const [batchB, setBatchB] = useState<number>(8);
  const [contextB, setContextB] = useState<number>(2048);
  const [outTokensB, setOutTokensB] = useState<number>(256);
  const [concurrencyB, setConcurrencyB] = useState<number>(8);
  const [runtimeB, setRuntimeB] = useState<RuntimeEngine>('vLLM');
  const [tpB, setTpB] = useState<number>(1);

  const hwA: HardwareProfile = useMemo(() => {
    return HARDWARE_CATALOG.find(h => h.id === hwAId) || HARDWARE_CATALOG[2];
  }, [hwAId]);

  const hwB: HardwareProfile = useMemo(() => {
    return HARDWARE_CATALOG.find(h => h.id === hwBId) || HARDWARE_CATALOG[1];
  }, [hwBId]);

  // Simulations
  const simA = useMemo(() => {
    return simulateInference({
      model: activeModel,
      hardware: hwA,
      precision: precA as any,
      batchSize: batchA,
      contextLength: contextA,
      outputTokens: outTokensA,
      concurrency: concurrencyA,
      runtime: runtimeA as any,
      tensorParallelSize: tpA
    });
  }, [activeModel, hwA, precA, batchA, contextA, outTokensA, concurrencyA, runtimeA, tpA]);

  const simB = useMemo(() => {
    return simulateInference({
      model: activeModel,
      hardware: hwB,
      precision: precB as any,
      batchSize: batchB,
      contextLength: contextB,
      outputTokens: outTokensB,
      concurrency: concurrencyB,
      runtime: runtimeB as any,
      tensorParallelSize: tpB
    });
  }, [activeModel, hwB, precB, batchB, contextB, outTokensB, concurrencyB, runtimeB, tpB]);

  // Delta Explainer
  const deltaExplanation = useMemo(() => {
    return explainPerformanceDelta(
      simA,
      simB,
      { hardware: hwA, precision: precA, batchSize: batchA, tp: tpA },
      { hardware: hwB, precision: precB, batchSize: batchB, tp: tpB }
    );
  }, [simA, simB, hwA, hwB, precA, precB, batchA, batchB, tpA, tpB]);

  // Quick Comparison Presets
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'fp16-to-fp8':
        setHwAId('nvidia-h100-sxm');
        setPrecA('FP16');
        setBatchA(8);
        setTpA(1);
        setHwBId('nvidia-h100-sxm');
        setPrecB('FP8');
        setBatchB(8);
        setTpB(1);
        break;
      case 'h100-vs-mi300x':
        setHwAId('nvidia-h100-sxm');
        setPrecA('FP16');
        setBatchA(8);
        setTpA(1);
        setHwBId('amd-mi300x');
        setPrecB('FP16');
        setBatchB(8);
        setTpB(1);
        break;
      case 'h100-to-b200':
        setHwAId('nvidia-h100-sxm');
        setPrecA('FP8');
        setBatchA(16);
        setTpA(1);
        setHwBId('nvidia-b200');
        setPrecB('FP8');
        setBatchB(16);
        setTpB(1);
        break;
      case 'single-vs-tp2':
        setHwAId('nvidia-h100-sxm');
        setPrecA('FP16');
        setBatchA(4);
        setTpA(1);
        setHwBId('nvidia-h100-sxm');
        setPrecB('FP16');
        setBatchB(8);
        setTpB(2);
        break;
      case 'batch-1-to-16':
        setHwAId('nvidia-h100-sxm');
        setPrecA('FP8');
        setBatchA(1);
        setConcurrencyA(1);
        setHwBId('nvidia-h100-sxm');
        setPrecB('FP8');
        setBatchB(16);
        setConcurrencyB(16);
        break;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[#1E293B] bg-[#0A0D14]/80 backdrop-blur px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                WHAT-IF PERFORMANCE SIMULATOR
              </span>
              <span className="text-xs font-mono text-slate-400">
                Analytical Sensitivity & Delta Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              Interactive "What-If" Sensitivity Simulator
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-2xl">
              Compare baseline vs proposed infrastructure configurations and understand the exact physics behind throughput, latency, and cost shifts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAdvisor?.(`Why does changing precision or batch size affect ${activeModel.name} decode latency?`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#131B2E] hover:bg-[#1E293B] text-cyan-300 text-xs font-mono rounded-xl border border-[#27354F] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Ask Advisor</span>
            </button>
            <button
              onClick={() => onNavigate('app-optimizer')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg cursor-pointer"
            >
              <span>Launch Optimizer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Global Model Picker & Presets Bar */}
        <div className="bg-[#0D1322] p-4 rounded-2xl border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Target Model:</span>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="bg-[#07090E] border border-[#27354F] rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {MODEL_CATALOG.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.parameterCountFormatted || `${m.parameterCountBillions}B`})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-mono text-slate-500 mr-1">Presets:</span>
            {[
              { id: 'fp16-to-fp8', label: 'FP16 → FP8' },
              { id: 'h100-vs-mi300x', label: 'H100 vs MI300X' },
              { id: 'h100-to-b200', label: 'H100 → B200' },
              { id: 'single-vs-tp2', label: 'Single GPU → TP=2' },
              { id: 'batch-1-to-16', label: 'Batch 1 → 16' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#07090E] hover:bg-[#131B2E] text-cyan-300 hover:text-white border border-[#27354F] transition-colors cursor-pointer whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* SIDE-BY-SIDE CONFIGURATION CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* CONFIGURATION A (BEFORE) */}
          <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                  CONFIGURATION A (BASELINE)
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {hwA.vendor} · {hwA.memoryBandwidthGBs * tpA} GB/s BW
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="col-span-2">
                <label className="text-slate-400 block mb-1">Accelerator:</label>
                <select
                  value={hwAId}
                  onChange={(e) => setHwAId(e.target.value)}
                  className="w-full bg-[#07090E] border border-[#27354F] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {HARDWARE_CATALOG.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.memoryGB}GB, {h.memoryBandwidthGBs} GB/s)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Precision:</label>
                <select
                  value={precA}
                  onChange={(e) => setPrecA(e.target.value as PrecisionType)}
                  className="w-full bg-[#07090E] border border-[#27354F] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {['FP32', 'FP16', 'BF16', 'FP8', 'INT8', 'INT4'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tensor Parallel:</label>
                <select
                  value={tpA}
                  onChange={(e) => setTpA(parseInt(e.target.value))}
                  className="w-full bg-[#07090E] border border-[#27354F] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {[1, 2, 4, 8].map((t) => (
                    <option key={t} value={t}>TP={t} ({t}x GPU)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Batch Size: {batchA}</label>
                <input
                  type="range"
                  min="1"
                  max="64"
                  value={batchA}
                  onChange={(e) => setBatchA(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Serving Runtime:</label>
                <select
                  value={runtimeA}
                  onChange={(e) => setRuntimeA(e.target.value as RuntimeEngine)}
                  className="w-full bg-[#07090E] border border-[#27354F] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {['vLLM', 'TensorRT-LLM', 'SGLang', 'TGI', 'ONNX Runtime'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Config A Metrics */}
            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#1E293B] font-mono text-xs">
              <div className="bg-[#07090E] p-2.5 rounded-xl border border-[#1E293B]">
                <span className="text-[10px] text-slate-400 block">Throughput:</span>
                <span className="text-base font-bold text-white mt-0.5 block">
                  {Math.round(simA.performance.aggregateTokensPerSec)} <span className="text-[10px] text-slate-500 font-normal">tok/s</span>
                </span>
              </div>

              <div className="bg-[#07090E] p-2.5 rounded-xl border border-[#1E293B]">
                <span className="text-[10px] text-slate-400 block">ITL (Decode):</span>
                <span className="text-base font-bold text-white mt-0.5 block">
                  {simA.performance.itlMs.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">ms</span>
                </span>
              </div>

              <div className="bg-[#07090E] p-2.5 rounded-xl border border-[#1E293B]">
                <span className="text-[10px] text-slate-400 block">Cost / 1M:</span>
                <span className="text-base font-bold text-amber-300 mt-0.5 block">
                  ${simA.efficiency.costPerMillionTokensUsd.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* CONFIGURATION B (PROPOSED) */}
          <div className="bg-[#0D1322] rounded-2xl border border-cyan-800/60 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  CONFIGURATION B (PROPOSED)
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-300">
                {hwB.vendor} · {hwB.memoryBandwidthGBs * tpB} GB/s BW
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="col-span-2">
                <label className="text-slate-400 block mb-1">Accelerator:</label>
                <select
                  value={hwBId}
                  onChange={(e) => setHwBId(e.target.value)}
                  className="w-full bg-[#07090E] border border-cyan-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {HARDWARE_CATALOG.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.memoryGB}GB, {h.memoryBandwidthGBs} GB/s)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Precision:</label>
                <select
                  value={precB}
                  onChange={(e) => setPrecB(e.target.value as PrecisionType)}
                  className="w-full bg-[#07090E] border border-cyan-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {['FP32', 'FP16', 'BF16', 'FP8', 'INT8', 'INT4'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tensor Parallel:</label>
                <select
                  value={tpB}
                  onChange={(e) => setTpB(parseInt(e.target.value))}
                  className="w-full bg-[#07090E] border border-cyan-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {[1, 2, 4, 8].map((t) => (
                    <option key={t} value={t}>TP={t} ({t}x GPU)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Batch Size: {batchB}</label>
                <input
                  type="range"
                  min="1"
                  max="64"
                  value={batchB}
                  onChange={(e) => setBatchB(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Serving Runtime:</label>
                <select
                  value={runtimeB}
                  onChange={(e) => setRuntimeB(e.target.value as RuntimeEngine)}
                  className="w-full bg-[#07090E] border border-cyan-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {['vLLM', 'TensorRT-LLM', 'SGLang', 'TGI', 'ONNX Runtime'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Config B Metrics with Deltas */}
            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#1E293B] font-mono text-xs">
              <div className="bg-[#07090E] p-2.5 rounded-xl border border-cyan-800/40">
                <span className="text-[10px] text-slate-400 block">Throughput:</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                  {Math.round(simB.performance.aggregateTokensPerSec)} <span className="text-[10px] text-slate-500 font-normal">tok/s</span>
                </span>
                <span className="text-[10px] text-cyan-300 font-bold">
                  {deltaExplanation.throughputMultiplier}x vs A
                </span>
              </div>

              <div className="bg-[#07090E] p-2.5 rounded-xl border border-cyan-800/40">
                <span className="text-[10px] text-slate-400 block">ITL (Decode):</span>
                <span className="text-base font-bold text-cyan-300 mt-0.5 block">
                  {simB.performance.itlMs.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">ms</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  {deltaExplanation.latencyMultiplier}x faster
                </span>
              </div>

              <div className="bg-[#07090E] p-2.5 rounded-xl border border-cyan-800/40">
                <span className="text-[10px] text-slate-400 block">Cost / 1M:</span>
                <span className="text-base font-bold text-amber-300 mt-0.5 block">
                  ${simB.efficiency.costPerMillionTokensUsd.toFixed(2)}
                </span>
                <span className={`text-[10px] font-bold ${deltaExplanation.costDeltaPct <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {deltaExplanation.costDeltaPct > 0 ? `+${deltaExplanation.costDeltaPct}%` : `${deltaExplanation.costDeltaPct}%`}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* "WHY DID PERFORMANCE CHANGE?" ANALYTICAL BREAKDOWN */}
        <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1E293B]">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
              Analytical Diagnosis: Why Did Performance Change?
            </h2>
          </div>

          <div className="space-y-3 font-mono">
            <div className="p-4 bg-[#07090E] rounded-xl border border-cyan-800/40">
              <h3 className="text-sm font-bold text-cyan-300 mb-1">{deltaExplanation.headline}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{deltaExplanation.summary}</p>
            </div>

            {/* Key Drivers Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deltaExplanation.keyDrivers.map((driver, idx) => (
                <div key={idx} className="p-3.5 bg-[#07090E] rounded-xl border border-[#1E293B] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{driver.factor}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {driver.impact}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-normal pt-1">
                    {driver.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* VRAM BREAKDOWN COMPARISON */}
        <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] p-6 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white uppercase tracking-wider">Memory Allocation Breakdown (GB)</h3>
            </div>
            <span className="text-slate-400">Model Weights · KV-Cache · Activations · Runtime</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Config A: {hwA.model} (TP={tpA})</span>
                <span className="text-white font-bold">{simA.vramRequiredGb.toFixed(1)} / {simA.vramAvailableGb} GB</span>
              </div>
              <div className="h-4 w-full bg-[#07090E] rounded-full overflow-hidden flex">
                <div style={{ width: `${(simA.vramBreakdown.weightsGb / simA.vramAvailableGb) * 100}%` }} className="bg-cyan-500" title="Weights" />
                <div style={{ width: `${(simA.vramBreakdown.kvCacheGb / simA.vramAvailableGb) * 100}%` }} className="bg-indigo-500" title="KV-Cache" />
                <div style={{ width: `${(simA.vramBreakdown.activationsGb / simA.vramAvailableGb) * 100}%` }} className="bg-emerald-500" title="Activations" />
                <div style={{ width: `${(simA.vramBreakdown.overheadGb / simA.vramAvailableGb) * 100}%` }} className="bg-slate-600" title="Overhead" />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                <span><strong className="text-cyan-400">Weights:</strong> {simA.vramBreakdown.weightsGb.toFixed(1)} GB</span>
                <span><strong className="text-indigo-400">KV:</strong> {simA.vramBreakdown.kvCacheGb.toFixed(1)} GB</span>
                <span><strong className="text-emerald-400">Act:</strong> {simA.vramBreakdown.activationsGb.toFixed(1)} GB</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Config B: {hwB.model} (TP={tpB})</span>
                <span className="text-cyan-300 font-bold">{simB.vramRequiredGb.toFixed(1)} / {simB.vramAvailableGb} GB</span>
              </div>
              <div className="h-4 w-full bg-[#07090E] rounded-full overflow-hidden flex">
                <div style={{ width: `${(simB.vramBreakdown.weightsGb / simB.vramAvailableGb) * 100}%` }} className="bg-cyan-500" title="Weights" />
                <div style={{ width: `${(simB.vramBreakdown.kvCacheGb / simB.vramAvailableGb) * 100}%` }} className="bg-indigo-500" title="KV-Cache" />
                <div style={{ width: `${(simB.vramBreakdown.activationsGb / simB.vramAvailableGb) * 100}%` }} className="bg-emerald-500" title="Activations" />
                <div style={{ width: `${(simB.vramBreakdown.overheadGb / simB.vramAvailableGb) * 100}%` }} className="bg-slate-600" title="Overhead" />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                <span><strong className="text-cyan-400">Weights:</strong> {simB.vramBreakdown.weightsGb.toFixed(1)} GB</span>
                <span><strong className="text-indigo-400">KV:</strong> {simB.vramBreakdown.kvCacheGb.toFixed(1)} GB</span>
                <span><strong className="text-emerald-400">Act:</strong> {simB.vramBreakdown.activationsGb.toFixed(1)} GB</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
