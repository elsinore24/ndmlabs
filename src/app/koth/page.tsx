import type { Metadata } from "next";
import KothLive from "./KothLive";

export const metadata: Metadata = {
  title: "Coach of the Year — The Board | NDMLABS",
  description:
    "The daily board, the week, the records and the King of the Hill for Coach of the Year.",
};

export default function KothPage() {
  return (
    <main>
      <KothLive />
    </main>
  );
}
