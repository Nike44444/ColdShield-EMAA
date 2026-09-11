import { Flame, Power, QrCode, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { SensorWithBreach } from '@/types';

type SimulationControlsProps = {
  sensors: SensorWithBreach[];
  onTriggerHeatBreach: (sensorId?: string) => void;
  onToggleOffline: (sensorId?: string) => void;
  onSimulateQRScan: () => void;
};

export function SimulationControls({
  sensors,
  onTriggerHeatBreach,
  onToggleOffline,
  onSimulateQRScan,
}: SimulationControlsProps) {
  const [openMenu, setOpenMenu] = useState<'breach' | 'offline' | null>(null);

  const activeSensors = sensors.filter((s) => s.is_active);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Simulation Controls
        </h2>
        <span className="text-xs text-slate-500">Manual test actions</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Trigger Heat Breach */}
        <div className="relative">
          <button
            onClick={() => {
              if (activeSensors.length === 1) {
                onTriggerHeatBreach(activeSensors[0].id);
              } else {
                setOpenMenu(openMenu === 'breach' ? null : 'breach');
              }
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-red-700/40 bg-red-950/40 px-4 py-3 text-sm font-medium text-red-300 transition-all hover:bg-red-900/40 hover:text-red-200"
          >
            <Flame className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Trigger Heat Breach</span>
            {activeSensors.length > 1 && (
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${openMenu === 'breach' ? 'rotate-180' : ''}`}
              />
            )}
          </button>
          {openMenu === 'breach' && activeSensors.length > 1 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
              {activeSensors.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onTriggerHeatBreach(s.id);
                    setOpenMenu(null);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-700"
                >
                  <span>{s.name}</span>
                  <span className="text-slate-500">{s.current_temp?.toFixed(1)}°C</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toggle Offline Mode */}
        <div className="relative">
          <button
            onClick={() => {
              if (sensors.length === 1) {
                onToggleOffline(sensors[0].id);
              } else {
                setOpenMenu(openMenu === 'offline' ? null : 'offline');
              }
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-600/40 bg-slate-800/60 px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700/60 hover:text-white"
          >
            <Power className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Toggle Offline Mode</span>
            {sensors.length > 1 && (
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${openMenu === 'offline' ? 'rotate-180' : ''}`}
              />
            )}
          </button>
          {openMenu === 'offline' && sensors.length > 1 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
              {sensors.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onToggleOffline(s.id);
                    setOpenMenu(null);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-700"
                >
                  <span>{s.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      s.is_active
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-600 text-slate-400'
                    }`}
                  >
                    {s.is_active ? 'Online' : 'Offline'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Simulate QR Code Scan */}
        <button
          onClick={onSimulateQRScan}
          className="flex w-full items-center gap-2 rounded-xl border border-cyan-600/40 bg-cyan-950/40 px-4 py-3 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-900/40 hover:text-cyan-200"
        >
          <QrCode className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Simulate QR Code Scan</span>
        </button>
      </div>
    </div>
  );
}
