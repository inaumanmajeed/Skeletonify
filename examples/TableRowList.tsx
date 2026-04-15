import { Skeletonify } from "../src";

export interface Row {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

function TableRowList({ rows }: { rows: Row[] }) {
  return (
    <div className="flex flex-col gap-2 w-full p-4">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex gap-4 items-center p-3 rounded"
        >
          <div className="w-10 h-10 rounded-full" />
          <div className="flex flex-col gap-1 w-64">
            <span className="text-base">{row.name}</span>
            <span className="text-sm">{row.email}</span>
          </div>
          <span className="text-sm w-24">{row.role}</span>
          <span className="text-sm w-20">{row.status}</span>
        </div>
      ))}
    </div>
  );
}

export default function TableRowListExample({
  loading,
  rows,
}: {
  loading: boolean;
  rows: Row[];
}) {
  // When loading, pass a placeholder array so the skeleton has shape to mirror.
  const displayRows: Row[] = loading
    ? Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        name: "",
        email: "",
        role: "",
        status: "",
      }))
    : rows;

  return (
    <Skeletonify loading={loading}>
      <TableRowList rows={displayRows} />
    </Skeletonify>
  );
}
