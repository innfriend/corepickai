import React, { useState } from 'react';
import { Cpu, Search, Filter, Server, Zap, Check, ArrowRight } from 'lucide-react';
import { HardwareSpec, HardwareVendor, HardwareType } from '../types';
import { HARDWARE_CATALOG } from '../data/mockData';

interface HardwareFleetViewProps {
  onNavigate: (view: string) => void;
}

export const HardwareFleetView: React.FC<HardwareFleetViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedHw, setSelectedHw] = useState<HardwareSpec>(HARDWARE_CATALOG[0]);

  const vendors = ['all', 'NVIDIA', 'Qualcomm', 'Intel', 'AMD', 'Apple', 'ARM', 'Google'];
  const types = ['all', 'GPU', 'NPU', 'CPU', 'EDGE_SOC', 'ACCELERATOR'];

  const filteredHardware = HARDWARE_CATALOG.filter((h) => {
    const matchesVendor = selectedVendor === 'all' || h.vendor.toLowerCase() === selectedVendor.toLowerCase();
    const matchesType = selectedType === 'all' || h.type === selectedType;
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.architecture.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesVendor && matchesType && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            Hardware Fleet & Accelerator Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explore 30+ silicon architectures across data center GPUs, edge NPUs, and enterprise CPUs.
          </p>
        </div>

        <button
          onClick={() => onNavigate('app-analyze')}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#07090E] font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Profile Across This Fleet</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0D1322] border border-[#1E293B] p-4 rounded-2xl">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-[#07090E] border border-[#1E293B] px-3 py-2 rounded-xl text-xs font-mono">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search silicon name, arch, memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-mono">
          <span className="text-slate-500">Vendor:</span>
          {vendors.map((v) => (
            <button
              key={v}
              onClick={() => setSelectedVendor(v)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedVendor === v ? 'bg-cyan-500 text-[#07090E] font-bold' : 'bg-[#131B2E] text-slate-400 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Hardware Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHardware.map((hw) => {
          const isSelected = selectedHw.id === hw.id;
          return (
            <div
              key={hw.id}
              onClick={() => setSelectedHw(hw)}
              className={`bg-[#0D1322] border rounded-2xl p-5 space-y-4 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-cyan-500 shadow-xl shadow-cyan-950/40 bg-gradient-to-b from-[#0F172A] to-[#0A0E1A]'
                  : 'border-[#1E293B] hover:border-slate-600 hover:bg-[#131B2E]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                      {hw.vendor}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-[#1A2338] px-1.5 py-0.5 rounded">
                      {hw.formFactor}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white font-mono mt-1">{hw.name}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{hw.architecture} • {hw.processNode}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {hw.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1E293B] text-[11px] font-mono text-slate-300">
                <div>Bandwidth: <span className="text-cyan-400 font-bold">{hw.memoryBandwidthGBs} GB/s</span></div>
                <div>Memory: <span className="text-white font-bold">{hw.memoryGb} GB</span></div>
                <div>INT8 Compute: <span className="text-emerald-400 font-bold">{hw.int8Tops} TOPS</span></div>
                <div>TDP: <span className="text-amber-300 font-bold">{hw.tdpWatts} W</span></div>
              </div>

              <div className="pt-2 flex flex-wrap gap-1">
                {hw.supportedRuntimes.map((r) => (
                  <span key={r} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#07090E] text-slate-400 border border-[#1E293B]">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
