import Link from "next/link";

/**
 * Accueil — sélecteur de rôle (RoleGate).
 * Scaffold de base par Perso A ; Perso D peut raffiner (animations, détails).
 */
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
          CurriculumGap · audit continu de pertinence
        </p>
        <h1 className="mt-4 font-display text-5xl leading-tight tracking-tight text-ink">
          Votre programme suit-il
          <br />
          le marché&nbsp;?
        </h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          Des agents comparent en continu le contenu réel de vos cours au marché
          de l&apos;emploi et à l&apos;état de l&apos;art tech, puis proposent
          des modules — chaque constat étant vérifié contre l&apos;hallucination.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/chef"
            className="group rounded-md border border-rule bg-panel p-6 transition-colors hover:border-spine focus-visible:outline focus-visible:outline-2 focus-visible:outline-spine"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-spine">
              Chef de majeure
            </p>
            <p className="mt-2 font-display text-2xl text-ink">Vue globale</p>
            <p className="mt-1 text-sm text-ink-soft">
              Les gaps de tous les cours, triés par sévérité.
            </p>
          </Link>

          <Link
            href="/prof/ml-scia"
            className="group rounded-md border border-rule bg-panel p-6 transition-colors hover:border-spine focus-visible:outline focus-visible:outline-2 focus-visible:outline-spine"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-spine">
              Professeur
            </p>
            <p className="mt-2 font-display text-2xl text-ink">Mon cours</p>
            <p className="mt-1 text-sm text-ink-soft">
              Rapport de gap détaillé, sourcé, + modules suggérés.
            </p>
          </Link>
        </div>

        <Link
          href="/audit/new"
          className="mt-4 inline-block rounded-md bg-spine px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          + Nouvel audit (ajouter un cours)
        </Link>
      </div>
    </main>
  );
}
