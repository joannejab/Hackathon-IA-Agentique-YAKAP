import { z } from "zod";

/**
 * Contrats partagés — SOURCE DE VÉRITÉ du projet.
 *
 * Deux familles de types :
 *  1. ENTRÉES (/data) — dataset riche pré-collecté (cours, offres, trends, papiers).
 *  2. SORTIES de l'audit — un graphe de PROVENANCE : chaque conclusion (gap) porte
 *     sa chaîne de preuves traçable jusqu'à la donnée brute. Cf. lib/provenance.ts.
 */

/* ================================================================== */
/* Échelles                                                            */
/* ================================================================== */

export const Severity = z.enum(["low", "medium", "high"]);
export type Severity = z.infer<typeof Severity>;

/** Profondeur de couverture d'un sujet dans un cours. */
export const Depth = z.enum(["none", "basic", "intro", "intermediate", "advanced"]);
export type Depth = z.infer<typeof Depth>;

/* ================================================================== */
/* ENTRÉES (/data) — dataset riche                                     */
/* ================================================================== */

export const CourseTopic = z.object({
  name: z.string(),
  depth: Depth,
  description: z.string().optional(),
  hoursAllocated: z.number().optional(),
});
export type CourseTopic = z.infer<typeof CourseTopic>;

export const Course = z.object({
  id: z.string(),
  title: z.string(),
  major: z.string(),
  year: z.number().optional(),
  hours: z.number(),
  lastUpdated: z.string().optional(),
  owner: z.string().optional(),
  description: z.string().optional(),
  /** Sujets réellement enseignés (avec profondeur). */
  topics: z.array(CourseTopic).default([]),
  /** Sujets explicitement NON couverts — déclarés par le responsable du cours. */
  notCovered: z.array(z.string()).default([]),
  /** Ancien format scaffold (texte ou liste) — toléré, non utilisé. */
  syllabus: z.unknown().optional(),
});
export type Course = z.infer<typeof Course>;

export const JobSkill = z.object({
  name: z.string(),
  required: z.boolean().default(false),
});
export type JobSkill = z.infer<typeof JobSkill>;

export const Job = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string().optional(),
  date: z.string().optional(),
  sector: z.string().optional(),
  contractType: z.string().optional(),
  experienceYears: z.string().optional(),
  salaryRange: z.string().optional(),
  description: z.string().optional(),
  skills: z.array(JobSkill).default([]),
});
export type Job = z.infer<typeof Job>;

export const Trend = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  whyNow: z.string().optional(),
  learningCurve: z.string().optional(),
  maturity: z.string().optional(),
  since: z.string().optional(),
  relatedPaper: z.string().nullable().optional(),
  relevantTo: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
});
export type Trend = z.infer<typeof Trend>;

export const Paper = z.object({
  id: z.string(),
  title: z.string(),
  arxivId: z.string().optional(),
  year: z.number().optional(),
  venue: z.string().optional(),
  abstract: z.string().optional(),
  keyContributions: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  relevantTo: z.array(z.string()).default([]),
  adoptionStage: z.string().optional(),
  citationsApprox: z.number().optional(),
});
export type Paper = z.infer<typeof Paper>;

/* ================================================================== */
/* SORTIES — graphe de PROVENANCE (calculé, sérialisé vers l'UI)       */
/* ================================================================== */

export type SourceKind = "job" | "trend" | "paper" | "syllabus";
export type ChannelKey = "market" | "tech" | "research" | "coverage";

/** Une pièce de preuve : pointe une donnée brute précise. */
export interface EvidenceItem {
  kind: SourceKind;
  /** id de la source (job-001, trend-rag, paper-rag) ou clé syllabus. */
  refId: string;
  title: string;
  /** Extrait exact qui soutient la conclusion (ligne de skill, whyNow, phrase d'abstract…). */
  snippet: string;
  /** Métadonnées affichables (fréquence, requis, année, citations…). */
  meta?: { label: string; value: string }[];
  /** Lien vers la page source brute (undefined pour le syllabus, affiché inline). */
  href?: string;
}

/** Un canal de preuve = une des 4 dimensions qui corroborent un gap. */
export interface EvidenceChannel {
  key: ChannelKey;
  title: string;
  summary: string;
  /** Contribution de ce canal au score de confiance (0..1). */
  weight: number;
  items: EvidenceItem[];
}

/** Décomposition transparente du score de confiance. */
export interface ConfidenceFactor {
  label: string;
  detail: string;
  contribution: number; // 0..1
}

/** Un gap = une CONCLUSION, accompagnée de toute sa chaîne de preuves. */
export interface TracedGap {
  id: string;
  skill: string;
  canonicalId: string;
  conclusion: string; // phrase factuelle
  demandPct: number; // % d'offres qui exigent/mentionnent la compétence
  requiredPct: number; // % d'offres où elle est "required"
  jobCount: number;
  totalJobs: number;
  severity: Severity;
  confidence: number; // 0..1
  supported: boolean;
  confidenceFactors: ConfidenceFactor[];
  channels: EvidenceChannel[];
  module?: SuggestedModule;
}

export interface FlaggedClaim {
  claim: string;
  reason: string;
}

export interface SourceStats {
  jobs: number;
  trends: number;
  papers: number;
  topics: number;
}

/** Rapport complet d'un cours — consommé par la vue Prof. */
export interface CourseAudit {
  courseId: string;
  courseTitle: string;
  major: string;
  year?: number;
  hours: number;
  owner?: string;
  lastUpdated?: string;
  description?: string;
  generatedAt: string;
  generatedBy: "provenance-engine" | "llm-pipeline";
  driftPct: number; // 0..100
  severity: Severity;
  overallConfidence: number; // 0..1
  gaps: TracedGap[]; // conclusions vérifiées (supported=true)
  flagged: FlaggedClaim[]; // candidats écartés faute de preuve
  sourceStats: SourceStats;
  coveredTopics: { name: string; depth: Depth }[];
}

/** Résumé d'un cours — consommé par la vue Chef de majeure. */
export interface CourseSummary {
  courseId: string;
  courseTitle: string;
  major: string;
  driftPct: number;
  severity: Severity;
  confidence: number;
  gapCount: number;
  topGaps: string[];
  sparkline: number[];
  sourceStats: SourceStats;
}

/* ================================================================== */
/* SORTIES DES AGENTS LLM (chemin optionnel, lib/agents/*)             */
/* ================================================================== */

export const SuggestedModule = z.object({
  title: z.string(),
  objectives: z.array(z.string()),
  rationale: z.string(),
  hours: z.number(),
});
export type SuggestedModule = z.infer<typeof SuggestedModule>;

export const ScannerOutput = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      frequencyPct: z.number(),
      importance: Severity,
    }),
  ),
});
export type ScannerOutput = z.infer<typeof ScannerOutput>;

export const TechWatchOutput = z.object({
  trends: z.array(
    z.object({ name: z.string(), why: z.string(), maturity: z.string() }),
  ),
});
export type TechWatchOutput = z.infer<typeof TechWatchOutput>;

export const CourseMapperOutput = z.object({
  covered: z.array(z.object({ topic: z.string(), depth: Depth })),
});
export type CourseMapperOutput = z.infer<typeof CourseMapperOutput>;

export const GapReporterOutput = z.object({
  gaps: z.array(
    z.object({
      skill: z.string(),
      evidence: z.string(),
      demandPct: z.number(),
      severity: Severity,
    }),
  ),
  suggestedModules: z.array(SuggestedModule),
});
export type GapReporterOutput = z.infer<typeof GapReporterOutput>;

export const FactCheckerOutput = z.object({
  verifiedGaps: z.array(
    z.object({
      skill: z.string(),
      supported: z.boolean(),
      sourceRef: z.string(),
      confidence: z.number(),
    }),
  ),
  flagged: z.array(z.object({ claim: z.string(), reason: z.string() })),
  overallConfidence: z.number(),
});
export type FactCheckerOutput = z.infer<typeof FactCheckerOutput>;
