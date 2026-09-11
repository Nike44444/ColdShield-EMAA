import { useMemo } from 'react';
import type { TemperatureReading, Sensor } from '@/types';

type TemperatureChartProps = {
  readings: TemperatureReading[];
  sensor: Sensor;
};

export function TemperatureChart({ readings, sensor }: TemperatureChartProps) {
  const chartData = useMemo(() => {
    if (readings.length === 0) return [];
    return readings.slice(-40);
  }, [readings]);

  const width = 520;
  const height = 180;
  const padding = { top: 20, right: 16, bottom: 28, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allTemps = chartData.map((r) => r.temperature);
  const minVal = Math.min(...allTemps, sensor.min_temp - 2);
  const maxVal = Math.max(...allTemps, sensor.max_temp + 2);
  const range = maxVal - minVal || 1;

  const xStep = chartData.length > 1 ? chartW / (chartData.length - 1) : chartW;

  const points = chartData.map((r, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - ((r.temperature - minVal) / range) * chartH,
    temp: r.temperature,
    isBreach: r.is_breach,
  }));

  const safeTopY = padding.top + chartH - ((sensor.max_temp - minVal) / range) * chartH;
  const safeBottomY = padding.top + chartH - ((sensor.min_temp - minVal) / range) * chartH;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    points.length > 0
      ? `M ${points[0].x.toFixed(1)} ${padding.top + chartH} ` +
        points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
        ` L ${points[points.length - 1].x.toFixed(1)} ${padding.top + chartH} Z`
      : '';

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => minVal + (range * i) / yTicks);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">{sensor.name} — Temperature History</h3>
          <p className="text-xs text-slate-400">{sensor.location}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400" /> Reading
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-red-400" /> Breach
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-sm bg-emerald-500/30" /> Safe
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-44 items-center justify-center text-slate-500">
          <p className="text-sm">No readings yet. Start monitoring to collect data.</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: '200px' }}>
          {/* Safe zone */}
          <rect
            x={padding.left}
            y={safeTopY}
            width={chartW}
            height={safeBottomY - safeTopY}
            fill="rgba(16, 185, 129, 0.08)"
            rx="2"
          />

          {/* Safe zone lines */}
          <line
            x1={padding.left}
            y1={safeTopY}
            x2={padding.left + chartW}
            y2={safeTopY}
            stroke="rgba(16, 185, 129, 0.4)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1={padding.left}
            y1={safeBottomY}
            x2={padding.left + chartW}
            y2={safeBottomY}
            stroke="rgba(16, 185, 129, 0.4)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Y axis labels */}
          {tickValues.map((val, i) => {
            const y = padding.top + chartH - ((val - minVal) / range) * chartH;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="rgba(51, 65, 85, 0.3)"
                  strokeWidth="0.5"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-500"
                  style={{ fontSize: '9px' }}
                >
                  {val.toFixed(1)}°
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#tempGradient)" opacity="0.3" />
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line */}
          <path d={linePath} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" />

          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.isBreach ? 3.5 : 2.5}
              fill={p.isBreach ? '#f87171' : '#22d3ee'}
              stroke={p.isBreach ? '#7f1d1d' : '#0e7490'}
              strokeWidth="1"
            />
          ))}

          {/* X axis labels */}
          {chartData.length > 0 && (
            <>
              <text
                x={padding.left}
                y={height - 8}
                className="fill-slate-500"
                style={{ fontSize: '9px' }}
              >
                {new Date(chartData[0].recorded_at).toLocaleTimeString()}
              </text>
              {chartData.length > 1 && (
                <text
                  x={padding.left + chartW}
                  y={height - 8}
                  textAnchor="end"
                  className="fill-slate-500"
                  style={{ fontSize: '9px' }}
                >
                  {new Date(chartData[chartData.length - 1].recorded_at).toLocaleTimeString()}
                </text>
              )}
            </>
          )}
        </svg>
      )}
    </div>
  );
}
