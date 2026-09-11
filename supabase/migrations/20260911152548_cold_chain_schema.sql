/*
# Cold Chain Temperature Monitoring Schema

## Purpose
Tracks temperature sensors for cold chain storage (vaccines, pharmaceuticals).
Monitors temperature readings in real-time, detects breaches outside the safe
range (2-8°C), and escalates alerts through three levels based on breach duration.

## Alert Escalation Logic
- Level 0 (Safe): Temperature within 2-8°C
- Level 1 (Worker Alert): Immediate local alert when temp goes out of range
- Level 2 (Supervisor): Breach持续 > 5 minutes, escalates to supervisor
- Level 3 (Pharmacist): Severe or prolonged breach, escalates to pharmacist

## New Tables

### sensors
- `id` (uuid, PK) - unique sensor identifier
- `name` (text) - display name (e.g., "Fridge A-1")
- `location` (text) - physical location (e.g., "Pharmacy Storage Room")
- `min_temp` (numeric, default 2) - minimum safe temperature
- `max_temp` (numeric, default 8) - maximum safe temperature
- `status` (text, default 'normal') - current status: normal, warning, critical
- `current_temp` (numeric) - latest temperature reading
- `is_active` (boolean, default true) - whether sensor is operational
- `created_at` (timestamptz)

### temperature_readings
- `id` (uuid, PK)
- `sensor_id` (uuid, FK → sensors) - which sensor produced this reading
- `temperature` (numeric) - temperature in °C
- `is_breach` (boolean) - whether this reading is outside safe range
- `recorded_at` (timestamptz) - when the reading was taken

### breach_events
- `id` (uuid, PK)
- `sensor_id` (uuid, FK → sensors) - which sensor had the breach
- `start_time` (timestamptz) - when the breach started
- `end_time` (timestamptz, nullable) - when the breach ended (null if ongoing)
- `breach_type` (text) - 'high' or 'low' depending on direction
- `max_temp` (numeric) - highest temp during breach
- `min_temp` (numeric) - lowest temp during breach
- `duration_minutes` (numeric, default 0) - total breach duration
- `alert_level` (int, default 0) - current escalation level (0-3)
- `status` (text, default 'active') - active, acknowledged, resolved

### alert_logs
- `id` (uuid, PK)
- `breach_event_id` (uuid, FK → breach_events) - related breach event
- `sensor_id` (uuid, FK → sensors) - which sensor triggered the alert
- `alert_level` (int) - escalation level at time of alert (1, 2, or 3)
- `message` (text) - alert message content
- `recipient_role` (text) - who should receive this alert (worker, supervisor, pharmacist)
- `acknowledged` (boolean, default false) - whether the alert was acknowledged
- `acknowledged_at` (timestamptz, nullable)
- `acknowledged_by` (text, nullable)
- `created_at` (timestamptz)

## Security
- RLS enabled on all tables.
- Single-tenant (no auth) — policies allow anon + authenticated full CRUD.
- Data is intentionally shared/public for this monitoring dashboard.
*/

-- Sensors table
CREATE TABLE IF NOT EXISTS sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  min_temp numeric NOT NULL DEFAULT 2,
  max_temp numeric NOT NULL DEFAULT 8,
  status text NOT NULL DEFAULT 'normal',
  current_temp numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Temperature readings table
CREATE TABLE IF NOT EXISTS temperature_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id uuid NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  temperature numeric NOT NULL,
  is_breach boolean NOT NULL DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Breach events table
CREATE TABLE IF NOT EXISTS breach_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id uuid NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  breach_type text NOT NULL DEFAULT 'high',
  max_temp numeric NOT NULL DEFAULT 0,
  min_temp numeric NOT NULL DEFAULT 0,
  duration_minutes numeric NOT NULL DEFAULT 0,
  alert_level int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
);

-- Alert logs table
CREATE TABLE IF NOT EXISTS alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breach_event_id uuid REFERENCES breach_events(id) ON DELETE CASCADE,
  sensor_id uuid NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  alert_level int NOT NULL,
  message text NOT NULL,
  recipient_role text NOT NULL,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  acknowledged_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE breach_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;

-- Sensors policies (single-tenant, public data)
DROP POLICY IF EXISTS "anon_select_sensors" ON sensors;
CREATE POLICY "anon_select_sensors" ON sensors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sensors" ON sensors;
CREATE POLICY "anon_insert_sensors" ON sensors FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sensors" ON sensors;
CREATE POLICY "anon_update_sensors" ON sensors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sensors" ON sensors;
CREATE POLICY "anon_delete_sensors" ON sensors FOR DELETE
  TO anon, authenticated USING (true);

-- Temperature readings policies
DROP POLICY IF EXISTS "anon_select_readings" ON temperature_readings;
CREATE POLICY "anon_select_readings" ON temperature_readings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_readings" ON temperature_readings;
CREATE POLICY "anon_insert_readings" ON temperature_readings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_readings" ON temperature_readings;
CREATE POLICY "anon_update_readings" ON temperature_readings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_readings" ON temperature_readings;
CREATE POLICY "anon_delete_readings" ON temperature_readings FOR DELETE
  TO anon, authenticated USING (true);

-- Breach events policies
DROP POLICY IF EXISTS "anon_select_breaches" ON breach_events;
CREATE POLICY "anon_select_breaches" ON breach_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_breaches" ON breach_events;
CREATE POLICY "anon_insert_breaches" ON breach_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_breaches" ON breach_events;
CREATE POLICY "anon_update_breaches" ON breach_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_breaches" ON breach_events;
CREATE POLICY "anon_delete_breaches" ON breach_events FOR DELETE
  TO anon, authenticated USING (true);

-- Alert logs policies
DROP POLICY IF EXISTS "anon_select_alerts" ON alert_logs;
CREATE POLICY "anon_select_alerts" ON alert_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_alerts" ON alert_logs;
CREATE POLICY "anon_insert_alerts" ON alert_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_alerts" ON alert_logs;
CREATE POLICY "anon_update_alerts" ON alert_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_alerts" ON alert_logs;
CREATE POLICY "anon_delete_alerts" ON alert_logs FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_temperature_readings_sensor_id ON temperature_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_recorded_at ON temperature_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_breach_events_sensor_id ON breach_events(sensor_id);
CREATE INDEX IF NOT EXISTS idx_breach_events_status ON breach_events(status);
CREATE INDEX IF NOT EXISTS idx_alert_logs_breach_event_id ON alert_logs(breach_event_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_acknowledged ON alert_logs(acknowledged);

-- Seed initial sensors
INSERT INTO sensors (name, location, min_temp, max_temp, status, current_temp, is_active)
VALUES
  ('Fridge A-1', 'Pharmacy Storage Room', 2, 8, 'normal', 4.5, true),
  ('Fridge A-2', 'Pharmacy Storage Room', 2, 8, 'normal', 3.8, true),
  ('Freezer B-1', 'Vaccine Cold Room', -25, -15, 'normal', -20.0, true),
  ('Fridge C-1', 'Lab Refrigerator', 2, 8, 'normal', 5.2, true),
  ('Fridge C-2', 'Lab Refrigerator', 2, 8, 'normal', 4.0, true),
  ('Cooler D-1', 'Blood Bank Storage', 2, 6, 'normal', 3.5, true)
ON CONFLICT DO NOTHING;
