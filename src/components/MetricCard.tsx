import React from 'react';
import { MeasurementProvenance } from '../types';
import { MeasurementBadge } from './MeasurementBadge';
import { HelpCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status: MeasurementProvenance;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  icon?: any;
  onExplainMethodology?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  status,
  subtitle,
  trend,
  icon: Icon,
  onExplainMethodology,
  className = ''
}) => {
  return (
    <div className={`p-4 rounded-xl bg-[#0D1322] border border-[#1E293B] hover:border-slate-700 transition-all flex flex-col justify-between ${className}`}>
      {/* Top row: Label + Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
          <span>{label}</span>
          {onExplainMethodology && (
            <button
              onClick={onExplainMethodology}
              className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
              title="How is this calculated?"
              aria-label="How is this calculated?"
            >
              <HelpCircle className="w-3 h-3" />
            </button>
          )}
        </div>
        <MeasurementBadge status={status} size="sm" />
      </div>

      {/* Center: Main value + unit */}
      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono font-medium text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {/* Bottom: Subtitle and optional trend */}
      <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-slate-400">
        {subtitle && <span className="truncate">{subtitle}</span>}
        {trend && (
          <span className={`inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold ${
            trend.isPositive ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value} {trend.label && <span className="opacity-80">{trend.label}</span>}
          </span>
        )}
      </div>
    </div>
  );
};
