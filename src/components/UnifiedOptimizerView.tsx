import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Cpu, 
  Layers, 
  Sliders, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  DollarSign, 
  Activity, 
  Flame, 
  RotateCcw, 
  HelpCircle, 
  Sparkles, 
  FileCode, 
  Database, 
  Server, 
  Info, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Copy,
  Check
} from 'lucide-react';
import { 
  HARDWARE_CATALOG, 
  MODEL_CATALOG 
} from '../data/mockData';
import { 
  ModelWorkload, 
  HardwareProfile, 
  WorkloadDefinition, 
  SloDefinition, 
  ScoringWeights, 
  OptimizerObjective, 
  OptimizationResultPackage,
  CandidateConfiguration,
  PrecisionType
} from '../types';
import { runOptimizationSearch } from '../simulation/performanceEngine';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface UnifiedOptimizerViewProps {
  onNavigate: (view: string) => void;
  onSelectForDeployment?: (config: CandidateConfiguration) => void;
  onOpenAdvisor?: (prompt?: string) => void;
}

export const UnifiedOptimizerView: React.FC<UnifiedOptimizerViewProps> = ({ 
  onNavigate, 
  onSelectForDeployment,
  onOpenAdvisor 
}) => {
  // ----------------------------------------------------
  // Step 1: Model Selection State
  // ----------------------------------------------------
  const [selectedModelId, setSelectedModelId] = useState<string>('meta-llama-3-8b');
  const [hfInputModel, setHfInputModel] = useState<string>('');
  const [isHfLookupActive, setIsHfLookupActive] = useState<boolean>(false);
  const [hfLookupFeedback, setHfLookupFeedback] = useState<string | null>(null);

  // Custom overrides (if user tweaks model params)
  const [customParamsB, setCustomParamsB] = useState<number | null>(null);
  const [customLayers, setCustomLayers] = useState<number | null>(null);
  const [customHiddenDim, setCustomHiddenDim] = useState<number | null>(null);

  const activeModel: ModelWorkload = useMemo(() => {
    const base = MODEL_CATALOG.find(m => m.id === selectedModelId) || MODEL_CATALOG[0];
    if (customParamsB !== null || customLayers !== null || customHiddenDim !== null) {
      return {
        ...base,
        parameterCountBillions: customParamsB ?? base.parameterCountBillions ?? (base.parameterCountM / 1000),
        layers: customLayers ?? base.layers ?? 32,
        hiddenDim: customHiddenDim ?? base.hiddenDim ?? 4096,
        name: `${base.name} (Custom Tuned)`
      };
    }
    return base;
  }, [selectedModelId, customParamsB, customLayers, customHiddenDim]);

  // ----------------------------------------------------
  // Step 2: Workload & SLO State
  // ----------------------------------------------------
  const [workload, setWorkload] = useState<WorkloadDefinition>({
    type: 'LLM inference',
    inputTokens: 1024,
    outputTokens: 256,
    contextLength: 2048,
    requestsPerSec: 12,
    concurrentRequests: 8,
    batchSize: 8,
    trafficPattern: 'Steady',
    presetName: 'Interactive Chatbot'
  });

  const [slo, setSlo] = useState<SloDefinition>({
    ttftTargetMs: 150,
    itlTargetMs: 25,
    e2eLatencyTargetMs: 1500,
    throughputTargetTps: 150,
    availabilityTargetPct: 99.9,
    maxBudgetMonthlyUsd: 12000
  });

  const applyWorkloadPreset = (name: string) => {
    switch (name) {
      case 'Interactive Chatbot':
        setWorkload({
          type: 'LLM inference',
          inputTokens: 1024,
          outputTokens: 256,
          contextLength: 2048,
          requestsPerSec: 10,
          concurrentRequests: 8,
          batchSize: 4,
          trafficPattern: 'Steady',
          presetName: 'Interactive Chatbot'
        });
        setSlo({
          ttftTargetMs: 120,
          itlTargetMs: 22,
          e2eLatencyTargetMs: 1200,
          throughputTargetTps: 120,
          availabilityTargetPct: 99.9,
          maxBudgetMonthlyUsd: 10000
        });
        break;
      case 'High-Throughput API':
        setWorkload({
          type: 'LLM inference',
          inputTokens: 2048,
          outputTokens: 512,
          contextLength: 4096,
          requestsPerSec: 35,
          concurrentRequests: 32,
          batchSize: 16,
          trafficPattern: 'Steady',
          presetName: 'High-Throughput API'
        });
        setSlo({
          ttftTargetMs: 250,
          itlTargetMs: 35,
          e2eLatencyTargetMs: 3500,
          throughputTargetTps: 1000,
          availabilityTargetPct: 99.95,
          maxBudgetMonthlyUsd: 25000
        });
        break;
      case 'Agentic Multi-Step':
        setWorkload({
          type: 'LLM inference',
          inputTokens: 4096,
          outputTokens: 128,
          contextLength: 8192,
          requestsPerSec: 15,
          concurrentRequests: 16,
          batchSize: 8,
          trafficPattern: 'Spiky',
          presetName: 'Agentic Multi-Step'
        });
        setSlo({
          ttftTargetMs: 80,
          itlTargetMs: 18,
          e2eLatencyTargetMs: 800,
          throughputTargetTps: 300,
          availabilityTargetPct: 99.9,
          maxBudgetMonthlyUsd: 15000
        });
        break;
      case 'Long-Context RAG':
        setWorkload({
          type: 'LLM inference',
          inputTokens: 16384,
          outputTokens: 512,
          contextLength: 24576,
          requestsPerSec: 4,
          concurrentRequests: 4,
          batchSize: 4,
          trafficPattern: 'Burst',
          presetName: 'Long-Context RAG'
        });
        setSlo({
          ttftTargetMs: 800,
          itlTargetMs: 30,
          e2eLatencyTargetMs: 6000,
          throughputTargetTps: 100,
          availabilityTargetPct: 99.5,
          maxBudgetMonthlyUsd: 18000
        });
        break;
    }
  };

  // ----------------------------------------------------
  // Step 3: Hardware Pool Selection
  // ----------------------------------------------------
  const [selectedHwIds, setSelectedHwIds] = useState<string[]>([
    'nvidia-b200',
    'nvidia-h200-sxm',
    'nvidia-h100-sxm',
    'nvidia-l40s',
    'nvidia-rtx-4090',
    'amd-mi300x',
    'intel-gaudi-3',
    'apple-m3-max'
  ]);

  const toggleHardware = (id: string) => {
    if (selectedHwIds.includes(id)) {
      if (selectedHwIds.length === 1) return; // keep at least one
      setSelectedHwIds(selectedHwIds.filter(h => h !== id));
    } else {
      setSelectedHwIds([...selectedHwIds, id]);
    }
  };

  const selectAllHardware = () => {
    setSelectedHwIds(HARDWARE_CATALOG.map(h => h.id));
  };

  const activeHardwarePool = useMemo(() => {
    return HARDWARE_CATALOG.filter(h => selectedHwIds.includes(h.id));
  }, [selectedHwIds]);

  // ----------------------------------------------------
  // Step 4: Optimizer Objective & Weights
  // ----------------------------------------------------
  const [objective, setObjective] = useState<OptimizerObjective>('balanced');
  const [showAdvancedWeights, setShowAdvancedWeights] = useState<boolean>(false);
  const [weights, setWeights] = useState<ScoringWeights>({
    performance: 35,
    cost: 30,
    latency: 20,
    memory: 10,
    energy: 5
  });

  const [selectedPrecisions, setSelectedPrecisions] = useState<('FP16' | 'BF16' | 'FP8' | 'INT8' | 'INT4')[]>([
    'FP16',
    'FP8',
    'INT4'
  ]);

  const [selectedRuntimes, setSelectedRuntimes] = useState<('vLLM' | 'TensorRT-LLM' | 'SGLang')[]>([
    'vLLM',
    'TensorRT-LLM',
    'SGLang'
  ]);

  // ----------------------------------------------------
  // Run Optimization Calculation
  // ----------------------------------------------------
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);
  const [filterMeetsSloOnly, setFilterMeetsSloOnly] = useState<boolean>(false);

  const optimizationResults: OptimizationResultPackage = useMemo(() => {
    return runOptimizationSearch({
      model: activeModel,
      workload,
      slo,
      hardwarePool: activeHardwarePool,
      precisions: selectedPrecisions,
      runtimes: selectedRuntimes,
      objective,
      weights
    });
  }, [activeModel, workload, slo, activeHardwarePool, selectedPrecisions, selectedRuntimes, objective, weights]);

  const recommended = optimizationResults.recommended;

  // Handle Hugging Face Lookup Simulation
  const handleHfLookup = () => {
    if (!hfInputModel.trim()) return;
    setIsHfLookupActive(true);
    setHfLookupFeedback(null);
    setTimeout(() => {
      setIsHfLookupActive(false);
      const query = hfInputModel.toLowerCase();
      if (query.includes('70b') || query.includes('72b')) {
        setSelectedModelId('meta-llama-3-70b');
        setHfLookupFeedback(`Resolved config for ${hfInputModel}: LlamaForCausalLM (70.6B params, 80 layers, 64 heads, 8 KV heads).`);
      } else if (query.includes('deepseek') || query.includes('v3') || query.includes('moe')) {
        setSelectedModelId('deepseek-v3-moe');
        setHfLookupFeedback(`Resolved config for ${hfInputModel}: DeepSeekMoE (671B total, 37B active params, 61 layers).`);
      } else if (query.includes('qwen') || query.includes('14b')) {
        setSelectedModelId('qwen-2.5-14b');
        setHfLookupFeedback(`Resolved config for ${hfInputModel}: Qwen2ForCausalLM (14.7B params, 48 layers).`);
      } else {
        setSelectedModelId('meta-llama-3-8b');
        setHfLookupFeedback(`Resolved config for ${hfInputModel}: LlamaForCausalLM (8.03B params, 32 layers, GQA).`);
      }
    }, 450);
  };

  const displayedCandidates = useMemo(() => {
    if (filterMeetsSloOnly) {
      return optimizationResults.rankedCandidates.filter(c => c.meetsSlo);
    }
    return optimizationResults.rankedCandidates;
  }, [optimizationResults, filterMeetsSloOnly]);

  const handleCopyCli = () => {
    const tpFlag = recommended.tensorParallelSize > 1 ? ` --tensor-parallel-size ${recommended.tensorParallelSize}` : '';
    const precFlag = recommended.precision === 'FP8' ? ' --quantization fp8' : (recommended.precision === 'INT4' ? ' --quantization awq' : ' --dtype float16');
    const cmd = `vllm serve ${activeModel.slug || 'meta-llama/Meta-Llama-3-8B-Instruct'}${tpFlag}${precFlag} --max-model-len ${workload.contextLength} --gpu-memory-utilization 0.92`;
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleDeployWinner = () => {
    if (onSelectForDeployment) {
      onSelectForDeployment(recommended);
    } else {
      onNavigate('app-deploy');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto">
      {/* Header Banner */}
      <div className="border-b border-[#1E293B] bg-[#0A0D14]/80 backdrop-blur px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                COREPICK UNIFIED OPTIMIZER
              </span>
              <span className="text-xs font-mono text-slate-400">
                End-to-End Analytical Inference Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              Optimize AI Inference for Your Workload
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-2xl">
              Determine the best model, accelerator, precision, runtime, and serving configuration for your specific latency, throughput, and budget targets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAdvisor?.(`What is the optimal infrastructure setup for ${activeModel.name} under ${workload.presetName || 'this workload'}?`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 hover:from-cyan-600/30 hover:to-indigo-600/30 text-cyan-300 text-xs font-mono font-semibold rounded-xl border border-cyan-500/40 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Ask AI Advisor</span>
            </button>
            <button
              onClick={() => applyWorkloadPreset('Interactive Chatbot')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white text-xs font-mono rounded-xl border border-[#27354F] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Multi-Step Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">

        {/* STEP 1 & 2: TWO COLUMN INPUT (MODEL + WORKLOAD/SLO) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* STEP 1: MODEL SELECTION (5 COLS) */}
          <div className="lg:col-span-5 bg-[#0D1322] rounded-2xl border border-[#1E293B] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">1</span>
                <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Model Architecture</h2>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                {activeModel.category}
              </span>
            </div>

            {/* Hugging Face Model ID Parser Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>Hugging Face Model ID or URL:</span>
                <span className="text-[10px] text-slate-500 font-normal">e.g. meta-llama/Llama-3-8B</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={hfInputModel}
                  onChange={(e) => setHfInputModel(e.target.value)}
                  placeholder="e.g. deepseek-ai/DeepSeek-V3 or Qwen/Qwen2.5-14B"
                  className="flex-1 bg-[#07090E] border border-[#27354F] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleHfLookup}
                  disabled={isHfLookupActive}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer shrink-0"
                >
                  {isHfLookupActive ? 'Parsing...' : 'Parse'}
                </button>
              </div>
              {hfLookupFeedback && (
                <p className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                  ✓ {hfLookupFeedback}
                </p>
              )}
            </div>

            {/* Catalog Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">Select Standard Catalog Model:</label>
              <select
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value);
                  setCustomParamsB(null);
                  setCustomLayers(null);
                  setCustomHiddenDim(null);
                }}
                className="w-full bg-[#07090E] border border-[#27354F] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {MODEL_CATALOG.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.parameterCountFormatted || `${m.parameterCountBillions}B`} params, {m.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Model Spec Pill Display */}
            <div className="bg-[#07090E] p-3 rounded-xl border border-[#1E293B] space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Active Parameters:</span>
                <span className="text-cyan-300 font-bold">
                  {activeModel.parameterCountBillions ? `${activeModel.parameterCountBillions} Billion` : activeModel.parameterCountFormatted}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Hidden Dimension / Layers:</span>
                <span className="text-slate-200">
                  {activeModel.hiddenDim || 4096} dim · {activeModel.layers || 32} layers
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Attention Mechanism:</span>
                <span className="text-emerald-400">
                  {activeModel.attentionHeads || 32} Heads / {activeModel.kvHeads || 8} KV (GQA)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>FP16 Raw Weight Size:</span>
                <span className="text-amber-300">
                  ~{((activeModel.parameterCountBillions || (activeModel.parameterCountM / 1000)) * 2).toFixed(1)} GB
                </span>
              </div>
            </div>

            {/* Manual Architecture Overrides Toggle */}
            <details className="group">
              <summary className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1 select-none">
                <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                <span>Adjust Fine-grained Parameters (MoE / Dense)</span>
              </summary>
              <div className="pt-3 space-y-2.5 font-mono text-xs border-t border-[#1E293B] mt-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Parameter Count (B):</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="1000"
                    value={customParamsB ?? activeModel.parameterCountBillions ?? 8}
                    onChange={(e) => setCustomParamsB(parseFloat(e.target.value) || 8)}
                    className="w-24 bg-[#07090E] border border-[#27354F] rounded px-2 py-1 text-white text-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Transformer Layers:</span>
                  <input
                    type="number"
                    min="4"
                    max="128"
                    value={customLayers ?? activeModel.layers ?? 32}
                    onChange={(e) => setCustomLayers(parseInt(e.target.value) || 32)}
                    className="w-24 bg-[#07090E] border border-[#27354F] rounded px-2 py-1 text-white text-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Hidden Dim Size:</span>
                  <input
                    type="number"
                    step="128"
                    min="512"
                    max="16384"
                    value={customHiddenDim ?? activeModel.hiddenDim ?? 4096}
                    onChange={(e) => setCustomHiddenDim(parseInt(e.target.value) || 4096)}
                    className="w-24 bg-[#07090E] border border-[#27354F] rounded px-2 py-1 text-white text-right"
                  />
                </div>
              </div>
            </details>
          </div>

          {/* STEP 2: WORKLOAD & SLO TARGETS (7 COLS) */}
          <div className="lg:col-span-7 bg-[#0D1322] rounded-2xl border border-[#1E293B] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">2</span>
                <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Workload & Target SLO</h2>
              </div>
              {/* Presets */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {['Interactive Chatbot', 'High-Throughput API', 'Agentic Multi-Step', 'Long-Context RAG'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyWorkloadPreset(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                      workload.presetName === preset
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'bg-[#07090E] text-slate-400 hover:text-white border border-[#27354F]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Workload Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-[#07090E] p-2.5 rounded-xl border border-[#1E293B]">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Prompt / Input Tokens:</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    min="1"
                    max="128000"
                    step="128"
                    value={workload.inputTokens}
                    onChange={(e) => setWorkload({ ...workload, inputTokens: parseInt(e.target.value) || 128 })}
                    className="w-full bg-transparent font-mono text-sm font-bold text-cyan-300 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">tok</span>
                </div>
              </div>

              <div className="bg-[#07090E] p-2.5 rounded-xl border border-[#1E293B]">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Generated Output Tokens:</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    min="1"
                    max="8192"
                    step="64"
                    value={workload.outputTokens}
                    onChange={(e) => setWorkload({ ...workload, outputTokens: parseInt(e.target.value) || 64 })}
                    className="w-full bg-transparent font-mono text-sm font-bold text-cyan-300 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">tok</span>
                </div>
              </div>

              <div className="bg-[#07090E] p-2.5 rounded-xl border border-[#1E293B]">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Context Length Window:</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    min="512"
                    max="128000"
                    step="512"
                    value={workload.contextLength}
                    onChange={(e) => setWorkload({ ...workload, contextLength: parseInt(e.target.value) || 2048 })}
                    className="w-full bg-transparent font-mono text-sm font-bold text-cyan-300 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">ctx</span>
                </div>
              </div>

              <div className="bg-[#07090E] p-2.5 rounded-xl border border-[#1E293B]">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Requests / Second:</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    min="0.5"
                    max="500"
                    step="1"
                    value={workload.requestsPerSec}
                    onChange={(e) => setWorkload({ ...workload, requestsPerSec: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-transparent font-mono text-sm font-bold text-emerald-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">req/s</span>
                </div>
              </div>

              <div className="bg-[#07090E] p-2.5 rounded-xl border border-[#1E293B]">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Concurrent Streams:</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    min="1"
                    max="256"
                    step="1"
                    value={workload.concurrentRequests}
                    onChange={(e) => setWorkload({ ...workload, concurrentRequests: parseInt(e.target.value) || 1 })}
                    className="w-full bg-transparent font-mono text-sm font-bold text-emerald-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">users</span>
                </div>
              </div>

              <div className="bg-[#07090E] p-2.5 rounded-xl border border-[#1E293B]">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Serving Batch Size:</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    min="1"
                    max="128"
                    step="1"
                    value={workload.batchSize}
                    onChange={(e) => setWorkload({ ...workload, batchSize: parseInt(e.target.value) || 1 })}
                    className="w-full bg-transparent font-mono text-sm font-bold text-emerald-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">batch</span>
                </div>
              </div>
            </div>

            {/* Target SLO Thresholds */}
            <div className="space-y-2 pt-2 border-t border-[#1E293B]">
              <span className="text-xs font-mono font-bold text-slate-300">Service Level Objective (SLO) Constraints:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="bg-[#07090E] p-2 rounded-lg border border-[#27354F]">
                  <span className="text-[10px] text-slate-400 block">Max TTFT:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      value={slo.ttftTargetMs}
                      onChange={(e) => setSlo({ ...slo, ttftTargetMs: parseInt(e.target.value) || 200 })}
                      className="w-16 bg-transparent font-bold text-white focus:outline-none text-sm"
                    />
                    <span className="text-[10px] text-slate-500">ms</span>
                  </div>
                </div>

                <div className="bg-[#07090E] p-2 rounded-lg border border-[#27354F]">
                  <span className="text-[10px] text-slate-400 block">Max ITL (Decode):</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      value={slo.itlTargetMs}
                      onChange={(e) => setSlo({ ...slo, itlTargetMs: parseInt(e.target.value) || 30 })}
                      className="w-16 bg-transparent font-bold text-white focus:outline-none text-sm"
                    />
                    <span className="text-[10px] text-slate-500">ms/tok</span>
                  </div>
                </div>

                <div className="bg-[#07090E] p-2 rounded-lg border border-[#27354F]">
                  <span className="text-[10px] text-slate-400 block">Min Throughput:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      value={slo.throughputTargetTps}
                      onChange={(e) => setSlo({ ...slo, throughputTargetTps: parseInt(e.target.value) || 100 })}
                      className="w-16 bg-transparent font-bold text-white focus:outline-none text-sm"
                    />
                    <span className="text-[10px] text-slate-500">tok/s</span>
                  </div>
                </div>

                <div className="bg-[#07090E] p-2 rounded-lg border border-[#27354F]">
                  <span className="text-[10px] text-slate-400 block">Max Budget:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-slate-500">$</span>
                    <input
                      type="number"
                      value={slo.maxBudgetMonthlyUsd}
                      onChange={(e) => setSlo({ ...slo, maxBudgetMonthlyUsd: parseInt(e.target.value) || 10000 })}
                      className="w-16 bg-transparent font-bold text-white focus:outline-none text-sm"
                    />
                    <span className="text-[10px] text-slate-500">/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: HARDWARE POOL SELECTION */}
        <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">3</span>
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Candidate Hardware Accelerators</h2>
              <span className="text-xs font-mono text-slate-400">({selectedHwIds.length} selected in pool)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllHardware}
                className="px-2.5 py-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 bg-[#07090E] border border-[#27354F] rounded-lg cursor-pointer"
              >
                Select All ({HARDWARE_CATALOG.length} chips)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2.5">
            {HARDWARE_CATALOG.map((hw) => {
              const isSelected = selectedHwIds.includes(hw.id);
              return (
                <button
                  key={hw.id}
                  onClick={() => toggleHardware(hw.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-sm shadow-cyan-500/10'
                      : 'bg-[#07090E]/60 border-[#1E293B] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[#131B2E] text-slate-300">
                        {hw.vendor}
                      </span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                      )}
                    </div>
                    <p className="text-xs font-mono font-bold text-white leading-tight line-clamp-1">
                      {hw.model}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    <div>{hw.memoryGB} GB {hw.memoryType?.split(' ')[0] || ''}</div>
                    <div className="text-cyan-300 font-semibold">{hw.memoryBandwidthGBs} GB/s</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 4: OBJECTIVE & SCORING WEIGHTS */}
        <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">4</span>
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Optimization Objective & Transparent Scoring</h2>
            </div>
            <button
              onClick={() => setShowAdvancedWeights(!showAdvancedWeights)}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>{showAdvancedWeights ? 'Hide Custom Weights' : 'Customize Scoring Weights'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedWeights ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Objective Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { id: 'balanced', label: '⚖️ Balanced', desc: 'Holistic performance & cost' },
              { id: 'min_latency', label: '⚡ Min Latency', desc: 'Prioritize TTFT & ITL SLA' },
              { id: 'max_throughput', label: '🚀 Max Throughput', desc: 'Max tokens/sec capacity' },
              { id: 'min_cost', label: '💰 Lowest Cost', desc: 'Cheapest $/1M tokens' },
              { id: 'cost_performance', label: '📈 Cost-Perf', desc: 'Highest TPS per dollar' },
              { id: 'energy_efficient', label: '🌿 Energy', desc: 'Lowest Joules / token' },
            ].map((obj) => (
              <button
                key={obj.id}
                onClick={() => setObjective(obj.id as OptimizerObjective)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  objective === obj.id
                    ? 'bg-gradient-to-br from-cyan-950/80 to-indigo-950/60 border-cyan-500 text-white shadow-md'
                    : 'bg-[#07090E] border-[#1E293B] text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <div className="text-xs font-mono font-bold">{obj.label}</div>
                <div className="text-[10px] text-slate-400 mt-1">{obj.desc}</div>
              </button>
            ))}
          </div>

          {/* Advanced Sliders */}
          {showAdvancedWeights && (
            <div className="p-4 bg-[#07090E] rounded-xl border border-[#27354F] space-y-3 font-mono text-xs animate-fadeIn">
              <span className="text-slate-300 font-bold block mb-2">Transparent Scoring Weights (Sum = 100%):</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Throughput:</span>
                    <span className="text-cyan-300 font-bold">{weights.performance}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weights.performance}
                    onChange={(e) => setWeights({ ...weights, performance: parseInt(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Cost ($/1M):</span>
                    <span className="text-cyan-300 font-bold">{weights.cost}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weights.cost}
                    onChange={(e) => setWeights({ ...weights, cost: parseInt(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Latency (TTFT/ITL):</span>
                    <span className="text-cyan-300 font-bold">{weights.latency}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weights.latency}
                    onChange={(e) => setWeights({ ...weights, latency: parseInt(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Memory Headroom:</span>
                    <span className="text-cyan-300 font-bold">{weights.memory}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weights.memory}
                    onChange={(e) => setWeights({ ...weights, memory: parseInt(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Energy (Joules):</span>
                    <span className="text-cyan-300 font-bold">{weights.energy}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weights.energy}
                    onChange={(e) => setWeights({ ...weights, energy: parseInt(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 5: RESULTS & RANKED RECOMMENDATIONS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">5</span>
              <h2 className="text-base sm:text-lg font-mono font-bold text-white uppercase tracking-wider">
                Optimization Recommendations & Pareto Analysis
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterMeetsSloOnly}
                  onChange={(e) => setFilterMeetsSloOnly(e.target.checked)}
                  className="rounded border-[#27354F] text-cyan-500 focus:ring-0"
                />
                <span>Strict SLO Only</span>
              </label>
              <span className="text-xs font-mono text-slate-400">
                {displayedCandidates.length} viable configs analyzed
              </span>
            </div>
          </div>

          {/* TOP WINNER HERO CARD */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D1527] via-[#0F192E] to-[#0A111E] border-2 border-emerald-500/50 p-6 sm:p-7 shadow-2xl">
            {/* Top Glow & Badge */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#1E293B]">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      TOP RECOMMENDED CONFIGURATION
                    </span>
                    <span className="text-xs font-mono text-cyan-400">
                      Overall Score: <strong className="text-emerald-300 text-sm font-bold">{recommended.scores.overall}/100</strong>
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                    {recommended.hardware.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#131B2E] text-cyan-300 border border-[#27354F]">
                      Precision: <strong>{recommended.precision}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#131B2E] text-indigo-300 border border-[#27354F]">
                      Runtime: <strong>{recommended.runtime}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#131B2E] text-amber-300 border border-[#27354F]">
                      Tensor Parallel: <strong>TP={recommended.tensorParallelSize}</strong> ({recommended.tensorParallelSize}x GPU)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#131B2E] text-emerald-300 border border-[#27354F]">
                      Confidence: <strong>{recommended.confidence}</strong>
                    </span>
                  </div>
                </div>

                {/* Primary Action CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  <button
                    onClick={handleDeployWinner}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <span>1-Click Deploy Config</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleCopyCli}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[#07090E] hover:bg-[#131B2E] text-slate-300 hover:text-white text-xs font-mono rounded-xl border border-[#27354F] transition-all cursor-pointer"
                  >
                    {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{copiedCli ? 'Copied CLI' : 'Copy CLI'}</span>
                  </button>

                  <button
                    onClick={() => onNavigate('app-simulator')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white text-xs font-mono rounded-xl border border-[#27354F] transition-all cursor-pointer"
                  >
                    <span>What-If Sim</span>
                  </button>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
                <div className="bg-[#07090E]/80 p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-[10px] text-slate-400 block">Time to First Token:</span>
                  <div className="text-lg font-extrabold text-cyan-300 mt-0.5">
                    {recommended.simulation.performance.ttftMs.toFixed(1)} <span className="text-xs font-normal text-slate-500">ms</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    SLO Target: {slo.ttftTargetMs} ms
                  </span>
                </div>

                <div className="bg-[#07090E]/80 p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-[10px] text-slate-400 block">Inter-Token Latency:</span>
                  <div className="text-lg font-extrabold text-cyan-300 mt-0.5">
                    {recommended.simulation.performance.itlMs.toFixed(2)} <span className="text-xs font-normal text-slate-500">ms/tok</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    SLO Target: {slo.itlTargetMs} ms
                  </span>
                </div>

                <div className="bg-[#07090E]/80 p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-[10px] text-slate-400 block">Stream Generation:</span>
                  <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                    {Math.round(recommended.simulation.performance.tokensPerSecPerRequest)} <span className="text-xs font-normal text-slate-500">tok/s</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Single stream speed
                  </span>
                </div>

                <div className="bg-[#07090E]/80 p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-[10px] text-slate-400 block">Aggregate Throughput:</span>
                  <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                    {Math.round(recommended.simulation.performance.aggregateTokensPerSec)} <span className="text-xs font-normal text-slate-500">tok/s</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {workload.batchSize} batch x {workload.concurrentRequests} req
                  </span>
                </div>

                <div className="bg-[#07090E]/80 p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-[10px] text-slate-400 block">Cost per 1M Tokens:</span>
                  <div className="text-lg font-extrabold text-amber-300 mt-0.5">
                    ${recommended.simulation.efficiency.costPerMillionTokensUsd.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Cloud on-demand
                  </span>
                </div>

                <div className="bg-[#07090E]/80 p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-[10px] text-slate-400 block">VRAM Footprint:</span>
                  <div className="text-lg font-extrabold text-indigo-300 mt-0.5">
                    {recommended.simulation.vramRequiredGb.toFixed(1)} <span className="text-xs font-normal text-slate-500">/ {recommended.simulation.vramAvailableGb} GB</span>
                  </div>
                  <span className="text-[10px] text-emerald-400">
                    {Math.round((1 - recommended.simulation.vramRequiredGb / recommended.simulation.vramAvailableGb) * 100)}% Headroom
                  </span>
                </div>
              </div>

              {/* Justification & Why this configuration won */}
              <div className="bg-[#07090E]/90 p-4 rounded-xl border border-cyan-800/40 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Why This Configuration Won</span>
                </div>
                <p className="text-xs font-mono text-slate-200 leading-relaxed">
                  {optimizationResults.winnerJustification}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 border-t border-[#1E293B]">
                  <div>
                    <span className="text-slate-500">Bottleneck:</span>{' '}
                    <span className="text-amber-400 font-semibold">{recommended.simulation.bottleneck}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Confidence:</span>{' '}
                    <span className="text-emerald-400 font-semibold">{recommended.confidenceReason}</span>
                  </div>
                </div>
              </div>

              {/* Tradeoffs & Assumptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#07090E]/60 p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-slate-400 font-bold block mb-1.5">Trade-offs & Considerations:</span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {recommended.tradeoffs.map((t, idx) => (
                      <li key={idx} className="leading-snug">{t}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#07090E]/60 p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-slate-400 font-bold block mb-1.5">Simulation Assumptions:</span>
                  <ul className="space-y-1 text-slate-400 list-disc list-inside">
                    {recommended.assumptions.map((a, idx) => (
                      <li key={idx} className="leading-snug">{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* PARETO FRONTIER VISUALIZATION */}
          <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Pareto Optimal Frontier (Throughput vs Cost)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Green points indicate non-dominated Pareto configurations
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Cost ($/1M tokens)" 
                    unit="$" 
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Throughput (tok/s)" 
                    unit=" tok/s" 
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (!payload || payload.length === 0) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0A0D14] border border-[#27354F] p-2.5 rounded-xl text-xs font-mono text-white shadow-xl">
                          <p className="font-bold text-cyan-300">{data.name}</p>
                          <p className="text-slate-300">Throughput: {Math.round(data.y)} tok/s</p>
                          <p className="text-amber-300">Cost: ${data.x.toFixed(2)} / 1M</p>
                          <p className="text-emerald-400">{data.isPareto ? '★ Pareto Optimal' : 'Sub-optimal'}</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter 
                    data={displayedCandidates.map(c => ({
                      x: c.simulation.efficiency.costPerMillionTokensUsd,
                      y: c.simulation.performance.aggregateTokensPerSec,
                      name: `${c.hardware.model} (${c.precision}, TP=${c.tensorParallelSize})`,
                      isPareto: c.isPareto,
                      isWinner: c.id === recommended.id
                    }))} 
                  >
                    {displayedCandidates.map((c, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={c.id === recommended.id ? '#10B981' : (c.isPareto ? '#06B6D4' : '#475569')} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RANKED CANDIDATE CONFIGURATIONS TABLE */}
          <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] overflow-hidden">
            <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Full Ranked Candidate Configurations
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Sorted by Overall Score
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#07090E] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#1E293B]">
                  <tr>
                    <th className="py-3 px-4">Rank & Accelerator</th>
                    <th className="py-3 px-3">Precision / TP</th>
                    <th className="py-3 px-3">Runtime</th>
                    <th className="py-3 px-3">TTFT (ms)</th>
                    <th className="py-3 px-3">ITL (ms)</th>
                    <th className="py-3 px-3">Throughput</th>
                    <th className="py-3 px-3">Cost / 1M</th>
                    <th className="py-3 px-3">VRAM Used</th>
                    <th className="py-3 px-3">SLO</th>
                    <th className="py-3 px-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {displayedCandidates.slice(0, 10).map((c, idx) => {
                    const isWinner = c.id === recommended.id;
                    return (
                      <tr 
                        key={c.id} 
                        className={`hover:bg-[#131B2E]/60 transition-colors ${
                          isWinner ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                              idx === 0 ? 'bg-emerald-500 text-black' : (idx < 3 ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-[#131B2E] text-slate-400')
                            }`}>
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-white">{c.hardware.name}</p>
                              <span className="text-[10px] text-slate-500">{c.hardware.vendor} · {c.hardware.architecture}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-[#07090E] text-cyan-300 border border-[#27354F] font-semibold text-[11px]">
                            {c.precision} · TP={c.tensorParallelSize}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-300">
                          {c.runtime}
                        </td>

                        <td className="py-3 px-3 text-cyan-300">
                          {c.simulation.performance.ttftMs.toFixed(1)}
                        </td>

                        <td className="py-3 px-3 text-cyan-300">
                          {c.simulation.performance.itlMs.toFixed(2)}
                        </td>

                        <td className="py-3 px-3 text-emerald-400 font-bold">
                          {Math.round(c.simulation.performance.aggregateTokensPerSec)} tok/s
                        </td>

                        <td className="py-3 px-3 text-amber-300">
                          ${c.simulation.efficiency.costPerMillionTokensUsd.toFixed(2)}
                        </td>

                        <td className="py-3 px-3 text-slate-300">
                          {c.simulation.vramRequiredGb.toFixed(1)} / {c.simulation.vramAvailableGb} GB
                        </td>

                        <td className="py-3 px-3">
                          {c.meetsSlo ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                              PASS
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
                              MISS
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-bold text-emerald-300">
                            {c.scores.overall}
                          </span>
                          <span className="text-[10px] text-slate-500">/100</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
