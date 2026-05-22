import { DomainStats } from '../types';

interface Props {
  stats: DomainStats[];
}

export function Heatmap({ stats }: Props) {
  if (stats.every((s) => s.total === 0)) {
    return (
      <p className="text-slate-500 text-xs">Complete more visits to see performance trends.</p>
    );
  }

  return (
    <div className="space-y-2">
      {stats.map((s) => {
        const color =
          s.total === 0
            ? 'bg-slate-700'
            : s.rate >= 80
            ? 'bg-emerald-500'
            : s.rate >= 50
            ? 'bg-amber-500'
            : 'bg-red-500';
        const textColor =
          s.total === 0 ? 'text-slate-500' : s.rate >= 80 ? 'text-emerald-400' : s.rate >= 50 ? 'text-amber-400' : 'text-red-400';

        return (
          <div key={s.domain}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-slate-400">{s.label}</span>
              <span className={`text-xs font-bold ${textColor}`}>
                {s.total === 0 ? 'N/A' : `${s.rate}%`}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div
                className={`${color} h-1.5 rounded-full transition-all duration-700`}
                style={{ width: s.total === 0 ? '0%' : `${s.rate}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
