import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  Activity, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  BarChart3, 
  RotateCcw, 
  Zap, 
  Cpu, 
  TrendingDown, 
  TrendingUp, 
  ShieldCheck, 
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Scale
} from 'lucide-react';
import { ModelArchitecture, PrecisionType, OptimizationJob } from '../types';
import { MODEL_CATALOG } from '../data/mockData';
import { ConceptTooltip } from './ConceptTooltip';

export type QuantMethod = 'FP16' | 'BF16' | 'FP8' | 'INT8' | 'AWQ_INT4' | 'INT4' | 'SmoothQuant';

interface LayerQuantSetting {
  id: string;
  name: string;
  family: 'Attention' | 'Linear/MLP' | 'Norm/Activation' | 'Embedding/Head';
  paramCountM: number;
  sensitivity: number; // 0 to 10
  selectedMethod: QuantMethod;
  outlierRisk: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface QuantizationAccuracySimulatorProps {
  job?: OptimizationJob;
  initialModelId?: string;
  onNavigate?: (view: string) => void;
}

export const QuantizationAccuracySimulator: React.FC<QuantizationAccuracySimulatorProps> = ({
  job,
  initialModelId,
  onNavigate,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(
    initialModelId || job?.modelId || MODEL_CATALOG[0].id
  );

  const selectedModel = useMemo(() => {
    return MODEL_CATALOG.find((m) => m.id === selectedModelId) || MODEL_CATALOG[0];
  }, [selectedModelId]);

  // Initial layer definitions for selected model
  const initialLayers: LayerQuantSetting[] = useMemo(() => {
    const isVision = selectedModel.category.includes('Vision');
    if (isVision) {
      return [
        { id: 'l1', name: 'backbone.stem.conv1', family: 'Embedding/Head', paramCountM: 1.2, sensitivity: 8.8, selectedMethod: 'FP16', outlierRisk: 'High' },
        { id: 'l2', name: 'backbone.stage1.resblock', family: 'Linear/MLP', paramCountM: 4.8, sensitivity: 4.1, selectedMethod: 'INT8', outlierRisk: 'Low' },
        { id: 'l3', name: 'backbone.stage2.resblock', family: 'Linear/MLP', paramCountM: 8.5, sensitivity: 4.5, selectedMethod: 'INT8', outlierRisk: 'Low' },
        { id: 'l4', name: 'backbone.stage3.resblock', family: 'Linear/MLP', paramCountM: 18.2, sensitivity: 5.2, selectedMethod: 'AWQ_INT4', outlierRisk: 'Medium' },
        { id: 'l5', name: 'backbone.stage4.resblock', family: 'Linear/MLP', paramCountM: 32.0, sensitivity: 6.0, selectedMethod: 'AWQ_INT4', outlierRisk: 'Medium' },
        { id: 'l6', name: 'head.classification_proj', family: 'Embedding/Head', paramCountM: 2.1, sensitivity: 9.1, selectedMethod: 'FP16', outlierRisk: 'Critical' },
      ];
    }

    return [
      { id: 'l_emb', name: 'model.embed_tokens', family: 'Embedding/Head', paramCountM: 520, sensitivity: 7.8, selectedMethod: 'FP16', outlierRisk: 'High' },
      { id: 'l_qkv', name: 'model.layers.self_attn.qkv_proj', family: 'Attention', paramCountM: 1450, sensitivity: 8.2, selectedMethod: 'AWQ_INT4', outlierRisk: 'High' },
      { id: 'l_o', name: 'model.layers.self_attn.o_proj', family: 'Attention', paramCountM: 1050, sensitivity: 7.4, selectedMethod: 'AWQ_INT4', outlierRisk: 'Medium' },
      { id: 'l_gate_up', name: 'model.layers.mlp.gate_up_proj', family: 'Linear/MLP', paramCountM: 2850, sensitivity: 3.8, selectedMethod: 'INT4', outlierRisk: 'Low' },
      { id: 'l_down', name: 'model.layers.mlp.down_proj', family: 'Linear/MLP', paramCountM: 1420, sensitivity: 4.6, selectedMethod: 'INT4', outlierRisk: 'Low' },
      { id: 'l_norm', name: 'model.layers.input_layernorm', family: 'Norm/Activation', paramCountM: 12, sensitivity: 9.5, selectedMethod: 'FP16', outlierRisk: 'Critical' },
      { id: 'l_head', name: 'lm_head.weight', family: 'Embedding/Head', paramCountM: 520, sensitivity: 8.9, selectedMethod: 'FP16', outlierRisk: 'Critical' },
    ];
  }, [selectedModel]);

  const [layers, setLayers] = useState<LayerQuantSetting[]>(initialLayers);
  const [selectedLayerForHistogram, setSelectedLayerForHistogram] = useState<string>('l_qkv');
  const [calibrationSamples, setCalibrationSamples] = useState<number>(512);

  // Sync when model changes
  React.useEffect(() => {
    setLayers(initialLayers);
    setSelectedLayerForHistogram(initialLayers[1]?.id || initialLayers[0]?.id || 'l1');
  }, [initialLayers]);

  // Handle per-layer method update
  const handleLayerMethodChange = (layerId: string, method: QuantMethod) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, selectedMethod: method } : l))
    );
  };

  // Preset Applicator
  const applyPreset = (presetType: 'fp16' | 'awq_balanced' | 'int8_safe' | 'int4_extreme') => {
    setLayers((prev) =>
      prev.map((l) => {
        if (presetType === 'fp16') return { ...l, selectedMethod: 'FP16' };
        if (presetType === 'int8_safe') return { ...l, selectedMethod: 'INT8' };
        if (presetType === 'int4_extreme') return { ...l, selectedMethod: 'INT4' };
        // AWQ Balanced: Keep Norm & Head in FP16, Attention in AWQ_INT4, MLP in INT4
        if (l.family === 'Norm/Activation' || l.name.includes('head') || l.name.includes('embed')) {
          return { ...l, selectedMethod: 'FP16' };
        }
        if (l.family === 'Attention') {
          return { ...l, selectedMethod: 'AWQ_INT4' };
        }
        return { ...l, selectedMethod: 'INT4' };
      })
    );
  };

  // Base baseline performance for selected model
  const baseline = useMemo(() => {
    const isVision = selectedModel.category.includes('Vision');
    return {
      mmlu: isVision ? 88.4 : 68.8,
      ppl: isVision ? 2.10 : 5.48,
      top1Acc: isVision ? 84.6 : 79.2,
      baseVramGb: +(selectedModel.modelSizeBytesMb / 1024 * 2).toFixed(1), // FP16
      baseLatencyMs: +(selectedModel.totalFlopsGflops / 32).toFixed(1),
    };
  }, [selectedModel]);

  // Calculate Degradation & Gains
  const calculatedMetrics = useMemo(() => {
    let totalParams = 0;
    let effectiveBitsSum = 0;
    let weightedAccuracyPenalty = 0;
    let weightedPplPenalty = 0;
    let speedupWeight = 0;
    let criticalOutlierViolations = 0;

    layers.forEach((l) => {
      totalParams += l.paramCountM;
      let bits = 16;
      let accPen = 0;
      let pplPen = 0;
      let speedMult = 1.0;

      switch (l.selectedMethod) {
        case 'FP16':
        case 'BF16':
          bits = 16;
          accPen = 0;
          pplPen = 0;
          speedMult = 1.0;
          break;
        case 'FP8':
          bits = 8;
          accPen = 0.15 * (l.sensitivity / 5);
          pplPen = 0.04 * (l.sensitivity / 5);
          speedMult = 1.65;
          break;
        case 'INT8':
        case 'SmoothQuant':
          bits = 8;
          accPen = 0.25 * (l.sensitivity / 5);
          pplPen = 0.08 * (l.sensitivity / 5);
          speedMult = 1.85;
          break;
        case 'AWQ_INT4':
          bits = 4;
          accPen = 0.65 * (l.sensitivity / 5);
          pplPen = 0.22 * (l.sensitivity / 5);
          speedMult = 2.65;
          break;
        case 'INT4':
          bits = 4;
          accPen = 1.45 * (l.sensitivity / 5);
          pplPen = 0.65 * (l.sensitivity / 5);
          speedMult = 2.85;
          if (l.sensitivity > 8.0) {
            criticalOutlierViolations += 1;
          }
          break;
      }

      effectiveBitsSum += bits * l.paramCountM;
      weightedAccuracyPenalty += accPen * l.paramCountM;
      weightedPplPenalty += pplPen * l.paramCountM;
      speedupWeight += speedMult * l.paramCountM;
    });

    const avgBits = +(effectiveBitsSum / Math.max(1, totalParams)).toFixed(1);
    const avgAccDrop = +(weightedAccuracyPenalty / Math.max(1, totalParams)).toFixed(2);
    const avgPplIncrease = +(weightedPplPenalty / Math.max(1, totalParams)).toFixed(2);
    const overallSpeedup = +(speedupWeight / Math.max(1, totalParams)).toFixed(2);

    const projectedMmlu = +(baseline.mmlu - avgAccDrop).toFixed(1);
    const projectedPpl = +(baseline.ppl + avgPplIncrease).toFixed(2);
    const projectedTop1 = +(baseline.top1Acc - avgAccDrop * 0.9).toFixed(1);
    const projectedVramGb = +(baseline.baseVramGb * (avgBits / 16)).toFixed(1);
    const projectedLatencyMs = +(baseline.baseLatencyMs / overallSpeedup).toFixed(1);
    const vramSavingsPct = Math.round((1 - projectedVramGb / baseline.baseVramGb) * 100);

    return {
      avgBits,
      projectedMmlu,
      projectedPpl,
      projectedTop1,
      projectedVramGb,
      projectedLatencyMs,
      vramSavingsPct,
      overallSpeedup,
      avgAccDrop,
      avgPplIncrease,
      criticalOutlierViolations,
    };
  }, [layers, baseline]);

  const activeHistogramLayer = useMemo(() => {
    return layers.find((l) => l.id === selectedLayerForHistogram) || layers[0];
  }, [selectedLayerForHistogram, layers]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 flex items-center gap-1">
                <Scale className="w-3 h-3" />
                <span>Accuracy vs. Compression Simulator</span>
              </span>
              <span className="text-xs font-mono text-slate-400">Mixed-Precision Tuning Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <span>Layer-by-Layer Quantization & Accuracy Degradation</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Simulate per-layer mixed-precision assignments (AWQ INT4, SmoothQuant W8A8, FP8, FP16) to find the optimal trade-off between MMLU accuracy retention, VRAM compression, and execution latency.
            </p>
          </div>

          {/* Model Selector & Presets */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-[#07090E] border border-[#1E293B] rounded-2xl p-1.5 font-mono text-xs">
              <Layers className="w-4 h-4 text-cyan-400 ml-2" />
              <span className="text-slate-400">Model:</span>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="bg-[#131B2E] border border-[#27354F] text-cyan-300 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {MODEL_CATALOG.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.parameterCountFormatted})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Global Preset Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#1E293B]">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Apply Optimization Presets:</span>
          </span>
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <button
              onClick={() => applyPreset('fp16')}
              className="px-3 py-1.5 rounded-xl bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 border border-[#27354F] transition-all cursor-pointer"
            >
              Full Precision (FP16 Baseline)
            </button>
            <button
              onClick={() => applyPreset('int8_safe')}
              className="px-3 py-1.5 rounded-xl bg-[#131B2E] hover:bg-[#1E293B] text-cyan-300 border border-cyan-800/60 transition-all cursor-pointer"
            >
              SmoothQuant INT8 (Safe)
            </button>
            <button
              onClick={() => applyPreset('awq_balanced')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-[#07090E] font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              ★ AWQ INT4 Hybrid (Recommended)
            </button>
            <button
              onClick={() => applyPreset('int4_extreme')}
              className="px-3 py-1.5 rounded-xl bg-[#131B2E] hover:bg-rose-950 text-rose-300 border border-rose-800/60 transition-all cursor-pointer"
            >
              Aggressive INT4 (Max Squeeze)
            </button>
          </div>
        </div>

        {/* Live Scoreboard (Before vs After) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
          <div className="p-3.5 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Effective Bitwidth</span>
            <div className="text-xl font-extrabold text-cyan-300">{calculatedMetrics.avgBits} <span className="text-xs font-normal text-slate-400">bits/wt</span></div>
            <div className="text-[10px] text-slate-500">FP16 Baseline: 16.0</div>
          </div>

          <div className="p-3.5 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">MMLU / Accuracy</span>
            <div className="text-xl font-extrabold text-emerald-300">
              {calculatedMetrics.projectedMmlu}%
            </div>
            <div className="text-[10px] text-emerald-400/80">-{calculatedMetrics.avgAccDrop}% drop</div>
          </div>

          <div className="p-3.5 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Perplexity (PPL)</span>
            <div className="text-xl font-extrabold text-amber-300">
              {calculatedMetrics.projectedPpl}
            </div>
            <div className="text-[10px] text-amber-400/80">+{calculatedMetrics.avgPplIncrease} PPL</div>
          </div>

          <div className="p-3.5 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">VRAM Footprint</span>
            <div className="text-xl font-extrabold text-purple-300">
              {calculatedMetrics.projectedVramGb} <span className="text-xs font-normal text-slate-400">GB</span>
            </div>
            <div className="text-[10px] text-purple-400 font-bold">-{calculatedMetrics.vramSavingsPct}% VRAM saved</div>
          </div>

          <div className="p-3.5 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Latency Speedup</span>
            <div className="text-xl font-extrabold text-cyan-400">
              {calculatedMetrics.overallSpeedup}x
            </div>
            <div className="text-[10px] text-cyan-300">{calculatedMetrics.projectedLatencyMs} ms / token</div>
          </div>

          <div className="p-3.5 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Clipping Safety</span>
            <div className="text-sm font-extrabold flex items-center gap-1 mt-1">
              {calculatedMetrics.criticalOutlierViolations > 0 ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{calculatedMetrics.criticalOutlierViolations} Outliers</span>
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Clean Calibration</span>
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500">
              {calculatedMetrics.criticalOutlierViolations > 0 ? 'High distortion alert' : 'Protected scale bins'}
            </div>
          </div>
        </div>

        {/* Warning banner if critical outliers exist */}
        {calculatedMetrics.criticalOutlierViolations > 0 && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-700/60 rounded-2xl flex items-center gap-3 text-xs text-rose-200 font-mono">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div>
              <strong>Quantization Distortion Alert:</strong> Sensitive layers (RMSNorm / LM Head) are quantized to INT4 without AWQ activation shielding. This may cause severe text hallucination or classification collapse. Consider upgrading them to FP16 or AWQ.
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid: Layer Configurator + Weight Outlier Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layer-by-Layer Configurator (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Layer-Wise Mixed Precision Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select specific quant methods per layer to protect sensitive attention heads while compressing high-volume MLP projections.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-xl border border-cyan-800/60">
                {layers.length} Target Modules
              </span>
            </div>

            {/* Layer Table */}
            <div className="space-y-3">
              {layers.map((layer) => {
                const isSelectedForHist = selectedLayerForHistogram === layer.id;
                return (
                  <div
                    key={layer.id}
                    className={`p-4 rounded-2xl border transition-all font-mono text-xs space-y-3 ${
                      isSelectedForHist
                        ? 'bg-[#131B2E] border-cyan-400 ring-1 ring-cyan-400'
                        : 'bg-[#07090E] border-[#1E293B] hover:border-[#27354F]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => setSelectedLayerForHistogram(layer.id)}
                          className="w-7 h-7 rounded-lg bg-[#0D1322] hover:bg-cyan-950 text-cyan-400 border border-[#1E293B] flex items-center justify-center flex-shrink-0 cursor-pointer"
                          title="Inspect weight histogram"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{layer.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {layer.family} • {(layer.paramCountM).toFixed(0)}M Parameters
                          </div>
                        </div>
                      </div>

                      {/* Sensitivity pill */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-slate-400">Sensitivity:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          layer.sensitivity >= 8
                            ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                            : layer.sensitivity >= 5
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                        }`}>
                          {layer.sensitivity.toFixed(1)} / 10 ({layer.outlierRisk} Risk)
                        </span>
                      </div>
                    </div>

                    {/* Method Selector Radio Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 pt-2 border-t border-[#1E293B]">
                      {[
                        { id: 'FP16', label: 'FP16' },
                        { id: 'FP8', label: 'FP8 (E4M3)' },
                        { id: 'INT8', label: 'INT8' },
                        { id: 'SmoothQuant', label: 'SmoothQuant' },
                        { id: 'AWQ_INT4', label: 'AWQ INT4' },
                        { id: 'INT4', label: 'Standard INT4' },
                      ].map((m) => {
                        const isChosen = layer.selectedMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => handleLayerMethodChange(layer.id, m.id as QuantMethod)}
                            className={`px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer truncate ${
                              isChosen
                                ? 'bg-cyan-500 text-[#07090E] shadow-md shadow-cyan-500/20'
                                : 'bg-[#0D1322] text-slate-400 hover:text-slate-200 hover:bg-[#1E293B] border border-[#1E293B]'
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tensor Weight Distribution & Activation Outlier Histogram (1 col) */}
        <div className="space-y-6">
          <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-6 sticky top-6">
            <div className="border-b border-[#1E293B] pb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                  Tensor Histogram Inspector
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {calibrationSamples} Calibration Samples
                </span>
              </div>
              <h4 className="text-base font-bold text-white font-mono truncate">
                {activeHistogramLayer.name}
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                Method: <strong className="text-cyan-300">{activeHistogramLayer.selectedMethod}</strong> • Sensitivity: <strong className="text-amber-400">{activeHistogramLayer.sensitivity}/10</strong>
              </p>
            </div>

            {/* Interactive Histogram Graph Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Weight & Activation Distribution</span>
                <span className="text-[10px] text-cyan-400">Quant Bins: 256 / 16</span>
              </div>

              {/* Dynamic SVG Histogram */}
              <div className="h-44 bg-[#07090E] border border-[#1E293B] rounded-2xl p-3 flex flex-col justify-end relative overflow-hidden">
                {/* Outlier Threshold Lines */}
                <div className="absolute top-2 left-4 text-[9px] font-mono text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/40">
                  -3σ Outlier Bound
                </div>
                <div className="absolute top-2 right-4 text-[9px] font-mono text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/40">
                  +3σ Outlier Bound
                </div>

                {/* Histogram Bars */}
                <div className="flex items-end justify-between h-28 gap-1 pt-4">
                  {[
                    { h: 10, isOutlier: true },
                    { h: 18, isOutlier: true },
                    { h: 32, isOutlier: false },
                    { h: 54, isOutlier: false },
                    { h: 78, isOutlier: false },
                    { h: 96, isOutlier: false },
                    { h: 100, isOutlier: false },
                    { h: 94, isOutlier: false },
                    { h: 75, isOutlier: false },
                    { h: 50, isOutlier: false },
                    { h: 30, isOutlier: false },
                    { h: 16, isOutlier: true },
                    { h: 8, isOutlier: true },
                  ].map((bar, idx) => (
                    <div
                      key={idx}
                      className={`w-full rounded-t transition-all ${
                        bar.isOutlier
                          ? activeHistogramLayer.selectedMethod.includes('INT4')
                            ? 'bg-rose-500/80 animate-pulse'
                            : 'bg-amber-500/60'
                          : activeHistogramLayer.selectedMethod === 'FP16'
                          ? 'bg-cyan-500'
                          : 'bg-emerald-400'
                      }`}
                      style={{ height: `${bar.h}%` }}
                      title={`Bin ${idx + 1}: ${bar.h}% population`}
                    />
                  ))}
                </div>

                {/* Bottom Axis */}
                <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-[#1E293B]">
                  <span>-4.2 (Min)</span>
                  <span>0.0 (Mean)</span>
                  <span>+4.2 (Max)</span>
                </div>
              </div>
            </div>

            {/* Quantization Calibration Settings */}
            <div className="p-4 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Calibration Dataset:</span>
                <span className="font-bold text-cyan-300">Pile-Val / WikiText-2</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Scale Granularity:</span>
                <span className="font-bold text-emerald-300">Per-Channel (Group Size 128)</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Clipping Algorithm:</span>
                <span className="font-bold text-amber-300">MSE Grid Search (AWQ α=0.8)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => onNavigate?.('app-analyze')}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-mono font-extrabold text-xs rounded-2xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Profile Hardware with this Precision Recipe</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
