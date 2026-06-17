import type { CourseAudit, CourseSummary } from "./schemas";

/**
 * Données mockées au format des contrats (lib/schemas.ts).
 * Objectif : permettre à Perso D (UI) de construire SANS attendre les vrais agents.
 * Remplacées par la sortie réelle du pipeline une fois branché (T+90min).
 * Cursus de démo : majeure SCIA (EPITA).
 */

/** Vue Chef de majeure — triée par sévérité décroissante. */
export const mockSummaries: CourseSummary[] = [
  {
    courseId: "nlp-scia",
    courseTitle: "Natural Language Processing",
    major: "SCIA",
    driftPct: 61,
    severity: "high",
    confidence: 0.89,
    topGaps: ["LLM agents", "RAG", "Fine-tuning / LoRA"],
    sparkline: [22, 28, 35, 44, 53, 61],
  },
  {
    courseId: "ml-scia",
    courseTitle: "Machine Learning",
    major: "SCIA",
    driftPct: 38,
    severity: "medium",
    confidence: 0.92,
    topGaps: ["RAG", "MLOps"],
    sparkline: [12, 15, 19, 26, 31, 38],
  },
  {
    courseId: "dl-scia",
    courseTitle: "Deep Learning",
    major: "SCIA",
    driftPct: 33,
    severity: "medium",
    confidence: 0.9,
    topGaps: ["Transformers en production", "Quantization"],
    sparkline: [10, 14, 18, 22, 28, 33],
  },
  {
    courseId: "data-eng-scia",
    courseTitle: "Data Engineering",
    major: "SCIA",
    driftPct: 12,
    severity: "low",
    confidence: 0.94,
    topGaps: ["Vector databases"],
    sparkline: [8, 9, 9, 10, 11, 12],
  },
  {
    courseId: "stats-scia",
    courseTitle: "Statistics & Probability",
    major: "SCIA",
    driftPct: 7,
    severity: "low",
    confidence: 0.95,
    topGaps: [],
    sparkline: [6, 6, 7, 7, 7, 7],
  },
];

/** Vue Prof — rapport complet d'un cours (ici : Machine Learning). */
export const mockAuditML: CourseAudit = {
  courseId: "ml-scia",
  courseTitle: "Machine Learning",
  major: "SCIA",
  generatedAt: "2026-06-17T14:00:00.000Z",
  driftPct: 38,
  severity: "medium",
  overallConfidence: 0.92,
  marketSkills: [
    { name: "Python", frequencyPct: 82, importance: "high" },
    { name: "RAG", frequencyPct: 40, importance: "high" },
    { name: "MLOps", frequencyPct: 37, importance: "medium" },
    { name: "scikit-learn", frequencyPct: 58, importance: "medium" },
    { name: "Vector databases", frequencyPct: 24, importance: "medium" },
  ],
  trends: [
    {
      name: "Retrieval-Augmented Generation",
      why: "Standard pour ancrer les LLM sur des données privées ; omniprésent dans les offres IA.",
      maturity: "growing",
    },
    {
      name: "MLOps / déploiement continu de modèles",
      why: "Industrialisation des modèles : CI/CD, monitoring, drift detection.",
      maturity: "mainstream",
    },
  ],
  covered: [
    { topic: "Régression & classification", depth: "advanced" },
    { topic: "Arbres & ensembles", depth: "advanced" },
    { topic: "Validation croisée & métriques", depth: "intermediate" },
    { topic: "Feature engineering", depth: "intermediate" },
    { topic: "MLOps", depth: "intro" },
    { topic: "RAG", depth: "none" },
  ],
  gaps: [
    {
      skill: "RAG",
      evidence:
        "Non couvert alors que présent dans 40% des offres récentes du secteur.",
      demandPct: 40,
      severity: "high",
      supported: true,
      sourceRef: "jobs.json #12–48",
      confidence: 0.94,
    },
    {
      skill: "MLOps",
      evidence:
        "Couverture superficielle (intro) face à une demande de mise en production.",
      demandPct: 37,
      severity: "medium",
      supported: true,
      sourceRef: "syllabus ML §4 · jobs.json #5–31",
      confidence: 0.9,
    },
    {
      skill: "Vector databases",
      evidence: "Absent du syllabus ; émerge dans les offres orientées RAG.",
      demandPct: 24,
      severity: "medium",
      supported: true,
      sourceRef: "jobs.json #18–44",
      confidence: 0.85,
    },
  ],
  suggestedModules: [
    {
      title: "Retrieval-Augmented Generation",
      objectives: [
        "Comprendre l'architecture retrieval + génération",
        "Construire un pipeline RAG avec une base vectorielle",
        "Évaluer la pertinence et limiter les hallucinations",
      ],
      rationale:
        "Comble le gap le plus critique (40% des offres) et prépare à l'écosystème LLM.",
      hours: 12,
    },
    {
      title: "MLOps & déploiement de modèles",
      objectives: [
        "CI/CD pour modèles ML",
        "Monitoring & détection de drift",
        "Servir un modèle en production",
      ],
      rationale:
        "Passe la couverture MLOps d'intro à opérationnelle, alignée sur la demande marché.",
      hours: 8,
    },
  ],
  flagged: [
    {
      claim: "Kubernetes est obligatoire pour 70% des postes ML.",
      reason: "Non sourcé : aucune offre du dataset ne soutient ce chiffre.",
    },
  ],
};

/** Helper : récupérer un audit mock par id (fallback ML pour la démo). */
export function getMockAudit(courseId: string): CourseAudit {
  if (courseId === "ml-scia") return mockAuditML;
  // Pour les autres cours, on renvoie l'audit ML retitré (mock UI uniquement).
  const summary = mockSummaries.find((s) => s.courseId === courseId);
  if (!summary) return mockAuditML;
  return {
    ...mockAuditML,
    courseId: summary.courseId,
    courseTitle: summary.courseTitle,
    driftPct: summary.driftPct,
    severity: summary.severity,
    overallConfidence: summary.confidence,
  };
}
