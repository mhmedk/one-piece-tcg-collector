"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  setParam: string;
  setDisplayName: string;
  from?: string;
}

export function BackButton({ setDisplayName, from }: BackButtonProps) {
  const router = useRouter();

  const getLabel = () => {
    if (from === "collection") return "Back to Collection";
    if (from === "all") return "Back to All Cards";
    return `Back to ${setDisplayName}`;
  };

  const handleClick = () => {
    if (from === "collection") {
      router.push("/collection");
    } else {
      router.back();
    }
  };

  return (
    <Button variant="ghost" className="mb-6" onClick={handleClick}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {getLabel()}
    </Button>
  );
}
