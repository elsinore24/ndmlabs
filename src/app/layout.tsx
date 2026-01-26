import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
      </body>
    </html>
  );
}
