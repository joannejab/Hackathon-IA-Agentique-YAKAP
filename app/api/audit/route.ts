import { getAudit } from "@/lib/audit-service";

/**
 * GET /api/audit?courseId=scia-nlp
 * Renvoie l'audit tracé complet d'un cours (moteur de provenance).
 */
export async function GET(request: Request) {
  const courseId = new URL(request.url).searchParams.get("courseId");
  if (!courseId) {
    return Response.json({ error: "Paramètre 'courseId' requis." }, { status: 400 });
  }
  const { audit, source } = await getAudit(courseId);
  if (!audit) {
    return Response.json({ error: `Cours introuvable : ${courseId}` }, { status: 404 });
  }
  return Response.json({ audit, source });
}
