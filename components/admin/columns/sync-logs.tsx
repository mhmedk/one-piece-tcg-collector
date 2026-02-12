"use client";

import { type ColumnDef } from "@tanstack/react-table";
import type { SyncLog } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
import { deleteSyncLog } from "@/lib/admin/actions/sync-logs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

function ActionsCell({ log }: { log: SyncLog }) {
  const router = useRouter();

  return (
    <DeleteDialog
      onConfirm={async () => {
        const result = await deleteSyncLog(log.id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Sync log deleted");
          router.refresh();
        }
      }}
    />
  );
}

export const syncLogColumns: ColumnDef<SyncLog>[] = [
  {
    accessorKey: "sync_type",
    header: "Type",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const variant =
        status === "completed"
          ? "default"
          : status === "failed"
            ? "destructive"
            : "secondary";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "cards_synced",
    header: "Cards",
    cell: ({ row }) => row.original.cards_synced ?? "—",
  },
  {
    accessorKey: "sets_synced",
    header: "Sets",
    cell: ({ row }) => row.original.sets_synced ?? "—",
  },
  {
    accessorKey: "started_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Started
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => new Date(row.original.started_at).toLocaleString(),
  },
  {
    accessorKey: "completed_at",
    header: "Completed",
    cell: ({ row }) =>
      row.original.completed_at
        ? new Date(row.original.completed_at).toLocaleString()
        : "—",
  },
  {
    accessorKey: "error_message",
    header: "Error",
    cell: ({ row }) => (
      <span className="text-destructive truncate max-w-[200px] block">
        {row.original.error_message || "—"}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell log={row.original} />,
  },
];
