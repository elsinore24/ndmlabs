import type { Metadata } from "next";
import { preload } from "react-dom";
import Script from "next/script";
import "./globals.css";
// Inter is stored in the site (public/fonts); fonts-inter.css declares it and --font-inter.
import "./fonts-inter.css";

// How the fonts are fetched early. Called while a page renders, so a link to that page can
// warm them up too, as next/font did.
const FONT = { as: "font", type: "font/woff2", crossOrigin: "anonymous" } as const;

export const metadata: Metadata = {
  title: "NDMLABS INC. | Game & App Development",
  description: "NDMLABS INC. - Creating innovative games and applications. Discover our latest projects and releases.",
  keywords: ["games", "apps", "development", "NDMLABS", "indie games"],
  openGraph: {
    title: "NDMLABS INC.",
    description: "Creating innovative games and applications",
    url: "https://ndmlabs.net",
    siteName: "NDMLABS INC.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  preload("/fonts/inter-latin.woff2", FONT);
  return (
    <html lang="en">
      <body className="ndm-font-inter antialiased">
        {children}
        {/* Umami visitor counts. Counts only on ndmlabs.net, so local tests and deploy previews
            stay out. It also counts moves between pages. /home-history has its own copy. */}
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="11a46734-7fd3-4e06-97dd-0910aaed9e38"
          data-domains="ndmlabs.net"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
