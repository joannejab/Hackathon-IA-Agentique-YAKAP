# Design front — CurriculumGap Agent (Direction B + jauge de A)

> Direction retenue : **Dossier d'accréditation** (vue Prof) + **jauges de dérive** (vue Chef),
> palette unifiée claire. Objectif : crédibilité académique + lisibilité du gap, zéro look "IA par défaut".

## Concept directeur

- **Métaphore** : un **rapport d'accréditation relu**. La rigueur du peer-review = la crédibilité anti-hallucination.
- **Signature vue Prof** : citations en exposant — chaque affirmation pointe une source vérifiable, avec badge **Fact-Check · confiance 0.xx**.
- **Signature vue Chef** : **jauges de dérive** par cours (arc + sparkline), audit "live".
- **Ton d'écriture** : sobre, factuel, voix de l'institution. Pas de marketing. Boutons = action exacte ("Valider", pas "Soumettre").

## Tokens

### Couleurs (Tailwind / CSS vars)
```css
--paper:    #F6F7F9;  /* fond */
--ink:      #16181D;  /* texte principal */
--ink-soft: #5A6072;  /* texte secondaire / labels */
--spine:    #2D2A6E;  /* indigo — accent structurel, titres, dos de page */
--verified: #1F6F5C;  /* vert-encre — vérifié / couvert / ok */
--amber:    #C77D1A;  /* gap modéré (adapté pour fond clair) */
--flag:     #B23A48;  /* non-sourcé / gap critique */
--rule:     #D3D6DD;  /* filets, bordures hairline */
--panel:    #FFFFFF;  /* cartes / panneaux */
```
Échelle de sévérité gap : `verified` (faible) → `amber` (moyen) → `flag` (critique).

### Typographie (Google Fonts)
```
Display : Fraunces        (titres, intitulés de cours, hero) — serif éditorial froid
Body    : Inter           (corps, UI)
Mono    : IBM Plex Mono   (refs [J-42], %, codes cours, scores de confiance)
```
Échelle : hero 48/56, h1 32, h2 22, body 16, caption 13, mono-data 14.
Poids : Fraunces 400/600 ; Inter 400/500/600. Letter-spacing serré sur le display.

### Layout / divers
- `border-radius` : 6px (cartes), 999px (badges). Pas d'ombres lourdes — filets `--rule` + fond `--panel`.
- Grille : conteneur max 1100px, gouttières 24px.
- Eyebrows / labels en `IBM Plex Mono`, uppercase, `--ink-soft`, tracking large.
- Numérotation `§1 §2` UNIQUEMENT pour les modules suggérés (vraie séquence).

## Vue Accueil — sélecteur de rôle
Deux portes, sobres. Texte qui dit le job, pas le système.
```
   CurriculumGap · Audit continu de pertinence
   ────────────────────────────────────────────
   [ Chef de majeure ]        [ Professeur ]
     vue globale des            mon cours :
     gaps par cours             rapport + modules
```

## Vue Chef de majeure (hero = jauges de dérive)
```
┌──────────────────────────────────────────────────────────────┐
│ MAJEURE SCIA · audit continu        ⦿ live   confiance moy 0.91│
├──────────────────────────────────────────────────────────────┤
│ ┌ Machine Learning ─┐ ┌ NLP ───────────┐ ┌ Data Engineering ─┐│
│ │  ◐ dérive 38%     │ │  ● dérive 61%   │ │  ○ dérive 12%     ││
│ │  ╭──⌒──╮  ▁▂▃▅     │ │ ╭─⌒──╮  ▂▄▆█    │ │ ╭⌒╮  ▁▁▂          ││
│ │  amber            │ │  flag (critique)│ │  verified         ││
│ │  RAG · MLOps      │ │  LLM agents     │ │  à jour           ││
│ └───────────────────┘ └─────────────────┘ └───────────────────┘│
│   (clic carte → vue Prof du cours)                            │
└──────────────────────────────────────────────────────────────┘
```
- Jauge = arc SVG (0→dérive%), couleur selon sévérité. Sparkline = mini barres (tendance).
- Tri par sévérité décroissante (les cours critiques en premier).

## Vue Prof (hero = dossier + citations)
```
┌──────────────────────────────────────────────────────────────┐
│  Rapport d'audit — Machine Learning            SCIA · 2026    │
│  ───────────────────────────────────────────────────────────│
│  Constat du gap                          ✓ Vérifié · 0.92    │
│                                                              │
│   RAG n'est pas couvert¹ alors qu'il apparaît dans 40% des   │
│   offres récentes². MLOps : couverture superficielle³.       │
│                                                              │
│   ── Modules suggérés ─────────────────────────────────────  │
│   §1  Retrieval-Augmented Generation              12 h       │
│       objectifs · pourquoi (rationale)                       │
│   §2  MLOps & déploiement de modèles               8 h       │
│   ───────────────────────────────────────────────────────── │
│   Sources   ¹ syllabus ML §2   ² jobs.json #12–48            │
│             ³ syllabus ML §4                                 │
│   ⚑ Retiré par le Fact-Check : « Kubernetes obligatoire »   │
│      (non sourcé)                                            │
│                                                              │
│        [ Valider ]      [ Demander révision ]               │
└──────────────────────────────────────────────────────────────┘
```
- **Citations** : `<sup>` cliquable → scroll/highlight de la source en bas.
- **Badge Fact-Check** : `✓ Vérifié · 0.92` en `--verified` ; si confiance < 0.7 → `--amber`.
- **Bloc ⚑ flagged** : affirmations retirées par l'agent 5 (montre l'anti-hallucination à l'œuvre — point jury).
- Boutons : `Valider` → toast « Révision validée » ; même verbe partout.

## Composants à coder (pour Perso D)
- `RoleGate` (accueil)
- `DriftGauge` (arc SVG + sparkline) · `CourseCard` (vue Chef)
- `GapReport` (constat + citations `<sup>`) · `SourceList` · `FactCheckBadge` · `FlaggedNote`
- `ModuleList` (`§n`, heures) · `ActionBar` (Valider / Demander révision) · `Toast`

## Quality floor
Responsive (cartes en colonne sur mobile), focus clavier visible (`outline` indigo), `prefers-reduced-motion` respecté (jauges sans anim si demandé), contrastes AA.

## Accroche d'animation (sobre, 1 moment)
Au chargement de la vue Prof : les **exposants de citation apparaissent en séquence** (fade léger, 80ms d'écart) — souligne que chaque affirmation est sourcée. Rien d'autre.
