// Skills 2-9 review screens (18 Nov 2026): each skill ends at the human Action button
// (CAM 4.0 document: every skill's End line is "the human Action button; the hook then
// passes..."), so when a skill finishes its automated sub-skills the RIGHT output pane
// shows that skill's output for review, with the same BAM-style Approve pill as Skill 1.
// Right-pane outputs follow her 18 Nov 2026 list:
//   2 Extracted Data (Editable)  3 Supplier data  4 Distributor pricing  5 Report
//   6 Search online for templates  7 Compare  8 Costed BOM sheet
//   9 Superset dashboard (Downloadable 16 reports)
// All content is front-end demo data - the app banner already says "Demo - mock data,
// no backend", the template search visibly says it filters a local sample list, and
// every downloaded report file itself is marked as demo content.
import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule, ModuleRegistry, themeQuartz, colorSchemeLight, colorSchemeDark,
  type ColDef, type ICellRendererParams,
} from "ag-grid-community";
import { utils, writeFile } from "xlsx";
import {
  IconAlertTriangle, IconCircleCheckFilled, IconDownload, IconFileCheck,
  IconPlugConnected, IconSearch,
} from "@tabler/icons-react";
import { BomGrid } from "../bomgrid";
import { OUTPUTS } from "../data";

ModuleRegistry.registerModules([AllCommunityModule]);

/* ---------- shared review shell: output body + human Action button bar ---------- */

export function ReviewShell({
  hookLine, nextSkillNo, onApprove, children,
}: {
  hookLine: string;
  nextSkillNo: number;
  onApprove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="isr">
      <div className="isr-body srv-body">{children}</div>
      <div className="isr-bar">
        <div className="isr-bar-msg ok">
          <IconPlugConnected size={14} /><span>{hookLine}</span>
        </div>
        <button className="bam-btn isr-approve" onClick={onApprove}>
          <span className="bam-ico" aria-hidden><IconFileCheck size={16} /></span>
          <span>Approve → Skill {nextSkillNo}</span>
        </button>
      </div>
    </div>
  );
}

function OutputTitle({ children }: { children: React.ReactNode }) {
  return <div className="srv-title">{children}</div>;
}

/* ---------- Skill 2: Extracted Data (Editable) ---------- */

interface AttrRow { id: string; assembly: string; attribute: string; value: string; unit: string; source: string; status: string }

const ATTR_ROWS: AttrRow[] = [
  { id: "1", assembly: "HCV_BMS_MB", attribute: "Board outline", value: "120 x 80", unit: "mm", source: "Drawing sheet 1", status: "Extracted" },
  { id: "2", assembly: "HCV_BMS_MB", attribute: "Layer count", value: "4", unit: "layers", source: "Gerber stackup", status: "Extracted" },
  { id: "3", assembly: "HCV_BMS_MB", attribute: "Board thickness", value: "1.6", unit: "mm", source: "Title block", status: "Extracted" },
  { id: "4", assembly: "HCV_BMS_MB", attribute: "Min hole size", value: "0.3", unit: "mm", source: "Drill table", status: "Extracted" },
  { id: "5", assembly: "HCV_BMS_MB", attribute: "Surface finish", value: "ENIG", unit: "-", source: "Title block", status: "Extracted" },
  { id: "6", assembly: "HCV_BMS_MB", attribute: "Impedance control", value: "", unit: "-", source: "-", status: "Gap" },
  { id: "7", assembly: "HCV_BMS_MB", attribute: "Min trace / space", value: "0.1 / 0.1", unit: "mm", source: "Drawing note 4", status: "Extracted" },
  { id: "8", assembly: "HCV_BMS_MB", attribute: "Tightest tolerance", value: "±0.05", unit: "mm", source: "Dimension 12", status: "Extracted" },
  { id: "9", assembly: "HCV_BMS_MB-ESD Cover", attribute: "Material", value: "ABS FR", unit: "-", source: "Drawing sheet 2", status: "Extracted" },
  { id: "10", assembly: "HCV_BMS_MB-ESD Cover", attribute: "Wall thickness", value: "2.0", unit: "mm", source: "Section A-A", status: "Extracted" },
  { id: "11", assembly: "HCV_BMS_MB-ESD Cover", attribute: "Surface texture", value: "", unit: "-", source: "-", status: "Gap" },
  { id: "12", assembly: "HCV_BMS_MB-Pallet", attribute: "Rated load", value: "250", unit: "kg", source: "Drawing sheet 3", status: "Extracted" },
];

function AttrStatusCell(p: ICellRendererParams<AttrRow>) {
  return p.value === "Gap" ? <span className="isr-chip miss">gap</span> : <span>{p.value}</span>;
}

function ExtractedData({ dark }: { dark: boolean }) {
  const [rows, setRows] = useState<AttrRow[]>(ATTR_ROWS);
  const gaps = rows.reduce((n, r) => n + (String(r.value).trim() === "" ? 1 : 0), 0);
  const theme = useMemo(() => themeQuartz.withPart(dark ? colorSchemeDark : colorSchemeLight).withParams({
    fontFamily: "Calibri, 'Segoe UI', Inter, sans-serif", fontSize: 11.5, headerFontSize: 11, headerFontWeight: 700,
    rowVerticalPaddingScale: 0.6, cellHorizontalPadding: 6, wrapperBorderRadius: 4,
  }), [dark]);
  const colDefs = useMemo<ColDef<AttrRow>[]>(() => {
    const base: Partial<ColDef<AttrRow>> = { editable: true, sortable: true, resizable: true, suppressHeaderMenuButton: true, suppressMovable: true, singleClickEdit: false };
    return [
      { ...base, field: "assembly", headerName: "Assembly", width: 170 },
      { ...base, field: "attribute", headerName: "Attribute", width: 140 },
      { ...base, field: "value", headerName: "Value", flex: 1, minWidth: 90 },
      { ...base, field: "unit", headerName: "Unit", width: 70 },
      { ...base, field: "source", headerName: "Source", width: 130 },
      { ...base, field: "status", headerName: "Status", width: 92, editable: false, cellRenderer: AttrStatusCell },
    ];
  }, []);
  return (
    <>
      <OutputTitle>Extracted Data (Editable)</OutputTitle>
      <div className={`isr-banner ${gaps > 0 ? "warn" : "info"}`}>
        <IconAlertTriangle size={15} />
        <span>{gaps > 0
          ? `${gaps} attribute${gaps === 1 ? " is" : "s are"} still a gap - click a cell and type the value to fill it. Blanks are never auto-filled.`
          : "All gaps filled. Click any cell to correct a value."}</span>
      </div>
      <div className="isr-ag">
        <AgGridReact<AttrRow>
          theme={theme}
          columnDefs={colDefs}
          rowData={rows}
          getRowId={(p) => p.data.id}
          onCellValueChanged={(e) => {
            const nextValue = String(e.data.value ?? "").trim();
            setRows((prev) => prev.map((r) => (r.id === e.data.id
              ? { ...e.data, status: nextValue === "" ? "Gap" : "Extracted" } as AttrRow
              : r)));
          }}
          headerHeight={26}
          rowHeight={23}
          scrollbarWidth={12}
          stopEditingWhenCellsLoseFocus
          animateRows={false}
        />
      </div>
    </>
  );
}

/* ---------- Skill 3: Supplier data ---------- */

function SupplierData({ dark }: { dark: boolean }) {
  return (
    <>
      <OutputTitle>Supplier data</OutputTitle>
      <div className="isr-banner info">
        <IconCircleCheckFilled size={15} />
        <span>5 suppliers selected from the preferred lists and online sources, reliability-scored per part or commodity.</span>
      </div>
      <BomGrid dark={dark} plain widths={[82, 104, 146, 56, 72]}
        columns={["Commodity", "Part", "Selected supplier", "Score", "Source"]}
        rows={[
          ["Connectors", "40-pin header", "Mouser", "96/100", "Preferred"],
          ["MCU", "STM32F407", "Digi-Key", "94/100", "Preferred"],
          ["PMIC", "TPS65217", "Digi-Key", "93/100", "Preferred"],
          ["Passives", "Resistor 10k 0402", "Avnet", "92/100", "Online"],
          ["PCB fab", "4-layer ENIG", "Avnet", "90/100", "Online"],
          ["Cable/hardware", "M3x8 bolt", "Mouser", "88/100", "Online"],
          ["Enclosure", "ESD cover", "Enclosure vendor A", "84/100", "Preferred"],
          ["Packaging", "Pallet + master", "Enclosure vendor B", "82/100", "Preferred"],
        ]} />
    </>
  );
}

/* ---------- Skill 4: Distributor pricing ---------- */

function DistributorPricing({ dark }: { dark: boolean }) {
  return (
    <>
      <OutputTitle>Distributor pricing</OutputTitle>
      <div className="isr-banner info">
        <IconCircleCheckFilled size={15} />
        <span>3 of 5 suppliers replied - Mouser, Digi-Key and Avnet. The two enclosure vendors are still pending.</span>
      </div>
      <BomGrid dark={dark} plain widths={[126, 92, 66, 44, 54, 66]}
        columns={["RFQ line", "Supplier", "Price", "MOQ", "Lead", "Status"]}
        rows={[
          ["U4 - MCU STM32F407", "Mouser", "Rs 412", "1", "2 wks", "Replied"],
          ["U4 - MCU STM32F407", "Digi-Key", "Rs 428", "1", "1 wk", "Replied"],
          ["U9 - PMIC TPS65217", "Digi-Key", "Rs 268", "1", "2 wks", "Replied"],
          ["J2 - Connector 40-pin", "Mouser", "Rs 96", "10", "14 wks", "Replied"],
          ["R12-R18 - Resistor", "Avnet", "Rs 0.35", "500", "1 wk", "Replied"],
          ["PCB - 4-layer ENIG", "Avnet", "Rs 1,840", "5", "3 wks", "Replied"],
          ["Enclosure ESD cover", "Enclosure A", "-", "-", "-", "Pending"],
          ["Packaging set", "Enclosure B", "-", "-", "-", "Pending"],
        ]} />
    </>
  );
}

/* ---------- Skill 5: Report (feasibility verdict + risk flags) ---------- */

function FeasibilityReport() {
  const verdict = OUTPUTS["5.4"]?.[0];
  return (
    <>
      <OutputTitle>Report</OutputTitle>
      <div className="ocard">
        <h3><span className="oi"><IconCircleCheckFilled size={15} /></span>{verdict?.title ?? "Feasibility verdict"}</h3>
        {(verdict?.rows ?? []).map((r) => (
          <div className="kv" key={r.k}><span className="k">{r.k}</span><span className="v" style={r.tone ? { color: `var(--${r.tone})` } : undefined}>{r.v}</span></div>
        ))}
        <div className="kv"><span className="k">Min hole size (0.3 mm)</span><span className="v" style={{ color: "var(--blue)" }}>Can build</span></div>
        <div className="kv"><span className="k">Tightest tolerance (±0.05 mm)</span><span className="v" style={{ color: "var(--blue)" }}>Can build</span></div>
        <div style={{ marginTop: 8 }}>
          {(verdict?.risks ?? []).map((r) => <span className="risk" key={r}><IconAlertTriangle size={12} /> {r}</span>)}
        </div>
      </div>
      <div className="ocard">
        <h3><span className="oi"><IconAlertTriangle size={15} /></span>Noted for the quote</h3>
        <div className="kv"><span className="k">EOL parts</span><span className="v">U4, U9</span></div>
        <div className="kv"><span className="k">Long-lead-time</span><span className="v">J2 (14 weeks)</span></div>
        <div className="kv"><span className="k">Input gaps from the drawing</span><span className="v">2</span></div>
      </div>
    </>
  );
}

/* ---------- Skill 6: Search online for templates (local demo filter) ---------- */

interface TemplateRow { name: string; file: string; source: string }

const TEMPLATES: TemplateRow[] = [
  { name: "PCB fabrication cost template", file: "pcbfab-costs.xlsx", source: "Sample library" },
  { name: "SMT assembly cost template", file: "smt-assembly.xlsx", source: "Sample library" },
  { name: "Cable harness cost template", file: "cable-harness.xlsx", source: "Sample library" },
  { name: "Enclosure tooling cost template", file: "enclosure-tooling.xlsx", source: "Sample library" },
  { name: "Labor rate card template", file: "labor-rates.xlsx", source: "Sample library" },
  { name: "Logistics and packing template", file: "logistics.xlsx", source: "Sample library" },
];

function TemplateSearch() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const shown = TEMPLATES.filter((t) => !q || t.name.toLowerCase().includes(q) || t.file.includes(q));
  return (
    <>
      <OutputTitle>Search online for templates</OutputTitle>
      <div className="isr-banner info">
        <IconAlertTriangle size={15} />
        <span>Demo: this filters a local sample list - no online search is connected.</span>
      </div>
      <div className="srv-search">
        <IconSearch size={15} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cost templates"
          aria-label="Search cost templates"
        />
      </div>
      <div className="srv-list">
        {shown.length === 0 && <div className="srv-empty">No templates match "{query}".</div>}
        {shown.map((t) => (
          <button type="button" key={t.file}
            className={"srv-trow" + (selected === t.file ? " sel" : "")}
            onClick={() => setSelected(selected === t.file ? null : t.file)}>
            <span className="n">{t.name}</span>
            <span className="m">{t.file} · {t.source}</span>
            <span className="srv-sel">{selected === t.file ? "Selected" : "Select"}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="isr-banner info" style={{ marginTop: 8 }}>
          <IconCircleCheckFilled size={15} />
          <span>{TEMPLATES.find((t) => t.file === selected)?.name} selected for the cost baseline.</span>
        </div>
      )}
    </>
  );
}

/* ---------- Skill 7: Compare (price comparison matrix) ---------- */

function CompareMatrix({ dark }: { dark: boolean }) {
  return (
    <>
      <OutputTitle>Compare</OutputTitle>
      <div className="isr-banner info">
        <IconCircleCheckFilled size={15} />
        <span>Validated quotes lined up against the internal baseline; the most cost-effective path is marked per part. Rejected quotes are auto-quarantined.</span>
      </div>
      <BomGrid dark={dark} plain widths={[124, 82, 58, 62, 60, 66]}
        columns={["Part", "Baseline", "Mouser", "Digi-Key", "Avnet", "Best"]}
        rows={[
          ["U4 - MCU STM32F407", "Rs 405", "Rs 412", "Rs 428", "-", "Baseline"],
          ["U9 - PMIC TPS65217", "Rs 255", "-", "Rs 268", "-", "Baseline"],
          ["J2 - Connector 40-pin", "Rs 104", "Rs 96", "-", "-", "Mouser"],
          ["R12-R18 - Resistor 10k", "Rs 0.40", "-", "-", "Rs 0.35", "Avnet"],
          ["PCB - 4-layer ENIG", "Rs 1,950", "-", "-", "Rs 1,840", "Avnet"],
        ]} />
    </>
  );
}

/* ---------- Skill 8: Costed BOM sheet ---------- */

function CostedBomSheet({ dark }: { dark: boolean }) {
  const grid = OUTPUTS["8.2"]?.[0]?.grid;
  if (!grid) return null;
  return (
    <>
      <OutputTitle>Costed BOM sheet</OutputTitle>
      <div className="isr-banner info">
        <IconCircleCheckFilled size={15} />
        <span>Multi-level costed BOM - material, labor and overhead, 100% auditable price points. Pushed to BullMind.</span>
      </div>
      <BomGrid dark={dark} columns={grid.columns} rows={grid.rows} />
    </>
  );
}

/* ---------- Skill 9: Superset dashboard (Downloadable 16 reports) ---------- */

const REPORTS = [
  "RFQ summary", "Cost breakdown", "Supplier comparison", "Feasibility summary",
  "Risk register", "Lead-time analysis", "EOL parts list", "Price variance",
  "Quote validation", "Costed BOM", "Margin analysis", "Payment terms",
  "Delivery schedule", "Compliance checklist", "Management dashboard data", "Sales quote summary",
];

// Each report is generated on click from the demo's mock figures. The file itself is
// marked as demo content - it never relies on the page banner alone.
function buildReportSheet(name: string, generated: string) {
  const aoa: (string | number)[][] = [
    [name],
    ["Demo - mock data, no backend"],
    ["RFQ", "RFQ-1042"],
    ["Generated", generated],
    [],
    ["Metric", "Value"],
    ["Costed BOM total", "Rs 8,42,300"],
    ["Suppliers evaluated", "5"],
    ["Quotes replied", "3 of 5"],
    ["Feasibility verdict", "Can build (2 EOL parts, 1 long-lead-time flagged)"],
  ];
  const sheet = utils.aoa_to_sheet(aoa);
  sheet["!cols"] = [{ wch: 28 }, { wch: 48 }];
  return sheet;
}

function downloadReport(name: string) {
  const book = utils.book_new();
  utils.book_append_sheet(book, buildReportSheet(name, new Date().toLocaleString()), name.slice(0, 31));
  writeFile(book, `${name.replace(/\s+/g, "_")}_DEMO.xlsx`);
}

// "Download all reports together once" (user request 2026-11-19): one workbook,
// one sheet per report, same demo-marked content as the individual downloads.
function downloadAllReports() {
  const generated = new Date().toLocaleString();
  const book = utils.book_new();
  for (const name of REPORTS) {
    utils.book_append_sheet(book, buildReportSheet(name, generated), name.slice(0, 31));
  }
  writeFile(book, "RFQ-1042_All_16_Reports_DEMO.xlsx");
}

function ReportsDashboard() {
  return (
    <>
      <OutputTitle>Superset dashboard (Downloadable 16 reports)</OutputTitle>
      <div className="srv-tiles">
        <div className="srv-tile"><span className="t-n">16</span><span className="t-l">Excel reports</span></div>
        <div className="srv-tile"><span className="t-n">2</span><span className="t-l">Superset dashboards</span></div>
        <div className="srv-tile"><span className="t-n">Q&amp;A</span><span className="t-l">DBHub answers</span></div>
      </div>
      <div className="srv-list">
        <div className="srv-trow srv-all">
          <span className="n">All 16 reports</span>
          <span className="m">One workbook, 16 sheets</span>
          <button type="button" className="srv-dl" onClick={downloadAllReports} aria-label="Download all 16 reports together">
            <IconDownload size={14} /> Download all
          </button>
        </div>
        {REPORTS.map((r) => (
          <div className="srv-trow" key={r}>
            <span className="n">{r}</span>
            <span className="m">Ready</span>
            <button type="button" className="srv-dl" onClick={() => downloadReport(r)} aria-label={`Download ${r}`}>
              <IconDownload size={14} /> Download
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- dispatcher ---------- */

export function SkillReviewBody({ skillNo, dark }: { skillNo: number; dark: boolean }) {
  switch (skillNo) {
    case 2: return <ExtractedData dark={dark} />;
    case 3: return <SupplierData dark={dark} />;
    case 4: return <DistributorPricing dark={dark} />;
    case 5: return <FeasibilityReport />;
    case 6: return <TemplateSearch />;
    case 7: return <CompareMatrix dark={dark} />;
    case 8: return <CostedBomSheet dark={dark} />;
    case 9: return <ReportsDashboard />;
    default: return null;
  }
}
