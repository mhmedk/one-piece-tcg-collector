"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import type { Set } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil } from "lucide-react";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
import { deleteSet } from "@/lib/admin/actions/sets";
import { SetForm } from "@/components/admin/forms/SetForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ActionsCell({ set }: { set: Set }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Set: {set.name}</DialogTitle>
          </DialogHeader>
          <SetForm set={set} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
      <DeleteDialog
        onConfirm={async () => {
          const result = await deleteSet(set.id);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success("Set deleted");
            router.refresh();
          }
        }}
        description={`This will permanently delete set "${set.name}" (${set.label}).`}
      />
    </div>
  );
}

export const setColumns: ColumnDef<Set>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "label",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Label
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "prefix",
    header: "Prefix",
  },
  {
    accessorKey: "raw_title",
    header: "Raw Title",
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell set={row.original} />,
  },
];
