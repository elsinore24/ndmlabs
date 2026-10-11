import type { Metadata } from "next";
import ChallengeLanding from "./ChallengeLanding";

export const metadata: Metadata = {
  title: "A friend challenged you | All-Time 5",
  description: "Same draft. Same opponent. Beat their score in All-Time 5.",
};

export default function ChallengePage() {
  return (
    <main>
      <ChallengeLanding />
    </main>
  );
}
