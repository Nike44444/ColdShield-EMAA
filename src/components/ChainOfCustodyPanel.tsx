import { useMemo, useState } from 'react';
import { Check, ClipboardCheck, PackageOpen, QrCode, Radio, RefreshCw, ShieldAlert, Truck } from 'lucide-react';
import type { BLELogEntry, BLELoggerState } from '@/hooks/useBLELogger';

type ChainOfCustodyPanelProps = {
  logger: BLELoggerState;
  log: BLELogEntry[];
  onStartLogger: () => void;
  onScanAtDestination: () => void;
};

export function ChainOfCustodyPanel({
  logger,
  log,
  onStartLogger,
  onScanAtDestination,
}: ChainOfCustodyPanelProps) {
  const [dispatchedAt, setDispatchedAt] = useState<string | null>(null);
  const [replacementRequested, setReplacementRequested] = useState(false);

  const cumulativeExposure = useMemo(
    () => log.filter((ping) => ping.temperature > 8).length * 2,
    [log]
  );
  const unsafe = cumulativeExposure > 5;
  const stage = logger.sealed ? 4 : dispatchedAt ? 2 : 1;

  const dispatch = () => {
    setDispatchedAt(new Date().toISOString());
    onStartLogger();
  };

  const steps = [
    { icon: QrCode, title: 'Dispatch', detail: dispatchedAt ? 'QR verified • Logger paired' : 'Scan batch & capture start condition', done: Boolean(dispatchedAt) },
    { icon: Truck, title: 'Transit', detail: logger.isRunning ? `${logger.totalPings} immutable readings` : 'Logger stream waiting', done: stage > 1 },
    { icon: ShieldAlert, title: 'Escalation', detail: `${cumulativeExposure} simulated min above 8°C`, done: unsafe },
    { icon: ClipboardCheck, title: 'Handover', detail: logger.sealed ? 'Signed and hash sealed' : 'Destination pharmacist verification', done: logger.sealed },
  ];

  return (
    <section className="rounded-2xl border border-cyan-700/40 bg-slate-900/70 p-4 shadow-lg shadow-cyan-950/10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">EMAA : ColdShield</p>
          <h2 className="mt-1 text-base font-semibold text-white">Last-mile chain of custody</h2>
          <p className="mt-1 text-xs text-slate-400">Batch EMAA-HEPB-2409 • 120 vials • 2–8°C</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${unsafe ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
          {unsafe ? 'HOLD / REVIEW' : 'INTEGRITY OK'}
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((item, index) => {
          const Icon = item.icon;
          const active = index + 1 === stage && !item.done;
          return (
            <div key={item.title} className={`flex gap-3 rounded-xl border p-3 ${item.done ? 'border-emerald-800/50 bg-emerald-950/20' : active ? 'border-cyan-700/50 bg-cyan-950/20' : 'border-slate-800 bg-slate-950/30'}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.done ? 'bg-emerald-500/20 text-emerald-300' : active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                {item.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200">{index + 1}. {item.title}</p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {!dispatchedAt ? (
        <button onClick={dispatch} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500">
          <PackageOpen className="h-4 w-4" /> Scan & dispatch batch
        </button>
      ) : !logger.sealed && (
        <button onClick={onScanAtDestination} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500">
          <QrCode className="h-4 w-4" /> Destination QR handover
        </button>
      )}

      {unsafe && !replacementRequested && (
        <button onClick={() => setReplacementRequested(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-700/50 bg-red-950/30 py-2.5 text-sm font-medium text-red-200 hover:bg-red-900/40">
          <RefreshCw className="h-4 w-4" /> Quarantine & request replacement
        </button>
      )}
      {replacementRequested && (
        <p className="mt-3 rounded-xl border border-amber-700/40 bg-amber-950/30 p-3 text-xs text-amber-200">
          Replacement request RPL-2409 created. Source cold room must dispatch a new verified batch.
        </p>
      )}
    </section>
  );
}
