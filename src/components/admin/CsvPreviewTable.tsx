export interface CsvPreviewTableProps {
  rows: Record<string, string>[];
  columns: readonly string[];
}

export function CsvPreviewTable({ rows, columns }: CsvPreviewTableProps) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-bg-border">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-bg-border bg-bg-primary">
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-3 py-2 font-semibold text-text-secondary"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((row, i) => (
            <tr
              key={i}
              className="border-b border-bg-border/50 last:border-0"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className="whitespace-nowrap px-3 py-2 text-text-primary"
                >
                  {row[col] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 10 && (
        <p className="px-3 py-2 text-xs text-text-muted">
          Showing 10 of {rows.length} rows
        </p>
      )}
    </div>
  );
}
