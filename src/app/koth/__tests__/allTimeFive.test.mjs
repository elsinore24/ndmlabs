// ALL-TIME 5 · MOST WINS (2026-10-27). Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { allTimeFiveLeaders } from "../lib.ts";

const row = (id, name, season, wins, losses) =>
  ({ player_id: id, player_name: name, player_season: season, games: wins + losses, wins, losses, pct: "0" });

test("most wins first, then the better percentage, then more games", () => {
  const rows = [
    row("a", "Bill Russell", "1962", 5, 5),
    row("b", "Michael Jordan", "1996", 9, 1),
    row("c", "Magic Johnson", "1987", 5, 1),
    row("d", "Larry Bird", "1986", 5, 1),
    row("e", "Tim Duncan", "2003", 0, 0),
  ];
  assert.deepEqual(allTimeFiveLeaders(rows).map((r) => r.name),
    ["Michael Jordan", "Larry Bird", "Magic Johnson", "Bill Russell"]);
});

test("season tag and percentage read like the app's", () => {
  const [mj] = allTimeFiveLeaders([row("b", "Michael Jordan", "1996", 2, 1)]);
  assert.equal(mj.season, "'96");
  assert.equal(mj.pct, ".667");
  const [wilt] = allTimeFiveLeaders([row("w", "Wilt Chamberlain", "1962", 1, 0)]);
  assert.equal(wilt.pct, "1.000");
  assert.equal(allTimeFiveLeaders([row("x", "Old Timer", "2005", 1, 0)])[0].season, "'05");
});

test("top ten unless asked for more", () => {
  const rows = Array.from({ length: 30 }, (_, i) => row(`p${i}`, `Player ${i}`, "2000", 30 - i, 0));
  assert.equal(allTimeFiveLeaders(rows).length, 10);
  assert.equal(allTimeFiveLeaders(rows, 25).length, 25);
});
