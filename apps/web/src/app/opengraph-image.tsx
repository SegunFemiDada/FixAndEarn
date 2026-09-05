import { ImageResponse } from "next/og";

export const alt = "FixAndEarn | Hire Trusted Fixers in Nigeria";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background:
            "linear-gradient(135deg, #C8DCF0 0%, #D6E4F7 100%)",
          color: "#1A2B4A",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: 34,
            fontWeight: 700,
            color: "#5B8FCC",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              border: "2px solid #C5D5EE",
              fontSize: 34,
            }}
          >
            🔧
          </div>

          FixAndEarn
        </div>

        <div
          style={{
            marginTop: 42,
            fontSize: 68,
            lineHeight: 1.08,
            fontWeight: 800,
            maxWidth: 1000,
          }}
        >
          Hire Trusted Fixers in Nigeria
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            lineHeight: 1.4,
            maxWidth: 920,
            color: "#6B7C99",
          }}
        >
          Connect with verified skilled workers for repairs, maintenance,
          home services, and on-demand jobs.
        </div>

        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            fontSize: 24,
            fontWeight: 600,
            color: "#5B8FCC",
          }}
        >
          fixandearn.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}