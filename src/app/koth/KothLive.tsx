"use client";

// The Board, board-first (koth-web-board-passdown.md): ticker, site nav, a
// compact King strip as the headline, then the tabs and the sidebar. One
// component owns the reads and the 60-second visible-tab poll; the pieces
// below it are pure renderers. Display only — no sign-in (Dan, 2026-09-02).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import {
  APP_STORE_URL, HOUSE_UID, RETIRED_HANDLE,
  type Challenge, type CoachOfWeek, type DailyRaw, type DailyRow, type LineageEntry, type Move,
  type BestRun, type SoloReign, type Throne, type ThroneId, type TopPlayer, type Venue, type WeekDayRow, type WeekRow,
  type Profile,
  clockTime, coachOfTheWeek, defensesLabel, grouped, leadPlayer, longDate,
  handleNames, minutesAgo, mondayUTC, monthName, monthStartUTC, movement, ordinal, playerLabel,
  profileMap, rest, scoreline, statLine,
  shortDate, signed, todayUTC, venueChip, venueFallback, venueKnown, weekRange,
} from "./lib";
import "./koth.css";

// No THE THRONE tab: the King strip at the top of the page IS the throne
// (Dan, 2026-09-03), and a tab repeating it was the same fact twice. Its
// lineage moved into RECORDS, where the rest of the history lives.
//
// POST SEASON was TOURNAMENT CHALLENGE (2026-09-05) and THE CLIMB before that:
// the tab follows the app's hub door, so the mode has one name everywhere,
// and the app settled on "Post season" on 2026-09-06. The component is still
// ClimbTab — the ladder is what the mode is made of, whatever it is called.
const TABS = ["DAILY", "THE WEEK", "POST SEASON", "RECORDS"] as const;
type Tab = (typeof TABS)[number];
const POLL_MS = 60_000;

/** One hill: its King, the Kings before, and the series fought over it.
 *  ALL-STARS and LEGENDS are the same shape (migration 0013 widened one
 *  table rather than adding three), so everything below takes a Hill and
 *  never asks which. */
type Hill = {
  id: ThroneId;
  throne: Throne | null;
  lineage: LineageEntry[];
  challenges: Challenge[];
  /** The holder's coach, read live by uid — outlives every team rename. */
  coach: string | null;
};

type Board = {
  /** The fives coaches build. `throne` row 1. */
  allStars: Hill;
  /** The real champions — '07 Spurs, '86 Celtics. `throne` row 2. */
  legends: Hill;
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
  /** This week's standings by top-3 finishes, best first (lib.coachOfTheWeek). */
  weekTop3: CoachOfWeek[];
  fetchedAt: number;
};

// The three reads that make a hill, keyed on `throne.id`. Both hills share
// `throne_lineage` and `challenges`, so **the filter is the hill**: without
// `throne_id` the LEGENDS champions sit in the ALL-STARS lineage and the
// ticker names the wrong King the moment a Legends series lands.
const hillReads = (id: ThroneId) => [
  rest<Throne[]>(
    `throne?id=eq.${id}&select=version,holder_uid,holder_handle,team_name,defenses,claimed_at,five,lead_player,season`
  ),
  rest<LineageEntry[]>(
    `throne_lineage?throne_id=eq.${id}&select=id,throne_id,version,holder_uid,holder_handle,team_name,defenses,claimed_at,ended_at,dethroned_by_handle,lead_player,season&order=version.desc&limit=50`
  ),
  rest<Challenge[]>(
    `challenges?throne_id=eq.${id}&select=id,throne_id,challenger_handle,throne_version,result,applied,wins_you,wins_king,created_at&order=created_at.desc&limit=12`
  ),
] as const;

export default function KothLive() {
  const [tab, setTab] = useState<Tab>("DAILY");
  const [board, setBoard] = useState<Board | null>(null);
  const [failed, setFailed] = useState(false);
  const [, tick] = useState(0);
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const today = todayUTC();
      const [throne1, lineage1, challenges1, throne2, lineage2, challenges2,
             dailyRaw, weekRaw, solo, venues, winsRaw, monthRaw, topPlayers, runs, weekDays] =
        await Promise.all([
          ...hillReads(1),
          ...hillReads(2),
          // Winners first, then margin — the daily_board view computes both
          // so the ordering happens server-side (Dan, 2026-09-02).
          rest<DailyRaw[]>(
            `daily_board?day=eq.${today}&select=uid,score,score_opp,venue,created_at,won,margin,five&order=won.desc,margin.desc,created_at.asc&limit=100`
          ),
          rest<Omit<WeekRow, "rank" | "handle">[]>(
            `weekly_board?week=eq.${mondayUTC()}&select=uid,games,wins,margin&order=wins.desc,margin.desc,first_played.asc&limit=100`
          ),
          // The retired user-built hill's reigns, for EARLIER HILL REIGNS only.
          // Nothing LEGENDS lives here any more — its reigns are throne 2's lineage.
          rest<(SoloReign & { uid: string })[]>(
            "koth_solo?select=uid,team_name,defenses,crowned_at,ended_at,mode&order=defenses.desc,crowned_at.asc&limit=50"
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
          // The week's boards in board order, so each day's first three rows
          // are that day's top-3 — COACH OF THE WEEK counts those. Its own
          // read rather than the month's, because a week can straddle a month.
          rest<WeekDayRow[]>(
            `daily_board?day=gte.${mondayUTC()}&select=uid,day,score,score_opp,won,margin,created_at&order=day.desc,won.desc,margin.desc,created_at.asc&limit=1000`
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
        ...weekDays.map((r) => r.uid),
        // Both Kings' coaches. The house holds no profile, so a lookup for it
        // is a wasted row.
        ...[throne1[0], throne2[0]].flatMap((t) => (t && t.holder_uid !== HOUSE_UID ? [t.holder_uid] : [])),
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
        ...[...challenges1, ...challenges2].map((c) => c.challenger_handle),
        ...[...lineage1, ...lineage2].flatMap((l) => [l.holder_handle, l.dethroned_by_handle]),
        ...topPlayers.map((t) => t.coach_handle),
        ...runs.map((r) => r.coach_handle),
        ...[throne1[0], throne2[0]].flatMap((t) => (t ? [t.holder_handle] : [])),
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

      const hill = (id: ThroneId, throne: Throne[], lineage: LineageEntry[], challenges: Challenge[]): Hill => ({
        id, throne: throne[0] ?? null, lineage, challenges,
        coach: throne[0] ? coachOf(throne[0].holder_uid) : null,
      });
      setBoard({
        allStars: hill(1, throne1, lineage1, challenges1),
        legends: hill(2, throne2, lineage2, challenges2),
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
        weekTop3: coachOfTheWeek(weekDays),
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
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const goToWeek = () => { setTab("THE WEEK"); tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const [getBar, setGetBar] = useState(false);
  // The bar is a session thing: dismissed stays dismissed until the tab
  // closes, a new tab gets it back. Storage can throw (private mode), and a
  // thrown read must not take the page with it.
  useEffect(() => {
    try { setGetBar(sessionStorage.getItem("koth.getbar") !== "dismissed"); } catch { setGetBar(true); }
  }, []);
  const dismissGetBar = () => {
    setGetBar(false);
    try { sessionStorage.setItem("koth.getbar", "dismissed"); } catch { /* fine */ }
  };

  const today = todayUTC();
  const coachName = (uid: string) => board?.profiles[uid]?.coach ?? board?.profiles[uid]?.handle ?? "COACH";

  return (
    <div className={`koth ${getBar ? "has-getbar" : ""}`}>
      <Ticker items={ticker} />
      <Header fixed={false} transparent />
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-20">
        {/* The Hall of Champions: three honorees at equal weight (site redesign
            passdown §3). LEGENDS gold, ALL-STARS violet, the coach teal — the
            colour is how a reader tells them apart without reading. */}
        {board && (
          <section className="koth-hall" aria-label="Who's on top right now">
            <div className="koth-hall-kicker mono">★ WHO&apos;S ON TOP RIGHT NOW ★</div>
            <div className="koth-hall-grid">
              {board.legends.throne && <ThroneCard hill={board.legends} label="LEGENDS THRONE" kind="is-legends" />}
              {board.allStars.throne && <ThroneCard hill={board.allStars} label="ALL-STARS THRONE" kind="is-allstars" />}
              <CoachOfWeekCard standing={board.weekTop3[0] ?? null} name={board.weekTop3[0] ? coachName(board.weekTop3[0].uid) : null} onWeek={goToWeek} />
            </div>
          </section>
        )}

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
        {/* On a phone LIVE and the venue share a row under the title (CSS
            shows this row and hides the one above only there). */}
        <div className="koth-mast-row mono">
          <span className="koth-live"><span className="dot" />LIVE · {board ? minutesAgo(board.fetchedAt) : "CONNECTING"}</span>
          {board && venueKnown(board.today) && <span className="koth-venue">{venueChip(board.today)}</span>}
        </div>

        <div className="koth-tabs mono" role="tablist" ref={tabsRef} id="board">
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
            {tab === "DAILY" && <Feed board={board} today={today} />}
            {tab === "THE WEEK" && <WeekTab board={board} />}
            {tab === "RECORDS" && <RecordsTab board={board} />}
            {tab === "POST SEASON" && <ClimbTab board={board} />}
          </div>
          <aside className="side koth-rail" id="rail">
            <div className="koth-more mono" aria-hidden>MORE</div>
            <div className="koth-card">
              <div className="h mono">TOMORROW</div>
              {board ? (
                <>
                  <div className="mono" style={{ fontSize: 13 }}>
                    {venueKnown(board.tomorrow) ? venueChip(board.tomorrow) : "NOT ANNOUNCED"}
                  </div>
                  <div className="mono faint" style={{ fontSize: 10, marginTop: 4, letterSpacing: ".06em" }}>
                    {[...(venueKnown(board.tomorrow) ? board.tomorrow.rule_tags.slice(0, 2) : []),
                      "POOL FLIPS AT MIDNIGHT UTC"].join(" · ")}
                  </div>
                </>
              ) : (
                <div className="mono faint" style={{ fontSize: 12 }}>…</div>
              )}
            </div>

            <div className="koth-card">
              <div className="h mono">LONGEST REIGNS</div>
              {board ? (
                // Both ladders, each in its hill's colour — the same rule as
                // the hall, so a reader who learned it there reads it here.
                ([["LEGENDS", board.legends, "is-legends"], ["ALL-STARS", board.allStars, "is-allstars"]] as const).map(([label, hill, kind]) => {
                  const rows = longestReigns(hill, 3);
                  return rows.length === 0 ? (
                    <div key={label} className={`koth-line mono ${kind}`}><span><span className="dot" /><span className="hill">{label}</span>no reign yet</span></div>
                  ) : rows.map((r, i) => (
                    <div key={`${label}${i}`} className={`koth-line mono ${kind}`}>
                      <span>
                        <span className="dot" /><span className="hill">{label} ·</span> {r.team_name}
                        {r.reigning && <span className="faint"> · REIGNING</span>}
                      </span>
                      <b>{r.defenses}</b>
                    </div>
                  ));
                })
              ) : (
                <div className="mono faint" style={{ fontSize: 12 }}>…</div>
              )}
            </div>

            <div className="koth-card">
              <div className="h mono">THIS WEEK&apos;S LEADERS</div>
              {board ? (
                board.weekTop3.length === 0 ? (
                  <div className="mono faint" style={{ fontSize: 12 }}>No top-3 finish yet this week.</div>
                ) : (
                  board.weekTop3.slice(0, 3).map((s) => (
                    <div key={s.uid} className="koth-line mono">
                      <span>{coachName(s.uid)}</span>
                      <b><span className="teal">{s.top3}</span> top-3</b>
                    </div>
                  ))
                )
              ) : (
                <div className="mono faint" style={{ fontSize: 12 }}>…</div>
              )}
              {board && board.weekTop3.length > 0 && (
                <button className="koth-linkish mono" onClick={goToWeek}>THE WEEK ↓</button>
              )}
            </div>
          </aside>
        </div>

        <div className="koth-foot mono">
          Scores are player-reported for now · names and seasons shown as text only
        </div>
      </div>

      {/* Mobile only, by CSS: a phone is one tap from installing, and that is
          the page's highest-value action (passdown §7). */}
      {getBar && (
        <div className="koth-getbar" role="complementary" aria-label="Get the app">
          <img className="icon" src="/coty-icon.png" alt="" width={44} height={44} />
          <div className="t">
            <b>All-Time Five</b>
            <span>Build a five. Take the throne.</span>
          </div>
          <a className="get mono" href={APP_STORE_URL}>GET</a>
          <button className="x" onClick={dismissGetBar} aria-label="Dismiss">×</button>
        </div>
      )}
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

/** One throne in the hall. Takes a Hill, so the two hills are one component. */
function ThroneCard({ hill, label, kind }: { hill: Hill; label: string; kind: "is-legends" | "is-allstars" }) {
  const throne = hill.throne!;
  const lead = leadPlayer(throne);
  // A retired holder has no coach to name, and neither does the house that
  // seeds a hill — "COACH THE GATEKEEPERS" is a sentence with no subject.
  const nobody = throne.holder_handle === RETIRED_HANDLE || throne.holder_uid === HOUSE_UID;
  const coach = (hill.coach ?? throne.holder_handle).toUpperCase();
  return (
    <div className={`koth-honoree ${kind}`}>
      <div className="glyph" aria-hidden>♛</div>
      <div className="label mono">{label}</div>
      <div className="name display">{throne.team_name}</div>
      {lead && <div className="lead">led by <b>{lead.name} {lead.season}</b></div>}
      <div className="meta mono">
        {!nobody && <>COACH {coach} · </>}{shortDate(throne.claimed_at).toUpperCase()}
      </div>
      <div className="hero mono">{throne.defenses}</div>
      <div className="hero-l mono">DEFENSES</div>
      <a className="koth-cta mono" href={APP_STORE_URL}>CHALLENGE →</a>
    </div>
  );
}

/** The third honoree: most top-3 daily finishes this fixed Mon–Sun week.
 *  The rule and the window are on the card, because players will otherwise
 *  assume it means something else (passdown §3). */
function CoachOfWeekCard({ standing, name, onWeek }: { standing: CoachOfWeek | null; name: string | null; onWeek: () => void }) {
  const range = weekRange(todayUTC());
  return (
    <div className="koth-honoree is-coach">
      <div className="glyph" aria-hidden>◎</div>
      <div className="coach-text">
        <div className="label mono">COACH OF THE WEEK</div>
        <div className="name display">{name ?? "Nobody yet"}</div>
        <div className="lead">{standing ? "most top-3 finishes" : "no top-3 finish yet"}</div>
        <div className="meta mono">{range.toUpperCase()} · RESETS MON 00:00 UTC</div>
      </div>
      <div className="hero-wrap">
        <div className="hero mono">{standing?.top3 ?? 0}</div>
        <div className="hero-l mono">TOP-3 FINISHES</div>
      </div>
      <button className="koth-cta outline mono" onClick={onWeek}>THE WEEK ↓</button>
    </div>
  );
}

function MoveLabel({ move }: { move: Move }) {
  switch (move.kind) {
    case "up": return <em>▲{move.n}</em>;
    case "down": return <em style={{ color: "var(--red)" }}>▼{move.n}</em>;
    case "new": return <em>NEW</em>;
    default: return null;
  }
}

/** The daily as a feed of result cards, with a sparse state that reads as
 *  "in progress" (passdown §4). Today's winner is named in the header so the
 *  daily result stays visible without a card of its own. */
function Feed({ board, today }: { board: Board | null; today: string }) {
  const rows = board?.daily ?? [];
  const leader = rows[0];
  const maxMargin = Math.max(1, ...rows.map((r) => Math.abs(r.margin)));
  const top3ThisWeek = new Map((board?.weekTop3 ?? []).map((s) => [s.uid, s.top3]));
  return (
    <section>
      <div className="koth-dateline mono">
        <span>{longDate(today)}</span>
        {board && venueKnown(board.today) && <span className="koth-venue">{venueChip(board.today)}</span>}
        <span className="fill" />
        {leader
          ? <span>TODAY · <b style={{ color: "var(--chalk)" }}>{leader.coach ?? leader.handle}</b> {scoreline(leader.score, leader.score_opp)}</span>
          : <span>EVERYBODY PLAYS THE SAME GAME</span>}
      </div>
      {!board ? (
        <p className="koth-empty mono">Loading…</p>
      ) : (
        <>
          {rows.length > 0 && (
            <div className="koth-dateline mono" style={{ paddingTop: 0 }}>
              <span className="fill" />
              <span className="koth-count">{rows.length} {rows.length === 1 ? "RESULT" : "RESULTS"} IN</span>
            </div>
          )}
          <div className="koth-feed">
            {rows.map((r) => {
              const t3 = top3ThisWeek.get(r.uid) ?? 0;
              return (
                <article key={r.uid} className={`koth-result ${r.won ? "win" : "loss"}`}>
                  <div className="top">
                    <div className={`rank mono ${r.rank === 1 ? "first" : ""}`}>{r.rank}</div>
                    <div className="who">
                      <CoachName coach={r.coach} handle={r.handle} />
                      <div className="sub mono">{clockTime(r.created_at)}{r.move.kind !== "none" && r.move.kind !== "same" && <> · <MoveLabel move={r.move} /></>}</div>
                    </div>
                    <div className="score mono">
                      <b>{scoreline(r.score, r.score_opp)}</b>
                      <i>{signed(r.margin)}</i>
                    </div>
                  </div>
                  <div className="bar"><i style={{ width: `${Math.round((Math.abs(r.margin) / maxMargin) * 100)}%` }} /></div>
                  <div className="meta mono">
                    {venueKnown(board.today) ? venueChip(board.today) : "VENUE NOT ANNOUNCED"} · <em>{r.won ? "WIN" : "LOSS"}</em>
                    {t3 > 0 && <> · {t3} TOP-3 THIS WEEK</>}
                  </div>
                </article>
              );
            })}
            {rows.length < 3 && (
              <div className="koth-sparse">
                The board is still filling up.
                <div className="mono">EVERYBODY PLAYS THE SAME GAME · ONE SHOT A DAY</div>
              </div>
            )}
          </div>
        </>
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
  const reigns = longestReigns(board.allStars, 10);
  // The champions' reigns are throne 2's lineage plus whoever holds it now —
  // the same derivation as ALL-STARS, on the other hill.
  const championReigns = longestReigns(board.legends, 10);
  // Only `solo` rows live here now: the user-built hill LEGENDS replaced.
  const legacyReigns = board.solo;
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

      <div className="koth-section-h mono" style={{ marginTop: 28 }}>LONGEST REIGNS · ALL-STARS</div>
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

      {/* **Titled for what it measures.** LEGENDS is a shared hill now
          (2026-09-16): a defence is a challenger — any coach — turned back by
          the champion holding it, and nobody coaches the champion. So this
          ranks champions by resistance, and the coach's name on a reign says
          who put that champion there, not who coached well. The note says so,
          because the old one ("a defence means the player lost") was true of
          the private hill and is false of this one. */}
      <div className="koth-section-h mono" style={{ marginTop: 28 }}>LONGEST CHAMPION REIGNS</div>
      <p className="koth-empty mono" style={{ marginTop: -4 }}>
        Champions that proved hardest to dethrone. A defence is a challenger turned back by the
        champion on the hill; the coach on a reign is who put that champion there.
      </p>
      {championReigns.length === 0 ? (
        <p className="koth-empty mono">No champion has held the hill yet.</p>
      ) : (
        <table><tbody>
          {championReigns.map((r, i) => (
            <tr key={i}>
              <td className={`rk mono ${i < 3 ? "top" : ""}`}>{i + 1}</td>
              <td className="display"><b>{r.team_name}</b>{r.reigning && <span className="mono gold" style={{ fontSize: 10, marginLeft: 8 }}>· REIGNING</span>}</td>
              <td className="mono num amber">{defensesLabel(r.defenses)}</td>
            </tr>
          ))}
        </tbody></table>
      )}

      {/* Only while anyone still has one. The user-built local hill closed
          when LEGENDS took its place, so this list can only shrink in
          relevance and never grows. */}
      {legacyReigns.length > 0 && (
        <>
          <div className="koth-section-h mono" style={{ marginTop: 28 }}>EARLIER HILL REIGNS</div>
          <table><tbody>
            {legacyReigns.slice(0, 10).map((r, i) => (
              <tr key={i}>
                <td className={`rk mono ${i < 3 ? "top" : ""}`}>{i + 1}</td>
                <td className="display"><b>{r.team_name}</b></td>
                <td className="mono num amber">{defensesLabel(r.defenses)}</td>
              </tr>
            ))}
          </tbody></table>
        </>
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

      {/* One lineage per hill, the same table. The house's seed row on LEGENDS
          ('70 Knicks, THE GATEKEEPERS) prints like any other: a team, its
          defences, and whom it fell to — nothing here names a holder. */}
      {([["ALL-STARS", board.allStars, "No King has fallen yet. The Gatekeepers await."],
         ["LEGENDS", board.legends, "No champion has fallen yet."]] as const).map(([label, hill, empty]) => (
        <div key={label}>
          <div className="koth-section-h mono" style={{ marginTop: 28 }}>THE LINEAGE · {label}</div>
          {hill.lineage.length === 0 ? (
            <p className="koth-empty mono">{empty}</p>
          ) : (
            <table><tbody>
              {hill.lineage.map((r) => (
                <tr key={r.id}>
                  <td className="display"><b>{r.team_name}</b></td>
                  <td className="mono num amber">{defensesLabel(r.defenses)}</td>
                  <td className="mono num dust hide-sm" style={{ fontSize: 11 }}>{shortDate(r.claimed_at)} – {shortDate(r.ended_at)}</td>
                  <td className="mono num faint" style={{ fontSize: 11 }}>FELL TO {board.names[r.dethroned_by_handle] ?? r.dethroned_by_handle}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
      ))}

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

function longestReigns(hill: Hill, limit = 5) {
  const rows = hill.lineage.map((r) => ({
    team_name: r.team_name, defenses: r.defenses, reigning: false,
  }));
  if (hill.throne) {
    rows.push({
      team_name: hill.throne.team_name,
      defenses: hill.throne.defenses, reigning: true,
    });
  }
  return rows.sort((a, b) => b.defenses - a.defenses).slice(0, limit);
}

/** ~10 ticker items as [lead, body, tail] triples. */
function tickerItems(board: Board): string[][] {
  const items: string[][] = [];
  // A version number only means something on its own hill — both count from
  // 1 — so the King a challenge was fought against is looked up on the hill
  // the challenge row says it was on. That is what `throne_id` is for.
  const kingAt = (hill: Hill, version: number) =>
    hill.throne?.version === version
      ? hill.throne.team_name
      : hill.lineage.find((l) => l.version === version)?.team_name ?? "THE KING";
  const hillOf = (id: ThroneId) => (id === 2 ? board.legends : board.allStars);
  const who = (handle: string) => board.names[handle] ?? handle;

  // Both hills' latest series, most recent first across the two.
  const recent = [...board.allStars.challenges, ...board.legends.challenges]
    .filter((c) => c.applied)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);
  for (const c of recent) {
    const hill = hillOf(c.throne_id);
    if (c.result === "defended") {
      items.push([kingAt(hill, c.throne_version), `held off ${who(c.challenger_handle)}`, `${c.wins_king}–${c.wins_you}`]);
    } else if (c.throne_id === 2) {
      // The coach took the champions' hill with a champion, not a five they
      // built: the champion's name is the news, so it leads the line. The
      // dethrone bumped the version, so the new King sits at version + 1.
      items.push([kingAt(hill, c.throne_version + 1), `took the Legends hill · ${who(c.challenger_handle)}`, `${c.wins_you}–${c.wins_king}`]);
    } else {
      items.push([who(c.challenger_handle), "took the throne", `${c.wins_you}–${c.wins_king}`]);
    }
  }
  for (const hill of [board.legends, board.allStars]) {
    if (!hill.throne) continue;
    const where = hill.id === 2 ? "Legends" : "All-Stars";
    if (hill.throne.defenses > 0) {
      items.unshift([hill.throne.team_name, hill.id === 2 ? "defended the hill" : "defended the throne", `${ordinal(hill.throne.defenses)} STRAIGHT`]);
    } else {
      // A King with no defence yet was crowned recently: that is the news.
      items.unshift([hill.throne.team_name, `crowned in ${where}`, shortDate(hill.throne.claimed_at).toUpperCase()]);
    }
  }
  const leader = board.daily[0];
  if (leader) items.push([leader.coach ?? leader.handle, "tops today's board", scoreline(leader.score, leader.score_opp)]);
  for (const r of board.daily.filter((r) => !r.won).slice(0, 2)) {
    items.push([r.coach ?? r.handle,
                venueKnown(board.today) ? `fell at ${board.today.short_name}` : "fell today",
                scoreline(r.score, r.score_opp)]);
  }
  if (venueKnown(board.today)) items.push(["", "TODAY'S VENUE", venueChip(board.today)]);
  for (const r of board.daily.filter((r) => r.move.kind === "new").slice(0, 2)) {
    items.push([r.coach ?? r.handle, "enters the daily board", ""]);
  }
  if (items.length < 4 && venueKnown(board.tomorrow)) {
    items.push(["", "TOMORROW", venueChip(board.tomorrow)]);
  }
  return items.slice(0, 10);
}
