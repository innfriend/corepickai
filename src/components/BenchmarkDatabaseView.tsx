import React, { useState, useMemo } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  Copy, 
  Check, 
  SlidersHorizontal,
  Server,
  Cpu,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { BENCHMARK_DATABASE } from '../data/mockData';
import { BenchmarkDatabaseRecord, MeasurementProvenance } from '../types';

interface BenchmarkDatabaseViewProps {
  onNavigate: (view: string) => void;
}

export const BenchmarkDatabaseView: React.FC<BenchmarkDatabaseViewProps> = ({ onNavigate }) => {
  const [activeProvenance, setActiveProvenance] = useState<MeasurementProvenance | 'ALL'>('ALL');
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('all');
  const [selectedHwFilter, setSelectedHwFilter] = useState<string>('all');
  const [selectedRuntimeFilter, setSelectedRuntimeFilter] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [selectedRecordForCli, setSelectedRecordForCli] = useState<BenchmarkDatabaseRecord | null>(BENCHMARK_DATABASE[0]);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  // Filtered Benchmarks
  const filteredBenchmarks = useMemo(() => {
    return BENCHMARK_DATABASE.filter((b) => {
      if (activeProvenance !== 'ALL' && b.provenance !== activeProvenance) {
        return false;
      }
      if (verifiedOnly && !b.isVerified) {
        return false;
      }
      if (selectedModelFilter !== 'all' && b.modelId !== selectedModelFilter) {
        return false;
      }
      if (selectedHwFilter !== 'all' && b.hardwareId !== selectedHwFilter) {
        return false;
      }
      if (selectedRuntimeFilter !== 'all' && b.runtime !== selectedRuntimeFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          b.modelName.toLowerCase().includes(q) ||
          b.hardwareName.toLowerCase().includes(q) ||
          b.runtime.toLowerCase().includes(q) ||
          b.source.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeProvenance, verifiedOnly, selectedModelFilter, selectedHwFilter, selectedRuntimeFilter, searchTerm]);

  // Provenance Badge Helper
  const renderProvenanceBadge = (provenance: MeasurementProvenance) => {
    switch (provenance) {
      case 'MEASURED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            MEASURED LAB
          </span>
        );
      case 'VENDOR_REPORTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
            <Server className="w-3 h-3 text-blue-400" />
            VENDOR REPORTED
          </span>
        );
      case 'COMMUNITY_REPORTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" />
            COMMUNITY REPORTED
          </span>
        );
      case 'ESTIMATED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-400" />
            ANALYTICAL ESTIMATE
          </span>
        );
    }
  };

  // Generate Reproducible CLI
  const getReproductionCli = (record: BenchmarkDatabaseRecord) => {
    if (record.runtime === 'vLLM') {
      return `# CorePick Reproducible Benchmark Command for vLLM
python3 -m vllm.entrypoints.openai.api_server \\
  --model ${record.modelId} \\
  --dtype ${record.precision.toLowerCase()} \\
  --max-model-len ${record.inputTokens + record.outputTokens} &

# Execute official throughput benchmark harness
python3 -m vllm.benchmarks.benchmark_throughput \\
  --backend vllm \\
  --model ${record.modelId} \\
  --dataset-name random \\
  --num-prompts 200 \\
  --input-len ${record.inputTokens} \\
  --output-len ${record.outputTokens} \\
  --batch-size ${record.batchSize}`;
    } else if (record.runtime === 'SGLang') {
      return `# CorePick Reproducible Benchmark Command for SGLang
python3 -m sglang.launch_server \\
  --model-path ${record.modelId} \\
  --port 30000 &

python3 -m sglang.bench_serving \\
  --backend sglang \\
  --num-prompts 200 \\
  --input-len ${record.inputTokens} \\
  --output-len ${record.outputTokens} \\
  --batch-size ${record.batchSize}`;
    } else {
      return `# CorePick Benchmark Specification
# Target: ${record.hardwareName} | Model: ${record.modelName}
# Precision: ${record.precision} | Batch: ${record.batchSize}
# Methodology: ${record.methodology}`;
    }
  };

  const handleCopyCli = () => {
    if (!selectedRecordForCli) return;
    navigator.clipboard.writeText(getReproductionCli(selectedRecordForCli));
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[#1E293B] bg-[#0A0D14]/80 backdrop-blur px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                VERIFIED BENCHMARK DATABASE
              </span>
              <span className="text-xs font-mono text-slate-400">
                Physical Hardware Evidence & Calibrated Measurements
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              Inference Benchmark Intelligence & Evidence
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-2xl">
              Transparent, multi-source benchmarks with rigorous provenance tracking. We strictly distinguish between physically measured lab tests, vendor claims, and analytical predictions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('app-optimizer')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg cursor-pointer"
            >
              <span>Launch Optimizer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* PROVENANCE TABS & METRICS BAR */}
        <div className="bg-[#0D1322] p-4 rounded-2xl border border-[#1E293B] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Provenance Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All Records' },
                { id: 'MEASURED', label: '🟢 Measured (Physical Lab)' },
                { id: 'VENDOR_REPORTED', label: '🔵 Vendor Reported' },
                { id: 'COMMUNITY_REPORTED', label: '🟣 Community Verified' },
                { id: 'ESTIMATED', label: '🟡 Analytical Model' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProvenance(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                    activeProvenance === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'bg-[#07090E] text-slate-400 hover:text-white border border-[#27354F]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Strict Verified Toggle */}
            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-[#27354F] text-cyan-500 focus:ring-0"
              />
              <span>Verified Only</span>
            </label>
          </div>

          {/* Search & Select Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#1E293B] font-mono text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Search Keywords:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Model, GPU, runtime..."
                  className="w-full bg-[#07090E] border border-[#27354F] rounded-xl pl-8 pr-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Filter by Model:</label>
              <select
                value={selectedModelFilter}
                onChange={(e) => setSelectedModelFilter(e.target.value)}
                className="w-full bg-[#07090E] border border-[#27354F] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="all">All Models</option>
                <option value="meta-llama-3-8b">Llama 3 8B</option>
                <option value="meta-llama-3-70b">Llama 3 70B</option>
                <option value="deepseek-v3-moe">DeepSeek-V3 (671B MoE)</option>
                <option value="qwen-2.5-14b">Qwen 2.5 14B</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Filter by Hardware:</label>
              <select
                value={selectedHwFilter}
                onChange={(e) => setSelectedHwFilter(e.target.value)}
                className="w-full bg-[#07090E] border border-[#27354F] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="all">All Hardware</option>
                <option value="nvidia-h100-sxm">NVIDIA H100 SXM5</option>
                <option value="nvidia-h200-sxm">NVIDIA H200 SXM5</option>
                <option value="nvidia-b200">NVIDIA B200 (192GB)</option>
                <option value="amd-mi300x">AMD Instinct MI300X</option>
                <option value="apple-m3-max">Apple M3 Max</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Filter by Runtime:</label>
              <select
                value={selectedRuntimeFilter}
                onChange={(e) => setSelectedRuntimeFilter(e.target.value)}
                className="w-full bg-[#07090E] border border-[#27354F] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="all">All Runtimes</option>
                <option value="vLLM">vLLM</option>
                <option value="SGLang">SGLang</option>
                <option value="TensorRT-LLM">TensorRT-LLM</option>
                <option value="CoreML">CoreML</option>
              </select>
            </div>
          </div>
        </div>

        {/* BENCHMARKS TABLE */}
        <div className="bg-[#0D1322] rounded-2xl border border-[#1E293B] overflow-hidden">
          <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Benchmark Evidence Registry ({filteredBenchmarks.length} records)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Click row to view reproduction CLI
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#07090E] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#1E293B]">
                <tr>
                  <th className="py-3 px-4">Model & Architecture</th>
                  <th className="py-3 px-3">Accelerator</th>
                  <th className="py-3 px-3">Runtime</th>
                  <th className="py-3 px-3">Precision</th>
                  <th className="py-3 px-3">Workload (In/Out/Batch)</th>
                  <th className="py-3 px-3">Throughput</th>
                  <th className="py-3 px-3">TTFT / ITL</th>
                  <th className="py-3 px-3">Provenance</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredBenchmarks.map((b) => {
                  const isSelected = selectedRecordForCli?.id === b.id;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedRecordForCli(b)}
                      className={`hover:bg-[#131B2E]/60 transition-colors cursor-pointer ${
                        isSelected ? 'bg-cyan-950/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {b.modelName}
                          {b.isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" title="Verified Test" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">{b.architecture}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{b.hardwareName}</div>
                        <div className="text-[10px] text-slate-500">{b.hardwareVendor}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        <div>{b.runtime}</div>
                        <div className="text-[10px] text-slate-500">{b.runtimeVersion}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-[#07090E] text-cyan-300 border border-[#27354F] font-semibold text-[11px]">
                          {b.precision}
                        </span>
                        <div className="text-[10px] text-slate-500">{b.quantization}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        <div>{b.inputTokens} in / {b.outputTokens} out</div>
                        <div className="text-[10px] text-slate-500">Batch {b.batchSize} (Conc {b.concurrency})</div>
                      </td>

                      <td className="py-3 px-3 text-emerald-400 font-bold">
                        {b.throughputTps.toFixed(1)} tok/s
                      </td>

                      <td className="py-3 px-3 text-cyan-300">
                        <div>{b.ttftMs.toFixed(1)} ms</div>
                        <div className="text-[10px] text-slate-500">{b.itlMs.toFixed(2)} ms/tok</div>
                      </td>

                      <td className="py-3 px-3">
                        {renderProvenanceBadge(b.provenance)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordForCli(b);
                          }}
                          className="px-2 py-1 rounded bg-[#07090E] hover:bg-[#1E293B] text-slate-300 text-[11px] border border-[#27354F]"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SELECTED BENCHMARK DETAIL & REPRODUCIBLE COMMAND GENERATOR */}
        {selectedRecordForCli && (
          <div className="bg-[#0D1322] rounded-2xl border border-cyan-800/40 p-6 space-y-4 font-mono">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#1E293B]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400">Selected Benchmark Environment:</span>
                  {renderProvenanceBadge(selectedRecordForCli.provenance)}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {selectedRecordForCli.modelName} on {selectedRecordForCli.hardwareName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Source: <strong className="text-slate-200">{selectedRecordForCli.source}</strong> · Date: {selectedRecordForCli.date}
                </p>
              </div>

              <button
                onClick={handleCopyCli}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer self-start md:self-auto"
              >
                {copiedCli ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCli ? 'Copied to Clipboard' : 'Copy Reproduction CLI'}</span>
              </button>
            </div>

            {/* Methodology Note */}
            <div className="p-3 bg-[#07090E] rounded-xl border border-[#1E293B] text-xs">
              <span className="text-slate-400 font-bold block mb-1">Experimental Methodology & Harness:</span>
              <p className="text-slate-300">{selectedRecordForCli.methodology}</p>
            </div>

            {/* Code Snippet Box */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 block">Reproducible Benchmark Script:</span>
              <pre className="p-4 bg-[#07090E] rounded-xl border border-[#27354F] text-xs text-emerald-400 overflow-x-auto leading-relaxed">
                {getReproductionCli(selectedRecordForCli)}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
