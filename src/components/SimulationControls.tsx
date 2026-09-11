import { DoorOpen, Flame, QrCode, RadioTower, Snowflake } from 'lucide-react';

export type IncidentScenario = 'door-open' | 'cooling-failure' | 'freeze-shock';

type SimulationControlsProps = {
  onScenario: (scenario: IncidentScenario) => void;
  onToggleLoggerOffline: () => void;
  onSimulateQRScan: () => void;
};

const scenarios: Array<{ id: IncidentScenario; label: string; detail: string; icon: typeof DoorOpen; tone: string }> = [
  { id: 'door-open', label: 'Door left open', detail: 'brief 9–11°C excursion', icon: DoorOpen, tone: 'amber' },
  { id: 'cooling-failure', label: 'Cooling failure', detail: 'sustained high-temperature event', icon: Flame, tone: 'red' },
  { id: 'freeze-shock', label: 'Freeze exposure', detail: 'below-safe-range event', icon: Snowflake, tone: 'blue' },
];

export function SimulationControls({ onScenario, onToggleLoggerOffline, onSimulateQRScan }: SimulationControlsProps) {
  return (
    <section className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center gap-2"><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Demo controls</h2><span className="text-xs text-slate-500">Each incident creates a different recorded temperature event.</span></div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {scenarios.map(({ id, label, detail, icon: Icon, tone }) => (
          <button key={id} onClick={() => onScenario(id)} className={`rounded-xl border p-3 text-left transition-colors hover:brightness-125 ${tone === 'red' ? 'border-red-700/40 bg-red-950/25 text-red-200' : tone === 'blue' ? 'border-blue-700/40 bg-blue-950/25 text-blue-200' : 'border-amber-700/40 bg-amber-950/25 text-amber-200'}`}><Icon className="mb-2 h-4 w-4" /><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-[11px] opacity-75">{detail}</span></button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button onClick={onToggleLoggerOffline} className="flex items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700/60"><RadioTower className="h-4 w-4" /><span className="text-left">Toggle logger offline buffer</span></button>
        <button onClick={onSimulateQRScan} className="flex items-center gap-2 rounded-xl border border-cyan-600/40 bg-cyan-950/40 px-4 py-3 text-sm font-medium text-cyan-300 hover:bg-cyan-900/40"><QrCode className="h-4 w-4" /><span className="text-left">Scan selected unit at destination</span></button>
      </div>
    </section>
  );
}
