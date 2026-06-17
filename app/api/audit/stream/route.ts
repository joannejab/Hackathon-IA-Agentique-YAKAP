import { getJobs, getTrends } from "@/lib/data";
import { runSyllabusParser } from "@/lib/agents/syllabusParser";
import { runAudit } from "@/lib/pipeline";
import { addSessionAudit } from "@/lib/audit-service";
import type { AuditEvent } from "@/lib/audit-events";
import type { Course } from "@/lib/schemas";

/**
 * POST /api/audit/stream  body: { title, major, syllabusText }
 * Lance le flux complet (Syllabus-Parser → 5 agents) et STREAME la progression
 * en NDJSON (une ligne JSON = un AuditEvent), terminée par { type:"done", audit }.
 */
export async function POST(request: Request) {
  if (!process.env.LLM_API_KEY) {
    return Response.json({ error: "LLM_API_KEY manquante." }, { status: 400 });
  }

  let body: { title?: string; major?: string; syllabusText?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }
  const title = body.title?.trim();
  const major = body.major?.trim() || "—";
  const syllabusText = body.syllabusText?.trim();
  if (!title || !syllabusText) {
    return Response.json(
      { error: "Champs 'title' et 'syllabusText' requis." },
      { status: 400 },
    );
  }

  const id =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) +
    "-" +
    Math.random().toString(36).slice(2, 6);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (e: AuditEvent) =>
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      try {
        send({ type: "agent", agent: "parser", status: "start" });
        const parsed = await runSyllabusParser(title, syllabusText);
        send({
          type: "agent",
          agent: "parser",
          status: "done",
          summary: `${parsed.syllabus.length} sujets extraits`,
        });

        const course: Course = { id, title, major, hours: 0, syllabus: parsed.syllabus };
        const audit = await runAudit(course, getJobs(), getTrends(), send);
        addSessionAudit(audit);
        send({ type: "done", audit });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
