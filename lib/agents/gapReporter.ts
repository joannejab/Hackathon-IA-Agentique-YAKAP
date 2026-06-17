import { callAgentJSON } from "../anthropic";
import {
  GapReporterOutput,
  type ScannerOutput,
  type TechWatchOutput,
  type CourseMapperOutput,
} from "../schemas";

/** Agent 4 — Gap-Reporter : compare demande marché + tech vs couverture cours → gaps + modules. */
export async function runGapReporter(
  courseTitle: string,
  scan: ScannerOutput,
  tech: TechWatchOutput,
  mapped: CourseMapperOutput,
): Promise<GapReporterOutput> {
  const system = `Tu es un conseiller pédagogique qui audite la pertinence d'un cours.
On te donne : (A) les compétences demandées par le marché + fréquence, (B) les avancées tech incontournables,
(C) ce que le cours couvre réellement.
Identifie les GAPS : compétences/sujets demandés (A ou B) mais absents ou trop superficiels dans (C).
Pour chaque gap : "skill", "evidence" (phrase factuelle citant la demande, ex: "non couvert alors que demandé dans 40% des offres"),
"demandPct" (issu de A si disponible, sinon estimation), "severity" ("low"|"medium"|"high").
Propose ensuite 2 à 3 modules à ajouter pour combler les gaps prioritaires : "title", "objectives" (3 puces),
"rationale" (pourquoi, lié à la demande), "hours" (volume horaire réaliste).
Ne signale PAS comme gap ce qui est déjà couvert en "advanced".
Schéma attendu : { "gaps": [ { "skill": string, "evidence": string, "demandPct": number, "severity": "low"|"medium"|"high" } ],
"suggestedModules": [ { "title": string, "objectives": string[], "rationale": string, "hours": number } ] }`;

  const user = `Cours audité : ${courseTitle}
(A) Demande marché :\n${JSON.stringify(scan.skills, null, 2)}
(B) Avancées tech :\n${JSON.stringify(tech.trends, null, 2)}
(C) Couverture réelle du cours :\n${JSON.stringify(mapped.covered, null, 2)}`;
  return callAgentJSON(system, user, GapReporterOutput);
}
