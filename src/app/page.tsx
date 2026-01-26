import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedGames from "@/components/FeaturedGames";
import About from "@/components/About";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <Hero />
      <FeaturedGames />
      <About />
      <Footer />
    </main>
  );
}
