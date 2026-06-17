import type { Severity } from "@/lib/schemas";

const SEVERITY_VAR: Record<Severity, string> = {
  low: "var(--verified)",
  medium: "var(--amber)",
  high: "var(--flag)",
};

/** Jauge de dérive : arc semi-circulaire rempli à `drift`% + sparkline de tendance. */
export function DriftGauge({
  drift,
  severity,
  sparkline,
}: {
  drift: number;
  severity: Severity;
  sparkline: number[];
}) {
  const color = SEVERITY_VAR[severity];
  const max = Math.max(1, ...sparkline);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 96" className="w-40" role="img" aria-label={`Dérive ${drift}%`}>
        {/* arc de fond */}
        <path
          d="M20 84 A 60 60 0 0 1 140 84"
          fill="none"
          stroke="var(--rule)"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={100}
        />
        {/* arc rempli */}
        <path
          d="M20 84 A 60 60 0 0 1 140 84"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${drift} 100`}
        />
        <text
          x="80"
          y="78"
          textAnchor="middle"
          style={{ fill: color }}
          className="font-mono text-2xl"
        >
          {drift}%
        </text>
      </svg>
      <div className="mt-1 flex h-6 items-end gap-[3px]" aria-hidden>
        {sparkline.map((v, i) => (
          <span
            key={i}
            className="w-1.5 rounded-sm"
            style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: color, opacity: 0.35 + (i / sparkline.length) * 0.65 }}
          />
        ))}
      </div>
    </div>
  );
}
