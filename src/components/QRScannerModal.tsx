import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, QrCode, X } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

type QRScannerModalProps = { title: string; expectedPrefix: string; onClose: () => void; onVerified: (payload: string) => void };
const READER_ID = 'emaa-camera-qr-reader';

export function QRScannerModal({ title, expectedPrefix, onClose, onVerified }: QRScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<'starting' | 'ready' | 'error'>('starting');
  const [manualValue, setManualValue] = useState(expectedPrefix);
  const [message, setMessage] = useState('Point the camera at the EMAA QR label.');
  const stopScanner = () => { const scanner = scannerRef.current; scannerRef.current = null; if (scanner) void scanner.stop().catch(() => undefined).finally(() => void scanner.clear().catch(() => undefined)); };
  const verify = (payload: string) => { if (!payload.trim().toUpperCase().startsWith(expectedPrefix)) { setMessage(`This is not an EMAA QR. Use a code beginning ${expectedPrefix}.`); return; } stopScanner(); onVerified(payload.trim()); };
  useEffect(() => {
    let active = true;
    const start = async () => { try { const scanner = new Html5Qrcode(READER_ID, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] }); scannerRef.current = scanner; await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1 }, (decodedText) => { if (active) verify(decodedText); }, () => undefined); if (active) setStatus('ready'); } catch { if (active) { setStatus('error'); setMessage('Camera access is unavailable. Enter the shipment QR value below to continue the demo.'); } } };
    start(); return () => { active = false; stopScanner(); };
  }, []);
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/75 p-4 backdrop-blur-sm sm:items-center"><div className="w-full max-w-md overflow-hidden rounded-2xl border border-cyan-600/50 bg-slate-900 shadow-2xl"><div className="flex items-center gap-3 border-b border-slate-700/60 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300"><QrCode className="h-5 w-5" /></div><div><h2 className="font-semibold text-white">{title}</h2><p className="text-xs text-slate-400">Camera QR scan with verified demo fallback</p></div><button onClick={onClose} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button></div><div className="p-4"><div className="overflow-hidden rounded-xl border border-cyan-800/50 bg-slate-950 p-1"><div id={READER_ID} className="min-h-64 [&_video]:w-full [&_video]:rounded-lg" /></div><p className="mt-3 flex items-start gap-2 text-xs text-slate-300"><Camera className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />{status === 'ready' ? message : status === 'starting' ? 'Starting camera scanner…' : message}</p><div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-950/50 p-3"><p className="mb-2 text-xs font-medium text-slate-300">Demo fallback — enter the printed QR value</p><div className="flex gap-2"><input value={manualValue} onChange={(event) => setManualValue(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500" /><button onClick={() => verify(manualValue)} className="rounded-lg bg-cyan-600 px-3 text-xs font-semibold text-white hover:bg-cyan-500"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Verify</button></div></div></div></div></div>;
}
