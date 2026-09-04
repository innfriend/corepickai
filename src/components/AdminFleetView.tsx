import React, { useState } from 'react';
import { Server, Activity, Cpu, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { HARDWARE_CATALOG } from '../data/mockData';

interface AdminFleetViewProps {
  onNavigate: (view: string) => void;
}

export const AdminFleetView: React.FC<AdminFleetViewProps> = ({ onNavigate }) => {
  const [nodes, setNodes] = useState([
    {
      id: 'node-us-east-h100-01',
      name: 'NVIDIA H100 SXM5 Node #1',
      region: 'us-east (Virginia)',
      status: 'idle',
      tempC: 42,
      utilizationPct: 12,
      vramUsedGb: 8.2,
      vramTotalGb: 80,
      activeJob: 'None (Ready)',
    },
    {
      id: 'node-us-east-h100-02',
      name: 'NVIDIA H100 SXM5 Node #2',
      region: 'us-east (Virginia)',
      status: 'benchmarking',
      tempC: 68,
      utilizationPct: 98,
      vramUsedGb: 64.0,
      vramTotalGb: 80,
      activeJob: 'LLaMA-3-8B AWQ Profiling (Job #opt-8812)',
    },
    {
      id: 'node-edge-qcom-01',
      name: 'Qualcomm Snapdragon X Elite Testbed',
      region: 'local-lab-sandiego',
      status: 'idle',
      tempC: 38,
      utilizationPct: 4,
      vramUsedGb: 2.1,
      vramTotalGb: 32,
      activeJob: 'None (Ready)',
    },
    {
      id: 'node-workstation-rtx-01',
      name: 'NVIDIA RTX 4090 Workstation #1',
      region: 'eu-west (Frankfurt)',
      status: 'benchmarking',
      tempC: 62,
      utilizationPct: 88,
      vramUsedGb: 16.8,
      vramTotalGb: 24,
      activeJob: 'YOLOv8x Polyhedral Loop Warmup',
    },
  ]);

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            Hardware Worker Nodes & Fleet Health
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time telemetry, thermal sensors, and job queue dispatchers across cloud and local testbeds.
          </p>
        </div>

        <button
          onClick={() => onNavigate('app-analyze')}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#07090E] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Dispatch Benchmark</span>
        </button>
      </div>

      {/* Cluster Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-5 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Total Online Nodes</span>
          <div className="text-2xl font-extrabold font-mono text-white">4 Active / 4 Healthy</div>
        </div>
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-5 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Avg Cluster Load</span>
          <div className="text-2xl font-extrabold font-mono text-cyan-400">50.5% GPU Util</div>
        </div>
        <div className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-5 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Queued Compilation Jobs</span>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">0 Tasks in Queue</div>
        </div>
      </div>

      {/* Node Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nodes.map((node) => (
          <div key={node.id} className="bg-[#0D1322] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">{node.name}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    node.status === 'benchmarking'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {node.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{node.region} • ID: {node.id}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-[#07090E] border border-[#1E293B] rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase">GPU Load</span>
                <div className="text-cyan-300 font-bold">{node.utilizationPct}%</div>
              </div>
              <div className="p-2.5 bg-[#07090E] border border-[#1E293B] rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase">VRAM</span>
                <div className="text-white font-bold">{node.vramUsedGb} / {node.vramTotalGb} GB</div>
              </div>
              <div className="p-2.5 bg-[#07090E] border border-[#1E293B] rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase">Temp</span>
                <div className="text-amber-400 font-bold">{node.tempC}°C</div>
              </div>
            </div>

            <div className="text-xs font-mono pt-2 border-t border-[#1E293B] flex items-center justify-between text-slate-400">
              <span className="truncate">Active: <span className="text-slate-200">{node.activeJob}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
