import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const SideFilter = async ({ selectedSetLabel }: { selectedSetLabel: string }) => {
  const supabase = await createClient();

  const { data: sets } = await supabase
    .from("sets")
    .select("id, label, name")
    .order("label");

  return (
    <ul className="space-y-1">
      {sets?.filter((set) => set.label !== null).map((set) => (
        <li key={set.id}>
          <Link
            href={`/?set=${set.label}`}
            className={`block rounded px-3 py-2 text-sm transition-colors ${
              selectedSetLabel === set.label
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {set.label} - {set.name}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default SideFilter;
