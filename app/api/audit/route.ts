import { getAudit } from "@/lib/audit-service";

/**
 * GET /api/audit?courseId=ml-scia
 * Renvoie l'audit complet d'un cours (cache → live → mock).
 */
export async function GET(request: Request) {
  const courseId = new URL(request.url).searchParams.get("courseId");
  if (!courseId) {
    return Response.json({ error: "Paramètre 'courseId' requis." }, { status: 400 });
  }
  const { audit, source } = await getAudit(courseId);
  return Response.json({ audit, source });
}
