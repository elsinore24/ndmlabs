// The coach rating and Coach of the Week, pinned. Run with `npm test`
// (node --test with type-stripping, so lib.ts is imported as it is).
import { test } from "node:test";
import assert from "node:assert/strict";
import { allTimeCoaches, CAREER_MIN_GAMES, careerTotals, coachOfTheWeek, gamePoints, marginLabel, rateCoaches, ratingLabel, thronesTaken } from "../lib.ts";

const daily = (uid, margin, created_at) =>
  ({ uid, day: created_at.slice(0, 10), score: 100 + margin, score_opp: 100, won: margin > 0, margin, created_at });
const game = (uid, home, away, hs, as, coached, created_at) =>
  ({ uid, played_on: created_at.slice(0, 10), home_abbr: home, away_abbr: away, home_score: hs, away_score: as, coached_abbr: coached, created_at });

const close = (x, y) => Math.abs(x - y) < 1e-9;

test("a win is 1 and a loss 0, the margin moving either by up to .25 at 20 points", () => {
  assert.equal(gamePoints(true, 0), 1);
  assert.equal(gamePoints(true, 10), 1.125);
  assert.equal(gamePoints(true, 20), 1.25);
  assert.equal(gamePoints(true, 45), 1.25);         // capped
  assert.equal(gamePoints(false, 0), 0);
  assert.ok(close(gamePoints(false, -1), -0.0125));  // close losses cost almost nothing
  assert.equal(gamePoints(false, -20), -0.25);
  assert.equal(gamePoints(false, -40), -0.25);      // capped
});

test("fourteen phantom games at .400: a short record sits low until it is played", () => {
  const g = (uid, won, margin, at = "2026-09-28T01:00Z") => ({ uid, won, margin, at });
  const [one] = rateCoaches([g("a", true, 20)]);
  assert.ok(close(one.rating, (1.25 + 5.6) / 15)); assert.equal(ratingLabel(one.rating), ".457");
  const [loser] = rateCoaches([g("c", false, -5)]);
  assert.ok(close(loser.rating, (-0.0625 + 5.6) / 15));
});

test("the record leads; a short perfect week sits below a strong full one (Dan, 2026-10-08)", () => {
  const g = (uid, won, margin) => ({ uid, won, margin, at: "2026-09-28T01:00Z" });
  const week = (uid, wins, losses, winBy, loseBy) =>
    [...Array(wins)].map(() => g(uid, true, winBy)).concat([...Array(losses)].map(() => g(uid, false, -loseBy)));
  const ranked = rateCoaches([
    ...week("eleven", 11, 3, 1, 1),     // 11-3, narrow wins
    ...week("ten", 10, 4, 1, 1),        // 10-4, narrow wins
    ...week("nine", 9, 5, 11, 6),       // 9-5, wins by 11
    ...week("eight", 8, 6, 25, 8),      // 8-6, blowout wins
    ...week("three", 3, 0, 25, 0),      // 3-0, blowouts
    ...week("one", 1, 0, 25, 0),        // 1-0, a blowout
  ]);
  // Phantoms at .400: a 3-0 week of blowouts (.550) sits under a full 9-5
  // of 11-point wins (.552), Dan's crossover; it still edges an 8-6 whose
  // losses ran to 8. A 1-0 coach shows, at .457.
  assert.deepEqual(ranked.map((c) => c.uid), ["eleven", "ten", "nine", "three", "eight", "one"]);
  assert.equal(ratingLabel(ranked.find((c) => c.uid === "three").rating), ".550");
  assert.equal(ratingLabel(ranked.find((c) => c.uid === "nine").rating), ".552");
  assert.equal(ratingLabel(ranked.find((c) => c.uid === "one").rating), ".457");
});

test("the margin can swap records a win or two apart at the extremes, never three", () => {
  const g = (uid, won, margin) => ({ uid, won, margin, at: "2026-09-28T01:00Z" });
  const week = (uid, wins, losses, winBy, loseBy) =>
    [...Array(wins)].map(() => g(uid, true, winBy)).concat([...Array(losses)].map(() => g(uid, false, -loseBy)));
  // One win apart, extreme margins: the blowouts edge it. Documented, not hidden.
  const near = rateCoaches([...week("nine", 9, 5, 11, 8), ...week("eight", 8, 6, 25, 2)]);
  assert.deepEqual(near.map((c) => c.uid), ["eight", "nine"]);
  // Three wins apart, the most extreme margins both ways: the record holds.
  const far = rateCoaches([...week("eleven", 11, 3, 0, 20), ...week("eight", 8, 6, 20, 0)]);
  assert.deepEqual(far.map((c) => c.uid), ["eleven", "eight"]);
});

test("Coach of the Week counts dailies and season games, every coach who played", () => {
  const rows = [
    daily("a", 25, "2026-09-28T01:00Z"), daily("a", 25, "2026-09-29T01:00Z"),
    daily("b", 10, "2026-09-28T02:00Z"), daily("b", -4, "2026-09-29T02:00Z"),
  ];
  const games = [
    game("b", "LAL", "MIA", 110, 100, "LAL", "2026-09-30T01:00Z"),   // b wins by 10 at home
    game("c", "BOS", "LAL", 99, 110, "LAL", "2026-09-30T02:00Z"),    // c wins by 11 away
  ];
  const week = coachOfTheWeek(rows, games);
  assert.deepEqual(week.map((c) => c.uid).sort(), ["a", "b", "c"]);
  const b = week.find((c) => c.uid === "b");
  assert.equal(b.games, 3); assert.equal(b.wins, 2); assert.equal(b.losses, 1);
  assert.equal(b.margin, 16);
  assert.ok(close(b.avgMargin, 16 / 3)); assert.equal(marginLabel(b.avgMargin), "+5.3");
  assert.ok(close(b.rating, (1.125 - 0.05 + 1.125 + 5.6) / 17));
});

test("labels read like the stats they imitate", () => {
  assert.equal(ratingLabel(0.6471), ".647");
  assert.equal(ratingLabel(1.0312), "1.031");
  assert.equal(ratingLabel(-0.012), "-.012");
  assert.equal(marginLabel(4.24), "+4.2");
  assert.equal(marginLabel(-1), "-1.0");
  assert.equal(marginLabel(0.01), "0.0");
  assert.equal(marginLabel(-0.01), "0.0");
});

test("ties break on wins, then margin, then the earlier first game, then uid", () => {
  const g = (uid, won, margin, at) => ({ uid, won, margin, at });
  // Equal points, more wins first: two 10-point wins (1.125 + 1.125) against
  // two 0-margin wins and ... no — equal points with different wins cannot
  // happen with one game each way, so tie on points and wins, break on margin.
  const r = rateCoaches([
    g("x", true, 20, "2026-09-28T01:00Z"), g("x", true, 0, "2026-09-28T02:00Z"),
    g("y", true, 10, "2026-09-28T03:00Z"), g("y", true, 10, "2026-09-28T04:00Z"),
  ]);
  assert.ok(close(r[0].rating, r[1].rating));
  assert.deepEqual(r.map((c) => c.uid), ["x", "y"]);   // same rating and wins and margin: earlier first game
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

test("the all-time board scores careers from their margins, the rule only here", () => {
  const row = (uid, margins, first_at = "2026-09-13T00:00Z") => {
    const entries = Object.entries(margins);
    const games = entries.reduce((n, [, c]) => n + c, 0);
    const wins = entries.reduce((n, [m, c]) => n + (Number(m) > 0 ? c : 0), 0);
    const margin = entries.reduce((n, [m, c]) => n + Number(m) * c, 0);
    return { uid, games, wins, margin, first_at, margins };
  };
  const board = allTimeCoaches(careerTotals([
    row("vet", { "12": 20, "30": 10, "-6": 8, "-25": 2 }),   // 30-10
    row("new", { "25": 3 }),                                // a perfect start
    row("mid", { "3": 5, "-3": 5 }),                        // 5-5, close games
  ]));
  const order = [["vet", 40], ["new", 3], ["mid", 10]].filter(([, n]) => n >= CAREER_MIN_GAMES).map(([u]) => u);
  assert.deepEqual(board.map((c) => c.uid), order);
  const vet = board.find((c) => c.uid === "vet");
  assert.equal(vet.losses, 10);
  // One owner: a career scored from its histogram rates exactly as the same
  // games scored one at a time, which is what the week board does.
  const one = (won, margin) => ({ uid: "vet", won, margin, at: "2026-09-13T00:00Z" });
  const games = [...Array(20)].map(() => one(true, 12)).concat([...Array(10)].map(() => one(true, 30)),
    [...Array(8)].map(() => one(false, -6)), [...Array(2)].map(() => one(false, -25)));
  assert.ok(close(rateCoaches(games)[0].rating, vet.rating));
  assert.ok(close(vet.rating, (20 * 1.15 + 10 * 1.25 - 8 * 0.075 - 2 * 0.25 + 5.6) / 54));
});

test("thrones taken count every series that took a throne, both hills, per coach", () => {
  const taken = thronesTaken([
    { challenger_uid: "a", throne_id: 1 }, { challenger_uid: "a", throne_id: 2 },
    { challenger_uid: "b", throne_id: 1 }, { challenger_uid: "", throne_id: 1 },
  ]);
  assert.deepEqual(taken, { a: 2, b: 1 });
  assert.deepEqual(thronesTaken([]), {});
});
