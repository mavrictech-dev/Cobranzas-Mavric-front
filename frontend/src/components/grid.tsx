"use client";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
} from "ag-grid-community";
import { Empty } from "./ui";
ModuleRegistry.registerModules([AllCommunityModule]);
const theme = themeQuartz.withParams({
  backgroundColor: "var(--surface)",
  foregroundColor: "var(--text)",
  headerBackgroundColor: "var(--subtle)",
  borderColor: "var(--line)",
  accentColor: "var(--accent)",
  fontFamily: "var(--font-geist-sans)",
  fontSize: 13,
  headerFontSize: 12,
  headerFontWeight: 500,
  rowHeight: 58,
  headerHeight: 46,
  wrapperBorder: false,
  borderRadius: 16,
});
export function DataGrid<T>({
  rows,
  columns,
  onRow,
  emptyAction,
}: {
  rows: T[];
  columns: ColDef<T>[];
  onRow?: (row: T) => void;
  emptyAction?: React.ReactNode;
}) {
  if (!rows.length) return <Empty action={emptyAction} />;
  return (
    <div
      className="data-grid"
      style={{ height: Math.min(rows.length * 58 + 47, 627) }}
    >
      <AgGridReact<T>
        theme={theme}
        rowData={rows}
        columnDefs={columns}
        defaultColDef={{
          flex: 1,
          minWidth: 115,
          sortable: true,
          resizable: true,
          suppressMovable: true,
        }}
        onRowClicked={(event) => event.data && onRow?.(event.data)}
        suppressCellFocus={false}
        animateRows={true}
        getRowId={(p) => String((p.data as { id: string }).id)}
        rowClass={onRow ? "clickable-row" : ""}
        tooltipShowDelay={300}
      />
    </div>
  );
}
