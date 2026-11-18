// Skill 1 - Input standardisation review screen (approved wireframe, 18 Nov 2026).
// Lives entirely in the RIGHT output pane; the middle pane stays the chat.
// All rows below are invented representative data (same set as the approved
// wireframe deck) - no real client file is read, and nothing here claims a
// real scan, parse or CRM registration happened.
import { useState } from "react";
import {
  IconAlertTriangle, IconCheck, IconCircleCheckFilled, IconFileSpreadsheet,
  IconInfoCircle, IconPlugConnected,
} from "@tabler/icons-react";

/* ---------- invented representative data (approved wireframe) ---------- */

const FILES = [
  { name: "ECU_scrub_BOM_14-Mar-25.xlsx", tag: "recognised", tone: "ok" as const },
  { name: "awards_part_listing_5570.xlsx", tag: "reference", tone: "info" as const },
  { name: "ECU_costing_sheet.xlsx", tag: "reference", tone: "info" as const },
];

type BomRow =
  | { band: true; depth: 0 | 1; label: string }
  | { band: false; cpn: string; caseFlag?: boolean; desc: string; mfr: string; mpn: string; commodity: string; qty: string };

const BOM_ROWS: BomRow[] = [
  { band: true, depth: 0, label: "ECU_MB — EV Charger Main Board · finished good" },
  { band: true, depth: 1, label: "ECU_MB-PWR — Power-stage assembly" },
  { band: false, cpn: "RC0603FR-0710KL", caseFlag: true, desc: "Resistor 10 kΩ", mfr: "Yageo", mpn: "RC0603FR-0710KL", commodity: "Resistor", qty: "4" },
  { band: false, cpn: "GRM188R71H104K", desc: "Capacitor 100 nF", mfr: "Murata", mpn: "GRM188R71H104K", commodity: "Capacitor", qty: "6" },
  { band: false, cpn: "2N7002BK", desc: "MOSFET N-ch", mfr: "Nexperia", mpn: "2N7002BK", commodity: "Transistor", qty: "2" },
  { band: true, depth: 1, label: "ECU_MB-HOUSING — Enclosure assembly" },
  { band: false, cpn: "ECU_MB-ESD Cover", caseFlag: true, desc: "ESD cover, main", mfr: "ProPlast", mpn: "ABS-ESD-104", commodity: "Mechanical", qty: "1" },
  { band: true, depth: 0, label: "ECU_SB — EV Charger Sub Board · finished good" },
  { band: false, cpn: "ECU_SB-CBL-01", desc: "Ribbon cable", mfr: "CablTech", mpn: "CT-RB12-300", commodity: "Cable", qty: "1" },
];

const VOLUMES = [
  { fg: "ECU_MB", v1: "1,000", v2: "1,000" },
  { fg: "ECU_SB", v1: "1,000", v2: "1,000" },
];
const BATCHES = [
  { fg: "ECU_MB", batch: "250" },
  { fg: "ECU_SB", batch: "250" },
];
const MAPPING = [
  { col: "CPN", reads: "Client part number", check: "Present on every row", flag: false },
  { col: "MPN", reads: "Manufacturer part no.", check: "Present on every row", flag: false },
  { col: "Quantity", reads: "Quantity per FG", check: "All values numeric", flag: false },
  { col: "Inventory Stock", reads: "Inventory stock", check: "Empty on all rows — flagged", flag: true },
];

const AWARDS = [
  { pn: "RC0603FR-0710KL", price: "$0.0021", curr: "USD", supplier: "Asia Components", vol: "V1–V2", date: "02-Jun-25" },
  { pn: "GRM188R71H104K", price: "$0.0085", curr: "USD", supplier: "Murata Distribution", vol: "V1–V2", date: "02-Jun-25" },
  { pn: "2N7002BK", price: "$0.0410", curr: "USD", supplier: "SemiSource Europe", vol: "V1–V2", date: "30-May-25" },
  { pn: "ABS-ESD-104", price: "$1.8200", curr: "USD", supplier: "ProPlast", vol: "V1", date: "28-May-25" },
  { pn: "CT-RB12-300", price: "$0.9600", curr: "USD", supplier: "CablTech", vol: "V1", date: "28-May-25" },
];
const NO_AWARD = { pn: "LBL-44-ROLL" };

const COSTING = [
  { pn: "RC0603FR-0710KL", desc: "Resistor 10 kΩ", caseFlag: false },
  { pn: "GRM188R71H104K", desc: "Capacitor 100 nF", caseFlag: false },
  { pn: "2N7002BK", desc: "MOSFET N-ch", caseFlag: false },
  { pn: "ECU_MB-ESD COVER", desc: "ESD cover, main", caseFlag: true },
];

/* ---------- checks ---------- */

type CheckId = "stock" | "case";
type Resolution = { choice: string } | null;

/* ---------- component ---------- */

type Tab = "scrub" | "settings" | "batch" | "awards" | "costing" | "checks";

export function InputStandardisationReview({
  hookLine,
  onApprove,
}: {
  hookLine: string;
  onApprove: () => void;
}) {
  // ?isrtab=checks etc. opens a tab directly; ?isrresolved pre-resolves both
  // checks (screenshot/demo states).
  const [tab, setTab] = useState<Tab>(() => (new URLSearchParams(location.search).get("isrtab") as Tab) || "scrub");
  const demoResolved = new URLSearchParams(location.search).has("isrresolved");
  const [stock, setStock] = useState<Resolution>(demoResolved ? { choice: "zero confirmed for all rows" } : null);
  const [caseMatch, setCaseMatch] = useState<Resolution>(demoResolved ? { choice: "normalise case when matching" } : null);
  const [resolving, setResolving] = useState<CheckId | null>(null);

  const unresolved = (stock ? 0 : 1) + (caseMatch ? 0 : 1);
  const allResolved = unresolved === 0;
  const blockReason = !stock
    ? "Approve stays unavailable until Inventory Stock is resolved — supply values or confirm zero."
    : !caseMatch
      ? "Approve stays unavailable until the case-matching decision is made."
      : "";

  const tabs: { id: Tab; label: React.ReactNode }[] = [
    { id: "scrub", label: "Scrub BOM" },
    { id: "settings", label: "Settings" },
    { id: "batch", label: "Batch" },
    { id: "awards", label: "Awards · ref" },
    { id: "costing", label: "Costing · ref" },
    { id: "checks", label: <>Checks{unresolved > 0 && <span className="isr-tab-badge">{unresolved}</span>}</> },
  ];

  const resolve = (id: CheckId, choice: string) => {
    if (id === "stock") setStock({ choice }); else setCaseMatch({ choice });
    setResolving(null);
  };

  return (
    <div className="isr">
      {/* selected-input context: the three files this review was built from */}
      <div className="isr-files">
        {FILES.map(f => (
          <div className="isr-file" key={f.name}>
            <IconFileSpreadsheet size={15} />
            <span className="isr-file-n">{f.name}</span>
            <span className={"isr-file-tag " + f.tone}>{f.tag}</span>
          </div>
        ))}
      </div>

      <div className="isr-tabs" role="tablist" aria-label="Review output">
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            className={"isr-tab" + (tab === t.id ? " act" : "") + (t.id === "checks" && unresolved > 0 && tab !== "checks" ? " warn" : "")}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="isr-body">
        {tab === "scrub" && (
          <>
            <div className="isr-banner warn">
              <IconAlertTriangle size={15} />
              <span>Inventory Stock is empty on every row — mandatory per the input instructions. Blanks are never auto-filled.</span>
            </div>
            <div className="isr-scroll"><table className="isr-table">
              <thead>
                <tr><th>CPN</th><th>Description</th><th>Manufacturer</th><th>MPN</th><th>Commodity</th><th className="r">Qty</th><th className="c">Inv. Stock</th></tr>
              </thead>
              <tbody>
                {BOM_ROWS.map((r, i) => r.band ? (
                  <tr key={i} className={"band d" + r.depth}>
                    <td colSpan={7}>{r.depth === 0 ? "▾ " : "▸ "}{r.label}</td>
                  </tr>
                ) : (
                  <tr key={i}>
                    <td className="mono">{r.cpn}{r.caseFlag && <span className="isr-flag" title="Matches the costing sheet only when case is ignored"> ●</span>}</td>
                    <td>{r.desc}</td>
                    <td>{r.mfr}</td>
                    <td className="mono">{r.mpn}</td>
                    <td>{r.commodity}</td>
                    <td className="mono r">{r.qty}</td>
                    <td className="c"><span className="isr-chip miss">missing</span></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <p className="isr-note"><span className="isr-flag">●</span> = case-match flag (see Checks). &nbsp;‘missing’ = no value in the file; a confirmed zero shows 0.</p>
          </>
        )}

        {tab === "settings" && (
          <>
            <p className="isr-cap">Volume quantities, read straight from the uploaded tab.</p>
            <div className="isr-card">
              <div className="isr-card-t">SETTINGS TAB — VOLUMES</div>
              <div className="isr-scroll"><table className="isr-table">
                <thead><tr><th>Finished good</th><th className="r">V1 Qty</th><th className="r">V2 Qty</th></tr></thead>
                <tbody>{VOLUMES.map(v => <tr key={v.fg}><td className="mono">{v.fg}</td><td className="mono r">{v.v1}</td><td className="mono r">{v.v2}</td></tr>)}</tbody>
              </table></div>
            </div>
            <div className="isr-card">
              <div className="isr-card-t">FIELD MAPPING — HOW UPLOADED COLUMNS WERE READ</div>
              <div className="isr-scroll"><table className="isr-table">
                <thead><tr><th>Uploaded column</th><th>Reads as</th><th>Check</th></tr></thead>
                <tbody>{MAPPING.map(m => (
                  <tr key={m.col}>
                    <td className="mono">{m.col}{m.flag && <span className="isr-flag"> ●</span>}</td>
                    <td>{m.reads}</td>
                    <td className={m.flag ? "isr-warn-txt" : undefined}>{m.check}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            </div>
          </>
        )}

        {tab === "batch" && (
          <>
            <p className="isr-cap">Batch size per finished good, read straight from the uploaded tab.</p>
            <div className="isr-card">
              <div className="isr-card-t">BATCH TAB — BATCH SIZE</div>
              <div className="isr-scroll"><table className="isr-table">
                <thead><tr><th>Finished good</th><th className="r">Batch Qty</th></tr></thead>
                <tbody>{BATCHES.map(b => <tr key={b.fg}><td className="mono">{b.fg}</td><td className="mono r">{b.batch}</td></tr>)}</tbody>
              </table></div>
            </div>
          </>
        )}

        {tab === "awards" && (
          <>
            <div className="isr-banner info">
              <IconInfoCircle size={15} />
              <span>Read-only reference — award prices exactly as uploaded, never silently merged into the scrub BOM.</span>
            </div>
            <div className="isr-scroll"><table className="isr-table">
              <thead>
                <tr><th>Part Number</th><th className="r">Award price</th><th>Curr.</th><th>Supplier</th><th>Volume</th><th>Award date</th></tr>
              </thead>
              <tbody>
                {AWARDS.map(a => (
                  <tr key={a.pn}>
                    <td className="mono">{a.pn}</td><td className="mono r">{a.price}</td><td className="mono">{a.curr}</td>
                    <td>{a.supplier}</td><td>{a.vol}</td><td className="mono">{a.date}</td>
                  </tr>
                ))}
                <tr>
                  <td className="mono">{NO_AWARD.pn}<span className="isr-flag"> ●</span></td>
                  <td colSpan={5}><span className="isr-chip info">no award yet</span></td>
                </tr>
              </tbody>
            </table></div>
            <p className="isr-note"><span className="isr-flag">●</span> = no existing award price. Informational here — fresh quotes come later, in Skills 5–6.</p>
          </>
        )}

        {tab === "costing" && (
          <>
            <div className="isr-banner info">
              <IconInfoCircle size={15} />
              <span>Read-only reference — costing values exactly as uploaded, never silently merged into the scrub BOM.</span>
            </div>
            <div className="isr-scroll"><table className="isr-table">
              <thead><tr><th>Part Number</th><th>Description</th></tr></thead>
              <tbody>{COSTING.map(c => (
                <tr key={c.pn}>
                  <td className="mono">{c.pn}{c.caseFlag && <span className="isr-flag"> ●</span>}</td>
                  <td>{c.desc}</td>
                </tr>
              ))}</tbody>
            </table></div>
            <p className="isr-note"><span className="isr-flag">●</span> = differs from the scrub BOM only by letter case (see Checks).</p>
          </>
        )}

        {tab === "checks" && (
          <>
            <p className="isr-cap">Resolve each flagged check, then approve. Flags name the file, sheet and column they come from.</p>

            <div className={"isr-check" + (stock ? " resolved" : "")}>
              <div className="isr-check-h">
                {stock ? <IconCircleCheckFilled size={16} /> : <IconAlertTriangle size={16} />}
                <h4>{stock ? "Inventory Stock — resolved" : "Inventory Stock empty — blocks approval"}</h4>
              </div>
              <p>Mandatory per the input instructions, but blank on every row of the scrub BOM (SCRUB BOM tab, Inventory Stock column). Supply the stock values, or explicitly confirm zero; blanks are never auto-filled.</p>
              {stock ? (
                <div className="isr-resolved-line">
                  <span>Decision: {stock.choice}.</span>
                  <button className="isr-link" onClick={() => { setStock(null); }}>Change</button>
                </div>
              ) : resolving === "stock" ? (
                <div className="isr-resolve-opts">
                  <button className="isr-opt" onClick={() => resolve("stock", "zero confirmed for all rows")}>Confirm zero for all rows</button>
                  <button className="isr-opt" onClick={() => resolve("stock", "stock values to be supplied in a corrected file")}>I will supply stock values</button>
                  <button className="isr-link" onClick={() => setResolving(null)}>Cancel</button>
                </div>
              ) : (
                <button className="isr-resolve" onClick={() => setResolving("stock")}>Resolve</button>
              )}
            </div>

            <div className={"isr-check" + (caseMatch ? " resolved" : "")}>
              <div className="isr-check-h">
                {caseMatch ? <IconCircleCheckFilled size={16} /> : <IconAlertTriangle size={16} />}
                <h4>{caseMatch ? "Case-only part match — decided" : "Case-only part match — needs a decision"}</h4>
              </div>
              <p>Costing sheet (part Number column) lists ‘ECU_MB-ESD COVER’; the scrub BOM (CPN column) has ‘ECU_MB-ESD Cover’. Exact match finds none; ignoring case finds all. Choose: normalise case at intake, or correct the source file.</p>
              {caseMatch ? (
                <div className="isr-resolved-line">
                  <span>Decision: {caseMatch.choice}.</span>
                  <button className="isr-link" onClick={() => { setCaseMatch(null); }}>Change</button>
                </div>
              ) : resolving === "case" ? (
                <div className="isr-resolve-opts">
                  <button className="isr-opt" onClick={() => resolve("case", "normalise case when matching")}>Normalise case when matching</button>
                  <button className="isr-opt" onClick={() => resolve("case", "correct the source file")}>Correct the source file</button>
                  <button className="isr-link" onClick={() => setResolving(null)}>Cancel</button>
                </div>
              ) : (
                <button className="isr-resolve" onClick={() => setResolving("case")}>Resolve</button>
              )}
            </div>

            <p className="isr-note dim">
              The case rule in the input instructions covers sheet and column names — how to match these part values is a review decision, not an error.
            </p>
          </>
        )}
      </div>

      {/* fixed action bar */}
      <div className="isr-bar">
        <div className={"isr-bar-msg" + (allResolved ? " ok" : "")}>
          {allResolved
            ? <><IconPlugConnected size={14} /><span>{hookLine}</span></>
            : <><IconAlertTriangle size={14} /><span>{blockReason}</span></>}
        </div>
        <div className="isr-bar-actions">
          <div className="isr-approve-wrap">
            <button className={"abtn isr-approve" + (allResolved ? "" : " off")} disabled={!allResolved}
              title={allResolved ? undefined : "Resolve the flagged checks first"}
              onClick={() => allResolved && onApprove()}>
              <IconCheck size={16} /> Approve → Skill 2
            </button>
            {!allResolved && <div className="isr-approve-why">resolve flagged check{unresolved > 1 ? "s" : ""} first</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
