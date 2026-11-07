export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-16 sm:pt-44 sm:pb-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />

      {/* Fades into the games section's black so the two read as one page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-black" />

      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ff88]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#6366f1]/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white mb-6">
          NDM<span className="text-[#00ff88]">LABS</span>
          <span className="block text-2xl sm:text-3xl lg:text-4xl font-normal text-gray-400 mt-4">
            INC.
          </span>
        </h1>

        <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Creating innovative games and applications that push the boundaries of digital entertainment.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#games"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-black bg-[#00ff88] rounded-lg hover:bg-[#00dd77] transition-all hover:scale-105"
          >
            Explore Our Games
          </a>
          <a
            href="#about"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-lg hover:border-white hover:bg-white/10 transition-all"
          >
            Learn More
          </a>
        </div>
      </div>

    </section>
  );
}
