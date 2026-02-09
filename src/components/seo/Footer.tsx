import Link from "next/link";

export function SeoFooter() {
  return (
    <footer className="border-t border-gray-800 mt-16 pt-8 pb-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
        <div>
          <h4 className="text-gray-300 font-semibold mb-3">Oyun</h4>
          <ul className="space-y-2 text-gray-500">
            <li><Link href="/" className="hover:text-white transition-colors">Oyna</Link></li>
            <li><Link href="/nasil-oynanir" className="hover:text-white transition-colors">Nasıl Oynanır</Link></li>
            <li><Link href="/multiplayer" className="hover:text-white transition-colors">Multiplayer</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gray-300 font-semibold mb-3">Keşfet</h4>
          <ul className="space-y-2 text-gray-500">
            <li><Link href="/bolgeler" className="hover:text-white transition-colors">Bölgeler</Link></li>
            <li><Link href="/sehirler" className="hover:text-white transition-colors">Şehirler</Link></li>
            <li><Link href="/geoguessr-alternatifi" className="hover:text-white transition-colors">GeoGuessr Alternatifi</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gray-300 font-semibold mb-3">Bölgeler</h4>
          <ul className="space-y-2 text-gray-500">
            <li><Link href="/bolgeler/marmara" className="hover:text-white transition-colors">Marmara</Link></li>
            <li><Link href="/bolgeler/ege" className="hover:text-white transition-colors">Ege</Link></li>
            <li><Link href="/bolgeler/akdeniz" className="hover:text-white transition-colors">Akdeniz</Link></li>
            <li><Link href="/bolgeler/karadeniz" className="hover:text-white transition-colors">Karadeniz</Link></li>
            <li><Link href="/bolgeler/ic_anadolu" className="hover:text-white transition-colors">İç Anadolu</Link></li>
            <li><Link href="/bolgeler/dogu_anadolu" className="hover:text-white transition-colors">Doğu Anadolu</Link></li>
            <li><Link href="/bolgeler/guneydogu" className="hover:text-white transition-colors">Güneydoğu</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gray-300 font-semibold mb-3">Bilgi</h4>
          <ul className="space-y-2 text-gray-500">
            <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            <li><Link href="/sss" className="hover:text-white transition-colors">SSS</Link></li>
            <li><Link href="/hakkimizda" className="hover:text-white transition-colors">Hakkımızda</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-gray-800/50 text-center text-xs text-gray-600">
        <p>TürkiyeGuessr — Türkiye Konum Tahmin Oyunu. Ücretsiz, multiplayer, 81 il.</p>
      </div>
    </footer>
  );
}
