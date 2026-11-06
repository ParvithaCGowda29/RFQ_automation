// Workflow content from "CAM 4.0 RFQ automation in BAM: 10 skills, sub-skills and steps"
// (her working note, 17/19 Oct 2026). Mode: human = a person must act; auto = automated.
// Front-end mock data only - no backend is connected.

export type Mode = "human" | "auto";
export interface Step { name: string; note: string; mode: Mode }
export interface SubSkill { id: string; name: string; steps: Step[] }
export interface Skill { n: number; name: string; icon: string; hook: string; subs: SubSkill[] }

const A = (name: string, note: string): Step => ({ name, note, mode: "auto" });
const H = (name: string, note: string): Step => ({ name, note, mode: "human" });

export const SKILLS: Skill[] = [
  { n: 1, name: "Input Standardization", icon: "inbox",
    hook: "Hook passes: Normalized RFQ package (BOM, drawings, Gerbers) keyed by RFQ ID",
    subs: [
      { id: "1.1", name: "Ingest and register", steps: [
        H("Receive the RFQ package: BOM, mechanical drawings or Gerber files", "UI upload; API/email routes are the other front doors"),
        A("Scan and validate: virus scan, file type, size, duplicate check (hash)", "ClamAV scan; hash dedupe"),
        A("Build the missing-details list and send it back", "Immediate clarification list"),
        A("Create or sync the project in CRM", "RFQ id, customer, project details, promise date"),
        A("Link the ingested RFQ package to the CRM record", "CRM record key joins to the RFQ ID") ] },
      { id: "1.2", name: "Identify and read", steps: [
        A("Identify each file as BOM, drawing or Gerber", "File-type admin master"),
        A("Read the content; OCR for scanned PDFs", "PaddleOCR") ] },
      { id: "1.3", name: "Normalize", steps: [
        A("Map the content into the unified format", "Pydantic-validated, RFQ ID attached") ] },
      { id: "1.4", name: "Review", steps: [
        H("Confirm the normalized package before the hook fires", "Review checkpoint") ] },
    ] },
  { n: 2, name: "Feature Extraction", icon: "scan",
    hook: "Hook passes: Mechanical attribute set per assembly, plus a gaps list",
    subs: [
      { id: "2.1", name: "Receive and query", steps: [ A("Read the normalized drawings for this RFQ ID", "Started by the hook from Input Standardization") ] },
      { id: "2.2", name: "Extract", steps: [ A("Run extraction on geometry, title block and drawing text", "Open-source extraction") ] },
      { id: "2.3", name: "Map to the checklist", steps: [ A("Map extracted values to the Capture Checklist and flag gaps", "Nothing silently skipped") ] },
      { id: "2.4", name: "Review", steps: [ H("Check the extracted attributes", "Review checkpoint") ] },
    ] },
  { n: 3, name: "Feasibility & Risk", icon: "gauge",
    hook: "Hook passes: Feasibility verdict with reasons and risk flags, per RFQ",
    subs: [
      { id: "3.1", name: "Receive and query", steps: [ A("Read attributes, BOM lines, machine-constraint and lead-time/EOL data", "Started by the hook from Feature Extraction") ] },
      { id: "3.2", name: "Compare", steps: [ A("Compare design complexity with each machine constraint", "Can-build verdict with reason per constraint") ] },
      { id: "3.3", name: "Flag risks", steps: [ A("Flag long-lead-time and EOL parts, high-tolerance fits", "Risk flags per RFQ") ] },
      { id: "3.4", name: "Review", steps: [ H("Review the feasibility verdict and the risk flags together", "Review checkpoint") ] },
    ] },
  { n: 4, name: "Distributor & Source Selection", icon: "truck",
    hook: "Hook passes: Selected suppliers per part or commodity",
    subs: [
      { id: "4.1", name: "Receive and query", steps: [ A("Read the BOM lines, risk flags and preferred-distributor lists", "Started by the hook from Feasibility & Risk") ] },
      { id: "4.2", name: "Scan", steps: [ A("Scan the preferred-distributor lists and online sources", "Reliable sources only") ] },
      { id: "4.3", name: "Select", steps: [ A("Select the most reliable suppliers per part or commodity", "Reliability-scored") ] },
      { id: "4.4", name: "Review", steps: [ H("Review the supplier selection", "Review checkpoint") ] },
    ] },
  { n: 5, name: "Supplier RFQ/Quoting Tools", icon: "send",
    hook: "Hook passes: Supplier quotes against each RFQ line",
    subs: [
      { id: "5.1", name: "Receive and query", steps: [ A("Read the selected suppliers and the parts to quote", "Started by the hook from Distributor & Source Selection") ] },
      { id: "5.2", name: "Prepare", steps: [ A("Prepare the sub-component RFQs per supplier", "One pack per supplier") ] },
      { id: "5.3", name: "Send and track", steps: [ A("Send the RFQs and track the replies", "Email and QuoteWin") ] },
      { id: "5.4", name: "Collect and review", steps: [ H("Review the responses brought into one place", "Review checkpoint") ] },
    ] },
  { n: 6, name: "SAP/API Cost Extraction", icon: "database",
    hook: "Hook passes: Internal cost baseline per part and process",
    subs: [
      { id: "6.1", name: "Receive and query", steps: [ A("Read the parts and processes that need an internal cost", "Started by the hook from Supplier RFQ/Quoting Tools") ] },
      { id: "6.2", name: "Pull", steps: [ A("Pull current inventory pricing and historical labor rates", "ERP/SAP") ] },
      { id: "6.3", name: "Baseline", steps: [ A("Build the internal cost baseline", "Per part and process") ] },
      { id: "6.4", name: "Review", steps: [ H("Review the baseline", "Review checkpoint") ] },
    ] },
  { n: 7, name: "Quote Validation & Comparison", icon: "clipcheck",
    hook: "Hook passes: Validated quote set and price comparison matrix per RFQ",
    subs: [
      { id: "7.1", name: "Receive and query", steps: [ A("Read the vendor quotes and the internal baseline", "Started by the hook from SAP/API Cost Extraction") ] },
      { id: "7.2", name: "Validate", steps: [ A("Validate each quote and run the price checks", "Rejects auto-quarantined") ] },
      { id: "7.3", name: "Compare", steps: [ A("Line up the validated bids and build the matrix", "Most cost-effective path marked") ] },
      { id: "7.4", name: "Review", steps: [ H("Review the matrix and clear the quarantined rejects", "Review checkpoint") ] },
    ] },
  { n: 8, name: "Costed BOM", icon: "table",
    hook: "Hook passes: Costed BOM per RFQ, with the data in BullMind",
    subs: [
      { id: "8.1", name: "Receive and query", steps: [ A("Read chosen prices, baseline, BOM, risk flags, feasibility verdict", "Started by the hook from Quote Validation & Comparison") ] },
      { id: "8.2", name: "Consolidate", steps: [ A("Build the multi-level costed BOM", "Material, labor, overhead - 100% auditable price points") ] },
      { id: "8.3", name: "Push to BullMind", steps: [ A("Push the costed BOM data to BullMind", "Clean data for reporting") ] },
      { id: "8.4", name: "Review", steps: [ H("Check the costed BOM", "Review checkpoint") ] },
    ] },
  { n: 9, name: "Reporting via BullMind", icon: "chart",
    hook: "Hook passes: The report set and dashboard links per RFQ",
    subs: [
      { id: "9.1", name: "Receive and query", steps: [ A("Read the costed BOM and earlier-stage data", "Started by the hook from Costed BOM") ] },
      { id: "9.2", name: "Excel reports", steps: [ A("Generate the 16 CAM reports as Excel", "openpyxl, one ISATVON manifest") ] },
      { id: "9.3", name: "Dashboards and Q&A", steps: [ A("Serve Superset dashboards and answer questions via DBHub", "On-demand management answers") ] },
      { id: "9.4", name: "Review", steps: [ H("Review the reports before they are used", "Review checkpoint") ] },
    ] },
  { n: 10, name: "Sales Quote", icon: "mail",
    hook: "Hook passes: Quote email to the client, sent after human approval",
    subs: [
      { id: "10.1", name: "Receive and query", steps: [ A("Read the costed BOM and the report data", "Started by the hook from Reporting via BullMind") ] },
      { id: "10.2", name: "Build the quote", steps: [ A("Add FAI, NRE, assembly charges, taxes and buffers", "Commercial formatting, internal approvals") ] },
      { id: "10.3", name: "Compose", steps: [ A("Draft the quote email", "Cover letter in the editor, costing as Excel attachment") ] },
      { id: "10.4", name: "Approve and send", steps: [ H("Approve; the quote email goes to the client", "Last step of the last skill - human") ] },
    ] },
];

// Sample output cards per sub-skill (front-end mock data).
export interface OutRow { k: string; v: string; tone?: "blue" | "orange" }
export interface OutCard { title: string; icon: string; rows?: OutRow[]; files?: { name: string; meta: string }[]; risks?: string[]; links?: { name: string; meta: string }[]; editor?: string; grid?: { columns: string[]; rows: string[][] } }
export const OUTPUTS: Record<string, OutCard[]> = {
  "1.1": [ { title: "Registered case", icon: "sheet", rows: [
      { k: "RFQ ID", v: "RFQ-1042" }, { k: "Files received", v: "3" },
      { k: "Virus scan", v: "Passed", tone: "blue" }, { k: "CRM sync", v: "Done", tone: "blue" } ] } ],
  "1.2": [ { title: "Read so far", icon: "sheet", rows: [
      { k: "BOM lines read", v: "238" }, { k: "Drawing pages", v: "4" },
      { k: "Gerber layers", v: "6" }, { k: "Gaps flagged", v: "2", tone: "blue" } ] } ],
  "3.4": [ { title: "Feasibility verdict", icon: "gauge", rows: [
      { k: "Min component size (0402)", v: "Can build", tone: "blue" },
      { k: "Oven zones (8 needed)", v: "Can build", tone: "blue" } ],
      risks: ["2 EOL parts", "1 long-lead-time"] } ],
  "5.3": [ { title: "Supplier replies", icon: "send", rows: [
      { k: "Mouser Electronics", v: "Replied", tone: "blue" }, { k: "Digi-Key", v: "Replied", tone: "blue" },
      { k: "Avnet", v: "Replied", tone: "blue" }, { k: "Enclosure vendor A", v: "Pending" },
      { k: "Enclosure vendor B", v: "Pending" } ] } ],
  "8.2": [ { title: "Costed BOM (multi-level)", icon: "table", grid: {
      columns: ["Part", "Description", "Qty", "Unit", "Total"],
      rows: [
        ["U4", "MCU STM32F407", "1", "Rs 412", "Rs 412"],
        ["U9", "PMIC TPS65217", "1", "Rs 268", "Rs 268"],
        ["J2", "Connector 40-pin", "2", "Rs 96", "Rs 192"],
        ["R12-R18", "Resistor 10k 0402", "140", "Rs 0.35", "Rs 49"],
        ["PCB", "4-layer ENIG", "1", "Rs 1,840", "Rs 1,840"],
        ["Assembly", "SMT + THT labor", "1", "Rs 2,150", "Rs 2,150"] ] } } ],
  "9.2": [ { title: "CAM reports (16)", icon: "sheet", files: [
      { name: "RFQ summary.xlsx", meta: "Ready" }, { name: "Cost breakdown.xlsx", meta: "Ready" },
      { name: "Supplier comparison.xlsx", meta: "Building" } ] } ],
  "9.3": [ { title: "Dashboards & Q&A", icon: "chart", links: [
      { name: "Superset - RFQ overview", meta: "Link" }, { name: "Ask DBHub a management question", meta: "Q&A" } ] } ],
  "10.3": [ { title: "Quote email - cover letter", icon: "mail",
      editor: "<p>Dear Customer,</p><p>Thank you for RFQ-1042. Please find our quote attached - pricing is valid for 30 days.</p><p>Regards,<br/>CAM 4.0 Sales</p>",
      files: [{ name: "Costing_RFQ-1042.xlsx", meta: "Excel" }] } ],
  "10.4": [ { title: "Quote build-up", icon: "table", rows: [
      { k: "Costed BOM total", v: "Rs 8,42,300" }, { k: "FAI + NRE + assembly", v: "Rs 96,500" },
      { k: "Taxes + buffers", v: "Rs 61,200" }, { k: "Client quote", v: "Rs 10,00,000", tone: "blue" } ] } ],
};

export const CHAT_START: [string, string][] = [
  ["ai", "RFQ-1042 package received - BOM, 1 drawing and Gerbers. All 3 files passed the virus scan and duplicate check."],
  ["ai", "I have registered the case in the CRM with the RFQ ID, customer and promise date. Shall I start Input Standardization?"],
];
export const REVIEW_LINE: Record<number, string> = {
  1: "The normalized package is ready for your review. Press Action when it looks right and I will hand it to Feature Extraction.",
  2: "Extraction is done - the attribute set and the gaps list are ready for your review.",
  3: "Feasibility check is done. The RFQ is buildable; three flagged parts need your look: 2 end-of-life (U4, U9) and 1 long-lead-time connector (J2, 14 weeks).",
  4: "Supplier selection is ready for your review - 5 suppliers picked from the preferred lists.",
  5: "3 of 5 suppliers have answered - Mouser, Digi-Key and Avnet are in. The two enclosure vendors are still pending. Review what came back.",
  6: "The internal cost baseline is ready for your review.",
  7: "The comparison matrix is ready. Rejected quotes are quarantined automatically - clear them in your review.",
  8: "The costed BOM is built and pushed to BullMind as clean data. Please check it.",
  9: "The 16 CAM reports and dashboards are ready for your review.",
  10: "The sales quote is built from the costed BOM - FAI, NRE, assembly, taxes and buffers added, internal approvals done. It goes to the client only after you approve.",
};
export const HOOK_LINE = (fromName: string, toName: string) =>
  `${fromName} approved. The hook has passed its output to ${toName} - starting now.`;
