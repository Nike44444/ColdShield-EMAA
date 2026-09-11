import { Clock, ThermometerSun, ThermometerSnowflake, CheckCircle, AlertCircle } from 'lucide-react';
import type { BreachEvent, Sensor } from '@/types';

type BreachLogProps = {
  breaches: BreachEvent[];
  sensors: Sensor[];
  onResolve: (breachId: string) => void;
};

export function BreachLog({ breaches, sensors, onResolve }: BreachLogProps) {
  const sensorMap = new Map(sensors.map((s) => [s.id, s]));

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-700/50 p-4">
        <h2 className="font-semibold text-white">Breach Events</h2>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
          {breaches.filter((b) => b.status === 'active').length} active
        </span>
      </div>
      <div className="max-h-[320px] overflow-y-auto p-3">
        {breaches.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500">
            <p className="text-sm">No breach events recorded</p>
          </div>
        ) : (
          <div className="space-y-2">
            {breaches.map((breach) => {
              const sensor = sensorMap.get(breach.sensor_id);
              const isActive = breach.status === 'active';
              const isHigh = breach.breach_type === 'high';

              return (
                <div
                  key={breach.id}
                  className={`rounded-xl border p-3 transition-all ${
                    isActive
                      ? breach.alert_level >= 3
                        ? 'border-red-800/50 bg-red-950/30'
                        : breach.alert_level >= 2
                          ? 'border-orange-800/50 bg-orange-950/30'
                          : 'border-amber-800/50 bg-amber-950/30'
                      : 'border-slate-700/40 bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          isHigh ? 'bg-orange-500/20 text-orange-400' : 'bg-sky-500/20 text-sky-400'
                        }`}
                      >
                        {isHigh ? (
                          <ThermometerSun className="h-4 w-4" />
                        ) : (
                          <ThermometerSnowflake className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {sensor?.name ?? 'Unknown'}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              isActive
                                ? breach.alert_level >= 3
                                  ? 'bg-red-500/20 text-red-400'
                                  : breach.alert_level >= 2
                                    ? 'bg-orange-500/20 text-orange-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {isActive ? `L${breach.alert_level}` : 'Resolved'}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {breach.duration_minutes.toFixed(0)} min
                          </span>
                          <span>Peak: {breach.max_temp.toFixed(1)}°C</span>
                          <span>Low: {breach.min_temp.toFixed(1)}°C</span>
                          <span>
                            {new Date(breach.start_time).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isActive ? (
                      <button
                        onClick={() => onResolve(breach.id)}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-emerald-700 hover:text-white"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Resolve
                      </button>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
