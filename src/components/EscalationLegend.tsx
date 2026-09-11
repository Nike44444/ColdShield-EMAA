import { ShieldCheck, User, ShieldAlert, FlaskConical, ArrowRight } from 'lucide-react';
import { ALERT_LEVELS } from '@/types';

const levelIcons = [ShieldCheck, User, ShieldAlert, FlaskConical];

const levelStyles = [
  {
    bg: 'bg-emerald-950/40 border-emerald-800/40',
    icon: 'bg-emerald-500/20 text-emerald-400',
    text: 'text-emerald-300',
  },
  {
    bg: 'bg-amber-950/40 border-amber-800/40',
    icon: 'bg-amber-500/20 text-amber-400',
    text: 'text-amber-300',
  },
  {
    bg: 'bg-orange-950/40 border-orange-800/40',
    icon: 'bg-orange-500/20 text-orange-400',
    text: 'text-orange-300',
  },
  {
    bg: 'bg-red-950/40 border-red-800/40',
    icon: 'bg-red-500/20 text-red-400',
    text: 'text-red-300',
  },
];

export function EscalationLegend() {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
      <h2 className="mb-3 font-semibold text-white">Alert Escalation Protocol</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((level, idx) => {
          const info = ALERT_LEVELS[level];
          const Icon = levelIcons[level];
          const style = levelStyles[level];
          return (
            <div key={level} className="flex items-start gap-2">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${style.bg} ${style.icon}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${style.text}`}>L{level} — {info.label}</p>
                <p className="mt-0.5 text-xs leading-tight text-slate-500">
                  {level === 0 && 'Normal range'}
                  {level === 1 && 'Immediate alert'}
                  {level === 2 && '> 5 min breach'}
                  {level === 3 && 'Severe / > 15 min'}
                </p>
              </div>
              {idx < 3 && (
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-600 sm:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
