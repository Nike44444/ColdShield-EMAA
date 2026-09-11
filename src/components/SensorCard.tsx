import { Thermometer, AlertTriangle, ShieldCheck, Snowflake, MapPin, Activity } from 'lucide-react';
import type { SensorWithBreach } from '@/types';
import { ALERT_LEVELS } from '@/types';

type SensorCardProps = {
  sensor: SensorWithBreach;
  onClick: () => void;
  isSelected: boolean;
};

export function SensorCard({ sensor, onClick, isSelected }: SensorCardProps) {
  const alertLevel = ALERT_LEVELS[sensor.alertLevel] ?? ALERT_LEVELS[0];
  const temp = sensor.current_temp ?? 0;
  const isBreaching = sensor.alertLevel > 0;
  const isCritical = sensor.alertLevel >= 2;

  const bgClass = isCritical
    ? 'bg-red-950/40 border-red-700/60 shadow-red-900/20'
    : isBreaching
      ? 'bg-amber-950/40 border-amber-700/60 shadow-amber-900/20'
      : 'bg-slate-900/60 border-slate-700/50 shadow-slate-900/20';

  const tempColor = isCritical
    ? 'text-red-400'
    : isBreaching
      ? 'text-amber-400'
      : 'text-cyan-300';

  const iconBg = isCritical
    ? 'bg-red-500/20 text-red-400'
    : isBreaching
      ? 'bg-amber-500/20 text-amber-400'
      : 'bg-cyan-500/20 text-cyan-300';

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${bgClass} ${isSelected ? 'ring-2 ring-cyan-500/60' : ''} ${isCritical ? 'animate-pulse-slow' : ''}`}
    >
      {/* Background glow */}
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${isCritical ? 'bg-red-500/20' : isBreaching ? 'bg-amber-500/15' : 'bg-cyan-500/10'}`}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
            {isBreaching ? (
              <AlertTriangle className="h-5 w-5" />
            ) : sensor.min_temp < 0 ? (
              <Snowflake className="h-5 w-5" />
            ) : (
              <Thermometer className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{sensor.name}</h3>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3 w-3" />
              {sensor.location}
            </div>
          </div>
        </div>
        <div
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            sensor.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
          }`}
        >
          {sensor.is_active ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Temperature Display */}
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Current Temp</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-4xl font-bold tabular-nums ${tempColor}`}>{temp.toFixed(1)}</span>
            <span className="text-lg text-slate-400">°C</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Safe Range</p>
          <p className="text-sm font-medium text-slate-300">
            {sensor.min_temp}° – {sensor.max_temp}°
          </p>
        </div>
      </div>

      {/* Alert Status */}
      {isBreaching ? (
        <div
          className={`mt-4 rounded-xl border p-3 ${
            isCritical
              ? 'border-red-700/50 bg-red-950/40'
              : 'border-amber-700/50 bg-amber-950/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`h-4 w-4 ${isCritical ? 'text-red-400' : 'text-amber-400'}`}
              />
              <span className={`text-sm font-semibold ${isCritical ? 'text-red-300' : 'text-amber-300'}`}>
                {alertLevel.label}
              </span>
            </div>
            <span className={`text-sm font-bold tabular-nums ${isCritical ? 'text-red-300' : 'text-amber-300'}`}>
              {sensor.breachMinutes} min
            </span>
          </div>
          {sensor.activeBreach && (
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
              <span>Peak: {sensor.activeBreach.max_temp.toFixed(1)}°C</span>
              <span>•</span>
              <span>Type: {sensor.activeBreach.breach_type === 'high' ? 'High' : 'Low'}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-800/30 bg-emerald-950/30 p-3">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">All Clear</span>
          <Activity className="ml-auto h-4 w-4 text-emerald-500/50" />
        </div>
      )}
    </button>
  );
}
