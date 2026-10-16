import type { Metadata } from "next";
import KothLive from "./KothLive";

export const metadata: Metadata = {
  title: "All-Time 5 — The Board | NDMLABS",
  description:
    "The daily board, the week, the records and the King of the Hill for All-Time 5.",
};

export default function KothPage() {
  return (
    <main>
      <KothLive />
    </main>
  );
}
