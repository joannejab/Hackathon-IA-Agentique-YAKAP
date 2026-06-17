import { getCourseById, getCourses, getJobs, getTrends, getPapers } from "./data";
import { CANONICAL_SKILLS, getCanonical, matchCanonical } from "./canonical";
import type {
  Course,
  Job,
  Trend,
  Paper,
  Severity,
  TracedGap,
  EvidenceItem,
  EvidenceChannel,
  ConfidenceFactor,
  CourseAudit,
  CourseSummary,
  FlaggedClaim,
} from "./schemas";

/**
 * MOTEUR DE PROVENANCE — déterministe, sans LLM.
 *
 * Pour un cours, il calcule chaque GAP (conclusion) et, surtout, attache à chacun la
 * chaîne de preuves complète qui le justifie, organisée en 4 canaux :
 *   marché (offres) · état de l'art (trends) · recherche (papiers) · couverture (syllabus).
 * Chaque pièce de preuve pointe une donnée brute identifiable → transparence totale,
 * et le score de confiance est décomposé en facteurs explicites (rien de magique).
 */

const SEVERITY_WEIGHT: Record<Severity, number> = { low: 0.5, medium: 0.75, high: 1 };
const SEVERITY_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2 };

function firstSentence(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const dot = clean.indexOf(". ");
  const cut = dot > 40 && dot < max ? dot + 1 : Math.min(clean.length, max);
  return clean.slice(0, cut) + (cut < clean.length ? "…" : "");
}

function severityFromDemand(demandPct: number, requiredPct: number): Severity {
  if (demandPct >= 33 || requiredPct >= 25) return "high";
  if (demandPct >= 15) return "medium";
  return "low";
}

/** Construit un gap tracé pour une compétence canonique donnée d'un cours. */
function buildGap(
  course: Course,
  canonicalId: string,
  coveragePhrase: string,
  jobs: Job[],
  trends: Trend[],
  papers: Paper[],
): TracedGap {
  const canon = getCanonical(canonicalId)!;
  const totalJobs = jobs.length;

  /* ---- Canal MARCHÉ : offres qui exigent la compétence ---- */
  const marketItems: EvidenceItem[] = [];
  let requiredCount = 0;
  for (const job of jobs) {
    const matched = job.skills.filter((s) => matchCanonical(s.name).includes(canonicalId));
    if (matched.length === 0) continue;
    const isReq = matched.some((s) => s.required);
    if (isReq) requiredCount++;
    marketItems.push({
      kind: "job",
      refId: job.id,
      title: job.company ? `${job.title} · ${job.company}` : job.title,
      snippet: matched.map((s) => `${s.name}${s.required ? " (requis)" : " (souhaité)"}`).join(" · "),
      meta: [
        { label: "date", value: job.date ?? "—" },
        { label: "secteur", value: job.sector ?? "—" },
      ],
      href: `/source/job/${job.id}`,
    });
  }
  const jobCount = marketItems.length;
  const demandPct = totalJobs ? Math.round((jobCount / totalJobs) * 100) : 0;
  const requiredPct = totalJobs ? Math.round((requiredCount / totalJobs) * 100) : 0;

  /* ---- Canal ÉTAT DE L'ART : trends correspondants ---- */
  const techRanked: { item: EvidenceItem; rel: boolean; paperId?: string | null }[] = [];
  for (const tr of trends) {
    const hay = [tr.name, tr.category, tr.description, tr.whyNow].filter(Boolean).join(" ");
    if (!matchCanonical(hay).includes(canonicalId)) continue;
    const rel = (tr.relevantTo ?? []).includes(course.id);
    techRanked.push({
      rel,
      paperId: tr.relatedPaper,
      item: {
        kind: "trend",
        refId: tr.id,
        title: tr.name,
        snippet: firstSentence(tr.whyNow || tr.description || ""),
        meta: [
          { label: "maturité", value: tr.maturity ?? "—" },
          { label: "lien cours", value: rel ? "direct" : "adjacent" },
        ],
        href: `/source/trend/${tr.id}`,
      },
    });
  }
  techRanked.sort((a, b) => Number(b.rel) - Number(a.rel));
  const techItems = techRanked.map((t) => t.item);

  /* ---- Canal RECHERCHE : papiers (par mots-clés + liés via trends) ---- */
  const paperIds = new Set<string>();
  for (const p of papers) {
    const hay = [p.title, ...(p.keywords ?? []), p.abstract].filter(Boolean).join(" ");
    if (matchCanonical(hay).includes(canonicalId)) paperIds.add(p.id);
  }
  for (const t of techRanked) if (t.paperId) paperIds.add(t.paperId);
  const researchRanked: { item: EvidenceItem; rel: boolean }[] = [];
  for (const id of paperIds) {
    const p = papers.find((x) => x.id === id);
    if (!p) continue;
    const rel = (p.relevantTo ?? []).includes(course.id);
    const meta = [
      { label: "année", value: String(p.year ?? "—") },
      { label: "adoption", value: p.adoptionStage ?? "—" },
    ];
    if (p.citationsApprox) meta.push({ label: "citations≈", value: p.citationsApprox.toLocaleString("fr-FR") });
    researchRanked.push({
      rel,
      item: {
        kind: "paper",
        refId: p.id,
        title: p.title,
        snippet: firstSentence(p.abstract || p.keyContributions?.[0] || ""),
        meta,
        href: `/source/paper/${p.id}`,
      },
    });
  }
  researchRanked.sort((a, b) => Number(b.rel) - Number(a.rel));
  const researchItems = researchRanked.map((r) => r.item);

  /* ---- Canal COUVERTURE : preuve d'absence dans le syllabus ---- */
  const coverageItems: EvidenceItem[] = [
    {
      kind: "syllabus",
      refId: course.id,
      title: `Syllabus — ${course.title}`,
      snippet: `Déclaré explicitement hors-programme : « ${coveragePhrase} ». Dernière révision du cours : ${course.lastUpdated ?? "inconnue"}.`,
      meta: [{ label: "responsable", value: course.owner ?? "—" }],
      href: `/source/syllabus/${course.id}`,
    },
  ];
  for (const top of course.topics) {
    if ((top.depth === "basic" || top.depth === "intro") && matchCanonical(top.name).includes(canonicalId)) {
      coverageItems.push({
        kind: "syllabus",
        refId: course.id,
        title: `Couverture partielle — ${top.name}`,
        snippet: `Abordé seulement au niveau « ${top.depth} »${top.description ? " : " + firstSentence(top.description, 120) : ""}.`,
        meta: [{ label: "profondeur", value: top.depth }],
        href: `/source/syllabus/${course.id}`,
      });
    }
  }

  /* ---- Score de confiance décomposé en facteurs explicites ---- */
  const marketC = Math.min(0.45, (demandPct / 100) * 0.45 + (requiredPct / 100) * 0.1);
  const coverageC = 0.3; // absence déclarée par le responsable du cours
  const techC = Math.min(0.15, techItems.length * 0.06);
  const researchC = Math.min(0.1, researchItems.length * 0.025);
  const confidence = Math.min(0.99, marketC + coverageC + techC + researchC);

  const confidenceFactors: ConfidenceFactor[] = [
    {
      label: "Demande marché",
      detail: `${jobCount}/${totalJobs} offres (${demandPct}%), dont ${requiredCount} en compétence requise`,
      contribution: marketC,
    },
    {
      label: "Absence confirmée",
      detail: `Hors-programme déclaré au syllabus (${course.owner ?? "responsable"})`,
      contribution: coverageC,
    },
    {
      label: "État de l'art",
      detail: `${techItems.length} technologie(s) en adoption industrielle`,
      contribution: techC,
    },
    {
      label: "Recherche",
      detail: `${researchItems.length} publication(s) de référence`,
      contribution: researchC,
    },
  ];

  const channels: EvidenceChannel[] = [];
  if (marketItems.length)
    channels.push({
      key: "market",
      title: "Marché de l'emploi",
      summary: `${jobCount} offres sur ${totalJobs} (${demandPct}%) exigent ou mentionnent « ${canon.label} » — dont ${requiredCount} en compétence requise.`,
      weight: marketC,
      items: marketItems,
    });
  if (techItems.length)
    channels.push({
      key: "tech",
      title: "État de l'art technologique",
      summary: `${techItems.length} technologie(s) en production matérialisent cette compétence sur le terrain.`,
      weight: techC,
      items: techItems,
    });
  if (researchItems.length)
    channels.push({
      key: "research",
      title: "Fondements de recherche",
      summary: `${researchItems.length} publication(s) fondent et légitiment cette compétence.`,
      weight: researchC,
      items: researchItems,
    });
  channels.push({
    key: "coverage",
    title: "Couverture du cours",
    summary: `Le syllabus de « ${course.title} » ne traite pas cette compétence.`,
    weight: coverageC,
    items: coverageItems,
  });

  const severity = severityFromDemand(demandPct, requiredPct);
  const supported = jobCount > 0 && confidence >= 0.5;

  return {
    id: `${course.id}--${canonicalId}`,
    skill: canon.label,
    canonicalId,
    conclusion: `« ${canon.label} » est absent du cursus alors que ${demandPct}% des offres (${jobCount}/${totalJobs}) le demandent${requiredPct ? `, dont ${requiredPct}% en exigence ferme` : ""}.`,
    demandPct,
    requiredPct,
    jobCount,
    totalJobs,
    severity,
    confidence,
    supported,
    confidenceFactors,
    channels,
    module: {
      ...canon.module,
      rationale: `Comble le gap « ${canon.label} » : ${demandPct}% des offres, ${techItems.length} techno(s) en production, ${researchItems.length} publication(s) de référence.`,
    },
  };
}

function computeDrift(gaps: TracedGap[]): number {
  if (gaps.length === 0) return 0;
  const score = gaps.reduce((acc, g) => acc + g.demandPct * SEVERITY_WEIGHT[g.severity], 0);
  return Math.min(100, Math.round(score / gaps.length));
}

function sparkline(drift: number): number[] {
  return [0.3, 0.45, 0.6, 0.72, 0.85, 1].map((f) => Math.round(drift * f));
}

/** Construit l'audit complet et tracé d'un cours. */
export function buildAudit(courseId: string): CourseAudit | null {
  const course = getCourseById(courseId);
  if (!course) return null;
  const jobs = getJobs();
  const trends = getTrends();
  const papers = getPapers();

  const gaps: TracedGap[] = [];
  const flagged: FlaggedClaim[] = [];
  const seen = new Set<string>();

  for (const phrase of course.notCovered) {
    const ids = matchCanonical(phrase);
    if (ids.length === 0) {
      flagged.push({
        claim: phrase,
        reason: "Signalé hors-programme par le cours, mais absent du marché de l'emploi du dataset — non corroboré, donc non reporté.",
      });
      continue;
    }
    for (const cid of ids) {
      if (seen.has(cid)) continue;
      seen.add(cid);
      const gap = buildGap(course, cid, phrase, jobs, trends, papers);
      if (gap.supported) gaps.push(gap);
      else
        flagged.push({
          claim: `${gap.skill}`,
          reason: `Seulement ${gap.demandPct}% des offres le mentionnent — preuve marché insuffisante pour conclure à un gap critique.`,
        });
    }
  }

  gaps.sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.demandPct - a.demandPct,
  );

  const driftPct = computeDrift(gaps);
  const overallConfidence = gaps.length
    ? gaps.reduce((s, g) => s + g.confidence, 0) / gaps.length
    : 0.95;
  let rank = 0;
  for (const g of gaps) rank = Math.max(rank, SEVERITY_RANK[g.severity]);
  const severity = (["low", "medium", "high"] as const)[rank];

  return {
    courseId: course.id,
    courseTitle: course.title,
    major: course.major,
    year: course.year,
    hours: course.hours,
    owner: course.owner,
    lastUpdated: course.lastUpdated,
    description: course.description,
    generatedAt: new Date().toISOString(),
    generatedBy: "provenance-engine",
    driftPct,
    severity,
    overallConfidence,
    gaps,
    flagged,
    sourceStats: {
      jobs: jobs.length,
      trends: trends.length,
      papers: papers.length,
      topics: course.topics.length,
    },
    coveredTopics: course.topics.map((t) => ({ name: t.name, depth: t.depth })),
  };
}

let _allAudits: CourseAudit[] | null = null;
export function buildAllAudits(): CourseAudit[] {
  if (_allAudits) return _allAudits;
  _allAudits = getCourses()
    .map((c) => buildAudit(c.id))
    .filter((a): a is CourseAudit => a !== null);
  return _allAudits;
}

export function toSummary(audit: CourseAudit): CourseSummary {
  return {
    courseId: audit.courseId,
    courseTitle: audit.courseTitle,
    major: audit.major,
    driftPct: audit.driftPct,
    severity: audit.severity,
    confidence: audit.overallConfidence,
    gapCount: audit.gaps.length,
    topGaps: audit.gaps.slice(0, 3).map((g) => g.skill),
    sparkline: sparkline(audit.driftPct),
    sourceStats: audit.sourceStats,
  };
}

export function getAllSummaries(): CourseSummary[] {
  return buildAllAudits()
    .map(toSummary)
    .sort(
      (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.driftPct - a.driftPct,
    );
}

/* ================================================================== */
/* PROVENANCE INVERSE : d'une source, retrouver les conclusions        */
/* ================================================================== */

export interface Citation {
  courseId: string;
  courseTitle: string;
  gapId: string;
  gapSkill: string;
  severity: Severity;
  channel: string;
}

/** Toutes les conclusions (tous cours) qui s'appuient sur une source donnée. */
export function findCitations(refId: string): Citation[] {
  const out: Citation[] = [];
  for (const audit of buildAllAudits()) {
    for (const gap of audit.gaps) {
      for (const ch of gap.channels) {
        if (ch.items.some((it) => it.refId === refId)) {
          out.push({
            courseId: audit.courseId,
            courseTitle: audit.courseTitle,
            gapId: gap.id,
            gapSkill: gap.skill,
            severity: gap.severity,
            channel: ch.title,
          });
          break;
        }
      }
    }
  }
  return out;
}

export const CANONICAL = CANONICAL_SKILLS;
