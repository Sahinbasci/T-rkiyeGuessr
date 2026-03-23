import Link from "next/link";
import { Breadcrumbs } from "./Breadcrumbs";
import { SeoFooter } from "./Footer";
import { MobileMenuToggle } from "./MobileMenuToggle";
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
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 px-4 py-3 relative">
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
            <MobileMenuToggle />
          </div>
        </div>
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
