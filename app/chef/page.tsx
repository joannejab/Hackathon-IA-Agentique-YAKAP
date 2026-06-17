import Link from "next/link";
import { mockSummaries } from "@/lib/fixtures";

/**
 * Vue Chef de majeure — PLACEHOLDER runnable (Perso D : construire les jauges de dérive,
 * cf. docs/DESIGN_FRONTEND.md). Données via mockSummaries pour l'instant.
 */
export default function ChefPage() {
  const severityColor: Record<string, string> = {
    low: "text-verified",
    medium: "text-amber",
    high: "text-flag",
  };

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="font-mono text-xs text-ink-soft hover:text-spine">
          ← accueil
        </Link>
        <h1 className="mt-3 font-display text-4xl text-ink">Majeure SCIA</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">
          audit continu · {mockSummaries.length} cours
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockSummaries.map((c) => (
            <Link
              key={c.courseId}
              href={`/prof/${c.courseId}`}
              className="rounded-md border border-rule bg-panel p-5 transition-colors hover:border-spine"
            >
              <p className="font-display text-xl text-ink">{c.courseTitle}</p>
              <p className={`mt-1 font-mono text-sm ${severityColor[c.severity]}`}>
                dérive {c.driftPct}%
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                {c.topGaps.length ? c.topGaps.join(" · ") : "à jour"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
