import { useEffect, useState } from 'react';
import { CheckCircle2, CloudOff, MapPin, Navigation, Radio, Route, Signal, Smartphone, Truck } from 'lucide-react';

const ROUTE = [
  { label: 'Central Cold Room', x: 8, y: 73 },
  { label: 'Rural Junction', x: 34, y: 55 },
  { label: 'River Crossing', x: 58, y: 39 },
  { label: 'Primary Health Centre', x: 86, y: 21 },
];

export function LastMileTracker() {
  const [tracking, setTracking] = useState(false);
  const [networkDrop, setNetworkDrop] = useState(false);
  const [progress, setProgress] = useState(0);
  const [queuedPoints, setQueuedPoints] = useState(0);

  useEffect(() => {
    if (!tracking) return;
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(100, value + 4));
      if (networkDrop) setQueuedPoints((value) => value + 1);
    }, 1600);
    return () => window.clearInterval(timer);
  }, [tracking, networkDrop]);

  const current = ROUTE[Math.min(ROUTE.length - 1, Math.floor((progress / 100) * ROUTE.length))];
  const arrived = progress >= 100;

  const setOffline = () => setNetworkDrop((value) => !value);
  const resumeNetwork = () => {
    setNetworkDrop(false);
    setQueuedPoints(0);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-slate-950/30">
      <div className="flex items-start justify-between border-b border-slate-700/50 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">Rural last-mile tracker</p>
          <h2 className="mt-1 text-base font-semibold text-white">Field worker route</h2>
          <p className="mt-1 text-xs text-slate-400">Demo GPS • timestamp-preserving offline queue</p>
        </div>
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${networkDrop ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
          {networkDrop ? <CloudOff className="h-3.5 w-3.5" /> : <Signal className="h-3.5 w-3.5" />}
          {networkDrop ? 'OFFLINE' : 'LIVE'}
        </span>
      </div>

      <div className="p-4">
        <div className="relative h-44 overflow-hidden rounded-2xl border border-cyan-900/30 bg-[radial-gradient(circle_at_30%_20%,rgba(14,116,144,.34),transparent_32%),linear-gradient(135deg,#102936,#071e28_50%,#0d3330)]">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(34,211,238,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.15)_1px,transparent_1px)] [background-size:24px_24px]" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M8 73 C22 70, 23 52, 34 55 S48 44,58 39 S76 26,86 21" fill="none" stroke="rgba(148,163,184,.45)" strokeWidth="2" strokeDasharray="3 2" />
            <path d="M8 73 C22 70, 23 52, 34 55 S48 44,58 39 S76 26,86 21" fill="none" stroke="rgba(34,211,238,.75)" strokeWidth="1" strokeDasharray="100" strokeDashoffset={100 - progress} pathLength="100" />
          </svg>
          {ROUTE.map((point, index) => (
            <div key={point.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${point.x}%`, top: `${point.y}%` }}>
              <div className={`h-3 w-3 rounded-full border-2 ${index === ROUTE.length - 1 && arrived ? 'border-emerald-200 bg-emerald-400' : 'border-cyan-100 bg-cyan-500'}`} />
            </div>
          ))}
          {tracking && (
            <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000" style={{ left: `${8 + progress * 0.78}%`, top: `${73 - progress * 0.52}%` }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-cyan-500 text-white shadow-[0_0_20px_rgba(34,211,238,.8)]"><Truck className="h-4 w-4" /></div>
            </div>
          )}
          <p className="absolute bottom-2 left-3 text-[10px] text-slate-300">Central Cold Room</p>
          <p className="absolute right-3 top-2 text-[10px] text-slate-200">Primary Health Centre</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-slate-950/55 p-2.5"><p className="text-slate-500">Progress</p><p className="mt-1 font-semibold text-cyan-300">{progress}%</p></div>
          <div className="rounded-xl bg-slate-950/55 p-2.5"><p className="text-slate-500">Last point</p><p className="mt-1 truncate font-semibold text-slate-200">{tracking ? current.label : 'Not started'}</p></div>
          <div className="rounded-xl bg-slate-950/55 p-2.5"><p className="text-slate-500">Buffered</p><p className="mt-1 font-semibold text-amber-300">{queuedPoints} points</p></div>
        </div>

        {arrived ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-700/40 bg-emerald-950/25 p-3 text-xs text-emerald-200"><CheckCircle2 className="h-4 w-4" /> Destination geofence reached — QR handover can proceed.</div>
        ) : networkDrop ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-700/40 bg-amber-950/25 p-3 text-xs text-amber-200"><CloudOff className="h-4 w-4" /> Location points are stored locally with original timestamps.</div>
        ) : (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-3 text-xs text-cyan-200"><Navigation className="h-4 w-4" /> GPS accuracy: ±12 m • next check-in: 30 sec</div>
        )}

        {!tracking ? (
          <button onClick={() => setTracking(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white hover:bg-cyan-500"><Route className="h-4 w-4" /> Start rural transit demo</button>
        ) : networkDrop ? (
          <button onClick={resumeNetwork} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500"><Radio className="h-4 w-4" /> Restore network & sync {queuedPoints} points</button>
        ) : !arrived && (
          <button onClick={setOffline} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-700/50 bg-amber-950/30 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-900/35"><Smartphone className="h-4 w-4" /> Simulate 10-minute connection drop</button>
        )}
      </div>
    </section>
  );
}
