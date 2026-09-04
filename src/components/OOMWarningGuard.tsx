import React from 'react';
import { AlertTriangle, CheckCircle2, Cpu, ShieldAlert, Sparkles, Zap } from 'lucide-react';
import { HardwareSpec, ModelArchitecture, PrecisionType } from '../types';

interface OOMWarningGuardProps {
  model: ModelArchitecture;
  selectedHardware: HardwareSpec;
  precision: PrecisionType;
}

export const OOMWarningGuard: React.FC<OOMWarningGuardProps> = ({
  model,
  selectedHardware,
  precision
}) => {
  // Approximate VRAM in GB based on precision:
  // FP32: ~4 bytes/param, FP16: ~2 bytes/param, INT8: ~1 byte/param, INT4/AWQ: ~0.55 byte/param + 20% runtime overhead
  const bytesPerParam = precision === 'FP16' ? 2 : precision === 'INT8' ? 1 : 0.6;
  const paramCountM = model?.parameterCountM || 100;
  const estimatedModelWeightsGb = (paramCountM * 1e6 * bytesPerParam) / 1e9;
  const estimatedKvCacheAndActivationGb = model?.category?.includes('LLM') ? 2.5 : 0.8;
  const totalRequiredVramGb = +(estimatedModelWeightsGb + estimatedKvCacheAndActivationGb).toFixed(1);

  const availableVramGb = selectedHardware?.memoryGb || 16;
  const isOOM = totalRequiredVramGb > availableVramGb;
  const memoryUtilizationPct = Math.min(100, Math.round((totalRequiredVramGb / Math.max(1, availableVramGb)) * 100));

  if (isOOM) {
    return (
      <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 space-y-2 text-xs font-mono text-rose-300 animate-fadeIn">
        <div className="flex items-center gap-2 font-bold text-rose-400">
          <ShieldAlert className="w-4 h-4" />
          <span>Out-Of-Memory (OOM) Risk Detected on {selectedHardware?.name || 'Selected Device'}</span>
        </div>
        <p className="text-slate-300 font-sans text-xs leading-relaxed">
          {model?.name || 'Model'} in <strong>{precision}</strong> requires approximately <strong>{totalRequiredVramGb} GB</strong> VRAM, but {selectedHardware?.name || 'Selected Device'} only has <strong>{availableVramGb} GB</strong>.
        </p>
        <div className="pt-2 border-t border-rose-900/60 flex items-center gap-2 text-[11px] text-amber-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span><strong>Recommended Fix:</strong> Select <strong>INT4 / AWQ</strong> precision, or switch to a target with 24GB+ VRAM (e.g. RTX 4090 or L40S).</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#07090E] border border-cyan-950 rounded-2xl p-3 flex items-center justify-between text-xs font-mono text-slate-300">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>VRAM Sizing: <strong className="text-white">{totalRequiredVramGb} GB</strong> of {availableVramGb} GB ({memoryUtilizationPct}% utilized)</span>
      </div>
      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
        Safe Fit
      </span>
    </div>
  );
};
