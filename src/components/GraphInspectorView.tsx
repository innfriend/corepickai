import React, { useState } from 'react';
import { 
  Network, 
  Activity, 
  Layers, 
  Sparkles, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Zap, 
  Cpu, 
  ArrowRight, 
  Search, 
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { MODEL_CATALOG, HARDWARE_CATALOG, SAMPLE_GRAPH_NODES, ROOFLINE_DATA, QUANTIZATION_SENSITIVITY_DATA } from '../data/mockData';
import { GraphOperatorNode, PrecisionType } from '../types';

interface GraphInspectorViewProps {
  onNavigate?: (view: string) => void;
}

export const GraphInspectorView: React.FC<GraphInspectorViewProps> = ({ onNavigate }) => {
  const [selectedModelId, setSelectedModelId] = useState<string>('llama-3-8b-instruct');
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>('nvidia-h100-sxm');
  const [activeSubTab, setActiveSubTab] = useState<'graph' | 'roofline' | 'quantization'>('graph');
  const [colorMode, setColorMode] = useState<'latency' | 'bandwidth' | 'quantization'>('latency');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node_flash_attn');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const currentModel = MODEL_CATALOG.find(m => m.id === selectedModelId) || MODEL_CATALOG[0];
  const currentHardware = HARDWARE_CATALOG.find(h => h.id === selectedHardwareId) || HARDWARE_CATALOG[0];
  
  const nodes: GraphOperatorNode[] = SAMPLE_GRAPH_NODES[selectedModelId] || SAMPLE_GRAPH_NODES['llama-3-8b-instruct'] || [];
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0] || null;

  const rooflineConfig = ROOFLINE_DATA[selectedHardwareId] || ROOFLINE_DATA['nvidia-h100-sxm'];
  const quantLayers = QUANTIZATION_SENSITIVITY_DATA[selectedModelId] || QUANTIZATION_SENSITIVITY_DATA['llama-3-8b-instruct'] || [];

  const filteredNodes = nodes.filter(n => 
    n.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.opType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getNodeColor = (node: GraphOperatorNode) => {
    if (colorMode === 'latency') {
      if (node.durationMs > 2.0) return 'border-rose-500 bg-rose-950/40 text-rose-300';
      if (node.durationMs > 1.0) return 'border-amber-500 bg-amber-950/40 text-amber-300';
      return 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300';
    }
    if (colorMode === 'bandwidth') {
      if (node.memoryBandwidthGBs > 2500) return 'border-fuchsia-500 bg-fuchsia-950/40 text-fuchsia-300';
      if (node.memoryBandwidthGBs > 1000) return 'border-indigo-500 bg-indigo-950/40 text-indigo-300';
      return 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300';
    }
    // quantization sensitivity
    if (node.quantizationSensitivityScore > 7.0) return 'border-rose-500 bg-rose-950/40 text-rose-300';
    if (node.quantizationSensitivityScore > 4.0) return 'border-amber-500 bg-amber-950/40 text-amber-300';
    return 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300';
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header & Controls */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                Deep Graph & Roofline Profiler
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Compiler Verified</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              Operator Graph & Roofline Bottleneck Inspector
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Inspect layer-level memory intensity, roofline bounds, and layer-specific quantization sensitivity.
            </p>
          </div>

          {/* Model & Hardware Pickers */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">Target Model</label>
              <select
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value);
                  const newNodes = SAMPLE_GRAPH_NODES[e.target.value] || [];
                  if (newNodes[0]) setSelectedNodeId(newNodes[0].id);
                }}
                className="bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              >
                {MODEL_CATALOG.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
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
                  <option key={h.id} value={h.id}>{h.name} ({h.vendor})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#1E293B]">
          <button
            onClick={() => setActiveSubTab('graph')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'graph'
                ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Interactive Node Graph</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roofline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'roofline'
                ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Operational Intensity & Roofline Model</span>
          </button>

          <button
            onClick={() => setActiveSubTab('quantization')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'quantization'
                ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Quantization Sensitivity Matrix</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE NODE GRAPH */}
      {activeSubTab === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Canvas: Node Graph Explorer */}
          <div className="lg:col-span-8 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-300">Heatmap Mode:</span>
                <div className="flex items-center bg-[#131B2E] p-1 rounded-xl border border-[#27354F] text-xs">
                  <button
                    onClick={() => setColorMode('latency')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${colorMode === 'latency' ? 'bg-cyan-500 text-[#07090E]' : 'text-slate-400 hover:text-white'}`}
                  >
                    Latency (ms)
                  </button>
                  <button
                    onClick={() => setColorMode('bandwidth')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${colorMode === 'bandwidth' ? 'bg-fuchsia-500 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Memory (GB/s)
                  </button>
                  <button
                    onClick={() => setColorMode('quantization')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${colorMode === 'quantization' ? 'bg-amber-500 text-[#07090E]' : 'text-slate-400 hover:text-white'}`}
                  >
                    Quant Sensitivity
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#131B2E] border border-[#27354F] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 w-48 font-mono"
                />
              </div>
            </div>

            {/* Simulated Interactive DAG Canvas */}
            <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-6 min-h-[420px] flex flex-col justify-center items-center relative overflow-hidden">
              {/* Background Graph Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

              <div className="w-full max-w-xl space-y-4 relative z-10">
                {filteredNodes.map((node, index) => {
                  const isSelected = selectedNode?.id === node.id;
                  const colorClass = getNodeColor(node);

                  return (
                    <React.Fragment key={node.id}>
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all cursor-pointer transform hover:scale-[1.01] ${colorClass} ${
                          isSelected ? 'ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/20' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10">
                              {node.opType}
                            </span>
                            <span className="text-sm font-bold font-mono text-white">{node.name}</span>
                          </div>
                          {node.isBottleneck && (
                            <span className="flex items-center gap-1 text-[10px] font-bold font-mono text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80 animate-pulse">
                              <Flame className="w-3 h-3 text-rose-400" />
                              <span>{node.bottleneckCategory || 'Bottleneck'}</span>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-white/10 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-400 block text-[9px]">Latency:</span>
                            <span className="font-bold text-white">{(node.durationMs || 0).toFixed(2)} ms</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">FLOPs:</span>
                            <span className="font-bold text-white">{(node.flopsGflops || 0).toFixed(1)} GFLOPs</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">Bandwidth:</span>
                            <span className="font-bold text-cyan-300">{node.memoryBandwidthGBs || 0} GB/s</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">Arithmetic Int.:</span>
                            <span className="font-bold text-emerald-300">{(node.arithmeticIntensity || 0).toFixed(1)} F/B</span>
                          </div>
                        </div>
                      </div>

                      {/* Directional Down Connector */}
                      {index < filteredNodes.length - 1 && (
                        <div className="flex justify-center py-0.5">
                          <div className="w-0.5 h-4 bg-cyan-500/40 relative">
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 border-r border-b border-cyan-400 rotate-45" />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Inspector Sidebar: Selected Operator Details */}
          <div className="lg:col-span-4 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-5 flex flex-col justify-between">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#1E293B]">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Layer Properties</span>
                  <h3 className="text-lg font-bold font-mono text-white mt-0.5">{selectedNode.name}</h3>
                  <span className="text-xs font-mono text-slate-400">Op: {selectedNode.opType}</span>
                </div>

                {/* Tensor Shapes */}
                <div className="space-y-2 bg-[#07090E] p-3 rounded-2xl border border-[#1E293B]">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Tensor Shapes</span>
                  <div className="text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Input(s):</span>
                      <span className="text-cyan-300 font-bold">{selectedNode.inputShapes.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Output:</span>
                      <span className="text-emerald-300 font-bold">{selectedNode.outputShape}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#131B2E] p-3 rounded-xl border border-[#27354F]">
                    <span className="text-[10px] text-slate-400 block font-mono">Kernel Latency</span>
                    <span className="text-lg font-bold text-white font-mono">{(selectedNode.durationMs || 0).toFixed(2)} ms</span>
                  </div>
                  <div className="bg-[#131B2E] p-3 rounded-xl border border-[#27354F]">
                    <span className="text-[10px] text-slate-400 block font-mono">Memory Traffic</span>
                    <span className="text-lg font-bold text-cyan-300 font-mono">{selectedNode.memoryBandwidthGBs || 0} GB/s</span>
                  </div>
                </div>

                {/* Precision & Quantization Recommendation */}
                <div className="bg-[#07090E] p-4 rounded-2xl border border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Recommended Precision</span>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                      {selectedNode.recommendedPrecision}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Quant Sensitivity (0-10):</span>
                    <span className="font-bold text-amber-300">{(selectedNode.quantizationSensitivityScore || 0).toFixed(1)} / 10</span>
                  </div>
                  <div className="w-full bg-[#131B2E] h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full" 
                      style={{ width: `${(selectedNode.quantizationSensitivityScore || 0) * 10}%` }}
                    />
                  </div>
                </div>

                {/* Operator Attributes & Fusions */}
                {selectedNode.attributes && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Attributes</span>
                    <div className="bg-[#07090E] p-3 rounded-xl border border-[#1E293B] text-xs font-mono space-y-1">
                      {Object.entries(selectedNode.attributes).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-slate-400">{key}:</span>
                          <span className="text-white font-bold">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                Select a graph node to inspect compiler attributes.
              </div>
            )}

            <button
              onClick={() => setActiveSubTab('roofline')}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer transition-transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>View in Roofline Model</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: ROOFLINE MODEL */}
      {activeSubTab === 'roofline' && (
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
            <div>
              <h2 className="text-xl font-bold font-mono text-white">
                Hardware Roofline Model — {currentHardware.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Visualizes operational intensity (FLOPs/byte) against hardware memory bandwidth and compute boundaries.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-slate-300">Memory-Bound Kernels</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Compute-Bound Kernels</span>
              </div>
            </div>
          </div>

          {/* Roofline Chart Container */}
          <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-6 relative min-h-[380px] flex flex-col justify-between">
            {/* Top Ceiling Annotations */}
            <div className="flex justify-between items-center text-xs font-mono border-b border-[#1E293B] pb-3">
              <div className="space-y-0.5">
                <span className="text-slate-400 block text-[10px]">Peak Memory Bandwidth:</span>
                <span className="text-cyan-400 font-bold text-sm">{rooflineConfig.theoreticalBandwidthGBs} GB/s ({currentHardware.memoryType})</span>
              </div>
              <div className="space-y-0.5 text-center">
                <span className="text-slate-400 block text-[10px]">Ridge Point (Flops/Byte):</span>
                <span className="text-amber-400 font-bold text-sm">{(rooflineConfig.ridgePointFlopsPerByte || 0).toFixed(1)} FLOPs/B</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-slate-400 block text-[10px]">Peak Compute Ceiling:</span>
                <span className="text-emerald-400 font-bold text-sm">{rooflineConfig.peakComputeTflops} TFLOPs/s (FP16/INT8)</span>
              </div>
            </div>

            {/* Visual SVG Roofline Canvas */}
            <div className="relative h-64 w-full mt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240">
                {/* Axes */}
                <line x1="40" y1="20" x2="40" y2="200" stroke="#334155" strokeWidth="2" />
                <line x1="40" y1="200" x2="780" y2="200" stroke="#334155" strokeWidth="2" />

                {/* Roofline Sloped Memory Bandwidth line */}
                <line x1="40" y1="190" x2="420" y2="50" stroke="#06B6D4" strokeWidth="3" strokeDasharray="4" />
                {/* Horizontal Compute Ceiling line */}
                <line x1="420" y1="50" x2="780" y2="50" stroke="#10B981" strokeWidth="3" />

                {/* Ridge Point Indicator */}
                <circle cx="420" cy="50" r="5" fill="#F59E0B" />
                <text x="430" y="45" fill="#F59E0B" fontSize="10" fontFamily="monospace">Ridge Point</text>

                {/* Plotted Kernel Points */}
                {rooflineConfig.kernels.map((kernel, idx) => {
                  // Map intensity (0.1 to 500) to X (40 to 760)
                  const normalizedX = Math.min(740, Math.max(60, 40 + Math.log10(Math.max(0.1, kernel.arithmeticIntensity) * 10) * 160));
                  // Map performance (0.1 to 1000) to Y (200 to 50)
                  const normalizedY = Math.max(55, 200 - (kernel.performanceTflops / rooflineConfig.peakComputeTflops) * 150);

                  return (
                    <g key={idx} className="cursor-pointer group">
                      <circle 
                        cx={normalizedX} 
                        cy={normalizedY} 
                        r={6 + (kernel.timePct / 10)} 
                        fill={kernel.isMemoryBound ? '#06B6D4' : '#10B981'} 
                        stroke="#07090E" 
                        strokeWidth="2"
                      />
                      <text 
                        x={normalizedX + 10} 
                        y={normalizedY + 4} 
                        fill="#F1F5F9" 
                        fontSize="10" 
                        fontFamily="monospace"
                        className="opacity-90 group-hover:opacity-100 font-bold"
                      >
                        {kernel.name} ({kernel.timePct}% time)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X-Axis labels */}
            <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-[#1E293B]">
              <span>0.1 FLOPs/Byte (Memory-Bound Region)</span>
              <span>10 FLOPs/Byte</span>
              <span>100 FLOPs/Byte</span>
              <span>1000 FLOPs/Byte (Compute-Bound Region)</span>
            </div>
          </div>

          {/* Roofline Kernel Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400">
                  <th className="py-2.5 px-3">Kernel Function</th>
                  <th className="py-2.5 px-3">Op Type</th>
                  <th className="py-2.5 px-3">Arithmetic Intensity</th>
                  <th className="py-2.5 px-3">Attained Performance</th>
                  <th className="py-2.5 px-3">% Execution Time</th>
                  <th className="py-2.5 px-3">Limiting Bound</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {rooflineConfig.kernels.map((kernel, idx) => (
                  <tr key={idx} className="hover:bg-[#131B2E]">
                    <td className="py-3 px-3 font-bold text-white">{kernel.name}</td>
                    <td className="py-3 px-3 text-cyan-300">{kernel.opType}</td>
                    <td className="py-3 px-3 text-slate-300">{(kernel.arithmeticIntensity || 0).toFixed(1)} FLOPs/B</td>
                    <td className="py-3 px-3 font-bold text-emerald-300">{(kernel.performanceTflops || 0).toFixed(1)} TFLOPs/s</td>
                    <td className="py-3 px-3 text-slate-300">{kernel.timePct}%</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        kernel.isMemoryBound 
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' 
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {kernel.isMemoryBound ? 'Memory Bandwidth Bound' : 'Compute Bound'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUANTIZATION SENSITIVITY MATRIX */}
      {activeSubTab === 'quantization' && (
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold font-mono text-white">
              Layer-by-Layer Quantization Sensitivity & Mixed Precision Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Identify outlier layers causing accuracy loss during INT8 / INT4 conversion and assign optimal mixed-precision rules.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] text-slate-400 bg-[#07090E]/60">
                  <th className="py-3 px-3">Layer / Operator</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">FP32 / FP16 Metric</th>
                  <th className="py-3 px-3">INT8 Metric</th>
                  <th className="py-3 px-3">INT4 Metric</th>
                  <th className="py-3 px-3">SNR Loss (dB)</th>
                  <th className="py-3 px-3">VRAM Savings</th>
                  <th className="py-3 px-3">Recommended</th>
                  <th className="py-3 px-3">Compiler Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {quantLayers.map((layer, idx) => (
                  <tr key={idx} className="hover:bg-[#131B2E]">
                    <td className="py-3.5 px-3 font-bold text-white">{layer.layerName}</td>
                    <td className="py-3.5 px-3 text-cyan-300">{layer.opType}</td>
                    <td className="py-3.5 px-3 text-slate-300">{layer.fp16PerpOrMap}</td>
                    <td className="py-3.5 px-3 font-semibold text-amber-300">{layer.int8PerpOrMap}</td>
                    <td className="py-3.5 px-3 font-semibold text-rose-300">{layer.int4PerpOrMap}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        layer.snrLossDb < -15 
                          ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {layer.snrLossDb} dB
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-emerald-300 font-bold">
                      {layer.weightSizeMbFp16 - layer.weightSizeMbInt4} MB
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold text-[11px]">
                        {layer.recommendedPrecision}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 max-w-xs text-[11px] leading-relaxed">
                      {layer.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
