import { ImageResponse } from "next/og";

export const alt = "SalarySabi funded contributor rewards";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", padding: "70px 78px", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "white", background: "#063f2e", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 800 }}>
        <span style={{ color: "#b9f44b", fontSize: 58, lineHeight: 1 }}>S</span>
        <span>SalarySabi</span>
      </div>
      <div style={{ maxWidth: 950, display: "flex", flexDirection: "column", gap: 22 }}>
        <span style={{ color: "#b9f44b", fontSize: 24, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Funded contributor programme</span>
        <span style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.02, letterSpacing: -3 }}>Earn rewards for approved pay information.</span>
        <span style={{ color: "#dce9e2", fontSize: 30, lineHeight: 1.35 }}>Anonymous salary reports and verified Nigerian job leads.</span>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 23, fontWeight: 700 }}>
        <span style={{ padding: "12px 18px", color: "#063f2e", background: "#b9f44b" }}>Submit evidence</span>
        <span style={{ padding: "12px 18px", border: "1px solid #7fa394" }}>Pass independent review</span>
        <span style={{ padding: "12px 18px", border: "1px solid #7fa394" }}>Track your reward</span>
      </div>
    </div>,
    size,
  );
}
