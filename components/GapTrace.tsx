"use client";

import { useState } from "react";
import Link from "next/link";
import type { ChannelKey, EvidenceChannel, Severity, TracedGap } from "@/lib/schemas";

const SEV_VAR: Record<Severity, string> = {
  low: "var(--verified)",
  medium: "var(--amber)",
  high: "var(--flag)",
};
const SEV_LABEL: Record<Severity, string> = { low: "faible", medium: "modéré", high: "critique" };

const CH_VAR: Record<ChannelKey, string> = {
  market: "var(--ch-market)",
  tech: "var(--ch-tech)",
  research: "var(--ch-research)",
  coverage: "var(--ch-coverage)",
};
const CH_KIND_LABEL: Record<string, string> = {
  job: "offre",
  trend: "techno",
  paper: "publication",
  syllabus: "syllabus",
};

/** Décomposition visuelle de la confiance : barre empilée + facteurs détaillés. */
function ConfidenceBreakdown({ gap }: { gap: TracedGap }) {
  // les facteurs sont dans l'ordre marché / absence / tech / recherche
  const colors = [CH_VAR.market, CH_VAR.coverage, CH_VAR.tech, CH_VAR.research];
  return (
    <div className="mt-3 rounded-md border border-rule bg-paper/60 p-3">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">
          d&apos;où vient la confiance {gap.confidence.toFixed(2)}
        </p>
        <span className="font-mono text-xs text-ink-soft">somme des preuves →</span>
      </div>
      <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-rule" aria-hidden>
        {gap.confidenceFactors.map((f, i) => (
          <span
            key={f.label}
            style={{ width: `${f.contribution * 100}%`, background: colors[i] }}
            title={`${f.label} +${f.contribution.toFixed(2)}`}
          />
        ))}
      </div>
      <ul className="mt-2 space-y-1">
        {gap.confidenceFactors.map((f, i) => (
          <li key={f.label} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: colors[i] }} />
            <span className="text-ink">
              <span className="font-medium">{f.label}</span>{" "}
              <span className="font-mono text-xs text-ink-soft">+{f.contribution.toFixed(2)}</span>
              <span className="text-ink-soft"> — {f.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChannelBlock({ channel, order }: { channel: EvidenceChannel; order: number }) {
  const [showAll, setShowAll] = useState(false);
  const color = CH_VAR[channel.key];
  const LIMIT = 5;
  const items = showAll ? channel.items : channel.items.slice(0, LIMIT);
  const hidden = channel.items.length - items.length;

  return (
    <div
      className="trace-open rounded-md border border-rule bg-panel p-3"
      style={{ animationDelay: `${order * 60}ms`, borderLeftWidth: 3, borderLeftColor: color }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color }}>
          {channel.title}
        </p>
        <span className="font-mono text-[11px] text-ink-soft">
          pèse +{channel.weight.toFixed(2)} · {channel.items.length} source
          {channel.items.length > 1 ? "s" : ""}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{channel.summary}</p>

      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => {
          const body = (
            <div className="flex items-start gap-2">
              <span
                className="mt-0.5 shrink-0 rounded-full border px-1.5 py-px font-mono text-[10px] uppercase"
                style={{ borderColor: color, color }}
              >
                {CH_KIND_LABEL[it.kind] ?? it.kind}
              </span>
              <span className="min-w-0">
                <span className="font-medium text-ink">{it.title}</span>
                {it.href && <span className="ml-1 text-xs text-spine">↗</span>}
                <span className="block text-sm text-ink-soft">{it.snippet}</span>
                {it.meta && it.meta.length > 0 && (
                  <span className="mt-0.5 block font-mono text-[11px] text-ink-soft">
                    {it.meta.map((m) => `${m.label}: ${m.value}`).join("  ·  ")}
                  </span>
                )}
              </span>
            </div>
          );
          return (
            <li key={`${it.refId}-${i}`}>
              {it.href ? (
                <Link
                  href={it.href}
                  className="block rounded-md p-1.5 transition-colors hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-spine"
                >
                  {body}
                </Link>
              ) : (
                <div className="p-1.5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      {hidden > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-1 font-mono text-xs text-spine hover:underline"
        >
          + {hidden} autre{hidden > 1 ? "s" : ""} source{hidden > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

/** Une CONCLUSION dépliable → toute sa chaîne de preuves jusqu'aux données brutes. */
export function GapTrace({ gap, index }: { gap: TracedGap; index: number }) {
  const [open, setOpen] = useState(false);
  const sev = SEV_VAR[gap.severity];

  return (
    <li
      className="cite rounded-md border border-rule bg-panel"
      style={{ animationDelay: `${index * 80}ms`, borderLeftWidth: 4, borderLeftColor: sev }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-spine"
      >
        <span className="mt-1 font-mono text-xs text-ink-soft">{open ? "▾" : "▸"}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg text-ink">{gap.skill}</span>
            <span
              className="rounded-full px-2 py-px font-mono text-[11px] uppercase"
              style={{ background: `color-mix(in srgb, ${sev} 12%, transparent)`, color: sev }}
            >
              {SEV_LABEL[gap.severity]}
            </span>
          </span>
          <span className="mt-1 block text-sm text-ink-soft">{gap.conclusion}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-mono text-lg" style={{ color: sev }}>
            {gap.demandPct}%
          </span>
          <span className="block font-mono text-[11px] text-ink-soft">conf {gap.confidence.toFixed(2)}</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-rule px-4 pb-4 pt-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
            Remonter à la source — {gap.channels.length} canaux de preuve
          </p>

          <ConfidenceBreakdown gap={gap} />

          <div className="mt-3 grid gap-2">
            {gap.channels.map((ch, i) => (
              <ChannelBlock key={ch.key} channel={ch} order={i} />
            ))}
          </div>

          {gap.module && (
            <div className="mt-3 rounded-md border border-spine/30 bg-spine/5 p-3">
              <p className="font-mono text-xs uppercase tracking-widest text-spine">
                Correctif proposé · {gap.module.hours} h
              </p>
              <p className="mt-1 font-medium text-ink">{gap.module.title}</p>
              <p className="text-sm text-ink-soft">{gap.module.rationale}</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-ink-soft">
                {gap.module.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
