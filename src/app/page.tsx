import type { Metadata } from "next";
import { preload } from "react-dom";
import HomeHeader from "@/components/home/HomeHeader";
import Showcase from "@/components/home/Showcase";
import GameSections from "@/components/home/GameSections";
import { HomeFooter, Studio } from "@/components/home/StudioAndFooter";
// Archivo with its width axis: the headings run expanded. Caprasimo is AlibiGrid's own
// display face, used only for its name. Both are stored in the site (public/fonts);
// fonts-home.css declares them and the --font-archivo and --font-caprasimo variables.
import "./fonts-home.css";
import "./home.css";

// How the fonts are fetched early. Called while a page renders, so a link to that page can
// warm them up too, as next/font did.
const FONT = { as: "font", type: "font/woff2", crossOrigin: "anonymous" } as const;

export const metadata: Metadata = {
  title: "NDM Labs | AlibiGrid, All-Time 5 and Starscapes",
  description:
    "Quick, clever games from NDM Labs: AlibiGrid, free in your browser, plus All-Time 5 and Starscapes for iPhone.",
  alternates: { canonical: "https://ndmlabs.net/" },
};

export default function Home() {
  preload("/fonts/caprasimo-latin.woff2", FONT);
  preload("/fonts/archivo-latin.woff2", FONT);
  return (
    <div className="home ndm-font-archivo ndm-font-caprasimo min-h-screen">
      <HomeHeader />
      <main>
        <Showcase />
        <GameSections />
        <Studio />
      </main>
      <HomeFooter />
    </div>
  );
}
