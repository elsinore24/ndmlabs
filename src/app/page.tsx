import type { Metadata } from "next";
import { Archivo, Caprasimo } from "next/font/google";
import HomeHeader from "@/components/home/HomeHeader";
import Showcase from "@/components/home/Showcase";
import GameSections from "@/components/home/GameSections";
import { HomeFooter, Studio } from "@/components/home/StudioAndFooter";
import "./home.css";

// Archivo with its width axis: the headings run expanded. Caprasimo is
// AlibiGrid's own display face, used only for its name.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const caprasimo = Caprasimo({ subsets: ["latin"], weight: "400", variable: "--font-caprasimo", display: "swap" });

export const metadata: Metadata = {
  title: "NDM Labs | AlibiGrid, All-Time 5 and Starscapes",
  description:
    "Quick, clever games from NDM Labs: AlibiGrid, free in your browser, plus All-Time 5 and Starscapes for iPhone.",
  alternates: { canonical: "https://ndmlabs.net/" },
};

export default function Home() {
  return (
    <div className={`home ${archivo.variable} ${caprasimo.variable} min-h-screen`}>
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
