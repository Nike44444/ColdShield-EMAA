import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, QrCode, X } from 'lucide-react';

type QRScannerModalProps = { title: string; expectedPrefix: string; onClose: () => void; onVerified: (payload: string) => void };
type BarcodeDetectorLike = { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>> };
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike;

export function QRScannerModal({ title, expectedPrefix, onClose, onVerified }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'starting' | 'ready' | 'unsupported' | 'error'>('starting');
  const [manualValue, setManualValue] = useState(expectedPrefix);
  const [message, setMessage] = useState('Point the camera at the EMAA batch QR label.');
  const stopCamera = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; };
  const verify = (payload: string) => { if (!payload.trim().toUpperCase().startsWith(expectedPrefix)) { setMessage(`This is not an EMAA batch QR. Use a code beginning ${expectedPrefix}.`); return; } stopCamera(); onVerified(payload.trim()); };
  useEffect(() => {
    let interval: number | undefined; let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
        if (!Detector) { setStatus('unsupported'); setMessage('Camera is ready. This browser cannot decode QR automatically; use the fallback field below.'); return; }
        const detector = new Detector({ formats: ['qr_code'] }); setStatus('ready');
        interval = window.setInterval(async () => { const video = videoRef.current; if (!video || video.readyState < 2) return; const codes = await detector.detect(video).catch(() => []); if (codes[0]?.rawValue) verify(codes[0].rawValue); }, 500);
      } catch { setStatus('error'); setMessage('Camera permission is unavailable. Use the fallback field or allow camera access and reopen the scanner.'); }
    };
    start(); return () => { cancelled = true; if (interval) window.clearInterval(interval); stopCamera(); };
  }, []);
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/75 p-4 backdrop-blur-sm sm:items-center"><div className="w-full max-w-md overflow-hidden rounded-2xl border border-cyan-600/50 bg-slate-900 shadow-2xl"><div className="flex items-center gap-3 border-b border-slate-700/60 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300"><QrCode className="h-5 w-5" /></div><div><h2 className="font-semibold text-white">{title}</h2><p className="text-xs text-slate-400">Real camera scan with demo fallback</p></div><button onClick={onClose} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button></div><div className="p-4"><div className="relative overflow-hidden rounded-xl border border-cyan-800/50 bg-slate-950"><video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" /><div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-cyan-400/80 shadow-[0_0_24px_rgba(34,211,238,.45)]" /><div className="absolute inset-x-8 top-1/2 h-px bg-cyan-300 shadow-[0_0_10px_2px_rgba(34,211,238,.8)] animate-[scanline_1.5s_ease-in-out_infinite]" /></div><p className="mt-3 flex items-start gap-2 text-xs text-slate-300"><Camera className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />{message}</p>{(status === 'unsupported' || status === 'error') && <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-950/50 p-3"><p className="mb-2 text-xs font-medium text-slate-300">Demo / unsupported-camera fallback</p><div className="flex gap-2"><input value={manualValue} onChange={(event) => setManualValue(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500" /><button onClick={() => verify(manualValue)} className="rounded-lg bg-cyan-600 px-3 text-xs font-semibold text-white hover:bg-cyan-500"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Verify</button></div></div>}</div></div></div>;
}
