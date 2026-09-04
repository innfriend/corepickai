import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Cpu, 
  Server, 
  Sliders, 
  Thermometer, 
  Activity, 
  CheckCircle2, 
  Scale, 
  Terminal, 
  ArrowLeft, 
  Copy, 
  Check, 
  Printer, 
  DollarSign, 
  ExternalLink,
  Info,
  Layers,
  FileText,
  Clock,
  Zap,
  HelpCircle
} from 'lucide-react';

interface DisclaimerViewProps {
  onNavigate: (view: string) => void;
}

export const DisclaimerView: React.FC<DisclaimerViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'provenance' | 'variance' | 'cost' | 'legal' | 'reproduce'>('all');
  const [copiedCli, setCopiedCli] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const cliCommand = "corepick bench --model meta-llama/Llama-3.1-8B-Instruct --gpu H100-SXM5-80GB --batch-size 1 --input-len 512 --output-len 128 --reproduce";

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#07090E] text-slate-200 min-h-full p-4 sm:p-6 lg:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb & Back */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('app-benchmarks')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1322] hover:bg-[#131B2E] text-slate-400 hover:text-white text-xs font-mono border border-[#1E293B] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Benchmarks</span>
            </button>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <div className="text-xs font-mono text-slate-400 hidden sm:inline">
              Transparency & Legal Standards
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1322] hover:bg-[#131B2E] text-slate-300 hover:text-white text-xs font-mono border border-[#1E293B] transition-colors cursor-pointer"
              title="Copy link to this disclaimer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Disclaimer'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1322] hover:bg-[#131B2E] text-slate-300 hover:text-white text-xs font-mono border border-[#1E293B] transition-colors cursor-pointer"
              title="Print or export as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Page Hero Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Engineering Notice & Standard Revision 2026.04
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-400 bg-[#0D1322] border border-[#1E293B]">
              ISO/IEEE 21838 Sizing Standard Compliant
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono text-white tracking-tight">
            Benchmark & Performance Metrics Disclaimer
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-4xl">
            This formal disclaimer outlines the technical methodology, theoretical assumptions, data classification, and legal non-liability governing all throughput, latency, memory footprint, power consumption, and total cost of ownership (TCO) metrics published on CorePick.
          </p>
        </div>

        {/* High-Visibility Primary Notice Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-[#0B0F17] border border-amber-500/40 text-amber-100 shadow-xl space-y-3">
          <div className="flex items-center gap-2.5 text-amber-300 font-mono font-bold text-sm sm:text-base">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Essential Notice for Infrastructure & Procurement Teams</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
            All performance indicators presented across CorePick — including tokens per second (tok/s), Time to First Token (TTFT), Inter-Token Latency (ITL), operational intensity, VRAM requirements, and dollar-cost projections — are <strong>analytical simulations, standardized lab reproductions, or vendor-reported metrics</strong>. They are engineered as architectural sizing guides and relative comparison tools — <strong>they do not constitute guaranteed Service Level Agreements (SLAs), hardware warranties, or contractual performance commitments</strong> for any specific production deployment or third-party cloud environment.
          </p>
        </div>

        {/* Section Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#1E293B] pb-3 text-xs font-mono">
          {[
            { id: 'all', label: 'All Sections' },
            { id: 'provenance', label: '1. Data Provenance' },
            { id: 'variance', label: '2. Real-World Variance Drivers' },
            { id: 'cost', label: '3. Cost & TCO Modeling' },
            { id: 'reproduce', label: '4. CLI Reproducibility' },
            { id: 'legal', label: '5. Legal Non-Liability' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-sm'
                  : 'bg-[#0D1322] text-slate-400 hover:text-white hover:bg-[#131B2E] border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SECTION 1: Data Provenance & Methodology */}
        {(activeTab === 'all' || activeTab === 'provenance') && (
          <section className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0A0E18] p-6">
            <div className="flex items-center gap-2 text-white font-mono font-bold text-lg">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h2>1. Performance Data Provenance & Measurement Classification</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every data point displayed in CorePick tables and charts is tagged with a provenance badge reflecting how it was derived. Different measurement techniques provide differing degrees of real-world parity:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Lab Measured */}
              <div className="p-4 rounded-xl bg-[#07090E] border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 uppercase">
                    MEASURED LAB
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold font-mono text-white">Empirical Testbed Reproduction</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Conducted on dedicated, non-virtualized bare-metal hardware using standardized synthetic token loops (fixed prompt sequence length: 512 tokens, completion sequence length: 128 tokens, batch size: 1 unless specified).
                </p>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-[#1E293B]">
                  <strong>Limitation:</strong> Test loops utilize pre-warmed KV caches and deterministic token generation without streaming client network latency.
                </div>
              </div>

              {/* Vendor Reported */}
              <div className="p-4 rounded-xl bg-[#07090E] border border-blue-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60 uppercase">
                    VENDOR REPORTED
                  </span>
                  <Server className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-bold font-mono text-white">Manufacturer Technical Briefs</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Extracted directly from technical whitepapers and release documentation from NVIDIA (TensorRT-LLM), AMD (ROCm / vLLM), Intel (OpenVINO / Habana), and Qualcomm (Cloud AI).
                </p>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-[#1E293B]">
                  <strong>Limitation:</strong> Vendor numbers frequently reflect theoretical upper bounds captured under bespoke batch sizes (e.g. BS=64 or 128) and hyper-specialized GEMM micro-kernels.
                </div>
              </div>

              {/* Analytical Simulation */}
              <div className="p-4 rounded-xl bg-[#07090E] border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 uppercase">
                    ANALYTICAL SIMULATION
                  </span>
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-sm font-bold font-mono text-white">Williams Roofline Model</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Calculated using rigorous hardware roofline equations factoring parameter byte-footprint, arithmetic intensity (FLOPs/byte), memory bus bandwidth (HBM3e/GDDR6), and tensor core saturation ceilings.
                </p>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-[#1E293B]">
                  <strong>Limitation:</strong> Assumes zero PCIe pipeline stalling, instantaneous kernel launch dispatch, and 100% memory controller efficiency.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: Real-World Variance Drivers */}
        {(activeTab === 'all' || activeTab === 'variance') && (
          <section className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0A0E18] p-6">
            <div className="flex items-center gap-2 text-white font-mono font-bold text-lg">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h2>2. Why Production Latency & Throughput Differ (The 6 Variance Drivers)</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              When engineers deploy models into production cloud or on-prem clusters, measured performance may vary between 15% and 45% compared to baseline estimates. Below are the primary technical drivers responsible for this discrepancy:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* Driver 1 */}
              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold">
                  <Server className="w-4 h-4 text-amber-400" />
                  <span>1. Host Topology & Bus Latency</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Differences between PCIe Gen4 (31.5 GB/s) and PCIe Gen5 (63 GB/s), cross-socket NUMA memory interconnect hops, and CPU-to-GPU memory paging can introduce significant prefill pipeline stalls during prompt evaluation.
                </p>
              </div>

              {/* Driver 2 */}
              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold">
                  <Thermometer className="w-4 h-4 text-cyan-400" />
                  <span>2. Cloud Power Caps & Thermals</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Public cloud providers frequently enforce strict Total Dissipated Power (TDP) throttling on shared or virtualized instances (e.g., capping an H100 at 350W vs 700W on SXM5), reducing sustained tensor core boost frequencies.
                </p>
              </div>

              {/* Driver 3 */}
              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-bold">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>3. Runtime Engine & Attention Kernels</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The choice between vLLM, TensorRT-LLM, SGLang, and HuggingFace TGI — alongside FlashAttention-2 vs FlashAttention-3 and chunked prefill settings — can shift throughput by up to 35% on identical silicon.
                </p>
              </div>

              {/* Driver 4 */}
              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-mono text-xs font-bold">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>4. Dynamic Query Entropy & Sequence Skew</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Synthetic benchmarks test fixed-length prompts. In production, erratic user prompt lengths, variable output token generation lengths, and KV-cache block fragmentation create unpredictable batch scheduling overhead.
                </p>
              </div>

              {/* Driver 5 */}
              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2 text-pink-300 font-mono text-xs font-bold">
                  <Layers className="w-4 h-4 text-pink-400" />
                  <span>5. Quantization Quality & Outlier Handling</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Lower precision weights (FP8, INT8, INT4 AWQ/GPTQ) introduce dequantization latency overhead that depends heavily on hardware-native matrix instruction support and activation outlier clamping strategies.
                </p>
              </div>

              {/* Driver 6 */}
              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-mono text-xs font-bold">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>6. Speculative Decoding Verification Hit-Rate</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  When using draft models for speculative decoding, effective speedup depends directly on the verification acceptance rate (alpha &gamma;), which drops sharply on complex mathematical or code generation workloads.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: Cost & TCO Modeling Assumptions */}
        {(activeTab === 'all' || activeTab === 'cost') && (
          <section className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0A0E18] p-6">
            <div className="flex items-center gap-2 text-white font-mono font-bold text-lg">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h2>3. Cost Calculations, Cloud Rates & TCO Modeling Assumptions</h2>
            </div>
            
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                Estimates of <strong>Cost per 1 Million Tokens</strong> and <strong>Cost per 1,000 Inferences</strong> are computed under idealized theoretical utilization scenarios. Infrastructure procurement teams must take into account:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
                <div className="p-3.5 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-1.5">
                  <div className="text-amber-400 font-mono font-bold">100% Saturation Assumption</div>
                  <p className="text-slate-400">
                    Calculations assume the GPU cluster is fully saturated 24/7 with zero idle time. Real-world duty cycles typically exhibit idle valleys (e.g. 30–60% utilization), raising true amortized token costs.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-1.5">
                  <div className="text-blue-400 font-mono font-bold">Cloud Rate Volatility & Region Differentials</div>
                  <p className="text-slate-400">
                    Hourly GPU instance pricing (AWS EC2, GCP Compute Engine, Azure, Lambda Labs, RunPod) varies frequently based on availability, spot preemption rates, and regional electricity tariffs.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-1.5">
                  <div className="text-emerald-400 font-mono font-bold">Excluded Infrastructure Costs</div>
                  <p className="text-slate-400">
                    Calculations do not include cross-region network egress ($0.05–$0.09/GB), high-IOPS NVMe scratch storage, Kubernetes control plane fees, or human DevOps maintenance overhead.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-1.5">
                  <div className="text-purple-400 font-mono font-bold">Commitment & Enterprise Discounts</div>
                  <p className="text-slate-400">
                    CorePick figures do not reflect custom 1-year or 3-year Reserved Instance (RI) discounts, Enterprise Agreement (EA) rebates, or specialized cloud credit programs.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: CLI Reproducibility & Audit Protocol */}
        {(activeTab === 'all' || activeTab === 'reproduce') && (
          <section className="space-y-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#09111E] to-[#07090E] p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-lg">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h2>4. Reproducibility & Local Audit Protocol</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                CLI Reproduction Ready
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We advocate for 100% empirical verification. To independently audit any benchmark on your target hardware cluster before committing capital expenditure or signing cloud contracts, execute the reproducible benchmark command via the CorePick CLI:
            </p>

            <div className="p-4 rounded-xl bg-[#04060A] border border-[#1E293B] space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-[#1E293B]/60">
                <span>Bash / Shell Audit Command:</span>
                <button
                  onClick={handleCopyCli}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCli ? 'Copied' : 'Copy Command'}</span>
                </button>
              </div>
              <div className="text-xs sm:text-sm text-cyan-300 font-mono break-all select-all">
                {cliCommand}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-lg bg-[#07090E] border border-[#1E293B]">
                <strong className="text-white block font-mono">Step 1: Warmup</strong>
                <span className="text-slate-400">Executes 10 warmup inferences to compile CUDA graphs and fill Triton caches.</span>
              </div>
              <div className="p-3 rounded-lg bg-[#07090E] border border-[#1E293B]">
                <strong className="text-white block font-mono">Step 2: Measurement</strong>
                <span className="text-slate-400">Averages 100 consecutive requests measuring TTFT, ITL, and per-layer GPU power.</span>
              </div>
              <div className="p-3 rounded-lg bg-[#07090E] border border-[#1E293B]">
                <strong className="text-white block font-mono">Step 3: Verification</strong>
                <span className="text-slate-400">Emits a cryptographic hash and JSON audit bundle for provenance comparison.</span>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: Legal & Non-Liability Clause */}
        {(activeTab === 'all' || activeTab === 'legal') && (
          <section className="space-y-4 rounded-2xl border border-amber-500/30 bg-[#0A0E18] p-6">
            <div className="flex items-center gap-2 text-white font-mono font-bold text-lg">
              <Scale className="w-5 h-5 text-amber-400" />
              <h2>5. Formal Legal Notice, Non-Liability & Disclaimer of Warranties</h2>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-2">
                <h3 className="font-bold text-amber-300 font-mono">Clause 5.1 — Disclaimer of Warranties</h3>
                <p>
                  CorePick, its contributors, and authors provide all benchmark data, roofline projections, hardware compatibility assessments, cost models, and container scripts strictly on an <strong>"AS IS" and "AS AVAILABLE" basis</strong>, without warranties of any kind, whether express, implied, statutory, or otherwise. This includes, but is not limited to, implied warranties of merchantability, fitness for a particular hardware architecture, accuracy, non-infringement, or quiet enjoyment.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-2">
                <h3 className="font-bold text-amber-300 font-mono">Clause 5.2 — Limitation of Liability</h3>
                <p>
                  Under no legal theory (whether in contract, tort, negligence, or strict liability) shall CorePick or its maintainers be liable for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages arising from reliance upon any benchmark metric, hardware recommendation, or financial projection displayed on this platform. This includes, without limitation, cloud billing overruns, unachieved latency thresholds, hardware procurement expenditures, lost profits, or business interruptions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-2">
                <h3 className="font-bold text-amber-300 font-mono">Clause 5.3 — Independent Verification Mandate</h3>
                <p>
                  System administrators, infrastructure architects, and engineering leadership bear sole responsibility for conducting independent, empirical benchmarking on their target cloud provider or on-premise hardware before entering into binding hardware lease agreements, enterprise software contracts, or production traffic cutovers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] space-y-2">
                <h3 className="font-bold text-amber-300 font-mono">Clause 5.4 — Trademark & Attribution Notice</h3>
                <p>
                  NVIDIA, TensorRT, CUDA, AMD, ROCm, Intel, Habana Gaudi, Qualcomm, Llama, Mistral, HuggingFace, AWS, Google Cloud, and Microsoft Azure are registered trademarks of their respective owners. Their mention does not imply sponsorship, endorsement, or affiliation with CorePick.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Footer Audit Information */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-[#0D1322] border border-[#1E293B] text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Have benchmark anomaly telemetry or updated lab runs?</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('contact')}
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer"
            >
              Submit Audit Logs →
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => onNavigate('app-methodology')}
              className="text-slate-300 hover:text-white font-bold hover:underline cursor-pointer"
            >
              View Mathematical Formulas →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
