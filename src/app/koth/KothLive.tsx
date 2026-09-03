"use client";

// The Board, board-first (koth-web-board-passdown.md): ticker, site nav, a
// compact King strip as the headline, then the tabs and the sidebar. One
// component owns the reads and the 60-second visible-tab poll; the pieces
// below it are pure renderers. Display only — no sign-in (Dan, 2026-09-02).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import {
  APP_STORE_URL,
  type Challenge, type DailyRaw, type DailyRow, type LineageEntry, type Move,
  type BestRun, type SoloReign, type Throne, type TopPlayer, type Venue, type WeekRow,
  type Profile,
  clockTime, defensesLabel, fiveLine, grouped, leadPlayer, longDate,
  handleNames, minutesAgo, mondayUTC, monthName, monthStartUTC, movement, ordinal, playerLabel,
  profileMap, rest, scoreline, statLine,
  shortDate, signed, todayUTC, venueChip, venueFallback, venueName,
} from "./lib";
import "./koth.css";

// No THE THRONE tab: the King strip at the top of the page IS the throne
// (Dan, 2026-09-03), and a tab repeating it was the same fact twice. Its
// lineage moved into RECORDS, where the rest of the history lives.
const TABS = ["DAILY", "THE WEEK", "THE CLIMB", "RECORDS"] as const;
type Tab = (typeof TABS)[number];
const POLL_MS = 60_000;

type Board = {
  throne: Throne | null;
  lineage: LineageEntry[];
  challenges: Challenge[];
  daily: DailyRow[];
  week: WeekRow[];
  solo: SoloReign[];
  bestMargins: { name: string; scoreline: string; margin: number; day: string }[];
  mostWins: { name: string; wins: number }[];
  /** handle → the name to print. The handle is identity, never display
      (Dan, 2026-09-03): the franchise name belongs in the app, not here. */
  names: Record<string, string>;
  topPlayers: TopPlayer[];
  runs: BestRun[];
  today: Venue;
  tomorrow: Venue;
  /** COACH OF THE DAY: today's #1, or the latest day with results until
      today's first post lands. */
  coach: { row: DailyRow; day: string; venue: Venue; topFinishes: number } | null;
  profiles: Record<string, Profile>;
  /** The reigning King's coach, who outlives every team rename. */
  throneCoach: string | null;
  fetchedAt: number;
};

export default function KothLive() {
  const [tab, setTab] = useState<Tab>("DAILY");
  const [board, setBoard] = useState<Board | null>(null);
  const [failed, setFailed] = useState(false);
  const [, tick] = useState(0);
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const today = todayUTC();
      const [throneRows, lineage, challenges, dailyRaw, weekRaw, solo, venues, winsRaw, monthRaw,
             topPlayers, runs] =
        await Promise.all([
          rest<Throne[]>(
            "throne?id=eq.1&select=version,holder_uid,holder_handle,team_name,defenses,claimed_at,five,lead_player"
          ),
          rest<LineageEntry[]>(
            "throne_lineage?select=id,version,holder_uid,holder_handle,team_name,defenses,claimed_at,ended_at,dethroned_by_handle,lead_player&order=version.desc&limit=50"
          ),
          rest<Challenge[]>(
            "challenges?select=id,challenger_handle,throne_version,result,applied,wins_you,wins_king,created_at&order=created_at.desc&limit=12"
          ),
          // Winners first, then margin — the daily_board view computes both
          // so the ordering happens server-side (Dan, 2026-09-02).
          rest<DailyRaw[]>(
            `daily_board?day=eq.${today}&select=uid,score,score_opp,venue,created_at,won,margin,five&order=won.desc,margin.desc,created_at.asc&limit=100`
          ),
          rest<Omit<WeekRow, "rank" | "handle">[]>(
            `weekly_board?week=eq.${mondayUTC()}&select=uid,games,wins,margin&order=wins.desc,margin.desc,first_played.asc&limit=100`
          ),
          rest<(SoloReign & { uid: string })[]>(
            "koth_solo?select=uid,team_name,defenses,crowned_at,ended_at&order=defenses.desc,crowned_at.asc&limit=25"
          ),
          rest<Venue[]>(`daily_venues?day=in.(${today},${todayUTC(1)})&select=*`),
          rest<{ uid: string; day: string; score: number; score_opp: number; margin: number }[]>(
            "daily_board?won=is.true&select=uid,day,score,score_opp,margin&order=margin.desc&limit=1000"
          ),
          // This month's boards in board order, so the first row per day is
          // that day's #1 — the COACH OF THE DAY badge counts those.
          rest<{ uid: string; day: string }[]>(
            `daily_board?day=gte.${monthStartUTC()}&select=uid,day&order=day.desc,won.desc,margin.desc,created_at.asc&limit=3000`
          ),
          // The view has already kept each player-season's best game this
          // month, so ten rows here are ten different men.
          rest<TopPlayer[]>(
            "top_players_month?select=player_id,player_name,player_season,coach_handle,uid,played_on,pts,reb,ast,stl,blk,composite&order=composite.desc&limit=10"
          ),
          // Best climb per coach — the view has already deduped, so this is a
          // board of people, not of one person's afternoon.
          rest<BestRun[]>(
            "best_runs?select=uid,run_id,coach_handle,score,rungs_cleared,summit_tier,top_rung,clean,ran_the_table,finished_at&order=score.desc&limit=100"
          ),
        ]);

      // One profile read covers every name on the page, the throne's holder
      // included — the coach is looked up by uid, not carried on the row,
      // because it is read live rather than snapshotted.
      const profiles = await profileMap([
        ...dailyRaw.map((r) => r.uid),
        ...weekRaw.map((r) => r.uid),
        ...solo.map((r) => r.uid),
        ...winsRaw.map((r) => r.uid),
        ...runs.map((r) => r.uid),
        ...(throneRows[0] ? [throneRows[0].holder_uid] : []),
      ]);
      const nameOf = (uid: string) => profiles[uid]?.handle ?? "COACH";
      const coachOf = (uid: string) => profiles[uid]?.coach ?? null;

      const moves = movement(today, dailyRaw.map((r) => nameOf(r.uid)));
      const daily: DailyRow[] = dailyRaw.map((r, i) => ({
        ...r, rank: i + 1, handle: nameOf(r.uid), coach: coachOf(r.uid), move: moves[i],
      }));
      const week: WeekRow[] = weekRaw.map((r, i) => ({
        ...r, rank: i + 1, handle: nameOf(r.uid), coach: coachOf(r.uid),
      }));

      const winCounts = new Map<string, number>();
      for (const w of winsRaw) winCounts.set(w.uid, (winCounts.get(w.uid) ?? 0) + 1);
      const mostWins = [...winCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([uid, wins]) => ({ name: coachOf(uid) ?? nameOf(uid), wins }));
      const bestMargins = winsRaw.slice(0, 5).map((w) => ({
        name: coachOf(w.uid) ?? nameOf(w.uid), scoreline: scoreline(w.score, w.score_opp),
        margin: w.margin, day: w.day,
      }));

      // Handles that arrive as snapshot strings with no uid beside them.
      const names = await handleNames([
        ...challenges.map((c) => c.challenger_handle),
        ...lineage.flatMap((l) => [l.holder_handle, l.dethroned_by_handle]),
        ...topPlayers.map((t) => t.coach_handle),
        ...runs.map((r) => r.coach_handle),
        ...(throneRows[0] ? [throneRows[0].holder_handle] : []),
      ]);

      const todayVenue = venues.find((v) => v.day === today) ?? venueFallback(today);

      // COACH OF THE DAY. Before today's first post, the latest finished
      // board holds the card so the sidebar never opens empty.
      let coach: Board["coach"] = null;
      let coachDay = today;
      let coachRaw: DailyRaw | undefined = dailyRaw[0];
      if (!coachRaw) {
        const latest = await rest<(DailyRaw & { day: string })[]>(
          "daily_board?select=uid,day,score,score_opp,venue,created_at,won,margin,five&order=day.desc,won.desc,margin.desc,created_at.asc&limit=1"
        );
        if (latest[0]) { coachRaw = latest[0]; coachDay = latest[0].day; }
      }
      if (coachRaw) {
        const winnerByDay = new Map<string, string>();
        for (const r of monthRaw) if (!winnerByDay.has(r.day)) winnerByDay.set(r.day, r.uid);
        const topFinishes = [...winnerByDay.values()].filter((u) => u === coachRaw!.uid).length;
        const own = profiles[coachRaw.uid] ?? (await profileMap([coachRaw.uid]))[coachRaw.uid];
        const venue = coachDay === today
          ? todayVenue
          : (await rest<Venue[]>(`daily_venues?day=eq.${coachDay}&select=*`))[0] ?? venueFallback(coachDay);
        coach = {
          row: {
            ...coachRaw, rank: 1,
            handle: own?.handle ?? "COACH", coach: own?.coach ?? null,
            move: { kind: "none", n: 0 },
          },
          day: coachDay, venue, topFinishes: Math.max(topFinishes, 1),
        };
      }

      setBoard({
        throne: throneRows[0] ?? null,
        lineage,
        challenges,
        daily,
        week,
        solo: solo.map((r) => ({ ...r, handle: nameOf(r.uid), coach: coachOf(r.uid) })),
        bestMargins,
        mostWins,
        topPlayers,
        runs,
        today: todayVenue,
        tomorrow: venues.find((v) => v.day === todayUTC(1)) ?? venueFallback(todayUTC(1)),
        coach,
        profiles,
        names,
        throneCoach: throneRows[0] ? coachOf(throneRows[0].holder_uid) : null,
        fetchedAt: Date.now(),
      });
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // First load, then every 60s while the tab is visible.
  useEffect(() => {
    load();
    const start = () => {
      if (timer.current === null) timer.current = window.setInterval(load, POLL_MS);
    };
    const stop = () => {
      if (timer.current !== null) { window.clearInterval(timer.current); timer.current = null; }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") { load(); start(); } else stop();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    const clock = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); window.clearInterval(clock); };
  }, [load]);

  const ticker = useMemo(() => (board ? tickerItems(board) : []), [board]);

  return (
    <div className="koth">
      <Ticker items={ticker} />
      <Header fixed={false} transparent />
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 pb-20">
        {board?.throne && <KingStrip throne={board.throne} coach={board.throneCoach} />}

        <div className="koth-mast">
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".3em", color: "var(--amber)", fontWeight: 700 }}>
              COACH OF THE YEAR
            </div>
            <h1 className="display">The Board</h1>
          </div>
          <div className="koth-live mono">
            <span className="dot" />
            LIVE · {board ? minutesAgo(board.fetchedAt) : "CONNECTING"}
          </div>
        </div>

        <div className="koth-tabs mono" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t}
              className={`koth-tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {failed && !board && (
          <p className="koth-empty mono">The board didn&apos;t answer. Refresh to try again.</p>
        )}

        <div className="koth-grid">
          <div>
            {tab === "DAILY" && <DailyTab board={board} />}
            {tab === "THE WEEK" && <WeekTab board={board} />}
            {tab === "RECORDS" && <RecordsTab board={board} />}
            {tab === "THE CLIMB" && <ClimbTab board={board} />}
          </div>
          <aside className="side">
            {board?.coach && <CoachOfTheDayCard {...board.coach} today={todayUTC()} />}
            <div className="koth-card">
              <div className="h mono">TOMORROW</div>
              {board ? (
                <>
                  <div className="mono" style={{ fontSize: 13 }}>{venueChip(board.tomorrow)}</div>
                  <div className="mono faint" style={{ fontSize: 10, marginTop: 4, letterSpacing: ".06em" }}>
                    {[...board.tomorrow.rule_tags.slice(0, 2), "POOL FLIPS AT MIDNIGHT UTC"].join(" · ")}
                  </div>
                </>
              ) : (
                <div className="mono faint" style={{ fontSize: 12 }}>…</div>
              )}
            </div>

            <div className="koth-card">
              <div className="h mono">LONGEST REIGNS</div>
              {board ? (
                longestReigns(board).map((r, i) => (
                  <div key={i} className="koth-line mono">
                    <span>
                      {r.team_name}
                      {r.reigning && <span className="gold"> · REIGNING</span>}
                    </span>
                    <b className={i < 2 ? "amber" : ""}>{r.defenses}</b>
                  </div>
                ))
              ) : (
                <div className="mono faint" style={{ fontSize: 12 }}>…</div>
              )}
              {board && longestReigns(board).length === 0 && (
                <div className="mono faint" style={{ fontSize: 12 }}>No reign on record yet.</div>
              )}
            </div>
          </aside>
        </div>

        <div className="koth-foot mono">
          Scores are player-reported for now · names and seasons shown as text only
        </div>
      </div>
    </div>
  );
}

// ---- Pieces

function Ticker({ items }: { items: string[][] }) {
  if (items.length === 0) return <div className="koth-ticker mono" style={{ height: 37 }} />;
  const loop = [...items, ...items];
  return (
    <div className="koth-ticker mono" aria-label="Latest results">
      <div className="tk">
        {loop.map(([lead, body, tail], i) => (
          <span key={i}>
            {lead && <b>{lead}</b>}{lead ? " " : ""}{body}{tail ? " " : ""}{tail && <i>{tail}</i>}
          </span>
        ))}
      </div>
    </div>
  );
}

// The coach, and only the coach. The franchise name is identity — it makes
// handles unique and pins the records — but it is not what the boards are
// about (Dan, 2026-09-03), so it never reaches the page. A coach who has
// named nobody falls back to their handle, which IS their franchise name and
// so still reads as a name.
function CoachName({ coach, handle }: { coach: string | null; handle: string }) {
  return <b>{coach ?? handle}</b>;
}

function KingStrip({ throne, coach }: { throne: Throne; coach: string | null }) {
  const lead = leadPlayer(throne);
  return (
    <div className="koth-king">
      <div className="crown" aria-hidden>♛</div>
      <div className="text">
        <div className="kicker mono">CURRENT KING OF THE HILL</div>
        <div className="name display">{throne.team_name}</div>
        {/* One span per phrase, each unbreakable: the line may wrap between
            facts but never inside one, so "CROWNED SEP 1" cannot split.
            The coach is uppercased here and only here — this line is
            tracked-out caps, and a mixed-case name sits in it like a typo. */}
        <div className="meta mono">
          {lead && <span>LED BY <b>{lead.name} · {lead.season}</b></span>}
          <span>COACH {(coach ?? throne.holder_handle).toUpperCase()}</span>
          <span>CROWNED {shortDate(throne.claimed_at)}</span>
        </div>
      </div>
      <div className="def">
        <div className="n mono">{throne.defenses}</div>
        <div className="l mono">DEFENSES</div>
      </div>
      <a className="koth-cta mono" href={APP_STORE_URL}>CHALLENGE THE KING →</a>
    </div>
  );
}

// Today's #1: the daily's own headline, gold-trimmed like the King strip.
function CoachOfTheDayCard({ row, day, venue, topFinishes, today }: {
  row: DailyRow; day: string; venue: Venue; topFinishes: number; today: string;
}) {
  const isToday = day === today;
  return (
    <div className="koth-card koth-cotd">
      <div className="h mono">COACH OF THE DAY{!isToday && ` · ${shortDate(`${day}T12:00:00Z`)}`}</div>
      <div className="display name">{row.coach ?? row.handle}</div>
      <div className="mono dust" style={{ fontSize: 12, letterSpacing: ".1em", marginTop: 4 }}>
        {scoreline(row.score, row.score_opp)} AT {venueName(venue)} · {signed(row.margin)}
      </div>
      {row.five && row.five.length > 0 && (
        <div className="mono dust" style={{ fontSize: 12, letterSpacing: ".06em", marginTop: 12, lineHeight: 1.7 }}>
          FIVE: <b style={{ color: "var(--chalk)" }}>{fiveLine(row.five)}</b>
        </div>
      )}
      <div className="koth-badge mono">
        ★ #1 {isToday ? "TODAY" : shortDate(`${day}T12:00:00Z`)}
        {topFinishes > 1 && <> · {ordinal(topFinishes)} TOP FINISH THIS MONTH</>}
      </div>
    </div>
  );
}

function MoveCell({ move }: { move: Move }) {
  switch (move.kind) {
    case "up": return <td className="mv up mono">▲{move.n}</td>;
    case "down": return <td className="mv down mono">▼{move.n}</td>;
    case "new": return <td className="mv new mono">NEW</td>;
    default: return <td className="mv mono">—</td>;
  }
}

function DailyTab({ board }: { board: Board | null }) {
  const today = todayUTC();
  return (
    <section>
      <div className="koth-dateline mono">
        <span>{longDate(today)}</span>
        {board && <span className="koth-venue">{venueChip(board.today)}</span>}
        <span className="fill" />
        <span>EVERYBODY PLAYS THE SAME GAME</span>
      </div>
      {!board ? (
        <p className="koth-empty mono">Loading…</p>
      ) : board.daily.length === 0 ? (
        <p className="koth-empty mono">Nobody has posted today&apos;s game yet.</p>
      ) : (
        <table>
          <thead>
            <tr className="mono"><th>#</th><th></th><th>COACH</th><th className="num">FINAL</th><th className="num">MARGIN</th><th className="num hide-sm">PLAYED</th></tr>
          </thead>
          <tbody>
            {board.daily.map((r) => (
              <tr key={r.uid}>
                <td className={`rk mono ${r.rank <= 3 ? "top" : ""}`}>{r.rank}</td>
                <MoveCell move={r.move} />
                <td className="display"><CoachName coach={r.coach} handle={r.handle} /></td>
                <td className={`fin mono num ${r.won ? "w" : "l"}`}>{scoreline(r.score, r.score_opp)}</td>
                <td className="mono num">{signed(r.margin)}</td>
                <td className="mono num faint hide-sm">{clockTime(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function WeekTab({ board }: { board: Board | null }) {
  return (
    <section>
      <div className="koth-dateline mono">
        <span>WEEK OF {mondayUTC()}</span>
        <span className="fill" />
        <span>SEVEN GAMES · LUCK AVERAGES OUT</span>
      </div>
      {!board ? (
        <p className="koth-empty mono">Loading…</p>
      ) : board.week.length === 0 ? (
        <p className="koth-empty mono">Nobody has played this week yet.</p>
      ) : (
        <table>
          <thead>
            <tr className="mono"><th>#</th><th>COACH</th><th className="num">GAMES</th><th className="num">W–L</th><th className="num">MARGIN</th></tr>
          </thead>
          <tbody>
            {board.week.map((r) => (
              <tr key={r.uid}>
                <td className={`rk mono ${r.rank <= 3 ? "top" : ""}`}>{r.rank}</td>
                <td className="display"><CoachName coach={r.coach} handle={r.handle} /></td>
                <td className="mono num dust">{r.games}</td>
                <td className="mono num">{r.wins}–{r.games - r.wins}</td>
                <td className={`mono num ${r.margin > 0 ? "teal" : r.margin < 0 ? "red" : "dust"}`}>{signed(r.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function RecordsTab({ board }: { board: Board | null }) {
  if (!board) return <p className="koth-empty mono">Loading…</p>;
  const reigns = longestReigns(board, 10);
  return (
    <section>
      <div className="koth-section-h mono">
        TOP 10 THIS MONTH · {monthName()} · RANKED BY A GAME&apos;S WORTH OF IMPACT
      </div>
      {board.topPlayers.length === 0 ? (
        <p className="koth-empty mono">No game has been played this month yet.</p>
      ) : (
        <table><tbody>
          {board.topPlayers.map((p, i) => (
            <tr key={p.player_id}>
              <td className={`rk mono ${i < 3 ? "top" : ""}`}>{i + 1}</td>
              <td className="display">
                <b>{playerLabel(p.player_name, p.player_season)}</b>
                <div className="mono koth-subline">{statLine(p)}</div>
              </td>
              <td className="mono num dust" style={{ fontSize: 11 }}>
                COACH {board.names[p.coach_handle] ?? p.coach_handle}
                <div className="faint">{shortDate(`${p.played_on}T12:00:00Z`)}</div>
              </td>
            </tr>
          ))}
        </tbody></table>
      )}

      <div className="koth-section-h mono" style={{ marginTop: 28 }}>LONGEST REIGNS · THE WORLD</div>
      {reigns.length === 0 ? (
        <p className="koth-empty mono">No reign on record yet.</p>
      ) : (
        <table><tbody>
          {reigns.map((r, i) => (
            <tr key={i}>
              <td className={`rk mono ${i < 3 ? "top" : ""}`}>{i + 1}</td>
              <td className="display"><b>{r.team_name}</b>{r.reigning && <span className="mono gold" style={{ fontSize: 10, marginLeft: 8 }}>· REIGNING</span>}</td>
              <td className="mono num amber">{defensesLabel(r.defenses)}</td>
            </tr>
          ))}
        </tbody></table>
      )}

      <div className="koth-section-h mono" style={{ marginTop: 28 }}>LONGEST REIGNS · MY HILL</div>
      {board.solo.length === 0 ? (
        <p className="koth-empty mono">No finished solo reigns yet.</p>
      ) : (
        <table><tbody>
          {board.solo.slice(0, 10).map((r, i) => (
            <tr key={i}>
              <td className={`rk mono ${i < 3 ? "top" : ""}`}>{i + 1}</td>
              <td className="display"><b>{r.team_name}</b></td>
              <td className="mono num amber">{defensesLabel(r.defenses)}</td>
            </tr>
          ))}
        </tbody></table>
      )}

      <div className="koth-section-h mono" style={{ marginTop: 28 }}>BEST DAILY MARGIN</div>
      {board.bestMargins.length === 0 ? (
        <p className="koth-empty mono">No daily win on record yet.</p>
      ) : (
        <table><tbody>
          {board.bestMargins.map((r, i) => (
            <tr key={i}>
              <td className={`rk mono ${i < 3 ? "top" : ""}`}>{i + 1}</td>
              <td className="display"><b>{r.name}</b> <span className="mono faint" style={{ fontSize: 10 }}>{shortDate(`${r.day}T12:00:00Z`)}</span></td>
              <td className="fin mono num w">{r.scoreline}</td>
              <td className="mono num">{signed(r.margin)}</td>
            </tr>
          ))}
        </tbody></table>
      )}

      <div className="koth-section-h mono" style={{ marginTop: 28 }}>THE LINEAGE</div>
      {board.lineage.length === 0 ? (
        <p className="koth-empty mono">No King has fallen yet. The Gatekeepers await.</p>
      ) : (
        <table><tbody>
          {board.lineage.map((r) => (
            <tr key={r.id}>
              <td className="display"><b>{r.team_name}</b></td>
              <td className="mono num amber">{defensesLabel(r.defenses)}</td>
              <td className="mono num dust hide-sm" style={{ fontSize: 11 }}>{shortDate(r.claimed_at)} – {shortDate(r.ended_at)}</td>
              <td className="mono num faint" style={{ fontSize: 11 }}>FELL TO {board.names[r.dethroned_by_handle] ?? r.dethroned_by_handle}</td>
            </tr>
          ))}
        </tbody></table>
      )}

      <div className="koth-section-h mono" style={{ marginTop: 28 }}>MOST DAILY WINS</div>
      {board.mostWins.length === 0 ? (
        <p className="koth-empty mono">No daily win on record yet.</p>
      ) : (
        <table><tbody>
          {board.mostWins.map((r, i) => (
            <tr key={i}>
              <td className={`rk mono ${i < 3 ? "top" : ""}`}>{i + 1}</td>
              <td className="display"><b>{r.name}</b></td>
              <td className="mono num amber">{r.wins} {r.wins === 1 ? "WIN" : "WINS"}</td>
            </tr>
          ))}
        </tbody></table>
      )}
    </section>
  );
}

function ClimbTab({ board }: { board: Board | null }) {
  if (!board) return <p className="koth-empty mono">Loading…</p>;
  return (
    <section>
      <div className="koth-dateline mono">
        <span>BEST CLIMB PER COACH</span>
        <span className="fill" />
        <span>THE UNDERDOG MULTIPLIER PAYS THE WEAKER ROSTER</span>
      </div>
      {board.runs.length === 0 ? (
        <p className="koth-empty mono">No climb has been banked yet.</p>
      ) : (
        <table>
          <thead>
            <tr className="mono">
              <th>#</th><th>COACH</th><th>CLEARED</th>
              <th className="num hide-sm">FINISHED</th><th className="num">SCORE</th>
            </tr>
          </thead>
          <tbody>
            {board.runs.map((r, i) => (
              <tr key={r.run_id}>
                <td className={`rk mono ${i < 3 ? "top" : ""}`}>{i + 1}</td>
                <td className="display">
                  <CoachName coach={board.profiles[r.uid]?.coach ?? null} handle={board.names[r.coach_handle] ?? r.coach_handle} />
                </td>
                <td className="mono dust" style={{ fontSize: 11 }}>
                  {r.ran_the_table ? "RAN THE TABLE" : `${r.rungs_cleared} OF ${r.summit_tier}`}
                  {r.top_rung && <span className="faint"> · {r.top_rung}</span>}
                  {r.clean && <span className="teal"> · CLEAN</span>}
                </td>
                <td className="mono num faint hide-sm" style={{ fontSize: 11 }}>
                  {shortDate(r.finished_at)}
                </td>
                <td className="mono num amber" style={{ fontWeight: 700 }}>{grouped(r.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// ---- Derivations

function longestReigns(board: Board, limit = 5) {
  const rows = board.lineage.map((r) => ({
    team_name: r.team_name, defenses: r.defenses, reigning: false,
  }));
  if (board.throne) {
    rows.push({
      team_name: board.throne.team_name,
      defenses: board.throne.defenses, reigning: true,
    });
  }
  return rows.sort((a, b) => b.defenses - a.defenses).slice(0, limit);
}

/** ~10 ticker items as [lead, body, tail] triples. */
function tickerItems(board: Board): string[][] {
  const items: string[][] = [];
  const kingAt = (version: number) =>
    board.throne?.version === version
      ? board.throne.team_name
      : board.lineage.find((l) => l.version === version)?.team_name ?? "THE KING";

  for (const c of board.challenges.filter((c) => c.applied).slice(0, 5)) {
    if (c.result === "defended") {
      items.push([kingAt(c.throne_version), `held off ${board.names[c.challenger_handle] ?? c.challenger_handle}`, `${c.wins_king}–${c.wins_you}`]);
    } else {
      items.push([board.names[c.challenger_handle] ?? c.challenger_handle, "took the throne", `${c.wins_you}–${c.wins_king}`]);
    }
  }
  if (board.throne && board.throne.defenses > 0) {
    items.unshift([board.throne.team_name, "defended the throne", `${ordinal(board.throne.defenses)} STRAIGHT`]);
  }
  const leader = board.daily[0];
  if (leader) items.push([leader.coach ?? leader.handle, "tops today's board", scoreline(leader.score, leader.score_opp)]);
  for (const r of board.daily.filter((r) => !r.won).slice(0, 2)) {
    items.push([r.coach ?? r.handle, `fell at ${board.today.short_name}`, scoreline(r.score, r.score_opp)]);
  }
  items.push(["", "TODAY'S VENUE", venueChip(board.today)]);
  for (const r of board.daily.filter((r) => r.move.kind === "new").slice(0, 2)) {
    items.push([r.coach ?? r.handle, "enters the daily board", ""]);
  }
  if (items.length < 4) items.push(["", "TOMORROW", venueChip(board.tomorrow)]);
  return items.slice(0, 10);
}
