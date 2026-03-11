import Link from "next/link";

export function SeoFooter() {
  return (
    <footer className="border-t border-gray-800 mt-16 pt-8 pb-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-sm">
        <div>
          <h4 className="text-gray-300 font-semibold mb-3">Oyun</h4>
          <ul className="space-y-2 text-gray-500">
            <li><Link href="/" className="hover:text-white transition-colors">Oyna</Link></li>
            <li><Link href="/nasil-oynanir" className="hover:text-white transition-colors">Nasıl Oynanır</Link></li>
            <li><Link href="/multiplayer" className="hover:text-white transition-colors">Multiplayer</Link></li>
            <li><Link href="/sehirler" className="hover:text-white transition-colors">Tüm Şehirler</Link></li>
            <li><Link href="/bolgeler" className="hover:text-white transition-colors">Tüm Bölgeler</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gray-300 font-semibold mb-3">Keşfet</h4>
          <ul className="space-y-2 text-gray-500">
            <li><Link href="/geoguessr-alternatifi" className="hover:text-white transition-colors">GeoGuessr Alternatifi</Link></li>
            <li><Link href="/turkiye-harita-oyunu" className="hover:text-white transition-colors">Türkiye Harita Oyunu</Link></li>
            <li><Link href="/sehir-tahmin-oyunu" className="hover:text-white transition-colors">Şehir Tahmin Oyunu</Link></li>
            <li><Link href="/ucretsiz-cografya-oyunu" className="hover:text-white transition-colors">Ücretsiz Coğrafya Oyunu</Link></li>
            <li><Link href="/konum-tahmin-oyunu" className="hover:text-white transition-colors">Konum Tahmin Oyunu</Link></li>
            <li><Link href="/sehirler/fatih-istanbul" className="hover:text-white transition-colors">İstanbul</Link></li>
            <li><Link href="/sehirler/ulus-ankara" className="hover:text-white transition-colors">Ankara</Link></li>
            <li><Link href="/sehirler/konak-izmir" className="hover:text-white transition-colors">İzmir</Link></li>
            <li><Link href="/sehirler/goreme-nevsehir" className="hover:text-white transition-colors">Kapadokya</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gray-300 font-semibold mb-3">Bölgeler</h4>
          <ul className="space-y-2 text-gray-500">
            <li><Link href="/bolgeler/marmara" className="hover:text-white transition-colors">Marmara</Link></li>
            <li><Link href="/bolgeler/ege" className="hover:text-white transition-colors">Ege</Link></li>
            <li><Link href="/bolgeler/akdeniz" className="hover:text-white transition-colors">Akdeniz</Link></li>
            <li><Link href="/bolgeler/karadeniz" className="hover:text-white transition-colors">Karadeniz</Link></li>
            <li><Link href="/bolgeler/ic-anadolu" className="hover:text-white transition-colors">İç Anadolu</Link></li>
            <li><Link href="/bolgeler/dogu-anadolu" className="hover:text-white transition-colors">Doğu Anadolu</Link></li>
            <li><Link href="/bolgeler/guneydogu" className="hover:text-white transition-colors">Güneydoğu</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gray-300 font-semibold mb-3">Blog</h4>
          <ul className="space-y-2 text-gray-500">
            <li><Link href="/blog" className="hover:text-white transition-colors">Tüm Yazılar</Link></li>
            <li><Link href="/blog/turkiye-guessr-nasil-oynanir" className="hover:text-white transition-colors">Nasıl Oynanır Rehberi</Link></li>
            <li><Link href="/blog/geoguessr-vs-turkiyeguessr" className="hover:text-white transition-colors">GeoGuessr Karşılaştırma</Link></li>
            <li><Link href="/blog/geoguessr-taktikleri-ipuclari" className="hover:text-white transition-colors">Taktik ve İpuçları</Link></li>
            <li><Link href="/blog/turkiye-bolgeleri-rehberi" className="hover:text-white transition-colors">Bölge Rehberi</Link></li>
            <li><Link href="/blog/plaka-kodlarindan-il-tahmini" className="hover:text-white transition-colors">Plaka Kodları</Link></li>
            <li><Link href="/sss" className="hover:text-white transition-colors">SSS</Link></li>
            <li><Link href="/hakkimizda" className="hover:text-white transition-colors">Hakkımızda</Link></li>
            <li><Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gray-300 font-semibold mb-3">Yasal</h4>
          <ul className="space-y-2 text-gray-500">
            <li><Link href="/gizlilik-politikasi" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
            <li><Link href="/cerez-politikasi" className="hover:text-white transition-colors">Çerez Politikası</Link></li>
            <li><Link href="/kullanim-kosullari" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
            <li><Link href="/kvkk" className="hover:text-white transition-colors">KVKK</Link></li>
            <li>
              <button
                type="button"
                id="open-cookie-preferences"
                className="hover:text-white transition-colors text-left"
              >
                Çerez Tercihleri
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-gray-800/50 text-center text-xs text-gray-600">
        <p>&copy; 2026 TürkiyeGuessr — Türkiye Konum Tahmin Oyunu. Ücretsiz, multiplayer, 81 il.</p>
      </div>
    </footer>
  );
}
