/**
 * Per-city unique descriptions and strategy tips for SEO content pages.
 *
 * Addresses AdSense "low-value / replicated content" denial risk by ensuring
 * each city page has unique, substantive text beyond the shared template.
 *
 * Approach:
 *  - POPULAR_DESCRIPTIONS: Hand-written for top cities (high traffic)
 *  - generateCityDescription(): Combinatorial template for remaining cities
 *    that varies by region, difficulty, hint tags, and mode — producing
 *    meaningfully different paragraphs for each location.
 */

import type { CityData } from "./seoData";

// ==================== HAND-WRITTEN POPULAR CITY DESCRIPTIONS ====================

const POPULAR_DESCRIPTIONS: Record<
  string,
  { about: string; strategy: string; funFact: string }
> = {
  "fatih-istanbul": {
    about:
      "Fatih, İstanbul'un tarihi yarımadasının kalbidir. Sultanahmet Meydanı, Ayasofya, Topkapı Sarayı ve Kapalıçarşı gibi dünya mirası yapılar bu ilçede yer alır. Dar sokaklar, tramvay hatları, antik surlar ve yoğun turist trafiği Fatih'i TürkiyeGuessr'ın en ikonik lokasyonlarından biri yapar.",
    strategy:
      "Fatih'te tramvay raylarını, mavi tabelalı turist yönlendirmelerini ve İstanbul'a özgü nostaljik sokak lambalarını arayın. Minarelerin çokluğu ve taş kaldırımlı dar sokaklar konumu güçlü şekilde ele verir. Plaka kodu 34 ve Boğaz manzarası kesin ipuçlarıdır.",
    funFact:
      "Kapalıçarşı, dünya'nın en eski ve en büyük kapalı çarşılarından biridir. 1461'den bu yana aralıksız faaliyet gösteren 4.000'den fazla dükkanıyla her gün 250.000-400.000 ziyaretçi ağırlar.",
  },
  "ulus-ankara": {
    about:
      "Ulus, başkent Ankara'nın tarihi merkezi ve cumhuriyetin kuruluş noktasıdır. Ankara Kalesi, Anadolu Medeniyetleri Müzesi ve ilk TBMM binası bu semtte yer alır. Geniş bulvarlar, devlet binaları ve modern-tarihi kontrast Ankara'yı diğer şehirlerden ayırır.",
    strategy:
      "Ulus'ta Atatürk bulvarı üzerindeki geniş kaldırımları, devlet kurumlarına ait binaları ve 06 plaka kodunu arayın. Ankara Kalesi'nin silüeti ve Anıtkabir yönlendirme tabelaları güçlü ipuçlarıdır. Şehrin düz, platoya yayılmış yapısı kıyı şehirlerinden belirgin şekilde ayrılır.",
    funFact:
      "Ankara, dünyadaki en eski sürekli yerleşim yerlerinden biridir. Hitit döneminden (MÖ 2. binyıl) bu yana kesintisiz iskan edilmektedir. Ankara Kalesi içindeki kazılarda Roma, Bizans ve Selçuklu katmanları üst üste bulunmuştur.",
  },
  "konak-izmir": {
    about:
      "Konak, İzmir'in yüzü ve Ege'nin incisi olarak bilinen kıyı şehrin kalbindeki meydandır. Saat Kulesi, Kemeraltı Çarşısı ve kordon boyunca uzanan palmiye ağaçlıklı yürüyüş yolu Konak'ı TürkiyeGuessr'da en tanınır Ege lokasyonlarından biri yapar.",
    strategy:
      "Konak'ta körfez kıyısını takip eden geniş kordon yolunu, palmiye ağaçlarını ve vapur iskelelerini arayın. Kemeraltı'nın dar çarşı sokaklarındaki markiz ve tabelalar karakteristiktir. 35 plaka kodu İzmir'in kesin göstergesidir.",
    funFact:
      "İzmir Saat Kulesi, 1901'de Sultan II. Abdülhamid'in tahta çıkışının 25. yılı için inşa edilmiştir. Mekanizması Fransız yapımıdır ve günde iki kez çalar. Konak Meydanı'ndaki konumuyla İzmir'in en çok fotoğraflanan yapısıdır.",
  },
  "kaleici-antalya": {
    about:
      "Kaleiçi, Antalya'nın surlarla çevrili tarihi merkezidir. Roma dönemi limanı, Osmanlı ahşap konakları, dar taş sokaklar ve Akdeniz'in turkuaz suları burada buluşur. Turist yoğunluğu, marina manzarası ve subtropikal bitki örtüsü Kaleiçi'ni anında tanınabilir kılar.",
    strategy:
      "Kaleiçi'nde surlar içindeki dar taş sokaklarda yürürken Osmanlı evlerinin ahşap çıkmalarına dikkat edin. Marina ve deniz manzarası, palmiyeler ve narenciye ağaçları Akdeniz'e has ipuçlarıdır. Yivli Minare silüeti ve 07 plaka kodu kesin göstergelerdir.",
    funFact:
      "Kaleiçi Limanı, 2.000 yılı aşkın süredir kullanılan dünyanın en eski aktif limanlarından biridir. Roma İmparatoru Hadrianus'un MÖ 130 yılında kente gelişini kutlamak için inşa ettirdiği Hadrianus Kapısı hâlâ ayaktadır.",
  },
  "osmangazi-bursa": {
    about:
      "Osmangazi, Osmanlı İmparatorluğu'nun ilk başkenti Bursa'nın merkezidir. Yeşil Türbe, Ulu Cami, tarihi Koza Han ve Uludağ'ın eteklerindeki konumu ile Bursa Türk tarihinin en önemli şehirlerinden biridir. İpek ticareti geleneği ve termal kaynakları Bursa'ya özgüdür.",
    strategy:
      "Osmangazi'de Uludağ'ın karlı zirvesini arka planda arayın — bu Bursa'nın en güçlü coğrafi ipucudur. Osmanlı dönemi cami ve türbeleri, çınar ağaçları ve 16 plaka kodu konumu kesinleştirir. Tarihi çarşı bölgesindeki han yapıları karakteristiktir.",
    funFact:
      "Bursa'nın Ulu Camii (1399), İslam mimarisinde 20 kubbeye sahip nadir yapılardan biridir. İç duvarlarında 192 farklı hat sanatı eseri bulunur ve bu özelliğiyle dünyadaki en büyük hat sanatı koleksiyonuna ev sahipliği yapar.",
  },
  "uzungol-trabzon": {
    about:
      "Uzungöl, Trabzon'un Çaykara ilçesinde yer alan ve adını heyelan sonucu oluşmuş gölden alan küçük bir vadidır. Yeşil dağlarla çevrili göl manzarası, ahşap yayla evleri, çay bahçeleri ve sis bulutları Uzungöl'ü Karadeniz'in en fotoğrafik lokasyonlarından biri kılar.",
    strategy:
      "Uzungöl'de gölü çevreleyen yolu, dik yamaçlardaki çay bahçelerini ve ahşap pansiyonları arayın. Sis ve bulutların dağ zirvelerini kaplaması Karadeniz'e has bir ipucudur. Yağmurlu hava, yeşilin yoğunluğu ve Hemşin kültürüne ait detaylar konumu daraltır.",
    funFact:
      "Uzungöl'ün bulunduğu Çaykara ilçesi, Türkiye'nin en çok yağış alan bölgelerinden biridir. Yıllık ortalama yağış 2.200 mm'yi bulur — İstanbul'un üç katından fazla. Bu yoğun yağış, bölgenin eşsiz yeşil peyzajının temel sebebidir.",
  },
  "uchisar-nevsehir": {
    about:
      "Uçhisar, Kapadokya'nın en yüksek noktasındaki dev kaya kalesinin etrafında kurulmuş bir kasabadır. Peri bacaları, kaya oyma oteller, sıcak hava balonları ve volkanik tüf oluşumları bu lokasyonu dünyanın hiçbir yerine benzemeyen bir görüntüyle donatır.",
    strategy:
      "Uçhisar'da peri bacalarının siluetini, açık sarı-bej tüf kayalarını ve kaya oyma yapıları arayın. Sabah saatlerinde gökyüzündeki sıcak hava balonları karakteristiktir. 50 plaka kodu (Nevşehir) ve UNESCO Dünya Mirası tabelaları kesin göstergelerdir.",
    funFact:
      "Uçhisar Kalesi, 60 metre yüksekliğindeki dev tüf kayasının içine oyulmuş bir yerleşimdir. Roma ve Bizans dönemlerinde savunma amaçlı kullanılan kalenin iç bölümlerinde odalar, depolar ve su sarnıçları hâlâ görülebilir.",
  },
  "bodrum-mugla": {
    about:
      "Bodrum, Ege'nin güneybatısında beyaz badanalı evleri ve mavi panjurlarıyla ünlü tatil beldesidirdir. Antik Halikarnas'ın üzerinde kurulan şehirde Bodrum Kalesi (St. Peter Kalesi), amfitiyatro kalıntıları ve yat limanı öne çıkar.",
    strategy:
      "Bodrum'da beyaz-mavi boyalı evleri, begonvil çiçeklerini, marina manzarasını ve taş sokaklardaki butik dükkanları arayın. Bodrum Kalesi'nin silüeti ve 48 plaka kodu (Muğla) kesin ipuçlarıdır. Yarımada yapısı ve turkuaz su rengi Akdeniz ve Ege'yi işaret eder.",
    funFact:
      "Bodrum'daki Mausoleum, antik dünyanın yedi harikasından biriydi. Kral Mausolos için MÖ 350'de inşa edilen ve 'mozole' kelimesinin kökenini oluşturan bu yapıdan günümüze sadece temel kalıntıları ulaşmıştır.",
  },
  "safranbolu-karabuk": {
    about:
      "Safranbolu, UNESCO Dünya Mirası Listesi'ndeki Osmanlı evleriyle ünlü tarihi bir kasabadır. 17-19. yüzyıl ahşap konakları, arnavut kaldırımlı sokakları ve geleneksel çarşısıyla zamanda yolculuğa çıkaran bir atmosfer sunar.",
    strategy:
      "Safranbolu'da karakteristik Osmanlı konak cephelerini (ahşap çıkmalar, büyük pencereler) ve arnavut kaldırımlı dar sokakları arayın. Tarihi çarşıdaki bakırcı ve lokumcu dükkanları bölgeye özgü detaylardır. 78 plaka kodu ve UNESCO tabelaları kesin ipuçlarıdır.",
    funFact:
      "Safranbolu ismini, bölgede yetişen ve dünyanın en pahalı baharatı olan safrandan alır. Karabük'ün serin iklimi ve rakımı safran yetiştiriciliğine uygundur. 1 kg safran üretmek için yaklaşık 150.000 çiçeğin elle toplanması gerekir.",
  },
  "artuklu-mardin": {
    about:
      "Artuklu, Mardin'in tarihi merkezidir ve Mezopotamya ovasına bakan bir tepenin yamacına kurulmuş taş şehriyle ünlüdür. Artuklu mimarisi, Süryani kiliseleri, medreseler ve bal rengi kireçtaşından yapılmış evler Mardin'i Türkiye'nin en eşsiz şehirlerinden biri kılar.",
    strategy:
      "Mardin'de taş binalardan oluşan şehir silüetini ve ovaya bakan yamaç yerleşimini arayın. Arapça ve Türkçe çift dilli tabelalar, Süryani kiliseleri ve düz çatılı taş evler karakteristiktir. 47 plaka kodu ve Mezopotamya ovasının dümdüz ufuk çizgisi kesin ipuçlarıdır.",
    funFact:
      "Mardin'in tarihi evlerinde ilginç bir mimari kural vardır: Hiçbir ev, arkasındaki evin manzarasını kapatamaz. Bu yüzden şehir bir amfi tiyatro gibi basamak basamak yükselir ve her evden Mezopotamya ovası görülür.",
  },
  "pamukkale-denizli": {
    about:
      "Pamukkale, beyaz travertenlerinin oluşturduğu doğa harikası teraslarıyla dünyaca ünlüdür. Termal suların binlerce yıl boyunca biriktirdiği kalsiyum karbonat, dağ yamacını pamuk gibi beyaz bir örtüyle kaplamıştır. Tepedeki Hierapolis antik kenti de UNESCO Dünya Mirası'nda.",
    strategy:
      "Pamukkale'de bembeyaz travertenleri, termal havuzları ve antik sütun kalıntılarını arayın. Turist otobüsleri ve ziyaretçi yoğunluğu belirgin ipuçlarıdır. 20 plaka kodu ve termal tesis tabelaları konumu kesinleştirir.",
    funFact:
      "Pamukkale travertenleri yaklaşık 600.000 yıllık bir süreçte oluşmuştur. Termal suyun sıcaklığı yüzeyden çıktığında 36°C'dir. Bölgeyi ziyaret eden yılda 2 milyonun üzerinde turist, beyaz teraslar üzerinde yalınayak yürüme deneyimi yaşar.",
  },
  "goreme-nevsehir": {
    about:
      "Göreme, Kapadokya'nın kalbinde yer alan ve peri bacaları, kaya kiliseleri ve yeraltı şehirleriyle ünlü bir kasabadır. Göreme Açık Hava Müzesi, UNESCO Dünya Mirası olarak tescillidir. Volkanik tüf formasyonlarının arasına gömülü evler ve oteller eşsiz bir görüntü oluşturur.",
    strategy:
      "Göreme'de rengarenk sıcak hava balonlarını, bej-pembe tüf kayaları ve kaya oyma pansiyonları arayın. Açık Hava Müzesi yönlendirme tabelaları ve turist yoğunluğu ipucudur. 50 plaka kodu ve step benzeri kuru arazi Kapadokya'ya işaret eder.",
    funFact:
      "Göreme'nin kaya kiliseleri MS 4-13. yüzyıllar arasında keşişler tarafından oyulmuştur. İçlerindeki Bizans freskleri 1.000 yılı aşkın süredir inanılmaz canlılıkta korunmuştur. Bölgedeki yeraltı şehirleri 20.000 kişiyi barındıracak kapasitedeydi.",
  },
  "efes-izmir": {
    about:
      "Efes (Ephesus), dünyanın en iyi korunmuş antik kentlerinden biri olarak İzmir'in Selçuk ilçesindedir. Celsus Kütüphanesi, Büyük Tiyatro (25.000 kişilik) ve Artemis Tapınağı kalıntıları bu UNESCO Dünya Mirası alanının en bilinen yapılarıdır.",
    strategy:
      "Efes'te devasa antik mermer yapıları, sütun sıraları ve restore edilmiş Roma yollarını arayın. Turist grupları ve tur otobüsleri yoğundur. Selçuk yönlendirme tabelaları ve 35 plaka kodu İzmir bölgesini işaret eder.",
    funFact:
      "Efes'teki Celsus Kütüphanesi, MS 117'de inşa edilmiş ve yaklaşık 12.000 rulo barındırmıştır. Dünyanın üçüncü büyük antik kütüphanesiydi. Cephesi 1970-78 yılları arasında Avusturya arkeologlar tarafından titizlikle yeniden inşa edilmiştir.",
  },
  "fethiye-mugla": {
    about:
      "Fethiye, turkuaz lagunaları, tekne turları ve Likya kaya mezarlarıyla Akdeniz'in en popüler tatil beldelerinden biridir. Ölüdeniz'in mavi bayraklı plajı, Saklıkent Kanyonu ve Kayaköy hayalet kasabası bu bölgenin en dikkat çekici lokasyonlarıdır.",
    strategy:
      "Fethiye'de turkuaz deniz rengini, marina tekne manzarasını ve yamaca oyulmuş Likya kaya mezarlarını arayın. Paraglider silüetleri (Babadağ) ve İngilizce turist tabelaları yoğundur. 48 plaka kodu güneybatı Ege'ye işaret eder.",
    funFact:
      "Ölüdeniz Lagünü, dünyanın en çok fotoğraflanan plajlarından biridir. Her yıl düzenlenen Uluslararası Hava Oyunları Festivali'nde 1.960 metre yüksekliğindeki Babadağ'dan atlayan binlerce yamaç paraşütçüsü bu eşsiz manzaranın üzerinde süzülür.",
  },
  "alanya-antalya": {
    about:
      "Alanya, Akdeniz kıyısında Selçuklu kalesiyle taçlanan bir yarımadadır. Kızılkule, Damlataş Mağarası, Kleopatra Plajı ve tarihi tersane dünyanın dört bir yanından turist çeker. Yaz aylarında sıcaklık 40°C'yi aşabilir.",
    strategy:
      "Alanya'da kaya yarımadası üzerindeki kale surlarını ve kırmızı tuğlalı Kızılkule'yi arayın. Sahil boyunca uzanan otel şeridi ve Rusça/Almanca tabelalar (turist demografisi) güçlü ipuçlarıdır. 07 plaka kodu ve muz seraları Antalya bölgesini gösterir.",
    funFact:
      "Alanya Kalesi, Selçuklu Sultanı I. Alâeddin Keykubad tarafından 1226'da inşa edilmiştir. 6.5 km uzunluğundaki surlar 83 kule ve 140 burçla donatılmıştır. Kızılkule ise Türkiye'nin en iyi korunmuş Selçuklu yapılarından biridir.",
  },
  "side-antalya": {
    about:
      "Side, Akdeniz kıyısında antik tiyatrosu ve Apollon Tapınağı kalıntılarıyla ünlü bir yarımada kasabasıdır. Roma dönemi agorası, çeşmeleri ve sütunlu caddeleri modern tatil tesisleriyle iç içe yaşar. Gün batımında tapınak silüeti Side'nin ikonik görüntüsüdür.",
    strategy:
      "Side'de antik tiyatro kalıntılarını, deniz kenarındaki sütun ve tapınak kalıntılarını arayın. Turist dükkanlarının arasında antik Roma sütunları görmek Side'ye özgüdür. 07 plaka kodu ve sahil manzarası Antalya bölgesini işaret eder.",
    funFact:
      "Side Antik Tiyatrosu, 17.000 kişi kapasitesiyle Anadolu'nun en büyük tiyatrosudur. MS 2. yüzyılda inşa edilmiş olan tiyatro, Roma döneminde gladyatör dövüşlerine de ev sahipliği yapmıştır.",
  },
};

// ==================== REGION-SPECIFIC TEMPLATES ====================

const REGION_INTROS: Record<string, string> = {
  marmara:
    "Marmara Bölgesi, Türkiye'nin en kalabalık ve ekonomik açıdan en gelişmiş bölgesidir. Boğazlar, tarihi yapılar ve modern şehir dokusu burada bir arada bulunur.",
  ege:
    "Ege Bölgesi, antik medeniyetler, zeytin bahçeleri ve turkuaz koylarıyla Batı Türkiye'nin en çekici coğrafyasını sunar.",
  akdeniz:
    "Akdeniz Bölgesi, Toros Dağları'ndan denize inen dramatik coğrafyası, antik kentleri ve turizm merkezleriyle güney Türkiye'nin vitrini.",
  karadeniz:
    "Karadeniz Bölgesi, yemyeşil dağları, yaylaları, derin vadileri ve ahşap evleriyle Türkiye'nin en yeşil coğrafyasını barındırır.",
  ic_anadolu:
    "İç Anadolu Bölgesi, geniş stepleri, volkanik oluşumları ve Anadolu medeniyetlerinin izleriyle Türkiye'nin kalbinde yer alır.",
  dogu_anadolu:
    "Doğu Anadolu Bölgesi, yüksek platoları, karlı dağları ve tarihi yapılarıyla Türkiye'nin en zorlu ve etkleyici coğrafyasıdır.",
  guneydogu:
    "Güneydoğu Anadolu Bölgesi, Mezopotamya mirası, taş mimari ve binlerce yıllık medeniyetlerin izleriyle Türkiye'nin en eski yerleşim alanlarından biridir.",
};

const DIFFICULTY_TIPS: Record<string, string> = {
  easy:
    "Bu lokasyon kolay zorluk seviyesindedir: sokak tabelaları ve belirgin yapılar konumu hızla ele verir. Yeni başlayanlar için ideal bir başlangıç noktasıdır.",
  medium:
    "Orta zorlukta bir lokasyon: çevredeki ipuçlarını dikkatli incelemek gerekir. Tabelalar her zaman net olmayabilir, çevresel detaylara ve coğrafi yapıya odaklanın.",
  hard:
    "Zor seviyede bir lokasyon: kırsal yapı, sınırlı tabela ve az yapılaşma konumu tahmin etmeyi güçleştirir. Arazi yapısı, bitki örtüsü ve iklim gibi doğal ipuçlarına dikkat edin.",
};

const MODE_DESCRIPTIONS: Record<string, string> = {
  urban:
    "Şehir içi (urban) modda daha fazla bina, tabela ve sokak detayı bulunur. Plaka kodları, dükkan isimleri ve trafik işaretleri en faydalı ipuçlarıdır.",
  geo:
    "Coğrafya (geo) modda açık arazi, yol kenarı manzaralar ve doğal peyzaj ön plandadır. Dağ silüetleri, bitki örtüsü ve iklim belirleyici ipuçlarıdır.",
  "urban, geo":
    "Bu lokasyon hem şehir içi (urban) hem coğrafya (geo) modlarında bulunur. Urban modda tabelalar ve binalar, geo modda arazi ve manzara ipuçları öne çıkar.",
  "geo, urban":
    "Bu lokasyon hem coğrafya hem şehir içi modlarında bulunur. Farklı modlarda farklı ipuçları öne çıkar: şehir içinde tabelalar, açık arazide doğal peyzaj.",
};

// ==================== HINT TAG STRATEGY SENTENCES ====================

const HINT_STRATEGIES: Record<string, string> = {
  signage: "Sokak ve yol tabelalarındaki il/ilçe isimlerini okuyarak konumu kesin belirleyebilirsiniz.",
  mosque: "Cami minareleri ve avluları bölgesel mimari farklılıklar gösterir; kubbe ve minare stilini gözlemleyin.",
  historic: "Tarihi yapıların mimari tarzı (Osmanlı, Selçuklu, Roma) dönem ve bölge hakkında ipucu verir.",
  bazaar: "Çarşı ve pazar yerleri yerel ürünler ve el sanatlarıyla bölgeyi ele verir.",
  coastal: "Kıyı çizgisi ve deniz manzarası hangi deniz kıyısında olduğunuzu (Ege, Akdeniz, Karadeniz) daraltır.",
  port: "Liman yapıları ve deniz araçları kıyı şehirlerini iç bölgelerden ayırmanın en kolay yoludur.",
  modern: "Modern bina ve altyapı genellikle büyükşehir veya gelişmiş ilçelere işaret eder.",
  university: "Üniversite kampüsleri genç nüfus ve modern yapılaşmayla konumu daraltmanıza yardımcı olur.",
  industrial: "Sanayi tesisleri ve fabrika bacaları organize sanayi bölgelerine yakınlığa işaret eder.",
  bridge: "Köprüler nehir veya boğaz geçişlerini gösterir; köprü tipi ve boyutu bölgesel ipuçları verir.",
  mountain: "Dağ silüetleri ve yamaç yapısı hangi dağ sisteminde olduğunuzu (Toros, Kaçkar, Uludağ) belirler.",
  forest: "Orman yoğunluğu ve ağaç türleri (çam, kayın, ladin) iklim ve bölge hakkında ipucu verir.",
  lake: "Göl manzarası ve kıyı yapısı Türkiye'nin büyük göllerinden (Van, Burdur, Beyşehir) hangisine yakın olduğunuzu gösterir.",
  river: "Nehir vadileri ve su yapıları (köprüler, barajlar) bölgesel coğrafya hakkında bilgi verir.",
  plateau: "Yayla manzaraları genellikle Karadeniz veya Doğu Anadolu'ya işaret eder.",
  thermal: "Termal tesisler ve sıcak su kaynakları belirli jeotermal bölgelere özgüdür.",
  ancient: "Antik kent kalıntıları Ege ve Akdeniz kıyılarında yoğunlaşır.",
  ruins: "Harabe ve arkeolojik kalıntılar tarihi yerleşim alanlarını ve turist bölgelerini işaret eder.",
  castle: "Kale yapıları ve surlar genellikle stratejik tepelerde konumlanır ve şehir merkezini gösterir.",
  ottoman: "Osmanlı dönemi yapıları (camiler, hanlar, hamamlar) Marmara ve İç Anadolu'da yoğundur.",
  seljuk: "Selçuklu eserleri özellikle Konya, Kayseri ve Sivas civarında görülür.",
  cappadocia: "Peri bacaları ve tüf kayaları Kapadokya bölgesinin benzersiz göstergesidir.",
  stone: "Taş yapı geleneği Güneydoğu Anadolu ve Doğu bölgelerinde yaygındır.",
  mesopotamia: "Düz ovalar ve kireçtaşı yapılar Güneydoğu Anadolu'nun Mezopotamya bölümüne işaret eder.",
  tea: "Çay bahçeleri ve çay ocakları Doğu Karadeniz bölgesinin en karakteristik özelliğidir.",
  snow: "Kar örtüsü yüksek rakım ve kış koşullarına, dolayısıyla Doğu veya iç bölgelere işaret eder.",
  village: "Köy yapısı ve geleneksel mimari kırsal yerleşimleri ve yerel yaşam tarzını yansıtır.",
  rural: "Kırsal manzara ve tarım alanları şehir dışı lokasyonları belirler.",
  volcanic: "Volkanik oluşumlar özellikle Kapadokya ve Doğu Anadolu'da görülür.",
  canyon: "Kanyon yapıları genellikle Akdeniz ve iç bölgelerdeki derin vadilerde karşımıza çıkar.",
  beach: "Plaj yapısı (kum rengi, taşlık/kumluk) hangi kıyıda olduğunuzu ayırt etmenize yardımcı olur.",
  waterfall: "Şelaleler genellikle Karadeniz ve Akdeniz'in dağlık bölgelerinde bulunur.",
  cave: "Mağara oluşumları karstik arazi yapısına işaret eder.",
  island: "Ada yapısı ve feribot bağlantıları kıyı lokasyonlarını belirler.",
};

// ==================== PUBLIC API ====================

export interface CityDescription {
  about: string;
  strategy: string;
  funFact: string | null;
}

/**
 * Returns a unique description for the given city.
 * Hand-written for popular cities, generated for others.
 */
export function getCityDescription(city: CityData): CityDescription {
  // 1. Check hand-written descriptions first
  const handWritten = POPULAR_DESCRIPTIONS[city.slug];
  if (handWritten) return handWritten;

  // 2. Generate unique description from city attributes
  return generateCityDescription(city);
}

function generateCityDescription(city: CityData): CityDescription {
  const regionIntro = REGION_INTROS[city.region] || "";
  const difficultyKey =
    city.qualityScore >= 4 ? "easy" : city.qualityScore >= 3 ? "medium" : "hard";
  const difficultyTip = DIFFICULTY_TIPS[difficultyKey];
  const modeKey = city.modes.join(", ");
  const modeDesc = MODE_DESCRIPTIONS[modeKey] || MODE_DESCRIPTIONS["urban"] || "";

  // Build unique about paragraph
  const about = [
    `${city.district}, ${city.province} ili sınırları içinde ${city.regionDisplayName}'nde yer alır.`,
    regionIntro,
    `Bu lokasyonda ${city.packageCount} farklı Street View noktası bulunur ve ${difficultyKey === "easy" ? "kolay" : difficultyKey === "medium" ? "orta" : "zor"} zorluk seviyesindedir.`,
    city.hintTags.length > 0
      ? `Bölgenin öne çıkan özellikleri arasında ${city.hintTags.slice(0, 4).map(t => HINT_STRATEGIES[t] ? t : t).join(", ")} yer alır.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Build unique strategy paragraph
  const strategyParts = [difficultyTip, modeDesc];
  // Add 2-3 hint-specific strategy sentences
  const relevantHints = city.hintTags
    .filter((t) => HINT_STRATEGIES[t])
    .slice(0, 3);
  for (const hint of relevantHints) {
    strategyParts.push(HINT_STRATEGIES[hint]);
  }
  const strategy = strategyParts.filter(Boolean).join(" ");

  return { about, strategy, funFact: null };
}
