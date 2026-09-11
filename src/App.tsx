import { useState, useEffect } from 'react';
import {
  Thermometer,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Radio,
  Pause,
  Play,
  RefreshCw,
  Snowflake,
  Gauge,
  TrendingUp,
  Hash,
  Lock,
} from 'lucide-react';
import { useColdChain } from '@/hooks/useColdChain';
import { StatCard } from '@/components/StatCard';
import { SensorCard } from '@/components/SensorCard';
import { AlertPanel } from '@/components/AlertPanel';
import { BreachLog } from '@/components/BreachLog';
import { TemperatureChart } from '@/components/TemperatureChart';
import { EscalationLegend } from '@/components/EscalationLegend';
import { SimulationControls } from '@/components/SimulationControls';
import { QRScanModal } from '@/components/QRScanModal';
import { BLELoggerPanel } from '@/components/BLELoggerPanel';
import { formatShortHash, useBLELogger } from '@/hooks/useBLELogger';

function App() {
  const {
    sensors,
    breachEvents,
    alertLogs,
    loading,
    simulating,
    stats,
    startSimulation,
    stopSimulation,
    acknowledgeAlert,
    resolveBreach,
    loadSensorReadings,
    triggerHeatBreach,
    toggleOfflineMode,
    simulateQRScan,
    clearQRScanResult,
    qrScanResult,
    refreshData,
  } = useColdChain();

  const bleLogger = useBLELogger(sensors);

  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);

  // Auto-select first sensor
  useEffect(() => {
    if (sensors.length > 0 && !selectedSensorId) {
      setSelectedSensorId(sensors[0].id);
    }
  }, [sensors, selectedSensorId]);

  // Load readings for selected sensor
  useEffect(() => {
    if (selectedSensorId) {
      loadSensorReadings(selectedSensorId);
    }
  }, [selectedSensorId, loadSensorReadings, simulating]);

  const selectedSensor = sensors.find((s) => s.id === selectedSensorId) ?? null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="text-sm text-slate-400">Loading cold chain monitoring system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-cyan-900/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-blue-900/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-teal-900/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-900/30">
              <Snowflake className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Cold Chain Monitoring
              </h1>
              <p className="text-xs text-slate-400">
                Real-time temperature surveillance & breach escalation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex max-w-[13rem] items-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-[11px] ${
                bleLogger.state.sealed
                  ? 'border-cyan-600/50 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-700/50 bg-slate-900/60 text-slate-200'
              }`}
              title={bleLogger.state.chainHash}
            >
              {bleLogger.state.sealed ? (
                <Lock className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Hash className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
              )}
              SHA-256: {formatShortHash(bleLogger.state.chainHash)}
            </span>
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                simulating
                  ? 'border-emerald-700/50 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-700/50 bg-slate-900/60 text-slate-400'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${simulating ? 'animate-pulse bg-emerald-400' : 'bg-slate-600'}`} />
              {simulating ? 'Monitoring Active' : 'Monitoring Paused'}
            </div>
            <button
              onClick={refreshData}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/60 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={simulating ? stopSimulation : startSimulation}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                simulating
                  ? 'bg-amber-600 text-white hover:bg-amber-500'
                  : 'bg-cyan-600 text-white hover:bg-cyan-500'
              }`}
            >
              {simulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {simulating ? 'Pause' : 'Start'} Monitoring
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            icon={Thermometer}
            label="Active Sensors"
            value={stats.totalSensors}
            sublabel="monitoring temperature"
            color="cyanDark"
          />
          <StatCard
            icon={AlertTriangle}
            label="Active Breaches"
            value={stats.activeBreaches}
            sublabel={stats.activeBreaches > 0 ? 'requires attention' : 'all within range'}
            color={stats.activeBreaches > 0 ? 'redDark' : 'emeraldDark'}
            animate={stats.activeBreaches > 0}
          />
          <StatCard
            icon={Activity}
            label="Total Breaches"
            value={stats.totalBreaches}
            sublabel="all time"
            color="orangeDark"
          />
          <StatCard
            icon={Radio}
            label="Pending Alerts"
            value={stats.unacknowledgedAlerts}
            sublabel="unacknowledged"
            color={stats.unacknowledgedAlerts > 0 ? 'amberDark' : 'slateDark'}
            animate={stats.unacknowledgedAlerts > 0}
          />
          <StatCard
            icon={ShieldCheck}
            label="Acknowledged"
            value={stats.acknowledgedAlerts}
            sublabel="resolved alerts"
            color="tealDark"
          />
        </div>

        {/* Simulation Controls */}
        <div className="mb-6">
          <SimulationControls
            sensors={sensors}
            onTriggerHeatBreach={triggerHeatBreach}
            onToggleOffline={toggleOfflineMode}
            onSimulateQRScan={simulateQRScan}
          />
        </div>

        {/* Escalation Legend */}
        <div className="mb-6">
          <EscalationLegend />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Sensor Grid + Chart */}
          <div className="space-y-6 lg:col-span-2">
            {/* Sensor Cards Grid */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  <Gauge className="h-4 w-4" />
                  Sensor Network
                </h2>
                <span className="text-xs text-slate-500">
                  {sensors.filter((s) => s.alertLevel === 0).length}/{sensors.length} safe
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {sensors.map((sensor) => (
                  <SensorCard
                    key={sensor.id}
                    sensor={sensor}
                    onClick={() => setSelectedSensorId(sensor.id)}
                    isSelected={selectedSensorId === sensor.id}
                  />
                ))}
              </div>
            </div>

            {/* Temperature Chart */}
            {selectedSensor && (
              <TemperatureChart
                readings={selectedSensor.recentReadings}
                sensor={selectedSensor}
              />
            )}

            {/* Breach Log */}
            <BreachLog
              breaches={breachEvents}
              sensors={sensors}
              onResolve={resolveBreach}
            />
          </div>

          {/* Right: BLE Logger + Alert Panel */}
          <div className="space-y-6 lg:col-span-1">
            <BLELoggerPanel
              state={bleLogger.state}
              log={bleLogger.log}
              syncing={bleLogger.syncing}
              onStart={bleLogger.start}
              onStop={bleLogger.stop}
              onSetMode={bleLogger.setBLEMode}
              onToggleOffline={bleLogger.toggleOffline}
              onManualSync={bleLogger.manualSync}
              onClearLog={bleLogger.clearLog}
            />
            <div className="h-[500px]">
              <AlertPanel
                alerts={alertLogs}
                sensors={sensors}
                onAcknowledge={acknowledgeAlert}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 border-t border-slate-800 pt-4">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Simulating BLE sensor pings every 2 seconds</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Safe range: 2–8°C</span>
              <span>•</span>
              <span>Supervisor escalation: 5 min</span>
              <span>•</span>
              <span>Pharmacist escalation: 15 min</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Digital Handover Modal (QR scan) */}
      <QRScanModal
        result={qrScanResult}
        sensor={
          qrScanResult
            ? sensors.find((s) => s.id === qrScanResult.sensor.id) ?? null
            : null
        }
        chainHash={bleLogger.state.chainHash}
        sealed={bleLogger.state.sealed}
        onClose={clearQRScanResult}
        onSelectSensor={(id) => setSelectedSensorId(id)}
        onSeal={(signature) => bleLogger.sealLog(signature)}
      />
    </div>
  );
}

export default App;
