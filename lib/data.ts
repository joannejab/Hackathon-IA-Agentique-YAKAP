import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { Course, Job, Trend } from "./schemas";

/** Chargement des données /data (côté serveur). Validé par Zod. */

const DATA_DIR = join(process.cwd(), "data");

function load<T>(file: string, schema: z.ZodType<T>): T {
  const raw = readFileSync(join(DATA_DIR, file), "utf-8");
  return schema.parse(JSON.parse(raw));
}

export function getCourses(): Course[] {
  return load("courses.json", z.array(Course));
}

export function getCourseById(id: string): Course | undefined {
  return getCourses().find((c) => c.id === id);
}

export function getJobs(): Job[] {
  return load("jobs.json", z.array(Job));
}

export function getTrends(): Trend[] {
  return load("tech_trends.json", z.array(Trend));
}
