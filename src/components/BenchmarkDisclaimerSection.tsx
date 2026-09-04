import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Cpu, 
  Server, 
  FileCode, 
  Sliders, 
  Thermometer, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  HelpCircle,
  Scale,
  ExternalLink
} from 'lucide-react';

interface BenchmarkDisclaimerSectionProps {
  compact?: boolean;
  className?: string;
  onNavigate?: (view: string) => void;
}

export const BenchmarkDisclaimerSection: React.FC<BenchmarkDisclaimerSectionProps> = ({ 
  compact = false,
  className = '',
  onNavigate
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [activeTab, setActiveTab] = useState<'overview' | 'variance' | 'legal'>('overview');

  return (
    <div 
      id="benchmark-disclaimer" 
      className={`rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#0F1420] to-[#0A0D15] p-5 sm:p-6 text-slate-200 font-sans shadow-xl ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E293B]">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60 uppercase tracking-wider">
                Engineering & Sizing Transparency
              </span>
              <span className="text-xs font-mono text-slate-400 hidden xs:inline">
                ISO/IEEE 21838 Sizing Standard
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
              Benchmark & Performance Metrics Disclaimer
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigate && (
            <button
              onClick={() => onNavigate('app-disclaimer')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white text-xs font-mono rounded-xl border border-amber-500/30 transition-all cursor-pointer"
              title="Open full-page standalone disclaimer"
            >
              <span>Full Page View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Toggle Expand / Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131B2E] hover:bg-[#1E293B] text-amber-300 hover:text-white text-xs font-mono rounded-xl border border-[#27354F] transition-all cursor-pointer"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Collapse' : 'Expand Details'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Primary Key Takeaway (Always Visible) */}
      <div className="mt-4 p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs sm:text-sm text-amber-200/90 leading-relaxed flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-amber-300 font-semibold font-mono">Notice on Performance Data: </strong>
          All throughput (tokens/sec), latency (TTFT / ITL), operational intensity, VRAM requirements, and cost projections presented across CorePick are <strong>analytical simulations, standardized lab reproductions, or vendor-published baselines</strong>. They are engineered as architectural sizing guides and relative comparison tools — <strong>they do not constitute guaranteed Service Level Agreements (SLAs), hardware warranties, or contractual performance commitments</strong> for any specific production deployment or third-party cloud environment.
        </p>
      </div>

      {/* Expanded Comprehensive Breakdown */}
      {isExpanded && (
        <div className="mt-6 space-y-6 animate-fadeIn">
          {/* Sub-navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#1E293B] pb-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-[#131B2E]'
              }`}
            >
              1. Methodology & Data Provenance
            </button>
            <button
              onClick={() => setActiveTab('variance')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'variance'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-[#131B2E]'
              }`}
            >
              2. Real-World Variance Factors
            </button>
            <button
              onClick={() => setActiveTab('legal')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'legal'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-[#131B2E]'
              }`}
            >
              3. Non-Liability & Validation Notice
            </button>
          </div>

          {/* TAB 1: Methodology & Data Provenance */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#080B12] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lab Measured Benchmarks</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Captured in isolated testbeds using standardized synthetic loads (e.g. 512 input tokens, 128 output tokens) on dedicated bare-metal nodes. While reproducible under exact test conditions, performance may vary as production query entropy changes.
                </p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-[#1E293B]">
                  Identified by the <strong className="text-emerald-400">MEASURED LAB</strong> badge.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#080B12] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <Server className="w-4 h-4" />
                  <span>Vendor-Reported Metrics</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Derived from vendor technical briefs (NVIDIA TensorRT-LLM, AMD ROCm, Intel vLLM, Qualcomm QNN). Often represent theoretical upper bounds measured under hyper-tuned, non-interactive batch sizes with warmed KV caches.
                </p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-[#1E293B]">
                  Identified by the <strong className="text-blue-400">VENDOR REPORTED</strong> badge.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#080B12] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Cpu className="w-4 h-4" />
                  <span>Roofline Analytical Simulations</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Calculated using Williams Roofline formulations: arithmetic intensity (FLOPs/byte), memory bus bandwidth (HBM3e/GDDR6), and tensor core saturation. They model mathematical ceilings assuming optimized kernel dispatch without PCIe stalling.
                </p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-[#1E293B]">
                  Identified by the <strong className="text-cyan-400">ANALYTICAL SIMULATION</strong> badge.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Real-World Variance Factors */}
          {activeTab === 'variance' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-mono">
                Why your measured production numbers may differ from published or simulated benchmarks:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Variance Factor 1 */}
                <div className="p-3.5 rounded-xl bg-[#080B12] border border-[#1E293B] space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-mono font-bold">
                    <Server className="w-3.5 h-3.5" />
                    <span>Host Topology & PCIe</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    PCIe Gen4 vs Gen5 bus overhead, cross-socket NUMA memory latency, and CPU-to-GPU page-locked memory copy bottlenecks significantly degrade prompt prefill times.
                  </p>
                </div>

                {/* Variance Factor 2 */}
                <div className="p-3.5 rounded-xl bg-[#080B12] border border-[#1E293B] space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>Thermals & Power Caps</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Cloud instances frequently enforce aggressive TDP power limits (e.g. 350W vs 700W on SXM) or experience clock throttling under sustained thermal saturation.
                  </p>
                </div>

                {/* Variance Factor 3 */}
                <div className="p-3.5 rounded-xl bg-[#080B12] border border-[#1E293B] space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Runtime & Kernels</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Differences in CUDA drivers, Triton compiler releases, FlashAttention-2 vs 3, and vLLM chunked prefill settings can alter token throughput by up to 25-40%.
                  </p>
                </div>

                {/* Variance Factor 4 */}
                <div className="p-3.5 rounded-xl bg-[#080B12] border border-[#1E293B] space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-400 font-mono font-bold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Query Length & Entropy</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Real-world conversational traffic has varying prompt-to-completion ratios, varying KV cache hit rates, and stochastic burst request arrivals unlike fixed synthetic loops.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Legal & Non-Liability Notice */}
          {activeTab === 'legal' && (
            <div className="p-4 rounded-xl bg-[#080B12] border border-[#1E293B] space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-bold">
                <Scale className="w-4 h-4" />
                <span>Non-Liability & Empirical Validation Recommendation</span>
              </div>
              <p>
                <strong>1. No Commercial Warranty:</strong> CorePick, its maintainers, and its data contributors expressly disclaim all warranties, express or implied, regarding the accuracy, completeness, or fitness for a particular purpose of any benchmark data, roofline projections, pricing estimates, or hardware recommendations provided on this site.
              </p>
              <p>
                <strong>2. Independent Verification Required:</strong> Enterprise procurement teams, systems architects, and infrastructure engineers must independently benchmark and empirically profile their specific models, proprietary datasets, and target cloud providers (e.g. AWS, GCP, Azure, Lambda Labs, RunPod) using the reproducible CLI scripts provided before committing capital expenditure or production traffic.
              </p>
              <p>
                <strong>3. Cloud Pricing & Billing Volatility:</strong> Cloud hourly rates, spot availability discounts, and token-cost computations are subject to rapid provider price updates and regional tariff differences. All cost-per-million token calculations are estimates calculated under idealized 100% duty-cycle assumptions.
              </p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1E293B] text-[11px] font-mono text-slate-400">
            <span>
              Always verify locally via: <code className="text-cyan-300 font-bold bg-[#07090E] px-1.5 py-0.5 rounded border border-[#27354F]">corepick bench --reproduce</code>
            </span>
            <span className="text-slate-500">
              Last Updated: Standard Revision 2026.04
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
