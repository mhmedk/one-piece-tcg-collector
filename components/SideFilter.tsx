import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const SideFilter = async ({ selectedSetId }: { selectedSetId: string }) => {
  const supabase = await createClient();

  const { data: sets } = await supabase
    .from("sets")
    .select("set_id, set_name")
    .order("set_id");

  return (
    <ul className="space-y-1">
      {sets?.map((set) => (
        <li key={set.set_id}>
          <Link
            href={`/?set=${set.set_id}`}
            className={`block rounded px-3 py-2 text-sm transition-colors ${
              selectedSetId === set.set_id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {set.set_id} - {set.set_name}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default SideFilter;
