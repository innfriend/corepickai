import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Terminal, 
  Copy, 
  Check, 
  Code2, 
  Cpu, 
  ArrowRight, 
  Zap, 
  SlidersHorizontal, 
  GitCompare, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  Network, 
  Box, 
  Search, 
  ShieldCheck, 
  Layers, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Database,
  FileCode,
  Gauge
} from 'lucide-react';

interface DocsViewProps {
  onNavigate: (view: string) => void;
}

interface ToolGuide {
  id: string;
  routeId: string;
  title: string;
  category: 'Simulation & Intelligence' | 'Sizing & Slicing' | 'Optimization & Export';
  icon: React.ElementType;
  badge: string;
  oneLiner: string;
  whatItDoes: string;
  stepByStep: { step: string; action: string; tip?: string }[];
  keyInputs: { name: string; description: string }[];
  keyOutputs: { metric: string; meaning: string }[];
  bestPractices: string[];
}

export const DocsView: React.FC<DocsViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'cli' | 'sdk' | 'api'>('tools');
  const [selectedToolId, setSelectedToolId] = useState<string>('simulator');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const toolGuides: ToolGuide[] = [
    {
      id: 'simulator',
      routeId: 'app-simulator',
      title: 'Inference Performance Simulator (Roofline)',
      category: 'Simulation & Intelligence',
      icon: Gauge,
      badge: 'Core Analytical',
      oneLiner: 'Simulate end-to-end LLM/Vision inference performance, TTFT, ITL, Roofline saturation, and VRAM memory footprint before hardware provisioning.',
      whatItDoes: 'Employs an analytical hardware roofline engine that decouples Prefill (compute-bound GEMM operations) and Decode (memory-bandwidth bound autoregressive generation) phases. It models tensor parallelism communication overheads, flash attention, and KV-cache compression.',
      stepByStep: [
        {
          step: '1. Select Model & Accelerator',
          action: 'Choose your target foundation model (e.g., LLaMA-3-70B, DeepSeek-V3, Qwen 2.5-72B) and physical hardware (e.g., NVIDIA B200, H100 SXM5, AMD MI300X, Apple M4 Max).',
          tip: 'Notice how the memory bandwidth (GB/s) and peak compute (TFLOPS) update automatically in the specs card.'
        },
        {
          step: '2. Adjust Precision & Sharding (TP)',
          action: 'Select weight precision (FP16, BF16, FP8, INT8, INT4) and Tensor Parallelism (TP=1, 2, 4, 8). If sharding across multiple GPUs, inter-GPU interconnect bandwidth (NVLink / PCIe) is simulated.',
          tip: 'Using FP8 or INT4 cuts weight footprint in half or quarter, preventing Out-Of-Memory (OOM).'
        },
        {
          step: '3. Set Workload Concurrency & Context',
          action: 'Use the interactive sliders to set Batch Size (concurrent streams), Prompt Context Length (input tokens), and Generated Output Tokens.',
          tip: 'Higher batch sizes increase aggregate throughput (Tokens/sec) while increasing ITL slightly.'
        },
        {
          step: '4. Analyze the Roofline & VRAM Breakdown',
          action: 'Inspect the log-scale Roofline chart to see if your workload is compute-bound (Prefill plateau) or memory-bound (Decode slope). Check the stacked VRAM chart to verify weights, KV-cache, and activation safety margins.'
        }
      ],
      keyInputs: [
        { name: 'Model Architecture', description: 'Parameter count, hidden dimensions, layer count, and GQA head configuration.' },
        { name: 'Target Hardware Profile', description: 'Peak FLOPS/TOPS, memory capacity, and raw memory bandwidth (GB/s).' },
        { name: 'Weight & KV Precision', description: 'Format of neural weights (FP16/FP8/INT4) and Key-Value attention cache.' },
        { name: 'Batch Size & Context Window', description: 'Number of parallel requests and sequence token length.' }
      ],
      keyOutputs: [
        { metric: 'TTFT (Time to First Token)', meaning: 'Initial latency to ingest prompt context and output the very first token (ms).' },
        { metric: 'ITL (Inter-Token Latency)', meaning: 'Delay between consecutive decoded tokens. <30ms feels real-time for users.' },
        { metric: 'Single-Stream TPS', meaning: 'Per-user generation speed (Tokens/second) = 1000 / ITL.' },
        { metric: 'Aggregate Throughput', meaning: 'Total system throughput across all concurrent batch requests (Tokens/second).' },
        { metric: 'Cost / 1M Tokens', meaning: 'Estimated dollar cost based on hourly cloud rental rates.' }
      ],
      bestPractices: [
        'For chatbot applications, optimize for ITL < 25ms and TTFT < 300ms.',
        'For high-throughput batch extraction, scale batch size to 32 or 64 to push operational intensity into the compute-bound zone.',
        'Always check the VRAM breakdown to ensure at least 15% headroom for dynamic KV-cache spikes.'
      ]
    },
    {
      id: 'comparator',
      routeId: 'app-comparator-matrix',
      title: 'Model × Hardware Matrix Comparator',
      category: 'Simulation & Intelligence',
      icon: GitCompare,
      badge: 'Multi-Chip',
      oneLiner: 'Benchmarking console comparing up to 4 accelerators simultaneously on identical workloads with live delta calculations.',
      whatItDoes: 'Allows engineers to benchmark an identical model workload across diverse architectures (e.g., NVIDIA B200 vs. H200 vs. AMD MI300X vs. RTX 4090) to discover the fastest, cheapest, and most power-efficient hardware choice.',
      stepByStep: [
        {
          step: '1. Select the Base Model & Workload',
          action: 'Choose the model architecture and configure batch size, prompt length, and generation length once at the top.',
          tip: 'The same workload parameters apply automatically across all selected hardware chips.'
        },
        {
          step: '2. Configure Up to 4 Accelerators',
          action: 'Click "+ Add Hardware" to include up to 4 chips. Set custom precision and Tensor Parallelism (TP) for each device independently.',
          tip: 'Compare 1x B200 vs 2x H100 vs 4x RTX 4090 to see scaling economics.'
        },
        {
          step: '3. Review the Comparative Scorecard',
          action: 'Examine the summary scorecard highlighting the Best Latency winner, Highest Throughput winner, and Lowest Cost ($/1M tokens) winner.'
        }
      ],
      keyInputs: [
        { name: 'Model & Workload', description: 'Universal test parameters shared across all compared accelerators.' },
        { name: 'Hardware Slots 1-4', description: 'Independent hardware selection, precision, and multi-GPU tensor parallel count.' }
      ],
      keyOutputs: [
        { metric: 'Performance Delta (% vs Baseline)', meaning: 'Relative throughput and latency difference compared to Slot 1.' },
        { metric: 'Cost Efficiency Winner', meaning: 'Hardware delivering the cheapest price per 1 million generated tokens.' },
        { metric: 'Energy Efficiency (Joules/Token)', meaning: 'Power consumed per token based on accelerator TDP.' }
      ],
      bestPractices: [
        'Use slot 1 as your current production baseline to quickly evaluate ROI of upgrading to next-gen silicon.',
        'Look at both single-stream TPS (user experience) and aggregate TPS (system efficiency).'
      ]
    },
    {
      id: 'pareto',
      routeId: 'app-pareto',
      title: 'Pareto SLA Optimizer',
      category: 'Simulation & Intelligence',
      icon: TrendingUp,
      badge: 'SLA Solver',
      oneLiner: 'Multi-objective search engine that maps candidate configurations and isolates optimal Pareto-frontier choices meeting your latency & budget SLAs.',
      whatItDoes: 'Simulates dozens of hardware, precision, and tensor-parallel combinations, filtering out sub-optimal configurations and presenting the true mathematical Pareto frontier matching strict latency (TTFT/ITL) and budget constraints.',
      stepByStep: [
        {
          step: '1. Define SLA Constraints',
          action: 'Use the interactive sliders to set your Max Allowed ITL (e.g., ≤ 30 ms), Max Allowed TTFT (e.g., ≤ 500 ms), and Max Cost ($ / 1M tokens).',
          tip: 'Configurations violating your SLA are immediately filtered out or marked in red.'
        },
        {
          step: '2. Select Your Optimization Objective',
          action: 'Choose whether to prioritize "Balanced ROI", "Lowest Latency (Fastest)", "Lowest Cost (Cheapest)", or "Maximum Throughput".'
        },
        {
          step: '3. Inspect the Pareto Scatter Plot',
          action: 'Hover over dots on the 2D Cost vs. Latency scatter plot. Pareto-optimal designs form the frontier curve along the bottom-left.'
        },
        {
          step: '4. Review Top-3 Recommended Architectures',
          action: 'Examine the 3 recommended hardware configurations with detailed cost, throughput, and memory margins.'
        }
      ],
      keyInputs: [
        { name: 'SLA Latency Thresholds', description: 'Upper bounds for TTFT (ms) and ITL (ms).' },
        { name: 'Budget Limit', description: 'Maximum allowable dollar cost per 1M tokens.' },
        { name: 'Target Optimization Goal', description: 'Mathematical weighting for throughput, cost, or latency.' }
      ],
      keyOutputs: [
        { metric: 'Pareto Frontier Set', meaning: 'Configurations where no other option is both faster and cheaper.' },
        { metric: 'Ranked Recommendations', meaning: 'Top 3 curated configurations scored against your objective.' }
      ],
      bestPractices: [
        'If budget is tight, test FP8 or INT4 precision before scaling to larger multi-GPU clusters.',
        'Use the SLA optimizer before procurement to justify hardware purchase or cloud reservation commitments.'
      ]
    },
    {
      id: 'whatif',
      routeId: 'app-whatif',
      title: 'What-If Sensitivity Sweeper',
      category: 'Simulation & Intelligence',
      icon: SlidersHorizontal,
      badge: 'Sweeper',
      oneLiner: 'Interactive parameter sweeper generating curves across batch sizing (1..64) and context window lengths (512..32k tokens).',
      whatItDoes: 'Visualizes non-linear scaling trends to pinpoint the exact saturation point where increasing batch size stops improving throughput, or where expanding context window exhausts hardware VRAM.',
      stepByStep: [
        {
          step: '1. Select Base Model & Hardware',
          action: 'Pick your baseline model, accelerator, and precision.'
        },
        {
          step: '2. Choose Sweep Dimension',
          action: 'Toggle between "Sweep Batch Size" (concurrency scaling) and "Sweep Prompt Context" (sequence length scaling).'
        },
        {
          step: '3. Read the Knee-of-the-Curve Charts',
          action: 'Observe where throughput begins flattening (compute saturation) and where latency starts rising sharply.'
        }
      ],
      keyInputs: [
        { name: 'Sweep Axis', description: 'Batch concurrency (1 to 64) or Context tokens (512 to 32,768 tokens).' },
        { name: 'Fixed Parameters', description: 'Hardware target, model weights, and precision format.' }
      ],
      keyOutputs: [
        { metric: 'Saturation Knee Point', meaning: 'The optimal batch size maximizing throughput before latency degrades.' },
        { metric: 'OOM Horizon', meaning: 'The maximum context window achievable before out-of-memory errors occur.' }
      ],
      bestPractices: [
        'Set your production serving engine concurrency limit to the knee point identified in this sweep.'
      ]
    },
    {
      id: 'fit',
      routeId: 'app-fit',
      title: 'Hardware Fit & VRAM Sizer',
      category: 'Sizing & Slicing',
      icon: CheckCircle2,
      badge: 'Compatibility',
      oneLiner: 'Automated compatibility matrix matching model weights against 18+ enterprise and consumer GPUs.',
      whatItDoes: 'Calculates weight sizes, minimum VRAM requirements, and tensor parallel sharding feasibility across NVIDIA, AMD, Apple Silicon, Qualcomm, and Google TPU hardware.',
      stepByStep: [
        {
          step: '1. Select or Upload Model',
          action: 'Pick a model from the catalog or paste custom HuggingFace configuration parameters.'
        },
        {
          step: '2. Review Compatibility Status',
          action: 'Look for green "Fits Easily", yellow "Requires Quantization", or red "OOM / Needs TP" status badges across all hardware.'
        },
        {
          step: '3. Inspect Minimum Cluster Requirements',
          action: 'See the minimum number of GPUs (TP) required to run the model without memory overflow.'
        }
      ],
      keyInputs: [
        { name: 'Model Parameters', description: 'Total parameter count and architecture type.' },
        { name: 'Target Precision', description: 'FP16, BF16, FP8, INT8, or INT4.' }
      ],
      keyOutputs: [
        { metric: 'Memory Fit Margin', meaning: 'Percentage of free VRAM remaining after weights and KV-cache are loaded.' },
        { metric: 'Minimum Tensor Parallelism', meaning: 'Fewest GPUs needed to host the full model weights.' }
      ],
      bestPractices: [
        'Always maintain at least 20% free VRAM for dynamic activations during long conversation turns.'
      ]
    },
    {
      id: 'quant',
      routeId: 'app-quant-simulator',
      title: 'Quantization & Accuracy Simulator',
      category: 'Optimization & Export',
      icon: Sparkles,
      badge: 'Accuracy vs Speed',
      oneLiner: 'Interactive tradeoff explorer charting perplexity loss, MMLU score retention, and speedup for INT8, INT4, FP8, and AWQ.',
      whatItDoes: 'Predicts empirical accuracy retention vs. VRAM savings and throughput gains for modern post-training quantization (PTQ) schemes (AWQ, GPTQ, SmoothQuant, FP8).',
      stepByStep: [
        {
          step: '1. Choose Model & Evaluation Benchmark',
          action: 'Select target model and benchmark metric (MMLU, GSM8k, HumanEval, Perplexity).'
        },
        {
          step: '2. Compare Quantization Schemes',
          action: 'Evaluate FP16 (Baseline), FP8 (Near Lossless), INT8 (SmoothQuant), and INT4 (AWQ/GPTQ).'
        },
        {
          step: '3. Inspect Degradation vs. Memory Savings',
          action: 'Verify if accuracy drop is acceptable for your enterprise use case.'
        }
      ],
      keyInputs: [
        { name: 'Quantization Scheme', description: 'AWQ, SmoothQuant, FP8 E4M3, GPTQ, or INT4.' },
        { name: 'Benchmark Domain', description: 'Reasoning (GSM8K), General Knowledge (MMLU), or Code (HumanEval).' }
      ],
      keyOutputs: [
        { metric: 'Accuracy Retention (%)', meaning: 'Expected benchmark score relative to full FP16 baseline.' },
        { metric: 'VRAM Compression Ratio', meaning: 'Memory footprint reduction factor (e.g., 3.8x for INT4).' }
      ],
      bestPractices: [
        'Use FP8 for frontier models (70B+) for zero accuracy loss on modern Hopper/Blackwell silicon.',
        'Use AWQ INT4 when deploying on edge GPUs or constrained VRAM workstations.'
      ]
    },
    {
      id: 'k8s',
      routeId: 'app-k8s-generator',
      title: 'K8s & Production Docker Container Generator',
      category: 'Optimization & Export',
      icon: Box,
      badge: 'Export',
      oneLiner: 'One-click generator for production-ready Kubernetes Helm manifests, Docker Compose, and vLLM/TGI serving commands.',
      whatItDoes: 'Produces copy-paste ready Kubernetes YAMLs with exact GPU resource limits (`nvidia.com/gpu: 4`), tensor parallel flags, and optimized environment variables.',
      stepByStep: [
        {
          step: '1. Configure Runtime Engine',
          action: 'Select vLLM, TensorRT-LLM, or TGI (Text Generation Inference).'
        },
        {
          step: '2. Set Sharding & Port Config',
          action: 'Specify GPU count, host port, and HuggingFace authentication secret.'
        },
        {
          step: '3. Copy Dockerfile or Helm Manifest',
          action: 'Click Copy to integrate directly into your GitOps or ArgoCD deployment pipeline.'
        }
      ],
      keyInputs: [
        { name: 'Serving Engine', description: 'vLLM, TensorRT-LLM, SGLang, or ONNX Runtime.' },
        { name: 'GPU Request & Sharding', description: 'Kubernetes resource allocation and TP flags.' }
      ],
      keyOutputs: [
        { metric: 'Deployment YAML', meaning: 'Production Kubernetes manifest ready for `kubectl apply -f`.' },
        { metric: 'Docker Run Command', meaning: 'Local container launch command with GPU passthrough flags.' }
      ],
      bestPractices: [
        'Ensure `--gpu-memory-utilization` in vLLM matches your simulated VRAM headroom (0.90 is recommended).'
      ]
    }
  ];

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return toolGuides;
    const q = searchQuery.toLowerCase();
    return toolGuides.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.whatItDoes.toLowerCase().includes(q) ||
        t.oneLiner.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [searchQuery, toolGuides]);

  const activeTool = useMemo(() => {
    return toolGuides.find((t) => t.id === selectedToolId) || toolGuides[0];
  }, [selectedToolId, toolGuides]);

  const sections = [
    {
      id: 'quickstart',
      title: 'Quickstart & CLI Agent Installation',
      desc: 'Install the CorePick command-line daemon to profile neural models directly on your local GPU / NPU hardware.',
      code: `# Install the CorePick CLI Agent
curl -sSL https://corepick.ai/install.sh | bash

# Authenticate your terminal
corepick login --token cp_live_99214488

# Profile a local ONNX or PyTorch model
corepick profile ./models/llama3-8b.onnx --target=rtx4090,h100 --precision=int8

# Export optimized TensorRT-LLM / vLLM configuration
corepick export ./models/llama3-8b.onnx --runtime=vllm --output=./dist/`,
    },
    {
      id: 'rest-api',
      title: 'CorePick Simulation REST API Reference',
      desc: 'Trigger programmatic hardware roofline simulations, retrieve Pareto optimal models, and stream live kernel benchmarks via JSON APIs.',
      code: `# POST /api/simulate
curl -X POST https://api.corepick.ai/v1/simulate \\
  -H "Authorization: Bearer cp_live_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "modelId": "llama-3-70b-instruct",
    "hardwareId": "nvidia-h100-sxm",
    "precision": "FP8",
    "tensorParallelSize": 2,
    "batchSize": 8,
    "contextLength": 2048,
    "outputTokens": 256
  }'

# Response
{
  "ttftMs": 42.8,
  "itlMs": 8.4,
  "singleStreamTps": 119.0,
  "aggregateThroughputTps": 952.4,
  "vramUsageGb": 76.4,
  "costPerMillionTokens": 0.48
}`,
    },
    {
      id: 'python-sdk',
      title: 'Python SDK Integration (`corepick-py`)',
      desc: 'Embed automated hardware profiling directly inside your PyTorch training and fine-tuning scripts.',
      code: `import torch
import corepick

model = MyLlamaModel().cuda()
input_sample = torch.randn(1, 2048, 4096, device='cuda')

# Automated Roofline & Quantization Audit
report = corepick.simulate(
    model_id="llama-3-70b",
    hardware_ids=["nvidia-h100-sxm", "nvidia-b200-sxm", "amd-mi300x"],
    precisions=["FP16", "FP8", "INT4"],
    batch_size=8,
    context_length=2048
)

print(f"Optimal Device: {report.best_hardware.name}")
print(f"TTFT: {report.ttft_ms} ms | ITL: {report.itl_ms} ms")
print(f"Cost per 1M tokens: {report.cost_per_million}")`,
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8" id="docs-root">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* Main Header Banner */}
        <div className="bg-[#0D1322] border border-[#1E293B] p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Comprehensive User Manual & Technical Docs</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('app-simulator')}
                className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Open Live Simulator</span>
              </button>
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            How to Use CorePick Performance & Simulation Tools
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
            Step-by-step interactive manuals for every performance tool in the CorePick suite. Learn how to configure analytical roofline simulations, multi-chip matrix comparisons, Pareto SLA optimizations, and production container exports.
          </p>

          {/* Tab Selection */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1E293B]">
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'tools'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-[#131B2E] text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Tool-by-Tool User Guides ({toolGuides.length} Tools)</span>
            </button>
            <button
              onClick={() => setActiveTab('cli')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'cli'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-[#131B2E] text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>CLI Daemon Guide</span>
            </button>
            <button
              onClick={() => setActiveTab('sdk')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'sdk'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-[#131B2E] text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Python SDK (`corepick-py`)</span>
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'api'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-[#131B2E] text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>REST API Reference</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Tool-by-Tool Manual */}
        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Tool List & Search */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-4 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search tool guides..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#07090E] border border-[#1E293B] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="text-xs font-mono text-slate-400 px-1">
                  Select a tool below to view its complete guide:
                </div>
              </div>

              {/* Tool Navigation Items */}
              <div className="space-y-2">
                {filteredTools.map((tool) => {
                  const Icon = tool.icon;
                  const isSelected = tool.id === selectedToolId;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedToolId(tool.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#10192E] border-cyan-500/60 shadow-lg shadow-cyan-950/20 text-white'
                          : 'bg-[#0D1322] border-[#1E293B] text-slate-300 hover:border-slate-700 hover:bg-[#0F1626]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-[#1E293B] text-cyan-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-mono font-bold">{tool.title}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131B2E] border border-[#27354F] text-slate-400">
                          {tool.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {tool.oneLiner}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed Tool Manual */}
            <div className="lg:col-span-8 space-y-6">
              {activeTool && (
                <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-6">
                  {/* Tool Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#1E293B]">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] font-mono font-semibold">
                          {activeTool.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono">
                          {activeTool.badge}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white font-mono flex items-center gap-2.5">
                        <activeTool.icon className="w-6 h-6 text-cyan-400" />
                        <span>{activeTool.title}</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {activeTool.whatItDoes}
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigate(activeTool.routeId)}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono rounded-xl flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer shadow-lg shadow-cyan-950/40"
                    >
                      <span>Launch This Tool</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Step-by-Step Instructions */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 text-cyan-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span>Step-by-Step Instructions</span>
                    </h3>
                    <div className="space-y-3">
                      {activeTool.stepByStep.map((step, idx) => (
                        <div key={idx} className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 space-y-2">
                          <div className="text-xs font-bold font-mono text-cyan-400">
                            {step.step}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {step.action}
                          </p>
                          {step.tip && (
                            <div className="text-[11px] bg-cyan-950/40 border border-cyan-900/50 text-cyan-300 rounded-lg p-2 font-mono flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>Pro Tip: {step.tip}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Inputs & Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                        <span>Key Input Parameters</span>
                      </h4>
                      <div className="space-y-2.5">
                        {activeTool.keyInputs.map((inp, i) => (
                          <div key={i} className="text-xs border-b border-[#1E293B]/60 pb-2 last:border-b-0 last:pb-0">
                            <div className="font-mono font-bold text-cyan-300">{inp.name}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">{inp.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span>Output Metrics Explained</span>
                      </h4>
                      <div className="space-y-2.5">
                        {activeTool.keyOutputs.map((out, i) => (
                          <div key={i} className="text-xs border-b border-[#1E293B]/60 pb-2 last:border-b-0 last:pb-0">
                            <div className="font-mono font-bold text-emerald-300">{out.metric}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">{out.meaning}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Best Practices */}
                  <div className="bg-gradient-to-r from-[#0D1829] to-[#0A1220] border border-cyan-900/40 rounded-2xl p-5 space-y-2">
                    <h4 className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Production Engineering Best Practices</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                      {activeTool.bestPractices.map((bp, i) => (
                        <li key={i} className="leading-relaxed">{bp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: CLI Daemon */}
        {activeTab === 'cli' && (
          <div className="space-y-6">
            <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{sections[0].title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{sections[0].desc}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(sections[0].code, sections[0].id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white text-xs font-mono rounded-lg border border-[#27354F] transition-colors cursor-pointer"
                >
                  {copiedSection === sections[0].id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#07090E] border border-[#1E293B] rounded-xl p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-cyan-300 leading-relaxed">
                  <code>{sections[0].code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Python SDK */}
        {activeTab === 'sdk' && (
          <div className="space-y-6">
            <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{sections[2].title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{sections[2].desc}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(sections[2].code, sections[2].id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white text-xs font-mono rounded-lg border border-[#27354F] transition-colors cursor-pointer"
                >
                  {copiedSection === sections[2].id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#07090E] border border-[#1E293B] rounded-xl p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-cyan-300 leading-relaxed">
                  <code>{sections[2].code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: REST API */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{sections[1].title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{sections[1].desc}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(sections[1].code, sections[1].id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white text-xs font-mono rounded-lg border border-[#27354F] transition-colors cursor-pointer"
                >
                  {copiedSection === sections[1].id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#07090E] border border-[#1E293B] rounded-xl p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-cyan-300 leading-relaxed">
                  <code>{sections[1].code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
