import { ImageResponse } from "next/og";
import { getCard } from "@/lib/data";

export const alt = "Card details";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const rarityColors: Record<string, string> = {
  Common: "#6b7280",
  Uncommon: "#16a34a",
  Rare: "#2563eb",
  SuperRare: "#9333ea",
  SecretRare: "#eab308",
  Leader: "#f97316",
  Special: "#ec4899",
  Promo: "#06b6d4",
};

export default async function Image({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const card = await getCard(cardId);

  if (!card) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0a",
            color: "#ffffff",
            fontSize: 48,
            fontFamily: "sans-serif",
          }}
        >
          Card Not Found
        </div>
      ),
      { ...size }
    );
  }

  const rarityColor = rarityColors[card.rarity] ?? "#6b7280";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          fontFamily: "sans-serif",
          padding: 48,
        }}
      >
        {/* Card image */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 48,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.img_url}
            alt={card.name}
            width={350}
            height={490}
            style={{
              borderRadius: 12,
              objectFit: "cover",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          />
        </div>

        {/* Card details */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            gap: 16,
          }}
        >
          {/* Card name */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            {card.name}
          </div>

          {/* Card ID */}
          <div
            style={{
              fontSize: 24,
              color: "#71717a",
            }}
          >
            {card.id}
          </div>

          {/* Rarity + Category */}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <div
              style={{
                background: rarityColor,
                color: "#ffffff",
                padding: "8px 20px",
                borderRadius: 9999,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {card.rarity}
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#d4d4d8",
                padding: "8px 20px",
                borderRadius: 9999,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {card.category}
            </div>
          </div>

          {/* Colors */}
          {card.colors.length > 0 && (
            <div
              style={{
                fontSize: 24,
                color: "#a1a1aa",
                marginTop: 4,
              }}
            >
              {card.colors.join(" / ")}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: "flex", gap: 32, marginTop: 8 }}>
            {card.cost !== null && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 16, color: "#71717a" }}>Cost</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#ffffff" }}>
                  {card.cost}
                </div>
              </div>
            )}
            {card.power !== null && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 16, color: "#71717a" }}>Power</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#ffffff" }}>
                  {card.power}
                </div>
              </div>
            )}
            {card.counter !== null && card.counter > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 16, color: "#71717a" }}>Counter</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#ffffff" }}>
                  +{card.counter}
                </div>
              </div>
            )}
            {card.life !== null && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 16, color: "#71717a" }}>Life</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#ffffff" }}>
                  {card.life}
                </div>
              </div>
            )}
          </div>

          {/* Branding */}
          <div
            style={{
              display: "flex",
              marginTop: "auto",
              fontSize: 20,
              gap: 8,
            }}
          >
            <span style={{ color: "#ffffff", fontWeight: 700 }}>MY OP</span>
            <span style={{ color: "#e11d48", fontWeight: 700 }}>BINDER</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
