import { AGENT_STEPS, type AgentKey } from "@/lib/audit-events";

export type StepStatus = "pending" | "running" | "done" | "error";
export type StepState = { status: StepStatus; summary?: string };

const ICON: Record<StepStatus, string> = {
  pending: "○",
  running: "◐",
  done: "✓",
  error: "✗",
};

const COLOR: Record<StepStatus, string> = {
  pending: "text-ink-soft/50",
  running: "text-spine",
  done: "text-verified",
  error: "text-flag",
};

/** Trace live des agents : une ligne par agent, état + résumé de sortie. */
export function AgentTrace({ states }: { states: Record<AgentKey, StepState> }) {
  return (
    <ol className="divide-y divide-rule rounded-md border border-rule bg-panel">
      {AGENT_STEPS.map(({ key, label }) => {
        const s = states[key] ?? { status: "pending" as StepStatus };
        return (
          <li key={key} className="flex items-center gap-3 px-4 py-3">
            <span
              className={`font-mono text-lg ${COLOR[s.status]} ${
                s.status === "running" ? "animate-spin" : ""
              }`}
              aria-hidden
            >
              {ICON[s.status]}
            </span>
            <span
              className={`font-mono text-sm ${
                s.status === "pending" ? "text-ink-soft/60" : "text-ink"
              }`}
            >
              {label}
            </span>
            <span className="ml-auto text-right text-sm text-ink-soft">
              {s.status === "running"
                ? "…"
                : s.summary ?? (s.status === "pending" ? "" : "")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
