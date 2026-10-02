// A team's drop-down on the season standings (2026-10-02). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fgPct, teamPlayers } from "../lib.ts";

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
