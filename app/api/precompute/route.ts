import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getCourses, getJobs, getTrends } from "@/lib/data";
import { runAudit } from "@/lib/pipeline";
import type { CourseAudit } from "@/lib/schemas";

/**
 * GET /api/precompute
 * Lance le pipeline réel sur TOUS les cours et écrit data/cache.json.
 * À exécuter une fois avant la démo (clé API requise) → audits instantanés ensuite.
 */
export async function GET() {
  if (!process.env.LLM_API_KEY) {
    return Response.json(
      { error: "LLM_API_KEY manquante — impossible de pré-calculer." },
      { status: 400 },
    );
  }

  const courses = getCourses();
  const jobs = getJobs();
  const trends = getTrends();
  const audits: Record<string, CourseAudit> = {};
  const errors: Record<string, string> = {};

  // Séquentiel pour éviter le throttling (one-time, hors démo).
  for (const course of courses) {
    try {
      audits[course.id] = await runAudit(course, jobs, trends);
    } catch (err) {
      errors[course.id] = err instanceof Error ? err.message : String(err);
    }
  }

  const cache = { generatedAt: new Date().toISOString(), audits };
  writeFileSync(join(process.cwd(), "data", "cache.json"), JSON.stringify(cache, null, 2));

  return Response.json({
    ok: true,
    generatedAt: cache.generatedAt,
    computed: Object.keys(audits),
    errors,
  });
}
