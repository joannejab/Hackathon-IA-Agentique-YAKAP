import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById, getTrendById, getPaperById, getCourseById } from "@/lib/data";
import { findCitations } from "@/lib/provenance";
import type { Severity } from "@/lib/schemas";

const SEV_VAR: Record<Severity, string> = {
  low: "var(--verified)",
  medium: "var(--amber)",
  high: "var(--flag)",
};

const KIND_LABEL: Record<string, string> = {
  job: "Offre d'emploi",
  trend: "Technologie / état de l'art",
  paper: "Publication de recherche",
  syllabus: "Syllabus de cours",
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

/** Backlinks de provenance INVERSE : toutes les conclusions qui citent cette source. */
function UsedIn({ refId }: { refId: string }) {
  const cites = findCitations(refId);
  return (
    <section className="mt-8 rounded-md border border-spine/30 bg-spine/5 p-4">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-spine">
        ⤴ Remonte vers {cites.length} conclusion{cites.length > 1 ? "s" : ""}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Cette donnée brute alimente les constats suivants — la transparence fonctionne dans les
        deux sens.
      </p>
      {cites.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">
          Aucune conclusion ne s&apos;appuie (encore) sur cette source.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {cites.map((c) => (
            <li key={`${c.courseId}-${c.gapId}`}>
              <Link
                href={`/prof/${c.courseId}`}
                className="flex flex-wrap items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-paper"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: SEV_VAR[c.severity] }}
                />
                <span className="font-medium text-ink">{c.gapSkill}</span>
                <span className="text-sm text-ink-soft">
                  dans « {c.courseTitle} » · via {c.channel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function SourcePage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;

  let title = "";
  let body: React.ReactNode = null;

  if (kind === "job") {
    const job = getJobById(id);
    if (!job) notFound();
    title = job.title;
    body = (
      <>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="entreprise" value={job.company} />
          <Field label="date" value={job.date} />
          <Field label="secteur" value={job.sector} />
          <Field label="contrat" value={job.contractType} />
          <Field label="expérience" value={job.experienceYears} />
          <Field label="salaire" value={job.salaryRange} />
        </dl>
        {job.description && <p className="mt-4 text-ink">{job.description}</p>}
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-ink-soft">
          Compétences demandées
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {job.skills.map((s) => (
            <li
              key={s.name}
              className="rounded-full border px-2.5 py-0.5 text-sm"
              style={{
                borderColor: s.required ? "var(--flag)" : "var(--rule)",
                color: s.required ? "var(--flag)" : "var(--ink-soft)",
              }}
            >
              {s.name}
              <span className="ml-1 font-mono text-[10px]">{s.required ? "requis" : "souhaité"}</span>
            </li>
          ))}
        </ul>
      </>
    );
  } else if (kind === "trend") {
    const t = getTrendById(id);
    if (!t) notFound();
    title = t.name;
    body = (
      <>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="catégorie" value={t.category} />
          <Field label="maturité" value={t.maturity} />
          <Field label="depuis" value={t.since} />
          <Field label="courbe d'apprentissage" value={t.learningCurve} />
        </dl>
        {t.description && <p className="mt-4 text-ink">{t.description}</p>}
        {t.whyNow && (
          <>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-ink-soft">
              Pourquoi maintenant
            </p>
            <p className="mt-1 text-ink">{t.whyNow}</p>
          </>
        )}
        {t.relatedPaper && (
          <p className="mt-4 text-sm">
            Fondé sur la recherche :{" "}
            <Link href={`/source/paper/${t.relatedPaper}`} className="text-spine hover:underline">
              {t.relatedPaper} ↗
            </Link>
          </p>
        )}
        {t.sources && t.sources.length > 0 && (
          <p className="mt-2 font-mono text-xs text-ink-soft">sources : {t.sources.join(" · ")}</p>
        )}
      </>
    );
  } else if (kind === "paper") {
    const p = getPaperById(id);
    if (!p) notFound();
    title = p.title;
    body = (
      <>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="année" value={p.year} />
          <Field label="venue" value={p.venue} />
          <Field label="adoption" value={p.adoptionStage} />
          <Field
            label="citations≈"
            value={p.citationsApprox ? p.citationsApprox.toLocaleString("fr-FR") : undefined}
          />
          <Field label="arXiv" value={p.arxivId} />
        </dl>
        {p.abstract && <p className="mt-4 text-ink">{p.abstract}</p>}
        {p.keyContributions && p.keyContributions.length > 0 && (
          <>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-ink-soft">
              Contributions clés
            </p>
            <ul className="mt-1 list-disc pl-5 text-ink">
              {p.keyContributions.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </>
        )}
        {p.arxivId && (
          <p className="mt-4 text-sm">
            <a
              href={`https://arxiv.org/abs/${p.arxivId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-spine hover:underline"
            >
              arxiv.org/abs/{p.arxivId} ↗
            </a>
          </p>
        )}
      </>
    );
  } else if (kind === "syllabus") {
    const c = getCourseById(id);
    if (!c) notFound();
    title = `Syllabus — ${c.title}`;
    body = (
      <>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="responsable" value={c.owner} />
          <Field label="dernière révision" value={c.lastUpdated} />
          <Field label="volume" value={`${c.hours} h`} />
        </dl>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-ink-soft">
          Sujets enseignés
        </p>
        <ul className="mt-2 space-y-1.5">
          {c.topics.map((t) => (
            <li key={t.name} className="text-ink">
              <span className="font-medium">{t.name}</span>{" "}
              <span className="font-mono text-xs text-ink-soft">· {t.depth}</span>
              {t.description && <span className="block text-sm text-ink-soft">{t.description}</span>}
            </li>
          ))}
        </ul>
        {c.notCovered.length > 0 && (
          <>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-flag">
              Déclaré hors-programme
            </p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {c.notCovered.map((n) => (
                <li
                  key={n}
                  className="rounded-full border border-flag/40 px-2.5 py-0.5 text-sm text-flag"
                >
                  {n}
                </li>
              ))}
            </ul>
          </>
        )}
      </>
    );
  } else {
    notFound();
  }

  return (
    <main className="flex-1 px-6 py-12">
      <article className="mx-auto max-w-3xl">
        <Link href="/chef" className="font-mono text-xs text-ink-soft hover:text-spine">
          ← retour
        </Link>
        <header className="mt-3 border-b border-rule pb-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
            Donnée brute · {KIND_LABEL[kind] ?? kind} · {id}
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink">{title}</h1>
        </header>

        {body}

        <UsedIn refId={id} />
      </article>
    </main>
  );
}
