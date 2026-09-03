"use client";

import { useState } from "react";
import Link from "next/link";

// `fixed` is the homepage's floating bar; /koth stacks the nav under its
// ticker, so it flows in the document instead.
//
// `transparent` drops the bar's own ground entirely, so a page that draws its
// own backdrop shows through from the ticker down rather than being cut by a
// black band. The nav sits on whatever is behind it, which on /koth is the
// darkest part of the arena scrim.
export default function Header({
  fixed = true,
  transparent = false,
}: { fixed?: boolean; transparent?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={`${fixed ? "fixed top-0 left-0 right-0" : "relative"} z-50 ${
        transparent
          ? "bg-transparent"
          : "bg-black/90 backdrop-blur-sm border-b border-white/10"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">
              NDM<span className="text-[#00ff88]">LABS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#games" className="text-gray-300 hover:text-white transition-colors">
              Games
            </Link>
            <Link href="#apps" className="text-gray-300 hover:text-white transition-colors">
              Apps
            </Link>
            <Link href="#about" className="text-gray-300 hover:text-white transition-colors">
              About
            </Link>
            <Link href="#contact" className="text-gray-300 hover:text-white transition-colors">
              Contact
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation. The open panel keeps a ground even when the bar
            has none — a list of links over a photograph is unreadable. */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden py-4 border-t border-white/10 ${
              transparent ? "bg-black/90 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6" : ""
            }`}
          >
            <div className="flex flex-col space-y-4">
              <Link href="#games" className="text-gray-300 hover:text-white transition-colors">
                Games
              </Link>
              <Link href="#apps" className="text-gray-300 hover:text-white transition-colors">
                Apps
              </Link>
              <Link href="#about" className="text-gray-300 hover:text-white transition-colors">
                About
              </Link>
              <Link href="#contact" className="text-gray-300 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
