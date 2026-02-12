import { getSyncLogs } from "@/lib/admin/actions/sync-logs";
import { DataTable } from "@/components/admin/DataTable";
import { syncLogColumns } from "@/components/admin/columns/sync-logs";

export default async function AdminSyncLogsPage() {
  const logs = await getSyncLogs();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sync Logs</h1>
      </div>
      <DataTable
        columns={syncLogColumns}
        data={logs}
        searchKey="sync_type"
        searchPlaceholder="Search by type..."
      />
    </div>
  );
}
