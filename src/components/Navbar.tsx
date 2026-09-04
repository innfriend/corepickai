import React, { useState } from 'react';
import { Cpu, Zap, Activity, BookOpen, Layers, DollarSign, Terminal, Shield, ArrowRight, Server, Search, HelpCircle, Menu, X, PanelLeft, Mail } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenCommandPalette?: () => void;
  onOpenGlossary?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentView, 
  onNavigate,
  onOpenCommandPalette,
  onOpenGlossary,
  onToggleMobileSidebar,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAppView = currentView.startsWith('app-') || currentView === 'admin';

  const publicNavLinks = [
    { id: 'landing', label: 'Home' },
    { id: 'app-optimizer', label: 'Optimize', badge: 'New', highlight: true },
    { id: 'app-models', label: 'Models' },
    { id: 'app-fleet', label: 'Hardware' },
    { id: 'app-benchmarks', label: 'Benchmarks' },
    { id: 'app-simulator', label: 'Simulator' },
    { id: 'app-opt-lab', label: 'Lab' },
    { id: 'app-monitor', label: 'Monitor' },
    { id: 'docs', label: 'Docs' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleMobileNavClick = (id: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#07090E]/95 backdrop-blur-md border-b border-[#1E293B] select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Section: Mobile Drawer Toggle (in App Mode) & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAppView && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-[#0D1322] hover:bg-[#131B2E] border border-[#1E293B] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Toggle Workspace Sidebar"
              aria-label="Toggle Workspace Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          <div 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
              <div className="w-full h-full bg-[#0A0D14] rounded-[10px] flex items-center justify-center">
                <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0A0D14] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white font-mono">Core<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Pick</span></span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest bg-cyan-950/80 text-cyan-300 px-1 sm:px-1.5 py-0.5 rounded border border-cyan-800/60">v2.5</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block">AI Hardware & Inference Optimization</p>
            </div>
          </div>
        </div>

        {/* Desktop Public Navigation Links */}
        {!isAppView && (
          <nav className="hidden lg:flex items-center gap-1">
            {publicNavLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  currentView === link.id
                    ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                    : 'text-slate-300 hover:text-white hover:bg-[#131B2E]'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                    {link.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        )}

        {/* App Mode Breadcrumbs when inside Workspace */}
        {isAppView && (
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-slate-500">Workspace /</span>
            <span className="text-cyan-300 font-semibold uppercase tracking-wider">
              {currentView.replace('app-', '').replace('-', ' ')}
            </span>
          </div>
        )}

        {/* Search Command Palette Trigger & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Universal Search (Cmd + K) */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-[#0D1322] hover:bg-[#131B2E] text-slate-300 hover:text-white text-xs font-mono rounded-xl border border-[#1E293B] hover:border-cyan-800/60 transition-all cursor-pointer shadow-inner"
            title="Open Command Palette (Cmd + K)"
            aria-label="Quick Search"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline text-slate-400">Quick Search...</span>
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-bold text-cyan-300 bg-[#07090E] px-1.5 py-0.5 rounded border border-[#27354F]">
              ⌘K
            </kbd>
          </button>

          {/* Plain English Glossary */}
          <button
            onClick={onOpenGlossary}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-[#0D1322] hover:bg-[#131B2E] text-slate-300 hover:text-cyan-300 text-xs font-mono rounded-xl border border-[#1E293B] transition-colors cursor-pointer"
            title="Plain-English HPC Glossary"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Glossary</span>
          </button>

          {/* Performance Disclaimer Quick Link */}
          <button
            onClick={() => onNavigate('app-disclaimer')}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-amber-950/30 hover:bg-amber-950/60 text-amber-300 hover:text-amber-200 text-xs font-mono rounded-xl border border-amber-800/50 transition-colors cursor-pointer"
            title="Benchmark & Performance Sizing Disclaimer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Disclaimer</span>
          </button>

          {/* Quick Launch Wizard */}
          <button
            onClick={() => onNavigate('app-analyze')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden xs:inline sm:inline">Profile Model</span>
            <span className="xs:hidden sm:hidden">Profile</span>
          </button>

          {/* Switch to App or Landing */}
          {isAppView ? (
            <button
              onClick={() => onNavigate('landing')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-[#27354F] transition-colors cursor-pointer"
            >
              <span>Public Site</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('app-dashboard')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white text-xs font-bold rounded-xl border border-cyan-500/30 transition-all cursor-pointer"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mobile Hamburger Menu Toggle (Visible on Public Pages < lg) */}
          {!isAppView && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#0D1322] hover:bg-[#131B2E] border border-[#1E293B] text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-cyan-400" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu for Public Views */}
      {!isAppView && isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0E18] border-b border-[#1E293B] px-4 py-4 space-y-3 shadow-2xl animate-fadeIn">
          <div className="grid grid-cols-1 gap-1">
            {publicNavLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleMobileNavClick(link.id)}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentView === link.id
                    ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-800/60'
                    : 'text-slate-300 hover:text-white hover:bg-[#131B2E]'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                    {link.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#1E293B] flex flex-col gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenGlossary?.();
              }}
              className="flex items-center justify-center gap-2 w-full py-2 bg-[#0D1322] border border-[#1E293B] rounded-xl text-xs text-slate-300 font-mono"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>HPC Engineering Glossary</span>
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('contact');
              }}
              className="flex items-center justify-center gap-2 w-full py-2 bg-[#0D1322] border border-[#1E293B] rounded-xl text-xs text-slate-300 font-mono"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>Contact Engineering & Sales</span>
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('app-disclaimer');
              }}
              className="flex items-center justify-center gap-2 w-full py-2 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-300 font-mono"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Performance & Benchmark Disclaimer</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('app-dashboard')}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-[#07090E] font-extrabold text-xs rounded-xl shadow-lg"
            >
              <span>Launch Studio Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
