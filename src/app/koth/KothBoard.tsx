"use client";

// The site's first live-data component. Plain browser fetch against
// Supabase's REST API with the publishable key — no client library, and the
// key is public by design: row-level security limits it to world-readable
// leaderboards. The THRONE tab ships dark until the global mode is live in
// the app (step 5 of the passdown).

import { useEffect, useState } from "react";

const SUPABASE_URL = "https://lopawitfeyhtzppfchik.supabase.co";
const SUPABASE_KEY = "sb_publishable_Jy4XRKu11PdztPoCSZfduw_kHed6SyY";
const SHOW_THRONE = false;

type DailyRow = {
  rank: number;
  handle: string;
  score: number;
  score_opp: number;
  venue: string | null;
};
type ReignRow = {
  handle: string;
  team_name: string;
  defenses: number;
  crowned_at: string;
  ended_at: string | null;
};

async function rest(path: string): Promise<unknown[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function handleMap(uids: string[]): Promise<Record<string, string>> {
  if (uids.length === 0) return {};
  const rows = (await rest(
    `profiles?uid=in.(${uids.join(",")})&select=uid,handle`
  )) as { uid: string; handle: string }[];
  return Object.fromEntries(rows.map((r) => [r.uid, r.handle]));
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function KothBoard() {
  const tabs = SHOW_THRONE
    ? (["DAILY", "RECORDS", "THE THRONE"] as const)
    : (["DAILY", "RECORDS"] as const);
  const [tab, setTab] = useState<string>("DAILY");
  const [daily, setDaily] = useState<DailyRow[] | null>(null);
  const [reigns, setReigns] = useState<ReignRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const scores = (await rest(
          `daily_scores?day=eq.${todayUTC()}` +
            `&select=uid,score,score_opp,venue&order=score.desc,created_at.asc&limit=100`
        )) as { uid: string; score: number; score_opp: number; venue: string | null }[];
        const handles = await handleMap([...new Set(scores.map((s) => s.uid))]);
        setDaily(
          scores.map((s, i) => ({
            rank: i + 1,
            handle: handles[s.uid] ?? "COACH",
            score: s.score,
            score_opp: s.score_opp,
            venue: s.venue,
          }))
        );

        const solo = (await rest(
          `koth_solo?select=uid,team_name,defenses,crowned_at,ended_at` +
            `&order=defenses.desc,crowned_at.asc&limit=50`
        )) as {
          uid: string; team_name: string; defenses: number;
          crowned_at: string; ended_at: string | null;
        }[];
        const soloHandles = await handleMap([...new Set(solo.map((r) => r.uid))]);
        setReigns(
          solo.map((r) => ({
            handle: soloHandles[r.uid] ?? "COACH",
            team_name: r.team_name,
            defenses: r.defenses,
            crowned_at: r.crowned_at,
            ended_at: r.ended_at,
          }))
        );
      } catch {
        setFailed(true);
      }
    })();
  }, []);

  return (
    <div className="mt-10">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-mono text-xs tracking-widest rounded-lg border transition-colors ${
              tab === t
                ? "border-[#FFB020] text-[#FFB020]"
                : "border-gray-800 text-gray-500 hover:text-gray-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {failed && (
        <p className="mt-8 font-mono text-sm text-gray-500">
          The board didn&apos;t answer. Refresh to try again.
        </p>
      )}

      {tab === "DAILY" && !failed && (
        <section className="mt-6">
          <h2 className="font-mono text-xs tracking-widest text-gray-500">
            TOP 100 · {todayUTC()} · EVERYBODY PLAYS THE SAME GAME
          </h2>
          {daily === null ? (
            <p className="mt-6 font-mono text-sm text-gray-600">Loading…</p>
          ) : daily.length === 0 ? (
            <p className="mt-6 font-mono text-sm text-gray-500">
              Nobody has posted today&apos;s game yet.
            </p>
          ) : (
            <ol className="mt-4 divide-y divide-gray-900">
              {daily.map((r) => (
                <li key={r.rank} className="flex items-baseline gap-3 py-2">
                  <span
                    className={`w-8 text-right font-mono text-sm ${
                      r.rank <= 3 ? "text-[#FFB020]" : "text-gray-600"
                    }`}
                  >
                    {r.rank}
                  </span>
                  <span className="font-bold">{r.handle}</span>
                  {r.venue && (
                    <span className="font-mono text-[10px] text-gray-600 uppercase">
                      {r.venue}
                    </span>
                  )}
                  <span
                    className={`ml-auto font-mono text-sm tabular-nums ${
                      r.score > r.score_opp ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {r.score}–{r.score_opp}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {tab === "RECORDS" && !failed && (
        <section className="mt-6">
          <h2 className="font-mono text-xs tracking-widest text-gray-500">
            LONGEST REIGNS · KING OF THE HILL
          </h2>
          {reigns === null ? (
            <p className="mt-6 font-mono text-sm text-gray-600">Loading…</p>
          ) : reigns.length === 0 ? (
            <p className="mt-6 font-mono text-sm text-gray-500">
              No finished reigns on record yet.
            </p>
          ) : (
            <ol className="mt-4 divide-y divide-gray-900">
              {reigns.map((r, i) => (
                <li key={i} className="flex items-baseline gap-3 py-2">
                  <span className="w-8 text-right font-mono text-sm text-gray-600">
                    {i + 1}
                  </span>
                  <span className="font-bold">{r.team_name}</span>
                  <span className="font-mono text-[10px] text-gray-600">
                    {r.handle}
                  </span>
                  <span className="ml-auto font-mono text-sm tabular-nums text-[#FFB020]">
                    {r.defenses} {r.defenses === 1 ? "DEFENSE" : "DEFENSES"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
