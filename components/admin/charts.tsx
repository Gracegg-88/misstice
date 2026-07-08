// Petits graphiques en SVG pur (rendu serveur, aux couleurs de la charte).

export function Sparkline({
  points,
  color,
  className = "",
}: {
  points: number[];
  color: string;
  className?: string;
}) {
  const w = 96;
  const h = 32;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const coords = points.map(
    (p, i) => `${(i * step).toFixed(1)},${(h - ((p - min) / range) * (h - 4) - 2).toFixed(1)}`
  );
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      aria-hidden="true"
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Donut({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 15.915; // circonférence ≈ 100
  let offset = 25; // démarre en haut

  return (
    <svg viewBox="0 0 42 42" className="h-32 w-32" aria-hidden="true">
      <circle cx="21" cy="21" r={r} fill="none" stroke="#F1ECFD" strokeWidth="5" />
      {total > 0 &&
        segments.map((s) => {
          const pct = (s.value / total) * 100;
          const dash = Math.max(pct - 1, 0); // petit espace entre segments
          const el = (
            <circle
              key={s.label}
              cx="21"
              cy="21"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="5"
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offset}
            />
          );
          offset -= pct;
          return el;
        })}
    </svg>
  );
}

export function LineChart({
  points,
  labels,
  color = "#6C3CE1",
}: {
  points: number[];
  labels: string[];
  color?: string;
}) {
  const w = 560;
  const h = 180;
  const padX = 34;
  const padY = 20;
  const maxY = Math.max(...points, 5);
  const niceMax = Math.ceil(maxY / 5) * 5;
  const innerW = w - padX - 8;
  const innerH = h - padY - 24;
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const x = (i: number) => padX + i * step;
  const y = (v: number) => padY + innerH - (v / niceMax) * innerH;
  const gridVals = [0, niceMax / 2, niceMax];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Activité de la plateforme">
      {/* Grille + axe Y */}
      {gridVals.map((v) => (
        <g key={v}>
          <line x1={padX} y1={y(v)} x2={w - 8} y2={y(v)} stroke="#EDEBF3" strokeWidth={1} />
          <text x={padX - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#9CA3AF">
            {v}
          </text>
        </g>
      ))}
      {/* Ligne */}
      <polyline
        points={points.map((p, i) => `${x(i)},${y(p)}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p)} r={3} fill={color} />
      ))}
      {/* Axe X */}
      {labels.map((l, i) => (
        <text key={l} x={x(i)} y={h - 6} textAnchor="middle" fontSize="10" fill="#9CA3AF">
          {l}
        </text>
      ))}
    </svg>
  );
}
