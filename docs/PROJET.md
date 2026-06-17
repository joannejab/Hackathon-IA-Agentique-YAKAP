# CurriculumGap Agent — Dossier projet & spec technique

> Audit **continu et autonome** de la pertinence d'un curriculum : des agents IA comparent
> le contenu réel d'un cours au marché de l'emploi et à l'état de l'art tech, produisent un
> **rapport de gap** + des **modules à ajouter**, le tout **vérifié contre hallucination**.
> Cible : YAKAP / Hackathon IA Agentique x EPITA — 17 juin 2026.

## 1. Problème & valeur

- **Problème** : les programmes scolaires/universitaires mettent des années à suivre l'évolution
  du marché du travail et de l'IA. La révision est annuelle, manuelle, lente.
- **Solution** : un **audit continu automatisé** — des agents scannent en permanence offres
  d'emploi + avancées tech, les comparent au contenu d'un cours, et signalent les manques.
- **Business** : écoles type **EPITA**, universités, organismes de formation pro paient pour
  rester pertinents au lieu d'attendre la révision manuelle. Marché quasi vierge.
- **Hiérarchie produit** :
  - **Chef de majeure** → vue globale (tous les cours, heatmap des gaps).
  - **Prof** → vue de son cours (rapport détaillé + brouillon de modules à valider).

## 2. Décisions de cadrage (validées)

| Sujet | Choix | Raison |
|---|---|---|
| Orchestration agents | Next.js full-stack + **SDK Anthropic TS** (`@anthropic-ai/sdk`) | 1 repo, 1 serveur, pas de CORS ; fiable en 2h |
| Front | **Next.js** (App Router) | demandé ; sert aussi de backend (API routes) |
| Données | **Dataset pré-collecté** (JSON) | démo 100% reproductible, pas de scraping live qui plante |
| Livrable démo | **App web** 2 vues + sélecteur de rôle (pas d'auth réelle) | "full app" sans le risque démo |
| Vertical | **Un cursus EPITA réel** (ex : majeure SCIA / cours ML) | jury EPITA = max impact business + thème |
| Modèle | **`claude-opus-4-8`** (adaptive thinking, effort `high`) | le plus capable ; `claude-sonnet-4-6` en option si latence |

## 3. Architecture

```
┌─ Données pré-collectées (/data) ─┐   ┌─ Pipeline 5 agents (API routes, Claude TS) ─┐   ┌─ Front Next.js ─┐
│ jobs.json       (offres+skills)  │   │ 1. Scanner      → skills demandées + freq   │   │ Sélecteur rôle  │
│ tech_trends.json(avancées IA)    │ → │ 2. Tech-Watch   → avancées tech pertinentes │ → │ Vue Chef majeure│
│ courses.json    (cours EPITA)    │   │ 3. Course-Mapper→ ce que le cours couvre    │   │ Vue Prof        │
│                                  │   │ 4. Gap-Reporter → gaps + modules proposés   │   │ Heatmap + report│
│                                  │   │ 5. Fact-Checker → vérifie / anti-hallu      │   │ Bouton Valider  │
└──────────────────────────────────┘   └──────────────────────────────────────────────┘   └─────────────────┘
```

- Couche données : fichiers JSON statiques dans `/data` (versionnés).
- Couche agents : `lib/agents/*.ts`, chaque agent = 1 appel `client.messages` (ou `messages.parse`
  pour sortie structurée). Orchestrateur dans `lib/pipeline.ts`.
- Couche API : `app/api/audit/route.ts` exécute le pipeline pour un cours donné.
- Couche UI : `app/page.tsx` (sélecteur rôle) + `app/chef/page.tsx` + `app/prof/[courseId]/page.tsx`.

### Parallélisation (clé pour la latence démo)
Agents **1, 2, 3 sont indépendants** → `Promise.all` (3 appels en parallèle).
Agent **4 (Gap-Reporter)** dépend de 1+2+3. Agent **5 (Fact-Checker)** dépend de 4.
➡️ 2 "vagues" séquentielles seulement. Possibilité de **pré-calculer** les rapports et de
montrer un "Re-run live" optionnel pour la démo.

## 4. Contrats des agents (entrée → sortie)

Chaque agent a un rôle unique, un prompt système court, et renvoie du **JSON structuré**
(`messages.parse` + schéma Zod) pour fiabilité.

### Agent 1 — Scanner
- **In** : `jobs.json` (offres d'un secteur).
- **Out** : `{ skills: [{ name, frequencyPct, importance }] }` — compétences demandées + fréquence.

### Agent 2 — Tech-Watch
- **In** : nom de la matière/secteur + `tech_trends.json`.
- **Out** : `{ trends: [{ name, why, maturity }] }` — avancées tech récentes pertinentes.

### Agent 3 — Course-Mapper
- **In** : un cours de `courses.json` (syllabus réel).
- **Out** : `{ covered: [{ topic, depth }] }` — ce que le cours couvre réellement.

### Agent 4 — Gap-Reporter
- **In** : sorties des agents 1, 2, 3.
- **Out** :
  ```ts
  {
    gaps: [{ skill, evidence, demandPct, severity }],   // ex: "RAG non couvert, demandé dans 40% des offres"
    suggestedModules: [{ title, objectives, rationale, hours }]
  }
  ```

### Agent 5 — Fact-Checker (anti-hallucination) ⭐ différenciateur
- **In** : rapport de l'agent 4 + données sources brutes (jobs/trends/cours).
- **Out** :
  ```ts
  {
    verifiedGaps: [{ skill, supported: boolean, sourceRef, confidence }],
    flagged: [{ claim, reason }],   // affirmations non sourcées → retirées de l'UI
    overallConfidence: number
  }
  ```
- **Règle** : seules les affirmations `supported: true` remontent à l'UI. Score de confiance affiché.

## 5. Données (`/data`)

- `courses.json` : 3–6 cours d'un cursus EPITA (id, intitulé, syllabus/topics, heures).
- `jobs.json` : 50–100 offres du secteur (titre, skills extraites, source fictive datée 2026).
- `tech_trends.json` : ~15 avancées tech récentes de la matière (nom, description, maturité).

> Format figé AVANT la démo → reproductibilité totale. Le pitch dit "scan continu" ; en réalité
> on lit ces fichiers (un vrai scraper serait branché en prod).

## 6. UI / Flow démo (5 min)

1. **Accueil** : sélecteur de rôle (Chef de majeure / Prof).
2. **Chef de majeure** : heatmap/tableau des gaps de TOUS les cours → 3 cours "en retard" (rouge).
3. Clic sur un cours → **Vue Prof** : rapport de gap concret + modules suggérés + **badge confiance** (fact-check).
4. Bouton **"Valider / Demander révision"** → toast (boucle de validation mockée).
5. Pitch : "audit continu automatisé, zéro révision annuelle manuelle".

## 7. Périmètre — ce qu'on COUPE (YAGNI pour ~2h)

- ❌ Auth réelle / base de données (sélecteur de rôle en mémoire)
- ❌ Scraping live / API emploi
- ❌ Persistance (tout en JSON / état mémoire)
- ❌ Validation réellement fonctionnelle (bouton + toast suffisent)

## 8. Plan d'implémentation (ordre, ~2h)

1. **Scaffold** Next.js (App Router, TS, Tailwind) + `@anthropic-ai/sdk` + `zod`. (15 min)
2. **Données** : créer `courses.json`, `jobs.json`, `tech_trends.json` (cursus EPITA). (20 min)
3. **Agents** : `lib/agents/{scanner,techWatch,courseMapper,gapReporter,factChecker}.ts` + schémas Zod. (35 min)
4. **Pipeline** : `lib/pipeline.ts` (Promise.all vague 1, puis 4, puis 5) + `app/api/audit/route.ts`. (15 min)
5. **Pré-calcul** : script qui génère les rapports pour tous les cours → cache JSON (démo instantanée). (10 min)
6. **UI** : sélecteur rôle, vue Chef (heatmap), vue Prof (rapport + fact-check badge + bouton). (30 min)
7. **Polish + run de démo** : vérifier que ça tourne, préparer le narratif. (15 min)

## 9. Détails techniques Claude (référence)

- Client : `import Anthropic from "@anthropic-ai/sdk"; const client = new Anthropic();` (clé via `ANTHROPIC_API_KEY`).
- Appel raisonné : `model: "claude-opus-4-8"`, `thinking: { type: "adaptive" }`, `output_config: { effort: "high" }`.
- Sortie structurée : `client.messages.parse({ ..., output_config: { format: zodOutputFormat(Schema) } })` → `response.parsed_output`.
- `max_tokens` : ~16000 (non-stream) suffisant pour les rapports.
- Latence : paralléliser les agents indépendants ; pré-calculer pour la démo.

## 10. Risques & mitigations

| Risque | Mitigation |
|---|---|
| Latence des 5 agents en live | Parallélisation + pré-calcul des rapports avant la démo |
| Hallucination dans le rapport | Agent 5 Fact-Checker filtre ce qui n'est pas sourcé |
| Clé API / quota | Tester tôt ; fallback `claude-sonnet-4-6` si throttle |
| Démo qui plante | Données statiques + résultats pré-calculés en cache |
| Temps qui manque | UI minimale d'abord (rapport lisible), heatmap ensuite |
