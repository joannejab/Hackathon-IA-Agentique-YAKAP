import { callAgentJSON } from "../llm";
import { CourseMapperOutput, type Course } from "../schemas";

/** Agent 3 — Course-Mapper : extrait ce que le cours couvre réellement, avec le niveau de profondeur. */
export async function runCourseMapper(course: Course): Promise<CourseMapperOutput> {
  const system = `Tu es un analyste pédagogique.
À partir du syllabus d'un cours, dresse la liste des sujets réellement couverts et leur profondeur
("none" | "intro" | "intermediate" | "advanced"). Normalise les intitulés en compétences claires
(ex: "Transformers", "MLOps", "RAG"). Sois fidèle au syllabus : n'invente pas de sujets absents.
Schéma attendu : { "covered": [ { "topic": string, "depth": "none"|"intro"|"intermediate"|"advanced" } ] }`;

  const user = `Cours : ${course.title} (${course.hours}h).\nSyllabus :\n${JSON.stringify(course.syllabus, null, 2)}`;
  return callAgentJSON(system, user, CourseMapperOutput);
}
