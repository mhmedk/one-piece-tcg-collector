"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import type { Card } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil } from "lucide-react";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
import { deleteCard } from "@/lib/admin/actions/cards";
import { CardForm } from "@/components/admin/forms/CardForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ActionsCell({ card }: { card: Card }) {
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
            <DialogTitle>Edit Card: {card.name}</DialogTitle>
          </DialogHeader>
          <CardForm card={card} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
      <DeleteDialog
        onConfirm={async () => {
          const result = await deleteCard(card.id);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success("Card deleted");
            router.refresh();
          }
        }}
        description={`This will permanently delete card "${card.name}" (${card.id}).`}
      />
    </div>
  );
}

export const cardColumns: ColumnDef<Card>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        ID
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
    accessorKey: "rarity",
    header: "Rarity",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "colors",
    header: "Colors",
    cell: ({ row }) => (
      <div className="flex gap-1 flex-wrap">
        {row.original.colors.map((c) => (
          <Badge key={c} variant="secondary" className="text-xs">
            {c}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "pack_id",
    header: "Pack",
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell card={row.original} />,
  },
];
