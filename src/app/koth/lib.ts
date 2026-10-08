// The /koth page's data layer: plain fetch against Supabase's REST API with
// the publishable key. The key is public by design — row-level security
// limits it to world-readable boards. No client library: every read here is
// one URL, and the auth flow is a redirect plus a hash to parse.

export const SUPABASE_URL = "https://lopawitfeyhtzppfchik.supabase.co";
export const SUPABASE_KEY = "sb_publishable_Jy4XRKu11PdztPoCSZfduw_kHed6SyY";

// CHALLENGE THE KING links straight to the App Store (Dan, 2026-09-02: the
// site is display only). The listing does not exist yet — swap this for the
// real apps.apple.com URL when it does; until then it lands on the homepage's
// games section rather than a dead store link.
export const APP_STORE_URL = "/#games";

// The name a deleted account leaves behind on shared history.
//
// Deleting an account (guideline 5.1.1(v)) does not erase the throne's
// lineage — it is every other player's record too — so the app's
// `delete_account_tx` replaces each name the player chose with these and
// keeps the counts, the dates and the five. The profile row goes, so the
// live coach-name lookup finds nothing and the page falls back to the
// handle, which is this. See `supabase/migrations/0008_account_deletion.sql`
// in the app repo; change these only together with that function.
export const RETIRED_HANDLE = "RETIRED COACH";
export const RETIRED_TEAM = "RETIRED FIVE";

// The house: `house_uid()` in the app's 0001 migration. It seeds a hill's
// first lineage row (THE GATEKEEPERS, the '70 Knicks on LEGENDS) and never
// enters the lineage as a dethroned King. It has no profile, so nothing is
// looked up for it, and no COACH phrase is printed for it — a coach chose
// nothing here. Change only together with that function.
export const HOUSE_UID = "00000000-0000-0000-0000-000000000000";

/** Which hill. 1 is ALL-STARS, the fives coaches build; 2 is LEGENDS, the
 *  real champions (migration 0013, 2026-09-16). `throne.id` is the
 *  discriminator; lineage and challenges carry it as `throne_id`. */
export type ThroneId = 1 | 2;

export type FiveEntry = { slot: string; pid: string; name?: string; lead?: boolean };
export type Throne = {
  version: number;
  holder_uid: string;
  holder_handle: string;
  team_name: string;
  defenses: number;
  claimed_at: string;
  five: FiveEntry[];
  lead_player: string | null;
  /** The champion's year on LEGENDS ('07 Spurs → 2007); null on ALL-STARS. */
  season: number | null;
};
export type LineageEntry = {
  id: number;
  throne_id: ThroneId;
  version: number;
  holder_uid: string;
  holder_handle: string;
  team_name: string;
  defenses: number;
  claimed_at: string;
  ended_at: string;
  dethroned_by_handle: string;
  lead_player: string | null;
  season: number | null;
};
export type Challenge = {
  id: number;
  throne_id: ThroneId;
  challenger_handle: string;
  throne_version: number;
  result: "dethroned" | "defended";
  applied: boolean;
  wins_you: number;
  wins_king: number;
  created_at: string;
};
export type DailyRaw = {
  uid: string;
  score: number;
  score_opp: number;
  venue: string | null;
  created_at: string;
  won: boolean;
  margin: number;
  five: FiveEntry[] | null;
};
export type DailyRow = DailyRaw & {
  rank: number; handle: string; coach: string | null; move: Move;
};
export type Move = { kind: "up" | "down" | "same" | "new" | "none"; n: number };
export type WeekRow = {
  rank: number;
  uid: string;
  handle: string;
  coach: string | null;
  games: number;
  wins: number;
  margin: number;
};
export type SoloReign = {
  handle: string;
  coach: string | null;
  team_name: string;
  defenses: number;
  crowned_at: string;
  ended_at: string | null;
  /** Always `solo` now: the user-built hill LEGENDS replaced. The LEGENDS
   *  rows this table briefly held moved into `throne_lineage` (throne 2)
   *  on 2026-09-16 — a champion's reign is lineage, not a solo record. */
  mode: "solo";
};
/** One coach's best climb: what the ladder run was worth. */
export type BestRun = {
  uid: string;
  run_id: string;
  coach_handle: string;
  score: number;
  rungs_cleared: number;
  summit_tier: number;
  top_rung: string | null;
  clean: boolean;
  ran_the_table: boolean;
  finished_at: string;
};

/** One row of TOP 10 THIS MONTH: a player-season's best game this month. */
export type TopPlayer = {
  player_id: string;
  player_name: string;
  player_season: string;
  coach_handle: string;
  uid: string;
  played_on: string;
  pts: number; reb: number; ast: number; stl: number; blk: number;
  composite: number;
};

export type Venue = {
  day: string;
  venue_id: string | null;
  display_name: string;
  short_name: string;
  year: number | null;
  rule_tags: string[];
};

export async function rest<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

/** The two public names of one player. The handle is the unique, moderated
    identity that records are pinned to; the coach is the person, read live,
    and absent until they have set one. */
export type Profile = { handle: string; coach: string | null };

/** handle → the name to print for it: the coach if they have set one, else
    the handle itself. For rows that store a handle string and no uid —
    challenges, `dethroned_by_handle`, the boards' `coach_handle` — which is
    every place the handle is a snapshot rather than a join. */
export async function handleNames(handles: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(handles.filter(Boolean))];
  if (unique.length === 0) return {};
  const rows = await rest<{ handle: string; coach_name: string | null }[]>(
    `profiles?handle=in.(${unique.map(encodeURIComponent).join(",")})&select=handle,coach_name`
  );
  const out: Record<string, string> = Object.fromEntries(unique.map((h) => [h, h]));
  for (const r of rows) if (r.coach_name) out[r.handle] = r.coach_name;
  return out;
}

export async function profileMap(uids: string[]): Promise<Record<string, Profile>> {
  const unique = [...new Set(uids.filter(Boolean))];
  if (unique.length === 0) return {};
  const rows = await rest<{ uid: string; handle: string; coach_name: string | null }[]>(
    `profiles?uid=in.(${unique.join(",")})&select=uid,handle,coach_name`
  );
  return Object.fromEntries(
    rows.map((r) => [r.uid, { handle: r.handle, coach: r.coach_name }])
  );
}

// ---- Days. The daily is a UTC day (the app's DailySeed.dateKey), the week
// is the ISO week (Monday), matching Postgres date_trunc('week').

export function todayUTC(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
export function mondayUTC(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

// ---- Copy formats, shared with the app so players recognize them:
// `118–107`, `'96`, `7 DEFENSES`, `SEP 1`.

export function scoreline(a: number, b: number): string {
  return `${a}–${b}`;
}
export function signed(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0";
}
export function defensesLabel(n: number): string {
  return `${n} ${n === 1 ? "DEFENSE" : "DEFENSES"}`;
}
/** `jordami01:1996` → `'96`. */
export function seasonOf(pid: string): string {
  const year = pid.split(":")[1];
  return year ? `'${year.slice(2)}` : "";
}
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
export function longDate(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][date.getUTCDay()];
  return `${weekday}, ${MONTHS[m - 1]} ${d}`;
}
export function clockTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
export function minutesAgo(since: number): string {
  const mins = Math.max(0, Math.round((Date.now() - since) / 60000));
  if (mins === 0) return "UPDATED JUST NOW";
  return `UPDATED ${mins} MIN AGO`;
}
/** `2,022` — a run score, grouped, the way the final screen prints it. */
export function grouped(n: number): string {
  return n.toLocaleString("en-US");
}
export function ordinal(n: number): string {
  const s = ["TH", "ST", "ND", "RD"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** The King's one shown player: the stored lead, else the first named. */
export function leadPlayer(t: Throne): { name: string; season: string } | null {
  const named = t.five.filter((f) => f.name);
  const entry =
    named.find((f) => f.name === t.lead_player) ?? named.find((f) => f.lead) ?? named[0];
  if (!entry || !entry.name) return null;
  return { name: entry.name, season: seasonOf(entry.pid) };
}

// ---- Coach of the Week

/** One row of this week's daily board, as `daily_board` returns it. */
export type WeekDayRow = {
  uid: string; day: string; score: number; score_opp: number;
  won: boolean; margin: number; created_at: string;
};

/** One 2026-27 season game, as `season_games` returns it. */
export type SeasonGameRow = {
  uid: string; coach_handle?: string; played_on: string;
  home_abbr: string; away_abbr: string; home_score: number; away_score: number;
  coached_abbr: string; created_at?: string;
};

/** One row of `season_standings`. */
export type Standing = {
  abbr: string; name: string; conference: "EAST" | "WEST"; division: string;
  games: number; wins: number; losses: number; margin: number; pct: number;
};

/** One player's season so far for one team, as `season_player_lines`
 *  returns it (app migration 0017): games and totals. */
export type SeasonPlayerLine = {
  season: number; team_abbr: string; player_id: string; player_name: string; games: number;
  pts: number; reb: number; ast: number; stl: number; blk: number; tov: number; fg_m: number; fg_a: number;
};

/** A row of a team's drop-down: per-game averages. With one game played
 *  they are that game's line — one game is the whole season so far. */
export type TeamPlayerRow = { id: string; name: string; gp: number; ppg: string; rpg: string; apg: string; fg: string };

const perGame = (total: number, games: number) => (games > 0 ? (total / games).toFixed(1) : "0.0");

/** `.531`, or `—` with no shot taken. */
export function fgPct(made: number, attempts: number): string {
  return attempts > 0 ? (made / attempts).toFixed(3).replace(/^0/, "") : "—";
}

/** A team's players, best scorer a game first (ties: more games, then name). */
export function teamPlayers(lines: SeasonPlayerLine[], abbr: string): TeamPlayerRow[] {
  return lines
    .filter((l) => l.team_abbr === abbr)
    .sort((a, b) => b.pts / Math.max(b.games, 1) - a.pts / Math.max(a.games, 1)
      || b.games - a.games || a.player_name.localeCompare(b.player_name))
    .map((l) => ({
      id: l.player_id, name: l.player_name, gp: l.games,
      ppg: perGame(l.pts, l.games), rpg: perGame(l.reb, l.games), apg: perGame(l.ast, l.games),
      fg: fgPct(l.fg_m, l.fg_a),
    }));
}

/** STAT LEADERS (Dan, 2026-10-03): individual players, per game. */
export type StatKey = "pts" | "reb" | "ast";
export type StatLeader = { id: string; name: string; team: string; games: number; value: number };

/** The top players a game in one stat. A man who played for two teams is
 *  one man (summed; his team is the one he played most for). To qualify, a
 *  player needs at least half the games of whoever has played the most, so
 *  one hot night can't lead the league. */
export function statLeaders(lines: SeasonPlayerLine[], stat: StatKey, count = 5): StatLeader[] {
  const by = new Map<string, { name: string; games: number; total: number; teams: Map<string, number> }>();
  for (const l of lines) {
    const p = by.get(l.player_id) ?? by.set(l.player_id, { name: l.player_name, games: 0, total: 0, teams: new Map() }).get(l.player_id)!;
    p.games += l.games;
    p.total += l[stat];
    p.teams.set(l.team_abbr, (p.teams.get(l.team_abbr) ?? 0) + l.games);
  }
  const most = Math.max(0, ...[...by.values()].map((p) => p.games));
  const floor = Math.max(1, Math.ceil(most / 2));
  return [...by.entries()]
    .filter(([, p]) => p.games >= floor)
    .map(([id, p]) => ({
      id, name: p.name, games: p.games, value: p.total / p.games,
      team: [...p.teams.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
    }))
    .sort((a, b) => b.value - a.value || b.games - a.games || a.name.localeCompare(b.name))
    .slice(0, count);
}

/** **The standings' order**, one rule for every table on the page: games
 *  over .500 first (wins minus losses — what games back counts), then win
 *  percentage, wins, margin and code, so the order is total. */
export function standingsOrder(a: Standing, b: Standing): number {
  const pct = (t: Standing) => (t.games > 0 ? t.wins / t.games : 0);
  return (b.wins - b.losses) - (a.wins - a.losses) || pct(b) - pct(a) || b.wins - a.wins
    || b.margin - a.margin || a.abbr.localeCompare(b.abbr);
}

/** LEAGUE LEADERS: the top of the standings across both conferences, in
 *  the standings' own order (Dan, 2026-10-05: "cannot strictly be
 *  percentage … the top 5 matching the current standings"). Teams without
 *  a game are left off. */
export function leagueLeaders(standings: Standing[], count = 5): Standing[] {
  return standings.filter((t) => t.games > 0).sort(standingsOrder).slice(0, count);
}

/** A conference's table (Dan, 2026-10-04: East and West only, no
 *  divisions; games back instead of the margin). Games back counts from the
 *  team furthest over .500 — half the gap in wins-minus-losses — because
 *  teams here play very different numbers of games, and a 1-0 team "leading"
 *  a 4-1 team on percentage would put the 4-1 team at no games back. Sorted
 *  by games back, then percentage, wins, margin and code, so the order is
 *  total; nobody is ever ahead of the leader. */
export function conferenceTable(standings: Standing[], conf: "EAST" | "WEST"): { team: Standing; gb: number }[] {
  const teams = standings.filter((t) => t.conference === conf).sort(standingsOrder);
  const best = teams.length ? teams[0].wins - teams[0].losses : 0;
  return teams.map((team) => ({ team, gb: (best - (team.wins - team.losses)) / 2 }));
}

/** As ESPN prints it (Dan, 2026-10-04): `–` for the leader (or level),
 *  `0.5`, `1.5` for half games, `1`, `3` for whole ones. */
export function gamesBack(gb: number): string {
  if (gb <= 0) return "–";
  return Number.isInteger(gb) ? String(gb) : gb.toFixed(1);
}

/** Whether the coach's side won a season game. */
export function seasonGameWon(g: SeasonGameRow): boolean {
  return g.coached_abbr === g.home_abbr ? g.home_score > g.away_score : g.away_score > g.home_score;
}

// ---- The coach rating (Dan, 2026-10-01; reworked 2026-10-08). It sets
// Coach of the Week and ranks the ALL-TIME COACHES board.
//
// The record leads and the margin refines it. A win is worth 1; winning big
// adds up to KICKER more, losing big costs up to KICKER, both in full at
// MARGIN_CAP points. Until 2026-10-08 a win's margin could double it and a
// loss scored 0 however close, so an 8-6 week of blowouts outranked 11-3
// and a 40-point loss read like a 1-point one.
//
// What it guarantees, exactly: over a 14-game week the kicker moves a
// record by at most 3.5 points, so records three or more wins apart never
// swap; one or two apart can, at the extremes (8-6 on 25-point wins and
// 2-point losses edges a 9-5 of 11-point wins and 8-point losses), which is
// the margin refining a near-equal record rather than overriding a better one.
//
// The rating is the average with PHANTOM_GAMES games at PHANTOM_VALUE (an
// even .500) added, so unplayed days count as average until a coach has
// played a full week. That replaces a minimum: priced at .400 (see
// PHANTOM_VALUE), a 3-0 week of blowouts (.550) sits under a full 9-5 of
// 11-point wins and 6-point losses (.552) — a near-crossover, so a 9-5 run
// off the floor in its losses can still trail it — and a 1-0 coach shows
// on the board at .457, honestly low, rather than hidden. Printed to three decimals,
// like the stat it imitates.
//
// This file is the rule's only owner. The app's `coach_career` view
// (migration 0023) returns raw facts — each career's signed margins as a
// histogram — and `careerTotals` scores them here, so the week board and
// the all-time board cannot disagree about what a game is worth.

export const MARGIN_CAP = 20;
export const KICKER = 0.25;
/** One period of games: a two-a-day week. */
export const PHANTOM_GAMES = 14;
/** What a phantom game is worth: .400, a shade under even (Dan,
 *  2026-10-08). The phantoms are a bigger share of a short record (14 of 17
 *  games for a 3-0 week, 14 of 28 for a full one), so pricing them under
 *  .500 is what stops a 3-0 week of blowouts (.550) edging a full 9-5
 *  (.552): an unplayed day counts slightly against you, on a board for a
 *  daily game. Raising PHANTOM_GAMES instead needed ~37 games and crushed
 *  every real record toward the middle. */
export const PHANTOM_VALUE = 0.4;
/** Career games before a coach is on the ALL-TIME COACHES board. 1 for
 *  testing (2026-10-05); it was 10. The phantom games already keep a short
 *  career mid-table, so it may not need to come back. */
export const CAREER_MIN_GAMES = 1;

/** One finished game from a coach's side. */
export type RatedGame = { uid: string; won: boolean; margin: number; at: string };

/** One coach's games, totalled and scored. */
export type CoachTotals = {
  uid: string; games: number; wins: number; points: number; margin: number; first_at: string;
};

/** One career as `coach_career` returns it: raw facts, no scoring. `margins`
 *  maps a signed margin to how many games ended by it ("12": three wins by
 *  12; "-4": losses by 4). */
export type CareerRow = {
  uid: string; games: number; wins: number; margin: number; first_at: string;
  margins: Record<string, number>;
};

/** Careers scored by {@link gamePoints}: the rule applied here, not in SQL. */
export function careerTotals(rows: CareerRow[]): CoachTotals[] {
  return rows.map((r) => ({
    uid: r.uid, games: r.games, wins: r.wins, margin: r.margin, first_at: r.first_at,
    points: Object.entries(r.margins ?? {}).reduce((sum, [m, n]) => {
      const margin = Number(m);
      return sum + n * gamePoints(margin > 0, margin);
    }, 0),
  }));
}

export type CoachRating = {
  uid: string;
  games: number;
  wins: number;
  losses: number;
  /** Net margin over the games, for the tie-break. */
  margin: number;
  /** Mean margin per game, the board's MARGIN column. */
  avgMargin: number;
  /** The rating, −.25 to 1.25 in principle and near .500 for a short
   *  record: the number the boards print. */
  rating: number;
  /** When the coach's first game in the set finished. */
  firstAt: string;
};

export function gamePoints(won: boolean, margin: number): number {
  const by = Math.min(Math.abs(margin), MARGIN_CAP) / MARGIN_CAP;
  return won ? 1 + KICKER * by : 0 - KICKER * by;   // 0 - 0 is +0, not -0
}

/** `.647`, `1.031`, `-.012`: a rating as the boards print it, three decimals
 *  with no leading zero, as a batting average is written. */
export function ratingLabel(rating: number): string {
  const text = rating.toFixed(3);
  return text.replace(/^(-?)0\./, "$1.");
}

/** `+4.2`, `-1.0`, `0.0`: a mean margin per game. */
export function marginLabel(avg: number): string {
  const text = avg.toFixed(1);
  return avg > 0 && text !== "0.0" ? `+${text}` : text === "-0.0" ? "0.0" : text;
}

/** A season game, from the coach's side. */
export function seasonGameRated(g: SeasonGameRow): RatedGame {
  const home = g.coached_abbr === g.home_abbr;
  return {
    uid: g.uid, won: seasonGameWon(g),
    margin: home ? g.home_score - g.away_score : g.away_score - g.home_score,
    at: g.created_at ?? `${g.played_on}T23:59:59Z`,
  };
}

/** A daily, from the coach's side. */
export function dailyRated(r: WeekDayRow): RatedGame {
  return { uid: r.uid, won: r.won, margin: r.margin, at: r.created_at };
}

/** Coaches from their totals, best first. The tie-break chain ends in
 *  `uid`, so the order is total: the same games always rank the same way. */
export function rateTotals(totals: CoachTotals[]): CoachRating[] {
  return totals.map((t) => ({
    uid: t.uid, games: t.games, wins: t.wins, losses: t.games - t.wins, margin: t.margin,
    avgMargin: t.games > 0 ? t.margin / t.games : 0,
    rating: (t.points + PHANTOM_GAMES * PHANTOM_VALUE) / (t.games + PHANTOM_GAMES),
    firstAt: t.first_at,
  })).sort((a, b) =>
    b.rating - a.rating || b.wins - a.wins || b.margin - a.margin ||
    a.firstAt.localeCompare(b.firstAt) || a.uid.localeCompare(b.uid));
}

/** Every coach in `games`, best first. */
export function rateCoaches(games: RatedGame[]): CoachRating[] {
  const by = new Map<string, CoachTotals>();
  for (const g of games) {
    const t = by.get(g.uid) ?? by.set(g.uid, {
      uid: g.uid, games: 0, wins: 0, points: 0, margin: 0, first_at: g.at,
    }).get(g.uid)!;
    t.games += 1;
    if (g.won) t.wins += 1;
    t.margin += g.margin;
    t.points += gamePoints(g.won, g.margin);
    if (g.at < t.first_at) t.first_at = g.at;
  }
  return rateTotals([...by.values()]);
}

/** The ALL-TIME COACHES board: careers of {@link CAREER_MIN_GAMES} or more. */
export function allTimeCoaches(totals: CoachTotals[]): CoachRating[] {
  return rateTotals(totals.filter((t) => t.games >= CAREER_MIN_GAMES));
}

/** One series that took a throne, as `challenges` returns it. */
export type ThroneWin = { challenger_uid: string; throne_id: ThroneId };

/** uid → thrones taken, both hills together (Dan, 2026-10-01: a count
 *  beside the coach's name, kept out of the rating — a throne series is so
 *  much harder than a regular game that its W-L would only punish trying).
 *  Defences are not counted: the holder does not play them. */
export function thronesTaken(wins: ThroneWin[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of wins) if (w.challenger_uid) out[w.challenger_uid] = (out[w.challenger_uid] ?? 0) + 1;
  return out;
}

/** This week's ranking: dailies and season games together, Mon–Sun UTC,
 *  every coach who played (no minimum: the phantom games do that job). The
 *  first is Coach of the Week. Callers pass this week's rows only. */
export function coachOfTheWeek(rows: WeekDayRow[], seasonGames: SeasonGameRow[] = []): CoachRating[] {
  return rateCoaches([...rows.map(dailyRated), ...seasonGames.map(seasonGameRated)]);
}

/** `SEP 14 – SEP 20`: the fixed Mon–Sun week that holds `dayKey`. */
export function weekRange(dayKey: string): string {
  const monday = new Date(`${mondayUTC()}T12:00:00Z`);
  const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6);
  void dayKey;
  return `${shortDate(monday.toISOString())} – ${shortDate(sunday.toISOString())}`;
}

// ---- Movement: diffed against the previous poll's ordering, kept per day
// in localStorage. NEW when the handle was not in the previous set; no
// arrows at all on the first look (there is nothing to have moved from).

export function movement(day: string, ordered: string[]): Move[] {
  const key = `koth.order.${day}`;
  let prev: string[] | null = null;
  try {
    const raw = localStorage.getItem(key);
    prev = raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    prev = null;
  }
  try {
    localStorage.setItem(key, JSON.stringify(ordered));
  } catch {
    /* storage unavailable: movement simply reads flat */
  }
  return ordered.map((handle, i) => {
    if (!prev) return { kind: "none", n: 0 };
    const was = prev.indexOf(handle);
    if (was < 0) return { kind: "new", n: 0 };
    const delta = was - i;
    if (delta > 0) return { kind: "up", n: delta };
    if (delta < 0) return { kind: "down", n: -delta };
    return { kind: "same", n: 0 };
  });
}

// ---- Venue fallback. daily_venues is the shared source of truth; if a day
// is missing from it, this is the app's DailySeed.venue, ported exactly
// (FNV-1a 64 folded to 32, keyed on `<day>|venue`), over the shipped presets.

/** A day the calendar has not reached yet.
 *
 * **It names nothing.** This used to hold two arena presets and draw one by
 * hashing the date, which was right when the app drew its venue the same
 * independent way. Two things have since made it wrong. The venue now follows
 * the day's opponent, so a hash here would contradict the app; and the two
 * presets it held were real arenas, whose names were removed from the game
 * because they are trademarks their owners enforce — leaving them here meant
 * the site would start printing them again the day the calendar lapsed.
 *
 * So an unknown day is unknown: no id, no name, no rules, and every surface
 * that shows a venue checks {@link venueKnown} and says nothing instead of
 * guessing. Extending `daily_venues` is what fixes a blank, not this.
 */
export function venueFallback(day: string): Venue {
  return { day, venue_id: null, display_name: "", short_name: "", year: null, rule_tags: [] };
}

/** False for a day the calendar has not reached — see {@link venueFallback}. */
export function venueKnown(v: Venue | null | undefined): boolean {
  return !!v && v.short_name.length > 0;
}

export function venueName(v: Venue): string {
  return v.short_name.replace(/\s*'\d\d$/, "");
}
/** `CHICAGO · 1996` — the venue chip, or empty for a day not yet scheduled. */
export function venueChip(v: Venue): string {
  if (!venueKnown(v)) return "";
  const name = venueName(v);
  return v.year ? `${name} · ${v.year}` : name;
}
// ---- Today's opponent. The daily's building follows its opponent one to
// one (the app's venues.json: one building per opponent), so the venue id
// names the team to beat. Generated from Engine/Sources/BTLEngine/Data/
// venues.json on 2026-10-01; a venue missing here only drops the "Beat the"
// clause, it never guesses.
export const DAILY_OPPONENTS: Record<string, string> = {
  nyk1970: "'70 Knicks",
  mil1971: "'71 Bucks",
  phi1973: "'73 76ers",
  por1977: "'77 Blazers",
  wsb1978: "'78 Bullets",
  sea1979: "'79 SuperSonics",
  phi1983: "'83 76ers",
  lal1985: "'85 Lakers",
  bos1986: "'86 Celtics",
  atl1987: "'87 Hawks",
  lal1987: "'87 Lakers",
  det1989: "'89 Pistons",
  ind1990: "'90 Pacers",
  dal1993: "'93 Mavericks",
  pho1993: "'93 Suns",
  orl1995: "'95 Magic",
  chi1996: "'96 Bulls",
  uta1997: "'97 Jazz",
  chh1998: "'98 Hornets",
  den1998: "'98 Nuggets",
  sas1999: "'99 Spurs",
  lal2001: "'01 Lakers",
  sac2002: "'02 Kings",
  njn2003: "'03 Nets",
  det2004: "'04 Pistons",
  min2004: "'04 Timberwolves",
  hou2005: "'05 Rockets",
  mia2006: "'06 Heat",
  noh2008: "'08 Hornets",
  cha2012: "'12 Bobcats",
  mem2013: "'13 Grizzlies",
  lac2014: "'14 Clippers",
  cle2016: "'16 Cavaliers",
  okc2016: "'16 Thunder",
  phi2016: "'16 76ers",
  gsw2017: "'17 Warriors",
  tor2019: "'19 Raptors",
  lal2020: "'20 Lakers",
  mil2021: "'21 Bucks",
  gsw2022: "'22 Warriors",
  den2023: "'23 Nuggets",
  bos2024: "'24 Celtics",
  okc2025: "'25 Thunder",
  nyk2026: "'26 Knicks",
};

/** `Philadelphia` from `PHILADELPHIA 1973`: the city, in title case. */
export function venueCity(v: Venue): string {
  return v.display_name.replace(/\s*\d{4}$/, "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
/** `1970s` for a 1973 venue: the decade the daily drafts from. */
export function venueDecade(v: Venue): string {
  return v.year ? `${Math.floor(v.year / 10) * 10}s` : "";
}
/** `7H 12M` until the next midnight UTC, when the daily resets. */
export function resetsIn(now = Date.now()): string {
  const d = new Date(now);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  const mins = Math.max(0, Math.ceil((next - now) / 60000));
  return `${Math.floor(mins / 60)}H ${mins % 60}M`;
}

/** First day of the current UTC month, `YYYY-MM-01`. */
export function monthStartUTC(): string {
  return `${todayUTC().slice(0, 7)}-01`;
}
const MONTHS_LONG = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY",
  "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
export function monthName(): string {
  return MONTHS_LONG[Number(todayUTC().slice(5, 7)) - 1];
}
/** `Michael Jordan '96` — a player-season as the boards name one. */
export function playerLabel(name: string, season: string): string {
  return season ? `${name} '${season.slice(2)}` : name;
}
/** `35 PTS · 7 REB · 5 AST` — the line that earned the placing, trimmed to
    what actually happened: a zero steals line says nothing worth the width. */
export function statLine(r: {
  pts: number; reb: number; ast: number; stl: number; blk: number;
}): string {
  const parts = [`${r.pts} PTS`];
  if (r.reb) parts.push(`${r.reb} REB`);
  if (r.ast) parts.push(`${r.ast} AST`);
  if (r.stl) parts.push(`${r.stl} STL`);
  if (r.blk) parts.push(`${r.blk} BLK`);
  return parts.join(" · ");
}
/** `Curry '16` — a five entry as surname-less display text. */
export function fiveLine(five: FiveEntry[]): string {
  return five
    .filter((f) => f.name)
    .map((f) => `${(f.name ?? "").split(" ").slice(-1)[0]} ${seasonOf(f.pid)}`)
    .join(" · ");
}
