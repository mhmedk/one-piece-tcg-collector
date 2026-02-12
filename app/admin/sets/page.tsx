import { getSets } from "@/lib/admin/actions/sets";
import { DataTable } from "@/components/admin/DataTable";
import { setColumns } from "@/components/admin/columns/sets";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminSetsPage() {
  const sets = await getSets();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sets</h1>
        <Link href="/admin/sets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Set
          </Button>
        </Link>
      </div>
      <DataTable
        columns={setColumns}
        data={sets}
        searchKey="name"
        searchPlaceholder="Search by name..."
      />
    </div>
  );
}
