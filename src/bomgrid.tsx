// Costed BOM table, same grid library BAM_UI uses (ag-grid, client-side).
// Rows are mock data; the grid is fully interactive (sort/filter/resize) locally.
import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz, colorSchemeLight, colorSchemeDark } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

export function BomGrid({ dark, columns, rows, widths, plain, editable }: { dark: boolean; columns: string[]; rows: string[][]; widths?: (number | undefined)[]; plain?: boolean; editable?: boolean }) {
  // plain tables are dense review data: smaller text and tighter padding so all columns fit the output pane.
  const theme = useMemo(() => themeQuartz.withPart(dark ? colorSchemeDark : colorSchemeLight).withParams(plain
    ? { fontFamily: 'inherit', fontSize: 13, headerFontSize: 12, headerFontWeight: 600, rowVerticalPaddingScale: 1.2, wrapperBorderRadius: 8, cellHorizontalPadding: 6 }
    : { fontFamily: 'inherit', fontSize: 14, headerFontSize: 16, headerFontWeight: 600, rowVerticalPaddingScale: 1.2, wrapperBorderRadius: 8, cellHorizontalPadding: 10 }), [dark, plain]);
  const colDefs = useMemo(() => { const w = widths ?? [86, undefined, 54, 84, 86]; return columns.map((c, i) => ({
    field: `c${i}`, headerName: c, sortable: !plain, filter: false, resizable: false,
    suppressHeaderMenuButton: true, suppressMovable: true,
    ...(editable ? { editable: true, cellDataType: false as const } : {}),
    ...(w[i] ? { width: w[i] } : { flex: 1, minWidth: 84 }),
    // BAM style: JetBrains Mono for part designators (IDs) and numeric values; descriptions stay Inter.
    // plain: text tables (supplier data, pricing, comparison) stay Inter and left-aligned.
    ...(!plain && i !== 1 ? { cellStyle: { fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 12.5, ...(i > 1 ? { textAlign: "right" as const } : {}) } } : {}),
    ...(!plain && i > 1 ? { headerClass: "ag-right-aligned-header" } : {}),
  })); }, [columns, widths, plain, editable]);
  const rowData = useMemo(() => rows.map(r => Object.fromEntries(r.map((v, i) => [`c${i}`, v]))), [rows]);
  return (
    <div className="bom-grid">
      <AgGridReact theme={theme} columnDefs={colDefs} rowData={rowData} domLayout="autoHeight"
        headerHeight={30} rowHeight={26} suppressCellFocus={!editable} />
    </div>
  );
}
