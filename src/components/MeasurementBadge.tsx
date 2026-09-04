import React from 'react';
import { MeasurementProvenance } from '../types';
import { CheckCircle2, Gauge, HelpCircle, Sparkles, Layers, Sliders } from 'lucide-react';

interface MeasurementBadgeProps {
  status: MeasurementProvenance;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  tooltipText?: string;
  sourceRef?: string;
  dateUpdated?: string;
  runId?: string;
  className?: string;
}

export const MeasurementBadge: React.FC<MeasurementBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  tooltipText,
  sourceRef,
  dateUpdated,
  runId,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'MEASURED':
        return {
          label: 'Measured',
          symbol: '🟢',
          icon: CheckCircle2,
          bg: 'bg-emerald-950/80',
          text: 'text-emerald-400',
          border: 'border-emerald-600/60',
          dotBg: 'bg-emerald-400',
          dotShadow: 'shadow-[0_0_8px_rgba(52,211,153,0.6)]',
          defaultDesc: 'Actual physical execution on target hardware with verified benchmark run.'
        };
      case 'PUBLISHED':
        return {
          label: 'Published Benchmark',
          symbol: '🟣',
          icon: CheckCircle2,
          bg: 'bg-purple-950/80',
          text: 'text-purple-400',
          border: 'border-purple-600/60',
          dotBg: 'bg-purple-400',
          dotShadow: 'shadow-[0_0_8px_rgba(192,132,252,0.6)]',
          defaultDesc: 'Official published benchmark (MLPerf / Vendor specification report).'
        };
      case 'CALIBRATED':
      case 'CALIBRATED_ESTIMATE':
        return {
          label: 'Calibrated Estimate',
          symbol: '🔵',
          icon: Gauge,
          bg: 'bg-cyan-950/80',
          text: 'text-cyan-400',
          border: 'border-cyan-600/60',
          dotBg: 'bg-cyan-400',
          dotShadow: 'shadow-[0_0_8px_rgba(34,211,238,0.6)]',
          defaultDesc: 'Analytical prediction calibrated against verified physical benchmark measurements.'
        };
      case 'SIMULATED':
        return {
          label: 'Simulated (Analytical Model)',
          symbol: '🔷',
          icon: Sliders,
          bg: 'bg-blue-950/80',
          text: 'text-blue-400',
          border: 'border-blue-600/60',
          dotBg: 'bg-blue-400',
          dotShadow: 'shadow-[0_0_8px_rgba(96,165,250,0.6)]',
          defaultDesc: 'Generated using CorePick analytical Roofline & VRAM performance simulation engine.'
        };
      case 'ESTIMATED':
        return {
          label: 'Estimated',
          symbol: '🟡',
          icon: Sliders,
          bg: 'bg-amber-950/80',
          text: 'text-amber-400',
          border: 'border-amber-600/60',
          dotBg: 'bg-amber-400',
          dotShadow: 'shadow-[0_0_8px_rgba(251,191,36,0.6)]',
          defaultDesc: 'Calculated using analytical roofline models, hardware specifications, and workload arithmetic intensity.'
        };
      case 'ASSUMPTION':
        return {
          label: 'Assumption',
          symbol: '⚪',
          icon: Layers,
          bg: 'bg-slate-900/90',
          text: 'text-slate-300',
          border: 'border-slate-700/60',
          dotBg: 'bg-slate-400',
          dotShadow: 'shadow-[0_0_6px_rgba(148,163,184,0.4)]',
          defaultDesc: 'User-provided or configurable workload/infrastructure assumption.'
        };
      case 'ILLUSTRATIVE':
      default:
        return {
          label: 'Illustrative',
          symbol: '⚪',
          icon: Sparkles,
          bg: 'bg-slate-900/80',
          text: 'text-slate-400',
          border: 'border-slate-800',
          dotBg: 'bg-slate-500',
          dotShadow: '',
          defaultDesc: 'Sample / synthetic illustrative value for exploratory demonstration.'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-2'
  };

  return (
    <span 
      className={`inline-flex items-center font-mono font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} select-none transition-all group relative cursor-help ${className}`}
      title={tooltipText || config.defaultDesc}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotBg} ${config.dotShadow}`} />
      <span>{config.label}</span>
      {runId && (
        <span className="text-[9px] opacity-70 border-l border-current pl-1 font-mono">
          #{runId.slice(0, 6)}
        </span>
      )}
    </span>
  );
};
