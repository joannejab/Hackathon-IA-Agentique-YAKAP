import { runScanner } from "./agents/scanner";
import { runTechWatch } from "./agents/techWatch";
import { runCourseMapper } from "./agents/courseMapper";
import { runGapReporter } from "./agents/gapReporter";
import { runFactChecker } from "./agents/factChecker";
import { computeSkillFrequencies, lookupDemand } from "./market";
import type { AuditEvent, AgentKey } from "./audit-events";
import type {
  Course,
  Job,
  Trend,
  CourseAudit,
  CourseSummary,
  ReportedGap,
  Severity,
} from "./schemas";

const SEVERITY_WEIGHT: Record<Severity, number> = { low: 0.5, medium: 0.75, high: 1 };
const SEVERITY_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2 };

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Calcule la dérive globale (0..100) à partir des gaps pondérés par sévérité. */
function computeDrift(gaps: ReportedGap[]): number {
  if (gaps.length === 0) return 0;
  const score = gaps.reduce(
    (acc, g) => acc + g.demandPct * SEVERITY_WEIGHT[g.severity],
    0,
  );
  return Math.min(100, Math.round(score / gaps.length));
}

/** Sévérité globale dérivée de la dérive (donne un dégradé lisible sur la heatmap). */
function overallSeverity(drift: number): Severity {
  if (drift < 18) return "low";
  if (drift < 30) return "medium";
  return "high";
}

/** Mini-tendance déterministe se terminant sur la dérive courante (pour la jauge). */
function sparkline(drift: number): number[] {
  return [0.3, 0.45, 0.6, 0.72, 0.85, 1].map((f) => Math.round(drift * f));
}

/**
 * Exécute l'audit complet d'un cours.
 * Vague 1 (parallèle) : Scanner ∥ Tech-Watch ∥ Course-Mapper → Vague 2 : Gap-Reporter → Vague 3 : Fact-Checker.
 */
export async function runAudit(
  course: Course,
  jobs: Job[],
  trends: Trend[],
  onEvent: (e: AuditEvent) => void = () => {},
): Promise<CourseAudit> {
  // Exécute un agent en émettant start/done (avec un résumé) pour la trace live.
  const step = async <T>(
    agent: AgentKey,
    fn: () => Promise<T>,
    summarize: (r: T) => string,
  ): Promise<T> => {
    onEvent({ type: "agent", agent, status: "start" });
    const r = await fn();
    onEvent({ type: "agent", agent, status: "done", summary: summarize(r) });
    return r;
  };

  // Fréquences marché calculées en dur (fiables) — partagées avec les agents 4 et 5.
  const freqs = computeSkillFrequencies(jobs);

  const [scan, tech, mapped] = await Promise.all([
    step("scanner", () => runScanner(jobs), (s) => `${s.skills.length} compétences détectées`),
    step("techwatch", () => runTechWatch(course, trends), (t) => `${t.trends.length} tendances retenues`),
    step("coursemapper", () => runCourseMapper(course), (m) => `${m.covered.length} sujets couverts`),
  ]);

  const report = await step(
    "gapreporter",
    () => runGapReporter(course.title, scan, tech, mapped, freqs),
    (r) => `${r.gaps.length} gaps · ${r.suggestedModules.length} modules`,
  );
  const facts = await step(
    "factchecker",
    () => runFactChecker(report, { course, jobs, trends, marketFreq: freqs }),
    (f) => `${f.flagged.length} flag(s) · confiance ${f.overallConfidence.toFixed(2)}`,
  );

  // Fusionne chaque gap avec son verdict fact-check ; ne garde que ce qui est soutenu.
  // Et OVERRIDE demandPct avec la valeur déterministe (anti-hallucination des %).
  const verifiedBySkill = new Map(facts.verifiedGaps.map((v) => [norm(v.skill), v]));
  const gaps: ReportedGap[] = [];
  for (const g of report.gaps) {
    const v = verifiedBySkill.get(norm(g.skill));
    if (v && !v.supported) continue; // retiré par le fact-check
    const demand = lookupDemand(g.skill, freqs);
    gaps.push({
      ...g,
      demandPct: demand ? demand.pct : g.demandPct,
      supported: v ? v.supported : true,
      sourceRef: v ? v.sourceRef : "non vérifié",
      confidence: v ? v.confidence : facts.overallConfidence,
    });
  }
  gaps.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  const drift = computeDrift(gaps);

  return {
    courseId: course.id,
    courseTitle: course.title,
    major: course.major,
    generatedAt: new Date().toISOString(),
    driftPct: drift,
    severity: overallSeverity(drift),
    overallConfidence: facts.overallConfidence,
    marketSkills: scan.skills,
    trends: tech.trends,
    covered: mapped.covered,
    gaps,
    suggestedModules: report.suggestedModules,
    flagged: facts.flagged,
  };
}

/** Dérive un résumé (vue Chef) à partir d'un audit complet. */
export function toSummary(audit: CourseAudit): CourseSummary {
  return {
    courseId: audit.courseId,
    courseTitle: audit.courseTitle,
    major: audit.major,
    driftPct: audit.driftPct,
    severity: audit.severity,
    confidence: audit.overallConfidence,
    topGaps: audit.gaps.slice(0, 3).map((g) => g.skill),
    sparkline: sparkline(audit.driftPct),
  };
}
