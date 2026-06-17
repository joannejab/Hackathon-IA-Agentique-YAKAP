import { buildAudit, buildAllAudits, toSummary } from "./provenance";
import { getCourseById } from "./data";
import type { CourseAudit, CourseSummary } from "./schemas";

/**
 * Orchestration de l'audit.
 *
 * La voie de production est désormais le MOTEUR DE PROVENANCE déterministe
 * (lib/provenance.ts) : reproductible, sans clé API, et traçable par construction —
 * ce qui sert directement l'objectif de transparence totale.
 *
 * Les 5 agents LLM (lib/agents/*, contrats dans docs/PROJET.md §4) restent disponibles
 * comme variante d'enrichissement "live" ; ils ne sont pas sur le chemin critique de la démo.
 */

export function runAudit(courseId: string): CourseAudit {
  const audit = buildAudit(courseId);
  if (!audit) throw new Error(`Cours introuvable : ${courseId}`);
  return audit;
}

export function runAuditForCourse(courseId: string): CourseAudit | null {
  return getCourseById(courseId) ? buildAudit(courseId) : null;
}

export function runAllAudits(): CourseAudit[] {
  return buildAllAudits();
}

export { toSummary };
export type { CourseAudit, CourseSummary };
