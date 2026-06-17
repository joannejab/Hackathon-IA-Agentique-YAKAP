import { callAgentJSON } from "../llm";
import type { SkillFreq } from "../market";
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
  sources: { course: Course; jobs: Job[]; trends: Trend[]; marketFreq: SkillFreq[] },
): Promise<FactCheckerOutput> {
  const system = `Tu es un vérificateur factuel rigoureux (garde-fou anti-hallucination).
On te donne un rapport de gaps et les DONNÉES SOURCES (offres, avancées tech, syllabus, fréquences marché calculées).
IMPORTANT : les pourcentages "demandPct" proviennent des FRÉQUENCES MARCHÉ CALCULÉES — considère-les comme FIABLES,
ne recalcule pas l'arithmétique.
Pour CHAQUE gap, vérifie la SUBSTANCE : le manque de couverture est-il réel au vu du syllabus, et la compétence
est-elle réellement présente dans les sources (offres/tendances) ?
- "supported": true si le gap est réel et sourçable.
- "sourceRef": référence précise (ex: "syllabus: RAG absent ; marché: 42%", "trend T-01").
- "confidence": 0 à 1.
Dans "flagged", ne mets QUE les affirmations réellement problématiques : compétences/outils inventés non présents dans
les sources (ex: un framework cité nulle part), ou gaps injustifiés (sujet déjà couvert en advanced). N'invente pas de flags arithmétiques.
"overallConfidence" = confiance globale (0 à 1).
Schéma attendu : { "verifiedGaps": [ { "skill": string, "supported": boolean, "sourceRef": string, "confidence": number } ],
"flagged": [ { "claim": string, "reason": string } ], "overallConfidence": number }`;

  const user = `Rapport à vérifier :\n${JSON.stringify(report, null, 2)}

=== DONNÉES SOURCES ===
Syllabus du cours (${sources.course.title}) :\n${JSON.stringify(sources.course.syllabus)}
Fréquences marché calculées (fiables) :\n${JSON.stringify(sources.marketFreq)}
Offres d'emploi (${sources.jobs.length}) :\n${JSON.stringify(sources.jobs)}
Avancées tech :\n${JSON.stringify(sources.trends)}`;
  return callAgentJSON(system, user, FactCheckerOutput);
}
