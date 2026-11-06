import type { Metadata } from "next";
import { APP_STORE_ID } from "./lib";
import KothLive from "./KothLive";

export const metadata: Metadata = {
  title: "All-Time 5 — The Board | NDMLABS",
  description:
    "The daily board, the week, the records and the King of the Hill for All-Time 5.",
  // Safari's Smart App Banner: "Open" with the app, "Get" without.
  itunes: { appId: APP_STORE_ID },
};

export default function KothPage() {
  return (
    <main>
      <KothLive />
    </main>
  );
}
