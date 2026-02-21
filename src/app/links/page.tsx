import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import AppStoreLink from "./AppStoreLink";
import "./links.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "NDMLABS INC. | Links",
  description:
    "NDMLABS INC. - Games & Apps. Download our latest apps and follow us everywhere.",
  openGraph: {
    title: "NDMLABS INC. | Links",
    description: "Games & Apps by NDMLABS. Download now.",
    url: "https://ndmlabs.net/links",
    siteName: "NDMLABS INC.",
    type: "website",
  },
  other: {
    "apple-itunes-app": "app-id=6756834182",
  },
};

export default function LinksPage() {
  return (
    <div className={`links-page ${outfit.variable} ${spaceMono.variable}`}>
      <div className="bg-mesh" />
      <div className="bg-noise" />

      <div className="links-container">
        {/* ── PROFILE ── */}
        <div className="profile">
          <img
            src="/logo-dark.png"
            alt="NDMLABS"
            className="profile-logo"
          />
        </div>

        {/* ── APPS & GAMES ── */}
        <div className="section-label delay-1">Apps &amp; Games</div>
        <div className="links">
          <AppStoreLink />
        </div>

        {/* ── FIND US ── */}
        <div className="section-label delay-3">Find Us</div>
        <div className="links">
          <a
            href="https://ndmlabs.net"
            className="link-card delay-4"
          >
            <div className="link-icon icon-website">
              <svg className="svg-icon" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <div className="link-content">
              <div className="title">ndmlabs.net</div>
              <div className="subtitle">Official website</div>
            </div>
            <span className="link-arrow">→</span>
          </a>

          {/* TikTok – Update href with your TikTok URL */}
          <a
            href="https://www.tiktok.com/@ndm.labs?_r=1&_t=ZT-945uqnKo75h"
            className="link-card delay-5"
          >
            <div className="link-icon icon-tiktok">
              <svg className="svg-icon" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.8.1V9.01a6.26 6.26 0 00-.8-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.16 8.16 0 004.77 1.52V7.01a4.84 4.84 0 01-1-.32z" />
              </svg>
            </div>
            <div className="link-content">
              <div className="title">TikTok</div>
              <div className="subtitle">@ndmlabs</div>
            </div>
            <span className="link-arrow">→</span>
          </a>

          {/* Contact email */}
          <a
            href="mailto:contact@ndmlabs.net"
            className="link-card delay-6"
          >
            <div className="link-icon icon-email">
              <svg className="svg-icon" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <div className="link-content">
              <div className="title">Contact</div>
              <div className="subtitle">contact@ndmlabs.net</div>
            </div>
            <span className="link-arrow">→</span>
          </a>
        </div>

        {/* ── FOOTER ── */}
        <div className="links-footer delay-12">
          <a href="https://ndmlabs.net">
            &copy; {new Date().getFullYear()} NDMLABS INC.
          </a>
        </div>
      </div>
    </div>
  );
}
