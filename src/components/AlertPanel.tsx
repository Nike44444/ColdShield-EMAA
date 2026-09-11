import { useState } from 'react';
import { Bell, Check, Clock, AlertTriangle, User, ShieldAlert, FlaskConical } from 'lucide-react';
import type { AlertLog, Sensor } from '@/types';
import { ALERT_LEVELS } from '@/types';

type AlertPanelProps = {
  alerts: AlertLog[];
  sensors: Sensor[];
  onAcknowledge: (alertId: string, user: string) => void;
};

const roleIcons: Record<string, typeof Bell> = {
  worker: User,
  supervisor: ShieldAlert,
  pharmacist: FlaskConical,
};

export function AlertPanel({ alerts, sensors, onAcknowledge }: AlertPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unack' | 'ack'>('all');

  const sensorMap = new Map(sensors.map((s) => [s.id, s]));
  const filtered = alerts.filter((a) => {
    if (filter === 'unack') return !a.acknowledged;
    if (filter === 'ack') return a.acknowledged;
    return true;
  });

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-900/60">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-slate-300" />
            {alerts.some((a) => !a.acknowledged) && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            )}
          </div>
          <h2 className="font-semibold text-white">Alert Log</h2>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            {alerts.filter((a) => !a.acknowledged).length} new
          </span>
        </div>
        <div className="flex gap-1">
          {(['all', 'unack', 'ack'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unack' ? 'Active' : 'Done'}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <Bell className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm">No alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((alert) => {
              const level = ALERT_LEVELS[alert.alert_level] ?? ALERT_LEVELS[1];
              const sensor = sensorMap.get(alert.sensor_id);
              const RoleIcon = roleIcons[alert.recipient_role] ?? AlertTriangle;

              const levelColors: Record<number, string> = {
                1: 'border-l-amber-500 bg-amber-950/30',
                2: 'border-l-orange-500 bg-orange-950/30',
                3: 'border-l-red-500 bg-red-950/30',
              };

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border border-slate-700/40 border-l-4 p-3 transition-all ${levelColors[alert.alert_level] ?? 'border-l-slate-500 bg-slate-800/30'} ${alert.acknowledged ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          alert.alert_level === 3
                            ? 'bg-red-500/20 text-red-400'
                            : alert.alert_level === 2
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        <RoleIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {sensor?.name ?? 'Unknown Sensor'}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              alert.alert_level === 3
                                ? 'bg-red-500/20 text-red-400'
                                : alert.alert_level === 2
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            L{alert.alert_level}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300">{alert.message}</p>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.created_at).toLocaleTimeString()}
                          </span>
                          <span>→ {alert.recipient_role}</span>
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => onAcknowledge(alert.id, 'operator')}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-emerald-700 hover:text-white"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Ack
                      </button>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-950/50 px-2.5 py-1.5 text-xs font-medium text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        <span>{alert.acknowledged_by ?? 'Done'}</span>
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
