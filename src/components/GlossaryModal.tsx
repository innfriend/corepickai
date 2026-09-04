import React, { useState } from 'react';
import { BookOpen, Search, X, Sparkles, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { HPC_GLOSSARY } from './ConceptTooltip';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const entries = Object.entries(HPC_GLOSSARY).filter(([key, val]) => {
    const q = searchQuery.toLowerCase();
    return (
      val.term.toLowerCase().includes(q) ||
      val.plainEnglish.toLowerCase().includes(q) ||
      (val.analogy && val.analogy.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0D1322] border border-cyan-800/60 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#1E293B] flex items-center justify-between bg-[#0A0E18]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
                <span>HPC & Inference Engineering Glossary</span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">Plain English</span>
              </h2>
              <p className="text-xs text-slate-400">Demystifying compiler, silicon, and memory optimization terms.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-[#131B2E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Filter */}
        <div className="p-4 border-b border-[#1E293B] bg-[#07090E]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search concepts (e.g. Roofline, AWQ, TTFT, Memory-Bound, TCO)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D1322] border border-[#1E293B] focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono"
              autoFocus
            />
          </div>
        </div>

        {/* Glossary List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              No matching optimization concepts found for "{searchQuery}".
            </div>
          ) : (
            entries.map(([key, item]) => (
              <div
                key={key}
                className="p-5 rounded-2xl bg-[#07090E] border border-[#1E293B] hover:border-cyan-800/60 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-mono text-cyan-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>{item.term}</span>
                  </h3>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {item.plainEnglish}
                </p>

                {item.analogy && (
                  <div className="p-2.5 bg-[#0D1322] rounded-xl border border-amber-950/60 text-xs text-amber-300 leading-relaxed">
                    <strong className="text-amber-400 font-mono text-[11px] uppercase tracking-wide">Intuitive Analogy:</strong>{' '}
                    <span>{item.analogy}</span>
                  </div>
                )}

                {item.recommendedAction && (
                  <div className="pt-2 border-t border-[#1E293B]/60 text-xs font-mono text-emerald-400 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">How CorePick Solves It: </span>
                      <span>{item.recommendedAction}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0A0E18] flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Tip: Hover over any dotted text in CorePick to inspect live definitions.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-[#07090E] font-bold rounded-xl cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
