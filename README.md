# CurriculumGap Agent — YAKAP

Audit **continu et autonome** de la pertinence d'un curriculum : 5 agents IA comparent le
contenu réel d'un cours au marché de l'emploi et à l'état de l'art tech, produisent un
**rapport de gap** + des **modules à ajouter**, le tout **vérifié contre l'hallucination**.

Hackathon IA Agentique (GDG + Alumni) x EPITA — 17 juin 2026.
📄 Docs : [`docs/CONTEXTE_HACKATHON.md`](docs/CONTEXTE_HACKATHON.md) · [`docs/PROJET.md`](docs/PROJET.md) · [`docs/DESIGN_FRONTEND.md`](docs/DESIGN_FRONTEND.md)

## Quickstart

```bash
npm install
cp .env.example .env.local   # renseigner ANTHROPIC_API_KEY
npm run dev                   # http://localhost:3000
```

Build / typecheck :

```bash
npm run build
npx tsc --noEmit
```

## Stack

Next.js 16 (App Router) + React 19 + Tailwind v4 · `@anthropic-ai/sdk` (modèle `claude-opus-4-8`) · `zod`.
Tout en full-stack Next : les agents tournent dans les API routes (pas de backend séparé).

## Répartition (équipe de 4)

| Perso | Périmètre | Fichiers | Statut scaffold |
|---|---|---|---|
| **A — Infra/Pipeline** | contrats, pipeline, API, intégration, déploiement | `lib/schemas.ts`, `lib/anthropic.ts`, `lib/pipeline.ts`, `app/api/audit/route.ts` | ✅ contrats + client faits ; pipeline + API à coder |
| **B — Agents** | 5 agents + prompts | `lib/agents/*.ts` | ⬜ à coder (helper `callAgentJSON` prêt) |
| **C — Données** | dataset EPITA + pré-calcul | `data/*.json`, `scripts/precompute.ts` | ⬜ à coder |
| **D — UI/Pitch** | vues Chef & Prof + pitch | `app/page.tsx`, `app/chef/*`, `app/prof/*` | 🟡 placeholders runnables + design tokens prêts |

> **Source de vérité = `lib/schemas.ts`.** On code tous contre ces schémas. On n'y touche qu'à plusieurs.
> Fixtures mock au bon format dans `lib/fixtures.ts` → B et D bossent sans dépendre l'un de l'autre.

## Contrats des 5 agents

`Scanner` → `TechWatch` → `CourseMapper` (parallèles) → `GapReporter` → `FactChecker` → `CourseAudit`.
Schémas Zod + types : `lib/schemas.ts`. I/O détaillés : `docs/PROJET.md` §4.

## Design

Direction **B (dossier d'accréditation) + jauges de A**. Tokens (couleurs/fonts) déjà branchés
dans `app/globals.css` + `app/layout.tsx` → utilitaires Tailwind : `bg-paper`, `text-ink`,
`text-spine`, `text-verified`, `text-amber`, `text-flag`, `border-rule`, `font-display`, `font-mono`.
Spec complète : `docs/DESIGN_FRONTEND.md`.

## Points de synchro

1. **T+20** : contrats + fixtures poussés (✅ fait).
2. **T+60** : C livre les données → B teste les agents en réel.
3. **T+90** : A branche l'API → D remplace les mocks par `fetch("/api/audit?courseId=…")`.
4. **T+105** : intégration + run démo + répétition pitch.
