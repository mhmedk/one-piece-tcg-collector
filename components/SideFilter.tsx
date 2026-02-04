import { SetType } from "@/types/types";
import Link from "next/link";

const SideFilter = async ({ selectedSetId }: { selectedSetId: string }) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_OPTCG_API_URL}/allSets`,
  );

  const sets: SetType[] = await response.json();

  return (
    <ul className="space-y-1">
      {sets.map((set) => (
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
