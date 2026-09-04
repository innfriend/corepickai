import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Cpu, 
  Layers, 
  Sliders, 
  Terminal, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  Gauge,
  Sparkles,
  Info,
  Smartphone
} from 'lucide-react';
import { ModelArchitecture, HardwareSpec, OptimizationObjective, PrecisionType, OptimizationJob, BenchmarkResult } from '../types';
import { MODEL_CATALOG, HARDWARE_CATALOG, SAMPLE_OPTIMIZATION_JOBS } from '../data/mockData';
import { QuickOptimizationPresets, OptimizationPreset } from './QuickOptimizationPresets';
import { OOMWarningGuard } from './OOMWarningGuard';
import { ConceptTooltip } from './ConceptTooltip';

interface ProfilerWizardViewProps {
  initialModelId?: string;
  onJobCompleted: (job: OptimizationJob) => void;
  onNavigate: (view: string) => void;
}

export const ProfilerWizardView: React.FC<ProfilerWizardViewProps> = ({
  initialModelId,
  onJobCompleted,
  onNavigate,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedModelId, setSelectedModelId] = useState(initialModelId || MODEL_CATALOG[0].id);
  const [selectedHardwareIds, setSelectedHardwareIds] = useState<string[]>([
    'nvidia-rtx-4090',
    'nvidia-h100-sxm',
    'qualcomm-snapdragon-x-elite',
    'apple-m3-max',
  ]);
  const [objective, setObjective] = useState<OptimizationObjective>('lowest_latency');
  const [selectedPrecisions, setSelectedPrecisions] = useState<PrecisionType[]>(['FP16', 'INT8']);
  const [batchSizes, setBatchSizes] = useState<number[]>([1, 4, 16, 32]);
  const [builderOptimizationLevel, setBuilderOptimizationLevel] = useState(5);
  const [appliedPresetId, setAppliedPresetId] = useState<string | undefined>(undefined);

  // Simulation Runner State
  const [isRunning, setIsRunning] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [finishedJob, setFinishedJob] = useState<OptimizationJob | null>(null);

  const selectedModel = MODEL_CATALOG.find((m) => m.id === selectedModelId) || MODEL_CATALOG[0];
  const primaryHardware = HARDWARE_CATALOG.find((h) => selectedHardwareIds.includes(h.id)) || HARDWARE_CATALOG[0];

  const handleApplyPreset = (preset: OptimizationPreset) => {
    setAppliedPresetId(preset.id);
    setSelectedModelId(preset.modelId);
    setSelectedHardwareIds(preset.hardwareIds);
    setObjective(preset.targetObjective);
    setSelectedPrecisions(preset.precisions);
  };

  const toggleHardware = (id: string) => {
    if (selectedHardwareIds.includes(id)) {
      if (selectedHardwareIds.length > 1) {
        setSelectedHardwareIds(selectedHardwareIds.filter((h) => h !== id));
      }
    } else {
      setSelectedHardwareIds([...selectedHardwareIds, id]);
    }
  };

  const togglePrecision = (p: PrecisionType) => {
    if (selectedPrecisions.includes(p)) {
      if (selectedPrecisions.length > 1) {
        setSelectedPrecisions(selectedPrecisions.filter((prec) => prec !== p));
      }
    } else {
      setSelectedPrecisions([...selectedPrecisions, p]);
    }
  };

  const objectives: { id: OptimizationObjective; label: string; desc: string; icon: any }[] = [
    {
      id: 'lowest_latency',
      label: 'Lowest Latency (Sub-ms)',
      desc: 'Optimized for real-time robotic control, audio streaming, and conversational AI.',
      icon: Zap,
    },
    {
      id: 'highest_throughput',
      label: 'Maximum Concurrency & Throughput',
      desc: 'Maximize total inferences/sec & continuous batching throughput on enterprise cloud clusters.',
      icon: Gauge,
    },
    {
      id: 'lowest_power',
      label: 'Lowest Power Consumption',
      desc: 'Engineered for battery-powered edge NPUs, drones, and mobile smart devices (< 15W).',
      icon: Cpu,
    },
    {
      id: 'lowest_cost',
      label: 'Minimized Cloud TCO Cost',
      desc: 'Achieve the lowest possible dollar cost per million inferences across cloud providers.',
      icon: Sliders,
    },
    {
      id: 'balanced',
      label: 'Balanced Pareto Optimum',
      desc: 'Weighted multi-objective search balancing latency, thermal power, and cloud spend.',
      icon: Check,
    },
  ];

  const createSyntheticJob = (
    model: ModelArchitecture,
    hwIds: string[],
    precisions: PrecisionType[],
    obj: OptimizationObjective
  ): OptimizationJob => {
    const generatedResults: BenchmarkResult[] = hwIds.map((hwId) => {
      const hw = HARDWARE_CATALOG.find((h) => h.id === hwId) || HARDWARE_CATALOG[0];
      const isPrecisionInt8 = precisions.includes('INT8') || precisions.includes('INT4');
      const precision = precisions[0] || (isPrecisionInt8 ? 'INT8' : 'FP16');
      const effectiveCompute = precision === 'INT8' || precision === 'INT4' ? hw.int8Tops : hw.fp16Tflops;
      const baseLatencyMs = Math.max(0.8, Number(((model.totalFlopsGflops / (Math.max(1, effectiveCompute) * 1000)) * 1200).toFixed(2)));
      const throughputFps = Number((1000 / baseLatencyMs).toFixed(1));
      const powerWatts = Math.min(hw.tdpWatts, Math.max(15, Math.round(hw.tdpWatts * 0.85)));
      const costPerMillion = Number(((baseLatencyMs * (hw.hourlyCloudCostUsd || 0.5) / 3600)).toFixed(2));
      const memoryUsedMb = Math.round(model.modelSizeBytesMb * (precision === 'INT8' ? 0.55 : precision === 'INT4' ? 0.3 : 1.05));

      return {
        hardwareId: hw.id,
        hardwareName: hw.name,
        vendor: hw.vendor,
        hardwareType: hw.type,
        runtimeEngine: hw.supportedRuntimes[0] || 'TensorRT',
        precision,
        batchSize: 1,
        latencyMs: baseLatencyMs,
        p99LatencyMs: Number((baseLatencyMs * 1.15).toFixed(2)),
        throughputFps,
        powerConsumptionWatts: powerWatts,
        memoryUsedMb,
        costPerMillionInferencesUsd: costPerMillion,
        efficiencyScore: Math.round(Math.min(99, Math.max(40, 100 - (baseLatencyMs * 2)))),
        isParetoOptimal: hw.id.includes('h100') || hw.id.includes('4090') || hw.id.includes('snapdragon') || hw.id.includes('m3'),
        notes: `${precision} quantized TensorRT execution harness.`,
      };
    });

    const matchingSampleJob = SAMPLE_OPTIMIZATION_JOBS.find(j => j.modelId === model.id) || SAMPLE_OPTIMIZATION_JOBS[0];

    return {
      id: `job-${model.slug || model.id}-${Date.now().toString().slice(-4)}`,
      modelId: model.id,
      modelName: model.name,
      modelCategory: model.category,
      createdAt: new Date().toISOString(),
      status: 'completed',
      objective: obj,
      targetPrecisions: precisions,
      targetHardwareIds: hwIds,
      selectedBaselineHardwareId: hwIds[0] || 'nvidia-rtx-4090',
      results: generatedResults.length > 0 ? generatedResults : matchingSampleJob.results,
      flamegraph: matchingSampleJob.flamegraph,
      batchSweepData: matchingSampleJob.batchSweepData,
      aiInsights: {
        summary: `Optimization job completed for ${model.name}. Model achieved maximum throughput across target hardware clusters with ${precisions.join('/')} precision modes.`,
        topBottleneck: model.topOperators?.[0]?.name ? `${model.topOperators[0].name} kernel memory access` : 'Memory bandwidth roofline saturation',
        recommendedDevice: hwIds[0] || 'nvidia-rtx-4090',
        estimatedCostSavingsPct: 64.8,
        recommendedRuntime: 'TensorRT / QNN runtime engines with direct INT8 calibration cache',
        tuningFlags: ['--builderOptimizationLevel=5', '--fp16', '--int8', '--workspace=4096MB'],
      },
    };
  };

  const handleStartProfiling = async () => {
    setIsRunning(true);
    setFinishedJob(null);
    setProgressPct(5);
    setSimulationLogs(['[CorePick Engine v2.5] Initializing Hardware Profiling Daemon...']);

    const stages = [
      { pct: 15, msg: `Parsing computational graph for ${selectedModel.name}... (${selectedModel.layersCount} operators)` },
      { pct: 30, msg: 'Applying graph rewrites: Collapsing Conv2D + BatchNorm + SiLU into unified registers' },
      { pct: 45, msg: `Generating ${selectedPrecisions.join('/')} calibration profiles with KL-divergence quantization...` },
      { pct: 65, msg: `Dispatching hardware-in-the-loop warmup benchmarks on ${selectedHardwareIds.length} target devices...` },
      { pct: 85, msg: 'Collecting kernel flamegraph execution timestamps and memory bandwidth roofline telemetry...' },
      { pct: 95, msg: 'Computing 4D Pareto frontier and generating optimized TensorRT / QNN engine harnesses...' },
      { pct: 100, msg: 'Optimization run complete! Packaging results...' },
    ];

    for (let i = 0; i < stages.length; i++) {
      await new Promise((r) => setTimeout(r, 450));
      setProgressPct(stages[i].pct);
      setCurrentStage(stages[i].msg);
      setSimulationLogs((prev) => [...prev, `[STAGE ${i + 1}/7] ${stages[i].msg}`]);
    }

    let finalJob: OptimizationJob | null = null;

    try {
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel.id,
          objective,
          targetPrecisions: selectedPrecisions,
          targetHardwareIds: selectedHardwareIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.job) {
          finalJob = data.job;
        }
      }
    } catch (e) {
      console.warn('Backend API job creation not reached, using instant client engine:', e);
    }

    // Ensure job object is guaranteed
    if (!finalJob) {
      finalJob = createSyntheticJob(selectedModel, selectedHardwareIds, selectedPrecisions, objective);
    }

    setFinishedJob(finalJob);
    setSimulationLogs((prev) => [...prev, `[SUCCESS] Optimization completed successfully! Opening final report...`]);
    setIsRunning(false);
    
    // Immediate callback to mount results view
    onJobCompleted(finalJob);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-2">
            <span>Optimization & Profiling Wizard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure multi-target hardware profiling, precision modes, and kernel compilation constraints.
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              onClick={() => !isRunning && setCurrentStep(step)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                currentStep === step
                  ? 'bg-cyan-500 text-[#07090E] shadow-sm'
                  : currentStep > step
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                  : 'bg-[#131B2E] text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>{step}</span>
              <span className="hidden md:inline">
                {step === 1 ? 'Model' : step === 2 ? 'Hardware' : step === 3 ? 'Target' : 'Precision'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 1-Click Goal Recipes (Instant Presets) */}
      {!isRunning && (
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-5">
          <QuickOptimizationPresets
            onSelectPreset={handleApplyPreset}
            selectedPresetId={appliedPresetId}
          />
        </div>
      )}

      {/* Main Wizard Content Card */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        {isRunning ? (
          /* Live Simulation Terminal View */
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-mono font-bold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compiler Daemon Active ({progressPct}%)</span>
              </div>
              <h3 className="text-xl font-bold text-white font-mono">{currentStage}</h3>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-[#07090E] rounded-full overflow-hidden border border-[#1E293B]">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Terminal Logs */}
            <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5">
              {simulationLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-500">&gt;</span>
                  <span className={idx === simulationLogs.length - 1 ? 'text-emerald-400 font-bold' : ''}>
                    {log}
                  </span>
                </div>
              ))}
            </div>

            {/* Action when compilation finishes */}
            {progressPct >= 95 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setIsRunning(false);
                    if (finishedJob) {
                      onJobCompleted(finishedJob);
                    } else {
                      const job = createSyntheticJob(selectedModel, selectedHardwareIds, selectedPrecisions, objective);
                      onJobCompleted(job);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#07090E] font-mono font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>View Full Optimization Report & Flamegraph</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Step-by-Step Configuration */
          <div className="space-y-8">
            {/* STEP 1: Select Model */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono">Step 1: Choose Target Architecture</h3>
                    <p className="text-xs text-slate-400">Select an existing neural network architecture or ingested model.</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-xl border border-cyan-800/60">
                    Selected: <strong>{selectedModel.name}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MODEL_CATALOG.map((m) => {
                    const isSelected = selectedModelId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedModelId(m.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-gradient-to-b from-cyan-950/40 to-[#0A0E1A] border-cyan-500 shadow-md ring-1 ring-cyan-400/30'
                            : 'bg-[#07090E] border-[#1E293B] hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                            {m.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-300">{m.parameterCountFormatted}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white font-mono mt-2">{m.name}</h4>
                        <div className="mt-3 pt-2 border-t border-[#1E293B] text-[11px] font-mono text-slate-400 flex items-center justify-between">
                          <span>{m.framework}</span>
                          <span className="flex items-center gap-1">
                            <span>{m.totalFlopsGflops} GFLOPs</span>
                            <ConceptTooltip conceptKey="arithmetic_intensity" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Select Hardware Scope */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono">Step 2: Select Hardware Comparison Scope</h3>
                    <p className="text-xs text-slate-400">Choose 2 or more target devices to benchmark and compute Pareto frontiers.</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedHardwareIds.length} devices selected
                  </span>
                </div>

                {/* Real-Time Memory Sizing Guard */}
                <OOMWarningGuard
                  model={selectedModel}
                  selectedHardware={primaryHardware}
                  precision={selectedPrecisions[0] || 'FP16'}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {HARDWARE_CATALOG.map((hw) => {
                    const isChecked = selectedHardwareIds.includes(hw.id);
                    return (
                      <div
                        key={hw.id}
                        onClick={() => toggleHardware(hw.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-cyan-950/30 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                            : 'bg-[#07090E] border-[#1E293B] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">{hw.vendor}</span>
                            <h4 className="text-sm font-bold text-white font-mono mt-0.5">{hw.name}</h4>
                          </div>
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                            isChecked ? 'bg-cyan-500 border-cyan-400 text-[#07090E]' : 'border-[#1E293B]'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#1E293B] grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                          <div>Memory: <span className="text-white">{hw.memoryGb}GB</span></div>
                          <div>Bandwidth: <span className="text-cyan-300">{hw.memoryBandwidthGBs} GB/s</span></div>
                          <div>TDP: <span className="text-amber-300">{hw.tdpWatts}W</span></div>
                          <div>INT8: <span className="text-emerald-300">{hw.int8Tops} TOPS</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Define Optimization Objective */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white font-mono">Step 3: Define Optimization Target</h3>
                  <p className="text-xs text-slate-400">The compiler will bias graph partitioning and memory allocation toward this metric.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {objectives.map((obj) => {
                    const isSelected = objective === obj.id;
                    const Icon = obj.icon;
                    return (
                      <div
                        key={obj.id}
                        onClick={() => setObjective(obj.id)}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-950/50 to-indigo-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-400/40'
                            : 'bg-[#07090E] border-[#1E293B] hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cyan-500 text-[#07090E]' : 'bg-[#131B2E] text-slate-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white font-mono">{obj.label}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{obj.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Precision & Advanced Settings */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white font-mono">Step 4: Precision Modes & Compiler Constraints</h3>
                  <p className="text-xs text-slate-400">Select target precisions and compiler tuning flags.</p>
                </div>

                {/* Sizing Guard for the selected precision */}
                <OOMWarningGuard
                  model={selectedModel}
                  selectedHardware={primaryHardware}
                  precision={selectedPrecisions[0] || 'FP16'}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <span>Target Quantization Precisions</span>
                      <ConceptTooltip conceptKey="awq" />
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Select 1 or more</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {(['FP32', 'FP16', 'BF16', 'INT8', 'INT4'] as PrecisionType[]).map((prec) => {
                      const isChecked = selectedPrecisions.includes(prec);
                      return (
                        <button
                          key={prec}
                          type="button"
                          onClick={() => togglePrecision(prec)}
                          className={`p-3 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-cyan-500 text-[#07090E] border-cyan-400 shadow-sm'
                              : 'bg-[#07090E] text-slate-400 border-[#1E293B] hover:text-white'
                          }`}
                        >
                          {prec}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <span>TensorRT Builder Optimization Level</span>
                      <ConceptTooltip conceptKey="operator_fusion" />
                    </span>
                    <span className="text-cyan-400 font-bold">Level {builderOptimizationLevel} (Maximum Polyhedral Loop Search)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={builderOptimizationLevel}
                    onChange={(e) => setBuilderOptimizationLevel(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-[#1E293B]">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(currentStep - 1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-colors ${
                  currentStep === 1 ? 'opacity-40 cursor-not-allowed text-slate-600' : 'bg-[#131B2E] text-slate-300 hover:text-white cursor-pointer'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-[#07090E] font-bold text-xs rounded-xl shadow-md transition-transform hover:scale-105 cursor-pointer font-mono"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartProfiling}
                  className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition-transform hover:scale-105 cursor-pointer font-mono"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Optimization Job</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
