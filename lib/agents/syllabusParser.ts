import { callAgentJSON } from "../llm";
import { SyllabusParseOutput } from "../schemas";

/** Agent 0 — Syllabus-Parser : transforme un texte de programme collé en syllabus structuré. */
export async function runSyllabusParser(
  courseTitle: string,
  rawText: string,
): Promise<SyllabusParseOutput> {
  const system = `Tu es un analyste pédagogique.
À partir d'un texte de programme/syllabus collé (souvent brut, en vrac), extrais la liste des sujets enseignés
et estime la profondeur de chacun ("none" | "intro" | "intermediate" | "advanced") d'après le texte.
Normalise les intitulés en sujets clairs. N'invente pas de sujets absents du texte.
Schéma attendu : { "syllabus": [ { "topic": string, "depth": "none"|"intro"|"intermediate"|"advanced" } ] }`;

  const user = `Cours : ${courseTitle}\nTexte du syllabus :\n"""\n${rawText}\n"""`;
  return callAgentJSON(system, user, SyllabusParseOutput);
}
