import { getCourses } from "./data";
import { buildAudit, getAllSummaries as buildSummaries, buildAllAudits } from "./provenance";
import type { CourseAudit, CourseSummary } from "./schemas";

/**
 * Couche d'accès aux audits.
 *
 * Source unique : le MOTEUR DE PROVENANCE déterministe (lib/provenance.ts).
 * Déterministe = reproductible et entièrement traçable, sans dépendance à une clé API.
 * (Le pipeline LLM de lib/pipeline.ts reste disponible pour une variante "live" enrichie.)
 */

export type AuditSource = "derived";

export async function getAudit(
  courseId: string,
): Promise<{ audit: CourseAudit | null; source: AuditSource }> {
  return { audit: buildAudit(courseId), source: "derived" };
}

export function getAllSummaries(): { summaries: CourseSummary[]; source: AuditSource } {
  return { summaries: buildSummaries(), source: "derived" };
}

export function getAllAudits(): CourseAudit[] {
  return buildAllAudits();
}

export function listCourses() {
  return getCourses().map((c) => ({ id: c.id, title: c.title, major: c.major }));
}
