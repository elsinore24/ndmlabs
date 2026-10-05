// The coach rating and Coach of the Week, pinned. Run with `npm test`
// (node --test with type-stripping, so lib.ts is imported as it is).
import { test } from "node:test";
import assert from "node:assert/strict";
import { allTimeCoaches, CAREER_MIN_GAMES, coachOfTheWeek, gamePoints, rateCoaches, ratingLabel, thronesTaken, WEEK_MIN_GAMES } from "../lib.ts";

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
  assert.equal(one.rating, (2 + 3) / 4); assert.equal(ratingLabel(one.rating), "1.25");
  const [three] = rateCoaches([g("b", true, 20), g("b", true, 20), g("b", true, 20)]);
  assert.equal(ratingLabel(three.rating), "1.50");
  const [loser] = rateCoaches([g("c", false, -5)]);
  assert.equal(ratingLabel(loser.rating), "0.75");   // 3 / 4
  // A full week of good wins beats one blowout.
  const ranked = rateCoaches([g("a", true, 20), g("b", true, 20), g("b", true, 20), g("b", true, 20)]);
  assert.deepEqual(ranked.map((c) => c.uid), ["b", "a"]);
});

test("Coach of the Week counts dailies and season games, and needs WEEK_MIN_GAMES", () => {
  const rows = [
    daily("a", 25, "2026-09-28T01:00Z"), daily("a", 25, "2026-09-29T01:00Z"),     // two blowouts, no third game
    daily("b", 10, "2026-09-28T02:00Z"), daily("b", -4, "2026-09-29T02:00Z"),
  ];
  const games = [
    game("b", "LAL", "MIA", 110, 100, "LAL", "2026-09-30T01:00Z"),   // b wins by 10 at home
    game("c", "BOS", "LAL", 99, 110, "LAL", "2026-09-30T02:00Z"),    // c wins by 11 away
  ];
  const week = coachOfTheWeek(rows, games);
  // a has 2 games, b 3, c 1: whoever meets the minimum is on the board.
  const expected = [["a", 2], ["b", 3], ["c", 1]].filter(([, n]) => n >= WEEK_MIN_GAMES).map(([u]) => u);
  assert.deepEqual(week.map((c) => c.uid).sort(), expected);
  const b = week.find((c) => c.uid === "b");
  assert.equal(b.games, 3); assert.equal(b.wins, 2); assert.equal(b.losses, 1);
  assert.equal(b.margin, 16);
  assert.equal(ratingLabel(b.rating), "1.00");   // (1.5 + 0 + 1.5 + 3) / 6
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
});

test("an empty week is an empty ranking, not an error", () => {
  assert.deepEqual(coachOfTheWeek([]), []);
});

test("the all-time board rates career totals the same way, CAREER_MIN_GAMES to appear", () => {
  const career = (uid, games, wins, points, margin = 0, first_at = "2026-09-13T00:00Z") =>
    ({ uid, games, wins, points, margin, first_at });
  const board = allTimeCoaches([
    career("vet", 20, 16, 26.6, 232),   // (26.6 + 3) / 23
    career("new", 3, 3, 6, 75),         // a perfect start, but three games
    career("mid", 10, 5, 7.5, 10),      // (7.5 + 3) / 13
  ]);
  // Best rating first among those with the minimum: new (6 + 3) / 6 = 1.50
  // when three games count, then vet 1.29, then mid.
  const order = [["new", 3], ["vet", 20], ["mid", 10]].filter(([, n]) => n >= CAREER_MIN_GAMES).map(([u]) => u);
  assert.deepEqual(board.map((c) => c.uid), order);
  const vet = board.find((c) => c.uid === "vet");
  assert.equal(ratingLabel(vet.rating), "1.29");
  assert.equal(vet.losses, 4);
  // Totals and games agree: the same games rate the same, however they arrive.
  const g = (won, margin, at) => ({ uid: "x", won, margin, at });
  const games = [g(true, 20, "a"), g(false, -4, "b"), g(true, 10, "c")];
  assert.equal(rateCoaches(games)[0].rating, (2 + 0 + 1.5 + 3) / 6);
});

test("thrones taken count every series that took a throne, both hills, per coach", () => {
  const taken = thronesTaken([
    { challenger_uid: "a", throne_id: 1 }, { challenger_uid: "a", throne_id: 2 },
    { challenger_uid: "b", throne_id: 1 }, { challenger_uid: "", throne_id: 1 },
  ]);
  assert.deepEqual(taken, { a: 2, b: 1 });
  assert.deepEqual(thronesTaken([]), {});
});
