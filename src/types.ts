export type HardwareType = 'GPU' | 'CPU' | 'NPU' | 'ACCELERATOR' | 'EDGE_SOC';
export type HardwareVendor = 'NVIDIA' | 'Intel' | 'AMD' | 'Qualcomm' | 'Apple' | 'ARM' | 'Google';
export type RuntimeEngine = 'TensorRT' | 'ONNX Runtime' | 'OpenVINO' | 'QNN' | 'CoreML' | 'ROCm' | 'vLLM' | 'TensorRT-LLM' | 'TGI' | 'SGLang' | 'TFLite' | 'TorchScript';
export type PrecisionType = 'FP32' | 'FP16' | 'BF16' | 'FP8' | 'INT8' | 'INT4' | 'AWQ' | 'SmoothQuant';
export type OptimizationObjective = 'lowest_latency' | 'highest_throughput' | 'lowest_power' | 'lowest_cost' | 'balanced';
export type ModelCategory = 'Vision' | 'NLP / LLM' | 'Speech & Audio' | 'Multimodal' | 'Generative / Diffusion';
export type ModelFramework = 'ONNX' | 'PyTorch' | 'Safetensors' | 'TensorFlow' | 'TFLite' | 'GGUF';

// Strict Evidence and Result Trust Classification System
export type EvidenceLevel = 
  | 'SIMULATED'   // Generated using CorePick analytical performance model
  | 'ESTIMATED'   // Prediction based on public hardware specs & performance model
  | 'CALIBRATED'  // Prediction adjusted using published benchmarks or CorePick measurements
  | 'MEASURED'    // Actual workload executed on physical hardware through CorePick Agent
  | 'PUBLISHED'   // Benchmark result obtained from recognized public benchmark/MLPerf
  | 'ASSUMPTION'; // User-defined or model-defined assumption

export type MeasurementProvenance = 
  | EvidenceLevel 
  | 'CALIBRATED_ESTIMATE' 
  | 'ILLUSTRATIVE'
  | 'COMMUNITY_REPORTED' 
  | 'VENDOR_REPORTED';

export type ConfidenceRating = 'High' | 'Medium' | 'Low';

export interface ResultConfidence {
  status: EvidenceLevel | MeasurementProvenance;
  confidence?: ConfidenceRating;
  sourceDescription?: string;
  sourceRef?: string;
  dateUpdated?: string;
  runId?: string;
  marginOfErrorPct?: number;
}

export interface HardwareProfile {
  id: string;
  vendor: HardwareVendor;
  model: string;
  name: string;
  type: HardwareType;
  architecture: string;
  processNode?: string;

  // Compute Peaks (TFLOPs / TOPS)
  peakFP32: number;
  peakFP16: number;
  peakBF16?: number;
  peakFP8?: number;
  peakINT8: number;
  peakINT4?: number;

  // Compatibility aliases
  fp32Tflops?: number;
  fp16Tflops?: number;
  bf16Tflops?: number;
  fp8Tflops?: number;
  int8Tops?: number;
  int4Tops?: number;
  supportedRuntimes?: RuntimeEngine[];

  // Memory Subsystem
  memoryGB: number;
  memoryGb?: number; // compatibility alias
  memoryBandwidthGBs: number;
  memoryType?: string;
  l2Cache?: string;
  sharedMemory?: string;

  // Accelerators & Interconnect
  tensorCoreSupport: boolean;
  matrixEngineSupport: boolean;
  interconnectBandwidth?: number; // GB/s (e.g. 900 GB/s for NVLink 4.0)
  pcieBandwidth?: number;         // GB/s (e.g. 128 GB/s for PCIe Gen5)

  // Power & Efficiency
  tdpWatts: number;
  powerEfficiency?: string;

  // Precision & Engine Support
  supportedPrecisions: PrecisionType[];
  architectureEfficiency?: number; // 0.0 - 1.0 (e.g. 0.72)
  memoryEfficiency?: number;       // 0.0 - 1.0 (e.g. 0.80)
  tensorEfficiency?: number;       // 0.0 - 1.0 (e.g. 0.85)

  runtimeSupport?: RuntimeEngine[];
  formFactor: 'Data Center' | 'Workstation / PCIe' | 'Edge / Embedded' | 'Mobile SoC' | 'Cloud TPU';
  hourlyCloudCostUsd?: number;
  description: string;

  // Data Provenance
  dataSource: string;
  sourceDate: string;
  confidence: ConfidenceRating;
  sourceUrl?: string;
}

export type HardwareSpec = HardwareProfile;

export interface ModelWorkload {
  id: string;
  name: string;
  slug?: string;
  category: ModelCategory;
  framework: ModelFramework;
  parameterCountM: number;
  parameterCountBillions?: number;
  parameterCountFormatted?: string;
  layers?: number;
  layersCount?: number;
  hiddenDim?: number;
  attentionHeads?: number;
  kvHeads?: number;
  contextLengthOrResolution?: string;
  totalFlopsGflops?: number;
  inputShape?: string;
  outputShape?: string;
  description?: string;
  recommendedHardware?: string[];
  tags?: string[];
}

export type BottleneckCategory = 
  | 'Memory Bandwidth'
  | 'Compute Bound'
  | 'VRAM Capacity'
  | 'Interconnect Bandwidth'
  | 'Kernel Launch Overhead'
  | 'Host-Device Transfer';

export interface SimulationParameters {
  modelId: string;
  hardwareId: string;
  precision: PrecisionType;
  batchSize: number;
  contextLength: number;
  outputTokens: number;
  concurrency: number;
  runtime: RuntimeEngine;
}

export interface SimulationResult {
  isOom: boolean;
  vramRequiredGb: number;
  vramAvailableGb: number;
  vramBreakdown: {
    weightsGb: number;
    kvCacheGb: number;
    activationsGb: number;
    overheadGb: number;
  };
  prefill: {
    flopsGflops: number;
    memoryTrafficGb: number;
    arithmeticIntensity: number;
    ttftMs: number;
    isComputeBound: boolean;
  };
  decode: {
    flopsGflopsPerToken: number;
    memoryTrafficGbPerToken: number;
    arithmeticIntensity: number;
    itlMs: number;
    isComputeBound: boolean;
  };
  performance: {
    tokensPerSecPerRequest: number;
    aggregateTokensPerSec: number;
    ttftMs: number;
    itlMs: number;
    e2eLatencyMs: number;
  };
  roofline: {
    computeCeilingTflops: number;
    memoryBandwidthGBs: number;
    operationalIntensity: number;
    achievableTflops: number;
    computeBoundThresholdIntensity: number;
  };
  efficiency: {
    computeUtilizationPct: number;
    memoryBandwidthUtilizationPct: number;
    energyPerTokenJoules: number;
    costPerMillionTokensUsd: number;
  };
  accuracy: {
    retentionPct: number;
    confidence: ConfidenceRating;
  };
  bottleneck: BottleneckCategory;
  recommendations: string[];
  evidenceLevel: EvidenceLevel;
  confidence: ConfidenceRating;
  provenanceTrace: string[];
}

export interface ModelArchitecture {
  id: string;
  name: string;
  slug: string;
  category: ModelCategory;
  framework: ModelFramework;
  version: string;
  parameterCountM: number; // In millions
  parameterCountBillions?: number; // In billions
  parameterCountFormatted: string; // e.g. "8.03 B" or "43.7 M"
  modelSizeBytesMb: number;
  contextLengthOrResolution: string; // e.g. "8192 tokens" or "640x640"
  totalFlopsGflops: number;
  inputShape: string;
  outputShape: string;
  layersCount: number;
  parametersB?: number;
  layers?: number;
  hiddenDim?: number;
  attentionHeads?: number;
  kvHeads?: number;
  topOperators: { name: string; count: number; percentageTime: number }[];
  fusionOpportunities: {
    pattern: string;
    description: string;
    speedupPct: number;
    memorySavingsMb: number;
  }[];
  description: string;
  recommendedHardware: string[];
  tags: string[];
}

export interface FlamegraphNode {
  id: string;
  name: string;
  operatorType: string;
  durationUs: number;
  durationMs: number;
  percentTotal: number;
  memoryBandwidthGBs: number;
  arithmeticIntensityFlopsPerByte: number;
  isBottleneck: boolean;
  bottleneckReason?: string;
  suggestedOptimization?: string;
  children?: FlamegraphNode[];
}

export interface GraphOperatorNode {
  id: string;
  name: string;
  opType: string;
  inputShapes: string[];
  outputShape: string;
  durationMs: number;
  flopsGflops: number;
  memoryBandwidthGBs: number;
  arithmeticIntensity: number; // FLOPs/byte
  quantizationSensitivityScore: number; // 0 (resilient) to 10 (highly sensitive)
  precisionSupport: PrecisionType[];
  recommendedPrecision: PrecisionType;
  isBottleneck: boolean;
  bottleneckCategory?: 'Memory Bandwidth' | 'Compute Ceiling' | 'Host-Device Transfer' | 'Kernel Launch Overhead';
  fusedWith?: string[];
  attributes?: Record<string, string | number | boolean>;
}

export interface RooflineKernelData {
  name: string;
  opType: string;
  arithmeticIntensity: number; // FLOPs / Byte (X axis)
  performanceTflops: number; // Attainable TFLOPs/s (Y axis)
  timePct: number;
  isMemoryBound: boolean;
}

export interface QuantizationSensitivityLayer {
  layerName: string;
  opType: string;
  fp32PerpOrMap: number;
  fp16PerpOrMap: number;
  int8PerpOrMap: number;
  int4PerpOrMap: number;
  snrLossDb: number; // Signal to noise degradation
  weightSizeMbFp16: number;
  weightSizeMbInt8: number;
  weightSizeMbInt4: number;
  recommendedPrecision: PrecisionType;
  rationale: string;
}

export interface HardwareComparisonMetric {
  hardwareId: string;
  hardwareName: string;
  vendor: HardwareVendor;
  latencyMs: number;
  throughputFps: number;
  tokensPerSec?: number;
  powerWatts: number;
  efficiencyFpsPerWatt: number;
  memoryUsedMb: number;
  monthlyCostUsd: number;
  tcoPerMillionInferences: number;
  ttftMs: number; // Time to first token
  itlMs: number; // Inter-token latency
  fitScore: number; // 0 - 100
}

export interface HardwareConstraintFilter {
  maxMonthlyBudgetUsd: number;
  minThroughput: number;
  maxLatencyMs: number;
  maxPowerWatts: number;
  formFactor: string;
  workloadType: 'Vision / Batch' | 'LLM / Token Streaming' | 'Audio / Realtime' | 'Edge Embedded';
}

export interface CompilerOptimizationFlags {
  trtOptimizationLevel: number; // 0 - 5
  trtWorkspaceSizeGb: number;
  enableFp8TransformerEngine: boolean;
  enableFlashAttention2: boolean;
  enableKernelAutoTuning: boolean;
  enableCudnnHeuristics: boolean;
  enableIoBinding: boolean;
  cpuNumaNodeBinding: boolean;
  cpuAvx512Vnni: boolean;
  qnnHtpBurstMode: boolean;
  onnxGraphOptLevel: 'Disable' | 'Basic' | 'Extended' | 'All';
}

export interface OperatorDiagnosticWarning {
  id: string;
  opName: string;
  opType: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  targetHardware: string;
  issue: string;
  suggestedFix: string;
  autoFixAvailable: boolean;
}

export interface BatchSweepPoint {
  batchSize: number;
  throughputFps: number;
  latencyMs: number;
  p99LatencyMs: number;
  gpuMemoryMb: number;
  powerWatts: number;
  gpuUtilizationPct: number;
  efficiencyFpsPerWatt: number;
}

export interface BenchmarkResult {
  hardwareId: string;
  hardwareName: string;
  vendor: HardwareVendor;
  hardwareType: HardwareType;
  runtimeEngine: RuntimeEngine;
  precision: PrecisionType;
  batchSize: number;
  latencyMs: number;
  p99LatencyMs: number;
  throughputFps: number;
  tokensPerSec?: number;
  ttftMs?: number;
  powerConsumptionWatts: number;
  memoryUsedMb: number;
  costPerMillionInferencesUsd: number;
  efficiencyScore: number; // 0-100 normalized score
  isParetoOptimal: boolean;
  notes?: string;
  
  // Provenance & Metadata
  provenance?: MeasurementProvenance;
  runId?: string;
  timestamp?: string;
  driverVersion?: string;
  cudaVersion?: string;
  runsCount?: number;
  warmupRuns?: number;
  measurementMethodology?: string;
}

export interface BenchmarkMetadata {
  modelId: string;
  modelVersion: string;
  hardwareId: string;
  hardwareName: string;
  hardwareMemoryGb: number;
  os: string;
  driver: string;
  runtimeVersion: string;
  servingRuntime: string;
  precision: PrecisionType;
  quantizationMethod?: string;
  batchSize: number;
  contextLength: number;
  promptTokens: number;
  outputTokens: number;
  timestamp: string;
  numberRuns: number;
  warmupRuns: number;
  measurementMethodology: string;
  runId: string;
}

export interface PredictionCalibrationRecord {
  id: string;
  modelName: string;
  hardwareName: string;
  runtime: string;
  precision: string;
  batchSize: number;
  
  // Estimated metrics
  estimatedTtftMs: number;
  estimatedItlMs: number;
  estimatedTps: number;
  estimatedVramGb: number;
  
  // Measured metrics
  measuredTtftMs: number;
  measuredItlMs: number;
  measuredTps: number;
  measuredVramGb: number;
  
  // Error calculations
  ttftErrorPct: number; // ((measured - estimated) / measured) * 100
  tpsErrorPct: number;
  vramErrorPct: number;
  
  confidenceRange: string;
  timestamp: string;
  testEnvironment: string;
}

export interface HardwareFitConfig {
  modelId: string;
  hardwareId: string;
  precision: PrecisionType;
  batchSize: number;
  contextLength: number;
  targetMinThroughputTps: number;
  targetMaxTtftMs: number;
  targetMaxVramGb: number;
  targetMaxCostPerMillionUsd: number;
}

export interface HardwareFitEvaluation {
  hardwareId: string;
  hardwareName: string;
  vendor: HardwareVendor;
  precision: PrecisionType;
  runtime: string;
  
  estimatedTps: number;
  estimatedTtftMs: number;
  estimatedVramGb: number;
  estimatedCostPerMillionUsd: number;
  
  meetsThroughput: boolean;
  meetsTtft: boolean;
  meetsVram: boolean;
  meetsCost: boolean;
  
  overallStatus: 'POTENTIALLY_MEETS_TARGET' | 'EXCEEDS_VRAM_LIMIT' | 'BELOW_THROUGHPUT_SLA' | 'EXCEEDS_COST_BUDGET';
  statusSummary: string;
  provenance: MeasurementProvenance;
  recommendationExplanation: string;
  keyTradeoff: string;
}

export interface SensitivityFactor {
  parameter: string;
  impactLevel: 'High impact' | 'Medium impact' | 'Low impact';
  description: string;
  sensitivityScore: number; // 0-100
  recommendation: string;
}

export interface OptimizationOpportunity {
  id: string;
  impact: 'HIGH IMPACT' | 'MEDIUM IMPACT' | 'LOW IMPACT';
  title: string;
  description: string;
  potentialGain: string;
  rationale: string;
  caveat: string;
  actionCta?: string;
  actionTargetView?: string;
}

export interface OptimizationJob {
  id: string;
  modelId: string;
  modelName: string;
  modelCategory: ModelCategory;
  createdAt: string;
  status: 'completed' | 'benchmarking' | 'analyzing' | 'queued' | 'failed';
  objective: OptimizationObjective;
  targetPrecisions: PrecisionType[];
  targetHardwareIds: string[];
  selectedBaselineHardwareId: string;
  results: BenchmarkResult[];
  flamegraph: FlamegraphNode[];
  batchSweepData: Record<string, BatchSweepPoint[]>; // hardwareId -> sweep data
  aiInsights?: {
    summary: string;
    topBottleneck: string;
    recommendedDevice: string;
    estimatedCostSavingsPct: number;
    recommendedRuntime: string;
    tuningFlags: string[];
  };
}

export interface CloudInstanceComparison {
  provider: 'AWS' | 'GCP' | 'Azure' | 'On-Premises';
  instanceType: string;
  hardware: string;
  hourlyPriceUsd: number;
  monthlyCostAtFullLoadUsd: number;
  costPerMillionInferencesUsd: number;
  maxThroughputFps: number;
  tcoBreakEvenMonths?: number;
}

export interface DeploymentCodeSnippet {
  language: 'python' | 'cpp' | 'docker' | 'kubernetes' | 'cli';
  runtime: RuntimeEngine;
  title: string;
  filename: string;
  code: string;
  description: string;
}

export interface WorkloadDefinition {
  type: 'LLM inference' | 'vision inference' | 'multimodal inference' | 'embedding' | 'classification' | 'custom';
  inputTokens: number;
  outputTokens: number;
  contextLength: number;
  requestsPerSec: number;
  concurrentRequests: number;
  batchSize: number;
  targetLatencyMs?: number;
  targetThroughputTps?: number;
  trafficPattern: 'Steady' | 'Spiky' | 'Burst' | 'Diurnal';
  presetName?: string;
}

export interface SloDefinition {
  ttftTargetMs: number;
  itlTargetMs: number;
  e2eLatencyTargetMs: number;
  throughputTargetTps: number;
  availabilityTargetPct: number;
  maxBudgetMonthlyUsd: number;
}

export interface ScoringWeights {
  performance: number; // 0 - 100
  cost: number;        // 0 - 100
  latency: number;     // 0 - 100
  memory: number;      // 0 - 100
  energy: number;      // 0 - 100
}

export type OptimizerObjective = 
  | 'balanced' 
  | 'min_latency' 
  | 'max_throughput' 
  | 'min_cost' 
  | 'cost_performance' 
  | 'energy_efficient';

export interface CandidateConfiguration {
  id: string;
  hardware: HardwareProfile;
  precision: 'FP32' | 'FP16' | 'BF16' | 'FP8' | 'INT8' | 'INT4';
  runtime: 'vLLM' | 'TensorRT-LLM' | 'TGI' | 'SGLang' | 'ONNX Runtime' | 'CoreML' | 'QNN';
  tensorParallelSize: number;
  batchSize: number;
  simulation: SimulationResult;
  scores: {
    overall: number; // 0 - 100
    performance: number;
    cost: number;
    latency: number;
    memory: number;
    energy: number;
  };
  meetsSlo: boolean;
  isPareto: boolean;
  confidence: 'High' | 'Medium' | 'Low';
  confidenceReason: string;
  tradeoffs: string[];
  assumptions: string[];
}

export interface OptimizationResultPackage {
  recommended: CandidateConfiguration;
  rankedCandidates: CandidateConfiguration[];
  paretoFrontier: CandidateConfiguration[];
  winnerJustification: string;
  bottleneck: string;
  weightsUsed: ScoringWeights;
  objective: OptimizerObjective;
  alternatives: {
    fastest?: CandidateConfiguration;
    cheapest?: CandidateConfiguration;
    mostEfficient?: CandidateConfiguration;
  };
}

export interface BenchmarkDatabaseRecord {
  id: string;
  modelName: string;
  modelId: string;
  architecture: string;
  hardwareName: string;
  hardwareId: string;
  hardwareVendor: HardwareVendor;
  runtime: string;
  runtimeVersion: string;
  precision: string;
  quantization?: string;
  batchSize: number;
  inputTokens: number;
  outputTokens: number;
  concurrency: number;
  throughputTps: number;
  ttftMs: number;
  itlMs: number;
  memoryUsageGb: number;
  date: string;
  source: string;
  provenance: 'MEASURED' | 'ESTIMATED' | 'COMMUNITY_REPORTED' | 'VENDOR_REPORTED';
  methodology: string;
  isVerified: boolean;
}

export interface NavigationTab {
  id: string;
  name: string;
  path: string;
  iconName: string;
  badge?: string;
  group: 'public' | 'app' | 'admin';
}
