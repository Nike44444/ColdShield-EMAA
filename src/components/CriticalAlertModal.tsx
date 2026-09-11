import { useEffect, useState } from 'react';
import { AlertOctagon, BellRing, MapPin, ShieldAlert, X } from 'lucide-react';
import type { AlertLog, Sensor } from '@/types';

type CriticalAlertModalProps = { alerts: AlertLog[]; sensors: Sensor[]; onAcknowledge: (alertId: string, user: string) => void };

export function CriticalAlertModal({ alerts, sensors, onAcknowledge }: CriticalAlertModalProps) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [suppressedUntil, setSuppressedUntil] = useState(0);
  const critical = alerts.find((alert) => alert.alert_level === 3 && !alert.acknowledged) ?? null;
  const sensor = critical ? sensors.find((item) => item.id === critical.sensor_id) : null;
  useEffect(() => { if (critical && critical.id !== dismissedId) setDismissedId(null); }, [critical, dismissedId]);
  if (!critical || dismissedId === critical.id || Date.now() < suppressedUntil) return null;

  return (
    <aside className="fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-red-400/60 bg-slate-950 shadow-[0_0_45px_rgba(239,68,68,0.3)]">
      <div className="relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-rose-700 p-4"><div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10 blur-xl" /><div className="relative flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 animate-pulse items-center justify-center rounded-2xl bg-white/15 text-white"><BellRing className="h-6 w-6" /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-100">EMAA critical alert</p><h2 className="mt-1 text-base font-bold text-white">Temperature breach — hold vaccine</h2></div></div></div>
      <div className="p-4"><div className="flex gap-3 rounded-xl border border-red-900/70 bg-red-950/35 p-3"><AlertOctagon className="h-5 w-5 shrink-0 text-red-400" /><div><p className="font-semibold text-red-100">Pharmacist review required</p><p className="mt-1 text-sm text-slate-300">{critical.message}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-900 p-2.5"><p className="text-xs text-slate-500">Storage unit</p><p className="mt-1 font-medium text-white">{sensor?.name ?? 'Unknown unit'}</p></div><div className="rounded-xl bg-slate-900 p-2.5"><p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" /> Location</p><p className="mt-1 truncate font-medium text-white">{sensor?.location ?? 'Not available'}</p></div></div><p className="mt-3 flex items-center gap-2 text-xs text-red-300"><ShieldAlert className="h-4 w-4" /> Do not release this batch until review is complete.</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => { setDismissedId(critical.id); setSuppressedUntil(Date.now() + 60_000); }} className="rounded-xl border border-slate-700 bg-slate-900 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"><X className="mr-1 inline h-4 w-4" /> Snooze 1 min</button><button onClick={() => onAcknowledge(critical.id, 'pharmacist')} className="rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-500">Acknowledge hold</button></div></div>
    </aside>
  );
}
