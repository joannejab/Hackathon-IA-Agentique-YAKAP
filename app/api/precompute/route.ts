import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildAllAudits } from "@/lib/provenance";
import type { CourseAudit } from "@/lib/schemas";

/**
 * GET /api/precompute
 * Recalcule tous les audits tracés et écrit data/cache.json (instantané, sans clé API).
 * Le moteur étant déterministe, ce cache est surtout un artefact d'inspection.
 */
export async function GET() {
  const all = buildAllAudits();
  const audits: Record<string, CourseAudit> = {};
  for (const a of all) audits[a.courseId] = a;

  const cache = { generatedAt: new Date().toISOString(), audits };
  writeFileSync(join(process.cwd(), "data", "cache.json"), JSON.stringify(cache, null, 2));

  return Response.json({
    ok: true,
    generatedAt: cache.generatedAt,
    computed: Object.keys(audits),
  });
}
