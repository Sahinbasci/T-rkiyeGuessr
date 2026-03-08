/**
 * İl Bazlı SEO Veri Katmanı
 *
 * Oyundaki ~54 il için yapılandırılmış içerik verisi.
 * Şehir sayfalarında "İl Hakkında" bölümü ve plaka bilgisi için kullanılır.
 * Bu veri, thin content sorununu çözmek amacıyla her şehir sayfasına
 * ~100-150 kelime ek özgün içerik sağlar.
 */

export interface ProvinceInfo {
  name: string;
  plateCode: string;
  description: string;
  geography: string;
  climate: string;
  famousFor: string[];
  neighborProvinces: string[];
}

const PROVINCE_DATA: Record<string, ProvinceInfo> = {
  "Adana": {
    name: "Adana",
    plateCode: "01",
    description: "Adana, Çukurova ovasının merkezinde kurulmuş Türkiye'nin altıncı büyük şehridir. Seyhan Nehri kıyısında yükselen tarihi Taşköprü, Roma döneminden kalma dünyanın en eski kullanılan köprülerinden biridir. Adana, kebap kültürü, pamuk tarımı ve sanayi üretimi ile tanınır. Şehir, Akdeniz kıyısına yakın konumu sayesinde hem tarım hem turizm potansiyeli taşır.",
    geography: "Çukurova düzlüğü üzerinde kurulmuş olup kuzeyinde Toros Dağları yükselir. Seyhan ve Ceyhan nehirleri il topraklarını sular. Güneyde Akdeniz kıyı şeridi uzanır. Rakım düşüktür ve arazi büyük ölçüde düzdür.",
    climate: "Akdeniz iklimi hâkimdir: yazlar sıcak ve kurak (40°C+), kışlar ılık ve yağışlıdır.",
    famousFor: ["Adana kebabı", "Taşköprü", "Seyhan Barajı", "Merkez Park", "Pamuk tarımı"],
    neighborProvinces: ["Mersin", "Osmaniye", "Kahramanmaraş", "Kayseri", "Hatay"],
  },
  "Adıyaman": {
    name: "Adıyaman",
    plateCode: "02",
    description: "Adıyaman, Güneydoğu Anadolu'nun batı kesiminde Fırat Nehri havzasında yer alan tarihi bir ildir. UNESCO Dünya Mirası Listesi'ndeki Nemrut Dağı ile dünyaca ünlüdür. Dağın zirvesindeki dev tanrı heykelleri Kommagene Krallığı döneminden kalmadır. İl, antik medeniyetlerin kesişim noktasında bulunmasıyla zengin arkeolojik mirasa sahiptir.",
    geography: "Kuzeyde Toros Dağları'nın uzantıları, güneyde Fırat Nehri ve Atatürk Baraj Gölü ile çevrilidir. Arazi engebeli ve dağlık olup vadilerle kesilmiştir. Nemrut Dağı 2.150 metre yüksekliğe ulaşır.",
    climate: "Karasal ve Akdeniz ikliminin geçiş kuşağındadır. Yazlar sıcak ve kurak, kışlar soğuk ve kar yağışlıdır.",
    famousFor: ["Nemrut Dağı heykelleri", "Atatürk Barajı", "Perre Antik Kenti", "Cendere Köprüsü"],
    neighborProvinces: ["Malatya", "Kahramanmaraş", "Gaziantep", "Şanlıurfa", "Diyarbakır"],
  },
  "Afyonkarahisar": {
    name: "Afyonkarahisar",
    plateCode: "03",
    description: "Afyonkarahisar, İç Batı Anadolu'da yükselen kara kalesinin gölgesinde kurulmuş tarihi bir şehirdir. Adını kalenin üzerindeki siyah kayadan ve bölgede yetişen haşhaş (afyon) bitkisinden alır. Termal kaynakları, mermer ocakları ve sucuk-kaymak gelenekleriyle bilinir. Kurtuluş Savaşı'nda Büyük Taarruz'un başlangıç noktası olarak tarihe geçmiştir.",
    geography: "İç Anadolu ile Ege Bölgesi'nin geçiş kuşağında yer alır. Ortalama rakımı 1.000 metre civarındadır. Plato yapısı ve volkanik oluşumlar baskındır. Akarçay ovası tarım alanı olarak kullanılır.",
    climate: "Yarı karasal iklim görülür. Yazlar sıcak ve kurak, kışlar soğuk ve kar yağışlıdır. Gece-gündüz sıcaklık farkı belirgindir.",
    famousFor: ["Afyon Kalesi", "Termal kaplıcalar", "Sucuk ve kaymak", "Mermer ocakları", "Büyük Taarruz anıtı"],
    neighborProvinces: ["Eskişehir", "Kütahya", "Uşak", "Burdur", "Isparta", "Konya"],
  },
  "Ağrı": {
    name: "Ağrı",
    plateCode: "04",
    description: "Ağrı, Türkiye'nin en doğusunda, İran sınırında yer alan ve adını Türkiye'nin en yüksek dağı Ağrı Dağı'ndan (5.137 m) alan ildir. Nuh'un Gemisi efsanesiyle bütünleşen bu ihtişamlı volkanik dağ, şehrin her noktasından görülebilir. İshak Paşa Sarayı, Osmanlı-Selçuklu-İran mimari sentezinin muhteşem bir örneğidir. Bölge sert kışları ve yüksek rakımıyla bilinir.",
    geography: "Doğu Anadolu'nun yüksek platosunda yer alır. Ağrı Dağı 5.137 metre ile Türkiye'nin zirvesidir. Murat Nehri il topraklarından geçer. Arazi büyük ölçüde yüksek plato ve dağlık yapıdadır.",
    climate: "Sert karasal iklim hâkimdir. Kışlar uzun, çok soğuk (-30°C) ve karlıdır. Yazlar kısa ve serindedir.",
    famousFor: ["Ağrı Dağı (5.137 m)", "İshak Paşa Sarayı", "Nuh'un Gemisi efsanesi", "Meteor Çukuru"],
    neighborProvinces: ["Kars", "Iğdır", "Van", "Erzurum"],
  },
  "Aksaray": {
    name: "Aksaray",
    plateCode: "68",
    description: "Aksaray, İç Anadolu'nun Kapadokya bölgesine açılan kapısıdır. Hasan Dağı'nın gölgesinde kurulmuş olan şehir, Ihlara Vadisi ile dünyaca ünlüdür. 14 km uzunluğundaki bu kanyon, Bizans dönemi kaya kiliseleri ve freskleriyle bezelidir. Selçuklu dönemi hanları ve kervansarayları Aksaray'ı İpek Yolu'nun önemli bir durağı yapmıştır.",
    geography: "İç Anadolu platosunun güneydoğusunda yer alır. Hasan Dağı (3.268 m) volkanik bir zirvedir. Tuz Gölü'nün güney kıyısına komşudur. Ihlara Vadisi Melendiz Çayı tarafından oyulmuştur.",
    climate: "Yarı kurak step iklimi görülür. Yazlar sıcak ve kurak, kışlar soğuk ve az kar yağışlıdır.",
    famousFor: ["Ihlara Vadisi", "Hasan Dağı", "Sultanhanı Kervansarayı", "Güzelyurt yeraltı şehri"],
    neighborProvinces: ["Nevşehir", "Konya", "Niğde", "Kırşehir"],
  },
  "Amasya": {
    name: "Amasya",
    plateCode: "05",
    description: "Amasya, Yeşilırmak kıyısında dik kayaların arasına sıkışmış romantik bir Osmanlı şehridir. Nehir boyunca dizilmiş yalıboyu evleri, kaya mezarları ve Pontus krallarının oyma mezar odaları şehre eşsiz bir siluet kazandırır. Osmanlı şehzadelerinin eğitim gördüğü 'şehzadeler şehri' olarak bilinir.",
    geography: "Kuzey Anadolu dağları arasında dar bir vadide yer alır. Yeşilırmak şehrin ortasından akar. Dik kayalıklar ve vadiler baskın coğrafi öğelerdir.",
    climate: "Karadeniz ile İç Anadolu iklimlerinin geçiş kuşağında yer alır. Yazlar ılık, kışlar soğuk ve yağışlıdır.",
    famousFor: ["Yalıboyu evleri", "Kral Kaya Mezarları", "Şehzadeler şehri", "Amasya elması"],
    neighborProvinces: ["Tokat", "Samsun", "Çorum"],
  },
  "Ankara": {
    name: "Ankara",
    plateCode: "06",
    description: "Ankara, Türkiye Cumhuriyeti'nin başkenti ve ülkenin ikinci büyük şehridir. Anadolu'nun tam merkezinde konumlanan şehir, Anıtkabir, TBMM, Ankara Kalesi ve Anadolu Medeniyetleri Müzesi gibi simge yapılarıyla cumhuriyet tarihinin kalbidir. Geniş bulvarları, devlet kurumları ve üniversiteleriyle modern bir başkent görünümü sergiler. Hitit döneminden bu yana kesintisiz yerleşim görmüştür.",
    geography: "İç Anadolu platosunun kuzey kesiminde 850-1.000 metre rakımda yer alır. Ankara Çayı şehrin ortasından geçer. Çevresi step ve bozkır arazisiyle kaplıdır. Düz plato yapısı kıyı şehirlerinden belirgin şekilde ayrılır.",
    climate: "Karasal iklim hâkimdir. Yazlar sıcak ve kurak (35°C+), kışlar soğuk ve karlıdır (-10°C). Yıllık yağış düşüktür.",
    famousFor: ["Anıtkabir", "Ankara Kalesi", "TBMM", "Anadolu Medeniyetleri Müzesi", "Kızılay Meydanı"],
    neighborProvinces: ["Eskişehir", "Bolu", "Çankırı", "Kırıkkale", "Konya", "Aksaray"],
  },
  "Antalya": {
    name: "Antalya",
    plateCode: "07",
    description: "Antalya, Türkiye'nin turizm başkenti ve Akdeniz'in en parlak incisidir. Toros Dağları'ndan Akdeniz'e inen dramatik coğrafyası, antik kentleri, turkuaz plajları ve modern tatil tesisleri yılda 15 milyonun üzerinde turist çeker. Kaleiçi'nin tarihi sokakları, Aspendos amfitiyatrosu ve Düden Şelaleleri şehrin en bilinen simgeleridir. İklimi sayesinde yılın 300 günü güneş görür.",
    geography: "Batıda Likya, doğuda Kilikya kıyılarını kapsar. Toros Dağları şehrin hemen arkasında 3.000 metreye yükselir. Sahil şeridi 630 km uzunluğundadır. Dağlardan denize inen düzlükler narenciye ve sera tarımına uygundur.",
    climate: "Tipik Akdeniz iklimi: yazlar çok sıcak ve kurak (38°C+), kışlar ılık ve yağışlı. Deniz suyu yılın büyük bölümünde yüzmeye uygundur.",
    famousFor: ["Kaleiçi", "Aspendos", "Düden Şelalesi", "Konyaaltı Plajı", "Olimpos", "Side antik kenti"],
    neighborProvinces: ["Muğla", "Burdur", "Isparta", "Konya", "Mersin", "Karaman"],
  },
  "Artvin": {
    name: "Artvin",
    plateCode: "08",
    description: "Artvin, Türkiye'nin kuzeydoğu ucunda Gürcistan sınırında yer alan ve derin vadiler, yoğun ormanlar ve beyaz su nehirleriyle kaplı bir ildir. Çoruh Nehri vadisi boyunca kurulmuş olan şehir, rafting sporunda dünya çapında üne sahiptir. Kaçkar Dağları'nın doğu etekleri ve Borçka Karagöl doğa tutkunlarını cezbeder.",
    geography: "Çoruh Nehri vadisinde dik yamaçlar üzerine kurulmuştur. Kaçkar Dağları'nın doğu uzantıları il topraklarında yükselir. Arazi son derece engebelidir. Yaylalar ve buzul gölleri bölgenin doğal güzellikleridir.",
    climate: "Karadeniz ikliminin dağlık versiyonu: bol yağışlı, sisli, yazlar serin. Yüksek kesimlerde kar uzun süre kalır.",
    famousFor: ["Çoruh Nehri raftingi", "Borçka Karagöl", "Kaçkar Dağları", "Zilkale"],
    neighborProvinces: ["Rize", "Erzurum", "Ardahan"],
  },
  "Aydın": {
    name: "Aydın",
    plateCode: "09",
    description: "Aydın, Ege Bölgesi'nin güneybatısında Büyük Menderes Ovası'nın bereketli toprakları üzerinde kurulmuş bir ildir. Antik Aphrodisias, Milet, Didim ve Priene kentleri bu ilin sınırları içindedir. İncir ve zeytin üretiminde Türkiye'nin lideridir. Kuşadası ve Didim gibi kıyı ilçeleri önemli turizm merkezleridir.",
    geography: "Büyük Menderes Nehri ovası ilin bel kemiğidir. Kuzeyinde Aydın Dağları, güneyinde Beşparmak Dağları yer alır. Batıda Ege Denizi kıyısı uzanır. Verimli ova tarım için idealdir.",
    climate: "Akdeniz iklimi görülür. Yazlar sıcak ve kurak, kışlar ılık ve yağışlıdır. Kıyı kesimleri iç kesimlerden daha ılıktır.",
    famousFor: ["Kuşadası", "Aphrodisias antik kenti", "Didim", "Aydın inciri", "Priene"],
    neighborProvinces: ["İzmir", "Manisa", "Denizli", "Muğla"],
  },
  "Balıkesir": {
    name: "Balıkesir",
    plateCode: "10",
    description: "Balıkesir, hem Marmara hem Ege denizine kıyısı olan Türkiye'nin nadir illerinden biridir. Kuzeyinde Bandırma ve Erdek gibi Marmara kıyı kasabaları, güneyinde Ayvalık, Edremit ve Burhaniye gibi Ege tatil beldeleri yer alır. Zeytin bahçeleri, körfez manzaraları ve tarihi Osmanlı kasabaları ile doğa ve kültür turizminin buluşma noktasıdır.",
    geography: "İki denize kıyısı olan ender illerdendir: kuzeyde Marmara, güneyde Ege. Kaz Dağları (İda) güneyinde yükselir. Hem düzlük ovalar hem dağlık arazi barındırır.",
    climate: "Marmara ve Ege iklimlerinin karışımı: yazlar sıcak ve kurak, kışlar ılık. Kıyı kesimleri iç kesimlerden daha ılıman.",
    famousFor: ["Ayvalık", "Kaz Dağları", "Edremit Körfezi", "Cunda Adası", "Zeytin ve zeytinyağı"],
    neighborProvinces: ["Çanakkale", "Bursa", "Manisa", "İzmir"],
  },
  "Batman": {
    name: "Batman",
    plateCode: "72",
    description: "Batman, Güneydoğu Anadolu'da Dicle Nehri'nin kollarından Batman Çayı kıyısında kurulmuş bir ildir. Hasankeyf antik kenti, 12.000 yıllık kesintisiz yerleşim tarihiyle dünyanın en eski yaşam alanlarından biriydi. Ilısu Barajı projesiyle kısmen sular altında kalan Hasankeyf'in kaya mezarları, köprü kalıntıları ve mağara evleri hâlâ görülebilir.",
    geography: "Güneydoğu Toros Dağları'nın güney eteklerinde yer alır. Batman Çayı ilin ortasından akar. Arazi genellikle engebeli ve kayalıktır. Dicle Nehri havzasındadır.",
    climate: "Karasal Akdeniz iklimi: yazlar çok sıcak ve kurak (45°C+), kışlar soğuk ve az yağışlıdır.",
    famousFor: ["Hasankeyf", "Ilısu Barajı", "Kaya mezarları", "Petrol rafinerisi"],
    neighborProvinces: ["Diyarbakır", "Siirt", "Mardin", "Şırnak"],
  },
  "Bolu": {
    name: "Bolu",
    plateCode: "14",
    description: "Bolu, Batı Karadeniz'de yoğun ormanlar ve göller arasında yer alan doğa cenneti bir ildir. Abant Gölü, Yedigöller Milli Parkı ve Kartalkaya kayak merkezi ile dört mevsim ziyaretçi çeker. Türk mutfağının başkenti olarak bilinir; ünlü aşçılar yetiştiren Mengen ilçesi gastronomi turizmi açısından önemlidir.",
    geography: "Batı Karadeniz dağlarının iç kesimlerinde yer alır. Ormanlarla kaplı dağlar, krater gölleri ve vadiler baskın coğrafi öğelerdir. Abant Gölü tektonik kökenli bir krater gölüdür. Yüksek rakımlı ormanlar yaygındır.",
    climate: "Karadeniz ve karasal iklimin geçişi: yazlar serin, kışlar soğuk ve karlı. Orman örtüsü bol yağış alır.",
    famousFor: ["Abant Gölü", "Yedigöller Milli Parkı", "Kartalkaya kayak merkezi", "Mengen aşçıları", "Bolu Dağı tüneli"],
    neighborProvinces: ["Düzce", "Ankara", "Çankırı", "Eskişehir"],
  },
  "Burdur": {
    name: "Burdur",
    plateCode: "15",
    description: "Burdur, Göller Bölgesi'nde aynı adlı gölün kıyısında kurulmuş sakin bir Anadolu şehridir. Burdur Gölü flamingo popülasyonuyla ünlüdür ve önemli bir kuş cenneti alanıdır. Sagalassos antik kenti, dağların arasında korunmuş en iyi Roma şehirlerinden biri olarak arkeoloji dünyasında değerlidir.",
    geography: "Göller Bölgesi'nin batı kesiminde yer alır. Burdur Gölü tuzlu bir tektonik göldür. Çevresi dağlarla kuşatılmıştır. Arazi plato ve dağlık yapıdadır.",
    climate: "Yarı karasal Akdeniz iklimi: yazlar sıcak ve kurak, kışlar soğuk ve kar yağışlı. Göl etkisi ılımanlaştırıcıdır.",
    famousFor: ["Burdur Gölü", "Sagalassos antik kenti", "Flamingolar", "Lavanta tarlaları"],
    neighborProvinces: ["Isparta", "Antalya", "Muğla", "Denizli", "Afyonkarahisar"],
  },
  "Bursa": {
    name: "Bursa",
    plateCode: "16",
    description: "Bursa, Osmanlı İmparatorluğu'nun ilk başkenti ve Türkiye'nin dördüncü büyük şehridir. Uludağ'ın eteklerinde kurulmuş olan şehir, tarihi ipek ticareti, termal kaynakları ve kayak turizmiyle ünlüdür. Yeşil Türbe, Ulu Cami, Koza Han ve Cumalıkızık köyü UNESCO Dünya Mirası listesindedir. İskender kebabı ve kestane şekeri şehrin gastronomik sembolleridir.",
    geography: "Uludağ (2.543 m) şehrin güneyinde yükselir ve Türkiye'nin en önemli kayak merkezidir. Kuzeyde Marmara Denizi kıyısı bulunur. Bursa ovası verimli tarım alanıdır. Termal kaynaklar Çekirge semtinde yoğundur.",
    climate: "Marmara iklimi: yazlar sıcak ve kurak, kışlar ılık ve yağışlı. Uludağ'da kış boyunca kar kalır ve kayak sezonu uzundur.",
    famousFor: ["Uludağ", "Yeşil Türbe", "Ulu Cami", "Cumalıkızık", "İskender kebabı", "Kestane şekeri"],
    neighborProvinces: ["İstanbul", "Yalova", "Kocaeli", "Balıkesir", "Bilecik"],
  },
  "Çanakkale": {
    name: "Çanakkale",
    plateCode: "17",
    description: "Çanakkale, Avrupa ve Asya kıtalarını birbirine bağlayan boğazın iki yakasına yayılmış tarihi bir ildir. 1915 Çanakkale Savaşı'nın yaşandığı Gelibolu Yarımadası ve Truva antik kenti UNESCO Dünya Mirası alanlarıdır. Çanakkale Boğazı, günde yüzlerce geminin geçtiği dünyanın en işlek su yollarından biridir. Gökçeada ve Bozcaada adaları da bu ile bağlıdır.",
    geography: "Çanakkale Boğazı'nın iki yakasında kurulmuştur. Güneyde Troia ovası, kuzeyde Gelibolu yarımadası yer alır. Ege Denizi kıyıları ve adaları (Bozcaada, Gökçeada) ile zengin coğrafyaya sahiptir.",
    climate: "Ege-Marmara geçiş iklimi: yazlar sıcak ve kurak, kışlar ılık ve yağışlı. Boğaz etkisiyle rüzgâr süreklidir.",
    famousFor: ["Çanakkale Boğazı", "Truva antik kenti", "Gelibolu", "Bozcaada", "Çanakkale Savaşları"],
    neighborProvinces: ["Balıkesir", "Edirne", "Tekirdağ"],
  },
  "Denizli": {
    name: "Denizli",
    plateCode: "20",
    description: "Denizli, Ege Bölgesi'nin iç kesiminde Büyük Menderes Vadisi'nde yer alan ve Pamukkale travertenleriyle dünyaca ünlü bir ildir. Beyaz kalsiyum karbonat terasları ve üzerindeki Hierapolis antik kenti birlikte UNESCO Dünya Mirası'ndadır. Denizli aynı zamanda tekstil sanayisinin merkezlerinden biridir ve horozuyla sembolleşmiştir.",
    geography: "Büyük Menderes havzasında yer alır. Kuzeyinde Honaz Dağı (2.528 m) yükselir. Pamukkale travertenleri termal suların binlerce yılda oluşturduğu doğa harikasıdır. Ova ve dağlık arazi bir aradadır.",
    climate: "İç Ege iklimi: yazlar sıcak ve kurak, kışlar soğuk ve yağışlı. Kıyıya göre daha karasal özellik taşır.",
    famousFor: ["Pamukkale travertenleri", "Hierapolis antik kenti", "Denizli horozu", "Tekstil sanayisi"],
    neighborProvinces: ["Aydın", "Muğla", "Burdur", "Afyonkarahisar", "Uşak", "Manisa"],
  },
  "Diyarbakır": {
    name: "Diyarbakır",
    plateCode: "21",
    description: "Diyarbakır, Dicle Nehri kıyısında 5.000 yıllık surlara sahip kadim bir Mezopotamya şehridir. Diyarbakır Surları, Çin Seddi'nden sonra dünyanın en uzun ikinci savunma yapısıdır ve UNESCO Dünya Mirası'nda listelenmiştir. Bazalt taşından inşa edilmiş evler, Ulu Cami ve Hevsel Bahçeleri şehre karakteristik bir kimlik kazandırır.",
    geography: "Güneydoğu Anadolu'nun kuzeyinde Dicle Nehri kıyısında yer alır. Bazalt platolar üzerinde kurulmuştur. Dicle vadisi verimli Hevsel Bahçeleri'ni oluşturur. Arazi genel olarak düz ve geniş ovalardan oluşur.",
    climate: "Karasal iklim: yazlar çok sıcak ve kurak (45°C+), kışlar soğuk. Yaz-kış sıcaklık farkı çok yüksektir.",
    famousFor: ["Diyarbakır Surları", "Ulu Cami", "Hevsel Bahçeleri", "Bazalt mimari", "Diyarbakır karpuzu"],
    neighborProvinces: ["Mardin", "Batman", "Bingöl", "Elazığ", "Şanlıurfa"],
  },
  "Edirne": {
    name: "Edirne",
    plateCode: "22",
    description: "Edirne, Türkiye'nin en batı ucunda Bulgaristan ve Yunanistan sınırında yer alan ve Osmanlı başkentliği yapmış tarihi bir şehirdir. Mimar Sinan'ın başyapıtı Selimiye Camii UNESCO Dünya Mirası'ndadır. Tarihi Kırkpınar yağlı güreşleri dünyanın en eski spor organizasyonudur. Meriç ve Tunca nehirlerinin birleştiği noktada kurulan şehir, Osmanlı saray mutfağı geleneğini yaşatır.",
    geography: "Trakya'nın batı ucunda düz bir ovada yer alır. Meriç, Tunca ve Arda nehirleri şehirde buluşur. Arazi dümdüz ve verimli tarım arazisidir. Avrupa'ya geçiş noktasındadır.",
    climate: "Marmara geçiş iklimi: yazlar sıcak, kışlar soğuk ve yağışlı. Balkanlardan gelen soğuk hava dalgaları etkilidir.",
    famousFor: ["Selimiye Camii", "Kırkpınar güreşleri", "Ciğer tava", "Osmanlı saray mutfağı"],
    neighborProvinces: ["Kırklareli", "Tekirdağ"],
  },
  "Elazığ": {
    name: "Elazığ",
    plateCode: "23",
    description: "Elazığ, Doğu Anadolu'nun batı kesiminde Keban Baraj Gölü kıyısında modern bir şehir görünümüne sahip ildir. Harput Kalesi ve tarihi Harput yerleşimi şehre tarihi derinlik katar. Fırat Nehri üzerindeki Keban Barajı Türkiye'nin en büyük barajlarından biridir. Üniversite şehri olarak genç ve dinamik bir nüfusa sahiptir.",
    geography: "Doğu Anadolu'nun batı geçişinde yer alır. Keban Baraj Gölü en belirgin coğrafi unsurudur. Harput tepesi şehre hâkim konumdadır. Fırat Nehri havzasındadır.",
    climate: "Yarı karasal iklim: yazlar sıcak ve kurak, kışlar soğuk ve kar yağışlıdır. Göl etkisi iklimi hafifletir.",
    famousFor: ["Harput Kalesi", "Keban Barajı", "Fırat Üniversitesi", "Elazığ harputlu geleneği"],
    neighborProvinces: ["Malatya", "Diyarbakır", "Bingöl", "Tunceli"],
  },
  "Erzurum": {
    name: "Erzurum",
    plateCode: "25",
    description: "Erzurum, Doğu Anadolu'nun en büyük şehri ve Türkiye'nin en yüksek rakımlı büyükşehirlerinden biridir. 1.900 metre yükseklikte kurulmuş olan şehir, Palandöken kayak merkezi ile kış sporlarının başkentidir. Çifte Minareli Medrese, Üç Kümbetler ve Yakutiye Medresesi Selçuklu mimarisinin en güzel örnekleridir.",
    geography: "Doğu Anadolu platosunun en geniş ovasında, 1.900 metre rakımda yer alır. Palandöken Dağları güneyde yükselir. Karasu Nehri (Fırat'ın kaynağı) il sınırları içindedir. Arazi yüksek plato ve dağlık yapıdadır.",
    climate: "Sert karasal iklim: kışlar çok uzun, çok soğuk (-35°C) ve çok karlıdır. Yazlar kısa ve serindir. Türkiye'nin en soğuk illerinden biridir.",
    famousFor: ["Palandöken kayak merkezi", "Çifte Minareli Medrese", "Cağ kebabı", "Oltu taşı"],
    neighborProvinces: ["Kars", "Ağrı", "Bingöl", "Bayburt", "Artvin", "Rize"],
  },
  "Eskişehir": {
    name: "Eskişehir",
    plateCode: "26",
    description: "Eskişehir, İç Batı Anadolu'da Porsuk Çayı kıyısında kurulmuş, Türkiye'nin en yaşanabilir şehirlerinden biridir. Üniversite şehri kimliği, Odunpazarı'nın restore edilmiş Osmanlı evleri, gondol turları ve canlı kültürel yaşamıyla genç ve dinamik bir atmosfere sahiptir. Lületaşı işçiliği ve Sazova Parkı şehrin simgeleridir.",
    geography: "İç Batı Anadolu platosunda Porsuk Çayı vadisinde yer alır. Düz ova yapısı baskındır. Çevresinde step ve bozkır arazi uzanır. Üniversite kampüsleri şehrin büyük bölümünü kaplar.",
    climate: "Yarı karasal iklim: yazlar sıcak ve kurak, kışlar soğuk ve karlıdır. Step ikliminin etkileri görülür.",
    famousFor: ["Odunpazarı evleri", "Porsuk Çayı gondol turları", "Lületaşı", "Sazova Parkı", "Üniversite şehri"],
    neighborProvinces: ["Ankara", "Bolu", "Kütahya", "Afyonkarahisar", "Bilecik"],
  },
  "Gaziantep": {
    name: "Gaziantep",
    plateCode: "27",
    description: "Gaziantep, Güneydoğu Anadolu'nun en büyük şehri ve UNESCO Gastronomi Şehri unvanına sahip Türkiye'nin mutfak başkentidir. Baklavasından lahmacununa, kebaplarından katmerine zengin gastronomi mirası dünya çapında tanınır. Zeugma Mozaik Müzesi, dünyanın en büyük mozaik koleksiyonlarından birine ev sahipliği yapar.",
    geography: "Güneydoğu Anadolu platosunun batı kesiminde yer alır. Fırat Nehri ilin doğu sınırını oluşturur. Arazi düz ve hafif engebeli yapıdadır. Antep fıstığı için ideal toprak ve iklim koşulları barındırır.",
    climate: "Akdeniz ve karasal iklimin geçişi: yazlar çok sıcak ve kurak, kışlar ılık-soğuk arası. Yaz sıcaklığı 40°C'yi aşabilir.",
    famousFor: ["Baklava", "Antep fıstığı", "Zeugma Mozaik Müzesi", "Gaziantep mutfağı", "Lahmacun"],
    neighborProvinces: ["Şanlıurfa", "Adıyaman", "Kahramanmaraş", "Hatay", "Kilis"],
  },
  "Giresun": {
    name: "Giresun",
    plateCode: "28",
    description: "Giresun, Doğu Karadeniz kıyısında fındık bahçeleriyle ünlü yeşil bir ildir. Türkiye'nin fındık üretiminin önemli bir kısmı buradan gelir. Giresun Adası Karadeniz'in tek adası olup Amazon efsaneleriyle anılır. Küçük bir yarımada üzerinde kurulan şehir merkezi, Giresun Kalesi kalıntılarıyla taçlanır.",
    geography: "Karadeniz kıyısında dik dağlarla deniz arasına sıkışmış dar bir şerit üzerinde yer alır. İç kesimlerde yüksek dağlar ve yaylalar bulunur. Giresun Adası kıyıdan 1.5 km açıktadır.",
    climate: "Karadeniz iklimi: ılık kışlar, serin yazlar, bol yağış. Nem oranı yüksektir ve sık sık sis görülür.",
    famousFor: ["Fındık üretimi", "Giresun Adası", "Kümbet Yaylası", "Giresun Kalesi"],
    neighborProvinces: ["Trabzon", "Ordu", "Gümüşhane"],
  },
  "Hatay": {
    name: "Hatay",
    plateCode: "31",
    description: "Hatay, Türkiye'nin en güneyinde Suriye sınırında yer alan ve medeniyetler beşiği olarak bilinen bir ildir. Antik Antakya şehri, üç büyük dinin bir arada yaşadığı kozmopolit bir kültür merkezi olmuştur. St. Pierre Kilisesi Hristiyanlığın ilk kiliselerinden biridir. Hatay mutfağı, Arap, Türk ve Akdeniz lezzetlerinin eşsiz bir sentezini sunar.",
    geography: "Akdeniz kıyısından Amanos Dağları'na uzanan değişken bir arazi yapısına sahiptir. Asi Nehri (Orontes) il topraklarından geçer. Amik Ovası verimli tarım alanıdır. Samandağ kıyıları ve İskenderun Körfezi kıyı coğrafyasını oluşturur.",
    climate: "Akdeniz iklimi: yazlar çok sıcak ve nemli, kışlar ılık ve yağışlıdır. Güney konumu nedeniyle Türkiye'nin en sıcak illerinden biridir.",
    famousFor: ["Antakya mozaikleri", "St. Pierre Kilisesi", "Hatay mutfağı", "Künefe", "Defne sabunu"],
    neighborProvinces: ["Adana", "Osmaniye", "Gaziantep"],
  },
  "Isparta": {
    name: "Isparta",
    plateCode: "32",
    description: "Isparta, Göller Bölgesi'nin merkezinde gül bahçeleri ve lavanta tarlalarıyla ünlü bir Anadolu şehridir. Dünya gül yağı üretiminin önemli bir kısmı Isparta'dan karşılanır. Eğirdir Gölü Türkiye'nin dördüncü büyük gölü olup berrak sularıyla doğa turizmi açısından değerlidir. Davraz Dağı'nda kış sporları yapılabilir.",
    geography: "Göller Bölgesi'nin merkezi platosunda yer alır. Eğirdir Gölü ve Burdur Gölü ilin iki yakasındadır. Davraz Dağı (2.635 m) kuzeyinde yükselir. Gül tarlaları ve lavanta bahçeleri peyzajı renklendirir.",
    climate: "İç Anadolu ile Akdeniz ikliminin geçişi: yazlar sıcak ve kurak, kışlar soğuk ve karlı. Göl kenarları daha ılıman.",
    famousFor: ["Gül yağı üretimi", "Eğirdir Gölü", "Lavanta tarlaları", "Davraz kayak merkezi"],
    neighborProvinces: ["Burdur", "Antalya", "Konya", "Afyonkarahisar"],
  },
  "İstanbul": {
    name: "İstanbul",
    plateCode: "34",
    description: "İstanbul, üç imparatorluğa başkentlik yapmış ve iki kıtayı birbirine bağlayan dünyanın en büyüleyici şehirlerinden biridir. 16 milyonluk nüfusuyla Türkiye'nin en kalabalık metropolüdür. Ayasofya, Topkapı Sarayı, Sultanahmet Camii, Galata Kulesi, Kapalıçarşı ve Boğaz köprüleri şehrin dünyaca ünlü simgeleridir. Tarihi yarımada UNESCO Dünya Mirası alanıdır.",
    geography: "İstanbul Boğazı ile Avrupa ve Asya kıtalarına bölünmüştür. Haliç tarihi yarımadayı kuzeye açar. Marmara Denizi güneyde, Karadeniz kuzeyde yer alır. Tepeli arazi yapısı (yedi tepe efsanesi) ve kıyı şeridi karakteristiktir.",
    climate: "Marmara geçiş iklimi: yazlar sıcak ve nemli, kışlar ılık-soğuk arası. Karadeniz'den esen poyraz rüzgârı belirleyicidir.",
    famousFor: ["Ayasofya", "Topkapı Sarayı", "Boğaziçi", "Kapalıçarşı", "Galata Kulesi", "Sultanahmet"],
    neighborProvinces: ["Kocaeli", "Tekirdağ", "Edirne", "Kırklareli"],
  },
  "İzmir": {
    name: "İzmir",
    plateCode: "35",
    description: "İzmir, Ege'nin incisi olarak bilinen Türkiye'nin üçüncü büyük şehridir. Körfez etrafına yayılmış modern yapısı, Kordon boyu yürüyüş yolu, Kemeraltı tarihi çarşısı ve Saat Kulesi şehrin ikonik unsurlarıdır. Efes antik kenti, Şirince köyü ve Çeşme yarımadası İzmir'in kültürel ve turistik zenginliklerini tamamlar. Atatürk'ün 'Güzel İzmir' dediği şehir, açık fikirli ve kozmopolit kimliğiyle tanınır.",
    geography: "İzmir Körfezi etrafında at nalı şeklinde yayılmıştır. Güneyde Efes ovası, kuzeyde Bergama ovası uzanır. Çeşme ve Karaburun yarımadaları batıda Ege'ye uzanır. Ova, dağ ve kıyı bir aradadır.",
    climate: "Tipik Ege-Akdeniz iklimi: yazlar sıcak ve kurak, kışlar ılık ve yağışlı. Körfez etkisi ılımanlaştırıcıdır.",
    famousFor: ["Efes antik kenti", "Saat Kulesi", "Kemeraltı Çarşısı", "Kordon", "Çeşme", "Alaçatı"],
    neighborProvinces: ["Manisa", "Aydın", "Balıkesir"],
  },
  "Kahramanmaraş": {
    name: "Kahramanmaraş",
    plateCode: "46",
    description: "Kahramanmaraş, Akdeniz'den İç Anadolu'ya geçişte Ahır Dağı'nın eteklerinde kurulmuş ve dondurmasıyla dünyaca ünlü bir ildir. Maraş dondurması salep ve keçi sütünden yapılır ve benzersiz uzayan dokusuyla bilinir. Kurtuluş Savaşı'ndaki kahramanlığından dolayı 'Kahraman' unvanı verilmiştir. El sanatları ve bakırcılık geleneği hâlâ yaşatılır.",
    geography: "Toros Dağları'nın kuzey yamaçlarında, Akdeniz ile İç Anadolu arasında geçiş kuşağında yer alır. Ahır Dağı (2.300 m) şehre hâkim konumdadır. Ceyhan Nehri il topraklarından geçer.",
    climate: "Akdeniz ve karasal iklimin geçişi: yazlar sıcak, kışlar soğuk ve kar yağışlıdır. İklim çeşitliliği yüksektir.",
    famousFor: ["Maraş dondurması", "Maraş biberli kebap", "Bakırcılık", "Kahraman unvanı"],
    neighborProvinces: ["Adana", "Adıyaman", "Gaziantep", "Osmaniye", "Kayseri", "Sivas", "Malatya"],
  },
  "Karabük": {
    name: "Karabük",
    plateCode: "78",
    description: "Karabük, Batı Karadeniz'de demir-çelik sanayisiyle kurulan bir sanayi şehri olmakla birlikte, Safranbolu ilçesi sayesinde dünya turizminde önemli bir yer edinmiştir. Safranbolu'nun Osmanlı konakları UNESCO Dünya Mirası Listesi'ndedir. İnce Kaya Yolu Kanyonu ve Bulak Mağarası doğal güzellikleridir.",
    geography: "Batı Karadeniz dağlarının iç kesimlerinde yer alır. Araç ve Soğanlı çayları vadileri oluşturur. Ormanlarla kaplı dağlık arazi hâkimdir.",
    climate: "Karadeniz ve karasal iklimin geçişi: yazlar ılık, kışlar soğuk ve kar yağışlıdır.",
    famousFor: ["Safranbolu evleri", "UNESCO Dünya Mirası", "Demir-çelik fabrikası", "İnce Kaya Yolu"],
    neighborProvinces: ["Bartın", "Kastamonu", "Çankırı", "Bolu"],
  },
  "Kars": {
    name: "Kars",
    plateCode: "36",
    description: "Kars, Türkiye'nin kuzeydoğusunda Ermenistan ve Gürcistan sınırında yer alan, Kafkas mimarisinin ve soğuk iklimin damga vurduğu tarihi bir şehirdir. Ani Harabeleri UNESCO Dünya Mirası'ndadır — 1.001 kiliseli şehir olarak bilinen bu ortaçağ başkenti Bağratlı Krallığı'nın başkentiydi. Kars Kalesi, Baltık mimarisi etkisindeki Rus dönemi yapılar ve kaşar peyniri şehrin simgeleridir.",
    geography: "Doğu Anadolu'nun kuzeydoğusunda 1.800 metre rakımda geniş bir platoda yer alır. Arpaçay (Ahuryan) Ermenistan sınırını oluşturur. Arazi düz, çıplak ve rüzgâra açık step yapısındadır.",
    climate: "Çok sert karasal iklim: kışlar uzun ve dondurucu (-30°C), yazlar kısa ve serin. Türkiye'nin en soğuk illerinden biridir.",
    famousFor: ["Ani Harabeleri", "Kars Kalesi", "Kars kaşarı", "Kaz (Kafkas) dansları", "Rus dönemi mimari"],
    neighborProvinces: ["Erzurum", "Ağrı", "Iğdır", "Ardahan"],
  },
  "Kayseri": {
    name: "Kayseri",
    plateCode: "38",
    description: "Kayseri, İç Anadolu'da Erciyes Dağı'nın eteklerinde kurulmuş ticaret ve sanayi şehridir. Selçuklu başkentlerinden biri olan Kayseri, döneme ait kümbetler, medreseler ve camilerle doludur. Erciyes Dağı (3.917 m) Türkiye'nin en önemli kayak merkezlerinden biridir. Pastırma ve sucuk üretiminde Türkiye'nin lideridir.",
    geography: "İç Anadolu platosunun güneydoğusunda yer alır. Erciyes Dağı (3.917 m) volkanik bir zirvedir ve şehre hâkim konumdadır. Sultan Sazlığı kuş cenneti önemli bir sulak alandır.",
    climate: "Karasal iklim: yazlar sıcak ve kurak, kışlar soğuk ve karlıdır. Erciyes'te kar uzun süre kalır.",
    famousFor: ["Erciyes kayak merkezi", "Pastırma ve sucuk", "Selçuklu eserleri", "Kapadokya'ya yakınlık"],
    neighborProvinces: ["Sivas", "Yozgat", "Nevşehir", "Niğde", "Adana", "Kahramanmaraş"],
  },
  "Kocaeli": {
    name: "Kocaeli",
    plateCode: "41",
    description: "Kocaeli, Marmara Denizi'nin doğu ucunda İstanbul'a komşu sanayi ve liman şehridir. İzmit Körfezi çevresinde yoğun sanayi tesisleri, rafineriler ve limanlar yer alır. Gebze Organize Sanayi Bölgesi Türkiye'nin en büyük sanayi alanlarından biridir. Sapanca Gölü ve Maşukiye doğa turizmi için popüler destinasyonlardır.",
    geography: "İzmit Körfezi'nin iki yakasında kurulmuştur. Kuzeyde Karadeniz'e, güneyde Marmara'ya bakan kıyıları vardır. Sapanca Gölü doğu sınırındadır. Düz ve hafif engebeli arazi hâkimdir.",
    climate: "Marmara iklimi: yazlar sıcak ve nemli, kışlar ılık ve yağışlı. Deniz etkisi belirgindir.",
    famousFor: ["İzmit Körfezi", "Sanayi tesisleri", "Sapanca Gölü", "Maşukiye", "Gebze"],
    neighborProvinces: ["İstanbul", "Sakarya", "Yalova", "Bursa"],
  },
  "Konya": {
    name: "Konya",
    plateCode: "42",
    description: "Konya, Türkiye'nin yüzölçümü en büyük ili ve Mevlâna Celâleddîn-i Rûmî'nin şehridir. Mevlâna Müzesi her yıl milyonlarca ziyaretçi çeker ve Sema törenleri UNESCO Somut Olmayan Kültürel Miras listesindedir. Selçuklu Devleti'nin başkentliğini yapmış olan şehir, Anadolu'nun en eski yerleşimlerinden Çatalhöyük'e de ev sahipliği yapar. Tahıl üretiminin merkezidir.",
    geography: "İç Anadolu'nun güneyinde, Türkiye'nin en geniş ovasında yer alır. Tuz Gölü kuzeydoğusundadır. Çevresi step ve bozkır arazidir. Arazi dümdüz ve uçsuz bucaksızdır.",
    climate: "Sert karasal step iklimi: yazlar sıcak ve kurak, kışlar soğuk ve karlı. Yıllık yağış çok düşüktür.",
    famousFor: ["Mevlâna Müzesi", "Sema töreni", "Çatalhöyük", "Selçuklu eserleri", "Etli ekmek"],
    neighborProvinces: ["Ankara", "Aksaray", "Karaman", "Antalya", "Isparta", "Afyonkarahisar"],
  },
  "Malatya": {
    name: "Malatya",
    plateCode: "44",
    description: "Malatya, Doğu Anadolu'nun batısında Fırat Nehri'nin kollarıyla sulanan verimli ovada kurulmuş ve dünya kayısı üretiminin başkenti olan bir ildir. Türkiye kayısı ihracatının büyük çoğunluğu Malatya'dan yapılır. Arslantepe Höyüğü UNESCO Dünya Mirası Listesi'ndedir ve dünyanın en eski kılıcı burada bulunmuştur.",
    geography: "Fırat Nehri havzasında verimli bir ovada yer alır. Doğu Toros Dağları kuzeyinde yükselir. Karakaya ve Keban baraj gölleri yakın çevresindedir.",
    climate: "Doğu Anadolu ile Akdeniz ikliminin geçiş kuşağı: yazlar sıcak ve kurak, kışlar soğuk ve karlı.",
    famousFor: ["Malatya kayısısı", "Arslantepe Höyüğü", "Levent Vadisi", "Kayısı kurutma"],
    neighborProvinces: ["Elazığ", "Adıyaman", "Kahramanmaraş", "Sivas", "Erzincan"],
  },
  "Manisa": {
    name: "Manisa",
    plateCode: "45",
    description: "Manisa, Ege Bölgesi'nin iç kesiminde Gediz Nehri ovası üzerinde kurulmuş tarihi bir Osmanlı şehzadeler şehridir. Spil Dağı'nın eteklerindeki şehir, Osmanlı döneminde şehzadelerin sancak beyliği yaptığı önemli merkezlerden biriydi. Mesir Macunu Festivali UNESCO Somut Olmayan Kültürel Miras Listesi'nde yer alır.",
    geography: "Gediz Nehri ovası üzerinde, Spil Dağı'nın (1.513 m) eteklerinde yer alır. Kuzeyinde Akhisar ovası, güneyinde Alaşehir (Filadelfiya) ovası uzanır. Verimli ova tarımı için idealdir.",
    climate: "Ege iklimi: yazlar sıcak ve kurak (40°C+), kışlar ılık ve yağışlı. İç Ege olması nedeniyle kıyıdan biraz daha karasaldır.",
    famousFor: ["Mesir Macunu Festivali", "Spil Dağı", "Sardis antik kenti", "Şehzadeler şehri"],
    neighborProvinces: ["İzmir", "Aydın", "Denizli", "Balıkesir"],
  },
  "Mardin": {
    name: "Mardin",
    plateCode: "47",
    description: "Mardin, Mezopotamya ovasına bakan bir tepenin yamacına kurulmuş, bal rengi kireçtaşı evleriyle Türkiye'nin en eşsiz şehir siluetine sahip ildir. Artuklu mimarisi, Süryani kiliseleri, Arap camileri ve Osmanlı medreseleri bir arada yaşar. Deyrulzafaran Manastırı (MS 493) dünyanın en eski hâlâ aktif manastırlarından biridir. Çok kültürlü yapısıyla Türkiye'nin açık hava müzesi olarak anılır.",
    geography: "Güneydoğu Anadolu platosunun güney kenarında, Mezopotamya ovasına bakan bir yamaçta yer alır. Şehir bir amfitiyatro gibi basamak basamak yükselir. Düz ova güneyde Suriye sınırına kadar uzanır.",
    climate: "Sıcak yarı kurak iklim: yazlar çok sıcak ve kurak (45°C+), kışlar ılık-soğuk arası. Yağış azdır.",
    famousFor: ["Taş mimari", "Deyrulzafaran Manastırı", "Mardin evleri", "Çok kültürlülük", "Süryani kültürü"],
    neighborProvinces: ["Diyarbakır", "Batman", "Şırnak", "Şanlıurfa"],
  },
  "Mersin": {
    name: "Mersin",
    plateCode: "33",
    description: "Mersin, Akdeniz kıyısında Çukurova'nın batısında yer alan önemli bir liman şehridir. Türkiye'nin en büyük konteyner limanına sahiptir. Kızkalesi (Korykos), Cennet-Cehennem obrukları ve Silifke Kalesi antik zenginlikleridir. Narenciye bahçeleri ve sera tarımı bölgenin ekonomik temelini oluşturur.",
    geography: "Akdeniz kıyısında Toros Dağları ile deniz arasında uzanır. Göksu Nehri deltası önemli bir sulak alandır. Kıyı şeridi boyunca düz ovalar, kuzeyinde dağlık arazi yer alır.",
    climate: "Akdeniz iklimi: yazlar sıcak ve kurak, kışlar ılık ve yağışlıdır. Deniz etkisiyle kışlar bölge ortalamasının üstünde ılıktır.",
    famousFor: ["Mersin Limanı", "Kızkalesi", "Cennet-Cehennem", "Narenciye", "Tantuni"],
    neighborProvinces: ["Adana", "Antalya", "Karaman", "Konya"],
  },
  "Muğla": {
    name: "Muğla",
    plateCode: "48",
    description: "Muğla, Ege ve Akdeniz'in buluştuğu güneybatı Türkiye'de turkuaz koyları, beyaz kumlu plajları ve antik kentleriyle dünyanın en popüler tatil destinasyonlarından biridir. Bodrum, Marmaris, Fethiye, Datça, Dalaman ve Ölüdeniz gibi dünyaca ünlü turizm merkezlerini barındırır. Mavi yolculuk (tekne turları) konsepti buradan doğmuştur.",
    geography: "Ege ve Akdeniz'in kesiştiği güneybatı kıyı şeridinde yer alır. Girintili çıkıntılı kıyılar, yarımadalar (Bodrum, Datça, Bozburun) ve adalar zengin coğrafya sunar. İç kesimlerde çam ormanlarıyla kaplı dağlar yükselir.",
    climate: "Tipik Akdeniz iklimi: uzun, sıcak ve kurak yazlar; kısa, ılık ve yağışlı kışlar. Deniz suyu yılın büyük bölümünde ılıktır.",
    famousFor: ["Bodrum", "Fethiye", "Marmaris", "Ölüdeniz", "Dalyan", "Datça", "Mavi yolculuk"],
    neighborProvinces: ["Aydın", "Denizli", "Burdur", "Antalya"],
  },
  "Nevşehir": {
    name: "Nevşehir",
    plateCode: "50",
    description: "Nevşehir, Kapadokya bölgesinin kalbi ve peri bacalarının başkentidir. Volkanik tüf kayalarının milyonlarca yıllık erozyonla şekillendiği eşsiz peyzaj, dünyada benzeri olmayan bir manzara sunar. Göreme Açık Hava Müzesi UNESCO Dünya Mirası'ndadır. Yeraltı şehirleri, kaya kiliseleri ve sıcak hava balon turları her yıl milyonlarca turisti ağırlar.",
    geography: "İç Anadolu volkanik platosunda yer alır. Erciyes ve Hasan Dağı volkanlarının tüf katmanları aşınarak peri bacalarını oluşturmuştur. Kızılırmak il topraklarından geçer. Yeraltı şehirleri tüf kayaların içine oyulmuştur.",
    climate: "Yarı kurak karasal iklim: yazlar sıcak ve kurak, kışlar soğuk ve karlı. Gece-gündüz sıcaklık farkı belirgindir.",
    famousFor: ["Peri bacaları", "Göreme Açık Hava Müzesi", "Balon turları", "Yeraltı şehirleri", "Kaya oteller"],
    neighborProvinces: ["Kayseri", "Aksaray", "Kırşehir", "Niğde"],
  },
  "Ordu": {
    name: "Ordu",
    plateCode: "52",
    description: "Ordu, Doğu Karadeniz'in batı kesiminde fındık bahçeleriyle kaplı yeşil dağların denize indiği bir kıyı şehridir. Boztepe'den şehir manzarası ve teleferik hattı Ordu'nun en bilinen simgeleridir. Perşembe Yaylası ve Çambaşı Yaylası doğa turizmi için önemli destinasyonlardır.",
    geography: "Karadeniz kıyısında dik dağlarla deniz arasında dar bir şeritte yer alır. Boztepe şehre hâkim bir tepedir. İç kesimler yaylalarla kaplıdır. Fındık bahçeleri tüm yamaçları kaplar.",
    climate: "Karadeniz iklimi: ılık kışlar, serin yazlar, bol yağış. Nem ve sis yaygındır.",
    famousFor: ["Boztepe teleferik", "Fındık üretimi", "Perşembe Yaylası", "Çambaşı Yaylası"],
    neighborProvinces: ["Giresun", "Samsun", "Tokat", "Sivas"],
  },
  "Rize": {
    name: "Rize",
    plateCode: "53",
    description: "Rize, Türkiye'nin çay başkenti ve Doğu Karadeniz'in yeşil cenneti olan ildir. Türkiye çay üretiminin tamamına yakını Rize ve çevresinde yapılır. Fırtına Vadisi, Ayder Yaylası ve Kaçkar Dağları ile ekoturizmin en önemli merkezlerinden biridir. Yıllık 2.300 mm yağışla Türkiye'nin en çok yağış alan ilidir.",
    geography: "Karadeniz kıyısından Kaçkar Dağları'na (3.937 m) hızla yükselen dik arazi yapısı hâkimdir. Fırtına Deresi derin vadiler oluşturur. Çay tarlaları deniz seviyesinden 1.000 metreye kadar yamaçları kaplar. Yaylalar 2.000 metre üstünde yer alır.",
    climate: "Yoğun Karadeniz iklimi: Türkiye'nin en yağışlı ili (2.300+ mm/yıl). Yazlar serin ve nemli, kışlar ılık. Sis çok yaygındır.",
    famousFor: ["Çay bahçeleri", "Ayder Yaylası", "Fırtına Vadisi", "Kaçkar Dağları", "Zilkale"],
    neighborProvinces: ["Trabzon", "Artvin", "Erzurum"],
  },
  "Sakarya": {
    name: "Sakarya",
    plateCode: "54",
    description: "Sakarya, Marmara Bölgesi'nin doğusunda Sakarya Nehri'nin Karadeniz'e döküldüğü noktada yer alan yeşil ve verimli bir ildir. Sapanca Gölü kıyıları İstanbul'dan günübirlik doğa kaçamağı için popülerdir. Taraklı ilçesi restore edilmiş Osmanlı evleriyle 'sakin şehir' (Cittaslow) unvanı almıştır.",
    geography: "Sakarya Nehri il topraklarından geçerek Karadeniz'e dökülür. Sapanca Gölü güneybatısındadır. Kuzey Anadolu dağ kuşağının batı uzantıları il topraklarında yer alır.",
    climate: "Marmara-Karadeniz geçiş iklimi: yazlar sıcak ve nemli, kışlar ılık ve yağışlı. Orman örtüsü zengindir.",
    famousFor: ["Sapanca Gölü", "Maşukiye şelaleleri", "Taraklı (Cittaslow)", "Hendek sucuğu"],
    neighborProvinces: ["Kocaeli", "Bolu", "Düzce", "Bilecik"],
  },
  "Samsun": {
    name: "Samsun",
    plateCode: "55",
    description: "Samsun, Karadeniz'in en büyük şehri ve 19 Mayıs 1919'da Atatürk'ün Kurtuluş Savaşı'nı başlatmak üzere Bandırma vapuruyla geldiği tarihi şehirdir. Bu nedenle Türkiye Cumhuriyeti'nin kuruluş noktası olarak kabul edilir. Kızılırmak ve Yeşilırmak deltalarının arasında yer alan şehir, tarım ve ticaret merkezidir.",
    geography: "Karadeniz kıyısında geniş bir delta düzlüğünde yer alır. Kızılırmak ve Yeşilırmak burada denize dökülür. Arazi kıyıda düz, iç kesimlerde dağlıktır. Kuş gözlem alanları deltada yoğundur.",
    climate: "Karadeniz iklimi: yazlar serin ve nemli, kışlar ılık. Orta Karadeniz'de yağış doğuya göre daha azdır.",
    famousFor: ["19 Mayıs", "Bandırma Vapuru", "Atatürk Anıtı", "Amazonlar", "Havza kaplıcaları"],
    neighborProvinces: ["Ordu", "Amasya", "Tokat", "Sinop"],
  },
  "Sivas": {
    name: "Sivas",
    plateCode: "58",
    description: "Sivas, İç Anadolu'nun doğusunda Kızılırmak'ın yukarı havzasında yer alan tarihi bir Selçuklu şehridir. Divriği Ulu Camii ve Darüşşifası taşa işlenmiş eşsiz süslemeleriyle UNESCO Dünya Mirası'ndadır. Sivas Kongresi'nin (1919) yapıldığı şehir olarak Kurtuluş Savaşı tarihinde önemli bir yere sahiptir. Kangal köpeği ve Kangal Balıklı Kaplıca dünya çapında tanınır.",
    geography: "İç Anadolu platosunun doğusunda, 1.285 metre rakımda geniş bir ovada yer alır. Kızılırmak il topraklarından geçer. Çevresi step ve dağlık arazidir.",
    climate: "Sert karasal iklim: kışlar uzun, soğuk ve karlı, yazlar sıcak ve kurak. Gece-gündüz sıcaklık farkı belirgindir.",
    famousFor: ["Divriği Ulu Camii", "Sivas Kongresi", "Kangal köpeği", "Balıklı Kaplıca"],
    neighborProvinces: ["Tokat", "Kayseri", "Malatya", "Erzincan", "Yozgat"],
  },
  "Şanlıurfa": {
    name: "Şanlıurfa",
    plateCode: "63",
    description: "Şanlıurfa, 'Peygamberler Şehri' olarak bilinen dünyanın en eski yerleşim alanlarından biridir. Göbekli Tepe (MÖ 9.600) tarihi bilinen en eski tapınak yapısıdır ve insanlık tarihini yeniden yazdırmıştır. Balıklıgöl'ün kutsal balıkları, Hz. İbrahim mağarası ve Harran'ın konik kubbeli evleri şehrin mistik atmosferini tamamlar.",
    geography: "Güneydoğu Anadolu platosunun batı kesiminde yer alır. Harran Ovası güneyde düz bir plato olarak uzanır. Fırat Nehri doğu sınırını oluşturur. GAP projesi ile sulanan tarım alanları yaygındır.",
    climate: "Sıcak yarı kurak iklim: yazlar çok sıcak ve kurak (45°C+), kışlar ılık. Türkiye'nin en sıcak illerinden biridir.",
    famousFor: ["Göbekli Tepe", "Balıklıgöl", "Harran evleri", "Hz. İbrahim mağarası", "Çiğ köfte"],
    neighborProvinces: ["Gaziantep", "Adıyaman", "Diyarbakır", "Mardin"],
  },
  "Tekirdağ": {
    name: "Tekirdağ",
    plateCode: "59",
    description: "Tekirdağ, Trakya'nın Marmara kıyısında üzüm bağları ve ayçiçeği tarlalarıyla kaplı verimli bir ildir. Türkiye'nin en iyi şaraplarını üreten bağ evleri ve Rakı festivali ile gastronomi turizmi açısından değerlidir. Tekirdağ köftesi ülkenin en ünlü köfte çeşitlerinden biridir.",
    geography: "Trakya'nın güneydoğusunda Marmara kıyısında yer alır. Arazi hafif dalgalı ova ve tepe yapısındadır. Üzüm bağları ve ayçiçeği tarlaları peyzajı belirler.",
    climate: "Marmara iklimi: yazlar sıcak ve kurak, kışlar soğuk ve yağışlı. Kuzey rüzgârları etkilidir.",
    famousFor: ["Tekirdağ köftesi", "Şarap üretimi", "Ayçiçeği tarlaları", "Rakı festivali"],
    neighborProvinces: ["İstanbul", "Edirne", "Kırklareli"],
  },
  "Trabzon": {
    name: "Trabzon",
    plateCode: "61",
    description: "Trabzon, Doğu Karadeniz'in en büyük şehri ve tarihi İpek Yolu'nun Karadeniz'e açılan kapısıdır. Kayaya oyulu Sümela Manastırı, derin vadilerdeki yaylalar ve yemyeşil çay bahçeleri şehrin en bilinen simgeleridir. Trabzon Kalesi, Ayasofya Müzesi ve zengin Pontus mirası şehre tarihi derinlik katar. Hamsi ve karalahana kültürü yaşamın her alanına işlemiştir.",
    geography: "Karadeniz kıyısından Zigana Dağları'na hızla yükselen dik arazi yapısı hâkimdir. Altındere Vadisi Sümela Manastırı'nı barındırır. Uzungöl tektonik kökenli bir göldür. Yoğun orman örtüsü yamaçları kaplar.",
    climate: "Karadeniz iklimi: bol yağış (800-2.000 mm), ılık kışlar, serin yazlar. Nem ve sis kıyıda süreklidir. İç kesimlerde kar yağışı artar.",
    famousFor: ["Sümela Manastırı", "Uzungöl", "Çay bahçeleri", "Hamsi festivali", "Trabzon Kalesi"],
    neighborProvinces: ["Rize", "Giresun", "Gümüşhane", "Bayburt"],
  },
  "Van": {
    name: "Van",
    plateCode: "65",
    description: "Van, Doğu Anadolu'da aynı adlı gölün kıyısında kurulmuş ve Van kedisi, Van kahvaltısı ve Akdamar Kilisesi ile dünyaca tanınan bir ildir. Van Gölü Türkiye'nin en büyük gölüdür ve sodalı yapısıyla benzersizdir. Akdamar Adası'ndaki 10. yüzyıl Ermeni kilisesi kabartma tasvirleriyle sanat tarihinin şaheserlerindendir.",
    geography: "Doğu Anadolu'nun yüksek platosunda 1.727 metre rakımda yer alır. Van Gölü (3.713 km²) Türkiye'nin en büyük gölüdür. Süphan Dağı (4.058 m) gölün kuzeyinde yükselir. Arazi yüksek ve sert yapıdadır.",
    climate: "Sert karasal iklim: kışlar uzun, soğuk ve çok karlıdır (-25°C). Yazlar kısa ve sıcaktır. Göl kenarı iç kesimlerden biraz ılıman.",
    famousFor: ["Van Gölü", "Akdamar Kilisesi", "Van kedisi", "Van kahvaltısı", "Muradiye Şelalesi"],
    neighborProvinces: ["Ağrı", "Bitlis", "Hakkâri", "Şırnak"],
  },
  "Yalova": {
    name: "Yalova",
    plateCode: "77",
    description: "Yalova, Marmara Denizi'nin güney kıyısında İstanbul'a feribotla bir saat mesafede küçük ve sakin bir ildir. Termal kaplıcaları, çiçek festivali ve botanik bahçeleri ile dinlenme ve doğa turizmi merkezidir. Atatürk'ün yürüyüş köşkünün bulunduğu kent ormanı önemli bir yeşil alandır.",
    geography: "Marmara Denizi'nin güneydoğu kıyısında dar bir şerit üzerinde yer alır. Türkiye'nin en küçük illerinden biridir. Termal kaynaklar şehrin batısında yoğundur. Kıyı ve dağ arası geçiş arazisi hâkimdir.",
    climate: "Marmara iklimi: yazlar sıcak ve nemli, kışlar ılık ve yağışlı. Deniz etkisi belirgindir.",
    famousFor: ["Termal kaplıcalar", "Çiçek festivali", "Botanik bahçesi", "Atatürk Köşkü"],
    neighborProvinces: ["Bursa", "İstanbul", "Kocaeli"],
  },
  "Zonguldak": {
    name: "Zonguldak",
    plateCode: "67",
    description: "Zonguldak, Batı Karadeniz'de Türkiye'nin kömür başkenti olarak bilinen sanayi şehridir. Ülkenin ilk ve en eski maden işletmeleri burada kurulmuştur. Filyos antik kenti, Gökgöl Mağarası ve Ereğli kıyıları doğal güzellikleridir. Yoğun orman örtüsü ve Karadeniz kıyısı yeşil peyzaj sunar.",
    geography: "Karadeniz kıyısında dik yamaçlar üzerinde yer alır. Yeraltı kömür damarları şehrin altında uzanır. Filyos Çayı vadisi önemli bir coğrafi unsurdur. Kıyı ve orman iç içedir.",
    climate: "Karadeniz iklimi: ılık kışlar, serin yazlar, bol yağış. Nem oranı yüksektir.",
    famousFor: ["Taş kömürü madenleri", "Gökgöl Mağarası", "Filyos", "Ereğli kıyıları"],
    neighborProvinces: ["Bartın", "Karabük", "Bolu", "Düzce"],
  },
};

// ==================== PUBLIC API ====================

/**
 * Returns province info for a given province name.
 * Falls back to null if province is not in the database.
 */
export function getProvinceInfo(provinceName: string): ProvinceInfo | null {
  return PROVINCE_DATA[provinceName] ?? null;
}

/**
 * Returns all province names in the database.
 */
export function getAllProvinceNames(): string[] {
  return Object.keys(PROVINCE_DATA);
}

/**
 * Returns plate code for a province, or null if not found.
 */
export function getPlateCode(provinceName: string): string | null {
  return PROVINCE_DATA[provinceName]?.plateCode ?? null;
}

/**
 * Finds cities in the game from neighboring provinces for cross-linking.
 * Used by city pages to show "Komşu İller" section.
 */
export function getNeighborProvinces(provinceName: string): string[] {
  return PROVINCE_DATA[provinceName]?.neighborProvinces ?? [];
}
