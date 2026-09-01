import type { Metadata } from "next";
import KothBoard from "./KothBoard";

export const metadata: Metadata = {
  title: "Coach of the Year — Leaderboards | NDMLABS",
  description:
    "Daily challenge standings and King of the Hill records for Coach of the Year.",
};

export default function KothPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <a href="/" className="font-mono text-xs text-gray-500 hover:text-[#FFB020]">
          ← NDMLABS
        </a>
        <h1 className="mt-6 text-4xl sm:text-5xl font-bold">
          Coach of the <span className="text-[#FFB020]">Year</span>
        </h1>
        <p className="mt-2 font-mono text-sm text-gray-400">
          THE DAILY BOARD · KING OF THE HILL
        </p>
        <KothBoard />
        <p className="mt-12 font-mono text-xs text-gray-600">
          Scores are player-reported for now. Player names and seasons shown as
          text only.
        </p>
      </div>
    </main>
  );
}
