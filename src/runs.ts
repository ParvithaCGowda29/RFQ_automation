// Run history for the demo build: every run's outcome is recorded so a past run
// can be opened and traced end to end (what the agents read, decided and did).
// Stored in this browser only - no backend is connected.
export type RunStatus = "completed" | "stopped" | "sent-back";

export interface RunRecord {
  id: string;
  rfq: string;
  startedAt: number;
  endedAt: number;
  status: RunStatus;
  note?: string;
  files: string[];
  reachedSkill: number; // 1-based count of skills the run got through
}

const KEY = "cam-rfq-runs-v1";

export function loadRuns(): RunRecord[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveRun(r: RunRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify([r, ...loadRuns()].slice(0, 50)));
  } catch {
    /* storage full or blocked - the run still completes, only history is lost */
  }
}

export const statusLabel = (s: RunStatus) => (s === "completed" ? "Completed" : s === "stopped" ? "Stopped" : "Sent back");
