import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { Mail, Clock, MessageSquare } from "lucide-react";
import { ContactForm } from "@/components/seo/ContactForm";

export const metadata: Metadata = {
  title: "İletişim — Bize Ulaşın",
  description:
    "TürkiyeGuessr ile iletişime geçin. Soru, öneri, hata bildirimi ve iş birliği teklifleri için bize ulaşın.",
  alternates: { canonical: "/iletisim" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://turkiyeguessr.xyz/iletisim",
    siteName: "TürkiyeGuessr",
    title: "İletişim — Bize Ulaşın",
    description:
      "TürkiyeGuessr ile iletişime geçin. Soru, öneri, hata bildirimi ve iş birliği teklifleri için bize ulaşın.",
    images: [
      {
        url: "https://turkiyeguessr.xyz/og-image.png",
        width: 1200,
        height: 630,
        alt: "İletişim — Bize Ulaşın - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "İletişim — Bize Ulaşın",
    description:
      "TürkiyeGuessr ile iletişime geçin. Soru, öneri, hata bildirimi ve iş birliği teklifleri için bize ulaşın.",
  },
};

export default function IletisimPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "İletişim", url: "/iletisim" },
      ]}
    >
      <article className="space-y-8 max-w-3xl">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            İletişim
          </h1>
          <p className="text-gray-400 mt-3 leading-relaxed">
            TürkiyeGuessr hakkında soru, öneri, hata bildirimi veya iş birliği
            teklifiniz mi var? Aşağıdaki formu doldurun veya doğrudan e-posta gönderin.
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
              Genel sorular, öneri ve geri bildirimler için
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 flex flex-col items-start gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-200">Yanıt Süresi</h2>
            <p className="text-gray-400 text-sm">
              Genellikle 1-3 iş günü içinde yanıt veriyoruz.
              Acil teknik sorunlarda konu başlığına &quot;ACİL&quot; yazabilirsiniz.
            </p>
          </div>
        </section>

        {/* Contact Form */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">İletişim Formu</h2>
          <ContactForm />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">E-posta Konu Başlıkları</h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            Doğrudan e-posta gönderiyorsanız, mesajınızın daha hızlı işlenmesi için konu başlığınıza
            şu etiketlerden birini ekleyebilirsiniz:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { tag: "[HATA]", desc: "Teknik sorun veya bug bildirimi" },
              { tag: "[ÖNERİ]", desc: "Yeni özellik veya iyileştirme önerisi" },
              { tag: "[SORU]", desc: "Genel soru veya yardım talebi" },
              { tag: "[İŞBİRLİĞİ]", desc: "İş birliği veya reklam teklifi" },
              { tag: "[KVKK]", desc: "Kişisel veri talebi (erişim, silme vb.)" },
              { tag: "[TELİF]", desc: "Telif hakkı bildirimi" },
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
          <h2 className="text-xl font-semibold text-red-400">Sıkça Sorulan Sorular</h2>
          <div className="bg-gray-800/50 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <MessageSquare size={18} className="text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-300 text-sm font-medium">
                  Sorunuz SSS sayfamızda yanıtlanmış olabilir
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  E-posta göndermeden önce{" "}
                  <Link href="/sss" className="text-red-400 hover:underline">
                    Sıkça Sorulan Sorular
                  </Link>{" "}
                  sayfamıza göz atmanızı öneririz.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Proje Hakkında</h2>
          <p className="text-gray-400 leading-relaxed text-sm">
            TürkiyeGuessr, bireysel bir geliştirici tarafından geliştirilen ve işletilen
            bağımsız bir web projesidir. Bir şirket veya ticari kuruluşla
            bağlantılı değildir. Proje tamamen ücretsiz olarak sunulmaktadır.
            Daha fazla bilgi için{" "}
            <Link href="/hakkimizda" className="text-red-400 hover:underline">
              Hakkımızda
            </Link>{" "}
            sayfamızı ziyaret edebilirsiniz.
          </p>
        </section>
      </article>
    </SeoLayout>
  );
}
