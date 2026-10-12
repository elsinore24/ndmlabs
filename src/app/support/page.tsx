import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support | All-Time 5",
  description: "Help with All-Time 5: contact, accounts, reporting a name.",
};

const EMAIL = "ndmlaboratories@gmail.com";

/** The App Store's support URL (2026-10-12). Short on purpose: how to reach
 *  us, and the three things people ask about. */
export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#0b0c0f] text-[#e8e6e1]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-xs tracking-[0.3em] text-[#9aa6b8] uppercase">ALL-TIME 5</p>
        <h1 className="mt-2 text-4xl font-black">Support</h1>

        <Section title="Contact">
          <p>
            Write to{" "}
            <a className="text-[#ffb020] underline" href={`mailto:${EMAIL}?subject=All-Time%205`}>{EMAIL}</a>.
            We answer within two days.
          </p>
        </Section>

        <Section title="A name that shouldn't be there">
          <p>
            In the app, press and hold the coach&apos;s name on a board and choose Report, or Block
            to hide them from your own boards. Reports are reviewed within 24 hours. You can also
            email us the name and where you saw it.
          </p>
        </Section>

        <Section title="Your account">
          <p>
            You sign in with Apple; we never see your email. To delete your account and everything
            posted under it: Settings, then Account, then Delete account. See the{" "}
            <Link href="/privacy" className="text-[#ffb020] underline">privacy policy</Link> for what
            we keep.
          </p>
        </Section>

        <Section title="The game">
          <p>
            Draft a five from real NBA seasons, then coach the game: timeouts, plays, defence and
            the press. Ratings are explained in the app under Settings, How ratings work. All-Time 5
            is not affiliated with, endorsed by or sponsored by the NBA or any team, league or
            player.
          </p>
        </Section>

        <p className="mt-12 text-sm text-[#9aa6b8]">
          <Link href="/koth" className="underline">The boards</Link> · <Link href="/privacy" className="underline">Privacy</Link> · NDM LABS LLC
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
