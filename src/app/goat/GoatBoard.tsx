"use client";

// The GOAT Index. A static Next export, so there is no API behind this: the
// pipeline writes public/goat/rankings.json (`goat export-web`) and this page
// renders it. Per-player attribute detail is a separate file per player,
// fetched only when a row is opened — inlining 500 full breakdowns would be a
// megabyte of numbers nobody scrolls to.

import { Fragment, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import "./goat.css";

type Row = {
  id: string;
  rank: number;
  name: string;
  from: number;
  to: number;
  score: number | null;
  cats: Record<string, number | null>;
  top: string[];
  championships?: number | null;
  finals_mvp?: number | null;
  mvp_wins?: number | null;
  all_nba?: number | null;
  all_star?: number | null;
  all_defense?: number | null;
  career_g?: number | null;
  career_mp?: number | null;
  seasons?: number | null;
};

type Meta = {
  generated: string;
  players: number;
  pool: number;
  seasons: [number, number];
  categories: string[];
  min_career_mp: number;
};

type Detail = {
  id: string;
  name: string;
  rank: number;
  attrs: Record<string, { peak: number | null; prime: number | null; career: number | null }>;
  career: Record<string, { z: number | null; raw: number | null }>;
};

const ERAS: { label: string; test: (r: Row) => boolean }[] = [
  { label: "All", test: () => true },
  { label: "Pre-1980", test: (r) => r.to < 1980 },
  { label: "1980–99", test: (r) => r.to >= 1980 && r.from <= 1999 },
  { label: "2000+", test: (r) => r.to >= 2000 },
];

const num = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined ? "—" : v.toFixed(digits);

/** Career minutes are the one count that needs thousands; vote shares are
    fractional. Everything else is a whole number of things. */
function fmtCount(key: string, v: number) {
  if (key === "career_mp") return `${Math.round(v).toLocaleString()}`;
  if (key.endsWith("_share")) return v.toFixed(1);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** Attribute keys are the pipeline's snake_case; print them like English. */
function pretty(key: string) {
  const special: Record<string, string> = {
    ts_plus: "TS+",
    pts_per_game: "Points / game",
    pts_per100: "Points / 100",
    ft_rate: "FT rate",
    x3p_ar: "3PA rate",
    ast_to: "Assist : turnover",
    bpm: "BPM",
    obpm: "OBPM",
    dbpm: "DBPM",
    vorp: "VORP",
    per: "PER",
    ws_48: "WS / 48",
    dws: "Defensive win shares",
    d_rtg_inv: "Defensive rating",
    tov_pct_inv: "Turnover rate",
    bpm_gap: "Gap to #2",
    team_without_him: "Team without him",
    on_off_net: "On/off net",
    on_off_def: "On/off defense",
    po_bpm: "Playoff BPM",
    po_ws_48: "Playoff WS / 48",
    po_per: "Playoff PER",
    po_pts_per_game: "Playoff points / game",
    po_ts_plus: "Playoff TS+",
    po_usg_percent: "Playoff usage",
    playoff_riser: "Playoff riser",
    mvp_share: "MVP vote share",
    mvp_wins: "MVPs",
    dpoy_share: "DPOY vote share",
    all_nba: "All-NBA",
    all_defense: "All-Defense",
    all_star: "All-Star",
    career_g: "Career games",
    career_mp: "Career minutes",
    finals_mvp: "Finals MVP",
    finals_appearances: "Finals reached",
    series_won: "Series won",
    series_won_as_top_option: "Series won as #1 option",
    playoff_g: "Playoff games",
    availability: "Availability",
  };
  if (special[key]) return special[key];
  return key
    .replace(/_percent$/, " %")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function GoatBoard() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [era, setEra] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: "rank", dir: 1 });
  // A player is addressable: /goat#jordami01 opens his row. Worth having on a
  // page whose whole point is arguing about individuals.
  const [open, setOpen] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, Detail>>({});

  useEffect(() => {
    fetch("/goat/rankings.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        setMeta(d.meta);
        setRows(d.rows);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    const fromHash = () => setOpen(decodeURIComponent(window.location.hash.slice(1)) || null);
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  // Detail is fetched once per player and kept; reopening a row is instant.
  useEffect(() => {
    if (!open || details[open]) return;
    fetch(`/goat/players/${open}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Detail) => setDetails((prev) => ({ ...prev, [open]: d })))
      .catch(() => undefined);
  }, [open, details]);

  const cats = meta?.categories ?? [];

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((r) => ERAS[era].test(r));
    if (needle) out = out.filter((r) => r.name.toLowerCase().includes(needle));

    const { key, dir } = sort;
    return [...out].sort((a, b) => {
      const get = (r: Row) =>
        key === "rank" ? r.rank
        : key === "name" ? r.name.toLowerCase()
        : key === "score" ? (r.score ?? -99)
        : key === "span" ? r.from
        : (r.cats[key] ?? -99);
      const x = get(a);
      const y = get(b);
      if (x === y) return a.rank - b.rank;
      return (x < y ? -1 : 1) * dir;
    });
  }, [rows, q, era, sort]);

  const clickSort = (key: string) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: (s.dir === 1 ? -1 : 1) as 1 | -1 }
        // rank and name read best ascending; every z-score reads best highest-first
        : { key, dir: key === "rank" || key === "name" || key === "span" ? 1 : -1 },
    );

  const ariaSort = (key: string): "ascending" | "descending" | "none" =>
    sort.key !== key ? "none" : sort.dir === 1 ? "ascending" : "descending";

  return (
    <div className="goat">
      <Header fixed={false} brand={{ label: "Coach of the Year", href: "/koth" }} />

      <div className="goat-wrap">
        <section className="goat-hero">
          <div className="goat-label">NDMLABS · Basketball research</div>
          <h1>
            The <span className="goat-amber">GOAT</span> Index
          </h1>
          <p>
            Every qualifying player in NBA history, scored on {" "}
            <strong style={{ color: "var(--chalk)" }}>50-odd measurable attributes</strong>. Each one is
            standardized <em>within its own season</em>, so a number means &ldquo;this far above his
            league that year&rdquo; — 55% true shooting was extraordinary in 1975 and ordinary in 2020.
            Attributes that didn&rsquo;t exist in a player&rsquo;s era are dropped and the remaining
            weights renormalized, so nobody is punished for playing before steals were recorded.
          </p>
          <p style={{ marginTop: 12 }}>
            The weights are the argument. The data is not.
          </p>

          {meta && (
            <div className="goat-facts">
              <div className="goat-fact">
                <b>{meta.seasons[0]}–{meta.seasons[1]}</b>
                <span className="goat-label">Seasons covered</span>
              </div>
              <div className="goat-fact">
                <b>{meta.pool.toLocaleString()}</b>
                <span className="goat-label">Players scored</span>
              </div>
              <div className="goat-fact">
                <b>{meta.players}</b>
                <span className="goat-label">Ranked here</span>
              </div>
              <div className="goat-fact">
                <b>{(meta.min_career_mp / 1000).toFixed(0)}k</b>
                <span className="goat-label">Minutes to qualify</span>
              </div>
            </div>
          )}
        </section>

        <div className="goat-controls">
          <input
            className="goat-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a player…"
            aria-label="Search players"
            autoComplete="off"
          />
          {ERAS.map((e, i) => (
            <button
              key={e.label}
              className="goat-chip"
              aria-pressed={era === i}
              onClick={() => setEra(i)}
            >
              {e.label}
            </button>
          ))}
        </div>

        {failed && (
          <div className="goat-empty">
            The board could not be loaded. Try a refresh.
          </div>
        )}

        {!failed && rows.length === 0 && (
          <div className="goat-empty goat-label">Loading the board…</div>
        )}

        {rows.length > 0 && (
          <div className="goat-scroll">
            <table className="goat-table">
              <thead>
                <tr>
                  <th className="goat-rank" aria-sort={ariaSort("rank")} onClick={() => clickSort("rank")}>#</th>
                  <th className="goat-left" aria-sort={ariaSort("name")} onClick={() => clickSort("name")}>Player</th>
                  <th aria-sort={ariaSort("span")} onClick={() => clickSort("span")}>Span</th>
                  <th aria-sort={ariaSort("score")} onClick={() => clickSort("score")}>Score</th>
                  {cats.map((c) => (
                    <th
                      key={c}
                      aria-sort={ariaSort(c)}
                      onClick={() => clickSort(c)}
                      title={`${c[0].toUpperCase()}${c.slice(1)} — click to sort`}
                    >
                      <abbr title={`${c[0].toUpperCase()}${c.slice(1)}`}>{c.slice(0, 4)}</abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const isOpen = open === r.id;
                  const d = details[r.id];
                  return (
                    <Fragment key={r.id}>
                      <tr
                        className="goat-row"
                        aria-expanded={isOpen}
                        onClick={() => {
                          const next = isOpen ? null : r.id;
                          setOpen(next);
                          if (typeof window !== "undefined") {
                            history.replaceState(null, "", next ? `#${next}` : window.location.pathname);
                          }
                        }}
                      >
                        <td className="goat-rank">{r.rank}</td>
                        <td className="goat-left goat-name">{r.name}</td>
                        <td className="goat-span">{r.from}–{String(r.to).slice(2)}</td>
                        <td className="goat-score">{num(r.score)}</td>
                        {cats.map((c) => {
                          const v = r.cats[c];
                          return (
                            <td
                              key={c}
                              className={`goat-cat${v === null ? " goat-null" : v < 0 ? " goat-neg" : ""}`}
                            >
                              {num(v, 1)}
                              {v !== null && (
                                <i style={{ width: `${Math.min(Math.abs(v), 4) * 9}px` }} />
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {isOpen && (
                        <tr className="goat-detail">
                          <td colSpan={4 + cats.length}>
                            <div className="goat-detail-inner">
                              <div className="goat-counts">
                                {[
                                  ["Rings", r.championships],
                                  ["Finals MVP", r.finals_mvp],
                                  ["MVPs", r.mvp_wins],
                                  ["All-NBA", r.all_nba],
                                  ["All-Defense", r.all_defense],
                                  ["All-Star", r.all_star],
                                  ["Seasons", r.seasons],
                                  ["Games", r.career_g],
                                ].map(([label, v]) => (
                                  <div key={String(label)}>
                                    <b>{v ?? "—"}</b>{" "}
                                    <span className="goat-label">{label}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="goat-label" style={{ marginTop: 16 }}>
                                Season attributes · standard deviations above his league ·
                                peak / prime / career
                              </div>

                              {!d && <div className="goat-empty goat-label">Loading…</div>}
                              {d && (
                                <>
                                  <div className="goat-detail-grid">
                                    {Object.entries(d.attrs).map(([k, v]) => (
                                      <div className="goat-attr" key={k}>
                                        <span>{pretty(k)}</span>
                                        <b className={v.peak === null ? "goat-dim" : ""}>{num(v.peak, 1)}</b>
                                        <b className={v.prime === null ? "goat-dim" : ""}>{num(v.prime, 1)}</b>
                                        <b className={v.career === null ? "goat-dim" : ""}>{num(v.career, 1)}</b>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="goat-label" style={{ marginTop: 20 }}>
                                    Career totals · the count, and where it puts him in the
                                    whole player pool
                                  </div>
                                  <div className="goat-detail-grid">
                                    {Object.entries(d.career).map(([k, v]) => (
                                      <div className="goat-attr goat-attr-career" key={k}>
                                        <span>{pretty(k)}</span>
                                        <b>{v.raw === null ? "—" : fmtCount(k, v.raw)}</b>
                                        <b className={v.z === null ? "goat-dim" : "goat-z"}>
                                          {v.z === null ? "—" : `${v.z > 0 ? "+" : ""}${v.z.toFixed(1)}`}
                                        </b>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {shown.length === 0 && rows.length > 0 && (
          <div className="goat-empty">Nobody by that name in this era.</div>
        )}

        <p className="goat-note">
          Peak is the mean of a player&rsquo;s best three seasons, prime his best seven, career a
          minutes-weighted mean of all of them. Scores blend the three. A dash means the attribute
          didn&rsquo;t exist in his era — steals and blocks start in 1973-74, turnovers in 1977-78,
          on/off in 2007-08 — and its weight is redistributed rather than counted as zero.
          Regular-season stats come from a Basketball-Reference mirror, the postseason from
          Basketball-Reference directly, and game logs from stats.nba.com.
          {meta && <> Generated {meta.generated}.</>}
        </p>
      </div>
    </div>
  );
}
