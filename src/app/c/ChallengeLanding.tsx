"use client";

// ndmlabs.net/c?code=… (2026-10-10): where a friend's challenge link lands
// when the app is not installed, or when the link was opened in a browser.
// The code is read after load because the site is a static export.

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import AllTimeFiveMark from "@/components/AllTimeFiveMark";
import { APP_STORE_URL, challengeAppLink, challengeCode, challengeHill, hillAppLink, type DareHill } from "../koth/lib";
import "../koth/koth.css";
import "./c.css";

export default function ChallengeLanding() {
  const [code, setCode] = useState<string | null>(null);
  const [hill, setHill] = useState<DareHill | null>(null);
  const [read, setRead] = useState(false);
  useEffect(() => {
    setHill(challengeHill(window.location.search));
    setCode(challengeCode(window.location.search));
    setRead(true);
  }, []);

  // A throne holder's dare: no code, the hill to take.
  if (hill) {
    const name = hill === "allstars" ? "ALL-STARS" : "LEGENDS";
    return (
      <div className="koth c-page">
        <Header fixed={false} transparent mark={<AllTimeFiveMark />} />
        <section className="c-card">
          <p className="c-kicker mono">A FRIEND HOLDS THE {name} THRONE</p>
          <h1 className="c-title">{hill === "allstars" ? "Draft five and take it." : "Send a champion and take it."}</h1>
          <div className="c-actions">
            <a className="koth-cta mono c-btn" href={hillAppLink(hill)}>OPEN IN ALL-TIME 5</a>
            <a className="koth-cta outline mono c-btn" href={APP_STORE_URL}>GET ALL-TIME 5</a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="koth c-page">
      <Header fixed={false} transparent mark={<AllTimeFiveMark />} />
      <section className="c-card">
        <p className="c-kicker mono">A FRIEND CHALLENGED YOU</p>
        <h1 className="c-title">Same draft. Same opponent. Beat them.</h1>
        {code && <p className="c-code mono">{code}</p>}
        {read && !code && <p className="c-none">This link has no challenge code in it.</p>}
        <div className="c-actions">
          {code && <a className="koth-cta mono c-btn" href={challengeAppLink(code)}>OPEN IN ALL-TIME 5</a>}
          <a className="koth-cta outline mono c-btn" href={APP_STORE_URL}>GET ALL-TIME 5</a>
        </div>
      </section>
    </div>
  );
}
