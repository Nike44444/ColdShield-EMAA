import { useEffect, useState } from 'react';
import { Pause, Play, Snowflake, TrendingUp, Hash, Lock } from 'lucide-react';
import { useColdChain } from '@/hooks/useColdChain';
import { SensorCard } from '@/components/SensorCard';
import { TemperatureChart } from '@/components/TemperatureChart';
import { AlertPanel } from '@/components/AlertPanel';
import { SimulationControls, type IncidentScenario } from '@/components/SimulationControls';
import { QRScanModal } from '@/components/QRScanModal';
import { QRScannerModal } from '@/components/QRScannerModal';
import { BLELoggerPanel } from '@/components/BLELoggerPanel';
import { ChainOfCustodyPanel } from '@/components/ChainOfCustodyPanel';
import { CriticalAlertModal } from '@/components/CriticalAlertModal';
import { LastMileTracker } from '@/components/LastMileTracker';
import { VaccineProfiles } from '@/components/VaccineProfiles';
import { formatShortHash, useBLELogger } from '@/hooks/useBLELogger';

function App() {
  const { sensors, alertLogs, loading, simulating, startSimulation, stopSimulation, acknowledgeAlert, loadSensorReadings, triggerHeatBreach, simulateQRScan, clearQRScanResult, qrScanResult } = useColdChain();
  const bleLogger = useBLELogger(sensors);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [incident, setIncident] = useState<string | null>(null);
  const [scannerMode, setScannerMode] = useState<'dispatch' | 'destination' | null>(null);
  const [dispatchPayload, setDispatchPayload] = useState<string | null>(null);

  useEffect(() => {
    if (sensors.length > 0 && !selectedSensorId) setSelectedSensorId(sensors[0].id);
  }, [sensors, selectedSensorId]);
  useEffect(() => {
    if (selectedSensorId) loadSensorReadings(selectedSensorId);
  }, [selectedSensorId, loadSensorReadings, simulating]);
  const selectedSensor = sensors.find((sensor) => sensor.id === selectedSensorId) ?? null;
  const runScenario = (scenario: IncidentScenario) => {
    const label = scenario === 'door-open' ? 'Door left open' : scenario === 'cooling-failure' ? 'Cooling failure' : 'Freeze exposure';
    setIncident(`${label} recorded for ${selectedSensor?.name ?? 'the selected unit'}. The graph and alert workflow now reflect this event.`);
    triggerHeatBreach(selectedSensorId ?? undefined, scenario);
  };
  const completeScan = (payload: string) => {
    if (scannerMode === 'dispatch') { setDispatchPayload(payload); bleLogger.start(); }
    else if (scannerMode === 'destination') simulateQRScan(selectedSensorId ?? undefined);
    setScannerMode(null);
  };
  const requestDestinationScan = () => {
    if (!dispatchPayload) { setIncident('Dispatch QR verification is required before the destination handover scan.'); return; }
    setScannerMode('destination');
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950"><div className="flex flex-col items-center gap-3"><div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" /><p className="text-sm text-slate-400">Loading cold chain monitoring system...</p></div></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-cyan-900/10 blur-3xl" /><div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-blue-900/10 blur-3xl" /><div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-teal-900/10 blur-3xl" /></div>
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-900/30"><Snowflake className="h-6 w-6 text-white" /></div><div><h1 className="text-xl font-bold tracking-tight sm:text-2xl">EMAA</h1><p className="text-xs text-slate-400">Vaccine chain-of-custody & excursion safety</p></div></div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex max-w-[13rem] items-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-[11px] ${bleLogger.state.sealed ? 'border-cyan-600/50 bg-cyan-950/40 text-cyan-300' : 'border-slate-700/50 bg-slate-900/60 text-slate-200'}`} title={bleLogger.state.chainHash}>{bleLogger.state.sealed ? <Lock className="h-3.5 w-3.5 shrink-0" /> : <Hash className="h-3.5 w-3.5 shrink-0 text-cyan-400" />}SHA-256: {formatShortHash(bleLogger.state.chainHash)}</span>
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${simulating ? 'border-emerald-700/50 bg-emerald-950/40 text-emerald-300' : 'border-slate-700/50 bg-slate-900/60 text-slate-400'}`}><span className={`h-2 w-2 rounded-full ${simulating ? 'animate-pulse bg-emerald-400' : 'bg-slate-600'}`} />{simulating ? 'Monitoring Active' : 'Monitoring Paused'}</div>
            <button onClick={simulating ? stopSimulation : startSimulation} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${simulating ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-cyan-600 text-white hover:bg-cyan-500'}`}>{simulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{simulating ? 'Pause' : 'Start'} Monitoring</button>
          </div>
        </header>
        <div className="mb-6"><SimulationControls onScenario={runScenario} onToggleLoggerOffline={bleLogger.toggleOffline} onSimulateQRScan={requestDestinationScan} /></div>
        {incident && <div className="mb-6 rounded-xl border border-cyan-700/40 bg-cyan-950/25 px-4 py-3 text-sm text-cyan-100">{incident}</div>}
        <main className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <ChainOfCustodyPanel logger={bleLogger.state} log={bleLogger.log} dispatchPayload={dispatchPayload} onRequestDispatchScan={() => setScannerMode('dispatch')} onRequestDestinationScan={requestDestinationScan} />
            <section className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Temperature checks</h2><p className="mt-1 text-xs text-slate-500">Select a refrigerator to inspect its timestamped graph and current condition.</p></div><span className="shrink-0 text-xs text-slate-500">{sensors.filter((sensor) => sensor.alertLevel === 0).length}/{sensors.length} in range</span></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{sensors.map((sensor) => <SensorCard key={sensor.id} sensor={sensor} onClick={() => setSelectedSensorId(sensor.id)} isSelected={selectedSensorId === sensor.id} />)}</div>
              {selectedSensor && <div className="mt-4"><TemperatureChart readings={selectedSensor.recentReadings} sensor={selectedSensor} /></div>}
            </section>
            <VaccineProfiles />
            <LastMileTracker />
          </div>
          <aside className="space-y-6 xl:col-span-1">
            <BLELoggerPanel state={bleLogger.state} log={bleLogger.log} syncing={bleLogger.syncing} onStart={bleLogger.start} onStop={bleLogger.stop} onSetMode={bleLogger.setBLEMode} onToggleOffline={bleLogger.toggleOffline} onManualSync={bleLogger.manualSync} onClearLog={bleLogger.clearLog} />
            <div className="h-[26rem]"><AlertPanel alerts={alertLogs} sensors={sensors} onAcknowledge={acknowledgeAlert} /></div>
          </aside>
        </main>
        <footer className="mt-8 border-t border-slate-800 pt-4"><div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row"><div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /><span>Simulating BLE sensor pings every 2 seconds</span></div><div className="flex items-center gap-4"><span>Safe range: 2–8°C</span><span>•</span><span>Supervisor escalation: 5 min</span><span>•</span><span>Pharmacist escalation: 15 min</span></div></div></footer>
      </div>
      <QRScanModal result={qrScanResult} sensor={qrScanResult ? sensors.find((sensor) => sensor.id === qrScanResult.sensor.id) ?? null : null} chainHash={bleLogger.state.chainHash} log={bleLogger.log} sealed={bleLogger.state.sealed} onClose={clearQRScanResult} onSelectSensor={setSelectedSensorId} onSeal={(signature) => bleLogger.sealLog(signature)} />
      {scannerMode && <QRScannerModal title={scannerMode === 'dispatch' ? 'Dispatch QR verification' : 'Destination QR verification'} expectedPrefix="EMAA-" onClose={() => setScannerMode(null)} onVerified={completeScan} />}
      <CriticalAlertModal alerts={alertLogs} sensors={sensors} onAcknowledge={acknowledgeAlert} />
    </div>
  );
}

export default App;
