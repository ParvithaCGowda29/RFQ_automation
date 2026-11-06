import { useEffect, useRef, useState } from "react";
import {
  IconAlertTriangle, IconBolt, IconChartBar, IconCheck,
  IconClipboardCheck, IconDatabase, IconFiles, IconFileSpreadsheet, IconFileZip,
  IconFolder, IconGauge, IconInbox, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand,
  IconLink, IconMail, IconMessage, IconMicrophone, IconMoon, IconPencil, IconPlugConnected, IconPlus,
  IconScan, IconSend, IconSun, IconTable, IconTruck, IconUser, IconCircleCheckFilled,
} from "@tabler/icons-react";
import bullHead from "./assets/bull-head.png";
import { useList } from "@refinedev/core";
import { SKILLS, OUTPUTS, CHAT_START, REVIEW_LINE, HOOK_LINE, type OutCard, type Skill } from "./data";

/* Provisional designs pending her wireframe sign-off: set either flag to false
   to revert that piece to the approved base look. */
const FEAT = { progressBar: false, reviewPanel: false };

const ICONS: Record<string, any> = {
  inbox: IconInbox, scan: IconScan, gauge: IconGauge, truck: IconTruck,
  send: IconSend, database: IconDatabase, clipcheck: IconClipboardCheck,
  sheet: IconFileSpreadsheet, chart: IconChartBar, mail: IconMail,
  table: IconTable, link: IconLink, message: IconMessage, edit: IconPencil,
};

type Phase = "idle" | "running" | "review" | "done";
interface Msg { who: "ai" | "me"; text: string }

const REVIEW_CHECKS: Record<number, string[]> = {
  3: ["Verdict: can build - 0402 parts, 8 oven zones",
      "Risk flags seen: 2 EOL parts (U4, U9), 1 long-lead-time (J2, 14 weeks)",
      "2 input gaps from the drawing noted for the quote"],
  10: ["Quote built from the costed BOM for RFQ-1042",
       "Internal approvals done - finance and delivery signed off",
       "Cover letter drafted, costing Excel attached"],
};

export default function App() {
  const { result } = useList<Skill>({ resource: "skills" });
  const skills: Skill[] = (result?.data?.length ? result.data : SKILLS) as Skill[];
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [skillIdx, setSkillIdx] = useState(-1);
  const [subIdx, setSubIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>(CHAT_START.map(([who, text]) => ({ who: who as "ai" | "me", text })));
  // Demo states for screenshots: ?demo=running|review|final
  useEffect(() => {
    const d = new URLSearchParams(location.search).get("demo");
    if (!d) return;
    const map: Record<string, number> = { running: 4, review: 2, final: 9 };
    const i = map[d] ?? 4;
    setSkillIdx(i); setSubIdx(d === "running" ? 2 : 3); setExpanded(i);
    setPhase(d === "running" ? "running" : "review");
    setMsgs(m => [...m, { who: "ai", text: REVIEW_LINE[skills[i].n] }]);
  }, []);
  const [draft, setDraft] = useState("");
  const [railMini, setRailMini] = useState(() => new URLSearchParams(location.search).has("mini"));
  const [afOpen, setAfOpen] = useState(() => new URLSearchParams(location.search).has("af"));
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { if (new URLSearchParams(location.search).get("theme") === "dark") setTheme("dark"); }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const skill = skillIdx >= 0 ? skills[skillIdx] : null;
  const doneCount = phase === "done" ? skills.length : Math.max(0, skillIdx);

  // Mock run engine: auto-advance sub-skills, pause at the human review sub.
  useEffect(() => {
    if (phase !== "running" || !skill) return;
    const t = setTimeout(() => {
      if (subIdx < skill.subs.length - 1) {
        setSubIdx(subIdx + 1);
      } else {
        setPhase("review");
        setMsgs(m => [...m, { who: "ai", text: REVIEW_LINE[skill.n] }]);
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [phase, subIdx, skillIdx]);

  const startRun = () => {
    setMsgs(m => [...m, { who: "me", text: "Yes, start." },
      { who: "ai", text: "Starting Input Standardization - steps and output appear on the right." }]);
    setSkillIdx(0); setSubIdx(0); setPhase("running"); setExpanded(0);
  };

  const approve = () => {
    if (!skill) return;
    setMsgs(m => [...m, { who: "me", text: "Approved - go ahead." }]);
    if (skillIdx < skills.length - 1) {
      const next = skills[skillIdx + 1];
      setMsgs(m => [...m, { who: "ai", text: HOOK_LINE(skill.name, next.name) }]);
      setSkillIdx(skillIdx + 1); setSubIdx(0); setPhase("running"); setExpanded(skillIdx + 1);
    } else {
      setPhase("done");
      setMsgs(m => [...m, { who: "ai", text: "The quote email has been sent to the client. RFQ-1042 is complete - all 10 skills done." }]);
    }
  };

  const sendChat = () => {
    const text = draft.trim();
    if (!text) return;
    setMsgs(m => [...m, { who: "me", text },
      { who: "ai", text: "Mock demo - the assistant answers from the workflow data only. The real Q&A comes with the backend." }]);
    setDraft("");
  };

  const subStatus = (j: number) =>
    skillIdx < 0 ? "wait" : j < subIdx ? "done" : j > subIdx ? "wait" : phase === "review" ? "review" : phase === "done" ? "done" : "run";

  return (
    <div className="app">
      <header className="top">
        <div className="wm"><span className="bu">CAM</span> <span className="llm">4.0</span></div>
        <div className="scr-t">
          <h1>RFQ Automation</h1>
          <p>{skill ? `${skill.name}${phase === "review" ? " - review (human)" : ""}` : "Start - RFQ package intake"}</p>
        </div>
        <div className="top-right">
          <span className="demo-chip">Demo - mock data, no backend</span>
          <button className="iconbtn" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Toggle theme">
            {theme === "light" ? <IconMoon size={16} /> : <IconSun size={16} />}
          </button>
          <div className="avatar">P</div>
        </div>
      </header>

      <div className="main">
        {/* LEFT RAIL - workflow (BAM_UI look) */}
        <section className={"pane rail" + (railMini ? " mini" : "")}>
          <div className="rail-h">
            {!railMini && <h2>Workflow - 10 skills</h2>}
            <button className="iconbtn sm" onClick={() => setRailMini(!railMini)} aria-expanded={!railMini}
              aria-label={railMini ? "Expand navigation" : "Collapse navigation"} title={railMini ? "Expand navigation" : "Collapse navigation"}>
              {railMini ? <IconLayoutSidebarLeftExpand size={14} /> : <IconLayoutSidebarLeftCollapse size={14} />}
            </button>
          </div>
          {railMini ? (
            <div className="mini-list">
              {skills.map((s, i) => {
                const isDone = i < doneCount || (i === skillIdx && phase === "done");
                const isActive = !isDone && i === skillIdx;
                const Icon = ICONS[s.icon] || IconBolt;
                return (
                  <div key={s.n} className="mini-item">
                    <button className={"mini-dot" + (isDone ? " done" : isActive ? " on" : "")} title={s.name}
                      onClick={() => { setRailMini(false); setExpanded(i); }}>
                      {isDone ? <IconCheck size={15} /> : <Icon size={15} />}
                      {isActive && <span className="pulse" />}
                    </button>
                    <span className="mini-label">{s.name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
          <>
          <div className="pane-b">
            <div className={"af-wrap" + (afOpen ? " open" : "")} onMouseLeave={() => setAfOpen(false)}>
              <button className="af-btn" aria-haspopup="menu" aria-expanded={afOpen} onClick={() => setAfOpen(!afOpen)}>
                <IconPlus size={14} /> Add files
              </button>
              <div className="af-menu" role="menu" aria-label="Add files">
                <button role="menuitem" className="af-item" onClick={() => setAfOpen(false)}><IconFolder size={16} /> Choose folder</button>
                <button role="menuitem" className="af-item" onClick={() => setAfOpen(false)}><IconFiles size={16} /> Bulk upload</button>
                <button role="menuitem" className="af-item" onClick={() => setAfOpen(false)}><IconFileZip size={16} /> Upload zip</button>
              </div>
            </div>
            <div className="af-s">BOM, mechanical drawings, Gerber files - hover or click Add files for upload options</div>

            {FEAT.progressBar && (
              <>
                <div className="wf-head">
                  <span className="wf-label" style={{ margin: 0 }}>Progress</span>
                  <span className="wf-count">{doneCount} of 10 done</span>
                </div>
                <div className="pbar" style={{ margin: "0 2px 10px" }}>{doneCount > 0 && <span style={{ width: `${(doneCount / skills.length) * 100}%` }} />}</div>
              </>
            )}

            <div className="stages">
            {skills.map((s, i) => {
              const isDone = i < doneCount || (i === skillIdx && phase === "done");
              const st = isDone ? "" : i === skillIdx ? `In progress - ${subIdx + 1} of ${s.subs.length} sub-skills` : "Waiting";
              const isActive = !isDone && i === skillIdx;
              const cls = isDone ? "skill done" : isActive ? "skill active" : "skill";
              const Icon = ICONS[s.icon] || IconBolt;
              return (
                <div key={s.n} className="stage-li">
                  {i < skills.length - 1 && <span className="st-line" aria-hidden />}
                  <button className={cls + (expanded === i ? " open" : "")} onClick={() => setExpanded(expanded === i ? null : i)} aria-expanded={expanded === i}>
                    <div className="dot">{isDone ? <IconCheck size={15} /> : <Icon size={15} />}{isActive && <span className="pulse" />}</div>
                    <div className="tx">
                      <div className="nm">{s.name}</div>
                      <div className="st">{isDone ? <span className="done-tick"><IconCircleCheckFilled size={15} /></span> : st}</div>
                      {FEAT.progressBar && i === skillIdx && phase !== "done" && (
                        <div className="pbar">{subIdx > 0 && <span style={{ width: `${(subIdx / s.subs.length) * 100}%` }} />}</div>
                      )}
                    </div>
                  </button>
                  {expanded === i && s.n >= 2 && (
                    <div className="hooknote"><IconPlugConnected size={13} /><span>Started by hook from {skills[i - 1].name} - output handed over automatically</span></div>
                  )}
                  {expanded === i && (
                    <div className="subs">
                      {s.subs.map((sub, j) => {
                        const ss = i === skillIdx ? subStatus(j) : i < doneCount ? "done" : "wait";
                        const isHuman = j === s.subs.length - 1;
                        return (
                          <div key={sub.id} className={"sub-row" + (ss === "done" ? " done" : ss === "run" || ss === "review" ? " act" : "")}>
                            <span className="sd" />{sub.name}
                            <span className="mode">{ss === "done" && <span className="done-tick"><IconCircleCheckFilled size={14} /></span>}{isHuman ? <IconUser size={13} /> : <img className="bull" src={bullHead} alt="Automated" />}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
          <div className="legend">
            <span><img className="bull" src={bullHead} alt="" /> Automated</span>
            <span><IconUser size={13} /> Human step</span>
            <span><IconPlugConnected size={13} /> Hook handoff</span>
          </div>
          </>
          )}
        </section>

        {/* MIDDLE - assistant chat */}
        <section className="pane mid">
          <div className="pane-h">
            <IconMessage size={16} />
            <div><h2>Assistant</h2><div className="sub">Question and answer - I only act on your go-ahead</div></div>
          </div>
          <div className="pane-b">
            {phase === "idle" && (
              <div className="suggest"><button onClick={startRun}>Yes, start.</button></div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={"msg " + m.who}>
                <div><div className="who">{m.who === "ai" ? "Assistant" : "You"}</div><div className="b">{m.text}</div></div>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>
          <div className="composer">
            <input className="in" placeholder="Ask about this RFQ..." value={draft}
              onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} />
            <button className="micb" aria-label="Dictate"><IconMicrophone size={18} /></button>
            <button className="sendb" onClick={sendChat} aria-label="Send"><IconSend size={18} /></button>
          </div>
        </section>

        {/* RIGHT - steps output */}
        <section className="pane right">
          <div className="pane-h">
            <IconBolt size={16} />
            <div><h2>Output</h2>
              <div className="sub">{skill ? `${skill.name} - ${skill.subs[Math.min(subIdx, skill.subs.length - 1)].name}${phase === "review" ? " (human)" : ""}` : "No skill running yet"}</div>
            </div>
          </div>
          <div className="pane-b">
            {!skill && (
              <>
                <div className="ocard">
                  <h3><span className="oi"><IconFileSpreadsheet size={15} /></span>Uploaded files</h3>
                  {["BOM_RFQ-1042.xlsx", "Bracket_drawing.pdf", "Gerbers_RFQ-1042.zip"].map(f => (
                    <div className="orow" key={f}><IconFileSpreadsheet size={14} /><span className="n">{f}</span>
                      <span className="m" style={{ color: "var(--blue)", display: "inline-flex", alignItems: "center", gap: 4 }}><IconCheck size={12} /> Scanned</span>
                    </div>
                  ))}
                </div>
                <div className="empty" style={{ height: "auto", marginTop: 32 }}>
                  <div className="ei"><IconBolt size={28} /></div>
                  <h3>Steps output appears here</h3>
                  <p>When a skill starts, its sub-skill steps and their output show up in this pane.</p>
                </div>
              </>
            )}
            {skill && skill.subs.map((sub, j) => {
              const ss = subStatus(j);
              if (phase === "done" && j === skill.subs.length - 1) return null;
              if (FEAT.reviewPanel && phase === "review" && j === skill.subs.length - 1) {
                const checks = REVIEW_CHECKS[skill.n] || [`${skill.name} output ready`, skill.hook.replace("Hook passes:", "Hook will pass:")];
                const next = skillIdx < skills.length - 1 ? skills[skillIdx + 1].name : null;
                return (
                  <div className="rcard" key={sub.id}>
                    <div className="rh"><div className="ri"><IconUser size={18} /></div>
                      <div><h3>Ready for your review</h3><div className="rs">Nothing moves on until you approve</div></div></div>
                    <div className="rb"><div className="rl">What you are confirming</div>
                      {checks.map(c => <div className="rcheck" key={c}><span className="ci"><IconCheck size={14} /></span>{c}</div>)}</div>
                    <div className="rf">
                      <button className="rbtn" onClick={approve}><IconCheck size={16} /> {next ? `Approve - start ${next}` : "Approve and send quote"}</button>
                      <button className="rbtn ghost">Send back with note</button>
                    </div>
                  </div>
                );
              }
              const step = sub.steps[sub.steps.length - 1];
              const chips: Record<string, string> = { run: "Running", wait: "Queued", review: "Review" };
              return (
                <div key={sub.id}>
                  <div className={"step" + (ss === "done" ? " done" : ss === "run" ? " run" : "")}>
                    <div className="si">{j === skill.subs.length - 1 ? <IconUser size={16} /> : <img className="bull" src={bullHead} alt="Automated" />}</div>
                    <div className="st-t"><div className="st-n">{sub.name}</div><div className="st-m">{step.note}</div></div>
                    {ss === "done" ? <span className="done-tick"><IconCircleCheckFilled size={20} /></span> : <span className={"chip " + ss}>{chips[ss]}</span>}
                  </div>
                  {(ss === "done" || ss === "run" || ss === "review") && (OUTPUTS[sub.id] || []).map((c: OutCard) => (
                    <div className="ocard" key={c.title}>
                      <h3><span className="oi">{(() => { const I = ICONS[c.icon] || IconFileSpreadsheet; return <I size={15} />; })()}</span>{c.title}</h3>
                      {(c.rows || []).map(r => <div className="kv" key={r.k}><span className="k">{r.k}</span><span className="v" style={r.tone ? { color: `var(--${r.tone})` } : undefined}>{r.v}</span></div>)}
                      {(c.files || []).map(f => <div className="orow" key={f.name}><IconFileSpreadsheet size={14} /><span className="n">{f.name}</span><span className="m">{f.meta}</span></div>)}
                      {(c.links || []).map(l => <div className="orow" key={l.name}><IconLink size={14} /><span className="n">{l.name}</span><span className="m">{l.meta}</span></div>)}
                      {(c.risks || []).length > 0 && <div style={{ marginTop: 8 }}>{(c.risks || []).map(r => <span className="risk" key={r}><IconAlertTriangle size={12} /> {r}</span>)}</div>}
                    </div>
                  ))}
                </div>
              );
            })}
            {phase === "done" && (
              <div className="ocard"><h3><span className="oi"><IconCheck size={15} /></span>RFQ-1042 complete</h3>
                <div className="kv"><span className="k">Quote sent to client</span><span className="v" style={{ color: "var(--blue)" }}>Yes</span></div>
                <div className="kv"><span className="k">Client quote</span><span className="v" style={{ color: "var(--orange)" }}>Rs 10,00,000</span></div>
              </div>
            )}
          </div>
          {skill && phase !== "done" && !FEAT.reviewPanel && (
            <div className="actionbar">
              <div className="hk"><IconPlugConnected size={13} /> {skill.hook}</div>
              {phase === "review" ? (
                <button className="abtn" onClick={approve}>
                  <IconBolt size={16} /> {skillIdx < skills.length - 1 ? `Action - start ${skills[skillIdx + 1].name}` : "Approve and send quote"}
                </button>
              ) : (
                <button className="abtn off">Action - enabled at Review</button>
              )}
            </div>
          )}
          {skill && phase !== "done" && FEAT.reviewPanel && phase !== "review" && (
            <div className="actionbar">
              <div className="hk"><IconPlugConnected size={13} /> {skill.hook}</div>
              <button className="abtn off">Review panel opens at the human step</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
