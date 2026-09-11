import { LucideIcon } from 'lucide-react';

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
  animate?: boolean;
};

export function StatCard({ icon: Icon, label, value, sublabel, color, animate }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
    fuchsia: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    lime: 'bg-lime-50 text-lime-700 border-lime-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
  neutral: 'bg-neutral-50 text-neutral-700 border-neutral-200',
    stone: 'bg-stone-50 text-stone-700 border-stone-200',
  zinc: 'bg-zinc-50 text-zinc-700 border-zinc-200',
  blueDark: 'bg-blue-900/40 text-blue-300 border-blue-800/50',
    slateDark: 'bg-slate-900/40 text-slate-300 border-slate-700/50',
    tealDark: 'bg-teal-900/40 text-teal-300 border-teal-800/50',
    amberDark: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
    redDark: 'bg-red-900/40 text-red-300 border-red-800/50',
    orangeDark: 'bg-orange-900/40 text-orange-300 border-orange-800/50',
    emeraldDark: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50',
    cyanDark: 'bg-cyan-900/40 text-cyan-300 border-cyan-800/50',
    skyDark: 'bg-sky-900/40 text-sky-300 border-sky-800/50',
    roseDark: 'bg-rose-900/40 text-rose-300 border-rose-800/50',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg ${colorMap[color] ?? colorMap.slate}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
          {sublabel && <p className="mt-1 text-xs opacity-60">{sublabel}</p>}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${animate ? 'animate-pulse' : ''}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-current opacity-5" />
    </div>
  );
}
