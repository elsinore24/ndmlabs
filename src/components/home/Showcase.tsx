import StoreLink from "../StoreLink";
import AllTimeLockup from "./AllTimeLockup";
import { ALIBIGRID_URL, ALL_TIME_5_URL, STARSCAPES_URL } from "./games";

/** The headline, then the three games side by side, each in its own world. */
export default function Showcase() {
  return (
    <>
      <section className="home-wrap pt-16 pb-12 sm:pt-[88px] sm:pb-14">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
          <h1 className="home-h1 m-0">Games you&apos;ll come back for.</h1>
          <div className="flex flex-col gap-7 lg:pb-2.5">
            <p className="m-0 max-w-[460px] text-[18px] sm:text-[19px] leading-[1.55] text-[#a9b5cd]">
              NDM Labs makes sharp, quick games. Two live on your iPhone. One plays right here in your
              browser, free, with a new grid every day.
            </p>
            <div className="flex flex-wrap gap-3">
              <a className="home-btn home-btn-accent" href={ALIBIGRID_URL}>
                Play today&apos;s AlibiGrid
              </a>
              <a className="home-btn home-btn-ghost" href="#all-time-5">
                Get the iPhone apps
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="games" aria-label="Our games" className="home-wrap pb-24 sm:pb-[120px] scroll-mt-6">
        <div className="home-trip">
          <article className="home-panel is-lead border border-[#ffd696]/15">
            <div className="home-art home-sunburst flex justify-center pt-9 sm:pt-11" aria-hidden="true">
              <img
                src="/home/alibigrid-board.webp"
                alt=""
                width={900}
                height={900}
                className="w-[240px] h-[240px] sm:w-[330px] sm:h-[330px] rounded-[18px] -rotate-3 shadow-[0_30px_70px_rgba(0,0,0,0.55)]"
              />
            </div>
            <div className="home-shade" aria-hidden="true" />
            <div className="home-panel-body">
              <span className="rounded-full bg-[#f4c542] px-3 py-1.5 text-[13px] font-bold text-[#1c1307]">
                Free in your browser
              </span>
              <h2 className="home-brand m-0 text-[40px] leading-none text-[#fff4da]">AlibiGrid</h2>
              <p className="m-0 max-w-[420px] text-[17px] leading-[1.5] text-[#e8dcc4]">
                Nine stars. Nine alibis. Call truth or bluff and get three in a row before the stars do.
              </p>
              <a className="home-btn home-btn-gold mt-1.5" href={ALIBIGRID_URL}>
                Play today&apos;s grid
              </a>
            </div>
          </article>

          <article className="home-panel border border-[#f2c14e]/20">
            <div className="home-art home-court" aria-hidden="true" />
            <div className="home-shade-gold" aria-hidden="true" />
            <div className="home-panel-body">
              <span className="rounded-full bg-[#f2c14e] px-3 py-1.5 text-[13px] font-bold text-[#1a1205]">
                Free on iPhone
              </span>
              <h2 className="m-0">
                <AllTimeLockup />
              </h2>
              <p className="m-0 max-w-[380px] text-[17px] leading-[1.5] text-[#e6ddc8]">
                Draft legends. Coach the game. A new Daily Challenge every day.
              </p>
              <StoreLink href={ALL_TIME_5_URL} className="home-badge mt-1.5">
                <img src="/appstore_button.png" alt="Download All-Time 5 on the App Store" width={163} height={48} />
              </StoreLink>
            </div>
          </article>

          <article className="home-panel border border-[#9682ff]/20">
            <div className="home-art home-space" aria-hidden="true">
              <img src="/home/starscapes-art.jpg" alt="" width={872} height={872} className="home-starart" />
            </div>
            <div className="home-shade" aria-hidden="true" />
            <div className="home-panel-body">
              <span className="rounded-full bg-[#b9a8ff] px-3 py-1.5 text-[13px] font-bold text-[#0b0820]">
                Free on iPhone
              </span>
              <h2 className="home-display m-0 text-[36px] leading-none text-white">Starscapes</h2>
              <p className="m-0 max-w-[380px] text-[17px] leading-[1.5] text-[#cfc8f2]">
                Picture puzzles written in the stars. See it. Solve it.
              </p>
              <StoreLink href={STARSCAPES_URL} className="home-badge mt-1.5">
                <img src="/appstore_button.png" alt="Download Starscapes on the App Store" width={163} height={48} />
              </StoreLink>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
