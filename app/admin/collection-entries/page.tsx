import { getCollectionEntries } from "@/lib/admin/actions/collection-entries";
import { DataTable } from "@/components/admin/DataTable";
import { collectionEntryColumns } from "@/components/admin/columns/collection-entries";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminCollectionEntriesPage() {
  const entries = await getCollectionEntries();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Collection Entries</h1>
        <Link href="/admin/collection-entries/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </Link>
      </div>
      <DataTable
        columns={collectionEntryColumns}
        data={entries}
        searchKey="card_id"
        searchPlaceholder="Search by card ID..."
      />
    </div>
  );
}
