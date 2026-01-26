export default function About() {
  return (
    <section id="about" className="py-24 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              About <span className="text-[#00ff88]">NDMLABS</span>
            </h2>
            <div className="space-y-4 text-gray-300 text-lg">
              <p>
                NDMLABS INC. is a passionate game and application development studio
                dedicated to creating innovative digital experiences.
              </p>
              <p>
                Our team combines creativity with technical expertise to build
                games and apps that engage, entertain, and inspire players worldwide.
              </p>
              <p>
                We believe in pushing the boundaries of what&apos;s possible in
                interactive entertainment, always striving to deliver quality
                experiences that leave a lasting impression.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12">
              <div>
                <div className="text-4xl font-bold text-[#00ff88]">∞</div>
                <div className="text-gray-400 mt-1">Ideas</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#00ff88]">24/7</div>
                <div className="text-gray-400 mt-1">Dedication</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#00ff88]">100%</div>
                <div className="text-gray-400 mt-1">Passion</div>
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-[#00ff88]/20 to-[#6366f1]/20 rounded-3xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl mb-4">🚀</div>
                <div className="text-2xl font-bold text-white">Innovation First</div>
                <div className="text-gray-400">Building the future of gaming</div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#00ff88]/30 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#6366f1]/30 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
