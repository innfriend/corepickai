import React, { useState } from 'react';
import { Mail, ShieldCheck, Cpu, Send, CheckCircle2, Building, MessageSquare } from 'lucide-react';

interface AboutContactViewProps {
  onNavigate: (view: string) => void;
}

export const AboutContactView: React.FC<AboutContactViewProps> = ({ onNavigate }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    useCase: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-10">
        {/* Mission Banner */}
        <div className="bg-[#0D1322] border border-[#1E293B] p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Our Mission</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            Democratizing Hardware-Aware AI Inference
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
            At CorePick, we believe the biggest barrier to deploying scalable AI isn&apos;t just training algorithms—it&apos;s the complex, fragmented matrix of target compute hardware. We bridge the gap between PyTorch models and silicon accelerators with zero-overhead compiler technology.
          </p>
        </div>

        {/* Contact / Enterprise Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Building className="w-5 h-5 text-cyan-400" />
              <span>Enterprise Inquiries & Custom Hardware Benchmarks</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Looking to deploy dedicated profiling daemons inside your secure VPC, on-premise edge fleet, or automotive ASIC testbeds? Reach out to our performance engineering team.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>SOC 2 Type II Certified & Air-Gapped Appliances</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-cyan-300 font-semibold">CorePick Engineering Support</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-6 sm:p-8 space-y-4">
            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white font-mono">Inquiry Dispatched</h4>
                <p className="text-xs text-slate-400">
                  Thank you! Your message has been routed to our lead performance engineering team. We will respond within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: formData.name,
                      email: formData.email,
                      company: formData.company,
                      message: formData.message,
                      subject: `CorePick Inquiry from ${formData.company || formData.name}`,
                    }),
                  });
                } catch (err) {
                  console.error(err);
                }
                setSubmitted(true);
              }} className="space-y-3.5">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    placeholder="jane@company.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    placeholder="Acme Robotics AI"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Message / Target Hardware</label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    placeholder="Tell us about your models and target deployment devices..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
