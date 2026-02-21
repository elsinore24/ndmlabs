const games = [
  {
    id: 1,
    title: "Starscapes: Visual Riddles",
    description: "Constellation-themed rebus puzzles. See it. Solve it.",
    icon: "/starscapes-icon.png",
    status: "Available",
    url: "https://apps.apple.com/us/app/starscapes-visual-riddles/id6756834182",
  },
  {
    id: 2,
    title: "Project Alpha",
    description: "An innovative gaming experience that redefines the genre.",
    icon: null,
    status: "Announced",
    url: null,
  },
  {
    id: 3,
    title: "Future Project",
    description: "Something incredible is brewing. Sign up for our newsletter to be the first to know.",
    icon: null,
    status: "Concept",
    url: null,
  },
];

export default function FeaturedGames() {
  return (
    <section id="games" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Our <span className="text-[#00ff88]">Games</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Discover our portfolio of games currently in development and coming soon.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game) => {
            const CardWrapper = game.url ? "a" : "div";
            const wrapperProps = game.url
              ? { href: game.url, target: "_blank" as const, rel: "noopener noreferrer" }
              : {};

            return (
              <CardWrapper
                key={game.id}
                {...wrapperProps}
                className="group relative bg-gray-900 rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 block"
              >
                {/* Image / Icon */}
                <div className="aspect-[16/9] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  {game.icon ? (
                    <img
                      src={game.icon}
                      alt={game.title}
                      className="w-24 h-24 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="text-6xl text-gray-700">🎮</div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-[#00ff88] transition-colors">
                      {game.title}
                    </h3>
                    <span className="px-3 py-1 text-xs font-semibold bg-[#00ff88]/20 text-[#00ff88] rounded-full">
                      {game.status}
                    </span>
                  </div>
                  <p className="text-gray-400">{game.description}</p>
                </div>

                {/* Hover Overlay */}
                {game.url && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="w-full py-3 bg-[#00ff88] text-black font-semibold rounded-lg text-center block">
                      Download on the App Store
                    </span>
                  </div>
                )}
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
