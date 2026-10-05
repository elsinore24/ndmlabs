"use client";

// ndmlabs.net/koth, refocused on what the app leads with (Dan's mockup,
// 2026-10-01): today's challenge, who's on top, the 2026-27 season, a strip
// of records, and the app. The Board's tabs, feed and ticker are gone. One
// component owns the reads and the 60-second visible-tab poll; the pieces
// below it are pure renderers. Display only — no sign-in (Dan, 2026-09-02).

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Header from "@/components/Header";
import AllTimeFiveMark from "@/components/AllTimeFiveMark";
import {
  APP_STORE_URL, DAILY_OPPONENTS, HOUSE_UID, RETIRED_HANDLE,
  type Challenge, type CoachRating, type DailyRaw, type LineageEntry,
  type CoachTotals, type Profile, type SeasonPlayerLine, type StatKey, type ThroneWin, type Standing, conferenceTable, gamesBack, type SeasonGameRow, type Throne, type ThroneId, type Venue, type WeekDayRow,
  CAREER_MIN_GAMES, WEEK_MIN_GAMES,
  allTimeCoaches, coachOfTheWeek, leadPlayer, leagueLeaders, ratingLabel, statLeaders, teamPlayers, thronesTaken, minutesAgo, mondayUTC, profileMap, resetsIn, rest, scoreline,
  shortDate, signed, todayUTC, venueCity, venueDecade, venueFallback, venueKnown,
  weekRange } from "./lib";
import "./koth.css";

const POLL_MS = 60_000;
/** The season the table is for: 2026-27, the archive's end-year numbering. */
const SEASON = 2027;

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

type Reign = { team_name: string; defenses: number; reigning: boolean };

type Board = {
  /** The fives coaches build. `throne` row 1. */
  allStars: Hill;
  /** The real champions — '07 Spurs, '86 Celtics. `throne` row 2. */
  legends: Hill;
  /** Today's daily board in board order: won desc, margin desc, first in. */
  daily: DailyRaw[];
  today: Venue;
  /** This week's coaches by rating, qualified only (lib.coachOfTheWeek). */
  week: CoachRating[];
  /** Every coach with ten career games or more, best first (lib.allTimeCoaches). */
  career: CoachRating[];
  /** The 2026-27 league table, `season_standings`, in table order. */
  standings: Standing[];
  /** Every 2026-27 game anyone has played: the coach lines under each team. */
  seasonGames: SeasonGameRow[];
  bestMargin: { uid: string; scoreline: string; margin: number; day: string } | null;
  mostWins: { uid: string; wins: number } | null;
  profiles: Record<string, Profile>;
  /** uid → thrones taken (lib.thronesTaken): the crown beside a coach. */
  thrones: Record<string, number>;
  /** Every season player's games and totals, by team (app migration 0017). */
  playerLines: SeasonPlayerLine[];
  /** team → games its player lines cover; short of its games played while
   *  games from before both sides were saved still count. */
  boxGames: Record<string, number>;
  fetchedAt: number;
};

// The three reads that make a hill, keyed on `throne.id`. Both hills share
// `throne_lineage` and `challenges`, so **the filter is the hill**.
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
  const [board, setBoard] = useState<Board | null>(null);
  const [failed, setFailed] = useState(false);
  const [, tick] = useState(0);
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const today = todayUTC();
      const monday = mondayUTC();
      const [throne1, lineage1, challenges1, throne2, lineage2, challenges2,
             dailyRaw, venues, winsRaw, weekDays, standings, seasonGames, careerRaw, throneWins, playerLines, boxGamesRaw] =
        await Promise.all([
          ...hillReads(1),
          ...hillReads(2),
          // Winners first, then margin — the daily_board view computes both
          // so the ordering happens server-side (Dan, 2026-09-02).
          rest<DailyRaw[]>(
            `daily_board?day=eq.${today}&select=uid,score,score_opp,venue,created_at,won,margin,five&order=won.desc,margin.desc,created_at.asc&limit=200`
          ),
          rest<Venue[]>(`daily_venues?day=eq.${today}&select=*`),
          // Every daily win, biggest first: BIGGEST DAILY WIN and MOST DAILY WINS.
          rest<{ uid: string; day: string; score: number; score_opp: number; margin: number }[]>(
            "daily_board?won=is.true&select=uid,day,score,score_opp,margin&order=margin.desc&limit=1000"
          ),
          // This week's dailies, every one: each is a game for the rating.
          rest<WeekDayRow[]>(
            `daily_board?day=gte.${monday}&select=uid,day,score,score_opp,won,margin,created_at&limit=2000`
          ),
          // The 2026-27 season (app migration 0014): the view is already in
          // table order — conference, division, pct, margin.
          rest<Standing[]>(
            `season_standings?season=eq.${SEASON}&select=abbr,name,conference,division,games,wins,losses,margin,pct`
          ),
          rest<SeasonGameRow[]>(
            `season_games?season=eq.${SEASON}&select=uid,coach_handle,played_on,home_abbr,away_abbr,home_score,away_score,coached_abbr,created_at&order=created_at.asc&limit=5000`
          ),
          // Careers, totalled on the server (app migration 0016): a board
          // of every game ever cannot be read raw past PostgREST's cap.
          rest<CoachTotals[]>("coach_career?select=uid,games,wins,points,margin,first_at"),
          // Every series that took a throne. A few a week at most, so a raw
          // read stays far under PostgREST's 1,000-row cap for years.
          rest<ThroneWin[]>("challenges?result=eq.dethroned&applied=is.true&select=challenger_uid,throne_id&limit=1000"),
          // A team's players, for the standings' drop-downs: one row per
          // player per team, so a few hundred at most.
          rest<SeasonPlayerLine[]>(`season_player_lines?season=eq.${SEASON}&select=*&limit=1000`),
          rest<{ team_abbr: string; games: number }[]>(`season_team_box_games?season=eq.${SEASON}&select=team_abbr,games`),
        ]);

      const winCounts = new Map<string, number>();
      for (const w of winsRaw) winCounts.set(w.uid, (winCounts.get(w.uid) ?? 0) + 1);
      const most = [...winCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      const best = winsRaw[0];
      const week = coachOfTheWeek(weekDays, seasonGames.filter((g) => g.played_on >= monday));
      const career = allTimeCoaches(careerRaw);

      // One profile read covers every name on the page. The house holds no
      // profile, so a lookup for it is a wasted row.
      const profiles = await profileMap([
        ...dailyRaw.map((r) => r.uid),
        ...week.slice(0, 5).map((c) => c.uid),
        ...career.map((c) => c.uid),
        ...seasonGames.map((g) => g.uid),
        ...(best ? [best.uid] : []),
        ...(most ? [most[0]] : []),
        ...[throne1[0], throne2[0]].flatMap((t) => (t && t.holder_uid !== HOUSE_UID ? [t.holder_uid] : [])),
      ]);

      const hill = (id: ThroneId, throne: Throne[], lineage: LineageEntry[], challenges: Challenge[]): Hill => ({
        id, throne: throne[0] ?? null, lineage, challenges,
        coach: throne[0] ? profiles[throne[0].holder_uid]?.coach ?? null : null,
      });
      setBoard({
        allStars: hill(1, throne1, lineage1, challenges1),
        legends: hill(2, throne2, lineage2, challenges2),
        daily: dailyRaw,
        today: venues[0] ?? venueFallback(today),
        week,
        career,
        standings,
        seasonGames,
        bestMargin: best ? { uid: best.uid, scoreline: scoreline(best.score, best.score_opp), margin: best.margin, day: best.day } : null,
        mostWins: most ? { uid: most[0], wins: most[1] } : null,
        profiles,
        thrones: thronesTaken(throneWins),
        playerLines,
        boxGames: Object.fromEntries(boxGamesRaw.map((r) => [r.team_abbr, r.games])),
        fetchedAt: Date.now(),
      });
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // First load, then every 60s while the tab is visible. The 30-second tick
  // keeps the reset countdown and "updated" line honest between polls.
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

  const coachName = (uid: string) => board?.profiles[uid]?.coach ?? board?.profiles[uid]?.handle ?? "COACH";
  /** The coach's name with their crown count beside it, where they have one. */
  const coachTag = (uid: string) => <CoachTag name={coachName(uid)} thrones={board?.thrones[uid] ?? 0} />;

  return (
    <div className="koth">
      <Header fixed={false} transparent mark={<AllTimeFiveMark />} />
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-20">
        <TodayCard board={board} coachTag={coachTag} />

        {failed && !board && (
          <p className="koth-empty mono">The board didn&apos;t answer. Refresh to try again.</p>
        )}

        {/* The Hall of Champions: three honorees at equal weight. LEGENDS
            gold, ALL-STARS violet, the coach teal — the colour is how a
            reader tells them apart without reading. */}
        {board && (
          <>
            <div className="koth-kicker mono">★ WHO&apos;S ON TOP ★</div>
            <section className="koth-hall" aria-label="Who's on top right now">
              <div className="koth-hall-grid">
                {board.legends.throne && <ThroneCard hill={board.legends} label="LEGENDS" kind="is-legends" />}
                {board.allStars.throne && <ThroneCard hill={board.allStars} label="ALL-STARS" kind="is-allstars" />}
                <CoachOfWeekCard week={board.week} coachTag={coachTag} />
                <AllTimeCoachCard career={board.career} coachTag={coachTag} />
              </div>
            </section>
          </>
        )}

        {board && board.standings.length > 0 && <SeasonSection board={board} coachName={coachName} />}

        {board && <RecordsStrip board={board} coachName={coachName} />}

        <section className="koth-app" aria-label="Get the app">
          <img className="icon" src="/coty-icon.png" alt="" width={56} height={56} />
          <div className="t">
            <b>All-Time 5</b>
            <span>Today&apos;s challenge, two thrones, and the whole league — on your phone.</span>
          </div>
          <a className="koth-cta mono" href={APP_STORE_URL}>GET THE APP</a>
        </section>

        <div className="koth-foot mono">
          Scores are player-reported for now · names and seasons shown as text only
          {board && <> · {minutesAgo(board.fetchedAt).toLowerCase()}</>}
        </div>
      </div>
    </div>
  );
}

// ---- Pieces

/** Today's challenge and today's board, side by side (one over the other
 *  on a phone). The venue row names the city, the year and the rules; the
 *  opponent and the decade follow from it. A day the calendar has not
 *  reached says nothing it would have to guess. */
function TodayCard({ board, coachTag }: { board: Board | null; coachTag: (uid: string) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const v = board?.today;
  const known = venueKnown(v);
  const opponent = v?.venue_id ? DAILY_OPPONENTS[v.venue_id] : undefined;
  const rows = board?.daily ?? [];
  const shown = open ? rows : rows.slice(0, 4);
  return (
    <section className="koth-today" aria-label="Today's challenge">
      <div className="koth-today-main">
        <div className="koth-today-k mono">TODAY&apos;S CHALLENGE · EVERYONE PLAYS THE SAME GAME</div>
        {known && v ? (
          <>
            <h1 className="display">{venueCity(v)}<br />{v.year}</h1>
            <p className="brief">
              Draft five from the <b>{venueDecade(v)}</b>.
              {opponent && <> Beat the <b>{opponent}</b>.</>} One shot.
            </p>
          </>
        ) : (
          <>
            <h1 className="display">Today&apos;s<br />game</h1>
            <p className="brief">Draft five. Beat today&apos;s team. One shot.</p>
          </>
        )}
        <div className="chips mono">
          {known && v && v.rule_tags.slice(0, 2).map((t) => <span key={t}>{t}</span>)}
          <span>~4 MIN</span>
        </div>
        <div className="go">
          <a className="koth-cta mono" href={APP_STORE_URL}>PLAY IN THE APP</a>
          <span className="mono resets">RESETS IN {resetsIn()}</span>
        </div>
      </div>
      <div className="koth-today-board">
        <div className="koth-today-k mono dim">
          TODAY&apos;S BOARD · {rows.length} {rows.length === 1 ? "COACH" : "COACHES"} IN
        </div>
        {!board ? (
          <div className="mono faint row-empty">…</div>
        ) : rows.length === 0 ? (
          <div className="row-empty">Nobody has played yet. The first result tops the board.</div>
        ) : (
          <>
            {shown.map((r, i) => (
              <div key={r.uid} className="koth-today-row">
                <span className={`rk mono ${i < 3 ? "top" : ""}`}>{i + 1}</span>
                <b>{coachTag(r.uid)}</b>
                <span className={`mono sc ${r.won ? "teal" : "red"}`}>{scoreline(r.score, r.score_opp)}</span>
              </div>
            ))}
            {rows.length > 4 && (
              <button className="koth-linkish mono" onClick={() => setOpen(!open)}>
                {open ? "TOP FOUR ↑" : "FULL BOARD ↓"}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** A coach's name, and a gold crown with their thrones taken when they have
 *  any (Dan, 2026-10-01). Kept out of the rating on purpose. */
function CoachTag({ name, thrones }: { name: string; thrones: number }) {
  return (
    <>
      {name}
      {thrones > 0 && (
        <span className="koth-crowns mono" title={`${thrones} ${thrones === 1 ? "throne" : "thrones"} taken`}
              aria-label={`${thrones} ${thrones === 1 ? "throne" : "thrones"} taken`}>
          ♛{thrones}
        </span>
      )}
    </>
  );
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

/** The third honoree: the best coach rating this fixed Mon–Sun week, three
 *  games or more (lib.coachOfTheWeek). The rule is on the card, because
 *  players will otherwise assume it means something else. */
function CoachOfWeekCard({ week, coachTag }: { week: CoachRating[]; coachTag: (uid: string) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const top = week[0] ?? null;
  return (
    <div className="koth-honoree is-coach">
      <div className="glyph" aria-hidden>◎</div>
      <div className="coach-text">
        <div className="label mono">COACH OF THE WEEK</div>
        <div className="name display">{top ? coachTag(top.uid) : "Nobody yet"}</div>
        <div className="lead">
          {top ? `${top.wins}-${top.losses} in ${top.games} games` : `${WEEK_MIN_GAMES} games this week to qualify`}
        </div>
        <div className="meta mono">{weekRange(todayUTC()).toUpperCase()} · RESETS MON 00:00 UTC</div>
      </div>
      <div className="hero-wrap">
        <div className="hero mono">{top ? ratingLabel(top.rating) : "—"}</div>
        <div className="hero-l mono">PTS / GAME</div>
      </div>
      {open && (
        <div className="koth-week-list">
          {week.length === 0 ? (
            <div className="mono faint" style={{ fontSize: 11 }}>Nobody has {WEEK_MIN_GAMES} games yet.</div>
          ) : week.slice(0, 5).map((c, i) => (
            <div key={c.uid} className="koth-line mono">
              <span>{i + 1}. <b className="who">{coachTag(c.uid)}</b> <span className="faint">{c.wins}-{c.losses}</span></span>
              <b className="teal">{ratingLabel(c.rating)}</b>
            </div>
          ))}
          <div className="koth-rule mono">
            Points per game. A win scores 1, plus up to 1 more for the margin (20+ is the max).
            A loss scores 0. Daily and season games count.
          </div>
        </div>
      )}
      <button className="koth-cta outline mono" onClick={() => setOpen(!open)}>
        {open ? "CLOSE ↑" : "THE WEEK ↓"}
      </button>
    </div>
  );
}

/** The fourth honoree: the best career rating, ten games or more (Dan,
 *  2026-10-02: the all-time coach beside the coach of the week). Its own
 *  colour, sky blue, so the hall's four read apart at a glance. */
function AllTimeCoachCard({ career, coachTag }: { career: CoachRating[]; coachTag: (uid: string) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState(false);
  const top = career[0] ?? null;
  const shown = all ? career : career.slice(0, 10);
  return (
    <div className="koth-honoree is-coach is-alltime">
      <div className="glyph" aria-hidden>★</div>
      <div className="coach-text">
        <div className="label mono">ALL-TIME COACH</div>
        <div className="name display">{top ? coachTag(top.uid) : "Nobody yet"}</div>
        <div className="lead">
          {top ? `${top.wins}-${top.losses} in ${top.games} games` : `${CAREER_MIN_GAMES} games to qualify`}
        </div>
        <div className="meta mono">DAILY + SEASON · {CAREER_MIN_GAMES}+ GAMES</div>
      </div>
      <div className="hero-wrap">
        <div className="hero mono">{top ? ratingLabel(top.rating) : "—"}</div>
        <div className="hero-l mono">PTS / GAME</div>
      </div>
      {/* The board opens in the card, as THE WEEK does (Dan, 2026-10-02:
          the separate section under the season went). Top ten, then all. */}
      {open && (
        <div className="koth-week-list">
          {career.length === 0 ? (
            <div className="mono faint" style={{ fontSize: 11 }}>Nobody has {CAREER_MIN_GAMES} games yet.</div>
          ) : shown.map((c, i) => (
            <div key={c.uid} className="koth-line mono">
              <span>{i + 1}. <b className="who">{coachTag(c.uid)}</b> <span className="faint">{c.wins}-{c.losses}</span></span>
              <b className="alltime">{ratingLabel(c.rating)}</b>
            </div>
          ))}
          {career.length > 10 && (
            <button className="koth-linkish mono" onClick={() => setAll(!all)}>
              {all ? "TOP TEN ↑" : `ALL ${career.length} COACHES ↓`}
            </button>
          )}
          <div className="koth-rule mono">
            Every daily and season game a coach has played, {CAREER_MIN_GAMES} or more. Points per game:
            a win scores 1, plus up to 1 more for the margin; a loss scores 0.
          </div>
        </div>
      )}
      <button className="koth-cta outline mono" onClick={() => setOpen(!open)}>
        {open ? "CLOSE ↑" : "ALL-TIME ↓"}
      </button>
    </div>
  );
}

/** Nickname from `Detroit Pistons`, `Portland Trail Blazers`. */
const nickname = (name: string) =>
  name.endsWith("Trail Blazers") ? "Trail Blazers" : name.split(" ").slice(-1)[0];

/** The 2026-27 season: the ten busiest teams up front, the full league
 *  table — East and West, every team a row with its games back — one tap
 *  away. Teams only (Dan, 2026-10-01: no coach names under the teams). */
function SeasonSection({ board, coachName }: { board: Board; coachName: (uid: string) => string }) {
  const [full, setFull] = useState(false);
  /** The one team whose players are open, if any (Dan, 2026-10-02). */
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (abbr: string) => setOpen(open === abbr ? null : abbr);
  const played = board.standings.reduce((n, t) => n + t.games, 0) / 2;
  // LEAGUE LEADERS (Dan, 2026-10-02): the five best records — win
  // percentage, then wins, then margin. Teams with no game yet are not on it.
  const active = leagueLeaders(board.standings);
  const halves = [active];
  // TEAMS or PLAYERS (Dan, 2026-10-03): the same card, the individual stat
  // leaders one tap away, per game in points, rebounds or assists.
  const [leaders, setLeaders] = useState<"teams" | "players">("teams");
  const [stat, setStat] = useState<StatKey>("pts");
  const players = statLeaders(board.playerLines, stat);
  const statLabel = { pts: "PTS", reb: "REB", ast: "AST" } as const;
  const pct = (t: Standing) => (t.games ? Number(t.pct).toFixed(3).replace(/^0/, "") : "—");
  return (
    <section className="koth-season" id="season" aria-label="The 2026-27 season">
      <div className="koth-kicker mono">2026-27 SEASON · {played} {played === 1 ? "GAME" : "GAMES"} PLAYED</div>
      <div className="koth-card">
        <div className="koth-season-top mono">
          <span>LEAGUE LEADERS</span>
          <span className="koth-seg" role="tablist" aria-label="Teams or players">
            {(["teams", "players"] as const).map((k) => (
              <button key={k} role="tab" aria-selected={leaders === k}
                      className={leaders === k ? "on" : ""} onClick={() => setLeaders(k)}>
                {k.toUpperCase()}
              </button>
            ))}
          </span>
        </div>
        {leaders === "players" ? (
          <div className="koth-statleaders">
            <div className="koth-seg small" role="tablist" aria-label="Stat">
              {(["pts", "reb", "ast"] as const).map((k) => (
                <button key={k} role="tab" aria-selected={stat === k}
                        className={stat === k ? "on" : ""} onClick={() => setStat(k)}>
                  {statLabel[k]}
                </button>
              ))}
            </div>
            {players.length === 0 ? (
              <p className="koth-empty mono">No player stats yet.</p>
            ) : (
              <>
                <div className="koth-stat-cols mono faint"><span>#</span><span>PLAYER</span><span>TEAM</span><span>GP</span><span>{statLabel[stat]}</span></div>
                {players.map((p, i) => (
                  <div key={p.id} className="koth-stat-row mono">
                    <span className={`rk ${i < 3 ? "top" : ""}`}>{i + 1}</span>
                    <span className="who">{p.name}</span>
                    <span className="abbr">{p.team}</span>
                    <span>{p.games}</span>
                    <span className="val">{p.value.toFixed(1)}</span>
                  </div>
                ))}
                <p className="koth-rule mono">Per game. A player needs half the games of whoever has played the most.</p>
              </>
            )}
          </div>
        ) : active.length === 0 ? (
          <p className="koth-empty mono">No season game has been played yet.</p>
        ) : (
          <div className="koth-active">
            {halves.map((half, h) => (
              <div key={h}>
                <div className="koth-active-cols mono faint"><span /><span>TEAM</span><span>W</span><span>L</span><span>PCT</span></div>
                {half.map((t) => (
                  <div key={t.abbr}>
                    <button className={`koth-active-row koth-team-row mono ${open === t.abbr ? "open" : ""}`}
                            onClick={() => toggle(t.abbr)} aria-expanded={open === t.abbr}
                            aria-label={`${t.name}: show player stats`}>
                      <span className="abbr">{t.abbr}</span>
                      <span className="team">{nickname(t.name)} <i aria-hidden>{open === t.abbr ? "▴" : "▾"}</i></span>
                      <span>{t.wins}</span><span>{t.losses}</span>
                      <span>{pct(t)}</span>
                    </button>
                    {open === t.abbr && <TeamPlayers board={board} team={t} />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <button className="koth-linkish mono center" onClick={() => setFull(!full)} aria-expanded={full}>
          {full ? "HIDE THE STANDINGS ↑" : "FULL 30-TEAM STANDINGS ↓"}
        </button>
      </div>

      {full && (
        <div className="koth-season-grid">
          {(["EAST", "WEST"] as const).map((conf) => (
            <div key={conf} className="koth-card">
              <div className="h mono">{conf}</div>
              <div className="koth-season-cols mono faint"><span>TEAM</span><span>W</span><span>L</span><span>PCT</span><span>GB</span></div>
              {conferenceTable(board.standings, conf).map(({ team: t, gb }) => (
                <div key={t.abbr} className="koth-season-team">
                  <button className={`koth-season-row koth-team-row mono ${open === t.abbr ? "open" : ""}`}
                          onClick={() => toggle(t.abbr)} aria-expanded={open === t.abbr}
                          aria-label={`${t.name}: show player stats`}>
                    <span className="team"><b>{t.abbr}</b> {nickname(t.name)} <i aria-hidden>{open === t.abbr ? "▴" : "▾"}</i></span>
                    <span>{t.wins}</span><span>{t.losses}</span>
                    <span>{pct(t)}</span>
                    <span>{gamesBack(gb)}</span>
                  </button>
                  {open === t.abbr && <TeamPlayers board={board} team={t} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** A team's players so far, under its row (Dan, 2026-10-02): per-game
 *  averages, which with one game played are that game's line. Games from
 *  before both sides were saved have only the coached side's players, so
 *  the card says how many of the team's games its numbers cover. */
function TeamPlayers({ board, team }: { board: Board; team: Standing }) {
  const rows = teamPlayers(board.playerLines, team.abbr);
  const covered = board.boxGames[team.abbr] ?? 0;
  if (rows.length === 0) {
    return <div className="koth-team-players mono"><p className="note">No player stats yet.</p></div>;
  }
  return (
    <div className="koth-team-players mono">
      <div className="cols faint"><span>PLAYER</span><span>GP</span><span>PTS</span><span>REB</span><span>AST</span><span>FG%</span></div>
      {rows.map((r) => (
        <div key={r.id} className="row">
          <span className="who">{r.name}</span>
          <span>{r.gp}</span><span>{r.ppg}</span><span>{r.rpg}</span><span>{r.apg}</span><span>{r.fg}</span>
        </div>
      ))}
      <p className="note">
        {team.games <= 1 ? "One game — this is the season so far. " : "Per game. "}
        {covered < team.games && `Stats from ${covered} of ${team.games} games: earlier games saved only the coached team's players.`}
      </p>
    </div>
  );
}

/** Four tiles: the longest reign on each hill, the biggest daily win, the
 *  most daily wins. The rest of the old RECORDS tab went with the Board. */
function RecordsStrip({ board, coachName }: { board: Board; coachName: (uid: string) => string }) {
  const legends = longestReign(board.legends);
  const allStars = longestReign(board.allStars);
  const tiles: { k: string; kind: string; v: string; sub: string }[] = [
    { k: "LONGEST LEGENDS REIGN", kind: "is-legends", v: legends ? String(legends.defenses) : "—",
      sub: legends ? `${legends.team_name}${legends.reigning ? " · reigning" : ""}` : "no reign yet" },
    { k: "LONGEST ALL-STARS REIGN", kind: "is-allstars", v: allStars ? String(allStars.defenses) : "—",
      sub: allStars ? `${allStars.team_name}${allStars.reigning ? " · reigning" : ""}` : "no reign yet" },
    { k: "BIGGEST DAILY WIN", kind: "is-coach", v: board.bestMargin ? signed(board.bestMargin.margin) : "—",
      sub: board.bestMargin
        ? `${coachName(board.bestMargin.uid)} · ${board.bestMargin.scoreline} · ${shortDate(`${board.bestMargin.day}T12:00:00Z`)}`
        : "no daily win yet" },
    { k: "MOST DAILY WINS", kind: "is-coach", v: board.mostWins ? String(board.mostWins.wins) : "—",
      sub: board.mostWins ? coachName(board.mostWins.uid) : "no daily win yet" },
  ];
  return (
    <section className="koth-records" aria-label="Records">
      <div className="koth-kicker mono">RECORDS</div>
      <div className="koth-records-grid">
        {tiles.map((t) => (
          <div key={t.k} className={`koth-record ${t.kind}`}>
            <div className="k mono">{t.k}</div>
            <div className="v mono">{t.v}</div>
            <div className="s">{t.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- Derivations

/** The hill's longest reign: its lineage plus whoever holds it now. */
function longestReign(hill: Hill): Reign | null {
  const rows: Reign[] = hill.lineage.map((r) => ({ team_name: r.team_name, defenses: r.defenses, reigning: false }));
  if (hill.throne) rows.push({ team_name: hill.throne.team_name, defenses: hill.throne.defenses, reigning: true });
  return rows.sort((a, b) => b.defenses - a.defenses)[0] ?? null;
}
