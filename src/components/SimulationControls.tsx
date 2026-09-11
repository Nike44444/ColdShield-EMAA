import { DoorOpen, QrCode, RadioTower } from 'lucide-react';

type SimulationControlsProps = {
  onTriggerHeatBreach: () => void;
  onToggleOffline: () => void;
  onSimulateQRScan: () => void;
};

export function SimulationControls({ onTriggerHeatBreach, onToggleOffline, onSimulateQRScan }: SimulationControlsProps) {
  return (
    <section className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Demo controls</h2>
        <span className="text-xs text-slate-500">Complete the handover in under 4 minutes</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button onClick={onTriggerHeatBreach} className="flex w-full items-center gap-2 rounded-xl border border-amber-700/40 bg-amber-950/25 px-4 py-3 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-900/30">
          <DoorOpen className="h-4 w-4 shrink-0" /><span className="text-left">Simulate door-open excursion</span>
        </button>
        <button onClick={onToggleOffline} className="flex w-full items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700/60">
          <RadioTower className="h-4 w-4 shrink-0" /><span className="text-left">Simulate offline buffer</span>
        </button>
        <button onClick={onSimulateQRScan} className="flex w-full items-center gap-2 rounded-xl border border-cyan-600/40 bg-cyan-950/40 px-4 py-3 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-900/40 hover:text-cyan-200">
          <QrCode className="h-4 w-4 shrink-0" /><span className="text-left">Scan at destination</span>
        </button>
      </div>
    </section>
  );
}
