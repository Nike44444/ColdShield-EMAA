import { useEffect, useState } from 'react';
import { QrCode, Check, MapPin, Thermometer, X } from 'lucide-react';
import type { Sensor } from '@/types';

type QRScanModalProps = {
  result: { sensor: Sensor; scannedAt: string } | null;
  onClose: () => void;
  onSelectSensor: (sensorId: string) => void;
};

export function QRScanModal({ result, onClose, onSelectSensor }: QRScanModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (result) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [result]);

  if (!result || !visible) return null;

  const { sensor, scannedAt } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-cyan-700/50 bg-slate-900 shadow-2xl">
        {/* Scan animation line */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-24 w-24 rounded-xl border-2 border-cyan-500/60">
              <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-cyan-400" />
              <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-cyan-400" />
              <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-cyan-400" />
              <QrCode className="h-full w-full p-3 text-cyan-500/30" />
            </div>
          </div>
          <div className="absolute left-0 right-0 top-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.6)] animate-[scanline_1.5s_ease-in-out_infinite]" />
        </div>

        {/* Scan result */}
        <div className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">QR Code Scanned</p>
              <p className="text-xs text-slate-500">
                {new Date(scannedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sensor info card */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                <Thermometer className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{sensor.name}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" />
                  {sensor.location}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Current Temp</p>
                <p className="font-semibold text-cyan-300">
                  {sensor.current_temp?.toFixed(1) ?? '--'}°C
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Safe Range</p>
                <p className="font-semibold text-slate-300">
                  {sensor.min_temp}° – {sensor.max_temp}°
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => {
              onSelectSensor(sensor.id);
              onClose();
            }}
            className="mt-4 w-full rounded-xl bg-cyan-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
          >
            View Sensor Details
          </button>
        </div>
      </div>
    </div>
  );
}
