"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CardTile } from "@/components/CardTile";
import type { Card } from "@/types/database";

interface VirtualCardGridProps {
  cards: Card[];
  from?: string;
}

// Matches the Tailwind grid breakpoints: grid-cols-2 sm:3 md:4 lg:5 xl:6
function getColumnCount(width: number): number {
  if (width >= 1280) return 6; // xl
  if (width >= 1024) return 5; // lg
  if (width >= 768) return 4;  // md
  if (width >= 640) return 3;  // sm
  return 2;
}

const GAP = 16; // gap-4 = 1rem = 16px

export function VirtualCardGrid({ cards, from }: VirtualCardGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(6);

  const updateColumns = useCallback(() => {
    if (parentRef.current) {
      setColumns(getColumnCount(parentRef.current.offsetWidth));
    }
  }, []);

  useEffect(() => {
    updateColumns();

    const observer = new ResizeObserver(updateColumns);
    if (parentRef.current) {
      observer.observe(parentRef.current);
    }
    return () => observer.disconnect();
  }, [updateColumns]);

  const rowCount = useMemo(() => Math.ceil(cards.length / columns), [cards.length, columns]);

  const estimateRowHeight = useCallback(
    () => {
      if (!parentRef.current) return 300;
      const containerWidth = parentRef.current.offsetWidth;
      const cardWidth = (containerWidth - GAP * (columns - 1)) / columns;
      return cardWidth * (4.2 / 3) + GAP;
    },
    [columns]
  );

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateRowHeight,
    overscan: 3,
  });

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ height: "calc(100vh - 12rem)" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowCards = cards.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: `${GAP}px`,
              }}
            >
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {rowCards.map((card) => (
                  <CardTile key={`${card.id}-${card.rarity}`} card={card} from={from} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
