import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCardId(id: string): { baseId: string; version: number } {
  const match = id.match(/^(.+?)_p(\d+)$/);
  if (match) {
    return { baseId: match[1], version: Number(match[2]) + 1 };
  }
  return { baseId: id, version: 1 };
}
