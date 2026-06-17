import { callAgentJSON } from "../llm";
import { ScannerOutput, type Job } from "../schemas";

/** Agent 1 — Scanner : agrège les compétences demandées par le marché + leur fréquence. */
export async function runScanner(jobs: Job[]): Promise<ScannerOutput> {
  const system = `Tu es un analyste du marché de l'emploi tech.
À partir d'une liste d'offres d'emploi, identifie les compétences les plus demandées dans le secteur.
Pour chaque compétence : calcule frequencyPct = pourcentage d'offres qui la mentionnent (0 à 100, arrondi),
et importance ("low" | "medium" | "high") selon son poids stratégique sur le marché.
Regroupe les compétences synonymes. Renvoie les 8 à 12 compétences les plus significatives, triées par frequencyPct décroissant.
Schéma attendu : { "skills": [ { "name": string, "frequencyPct": number, "importance": "low"|"medium"|"high" } ] }`;

  const user = `Offres (${jobs.length}) :\n${JSON.stringify(jobs, null, 2)}`;
  return callAgentJSON(system, user, ScannerOutput);
}
