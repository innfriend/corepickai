import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  Cpu, 
  Layers, 
  Zap, 
  ArrowRight, 
  BookOpen, 
  Sliders, 
  Activity, 
  Code2, 
  Download,
  X,
  Sparkles,
  Flame,
  DollarSign,
  ChevronRight,
  Mail,
  Server
} from 'lucide-react';
import { MODEL_CATALOG, HARDWARE_CATALOG } from '../data/mockData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenWizardWithModel?: (modelId: string) => void;
  onOpenGlossary?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenWizardWithModel,
  onOpenGlossary
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    {
      id: 'quick-profiler',
      title: 'Launch Profiler Wizard',
      category: 'Actions',
      icon: Zap,
      action: () => { onNavigate('app-analyze'); onClose(); }
    },
    {
      id: 'quick-roofline',
      title: 'Inspect Roofline & Microsecond Flamegraph',
      category: 'Actions',
      icon: Flame,
      action: () => { onNavigate('app-inspector'); onClose(); }
    },
    {
      id: 'quick-sandbox',
      title: 'Compare Hardware Specs & TCO',
      category: 'Actions',
      icon: DollarSign,
      action: () => { onNavigate('app-sandbox'); onClose(); }
    },
    {
      id: 'quick-quant',
      title: 'Simulate Mixed-Precision Quantization & MMLU Degradation',
      category: 'Actions',
      icon: Sparkles,
      action: () => { onNavigate('app-quant-simulator'); onClose(); }
    },
    {
      id: 'quick-comparator',
      title: 'Compare Multi-Hardware Latency & Streaming TPS (A/B Test)',
      category: 'Actions',
      icon: Activity,
      action: () => { onNavigate('app-comparator'); onClose(); }
    },
    {
      id: 'quick-tp-sizer',
      title: 'Size Multi-GPU Tensor Parallelism (TP 1..8) & Interconnect',
      category: 'Actions',
      icon: Server,
      action: () => { onNavigate('app-tp-sizer'); onClose(); }
    },
    {
      id: 'quick-hf-parser',
      title: 'Parse Hugging Face config.json & Layer Dimensions',
      category: 'Actions',
      icon: Code2,
      action: () => { onNavigate('app-hf-parser'); onClose(); }
    },
    {
      id: 'quick-kv-sizer',
      title: 'Size KV-Cache & Context Window Compression (FP8 / INT4)',
      category: 'Actions',
      icon: Sparkles,
      action: () => { onNavigate('app-kv-sizer'); onClose(); }
    },
    {
      id: 'quick-k8s',
      title: 'Generate Production Docker & Kubernetes Helm Deployment',
      category: 'Actions',
      icon: Server,
      action: () => { onNavigate('app-k8s-generator'); onClose(); }
    },
    {
      id: 'quick-deploy',
      title: 'Export Triton & vLLM Deployment Code',
      category: 'Actions',
      icon: Code2,
      action: () => { onNavigate('app-deploy'); onClose(); }
    },
    {
      id: 'quick-glossary',
      title: 'Open Plain-English HPC Glossary',
      category: 'Help',
      icon: BookOpen,
      action: () => { onClose(); if (onOpenGlossary) onOpenGlossary(); }
    },
    {
      id: 'quick-contact',
      title: 'Contact Engineering & Sales',
      category: 'Help',
      icon: Mail,
      action: () => { onNavigate('contact'); onClose(); }
    }
  ];

  const filteredModels = MODEL_CATALOG.filter(m => 
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.category.toLowerCase().includes(query.toLowerCase()) ||
    m.framework.toLowerCase().includes(query.toLowerCase())
  ).map(m => ({
    id: `model-${m.id}`,
    title: `Profile ${m.name} (${m.parameterCountFormatted})`,
    subtitle: `${m.category} • ${m.totalFlopsGflops} GFLOPs`,
    category: 'Models',
    icon: Layers,
    action: () => {
      if (onOpenWizardWithModel) {
        onOpenWizardWithModel(m.id);
      } else {
        onNavigate('app-analyze');
      }
      onClose();
    }
  }));

  const filteredHardware = HARDWARE_CATALOG.filter(h =>
    h.name.toLowerCase().includes(query.toLowerCase()) ||
    h.vendor.toLowerCase().includes(query.toLowerCase()) ||
    h.architecture.toLowerCase().includes(query.toLowerCase())
  ).map(h => ({
    id: `hw-${h.id}`,
    title: `${h.name} (${h.memoryGb}GB VRAM)`,
    subtitle: `${h.vendor} • ${h.memoryBandwidthGBs} GB/s • ${h.tdpWatts}W TDP`,
    category: 'Hardware Targets',
    icon: Cpu,
    action: () => {
      onNavigate('app-fleet');
      onClose();
    }
  }));

  const navigationViews = [
    { id: 'app-dashboard', title: 'Dashboard Overview', category: 'Navigation', icon: Activity, action: () => { onNavigate('app-dashboard'); onClose(); } },
    { id: 'app-models', title: 'Model Catalog & Registry', category: 'Navigation', icon: Layers, action: () => { onNavigate('app-models'); onClose(); } },
    { id: 'app-compiler', title: 'Compiler Pass Tuning', category: 'Navigation', icon: Sliders, action: () => { onNavigate('app-compiler'); onClose(); } },
    { id: 'knowledge-base', title: 'Knowledge Base & Optimization Playbooks', category: 'Navigation', icon: BookOpen, action: () => { onNavigate('knowledge-base'); onClose(); } },
    { id: 'app-cli', title: 'CorePick CLI Hub', category: 'Navigation', icon: Terminal, action: () => { onNavigate('app-cli'); onClose(); } },
  ].filter(v => v.title.toLowerCase().includes(query.toLowerCase()));

  const allItems = [
    ...quickActions.filter(a => a.title.toLowerCase().includes(query.toLowerCase())),
    ...filteredModels,
    ...filteredHardware,
    ...navigationViews
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#0D1322] border border-cyan-700/60 rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#1E293B] bg-[#0A0E18] flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            placeholder="Type a command, model (Llama-3, YOLO), hardware (4090, H100), or concept..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-white placeholder:text-slate-500 font-mono text-sm focus:outline-none"
            autoFocus
          />
          <span className="text-[10px] font-mono font-bold bg-[#131B2E] text-slate-400 px-2 py-1 rounded border border-[#27354F]">
            ESC to close
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-1">
          {allItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              No matching commands, models, or hardware found.
            </div>
          ) : (
            allItems.slice(0, 10).map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/60 border border-cyan-500/60 text-white'
                      : 'hover:bg-[#131B2E] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-cyan-500 text-[#07090E]' : 'bg-[#131B2E] text-cyan-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[9px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-[#07090E] border border-[#1E293B]">
                          {item.category}
                        </span>
                      </div>
                      {'subtitle' in item && item.subtitle && (
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono">
                    <span>Jump</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 border-t border-[#1E293B] bg-[#07090E] flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span><strong>↑↓</strong> Navigate</span>
            <span><strong>ENTER</strong> Select</span>
            <span><strong>ESC</strong> Dismiss</span>
          </div>
          <span className="text-cyan-400 font-bold">Universal Search</span>
        </div>
      </div>
    </div>
  );
};
