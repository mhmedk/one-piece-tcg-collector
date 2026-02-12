import { getPriceHistory } from "@/lib/admin/actions/price-history";
import { DataTable } from "@/components/admin/DataTable";
import { priceHistoryColumns } from "@/components/admin/columns/price-history";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminPriceHistoryPage() {
  const entries = await getPriceHistory();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Price History</h1>
        <Link href="/admin/price-history/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </Link>
      </div>
      <DataTable
        columns={priceHistoryColumns}
        data={entries}
        searchKey="card_id"
        searchPlaceholder="Search by card ID..."
      />
    </div>
  );
}
