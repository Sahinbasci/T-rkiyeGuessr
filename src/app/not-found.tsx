import Link from "next/link";
import { MapPin } from "lucide-react";

const POPULAR_PAGES = [
  { href: "/nasil-oynanir", label: "Nasıl Oynanır?" },
  { href: "/bolgeler", label: "Bölgeler" },
  { href: "/sehirler", label: "Şehirler" },
  { href: "/blog", label: "Blog" },
  { href: "/sss", label: "SSS" },
  { href: "/geoguessr-alternatifi", label: "GeoGuessr Alternatifi" },
  { href: "/multiplayer", label: "Multiplayer" },
  { href: "/hakkimizda", label: "Hakkımızda" },
];

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] text-white px-4"
      id="main-content"
    >
      <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mb-6">
        <MapPin size={40} className="text-red-400" aria-hidden="true" />
      </div>

      <h1
        className="text-6xl sm:text-7xl font-bold mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        404
      </h1>

      <h2 className="text-xl sm:text-2xl text-gray-400 mb-4">
        Bu sayfa bulunamadı
      </h2>

      <p className="text-gray-500 text-sm mb-8 text-center max-w-md leading-relaxed">
        Aradığınız sayfa mevcut değil, taşınmış veya silinmiş olabilir.
        Konum tahmin etmeye devam etmek için ana sayfaya dönebilirsiniz.
      </p>

      <Link
        href="/"
        className="btn-primary px-8 py-3 text-lg"
      >
        Ana Sayfaya Dön
      </Link>

      <nav aria-label="Popüler sayfalar" className="mt-8 max-w-lg">
        <h3 className="text-center text-gray-500 text-xs uppercase tracking-wider mb-3">
          Popüler Sayfalar
        </h3>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-600">
          {POPULAR_PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="hover:text-gray-300 transition-colors"
            >
              {page.label}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
