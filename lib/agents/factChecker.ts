import { callAgentJSON } from "../anthropic";
import {
  FactCheckerOutput,
  type GapReporterOutput,
  type Course,
  type Job,
  type Trend,
} from "../schemas";

/** Agent 5 — Fact-Checker : vérifie chaque gap contre les données sources (anti-hallucination). */
export async function runFactChecker(
  report: GapReporterOutput,
  sources: { course: Course; jobs: Job[]; trends: Trend[] },
): Promise<FactCheckerOutput> {
  const system = `Tu es un vérificateur factuel rigoureux (garde-fou anti-hallucination).
On te donne un rapport de gaps et les DONNÉES SOURCES brutes (offres d'emploi, avancées tech, syllabus du cours).
Pour CHAQUE gap : vérifie si l'affirmation est réellement soutenue par les sources.
- "supported": true uniquement si tu trouves une preuve concrète dans les sources.
- "sourceRef": référence précise (ex: "jobs.json (8/24 offres)", "syllabus: RAG absent", "trend T-01").
- "confidence": 0 à 1.
Repère aussi les affirmations NON sourcées ou exagérées (chiffres inventés, "obligatoire pour X%") → "flagged" avec la raison.
"overallConfidence" = confiance globale moyenne (0 à 1).
Sois strict : mieux vaut flaguer un gap douteux que laisser passer une hallucination.
Schéma attendu : { "verifiedGaps": [ { "skill": string, "supported": boolean, "sourceRef": string, "confidence": number } ],
"flagged": [ { "claim": string, "reason": string } ], "overallConfidence": number }`;

  const user = `Rapport à vérifier :\n${JSON.stringify(report, null, 2)}

=== DONNÉES SOURCES ===
Syllabus du cours (${sources.course.title}) :\n${JSON.stringify(sources.course.syllabus)}
Offres d'emploi (${sources.jobs.length}) :\n${JSON.stringify(sources.jobs)}
Avancées tech :\n${JSON.stringify(sources.trends)}`;
  return callAgentJSON(system, user, FactCheckerOutput);
}
