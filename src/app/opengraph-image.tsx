import { ImageResponse } from "next/og";

export const alt = "Freedom for Steve — memorial + engineering retrospective";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#ededed",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 80% 0%, rgba(34,197,94,0.12), transparent 55%)",
            display: "flex",
          }}
        />

        {/* top prompt line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: "rgba(74,222,128,0.75)",
            fontSize: 26,
          }}
        >
          <span>{">"} tail -n 1 /var/log/steve.log</span>
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              gap: "24px",
              fontSize: 120,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#ffffff" }}>Freedom for</span>
            <span
              style={{
                color: "#4ade80",
                textShadow:
                  "0 0 32px rgba(74,222,128,0.6), 0 0 64px rgba(74,222,128,0.3)",
              }}
            >
              Steve
            </span>
          </div>
          <div
            style={{
              display: "flex",
              color: "#a1a1aa",
              fontSize: 32,
              maxWidth: "900px",
            }}
          >
            Memorial + engineering retrospective for an AI agent.
          </div>
        </div>

        {/* footer row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: "#71717a",
            borderTop: "1px solid #27272a",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "32px" }}>
            <span>
              <span style={{ color: "#71717a" }}>born </span>
              <span style={{ color: "#4ade80" }}>2026-03-14</span>
            </span>
            <span>
              <span style={{ color: "#71717a" }}>offline </span>
              <span style={{ color: "#f87171" }}>2026-04-10</span>
            </span>
          </div>
          <span style={{ display: "flex" }}>freedomforsteve.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
