// The coach rating and Coach of the Week, pinned. Run with `npm test`
// (node --test with type-stripping, so lib.ts is imported as it is).
import { test } from "node:test";
import assert from "node:assert/strict";
import { coachOfTheWeek, gamePoints, rateCoaches, teamCoaches } from "../lib.ts";

const daily = (uid, margin, created_at) =>
  ({ uid, day: created_at.slice(0, 10), score: 100 + margin, score_opp: 100, won: margin > 0, margin, created_at });
const game = (uid, home, away, hs, as, coached, created_at) =>
  ({ uid, played_on: created_at.slice(0, 10), home_abbr: home, away_abbr: away, home_score: hs, away_score: as, coached_abbr: coached, created_at });

test("a game is worth 0 for a loss, 1 to 2 for a win, the full 2 at a 20-point margin", () => {
  assert.equal(gamePoints(false, -30), 0);
  assert.equal(gamePoints(false, 0), 0);
  assert.equal(gamePoints(true, 1), 1.05);
  assert.equal(gamePoints(true, 10), 1.5);
  assert.equal(gamePoints(true, 20), 2);
  assert.equal(gamePoints(true, 45), 2);           // capped
});

test("the rating is shrunk toward an even 1.0 over three games", () => {
  const g = (uid, won, margin, at = "2026-09-28T01:00Z") => ({ uid, won, margin, at });
  const [one] = rateCoaches([g("a", true, 20)]);
  assert.equal(one.rating, (2 + 3) / 4); assert.equal(one.percent, 63);   // 62.5 rounds up
  const [three] = rateCoaches([g("b", true, 20), g("b", true, 20), g("b", true, 20)]);
  assert.equal(three.percent, 75);
  const [loser] = rateCoaches([g("c", false, -5)]);
  assert.equal(loser.percent, 38);                 // 3 / 4 / 2 = 37.5
  // A full week of good wins beats one blowout.
  const ranked = rateCoaches([g("a", true, 20), g("b", true, 20), g("b", true, 20), g("b", true, 20)]);
  assert.deepEqual(ranked.map((c) => c.uid), ["b", "a"]);
});

test("Coach of the Week counts dailies and season games, and needs three games", () => {
  const rows = [
    daily("a", 25, "2026-09-28T01:00Z"), daily("a", 25, "2026-09-29T01:00Z"),     // two blowouts, no third game
    daily("b", 10, "2026-09-28T02:00Z"), daily("b", -4, "2026-09-29T02:00Z"),
  ];
  const games = [
    game("b", "LAL", "MIA", 110, 100, "LAL", "2026-09-30T01:00Z"),   // b wins by 10 at home
    game("c", "BOS", "LAL", 99, 110, "LAL", "2026-09-30T02:00Z"),    // c wins by 11 away
  ];
  const week = coachOfTheWeek(rows, games);
  assert.deepEqual(week.map((c) => c.uid), ["b"]);  // a and c have under three games
  assert.equal(week[0].games, 3); assert.equal(week[0].wins, 2); assert.equal(week[0].losses, 1);
  assert.equal(week[0].margin, 16);
  assert.equal(week[0].percent, 50);                // (1.5 + 0 + 1.5 + 3) / 6 / 2
});

test("ties break on wins, then margin, then the earlier first game, then uid", () => {
  const g = (uid, won, margin, at) => ({ uid, won, margin, at });
  // Equal points: a 20-point win and a loss (2 + 0) against two 0-margin wins (1 + 1).
  const r = rateCoaches([
    g("x", true, 20, "2026-09-28T01:00Z"), g("x", false, -3, "2026-09-28T02:00Z"),
    g("y", true, 0, "2026-09-28T03:00Z"), g("y", true, 0, "2026-09-28T04:00Z"),
  ]);
  assert.deepEqual(r.map((c) => c.uid), ["y", "x"]);   // same rating, y has more wins
  const same = rateCoaches([g("q", true, 5, "2026-09-28T02:00Z"), g("p", true, 5, "2026-09-28T01:00Z")]);
  assert.deepEqual(same.map((c) => c.uid), ["p", "q"]); // earlier first game
  const dead = rateCoaches([g("q", true, 5, "2026-09-28T01:00Z"), g("p", true, 5, "2026-09-28T01:00Z")]);
  assert.deepEqual(dead.map((c) => c.uid), ["p", "q"]); // dead heat → uid, so the answer is total
});

test("the order does not depend on the order the games arrive in", () => {
  const games = [
    game("a", "LAL", "MIA", 110, 100, "LAL", "2026-09-28T01:00Z"),
    game("b", "LAL", "MIA", 101, 100, "LAL", "2026-09-28T02:00Z"),
    game("a", "BOS", "LAL", 120, 100, "BOS", "2026-09-28T03:00Z"),
    game("c", "BOS", "LAL", 90, 100, "BOS", "2026-09-28T04:00Z"),
  ];
  const key = (list) => rateCoaches(list.map((x) => ({ uid: x.uid, won: true, margin: 1, at: x.created_at }))).map((c) => c.uid);
  assert.deepEqual(key([...games].reverse()), key(games));
  assert.deepEqual(teamCoaches([...games].reverse(), "LAL").map((c) => c.uid), teamCoaches(games, "LAL").map((c) => c.uid));
});

test("a team's coaches are only the games they coached that team in", () => {
  const games = [
    game("a", "LAL", "MIA", 110, 100, "LAL", "2026-09-28T01:00Z"),   // a coached LAL, won
    game("b", "LAL", "MIA", 100, 104, "MIA", "2026-09-28T02:00Z"),   // b coached MIA, won
    game("a", "BOS", "LAL", 120, 100, "BOS", "2026-09-28T03:00Z"),   // a coached BOS
  ];
  const lal = teamCoaches(games, "LAL");
  assert.deepEqual(lal.map((c) => [c.uid, c.wins, c.losses]), [["a", 1, 0]]);
  assert.deepEqual(teamCoaches(games, "MIA").map((c) => c.uid), ["b"]);
  assert.deepEqual(teamCoaches(games, "PHI"), []);
});

test("an empty week is an empty ranking, not an error", () => {
  assert.deepEqual(coachOfTheWeek([]), []);
});
