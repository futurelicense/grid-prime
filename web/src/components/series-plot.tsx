"use client";

type Series = { name: string; values: number[]; stroke: string };

export function SeriesPlot({
  series,
  band,
}: {
  series: Series[];
  band?: { low: number[]; high: number[] };
}) {
  const values = [
    ...series.flatMap((item) => item.values),
    ...(band ? [...band.low, ...band.high] : []),
  ].filter((value) => Number.isFinite(value));
  if (!values.length) return <p className="text-sm text-muted">The drawing appears after a run is filed.</p>;

  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const width = 640;
  const height = 220;
  const length = Math.max(...series.map((item) => item.values.length), band?.low.length ?? 0);
  const x = (index: number) => 36 + (index * 580) / Math.max(1, length - 1);
  const y = (value: number) => 184 - ((value - min) * 160) / (max - min);
  const ticks = [0, 0.5, 1].map((fraction) => min + fraction * (max - min));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" className="w-full">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1="36" x2="620" y1={y(tick)} y2={y(tick)} stroke="#d3cbbd" />
          <text x="32" y={y(tick) + 4} textAnchor="end" fontSize="11" fill="#655f56">
            {tick.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </text>
        </g>
      ))}
      {band ? (
        <polygon
          fill="#e7f0ea"
          points={band.high
            .map((value, index) => `${x(index)},${y(value)}`)
            .concat([...band.low].reverse().map((value, index) => `${x(band.low.length - 1 - index)},${y(value)}`))
            .join(" ")}
        />
      ) : null}
      {series.map((item) => (
        <polyline
          key={item.name}
          fill="none"
          stroke={item.stroke}
          strokeWidth="2"
          points={item.values
            .map((value, index) => (Number.isFinite(value) ? `${x(index)},${y(value)}` : ""))
            .filter(Boolean)
            .join(" ")}
        />
      ))}
      {series.map((item, index) => (
        <text key={item.name} x={40 + index * 160} y="210" fontSize="12" fill={item.stroke}>
          {item.name}
        </text>
      ))}
    </svg>
  );
}
