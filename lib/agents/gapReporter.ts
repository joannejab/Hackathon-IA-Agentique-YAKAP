import { callAgentJSON } from "../llm";
import type { SkillFreq } from "../market";
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
  marketFreq: SkillFreq[],
): Promise<GapReporterOutput> {
  const system = `Tu es un conseiller pédagogique qui audite la pertinence d'un cours.
On te donne : (A) les compétences demandées par le marché + fréquence, (B) les avancées tech incontournables,
(C) ce que le cours couvre réellement, et (D) les FRÉQUENCES MARCHÉ CALCULÉES (chiffres fiables).
Identifie les GAPS : compétences/sujets demandés (A ou B) mais absents ou trop superficiels dans (C).
Pour chaque gap : "skill", "evidence" (phrase factuelle, ex: "non couvert alors que demandé sur le marché"),
"demandPct" (REPRENDS EXACTEMENT la valeur de (D) pour cette skill ; si absente de (D), mets 0 — ne calcule jamais toi-même),
"severity" ("low"|"medium"|"high").
Ne signale PAS comme gap : ce qui est déjà couvert en "advanced", ni un langage de base supposé acquis (ex: Python).
TIENS COMPTE DU PÉRIMÈTRE du cours : un cours fondamental (ex: Statistiques, Mathématiques) ne doit PAS être pénalisé
pour ne pas enseigner des outils applicatifs éloignés de son objet. Ne retiens que les gaps réellement adjacents au
périmètre du cours ou une évolution naturelle de celui-ci. Limite-toi aux 3 à 6 gaps les plus pertinents.
Propose ensuite 2 à 3 modules à ajouter pour combler les gaps prioritaires : "title", "objectives" (3 puces),
"rationale" (pourquoi, lié à la demande), "hours" (volume horaire réaliste).
Schéma attendu : { "gaps": [ { "skill": string, "evidence": string, "demandPct": number, "severity": "low"|"medium"|"high" } ],
"suggestedModules": [ { "title": string, "objectives": string[], "rationale": string, "hours": number } ] }`;

  const user = `Cours audité : ${courseTitle}
(A) Demande marché (LLM) :\n${JSON.stringify(scan.skills, null, 2)}
(B) Avancées tech :\n${JSON.stringify(tech.trends, null, 2)}
(C) Couverture réelle du cours :\n${JSON.stringify(mapped.covered, null, 2)}
(D) Fréquences marché CALCULÉES (utilise ces % pour demandPct) :\n${JSON.stringify(marketFreq, null, 2)}`;
  return callAgentJSON(system, user, GapReporterOutput);
}
