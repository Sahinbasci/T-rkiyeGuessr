"use client";

import { useState } from "react";
import Link from "next/link";
import { Breadcrumbs } from "./Breadcrumbs";
import { SeoFooter } from "./Footer";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_SLOTS } from "@/config/ads";

interface SeoLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { name: string; url: string }[];
}

const NAV_LINKS = [
  { href: "/nasil-oynanir", label: "Nasıl Oynanır" },
  { href: "/bolgeler", label: "Bölgeler" },
  { href: "/sehirler", label: "Şehirler" },
  { href: "/blog", label: "Blog" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
];

export function SeoLayout({ children, breadcrumbs }: SeoLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-wider"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TürkiyeGuessr
          </Link>
          <div className="hidden sm:flex items-center gap-4 text-sm text-gray-400">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
            <Link
              href="/"
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg font-semibold transition-colors"
            >
              Oyna
            </Link>
          </div>
          {/* Mobile: hamburger + play */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/"
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Oyna
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 pb-2 border-t border-gray-800 pt-3">
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-400 hover:text-white text-sm py-2 px-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Breadcrumbs */}
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      {/* Content */}
      <main id="main-content" className="max-w-5xl mx-auto px-4 py-8">{children}</main>

      {/* Ad — SEO page footer banner */}
      <div className="max-w-5xl mx-auto px-4 pb-4">
        <AdSlot slot={AD_SLOTS.banner} format="horizontal" />
      </div>

      {/* Footer */}
      <SeoFooter />
    </div>
  );
}
