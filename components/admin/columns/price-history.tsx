"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil } from "lucide-react";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
import { deletePriceHistory } from "@/lib/admin/actions/price-history";
import { PriceHistoryForm } from "@/components/admin/forms/PriceHistoryForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PriceHistory } from "@/types/database";

type PriceHistoryRow = PriceHistory & {
  card: { name: string } | null;
};

function ActionsCell({ entry }: { entry: PriceHistoryRow }) {
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
            <DialogTitle>Edit Price Entry: {entry.card_id}</DialogTitle>
          </DialogHeader>
          <PriceHistoryForm entry={entry} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
      <DeleteDialog
        onConfirm={async () => {
          const result = await deletePriceHistory(entry.id);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success("Price entry deleted");
            router.refresh();
          }
        }}
      />
    </div>
  );
}

export const priceHistoryColumns: ColumnDef<PriceHistoryRow>[] = [
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
    accessorKey: "market_price",
    header: "Market Price",
    cell: ({ row }) =>
      row.original.market_price != null
        ? `$${row.original.market_price.toFixed(2)}`
        : "—",
  },
  {
    accessorKey: "recorded_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Recorded At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => new Date(row.original.recorded_at).toLocaleString(),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell entry={row.original} />,
  },
];
