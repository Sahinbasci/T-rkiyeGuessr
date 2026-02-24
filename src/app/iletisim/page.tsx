import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { Mail, Clock, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Iletisim",
  description:
    "TurkiyeGuessr ile iletisime gecin. Soru, oneri, hata bildirimi ve is birliği teklifleri icin bize ulasin.",
  alternates: { canonical: "/iletisim" },
};

export default function IletisimPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Iletisim", url: "/iletisim" },
      ]}
    >
      <article className="space-y-8 max-w-3xl">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Iletisim
          </h1>
          <p className="text-gray-400 mt-3 leading-relaxed">
            TurkiyeGuessr hakkinda soru, oneri, hata bildirimi veya is birligi
            teklifiniz mi var? Bize ulasin, en kisa surede donelim.
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="bg-gray-800/50 rounded-xl p-6 flex flex-col items-start gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Mail size={20} className="text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-200">E-posta</h2>
            <a
              href="mailto:sahinbasci2002@gmail.com"
              className="text-red-400 hover:underline text-sm break-all"
            >
              sahinbasci2002@gmail.com
            </a>
            <p className="text-gray-500 text-sm">
              Genel sorular, oneri ve geri bildirimler icin
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 flex flex-col items-start gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-200">Yanit Suresi</h2>
            <p className="text-gray-400 text-sm">
              Genellikle 1-3 is gunu icinde yanit veriyoruz.
              Acil teknik sorunlarda konu basligina &quot;ACIL&quot; yazabilirsiniz.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">E-posta Konu Basliklari</h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            Mesajinizin daha hizli islenmesi icin konu basliginiza su etiketlerden birini ekleyebilirsiniz:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { tag: "[HATA]", desc: "Teknik sorun veya bug bildirimi" },
              { tag: "[ONERI]", desc: "Yeni ozellik veya iyilestirme onerisi" },
              { tag: "[SORU]", desc: "Genel soru veya yardim talebi" },
              { tag: "[ISBIRLIGI]", desc: "Is birligi veya reklam teklifi" },
              { tag: "[KVKK]", desc: "Kisisel veri talebi (erisim, silme vb.)" },
              { tag: "[TELIF]", desc: "Telif hakki bildirimi" },
            ].map((item) => (
              <div key={item.tag} className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3">
                <code className="text-red-400 text-xs font-mono bg-red-500/10 px-2 py-1 rounded shrink-0">
                  {item.tag}
                </code>
                <span className="text-gray-500 text-sm">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Sikca Sorulan Sorular</h2>
          <div className="bg-gray-800/50 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <MessageSquare size={18} className="text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-300 text-sm font-medium">
                  Sorunuz SSS sayfamizda yanitlanmis olabilir
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  E-posta gondermeden once{" "}
                  <a href="/sss" className="text-red-400 hover:underline">
                    Sikca Sorulan Sorular
                  </a>{" "}
                  sayfamiza goz atmanizi oneririz.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Proje Hakkinda</h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            TurkiyeGuessr, bireysel bir gelistirici tarafindan gelistirilen ve isletilen
            bagimsiz bir web projesidir. Bir sirket veya ticari kurulusla
            baglantili degildir. Proje tamamen ucretsiz olarak sunulmaktadir.
          </p>
        </section>
      </article>
    </SeoLayout>
  );
}
