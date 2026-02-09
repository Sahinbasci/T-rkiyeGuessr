/**
 * 7 Bölge için SEO açıklamaları
 */

export interface RegionDescription {
  slug: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  features: string[];
  keywords: string[];
}

export const REGION_DESCRIPTIONS: Record<string, RegionDescription> = {
  marmara: {
    slug: "marmara",
    name: "Marmara Bölgesi",
    shortDesc: "Türkiye'nin en kalabalık ve sanayileşmiş bölgesi. İstanbul, Bursa, Kocaeli gibi büyük şehirleri barındırır.",
    longDesc: "Marmara Bölgesi, Türkiye'nin kuzeybatısında yer alan ve ülkenin en yoğun nüfuslu bölgesidir. İstanbul'un tarihi yarımadası, Bursa'nın Osmanlı mirası, Edirne'nin Selimiye Camii ve Çanakkale'nin Gelibolu yarımadası bu bölgenin öne çıkan lokasyonlarıdır. TürkiyeGuessr'da Marmara lokasyonlarında şehir tabelaları, plaka kodları ve yoğun trafik en güçlü ipuçlarındır.",
    features: ["Yoğun şehir dokusu", "Tarihi yapılar", "Boğaz manzarası", "Sanayi bölgeleri"],
    keywords: ["marmara bölgesi konum tahmin", "istanbul guessr", "bursa konum oyunu"],
  },
  ege: {
    slug: "ege",
    name: "Ege Bölgesi",
    shortDesc: "Antik kentler, zeytin bahçeleri ve turkuaz koylar. İzmir, Muğla, Aydın'ın eşsiz coğrafyası.",
    longDesc: "Ege Bölgesi, batı Türkiye'nin kıyı şeridinde uzanan tarihi ve doğal zenginlikleriyle öne çıkar. Efes antik kenti, Bodrum'un marina manzarası, Pamukkale'nin travertenleri ve Çeşme'nin turkuaz suları bu bölgenin simgeleridir. TürkiyeGuessr'da Ege lokasyonlarında zeytinlikler, taş evler, antik kalıntılar ve kıyı şeridi en belirgin ipuçlarıdır.",
    features: ["Antik kentler", "Kıyı kasabaları", "Zeytin bahçeleri", "Tatil bölgeleri"],
    keywords: ["ege bölgesi konum tahmin", "izmir guessr", "bodrum konum oyunu"],
  },
  akdeniz: {
    slug: "akdeniz",
    name: "Akdeniz Bölgesi",
    shortDesc: "Toros Dağları'ndan Akdeniz kıyısına uzanan güneş, tarih ve doğa cenneti.",
    longDesc: "Akdeniz Bölgesi, güney Türkiye'nin Toros Dağları ile deniz arasında sıkışan dramatik coğrafyasıyla bilinir. Antalya'nın Kaleiçi'si, Side'nin antik tiyatrosu, Kaputaş plajı, Olimpos harabeleri ve Köprülü Kanyon bu bölgenin vazgeçilmez lokasyonlarıdır. TürkiyeGuessr'da Akdeniz lokasyonlarında palmiyeler, narenciye bahçeleri, seraları ve dağ-deniz kontrastı en güçlü ipuçlarıdır.",
    features: ["Sahil şeridi", "Antik tiyatrolar", "Toros Dağları", "Turizm merkezleri"],
    keywords: ["akdeniz bölgesi konum tahmin", "antalya guessr", "alanya konum oyunu"],
  },
  karadeniz: {
    slug: "karadeniz",
    name: "Karadeniz Bölgesi",
    shortDesc: "Yemyeşil yaylalar, dik yamaçlar ve ahşap evler. Trabzon, Rize, Artvin'in eşsiz doğası.",
    longDesc: "Karadeniz Bölgesi, Türkiye'nin kuzey kıyısı boyunca uzanan yemyeşil coğrafyasıyla dikkat çeker. Uzungöl'ün sisle kaplı vadisi, Ayder Yaylası, Sümela Manastırı, Fırtına Vadisi ve çay bahçeleri bu bölgenin ikonik lokasyonlarıdır. TürkiyeGuessr'da Karadeniz lokasyonlarında dik yamaçlar, ahşap evler, çay tarlaları ve sis en belirgin ipuçlarıdır.",
    features: ["Yaylalar", "Çay bahçeleri", "Ahşap mimari", "Derin vadiler"],
    keywords: ["karadeniz bölgesi konum tahmin", "trabzon guessr", "rize konum oyunu"],
  },
  ic_anadolu: {
    slug: "ic_anadolu",
    name: "İç Anadolu Bölgesi",
    shortDesc: "Step iklimi, Kapadokya'nın peri bacaları ve Ankara'nın modern çehresi.",
    longDesc: "İç Anadolu Bölgesi, Türkiye'nin kalbinde yer alan geniş düzlükleri ve eşsiz jeolojik oluşumlarıyla öne çıkar. Kapadokya'nın peri bacaları, Göreme açık hava müzesi, Tuz Gölü'nün beyaz yüzeyi, Ankara'nın modern caddeler ve Konya'nın Selçuklu mirası bu bölgenin lokasyonlarıdır. TürkiyeGuessr'da İç Anadolu'da düz step arazisi, tahıl tarlaları ve kurak iklim en belirgin ipuçlarıdır.",
    features: ["Kapadokya", "Step arazi", "Başkent Ankara", "Tuz Gölü"],
    keywords: ["iç anadolu konum tahmin", "kapadokya guessr", "ankara konum oyunu"],
  },
  dogu_anadolu: {
    slug: "dogu_anadolu",
    name: "Doğu Anadolu Bölgesi",
    shortDesc: "Ağrı Dağı'ndan Van Gölü'ne, Türkiye'nin en yüksek ve en sert coğrafyası.",
    longDesc: "Doğu Anadolu Bölgesi, Türkiye'nin en yüksek ve en soğuk bölgesidir. Ağrı Dağı'nın karlı zirvesi, Van Gölü'nün turkuaz suları, İshak Paşa Sarayı, Nemrut Dağı heykelleri ve Ani Harabeleri bu bölgenin dikkat çekici lokasyonlarıdır. TürkiyeGuessr'da Doğu Anadolu'da yüksek platolar, taş yapılar, karlı dağlar ve geniş otlaklar en belirgin ipuçlarıdır.",
    features: ["Yüksek platolar", "Tarihi saraylar", "Göller", "Dağ manzaraları"],
    keywords: ["doğu anadolu konum tahmin", "van guessr", "ağrı konum oyunu"],
  },
  guneydogu: {
    slug: "guneydogu",
    name: "Güneydoğu Anadolu Bölgesi",
    shortDesc: "Mezopotamya mirası, taş evler ve Göbeklitepe. Gaziantep, Şanlıurfa, Mardin'in tarihi dokusu.",
    longDesc: "Güneydoğu Anadolu Bölgesi, insanlık tarihinin en eski yerleşim alanlarından birini barındırır. Göbeklitepe'nin 12.000 yıllık tapınakları, Mardin'in taş mimarisi, Gaziantep'in bakır çarşısı, Halfeti'nin batık şehri ve Hasankeyf'in tarihi kalıntıları bu bölgenin benzersiz lokasyonlarıdır. TürkiyeGuessr'da Güneydoğu'da düz ovalar, kireçtaşı yapılar, sıcak iklim ve Arapça tabelalar en belirgin ipuçlarıdır.",
    features: ["Göbeklitepe", "Taş mimari", "Mezopotamya ovası", "Tarihi çarşılar"],
    keywords: ["güneydoğu anadolu konum tahmin", "mardin guessr", "gaziantep konum oyunu"],
  },
};

export function getRegionDescription(slug: string): RegionDescription | undefined {
  return REGION_DESCRIPTIONS[slug];
}
