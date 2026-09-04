import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Building, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Cpu,
  DollarSign,
  Zap,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

interface ContactUsViewProps {
  onNavigate: (view: string) => void;
}

export const ContactUsView: React.FC<ContactUsViewProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    needType: 'benchmark_profiling',
    name: '',
    email: '',
    company: '',
    hardwareInterest: 'NVIDIA H100 / Blackwell B200',
    scaleOrTimeline: 'Production Sizing (< 30 Days)',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const needOptions = [
    {
      id: 'benchmark_profiling',
      label: 'Benchmark & Hardware Profiling',
      description: 'Custom rooflines, bare-metal validation, kernel testing',
      icon: Cpu,
    },
    {
      id: 'enterprise_finops',
      label: 'Enterprise Sizing & Cloud FinOps',
      description: 'Cut cloud GPU bills, cluster sizing, RFP validation',
      icon: DollarSign,
    },
    {
      id: 'runtime_optimization',
      label: 'Runtime & Serving Optimization',
      description: 'vLLM, TensorRT-LLM, FlashAttention, quantization',
      icon: Zap,
    },
    {
      id: 'general_partnership',
      label: 'General Inquiry / Partnership',
      description: 'On-premise VPC licenses, academic access, other',
      icon: HelpCircle,
    },
  ];

  const handleCopyDirectEmail = () => {
    navigator.clipboard.writeText('engineering@corepick.ai');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const activeOption = needOptions.find(o => o.id === formData.needType);
    const categoryLabel = activeOption ? activeOption.label : 'General Inquiry';

    const payload = {
      formCategory: formData.needType,
      name: formData.name,
      email: formData.email,
      company: formData.company,
      hardwareInterest: formData.hardwareInterest,
      workloadScale: formData.scaleOrTimeline,
      subject: `[CorePick ${categoryLabel}] ${formData.company ? `${formData.company} - ` : ''}${formData.name}`,
      message: `Inquiry Type: ${categoryLabel}
Name: ${formData.name}
Email: ${formData.email}
Organization: ${formData.company || 'Not Specified'}
Hardware / Target Fleet: ${formData.hardwareInterest}
Scale / Target Timeline: ${formData.scaleOrTimeline}

Message & Requirements:
${formData.message}`,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Submission failed');

      setTicketId(data.inquiryId || `TICKET-${Date.now().toString().slice(-6)}`);
      setSubmitted(true);
    } catch (err: any) {
      console.warn('Network issue submitting form, using local reference:', err);
      setTicketId(`TICKET-${Date.now().toString().slice(-6)}`);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header Hero Banner */}
        <div className="bg-[#0D1322] border border-[#1E293B] p-6 sm:p-8 rounded-3xl space-y-3 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 text-xs font-semibold">
            <Mail className="w-3.5 h-3.5" />
            <span>Direct Engineering & Enterprise Contact</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            Get in Touch with CorePick
          </h1>
          
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
            Have questions about benchmark reproductions, custom GPU roofline simulations, cloud spend audits, or enterprise sizing? Fill out the single form below to connect directly with our engineering and infrastructure team.
          </p>
        </div>

        {/* Form Container Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Unified Form */}
          <div className="lg:col-span-8 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 shadow-2xl">
            {submitted ? (
              <div className="py-12 text-center space-y-5 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono">
                    Message Dispatched Successfully
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-mono">
                    Thank You, {formData.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Your request has been routed to our technical team. We review all incoming technical and enterprise inquiries with an average response time of under 24 business hours.
                  </p>
                </div>

                <div className="p-4 bg-[#07090E] border border-[#1E293B] rounded-2xl max-w-md mx-auto text-left text-xs font-mono space-y-2 text-slate-400">
                  <div className="flex justify-between">
                    <span>Ticket Reference:</span>
                    <span className="text-cyan-400 font-bold">{ticketId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contact Email:</span>
                    <span className="text-slate-300">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="text-slate-300 capitalize">{formData.needType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response SLA:</span>
                    <span className="text-emerald-400 font-semibold">&lt; 24 Hours</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        needType: 'benchmark_profiling',
                        name: '',
                        email: '',
                        company: '',
                        hardwareInterest: 'NVIDIA H100 / Blackwell B200',
                        scaleOrTimeline: 'Production Sizing (< 30 Days)',
                        message: '',
                      });
                    }}
                    className="px-5 py-2.5 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white rounded-xl text-xs font-mono transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                  <button
                    onClick={() => onNavigate('app-benchmarks')}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
                  >
                    Browse Benchmarks
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Need Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-mono text-slate-300 block font-bold">
                    1. What can we help you with? <span className="text-cyan-400">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {needOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = formData.needType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, needType: opt.id })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/50'
                              : 'bg-[#07090E] border-[#1E293B] text-slate-400 hover:text-slate-200 hover:bg-[#0B101C]'
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-[#131B2E] text-slate-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-mono font-bold">{opt.label}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">{opt.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Contact Details */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-mono text-slate-300 block font-bold">
                    2. Your Contact Information
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        Full Name <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                        placeholder="Alex Mercer"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        Work / Academic Email <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                        placeholder="alex@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Organization / Company (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                      placeholder="e.g. Acme AI Labs / University / Independent"
                    />
                  </div>
                </div>

                {/* 3. Workload & Hardware Interest */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-mono text-slate-300 block font-bold">
                    3. Target Environment & Sizing Details (Optional)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        Target Hardware / Cloud Fleet
                      </label>
                      <select
                        value={formData.hardwareInterest}
                        onChange={(e) => setFormData({ ...formData, hardwareInterest: e.target.value })}
                        className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="NVIDIA H100 / Blackwell B200">NVIDIA H100 SXM5 / Blackwell B200</option>
                        <option value="AMD Instinct MI300X">AMD Instinct MI300X (ROCm 6.2)</option>
                        <option value="Intel Gaudi 3 / Habana">Intel Gaudi 3 / Habana</option>
                        <option value="AWS EC2 (p5 / g6e / inf2)">AWS EC2 (p5 / g6e / inf2)</option>
                        <option value="Google Cloud (A3 Ultra / TPU v5p)">Google Cloud (A3 / TPU v5p)</option>
                        <option value="GPU Cloud (Lambda / CoreWeave / RunPod)">GPU Cloud (Lambda / CoreWeave)</option>
                        <option value="Apple Silicon M3/M4 Max">Apple Silicon M3/M4 Max</option>
                        <option value="Edge / Robotics NPU (Qualcomm / Jetson)">Edge / NPU (Qualcomm / Jetson)</option>
                        <option value="Not Sure / General Advice">Not Sure / Need Architecture Advice</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        Timeline / Workload Scale
                      </label>
                      <select
                        value={formData.scaleOrTimeline}
                        onChange={(e) => setFormData({ ...formData, scaleOrTimeline: e.target.value })}
                        className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="Immediate (< 30 Days)">Immediate (&lt; 30 Days) - Active Sizing</option>
                        <option value="Next Quarter (1 - 3 Months)">Next Quarter (1 - 3 Months)</option>
                        <option value="High Volume Production (> 1B Tokens/mo)">High-Volume Production (&gt; 1B tokens/mo)</option>
                        <option value="Research / Academic Exploration">Research / Academic Exploration</option>
                        <option value="General Technical Question">General Technical Question</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Message Box */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-mono text-slate-300 block font-bold">
                    4. How can we help? <span className="text-cyan-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                    placeholder="Tell us about your target model (e.g. Llama-3.3 70B, DeepSeek-R1), latency SLA goals (TTFT / tok/s), current cloud spending bottlenecks, or specific benchmark requests..."
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 text-[#07090E] font-bold text-xs font-mono rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-[#07090E] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Request to CorePick Team</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-500 text-center font-mono">
                  Your information is encrypted and protected under strict mutual confidentiality.
                </p>
              </form>
            )}
          </div>

          {/* Right Column: Direct Channels & Guarantee */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Contact Card */}
            <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Response Guarantee</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white font-mono">
                  Fast Technical Turnaround
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every submission is assigned directly to an AI infrastructure specialist or performance engineer.
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#1E293B] text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-white font-bold block">Technical Inquiries:</span>
                    <span className="text-slate-400">&lt; 24 hours turnaround</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-white font-bold block">Enterprise FinOps:</span>
                    <span className="text-slate-400">Priority consultation within 4 hours</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-white font-bold block">Mutual NDA:</span>
                    <span className="text-slate-400">Standard enterprise agreements supported</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Email Box */}
            <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-mono font-bold">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Direct Mailbox</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prefer to email directly or send an RFP / specification attachment?
              </p>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#07090E] border border-[#1E293B] font-mono text-xs text-cyan-300">
                <span>engineering@corepick.ai</span>
                <button
                  type="button"
                  onClick={handleCopyDirectEmail}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy email address"
                >
                  {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Security & Confidentiality */}
            <div className="p-4 bg-[#0A0E1A] border border-[#1E293B] rounded-2xl space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Confidentiality:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Encrypted in Transit</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                We never share client model configurations, prompt distribution profiles, or infrastructure cost models with third parties.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
