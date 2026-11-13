// Costed BOM table, same grid library BAM_UI uses (ag-grid, client-side).
// Rows are mock data; the grid is fully interactive (sort/filter/resize) locally.
import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz, colorSchemeLight, colorSchemeDark } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

export function BomGrid({ dark, columns, rows }: { dark: boolean; columns: string[]; rows: string[][] }) {
  const theme = useMemo(() => themeQuartz.withPart(dark ? colorSchemeDark : colorSchemeLight).withParams({ fontFamily: 'inherit', fontSize: 14, headerFontSize: 16, headerFontWeight: 600, rowVerticalPaddingScale: 1.2, wrapperBorderRadius: 8, cellHorizontalPadding: 15 }), [dark]);
  const colDefs = useMemo(() => { const widths: (number | undefined)[] = [56, undefined, 44, 78, 82]; return columns.map((c, i) => ({
    field: `c${i}`, headerName: c, sortable: true, filter: false, resizable: false,
    suppressHeaderMenuButton: true, suppressMovable: true,
    ...(widths[i] ? { width: widths[i] } : { flex: 1, minWidth: 84 }),
    // BAM style: JetBrains Mono for part designators (IDs) and numeric values; descriptions stay Inter.
    ...(i !== 1 ? { cellStyle: { fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 12.5, ...(i > 1 ? { textAlign: "right" as const } : {}) } } : {}),
    ...(i > 1 ? { headerClass: "ag-right-aligned-header" } : {}),
  })); }, [columns]);
  const rowData = useMemo(() => rows.map(r => Object.fromEntries(r.map((v, i) => [`c${i}`, v]))), [rows]);
  return (
    <div className="bom-grid">
      <AgGridReact theme={theme} columnDefs={colDefs} rowData={rowData} domLayout="autoHeight"
        headerHeight={30} rowHeight={26} suppressCellFocus />
    </div>
  );
}
