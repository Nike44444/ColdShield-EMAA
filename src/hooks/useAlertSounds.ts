import { useEffect, useRef, useState } from 'react';
import type { AlertLog } from '@/types';

function playTone(level: number) {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return;
  const context = new AudioContextConstructor();
  const now = context.currentTime;
  const notes = level >= 3 ? [780, 620, 780, 620] : [660, 660];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + index * (level >= 3 ? 0.24 : 0.3);
    oscillator.type = level >= 3 ? 'square' : 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level >= 3 ? 0.1 : 0.06, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.2);
  });
  window.setTimeout(() => context.close(), 1400);
}

export function useAlertSounds(alerts: AlertLog[]) {
  const [muted, setMuted] = useState(false);
  const knownAlerts = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (knownAlerts.current === null) {
      knownAlerts.current = new Set(alerts.map((alert) => alert.id));
      return;
    }

    const newAlerts = alerts.filter(
      (alert) => !alert.acknowledged && !knownAlerts.current?.has(alert.id)
    );
    alerts.forEach((alert) => knownAlerts.current?.add(alert.id));
    if (!muted && newAlerts.length > 0) {
      // Yellow/orange: a two-note caution. Red: an urgent four-note alarm.
      playTone(Math.max(...newAlerts.map((alert) => alert.alert_level)));
    }
  }, [alerts, muted]);

  return { muted, toggleMuted: () => setMuted((value) => !value) };
}
