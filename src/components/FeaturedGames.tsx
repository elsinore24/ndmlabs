import { APP_STORE_URL as ALL_TIME_5_STORE_URL } from "../app/koth/lib";
import StoreLink from "./StoreLink";

type Game = {
  id: number;
  title: string;
  description?: string;
  icon: string;
  status: string;
  storeUrl: string;
  /** A second button, for a game with its own page. */
  page?: { url: string; label: string };
};

// Both games are on the App Store. Each card is a plain box; its buttons are
// the links (Dan, 2026-11-06: no Future Project, no extra copy on All-Time 5).
const games: Game[] = [
  {
    id: 1,
    title: "Starscapes: Rebus Puzzles",
    description: "Constellation-themed rebus puzzles. See it. Solve it.",
    icon: "/starscapes-icon.png",
    status: "Available",
    storeUrl: "https://apps.apple.com/us/app/starscapes-rebus-puzzles/id6756834182",
  },
  {
    id: 4,
    title: "All-Time 5",
    icon: "/alltime5-icon.png",
    status: "Available",
    storeUrl: ALL_TIME_5_STORE_URL,
    page: { url: "/koth", label: "See the Board" },
  },
];

export default function FeaturedGames() {
  return (
    <section id="games" className="pt-8 pb-24 bg-black scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Our <span className="text-[#00ff88]">Games</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Discover our portfolio of games currently in development and coming soon.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {games.map((game) => (
            <div
              key={game.id}
              className="group relative bg-gray-900 rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 flex flex-col"
            >
              {/* Icon */}
              <div className="aspect-[16/9] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <img
                  src={game.icon}
                  alt={game.title}
                  className="w-24 h-24 rounded-2xl object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-[#00ff88] transition-colors">
                    {game.title}
                  </h3>
                  <span className="shrink-0 px-3 py-1 text-xs font-semibold bg-[#00ff88]/20 text-[#00ff88] rounded-full">
                    {game.status}
                  </span>
                </div>
                {game.description ? (
                  <p className="text-gray-400">{game.description}</p>
                ) : null}

                {/* Buttons sit at the bottom so both cards line up. */}
                <div className="mt-auto pt-5 flex flex-col gap-3">
                  <StoreLink
                    href={game.storeUrl}
                    newTab
                    className="py-3 bg-[#00ff88] text-black font-semibold rounded-lg text-center hover:bg-[#00e67a] transition-colors"
                  >
                    Download on the App Store
                  </StoreLink>
                  {game.page ? (
                    <a
                      href={game.page.url}
                      className="py-3 border border-[#00ff88]/60 text-[#00ff88] font-semibold rounded-lg text-center hover:bg-[#00ff88]/10 transition-colors"
                    >
                      {game.page.label}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
