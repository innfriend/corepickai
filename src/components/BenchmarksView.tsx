import React, { useState } from 'react';
import { BarChart3, Search, Download, CheckCircle2, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { SAMPLE_OPTIMIZATION_JOBS, HARDWARE_CATALOG, MODEL_CATALOG } from '../data/mockData';
import { BenchmarkDisclaimerSection } from './BenchmarkDisclaimerSection';

interface BenchmarksViewProps {
  onNavigate: (view: string) => void;
}

export const BenchmarksView: React.FC<BenchmarksViewProps> = ({ onNavigate }) => {
  const [selectedTask, setSelectedTask] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const publicRuns = [
    {
      model: 'YOLOv8x (Detection)',
      task: 'Vision',
      hardware: 'NVIDIA H100 SXM5',
      runtime: 'TensorRT 10.4',
      precision: 'INT8',
      latency: '1.12 ms',
      throughput: '892.8 FPS',
      power: '340 W',
      efficiency: '2.62 FPS/W',
      verified: true,
    },
    {
      model: 'YOLOv8x (Detection)',
      task: 'Vision',
      hardware: 'AMD Instinct MI300X (192GB)',
      runtime: 'ROCm 6.2 / vLLM',
      precision: 'INT8',
      latency: '1.08 ms',
      throughput: '925.9 FPS',
      power: '360 W',
      efficiency: '2.57 FPS/W',
      verified: true,
    },
    {
      model: 'YOLOv8x (Detection)',
      task: 'Vision',
      hardware: 'Intel Gaudi 3 AI Accelerator',
      runtime: 'OpenVINO 2026.1 / Habana SynapseAI',
      precision: 'INT8',
      latency: '1.38 ms',
      throughput: '724.6 FPS',
      power: '310 W',
      efficiency: '2.33 FPS/W',
      verified: true,
    },
    {
      model: 'YOLOv8x (Detection)',
      task: 'Vision',
      hardware: 'NVIDIA RTX 4090',
      runtime: 'TensorRT 10.4',
      precision: 'INT8',
      latency: '2.34 ms',
      throughput: '427.3 FPS',
      power: '195 W',
      efficiency: '2.19 FPS/W',
      verified: true,
    },
    {
      model: 'YOLOv8x (Detection)',
      task: 'Vision',
      hardware: 'Intel Core Ultra 200V NPU',
      runtime: 'OpenVINO NPU Plugin',
      precision: 'INT8',
      latency: '7.90 ms',
      throughput: '126.5 FPS',
      power: '12.0 W',
      efficiency: '10.54 FPS/W',
      verified: true,
    },
    {
      model: 'YOLOv8x (Detection)',
      task: 'Vision',
      hardware: 'Qualcomm Snapdragon X Elite',
      runtime: 'QNN 2.24',
      precision: 'INT8',
      latency: '8.64 ms',
      throughput: '115.7 FPS',
      power: '14.5 W',
      efficiency: '7.98 FPS/W',
      verified: true,
    },
    {
      model: 'Meta LLaMA-3-8B (Instruct)',
      task: 'NLP / LLM',
      hardware: 'NVIDIA H100 SXM5',
      runtime: 'vLLM (Marlin AWQ)',
      precision: 'INT4',
      latency: '14.2 ms',
      throughput: '2,253 tokens/s',
      power: '680 W',
      efficiency: '3.31 t/s/W',
      verified: true,
    },
    {
      model: 'Meta LLaMA-3-8B (Instruct)',
      task: 'NLP / LLM',
      hardware: 'Intel Gaudi 3 (128GB)',
      runtime: 'vLLM-Gaudi (Habana HPU)',
      precision: 'FP8',
      latency: '16.1 ms',
      throughput: '1,980 tokens/s',
      power: '580 W',
      efficiency: '3.41 t/s/W',
      verified: true,
    },
    {
      model: 'Meta LLaMA-3-8B (Instruct)',
      task: 'NLP / LLM',
      hardware: 'Intel Xeon Platinum 8592+ (AMX)',
      runtime: 'OpenVINO GenAI (INT4 AWQ)',
      precision: 'INT4',
      latency: '34.8 ms',
      throughput: '215 tokens/s',
      power: '260 W',
      efficiency: '0.83 t/s/W',
      verified: true,
    },
    {
      model: 'Meta LLaMA-3-8B (Instruct)',
      task: 'NLP / LLM',
      hardware: 'AMD Instinct MI300X',
      runtime: 'vLLM ROCm',
      precision: 'FP16',
      latency: '18.5 ms',
      throughput: '1,729 tokens/s',
      power: '720 W',
      efficiency: '2.40 t/s/W',
      verified: true,
    },
    {
      model: 'Meta LLaMA-3-8B (Instruct)',
      task: 'NLP / LLM',
      hardware: 'AMD Ryzen AI 9 HX 370 (NPU)',
      runtime: 'Ryzen AI / ONNX Runtime (Block FP16)',
      precision: 'INT4',
      latency: '29.4 ms',
      throughput: '34.0 tokens/s',
      power: '14.0 W',
      efficiency: '2.42 t/s/W',
      verified: true,
    },
    {
      model: 'OpenAI Whisper-Large-v3',
      task: 'Speech & Audio',
      hardware: 'NVIDIA L40S',
      runtime: 'TensorRT-LLM',
      precision: 'FP16',
      latency: '12.4 ms',
      throughput: '80.6x Realtime',
      power: '280 W',
      efficiency: '0.28x / W',
      verified: true,
    },
  ];

  const filteredRuns = publicRuns.filter((r) => {
    const matchesTask = selectedTask === 'all' || r.task === selectedTask;
    const matchesSearch =
      r.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.hardware.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.runtime.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTask && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            Public Benchmark Leaderboards
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Standardized, verified, and reproducible AI inference benchmarks across hardware vendors.
          </p>
        </div>

        <button
          onClick={() => onNavigate('app-analyze')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Submit Benchmark Run</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0D1322] border border-[#1E293B] p-4 rounded-2xl">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-[#07090E] border border-[#1E293B] px-3 py-2 rounded-xl text-xs font-mono">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by model or hardware..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-mono">
          {['all', 'Vision', 'NLP / LLM', 'Speech & Audio'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTask(t)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedTask === t ? 'bg-cyan-500 text-[#07090E] font-bold' : 'bg-[#131B2E] text-slate-400 hover:text-white'
              }`}
            >
              {t === 'all' ? 'All Models' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Benchmarks Table */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#07090E] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E293B]">
              <tr>
                <th className="py-3.5 px-4">Model & Task</th>
                <th className="py-3.5 px-4">Target Hardware</th>
                <th className="py-3.5 px-4">Runtime Engine</th>
                <th className="py-3.5 px-4">Precision</th>
                <th className="py-3.5 px-4">Latency</th>
                <th className="py-3.5 px-4">Throughput</th>
                <th className="py-3.5 px-4">Power</th>
                <th className="py-3.5 px-4">Efficiency</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60 text-slate-300">
              {filteredRuns.map((run, idx) => (
                <tr key={idx} className="hover:bg-[#131B2E] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{run.model}</div>
                    <div className="text-[10px] text-cyan-400">{run.task}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{run.hardware}</td>
                  <td className="py-3.5 px-4 text-slate-400">{run.runtime}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-1.5 py-0.5 rounded bg-[#1A2338] text-slate-300 text-[10px]">
                      {run.precision}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-cyan-400">{run.latency}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{run.throughput}</td>
                  <td className="py-3.5 px-4 text-amber-300">{run.power}</td>
                  <td className="py-3.5 px-4 text-indigo-300 font-bold">{run.efficiency}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Global Benchmark & Performance Metrics Disclaimer Section */}
        <BenchmarkDisclaimerSection onNavigate={onNavigate} className="mt-8" />
      </div>
    </div>
  );
};
