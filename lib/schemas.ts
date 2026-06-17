import { z } from "zod";

/**
 * Contrats partagés — SOURCE DE VÉRITÉ du projet.
 * Toute l'équipe code contre ces schémas. On n'y touche qu'à plusieurs.
 *
 * Flux : données (/data) → agents 1/2/3 (//) → agent 4 → agent 5 → CourseAudit → UI
 * Cf. docs/PROJET.md §4 et docs/DESIGN_FRONTEND.md.
 */

/* ------------------------------------------------------------------ */
/* Échelle de sévérité (mappée aux couleurs : low=verified, medium=amber, high=flag) */
/* ------------------------------------------------------------------ */
export const Severity = z.enum(["low", "medium", "high"]);
export type Severity = z.infer<typeof Severity>;

export const Maturity = z.enum(["emerging", "growing", "mainstream"]);
export type Maturity = z.infer<typeof Maturity>;

export const Depth = z.enum(["none", "intro", "intermediate", "advanced"]);
export type Depth = z.infer<typeof Depth>;

/* ------------------------------------------------------------------ */
/* ENTRÉES (/data) — produites par Perso C                            */
/* ------------------------------------------------------------------ */

export const SyllabusItem = z.object({
  topic: z.string(),
  depth: Depth,
});

export const Course = z.object({
  id: z.string(), // ex: "ml-scia"
  title: z.string(), // ex: "Machine Learning"
  major: z.string(), // ex: "SCIA"
  hours: z.number(),
  syllabus: z.array(SyllabusItem),
});
export type Course = z.infer<typeof Course>;

export const Job = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string().optional(),
  postedAt: z.string(), // ISO date
  skills: z.array(z.string()),
});
export type Job = z.infer<typeof Job>;

export const Trend = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  maturity: Maturity,
});
export type Trend = z.infer<typeof Trend>;

/* ------------------------------------------------------------------ */
/* SORTIES DES AGENTS — produites par Perso B                         */
/* ------------------------------------------------------------------ */

/** Agent 1 — Scanner : compétences demandées + fréquence */
export const ScannerOutput = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      frequencyPct: z.number(), // 0..100, % des offres qui mentionnent la skill
      importance: Severity, // poids relatif sur le marché
    }),
  ),
});
export type ScannerOutput = z.infer<typeof ScannerOutput>;

/** Agent 2 — Tech-Watch : avancées tech pertinentes pour la matière */
export const TechWatchOutput = z.object({
  trends: z.array(
    z.object({
      name: z.string(),
      why: z.string(), // pourquoi c'est pertinent pour ce cours
      maturity: Maturity,
    }),
  ),
});
export type TechWatchOutput = z.infer<typeof TechWatchOutput>;

/** Agent 3 — Course-Mapper : ce que le cours couvre réellement */
export const CourseMapperOutput = z.object({
  covered: z.array(
    z.object({
      topic: z.string(),
      depth: Depth,
    }),
  ),
});
export type CourseMapperOutput = z.infer<typeof CourseMapperOutput>;

/** Agent 4 — Gap-Reporter : gaps + modules suggérés */
export const Gap = z.object({
  skill: z.string(),
  evidence: z.string(), // ex: "non couvert alors que demandé dans 40% des offres"
  demandPct: z.number(), // 0..100
  severity: Severity,
});
export type Gap = z.infer<typeof Gap>;

export const SuggestedModule = z.object({
  title: z.string(),
  objectives: z.array(z.string()),
  rationale: z.string(),
  hours: z.number(),
});
export type SuggestedModule = z.infer<typeof SuggestedModule>;

export const GapReporterOutput = z.object({
  gaps: z.array(Gap),
  suggestedModules: z.array(SuggestedModule),
});
export type GapReporterOutput = z.infer<typeof GapReporterOutput>;

/** Agent 5 — Fact-Checker : vérification anti-hallucination */
export const VerifiedGap = z.object({
  skill: z.string(),
  supported: z.boolean(), // l'affirmation est-elle sourçable ?
  sourceRef: z.string(), // ex: "jobs.json #12–48" / "syllabus ML §4"
  confidence: z.number(), // 0..1
});
export type VerifiedGap = z.infer<typeof VerifiedGap>;

export const FlaggedClaim = z.object({
  claim: z.string(),
  reason: z.string(), // pourquoi retiré (ex: "non sourcé")
});
export type FlaggedClaim = z.infer<typeof FlaggedClaim>;

export const FactCheckerOutput = z.object({
  verifiedGaps: z.array(VerifiedGap),
  flagged: z.array(FlaggedClaim),
  overallConfidence: z.number(), // 0..1
});
export type FactCheckerOutput = z.infer<typeof FactCheckerOutput>;

/* ------------------------------------------------------------------ */
/* AGRÉGAT — ce que l'API renvoie et ce que l'UI consomme             */
/* ------------------------------------------------------------------ */

/** Un gap vérifié, prêt pour l'affichage (gap + verdict fact-check fusionnés). */
export const ReportedGap = Gap.extend({
  supported: z.boolean(),
  sourceRef: z.string(),
  confidence: z.number(),
});
export type ReportedGap = z.infer<typeof ReportedGap>;

/** Rapport complet d'un cours — consommé par la vue Prof. */
export const CourseAudit = z.object({
  courseId: z.string(),
  courseTitle: z.string(),
  major: z.string(),
  generatedAt: z.string(), // ISO date
  driftPct: z.number(), // 0..100 — dérive globale du cours
  severity: Severity,
  overallConfidence: z.number(), // 0..1
  marketSkills: ScannerOutput.shape.skills, // pour la transparence / debug UI
  trends: TechWatchOutput.shape.trends,
  covered: CourseMapperOutput.shape.covered,
  gaps: z.array(ReportedGap), // gaps vérifiés (supported=true) affichés
  suggestedModules: z.array(SuggestedModule),
  flagged: z.array(FlaggedClaim), // retirés par le fact-check (bloc ⚑)
});
export type CourseAudit = z.infer<typeof CourseAudit>;

/** Résumé d'un cours — consommé par la vue Chef de majeure (jauges). */
export const CourseSummary = z.object({
  courseId: z.string(),
  courseTitle: z.string(),
  major: z.string(),
  driftPct: z.number(),
  severity: Severity,
  confidence: z.number(),
  topGaps: z.array(z.string()), // 1–3 intitulés de gaps
  sparkline: z.array(z.number()), // tendance (mock) pour la mini-courbe
});
export type CourseSummary = z.infer<typeof CourseSummary>;

/** Réponse de l'API /api/audit */
export const AuditResponse = z.object({
  audit: CourseAudit,
});
export type AuditResponse = z.infer<typeof AuditResponse>;
