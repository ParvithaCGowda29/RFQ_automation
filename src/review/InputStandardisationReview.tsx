// Skill 1 - Input standardisation review screen (approved wireframe, 18 Nov 2026).
// Lives entirely in the RIGHT output pane; the middle pane stays the chat.
// The review content is ONLY the standardised normalised input scrub BOM, in
// AG Grid with inline editing (per Parvitha, 18 Nov 2026), shown Excel-style:
// the same 20 columns, in the same order, as the SCRUB BOM sheet of the
// workbook she supplied, all 251 rows, compact rows with cell borders and a
// pinned row-number column like Excel's row headers. Values are the workbook's
// display values, unaltered; blanks stay blank and are never silently zeroed.
import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule, ModuleRegistry, themeQuartz, colorSchemeLight, colorSchemeDark,
  type ColDef, type ICellRendererParams,
} from "ag-grid-community";
import { IconAlertTriangle, IconFileCheck, IconPlugConnected } from "@tabler/icons-react";
import { SCRUB_ROWS, type ScrubRow } from "./scrubBomData";

ModuleRegistry.registerModules([AllCommunityModule]);

/* ---------- cell renderers ---------- */

function CpnCell(p: ICellRendererParams<ScrubRow>) {
  return (
    <span>
      {p.value}
      {p.data?.caseFlag && <span className="isr-flag" title="Matches the costing sheet only when case is ignored"> ●</span>}
    </span>
  );
}

function StockCell(p: ICellRendererParams<ScrubRow>) {
  const v = String(p.value ?? "").trim();
  return v === "" ? <span className="isr-chip miss">missing</span> : <span>{v}</span>;
}

/* ---------- component ---------- */

type Row = ScrubRow & { id: string };

const HEADERS: [keyof ScrubRow, string, number, "left" | "right" | "center"][] = [
  ["fg", "FG", 100, "left"],
  ["level", "Level", 56, "center"],
  ["assembly", "Assembly", 140, "left"],
  ["cpn", "CPN", 190, "left"],
  ["desc", "Description", 220, "left"],
  ["mfr", "Manufacturer", 100, "left"],
  ["mpn", "MPN", 170, "left"],
  ["commodity", "Commodity", 95, "left"],
  ["qty", "Quantity", 74, "right"],
  ["uom", "Unit of measure", 105, "left"],
  ["status", "Part Status", 92, "left"],
  ["ce", "CE Remarks", 170, "left"],
  ["drawing", "Drawing Reference", 130, "left"],
  ["designators", "Designators", 190, "left"],
  ["item", "Item #", 64, "center"],
  ["ptype", "Part Type", 96, "left"],
  ["ltb", "LTB Date", 88, "left"],
  ["common", "Common (AML)", 105, "left"],
  ["chg", "Change Remarks", 120, "left"],
  ["stock", "Inventory Stock", 100, "left"],
];

export function InputStandardisationReview({
  hookLine,
  dark,
  onApprove,
}: {
  hookLine: string;
  dark: boolean;
  onApprove: () => void;
}) {

  const [rows, setRows] = useState<Row[]>(() => SCRUB_ROWS.map((r, i) => ({ ...r, id: String(i) })));

  const stockMissing = rows.reduce((n, r) => n + (String(r.stock).trim() === "" ? 1 : 0), 0);
  const allResolved = stockMissing === 0;

  const theme = useMemo(() => themeQuartz.withPart(dark ? colorSchemeDark : colorSchemeLight).withParams({
    fontFamily: "Calibri, 'Segoe UI', Inter, sans-serif",
    fontSize: 11.5,
    headerFontSize: 11,
    headerFontWeight: 700,
    rowVerticalPaddingScale: 0.6,
    wrapperBorderRadius: 6,
    cellHorizontalPadding: 6,
  }), [dark]);

  const colDefs = useMemo<ColDef<Row>[]>(() => {
    const base = { sortable: false, filter: false, suppressHeaderMenuButton: true, suppressMovable: true, cellDataType: false as const, editable: true };
    const defs: ColDef<Row>[] = [
      {
        headerName: "", width: 44, pinned: "left", editable: false, resizable: false,
        cellClass: "isr-rownum", headerClass: "isr-rownum",
        valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1,
        sortable: false, filter: false, suppressHeaderMenuButton: true, suppressMovable: true, cellDataType: false as const,
      },
    ];
    for (const [field, headerName, width, align] of HEADERS) {
      defs.push({
        ...base,
        field, headerName, width, resizable: true,
        ...(align === "right" ? { cellStyle: { textAlign: "right" as const }, headerClass: "ag-right-aligned-header" } : {}),
        ...(align === "center" ? { cellStyle: { textAlign: "center" as const } } : {}),
        ...(field === "cpn" ? { cellRenderer: CpnCell } : {}),
        ...(field === "stock" ? { cellRenderer: StockCell } : {}),
      });
    }
    return defs;
  }, []);

  return (
    <div className="isr">
      <div className="isr-body">
        {!allResolved && (
          <div className="isr-banner warn">
            <IconAlertTriangle size={15} />
            <span>Inventory Stock is empty on {stockMissing} of {rows.length} rows — mandatory per the input instructions. Blanks are never auto-filled; click a cell and type the value (0 is fine).</span>
          </div>
        )}

        <div className="isr-ag">
          <AgGridReact<Row>
            theme={theme}
            columnDefs={colDefs}
            rowData={rows}
            getRowId={(p) => p.data.id}
            onCellValueChanged={(e) => {
              setRows(prev => prev.map(r => (r.id === e.data.id ? ({ ...e.data } as Row) : r)));
            }}
            headerHeight={26}
            rowHeight={23}
            scrollbarWidth={12}
            stopEditingWhenCellsLoseFocus
            animateRows={false}
          />
        </div>

      </div>

      {/* fixed action bar - Approve styled exactly as the BAM_UI action button
          (orange-glass pill family). Demo build: approval passes even with
          missing values; blanks stay blank, nothing is fabricated. */}
      <div className="isr-bar">
        <div className="isr-bar-msg ok">
          <IconPlugConnected size={14} /><span>{hookLine}</span>
        </div>
        <button className="bam-btn isr-approve" onClick={onApprove}>
          <span className="bam-ico" aria-hidden><IconFileCheck size={16} /></span>
          <span>Approve → Skill 2</span>
        </button>
      </div>
    </div>
  );
}
