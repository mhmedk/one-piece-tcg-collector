import { getUsers } from "@/lib/admin/actions/users";
import { DataTable } from "@/components/admin/DataTable";
import { userColumns } from "@/components/admin/columns/users";

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>
      <DataTable
        columns={userColumns}
        data={users}
        searchKey="email"
        searchPlaceholder="Search by email..."
      />
    </div>
  );
}
