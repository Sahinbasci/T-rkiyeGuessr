import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] text-white px-4"
      id="main-content"
    >
      <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mb-6">
        <MapPin size={40} className="text-red-400" />
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

      <nav className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-600">
        <Link href="/nasil-oynanir" className="hover:text-gray-400 transition-colors">Nasıl Oynanır?</Link>
        <Link href="/bolgeler" className="hover:text-gray-400 transition-colors">Bölgeler</Link>
        <Link href="/sehirler" className="hover:text-gray-400 transition-colors">Şehirler</Link>
        <Link href="/sss" className="hover:text-gray-400 transition-colors">SSS</Link>
      </nav>
    </main>
  );
}
