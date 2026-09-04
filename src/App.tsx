import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPageView } from './components/LandingPageView';
import { PlatformView } from './components/PlatformView';
import { HowItWorksView } from './components/HowItWorksView';
import { DocsView } from './components/DocsView';
import { AboutContactView } from './components/AboutContactView';
import { ContactUsView } from './components/ContactUsView';
import { DashboardView } from './components/DashboardView';
import { ModelCatalogView } from './components/ModelCatalogView';
import { ProfilerWizardView } from './components/ProfilerWizardView';
import { OptimizationResultsView } from './components/OptimizationResultsView';
import { HardwareFleetView } from './components/HardwareFleetView';
import { BenchmarksView } from './components/BenchmarksView';
import { BenchmarkComparisonView } from './components/BenchmarkComparisonView';
import { HardwareFitAnalyzer } from './components/HardwareFitAnalyzer';
import { WhatIfSensitivityAnalysis } from './components/WhatIfSensitivityAnalysis';
import { MethodologyView } from './components/MethodologyView';
import { CliHubView } from './components/CliHubView';
import { ReportsCenterView } from './components/ReportsCenterView';
import { AdminFleetView } from './components/AdminFleetView';
import { GraphInspectorView } from './components/GraphInspectorView';
import { HardwareSandboxView } from './components/HardwareSandboxView';
import { DeploymentExporterView } from './components/DeploymentExporterView';
import { CustomModelProfiler } from './components/CustomModelProfiler';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { QuantizationAccuracySimulator } from './components/QuantizationAccuracySimulator';
import { MultiHardwareComparator } from './components/MultiHardwareComparator';
import { HardwareSimulatorView } from './components/simulation/HardwareSimulatorView';
import { ModelHardwareComparatorView } from './components/simulation/ModelHardwareComparatorView';
import { ParetoOptimizerView } from './components/simulation/ParetoOptimizerView';
import { WhatIfAnalysisView } from './components/simulation/WhatIfAnalysisView';
import { ProductionContainerGenerator } from './components/ProductionContainerGenerator';
import { MultiGpuTensorParallelSizer } from './components/MultiGpuTensorParallelSizer';
import { HuggingFaceConfigParser } from './components/HuggingFaceConfigParser';
import { KvCacheCompressionSizer } from './components/KvCacheCompressionSizer';
import { CommandPalette } from './components/CommandPalette';
import { GlossaryModal } from './components/GlossaryModal';
import { UnifiedOptimizerView } from './components/UnifiedOptimizerView';
import { WhatIfSimulatorView } from './components/WhatIfSimulatorView';
import { BenchmarkDatabaseView } from './components/BenchmarkDatabaseView';
import { OptimizationLabView } from './components/OptimizationLabView';
import { ProductionMonitorView } from './components/ProductionMonitorView';
import { DisclaimerView } from './components/DisclaimerView';
import { OptimizationJob, ModelArchitecture } from './types';
import { SAMPLE_OPTIMIZATION_JOBS, MODEL_CATALOG } from './data/mockData';

export default function App() {
  // Navigation state
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeJob, setActiveJob] = useState<OptimizationJob>(SAMPLE_OPTIMIZATION_JOBS[0]);
  const [wizardInitialModelId, setWizardInitialModelId] = useState<string>(MODEL_CATALOG[0].id);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Helper to determine if we are in the workspace application mode
  const isAppMode = currentView.startsWith('app-');

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJob = (job: OptimizationJob) => {
    setActiveJob(job);
    setCurrentView('app-results');
  };

  const handleOpenWizardWithModel = (modelId: string) => {
    setWizardInitialModelId(modelId);
    setCurrentView('app-analyze');
  };

  const handleJobCompleted = (job: OptimizationJob) => {
    setActiveJob(job);
    setCurrentView('app-results');
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onOpenWizardWithModel={handleOpenWizardWithModel}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
      />

      {/* Plain English HPC Glossary Modal */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Workspace Sidebar (visible in App Views) */}
        {isAppMode && (
          <Sidebar 
            currentView={currentView} 
            onNavigate={handleNavigate}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Dynamic Route View Mount */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {(currentView === 'home' || currentView === 'landing') && <LandingPageView onNavigate={handleNavigate} />}
          {currentView === 'platform' && <PlatformView onNavigate={handleNavigate} />}
          {currentView === 'how-it-works' && <HowItWorksView onNavigate={handleNavigate} />}
          {currentView === 'docs' && <DocsView onNavigate={handleNavigate} />}
          {currentView === 'about' && <AboutContactView onNavigate={handleNavigate} />}
          {(currentView === 'contact' || currentView === 'app-contact') && <ContactUsView onNavigate={handleNavigate} />}
          {currentView === 'benchmarks' && <BenchmarkComparisonView onNavigate={handleNavigate} />}
          {currentView === 'knowledge-base' && <KnowledgeBaseView onNavigate={handleNavigate} onOpenWizardWithModel={handleOpenWizardWithModel} />}
          {currentView === 'disclaimer' && <DisclaimerView onNavigate={handleNavigate} />}

          {/* App / Workspace Views */}
          {currentView === 'app-dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onSelectJob={handleSelectJob}
              onOpenWizardWithModel={handleOpenWizardWithModel}
            />
          )}

          {currentView === 'app-models' && (
            <ModelCatalogView
              onOpenWizardWithModel={handleOpenWizardWithModel}
            />
          )}

          {currentView === 'app-analyze' && (
            <ProfilerWizardView
              initialModelId={wizardInitialModelId}
              onJobCompleted={handleJobCompleted}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'app-results' && (
            <OptimizationResultsView
              job={activeJob}
            />
          )}

          {/* Unified AI Infrastructure Optimizer */}
          {currentView === 'app-optimizer' && (
            <UnifiedOptimizerView
              onNavigate={handleNavigate}
            />
          )}

          {/* New What-If Simulation Engine & Sensitivity Analysis */}
          {currentView === 'app-simulator' && (
            <WhatIfSimulatorView
              onNavigate={handleNavigate}
            />
          )}

          {/* Benchmark Registry with Provenance & Reproducible CLI */}
          {(currentView === 'app-benchmarks' || currentView === 'benchmarks') && (
            <BenchmarkDatabaseView
              onNavigate={handleNavigate}
            />
          )}

          {/* Iterative Optimization Lab & Autotuner */}
          {currentView === 'app-opt-lab' && (
            <OptimizationLabView
              onNavigate={handleNavigate}
            />
          )}

          {/* Production Telemetry & Continual Drift Monitor */}
          {currentView === 'app-monitor' && (
            <ProductionMonitorView
              onNavigate={handleNavigate}
            />
          )}

          {/* Legacy Roofline Simulator view */}
          {currentView === 'app-roofline-legacy' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <HardwareSimulatorView />
            </div>
          )}

          {currentView === 'app-comparator-matrix' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <ModelHardwareComparatorView />
            </div>
          )}

          {currentView === 'app-pareto' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <ParetoOptimizerView />
            </div>
          )}

          {currentView === 'app-whatif' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <WhatIfAnalysisView />
            </div>
          )}

          {currentView === 'app-fit' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <HardwareFitAnalyzer
                onNavigate={handleNavigate}
                onOpenWizardWithModel={handleOpenWizardWithModel}
              />
            </div>
          )}

          {currentView === 'app-quant-simulator' && (
            <QuantizationAccuracySimulator
              job={activeJob}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'app-comparator' && (
            <MultiHardwareComparator
              initialModelId={activeJob.modelId}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'app-k8s-generator' && (
            <ProductionContainerGenerator
              job={activeJob}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'app-tp-sizer' && (
            <MultiGpuTensorParallelSizer 
              onNavigate={handleNavigate} 
              onOpenWizardWithModel={handleOpenWizardWithModel} 
            />
          )}

          {currentView === 'app-hf-parser' && (
            <HuggingFaceConfigParser 
              onNavigate={handleNavigate} 
              onOpenWizardWithModel={handleOpenWizardWithModel} 
            />
          )}

          {currentView === 'app-kv-sizer' && (
            <KvCacheCompressionSizer 
              onNavigate={handleNavigate} 
              onOpenWizardWithModel={handleOpenWizardWithModel} 
            />
          )}

          {currentView === 'app-inspector' && (
            <GraphInspectorView onNavigate={handleNavigate} />
          )}

          {currentView === 'app-sandbox' && (
            <HardwareSandboxView onNavigate={handleNavigate} />
          )}

          {currentView === 'app-deploy' && (
            <DeploymentExporterView onNavigate={handleNavigate} />
          )}

          {currentView === 'app-compiler' && (
            <CustomModelProfiler onNavigate={handleNavigate} onOpenWizardWithModel={handleOpenWizardWithModel} />
          )}

          {currentView === 'app-knowledge' && (
            <KnowledgeBaseView onNavigate={handleNavigate} onOpenWizardWithModel={handleOpenWizardWithModel} />
          )}

          {currentView === 'app-fleet' && (
            <HardwareFleetView onNavigate={handleNavigate} />
          )}

          {currentView === 'app-benchmarks' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <BenchmarkComparisonView onNavigate={handleNavigate} />
            </div>
          )}

          {currentView === 'app-methodology' && (
            <div className="flex-1 overflow-y-auto">
              <MethodologyView onNavigate={handleNavigate} />
            </div>
          )}

          {(currentView === 'app-docs' || currentView === 'docs') && (
            <DocsView onNavigate={handleNavigate} />
          )}

          {currentView === 'app-cli' && (
            <CliHubView onNavigate={handleNavigate} />
          )}

          {currentView === 'app-reports' && (
            <ReportsCenterView onNavigate={handleNavigate} />
          )}

          {currentView === 'app-admin' && (
            <AdminFleetView onNavigate={handleNavigate} />
          )}

          {currentView === 'app-disclaimer' && (
            <DisclaimerView onNavigate={handleNavigate} />
          )}

          {(currentView === 'app-contact' || currentView === 'contact') && (
            <ContactUsView onNavigate={handleNavigate} />
          )}
        </main>
      </div>
    </div>
  );
}
