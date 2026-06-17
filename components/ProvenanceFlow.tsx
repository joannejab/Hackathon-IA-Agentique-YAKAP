import type { SourceStats } from "@/lib/schemas";

/**
 * Bandeau de méthodologie : montre le chemin données brutes → conclusion.
 * La vue Prof permet de le parcourir en sens INVERSE (conclusion → preuves → source).
 */
export function ProvenanceFlow({ stats }: { stats: SourceStats }) {
  const steps = [
    {
      n: "01",
      title: "Données brutes",
      detail: `${stats.jobs} offres · ${stats.trends} technos · ${stats.papers} publications · ${stats.topics} sujets au syllabus`,
      color: "var(--ink-soft)",
    },
    {
      n: "02",
      title: "Réconciliation",
      detail: "Libellés hétérogènes ramenés à une compétence canonique unique",
      color: "var(--ch-research)",
    },
    {
      n: "03",
      title: "Corroboration",
      detail: "4 canaux croisés : marché · état de l'art · recherche · couverture",
      color: "var(--ch-tech)",
    },
    {
      n: "04",
      title: "Conclusion sourcée",
      detail: "Gap + score de confiance décomposé, traçable jusqu'à la donnée",
      color: "var(--spine)",
    },
  ];

  return (
    <section className="mt-6 rounded-md border border-rule bg-panel p-4">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
        Comment lire ce rapport — chaque conclusion se déplie jusqu&apos;à sa source
      </p>
      <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.n} className="relative">
            <div className="rounded-md border-l-2 bg-paper/50 p-3" style={{ borderColor: s.color }}>
              <p className="font-mono text-xs" style={{ color: s.color }}>
                {s.n}
              </p>
              <p className="font-medium text-ink">{s.title}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{s.detail}</p>
            </div>
            {i < steps.length - 1 && (
              <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 font-mono text-ink-soft lg:block">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
