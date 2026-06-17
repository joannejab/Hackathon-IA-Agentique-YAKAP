import type { CourseAudit } from "./schemas";

/** Événements de progression du pipeline, streamés en NDJSON par /api/audit/stream. */

export type AgentKey =
  | "parser"
  | "scanner"
  | "techwatch"
  | "coursemapper"
  | "gapreporter"
  | "factchecker";

export type AuditEvent =
  | { type: "agent"; agent: AgentKey; status: "start" }
  | { type: "agent"; agent: AgentKey; status: "done"; summary: string }
  | { type: "done"; audit: CourseAudit }
  | { type: "error"; agent?: AgentKey; message: string };

/** Libellés + ordre d'affichage des agents dans la trace. */
export const AGENT_STEPS: { key: AgentKey; label: string }[] = [
  { key: "parser", label: "Syllabus-Parser" },
  { key: "scanner", label: "Scanner (marché)" },
  { key: "techwatch", label: "Tech-Watch" },
  { key: "coursemapper", label: "Course-Mapper" },
  { key: "gapreporter", label: "Gap-Reporter" },
  { key: "factchecker", label: "Fact-Checker" },
];
