import type { Metadata } from "next";
import GoatBoard from "./GoatBoard";

export const metadata: Metadata = {
  title: "The GOAT Index | NDMLABS",
  description:
    "Every qualifying player in NBA history, scored on 50-odd measurable attributes, " +
    "each standardized within its own season so eras compare honestly.",
};

export default function GoatPage() {
  return (
    <main>
      <GoatBoard />
    </main>
  );
}
