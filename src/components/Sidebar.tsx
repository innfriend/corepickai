import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Zap, 
  GitCompare, 
  Cpu, 
  BarChart3, 
  Terminal, 
  FileText, 
  Server, 
  Network, 
  Sliders, 
  Code2, 
  SlidersHorizontal, 
  Activity, 
  ChevronRight, 
  ShieldCheck, 
  BookOpen, 
  X, 
  Sparkles, 
  Box,
  TrendingUp,
  CheckCircle2,
  FileCode,
  Database,
  Gauge
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navItems = [
    {
      group: 'COREPICK OPTIMIZER',
      items: [
        { id: 'app-optimizer', label: '⚡ Workload Optimizer', icon: Zap, highlight: true, badge: 'Unified' },
        { id: 'app-simulator', label: '🔬 What-If Simulator', icon: SlidersHorizontal, highlight: true, badge: 'Delta' },
        { id: 'app-opt-lab', label: '🧪 Optimization Lab', icon: Activity, badge: 'Trials' },
        { id: 'app-monitor', label: '📡 Production & Drift', icon: TrendingUp, badge: 'Live' },
      ]
    },
    {
      group: 'SIMULATION & INTELLIGENCE',
      items: [
        { id: 'app-comparator-matrix', label: '1. Model × Hardware Matrix', icon: GitCompare, badge: 'Matrix' },
        { id: 'app-pareto', label: '2. Pareto SLA Optimizer', icon: TrendingUp, badge: 'Pareto' },
        { id: 'app-whatif', label: '3. What-If Parameter Sweeper', icon: SlidersHorizontal, badge: 'Sweeper' },
        { id: 'app-fit', label: '4. Hardware Fit Analyzer', icon: CheckCircle2 },
        { id: 'app-quant-simulator', label: '5. Quant & Accuracy Sim', icon: Sparkles },
      ]
    },
    {
      group: 'PERFORMANCE WORKFLOW',
      items: [
        { id: 'app-dashboard', label: 'Overview & Telemetry', icon: LayoutDashboard, badge: 'Live' },
        { id: 'app-models', label: 'Model Catalog & Graph', icon: Layers },
        { id: 'app-analyze', label: 'Profile Wizard', icon: Zap },
        { id: 'app-inspector', label: 'Roofline & Heatmap', icon: Network },
        { id: 'app-results', label: 'Optimization Results', icon: Sliders },
        { id: 'app-benchmarks', label: 'Physical Benchmarks', icon: ShieldCheck, badge: 'Verified' },
        { id: 'app-k8s-generator', label: 'K8s & Docker Export', icon: Box },
      ]
    },
    {
      group: 'SIZING & ARCHITECTURE TOOLS',
      items: [
        { id: 'app-tp-sizer', label: 'Multi-GPU TP Sizer', icon: Server, badge: 'TP=1..8' },
        { id: 'app-hf-parser', label: 'HF config.json Parser', icon: FileCode, badge: 'Parser' },
        { id: 'app-kv-sizer', label: 'KV-Cache & Context Sizer', icon: Database, badge: 'Context' },
      ]
    },
    {
      group: 'INTELLIGENCE & KNOWLEDGE',
      items: [
        { id: 'app-docs', label: 'Tool User Manual & Docs', icon: BookOpen, badge: 'Guides', highlight: true },
        { id: 'app-fleet', label: 'Hardware Specs & Chips', icon: Cpu },
        { id: 'app-methodology', label: 'Formulas & Methodology', icon: Gauge, badge: 'Formulas' },
        { id: 'app-knowledge', label: 'Knowledge Base', icon: FileText, badge: 'Guide' },
        { id: 'app-cli', label: 'CLI & Local Agent', icon: Terminal },
      ]
    }
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile?.();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-3 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Mobile Header with Close Button */}
        <div className="lg:hidden flex items-center justify-between px-2 pb-2 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white uppercase">Performance Nav</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg bg-[#131B2E] text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        {navItems.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {group.group}
            </span>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950/80 to-indigo-950/60 text-cyan-300 border border-cyan-800/60 shadow-sm'
                        : item.highlight
                        ? 'bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50 border border-emerald-800/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-[#131B2E]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Engine Status */}
      <div className="pt-4 border-t border-[#1E293B] space-y-2">
        <div className="flex items-center justify-between px-2 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">Analytical Engine</span>
          </div>
          <span className="bg-[#131B2E] px-1.5 py-0.5 rounded border border-[#27354F] text-cyan-300">v2.6.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-[#07090E] border-r border-[#1E293B] flex-col justify-between">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-fadeIn">
          {/* Backdrop */}
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity cursor-pointer"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] bg-[#07090E] border-r border-[#1E293B] h-full z-10 shadow-2xl flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
