// Goal entry screen (13 Nov 2026, approved wireframes wf-goal-entry/open light+dark): BAM_UI's goal capture and
// left/right pane transition, RFQ-specific. After login one large typeable input with the fixed phrase
// "Build an AI agent that automates " and a cycling RFQ example as ghost text. Send flies the card into the
// assistant composer, the goal lands as the first chat message, and the right pane shows the expanded RFQ draft.
// Rule-based mock like the rest of this demo: the draft below is fixed content, no model is connected.
import { useEffect, useRef, useState } from "react";
import bull from "./assets/bull-head.png";

export const GOAL_PREFIX = "Build an AI agent that automates ";
const EXAMPLES = [
  "RFQ responses for Apex Electronics in India",
  "quoting for a 40-part PCB assembly",
  "RFQ responses for enclosure brackets in Europe",
];

/** The cycling example: types out, holds, deletes, moves to the next. Ghost text only: it is never the input's value. */
function useMarquee(active: boolean): string {
  const [text, setText] = useState(EXAMPLES[0]);
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (!active || reduce) return;
    let i = 0, n = 0, dir: 1 | -1 = 1, t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = EXAMPLES[i];
      n += dir;
      setText(full.slice(0, n));
      if (dir === 1 && n >= full.length) { dir = -1; t = setTimeout(tick, 1800); return; }
      if (dir === -1 && n <= 0) { dir = 1; i = (i + 1) % EXAMPLES.length; t = setTimeout(tick, 350); return; }
      t = setTimeout(tick, dir === 1 ? 38 : 18);
    };
    setText(""); t = setTimeout(tick, 300);
    return () => clearTimeout(t);
  }, [active, reduce]);
  return text;
}

/** Option A motion (BAM_UI): a copy of the goal card flies from the entry screen to the chat composer slot (700ms,
 *  ease-in-out), its text crossfading to the composer placeholder; the real composer owns the slot at the end. */
function flyCard(box: HTMLElement, text: string, go: () => void) {
  const r = box.getBoundingClientRect(), cs = getComputedStyle(box);
  const fly = document.createElement("div");
  fly.className = "ge-fly";
  Object.assign(fly.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, background: cs.backgroundColor,
    border: cs.border, boxShadow: cs.boxShadow, borderRadius: cs.borderRadius });
  const t = document.createElement("div"), ph = document.createElement("div");
  t.className = "ge-fly-text"; t.textContent = text;
  ph.className = "ge-fly-ph"; ph.textContent = "Ask BuLLM";
  fly.append(t, ph);
  document.body.append(fly);
  box.style.visibility = "hidden";
  const ease = "cubic-bezier(.65,0,.35,1)";
  setTimeout(() => {
    document.documentElement.dataset.geLanding = "1"; // hides the live composer until the card lands
    go(); // the main screen takes over underneath
    let tries = 0;
    const land = () => {
      const c = document.querySelector(".mid .composer") as HTMLElement | null;
      const tr = c?.getBoundingClientRect();
      if (!tr || !tr.width) { if (++tries < 40) { requestAnimationFrame(land); return } fly.remove(); delete document.documentElement.dataset.geLanding; return; }
      const kf = { left: `${tr.left}px`, top: `${tr.top}px`, width: `${tr.width}px`, height: `${tr.height}px`, borderRadius: "18px" };
      const move = fly.animate([{ left: fly.style.left, top: fly.style.top, width: fly.style.width, height: fly.style.height, borderRadius: cs.borderRadius }, kf],
        { duration: 700, easing: ease, fill: "forwards" });
      t.animate([{ opacity: 1 }, { opacity: 1, offset: .6 }, { opacity: 0 }], { duration: 700, fill: "forwards" });
      ph.animate([{ opacity: 0 }, { opacity: 0, offset: .6 }, { opacity: 1 }], { duration: 700, fill: "forwards" });
      move.onfinish = () => { fly.remove(); delete document.documentElement.dataset.geLanding; };
    };
    requestAnimationFrame(land);
  }, 160); // the hero starts fading out first, so there is never a blank frame
}

export function GoalEntry({ onSend }: { onSend: (text: string) => void }) {
  const PLEN = GOAL_PREFIX.length;
  // The box starts with the fixed phrase as real text; the caret starts right after it and never goes inside it.
  const [value, setValue] = useState(GOAL_PREFIX);
  const [exit, setExit] = useState(false);
  const leaving = useRef(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  // The examples cycle after the fixed phrase until the person types; they stop then and never write into the box.
  const example = useMarquee(value === GOAL_PREFIX);
  useEffect(() => { const e = ta.current; if (e) { e.focus(); e.setSelectionRange(PLEN, PLEN); } }, []);
  useEffect(() => { const e = ta.current; if (e) { e.style.height = "auto"; e.style.height = `${Math.min(e.scrollHeight, 160)}px`; } }, [value]);
  // The ghost wraps within the card; grow the box to fit it while the example is showing (BAM_UI card does the same).
  useEffect(() => {
    const e = ta.current, g = ghostRef.current;
    if (e && g && value === GOAL_PREFIX) e.style.height = `${Math.min(g.scrollHeight, 160)}px`;
  }, [example, value]);
  const typed = value.slice(PLEN);
  const empty = !typed.trim();
  const boxRef = useRef<HTMLDivElement>(null);
  const send = () => {
    if (empty || leaving.current) return;
    const go = () => onSend(value.trim());
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !boxRef.current) { go(); return; }
    leaving.current = true;
    setExit(true);
    flyCard(boxRef.current, value.trim(), go);
  };
  return (
    <div className={"goal-entry" + (exit ? " ge-exit" : "")}>
      <h3 className="ge-head">Name the agent and let the <img src={bull} alt="BuLL" className="ge-bull" /> build it</h3>
      <p className="ge-lede">Type the goal. BuLL does the rest.</p>
      <div className="ge-card" ref={boxRef}>
        <div className="ge-textwrap">
          {value === GOAL_PREFIX && (
            <div className="ge-ghost" ref={ghostRef} aria-hidden><span className="ge-ghost-pre">{GOAL_PREFIX}</span><span className="ge-ghost-tail">{example}</span></div>
          )}
          <textarea ref={ta} className="ge-input" rows={1} value={value} aria-label="RFQ goal"
            onChange={e => {
              if (e.target.value.startsWith(GOAL_PREFIX)) { setValue(e.target.value); return; }
              // An edit landed inside the fixed phrase (drop, spell-check, autofill): restore it and put the caret after it.
              requestAnimationFrame(() => ta.current?.setSelectionRange(PLEN, PLEN));
            }}
            onSelect={e => { const t = e.currentTarget; if (t.selectionStart < PLEN || t.selectionEnd < PLEN) t.setSelectionRange(Math.max(t.selectionStart, PLEN), Math.max(t.selectionEnd, PLEN)); }}
            onKeyDown={e => {
              const t = e.currentTarget;
              if (e.key === "Backspace" && t.selectionStart <= PLEN && t.selectionEnd <= PLEN) { e.preventDefault(); return; }
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
            }} />
        </div>
        <button type="button" className="ge-send" aria-label="Send goal" aria-disabled={empty || undefined} disabled={empty} onClick={send}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}

const DRAFT_SECTIONS: [string, string, string, boolean][] = [
  ["I", "Instructions", "Read the incoming RFQ files, extract every requirement and prepare a quote for human approval before it goes out.", false],
  ["S", "Source data", "BOM, mechanical drawings and Gerber files for this RFQ - added with Add files on the left.", true],
  ["A", "Automation", "The 10-skill workflow on the left runs end to end: Input Standardization \u2192 Feature Extraction \u2192 Feasibility & Risk \u2192 sourcing and cost skills \u2192 Costed BOM \u2192 Sales Quote.", false],
  ["T", "Tech Stack", "This demo runs fully in the browser on mock data; no backend is connected.", false],
  ["V", "Variables", "Quantities, costs and margins come from the uploaded BOM and drawings.", false],
  ["O", "Outcome", "A costed BOM and a sales quote, reviewed and approved by you before it is sent.", false],
  ["N", "Next", "You check the extracted inputs at the start and give final approval on the quote - the two human gates in the workflow.", false],
];

/** "RFQ responses for Apex Electronics in India" -> "For Apex Electronics in India." (falls back to the tail itself). */
export function goalSubtitle(tail: string): string {
  const t = tail.trim().replace(/[.\s]+$/, "");
  const m = t.match(/\bfor\s+(.+)$/i);
  const s = m ? `For ${m[1]}` : t;
  return (s.charAt(0).toUpperCase() + s.slice(1)) + ".";
}

/** The expanded goal draft in the right pane (approved content - fixed RFQ text, no backend). */
export function GoalDraft({ tail }: { tail: string }) {
  return (
    <div className="gd">
      <span className="gd-pill">Goal</span>
      <h3 className="gd-title"><img src={bull} alt="" />RFQ Response Agent</h3>
      <p className="gd-sub">{goalSubtitle(tail)}</p>
      {DRAFT_SECTIONS.map(([k, title, body, isSource]) => (
        <div key={k}>
          <h4 className={isSource ? "gd-s" : undefined}><code>{k}</code>{title}</h4>
          <p>{body}</p>
        </div>
      ))}
      <p className="gd-foot">Add your files on the left and I'll take it from there.</p>
    </div>
  );
}
