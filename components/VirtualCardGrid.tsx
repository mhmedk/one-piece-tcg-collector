"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
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
  const listRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(6);

  const updateColumns = useCallback(() => {
    if (listRef.current) {
      setColumns(getColumnCount(listRef.current.offsetWidth));
    }
  }, []);

  useEffect(() => {
    updateColumns();

    const observer = new ResizeObserver(updateColumns);
    if (listRef.current) {
      observer.observe(listRef.current);
    }
    return () => observer.disconnect();
  }, [updateColumns]);

  const rowCount = useMemo(() => Math.ceil(cards.length / columns), [cards.length, columns]);

  const estimateRowHeight = useCallback(
    () => {
      if (!listRef.current) return 300;
      const containerWidth = listRef.current.offsetWidth;
      const cardWidth = (containerWidth - GAP * (columns - 1)) / columns;
      return cardWidth * (4.2 / 3) + GAP;
    },
    [columns]
  );

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: estimateRowHeight,
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  return (
    <div ref={listRef}>
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
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
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
