// The Coach of the Week rule, pinned. Run with `npm test` (node --test with
// type-stripping, so lib.ts is imported as it is).
import { test } from "node:test";
import assert from "node:assert/strict";
import { coachOfTheWeek } from "../lib.ts";

const row = (uid, day, margin, created_at) =>
  ({ uid, day, score: 100 + margin, score_opp: 100, won: margin > 0, margin, created_at });

// Each day's rows in the board's order: won desc, margin desc, created_at asc.
const week = [
  row("a", "2026-09-14", 12, "2026-09-14T01:00Z"), row("b", "2026-09-14", 5, "2026-09-14T02:00Z"), row("c", "2026-09-14", 1, "2026-09-14T03:00Z"), row("d", "2026-09-14", -4, "2026-09-14T04:00Z"),
  row("b", "2026-09-15", 9, "2026-09-15T01:00Z"), row("a", "2026-09-15", 8, "2026-09-15T02:00Z"), row("d", "2026-09-15", 2, "2026-09-15T03:00Z"),
  row("c", "2026-09-16", 3, "2026-09-16T01:00Z"), row("a", "2026-09-16", -2, "2026-09-16T02:00Z"),
];

test("most top-3 finishes wins", () => {
  const [first] = coachOfTheWeek(week);
  assert.equal(first.uid, "a");            // a: 3 top-3 (1st, 2nd, 2nd)
  assert.equal(first.top3, 3);
});

test("ties break on firsts, then margin, then earliest, then uid", () => {
  // b and c both have 2 top-3 finishes; b has a #1, c has a #1 too → margin
  const [, second, third] = coachOfTheWeek(week);
  assert.equal(second.uid, "b");           // b: firsts 1, margin 14
  assert.equal(third.uid, "c");            // c: firsts 1, margin 4
  const tie = [row("x", "2026-09-14", 5, "2026-09-14T01:00Z"), row("y", "2026-09-15", 5, "2026-09-15T01:00Z")];
  assert.equal(coachOfTheWeek(tie)[0].uid, "x");   // equal on everything but reachedAt: earlier wins
  const same = [row("q", "2026-09-14", 5, "2026-09-14T01:00Z"), row("p", "2026-09-15", 5, "2026-09-14T01:00Z")];
  assert.equal(coachOfTheWeek(same)[0].uid, "p");  // dead heat → uid, so the answer is total
});

test("the same rows always name the same coach, whatever order the days arrive in", () => {
  const byDay = new Map();
  for (const r of week) (byDay.get(r.day) ?? byDay.set(r.day, []).get(r.day)).push(r);
  const days = [...byDay.values()];
  const shuffled = [days[2], days[0], days[1]].flat();
  assert.deepEqual(coachOfTheWeek(shuffled).map((s) => s.uid), coachOfTheWeek(week).map((s) => s.uid));
});

test("an empty week is an empty ranking, not an error", () => {
  assert.deepEqual(coachOfTheWeek([]), []);
});
