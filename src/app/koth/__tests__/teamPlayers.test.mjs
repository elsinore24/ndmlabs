// A team's drop-down on the season standings (2026-10-02). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fgPct, oneLinePerMan, teamPlayers } from "../lib.ts";

const line = (team, id, name, games, pts, reb, ast, fg_m, fg_a) =>
  ({ season: 2027, team_abbr: team, player_id: id, player_name: name, games, pts, reb, ast, stl: 0, blk: 0, tov: 0, fg_m, fg_a });

const lines = [
  line("CLE", "mitchdo01:2026", "Donovan Mitchell", 3, 69, 18, 26, 25, 51),
  line("CLE", "hardeja01:2026", "James Harden", 3, 85, 15, 24, 30, 50),
  line("CLE", "allenja01:2026", "Jarrett Allen", 1, 16, 9, 1, 8, 11),
  line("IND", "siakapa01:2026", "Pascal Siakam", 2, 40, 12, 6, 16, 30),
];

test("only that team's players, best scorer a game first", () => {
  assert.deepEqual(teamPlayers(lines, "CLE").map((r) => r.name),
    ["James Harden", "Donovan Mitchell", "Jarrett Allen"]);
  assert.deepEqual(teamPlayers(lines, "IND").map((r) => r.name), ["Pascal Siakam"]);
  assert.deepEqual(teamPlayers(lines, "PHI"), []);
});

test("averages a game; one game is that game's line", () => {
  const [harden] = teamPlayers(lines, "CLE");
  assert.equal(harden.gp, 3);
  assert.equal(harden.ppg, "28.3");
  assert.equal(harden.rpg, "5.0");
  assert.equal(harden.apg, "8.0");
  assert.equal(harden.fg, ".600");
  const allen = teamPlayers(lines, "CLE").find((r) => r.name === "Jarrett Allen");
  assert.deepEqual([allen.gp, allen.ppg, allen.rpg, allen.apg], [1, "16.0", "9.0", "1.0"]);
});

test("field goal percentage reads as a basketball number", () => {
  assert.equal(fgPct(8, 11), ".727");
  assert.equal(fgPct(0, 0), "—");
  assert.equal(fgPct(5, 5), "1.000");
});

import { leagueLeaders } from "../lib.ts";
test("league leaders: the standings' order — games over .500, then percentage; no-game teams left off", () => {
  const t = (abbr, wins, losses, margin) => ({ abbr, name: abbr, conference: "EAST", division: "X",
    games: wins + losses, wins, losses, margin, pct: 0 });
  const table = [t("AAA", 3, 1, 43), t("BBB", 1, 0, 34), t("CCC", 4, 2, 11), t("DDD", 0, 0, 0),
                 t("EEE", 2, 0, 33), t("FFF", 2, 0, 7), t("GGG", 2, 5, -65)];
  // EEE, FFF, AAA, CCC are all two over .500 (1.000, 1.000, .750, .667); BBB is one.
  assert.deepEqual(leagueLeaders(table).map((x) => x.abbr), ["EEE", "FFF", "AAA", "CCC", "BBB"]);
  assert.ok(!leagueLeaders(table, 10).some((x) => x.abbr === "DDD"));
});

import { statLeaders } from "../lib.ts";
test("stat leaders: per game, one man across two teams, half the games to qualify", () => {
  const l = (team, id, name, games, pts, reb, ast) =>
    ({ season: 2027, team_abbr: team, player_id: id, player_name: name, games, pts, reb, ast, stl: 0, blk: 0, tov: 0, fg_m: 0, fg_a: 0 });
  const lines = [
    l("CLE", "a", "Harden", 4, 112, 20, 36),      // 28.0 ppg
    l("CLE", "b", "Mitchell", 4, 100, 16, 24),    // 25.0
    l("TOR", "c", "Leonard", 1, 38, 13, 5),       // one game: under the floor (4 / 2 = 2)
    l("IND", "d", "Siakam", 2, 40, 12, 6),        // 20.0, exactly the floor
    l("MIL", "e", "Traded", 1, 30, 5, 2), l("IND", "e", "Traded", 2, 30, 4, 4),  // 3 games, 20.0, mostly IND
  ];
  const pts = statLeaders(lines, "pts");
  assert.deepEqual(pts.map((x) => x.name), ["Harden", "Mitchell", "Traded", "Siakam"]);
  assert.equal(pts[0].value, 28);
  assert.equal(pts.find((x) => x.name === "Traded").team, "IND");
  assert.equal(statLeaders(lines, "ast")[0].name, "Harden");
  assert.deepEqual(statLeaders([], "pts"), []);
});

test("a re-rated card is the same man: his lines are summed under the newer id", () => {
  const merged = oneLinePerMan([
    line("LAL", "doncilu01:2026", "Luka Dončić", 4, 120, 30, 36, 40, 80),
    line("LAL", "doncilu01:2027", "Luka Dončić", 2, 64, 14, 18, 22, 40),
    line("DAL", "doncilu01:2026", "Luka Dončić", 1, 30, 8, 9, 10, 20),
    line("LAL", "reaveau01:2026", "Austin Reaves", 3, 60, 12, 15, 21, 45),
  ]);
  assert.equal(merged.length, 3, "one line per man per team");
  const luka = merged.find((l) => l.team_abbr === "LAL" && l.player_id.startsWith("doncilu01"));
  assert.equal(luka.player_id, "doncilu01:2027");
  assert.equal(luka.games, 6);
  assert.equal(luka.pts, 184);
  assert.equal(luka.fg_a, 120);
  assert.equal(teamPlayers(merged, "LAL")[0].ppg, "30.7");
});
