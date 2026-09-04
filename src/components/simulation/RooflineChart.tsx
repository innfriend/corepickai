import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
  Legend,
  ReferenceArea
} from 'recharts';
import { HardwareProfile, SimulationResult } from '../../types';
import { Activity, HelpCircle, Layers, Cpu, Database, AlertCircle } from 'lucide-react';
import { MeasurementBadge } from '../MeasurementBadge';

interface RooflineChartProps {
  hardware: HardwareProfile;
  simulation: SimulationResult;
  modelName: string;
  precision: string;
  tensorParallelSize?: number;
}

export const RooflineChart: React.FC<RooflineChartProps> = ({
  hardware,
  simulation,
  modelName,
  precision,
  tensorParallelSize = 1
}) => {
  const [showPrefill, setShowPrefill] = useState(true);
  const [showDecode, setShowDecode] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  const memBwGBs = (hardware.memoryBandwidthGBs * tensorParallelSize) / 1000; // TB/s
  const peakTflops = simulation.roofline.computeCeilingTflops;
  const kneeIntensity = peakTflops / memBwGBs; // FLOP/Byte

  // Generate log-spaced data points for Roofline Curve
  const intensities = [
    0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0, 128.0, 256.0, 512.0, 1024.0
  ];

  const data = intensities.map((intensity) => {
    // Memory bound limit: Performance = Bandwidth * Intensity
    const memBoundTflops = memBwGBs * intensity;
    // Attainable: min(Peak Compute, Memory Limit)
    const attainableTflops = Math.min(peakTflops, memBoundTflops);

    return {
      intensity: intensity,
      intensityLog: Math.log10(intensity),
      bandwidthLine: memBoundTflops <= peakTflops * 1.5 ? Number(memBoundTflops.toFixed(2)) : null,
      computeCeiling: Number(peakTflops.toFixed(1)),
      attainable: Number(attainableTflops.toFixed(2)),
      intensityLabel: intensity >= 1 ? `${intensity} FLOP/B` : `${intensity} FLOP/B`
    };
  });

  const decodeIntensity = Number(simulation.decode.arithmeticIntensity.toFixed(2));
  const decodeAttainableTflops = Number(
    Math.min(peakTflops, memBwGBs * simulation.decode.arithmeticIntensity).toFixed(1)
  );

  const prefillIntensity = Number(simulation.prefill.arithmeticIntensity.toFixed(2));
  const prefillAttainableTflops = Number(
    Math.min(peakTflops, memBwGBs * simulation.prefill.arithmeticIntensity).toFixed(1)
  );

  const isDecodeMemBound = decodeIntensity < kneeIntensity;
  const isPrefillComputeBound = prefillIntensity >= kneeIntensity;

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white tracking-wide">
              Analytical Roofline Performance Model
            </h3>
            <MeasurementBadge status="SIMULATED" size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing compute vs memory bandwidth ceilings on {hardware.name} ({precision})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>How to Read</span>
          </button>
        </div>
      </div>

      {/* Info explanation banner */}
      {showExplanation && (
        <div className="my-3 p-3.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-xs text-slate-300 leading-relaxed">
          <p className="font-medium text-indigo-300 mb-1">
            Understanding the Roofline Model for LLMs:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-300">
            <li>
              <strong>Slanted Line (Memory-Bound Zone):</strong> Workloads with low arithmetic intensity (&lt; {kneeIntensity.toFixed(1)} FLOPs/Byte) cannot saturate the GPU tensor cores because memory bandwidth limits token generation speed. <em>Token Generation (Decode)</em> typically falls here.
            </li>
            <li>
              <strong>Flat Ceiling (Compute-Bound Zone):</strong> Workloads with high arithmetic intensity (&ge; {kneeIntensity.toFixed(1)} FLOPs/Byte) are limited strictly by matrix multiplication compute (TFLOPS). <em>Prompt Processing (Prefill)</em> falls here.
            </li>
            <li>
              <strong>Knee Point:</strong> {kneeIntensity.toFixed(1)} FLOP/Byte is the optimal balance point where memory bandwidth and compute units saturate simultaneously.
            </li>
          </ul>
        </div>
      )}

      {/* Main Chart Area */}
      <div className="h-72 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 15, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="intensity"
              scale="log"
              domain={[0.05, 1024]}
              type="number"
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(val) => `${val} F/B`}
              name="Operational Intensity"
              label={{
                value: 'Operational Intensity (FLOPs / Byte)',
                position: 'insideBottom',
                offset: -12,
                fill: '#94a3b8',
                fontSize: 12
              }}
            />
            <YAxis
              scale="log"
              domain={[1, 5000]}
              type="number"
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(val) => `${val} TF`}
              label={{
                value: 'Attainable Performance (TFLOPS)',
                angle: -90,
                position: 'insideLeft',
                offset: 5,
                fill: '#94a3b8',
                fontSize: 12
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                      <p className="font-semibold text-white mb-1">
                        Intensity: {p.intensity} FLOPs/Byte
                      </p>
                      <p className="text-emerald-400">
                        Attainable: {p.attainable} TFLOPS
                      </p>
                      <p className="text-slate-400">
                        Compute Ceiling: {p.computeCeiling} TFLOPS
                      </p>
                      <p className="text-slate-400">
                        Memory Bandwidth: {(memBwGBs * 1000).toFixed(0)} GB/s
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Compute Flat Ceiling */}
            <Line
              type="monotone"
              dataKey="computeCeiling"
              stroke="#6366f1"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
              name={`Peak Compute (${peakTflops.toFixed(0)} TFLOPS)`}
            />

            {/* Attainable Roofline Envelope */}
            <Line
              type="monotone"
              dataKey="attainable"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              name="Hardware Roofline Envelope"
            />

            {/* Decode Phase Marker */}
            {showDecode && (
              <ReferenceDot
                x={Math.max(0.05, Math.min(1024, decodeIntensity))}
                y={Math.max(1, Math.min(5000, decodeAttainableTflops))}
                r={7}
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth={2}
                isFront
              />
            )}

            {/* Prefill Phase Marker */}
            {showPrefill && (
              <ReferenceDot
                x={Math.max(0.05, Math.min(1024, prefillIntensity))}
                y={Math.max(1, Math.min(5000, prefillAttainableTflops))}
                r={7}
                fill="#06b6d4"
                stroke="#fff"
                strokeWidth={2}
                isFront
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Phase Status Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
        {/* Decode Phase Card */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="text-xs font-semibold text-slate-200">
                Decode Phase (Token Generation)
              </span>
            </div>
            <div className="mt-2 space-y-0.5 text-xs text-slate-400">
              <p>
                Intensity: <strong className="text-slate-200">{decodeIntensity} FLOP/B</strong>
              </p>
              <p>
                Achievable: <strong className="text-emerald-400">{decodeAttainableTflops} TFLOPS</strong> ({((decodeAttainableTflops / peakTflops) * 100).toFixed(1)}% of Peak)
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${
              isDecodeMemBound 
                ? 'bg-amber-950/60 border-amber-800 text-amber-300' 
                : 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
            }`}>
              <Database className="w-3 h-3" />
              {isDecodeMemBound ? 'Memory Bandwidth Bound' : 'Compute Bound'}
            </span>
            <p className="text-[10px] text-slate-500 mt-1">
              Weight memory bandwidth bound
            </p>
          </div>
        </div>

        {/* Prefill Phase Card */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              <span className="text-xs font-semibold text-slate-200">
                Prefill Phase (Prompt Context)
              </span>
            </div>
            <div className="mt-2 space-y-0.5 text-xs text-slate-400">
              <p>
                Intensity: <strong className="text-slate-200">{prefillIntensity} FLOP/B</strong>
              </p>
              <p>
                Achievable: <strong className="text-emerald-400">{prefillAttainableTflops} TFLOPS</strong> ({((prefillAttainableTflops / peakTflops) * 100).toFixed(1)}% of Peak)
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${
              isPrefillComputeBound 
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
            }`}>
              <Cpu className="w-3 h-3" />
              {isPrefillComputeBound ? 'Compute Bound' : 'Memory Bound'}
            </span>
            <p className="text-[10px] text-slate-500 mt-1">
              GEMM tensor core saturation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
