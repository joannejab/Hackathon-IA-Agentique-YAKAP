import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getCourses, getCourseById, getJobs, getTrends } from "./data";
import { runAudit, toSummary } from "./pipeline";
import { getMockAudit, mockSummaries } from "./fixtures";
import type { CourseAudit, CourseSummary } from "./schemas";

/**
 * Couche d'accès aux audits avec triple fallback :
 *   1. cache pré-calculé (data/cache.json) → démo instantanée et reproductible
 *   2. pipeline live (si ANTHROPIC_API_KEY) → audit réel à la volée
 *   3. fixtures mock → l'UI rend toujours quelque chose, même sans clé
 */

export type AuditSource = "cache" | "live" | "mock";

const CACHE_PATH = join(process.cwd(), "data", "cache.json");
const memCache = new Map<string, CourseAudit>();
/**
 * Enregistre un audit créé à la volée (flux "Nouvel audit").
 * Persiste dans data/cache.json → visible dans la vue Chef et après redémarrage,
 * et robuste au dev multi-worker (la mémoire process n'est pas partagée).
 */
export function addSessionAudit(audit: CourseAudit): void {
  memCache.set(audit.courseId, audit);
  try {
    const cache = readCache() ?? { generatedAt: new Date().toISOString(), audits: {} };
    cache.audits[audit.courseId] = audit;
    cache.generatedAt = new Date().toISOString();
    writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error("[audit-service] écriture cache échouée:", err);
  }
}

type CacheFile = { generatedAt: string; audits: Record<string, CourseAudit> };

function readCache(): CacheFile | null {
  if (!existsSync(CACHE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as CacheFile;
  } catch {
    return null;
  }
}

const SEVERITY_RANK = { low: 0, medium: 1, high: 2 } as const;

/** Audit d'un cours (vue Prof). */
export async function getAudit(
  courseId: string,
): Promise<{ audit: CourseAudit; source: AuditSource }> {
  if (memCache.has(courseId)) {
    return { audit: memCache.get(courseId)!, source: "cache" };
  }

  const cache = readCache();
  if (cache?.audits[courseId]) {
    memCache.set(courseId, cache.audits[courseId]);
    return { audit: cache.audits[courseId], source: "cache" };
  }

  const course = getCourseById(courseId);
  if (course && process.env.LLM_API_KEY) {
    try {
      const audit = await runAudit(course, getJobs(), getTrends());
      memCache.set(courseId, audit);
      return { audit, source: "live" };
    } catch (err) {
      console.error("[audit-service] pipeline live échoué, fallback mock:", err);
    }
  }

  return { audit: getMockAudit(courseId), source: "mock" };
}

/** Résumés de tous les cours (vue Chef). N'exécute jamais le pipeline live (trop lent). */
export function getAllSummaries(): { summaries: CourseSummary[]; source: AuditSource } {
  const cache = readCache();
  if (cache && Object.keys(cache.audits).length > 0) {
    const summaries = Object.values(cache.audits)
      .map(toSummary)
      .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.driftPct - a.driftPct);
    return { summaries, source: "cache" };
  }
  return { summaries: mockSummaries, source: "mock" };
}

/** Liste des cours disponibles (id + titre), pour navigation. */
export function listCourses() {
  return getCourses().map((c) => ({ id: c.id, title: c.title, major: c.major }));
}
