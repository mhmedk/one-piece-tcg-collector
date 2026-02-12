import { ImageResponse } from "next/og";

export const alt = "My OP Binder — One Piece TCG Collection Tracker";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            MY OP
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#e11d48",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            BINDER
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "#a1a1aa",
            marginTop: 8,
          }}
        >
          Track and manage your One Piece TCG card collection
        </div>

        {/* Decorative card shapes */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 48,
          }}
        >
          {["#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#eab308"].map(
            (color) => (
              <div
                key={color}
                style={{
                  width: 48,
                  height: 67,
                  borderRadius: 6,
                  background: color,
                  opacity: 0.6,
                }}
              />
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
