import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, Cpu, ShieldCheck, Sparkles } from 'lucide-react';

interface CliHubViewProps {
  onNavigate: (view: string) => void;
}

export const CliHubView: React.FC<CliHubViewProps> = ({ onNavigate }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [terminalInput, setTerminalInput] = useState('corepick run --model yolov8x.onnx --target rtx4090');
  const [terminalOutputs, setTerminalOutputs] = useState<string[]>([
    'CorePick Local Daemon v2.5.0 [Connected to local CUDA 12.4 & QNN 2.24]',
    'Ready for commands. Type "help" or run a profiling task.',
  ]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const newOutputs = [
      ...terminalOutputs,
      `$ ${cmd}`,
      '⚡ [CorePick] Loading ONNX graph structure...',
      '🔍 [Optimizer] Running TensorRT polyhedral loop fusion (Level 5)...',
      '✔ [Benchmark] Completed 1,000 warmup passes: Latency = 2.34 ms | Throughput = 427 FPS',
      '🚀 [Export] Generated TensorRT engine artifact at dist/model.engine (48.2 MB)',
    ];
    setTerminalOutputs(newOutputs);
    setTerminalInput('');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            CLI & Local Profiling Agent Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Run the CorePick open-source hardware profiling daemon directly on your workstation or edge cluster.
          </p>
        </div>

        <button
          onClick={() => onNavigate('app-analyze')}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#07090E] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <Cpu className="w-4 h-4" />
          <span>Launch Web Profiler</span>
        </button>
      </div>

      {/* Interactive Terminal Playground */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Terminal className="w-4 h-4" />
            <span>Interactive CLI Shell Emulator</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
            Daemon: Connected (Localhost)
          </span>
        </div>

        {/* Terminal Screen */}
        <div className="bg-[#07090E] border border-[#1E293B] rounded-2xl p-4 h-72 overflow-y-auto font-mono text-xs text-slate-200 space-y-2">
          {terminalOutputs.map((line, idx) => (
            <div key={idx} className={line.startsWith('$') ? 'text-cyan-400 font-bold' : line.startsWith('✔') ? 'text-emerald-400' : 'text-slate-300'}>
              {line}
            </div>
          ))}
        </div>

        {/* Terminal Input Form */}
        <form onSubmit={handleRunCommand} className="flex items-center gap-2 bg-[#07090E] border border-[#1E293B] rounded-xl px-3 py-2 text-xs font-mono">
          <span className="text-cyan-400 font-bold">$</span>
          <input
            type="text"
            value={terminalInput}
            onChange={(e) => setTerminalInput(e.target.value)}
            placeholder="Type command (e.g. corepick profile model.onnx --target=rtx4090)"
            className="w-full bg-transparent text-white focus:outline-none placeholder-slate-600"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-cyan-500 text-[#07090E] font-bold rounded-lg cursor-pointer"
          >
            Execute
          </button>
        </form>
      </div>

      {/* Command Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white font-mono">Local Hardware In-the-Loop Daemon</h4>
            <button
              onClick={() => copyToClipboard('corepick daemon start --port=8900 --allow-gpu', 'c1')}
              className="p-1.5 rounded-lg bg-[#131B2E] text-slate-400 hover:text-white"
            >
              {copiedId === 'c1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Starts the local daemon to allow the CorePick web app to dispatch hardware jobs directly to your local GPU / NPU.
          </p>
          <pre className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl font-mono text-xs text-cyan-300">
            <code>corepick daemon start --port=8900 --allow-gpu</code>
          </pre>
        </div>

        <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white font-mono">Automated CI/CD Profiling Action</h4>
            <button
              onClick={() => copyToClipboard('corepick ci --model=./model.onnx --fail-if-latency-exceeds=5ms', 'c2')}
              className="p-1.5 rounded-lg bg-[#131B2E] text-slate-400 hover:text-white"
            >
              {copiedId === 'c2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Embed hardware latency regression gates directly inside your GitHub Actions or GitLab CI workflows.
          </p>
          <pre className="p-3 bg-[#07090E] border border-[#1E293B] rounded-xl font-mono text-xs text-cyan-300">
            <code>corepick ci --model=./model.onnx --fail-if-latency-exceeds=5ms</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
