// The pure halves of StoreLink, kept apart so node's tests can load them.

/** The App Store app's own scheme for a web listing URL. */
export function itmsUrl(href: string): string {
  return href.replace(/^https:\/\//, "itms-apps://");
}

/** TikTok's in-app browser names itself in the user agent. Its browser blocks
 *  every route to the App Store (Dan's phone, 2026-11-06). */
export function inTikTok(userAgent: string): boolean {
  return /musical_ly|BytedanceWebview|TikTok/i.test(userAgent);
}
