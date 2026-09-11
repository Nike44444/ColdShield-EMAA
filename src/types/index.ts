export type Sensor = {
  id: string;
  name: string;
  location: string;
  min_temp: number;
  max_temp: number;
  status: string;
  current_temp: number | null;
  is_active: boolean;
  created_at: string;
};

export type TemperatureReading = {
  id: string;
  sensor_id: string;
  temperature: number;
  is_breach: boolean;
  recorded_at: string;
};

export type BreachEvent = {
  id: string;
  sensor_id: string;
  start_time: string;
  end_time: string | null;
  breach_type: string;
  max_temp: number;
  min_temp: number;
  duration_minutes: number;
  alert_level: number;
  status: string;
};

export type AlertLog = {
  id: string;
  breach_event_id: string | null;
  sensor_id: string;
  alert_level: number;
  message: string;
  recipient_role: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
};

export type SensorWithBreach = Sensor & {
  breachMinutes: number;
  alertLevel: number;
  recentReadings: TemperatureReading[];
  activeBreach: BreachEvent | null;
};

export const ALERT_LEVELS: Record<
  number,
  { label: string; color: string; role: string; description: string }
> = {
  0: {
    label: 'Safe',
    color: 'emerald',
    role: '',
    description: 'Temperature within safe range',
  },
  1: {
    label: 'Worker Alert',
    color: 'amber',
    role: 'Field Worker',
    description: 'Temperature out of range — immediate local alert',
  },
  2: {
    label: 'Supervisor Alert',
    color: 'orange',
    role: 'Supervisor',
    description: 'Breach lasting over 5 minutes — escalated to supervisor',
  },
  3: {
    label: 'Pharmacist Alert',
    color: 'red',
    role: 'Pharmacist',
    description: 'Severe or prolonged breach — escalated to pharmacist',
  },
};
