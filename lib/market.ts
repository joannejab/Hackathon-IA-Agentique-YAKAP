import type { Job } from "./schemas";

/**
 * Calcul DÉTERMINISTE des fréquences de compétences depuis les offres.
 * On ne laisse pas le LLM compter (source d'erreurs/hallucinations de %) :
 * les pourcentages affichés sont fiables et sourçables par construction.
 */

export type SkillFreq = { skill: string; count: number; pct: number };

export function computeSkillFrequencies(jobs: Job[]): SkillFreq[] {
  const total = Math.max(1, jobs.length);
  const counts = new Map<string, { label: string; count: number }>();
  for (const job of jobs) {
    const seen = new Set<string>();
    for (const s of job.skills) {
      const key = s.toLowerCase().trim();
      if (seen.has(key)) continue; // une offre compte une fois par skill
      seen.add(key);
      const entry = counts.get(key) ?? { label: s, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  return [...counts.values()]
    .map((e) => ({ skill: e.label, count: e.count, pct: Math.round((e.count / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

/** Cherche la fréquence marché correspondant le mieux à un intitulé de gap (matching tolérant). */
export function lookupDemand(gapSkill: string, freqs: SkillFreq[]): SkillFreq | null {
  const g = gapSkill.toLowerCase();
  let best: SkillFreq | null = null;
  for (const f of freqs) {
    const k = f.skill.toLowerCase();
    if (g.includes(k) || k.includes(g)) {
      if (!best || f.pct > best.pct) best = f;
    }
  }
  return best;
}
