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
};
export type LineageEntry = {
  id: number;
  version: number;
  holder_uid: string;
  holder_handle: string;
  team_name: string;
  defenses: number;
  claimed_at: string;
  ended_at: string;
  dethroned_by_handle: string;
  lead_player: string | null;
};
export type Challenge = {
  id: number;
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

const VENUE_PRESETS = [
  { id: "msg88", display_name: "MADISON SQUARE GARDEN", short_name: "THE GARDEN '88", year: 1988,
    rule_tags: ["HAND-CHECKS LEGAL", "LONG LINE", "THEY LET THEM PLAY"] },
  { id: "oracle16", display_name: "ORACLE ARENA", short_name: "ORACLE '16", year: 2016,
    rule_tags: ["SPLASH ERA", "OPEN LANES", "QUICK WHISTLE OUTSIDE"] },
];
function fnv32(key: string): number {
  // BigInt() calls rather than literals: the tsconfig targets ES2017.
  const M64 = (BigInt(1) << BigInt(64)) - BigInt(1);
  let h = BigInt("0xcbf29ce484222325");
  for (const b of new TextEncoder().encode(key)) {
    h ^= BigInt(b);
    h = (h * BigInt("0x100000001b3")) & M64;
  }
  return Number((h ^ (h >> BigInt(32))) & BigInt("0xffffffff"));
}
export function venueFallback(day: string): Venue {
  const pick = fnv32(`${day}|venue`) % (VENUE_PRESETS.length + 1);
  if (pick === 0) {
    return { day, venue_id: null, display_name: "HOUSE ARENA", short_name: "THE HOUSE", year: null, rule_tags: [] };
  }
  const v = VENUE_PRESETS[pick - 1];
  return { day, venue_id: v.id, display_name: v.display_name, short_name: v.short_name, year: v.year, rule_tags: v.rule_tags };
}
/** `THE GARDEN` — the building without its year. */
export function venueName(v: Venue): string {
  return v.short_name.replace(/\s*'\d\d$/, "");
}
/** `THE GARDEN · 1988` — the venue chip. */
export function venueChip(v: Venue): string {
  const name = venueName(v);
  return v.year ? `${name} · ${v.year}` : name;
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
