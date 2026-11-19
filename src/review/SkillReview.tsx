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

// Dense review-table theme, matching the plain BomGrid look.
function useSrvTheme(dark: boolean) {
  return useMemo(() => themeQuartz.withPart(dark ? colorSchemeDark : colorSchemeLight).withParams({
    fontFamily: "inherit", fontSize: 13, headerFontSize: 12, headerFontWeight: 600,
    rowVerticalPaddingScale: 1.2, wrapperBorderRadius: 8, cellHorizontalPadding: 6,
  }), [dark]);
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
        <span>5 suppliers selected from the preferred lists and online sources, reliability-scored per part or commodity. Click a cell and type to edit.</span>
      </div>
      <BomGrid dark={dark} plain editable widths={[82, 104, 146, 56, 72]}
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
        <span>3 of 5 suppliers replied - Mouser, Digi-Key and Avnet. The two enclosure vendors are still pending. Click a cell and type to edit.</span>
      </div>
      <BomGrid dark={dark} plain editable widths={[126, 92, 66, 44, 54, 66]}
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

function FeasibilityReport({ dark }: { dark: boolean }) {
  const verdict = OUTPUTS["5.4"]?.[0];
  return (
    <>
      <OutputTitle>Report</OutputTitle>
      <div className="isr-banner info">
        <IconCircleCheckFilled size={15} />
        <span>Feasibility verdict with per-constraint reasons and risk flags. Click a cell and type to edit.</span>
      </div>
      <BomGrid dark={dark} plain editable widths={[190, undefined]}
        columns={["Feasibility verdict", "Result"]}
        rows={[
          ...(verdict?.rows ?? []).map((r) => [r.k, r.v]),
          ["Min hole size (0.3 mm)", "Can build"],
          ["Tightest tolerance (±0.05 mm)", "Can build"],
          ...(verdict?.risks ?? []).map((r) => ["Flagged risk", r]),
        ]} />
      <div style={{ height: 12 }} />
      <BomGrid dark={dark} plain editable widths={[190, undefined]}
        columns={["Noted for the quote", "Detail"]}
        rows={[
          ["EOL parts", "U4, U9"],
          ["Long-lead-time", "J2 (14 weeks)"],
          ["Input gaps from the drawing", "2"],
        ]} />
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

function TemplateSearch({ dark }: { dark: boolean }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<TemplateRow[]>(TEMPLATES);
  const [selected, setSelected] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const shown = rows.filter((t) => !q || t.name.toLowerCase().includes(q) || t.file.includes(q));
  const theme = useSrvTheme(dark);
  const colDefs = useMemo<ColDef<TemplateRow>[]>(() => {
    const base: Partial<ColDef<TemplateRow>> = { editable: true, sortable: false, suppressHeaderMenuButton: true, suppressMovable: true, cellDataType: false };
    return [
      { ...base, field: "name", headerName: "Template", flex: 1, minWidth: 160 },
      { ...base, field: "file", headerName: "File", width: 150 },
      { ...base, field: "source", headerName: "Source", width: 110 },
      {
        headerName: "", width: 96, editable: false, sortable: false, suppressHeaderMenuButton: true, suppressMovable: true, cellDataType: false,
        cellRenderer: (p: ICellRendererParams<TemplateRow>) => {
          const isSel = selected === p.data?.file;
          return (
            <button type="button" className="srv-sel-btn" onClick={() => setSelected(isSel ? null : p.data!.file)}>
              {isSel ? "Selected" : "Select"}
            </button>
          );
        },
      },
    ];
  }, [selected]);
  return (
    <>
      <OutputTitle>Search online for templates</OutputTitle>
      <div className="isr-banner info">
        <IconAlertTriangle size={15} />
        <span>Demo: this filters a local sample list - no online search is connected. Click a cell and type to edit.</span>
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
      <div className="bom-grid">
        <AgGridReact<TemplateRow>
          theme={theme}
          columnDefs={colDefs}
          rowData={shown}
          domLayout="autoHeight"
          headerHeight={30}
          rowHeight={30}
          suppressCellFocus
          stopEditingWhenCellsLoseFocus
          animateRows={false}
          onCellValueChanged={() => setRows((prev) => [...prev])}
          overlayNoRowsTemplate={`No templates match your search.`}
        />
      </div>
      {selected && (
        <div className="isr-banner info" style={{ marginTop: 8 }}>
          <IconCircleCheckFilled size={15} />
          <span>{rows.find((t) => t.file === selected)?.name} selected for the cost baseline.</span>
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
        <span>Validated quotes lined up against the internal baseline; the most cost-effective path is marked per part. Rejected quotes are auto-quarantined. Click a cell and type to edit.</span>
      </div>
      <BomGrid dark={dark} plain editable widths={[124, 82, 58, 62, 60, 66]}
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
        <span>Multi-level costed BOM - material, labor and overhead, 100% auditable price points. Pushed to BullMind. Click a cell and type to edit.</span>
      </div>
      <BomGrid dark={dark} editable columns={grid.columns} rows={grid.rows} />
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

interface ReportRow { name: string; meta: string; all?: boolean }

const REPORT_ROWS: ReportRow[] = [
  { name: "All 16 reports", meta: "One workbook, 16 sheets", all: true },
  ...REPORTS.map((r) => ({ name: r, meta: "Ready" })),
];

function ReportsDashboard({ dark }: { dark: boolean }) {
  const [rows, setRows] = useState<ReportRow[]>(REPORT_ROWS);
  const theme = useSrvTheme(dark);
  const colDefs = useMemo<ColDef<ReportRow>[]>(() => {
    const base: Partial<ColDef<ReportRow>> = { editable: true, sortable: false, suppressHeaderMenuButton: true, suppressMovable: true, cellDataType: false };
    return [
      { ...base, field: "name", headerName: "Report", flex: 1, minWidth: 150 },
      { ...base, field: "meta", headerName: "Status", width: 180 },
      {
        headerName: "", width: 118, editable: false, sortable: false, suppressHeaderMenuButton: true, suppressMovable: true, cellDataType: false,
        cellRenderer: (p: ICellRendererParams<ReportRow>) => {
          if (!p.data) return null;
          return (
            <button type="button" className="srv-dl" onClick={() => (p.data!.all ? downloadAllReports() : downloadReport(p.data!.name))}
              aria-label={p.data.all ? "Download all 16 reports together" : `Download ${p.data.name}`}>
              <IconDownload size={14} /> {p.data.all ? "Download all" : "Download"}
            </button>
          );
        },
      },
    ];
  }, []);
  return (
    <>
      <OutputTitle>Superset dashboard (Downloadable 16 reports)</OutputTitle>
      <div className="srv-tiles">
        <div className="srv-tile"><span className="t-n">16</span><span className="t-l">Excel reports</span></div>
        <div className="srv-tile"><span className="t-n">2</span><span className="t-l">Superset dashboards</span></div>
        <div className="srv-tile"><span className="t-n">Q&amp;A</span><span className="t-l">DBHub answers</span></div>
      </div>
      <div className="isr-banner info">
        <IconCircleCheckFilled size={15} />
        <span>Every report is ready to download. Click a cell and type to edit.</span>
      </div>
      <div className="bom-grid">
        <AgGridReact<ReportRow>
          theme={theme}
          columnDefs={colDefs}
          rowData={rows}
          domLayout="autoHeight"
          headerHeight={30}
          rowHeight={30}
          suppressCellFocus
          stopEditingWhenCellsLoseFocus
          animateRows={false}
          onCellValueChanged={() => setRows((prev) => [...prev])}
        />
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
    case 5: return <FeasibilityReport dark={dark} />;
    case 6: return <TemplateSearch dark={dark} />;
    case 7: return <CompareMatrix dark={dark} />;
    case 8: return <CostedBomSheet dark={dark} />;
    case 9: return <ReportsDashboard dark={dark} />;
    default: return null;
  }
}
