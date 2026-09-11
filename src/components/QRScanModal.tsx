import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  QrCode,
  Check,
  MapPin,
  Thermometer,
  X,
  PenLine,
  ShieldCheck,
  ShieldAlert,
  Eraser,
  Lock,
  Navigation,
  Syringe,
} from 'lucide-react';
import type { Sensor, SensorWithBreach } from '@/types';
import { formatShortHash } from '@/hooks/useBLELogger';

type QRScanModalProps = {
  result: { sensor: Sensor; scannedAt: string } | null;
  sensor: SensorWithBreach | null;
  chainHash: string;
  sealed: boolean;
  onClose: () => void;
  onSelectSensor: (sensorId: string) => void;
  onSeal: (signatureDataUrl: string) => Promise<string | void>;
};

type SignaturePadProps = {
  label: string;
  disabled: boolean;
  onSignedChange: (signed: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  resetKey: string;
};

function SignaturePad({
  label,
  disabled,
  onSignedChange,
  canvasRef,
  resetKey,
}: SignaturePadProps) {
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    onSignedChange(false);
  }, [canvasRef, onSignedChange, resetKey]);

  const pointerPos = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointerPos(e);
  };

  const moveDraw = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const last = lastPointRef.current;
    if (!canvas || !ctx || !last) return;
    const next = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    lastPointRef.current = next;
    onSignedChange(true);
  };

  const endDraw = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastPointRef.current = null;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
  };

  const clearSignature = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    onSignedChange(false);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <PenLine className="h-3.5 w-3.5 text-cyan-400" />
          {label}
        </p>
        {!disabled && (
          <button
            type="button"
            onClick={clearSignature}
            className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            <Eraser className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="h-24 w-full cursor-crosshair touch-none rounded-xl border border-cyan-700/40 bg-slate-950"
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
        onPointerCancel={endDraw}
      />
    </div>
  );
}

export function QRScanModal({
  result,
  sensor,
  chainHash,
  sealed,
  onClose,
  onSelectSensor,
  onSeal,
}: QRScanModalProps) {
  const [visible, setVisible] = useState(false);
  const [pharmacistSigned, setPharmacistSigned] = useState(false);
  const [fieldSigned, setFieldSigned] = useState(false);
  const [sealing, setSealing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [sealedHash, setSealedHash] = useState<string | null>(null);

  const pharmacistCanvasRef = useRef<HTMLCanvasElement>(null);
  const fieldCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (result) {
      setVisible(true);
      setPharmacistSigned(false);
      setFieldSigned(false);
      setSealing(false);
      setFinalized(false);
      setSealedHash(null);
    } else {
      setVisible(false);
    }
  }, [result]);

  if (!result || !visible) return null;

  const displaySensor = sensor ?? result.sensor;
  const temp = displaySensor.current_temp;
  const inRange =
    temp === null ||
    (temp >= displaySensor.min_temp && temp <= displaySensor.max_temp);
  const alertLevel = 'alertLevel' in displaySensor ? displaySensor.alertLevel : 0;
  const activeBreach =
    'activeBreach' in displaySensor ? displaySensor.activeBreach : null;
  const trajectoryPass = inRange && alertLevel === 0 && !activeBreach;
  // A handover can only be sealed when the dose has a safe temperature history.
  // This makes the action an actual use gate rather than a status-only warning.
  const canFinalize = trajectoryPass && pharmacistSigned && fieldSigned && !sealing;

  const handleFinalize = async () => {
    if (!canFinalize) return;
    const pharmacistCanvas = pharmacistCanvasRef.current;
    const fieldCanvas = fieldCanvasRef.current;
    if (!pharmacistCanvas || !fieldCanvas) return;
    setSealing(true);
    try {
      const combined = JSON.stringify({
        pharmacist: pharmacistCanvas.toDataURL('image/png'),
        fieldWorker: fieldCanvas.toDataURL('image/png'),
      });
      const hash = await onSeal(combined);
      setSealedHash(typeof hash === 'string' ? hash : chainHash);
      setFinalized(true);
    } finally {
      setSealing(false);
    }
  };

  const resetKey = result.scannedAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-cyan-700/50 bg-slate-900 shadow-2xl">
        <div className="relative h-24 overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-16 w-16 rounded-xl border-2 border-cyan-500/60">
              <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-cyan-400" />
              <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-cyan-400" />
              <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-cyan-400" />
              <QrCode className="h-full w-full p-2 text-cyan-500/30" />
            </div>
          </div>
          <div className="absolute left-0 right-0 top-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.6)] animate-[scanline_1.5s_ease-in-out_infinite]" />
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Digital Handover</p>
              <p className="text-xs text-slate-500">
                QR scanned {new Date(result.scannedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-800/50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                <Thermometer className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{displaySensor.name}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" />
                  {displaySensor.location}
                </div>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                trajectoryPass
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              {trajectoryPass ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5" />
              )}
              Trajectory {trajectoryPass ? 'PASS' : 'FAIL'}
            </span>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-3">
              <p className="text-xs text-slate-500">Current Temp</p>
              <p className="font-semibold text-cyan-300">
                {temp?.toFixed(1) ?? '--'}°C
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-3">
              <p className="text-xs text-slate-500">Safe Range</p>
              <p className="font-semibold text-slate-300">
                {displaySensor.min_temp}° – {displaySensor.max_temp}°
              </p>
            </div>
          </div>

          <div
            className={`mb-3 rounded-xl border p-3 ${
              trajectoryPass
                ? 'border-emerald-700/40 bg-emerald-950/25'
                : 'border-red-700/40 bg-red-950/25'
            }`}
          >
            <div className="flex items-start gap-2">
              <Syringe
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  trajectoryPass ? 'text-emerald-400' : 'text-red-400'
                }`}
              />
              <div>
                <p
                  className={`text-xs font-semibold ${
                    trajectoryPass ? 'text-emerald-300' : 'text-red-300'
                  }`}
                >
                  {trajectoryPass
                    ? 'Vaccine eligible for use after handover approval'
                    : 'Vaccine use blocked — unsafe temperature trajectory'}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {trajectoryPass
                    ? 'Both signatures are required before the release record is sealed.'
                    : 'Resolve the active breach and restore the safe temperature range before handover.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-700/40 bg-slate-800/40 p-3 text-xs">
            <Navigation className="h-4 w-4 shrink-0 text-cyan-400" />
            <div>
              <p className="font-medium text-slate-300">GPS-tagged handover site</p>
              <p className="text-slate-500">{displaySensor.location}</p>
            </div>
          </div>

          <p className="mb-3 text-[11px] text-slate-500">
            Pharmacist and field worker: sign below to attest this handover.
          </p>
          <div className="space-y-3">
            <SignaturePad
              label="Pharmacist signature"
              disabled={finalized || sealed}
              onSignedChange={setPharmacistSigned}
              canvasRef={pharmacistCanvasRef}
              resetKey={resetKey}
            />
            <SignaturePad
              label="Field worker signature"
              disabled={finalized || sealed}
              onSignedChange={setFieldSigned}
              canvasRef={fieldCanvasRef}
              resetKey={resetKey}
            />
          </div>

          {finalized ? (
            <div className="mt-4 rounded-xl border border-cyan-700/40 bg-cyan-950/30 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                <Lock className="h-4 w-4" />
                Handover sealed
              </p>
              <p className="mt-1 font-mono text-[11px] text-cyan-400/80">
                SHA-256: {formatShortHash(sealedHash ?? chainHash)}
              </p>
              <button
                onClick={() => {
                  onSelectSensor(displaySensor.id);
                  onClose();
                }}
                className="mt-3 w-full rounded-xl bg-cyan-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
              >
                View Sensor Details
              </button>
            </div>
          ) : (
            <>
              {!trajectoryPass && (
                <p className="mt-4 text-center text-xs font-medium text-red-400">
                  Handover approval is unavailable while this vaccine fails safety checks.
                </p>
              )}
              <button
                onClick={handleFinalize}
                disabled={!canFinalize}
                className="mt-4 w-full rounded-xl bg-cyan-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sealing
                  ? 'Sealing log…'
                  : trajectoryPass
                    ? 'Approve & Release for Use'
                    : 'Release Blocked — Safety Check Failed'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
