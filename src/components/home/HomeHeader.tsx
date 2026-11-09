import { ALIBIGRID_URL } from "./games";

const links = [
  { href: "#alibigrid", label: "AlibiGrid" },
  { href: "#all-time-5", label: "All-Time 5" },
  { href: "#starscapes", label: "Starscapes" },
  { href: "#about", label: "Studio" },
  { href: "/support", label: "Support" },
];

/** The homepage's own bar. The other pages keep the shared Header, which
 *  carries their own marks (the All-Time 5 lockup on the Board). */
export default function HomeHeader() {
  return (
    <header className="border-b border-[#94aadc]/15">
      <div className="home-wrap flex h-[76px] sm:h-[84px] items-center justify-between gap-6">
        <a href="/" aria-label="NDM Labs home" className="inline-flex shrink-0">
          <img src="/home/ndm-logo.webp" alt="NDM Labs" width={141} height={44} className="h-9 sm:h-11 w-auto" />
        </a>
        <nav aria-label="Main" className="hidden lg:flex items-center gap-7">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-[#c9d3e8] hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a href={ALIBIGRID_URL} className="home-btn home-btn-accent home-btn-sm">
          Play AlibiGrid
        </a>
      </div>
    </header>
  );
}
