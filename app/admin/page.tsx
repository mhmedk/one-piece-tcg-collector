import { adminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreditCard,
  Package,
  Users,
  FolderOpen,
  DollarSign,
  FileText,
} from "lucide-react";

const tables = [
  { name: "Cards", table: "cards" as const, icon: CreditCard },
  { name: "Sets", table: "sets" as const, icon: Package },
  { name: "Users", table: "users" as const, icon: Users },
  { name: "Collections", table: "collection_entries" as const, icon: FolderOpen },
  { name: "Price History", table: "price_history" as const, icon: DollarSign },
  { name: "Sync Logs", table: "sync_logs" as const, icon: FileText },
] as const;

export default async function AdminDashboard() {
  const counts = await Promise.all(
    tables.map(async ({ table }) => {
      const { count } = await adminClient
        .from(table)
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map(({ name, icon: Icon }, i) => (
          <Card key={name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{name}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {counts[i].toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
