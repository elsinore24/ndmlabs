import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | NDMLABS",
  description: "How All-Time 5 and other NDMLABS apps handle your data.",
};

const EMAIL = "ndmlaboratories@gmail.com";

/** The policy, written to match what the app actually does — see
 *  CloudIdentity.swift (Sign in with Apple with no scopes requested),
 *  LeaderboardSync.swift (what is posted), WorldThrone.swift (throne
 *  challenges) and PrivacyInfo.xcprivacy. Rewritten 2026-10-12 for the
 *  App Store submission. */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0b0c0f] text-[#e8e6e1]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-xs tracking-[0.3em] text-[#9aa6b8] uppercase">NDMLABS</p>
        <h1 className="mt-2 text-4xl font-black">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#9aa6b8]">Effective October 12, 2026 · applies to All-Time 5 and other NDMLABS apps</p>

        <Section title="The short version">
          <p>
            All-Time 5 plays on your device. Custom games, season games as a guest and your first
            daily challenge need no account. To post to the public boards — the daily challenge
            from your second day, King of the Hill, and season games — you sign in with Apple, and
            we store the coach name you pick and the results you post. We do not run ads, we do not
            use analytics or tracking, and we never sell or share your data.
          </p>
        </Section>

        <Section title="What stays on your device">
          <p>
            Your colours, saved teams, game history, streak, blocked coaches and settings are kept
            in the app&apos;s own storage on your device. Deleting the app deletes them.
          </p>
        </Section>

        <Section title="What we store when you sign in">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <b>An account identifier from Sign in with Apple.</b> We request no name and no email
              address from Apple. We also keep a token Apple gives us, used only to disconnect the
              app from your Apple ID when you delete your account.
            </li>
            <li>
              <b>A handle and a coach name.</b> The handle is made from the team name you have at
              sign-in; the coach name is whatever you type. Your coach name is shown on the boards
              in the app and at ndmlabs.net/koth.
            </li>
            <li>
              <b>Results you post, which are public:</b> daily challenge scores; season games; King
              of the Hill challenges, including the team name you type, the five you send and the
              series result; reigns on a throne; and the box-score lines of the players in your
              games. These are public by design — the boards exist to show them.
            </li>
            <li>
              <b>Reports.</b> If you report a name, we store the name you reported and your account
              identifier so we can review it.
            </li>
          </ul>
          <p className="mt-3">
            This data is stored with Supabase, our hosting provider, on servers in the United
            States. Requests between the app and the server use HTTPS.
          </p>
        </Section>

        <Section title="What we do not do">
          <ul className="list-disc space-y-2 pl-5">
            <li>No advertising, and no advertising identifiers.</li>
            <li>No analytics, crash-reporting or tracking SDKs from third parties.</li>
            <li>No location, contacts, microphone or camera access.</li>
            <li>
              Photos only if you ask: tapping Save Image on a share card adds that one picture to
              your library. The app cannot read your photos.
            </li>
            <li>Notifications are local and optional: one reminder before a daily streak ends.</li>
            <li>No selling, renting or sharing of your data with anyone.</li>
          </ul>
        </Section>

        <Section title="Deleting your data">
          <p>
            In the app, open Settings, then Account, then Delete account. That deletes your
            account, your coach name and the results posted under it, and disconnects the app from
            your Apple ID. Shared records other players are part of — such as a throne&apos;s list
            of past Kings — keep the result but replace your names with &ldquo;Retired coach&rdquo;.
            Deleting the app removes everything on your device. You can also write to{" "}
            <a className="text-[#ffb020] underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>{" "}
            and we will delete your account within 30 days.
          </p>
        </Section>

        <Section title="Children">
          <p>
            The app is not directed at children under 13 and we do not knowingly collect personal
            information from them. If you believe a child has posted to a board, email us and we
            will remove it.
          </p>
        </Section>

        <Section title="Changes and contact">
          <p>
            If this policy changes, the effective date above changes with it. Questions go to{" "}
            <a className="text-[#ffb020] underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        </Section>

        <p className="mt-12 text-sm text-[#9aa6b8]">
          <Link href="/" className="underline">ndmlabs.net</Link> · <Link href="/support" className="underline">Support</Link> · NDM LABS LLC
        </p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-[#ffb020]">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-[#c9cfd9]">{children}</div>
    </section>
  );
}
