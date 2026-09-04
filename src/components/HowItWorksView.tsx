import React, { useState } from 'react';
import { 
  Upload, 
  GitMerge, 
  Cpu, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Users,
  Terminal,
  Activity,
  Layers,
  DollarSign,
  Smartphone,
  ShieldCheck,
  TrendingDown,
  ChevronRight,
  Flame,
  Sliders
} from 'lucide-react';

interface HowItWorksViewProps {
  onNavigate: (view: string) => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'audience' | 'workflow'>('audience');
  const [selectedRole, setSelectedRole] = useState<number>(0);

  const targetAudiences = [
    {
      id: 'ml-engineers',
      title: 'ML & AI Platform Engineers',
      roleSubtitle: 'Deploying LLMs, Vision & Speech Models with Strict Latency SLAs',
      icon: Layers,
      badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
      accentColor: 'text-cyan-400',
      painPoints: [
        'Slow Time-To-First-Token (TTFT) and high memory footprint when serving large transformer checkpoints.',
        'Complex manual compilation pipelines for TensorRT-LLM, ONNX Runtime, and dynamic shape profiles.',
        'Wasting engineering cycles writing boilerplate Triton Inference Server and vLLM configuration files.'
      ],
      corePickSolutions: [
        'Automated INT4 AWQ / GPTQ & FP8 quantization with verified accuracy retention.',
        'One-click generation of production-ready Triton config.pbtxt and vLLM Docker Compose setups.',
        'Interactive streaming simulator to test TTFT and KV-cache memory saturation before deployment.'
      ],
      recommendedTools: [
        { label: 'Model Profiler Wizard', view: 'app-analyze' },
        { label: 'Streaming Simulator', view: 'app-deploy' },
        { label: 'Triton / vLLM Exporter', view: 'app-deploy' }
      ]
    },
    {
      id: 'hpc-engineers',
      title: 'HPC & Performance Engineers',
      roleSubtitle: 'Tuning CUDA Kernels, Operator Fusion & GPU Arithmetic Saturation',
      icon: Flame,
      badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
      accentColor: 'text-rose-400',
      painPoints: [
        'Difficulty diagnosing whether latency spikes stem from memory bandwidth ceilings or compute stalls.',
        'Unfused operators creating redundant VRAM roundtrips and high kernel launch overhead.',
        'Unnoticed CPU fallback operators quietly destroying inference pipeline throughput.'
      ],
      corePickSolutions: [
        'Interactive Roofline Model plotting exact operational intensity (FLOPs/Byte) vs. hardware ridge points.',
        'Microsecond-level layer flamegraphs with instant memory vs. compute classification.',
        'Compiler pass engine applying Conv-BatchNorm-Activation, SwiGLU, and FlashAttention-2 fusion.'
      ],
      recommendedTools: [
        { label: 'Roofline & Flamegraph', view: 'app-inspector' },
        { label: 'Compiler Tuning & Diagnostics', view: 'app-compiler' },
        { label: 'CLI Agent', view: 'app-cli' }
      ]
    },
    {
      id: 'finops-ctos',
      title: 'AI FinOps, Architects & CTOs',
      roleSubtitle: 'Eliminating Cloud GPU Waste & Optimizing Total Cost of Ownership (TCO)',
      icon: DollarSign,
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
      accentColor: 'text-amber-400',
      painPoints: [
        'Massive monthly cloud GPU bills from over-provisioning expensive H100 instances for simple batch-1 jobs.',
        'Lack of quantitative data on whether cheaper hardware (e.g. L40S, RTX 4090, or on-prem) meets user SLAs.',
        'Unclear ROI on post-training quantization vs. scaling hardware clusters.'
      ],
      corePickSolutions: [
        'Multi-hardware Pareto frontier scoring cost-per-million inferences across 30+ enterprise GPUs.',
        'Cloud On-Demand vs. 3-Year Reserved vs. On-Premises ROI and amortization calculator.',
        'Demonstrated 2.4x throughput acceleration cutting monthly cloud GPU infrastructure spend by up to 58%.'
      ],
      recommendedTools: [
        { label: 'Hardware Sandbox & TCO', view: 'app-sandbox' },
        { label: 'Knowledge Base: TCO Playbook', view: 'knowledge-base' },
        { label: 'Export Executive Reports', view: 'app-reports' }
      ]
    },
    {
      id: 'edge-embedded',
      title: 'Edge AI & Embedded Developers',
      roleSubtitle: 'Deploying High-Efficiency Models on NPUs, Mobile & Robotics Silicon',
      icon: Smartphone,
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
      accentColor: 'text-emerald-400',
      painPoints: [
        'Strict thermal envelopes (<15W) and battery constraints on mobile, automotive, and drone platforms.',
        'Targeting proprietary NPU runtimes (Qualcomm QNN HTP, Apple Neural Engine, Intel OpenVINO).',
        'Quantization degradation on fixed-point INT8 DSP hardware.'
      ],
      corePickSolutions: [
        'Specialized compilation for Qualcomm Snapdragon X Elite, Apple M-Series Silicon, and Jetson Orin.',
        'Performance-per-Watt (FPS/W) efficiency benchmarks and memory footprint verification.',
        'Export ready-to-flash QNN context binaries and CoreML / DirectML runtime bridges.'
      ],
      recommendedTools: [
        { label: 'Hardware Fleet Comparison', view: 'app-fleet' },
        { label: 'Model Profiler Wizard', view: 'app-analyze' },
        { label: 'Inference Engine Benchmarks', view: 'benchmarks' }
      ]
    }
  ];

  const workflowSteps = [
    {
      number: '01',
      icon: Upload,
      title: 'Model Ingestion & Graph Decomposition',
      desc: 'Upload or select your neural network weights in ONNX, PyTorch, SafeTensors, or GGUF format. CorePick extracts operator layers, tensor dimensions, FLOPs, parameter distributions, and memory requirements.',
      codeSnippet: '$ corepick inspect --model meta-llama/Meta-Llama-3-8B-Instruct --verbose',
      actionLabel: 'Launch Profiler Wizard',
      actionView: 'app-analyze',
      highlights: ['Automatic operator graph parsing', 'Memory footprint audit', 'HuggingFace & Local model support']
    },
    {
      number: '02',
      icon: GitMerge,
      title: 'Roofline Diagnostics & Compiler Optimization',
      desc: 'The analysis engine computes layer arithmetic intensity (FLOPs/Byte) against the silicon ridge point, then simulates precision scaling (FP16, INT8, AWQ, FP8) and applies operator fusion passes.',
      codeSnippet: 'Applying rule: FusedSwiGLU + FlashAttention-2 (38 layers collapsed, memory traffic -64%)',
      actionLabel: 'Open Roofline Inspector',
      actionView: 'app-inspector',
      highlights: ['Microsecond layer flamegraph', 'AWQ / GPTQ quantization', 'Kernel fusion passes']
    },
    {
      number: '03',
      icon: Cpu,
      title: 'Multi-Silicon Simulation & Pareto Scoring',
      desc: 'Benchmark your optimized model across 30+ enterprise GPUs, NPUs, and CPUs. Evaluate Latency, Throughput (FPS), Power (Watts), and Cloud Cost per 1M Inferences to find your optimal silicon match.',
      codeSnippet: 'Pareto Optimal Match: NVIDIA RTX 4090 ($0.48/1M) | Speed SLA Met (2.34ms)',
      actionLabel: 'Compare in Hardware Sandbox',
      actionView: 'app-sandbox',
      highlights: ['NVIDIA, AMD, Qualcomm, Apple, Intel', 'TCO & Cloud vs On-Prem ROI', 'Streaming latency simulation']
    },
    {
      number: '04',
      icon: Download,
      title: 'One-Click Deployment & Container Export',
      desc: 'Download fully configured, production-tested runtime code. CorePick exports C++ and Python drivers, TensorRT engines, ONNX Runtime configs, Triton pbtxt files, and ready-to-run Docker Compose stacks.',
      codeSnippet: '$ docker compose up -d  # Spawns optimized vLLM / Triton container with CUDA graphs',
      actionLabel: 'Export Deployment Package',
      actionView: 'app-deploy',
      highlights: ['vLLM & Triton Inference Server', 'Docker & Kubernetes manifests', 'C++ / Python runtime wrappers']
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-8" id="how-it-works-root">
      <div className="max-w-6xl mx-auto w-full space-y-10">
        
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-mono font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>Audience Guide & Architectural Blueprint</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
            Who CorePick Is For & How To Use It
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
            Whether you are reducing cloud GPU bills, hunting down memory-bandwidth bottlenecks, or deploying LLMs to edge NPUs, CorePick streamlines the journey from model graph to production silicon.
          </p>

          {/* View Toggle */}
          <div className="flex items-center justify-center pt-4">
            <div className="bg-[#0D1322] border border-[#1E293B] p-1.5 rounded-2xl inline-flex gap-2">
              <button
                onClick={() => setActiveTab('audience')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'audience'
                    ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#131B2E]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Who It's For (Audience & Roles)</span>
              </button>
              <button
                onClick={() => setActiveTab('workflow')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'workflow'
                    ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#131B2E]'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>How To Use It (4-Step Workflow)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Who It's For */}
        {activeTab === 'audience' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Quick Role Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {targetAudiences.map((aud, idx) => {
                const Icon = aud.icon;
                const isSelected = selectedRole === idx;
                return (
                  <button
                    key={aud.id}
                    onClick={() => setSelectedRole(idx)}
                    className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-[#0D1322] border-cyan-400 shadow-xl shadow-cyan-500/10 scale-[1.02]'
                        : 'bg-[#0D1322]/70 border-[#1E293B] hover:border-slate-700 hover:bg-[#0D1322]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-cyan-500 text-[#07090E]' : 'bg-[#131B2E] text-cyan-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${aud.badgeColor}`}>
                        Role {idx + 1}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold font-mono text-white leading-snug">
                        {aud.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {aud.roleSubtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Role Deep Dive Detail Card */}
            {(() => {
              const currentAud = targetAudiences[selectedRole];
              const Icon = currentAud.icon;
              return (
                <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-lg">
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border ${currentAud.badgeColor}`}>
                          Primary Target Audience
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                          {currentAud.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 font-sans">
                          {currentAud.roleSubtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('app-analyze')}
                      className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#07090E] font-bold text-xs font-mono rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-2 self-start sm:self-auto"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Start With This Profile</span>
                    </button>
                  </div>

                  {/* Two Columns: Pain Points vs CorePick Solution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pain Points */}
                    <div className="bg-[#07090E] border border-rose-950/80 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase">
                        <TrendingDown className="w-4 h-4" />
                        <span>Common Engineering Challenges</span>
                      </div>
                      <ul className="space-y-3">
                        {currentAud.painPoints.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CorePick Solutions */}
                    <div className="bg-[#07090E] border border-cyan-950/80 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>How CorePick Solves It</span>
                      </div>
                      <ul className="space-y-3">
                        {currentAud.corePickSolutions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended Next Actions for this Persona */}
                  <div className="pt-4 border-t border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs font-mono text-slate-400">
                      <span className="font-bold text-white">Recommended Tools for this workflow:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {currentAud.recommendedTools.map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => onNavigate(t.view)}
                          className="px-3.5 py-1.5 bg-[#131B2E] hover:bg-cyan-950/80 text-slate-200 hover:text-cyan-300 text-xs font-mono font-bold rounded-xl border border-[#27354F] hover:border-cyan-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{t.label}</span>
                          <ArrowRight className="w-3 h-3 text-cyan-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Summary Grid */}
            <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-base font-bold font-mono text-white">Summary Comparison by Engineering Function</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#131B2E] text-cyan-300 border-b border-[#1E293B]">
                    <tr>
                      <th className="p-3">Role</th>
                      <th className="p-3">Primary Goal</th>
                      <th className="p-3">Key Metric</th>
                      <th className="p-3">CorePick Advantage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B] text-slate-300">
                    <tr>
                      <td className="p-3 font-bold text-white">ML Platform Engineer</td>
                      <td className="p-3">Fast serving & containerization</td>
                      <td className="p-3 text-cyan-400">Time-To-First-Token (TTFT)</td>
                      <td className="p-3">1-Click vLLM / Triton export</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">Performance / HPC</td>
                      <td className="p-3">Kernel optimization & fusion</td>
                      <td className="p-3 text-rose-400">FLOPs / Byte Intensity</td>
                      <td className="p-3">Microsecond layer flamegraph & roofline</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">FinOps / CTO</td>
                      <td className="p-3">Cutting cloud GPU spend</td>
                      <td className="p-3 text-amber-400">Cost / 1M Inferences</td>
                      <td className="p-3">Pareto matching & 58% bill reduction</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">Edge / Embedded</td>
                      <td className="p-3">NPUs & strict power limits</td>
                      <td className="p-3 text-emerald-400">Throughput / Watt (FPS/W)</td>
                      <td className="p-3">Qualcomm QNN / Apple Neural Engine binaries</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: How To Use It (4-Step Workflow) */}
        {activeTab === 'workflow' && (
          <div className="space-y-6 animate-fadeIn">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row items-start gap-6 hover:border-cyan-500/40 transition-all group shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-extrabold font-mono text-cyan-500/30 group-hover:text-cyan-400 transition-colors">
                      {step.number}
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-md">
                      <Icon className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-xl font-bold text-white font-mono">{step.title}</h3>
                      <button
                        onClick={() => onNavigate(step.actionView)}
                        className="self-start sm:self-auto px-4 py-1.5 bg-[#131B2E] hover:bg-cyan-500 hover:text-[#07090E] text-cyan-300 text-xs font-mono font-bold rounded-xl border border-[#27354F] transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{step.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">{step.desc}</p>

                    {/* Highlights chips */}
                    <div className="flex flex-wrap gap-2">
                      {step.highlights.map((h, hIdx) => (
                        <span key={hIdx} className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 bg-[#131B2E] text-slate-300 rounded-lg border border-[#27354F]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{h}</span>
                        </span>
                      ))}
                    </div>

                    {/* Code Snippet Box */}
                    <div className="p-3.5 bg-[#07090E] rounded-2xl border border-[#1E293B] font-mono text-xs text-emerald-400 flex items-center justify-between overflow-x-auto shadow-inner">
                      <code>{step.codeSnippet}</code>
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">CLI / Engine</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Launch Banner */}
            <div className="bg-gradient-to-r from-cyan-950 via-indigo-950 to-emerald-950 border border-cyan-800/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-white font-mono">Ready to optimize your first neural graph?</h3>
                <p className="text-xs text-slate-300">Start with our pre-loaded presets (Llama-3, YOLOv8, Whisper) or upload custom ONNX / PyTorch weights.</p>
              </div>
              <button
                onClick={() => onNavigate('app-analyze')}
                className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-[#07090E] font-bold text-xs font-mono rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer whitespace-nowrap flex items-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Launch Profiler Wizard</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

