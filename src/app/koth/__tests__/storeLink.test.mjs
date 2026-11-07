import { test } from "node:test";
import assert from "node:assert/strict";
import { inTikTok, itmsUrl } from "../../../components/storeLinkRules.ts";

test("a store link becomes the App Store app's own link", () => {
  assert.equal(
    itmsUrl("https://apps.apple.com/us/app/all-time-5/id6808837783"),
    "itms-apps://apps.apple.com/us/app/all-time-5/id6808837783",
  );
});

test("TikTok's browser is recognised; Safari and Instagram are not", () => {
  const tiktok = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_43.1.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US BytedanceWebview/d8a21c6";
  const safari = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
  const instagram = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 400.0.0.0.0";
  assert.equal(inTikTok(tiktok), true);
  assert.equal(inTikTok(safari), false);
  assert.equal(inTikTok(instagram), false);
});
