import React, { useState } from 'react';
import { 
  Upload, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Cpu, 
  SlidersHorizontal, 
  ArrowRight, 
  FileCode, 
  Wrench, 
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { MODEL_CATALOG, HARDWARE_CATALOG, OPERATOR_DIAGNOSTICS } from '../data/mockData';
import { CompilerOptimizationFlags, OperatorDiagnosticWarning } from '../types';

interface CustomModelProfilerProps {
  onNavigate?: (view: string) => void;
  onOpenWizardWithModel?: (modelId: string) => void;
}

export const CustomModelProfiler: React.FC<CustomModelProfilerProps> = ({ onNavigate, onOpenWizardWithModel }) => {
  const [activeTab, setActiveTab] = useState<'flags' | 'diagnostics' | 'custom_graph'>('flags');
  const [selectedModelId, setSelectedModelId] = useState<string>('yolov8x-det');
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>('nvidia-l40s');

  // Custom Graph Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string>('custom_model.onnx');
  const [isCustomUploaded, setIsCustomUploaded] = useState<boolean>(false);
  const [batchSize, setBatchSize] = useState<number>(1);
  const [seqLenOrRes, setSeqLenOrRes] = useState<string>('640x640');

  // Compiler Flags State
  const [compilerFlags, setCompilerFlags] = useState<CompilerOptimizationFlags>({
    trtOptimizationLevel: 5,
    trtWorkspaceSizeGb: 8,
    enableFp8TransformerEngine: true,
    enableFlashAttention2: true,
    enableKernelAutoTuning: true,
    enableCudnnHeuristics: true,
    enableIoBinding: true,
    cpuNumaNodeBinding: true,
    cpuAvx512Vnni: true,
    qnnHtpBurstMode: true,
    onnxGraphOptLevel: 'All'
  });

  // Diagnostics list with applied fixes
  const [diagnostics, setDiagnostics] = useState<OperatorDiagnosticWarning[]>(OPERATOR_DIAGNOSTICS);
  const [fixedIds, setFixedIds] = useState<string[]>([]);

  const handleApplyFix = (id: string) => {
    setFixedIds([...fixedIds, id]);
  };

  const currentModel = MODEL_CATALOG.find(m => m.id === selectedModelId) || MODEL_CATALOG[0];
  const currentHardware = HARDWARE_CATALOG.find(h => h.id === selectedHardwareId) || HARDWARE_CATALOG[0];

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                Custom Graph & Compiler Flags
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Diagnostics Active</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              Compiler Optimization Flags & Operator Diagnostics
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Fine-tune kernel optimization passes, configure memory arenas, and detect hardware-incompatible operators before runtime deployment.
            </p>
          </div>

          {/* Model & Target Silicon Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">Target Model</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              >
                {MODEL_CATALOG.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">Target Silicon</label>
              <select
                value={selectedHardwareId}
                onChange={(e) => setSelectedHardwareId(e.target.value)}
                className="bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              >
                {HARDWARE_CATALOG.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#1E293B]">
          <button
            onClick={() => setActiveTab('flags')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'flags'
                ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Compiler Optimization Suite</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Hardware Fallback Diagnostics ({diagnostics.length - fixedIds.length} Issues)</span>
          </button>

          <button
            onClick={() => setActiveTab('custom_graph')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'custom_graph'
                ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Custom ONNX / Graph File</span>
          </button>
        </div>
      </div>

      {/* TAB 1: COMPILER FLAGS */}
      {activeTab === 'flags' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Flags Toggles */}
          <div className="lg:col-span-8 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold font-mono text-white">Engine Compilation Passes & Flags</h3>
              <p className="text-xs text-slate-400 mt-1">Configure automated graph passes and hardware-specific runtime heuristics.</p>
            </div>

            <div className="space-y-4">
              {/* TensorRT Builder Optimization Level Slider */}
              <div className="bg-[#07090E] p-4 rounded-2xl border border-[#1E293B] space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <div>
                    <span className="font-bold text-white block">TensorRT Builder Optimization Level</span>
                    <span className="text-slate-400 text-[10px]">Level 5 executes full timing heuristics search for all GEMM/Conv kernels.</span>
                  </div>
                  <span className="text-cyan-400 font-bold text-sm bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    Level {compilerFlags.trtOptimizationLevel} (Maximum)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={compilerFlags.trtOptimizationLevel}
                  onChange={(e) => setCompilerFlags({ ...compilerFlags, trtOptimizationLevel: Number(e.target.value) })}
                  className="w-full accent-cyan-400 bg-[#131B2E] cursor-pointer"
                />
              </div>

              {/* Workspace Size Slider */}
              <div className="bg-[#07090E] p-4 rounded-2xl border border-[#1E293B] space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <div>
                    <span className="font-bold text-white block">GPU Workspace Memory Pool</span>
                    <span className="text-slate-400 text-[10px]">Scratch space allocated during engine building for tactic exploration.</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {compilerFlags.trtWorkspaceSizeGb} GB
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="32"
                  step="1"
                  value={compilerFlags.trtWorkspaceSizeGb}
                  onChange={(e) => setCompilerFlags({ ...compilerFlags, trtWorkspaceSizeGb: Number(e.target.value) })}
                  className="w-full accent-emerald-400 bg-[#131B2E] cursor-pointer"
                />
              </div>

              {/* Individual Boolean Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    key: 'enableFlashAttention2',
                    title: 'FlashAttention-2 Kernel Fusion',
                    desc: 'Fuses QK MatMul, Softmax, and V MatMul into a single memory-efficient CUDA kernel.',
                    speedup: '+34% Speedup'
                  },
                  {
                    key: 'enableFp8TransformerEngine',
                    title: 'FP8 Transformer Engine (TE)',
                    desc: 'Utilizes Hopper/Ada FP8 Tensor Cores for GEMM activations and weights.',
                    speedup: '+42% Speedup'
                  },
                  {
                    key: 'enableCudnnHeuristics',
                    title: 'CuDNN Heuristic Tactic Search',
                    desc: 'Auto-tunes convolution algorithms for target tensor aspect ratios.',
                    speedup: '+18% Speedup'
                  },
                  {
                    key: 'enableIoBinding',
                    title: 'Direct IO Binding (Zero-Copy DMA)',
                    desc: 'Pins host-to-device buffers to eliminate CUDA memcpy overheads.',
                    speedup: '+12% Speedup'
                  },
                  {
                    key: 'cpuNumaNodeBinding',
                    title: 'NUMA Node Thread Affinity',
                    desc: 'Pins inference threads to the same CPU socket as PCIe accelerator.',
                    speedup: '+15% Speedup'
                  },
                  {
                    key: 'qnnHtpBurstMode',
                    title: 'Qualcomm HTP Burst Mode',
                    desc: 'Boosts Hexagon Tensor Processor clock frequency during batch bursts.',
                    speedup: '+25% Speedup'
                  }
                ].map((item) => {
                  const isChecked = (compilerFlags as any)[item.key];
                  return (
                    <div 
                      key={item.key}
                      onClick={() => setCompilerFlags({ ...compilerFlags, [item.key]: !isChecked })}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isChecked 
                          ? 'bg-[#131B2E] border-cyan-500/60 shadow-sm' 
                          : 'bg-[#07090E] border-[#1E293B] opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold font-mono text-white">{item.title}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="accent-cyan-400 w-4 h-4 cursor-pointer"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-mono">{item.desc}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-white/5 flex justify-end">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                          {item.speedup}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="lg:col-span-4 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-[#1E293B]">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Compiler Profile</span>
                <h3 className="text-lg font-bold font-mono text-white mt-0.5">Optimized Target Preset</h3>
                <span className="text-xs font-mono text-slate-400">Target: {currentHardware.name}</span>
              </div>

              <div className="bg-[#07090E] p-4 rounded-2xl border border-[#1E293B] space-y-3 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Cumulative Speedup:</span>
                  <span className="font-bold text-emerald-400 text-sm">2.4x Faster</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Memory Bandwidth Efficiency:</span>
                  <span className="font-bold text-cyan-300">92.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">VRAM Footprint:</span>
                  <span className="font-bold text-white">4.2 GB (down from 12.8 GB)</span>
                </div>
              </div>

              <div className="bg-[#131B2E] p-4 rounded-2xl border border-[#27354F] space-y-2 text-xs font-mono">
                <span className="text-[10px] text-cyan-300 font-bold uppercase block">Generated CLI Flags:</span>
                <pre className="text-[10px] text-slate-300 bg-[#07090E] p-2 rounded border border-[#1E293B] overflow-x-auto leading-relaxed">
                  <code>{`corepick compile \\
  --model ${currentModel.slug}.onnx \\
  --target ${currentHardware.id} \\
  --opt-level ${compilerFlags.trtOptimizationLevel} \\
  --workspace ${compilerFlags.trtWorkspaceSizeGb}G \\
  --flash-attn \\
  --fp8-te \\
  --io-bind`}</code>
                </pre>
              </div>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('app-analyze')}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-black text-xs rounded-2xl shadow-lg shadow-cyan-500/20 cursor-pointer transition-transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Compile with Custom Flags</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold font-mono text-white">
              Hardware Incompatibility & Fallback Diagnostic Scanner
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Scans your model graph for unsupported operators, high-overhead tensor memory slices, and CPU fallback bottlenecks.
            </p>
          </div>

          <div className="space-y-4">
            {diagnostics.map((diag) => {
              const isFixed = fixedIds.includes(diag.id);
              return (
                <div 
                  key={diag.id}
                  className={`p-6 rounded-3xl border transition-all ${
                    isFixed 
                      ? 'bg-emerald-950/20 border-emerald-800/40 opacity-75' 
                      : diag.severity === 'CRITICAL'
                      ? 'bg-rose-950/20 border-rose-800/50'
                      : diag.severity === 'WARNING'
                      ? 'bg-amber-950/20 border-amber-800/50'
                      : 'bg-[#131B2E] border-[#27354F]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          diag.severity === 'CRITICAL' 
                            ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                            : diag.severity === 'WARNING'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}>
                          {diag.severity}
                        </span>
                        <span className="text-xs font-mono text-slate-400">Target: {diag.targetHardware}</span>
                      </div>

                      <h4 className="text-base font-bold font-mono text-white">{diag.opName} ({diag.opType})</h4>
                      <p className="text-xs text-slate-300 font-mono leading-relaxed">{diag.issue}</p>

                      <div className="bg-[#07090E] p-3 rounded-xl border border-[#1E293B] text-xs font-mono space-y-1">
                        <span className="text-cyan-400 font-bold block text-[10px] uppercase">Suggested Optimization Rule:</span>
                        <p className="text-slate-300">{diag.suggestedFix}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isFixed ? (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950 text-emerald-300 text-xs font-mono font-bold rounded-xl border border-emerald-800">
                          <Check className="w-4 h-4" />
                          <span>Pre-Fusion Rule Applied</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApplyFix(diag.id)}
                          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#07090E] text-xs font-mono font-bold rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105 flex items-center gap-1.5"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Apply Auto-Fix Pass</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM GRAPH UPLOAD */}
      {activeTab === 'custom_graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold font-mono text-white">Upload Custom Graph or Model Checkpoint</h3>
              <p className="text-xs text-slate-400 mt-1">Accepts ONNX, PyTorch (.pt), SafeTensors, GGUF, or TensorFlow Lite models.</p>
            </div>

            {/* Drag and Drop Zone */}
            <div className="border-2 border-dashed border-[#27354F] hover:border-cyan-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer bg-[#07090E]/60 transition-colors">
              <Upload className="w-10 h-10 text-cyan-400" />
              <div>
                <span className="text-sm font-bold text-white block">Drag & Drop Model File Here</span>
                <span className="text-xs text-slate-400">or click to browse local filesystem (.onnx, .safetensors, .pt, .gguf)</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                Max File Size: 10 GB
              </span>
            </div>

            {/* Dynamic Shape Customization */}
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold block">Dynamic Shape Overrides</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">Batch Size</label>
                  <input
                    type="number"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">Sequence Length / Input Resolution</label>
                  <input
                    type="text"
                    value={seqLenOrRes}
                    onChange={(e) => setSeqLenOrRes(e.target.value)}
                    className="w-full bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Card */}
          <div className="lg:col-span-4 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-[#1E293B]">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Graph Ingestion Status</span>
                <h3 className="text-lg font-bold font-mono text-white mt-0.5">Parsed Graph Properties</h3>
              </div>

              <div className="bg-[#07090E] p-4 rounded-2xl border border-[#1E293B] space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">File Name:</span>
                  <span className="text-cyan-300 font-bold">{uploadedFileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Detected Framework:</span>
                  <span className="text-emerald-400 font-bold">ONNX Opset 18</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Operators:</span>
                  <span className="text-white font-bold">342 Layers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Param Count:</span>
                  <span className="text-white font-bold">43.7 Million</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('app-analyze')}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-black text-xs rounded-2xl shadow-lg shadow-cyan-500/20 cursor-pointer transition-transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Proceed to Profiler Wizard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
