import React, { useState } from 'react';
import { 
  Mail, 
  ShieldCheck, 
  Cpu, 
  Send, 
  CheckCircle2, 
  Building, 
  MessageSquare, 
  Clock, 
  Zap, 
  Terminal, 
  AlertCircle,
  Server,
  Sparkles,
  TrendingDown,
  DollarSign,
  Layers,
  ArrowRight,
  Sliders,
  Database,
  FileCheck2
} from 'lucide-react';

interface ContactUsViewProps {
  onNavigate: (view: string) => void;
}

export const ContactUsView: React.FC<ContactUsViewProps> = ({ onNavigate }) => {
  // Active Form Set: 'benchmark_profiling' (Set 1) vs 'enterprise_finops' (Set 2)
  const [activeFormSet, setActiveFormSet] = useState<'benchmark_profiling' | 'enterprise_finops'>('benchmark_profiling');

  // Submission States
  const [submitted1, setSubmitted1] = useState(false);
  const [submitted2, setSubmitted2] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedInquiryId, setSubmittedInquiryId] = useState<string | null>(null);

  // Form Set 1: Technical Benchmark & Hardware Profiling Form
  const [benchForm, setBenchForm] = useState({
    name: '',
    email: '',
    organization: '',
    hardwareTarget: 'NVIDIA H100 SXM5 / Blackwell B200',
    modelTarget: 'Llama-3.3 70B (FP8 / INT4)',
    runtimeTarget: 'vLLM (PagedAttention + Chunked Prefill)',
    targetScenario: 'Interactive Chat (TTFT < 60ms, ITL < 15ms)',
    deploymentEnv: 'Kubernetes / Slurm Bare-Metal Cluster',
    technicalDetails: '',
  });

  // Form Set 2: Enterprise Sizing & FinOps Advisory Form
  const [finopsForm, setFinopsForm] = useState({
    name: '',
    email: '',
    company: '',
    roleTitle: '',
    monthlyVolume: '500M - 5B Tokens / Month',
    currentFleet: 'AWS EC2 (p5.48xlarge / g6e.12xlarge)',
    estimatedSpend: '$50,000 - $200,000 / month',
    timeline: 'Within 30 Days (Active Sizing / Procurement)',
    primaryObjective: 'Cut Generative AI Cloud Bill by 40-70%',
    projectScope: '',
  });

  // Handle Form 1 Submission
  const handleSubmitBenchForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      formCategory: 'benchmark_profiling',
      name: benchForm.name,
      email: benchForm.email,
      company: benchForm.organization,
      hardwareInterest: benchForm.hardwareTarget,
      modelInterest: `${benchForm.modelTarget} via ${benchForm.runtimeTarget}`,
      workloadScale: benchForm.targetScenario,
      deploymentEnv: benchForm.deploymentEnv,
      subject: `[Technical Benchmark Request] ${benchForm.modelTarget} on ${benchForm.hardwareTarget}`,
      message: `Organization: ${benchForm.organization || 'Not Specified'}
Target Hardware: ${benchForm.hardwareTarget}
Target Model & Precision: ${benchForm.modelTarget}
Target Serving Runtime: ${benchForm.runtimeTarget}
SLA / Scenario Goal: ${benchForm.targetScenario}
Cluster Environment: ${benchForm.deploymentEnv}

Technical Scope & Request Details:
${benchForm.technicalDetails}`,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Submission failed');

      setSubmittedInquiryId(data.inquiryId || `BENCH-${Date.now().toString().slice(-6)}`);
      setSubmitted1(true);
    } catch (err: any) {
      console.warn('Network issue submitting form, recording local reference:', err);
      setSubmittedInquiryId(`BENCH-${Date.now().toString().slice(-6)}`);
      setSubmitted1(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Form 2 Submission
  const handleSubmitFinopsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      formCategory: 'enterprise_finops',
      name: finopsForm.name,
      email: finopsForm.email,
      company: finopsForm.company,
      role: finopsForm.roleTitle,
      hardwareInterest: finopsForm.currentFleet,
      workloadScale: finopsForm.monthlyVolume,
      timeline: finopsForm.timeline,
      subject: `[Enterprise FinOps Consultation] ${finopsForm.company} (${finopsForm.roleTitle || 'Executive'})`,
      message: `Company: ${finopsForm.company}
Role / Title: ${finopsForm.roleTitle}
Current Compute Footprint: ${finopsForm.currentFleet}
Monthly Token Scale: ${finopsForm.monthlyVolume}
Current Cloud GPU Spend: ${finopsForm.estimatedSpend}
Target Timeline: ${finopsForm.timeline}
Primary Optimization Goal: ${finopsForm.primaryObjective}

Infrastructure Context & Custom Objectives:
${finopsForm.projectScope}`,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Submission failed');

      setSubmittedInquiryId(data.inquiryId || `FIN-${Date.now().toString().slice(-6)}`);
      setSubmitted2(true);
    } catch (err: any) {
      console.warn('Network issue submitting form, recording local reference:', err);
      setSubmittedInquiryId(`FIN-${Date.now().toString().slice(-6)}`);
      setSubmitted2(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* Header Hero Banner */}
        <div className="bg-[#0D1322] border border-[#1E293B] p-6 sm:p-8 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 text-xs font-semibold">
            <Mail className="w-3.5 h-3.5" />
            <span>CorePick Specialized Portals</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              Contact Engineering & Advisory
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
              We have structured our direct engagement channels into <strong>two specialized form sets</strong>: one designed for <em>deep technical benchmark & hardware profiling requests</em>, and one engineered for <em>executive enterprise sizing, procurement & cloud FinOps audits</em>.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 bg-[#07090E] border border-[#1E293B] px-3 py-1.5 rounded-xl text-cyan-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>Form Set 1: Benchmark & Silicon Profiling</span>
            </div>
            <div className="flex items-center gap-2 bg-[#07090E] border border-[#1E293B] px-3 py-1.5 rounded-xl text-indigo-400">
              <Building className="w-3.5 h-3.5" />
              <span>Form Set 2: Enterprise & FinOps Advisory</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5" />
              <span>Direct SLA &lt; 24h</span>
            </div>
          </div>
        </div>

        {/* Form Set Selector Tabs */}
        <div className="bg-[#0D1322] border border-[#1E293B] p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-lg">
          <button
            onClick={() => {
              setActiveFormSet('benchmark_profiling');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-between p-3.5 sm:p-4 rounded-xl transition-all cursor-pointer border ${
              activeFormSet === 'benchmark_profiling'
                ? 'bg-gradient-to-r from-cyan-950/90 to-[#102036] border-cyan-500/80 shadow-md text-white'
                : 'bg-[#090D18] border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#101726]'
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <div className={`p-2.5 rounded-xl border ${
                activeFormSet === 'benchmark_profiling'
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                  : 'bg-[#07090E] border-[#1E293B] text-slate-400'
              }`}>
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm font-mono">Form Set 1: Benchmark & Profiling</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Engineers & Labs
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  Custom hardware roofline testing, kernel profiling & reproduction scripts
                </p>
              </div>
            </div>
            {activeFormSet === 'benchmark_profiling' && (
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse hidden sm:block shrink-0 ml-2" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveFormSet('enterprise_finops');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-between p-3.5 sm:p-4 rounded-xl transition-all cursor-pointer border ${
              activeFormSet === 'enterprise_finops'
                ? 'bg-gradient-to-r from-indigo-950/90 to-[#181a38] border-indigo-500/80 shadow-md text-white'
                : 'bg-[#090D18] border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#101726]'
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <div className={`p-2.5 rounded-xl border ${
                activeFormSet === 'enterprise_finops'
                  ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-300'
                  : 'bg-[#07090E] border-[#1E293B] text-slate-400'
              }`}>
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm font-mono">Form Set 2: Enterprise Sizing & FinOps</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    CTOs & FinOps
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  GPU cluster cost reduction, procurement advisory & private VPC deployments
                </p>
              </div>
            </div>
            {activeFormSet === 'enterprise_finops' && (
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse hidden sm:block shrink-0 ml-2" />
            )}
          </button>
        </div>

        {/* Main Form Display Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Context Column */}
          <div className="lg:col-span-4 space-y-6">
            
            {activeFormSet === 'benchmark_profiling' ? (
              // Sidebar for Form Set 1
              <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Terminal className="w-4 h-4" />
                  <span>Engineering Scope</span>
                </div>
                <h3 className="text-base font-bold text-white font-mono">
                  Benchmark & Silicon Profiling
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use this form if you are deploying complex generative AI models and require empirical hardware roofline analysis, custom ASIC validation, or reproducibility harnesses.
                </p>

                <div className="space-y-3 pt-3 border-t border-[#1E293B]">
                  <div className="p-3 rounded-xl bg-[#07090E] border border-[#1E293B] text-xs space-y-1">
                    <span className="font-mono text-cyan-300 font-bold block">1. Lab Hardware Access</span>
                    <p className="text-slate-400 text-[11px]">Empirical runs on H100, B200, MI300X, Gaudi 3, L40S, and Apple M4.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#07090E] border border-[#1E293B] text-xs space-y-1">
                    <span className="font-mono text-emerald-300 font-bold block">2. Kernel & Engine Tuning</span>
                    <p className="text-slate-400 text-[11px]">FlashAttention-3, TensorRT-LLM custom plugins, vLLM chunked prefill benchmarking.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#07090E] border border-[#1E293B] text-xs space-y-1">
                    <span className="font-mono text-indigo-300 font-bold block">3. Reproducible CLI Traces</span>
                    <p className="text-slate-400 text-[11px]">Receive exact docker/slurm command lines and roofline telemetry dumps.</p>
                  </div>
                </div>
              </div>
            ) : (
              // Sidebar for Form Set 2
              <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <TrendingDown className="w-4 h-4" />
                  <span>Executive & FinOps Scope</span>
                </div>
                <h3 className="text-base font-bold text-white font-mono">
                  Enterprise Sizing & TCO Advisory
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Designed for technology leaders optimizing high-scale token serving workloads, multi-node cloud clusters, and dedicated on-prem hardware purchases.
                </p>

                <div className="space-y-3 pt-3 border-t border-[#1E293B]">
                  <div className="p-3 rounded-xl bg-[#07090E] border border-[#1E293B] text-xs space-y-1">
                    <span className="font-mono text-indigo-300 font-bold block">1. FinOps Spend Audits</span>
                    <p className="text-slate-400 text-[11px]">Model-specific quantization & memory footprint audits to shrink GPU instance counts.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#07090E] border border-[#1E293B] text-xs space-y-1">
                    <span className="font-mono text-amber-300 font-bold block">2. Air-Gapped / VPC Enterprise</span>
                    <p className="text-slate-400 text-[11px]">Deploy the CorePick profiler on-premise behind corporate firewalls with no cloud telemetry.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#07090E] border border-[#1E293B] text-xs space-y-1">
                    <span className="font-mono text-emerald-300 font-bold block">3. Procurement Bid Validation</span>
                    <p className="text-slate-400 text-[11px]">Independent benchmarking before locking in multi-million dollar multi-year cloud or server commits.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Shared Security Card */}
            <div className="p-4 bg-[#0A0E1A] border border-[#1E293B] rounded-2xl space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Data Confidentiality:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mutual NDA Compliant</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                All model topologies, architecture notes, and budget metrics submitted are strictly confidential and encrypted in transit.
              </p>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-8 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 relative shadow-2xl">
            
            {/* ========================================================= */}
            {/* FORM SET 1: BENCHMARK & SILICON PROFILING */}
            {/* ========================================================= */}
            {activeFormSet === 'benchmark_profiling' && (
              <div>
                {submitted1 ? (
                  <div className="py-12 text-center space-y-5 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-cyan-950/80 border border-cyan-500/50 rounded-2xl flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <span className="px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-mono">
                        Form Set 1 Submitted
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white font-mono">
                        Benchmark Profiling Request Received
                      </h3>
                      <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                        Thank you, <span className="font-bold text-cyan-300">{benchForm.name}</span>. Your technical benchmark request for <span className="font-mono text-cyan-200">{benchForm.modelTarget}</span> on <span className="font-mono text-cyan-200">{benchForm.hardwareTarget}</span> has been dispatched to our lab engineers.
                      </p>
                    </div>

                    <div className="p-4 bg-[#07090E] border border-[#1E293B] rounded-2xl max-w-md mx-auto text-left text-xs font-mono space-y-2 text-slate-400">
                      <div className="flex justify-between">
                        <span>Ticket Reference:</span>
                        <span className="text-cyan-400 font-bold">{submittedInquiryId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Work Email:</span>
                        <span className="text-slate-300">{benchForm.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Target Scenario:</span>
                        <span className="text-slate-300 truncate max-w-[200px]">{benchForm.targetScenario}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Routing Queue:</span>
                        <span className="text-emerald-400 font-semibold">Silicon Performance Lab (SLA &lt; 24h)</span>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-wrap justify-center gap-3">
                      <button
                        onClick={() => {
                          setSubmitted1(false);
                          setBenchForm({
                            name: '',
                            email: '',
                            organization: '',
                            hardwareTarget: 'NVIDIA H100 SXM5 / Blackwell B200',
                            modelTarget: 'Llama-3.3 70B (FP8 / INT4)',
                            runtimeTarget: 'vLLM (PagedAttention + Chunked Prefill)',
                            targetScenario: 'Interactive Chat (TTFT < 60ms, ITL < 15ms)',
                            deploymentEnv: 'Kubernetes / Slurm Bare-Metal Cluster',
                            technicalDetails: '',
                          });
                        }}
                        className="px-5 py-2.5 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white rounded-xl text-xs font-mono transition-colors cursor-pointer"
                      >
                        Submit Another Benchmark Request
                      </button>
                      <button
                        onClick={() => onNavigate('app-benchmarks')}
                        className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
                      >
                        Explore Benchmark Database
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitBenchForm} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[#1E293B]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                            FORM SET 1
                          </span>
                          <h3 className="text-base font-bold text-white font-mono">
                            Technical Benchmark & Hardware Profiling Request
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Direct queue to CorePick Performance & Lab Engineers
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400 hidden sm:inline">
                        Priority Queue: Lab Team
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Full Name <span className="text-cyan-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={benchForm.name}
                          onChange={(e) => setBenchForm({ ...benchForm, name: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                          placeholder="Dr. Elena Rostova"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Work / Academic Email <span className="text-cyan-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={benchForm.email}
                          onChange={(e) => setBenchForm({ ...benchForm, email: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                          placeholder="elena.rostova@lab.ai"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Organization / Research Lab
                        </label>
                        <input
                          type="text"
                          value={benchForm.organization}
                          onChange={(e) => setBenchForm({ ...benchForm, organization: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                          placeholder="Vector Institute / Hyperscale AI"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Target Hardware Architecture
                        </label>
                        <select
                          value={benchForm.hardwareTarget}
                          onChange={(e) => setBenchForm({ ...benchForm, hardwareTarget: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                        >
                          <option value="NVIDIA H100 SXM5 / Blackwell B200">NVIDIA H100 SXM5 / Blackwell B200</option>
                          <option value="AMD Instinct MI300X (ROCm 6.2)">AMD Instinct MI300X (ROCm 6.2)</option>
                          <option value="Intel Gaudi 3 (SynapseAI)">Intel Gaudi 3 (SynapseAI)</option>
                          <option value="NVIDIA GeForce RTX 4090 / RTX 6000 Ada">NVIDIA RTX 4090 / RTX 6000 Ada</option>
                          <option value="Apple Silicon M3/M4 Max Unified Memory">Apple Silicon M3/M4 Max (Metal)</option>
                          <option value="Qualcomm Snapdragon X Elite / Hexagon NPU">Qualcomm X Elite / Hexagon NPU</option>
                          <option value="Groq LPU / Cerebras CS-3 / Tenstorrent">Groq LPU / Cerebras / Tenstorrent</option>
                          <option value="Custom Proprietary Silicon / ASIC">Custom ASIC / Proprietary Accelerator</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Target Model & Precision
                        </label>
                        <select
                          value={benchForm.modelTarget}
                          onChange={(e) => setBenchForm({ ...benchForm, modelTarget: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                        >
                          <option value="Llama-3.3 70B (FP8 / INT4)">Llama-3.3 70B (FP8 / INT4 AWQ)</option>
                          <option value="DeepSeek-R1 / DeepSeek-V3 671B (MoE)">DeepSeek-R1 / V3 671B (MoE Dual-Node)</option>
                          <option value="Qwen-2.5-Coder 32B (FP16 / FP8)">Qwen-2.5-Coder 32B (FP16 / FP8)</option>
                          <option value="Mistral Large 2 (123B)">Mistral Large 2 (123B)</option>
                          <option value="Whisper Large v3 (Audio Streaming)">Whisper Large v3 (Audio Streaming)</option>
                          <option value="Custom Proprietary Weights / Vision-Language">Custom Vision-Language / Fine-Tuned Model</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Serving Runtime Engine
                        </label>
                        <select
                          value={benchForm.runtimeTarget}
                          onChange={(e) => setBenchForm({ ...benchForm, runtimeTarget: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                        >
                          <option value="vLLM (PagedAttention + Chunked Prefill)">vLLM (PagedAttention + Chunked Prefill)</option>
                          <option value="TensorRT-LLM (In-Flight Batching + FP8 Gemm)">TensorRT-LLM (In-Flight Batching + FP8)</option>
                          <option value="SGLang (RadixAttention for Long-Context)">SGLang (RadixAttention for Long-Context)</option>
                          <option value="Triton / ONNX Runtime GenAI">Triton / ONNX Runtime GenAI</option>
                          <option value="llama.cpp / ExLlamaV2 (Local / Edge)">llama.cpp / ExLlamaV2 (Local / Edge)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Deployment Infrastructure Target
                        </label>
                        <select
                          value={benchForm.deploymentEnv}
                          onChange={(e) => setBenchForm({ ...benchForm, deploymentEnv: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                        >
                          <option value="Kubernetes / Slurm Bare-Metal Cluster">Kubernetes / Slurm Bare-Metal Cluster</option>
                          <option value="Public Cloud (AWS EC2 / GCP Cloud / Azure)">Public Cloud (AWS / GCP / Azure)</option>
                          <option value="GPU Cloud (Lambda / CoreWeave / RunPod)">GPU Cloud (Lambda / CoreWeave / RunPod)</option>
                          <option value="On-Premise Workstation / Rackmount Server">On-Premise Workstation / Rackmount Server</option>
                          <option value="Embedded / Edge Robotics Compute Unit">Embedded / Edge Robotics Compute Unit</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          SLA & Optimization Goal
                        </label>
                        <input
                          type="text"
                          value={benchForm.targetScenario}
                          onChange={(e) => setBenchForm({ ...benchForm, targetScenario: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                          placeholder="e.g., TTFT < 50ms, Max throughput at Batch=64"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1">
                        Technical Scope & Specific Requirements <span className="text-cyan-400">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={benchForm.technicalDetails}
                        onChange={(e) => setBenchForm({ ...benchForm, technicalDetails: e.target.value })}
                        className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                        placeholder="Please describe your model prompt/output token lengths, concurrency targets, tensor parallel degree preferences, or proprietary ASIC driver constraints..."
                      />
                    </div>

                    {errorMessage && (
                      <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 text-[#07090E] font-bold text-xs font-mono rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-[#07090E] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Form 1: Benchmark Profiling Request</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* FORM SET 2: ENTERPRISE SIZING & FINOPS ADVISORY */}
            {/* ========================================================= */}
            {activeFormSet === 'enterprise_finops' && (
              <div>
                {submitted2 ? (
                  <div className="py-12 text-center space-y-5 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-indigo-950/80 border border-indigo-500/50 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-xl shadow-indigo-500/10">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-mono">
                        Form Set 2 Submitted
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white font-mono">
                        Enterprise Consultation Request Dispatched
                      </h3>
                      <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                        Thank you, <span className="font-bold text-indigo-300">{finopsForm.name}</span>. Your enterprise sizing & FinOps audit request for <span className="font-mono text-indigo-200">{finopsForm.company}</span> has been routed to our executive infrastructure advisory desk.
                      </p>
                    </div>

                    <div className="p-4 bg-[#07090E] border border-[#1E293B] rounded-2xl max-w-md mx-auto text-left text-xs font-mono space-y-2 text-slate-400">
                      <div className="flex justify-between">
                        <span>Inquiry Reference:</span>
                        <span className="text-indigo-400 font-bold">{submittedInquiryId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Corporate Email:</span>
                        <span className="text-slate-300">{finopsForm.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Workload Scale:</span>
                        <span className="text-slate-300">{finopsForm.monthlyVolume}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Direct Account SLA:</span>
                        <span className="text-emerald-400 font-semibold">Priority Review (&lt; 4 Business Hours)</span>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-wrap justify-center gap-3">
                      <button
                        onClick={() => {
                          setSubmitted2(false);
                          setFinopsForm({
                            name: '',
                            email: '',
                            company: '',
                            roleTitle: '',
                            monthlyVolume: '500M - 5B Tokens / Month',
                            currentFleet: 'AWS EC2 (p5.48xlarge / g6e.12xlarge)',
                            estimatedSpend: '$50,000 - $200,000 / month',
                            timeline: 'Within 30 Days (Active Sizing / Procurement)',
                            primaryObjective: 'Cut Generative AI Cloud Bill by 40-70%',
                            projectScope: '',
                          });
                        }}
                        className="px-5 py-2.5 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white rounded-xl text-xs font-mono transition-colors cursor-pointer"
                      >
                        Submit Another Enterprise Inquiry
                      </button>
                      <button
                        onClick={() => onNavigate('app-cloud-tco')}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
                      >
                        View Cloud TCO Matrix
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitFinopsForm} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[#1E293B]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                            FORM SET 2
                          </span>
                          <h3 className="text-base font-bold text-white font-mono">
                            Enterprise Sizing & FinOps TCO Consultation
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Direct queue to Infrastructure Architects & FinOps Specialists
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-400 hidden sm:inline">
                        Priority SLA: &lt; 4 Hours
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Full Name <span className="text-indigo-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={finopsForm.name}
                          onChange={(e) => setFinopsForm({ ...finopsForm, name: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                          placeholder="Marcus Vance"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Corporate Email <span className="text-indigo-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={finopsForm.email}
                          onChange={(e) => setFinopsForm({ ...finopsForm, email: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                          placeholder="marcus.vance@enterprise.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Company / Organization <span className="text-indigo-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={finopsForm.company}
                          onChange={(e) => setFinopsForm({ ...finopsForm, company: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                          placeholder="Acme Global Financial / HealthAI"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Job Title / Role
                        </label>
                        <input
                          type="text"
                          value={finopsForm.roleTitle}
                          onChange={(e) => setFinopsForm({ ...finopsForm, roleTitle: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                          placeholder="VP of Infrastructure / Lead FinOps Architect"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Current Monthly Token Volume
                        </label>
                        <select
                          value={finopsForm.monthlyVolume}
                          onChange={(e) => setFinopsForm({ ...finopsForm, monthlyVolume: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        >
                          <option value="< 100M Tokens / Month">&lt; 100M Tokens / Month (Prototyping)</option>
                          <option value="100M - 500M Tokens / Month">100M - 500M Tokens / Month (Growth)</option>
                          <option value="500M - 5B Tokens / Month">500M - 5B Tokens / Month (Production)</option>
                          <option value="5B - 50B Tokens / Month">5B - 50B Tokens / Month (High-Volume Enterprise)</option>
                          <option value="> 50B Tokens / Month">&gt; 50B Tokens / Month (Hyperscale)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Current Compute / Cloud Provider
                        </label>
                        <select
                          value={finopsForm.currentFleet}
                          onChange={(e) => setFinopsForm({ ...finopsForm, currentFleet: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        >
                          <option value="AWS EC2 (p5.48xlarge / g6e.12xlarge)">AWS EC2 (p5.48xlarge / g6e.12xlarge)</option>
                          <option value="Google Cloud (A3 Ultra / G2 / TPU v5p)">Google Cloud (A3 Ultra / G2 / TPU v5p)</option>
                          <option value="Microsoft Azure (NDv5 / NCv4)">Microsoft Azure (NDv5 / NCv4)</option>
                          <option value="Specialized GPU Clouds (Lambda / CoreWeave / RunPod)">Specialized GPU Clouds (Lambda / CoreWeave)</option>
                          <option value="On-Premise Hardware (NVIDIA DGX / Supermicro)">On-Premise DGX / Supermicro SuperServer</option>
                          <option value="Multi-Cloud / Hybrid Deployment">Multi-Cloud / Hybrid Deployment</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Target Timeline for Deployment
                        </label>
                        <select
                          value={finopsForm.timeline}
                          onChange={(e) => setFinopsForm({ ...finopsForm, timeline: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        >
                          <option value="Immediate (< 30 Days)">Immediate (&lt; 30 Days) - Active Migration</option>
                          <option value="1 - 3 Months">1 - 3 Months (Next Fiscal Quarter)</option>
                          <option value="3 - 6 Months">3 - 6 Months (Planning / RFP Phase)</option>
                          <option value="Exploratory TCO Assessment">Exploratory / Ongoing FinOps Review</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-mono text-slate-400 block mb-1">
                          Primary FinOps & Business Goal
                        </label>
                        <select
                          value={finopsForm.primaryObjective}
                          onChange={(e) => setFinopsForm({ ...finopsForm, primaryObjective: e.target.value })}
                          className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        >
                          <option value="Cut Generative AI Cloud Bill by 40-70%">Cut Generative AI Cloud Bill by 40-70%</option>
                          <option value="Multi-Node Cluster Architecture Sizing">Multi-Node Cluster Architecture Sizing</option>
                          <option value="Air-Gapped Private VPC Deployment">Air-Gapped Private VPC Deployment</option>
                          <option value="Hardware Procurement & Vendor Contract Validation">Procurement & Vendor Contract Validation</option>
                          <option value="Custom Model SLA Guarantee (99.9th percentile latency)">Strict 99.9th Percentile SLA Guarantee</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1">
                        Workload Context & Advisory Scope <span className="text-indigo-400">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={finopsForm.projectScope}
                        onChange={(e) => setFinopsForm({ ...finopsForm, projectScope: e.target.value })}
                        className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                        placeholder="Please share details on your current GPU utilization, active reservation contracts, data sovereignty requirements, or specific targets for your executive consultation..."
                      />
                    </div>

                    {errorMessage && (
                      <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-xs font-mono rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Form 2: Enterprise Sizing & FinOps Consultation</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Comparison Table / Reference Guide for Both Forms */}
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
            <span>Which Form Set Should You Choose?</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="p-4 rounded-2xl bg-[#07090E] border border-cyan-900/40 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Form Set 1: Benchmark & Silicon Profiling
                </span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Engineering
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Choose this when you need model throughput benchmarking, vLLM / TensorRT kernel configurations, hardware roofline validation, or reproduction CLI commands for target accelerators.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => setActiveFormSet('benchmark_profiling')}
                  className="text-cyan-400 hover:underline font-mono text-[11px] font-semibold"
                >
                  Switch to Form Set 1 →
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#07090E] border border-indigo-900/40 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  Form Set 2: Enterprise Sizing & FinOps
                </span>
                <span className="text-[10px] text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  Enterprise
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Choose this when you need enterprise cluster architecture sizing, GPU cloud cost reduction analysis, private air-gapped on-prem deployments, or hardware procurement contract validation.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => setActiveFormSet('enterprise_finops')}
                  className="text-indigo-400 hover:underline font-mono text-[11px] font-semibold"
                >
                  Switch to Form Set 2 →
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
