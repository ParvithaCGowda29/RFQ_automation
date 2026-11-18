// Skill 1 - Input standardisation review screen (approved wireframe, 18 Nov 2026).
// Lives entirely in the RIGHT output pane; the middle pane stays the chat.
// The review content is ONLY the standardised normalised input scrub BOM, in
// AG Grid with inline editing (per Parvitha, 18 Nov 2026). All rows below are
// invented representative data (same set as the approved wireframe deck) - no
// real client file is read, and nothing here claims a real scan, parse or CRM
// registration happened. Blanks are shown as 'missing' and are never silently
// zeroed; the reviewer fills values in by editing the cells.
import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule, ModuleRegistry, themeQuartz, colorSchemeLight, colorSchemeDark,
  type ColDef, type ICellRendererParams, type GetRowIdParams,
} from "ag-grid-community";
import { IconAlertTriangle, IconCheck, IconPlugConnected } from "@tabler/icons-react";

ModuleRegistry.registerModules([AllCommunityModule]);

/* ---------- invented representative data (approved wireframe) ---------- */

type Row =
  | { type: "band"; depth: 0 | 1; label: string }
  | { type: "part"; cpn: string; caseFlag?: boolean; desc: string; mfr: string; mpn: string; commodity: string; qty: string; stock: string };

const INITIAL_ROWS: Row[] = [
  { type: "band", depth: 0, label: "ECU_MB — EV Charger Main Board · finished good" },
  { type: "band", depth: 1, label: "ECU_MB-PWR — Power-stage assembly" },
  { type: "part", cpn: "RC0603FR-0710KL", caseFlag: true, desc: "Resistor 10 kΩ", mfr: "Yageo", mpn: "RC0603FR-0710KL", commodity: "Resistor", qty: "4", stock: "" },
  { type: "part", cpn: "GRM188R71H104K", desc: "Capacitor 100 nF", mfr: "Murata", mpn: "GRM188R71H104K", commodity: "Capacitor", qty: "6", stock: "" },
  { type: "part", cpn: "2N7002BK", desc: "MOSFET N-ch", mfr: "Nexperia", mpn: "2N7002BK", commodity: "Transistor", qty: "2", stock: "" },
  { type: "band", depth: 1, label: "ECU_MB-HOUSING — Enclosure assembly" },
  { type: "part", cpn: "ECU_MB-ESD Cover", caseFlag: true, desc: "ESD cover, main", mfr: "ProPlast", mpn: "ABS-ESD-104", commodity: "Mechanical", qty: "1", stock: "" },
  { type: "band", depth: 0, label: "ECU_SB — EV Charger Sub Board · finished good" },
  { type: "part", cpn: "ECU_SB-CBL-01", desc: "Ribbon cable", mfr: "CablTech", mpn: "CT-RB12-300", commodity: "Cable", qty: "1", stock: "" },
];

/* ---------- cell renderers ---------- */

function CpnCell(p: ICellRendererParams<Row>) {
  if (!p.data || p.data.type !== "part") return p.value;
  return (
    <span className="mono">
      {p.value}
      {p.data.caseFlag && <span className="isr-flag" title="Matches the costing sheet only when case is ignored"> ●</span>}
    </span>
  );
}

function StockCell(p: ICellRendererParams<Row>) {
  if (!p.data || p.data.type !== "part") return null;
  const v = String(p.value ?? "").trim();
  return v === "" ? <span className="isr-chip miss">missing</span> : <span className="mono">{v}</span>;
}

function BandCell(p: ICellRendererParams<Row>) {
  if (!p.data || p.data.type !== "band") return null;
  return (
    <span className={"isr-band-lbl d" + p.data.depth}>
      {p.data.depth === 0 ? "▾ " : "▸ "}{p.data.label}
    </span>
  );
}

/* ---------- component ---------- */

const MONO = { fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11.5 };

export function InputStandardisationReview({
  hookLine,
  dark,
  onApprove,
}: {
  hookLine: string;
  dark: boolean;
  onApprove: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS);

  const stockMissing = rows.some(r => r.type === "part" && String(r.stock).trim() === "");
  const allResolved = !stockMissing;
  const blockReason = "Approve stays unavailable until Inventory Stock is filled in on every row — edit the cells inline; 0 is a valid value. Blanks are never auto-filled.";

  const theme = useMemo(() => themeQuartz.withPart(dark ? colorSchemeDark : colorSchemeLight).withParams({
    fontFamily: "inherit", fontSize: 12.5, headerFontSize: 10.5, headerFontWeight: 700,
    rowVerticalPaddingScale: 1.1, wrapperBorderRadius: 8, cellHorizontalPadding: 8,
  }), [dark]);

  const colDefs = useMemo<ColDef<Row>[]>(() => {
    const part = (p: { data?: Row }) => p.data?.type === "part";
    const base = { sortable: false, filter: false, resizable: false, suppressHeaderMenuButton: true, suppressMovable: true, cellDataType: false as const };
    return [
      { ...base, field: "cpn", headerName: "CPN", flex: 1.5, minWidth: 152, cellRenderer: CpnCell, editable: part },
      { ...base, field: "desc", headerName: "Description", flex: 1.1, minWidth: 110, editable: part },
      { ...base, field: "mfr", headerName: "Manufacturer", flex: 1, minWidth: 96, editable: part },
      { ...base, field: "mpn", headerName: "MPN", flex: 1.2, minWidth: 120, cellStyle: MONO, editable: part },
      { ...base, field: "commodity", headerName: "Commodity", flex: 0.9, minWidth: 92, editable: part },
      { ...base, field: "qty", headerName: "Qty", width: 62, cellStyle: { ...MONO, textAlign: "right" as const }, headerClass: "ag-right-aligned-header", editable: part },
      { ...base, field: "stock", headerName: "Inv. Stock", width: 96, cellRenderer: StockCell, headerClass: "ag-right-aligned-header", editable: part },
    ];
  }, []);

  return (
    <div className="isr">
      <div className="isr-body">
        {stockMissing && (
          <div className="isr-banner warn">
            <IconAlertTriangle size={15} />
            <span>Inventory Stock is empty on rows marked missing — mandatory per the input instructions. Blanks are never auto-filled; click a cell and type the value (0 is fine).</span>
          </div>
        )}

        <div className="isr-ag">
          <AgGridReact<Row>
            theme={theme}
            columnDefs={colDefs}
            rowData={rows}
            getRowId={(p: GetRowIdParams<Row>) => p.data.type === "band" ? "b:" + p.data.label : "p:" + p.data.cpn}
            isFullWidthRow={(p) => p.rowNode.data?.type === "band"}
            fullWidthCellRenderer={BandCell}
            rowClassRules={{ "isr-band-row": (p) => p.data?.type === "band" }}
            onCellValueChanged={(e) => {
              setRows(prev => prev.map(r => {
                const id = r.type === "band" ? "b:" + r.label : "p:" + r.cpn;
                return id === e.node.id ? ({ ...e.data } as Row) : r;
              }));
            }}
            headerHeight={28}
            rowHeight={28}
            scrollbarWidth={12}
            suppressCellFocus={false}
            stopEditingWhenCellsLoseFocus
          />
        </div>

        <p className="isr-note"><span className="isr-flag">●</span> = case-match flag: the costing sheet matches this part only when letter case is ignored. &nbsp;<span className="isr-chip miss">missing</span> = no value in the file; edit the cell to supply one (a confirmed zero shows 0).</p>
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
              title={allResolved ? undefined : "Fill in Inventory Stock first"}
              onClick={() => allResolved && onApprove()}>
              <IconCheck size={16} /> Approve → Skill 2
            </button>
            {!allResolved && <div className="isr-approve-why">fill in Inventory Stock first</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
