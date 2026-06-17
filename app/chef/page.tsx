import Link from "next/link";
import { getAllSummaries } from "@/lib/audit-service";
import { DriftGauge } from "@/components/DriftGauge";

/** Vue Chef de majeure — jauges de dérive par cours, triées par sévérité. */
export default function ChefPage() {
  const { summaries, source } = getAllSummaries();
  const avgConfidence =
    summaries.reduce((s, c) => s + c.confidence, 0) / Math.max(1, summaries.length);

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="font-mono text-xs text-ink-soft hover:text-spine">
          ← accueil
        </Link>

        <header className="mt-3 flex flex-wrap items-end justify-between gap-2 border-b border-rule pb-4">
          <div>
            <h1 className="font-display text-4xl text-ink">Majeure SCIA</h1>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
              audit continu · {summaries.length} cours
            </p>
          </div>
          <p className="font-mono text-sm text-verified">
            <span aria-hidden>⦿</span> live · confiance moy {avgConfidence.toFixed(2)}
            {source === "mock" && <span className="ml-2 text-ink-soft">(démo)</span>}
          </p>
        </header>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((c) => (
            <Link
              key={c.courseId}
              href={`/prof/${c.courseId}`}
              className="rounded-md border border-rule bg-panel p-5 transition-colors hover:border-spine focus-visible:outline focus-visible:outline-2 focus-visible:outline-spine"
            >
              <p className="font-display text-xl text-ink">{c.courseTitle}</p>
              <div className="my-3 flex justify-center">
                <DriftGauge drift={c.driftPct} severity={c.severity} sparkline={c.sparkline} />
              </div>
              <p className="text-center text-sm text-ink-soft">
                {c.topGaps.length ? c.topGaps.join(" · ") : "à jour"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
