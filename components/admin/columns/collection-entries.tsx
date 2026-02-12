"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil } from "lucide-react";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
import { deleteCollectionEntry } from "@/lib/admin/actions/collection-entries";
import { CollectionEntryForm } from "@/components/admin/forms/CollectionEntryForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CollectionEntry } from "@/types/database";

type CollectionEntryRow = CollectionEntry & {
  card: { name: string } | null;
  user: { email: string } | null;
};

function ActionsCell({ entry }: { entry: CollectionEntryRow }) {
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
            <DialogTitle>Edit Collection Entry: {entry.card_id}</DialogTitle>
          </DialogHeader>
          <CollectionEntryForm entry={entry} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
      <DeleteDialog
        onConfirm={async () => {
          const result = await deleteCollectionEntry(entry.id);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success("Entry deleted");
            router.refresh();
          }
        }}
      />
    </div>
  );
}

export const collectionEntryColumns: ColumnDef<CollectionEntryRow>[] = [
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => row.original.user?.email ?? row.original.user_id,
  },
  {
    accessorKey: "card_id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Card ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    id: "card_name",
    header: "Card Name",
    cell: ({ row }) => row.original.card?.name ?? "—",
  },
  {
    accessorKey: "quantity",
    header: "Qty",
  },
  {
    accessorKey: "condition",
    header: "Condition",
  },
  {
    accessorKey: "purchase_price",
    header: "Price",
    cell: ({ row }) =>
      row.original.purchase_price != null
        ? `$${row.original.purchase_price.toFixed(2)}`
        : "—",
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell entry={row.original} />,
  },
];
