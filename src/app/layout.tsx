import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
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
