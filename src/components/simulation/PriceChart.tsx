"use client";
import { useId, useState } from "react";
export default function PriceChart({
  values,
  color = "#78e8ba",
  small = false,
  digits = 2,
  times = [],
}: {
  values: number[];
  color?: string;
  small?: boolean;
  digits?: number;
  times?: number[];
}) {
  const id = useId().replaceAll(":", ""),
    [hover, setHover] = useState<number | null>(null);
  if (values.length < 2) return <div className="sim-empty">Waiting for market chart history…</div>;
  const min = Math.min(...values),
    max = Math.max(...values),
    pad = Math.max((max - min) * 0.22, max * 0.0001),
    low = min - pad,
    high = max + pad;
  const w = 800,
    h = small ? 80 : 270,
    top = small ? 5 : 18,
    bottom = small ? 5 : 26,
    right = small ? 0 : 80;
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * (w - right),
    top + ((high - v) / (high - low)) * (h - top - bottom),
  ]);
  const line = points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const last = points.at(-1)!;
  return (
    <svg
      className={small ? "sim-spark" : "sim-price-chart"}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={small ? "Price trend" : "Trading price chart"}
      onMouseLeave={() => setHover(null)}
      onMouseMove={
        small
          ? undefined
          : (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHover(
                Math.max(
                  0,
                  Math.min(
                    values.length - 1,
                    Math.round(
                      ((((e.clientX - rect.left) / rect.width) * w) /
                        (w - right)) *
                        (values.length - 1),
                    ),
                  ),
                ),
              );
            }
      }
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {!small &&
        [0, 1, 2, 3, 4].map((i) => {
          const y = top + (i * (h - top - bottom)) / 4;
          return (
            <g key={i}>
              <line
                x1="0"
                x2={w - right}
                y1={y}
                y2={y}
                className="sim-grid-line"
              />
              <text x={w - right + 12} y={y + 4} className="sim-chart-label">
                {(high - (i * (high - low)) / 4).toLocaleString(undefined, {
                  maximumFractionDigits: digits,
                  minimumFractionDigits: digits,
                })}
              </text>
            </g>
          );
        })}
      <path
        d={`${line} L${w - right},${h - bottom} L0,${h - bottom} Z`}
        fill={`url(#${id})`}
      />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={small ? 3 : 2.4}
        strokeLinejoin="round"
      />
      {!small && (
        <>
          <line
            x1="0"
            x2={w - right}
            y1={last[1]}
            y2={last[1]}
            stroke={color}
            strokeOpacity=".25"
            strokeDasharray="4 5"
          />
          <circle
            cx={last[0]}
            cy={last[1]}
            r="4"
            fill={color}
            className="sim-pulse"
          />
          <text x="0" y={h - 2} className="sim-chart-label">
            {times[0] ? new Date(times[0]).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : 'Earlier'}
          </text>
          <text x={w - right - 24} y={h - 2} className="sim-chart-label">
            {times.at(-1) ? new Date(times.at(-1)!).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : 'Latest'}
          </text>
        </>
      )}
      {!small && hover !== null && points[hover] && (
        <g>
          <line
            x1={points[hover][0]}
            x2={points[hover][0]}
            y1={top}
            y2={h - bottom}
            className="sim-crosshair"
          />
          <circle
            cx={points[hover][0]}
            cy={points[hover][1]}
            r="5"
            fill={color}
          />
          <rect
            x={Math.min(points[hover][0], w - 190)}
            y="0"
            width="160"
            height="24"
            rx="4"
            className="sim-tooltip-bg"
          />
          <text
            x={Math.min(points[hover][0], w - 190) + 8}
            y="17"
            className="sim-chart-label"
          >
            $
            {values[hover].toLocaleString(undefined, {
              maximumFractionDigits: digits,
            })}
          </text>
        </g>
      )}
    </svg>
  );
}
