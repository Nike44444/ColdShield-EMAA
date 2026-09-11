import { useState, useEffect, useCallback, useRef } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type {
  Sensor,
  TemperatureReading,
  BreachEvent,
  AlertLog,
  SensorWithBreach,
} from '@/types';

const SIMULATION_INTERVAL = 2000; // 2 seconds per BLE ping
const SIM_MINUTES_PER_PING = 2; // each ping represents 2 minutes of real time
const SUPERVISOR_THRESHOLD = 5; // 5 minutes → escalate to supervisor
const PHARMACIST_THRESHOLD = 15; // 15 minutes → escalate to pharmacist
const PHARMACIST_TEMP_THRESHOLD = 12; // temp > 12 or < -2 → immediate pharmacist

type BreachState = {
  breachMinutes: number;
  alertLevel: number;
  activeBreachId: string | null;
  breachType: 'high' | 'low' | null;
  maxTemp: number;
  minTemp: number;
};

type SensorState = Record<string, BreachState>;

const DEMO_SENSORS: Sensor[] = [
  {
    id: 'demo-clinic-a',
    name: 'Vaccine Carrier A',
    location: 'Primary Health Centre — Receiving Bay',
    min_temp: 2,
    max_temp: 8,
    status: 'normal',
    current_temp: 4.6,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'demo-clinic-b',
    name: 'Vaccine Carrier B',
    location: 'District Vaccine Store — Cold Room',
    min_temp: 2,
    max_temp: 8,
    status: 'normal',
    current_temp: 5.1,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'demo-clinic-c',
    name: 'Outreach Cold Box',
    location: 'Field Immunization Site — Checkpoint',
    min_temp: 2,
    max_temp: 8,
    status: 'normal',
    current_temp: 3.8,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

function generateTemperature(sensor: Sensor): number {
  const baseTemp = sensor.current_temp ?? (sensor.min_temp + sensor.max_temp) / 2;
  const range = sensor.max_temp - sensor.min_temp;
  const center = (sensor.min_temp + sensor.max_temp) / 2;
  const noise = (Math.random() - 0.5) * range * 0.3;
  const drift = Math.sin(Date.now() / 30000) * range * 0.15;
  const temp = center + drift + noise;

  // 15% chance of a spike for testing alert escalation
  if (Math.random() < 0.15) {
    const spikeDirection = Math.random() < 0.5 ? 1 : -1;
    const spikeMagnitude = range * (0.5 + Math.random() * 0.8);
    return Math.round((center + spikeDirection * spikeMagnitude) * 10) / 10;
  }

  return Math.round(temp * 10) / 10;
}

function isBreaching(temp: number, sensor: Sensor): boolean {
  return temp > sensor.max_temp || temp < sensor.min_temp;
}

function getBreachType(temp: number, sensor: Sensor): 'high' | 'low' {
  return temp > sensor.max_temp ? 'high' : 'low';
}

export function useColdChain() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorStates, setSensorStates] = useState<SensorState>({});
  const [readings, setReadings] = useState<Record<string, TemperatureReading[]>>({});
  const [breachEvents, setBreachEvents] = useState<BreachEvent[]>([]);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [stats, setStats] = useState({
    totalSensors: 0,
    activeBreaches: 0,
    totalBreaches: 0,
    acknowledgedAlerts: 0,
    unacknowledgedAlerts: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sensorStatesRef = useRef<SensorState>({});

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      const states = Object.fromEntries(
        DEMO_SENSORS.map((sensor) => [sensor.id, {
          breachMinutes: 0,
          alertLevel: 0,
          activeBreachId: null,
          breachType: null,
          maxTemp: 0,
          minTemp: 0,
        }])
      ) as SensorState;
      setSensors(DEMO_SENSORS);
      setSensorStates(states);
      sensorStatesRef.current = states;
      setBreachEvents([]);
      setAlertLogs([]);
      setStats({
        totalSensors: DEMO_SENSORS.length,
        activeBreaches: 0,
        totalBreaches: 0,
        acknowledgedAlerts: 0,
        unacknowledgedAlerts: 0,
      });
      setLoading(false);
      return;
    }
    const [
      { data: sensorData },
      { data: breachData },
      { data: alertData },
    ] = await Promise.all([
      supabase.from('sensors').select('*').order('created_at'),
      supabase.from('breach_events').select('*').order('start_time', { ascending: false }).limit(50),
      supabase.from('alert_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    if (sensorData) {
      setSensors(sensorData as Sensor[]);
      const states: SensorState = {};
      for (const sensor of sensorData as Sensor[]) {
        const activeBreach = (breachData as BreachEvent[] | null)?.find(
          (b) => b.sensor_id === sensor.id && b.status === 'active'
        );
        states[sensor.id] = {
          breachMinutes: activeBreach?.duration_minutes ?? 0,
          alertLevel: activeBreach?.alert_level ?? 0,
          activeBreachId: activeBreach?.id ?? null,
          breachType: (activeBreach?.breach_type as 'high' | 'low') ?? null,
          maxTemp: activeBreach?.max_temp ?? 0,
          minTemp: activeBreach?.min_temp ?? 0,
        };
      }
      setSensorStates(states);
      sensorStatesRef.current = states;
    }

    if (breachData) setBreachEvents(breachData as BreachEvent[]);
    if (alertData) setAlertLogs(alertData as AlertLog[]);

    setLoading(false);
  }, []);

  // Process a single temperature ping for a sensor
  const processTemperaturePing = useCallback(
    async (sensor: Sensor, temp: number) => {
      const state = sensorStatesRef.current[sensor.id] ?? {
        breachMinutes: 0,
        alertLevel: 0,
        activeBreachId: null,
        breachType: null,
        maxTemp: 0,
        minTemp: 0,
      };

      const breaching = isBreaching(temp, sensor);

      // Insert temperature reading
      const { data: readingData } = await supabase
        .from('temperature_readings')
        .insert({
          sensor_id: sensor.id,
          temperature: temp,
          is_breach: breaching,
          recorded_at: new Date().toISOString(),
        })
        .select()
        .single();

      // Update sensor current temp
      await supabase
        .from('sensors')
        .update({
          current_temp: temp,
          status: breaching ? (temp > sensor.max_temp + 4 || temp < sensor.min_temp - 4 ? 'critical' : 'warning') : 'normal',
        })
        .eq('id', sensor.id);

      // Update local readings
      if (readingData) {
        setReadings((prev) => {
          const sensorReadings = prev[sensor.id] ?? [];
          const updated = [...sensorReadings, readingData as TemperatureReading].slice(-60);
          return { ...prev, [sensor.id]: updated };
        });
      }

      let newState: BreachState = { ...state };

      if (breaching) {
        const breachType = getBreachType(temp, sensor);
        const updatedBreachTime = state.breachMinutes + SIM_MINUTES_PER_PING;
        const newMaxTemp = Math.max(state.maxTemp, temp);
        const newMinTemp = state.minTemp === 0 ? temp : Math.min(state.minTemp, temp);

        // Determine new alert level
        let newAlertLevel = state.alertLevel;
        let shouldCreateAlert = false;
        let alertRole = '';
        let alertMessage = '';

        if (
          temp > PHARMACIST_TEMP_THRESHOLD ||
          temp < sensor.min_temp - 4 ||
          updatedBreachTime >= PHARMACIST_THRESHOLD
        ) {
          if (state.alertLevel < 3) {
            newAlertLevel = 3;
            shouldCreateAlert = true;
            alertRole = 'pharmacist';
            alertMessage = `LEVEL 3 ALERT: ${sensor.name} — Severe temperature breach (${temp}°C, ${updatedBreachTime} min). Escalating to Pharmacist.`;
          }
        } else if (updatedBreachTime >= SUPERVISOR_THRESHOLD) {
          if (state.alertLevel < 2) {
            newAlertLevel = 2;
            shouldCreateAlert = true;
            alertRole = 'supervisor';
            alertMessage = `LEVEL 2 ALERT: ${sensor.name} — Heat breach detected (${temp}°C, >5 min). Escalating to Supervisor.`;
          }
        } else if (state.alertLevel < 1) {
          newAlertLevel = 1;
          shouldCreateAlert = true;
          alertRole = 'worker';
          alertMessage = `LEVEL 1 ALERT: ${sensor.name} — Temperature out of range (${temp}°C). Immediate attention required.`;
        }

        newState = {
          breachMinutes: updatedBreachTime,
          alertLevel: newAlertLevel,
          activeBreachId: state.activeBreachId,
          breachType,
          maxTemp: newMaxTemp,
          minTemp: newMinTemp,
        };

        // Create or update breach event
        if (!state.activeBreachId) {
          const { data: breachData } = await supabase
            .from('breach_events')
            .insert({
              sensor_id: sensor.id,
              start_time: new Date().toISOString(),
              breach_type: breachType,
              max_temp: newMaxTemp,
              min_temp: newMinTemp,
              duration_minutes: updatedBreachTime,
              alert_level: newAlertLevel,
              status: 'active',
            })
            .select()
            .single();

          if (breachData) {
            newState.activeBreachId = (breachData as BreachEvent).id;
            setBreachEvents((prev) => [breachData as BreachEvent, ...prev]);
          }
        } else {
          await supabase
            .from('breach_events')
            .update({
              max_temp: newMaxTemp,
              min_temp: newMinTemp,
              duration_minutes: updatedBreachTime,
              alert_level: newAlertLevel,
            })
            .eq('id', state.activeBreachId);

          setBreachEvents((prev) =>
            prev.map((b) =>
              b.id === state.activeBreachId
                ? {
                    ...b,
                    max_temp: newMaxTemp,
                    min_temp: newMinTemp,
                    duration_minutes: updatedBreachTime,
                    alert_level: newAlertLevel,
                  }
                : b
            )
          );
        }

        // Create alert log if escalated
        if (shouldCreateAlert) {
          const { data: alertData } = await supabase
            .from('alert_logs')
            .insert({
              breach_event_id: newState.activeBreachId,
              sensor_id: sensor.id,
              alert_level: newAlertLevel,
              message: alertMessage,
              recipient_role: alertRole,
              acknowledged: false,
            })
            .select()
            .single();

          if (alertData) {
            setAlertLogs((prev) => [alertData as AlertLog, ...prev]);
          }
        }
      } else {
        // Temperature back in safe range — resolve breach if one was active
        if (state.activeBreachId) {
          await supabase
            .from('breach_events')
            .update({
              end_time: new Date().toISOString(),
              status: 'resolved',
            })
            .eq('id', state.activeBreachId);

          setBreachEvents((prev) =>
            prev.map((b) =>
              b.id === state.activeBreachId
                ? { ...b, end_time: new Date().toISOString(), status: 'resolved' }
                : b
            )
          );
        }

        newState = {
          breachMinutes: 0,
          alertLevel: 0,
          activeBreachId: null,
          breachType: null,
          maxTemp: 0,
          minTemp: 0,
        };
      }

      sensorStatesRef.current[sensor.id] = newState;
      setSensorStates((prev) => ({ ...prev, [sensor.id]: newState }));
    },
    []
  );

  // Run a single simulation tick
  const runSimulationTick = useCallback(async () => {
    const currentSensors = sensorStatesRef.current
      ? Object.keys(sensorStatesRef.current).length > 0
        ? sensors
        : sensors
      : sensors;
    if (currentSensors.length === 0) return;

    for (const sensor of currentSensors) {
      if (!sensor.is_active) continue;
      const temp = generateTemperature(sensor);
      await processTemperaturePing(sensor, temp);
    }

    // Update stats
    const states = sensorStatesRef.current;
    const activeBreaches = Object.values(states).filter((s) => s.alertLevel > 0).length;
    const unackAlerts = alertLogs.filter((a) => !a.acknowledged).length;
    setStats({
      totalSensors: currentSensors.length,
      activeBreaches,
      totalBreaches: breachEvents.length,
      acknowledgedAlerts: alertLogs.filter((a) => a.acknowledged).length,
      unacknowledgedAlerts: unackAlerts,
    });
  }, [sensors, processTemperaturePing, alertLogs, breachEvents]);

  // Start/stop simulation
  const startSimulation = useCallback(() => {
    setSimulating(true);
  }, []);

  const stopSimulation = useCallback(() => {
    setSimulating(false);
  }, []);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback(async (alertId: string, user: string) => {
    const { data } = await supabase
      .from('alert_logs')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user,
      })
      .eq('id', alertId)
      .select()
      .single();

    if (data) {
      setAlertLogs((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                acknowledged: true,
                acknowledged_at: new Date().toISOString(),
                acknowledged_by: user,
              }
            : a
        )
      );
    }
  }, []);

  // Trigger a named incident pattern on a specific sensor (or first active sensor).
  const triggerHeatBreach = useCallback(async (
    sensorId?: string,
    scenario: 'door-open' | 'cooling-failure' | 'freeze-shock' = 'door-open'
  ) => {
    const target = sensorId
      ? sensors.find((s) => s.id === sensorId)
      : sensors.find((s) => s.is_active);
    if (!target) return;

    const breachTemp = scenario === 'freeze-shock'
      ? target.min_temp - 3.5 - Math.random() * 1.5
      : scenario === 'cooling-failure'
        ? target.max_temp + 7.5 + Math.random() * 2
        : target.max_temp + 1.5 + Math.random() * 1.5;
    await processTemperaturePing(target, Math.round(breachTemp * 10) / 10);
  }, [sensors, processTemperaturePing]);

  // Toggle a sensor's online/offline status
  const toggleOfflineMode = useCallback(async (sensorId?: string) => {
    const target = sensorId
      ? sensors.find((s) => s.id === sensorId)
      : sensors.find((s) => s.is_active);
    if (!target) return;

    const newActive = !target.is_active;
    await supabase
      .from('sensors')
      .update({ is_active: newActive })
      .eq('id', target.id);

    setSensors((prev) =>
      prev.map((s) =>
        s.id === target.id ? { ...s, is_active: newActive } : s
      )
    );
  }, [sensors]);

  // Simulate a QR code scan — returns sensor info as if scanned from a physical label
  const [qrScanResult, setQrScanResult] = useState<{
    sensor: Sensor;
    scannedAt: string;
  } | null>(null);

  const simulateQRScan = useCallback(async (sensorId?: string) => {
    const target = sensorId
      ? sensors.find((sensor) => sensor.id === sensorId)
      : sensors[0];
    if (!target) return;

    setQrScanResult({
      sensor: target,
      scannedAt: new Date().toISOString(),
    });
  }, [sensors]);

  const clearQRScanResult = useCallback(() => {
    setQrScanResult(null);
  }, []);

  // Resolve a breach event
  const resolveBreach = useCallback(async (breachId: string) => {
    const { data } = await supabase
      .from('breach_events')
      .update({
        end_time: new Date().toISOString(),
        status: 'resolved',
      })
      .eq('id', breachId)
      .select()
      .single();

    if (data) {
      setBreachEvents((prev) =>
        prev.map((b) =>
          b.id === breachId
            ? { ...b, end_time: new Date().toISOString(), status: 'resolved' }
            : b
        )
      );
    }
  }, []);

  // Load readings for a specific sensor
  const loadSensorReadings = useCallback(async (sensorId: string) => {
    const { data } = await supabase
      .from('temperature_readings')
      .select('*')
      .eq('sensor_id', sensorId)
      .order('recorded_at', { ascending: false })
      .limit(60);

    if (data) {
      setReadings((prev) => ({
        ...prev,
        [sensorId]: (data as TemperatureReading[]).reverse(),
      }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Simulation loop
  useEffect(() => {
    if (!simulating || sensors.length === 0) return;

    intervalRef.current = setInterval(() => {
      runSimulationTick();
    }, SIMULATION_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [simulating, sensors, runSimulationTick]);

  // Build sensor with breach data
  const sensorsWithBreach: SensorWithBreach[] = sensors.map((sensor) => {
    const state = sensorStates[sensor.id] ?? {
      breachMinutes: 0,
      alertLevel: 0,
      activeBreachId: null,
      breachType: null,
      maxTemp: 0,
      minTemp: 0,
    };
    const activeBreach = breachEvents.find(
      (b) => b.sensor_id === sensor.id && b.status === 'active'
    ) ?? null;
    return {
      ...sensor,
      breachMinutes: state.breachMinutes,
      alertLevel: state.alertLevel,
      recentReadings: readings[sensor.id] ?? [],
      activeBreach,
    };
  });

  return {
    sensors: sensorsWithBreach,
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
    refreshData: loadData,
  };
}
