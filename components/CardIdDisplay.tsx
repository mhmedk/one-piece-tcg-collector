import { Badge } from "@/components/ui/badge";
import { parseCardId } from "@/lib/utils";

interface CardIdDisplayProps {
  id: string;
  className?: string;
}

export function CardIdDisplay({ id, className }: CardIdDisplayProps) {
  const { baseId, version } = parseCardId(id);

  return (
    <span className={className}>
      {baseId}
      {version > 1 && (
        <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0">
          V{version}
        </Badge>
      )}
    </span>
  );
}
