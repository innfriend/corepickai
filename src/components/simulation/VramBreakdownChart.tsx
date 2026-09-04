import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import { SimulationResult, HardwareProfile } from '../../types';
import { HardDrive, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { MeasurementBadge } from '../MeasurementBadge';

interface VramBreakdownChartProps {
  simulation: SimulationResult;
  hardware: HardwareProfile;
  tensorParallelSize?: number;
}

export const VramBreakdownChart: React.FC<VramBreakdownChartProps> = ({
  simulation,
  hardware,
  tensorParallelSize = 1
}) => {
  const totalAvailableGb = hardware.memoryGB * tensorParallelSize;
  const { weightsGb, kvCacheGb, activationsGb, overheadGb } = simulation.vramBreakdown;
  const totalRequiredGb = simulation.vramRequiredGb;
  const freeGb = Math.max(0, totalAvailableGb - totalRequiredGb);
  const isOom = simulation.isOom;
  const usagePct = Math.min(100, (totalRequiredGb / totalAvailableGb) * 100);

  const breakdownData = [
    {
      category: 'Model Weights',
      sizeGb: Number(weightsGb.toFixed(2)),
      color: '#3b82f6', // blue
      description: 'Sharded model parameters loaded into VRAM'
    },
    {
      category: 'KV Cache',
      sizeGb: Number(kvCacheGb.toFixed(2)),
      color: '#8b5cf6', // purple
      description: 'Key-Value attention history for context + output tokens'
    },
    {
      category: 'Activations',
      sizeGb: Number(activationsGb.toFixed(2)),
      color: '#ec4899', // pink
      description: 'Intermediate forward pass GEMM memory buffers'
    },
    {
      category: 'Runtime / Context',
      sizeGb: Number(overheadGb.toFixed(2)),
      color: '#64748b', // slate
      description: 'CUDA context, PagedAttention block tables, and workspace'
    }
  ];

  if (!isOom && freeGb > 0) {
    breakdownData.push({
      category: 'Free VRAM',
      sizeGb: Number(freeGb.toFixed(2)),
      color: '#10b981', // emerald
      description: 'Available headroom for larger batch sizes or context'
    });
  }

  // Stacked horizontal bar data representation
  const stackedData = [
    {
      name: 'VRAM Usage',
      Weights: Number(weightsGb.toFixed(2)),
      'KV Cache': Number(kvCacheGb.toFixed(2)),
      Activations: Number(activationsGb.toFixed(2)),
      Overhead: Number(overheadGb.toFixed(2)),
      Free: Number(freeGb.toFixed(2))
    }
  ];

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white tracking-wide">
              VRAM Capacity & Memory Allocation
            </h3>
            <MeasurementBadge status="SIMULATED" size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total {totalAvailableGb} GB ({tensorParallelSize > 1 ? `${tensorParallelSize}x ${hardware.name}` : hardware.name})
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isOom ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              OOM (Out Of Memory)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Fits in VRAM ({usagePct.toFixed(1)}% full)
            </span>
          )}
        </div>
      </div>

      {/* Progress / Stacked Bar Visualization */}
      <div className="mt-4">
        <div className="flex justify-between items-end text-xs mb-1.5">
          <span className="text-slate-300 font-medium">
            Required: <strong className="text-white">{totalRequiredGb.toFixed(2)} GB</strong> / {totalAvailableGb} GB
          </span>
          <span className={`font-semibold ${isOom ? 'text-rose-400' : 'text-slate-400'}`}>
            {usagePct.toFixed(1)}%
          </span>
        </div>

        {/* Visual Multi-segment Bar */}
        <div className="h-6 w-full bg-slate-950 rounded-lg overflow-hidden flex border border-slate-800 p-0.5">
          <div
            style={{ width: `${Math.min(100, (weightsGb / totalAvailableGb) * 100)}%` }}
            className="bg-blue-600 hover:bg-blue-500 transition-all rounded-l"
            title={`Weights: ${weightsGb.toFixed(2)} GB`}
          />
          <div
            style={{ width: `${Math.min(100, (kvCacheGb / totalAvailableGb) * 100)}%` }}
            className="bg-purple-600 hover:bg-purple-500 transition-all"
            title={`KV Cache: ${kvCacheGb.toFixed(2)} GB`}
          />
          <div
            style={{ width: `${Math.min(100, (activationsGb / totalAvailableGb) * 100)}%` }}
            className="bg-pink-600 hover:bg-pink-500 transition-all"
            title={`Activations: ${activationsGb.toFixed(2)} GB`}
          />
          <div
            style={{ width: `${Math.min(100, (overheadGb / totalAvailableGb) * 100)}%` }}
            className="bg-slate-600 hover:bg-slate-500 transition-all"
            title={`Overhead: ${overheadGb.toFixed(2)} GB`}
          />
          {!isOom && freeGb > 0 && (
            <div
              style={{ width: `${(freeGb / totalAvailableGb) * 100}%` }}
              className="bg-emerald-950/60 hover:bg-emerald-900/60 transition-all rounded-r"
              title={`Free VRAM: ${freeGb.toFixed(2)} GB`}
            />
          )}
        </div>
      </div>

      {/* Grid of memory components */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {/* Model Weights */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span className="text-[11px] text-slate-400 font-medium">Model Weights</span>
          </div>
          <p className="text-base font-bold text-white mt-1">
            {weightsGb.toFixed(2)} <span className="text-xs font-normal text-slate-400">GB</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {((weightsGb / totalAvailableGb) * 100).toFixed(1)}% of VRAM
          </p>
        </div>

        {/* KV Cache */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            <span className="text-[11px] text-slate-400 font-medium">KV Cache</span>
          </div>
          <p className="text-base font-bold text-white mt-1">
            {kvCacheGb.toFixed(2)} <span className="text-xs font-normal text-slate-400">GB</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {((kvCacheGb / totalAvailableGb) * 100).toFixed(1)}% of VRAM
          </p>
        </div>

        {/* Activations */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
            <span className="text-[11px] text-slate-400 font-medium">Activations</span>
          </div>
          <p className="text-base font-bold text-white mt-1">
            {activationsGb.toFixed(2)} <span className="text-xs font-normal text-slate-400">GB</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {((activationsGb / totalAvailableGb) * 100).toFixed(1)}% of VRAM
          </p>
        </div>

        {/* Free Headroom / Deficit */}
        <div className={`p-3 rounded-lg border ${
          isOom 
            ? 'bg-rose-950/40 border-rose-800/60' 
            : 'bg-emerald-950/40 border-emerald-800/60'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${
              isOom ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />
            <span className="text-[11px] text-slate-300 font-medium">
              {isOom ? 'VRAM Deficit' : 'Free Headroom'}
            </span>
          </div>
          <p className={`text-base font-bold mt-1 ${
            isOom ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {isOom ? `+${(totalRequiredGb - totalAvailableGb).toFixed(2)}` : freeGb.toFixed(2)} <span className="text-xs font-normal text-slate-400">GB</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {isOom ? 'Requires more GPUs / Quantization' : 'Safe operating margin'}
          </p>
        </div>
      </div>
    </div>
  );
};
