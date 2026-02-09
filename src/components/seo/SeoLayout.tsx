import Link from "next/link";
import { Breadcrumbs } from "./Breadcrumbs";
import { SeoFooter } from "./Footer";

interface SeoLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { name: string; url: string }[];
}

export function SeoLayout({ children, breadcrumbs }: SeoLayoutProps) {
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
          <div className="hidden sm:flex items-center gap-5 text-sm text-gray-400">
            <Link href="/nasil-oynanir" className="hover:text-white transition-colors">
              Nasıl Oynanır
            </Link>
            <Link href="/bolgeler" className="hover:text-white transition-colors">
              Bölgeler
            </Link>
            <Link href="/sehirler" className="hover:text-white transition-colors">
              Şehirler
            </Link>
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <Link
              href="/"
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg font-semibold transition-colors"
            >
              Oyna
            </Link>
          </div>
          {/* Mobile: just the play button */}
          <Link
            href="/"
            className="sm:hidden bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Oyna
          </Link>
        </div>
      </nav>

      {/* Breadcrumbs */}
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <SeoFooter />
    </div>
  );
}
