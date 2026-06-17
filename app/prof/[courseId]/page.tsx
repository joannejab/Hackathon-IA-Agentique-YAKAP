import Link from "next/link";
import { getMockAudit } from "@/lib/fixtures";

/**
 * Vue Prof — PLACEHOLDER runnable (Perso D : construire le dossier d'accréditation
 * avec citations en exposant + badge Fact-Check, cf. docs/DESIGN_FRONTEND.md).
 * Données via getMockAudit ; à remplacer par fetch("/api/audit?courseId=…") une fois le pipeline branché.
 * Next 16 : `params` est asynchrone.
 */
export default async function ProfPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const audit = getMockAudit(courseId);

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/chef" className="font-mono text-xs text-ink-soft hover:text-spine">
          ← vue chef de majeure
        </Link>

        <header className="mt-3 flex items-baseline justify-between border-b border-rule pb-4">
          <div>
            <h1 className="font-display text-4xl text-ink">{audit.courseTitle}</h1>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">
              {audit.major} · 2026
            </p>
          </div>
          <span className="font-mono text-sm text-verified">
            ✓ vérifié · {audit.overallConfidence.toFixed(2)}
          </span>
        </header>

        <section className="mt-6">
          <h2 className="font-display text-2xl text-ink">Constat du gap</h2>
          <ul className="mt-3 space-y-2">
            {audit.gaps.map((g, i) => (
              <li key={g.skill} className="text-ink">
                <span className="font-medium">{g.skill}</span> — {g.evidence}
                <sup className="ml-0.5 font-mono text-xs text-spine">{i + 1}</sup>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl text-ink">Modules suggérés</h2>
          <ol className="mt-3 space-y-3">
            {audit.suggestedModules.map((m, i) => (
              <li key={m.title} className="border-l-2 border-spine pl-3">
                <p className="text-ink">
                  <span className="font-mono text-xs text-spine">§{i + 1}</span>{" "}
                  <span className="font-medium">{m.title}</span>
                  <span className="font-mono text-xs text-ink-soft"> · {m.hours} h</span>
                </p>
                <p className="text-sm text-ink-soft">{m.rationale}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8 border-t border-rule pt-4">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">
            Sources
          </p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-ink-soft">
            {audit.gaps.map((g, i) => (
              <li key={g.skill}>
                {i + 1}. {g.sourceRef}
              </li>
            ))}
          </ul>
          {audit.flagged.map((f) => (
            <p key={f.claim} className="mt-3 text-sm text-flag">
              ⚑ Retiré par le Fact-Check : « {f.claim} » — {f.reason}
            </p>
          ))}
        </section>
      </div>
    </main>
  );
}
