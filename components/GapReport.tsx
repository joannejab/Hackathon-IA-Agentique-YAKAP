import type { CourseAudit } from "@/lib/schemas";
import { ValidateBar } from "@/components/ValidateBar";

/**
 * Rendu du dossier d'audit (vue Prof + flux "Nouvel audit").
 * Composant sans dépendance serveur → utilisable côté serveur et côté client.
 */
export function GapReport({
  audit,
  source,
}: {
  audit: CourseAudit;
  source?: string;
}) {
  const confColor = audit.overallConfidence >= 0.7 ? "text-verified" : "text-amber";

  return (
    <>
      <header className="flex items-baseline justify-between border-b border-rule pb-4">
        <div>
          <h1 className="font-display text-4xl text-ink">{audit.courseTitle}</h1>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
            rapport d&apos;audit · {audit.major} · 2026
            {source === "mock" && <span className="ml-2">(démo)</span>}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border border-rule px-3 py-1 font-mono text-sm ${confColor}`}
        >
          ✓ vérifié · {audit.overallConfidence.toFixed(2)}
        </span>
      </header>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">Constat du gap</h2>
        <ul className="mt-3 space-y-3">
          {audit.gaps.map((g, i) => (
            <li
              key={g.skill}
              className="cite text-ink"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="font-medium">{g.skill}</span> — {g.evidence}
              <a
                href={`#src-${i + 1}`}
                className="ml-0.5 align-super font-mono text-xs text-spine hover:underline"
              >
                {i + 1}
              </a>
            </li>
          ))}
          {audit.gaps.length === 0 && (
            <li className="text-ink-soft">Aucun gap significatif — cours à jour.</li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">Modules suggérés</h2>
        <ol className="mt-3 space-y-4">
          {audit.suggestedModules.map((m, i) => (
            <li key={m.title} className="border-l-2 border-spine pl-4">
              <p className="text-ink">
                <span className="font-mono text-xs text-spine">§{i + 1}</span>{" "}
                <span className="font-medium">{m.title}</span>
                <span className="font-mono text-xs text-ink-soft"> · {m.hours} h</span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">{m.rationale}</p>
              {m.objectives.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-sm text-ink-soft">
                  {m.objectives.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 border-t border-rule pt-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Sources</p>
        <ul className="mt-2 space-y-1 font-mono text-xs text-ink-soft">
          {audit.gaps.map((g, i) => (
            <li key={g.skill} id={`src-${i + 1}`}>
              {i + 1}. {g.sourceRef}{" "}
              <span className="opacity-70">· confiance {g.confidence.toFixed(2)}</span>
            </li>
          ))}
        </ul>

        {audit.flagged.length > 0 && (
          <div className="mt-4 rounded-md border border-flag/30 bg-flag/5 p-3">
            <p className="font-mono text-xs uppercase tracking-widest text-flag">
              ⚑ Retiré par le Fact-Check
            </p>
            {audit.flagged.map((f) => (
              <p key={f.claim} className="mt-1 text-sm text-ink">
                « {f.claim} » <span className="text-ink-soft">— {f.reason}</span>
              </p>
            ))}
          </div>
        )}
      </section>

      <ValidateBar courseTitle={audit.courseTitle} />
    </>
  );
}
