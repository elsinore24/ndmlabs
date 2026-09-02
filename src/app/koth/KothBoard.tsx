"use client";

// The site's first live-data component. Plain browser fetch against
// Supabase's REST API with the publishable key — no client library, and the
// key is public by design: row-level security limits it to world-readable
// leaderboards. The THRONE tab ships dark until the global mode is live in
// the app (step 5 of the passdown).

import { useEffect, useState } from "react";

const SUPABASE_URL = "https://lopawitfeyhtzppfchik.supabase.co";
const SUPABASE_KEY = "sb_publishable_Jy4XRKu11PdztPoCSZfduw_kHed6SyY";
const SHOW_THRONE = true;

type DailyRow = {
  rank: number;
  handle: string;
  score: number;
  score_opp: number;
  venue: string | null;
};
type Throne = {
  version: number;
  holder_handle: string;
  team_name: string;
  defenses: number;
  claimed_at: string;
  five: { slot: string; pid: string; name?: string }[];
};
type LineageEntry = {
  id: number;
  holder_handle: string;
  team_name: string;
  defenses: number;
  dethroned_by_handle: string;
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
  const [throne, setThrone] = useState<Throne | null>(null);
  const [lineage, setLineage] = useState<LineageEntry[]>([]);
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
        if (SHOW_THRONE) {
          const throneRows = (await rest(
            "throne?id=eq.1&select=version,holder_handle,team_name,defenses,claimed_at,five"
          )) as Throne[];
          setThrone(throneRows[0] ?? null);
          setLineage(
            (await rest(
              "throne_lineage?select=id,holder_handle,team_name,defenses,dethroned_by_handle&order=version.desc&limit=25"
            )) as LineageEntry[]
          );
        }
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

      {tab === "THE THRONE" && !failed && (
        <section className="mt-6">
          {throne === null ? (
            <p className="mt-6 font-mono text-sm text-gray-600">Loading…</p>
          ) : (
            <div>
              <h2 className="font-mono text-xs tracking-widest text-gray-500">
                ONE THRONE FOR THE WHOLE WORLD · BEST-OF-5 TO TAKE IT
              </h2>
              <div className="mt-4 rounded-2xl border border-[#FFB020]/40 bg-gray-900/60 p-6">
                <p className="font-mono text-[10px] tracking-widest text-[#FFB020]">
                  👑 CURRENT KING · {throne.defenses}{" "}
                  {throne.defenses === 1 ? "DEFENSE" : "DEFENSES"}
                </p>
                <p className="mt-1 text-3xl font-bold">{throne.team_name}</p>
                <p className="font-mono text-xs text-gray-500">
                  {throne.holder_handle} · crowned{" "}
                  {throne.claimed_at?.slice(0, 10)}
                </p>
                <ul className="mt-4 space-y-1">
                  {throne.five.map((entry) => (
                    <li key={entry.slot} className="flex gap-3 font-mono text-sm">
                      <span className="w-6 text-gray-600">{entry.slot}</span>
                      <span className="text-white">
                        {entry.name ?? entry.pid.split(":")[0]}
                      </span>
                      <span className="text-gray-600">
                        &apos;{entry.pid.split(":")[1]?.slice(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <h3 className="mt-8 font-mono text-xs tracking-widest text-gray-500">
                THE LINEAGE
              </h3>
              {lineage.length === 0 ? (
                <p className="mt-3 font-mono text-sm text-gray-500">
                  No King has fallen yet. The Gatekeepers await.
                </p>
              ) : (
                <ol className="mt-3 divide-y divide-gray-900">
                  {lineage.map((r) => (
                    <li key={r.id} className="flex items-baseline gap-3 py-2">
                      <span className="font-bold">{r.team_name}</span>
                      <span className="font-mono text-[10px] text-gray-600">
                        {r.holder_handle}
                      </span>
                      <span className="ml-auto font-mono text-xs text-gray-500">
                        {r.defenses} def · fell to {r.dethroned_by_handle}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
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
