import { runScanner } from "./agents/scanner";
import { runTechWatch } from "./agents/techWatch";
import { runCourseMapper } from "./agents/courseMapper";
import { runGapReporter } from "./agents/gapReporter";
import { runFactChecker } from "./agents/factChecker";
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

/** Sévérité globale = la plus haute parmi les gaps. */
function overallSeverity(gaps: ReportedGap[]): Severity {
  let rank = 0;
  for (const g of gaps) rank = Math.max(rank, SEVERITY_RANK[g.severity]);
  return (["low", "medium", "high"] as const)[rank];
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
): Promise<CourseAudit> {
  const [scan, tech, mapped] = await Promise.all([
    runScanner(jobs),
    runTechWatch(course, trends),
    runCourseMapper(course),
  ]);

  const report = await runGapReporter(course.title, scan, tech, mapped);
  const facts = await runFactChecker(report, { course, jobs, trends });

  // Fusionne chaque gap avec son verdict fact-check ; ne garde que ce qui est soutenu.
  const verifiedBySkill = new Map(facts.verifiedGaps.map((v) => [norm(v.skill), v]));
  const gaps: ReportedGap[] = [];
  for (const g of report.gaps) {
    const v = verifiedBySkill.get(norm(g.skill));
    if (v && !v.supported) continue; // retiré par le fact-check
    gaps.push({
      ...g,
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
    severity: overallSeverity(gaps),
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
