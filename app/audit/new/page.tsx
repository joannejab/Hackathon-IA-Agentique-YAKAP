"use client";

import { useState } from "react";
import Link from "next/link";
import { AGENT_STEPS, type AgentKey, type AuditEvent } from "@/lib/audit-events";
import { AgentTrace, type StepState } from "@/components/AgentTrace";
import { GapReport } from "@/components/GapReport";
import type { CourseAudit } from "@/lib/schemas";

const EXAMPLE = `Computer Vision — programme
- Traitement d'image : filtrage, convolutions, détection de contours
- Réseaux convolutifs (CNN) : architectures classiques
- Détection et segmentation d'objets
- Transfer learning sur images
- Évaluation : mAP, IoU`;

function initStates(): Record<AgentKey, StepState> {
  return Object.fromEntries(
    AGENT_STEPS.map((s) => [s.key, { status: "pending" }]),
  ) as Record<AgentKey, StepState>;
}

export default function NewAuditPage() {
  const [title, setTitle] = useState("");
  const [major, setMajor] = useState("SCIA");
  const [syllabus, setSyllabus] = useState("");
  const [running, setRunning] = useState(false);
  const [states, setStates] = useState<Record<AgentKey, StepState>>(initStates);
  const [audit, setAudit] = useState<CourseAudit | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(agent: AgentKey, next: StepState) {
    setStates((prev) => ({ ...prev, [agent]: next }));
  }

  function handle(ev: AuditEvent) {
    if (ev.type === "agent") {
      patch(
        ev.agent,
        ev.status === "start"
          ? { status: "running" }
          : { status: "done", summary: ev.summary },
      );
    } else if (ev.type === "done") {
      setAudit(ev.audit);
    } else if (ev.type === "error") {
      setError(ev.message);
      if (ev.agent) patch(ev.agent, { status: "error", summary: ev.message });
    }
  }

  async function launch(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !syllabus.trim() || running) return;
    setRunning(true);
    setAudit(null);
    setError(null);
    setStates(initStates());

    try {
      const res = await fetch("/api/audit/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, major, syllabusText: syllabus }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? `Erreur ${res.status}`);
        setRunning(false);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (line) handle(JSON.parse(line) as AuditEvent);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/chef" className="font-mono text-xs text-ink-soft hover:text-spine">
          ← vue chef de majeure
        </Link>
        <h1 className="mt-3 font-display text-4xl text-ink">Nouvel audit</h1>
        <p className="mt-1 text-ink-soft">
          Ajoute un cours et son programme. Les agents l&apos;analysent en direct.
        </p>

        <form onSubmit={launch} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                Titre du cours
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Computer Vision"
                disabled={running}
                className="mt-1 w-full rounded-md border border-rule bg-panel px-3 py-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-spine"
              />
            </label>
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                Majeure
              </span>
              <input
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                disabled={running}
                className="mt-1 w-full rounded-md border border-rule bg-panel px-3 py-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-spine"
              />
            </label>
          </div>
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                Syllabus (coller le programme)
              </span>
              <button
                type="button"
                onClick={() => {
                  setTitle("Computer Vision");
                  setSyllabus(EXAMPLE);
                }}
                disabled={running}
                className="font-mono text-xs text-spine hover:underline"
              >
                remplir un exemple
              </button>
            </span>
            <textarea
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              rows={8}
              placeholder="Colle ici le programme du cours…"
              disabled={running}
              className="mt-1 w-full rounded-md border border-rule bg-panel px-3 py-2 font-mono text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-spine"
            />
          </label>
          <button
            type="submit"
            disabled={running || !title.trim() || !syllabus.trim()}
            className="rounded-md bg-spine px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {running ? "Audit en cours…" : "▶ Lancer l'audit"}
          </button>
        </form>

        {(running || audit || error) && (
          <section className="mt-10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
              Pipeline agentique
            </p>
            <div className="mt-3">
              <AgentTrace states={states} />
            </div>
            {error && (
              <p className="mt-3 rounded-md border border-flag/30 bg-flag/5 px-3 py-2 text-sm text-flag">
                {error}
              </p>
            )}
          </section>
        )}

        {audit && (
          <article className="mt-10 border-t border-rule pt-8">
            <GapReport audit={audit} source="live" />
          </article>
        )}
      </div>
    </main>
  );
}
