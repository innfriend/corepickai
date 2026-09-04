import React, { useState } from 'react';
import { FileText, Download, Share2, Check, Printer, Sparkles, Layers } from 'lucide-react';
import { SAMPLE_OPTIMIZATION_JOBS } from '../data/mockData';

interface ReportsCenterViewProps {
  onNavigate: (view: string) => void;
}

export const ReportsCenterView: React.FC<ReportsCenterViewProps> = ({ onNavigate }) => {
  const [selectedJobId, setSelectedJobId] = useState(SAMPLE_OPTIMIZATION_JOBS[0].id);
  const [copied, setCopied] = useState(false);

  const currentJob = SAMPLE_OPTIMIZATION_JOBS.find((j) => j.id === selectedJobId) || SAMPLE_OPTIMIZATION_JOBS[0];

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentJob, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `corepick-report-${currentJob.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            Executive & Engineering Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generate formal hardware audit reports, cost reduction summaries, and architecture breakdown memos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#131B2E] hover:bg-[#1E293B] text-slate-300 hover:text-white text-xs font-bold font-mono rounded-xl border border-[#27354F] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#07090E] text-xs font-extrabold font-mono rounded-xl shadow-lg shadow-cyan-500/20 transition-transform hover:scale-105 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF Report</span>
          </button>
        </div>
      </div>

      {/* Report Document Preview Sheet */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 sm:p-10 space-y-8 max-w-4xl mx-auto w-full shadow-2xl">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b border-[#1E293B] pb-6">
          <div>
            <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              CorePick Silicon Audit & Inference Report
            </div>
            <h2 className="text-2xl font-bold text-white font-mono mt-1">{currentJob.modelName}</h2>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Document Ref: CP-AUDIT-{currentJob.id} • Generated: {new Date(currentJob.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60">
              PASSED PERFORMANCE SLA
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wider">
            1. Executive Findings & Compiler Synthesis
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-[#07090E] border border-[#1E293B] p-4 rounded-2xl">
            {currentJob.aiInsights?.summary || 'The model was compiled with polyhedral tensor loop transformations, achieving sub-3ms latency on NVIDIA RTX 4090 with INT8 quantization, and 115 FPS on Qualcomm Snapdragon X Elite at 14.5W power envelope.'}
          </p>
        </div>

        {/* Hardware Matrix Breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wider">
            2. Verified Multi-Hardware Benchmark Results
          </h3>
          <div className="overflow-x-auto border border-[#1E293B] rounded-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#07090E] text-slate-400 text-[10px] uppercase border-b border-[#1E293B]">
                <tr>
                  <th className="py-2.5 px-3">Device</th>
                  <th className="py-2.5 px-3">Runtime</th>
                  <th className="py-2.5 px-3">Precision</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Throughput</th>
                  <th className="py-2.5 px-3">Power</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60 text-slate-300">
                {currentJob.results.map((r, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-bold text-white">{r.hardwareName}</td>
                    <td className="py-2.5 px-3 text-cyan-300">{r.runtimeEngine}</td>
                    <td className="py-2.5 px-3">{r.precision}</td>
                    <td className="py-2.5 px-3 font-bold text-cyan-400">{r.latencyMs} ms</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">{r.throughputFps} FPS</td>
                    <td className="py-2.5 px-3 text-amber-300">{r.powerConsumptionWatts} W</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Next Steps */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wider">
            3. Recommended Deployment Architecture
          </h3>
          <div className="p-4 bg-[#07090E] border border-cyan-900/40 rounded-2xl text-xs text-slate-300 space-y-2">
            <div><strong>Production Cloud:</strong> Deploy with TensorRT 10.4 C++ harness on RTX 4090 or L40S nodes.</div>
            <div><strong>Edge Robotics / Mobile:</strong> Export quantized QNN DLC model targeted to Qualcomm Hexagon NPU.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
