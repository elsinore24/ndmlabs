import { ALIBIGRID_URL, CONTACT_EMAIL } from "./games";

/** About the studio. Keeps the #about anchor the shared Header links to. */
export function Studio() {
  return (
    <section id="about" className="border-y border-[#94aadc]/15 scroll-mt-6">
      <div className="home-wrap grid gap-10 py-20 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-12">
        <h2 className="home-display m-0 text-[clamp(30px,3.4vw,48px)] leading-[1.05] text-balance">
          We make quick, polished games built for a daily habit.
        </h2>
        <div className="flex flex-col gap-4">
          <p className="m-0 text-[18px] leading-[1.6] text-[#a9b5cd]">
            NDM Labs is a game and app studio. Every game we ship takes a minute to learn and gives you a
            reason to come back tomorrow.
          </p>
          <p className="m-0 text-[16px] leading-[1.6] text-[#a9b5cd]">
            Questions, ideas or a bug to report? Write to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[#7fe3f7] hover:text-[#c4f3fc]">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

const footerLinks = [
  { href: ALIBIGRID_URL, label: "AlibiGrid" },
  { href: "/koth", label: "All-Time 5 Board" },
  { href: "/goat", label: "GOAT Index" },
  { href: "/genome/proto/profile/", label: "Genome" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
];

/** Keeps the #contact anchor the shared Header links to. */
export function HomeFooter() {
  return (
    <footer id="contact" className="home-wrap pt-10 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-8">
        <a href="/" aria-label="NDM Labs home" className="inline-flex">
          <img src="/home/ndm-logo.webp" alt="NDM Labs" width={109} height={34} className="h-[34px] w-auto" />
        </a>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-[15px]">
          {footerLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-[#a9b5cd] hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </nav>
        <p className="m-0 text-[14px] text-[#8794af]">&copy; {new Date().getFullYear()} NDMLABS INC.</p>
      </div>
    </footer>
  );
}
