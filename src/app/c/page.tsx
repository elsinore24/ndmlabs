import type { Metadata } from "next";
import { APP_STORE_ID } from "../koth/lib";
import ChallengeLanding from "./ChallengeLanding";

export const metadata: Metadata = {
  title: "A friend challenged you | All-Time 5",
  description: "Same draft. Same opponent. Beat their score in All-Time 5.",
  // Safari's Smart App Banner: "Open" with the app, "Get" without.
  itunes: { appId: APP_STORE_ID },
};

export default function ChallengePage() {
  return (
    <main>
      <ChallengeLanding />
    </main>
  );
}
