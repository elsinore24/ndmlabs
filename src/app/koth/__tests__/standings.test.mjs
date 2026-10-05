// The conference tables (Dan, 2026-10-04): East and West only, games back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { conferenceTable, gamesBack } from "../lib.ts";

const t = (abbr, conference, wins, losses, margin = 0) =>
  ({ abbr, name: abbr, conference, division: "x", games: wins + losses, wins, losses, margin, pct: 0 });

const standings = [
  t("DEN", "WEST", 5, 2, 100), t("POR", "WEST", 4, 1, 33), t("UTA", "WEST", 2, 0, 7),
  t("OKC", "WEST", 1, 0, 27), t("SAC", "WEST", 0, 1), t("PHO", "WEST", 0, 0),
  t("BOS", "EAST", 3, 1),
];

test("one conference, the team furthest over .500 first, no divisions", () => {
  const west = conferenceTable(standings, "WEST").map((r) => r.team.abbr);
  // DEN +3, POR +3 (better pct), UTA +2, OKC +1, PHO 0, SAC -1.
  assert.deepEqual(west, ["POR", "DEN", "UTA", "OKC", "PHO", "SAC"]);
  assert.ok(!west.includes("BOS"));
});

test("games back from the leader, never negative", () => {
  const gb = Object.fromEntries(conferenceTable(standings, "WEST").map((r) => [r.team.abbr, r.gb]));
  assert.equal(gb.POR, 0);
  assert.equal(gb.DEN, 0);          // 5-2 against 4-1: level
  assert.equal(gb.UTA, 0.5);
  assert.equal(gb.OKC, 1);          // 1-0 against 4-1
  assert.equal(gb.SAC, 2);
  assert.ok(Object.values(gb).every((g) => g >= 0));
  assert.equal(gamesBack(0), "—");
  assert.equal(gamesBack(1.5), "1.5");
  assert.equal(gamesBack(3), "3.0");
});
