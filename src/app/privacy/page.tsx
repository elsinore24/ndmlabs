import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | NDMLABS",
  description: "How Coach of the Year and other NDMLABS apps handle your data.",
};

/** The policy, written to match what the app actually does — see
 *  CloudIdentity.swift (Sign in with Apple with no scopes requested),
 *  LeaderboardSync.swift (what is posted), and PrivacyInfo.xcprivacy. */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0b0c0f] text-[#e8e6e1]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-xs tracking-[0.3em] text-[#9aa6b8] uppercase">NDMLABS</p>
        <h1 className="mt-2 text-4xl font-black">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#9aa6b8]">Effective September 5, 2026 · applies to Coach of the Year and other NDMLABS apps</p>

        <Section title="The short version">
          <p>
            Coach of the Year plays entirely on your device. You can draft, play every mode and
            keep your record without an account. If you choose to post a result to the public
            leaderboard, you sign in with Apple and we store the coach name you pick and the results
            you post. We do not run ads, we do not use analytics or tracking SDKs, and we never sell
            or share your data.
          </p>
        </Section>

        <Section title="What stays on your device">
          <p>
            Your franchise name, colours, banners, run history, saved games and settings are stored
            in the app&apos;s own storage on your device. They are not uploaded. Deleting the app
            deletes them.
          </p>
        </Section>

        <Section title="What we store when you sign in">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <b>An account identifier from Sign in with Apple.</b> We request no name and no
              email address from Apple. The identifier lets you keep the same handle across
              devices and reinstalls.
            </li>
            <li>
              <b>A public handle and a coach name.</b> The handle is generated from your franchise
              name; the coach name is whatever you type. Both are shown on the public leaderboard
              at ndmlabs.net/koth and inside the app.
            </li>
            <li>
              <b>Results you post.</b> Daily Challenge scores, tournament run scores, King of the
              Hill challenges and outcomes, and the historical players in the five you fielded.
              These are public by design: the leaderboard exists to show them.
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
            <li>No location, contacts, photos, microphone or camera access.</li>
            <li>No selling, renting or sharing of your data with anyone.</li>
          </ul>
        </Section>

        <Section title="Deleting your data">
          <p>
            Deleting the app removes everything on your device. To delete your leaderboard account
            and every result posted under it, email us from any address at{" "}
            <a className="text-[#ffb020] underline" href="mailto:ndmlaboratories@gmail.com">
              ndmlaboratories@gmail.com
            </a>{" "}
            with your coach name, and we will remove it within 30 days. You can also stop using
            Sign in with Apple for this app in your Apple ID settings at any time.
          </p>
        </Section>

        <Section title="Children">
          <p>
            The app is not directed at children under 13 and we do not knowingly collect personal
            information from them. If you believe a child has posted to the leaderboard, email us
            and we will remove it.
          </p>
        </Section>

        <Section title="Changes and contact">
          <p>
            If this policy changes, the effective date above changes with it. Questions go to{" "}
            <a className="text-[#ffb020] underline" href="mailto:ndmlaboratories@gmail.com">
              ndmlaboratories@gmail.com
            </a>
            .
          </p>
        </Section>

        <p className="mt-12 text-sm text-[#9aa6b8]">
          <Link href="/" className="underline">ndmlabs.net</Link> · NDM LABS LLC
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
