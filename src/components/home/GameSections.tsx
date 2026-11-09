import type { ReactNode } from "react";
import StoreLink from "../StoreLink";
import LiveKings from "./LiveKings";
import Sky from "./Sky";
import { ALIBIGRID_URL, ALL_TIME_5_URL, STARSCAPES_URL } from "./games";

/** One section per game: what it is, why it's fun, and the way in. */
export default function GameSections() {
  return (
    <>
      <section id="alibigrid" className="home-wrap pb-28 sm:pb-[140px] scroll-mt-6">
        <div className="home-row">
          <Copy
            label="Web game, free, no download"
            labelColor="#f4c542"
            title="Spot the bluffs. Win the board."
            body="Nine celebrities each claim they fit their row and their column. Read the alibi, call truth or bluff, and grab three in a row before the stars do."
            color="#f4c542"
            ticks={[
              [Icon.clock, "A new grid every day at midnight"],
              [Icon.star, "Secret Square and Clean Sweep bonuses"],
              [Icon.bars, "See how you stack up against today's players"],
            ]}
          >
            <a className="home-btn home-btn-gold" href={ALIBIGRID_URL}>
              Play today&apos;s grid
            </a>
            <a href={ALIBIGRID_URL} className="text-[16px] font-semibold text-[#7fe3f7] hover:text-[#c4f3fc]">
              alibigrid.com
            </a>
          </Copy>
          <figure className="home-media m-0 overflow-hidden rounded-[18px] border border-[#94aadc]/20 bg-[#141a2c] shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="flex h-[42px] items-center gap-2 border-b border-[#94aadc]/15 px-4" aria-hidden="true">
              <span className="h-[11px] w-[11px] rounded-full bg-[#3a4460]" />
              <span className="h-[11px] w-[11px] rounded-full bg-[#3a4460]" />
              <span className="h-[11px] w-[11px] rounded-full bg-[#3a4460]" />
              <span className="ml-3.5 flex h-6 max-w-[300px] flex-1 items-center rounded-lg bg-[#0b1020] px-3 text-[13px] text-[#8d99b5]">
                alibigrid.com
              </span>
            </div>
            <img
              src="/home/alibigrid-screen.webp"
              alt="An AlibiGrid board: nine celebrities under three row rules and three column rules"
              width={1600}
              height={950}
              loading="lazy"
              className="block h-auto w-full"
            />
          </figure>
        </div>
      </section>

      <section id="all-time-5" className="home-wrap pb-28 sm:pb-[140px] scroll-mt-6">
        <div className="home-row is-flip">
          <Copy
            label="Basketball, free on iPhone"
            labelColor="#f2c14e"
            title="Draft legends. Coach the game."
            body="Spin for a franchise and a decade, draft five from that roster, then coach it live: call timeouts, switch defenses, set plays for your best scorer."
            color="#f2c14e"
            ticks={[
              [Icon.calendar, "Daily Challenge: everyone gets the same draft and opponent"],
              [Icon.crown, "King of the Hill: take the throne, then hold it"],
              [Icon.check, "No ads. No coins."],
            ]}
          >
            <StoreLink href={ALL_TIME_5_URL} className="home-badge">
              <img src="/appstore_button.png" alt="Download All-Time 5 on the App Store" width={163} height={48} />
            </StoreLink>
            <a className="home-btn home-btn-ghost" href="/koth">
              See the Board
            </a>
          </Copy>
          <div className="home-media home-court relative min-h-[420px] sm:min-h-[500px] overflow-hidden rounded-[22px] border border-[#f2c14e]/20 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="home-shade-gold" aria-hidden="true" />
            <img
              src="/alltime5-icon.png"
              alt=""
              width={76}
              height={76}
              className="absolute left-6 top-6 h-[76px] w-[76px] rounded-[18px] shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
            />
            <div className="absolute bottom-6 left-6 right-6">
              <LiveKings />
            </div>
          </div>
        </div>
      </section>

      <section id="starscapes" className="home-wrap pb-28 sm:pb-[140px] scroll-mt-6">
        <div className="home-row">
          <Copy
            label="Word puzzles, free on iPhone"
            labelColor="#b9a8ff"
            title="See it. Solve it."
            body="Starscapes hides words and phrases in pictures. Solve a riddle and a star lights up. Finish a constellation and the next world opens."
            color="#b9a8ff"
            ticks={[
              [Icon.star, "Hundreds of hand-made picture riddles"],
              [Icon.globe, "Constellation worlds themed on sports, music, movies and space"],
              [Icon.bulb, "Hints when you need a nudge, and no timer in relaxed mode"],
              [Icon.plane, "Plays offline"],
            ]}
          >
            <StoreLink href={STARSCAPES_URL} className="home-badge">
              <img src="/appstore_button.png" alt="Download Starscapes on the App Store" width={163} height={48} />
            </StoreLink>
          </Copy>
          <div className="home-media home-space relative flex min-h-[420px] sm:min-h-[500px] items-center justify-center overflow-hidden rounded-[22px] border border-[#9682ff]/20 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <Sky className="absolute inset-0 h-full w-full" />
            <img
              src="/home/starscapes-icon.webp"
              alt="The Starscapes app icon"
              width={512}
              height={512}
              loading="lazy"
              className="relative h-[200px] w-[200px] sm:h-[240px] sm:w-[240px] rounded-[46px] sm:rounded-[54px] shadow-[0_40px_110px_rgba(110,80,255,0.6)]"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Copy({
  label,
  labelColor,
  title,
  body,
  color,
  ticks,
  children,
}: {
  label: string;
  labelColor: string;
  title: string;
  body: string;
  color: string;
  ticks: [(c: string) => ReactNode, string][];
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[22px]">
      <p className="m-0 text-[15px] font-bold" style={{ color: labelColor }}>
        {label}
      </p>
      <h2 className="home-display m-0 text-[clamp(34px,4vw,56px)] leading-none text-balance">{title}</h2>
      <p className="m-0 max-w-[540px] text-[18px] leading-[1.6] text-[#a9b5cd]">{body}</p>
      <ul className="home-ticks">
        {ticks.map(([icon, text]) => (
          <li key={text}>
            {icon(color)}
            {text}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-4 pt-1.5">{children}</div>
    </div>
  );
}

// Small line icons for the feature lists, drawn in each game's colour.
const svg = (c: string, d: ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const Icon = {
  clock: (c: string) => svg(c, <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  star: (c: string) => svg(c, <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />),
  bars: (c: string) => svg(c, <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  calendar: (c: string) => svg(c, <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  crown: (c: string) => svg(c, <path d="M3 18h18M5 18l-1-9 5 4 3-7 3 7 5-4-1 9" />),
  check: (c: string) => svg(c, <><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>),
  globe: (c: string) => svg(c, <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" /></>),
  bulb: (c: string) => svg(c, <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" /></>),
  plane: (c: string) => svg(c, <path d="M10.5 13.5L3 11l1.5-1.5 7 1L16 6a2 2 0 0 1 3 3l-4.5 4.5 1 7L14 22l-2.5-7.5z" />),
};
