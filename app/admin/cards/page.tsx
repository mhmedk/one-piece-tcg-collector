import { getCards } from "@/lib/admin/actions/cards";
import { DataTable } from "@/components/admin/DataTable";
import { cardColumns } from "@/components/admin/columns/cards";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminCardsPage() {
  const cards = await getCards();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cards</h1>
        <Link href="/admin/cards/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Card
          </Button>
        </Link>
      </div>
      <DataTable
        columns={cardColumns}
        data={cards}
        searchKey="name"
        searchPlaceholder="Search by name..."
      />
    </div>
  );
}
