import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Sensor } from '@/types';

const BLE_PING_INTERVAL = 2000;
const STORAGE_KEY = 'ble_logger_buffer';
const MAX_LOG_ENTRIES = 100;

export type BLEMode = 'normal' | 'breach' | 'offline';

const GENESIS_HASH =
  '0000000000000000000000000000000000000000000000000000000000000000';

export type BLELogEntry = {
  id: string;
  timestamp: string;
  sensorId: string;
  sensorName: string;
  temperature: number;
  mode: BLEMode;
  synced: boolean;
  buffered: boolean;
  hash: string;
};

export type BLELoggerState = {
  isRunning: boolean;
  mode: BLEMode;
  bufferedCount: number;
  totalPings: number;
  syncedPings: number;
  lastTemperature: number | null;
  lastPingAt: string | null;
  chainHash: string;
  sealed: boolean;
  sealedAt: string | null;
};

export function formatShortHash(hash: string): string {
  if (!hash || hash.length < 8) return '----...----';
  return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
}

async function sha256Hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function loadBuffer(): BLELogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BLELogEntry[];
  } catch {
    return [];
  }
}

function saveBuffer(entries: BLELogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage full — trim to most recent 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-50)));
  }
}

function generateNormalTemp(): number {
  const center = 4.5;
  const noise = (Math.random() - 0.5) * 1.5;
  return Math.round((center + noise) * 10) / 10;
}

function generateBreachTemp(): number {
  const base = 9 + Math.random() * 4;
  return Math.round(base * 10) / 10;
}

export function useBLELogger(sensors: Sensor[]) {
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<BLEMode>('normal');
  const [log, setLog] = useState<BLELogEntry[]>([]);
  const [bufferedCount, setBufferedCount] = useState(0);
  const [totalPings, setTotalPings] = useState(0);
  const [syncedPings, setSyncedPings] = useState(0);
  const [lastTemperature, setLastTemperature] = useState<number | null>(null);
  const [lastPingAt, setLastPingAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [chainHash, setChainHash] = useState(GENESIS_HASH);
  const [sealed, setSealed] = useState(false);
  const [sealedAt, setSealedAt] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef = useRef<BLEMode>('normal');
  const sensorsRef = useRef<Sensor[]>([]);
  const isRunningRef = useRef(false);
  const pingCounterRef = useRef(0);
  const chainHashRef = useRef(GENESIS_HASH);
  const sealedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    sensorsRef.current = sensors;
  }, [sensors]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    sealedRef.current = sealed;
  }, [sealed]);

  // Load buffered count on mount
  useEffect(() => {
    const buffer = loadBuffer();
    setBufferedCount(buffer.length);
  }, []);

  // Generate a single ping
  const emitPing = useCallback(async () => {
    if (sealedRef.current) return;

    const availableSensors = sensorsRef.current.filter((s) => s.is_active);
    if (availableSensors.length === 0) return;

    const sensor = availableSensors[pingCounterRef.current % availableSensors.length];
    pingCounterRef.current++;

    const currentMode = modeRef.current;
    let temperature: number;

    if (currentMode === 'breach') {
      temperature = generateBreachTemp();
    } else {
      temperature = generateNormalTemp();
    }

    const isBreach = temperature > sensor.max_temp || temperature < sensor.min_temp;
    const now = new Date().toISOString();
    const pingId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const nextHash = await sha256Hex(
      JSON.stringify({
        prev: chainHashRef.current,
        id: pingId,
        timestamp: now,
        sensorId: sensor.id,
        temperature,
        mode: currentMode,
      })
    );
    chainHashRef.current = nextHash;
    setChainHash(nextHash);

    const entry: BLELogEntry = {
      id: pingId,
      timestamp: now,
      sensorId: sensor.id,
      sensorName: sensor.name,
      temperature,
      mode: currentMode,
      synced: false,
      buffered: currentMode === 'offline',
      hash: nextHash,
    };

    setTotalPings((prev) => prev + 1);
    setLastTemperature(temperature);
    setLastPingAt(now);

    if (currentMode === 'offline') {
      // Buffer to localStorage instead of syncing
      const buffer = loadBuffer();
      buffer.push(entry);
      saveBuffer(buffer);
      setBufferedCount(buffer.length);
      setLog((prev) => [entry, ...prev].slice(0, MAX_LOG_ENTRIES));
    } else {
      // Sync directly to Supabase
      try {
        await supabase.from('temperature_readings').insert({
          sensor_id: sensor.id,
          temperature,
          is_breach: isBreach,
          recorded_at: now,
        });

        await supabase
          .from('sensors')
          .update({
            current_temp: temperature,
            status: isBreach
              ? temperature > sensor.max_temp + 4 || temperature < sensor.min_temp - 4
                ? 'critical'
                : 'warning'
              : 'normal',
          })
          .eq('id', sensor.id);

        setSyncedPings((prev) => prev + 1);
        setLog((prev) => [{ ...entry, synced: true }, ...prev].slice(0, MAX_LOG_ENTRIES));
      } catch {
        // If sync fails, buffer locally
        const buffer = loadBuffer();
        buffer.push({ ...entry, buffered: true });
        saveBuffer(buffer);
        setBufferedCount(buffer.length);
        setLog((prev) => [{ ...entry, buffered: true }, ...prev].slice(0, MAX_LOG_ENTRIES));
      }
    }
  }, []);

  // Sync buffered pings to Supabase
  const syncBuffer = useCallback(async () => {
    const buffer = loadBuffer();
    if (buffer.length === 0) return;

    setSyncing(true);
    let synced = 0;

    // Sync in batches of 10
    for (let i = 0; i < buffer.length; i += 10) {
      const batch = buffer.slice(i, i + 10);
      const inserts = batch.map((entry) => {
        const sensor = sensorsRef.current.find((s) => s.id === entry.sensorId);
        const isBreach = sensor
          ? entry.temperature > sensor.max_temp || entry.temperature < sensor.min_temp
          : false;
        return {
          sensor_id: entry.sensorId,
          temperature: entry.temperature,
          is_breach: isBreach,
          recorded_at: entry.timestamp,
        };
      });

      try {
        await supabase.from('temperature_readings').insert(inserts);
        synced += batch.length;
      } catch {
        // Stop on error, keep remaining in buffer
        const remaining = buffer.slice(i);
        saveBuffer(remaining);
        setBufferedCount(remaining.length);
        setSyncing(false);
        return;
      }
    }

    // Update sensor temps to latest reading per sensor
    const latestBySensor = new Map<string, number>();
    for (const entry of buffer) {
      latestBySensor.set(entry.sensorId, entry.temperature);
    }
    for (const [sensorId, temp] of latestBySensor) {
      const sensor = sensorsRef.current.find((s) => s.id === sensorId);
      if (!sensor) continue;
      const isBreach = temp > sensor.max_temp || temp < sensor.min_temp;
      await supabase
        .from('sensors')
        .update({
          current_temp: temp,
          status: isBreach ? 'warning' : 'normal',
        })
        .eq('id', sensorId);
    }

    // Clear buffer
    saveBuffer([]);
    setBufferedCount(0);
    setSyncedPings((prev) => prev + synced);
    setSyncing(false);

    // Mark log entries as synced
    setLog((prev) =>
      prev.map((entry) =>
        entry.buffered ? { ...entry, synced: true, buffered: false } : entry
      )
    );
  }, []);

  // Start/stop the BLE stream
  const start = useCallback(() => {
    if (sealedRef.current) return;
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Set the emission mode
  const setBLEMode = useCallback((newMode: BLEMode) => {
    setMode(newMode);
  }, []);

  // Toggle offline mode (also triggers sync when going back online)
  const toggleOffline = useCallback(() => {
    setMode((prev) => {
      if (prev === 'offline') {
        // Going back online — trigger sync
        return 'normal';
      }
      return 'offline';
    });
  }, []);

  // Auto-sync when switching away from offline
  useEffect(() => {
    if (mode !== 'offline' && bufferedCount > 0 && !syncing) {
      syncBuffer();
    }
  }, [mode, bufferedCount, syncing, syncBuffer]);

  // Simulation interval
  useEffect(() => {
    if (!isRunning || sealed) return;

    intervalRef.current = setInterval(() => {
      emitPing();
    }, BLE_PING_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, emitPing]);

  // Manual sync button
  const manualSync = useCallback(() => {
    if (bufferedCount > 0 && !syncing) {
      syncBuffer();
    }
  }, [bufferedCount, syncing, syncBuffer]);

  // Clear log
  const clearLog = useCallback(() => {
    if (sealedRef.current) return;
    setLog([]);
    chainHashRef.current = GENESIS_HASH;
    setChainHash(GENESIS_HASH);
  }, []);

  const sealLog = useCallback(async (signatureDataUrl?: string) => {
    const sealedAtIso = new Date().toISOString();
    const sealedHash = await sha256Hex(
      JSON.stringify({
        prev: chainHashRef.current,
        signature: signatureDataUrl ?? '',
        sealedAt: sealedAtIso,
        totalPings: pingCounterRef.current,
        action: 'HANDOVER_SEAL',
      })
    );
    chainHashRef.current = sealedHash;
    setChainHash(sealedHash);
    setSealed(true);
    setSealedAt(sealedAtIso);
    setIsRunning(false);
    return sealedHash;
  }, []);

  const state: BLELoggerState = {
    isRunning,
    mode,
    bufferedCount,
    totalPings,
    syncedPings,
    lastTemperature,
    lastPingAt,
    chainHash,
    sealed,
    sealedAt,
  };

  return {
    state,
    log,
    syncing,
    start,
    stop,
    setBLEMode,
    toggleOffline,
    manualSync,
    clearLog,
    sealLog,
  };
}
