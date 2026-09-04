import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Cpu, 
  Zap, 
  Activity, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Layers, 
  ArrowRight, 
  SlidersHorizontal,
  Sparkles,
  ShieldAlert,
  BarChart3,
  Thermometer,
  Eye,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { OptimizationJob, HardwareSpec, GraphOperatorNode } from '../types';
import { HARDWARE_CATALOG, SAMPLE_GRAPH_NODES, MODEL_CATALOG } from '../data/mockData';
import { ConceptTooltip } from './ConceptTooltip';

interface ThermalHeatmapVisualizerProps {
  job: OptimizationJob;
  selectedHardwareId?: string;
  onHardwareChange?: (hwId: string) => void;
}

export interface LayerThermalProfile {
  id: string;
  name: string;
  opType: string;
  family: 'Attention' | 'Linear/MLP' | 'Norm/Activation' | 'Convolution' | 'Memory/IO' | 'PostProcess';
  durationMs: number;
  durationUs: number;
  percentTotal: number;
  flopsGflops: number;
  arithmeticIntensity: number; // FLOPs/byte
  attainedTflops: number;
  attainedBandwidthGBs: number;
  computeSaturationPct: number; // vs hardware peak
  bandwidthSaturationPct: number; // vs hardware peak
  thermalIndex: number; // 0 - 100 composite heat score
  thermalTier: 'CRITICAL_HOT' | 'HIGH_WARM' | 'BALANCED_OPTIMAL' | 'COOL_UNDERUTILIZED';
  boundType: 'Memory Bandwidth Bound' | 'Compute Ceiling Bound' | 'Kernel Launch Overhead' | 'Optimal Balanced';
  bottleneckReason?: string;
  recommendedTactic: string;
  estimatedSpeedupPct: number;
}

export const ThermalHeatmapVisualizer: React.FC<ThermalHeatmapVisualizerProps> = ({
  job,
  selectedHardwareId: initialHardwareId,
  onHardwareChange,
}) => {
  // Available hardware from job results or default catalog
  const availableHardware = useMemo(() => {
    if (job.results && job.results.length > 0) {
      return job.results.map((r) => {
        const found = HARDWARE_CATALOG.find((h) => h.id === r.hardwareId);
        return found || {
          id: r.hardwareId,
          name: r.hardwareName,
          vendor: r.vendor,
          type: r.hardwareType,
          architecture: 'Optimized Accelerator',
          processNode: '4nm',
          memoryGb: 24,
          memoryType: 'GDDR6X / HBM',
          memoryBandwidthGBs: 1000,
          tdpWatts: r.powerConsumptionWatts || 250,
          fp32Tflops: 80,
          fp16Tflops: 160,
          int8Tops: 320,
          int4Tops: 640,
          supportedRuntimes: [r.runtimeEngine],
          formFactor: 'Workstation / PCIe' as const,
          description: r.notes || 'Target accelerator',
        };
      });
    }
    return HARDWARE_CATALOG.slice(0, 5);
  }, [job]);

  const [activeHwId, setActiveHwId] = useState<string>(
    initialHardwareId || job.results?.[0]?.hardwareId || availableHardware[0]?.id || 'nvidia-rtx-4090'
  );

  const [viewMode, setViewMode] = useState<'thermal_index' | 'latency_budget' | 'compute_saturation' | 'bandwidth_saturation'>('thermal_index');
  const [familyFilter, setFamilyFilter] = useState<string>('ALL');
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [minThermalThreshold, setMinThermalThreshold] = useState<number>(0);
  const [displayDensity, setDisplayDensity] = useState<'grid' | 'detailed'>('grid');

  const currentHw: HardwareSpec = useMemo(() => {
    return HARDWARE_CATALOG.find((h) => h.id === activeHwId) || availableHardware.find((h) => h.id === activeHwId) || HARDWARE_CATALOG[0];
  }, [activeHwId, availableHardware]);

  const currentModel = useMemo(() => {
    return MODEL_CATALOG.find((m) => m.id === job.modelId) || MODEL_CATALOG[0];
  }, [job.modelId]);

  // Compute thermal profiles for all layers relative to target hardware compute capacity
  const layerProfiles: LayerThermalProfile[] = useMemo(() => {
    const baseNodes: GraphOperatorNode[] = SAMPLE_GRAPH_NODES[job.modelId] || SAMPLE_GRAPH_NODES['llama-3-8b-instruct'] || [
      {
        id: 'node_emb',
        name: 'model.embed_tokens',
        opType: 'Embedding',
        inputShapes: ['[1, 2048]'],
        outputShape: '[1, 2048, 4096]',
        durationMs: 0.22,
        flopsGflops: 0.1,
        memoryBandwidthGBs: 1450,
        arithmeticIntensity: 0.1,
        quantizationSensitivityScore: 8.5,
        precisionSupport: ['FP16'],
        recommendedPrecision: 'FP16',
        isBottleneck: false,
      },
      {
        id: 'node_qkv',
        name: 'model.layers.0.self_attn.qkv_proj',
        opType: 'Linear_QKV',
        inputShapes: ['[1, 2048, 4096]'],
        outputShape: '[1, 2048, 6144]',
        durationMs: 1.15,
        flopsGflops: 51.5,
        memoryBandwidthGBs: 2100,
        arithmeticIntensity: 24.5,
        quantizationSensitivityScore: 5.0,
        precisionSupport: ['FP16', 'INT8', 'INT4'],
        recommendedPrecision: 'INT4',
        isBottleneck: false,
      },
      {
        id: 'node_flash_attn',
        name: 'model.layers.0.self_attn.flash_attn_v2',
        opType: 'FlashAttention_V2',
        inputShapes: ['[1, 32, 2048, 128]'],
        outputShape: '[1, 2048, 4096]',
        durationMs: 2.10,
        flopsGflops: 68.7,
        memoryBandwidthGBs: 2850,
        arithmeticIntensity: 48.0,
        quantizationSensitivityScore: 8.2,
        precisionSupport: ['FP16'],
        recommendedPrecision: 'FP16',
        isBottleneck: true,
        bottleneckCategory: 'Memory Bandwidth',
      },
      {
        id: 'node_swiglu',
        name: 'model.layers.0.mlp.gate_up_proj',
        opType: 'Fused_SwiGLU_Gemm',
        inputShapes: ['[1, 2048, 4096]'],
        outputShape: '[1, 2048, 14336]',
        durationMs: 3.40,
        flopsGflops: 142.0,
        memoryBandwidthGBs: 3100,
        arithmeticIntensity: 86.4,
        quantizationSensitivityScore: 3.2,
        precisionSupport: ['INT4', 'INT8', 'FP16'],
        recommendedPrecision: 'INT4',
        isBottleneck: true,
        bottleneckCategory: 'Compute Ceiling',
      },
      {
        id: 'node_down_proj',
        name: 'model.layers.0.mlp.down_proj',
        opType: 'Linear_DownProj',
        inputShapes: ['[1, 2048, 14336]'],
        outputShape: '[1, 2048, 4096]',
        durationMs: 1.85,
        flopsGflops: 71.0,
        memoryBandwidthGBs: 2400,
        arithmeticIntensity: 42.0,
        quantizationSensitivityScore: 4.1,
        precisionSupport: ['INT4', 'INT8'],
        recommendedPrecision: 'INT4',
        isBottleneck: false,
      },
      {
        id: 'node_norm',
        name: 'model.layers.0.input_layernorm',
        opType: 'RMSNorm',
        inputShapes: ['[1, 2048, 4096]'],
        outputShape: '[1, 2048, 4096]',
        durationMs: 0.15,
        flopsGflops: 0.05,
        memoryBandwidthGBs: 1800,
        arithmeticIntensity: 0.02,
        quantizationSensitivityScore: 9.2,
        precisionSupport: ['FP16'],
        recommendedPrecision: 'FP16',
        isBottleneck: false,
      },
      {
        id: 'node_lm_head',
        name: 'lm_head.sampled_top_k',
        opType: 'Linear_TopK',
        inputShapes: ['[1, 1, 4096]'],
        outputShape: '[1, 1]',
        durationMs: 0.45,
        flopsGflops: 2.1,
        memoryBandwidthGBs: 1600,
        arithmeticIntensity: 1.2,
        quantizationSensitivityScore: 8.9,
        precisionSupport: ['FP16'],
        recommendedPrecision: 'FP16',
        isBottleneck: false,
      }
    ];

    // Scaling factor based on target hardware's compute power vs baseline
    const hwComputeScale = Math.max(0.15, (currentHw.fp16Tflops || 100) / 330);
    const hwBandwidthScale = Math.max(0.2, (currentHw.memoryBandwidthGBs || 1000) / 1008);

    const totalRawDuration = baseNodes.reduce((sum, n) => {
      const scaledDur = n.durationMs / (n.arithmeticIntensity > 30 ? hwComputeScale : hwBandwidthScale);
      return sum + scaledDur;
    }, 0);

    return baseNodes.map((node) => {
      const isComputeHeavy = node.arithmeticIntensity > 35;
      const effectiveDurationMs = +(node.durationMs / (isComputeHeavy ? hwComputeScale : hwBandwidthScale)).toFixed(2);
      const effectiveDurationUs = Math.round(effectiveDurationMs * 1000);
      const percentTotal = +((effectiveDurationMs / totalRawDuration) * 100).toFixed(1);

      // Compute Attained TFLOPS & Bandwidth
      const attainedTflops = +(node.flopsGflops / Math.max(0.001, effectiveDurationMs)).toFixed(1);
      const maxPeakTflops = currentHw.fp16Tflops || 150;
      const computeSaturationPct = Math.min(100, Math.round((attainedTflops / maxPeakTflops) * 100));

      const peakBusGBs = currentHw.memoryBandwidthGBs || 1000;
      const attainedBandwidthGBs = Math.min(peakBusGBs * 0.98, Math.round(node.memoryBandwidthGBs * Math.min(1.2, hwBandwidthScale)));
      const bandwidthSaturationPct = Math.min(100, Math.round((attainedBandwidthGBs / peakBusGBs) * 100));

      // Composite Thermal Index (0 - 100)
      const thermalIndex = Math.min(
        100,
        Math.round(
          percentTotal * 1.5 + 
          (bandwidthSaturationPct > 80 ? bandwidthSaturationPct * 0.35 : 0) + 
          (computeSaturationPct > 80 ? computeSaturationPct * 0.35 : 0)
        )
      );

      // Determine Family
      let family: LayerThermalProfile['family'] = 'Linear/MLP';
      const opLower = (node.opType + ' ' + node.name).toLowerCase();
      if (opLower.includes('attn') || opLower.includes('attention') || opLower.includes('qkv') || opLower.includes('gqa')) {
        family = 'Attention';
      } else if (opLower.includes('norm') || opLower.includes('silu') || opLower.includes('gelu') || opLower.includes('relu')) {
        family = 'Norm/Activation';
      } else if (opLower.includes('conv') || opLower.includes('resblock') || opLower.includes('depthwise')) {
        family = 'Convolution';
      } else if (opLower.includes('embed') || opLower.includes('kv') || opLower.includes('transfer') || opLower.includes('dma')) {
        family = 'Memory/IO';
      } else if (opLower.includes('nms') || opLower.includes('topk') || opLower.includes('slice') || opLower.includes('post')) {
        family = 'PostProcess';
      }

      // Determine Thermal Tier & Bottleneck
      let thermalTier: LayerThermalProfile['thermalTier'] = 'COOL_UNDERUTILIZED';
      let boundType: LayerThermalProfile['boundType'] = 'Optimal Balanced';

      if (thermalIndex >= 75 || percentTotal >= 28) {
        thermalTier = 'CRITICAL_HOT';
        boundType = isComputeHeavy ? 'Compute Ceiling Bound' : 'Memory Bandwidth Bound';
      } else if (thermalIndex >= 50 || percentTotal >= 16) {
        thermalTier = 'HIGH_WARM';
        boundType = isComputeHeavy ? 'Compute Ceiling Bound' : 'Memory Bandwidth Bound';
      } else if (thermalIndex >= 25 || percentTotal >= 8) {
        thermalTier = 'BALANCED_OPTIMAL';
        boundType = 'Optimal Balanced';
      } else {
        thermalTier = 'COOL_UNDERUTILIZED';
        boundType = percentTotal < 4 ? 'Kernel Launch Overhead' : 'Optimal Balanced';
      }

      // Tactical Recommendation
      let recommendedTactic = 'Apply FP16 Tensor Core execution harness.';
      let estimatedSpeedupPct = 18.0;

      if (family === 'Attention') {
        recommendedTactic = 'Apply FlashAttention-2 with FlashDecoding chunked prefill to eliminate intermediate QK^T matrix writes.';
        estimatedSpeedupPct = 42.5;
      } else if (family === 'Linear/MLP' && boundType === 'Compute Ceiling Bound') {
        recommendedTactic = 'Apply INT4 AWQ / Marlin GEMM kernel with fused SiLU gate to double arithmetic throughput.';
        estimatedSpeedupPct = 58.0;
      } else if (family === 'Linear/MLP') {
        recommendedTactic = 'Quantize layer weights to INT8 with per-channel calibration scales.';
        estimatedSpeedupPct = 34.0;
      } else if (family === 'Norm/Activation') {
        recommendedTactic = 'Fuse RMSNorm into predecessor projection to retain weights inside L2 cache.';
        estimatedSpeedupPct = 25.0;
      } else if (family === 'Memory/IO') {
        recommendedTactic = 'Use CUDA pinned host memory buffers with asynchronous double-buffered DMA streams.';
        estimatedSpeedupPct = 30.0;
      } else if (family === 'PostProcess') {
        recommendedTactic = 'Replace host-side postprocess with GPU-native BatchedNMSDynamic plugin.';
        estimatedSpeedupPct = 65.0;
      }

      return {
        id: node.id,
        name: node.name,
        opType: node.opType,
        family,
        durationMs: effectiveDurationMs,
        durationUs: effectiveDurationUs,
        percentTotal,
        flopsGflops: node.flopsGflops,
        arithmeticIntensity: node.arithmeticIntensity,
        attainedTflops,
        attainedBandwidthGBs,
        computeSaturationPct,
        bandwidthSaturationPct,
        thermalIndex,
        thermalTier,
        boundType,
        bottleneckReason: node.isBottleneck ? `${boundType} is throttling execution pipeline on ${currentHw.name}.` : undefined,
        recommendedTactic,
        estimatedSpeedupPct,
      };
    });
  }, [job.modelId, currentHw]);

  // Set default selected layer if none selected
  const activeSelectedLayer = useMemo(() => {
    if (selectedLayerId) {
      return layerProfiles.find((l) => l.id === selectedLayerId) || layerProfiles[0];
    }
    // Default to the hottest layer
    return [...layerProfiles].sort((a, b) => b.thermalIndex - a.thermalIndex)[0] || layerProfiles[0];
  }, [selectedLayerId, layerProfiles]);

  // Filtered layers
  const filteredLayers = useMemo(() => {
    return layerProfiles.filter((layer) => {
      const matchesFamily = familyFilter === 'ALL' || layer.family === familyFilter;
      const matchesThreshold = layer.thermalIndex >= minThermalThreshold;
      return matchesFamily && matchesThreshold;
    });
  }, [layerProfiles, familyFilter, minThermalThreshold]);

  // Aggregate model thermal metrics
  const totalModelLatencyMs = useMemo(() => {
    return +layerProfiles.reduce((acc, l) => acc + l.durationMs, 0).toFixed(2);
  }, [layerProfiles]);

  const maxThermalLayer = useMemo(() => {
    return [...layerProfiles].sort((a, b) => b.thermalIndex - a.thermalIndex)[0];
  }, [layerProfiles]);

  const criticalLayerCount = layerProfiles.filter((l) => l.thermalTier === 'CRITICAL_HOT').length;
  const warmLayerCount = layerProfiles.filter((l) => l.thermalTier === 'HIGH_WARM').length;

  const handleHardwareSelect = (hwId: string) => {
    setActiveHwId(hwId);
    onHardwareChange?.(hwId);
  };

  // Helper for thermal color gradient
  const getThermalColor = (layer: LayerThermalProfile) => {
    if (viewMode === 'thermal_index') {
      if (layer.thermalIndex >= 75) return 'from-rose-600 via-orange-600 to-amber-500 text-rose-100 border-rose-500/80 shadow-rose-950/50';
      if (layer.thermalIndex >= 50) return 'from-amber-600 via-amber-700 to-amber-900 text-amber-100 border-amber-500/60 shadow-amber-950/50';
      if (layer.thermalIndex >= 25) return 'from-cyan-800 via-teal-900 to-emerald-950 text-cyan-200 border-cyan-500/40 shadow-cyan-950/50';
      return 'from-slate-900 via-[#0E1726] to-[#0A0E1A] text-slate-400 border-slate-800 shadow-slate-950/50';
    }
    if (viewMode === 'latency_budget') {
      if (layer.percentTotal >= 30) return 'from-rose-600 via-rose-800 to-rose-950 text-rose-100 border-rose-500/80 shadow-rose-950/50';
      if (layer.percentTotal >= 15) return 'from-amber-600 via-amber-800 to-amber-950 text-amber-100 border-amber-500/60 shadow-amber-950/50';
      if (layer.percentTotal >= 7) return 'from-cyan-700 via-cyan-900 to-[#0A1322] text-cyan-200 border-cyan-500/40 shadow-cyan-950/50';
      return 'from-slate-900 via-[#0D1424] to-[#07090E] text-slate-400 border-slate-800 shadow-slate-950/50';
    }
    if (viewMode === 'bandwidth_saturation') {
      if (layer.bandwidthSaturationPct >= 85) return 'from-fuchsia-600 via-purple-800 to-purple-950 text-fuchsia-100 border-fuchsia-500/80 shadow-purple-950/50';
      if (layer.bandwidthSaturationPct >= 60) return 'from-indigo-600 via-indigo-800 to-indigo-950 text-indigo-100 border-indigo-500/60 shadow-indigo-950/50';
      return 'from-slate-900 via-[#0E1726] to-[#0A0E1A] text-slate-400 border-slate-800 shadow-slate-950/50';
    }
    // Compute Saturation
    if (layer.computeSaturationPct >= 75) return 'from-emerald-500 via-teal-700 to-emerald-950 text-emerald-100 border-emerald-500/80 shadow-emerald-950/50';
    if (layer.computeSaturationPct >= 40) return 'from-cyan-600 via-cyan-800 to-cyan-950 text-cyan-100 border-cyan-500/60 shadow-cyan-950/50';
    return 'from-slate-900 via-[#0E1726] to-[#0A0E1A] text-slate-400 border-slate-800 shadow-slate-950/50';
  };

  const getThermalBadge = (tier: LayerThermalProfile['thermalTier']) => {
    switch (tier) {
      case 'CRITICAL_HOT':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>Thermal Hotspot</span>
          </span>
        );
      case 'HIGH_WARM':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>High Load</span>
          </span>
        );
      case 'BALANCED_OPTIMAL':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Optimal</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <span>Low Load</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Hardware Target Calibration Bar */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                <span>Roofline Thermal Telemetry</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                Model: <strong className="text-white">{job.modelName}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-mono flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <span>Layer Thermal Heatmap & Compute Bottlenecks</span>
            </h2>
            <p className="text-xs text-slate-400">
              Evaluates execution latency for each neural network layer mapped against the compute ceilings and memory bus limits of the target hardware.
            </p>
          </div>

          {/* Hardware Target Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-[#07090E] border border-[#1E293B] rounded-2xl p-1.5">
              <Cpu className="w-4 h-4 text-cyan-400 ml-2" />
              <span className="text-xs font-mono text-slate-400">Target HW:</span>
              <select
                value={activeHwId}
                onChange={(e) => handleHardwareSelect(e.target.value)}
                className="bg-[#131B2E] border border-[#27354F] text-cyan-300 font-mono text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {availableHardware.map((hw) => (
                  <option key={hw.id} value={hw.id}>
                    {hw.name} ({hw.vendor} • {hw.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Target Hardware Capacity Diagnostic Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-1">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <span>Peak Compute FP16</span>
              <Activity className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-base font-extrabold text-cyan-300">
              {currentHw.fp16Tflops} <span className="text-[10px] font-normal text-slate-400">TFLOPS</span>
            </div>
            <div className="text-[10px] text-slate-500">INT8: {currentHw.int8Tops} TOPS</div>
          </div>

          <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-1">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <span>Memory Bus Bandwidth</span>
              <BarChart3 className="w-3 h-3 text-purple-400" />
            </div>
            <div className="text-base font-extrabold text-purple-300">
              {currentHw.memoryBandwidthGBs} <span className="text-[10px] font-normal text-slate-400">GB/s</span>
            </div>
            <div className="text-[10px] text-slate-500">{currentHw.memoryType} ({currentHw.memoryGb} GB)</div>
          </div>

          <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-1">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <span>Thermal TDP Envelope</span>
              <Flame className="w-3 h-3 text-rose-400" />
            </div>
            <div className="text-base font-extrabold text-rose-400">
              {currentHw.tdpWatts} <span className="text-[10px] font-normal text-slate-400">Watts</span>
            </div>
            <div className="text-[10px] text-slate-500">{currentHw.processNode}</div>
          </div>

          <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-1">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <span>Ridge Point FLOP/B</span>
              <Gauge className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-base font-extrabold text-emerald-300">
              {+((currentHw.fp16Tflops * 1000) / Math.max(1, currentHw.memoryBandwidthGBs)).toFixed(1)}
              <span className="text-[10px] font-normal text-slate-400"> FLOP/B</span>
            </div>
            <div className="text-[10px] text-slate-500">Memory to Compute boundary</div>
          </div>
        </div>

        {/* Global Model Thermal Thermometer & Saturation Summary */}
        <div className="p-4 bg-gradient-to-r from-[#07090E] via-[#0E1528] to-[#07090E] border border-cyan-900/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0">
              <Thermometer className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">
                  Model Latency: <span className="text-cyan-400">{totalModelLatencyMs} ms</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700/60 text-rose-300 text-[10px] font-bold">
                  {criticalLayerCount} Hotspots
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Top bottleneck is <strong className="text-amber-300">{maxThermalLayer?.name}</strong> consuming{' '}
                <strong className="text-rose-400">{maxThermalLayer?.percentTotal}%</strong> of execution cycle.
              </p>
            </div>
          </div>

          {/* Quick Thermal Color Legend */}
          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            <span className="text-slate-400">Heatmap Scale:</span>
            <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold">Critical (≥75%)</span>
            <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold">Warm (50-74%)</span>
            <span className="px-2 py-0.5 rounded bg-cyan-800 text-cyan-200 font-bold">Optimal (25-49%)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">Cool (&lt;25%)</span>
          </div>
        </div>

        {/* View Mode Tabs & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-[#1E293B]">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'thermal_index', label: 'Composite Thermal Index', icon: Flame },
              { id: 'latency_budget', label: 'Latency Budget Share (%)', icon: Activity },
              { id: 'bandwidth_saturation', label: 'Memory Bus Saturation', icon: BarChart3 },
              { id: 'compute_saturation', label: 'Compute Core Saturation', icon: Zap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500 text-[#07090E] shadow-md shadow-cyan-500/20'
                      : 'bg-[#131B2E] text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Family Filters & Density */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-[#07090E] border border-[#1E293B] rounded-xl p-1 text-[11px] font-mono">
              <span className="text-slate-400 px-1.5">Family:</span>
              {['ALL', 'Attention', 'Linear/MLP', 'Norm/Activation', 'Memory/IO'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFamilyFilter(f)}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    familyFilter === f ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Layout density */}
            <div className="flex items-center bg-[#07090E] border border-[#1E293B] rounded-xl p-1">
              <button
                onClick={() => setDisplayDensity('grid')}
                className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  displayDensity === 'grid' ? 'bg-[#1E293B] text-cyan-300 font-bold' : 'text-slate-400'
                }`}
                title="Compact Grid"
              >
                Grid
              </button>
              <button
                onClick={() => setDisplayDensity('detailed')}
                className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  displayDensity === 'detailed' ? 'bg-[#1E293B] text-cyan-300 font-bold' : 'text-slate-400'
                }`}
                title="Detailed Cards"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visual Grid + Layer Deep Diagnostic Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Matrix Grid (2 Columns on Desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Layer Thermal Heatmap Matrix ({filteredLayers.length} Layers)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any layer block to inspect its roofline memory bandwidth saturation and kernel optimization tactics.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800/60">
                Sorted by Execution Sequence
              </span>
            </div>

            {/* Heatmap Layout */}
            {displayDensity === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 select-none">
                {filteredLayers.map((layer, idx) => {
                  const isSelected = activeSelectedLayer?.id === layer.id;
                  const colorGradient = getThermalColor(layer);

                  return (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayerId(layer.id)}
                      className={`relative p-4 rounded-2xl border bg-gradient-to-br transition-all duration-200 cursor-pointer shadow-lg hover:scale-[1.02] ${colorGradient} ${
                        isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#07090E] scale-[1.02]' : ''
                      }`}
                    >
                      {/* Top Row: Layer Index & Tier Badge */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-300 font-bold">
                          #{idx + 1} {layer.family}
                        </span>
                        {getThermalBadge(layer.thermalTier)}
                      </div>

                      {/* Layer Name & Operator */}
                      <div className="font-mono font-bold text-white text-xs truncate" title={layer.name}>
                        {layer.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-300/80 truncate mb-3">
                        {layer.opType}
                      </div>

                      {/* Main Metric Highlight */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 font-mono text-xs">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-slate-300/70 block">Latency</span>
                          <span className="font-extrabold text-white text-sm">
                            {layer.durationMs} <span className="text-[10px] font-normal">ms</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider text-slate-300/70 block">Share of Total</span>
                          <span className="font-extrabold text-cyan-200 text-sm">
                            {layer.percentTotal}%
                          </span>
                        </div>
                      </div>

                      {/* Thermal Bar Visual */}
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-300/80">
                          <span>Thermal Load</span>
                          <span className="font-bold">{layer.thermalIndex}/100</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              layer.thermalIndex >= 75
                                ? 'bg-rose-400'
                                : layer.thermalIndex >= 50
                                ? 'bg-amber-400'
                                : 'bg-cyan-400'
                            }`}
                            style={{ width: `${Math.max(8, layer.thermalIndex)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Detailed List View */
              <div className="space-y-2 select-none">
                {filteredLayers.map((layer, idx) => {
                  const isSelected = activeSelectedLayer?.id === layer.id;
                  return (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayerId(layer.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs ${
                        isSelected
                          ? 'bg-[#131B2E] border-cyan-400 ring-1 ring-cyan-400'
                          : 'bg-[#07090E] border-[#1E293B] hover:border-[#27354F]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#0D1322] border border-[#1E293B] flex items-center justify-center font-bold text-slate-400 flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-white truncate">{layer.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#131B2E] text-slate-400">
                              {layer.family}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{layer.opType}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0 text-right">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Duration</div>
                          <div className="font-bold text-cyan-400">{layer.durationMs} ms ({layer.percentTotal}%)</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Bandwidth</div>
                          <div className="font-bold text-purple-300">{layer.attainedBandwidthGBs} GB/s</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Thermal Index</div>
                          <div className="font-bold text-rose-400">{layer.thermalIndex}/100</div>
                        </div>
                        {getThermalBadge(layer.thermalTier)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Layer Deep Diagnostic & Roofline Inspector (1 Column on Desktop) */}
        <div className="space-y-6">
          {activeSelectedLayer && (
            <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-6 sticky top-6">
              {/* Header */}
              <div className="border-b border-[#1E293B] pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                    {activeSelectedLayer.family} Inspector
                  </span>
                  {getThermalBadge(activeSelectedLayer.thermalTier)}
                </div>
                <h4 className="text-lg font-bold text-white font-mono break-all">
                  {activeSelectedLayer.name}
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Operator: <strong className="text-slate-200">{activeSelectedLayer.opType}</strong>
                </p>
              </div>

              {/* Hardware Capacity & Saturation Meters */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-xs">Execution Bottleneck Classification:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    activeSelectedLayer.boundType === 'Memory Bandwidth Bound'
                      ? 'bg-purple-950 text-purple-300 border border-purple-700/60'
                      : activeSelectedLayer.boundType === 'Compute Ceiling Bound'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                  }`}>
                    {activeSelectedLayer.boundType}
                  </span>
                </div>

                {/* Compute Saturation Progress */}
                <div className="p-3.5 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Compute Core Load:</span>
                    <span className="font-bold text-cyan-300">
                      {activeSelectedLayer.attainedTflops} / {currentHw.fp16Tflops} TFLOPS ({activeSelectedLayer.computeSaturationPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#131B2E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                      style={{ width: `${Math.max(5, activeSelectedLayer.computeSaturationPct)}%` }}
                    />
                  </div>
                </div>

                {/* Memory Bandwidth Progress */}
                <div className="p-3.5 bg-[#07090E] border border-[#1E293B] rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">DRAM / HBM Bus Saturation:</span>
                    <span className="font-bold text-purple-300">
                      {activeSelectedLayer.attainedBandwidthGBs} / {currentHw.memoryBandwidthGBs} GB/s ({activeSelectedLayer.bandwidthSaturationPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#131B2E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full"
                      style={{ width: `${Math.max(5, activeSelectedLayer.bandwidthSaturationPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Layer Telemetry Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Latency (Budget)</span>
                  <div className="text-cyan-400 font-bold text-sm">
                    {activeSelectedLayer.durationMs} ms
                  </div>
                  <div className="text-[10px] text-slate-400">{activeSelectedLayer.percentTotal}% total</div>
                </div>

                <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Arithmetic Intensity</span>
                  <div className="text-amber-400 font-bold text-sm">
                    {activeSelectedLayer.arithmeticIntensity}
                  </div>
                  <div className="text-[10px] text-slate-400">FLOPs / Byte</div>
                </div>

                <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Compute Volume</span>
                  <div className="text-emerald-400 font-bold text-sm">
                    {activeSelectedLayer.flopsGflops}
                  </div>
                  <div className="text-[10px] text-slate-400">GFLOPs / pass</div>
                </div>

                <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Thermal Load</span>
                  <div className="text-rose-400 font-bold text-sm">
                    {activeSelectedLayer.thermalIndex} / 100
                  </div>
                  <div className="text-[10px] text-slate-400">Heat score</div>
                </div>
              </div>

              {/* Thermal Bottleneck Mitigation Tactic Card */}
              <div className="p-4 bg-gradient-to-br from-cyan-950/50 to-indigo-950/40 border border-cyan-800/60 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-mono font-bold text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Automated Thermal Mitigation Strategy</span>
                </div>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  {activeSelectedLayer.recommendedTactic}
                </p>
                <div className="pt-2 border-t border-cyan-900/40 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Projected Speedup:</span>
                  <span className="text-emerald-400 font-bold">+{activeSelectedLayer.estimatedSpeedupPct}% Faster</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
