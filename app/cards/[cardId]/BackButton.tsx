"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  setParam: string;
  setDisplayName: string;
  from?: string;
}

export function BackButton({ setParam, setDisplayName, from }: BackButtonProps) {
  const router = useRouter();

  const isFromCollection = from === "collection";

  const handleClick = () => {
    if (isFromCollection) {
      router.push("/collection");
    } else {
      router.push(`/?set=${setParam}`);
    }
  };

  return (
    <Button variant="ghost" className="mb-6" onClick={handleClick}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {isFromCollection ? "Back to Collection" : `Back to ${setDisplayName}`}
    </Button>
  );
}
