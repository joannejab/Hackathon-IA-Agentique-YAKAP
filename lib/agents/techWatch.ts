import { callAgentJSON } from "../anthropic";
import { TechWatchOutput, type Course, type Trend } from "../schemas";

/** Agent 2 — Tech-Watch : sélectionne les avancées tech pertinentes pour ce cours. */
export async function runTechWatch(
  course: Course,
  trends: Trend[],
): Promise<TechWatchOutput> {
  const system = `Tu es un veilleur technologique spécialisé en IA / data.
À partir d'une liste d'avancées tech récentes et d'un cours donné, sélectionne UNIQUEMENT celles qui sont pertinentes
pour ce cours et que l'état de l'art rend désormais incontournables.
Pour chacune : "why" explique en une phrase pourquoi elle est pertinente pour CE cours ; conserve sa "maturity".
Renvoie 3 à 6 tendances, des plus critiques aux moins critiques.
Schéma attendu : { "trends": [ { "name": string, "why": string, "maturity": "emerging"|"growing"|"mainstream" } ] }`;

  const user = `Cours : ${course.title} (majeure ${course.major}).
Syllabus actuel : ${JSON.stringify(course.syllabus)}
Avancées tech disponibles :\n${JSON.stringify(trends, null, 2)}`;
  return callAgentJSON(system, user, TechWatchOutput);
}
