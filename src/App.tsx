import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  IconAlertTriangle, IconBolt, IconChartBar, IconCheck,
  IconClipboardCheck, IconDatabase, IconFiles, IconFileSpreadsheet, IconFileZip,
  IconFolder, IconGauge, IconInbox, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand,
  IconLink, IconMail, IconMessage, IconMicrophone, IconMoon, IconPencil, IconPlugConnected, IconPlus,
  IconScan, IconSend, IconSun, IconTable, IconTruck, IconUser, IconCircleCheckFilled, IconPlayerStop, IconLogout,
  IconHistory, IconEye, IconX,
} from "@tabler/icons-react";
import bullHead from "./assets/bull-head.png";
import { GoalDraft, GOAL_PREFIX } from "./GoalEntry";
import { LoginPage } from "./LoginPage";
import camLogoBlack from "./assets/cam-bom-automation-black.png";
import camLogoWhite from "./assets/cam-bom-automation-white.png";
import { useList } from "@refinedev/core";
import { dictationSupported, startDictation, stopDictation, useDictate } from "./dictation";
import Uppy from "@uppy/core";
import { CoverLetterEditor } from "./editor";
import { BomGrid } from "./bomgrid";
import { SKILLS, OUTPUTS, HOOK_LINE, type OutCard, type Skill } from "./data";
import { InputStandardisationReview } from "./review/InputStandardisationReview";
import { MastersApp } from "./masters/MastersApp";
import { loadRuns, saveRun, statusLabel, type RunStatus } from "./runs";

/* Provisional designs pending her wireframe sign-off: set either flag to false
   to revert that piece to the approved base look. Review panel switched on
   17 Nov 2026 - she asked for the approval gates to be wired in. */
const FEAT = { progressBar: false, reviewPanel: true };
const SwapIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M3 4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" />
    <path d="M15 16a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" />
    <path d="M21 11v-3a2 2 0 0 0 -2 -2h-6l3 3m0 -6l-3 3" />
    <path d="M3 13v3a2 2 0 0 0 2 2h6l-3 -3m0 6l3 -3" />
  </svg>
);
const SUPPORTED_UPLOAD_TYPES = [".xlsx", ".xls", ".csv", ".pdf", ".zip", ".gbr", ".ger", ".gtl", ".gbl", ".txt", ".dxf"];
const MAX_UPLOAD_FILES = 20;

type DemoFile = { name: string; status: "scanning" | "scanned" };

type AssistantPhase = "idle" | "running" | "review" | "done";

function getMockReply(question: string, files: DemoFile[], skill: Skill | null, phase: AssistantPhase, subIdx: number) {
  const q = question.toLowerCase();
  const stage = skill?.name ?? "";
  const stageIndex = skill?.n ?? 0;
  const hasFiles = files.length > 0;
  const count = files.length;
  const scanned = files.filter(f => f.status === "scanned").length;

  if (/file type|file format|extension|formats? can i upload|what can i upload/.test(q)) {
    return `Supported formats: ${SUPPORTED_UPLOAD_TYPES.join(", ")}.`;
  }
  if (/scan|virus|duplicate/.test(q)) {
    if (!hasFiles) return "No files have been uploaded.";
    return `${scanned} of ${count} files scanned${scanned < count ? `; ${count - scanned} still scanning` : ""}.`;
  }
  if (/what happens after upload|after upload|how.*start|start.*workflow/.test(q)) {
    return hasFiles
      ? "When all files finish scanning, select Start in the Output panel."
      : "Upload the RFQ package with Add files; then select Start in the Output panel.";
  }
  if (/supplier|vendor/.test(q)) {
    if (stageIndex < 4) return "Supplier replies are not available yet; Supplier RFQ/Quoting Tools has not run.";
    return "3 of 5 suppliers replied; the two enclosure vendors are pending.";
  }
  if (/risk|eol|end[- ]of[- ]life|lead.?time|buildable|bom/.test(q)) {
    if (stageIndex < 2 && phase !== "done") return "Feasibility & Risk has not run yet.";
    if (/buildable|can.*build/.test(q)) return "Mock feasibility result: buildable; the 0402 component size and 8 oven zones are supported.";
    if (/lead.?time|j2|connector/.test(q) && !/eol|end[- ]of[- ]life/.test(q)) return "J2 is a long-lead item with a 14-week lead time.";
    if (/eol|end[- ]of[- ]life/.test(q) && !/lead.?time|j2|connector/.test(q)) return "The EOL parts are U4 and U9.";
    return "2 EOL parts: U4 and U9. J2 has a 14-week lead time.";
  }
  if (/gap|drawing/.test(q)) {
    if (stageIndex < 1 && phase !== "done") return "Drawing extraction has not run yet.";
    return "2 input gaps are flagged from the drawing.";
  }
  if (/what needs .*review|review|approval|approve/.test(q)) {
    if (phase === "done") return "No review is pending; RFQ-1042 is complete.";
    if (phase === "review" && skill) return `${stage} is waiting for your review.`;
    if (phase === "running" && skill) return `No review is pending; ${stage} is running.`;
    return "No review is pending yet.";
  }
  if (/quote.*sent|sent.*quote|quote email/.test(q)) {
    if (phase === "done") return "Yes. The mock quote email was sent.";
    if (stageIndex === 10 && phase === "review") return "No. The quote is waiting for your approval.";
    return "No. The quote has not been sent yet.";
  }
  if (/quote|price|cost|total|amount/.test(q)) {
    if (/bom|internal cost/.test(q) && stageIndex >= 8) return "Mock costed BOM total: Rs 8,42,300.";
    if (stageIndex < 10 && phase !== "done") return "The sales quote is not ready yet.";
    if (/breakdown|build.?up|included/.test(q)) return "Mock quote: Rs 8,42,300 costed BOM, Rs 96,500 FAI/NRE/assembly, and Rs 61,200 taxes/buffers.";
    return "Mock client quote: Rs 10,00,000.";
  }
  if (/current output|what.*ready/.test(q)) {
    if (phase === "done") return "RFQ-1042 is complete.";
    if (!skill) return "No workflow is running yet.";
    const currentSub = skill.subs[Math.min(subIdx, skill.subs.length - 1)];
    return phase === "review" ? `Ready for review: ${stage} - ${currentSub.name}.` : `${stage} is running: ${currentSub.name}.`;
  }
  if (/summar|overview/.test(q)) {
    if (!hasFiles) return "No RFQ files have been uploaded.";
    const fileList = files.map(f => f.name).join(", ");
    return `Mock RFQ-1042 package: ${count} file${count === 1 ? "" : "s"} (${fileList}); ${scanned} scanned.`;
  }
  if (/progress|what.*running|current stage|current output|what.*ready/.test(q)) {
    if (phase === "done") return "RFQ-1042 is complete.";
    if (!skill) return "No workflow is running yet.";
    const currentSub = skill.subs[Math.min(subIdx, skill.subs.length - 1)];
    if (phase === "review") return `Ready for review: ${stage} - ${currentSub.name}.`;
    return `${stage} is running.`;
  }
  if (/what.*next|next step/.test(q)) {
    if (phase === "done") return "There is no next step; RFQ-1042 is complete.";
    if (phase === "review" && skill) return `Review ${stage} to continue.`;
    return skill ? `${stage} is in progress.` : "Upload the RFQ package to begin.";
  }
  if (/uploaded files|which files|what files (are )?(uploaded|received)|file status/.test(q)) {
    return hasFiles ? files.map(f => `${f.name}: ${f.status}`).join("; ") : "No files have been uploaded.";
  }
  return "I don't have a mock answer for that question.";
}

function getPromptSuggestions(question: string, files: DemoFile[], skill: Skill | null, phase: AssistantPhase) {
  const q = question.toLowerCase();
  if (/risk|eol|end[- ]of[- ]life|lead.?time|buildable|bom/.test(q)) {
    return ["Which parts are EOL?", "What's J2's lead time?", "Is the RFQ buildable?"];
  }
  if (/supplier|vendor/.test(q)) return ["Which suppliers are pending?", "What is the current stage?", "What needs review?"];
  if (/quote|price|cost|total|amount/.test(q)) return ["Show quote breakdown", "What is the client quote?", "Was the quote sent?"];
  if (/review|approval|approve|gap|drawing/.test(q)) return ["What output is ready?", "What are the drawing gaps?", "What's next after review?"];
  if (/scan|virus|duplicate|file|upload|format|extension/.test(q)) return ["Show scan status", "What file formats can I upload?", "What happens after upload?"];
  if (/summar|overview/.test(q)) return ["Check BOM risks", "Show scan status", "What needs review?"];
  if (phase === "done") return ["Show quote breakdown", "What is the client quote?", "Summarize the RFQ"];
  if (phase === "review") return ["What needs my review?", "Summarize current output", "What's next after approval?"];
  if (phase === "running") return ["What's running now?", "What output is ready?", "What's next?"];
  if (skill) return ["What is the current stage?", "What output is ready?", "What needs review?"];
  if (files.length) return ["Summarize RFQ-1042", "Check BOM risks", "Show scan status"];
  return ["What file formats can I upload?", "What happens after upload?", "How do I start the workflow?"];
}

const ICONS: Record<string, any> = {
  inbox: IconInbox, scan: IconScan, gauge: IconGauge, truck: IconTruck,
  send: IconSend, database: IconDatabase, clipcheck: IconClipboardCheck,
  sheet: IconFileSpreadsheet, chart: IconChartBar, mail: IconMail,
  table: IconTable, link: IconLink, message: IconMessage, edit: IconPencil,
};

type Phase = "idle" | "running" | "review" | "done";
interface Msg { who: "ai" | "me"; text: string }

// Chat lines when the Skill 1 review opens (same wording as the approved wireframe).
const REVIEW1_CHAT: Msg[] = [
  { who: "ai", text: "All three files are read and the scrub BOM is standardised. The review is open in the Output pane." },
  { who: "ai", text: "One thing needs you: Inventory Stock is empty on every row. Supply the values, or confirm zero, and that check clears." },
];

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
  const [theme, setTheme] = useState<"light" | "dark">(() => new URLSearchParams(location.search).get("theme") === "dark" ? "dark" : "light");
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem("cam-rfq-demo-auth") === "true" || new URLSearchParams(location.search).has("demo"));
  // Goal entry (approved 13 Nov 2026 wireframes): shown after login until a goal is sent. Demo/screenshot URLs
  // (?demo=, ?uploaded) skip it so those states keep working unchanged.
  const [goalText, setGoalText] = useState<string | null>(null);
  const skipGoalEntry = new URLSearchParams(location.search).has("demo") || new URLSearchParams(location.search).has("uploaded");
  const sendGoal = (text: string) => {
    setGoalText(text);
    setMsgs([{ who: "me", text }]);
  };
  const [skillIdx, setSkillIdx] = useState(-1);
  const [subIdx, setSubIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  // Empty-chat greeting: the BuLL floats in the top centre (BAM_UI orb treatment) and fades away on the first message.
  const chatEmpty = msgs.length === 0;
  const wasChatEmpty = useRef(chatEmpty);
  const [greetLeaving, setGreetLeaving] = useState(false);
  useEffect(() => {
    if (wasChatEmpty.current && !chatEmpty) setGreetLeaving(true);
    wasChatEmpty.current = chatEmpty;
  }, [chatEmpty]);
  useEffect(() => {
    if (!greetLeaving) return;
    const t = setTimeout(() => setGreetLeaving(false), 320);
    return () => clearTimeout(t);
  }, [greetLeaving]);
  const [files, setFiles] = useState<{ name: string; status: "scanning" | "scanned" }[]>([]);
  // Uppy manages the picked files (same library BAM_UI uses for intake). The pickers
  // are real - the names listed are the files the user actually chose. Nothing is
  // uploaded anywhere: there is no backend in this demo build, so the scan marks
  // below are simulated intake statuses, not a real antivirus scan.
  const uppy = useMemo(() => new Uppy({
    id: "rfq-intake",
    restrictions: { maxNumberOfFiles: MAX_UPLOAD_FILES, allowedFileTypes: SUPPORTED_UPLOAD_TYPES },
  }), []);
  const afWrap = useRef<HTMLDivElement>(null);
  const folderPick = useRef<HTMLInputElement>(null);
  const bulkPick = useRef<HTMLInputElement>(null);
  const zipPick = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onAdded = (f: { name?: string }) => {
      const name = f.name || "file";
      setFiles(fs => fs.some(x => x.name === name) ? fs : [...fs, { name, status: "scanning" }]);
      setTimeout(() => setFiles(fs => fs.map(x => x.name === name ? { ...x, status: "scanned" } : x)), 800 + Math.random() * 900);
    };
    uppy.on("file-added", onAdded);
    return () => { uppy.off("file-added", onAdded); };
  }, [uppy]);
  const addPicked = (list: FileList | File[] | null) => {
    setAfOpen(false);
    setUploadModal(null);
    setDropOver(false);
    if (!list || list.length === 0) return;
    const before = uppy.getFiles().length;
    Array.from(list).forEach(f => { try { uppy.addFile({ name: f.name, type: f.type, data: f, source: "AddFilesMenu" }); } catch { /* duplicate or restricted */ } });
    const added = uppy.getFiles().length - before;
    const total = list.length;
    const skipped = total - added;
    // Intake results belong with the file list, not in the chat: the assistant
    // answers asked questions only.
    setUploadNote(skipped > 0
      ? `Added ${added} of ${total} picked files. ${skipped} skipped - intake accepts up to ${MAX_UPLOAD_FILES} files at once and only these types: ${SUPPORTED_UPLOAD_TYPES.join(", ")}. Files already in the list are not added twice.`
      : "");
  };
  // Demo states for screenshots: ?demo=running|review|final
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("uploaded")) {
      const names = ["BOM_RFQ-1042.xlsx", "Bracket_drawing.pdf", "Gerbers_RFQ-1042.zip"];
      setFiles(names.map(name => ({ name, status: "scanned" as const })));
    }
    const d = params.get("demo");
    if (!d) return;
    const map: Record<string, number> = { running: 4, review: 9, final: 9, bom: 7, review1: 0 };
    const i = map[d] ?? 4;
    setSkillIdx(i); setSubIdx(d === "running" || d === "bom" ? 2 : 3); setExpanded(i);
    setPhase(d === "running" || d === "bom" ? "running" : d === "final" ? "done" : "review");
    if (d === "review1") setMsgs(REVIEW1_CHAT);
  }, []);
  const [draft, setDraft] = useState("");
  const [uploadNote, setUploadNote] = useState("");
  const [runStart, setRunStart] = useState<{ t: number; files: string[] } | null>(null);
  const [runsOpen, setRunsOpen] = useState(false);
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const dic = useDictate();
  const listening = dic.phase === "listening" || dic.phase === "requesting";
  const elapsed = dic.startedAt ? `${Math.floor((Date.now() - dic.startedAt) / 60000)}:${String(Math.floor((Date.now() - dic.startedAt) / 1000) % 60).padStart(2, "0")}` : "0:00";
  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") stopDictation(); };
    window.addEventListener("keydown", onKey);
    const t = setInterval(() => setDraft(d => d), 500); // tick the timer display
    return () => { window.removeEventListener("keydown", onKey); clearInterval(t); };
  }, [listening]);
  const [railMini, setRailMini] = useState(() => new URLSearchParams(location.search).has("mini"));
  const [assistantCollapsed, setAssistantCollapsed] = useState(false);
  const [paneOrder, setPaneOrder] = useState<string[]>(["rail", "mid", "right"]);
  const swapPane = (id: string) => setPaneOrder(o => {
    const i = o.indexOf(id);
    const next = [...o];
    if (i === 0) { next.push(next.shift()!); } // leftmost wraps to the far right; the rest shift one left
    else { [next[i - 1], next[i]] = [next[i], next[i - 1]]; }
    return next;
  });
  const paneCols = paneOrder.map((id, i) =>
    (id === "rail" && railMini) || (id === "mid" && assistantCollapsed) ? "56px" : `minmax(0, ${[20, 40, 40][i]}fr)`).join(" ");
  const [afOpen, setAfOpen] = useState(() => new URLSearchParams(location.search).has("af"));
  const [uploadModal, setUploadModal] = useState<null | "folder" | "files" | "zip">(null);
  const [dropOver, setDropOver] = useState(false);
  // Close the Add files menu only on a real outside press: the menu floats 4px
  // below the wrap, so a hover-leave would close it mid-move before the click lands.
  useEffect(() => {
    if (!afOpen) return;
    const onDocDown = (e: MouseEvent) => { if (!afWrap.current?.contains(e.target as Node)) setAfOpen(false); };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [afOpen]);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const skill = skillIdx >= 0 ? skills[skillIdx] : null;
  const doneCount = phase === "done" ? skills.length : Math.max(0, skillIdx);
  const lastUserQuestion = [...msgs].reverse().find(m => m.who === "me")?.text ?? "";
  const promptSuggestions = getPromptSuggestions(lastUserQuestion, files, skill, phase);

  const [profileOpen, setProfileOpen] = useState(false);
  const [view, setView] = useState<"rfq" | "masters">("rfq");
  // Profile menu closes on outside click and Escape (BAM_UI profile-menu pattern).
  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest(".profile")) setProfileOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setProfileOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [profileOpen]);
  const signInToDemo = () => {
    sessionStorage.setItem("cam-rfq-demo-auth", "true");
    setAuthenticated(true);
  };
  const signOutOfDemo = () => {
    sessionStorage.removeItem("cam-rfq-demo-auth");
    setGoalText(null);
    setAuthenticated(false);
  };

  // Only the initial Start action and final quote approval are human-gated.
  useEffect(() => {
    if (phase !== "running" || !skill) return;
    const t = setTimeout(() => {
      if (subIdx < skill.subs.length - 1) {
        setSubIdx(subIdx + 1);
      } else if (skill.n === 1) {
        // Skill 1 gate: the Input standardisation review (approved wireframe)
        // must be approved before the hook passes the package to Skill 2.
        setPhase("review");
        setMsgs(m => [...m, ...REVIEW1_CHAT]);
      } else if (skillIdx < skills.length - 1) {
        setSkillIdx(skillIdx + 1);
        setSubIdx(0);
        setExpanded(skillIdx + 1);
      } else {
        setPhase("review");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [phase, subIdx, skillIdx]);

  const startRun = () => {
    setRunStart({ t: Date.now(), files: files.map(f => f.name) });
    setRejectOpen(false); setRejectNote("");
    setSkillIdx(0); setSubIdx(0); setPhase("running"); setExpanded(0);
  };

  const recordRun = (status: RunStatus, note?: string) => {
    saveRun({
      id: String(Date.now()),
      rfq: "RFQ-1042",
      startedAt: runStart?.t ?? Date.now(),
      endedAt: Date.now(),
      status,
      note,
      files: runStart?.files ?? files.map(f => f.name),
      reachedSkill: status === "stopped" ? Math.max(1, skillIdx + 1) : skills.length,
    });
    setRunStart(null);
  };

  const resetRun = () => { setPhase("idle"); setSkillIdx(-1); setSubIdx(0); setExpanded(null); };

  const approve = () => {
    if (!skill || phase !== "review") return;
    if (skill.n === 1) {
      // Skill 1 approved: the hook fires and the run continues with Feature Extraction.
      setMsgs(m => [...m, { who: "ai", text: HOOK_LINE(skill.name, skills[skillIdx + 1].name) }]);
      setSkillIdx(skillIdx + 1); setSubIdx(0); setExpanded(skillIdx + 1); setPhase("running");
      return;
    }
    if (skillIdx !== skills.length - 1) return;
    recordRun("completed");
    setPhase("done");
  };

  const stopRun = () => {
    if (phase !== "running") return;
    recordRun("stopped");
    setMsgs(m => [...m, { who: "ai", text: "Run stopped. Nothing was sent - start it again any time." }]);
    resetRun();
  };

  const sendBack = (noteOverride?: string) => {
    if (phase !== "review") return;
    const note = (noteOverride ?? rejectNote).trim();
    recordRun("sent-back", note || undefined);
    setRejectOpen(false); setRejectNote("");
    const rework = skill?.n === 1
      ? "The package stays with Input Standardization for rework"
      : "The draft stays with Sales Quote for rework";
    setMsgs(m => [...m, { who: "ai", text: `Sent back${note ? ` with your note: "${note}"` : ""}. ${rework}; start the run again when ready.` }]);
    resetRun();
  };

  const sendChat = (suggestion?: string) => {
    const text = (suggestion ?? draft).trim();
    if (!text) return;
    const reply = getMockReply(text, files, skill, phase, subIdx);
    setMsgs(m => [...m, { who: "me", text }, { who: "ai", text: reply }]);
    setDraft("");
  };

  const subStatus = (j: number) =>
    skillIdx < 0 ? "wait" : j < subIdx ? "done" : j > subIdx ? "wait" : phase === "review" ? "review" : phase === "done" ? "done" : "run";

  if (!authenticated) {
    return <LoginPage theme={theme} onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} onSignIn={signInToDemo} />;
  }

  return (
    <div className="app">
      {view === "rfq" && (
      <header className="top">
        <img className="wm-logo" src={theme === "light" ? camLogoBlack : camLogoWhite} alt="CAM BOM Automation" />
        <div className="top-right">
          <button className="demo-chip as-btn" onClick={() => { setRunsOpen(true); setOpenRunId(null); }}><IconHistory size={13} /> Runs</button>
          <span className="demo-chip">Demo - mock data, no backend</span>
          <button className="iconbtn" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Toggle theme">
            {theme === "light" ? <IconMoon size={16} /> : <IconSun size={16} />}
          </button>
          <div className="profile">
            <button className="avatar" onClick={() => setProfileOpen(o => !o)} aria-haspopup="menu" aria-expanded={profileOpen} aria-label="Profile" title="Profile">P</button>
            {profileOpen && (
              <div className="profile-menu" role="menu">
                {view === "rfq" ? (
                  <button className="profile-item" role="menuitem" onClick={() => { setProfileOpen(false); setView("masters"); }}>
                    <IconDatabase size={15} /> Masters
                  </button>
                ) : (
                  <button className="profile-item" role="menuitem" onClick={() => { setProfileOpen(false); setView("rfq"); }}>
                    <IconBolt size={15} /> RFQ automation
                  </button>
                )}
                <button className="profile-item" role="menuitem" onClick={() => { setProfileOpen(false); signOutOfDemo(); }}>
                  <IconLogout size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      )}

      {view === "masters" ? <MastersApp dark={theme === "dark"} onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} onBack={() => setView("rfq")} /> : (
      <div className={"main" + (assistantCollapsed ? " assistant-collapsed" : "")} style={{ gridTemplateColumns: paneCols }}>
        {/* LEFT RAIL - workflow (BAM_UI look) */}
        <section className={"pane rail" + (railMini ? " mini" : "")} style={{ order: paneOrder.indexOf("rail") }}>
          <div className="rail-h">
            {!railMini && <button className="iconbtn sm pane-swap" onClick={() => swapPane("rail")} aria-label="Swap the workflow pane one place left" title="Swap pane left"><SwapIcon /></button>}
            {!railMini && <h2>Agent - RFQ Automation</h2>}
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
            <div ref={afWrap} className={"af-wrap" + (afOpen ? " open" : "")}>
              <button className="af-btn" aria-haspopup="menu" aria-expanded={afOpen} onClick={() => setAfOpen(!afOpen)}>
                <IconPlus size={14} /> Add files
              </button>
              <div className="af-menu" role="menu" aria-label="Add files">
                <button role="menuitem" className="af-item" onClick={() => { setAfOpen(false); setUploadModal("folder"); }}><IconFolder size={16} /> Choose folder</button>
                <button role="menuitem" className="af-item" onClick={() => { setAfOpen(false); setUploadModal("files"); }}><IconFiles size={16} /> Bulk upload</button>
                <button role="menuitem" className="af-item" onClick={() => { setAfOpen(false); setUploadModal("zip"); }}><IconFileZip size={16} /> Upload zip</button>
                <input ref={folderPick} type="file" multiple hidden {...({ webkitdirectory: "" } as object)} onChange={e => { addPicked(e.target.files); e.target.value = ""; }} />
                <input ref={bulkPick} type="file" multiple hidden onChange={e => { addPicked(e.target.files); e.target.value = ""; }} />
                <input ref={zipPick} type="file" accept=".zip,application/zip" hidden onChange={e => { addPicked(e.target.files); e.target.value = ""; }} />
              </div>
            </div>

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
              const st = isDone ? "" : i === skillIdx
                ? phase === "review" ? "Final approval required" : `In progress - ${subIdx + 1} of ${s.subs.length} sub-skills`
                : "Waiting";
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
                        const isHuman = (s.n === 1 && j === 0) || (s.n === 10 && j === s.subs.length - 1);
                        return (
                          <div key={sub.id} className={"sub-row" + (ss === "done" ? " done" : ss === "run" || ss === "review" ? " act" : "")}>
                            <span className="sd" />{sub.name}
                            <span className="mode">{ss === "done" && <span className="done-tick"><IconCircleCheckFilled size={14} /></span>}<span className="mode-icon">{isHuman ? <IconUser size={14} /> : <img className="bull" src={bullHead} alt="Automated" />}</span></span>
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
          </>
          )}
        </section>

        {/* MIDDLE - assistant chat */}
        <section className={"pane mid" + (assistantCollapsed ? " collapsed" : "")} style={{ order: paneOrder.indexOf("mid") }}>
          {assistantCollapsed ? (
            <div className="assistant-rail-head">
              <button className="assistant-show" onClick={() => setAssistantCollapsed(false)} aria-expanded={false} aria-label="Show assistant">
                <IconLayoutSidebarLeftExpand size={16} /><span>Show assistant</span>
              </button>
            </div>
          ) : (
          <>
          <div className="pane-h">
            <button className="iconbtn sm pane-swap" onClick={() => swapPane("mid")} aria-label="Swap the assistant pane one place left" title="Swap pane left"><SwapIcon /></button>
            <div className="assistant-title"><h2 className="assistant-heading">BuLLM assistant</h2></div>
            <button className="iconbtn sm assistant-hide" onClick={() => setAssistantCollapsed(true)} aria-expanded={true} aria-label="Hide assistant" title="Hide assistant">
              <IconLayoutSidebarLeftCollapse size={14} />
            </button>
          </div>
          <div className="pane-b">
            {chatEmpty && (
              <div className="chat-empty">
                <span className="ce-bull"><img src={bullHead} alt="" /></span>
                <h3 className="ce-hello">How can BuLLM help you today?</h3>
              </div>
            )}
            {greetLeaving && !chatEmpty && (
              <div className="chat-empty ce-leaving" aria-hidden="true">
                <span className="ce-bull"><img src={bullHead} alt="" /></span>
                <h3 className="ce-hello">How can BuLLM help you today?</h3>
              </div>
            )}
            {msgs.map((m, i) => (
              <Fragment key={i}>
                <div className={"msg " + m.who}>
                  <div><div className="who">{m.who === "ai" ? "Assistant" : "You"}</div><div className="b">{m.text}</div></div>
                </div>
                {i === 0 && m.who === "me" && goalText && (
                  <div className="msg ai">
                    <div><div className="who">Assistant</div><div className="b gd-b">
                      <GoalDraft tail={goalText.startsWith(GOAL_PREFIX) ? goalText.slice(GOAL_PREFIX.length) : goalText} />
                    </div></div>
                  </div>
                )}
              </Fragment>
            ))}
            <div ref={chatEnd} />
          </div>
          <div className="prompt-suggestions" role="group" aria-label="Suggested questions for this RFQ">
            {promptSuggestions.map(prompt => <button key={prompt} type="button" className="prompt-chip" onClick={() => sendChat(prompt)}>{prompt}</button>)}
          </div>
          <div className="composer">
            {listening ? (
              <div className="wave" aria-live="polite">
                {dic.levels.map((v, i) => <span key={i} className="wbar" style={{ height: `${6 + v * 24}px` }} />)}
                <span className="wave-t">{dic.phase === "requesting" ? "Requesting microphone..." : elapsed}</span>
              </div>
            ) : (
              <input className="in" value={draft} placeholder="Ask BuLLM"
                onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} />
            )}
            {dictationSupported && (
              <button className={"micb" + (listening ? " live" : "")} aria-label={listening ? "Stop dictation" : "Dictate"}
                onClick={() => listening ? stopDictation() : startDictation(draft, setDraft)}>
                {listening ? <IconPlayerStop size={18} /> : <IconMicrophone size={18} />}
              </button>
            )}
            <button className="sendb" onClick={() => sendChat()} aria-label="Send"><IconSend size={18} /></button>
          </div>
          {dic.phase === "blocked" && <div className="dict-hint">Microphone blocked - allow mic access in the browser to dictate, or type instead.</div>}
          {dic.error && <div className="dict-hint">{dic.error}</div>}
          </>
          )}
        </section>

        {/* RIGHT - steps output */}
        <section className="pane right" style={{ order: paneOrder.indexOf("right") }}>
          <div className="pane-h">
            <button className="iconbtn sm pane-swap" onClick={() => swapPane("right")} aria-label="Swap the output pane one place left" title="Swap pane left"><SwapIcon /></button>
            <IconBolt size={16} />
            <div><h2>Output</h2>
              <div className="sub">{skill ? `${skill.name} - ${skill.subs[Math.min(subIdx, skill.subs.length - 1)].name}${phase === "review" ? " (human)" : ""}` : "No skill running yet"}</div>
            </div>
          </div>
          <div className="pane-b">
            {!skill && (
              <>
                {files.length > 0 && (
                <div className="ocard">
                  <h3><span className="oi"><IconFileSpreadsheet size={15} /></span>Uploaded files</h3>
                  {uploadNote && <p className="upload-note">{uploadNote}</p>}
                  {files.map(f => (
                    <div className="orow" key={f.name}><IconFileSpreadsheet size={14} /><span className="n">{f.name}</span>
                      {f.status === "scanned"
                        ? <span className="m" style={{ color: "var(--blue)", display: "inline-flex", alignItems: "center" }} title="Scanned" role="img" aria-label="Scanned"><IconCircleCheckFilled size={15} /></span>
                        : <span className="m" style={{ color: "var(--ink2)" }}>Scanning...</span>}
                    </div>
                  ))}
                </div>
                )}
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
              if (FEAT.reviewPanel && phase === "review" && skill.n === 1) {
                // Skill 1 review: the right pane is the review output only (approved
                // wireframe) - earlier sub-skill progress stays visible in the left rail.
                if (j !== skill.subs.length - 1) return null;
                return (
                  <InputStandardisationReview key={sub.id}
                    hookLine={skill.hook}
                    onApprove={approve}
                    onRequestChanges={(note) => sendBack(note)} />
                );
              }
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
                      {!rejectOpen ? (
                        <button className="rbtn ghost" onClick={() => setRejectOpen(true)}><IconX size={16} /> Send back with note</button>
                      ) : (
                        <div className="reject-form">
                          <textarea className="reject-note" rows={2} placeholder="Note for the rework - what should change" value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)} aria-label="Note for the rework" />
                          <div className="reject-actions">
                            <button className="rbtn ghost" onClick={() => { setRejectOpen(false); setRejectNote(""); }}>Cancel</button>
                            <button className="rbtn reject" onClick={() => sendBack()}><IconX size={16} /> Send back</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              if (ss === "wait") return null;
              const chips: Record<string, string> = { run: "Running", wait: "Queued", review: "Review" };
              return (
                <div key={sub.id}>
                  {sub.steps.map((stp, k) => {
                    const st = ss === "done" ? "done" : ss === "review" ? (k === sub.steps.length - 1 ? "review" : "done") : k === 0 ? "run" : "wait";
                    return (
                      <div key={stp.name} className={"step" + (st === "done" ? " done" : st === "run" ? " run" : "")}>
                        <div className="si">{stp.mode === "human" ? <IconUser size={16} /> : <img className="bull" src={bullHead} alt="Automated" />}</div>
                        <div className="st-t"><div className="st-n">{stp.name}</div><div className="st-m">{stp.note}</div></div>
                        {st === "done" ? <span className="done-tick"><IconCircleCheckFilled size={20} /></span> : <span className={"chip " + st}>{chips[st]}</span>}
                      </div>
                    );
                  })}
                  {(OUTPUTS[sub.id] || []).map((c: OutCard) => (
                    <div className="ocard" key={c.title}>
                      <h3><span className="oi">{(() => { const I = ICONS[c.icon] || IconFileSpreadsheet; return <I size={15} />; })()}</span>{c.title}</h3>
                      {c.editor && <CoverLetterEditor content={c.editor} />}
                      {c.grid && <BomGrid dark={theme === "dark"} columns={c.grid.columns} rows={c.grid.rows} />}
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
                <div className="kv"><span className="k">Client quote</span><span className="v" style={{ color: "var(--blue)" }}>Rs 10,00,000</span></div>
              </div>
            )}
          </div>
          {!skill && phase === "idle" && files.length > 0 && files.every(f => f.status === "scanned") && (
            <div className="actionbar">
              <div className="hk">Files scanned. Input Standardization is ready.</div>
              <button className="abtn" onClick={startRun}><IconBolt size={16} /> Start</button>
            </div>
          )}
          {skill && phase !== "done" && !FEAT.reviewPanel && (
            <div className="actionbar">
              <div className="hk">{phase === "review" ? "Final approval required." : "Automated workflow - no intermediate approvals."}</div>
              {phase === "review" ? (
                <button className="abtn" onClick={approve}>
                  <IconCheck size={16} /> Approve and send quote
                </button>
              ) : (
                <button className="abtn stop" onClick={stopRun}><IconPlayerStop size={16} /> Stop run</button>
              )}
            </div>
          )}
          {skill && phase !== "done" && FEAT.reviewPanel && phase !== "review" && (
            <div className="actionbar">
              <div className="hk"><IconPlugConnected size={13} /> {skill.hook}</div>
              <button className="abtn stop" onClick={stopRun}><IconPlayerStop size={16} /> Stop run</button>
            </div>
          )}
        </section>
      </div>
      )}
      {uploadModal && (
        <div className="modal-veil" onClick={() => { setUploadModal(null); setDropOver(false); }}>
          <div className="modal" role="dialog" aria-label="Add files" onClick={e => e.stopPropagation()}>
            <div className="modal-h">
              <h3>{uploadModal === "folder" ? "Choose folder" : uploadModal === "zip" ? "Upload zip" : "Bulk upload"}</h3>
              <button className="iconbtn sm" onClick={() => setUploadModal(null)} aria-label="Close add files"><IconX size={14} /></button>
            </div>
            <div
              className={"up-drop" + (dropOver ? " over" : "")}
              onDragOver={e => { e.preventDefault(); setDropOver(true); }}
              onDragLeave={() => setDropOver(false)}
              onDrop={e => {
                e.preventDefault();
                const dropped = Array.from(e.dataTransfer.files);
                addPicked(uploadModal === "zip" ? dropped.filter(f => /\.zip$/i.test(f.name)) : dropped);
              }}
            >
              <IconFiles size={22} />
              <span>Drag and drop {uploadModal === "zip" ? "a zip file" : "files"} here</span>
              <span className="up-or">or</span>
              <button className="rbtn ghost up-browse" onClick={() => (uploadModal === "folder" ? folderPick : uploadModal === "zip" ? zipPick : bulkPick).current?.click()}>
                {uploadModal === "folder" ? "Browse folders" : "Browse files"}
              </button>
            </div>
            <p className="up-types">Allowed file types: {uploadModal === "zip" ? ".zip" : SUPPORTED_UPLOAD_TYPES.join(", ")}</p>
          </div>
        </div>
      )}
      {runsOpen && (() => {
        const runs = loadRuns();
        const openRun = runs.find(r => r.id === openRunId) || null;
        return (
        <div className="modal-veil" onClick={() => setRunsOpen(false)}>
          <div className="modal wide" role="dialog" aria-label="Run history" onClick={e => e.stopPropagation()}>
            <div className="modal-h">
              <h3>{openRun ? "Run trace" : "Run history"}</h3>
              <span className="demo-chip">Demo</span>
              {openRun && <button className="rbtn ghost" onClick={() => setOpenRunId(null)}>All runs</button>}
              <button className="iconbtn sm" onClick={() => setRunsOpen(false)} aria-label="Close run history"><IconX size={14} /></button>
            </div>
            {!openRun ? (
              runs.length === 0 ? (
                <p className="modal-sub">No runs yet. Start a run and it will be recorded here.</p>
              ) : runs.map(r => (
                <button className="mrow" key={r.id} onClick={() => setOpenRunId(r.id)}>
                  <span className="mi"><IconHistory size={16} /></span>
                  <div className="mt">
                    <div className="mn">{r.rfq} - {new Date(r.startedAt).toLocaleString()}</div>
                    <div className="ms">{Math.max(1, Math.round((r.endedAt - r.startedAt) / 1000))}s - {r.files.length} input file(s){r.note ? ` - note: ${r.note}` : ""}</div>
                  </div>
                  <span className={"chip st-" + r.status}>{statusLabel(r.status)}</span>
                </button>
              ))
            ) : (
              <div className="trace">
                <p className="modal-sub"><IconEye size={13} /> View only - what the agents read, decided and did in this run.</p>
                <div className="trace-row"><span className="tk">Outcome</span><span className={"chip st-" + openRun.status}>{statusLabel(openRun.status)}</span></div>
                {openRun.note && <div className="trace-row"><span className="tk">Your note</span><span>{openRun.note}</span></div>}
                <div className="trace-row"><span className="tk">Read</span><span>{openRun.files.length ? openRun.files.join(", ") : "No input files recorded"}</span></div>
                {skills.map((s, i) => {
                  const reached = i < openRun.reachedSkill;
                  return (
                    <div className={"trace-skill" + (reached ? "" : " dim")} key={s.n}>
                      <div className="ts-h">{reached ? <IconCircleCheckFilled size={14} /> : <IconX size={14} />} {s.name}{!reached && " - not reached"}</div>
                      {reached && s.subs.map(sub => (
                        <div className="ts-sub" key={sub.id}>
                          <div className="ts-sn">{sub.id} {sub.name}</div>
                          {sub.steps.map(st => (
                            <div className="ts-step" key={st.name}>
                              {st.mode === "human" ? <IconUser size={13} /> : <img src={bullHead} alt="" />}
                              <span>{st.name}</span>
                              <span className="ts-note">{st.note}</span>
                            </div>
                          ))}
                          {(OUTPUTS[sub.id] || []).map((c: OutCard) => (
                            <div className="ts-out" key={c.title}>Output: {c.title}{c.rows ? " - " + c.rows.map(x => `${x.k}: ${x.v}`).join(", ") : ""}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        );
      })()}
    </div>
  );
}
