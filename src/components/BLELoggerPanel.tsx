import { useEffect, useState } from 'react';
import {
  Radio,
  Play,
  Pause,
  Thermometer,
  Flame,
  WifiOff,
  Wifi,
  RefreshCw,
  Trash2,
  Check,
  Clock,
  Database,
  Activity,
  Hash,
  Lock,
} from 'lucide-react';
import type { BLELogEntry, BLELoggerState, BLEMode } from '@/hooks/useBLELogger';
import { formatShortHash } from '@/hooks/useBLELogger';

type BLELoggerPanelProps = {
  state: BLELoggerState;
  log: BLELogEntry[];
  syncing: boolean;
  onStart: () => void;
  onStop: () => void;
  onSetMode: (mode: BLEMode) => void;
  onToggleOffline: () => void;
  onManualSync: () => void;
  onClearLog: () => void;
};

export function BLELoggerPanel({
  state,
  log,
  syncing,
  onStart,
  onStop,
  onSetMode,
  onToggleOffline,
  onManualSync,
  onClearLog,
}: BLELoggerPanelProps) {
  const {
    isRunning,
    mode,
    bufferedCount,
    totalPings,
    syncedPings,
    lastTemperature,
    chainHash,
    sealed,
  } = state;

  const isOffline = mode === 'offline';
  const [hashPulse, setHashPulse] = useState(false);

  useEffect(() => {
    if (!chainHash) return;
    setHashPulse(true);
    const timer = window.setTimeout(() => setHashPulse(false), 450);
    return () => window.clearTimeout(timer);
  }, [chainHash, totalPings]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 p-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isRunning
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-700/40 text-slate-500'
            }`}
          >
            <Radio className={`h-5 w-5 ${isRunning ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h2 className="font-semibold text-white">BLE Logger Engine</h2>
            <p className="text-xs text-slate-400">
              Simulated Bluetooth temperature stream
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              sealed
                ? 'bg-cyan-500/20 text-cyan-300'
                : isRunning
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700/40 text-slate-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                sealed
                  ? 'bg-cyan-400'
                  : isRunning
                    ? 'animate-pulse bg-emerald-400'
                    : 'bg-slate-500'
              }`}
            />
            {sealed ? 'Sealed' : isRunning ? 'Streaming' : 'Idle'}
          </span>
          <span
            className={`inline-flex max-w-[11.5rem] items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] tracking-tight transition-all ${
              hashPulse ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : ''
            } ${
              sealed
                ? 'border-cyan-600/50 bg-cyan-950/40 text-cyan-300'
                : totalPings > 0
                  ? 'border-slate-600/60 bg-slate-800/80 text-slate-200'
                  : 'border-slate-700/40 bg-slate-800/40 text-slate-500'
            }`}
            title={chainHash}
          >
            {sealed ? <Lock className="h-3 w-3 shrink-0" /> : <Hash className="h-3 w-3 shrink-0" />}
            SHA-256: {formatShortHash(chainHash)}
          </span>
        </div>
      </div>

      <div
        className={`flex items-center justify-between gap-2 border-b border-slate-700/50 px-4 py-2.5 transition-colors ${
          hashPulse ? 'bg-cyan-950/40' : 'bg-slate-950/40'
        }`}
      >
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {sealed ? <Lock className="h-3 w-3 text-cyan-400" /> : <Hash className="h-3 w-3 text-cyan-500" />}
          Tamper-evident chain
        </span>
        <span
          className={`font-mono text-xs tracking-tight ${
            sealed ? 'text-cyan-300' : hashPulse ? 'text-cyan-200' : 'text-slate-200'
          }`}
          title={chainHash}
        >
          SHA-256: {formatShortHash(chainHash)}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-px border-b border-slate-700/50 bg-slate-800/30">
        <div className="bg-slate-900/60 p-3 text-center">
          <p className="text-xs text-slate-500">Total Pings</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-white">{totalPings}</p>
        </div>
        <div className="bg-slate-900/60 p-3 text-center">
          <p className="text-xs text-slate-500">Synced</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-emerald-400">{syncedPings}</p>
        </div>
        <div className="bg-slate-900/60 p-3 text-center">
          <p className="text-xs text-slate-500">Buffered</p>
          <p className={`mt-1 text-lg font-bold tabular-nums ${bufferedCount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
            {bufferedCount}
          </p>
        </div>
        <div className="bg-slate-900/60 p-3 text-center">
          <p className="text-xs text-slate-500">Last Temp</p>
          <p className={`mt-1 text-lg font-bold tabular-nums ${lastTemperature !== null && (lastTemperature > 8 || lastTemperature < 2) ? 'text-red-400' : 'text-cyan-300'}`}>
            {lastTemperature !== null ? `${lastTemperature.toFixed(1)}°` : '--'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3 p-4">
        {/* Start/Stop */}
        <button
          onClick={isRunning ? onStop : onStart}
          disabled={sealed && !isRunning}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            isRunning
              ? 'bg-amber-600 text-white hover:bg-amber-500'
              : 'bg-cyan-600 text-white hover:bg-cyan-500'
          }`}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {sealed ? 'Log Sealed' : isRunning ? 'Stop BLE Stream' : 'Start BLE Stream'}
        </button>

        {/* Mode Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {/* Normal */}
          <button
            onClick={() => onSetMode('normal')}
            className={`flex flex-col items-center gap-1 rounded-xl border py-3 transition-all ${
              mode === 'normal'
                ? 'border-emerald-600/60 bg-emerald-950/40 text-emerald-300'
                : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:bg-slate-800/70'
            }`}
          >
            <Thermometer className="h-4 w-4" />
            <span className="text-xs font-medium">Normal</span>
            <span className="text-[10px] opacity-60">3–6°C</span>
          </button>

          {/* Heat Breach */}
          <button
            onClick={() => onSetMode('breach')}
            className={`flex flex-col items-center gap-1 rounded-xl border py-3 transition-all ${
              mode === 'breach'
                ? 'border-red-600/60 bg-red-950/40 text-red-300'
                : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:bg-slate-800/70'
            }`}
          >
            <Flame className="h-4 w-4" />
            <span className="text-xs font-medium">Heat Breach</span>
            <span className="text-[10px] opacity-60">{'>8°C'}</span>
          </button>

          {/* Offline */}
          <button
            onClick={onToggleOffline}
            className={`flex flex-col items-center gap-1 rounded-xl border py-3 transition-all ${
              isOffline
                ? 'border-amber-600/60 bg-amber-950/40 text-amber-300'
                : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:bg-slate-800/70'
            }`}
          >
            {isOffline ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
            <span className="text-xs font-medium">{isOffline ? 'Offline' : 'Online'}</span>
            <span className="text-[10px] opacity-60">
              {isOffline ? 'Buffering' : 'Live sync'}
            </span>
          </button>
        </div>

        {/* Offline Status Bar */}
        {isOffline && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-700/40 bg-amber-950/30 p-3">
            <Database className="h-4 w-4 shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-300">
                Offline Mode — pings buffering to local storage
              </p>
              <p className="text-[11px] text-amber-500/70">
                {bufferedCount} pings queued for sync
              </p>
            </div>
            <button
              onClick={onManualSync}
              disabled={bufferedCount === 0 || syncing}
              className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {syncing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sync Now
            </button>
          </div>
        )}

        {/* Auto-sync indicator */}
        {!isOffline && bufferedCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-cyan-700/40 bg-cyan-950/30 p-3">
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-cyan-400" />
            <p className="flex-1 text-xs font-medium text-cyan-300">
              Syncing {bufferedCount} buffered pings to database...
            </p>
          </div>
        )}

        {/* Ping Log */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Activity className="h-3.5 w-3.5" />
              Ping Log
            </h3>
            {log.length > 0 && !sealed && (
              <button
                onClick={onClearLog}
                className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-300"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>

          <div className="h-48 overflow-y-auto rounded-xl border border-slate-700/40 bg-slate-950/50">
            {log.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-600">
                <Radio className="mb-2 h-6 w-6 opacity-30" />
                <p className="text-xs">No pings yet. Start the stream to begin logging.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {log.map((entry) => {
                  const isBreachTemp = entry.temperature > 8 || entry.temperature < 2;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 px-3 py-2 text-xs transition-colors hover:bg-slate-800/30"
                    >
                      {/* Status icon */}
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                          entry.buffered
                            ? 'bg-amber-500/20 text-amber-400'
                            : entry.synced
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-700/40 text-slate-500'
                        }`}
                      >
                        {entry.buffered ? (
                          <Database className="h-3 w-3" />
                        ) : entry.synced ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                      </div>

                      {/* Sensor name */}
                      <span className="w-20 shrink-0 truncate font-medium text-slate-300">
                        {entry.sensorName}
                      </span>

                      {/* Temperature */}
                      <span
                        className={`shrink-0 font-bold tabular-nums ${
                          isBreachTemp ? 'text-red-400' : 'text-cyan-300'
                        }`}
                      >
                        {entry.temperature.toFixed(1)}°C
                      </span>

                      {/* Mode badge */}
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          entry.mode === 'breach'
                            ? 'bg-red-500/20 text-red-400'
                            : entry.mode === 'offline'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {entry.mode === 'breach'
                          ? 'BREACH'
                          : entry.mode === 'offline'
                            ? 'BUFFERED'
                            : 'NORMAL'}
                      </span>

                      {/* Timestamp + hash */}
                      <span className="ml-auto flex shrink-0 flex-col items-end">
                        <span className="text-slate-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        {entry.hash && (
                          <span className="font-mono text-[9px] text-slate-600">
                            {formatShortHash(entry.hash)}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
