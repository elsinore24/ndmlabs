// The All-Time Five logotype, as markup rather than an image: crisp at any
// size, transparent by nature, and it inherits nothing from the page it sits
// on. Recreates Dan's lockup (2026-09-17): ALL-TIME in heavy italic over a
// small tracked BASKETBALL, both right-aligned to a thin gold rule, and a big
// gold 5 — the gradient runs light to dark top-down like the original.

const gold = "linear-gradient(180deg, #ffe08a 0%, #f2c14e 45%, #b8862a 100%)";

export default function AllTimeFiveMark({ scale = 1 }: { scale?: number }) {
  const px = (n: number) => `${n * scale}px`;
  return (
    <span
      aria-label="All-Time Five, basketball"
      style={{ display: "inline-flex", alignItems: "center", gap: px(10), lineHeight: 1, whiteSpace: "nowrap" }}
    >
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <span
          style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 900,
            fontStyle: "italic",
            fontSize: px(20),
            letterSpacing: "-0.01em",
            color: "#ffffff",
          }}
        >
          ALL-TIME
        </span>
        <span
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
            fontSize: px(7.5),
            letterSpacing: "0.34em",
            color: "#9aa6b8",
            marginTop: px(3),
            marginRight: "-0.34em",   // the tracking's trailing space, so the L lines up under the E
          }}
        >
          BASKETBALL
        </span>
      </span>
      <span
        aria-hidden
        style={{ width: px(2), height: px(30), borderRadius: px(1), background: "linear-gradient(180deg, #f2c14e, #6e4f10)" }}
      />
      <span
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
          fontWeight: 900,
          fontSize: px(34),
          backgroundImage: gold,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
      >
        5
      </span>
    </span>
  );
}
