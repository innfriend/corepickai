import React, { useState, useId } from 'react';
import { 
  FileCode, 
  Layers, 
  Cpu, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  BookOpen, 
  ArrowRight, 
  Sparkles,
  Copy,
  Check,
  Zap,
  Sliders,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { MeasurementBadge } from './MeasurementBadge';
import { HARDWARE_CATALOG } from '../data/mockData';

interface HuggingFaceConfigParserProps {
  onNavigate?: (view: string) => void;
  onOpenWizardWithModel?: (modelId: string) => void;
}

// Popular sample Hugging Face config.json files for 1-click loading
const PRESET_CONFIGS: Record<string, { name: string; repo: string; json: string }> = {
  llama3_8b: {
    name: 'Meta Llama-3.1-8B-Instruct',
    repo: 'meta-llama/Llama-3.1-8B-Instruct',
    json: JSON.stringify({
      "architectures": ["LlamaForCausalLM"],
      "hidden_size": 4096,
      "intermediate_size": 14336,
      "num_attention_heads": 32,
      "num_hidden_layers": 32,
      "num_key_value_heads": 8,
      "vocab_size": 128256,
      "max_position_embeddings": 131072,
      "torch_dtype": "bfloat16",
      "rms_norm_eps": 1e-05,
      "tie_word_embeddings": false
    }, null, 2)
  },
  llama3_70b: {
    name: 'Meta Llama-3.1-70B-Instruct',
    repo: 'meta-llama/Llama-3.1-70B-Instruct',
    json: JSON.stringify({
      "architectures": ["LlamaForCausalLM"],
      "hidden_size": 8192,
      "intermediate_size": 28672,
      "num_attention_heads": 64,
      "num_hidden_layers": 80,
      "num_key_value_heads": 8,
      "vocab_size": 128256,
      "max_position_embeddings": 131072,
      "torch_dtype": "bfloat16",
      "rms_norm_eps": 1e-05,
      "tie_word_embeddings": false
    }, null, 2)
  },
  qwen25_72b: {
    name: 'Qwen 2.5-72B-Instruct',
    repo: 'Qwen/Qwen2.5-72B-Instruct',
    json: JSON.stringify({
      "architectures": ["Qwen2ForCausalLM"],
      "hidden_size": 8192,
      "intermediate_size": 29568,
      "num_attention_heads": 64,
      "num_hidden_layers": 80,
      "num_key_value_heads": 8,
      "vocab_size": 152064,
      "max_position_embeddings": 131072,
      "torch_dtype": "bfloat16"
    }, null, 2)
  },
  gemma2_27b: {
    name: 'Google Gemma-2-27B-IT',
    repo: 'google/gemma-2-27b-it',
    json: JSON.stringify({
      "architectures": ["Gemma2ForCausalLM"],
      "hidden_size": 4608,
      "intermediate_size": 36864,
      "num_attention_heads": 32,
      "num_hidden_layers": 46,
      "num_key_value_heads": 16,
      "vocab_size": 256000,
      "max_position_embeddings": 8192,
      "torch_dtype": "bfloat16"
    }, null, 2)
  },
  phi35_mini: {
    name: 'Microsoft Phi-3.5-mini-instruct (3.8B)',
    repo: 'microsoft/Phi-3.5-mini-instruct',
    json: JSON.stringify({
      "architectures": ["Phi3ForCausalLM"],
      "hidden_size": 3072,
      "intermediate_size": 8192,
      "num_attention_heads": 32,
      "num_hidden_layers": 32,
      "num_key_value_heads": 32,
      "vocab_size": 32064,
      "max_position_embeddings": 131072,
      "torch_dtype": "bfloat16"
    }, null, 2)
  },
  deepseek_v2_lite: {
    name: 'DeepSeek-V2-Lite (16B / 2.4B Active)',
    repo: 'deepseek-ai/DeepSeek-V2-Lite',
    json: JSON.stringify({
      "architectures": ["DeepseekV2ForCausalLM"],
      "hidden_size": 2048,
      "intermediate_size": 10944,
      "num_attention_heads": 16,
      "num_hidden_layers": 27,
      "num_key_value_heads": 16,
      "vocab_size": 102400,
      "n_routed_experts": 64,
      "num_experts_per_tok": 6,
      "moe_intermediate_size": 1408,
      "max_position_embeddings": 4096,
      "torch_dtype": "bfloat16"
    }, null, 2)
  }
};

export const HuggingFaceConfigParser: React.FC<HuggingFaceConfigParserProps> = ({
  onNavigate,
  onOpenWizardWithModel
}) => {
  const [activePreset, setActivePreset] = useState<string>('llama3_8b');
  const [configJsonText, setConfigJsonText] = useState<string>(PRESET_CONFIGS.llama3_8b.json);
  const [contextLengthSizing, setContextLengthSizing] = useState<number>(4096);
  const [batchSizeSizing, setBatchSizeSizing] = useState<number>(1);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const rawJsonTextareaId = useId();

  // Load a preset
  const handleSelectPreset = (key: string) => {
    setActivePreset(key);
    setConfigJsonText(PRESET_CONFIGS[key].json);
    setParseError(null);
  };

  // Parsing logic
  let parsedConfig: any = null;
  let parsedHiddenSize = 4096;
  let parsedIntermediateSize = 14336;
  let parsedNumLayers = 32;
  let parsedNumHeads = 32;
  let parsedNumKvHeads = 8;
  let parsedVocabSize = 128256;
  let parsedMaxContext = 131072;
  let isMoe = false;
  let numRoutedExperts = 0;
  let expertsPerTok = 0;
  let moeIntermediateSize = 0;

  try {
    parsedConfig = JSON.parse(configJsonText);
    parsedHiddenSize = parsedConfig.hidden_size || parsedConfig.d_model || 4096;
    parsedIntermediateSize = parsedConfig.intermediate_size || parsedConfig.ffn_dim || (parsedHiddenSize * 4);
    parsedNumLayers = parsedConfig.num_hidden_layers || parsedConfig.n_layer || parsedConfig.num_layers || 32;
    parsedNumHeads = parsedConfig.num_attention_heads || parsedConfig.n_head || 32;
    parsedNumKvHeads = parsedConfig.num_key_value_heads || parsedConfig.n_head_kv || parsedNumHeads;
    parsedVocabSize = parsedConfig.vocab_size || 32000;
    parsedMaxContext = parsedConfig.max_position_embeddings || parsedConfig.n_positions || 8192;
    
    // Check for MoE architectures
    if (parsedConfig.n_routed_experts || parsedConfig.num_local_experts) {
      isMoe = true;
      numRoutedExperts = parsedConfig.n_routed_experts || parsedConfig.num_local_experts || 8;
      expertsPerTok = parsedConfig.num_experts_per_tok || parsedConfig.num_experts_per_token || 2;
      moeIntermediateSize = parsedConfig.moe_intermediate_size || parsedIntermediateSize;
    }
  } catch (err: any) {
    if (!parseError) {
      setParseError(err.message);
    }
  }

  // Exact Parameter Math Breakdown:
  const headDim = parsedHiddenSize / parsedNumHeads;
  
  // 1. Embedding Matrix: Vocab * Hidden
  const embeddingParams = parsedVocabSize * parsedHiddenSize;

  // 2. Attention Layer Params (Q, K, V, Out):
  // Q: H * (num_heads * head_dim) = H^2
  // K: H * (num_kv_heads * head_dim) = H * (num_kv_heads * head_dim)
  // V: H * (num_kv_heads * head_dim) = H * (num_kv_heads * head_dim)
  // Out: (num_heads * head_dim) * H = H^2
  const qProjParams = parsedHiddenSize * (parsedNumHeads * headDim);
  const kProjParams = parsedHiddenSize * (parsedNumKvHeads * headDim);
  const vProjParams = parsedHiddenSize * (parsedNumKvHeads * headDim);
  const outProjParams = (parsedNumHeads * headDim) * parsedHiddenSize;
  const attentionPerLayerParams = qProjParams + kProjParams + vProjParams + outProjParams;

  // 3. MLP / Feed-Forward Params (SwiGLU: Gate, Up, Down):
  // Gate: H * Intermediate
  // Up: H * Intermediate
  // Down: Intermediate * H
  let mlpPerLayerParams = 3 * (parsedHiddenSize * parsedIntermediateSize);
  if (isMoe) {
    // Shared MLP + Routed Experts
    const expertMlp = 3 * (parsedHiddenSize * moeIntermediateSize);
    mlpPerLayerParams = expertMlp * numRoutedExperts;
  }

  // 4. LayerNorm / RMSNorm per layer (input norm + post attention norm = 2 * H)
  const normPerLayerParams = 2 * parsedHiddenSize;

  // Total Layer Params
  const totalLayersParams = parsedNumLayers * (attentionPerLayerParams + mlpPerLayerParams + normPerLayerParams);

  // 5. Final Norm + Output LM Head (Vocab * Hidden if untied)
  const finalNormParams = parsedHiddenSize;
  const lmHeadParams = parsedConfig?.tie_word_embeddings === true ? 0 : (parsedVocabSize * parsedHiddenSize);

  // Total Theoretical Parameters:
  const totalCalculatedParams = embeddingParams + totalLayersParams + finalNormParams + lmHeadParams;
  const totalParamsBillions = totalCalculatedParams / 1e9;

  // Memory Calculations for Different Precisions (in GB)
  const weightGbFP16 = (totalCalculatedParams * 2) / (1024 ** 3);
  const weightGbFP8 = (totalCalculatedParams * 1) / (1024 ** 3);
  const weightGbINT8 = (totalCalculatedParams * 1) / (1024 ** 3);
  const weightGbINT4 = (totalCalculatedParams * 0.5) / (1024 ** 3);

  // KV Cache Per Sequence at contextLengthSizing:
  // 2 * Layers * (KV_Heads * Head_Dim) * Context * Bytes
  const kvBytesPerTokenFP16 = 2 * parsedNumLayers * (parsedNumKvHeads * headDim) * 2;
  const kvBytesPerTokenFP8 = 2 * parsedNumLayers * (parsedNumKvHeads * headDim) * 1;
  const kvBytesPerTokenINT4 = 2 * parsedNumLayers * (parsedNumKvHeads * headDim) * 0.5;

  const totalKvCacheGbFP16 = (kvBytesPerTokenFP16 * contextLengthSizing * batchSizeSizing * 1.04) / (1024 ** 3);
  const totalKvCacheGbFP8 = (kvBytesPerTokenFP8 * contextLengthSizing * batchSizeSizing * 1.04) / (1024 ** 3);
  const totalKvCacheGbINT4 = (kvBytesPerTokenINT4 * contextLengthSizing * batchSizeSizing * 1.04) / (1024 ** 3);

  // Recommended Hardware Fits
  const getFittingHardware = (weightGb: number, kvGb: number) => {
    const totalRequired = weightGb + kvGb + 1.2; // +1.2 GB CUDA overhead
    return HARDWARE_CATALOG.filter(h => h.type === 'GPU' || h.type === 'ACCELERATOR')
      .map(h => ({
        gpu: h,
        fitSingle: h.memoryGb >= totalRequired,
        tp2Fit: (h.memoryGb * 2) >= (totalRequired + 1.0),
        tp4Fit: (h.memoryGb * 4) >= (totalRequired + 2.0),
        utilizationPct: (totalRequired / h.memoryGb) * 100
      }));
  };

  const hardwareFitsFP16 = getFittingHardware(weightGbFP16, totalKvCacheGbFP16);
  const hardwareFitsINT4 = getFittingHardware(weightGbINT4, totalKvCacheGbINT4);

  const handleCopy = () => {
    navigator.clipboard.writeText(configJsonText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                Architectural Model Parser
              </span>
              <MeasurementBadge status="ESTIMATED" size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              Hugging Face config.json Architecture Parser
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Paste any Hugging Face <code className="text-cyan-300 font-mono">config.json</code> or select a known open-source checkpoint. CorePick parses tensor shapes in your browser to calculate parameter distributions, KV-cache sizing, and exact GPU memory footprints without uploading weights.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate?.('app-tp-sizer')}
              className="px-3 py-1.5 rounded-xl bg-[#131B2E] border border-[#27354F] text-xs font-mono text-cyan-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>Multi-GPU TP Sizer</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="space-y-1.5 pt-3 border-t border-[#1E293B]">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Load Verified Architecture Preset:
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESET_CONFIGS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handleSelectPreset(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activePreset === key
                    ? 'bg-cyan-500 text-[#07090E] shadow-sm'
                    : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* JSON Editor & Live Architectural Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: JSON Input Panel */}
        <div className="lg:col-span-5 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <label htmlFor={rawJsonTextareaId} className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Raw config.json</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-[#131B2E] border border-[#27354F] text-[10px] font-mono text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <textarea
            id={rawJsonTextareaId}
            value={configJsonText}
            onChange={(e) => {
              setConfigJsonText(e.target.value);
              setActivePreset('');
              try {
                JSON.parse(e.target.value);
                setParseError(null);
              } catch (err: any) {
                setParseError(err.message);
              }
            }}
            rows={16}
            placeholder="Paste your Hugging Face config.json content here..."
            className="w-full flex-1 bg-[#070A12] border border-[#1E293B] rounded-2xl p-3.5 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 resize-none"
          />

          {parseError ? (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="truncate">JSON Syntax Error: {parseError}</span>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Valid Transformer Architecture Specification</span>
            </div>
          )}
        </div>

        {/* Right: Architectural Parameter Matrix & Sizing */}
        <div className="lg:col-span-7 space-y-6">
          {/* Extracted Parameters Card */}
          <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Extracted Layer & Tensor Dimensions</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-1">
                <span className="text-[10px] font-mono text-slate-400">Total Parameters</span>
                <div className="text-lg font-mono font-bold text-cyan-400">
                  {totalParamsBillions.toFixed(2)}B
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-1">
                <span className="text-[10px] font-mono text-slate-400">Hidden Size (H)</span>
                <div className="text-lg font-mono font-bold text-white">
                  {parsedHiddenSize}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-1">
                <span className="text-[10px] font-mono text-slate-400">Num Layers (L)</span>
                <div className="text-lg font-mono font-bold text-white">
                  {parsedNumLayers}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-1">
                <span className="text-[10px] font-mono text-slate-400">GQA Ratio (Heads/KV)</span>
                <div className="text-lg font-mono font-bold text-emerald-400">
                  {parsedNumHeads}:{parsedNumKvHeads} ({parsedNumHeads / parsedNumKvHeads}x)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-1">
                <span className="text-[10px] font-mono text-slate-400">FFN Intermediate (I)</span>
                <div className="text-lg font-mono font-bold text-white">
                  {parsedIntermediateSize}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-1">
                <span className="text-[10px] font-mono text-slate-400">Vocab Size (V)</span>
                <div className="text-lg font-mono font-bold text-white">
                  {parsedVocabSize.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-1">
                <span className="text-[10px] font-mono text-slate-400">Head Dimension</span>
                <div className="text-lg font-mono font-bold text-white">
                  {headDim} dim
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#070A12] border border-[#1E293B] space-y-1">
                <span className="text-[10px] font-mono text-slate-400">Max Context Native</span>
                <div className="text-lg font-mono font-bold text-indigo-400">
                  {(parsedMaxContext / 1024).toFixed(0)}k
                </div>
              </div>
            </div>

            {/* Parameter Distribution Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Weight Distribution Breakdown:</span>
                <span>
                  Attention: {((parsedNumLayers * attentionPerLayerParams / totalCalculatedParams) * 100).toFixed(1)}% | 
                  MLP: {((parsedNumLayers * mlpPerLayerParams / totalCalculatedParams) * 100).toFixed(1)}% | 
                  Embeddings: {((embeddingParams / totalCalculatedParams) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-[#131B2E] rounded-md overflow-hidden flex border border-[#1E293B]">
                <div 
                  style={{ width: `${(parsedNumLayers * attentionPerLayerParams / totalCalculatedParams) * 100}%` }}
                  className="bg-cyan-500" 
                  title="Self Attention Projection Matrices"
                />
                <div 
                  style={{ width: `${(parsedNumLayers * mlpPerLayerParams / totalCalculatedParams) * 100}%` }}
                  className="bg-indigo-500" 
                  title="SwiGLU Feed-Forward Blocks"
                />
                <div 
                  style={{ width: `${(embeddingParams / totalCalculatedParams) * 100}%` }}
                  className="bg-emerald-500" 
                  title="Token Embeddings"
                />
              </div>
            </div>
          </div>

          {/* VRAM Memory Sizing by Precision */}
          <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Model VRAM Requirements by Precision</span>
              </h3>

              {/* Sizing Context Controls */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Context:</span>
                <select
                  value={contextLengthSizing}
                  onChange={(e) => setContextLengthSizing(Number(e.target.value))}
                  className="bg-[#131B2E] border border-[#27354F] rounded-lg px-2 py-1 text-cyan-300 font-mono focus:outline-none"
                >
                  <option value={2048}>2,048 tokens</option>
                  <option value={4096}>4,096 tokens</option>
                  <option value={8192}>8,192 tokens</option>
                  <option value={16384}>16,384 tokens</option>
                  <option value={32768}>32,768 tokens</option>
                  <option value={65536}>65,536 tokens</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* FP16 */}
              <div className="p-4 rounded-2xl bg-[#070A12] border border-cyan-900/40 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-cyan-400 font-bold">FP16 / BF16</span>
                  <span className="text-[10px] text-slate-400">16-bit</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {weightGbFP16.toFixed(1)} <span className="text-xs text-slate-400 font-normal">GB</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 space-y-0.5 border-t border-[#1E293B] pt-1.5">
                  <div>KV Cache: +{totalKvCacheGbFP16.toFixed(2)} GB</div>
                  <div className="text-cyan-300 font-bold">Total: {(weightGbFP16 + totalKvCacheGbFP16 + 1.2).toFixed(1)} GB</div>
                </div>
              </div>

              {/* FP8 */}
              <div className="p-4 rounded-2xl bg-[#070A12] border border-indigo-900/40 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-indigo-400 font-bold">FP8 (E4M3)</span>
                  <span className="text-[10px] text-slate-400">8-bit</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {weightGbFP8.toFixed(1)} <span className="text-xs text-slate-400 font-normal">GB</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 space-y-0.5 border-t border-[#1E293B] pt-1.5">
                  <div>KV Cache: +{totalKvCacheGbFP8.toFixed(2)} GB</div>
                  <div className="text-indigo-300 font-bold">Total: {(weightGbFP8 + totalKvCacheGbFP8 + 1.2).toFixed(1)} GB</div>
                </div>
              </div>

              {/* INT8 */}
              <div className="p-4 rounded-2xl bg-[#070A12] border border-emerald-900/40 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-emerald-400 font-bold">INT8 Smooth</span>
                  <span className="text-[10px] text-slate-400">8-bit</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {weightGbINT8.toFixed(1)} <span className="text-xs text-slate-400 font-normal">GB</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 space-y-0.5 border-t border-[#1E293B] pt-1.5">
                  <div>KV Cache: +{totalKvCacheGbFP8.toFixed(2)} GB</div>
                  <div className="text-emerald-300 font-bold">Total: {(weightGbINT8 + totalKvCacheGbFP8 + 1.2).toFixed(1)} GB</div>
                </div>
              </div>

              {/* INT4 AWQ */}
              <div className="p-4 rounded-2xl bg-[#070A12] border border-amber-900/40 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-amber-400 font-bold">INT4 AWQ/GPTQ</span>
                  <span className="text-[10px] text-slate-400">4-bit</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {weightGbINT4.toFixed(1)} <span className="text-xs text-slate-400 font-normal">GB</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 space-y-0.5 border-t border-[#1E293B] pt-1.5">
                  <div>KV Cache: +{totalKvCacheGbINT4.toFixed(2)} GB</div>
                  <div className="text-amber-300 font-bold">Total: {(weightGbINT4 + totalKvCacheGbINT4 + 1.2).toFixed(1)} GB</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Fit Matrix & Recommendations */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          Hardware Compatibility for this Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Single GPU FP16 */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-[#1E293B] space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">FP16 Single-GPU Requirement</span>
            <div className="text-sm font-mono font-bold text-white">
              Min VRAM Needed: <span className="text-cyan-400">{(weightGbFP16 + totalKvCacheGbFP16 + 1.2).toFixed(1)} GB</span>
            </div>
            <p className="text-xs text-slate-400">
              {weightGbFP16 + totalKvCacheGbFP16 + 1.2 <= 24
                ? 'Fits comfortably on single consumer GPU (RTX 4090 24GB).'
                : weightGbFP16 + totalKvCacheGbFP16 + 1.2 <= 48
                ? 'Requires enterprise GPU (NVIDIA L40S 48GB or A6000).'
                : weightGbFP16 + totalKvCacheGbFP16 + 1.2 <= 80
                ? 'Requires datacenter tier (NVIDIA H100 80GB SXM5 or A100 80GB).'
                : 'Exceeds single 80GB GPU. Requires Multi-GPU Tensor Parallelism (TP ≥ 2 or TP ≥ 4).'}
            </p>
          </div>

          {/* Card 2: INT4 Quantized Single GPU */}
          <div className="p-4 rounded-2xl bg-[#070A12] border border-[#1E293B] space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">INT4 AWQ Single-GPU Requirement</span>
            <div className="text-sm font-mono font-bold text-white">
              Min VRAM Needed: <span className="text-amber-400">{(weightGbINT4 + totalKvCacheGbINT4 + 1.2).toFixed(1)} GB</span>
            </div>
            <p className="text-xs text-slate-400">
              {weightGbINT4 + totalKvCacheGbINT4 + 1.2 <= 24
                ? 'Fits on single RTX 4090 (24GB) or Apple M3 (36GB+ Unified Memory).'
                : weightGbINT4 + totalKvCacheGbINT4 + 1.2 <= 48
                ? 'Fits on single NVIDIA L40S (48GB) or Apple M3 Max.'
                : 'Requires 2x GPUs or 80GB accelerator for INT4 serving.'}
            </p>
          </div>

          {/* Card 3: Action Button */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-[#070A12] border border-cyan-800/50 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Ready to Profile?</span>
              <p className="text-xs text-slate-300 mt-1">
                Explore tensor parallelism clusters or send this parsed architecture into the Profiler Wizard.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate?.('app-tp-sizer')}
                className="flex-1 px-3 py-2 rounded-xl bg-cyan-500 text-black font-bold font-mono text-xs hover:bg-cyan-400 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Size Multi-GPU TP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
