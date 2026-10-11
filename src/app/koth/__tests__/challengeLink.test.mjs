// The /c page's reading of a friend's challenge link (2026-10-10).
import { test } from "node:test";
import assert from "node:assert/strict";
import { challengeAppLink, challengeCode } from "../lib.ts";

test("a link's code is read, trimmed and upper-cased", () => {
  assert.equal(challengeCode("?code=K7M2-9QXF-3B8T"), "K7M2-9QXF-3B8T");
  assert.equal(challengeCode("?code=k7m2-9qxf-3b8t"), "K7M2-9QXF-3B8T");
  assert.equal(challengeCode("?utm=x&code=%20K7M2-9QXF%20"), "K7M2-9QXF");
});

test("no code, a blank one or anything not a code reads as none", () => {
  assert.equal(challengeCode(""), null);
  assert.equal(challengeCode("?code="), null);
  assert.equal(challengeCode("?code=<script>"), null);
});

test("the app link carries the code", () => {
  assert.equal(challengeAppLink("K7M2-9QXF-3B8T"), "alltime5://c?code=K7M2-9QXF-3B8T");
});
