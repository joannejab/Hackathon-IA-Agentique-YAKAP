import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { Course, Job, Trend, Paper } from "./schemas";

/** Chargement + validation Zod des données /data (côté serveur). Mis en cache mémoire. */

const DATA_DIR = join(process.cwd(), "data");

function load<T>(file: string, schema: z.ZodType<T>): T {
  const raw = readFileSync(join(DATA_DIR, file), "utf-8");
  return schema.parse(JSON.parse(raw));
}

let _courses: Course[] | null = null;
let _jobs: Job[] | null = null;
let _trends: Trend[] | null = null;
let _papers: Paper[] | null = null;

export function getCourses(): Course[] {
  return (_courses ??= load("courses.json", z.array(Course)));
}
export function getCourseById(id: string): Course | undefined {
  return getCourses().find((c) => c.id === id);
}
export function getJobs(): Job[] {
  return (_jobs ??= load("jobs.json", z.array(Job)));
}
export function getTrends(): Trend[] {
  return (_trends ??= load("tech_trends.json", z.array(Trend)));
}
export function getPapers(): Paper[] {
  return (_papers ??= load("research_papers.json", z.array(Paper)));
}

export function getJobById(id: string): Job | undefined {
  return getJobs().find((j) => j.id === id);
}
export function getTrendById(id: string): Trend | undefined {
  return getTrends().find((t) => t.id === id);
}
export function getPaperById(id: string): Paper | undefined {
  return getPapers().find((p) => p.id === id);
}
