import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Zap, 
  Flame, 
  Cpu, 
  ArrowRight, 
  Filter, 
  Check, 
  Sparkles, 
  ChevronRight,
  Info
} from 'lucide-react';
import { ModelArchitecture, ModelCategory } from '../types';
import { MODEL_CATALOG } from '../data/mockData';
import { UploadModelModal } from './UploadModelModal';

interface ModelCatalogViewProps {
  onOpenWizardWithModel: (modelId: string) => void;
}

export const ModelCatalogView: React.FC<ModelCatalogViewProps> = ({
  onOpenWizardWithModel,
}) => {
  const [models, setModels] = useState<ModelArchitecture[]>(MODEL_CATALOG);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<ModelArchitecture>(MODEL_CATALOG[0]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const categories = ['all', 'Vision', 'NLP / LLM', 'Speech & Audio', 'Generative / Diffusion'];

  const filteredModels = models.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleModelUploaded = (newModel: ModelArchitecture) => {
    setModels([newModel, ...models]);
    setSelectedModel(newModel);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            Model Architecture Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse neural network graphs, inspect operator distributions, and initiate hardware profiling.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer transition-transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Custom Model</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0D1322] border border-[#1E293B] p-4 rounded-2xl">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-[#07090E] border border-[#1E293B] px-3 py-2 rounded-xl text-xs font-mono">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search model, framework, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-[#07090E] font-bold shadow-sm'
                  : 'bg-[#131B2E] text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Tasks' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid & Detail Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Models List (2 Columns on Desktop) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredModels.map((model) => {
            const isSelected = selectedModel.id === model.id;
            return (
              <div
                key={model.id}
                onClick={() => setSelectedModel(model)}
                className={`bg-[#0D1322] border rounded-2xl p-5 space-y-4 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-cyan-500 shadow-lg shadow-cyan-950/40 bg-gradient-to-b from-[#0F172A] to-[#0A0E1A]'
                    : 'border-[#1E293B] hover:border-slate-600 hover:bg-[#131B2E]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                        {model.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-[#1A2338] px-1.5 py-0.5 rounded">
                        {model.framework}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white font-mono mt-1">{model.name}</h3>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-cyan-300">
                    {model.parameterCountFormatted}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {model.description}
                </p>

                <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>{model.totalFlopsGflops} GFLOPs</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWizardWithModel(model.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-[#07090E] font-bold rounded-lg border border-cyan-500/30 transition-all cursor-pointer"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Profile</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Model Detail Panel */}
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  Architecture Inspector
                </span>
                <h3 className="text-base font-bold text-white font-mono mt-0.5">
                  {selectedModel.name}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/60">
                v{selectedModel.version}
              </span>
            </div>

            {/* Tensor Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Input Shape</span>
                <div className="text-cyan-300 font-bold truncate">{selectedModel.inputShape}</div>
              </div>
              <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Output Shape</span>
                <div className="text-emerald-300 font-bold truncate">{selectedModel.outputShape}</div>
              </div>
              <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Total Layers</span>
                <div className="text-white font-bold">{selectedModel.layersCount} ops</div>
              </div>
              <div className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Weights Size</span>
                <div className="text-amber-300 font-bold">{selectedModel.modelSizeBytesMb} MB</div>
              </div>
            </div>

            {/* Operator Breakdown */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Top Execution Time Operators
              </span>
              <div className="space-y-2">
                {selectedModel.topOperators.map((op, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">{op.name} ({op.count}x)</span>
                      <span className="text-cyan-400 font-bold">{op.percentageTime}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#07090E] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                        style={{ width: `${op.percentageTime}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fusion Opportunities */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Detected Operator Fusion Opportunities
              </span>
              {selectedModel.fusionOpportunities.map((fusion, idx) => (
                <div key={idx} className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-emerald-400 font-bold">{fusion.pattern}</span>
                    <span className="text-cyan-300">+{fusion.speedupPct}% Speedup</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{fusion.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-[#1E293B] space-y-2">
            <button
              onClick={() => onOpenWizardWithModel(selectedModel.id)}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Configure Optimization Run</span>
            </button>
          </div>
        </div>
      </div>

      <UploadModelModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onModelUploaded={handleModelUploaded}
      />
    </div>
  );
};
