import Link from "next/link";
import { notFound } from "next/navigation";
import { getAudit } from "@/lib/audit-service";
import { GapTrace } from "@/components/GapTrace";
import { ProvenanceFlow } from "@/components/ProvenanceFlow";
import { ValidateBar } from "@/components/ValidateBar";

/** Vue Prof — dossier d'audit TRAÇABLE : chaque conclusion se déplie jusqu'à sa source. */
export default async function ProfPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { audit } = await getAudit(courseId);
  if (!audit) notFound();

  const confColor = audit.overallConfidence >= 0.7 ? "text-verified" : "text-amber";

  return (
    <main className="flex-1 px-6 py-12">
      <article className="mx-auto max-w-3xl">
        <Link href="/chef" className="font-mono text-xs text-ink-soft hover:text-spine">
          ← vue chef de majeure
        </Link>

        <header className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-4">
          <div>
            <h1 className="font-display text-4xl text-ink">{audit.courseTitle}</h1>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
              rapport d&apos;audit · {audit.major}
              {audit.year ? ` · année ${audit.year}` : ""} · {audit.hours} h
              {audit.owner ? ` · ${audit.owner}` : ""}
              {audit.lastUpdated ? ` · révisé ${audit.lastUpdated}` : ""}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border border-rule px-3 py-1 font-mono text-sm ${confColor}`}
            title="Confiance moyenne, décomposée par conclusion"
          >
            ✓ confiance {audit.overallConfidence.toFixed(2)}
          </span>
        </header>

        {audit.description && (
          <p className="mt-4 max-w-2xl text-sm text-ink-soft">{audit.description}</p>
        )}

        <ProvenanceFlow stats={audit.sourceStats} />

        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-ink">Constats du gap</h2>
            <span className="font-mono text-xs text-ink-soft">
              {audit.gaps.length} conclusion{audit.gaps.length > 1 ? "s" : ""} · dérive {audit.driftPct}%
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Cliquez une conclusion pour remonter à ses preuves, puis à la donnée brute.
          </p>

          <ul className="mt-4 space-y-3">
            {audit.gaps.map((g, i) => (
              <GapTrace key={g.id} gap={g} index={i} />
            ))}
            {audit.gaps.length === 0 && (
              <li className="rounded-md border border-rule bg-panel p-4 text-ink-soft">
                Aucun gap corroboré — le cours est aligné sur le marché.
              </li>
            )}
          </ul>
        </section>

        {audit.flagged.length > 0 && (
          <section className="mt-8 rounded-md border border-flag/30 bg-flag/5 p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-flag">
              ⚑ Écarté par le contrôle de provenance ({audit.flagged.length})
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Signalés hors-programme par le cours, mais sans preuve marché suffisante : non
              reportés comme gaps. La transparence vaut aussi pour ce qu&apos;on refuse de conclure.
            </p>
            <ul className="mt-2 space-y-1">
              {audit.flagged.map((f) => (
                <li key={f.claim} className="text-sm text-ink">
                  « {f.claim} » <span className="text-ink-soft">— {f.reason}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8 border-t border-rule pt-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
            Couverture actuelle du cours ({audit.coveredTopics.length} sujets)
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {audit.coveredTopics.map((t) => (
              <span
                key={t.name}
                className="rounded-full border border-rule px-2 py-px font-mono text-[11px] text-ink-soft"
              >
                {t.name} · {t.depth}
              </span>
            ))}
          </div>
        </section>

        <ValidateBar courseTitle={audit.courseTitle} />
      </article>
    </main>
  );
}
