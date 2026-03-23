/**
 * Per-city unique descriptions and strategy tips for SEO content pages.
 *
 * Addresses AdSense "low-value / replicated content" denial and Google
 * "discovered but not indexed" issue by ensuring each city page has
 * unique, substantive text (400-600+ words) beyond the shared template.
 *
 * Approach:
 *  - POPULAR_DESCRIPTIONS: Hand-written for top 30 cities (high traffic)
 *  - generateCityDescription(): Enhanced template using provinceData for
 *    remaining cities — produces 400-500 words of unique content.
 *  - Province-level data (geography, climate, plate code) adds ~100-150
 *    unique words per page automatically.
 */

import type { CityData } from "./seoData";
import { getProvinceInfo } from "./provinceData";

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

  // ==================== 14 YENİ POPÜLER ŞEHİR ====================

  "kadikoy-istanbul": {
    about:
      "Kadıköy, İstanbul'un Anadolu yakasının kültürel ve sosyal merkezi olan canlı bir ilçedir. Tarihi Kadıköy Çarşısı, Moda Sahili, Bahariye Caddesi ve nostaljik tramvay hattıyla İstanbul'un en kozmopolit semtlerinden biridir. Kadıköy iskelesi her gün binlerce yolcunun Avrupa-Asya geçişi yaptığı önemli bir ulaşım noktasıdır. Sokak sanatı, bağımsız kitapçılar ve butik kafeler semtin karakterini oluşturur.",
    strategy:
      "Kadıköy'de tarihi çarşının dar sokaklarındaki balıkçı ve manav tezgâhlarını, Moda sahilindeki deniz manzarasını ve renkli sokak sanatını (graffiti) arayın. Vapur iskelesi ve 'Boğa' heykeli ikonik göstergelerdir. 34 plaka kodu İstanbul'u, Anadolu yakasındaki düz arazi yapısı Kadıköy'ü işaret eder.",
    funFact:
      "Kadıköy'ün antik adı Khalkedon'dur ve MÖ 685'te kurulmuştur — Byzantion'dan (bugünkü Fatih) 17 yıl öncedir. Rivayete göre şehri kuranlar, karşıdaki altın boynuzun (Haliç) değerini fark edemedikleri için 'körler ülkesi' olarak anılmışlardır.",
  },
  "beyoglu-istanbul": {
    about:
      "Beyoğlu, İstanbul'un modern yüzü ve kültürel başkentidir. İstiklal Caddesi, Galata Kulesi, Taksim Meydanı ve Pera Palas Oteli bu ilçeyi Türkiye'nin en ünlü turizm akslarından biri yapar. 19. yüzyıl Avrupa mimarisi, konsolosluk binaları, sanat galerileri ve gece hayatı Beyoğlu'na kozmopolit bir karakter kazandırır.",
    strategy:
      "Beyoğlu'nda İstiklal Caddesi'ndeki nostaljik kırmızı tramvayı, Galata Kulesi'nin konik çatısını ve Art Nouveau bina cephelerini arayın. Yoğun yaya trafiği ve konsolosluk bayrakları belirgin ipuçlarıdır. Taksim Meydanı'ndaki Cumhuriyet Anıtı ve 34 plaka kodu konumu kesinleştirir.",
    funFact:
      "Galata Kulesi 1348'de Ceneviz kolonisi tarafından inşa edilmiş olup 67 metre yüksekliğindedir. Efsaneye göre Hezarfen Ahmed Çelebi 1638'de kuleden takma kanatlarla uçarak Üsküdar'a ulaşmıştır — 3.5 km'lik bu uçuş dünyanın ilk kayıtlı yapay uçuşlarından biridir.",
  },
  "cankaya-ankara": {
    about:
      "Çankaya, Ankara'nın en büyük ve en prestijli ilçesidir. Cumhurbaşkanlığı Külliyesi, Anıtkabir, ODTÜ kampüsü ve Tunalı Hilmi Caddesi bu ilçede yer alır. Devlet kurumlarının yoğunlaştığı diplomatik bölge, modern konut alanları ve üniversite kampüsleri Çankaya'yı Ankara'nın yönetim merkezi yapar.",
    strategy:
      "Çankaya'da geniş devlet bulvarlarını, protokol güvenlik noktalarını ve modern mimariyi arayın. Tunalı Hilmi Caddesi'ndeki kafeler ve Kuğulu Park karakteristik detaylardır. 06 plaka kodu ve düz step arazi üzerindeki modern şehir yapılanması Ankara'yı işaret eder.",
    funFact:
      "Çankaya Köşkü, 1921'den bu yana cumhurbaşkanlığı konutu olarak kullanılmaktadır. Atatürk, burada kalmaya başladığında köşk küçük bir bağ eviydi. Günümüzde 1.150 dönümlük arazisiyle dünyanın en büyük cumhurbaşkanlığı komplekslerinden biridir.",
  },
  "selcuklu-konya": {
    about:
      "Selçuklu, Konya'nın merkez ilçesi ve Selçuklu İmparatorluğu'nun başkentliğini yapmış tarihi bir bölgedir. Mevlâna Müzesi, Alaeddin Tepesi, İnce Minare Medresesi ve Selçuklu dönemi eserleri bu ilçeyi Türkiye'nin en önemli kültürel merkezlerinden biri yapar. Mevlâna'nın türbesi her yıl milyonlarca ziyaretçi çeker ve yeşil türbe kubbesi şehrin simgesidir.",
    strategy:
      "Selçuklu'da Mevlâna Müzesi'nin yeşil konik kubbesini, Selçuklu dönemi taş işçiliği detaylarını ve geniş step ovasını arayın. Konya'nın düz ve uçsuz bucaksız arazi yapısı belirleyicidir. 42 plaka kodu ve Selçuklu yıldız motifli süslemeler konumu daraltır.",
    funFact:
      "Mevlâna Celâleddîn-i Rûmî'nin türbesinin üzerindeki yeşil kubbe, 13. yüzyıldan bu yana Konya'nın silüetini tanımlar. Sema töreni (dönen dervişler) UNESCO Somut Olmayan Kültürel Miras listesindedir ve her yıl Aralık'ta düzenlenen Şeb-i Arus töreni dünya çapında ilgi görür.",
  },
  "manavgat-antalya": {
    about:
      "Manavgat, Antalya'nın doğusunda Manavgat Nehri kıyısında kurulmuş ve doğal güzellikleriyle ünlü bir ilçedir. Manavgat Şelalesi şehrin en bilinen simgesidir. Oymapınar Barajı (Green Canyon), Köprülü Kanyon ve Side antik kenti yakın çevresindedir. Tarım alanları, sera tarımı ve turizm ekonomiyi şekillendirir.",
    strategy:
      "Manavgat'ta geniş nehir yatağını, sera ve narenciye bahçelerini ve Toros Dağları'nın arka plan silüetini arayın. Side antik kenti yönlendirme tabelaları ve turizm tesisleri çevrede yoğundur. 07 plaka kodu ve Akdeniz bitki örtüsü Antalya'yı gösterir.",
    funFact:
      "Manavgat Şelalesi 2 metre yüksekliğinde ama 40 metre genişliğindedir — yüksek olmaktan çok geniş bir şelaledir. Eski 5 TL banknotunun arka yüzünde yer almıştır. Şelalenin etrafındaki piknik alanları yılda 1 milyonun üzerinde ziyaretçi ağırlar.",
  },
  "kusadasi-aydin": {
    about:
      "Kuşadası, Ege kıyısında kruvaziyer turizmiyle ünlü bir tatil beldesidir. Efes antik kentine en yakın liman şehri olması nedeniyle dünya çapından cruise gemileri burada mola verir. Güvercinada Kalesi, Ladies Beach ve Dilek Yarımadası Milli Parkı başlıca cazibe noktalarıdır. Deri ürünleri ve hediyelik eşya mağazaları yoğun turist alışverişine ev sahipliği yapar.",
    strategy:
      "Kuşadası'nda kruvaziyer limanını, sahil boyunca uzanan otel ve restoran şeridini ve Güvercinada Kalesi'nin silüetini arayın. İngilizce, Almanca ve Rusça turist tabelaları belirgindir. 09 plaka kodu (Aydın) ve Ege'ye has zeytin ağaçları bölgeyi işaret eder.",
    funFact:
      "Kuşadası ismi, limanın yanındaki küçük adaya (Güvercinada) konan kuşlardan gelir. Antik dönemde Neopolis (Yeni Şehir) olarak bilinen kasaba, Osmanlı döneminde önemli bir ticaret limanıydı. Bugün yılda 800.000'den fazla kruvaziyer yolcusu ağırlar.",
  },
  "cesme-izmir": {
    about:
      "Çeşme, İzmir'in batı ucunda rüzgâr sörfü, termal kaynakları ve turkuaz plajlarıyla ünlü bir yarımada ilçesidir. Alaçatı mahallesi taş evleri, yel değirmenleri ve butik otelleriyle Türkiye'nin en şık tatil destinasyonlarından biri haline gelmiştir. Ilıca Plajı sığ ve ılık sularıyla aileler için idealdir.",
    strategy:
      "Çeşme'de Alaçatı'nın taş sokaklarındaki begonvil çiçeklerini, yel değirmenlerini ve windsurf yelkenlerini arayın. Marina manzarası ve lüks tatil tesisleri belirgindir. 35 plaka kodu İzmir'i, yarımada coğrafyası ve rüzgârlı kıyılar Çeşme'yi işaret eder.",
    funFact:
      "Alaçatı, dünyanın en iyi rüzgâr sörfü noktalarından biri olarak kabul edilir. Yaz aylarında sürekli esen 'Imbat' rüzgârı ve sığ koy yapısı mükemmel sörf koşulları yaratır. 2000'li yılların başında küçük bir balıkçı köyüyken bugün Türkiye'nin en pahalı gayrimenkul bölgelerinden biri haline gelmiştir.",
  },
  "sirince-izmir": {
    about:
      "Şirince, İzmir'in Selçuk ilçesine bağlı eski bir Rum köyüdür. Taş evleri, dar sokakları, meyve şarapları ve zeytin bahçeleriyle Ege'nin en otantik yerleşimlerinden biridir. 2012'de 'dünyanın sonu' kehaneti nedeniyle dünya medyasına konu olmuş ve o günden beri turist akınına uğramaktadır. Efes antik kentine sadece 8 km uzaklıktadır.",
    strategy:
      "Şirince'de yamaçtaki taş evleri, dar yokuş sokaklardaki hediyelik eşya dükkanlarını ve meyve şarabı satış noktalarını arayın. Köy yapısı, zeytin ve incir ağaçları Ege'ye has detaylardır. 35 plaka kodu ve küçük ölçekli turist kalabalığı konumu daraltır.",
    funFact:
      "Şirince'nin eski adı 'Çirkince' idi; köylüler dışarıdan göç almasın diye kasıtlı olarak çirkin anlamına gelen bu ismi kullanmışlardır. 1926'da Türkiye Cumhuriyeti vali yardımcısı köyü ziyaret edip güzelliğine hayran kalınca adını 'Şirince' (şirin) olarak değiştirmiştir.",
  },
  "halfeti-sanliurfa": {
    about:
      "Halfeti, Şanlıurfa'nın Fırat Nehri kıyısındaki batık şehridir. Birecik Barajı'nın suları altında kalan eski Halfeti yerleşiminin minareleri ve evleri nehrin yüzeyinden görünür — gerçeküstü bir manzara oluşturur. Siyah gül yalnızca burada yetişir ve Halfeti'nin simgesi haline gelmiştir. Rumkale, Fırat'ın kıyısındaki dev kaya kalesinde antik bir yerleşimdir.",
    strategy:
      "Halfeti'de Fırat Nehri'nin turkuaz sularını, yarı batık yapıları ve kayalık kıyıları arayın. Siyah gül satış noktaları ve Rumkale silüeti bölgeye özgü ipuçlarıdır. 63 plaka kodu ve Güneydoğu Anadolu'nun kuru, kayalık arazi yapısı konumu belirler.",
    funFact:
      "Halfeti'nin siyah gülleri dünyada başka hiçbir yerde doğal olarak yetişmez. Gülün siyah rengi, bölgenin toprak pH değeri ve Fırat Nehri'nin yeraltı suyu etkileşiminden kaynaklanır. Gerçekte koyu bordo olan gül, güneş ışığında neredeyse simsiyah görünür.",
  },
  "hasankeyf-batman": {
    about:
      "Hasankeyf, Batman ilinde Dicle Nehri kıyısında 12.000 yıllık kesintisiz yerleşim tarihiyle dünyanın en eski yaşam alanlarından biridir. Ilısu Barajı projesi nedeniyle kısmen sular altında kalan bu antik şehrin kaya mezarları, mağara evleri, ortaçağ köprüsü kalıntıları ve kale kalıntıları hâlâ etkileyici manzaralar sunar. Bazı tarihi yapılar taşınarak kurtarılmıştır.",
    strategy:
      "Hasankeyf'te kayalara oyulmuş mağara evleri, Dicle Nehri kıyısındaki uçurum manzarası ve ortaçağ köprü ayaklarını arayın. Baraj gölünün su seviyesi mevsime göre değişir. 72 plaka kodu ve Güneydoğu'nun kuru, kayalık arazisi Batman'ı işaret eder.",
    funFact:
      "Hasankeyf'teki kaya mezarları ve mağara evleri Neolitik dönemden (MÖ 10.000) kalmadır. Şehir tarih boyunca Roma, Bizans, Emevi, Abbasi, Artuklu ve Osmanlı egemenliğinde kalmıştır. UNESCO adaylık sürecindeyken Ilısu Barajı projesi uluslararası tartışmalara yol açmıştır.",
  },
  "oludeniz-mugla": {
    about:
      "Ölüdeniz, Muğla'nın Fethiye ilçesinde bulunan ve turkuaz lagünüyle dünyaca ünlü bir sahil beldesidir. Mavi Lagün olarak bilinen korunaklı koy, sığ ve berrak sularıyla dünyanın en güzel plajları listelerinde sürekli yer alır. Babadağ'dan yapılan yamaç paraşütü uçuşları bu eşsiz manzarayı havadan görme fırsatı sunar.",
    strategy:
      "Ölüdeniz'de turkuaz lagün manzarasını, gökyüzündeki paraglider silüetlerini ve çam ormanlarıyla çevrili plajı arayın. Turist yoğunluğu çok belirgindir. 48 plaka kodu (Muğla) ve Likya kıyı coğrafyası konumu işaret eder.",
    funFact:
      "Ölüdeniz adını lagünün dalga almayan, 'ölü' gibi sakin sularından alır. Babadağ (1.960 m) dünyanın en popüler yamaç paraşütü noktalarından biridir — deniz seviyesinden zirveye kadar olan irtifa farkı mükemmel uçuş koşulları yaratır.",
  },
  "marmaris-mugla": {
    about:
      "Marmaris, Akdeniz ve Ege'nin buluştuğu noktada çam ormanlarıyla çevrili doğal bir liman şehridir. Marmaris Kalesi, uzun sahil şeridi, marinası ve gece hayatıyla uluslararası turizm destinasyonudur. İçmeler plajı, Cleopatra Adası ve Dalyan'a günübirlik tekne turları bölgenin başlıca aktiviteleridir.",
    strategy:
      "Marmaris'te körfezi çevreleyen dağlık silueti, liman marinasındaki yat ve tekneleri ve sahil boyunca uzanan otel-restoran şeridini arayın. İngilizce turist tabelaları yoğundur. 48 plaka kodu ve çam ormanlarıyla çevrili koy coğrafyası Muğla'yı işaret eder.",
    funFact:
      "Marmaris'in doğal limanı, 1522'de Kanuni Sultan Süleyman'ın Rodos seferinde Osmanlı donanmasının toplanma noktası olmuştur. Efsaneye göre Sultan, kalenin küçüklüğünü görünce 'Mimar, as!' demiş ve bu söz zamanla Marmaris'e dönüşmüştür.",
  },
  "sumela-trabzon": {
    about:
      "Sümela Manastırı, Trabzon'un Maçka ilçesinde 1.200 metre yükseklikte dik bir kayalığa yapışmış Bizans dönemi manastırıdır. MS 386'da kurulan manastır, Pontus döneminin en önemli dini merkezlerinden biriydi. Altındere Vadisi Milli Parkı içinde yer alan yapı, yoğun ormanlar ve şelale manzarasıyla çevrilidir.",
    strategy:
      "Sümela'da dik kayalığa tutunmuş manastır yapısını, yoğun yeşil ormanları ve vadi manzarasını arayın. Milli park tabelaları ve turist otobüsleri belirgindir. 61 plaka kodu ve Karadeniz'e özgü yoğun orman örtüsü Trabzon'u işaret eder.",
    funFact:
      "Sümela Manastırı'nın ana kilisesindeki Bizans freskleri, yüzyıllar boyunca is ve vandalizme rağmen kısmen korunmuştur. Manastırın adı, Yunanca 'Melas' (siyah/karanlık) kelimesinden gelir ve kayalığın karanlık rengine atıfta bulunur. 2010'dan bu yana kapsamlı restorasyon çalışmaları sürmektedir.",
  },
  "akdamar-adasi-van": {
    about:
      "Akdamar Adası, Van Gölü üzerinde küçük bir ada olup 10. yüzyılda inşa edilen Akdamar Kilisesi ile ünlüdür. Surp Haç (Kutsal Haç) Kilisesi, dış cephesindeki İncil'den sahnelerin kabartma olarak işlendiği eşsiz taş işçiliğiyle sanat tarihinin en önemli eserlerinden biridir. Sodalı Van Gölü'nün turkuaz suları ve karlı dağ manzarası kilisenin çevresini tamamlar.",
    strategy:
      "Akdamar'da turkuaz göl suyunu, adanın üzerindeki konik çatılı kilise silüetini ve arka plandaki karlı dağları arayın. Feribot iskelesi ve turist bilgilendirme panoları belirgindir. 65 plaka kodu ve yüksek rakımlı göl manzarası Van'ı işaret eder.",
    funFact:
      "Akdamar efsanesine göre bir keşiş ile bir kız arasındaki aşk hikâyesi adaya adını vermiştir. Kız her gece fener yakarak keşişin yüzerek adaya gelmesine rehberlik edermiş. Bir fırtınalı gecede fener sönmüş, keşiş 'Ah Tamar!' diye haykırarak boğulmuş ve adanın adı Akdamar olarak kalmıştır.",
  },

  // ==================== AKDENİZ BÖLGESİ ====================

  "antakya-hatay": {
    about:
      "Antakya, Asi Nehri kıyısında kurulmuş ve üç büyük dinin birlikte yaşadığı kadim bir şehirdir. Habib-i Neccar Camii, St. Pierre Kilisesi ve tarihi Uzun Çarşı sokakları binlerce yıllık çok kültürlü geçmişi yansıtır. Antakya Arkeoloji Müzesi, dünyanın en zengin Roma dönemi mozaik koleksiyonlarından birine sahiptir. Şehrin dar sokaklarında Arap, Türk ve Ermeni mimarisinin izleri iç içe geçmiştir. Künefe, sükunet ve hoşgörü kültürü Antakya'nın en belirgin kimlikleridir. 2023 depremlerinden sonra yeniden yapılanma süreci devam etmektedir.",
    strategy:
      "Antakya'da Asi Nehri'ni takip eden eski şehir dokusunu, dar çarşı sokaklarını ve çok katlı taş yapıları arayın. Arapça-Türkçe çift dilli dükkan tabelaları ve künefeci dükkanları bölgeye özgüdür. 31 plaka kodu Hatay'ı gösterir. Deprem sonrası yıkım izleri ve inşaat alanları güncel ipuçlarıdır.",
    funFact:
      "Antakya (antik Antioch), Hristiyanlık tarihinde 'Hristiyan' kelimesinin ilk kez kullanıldığı şehirdir. St. Pierre Kilisesi, dünyanın ilk kiliselerinden biri kabul edilir ve kayalara oyulmuş mağara yapısı MS 1. yüzyıla dayanır.",
  },
  "aspendos-antalya": {
    about:
      "Aspendos, Antalya'nın Serik ilçesinde yer alan ve Roma döneminden kalma muhteşem bir tiyatroyla dünyaca tanınan antik kenttir. MS 155 yılında mimar Zenon tarafından inşa edilen Aspendos Tiyatrosu, 15.000 kişi kapasiteli yapısı ve olağanüstü akustiğiyle antik dünyanın en iyi korunmuş tiyatrosudur. Tiyatronun sahne binası neredeyse tamamen ayaktadır. Antik kentin su kemerleri de Anadolu'nun en etkileyici Roma mühendislik eserlerindendir. Köprüçay Nehri kıyısındaki konumu ve çevreleyen pamuk tarlaları Aspendos'un pastoral manzarasını tamamlar.",
    strategy:
      "Aspendos'ta devasa yarım daire biçimli tiyatro yapısını ve ayakta kalan sahne binasını arayın. Çevrede düz tarım arazileri ve Köprüçay Nehri'nin vadisi görülür. Turist otobüs parkı ve bilet gişesi belirgindir. 07 plaka kodu ve Serik yönlendirme tabelaları Antalya bölgesini işaret eder.",
    funFact:
      "Aspendos Tiyatrosu'nun akustiği o kadar mükemmeldir ki sahne merkezinde fısıldanan bir ses, en üst sıradan duyulabilir. Selçuklular döneminde kervansaray olarak kullanılmış olması, yapının korunmasında büyük rol oynamıştır.",
  },
  "cirali-antalya": {
    about:
      "Çıralı, Antalya'nın Kemer ilçesine bağlı, Olympos antik kenti ile Yanartaş (Chimaera) arasında kalan doğal bir sahil köyüdür. 3.2 km uzunluğundaki kumlu plajı, caretta caretta yuvalama alanı olarak koruma altındadır. Narenciye bahçeleri ve çam ormanlarıyla çevrili bungalov pansiyonları kitle turizminden uzak, sakin bir atmosfer sunar. Yanartaş'ta binlerce yıldır sönmeyen doğal gaz alevleri kayalıklardan yükselir. Likya Yolu'nun en popüler etaplarından biri Çıralı'dan geçer.",
    strategy:
      "Çıralı'da geniş kumlu plajı, bungalov tarzı ahşap pansiyonları ve arkadaki dağ silüetini arayın. Caretta caretta uyarı levhaları ve sahildeki tahta bariyerler belirgindir. Asfaltsız toprak yollar ve narenciye ağaçları bölgeye özgüdür. 07 plaka kodu Antalya'ya işaret eder.",
    funFact:
      "Çıralı yakınlarındaki Yanartaş, kayaların arasından çıkan doğal gaz alevleriyle 2.500 yılı aşkın süredir yanmaktadır. Antik Yunan mitolojisindeki Chimaera efsanesinin kaynağı olduğuna inanılır ve eski denizciler bu alevleri doğal deniz feneri olarak kullanmıştır.",
  },
  "dalaman-mugla": {
    about:
      "Dalaman, Muğla'nın batı kesiminde uluslararası havalimanı ve verimli tarım ovalarıyla bilinen bir ilçedir. Dalaman Çayı havzasındaki bereketli topraklar narenciye, pamuk ve nar yetiştiriciliğine olanak tanır. İlçe, Fethiye ve Göcek gibi popüler tatil beldelerine açılan bir kapı niteliğindedir. Dalaman Çayı üzerinde rafting aktiviteleri düzenlenir. Şehir merkezinde küçük bir kasaba atmosferi hakimdir; havalimanı çevresindeki modern gelişim ile iç kesimlerdeki kırsal doku belirgin bir kontrast oluşturur.",
    strategy:
      "Dalaman'da geniş tarım ovalarını, narenciye bahçelerini ve sera alanlarını arayın. Havalimanı yönlendirme tabelaları ve rent-a-car ofisleri belirgindir. 48 plaka kodu Muğla'ya işaret eder. Düz ova yapısı ve nehir yatağı çevredeki dağlık kıyı ilçelerinden ayrışır.",
    funFact:
      "Dalaman Havalimanı, Türkiye'nin en yoğun sezonluk havalimanlarından biridir. Yaz aylarında günlük 200'den fazla uçuş gerçekleştirilir ve yaklaşık 5 milyon yolcu kapasitesine sahiptir. Havalimanı, İngiliz turistlerin Türkiye'ye en çok giriş yaptığı noktalardan biridir.",
  },
  "egirdir-golu-isparta": {
    about:
      "Eğirdir Gölü, Türkiye'nin dördüncü büyük tatlı su gölü olup Isparta ilinin en belirgin coğrafi öğesidir. Göl kıyısındaki Eğirdir kasabası, yarımada üzerindeki Yeşilada ile ünlüdür. Toros Dağları'nın eteklerindeki konumu, elma bahçeleri ve gül tarlaları manzarası bölgeye pastoral bir güzellik katar. Göl suları kerevit avcılığı ve sportif balıkçılık için ünlüdür. St. Paul Yolu, Eğirdir'den geçerek antik Pisidia bölgesini takip eder. Kış aylarında dağların karlı zirveleri göl manzarasına eşlik eder.",
    strategy:
      "Eğirdir'de büyük tatlı su gölünü, gölün içine uzanan Yeşilada yarımadasını ve arkadaki karlı Toros Dağları'nı arayın. Elma bahçeleri ve gül tarlaları Isparta'ya özgüdür. Kasabanın göl kıyısındaki dar sokakları ve balıkçı kayıkları belirgindir. 32 plaka kodu Isparta'yı gösterir.",
    funFact:
      "Eğirdir Gölü'ndeki Yeşilada, aslında göle bir köprüyle bağlı küçük bir yarımadadır. Osmanlı döneminde Rum balıkçı köyü olan ada, günümüzde butik pansiyonları ve balık restoranlarıyla sakin bir kaçış noktasıdır. Gölün yüzölçümü 468 km²'dir.",
  },
  "iskenderun-hatay": {
    about:
      "İskenderun, Büyük İskender'in MÖ 333'te Issos Savaşı zaferini kutlamak için kurduğu liman şehridir. Amanos Dağları'nın eteklerinde İskenderun Körfezi kıyısına yayılmıştır. Sahil kordonundaki palmiye ağaçları, liman vinçleri ve demir-çelik sanayisi şehrin karakterini belirler. Hatay'ın çok kültürlü mutfağı İskenderun'da da kendini gösterir: künefe, humus ve balık burada günlük yaşamın parçasıdır. Şehir, Doğu Akdeniz'in önemli ticaret ve sanayi merkezlerinden biridir.",
    strategy:
      "İskenderun'da körfez kıyısındaki liman tesislerini, büyük sanayi bacalarını ve palmiyeli sahil yolunu arayın. Demir-çelik fabrikaları ve konteyner vinçleri endüstriyel bir silüet oluşturur. 31 plaka kodu Hatay'ı işaret eder. Amanos Dağları'nın yeşil yamacı arka planda belirgindir.",
    funFact:
      "İskenderun Körfezi, Akdeniz'in en sıcak sularına sahip bölgelerinden biridir. Yaz aylarında su sıcaklığı 30°C'yi aşar. Şehrin adı Büyük İskender'den (Alexandretta) gelir ve 1939'a kadar Fransız mandası altındaydı.",
  },
  "kaputas-antalya": {
    about:
      "Kaputaş, Antalya'nın Kaş ilçesi ile Kalkan arasında, yüksek kayalıkların arasına sıkışmış küçük bir koy plajıdır. Turkuaz denizi ve altın sarısı kumu ile Türkiye'nin en fotoğrafik plajlarından biridir. Karayolundan 187 basamaklı merdivenle inilen plaj, iki dik kayalık arasındaki dar bir vadinin denize kavuştuğu noktada yer alır. Kış yağmurlarında vadiden dökülen şelale plajın üstüne akar. Likya Yolu'nun güzergahı Kaputaş'ın tepesinden geçer. Plajın küçük boyutu yaz aylarında kalabalık oluşturur.",
    strategy:
      "Kaputaş'ta iki yüksek kayalık arasındaki dar plajı, turkuaz deniz rengini ve karayolundan inen uzun merdiveni arayın. Yol kenarındaki araç parkı ve fotoğraf çeken turistler belirgindir. Kaş-Kalkan arası kıvrımlı sahil yolu ve 07 plaka kodu Antalya'yı gösterir.",
    funFact:
      "Kaputaş Plajı yalnızca 150 metre genişliğindedir ancak Instagram'da Türkiye'nin en çok paylaşılan plajları arasındadır. Kışın vadiden akan yağmur suları plajda küçük bir şelale oluşturur ve bu manzara yazın tamamen kaybolur.",
  },
  "kekova-antalya": {
    about:
      "Kekova, Antalya'nın Demre ilçesi açığında yer alan ve batık antik kenti ile ünlü bir ada ve körfez bölgesidir. MÖ 2. yüzyıldaki depremlerle kısmen denize gömülen Likya kenti Simena'nın kalıntıları sığ sularda hâlâ görülebilir. Kaleköy'deki Bizans kalesi tepeye hakimdir ve sadece deniz yoluyla ulaşılabilir. Üçağız köyünden kalkan tekne turları bölgenin ana ulaşım biçimidir. Kristal berraklığındaki sular ve kayalık kıyılar Kekova'yı Likya sahilinin mücevheri yapar.",
    strategy:
      "Kekova'da sığ turkuaz sularda görünen batık duvar ve merdiven kalıntılarını arayın. Kaleköy'ün tepesindeki kale ve yamaca dizilmiş evler karakteristiktir. Üçağız'daki balıkçı tekneleri ve tur botları belirgindir. 07 plaka kodu ve Demre yönlendirme tabelaları Antalya'yı işaret eder.",
    funFact:
      "Kekova Batık Şehri, Türkiye'nin ilk özel çevre koruma alanlarından biridir. Bölgede dalış yapmak yasaktır; batık kalıntılar yalnızca cam tabanlı teknelerden veya yüzeyden şnorkelle izlenebilir. Suyun altında 2.000 yılı aşkın yapı kalıntıları uzanır.",
  },
  "kelebek-vadisi-mugla": {
    about:
      "Kelebekler Vadisi (Butterfly Valley), Fethiye'nin güneyinde denizden yalnızca tekneyle veya dik bir patikadan ulaşılabilen doğal bir koydur. Dik kayalıklarla çevrili dar vadi, endemik Jersey kaplan kelebeği (Euplagia quadripunctaria) dahil 80'den fazla kelebek türüne ev sahipliği yapar. Vadi içindeki şelale ve yoğun bitki örtüsü tropikal bir cennet atmosferi yaratır. Sahilde basit çadır kampları ve hamak alanları bulunur. Elektrik şebekesi olmayan vadide doğayla iç içe, dijitalden uzak bir deneyim yaşanır.",
    strategy:
      "Kelebekler Vadisi'nde yüksek kayalıklarla çevrili dar koyu, küçük kumsalı ve tekne iskelelerini arayın. Vadi içindeki patika ve şelale belirgindir. Fethiye'den gelen tur tekneleri koyu doldurur. 48 plaka kodu Muğla'yı işaret eder. Kamp çadırları ve hamaklar vadinin basit yapısını gösterir.",
    funFact:
      "Kelebekler Vadisi'ndeki Jersey kaplan kelebekleri her yaz Rodos Adası ile Fethiye arasında göç eder. Kelebeklerin üreme döneminde vadideki popülasyon milyonlara ulaşır. Vadi, 1995'ten beri birinci derece doğal sit alanı olarak koruma altındadır.",
  },
  "konyaalti-antalya": {
    about:
      "Konyaaltı, Antalya'nın batısında Beydağları'nın eteklerinden Akdeniz'e uzanan uzun çakıl plajıyla ünlü bir ilçedir. 7 km'lik Konyaaltı Sahili, şehir merkezine yakınlığı ve Antalya Müzesi'nin varlığıyla hem yerli hem yabancı turistlerin gözdesidir. Sahil boyunca parklar, bisiklet yolları, kafeler ve sosyal tesisler uzanır. Beydağları Sahil Milli Parkı ilçenin batısında başlar. Modern konut projeleri ve üniversite yerleşkesi Konyaaltı'yı Antalya'nın gelişen yaşam alanlarından biri yapmıştır.",
    strategy:
      "Konyaaltı'da uzun çakıl plajını, arka plandaki Beydağları silüetini ve sahil boyunca dizilen modern binaları arayın. Antalya Müzesi tabelası ve tramvay hattı belirgindir. Beach Park alanındaki kafeler ve cam kuleler karakteristiktir. 07 plaka kodu Antalya'yı gösterir.",
    funFact:
      "Konyaaltı adı, 'Konya'nın altı' anlamına gelir; çünkü Selçuklu döneminde Konya'dan güneye inen yolun son durağı burasıydı. Sahilin çakıl yapısı, Beydağları'ndan yüzyıllarca taşınan kireçtaşı parçacıklarından oluşmuştur.",
  },
  "koprulu-kanyon-antalya": {
    about:
      "Köprülü Kanyon, Antalya'nın Manavgat ilçesinde Köprüçay Nehri'nin derin bir vadi oyduğu 14 km uzunluğunda bir kanyondur. Milli park statüsündeki alan, rafting sporlarının Türkiye'deki en popüler merkezidir. Kanyon içinde Roma dönemine ait Oluk Köprü ve Büğrüm Köprü iki bin yıldır ayaktadır. Akdeniz servi ve sedir ormanları kanyonun yamaçlarını kaplar. Selge antik kenti kanyon yukarısındaki yaylada yer alır. Kanyonun derinliği bazı noktalarda 400 metreyi bulur.",
    strategy:
      "Köprülü Kanyon'da derin yeşil vadideki nehri, rafting botlarını ve tarihi taş köprüleri arayın. Kanyon girişindeki rafting acentaları ve ekipman parkları belirgindir. Dar virajlı orman yolları ve milli park levhaları ipucudur. 07 plaka kodu ve Manavgat yönlendirme tabelaları Antalya'yı gösterir.",
    funFact:
      "Köprülü Kanyon'daki Roma köprüleri, 2.000 yılı aşkın süredir kesintisiz kullanımdadır ve hâlâ araç trafiğine açıktır. Kanyon, yılda 500.000'den fazla rafting tutkununun akın ettiği Türkiye'nin bir numaralı rafting destinasyonudur.",
  },
  "lara-antalya": {
    about:
      "Lara, Antalya'nın doğusunda Düden Şelalesi'nin denize döküldüğü noktadan başlayan uzun kumlu plajıyla bilinen bir bölgedir. 'Türkiye'nin Las Vegas'ı' lakaplı sahil şeridi, tematik mimari konseptli beş yıldızlı otelleriyle ünlüdür. Aşağı Düden Şelalesi kayalıktan doğrudan Akdeniz'e dökülür ve tekne turlarından izlenir. Lara plajı ince kumlu yapısıyla Konyaaltı'nın çakıl plajından farklıdır. Bölge, all-inclusive tatil kültürünün Antalya'daki merkezidir.",
    strategy:
      "Lara'da geniş kumlu plajı, büyük all-inclusive otel komplekslerini ve tematik cephe mimarilerini arayın. Düden Şelalesi'nin denize döküldüğü kayalık belirgindir. Rusça ve Almanca yazılmış otel ve restoran tabelaları turistik bölgeyi ele verir. 07 plaka kodu Antalya'yı gösterir.",
    funFact:
      "Aşağı Düden Şelalesi, 40 metre yükseklikten doğrudan Akdeniz'e dökülen nadir şelalelerdendir. Şelalenin arkasındaki mağaradan geçilerek perde gibi akan suyun arkasından deniz manzarası izlenebilir.",
  },
  "merkez-isparta": {
    about:
      "Isparta, Göller Bölgesi'nin kalbinde gül yetiştiriciliğiyle dünyaya nam salmış bir Anadolu şehridir. Türkiye'nin gül yağı üretiminin yüzde 65'i Isparta'dan karşılanır. Şehir merkezinde Ulu Cami, Firdevs Paşa Camii ve tarihi bedesten dikkat çeker. Süleyman Demirel Üniversitesi şehre canlı bir genç nüfus kazandırmıştır. Isparta halıcılığı yüzyıllık bir gelenek olup el dokuması halılar hâlâ üretilmektedir. Burdur Gölü ve Eğirdir Gölü arasındaki konumu şehre eşsiz bir coğrafi çerçeve sunar.",
    strategy:
      "Isparta'da gül tarlalarını (mayıs-haziran), gül yağı fabrikalarını ve geleneksel çarşı yapısını arayın. Şehir merkezinin orta ölçekli Anadolu kasabası görünümü belirgindir. Üniversite tabelaları ve 32 plaka kodu Isparta'yı kesinleştirir. Göl manzaraları çevre yollarında görülür.",
    funFact:
      "Isparta'da her yıl mayıs ayında toplanan gül çiçeklerinden elde edilen gül yağı, gramı altından pahalıdır. 1 kg gül yağı üretmek için yaklaşık 3.500 kg gül yaprağı gerekir. Isparta gül yağı başta Fransa olmak üzere dünya parfüm endüstrisine ihraç edilir.",
  },
  "muratpasa-antalya": {
    about:
      "Muratpaşa, Antalya'nın merkez ilçesi olup şehrin idari, ticari ve sosyal kalbini oluşturur. Kaleiçi, Hadrian Kapısı, Yivli Minare ve eski liman bu ilçe sınırları içindedir. Işıklar Caddesi'ndeki alışveriş alanı, Karaalioglu Parkı'nın falezler üzerindeki konumu ve Atatürk Parkı şehir yaşamının merkezleridir. Modern AVM'ler ile tarihi doku yan yana yaşar. Muratpaşa'nın nüfusu 500.000'i aşar ve Antalya'nın en yoğun ilçesidir.",
    strategy:
      "Muratpaşa'da Antalya'nın modern şehir merkezini, geniş bulvarları ve falezler üzerindeki parkları arayın. Yivli Minare silüeti, tramvay hattı ve büyük AVM binaları belirgindir. Kaleiçi surları ve liman manzarası Muratpaşa sınırlarındadır. 07 plaka kodu kesin göstergedir.",
    funFact:
      "Muratpaşa adını, ilçedeki 13. yüzyıl Selçuklu beylerinden Murat Paşa'dan alır. İlçenin Karaalioglu Parkı'ndan izlenen Akdeniz gün batımı, Antalya'nın en ünlü manzaralarından biridir ve falezlerin yüksekliği 35 metreyi bulur.",
  },
  "olimpos-antalya": {
    about:
      "Olimpos, Antalya'nın Kumluca ilçesinde antik Likya kentinin kalıntılarıyla iç içe geçmiş alternatif bir tatil beldesidir. Olimpos Antik Kenti, nehir yatağının iki yakasında Roma ve Bizans dönemi kalıntılarıyla örülüdür. Sahile ulaşmak için antik kent içinden geçilir. Ağaç evler (treehouse) konseptli pansiyonlar Olimpos'un simgesi olmuştur. Nehir ağzındaki kumlu plaj ve yoğun çam ormanları doğa tutkunlarını çeker. Likya Yolu'nun önemli bir durağıdır.",
    strategy:
      "Olimpos'ta antik kalıntılar arasından geçen patikayı, ağaç ev pansiyonlarını ve nehir yatağını arayın. Sahile giden yolun iki tarafındaki antik duvar kalıntıları ve sarmaşıklar karakteristiktir. Ağaç ev tabelaları ve sırt çantalı gezginler belirgindir. 07 plaka kodu Antalya'yı gösterir.",
    funFact:
      "Olimpos'un ağaç ev kültürü 1990'larda başlamıştır. Ağaçların arasına kurulan basit kulübeler zamanla Türkiye'nin en popüler sırt çantalı gezgin durağına dönüşmüştür. Antik kentteki Roma hamamının mozaik zemini hâlâ büyük ölçüde sağlamdır.",
  },
  "onikisubat-kahramanmaras": {
    about:
      "Onikişubat, Kahramanmaraş'ın merkez ilçesidir ve adını şehrin 12 Şubat 1920'deki kurtuluş gününden alır. Ahır Dağı eteklerindeki konumu, tarihi Kapalı Çarşı ve Ulu Cami şehre Anadolu'ya özgü bir atmosfer katar. Kahramanmaraş, meşhur dondurması ve biberinin ötesinde termal kaynakları, yaylaları ve zengin el sanatlarıyla bilinir. 2023 depremlerinin merkez üssüne yakın konumu nedeniyle şehir büyük yıkım yaşamıştır. Yeniden inşa süreci kentin çehresini değiştirmektedir.",
    strategy:
      "Onikişubat'ta Ahır Dağı silüetini, geleneksel Anadolu çarşı yapısını ve orta büyüklükte bir şehir görünümünü arayın. Dondurma dükkanları ve biber kurutma tezgahları bölgeye özgü detaylardır. 46 plaka kodu Kahramanmaraş'ı gösterir. Deprem sonrası yeni yapılar ve konteyner yerleşimler güncel ipuçlarıdır.",
    funFact:
      "Kahramanmaraş dondurması, salep ve keçi sütünden yapılır ve o kadar yoğun kıvamlıdır ki bıçakla kesilir. Dondurma ustalarının müşterilere şaka yaparak dondurma uzatıp geri çekme geleneği dünyaca ünlüdür. Şehir, 2023 depremlerinden sonra 'Kahraman' adını bir kez daha hak etmiştir.",
  },
  "patara-antalya": {
    about:
      "Patara, Antalya'nın Kaş ilçesinde hem antik Likya kentini hem de Türkiye'nin en uzun kesintisiz kumlu plajını barındıran eşsiz bir lokasyondur. Patara Antik Kenti, Likya Birliği'nin meclis binası, anıtsal kapısı ve Roma hamamıyla öne çıkar. 18 km uzunluğundaki kumsalı caretta caretta yuvalama alanı olarak koruma altındadır; bu nedenle plajda yapılaşma yoktur. Noel Baba olarak bilinen Aziz Nikolaos'un doğum yeri Patara'dır. Kum tepeleri ve antik kalıntılar plajın hemen gerisinde iç içe geçer.",
    strategy:
      "Patara'da uçsuz bucaksız kumlu plajı, kum tepelerini ve arka plandaki antik kemer ve sütun kalıntılarını arayın. Caretta caretta koruma levhaları ve yapılaşma yasağı plajın bomboş görünmesine neden olur. Milli park giriş kapısı ve 07 plaka kodu Antalya'yı gösterir.",
    funFact:
      "Patara Antik Kenti'ndeki meclis binası (bouleuterion), dünyanın bilinen ilk demokratik parlamento yapısı olarak kabul edilir. Likya Birliği'nin temsili oy sistemi, ABD Anayasası'nın hazırlanmasında esin kaynağı olmuştur.",
  },
  "saklikent-mugla": {
    about:
      "Saklıkent Kanyonu, Muğla'nın Fethiye ilçesinde 300 metre derinliğe ulaşan ve 18 km uzunluğundaki Türkiye'nin en uzun ve en derin kanyonlarından biridir. Eşen Çayı'nın milyonlarca yıl boyunca kireçtaşını oymasıyla oluşmuştur. Kanyon girişindeki asma yürüyüş yolları ve buz gibi soğuk dere suyu ziyaretçileri karşılar. Kanyon boyunca yürümek yer yer bele kadar su içinden geçmeyi gerektirir. Girişteki nehir kenarı restoranlar, ayakları suya değen platformlarda hizmet verir.",
    strategy:
      "Saklıkent'te dar ve derin kanyon yapısını, asma köprüleri ve kayalık duvarlar arasındaki dar geçitleri arayın. Kanyon girişindeki ahşap platform restoranlar ve su üzerindeki yastıklı oturma alanları çok karakteristiktir. 48 plaka kodu Muğla'yı işaret eder. Fethiye yönlendirme tabelaları belirgindir.",
    funFact:
      "Saklıkent Kanyonu'ndaki su sıcaklığı yaz ortasında bile 8-10°C civarındadır. Kanyonun en dar noktasında iki duvar arasındaki mesafe sadece 2 metredir. Adı 'gizli şehir' anlamına gelir ve 1986'ya kadar keşfedilmemiş durumdaydı.",
  },
  "salda-golu-burdur": {
    about:
      "Salda Gölü, Burdur ilinin Yeşilova ilçesinde yer alan ve 'Türkiye'nin Maldivleri' olarak anılan krater gölüdür. Beyaz kıyıları ve turkuaz suyu NASA'nın Mars araştırmalarında referans olarak kullanılmıştır; gölün hidromagnezit yapısı Mars'taki Jezero Krateri ile benzerlik gösterir. Gölün derinliği 196 metreye ulaşır ve suyu içilebilir berraklıktadır. Çevresindeki çam ormanları ve beyaz kumsal alanları piknik ve yüzme için idealdir. 2020'den itibaren koruma önlemleri artırılarak araç girişi kısıtlanmıştır.",
    strategy:
      "Salda Gölü'nde bembeyaz kıyı şeridini, turkuaz göl suyunu ve çevreleyen çam ormanlarını arayın. Beyaz hidromagnezit kumsal diğer göllerden farklıdır. Koruma bariyerleri ve 'Özel Çevre Koruma' levhaları belirgindir. 15 plaka kodu Burdur'u gösterir.",
    funFact:
      "Salda Gölü, NASA'nın Mars keşif aracı Perseverance'ın iniş noktası olan Jezero Krateri ile jeolojik yapı benzerliği taşıyan dünya üzerindeki sayılı göllerden biridir. Bilim insanları Mars'taki yaşam izlerini araştırmak için Salda'daki mikrobiyalitleri incelemektedir.",
  },
  "seyhan-adana": {
    about:
      "Seyhan, Adana'nın merkez ilçesi olup Seyhan Nehri kıyısında şehrin kalbini oluşturur. Taşköprü (Roma dönemi köprüsü), Sabancı Merkez Camii, Atatürk Parkı ve tarihi Büyük Saat Kulesi ilçenin önemli yapılarıdır. Çukurova ovasının merkezindeki konumu Adana'yı tarım ve sanayi şehri yapmıştır. Adana kebabı, şalgam suyu ve acılı mutfak kültürü şehrin DNA'sıdır. Yaz sıcaklıkları 45°C'yi bulabilir. Seyhan Baraj Gölü şehrin kuzeyinde rekreasyon alanı olarak kullanılır.",
    strategy:
      "Seyhan'da geniş nehir yatağını, Taşköprü'nün Roma kemerlerini ve Sabancı Camii'nin devasa kubbesini arayın. Düz Çukurova ovası ve sanayi alanları belirgindir. Kebapçı ve şalgamcı tabelaları Adana'ya özgüdür. 01 plaka kodu Türkiye'nin ilk plaka numarasıdır.",
    funFact:
      "Adana Taşköprü, MS 2. yüzyılda Roma İmparatoru Hadrianus döneminde inşa edilmiş ve hâlâ yaya trafiğine açık olan dünyanın en eski kullanımdaki taş köprülerinden biridir. 310 metre uzunluğundaki köprü, Seyhan Nehri üzerinde 21 kemerle yükselir.",
  },
  "tarsus-mersin": {
    about:
      "Tarsus, Mersin iline bağlı olup Kleopatra ve Marcus Antonius'un buluştuğu, Aziz Paulus'un doğduğu antik bir şehirdir. Tarsus Şelalesi şehir merkezinin içinde akar ve Roma dönemi yolu Kleopatra Kapısı hâlâ ayaktadır. Eski Tarsus evleri, tarihi çarşısı ve Ulu Cami Osmanlı-Roma-Bizans katmanlarını bir arada sunar. Çukurova'nın verimli toprakları narenciye ve pamuk tarımını destekler. Makam-ı Danyal Peygamber türbesi üç dinin saygı gösterdiği bir ziyaret noktasıdır.",
    strategy:
      "Tarsus'ta şehir içindeki şelaleyi, tarihi taş evleri ve Kleopatra Kapısı'nın kemerli yapısını arayın. Tarsus Çarşısı'ndaki dar sokaklar ve esnaf dükkanları belirgindir. 33 plaka kodu Mersin'i gösterir. Narenciye bahçeleri ve düz ova yapısı Çukurova'ya işaret eder.",
    funFact:
      "Tarsus Şelalesi, bir şehir merkezinin tam ortasında akan nadir doğa harikalarından biridir. Şelalenin suyu Berdan Nehri'nden gelir. Kleopatra'nın Marcus Antonius ile MÖ 41'de buluşmak için Tarsus'a geldiği rivayet edilir ve Kleopatra Kapısı bu buluşmanın sembolüdür.",
  },
  "termessos-antalya": {
    about:
      "Termessos, Antalya'nın 34 km kuzeybatısında Güllük Dağı'nın 1.050 metre yüksekliğindeki zirvesine kurulmuş antik bir Pisidya şehridir. Büyük İskender'in bile fethedemediği bu dağ kalesi, yoğun sedir ormanları arasında gizlenmiştir. Tiyatrosu, Bulkasını Toros Dağları manzaralı muhteşem konumuyla antik dünyanın en dramatik tiyatrolarından biridir. Nekropol alanındaki devrilmiş lahitler ve taşınmamış kalıntılar Termessos'a 'dokunulmamış antik kent' unvanını kazandırmıştır.",
    strategy:
      "Termessos'ta dağ yolundaki sedir ormanlarını, kayalık zirvedeki antik kalıntıları ve devrilmiş lahitleri arayın. Güllük Dağı Milli Parkı levhası ve dik tırmanış yolu belirgindir. Tiyatrodaki dağ manzarası eşsizdir. 07 plaka kodu ve milli park tabelaları Antalya'yı gösterir.",
    funFact:
      "Büyük İskender MÖ 333'te Termessos'u kuşatmış ancak şehrin dağ tepesindeki konumu ve sarp kayalıkları nedeniyle fethetmekten vazgeçmiştir. Şehri 'kartal yuvası' olarak nitelendirmiştir. Termessos, restore edilmeden doğal haliyle bırakılan nadir antik kentlerdendir.",
  },
  "toros-daglari": {
    about:
      "Toros Dağları, Türkiye'nin güneyini batıdan doğuya boydan boya kaplayan devasa sıra dağlardır. Akdeniz kıyısı ile Anadolu platosu arasında doğal bir bariyer oluşturur. Batı Toroslar, Orta Toroslar ve Güneydoğu Toroslar olmak üzere üç bölüme ayrılır. Sedir ve karaçam ormanları, yüksek yaylalar, derin kanyonlar ve buzul gölleri bu dağ sisteminin zenginliğini oluşturur. Yörük göçebe kültürü Torosların yayla geleneğinde yaşamaya devam eder. En yüksek noktası Aladağlar'daki Demirkazık zirvesidir (3.756 m).",
    strategy:
      "Toros Dağları'nda yüksek karlı zirveleri, sedir ormanlarını ve virajlı dağ yollarını arayın. Yayla yerleşimleri, keçi sürüleri ve Yörük çadırları dağ yaşamının ipuçlarıdır. Akdeniz kıyısından bakıldığında dağ silüeti arka planda sürekli görünür. Tünel geçitleri ve heyelan uyarı levhaları dağ yollarında belirgindir.",
    funFact:
      "Toros Dağları'nın adı, Latince 'Taurus' (boğa) kelimesinden gelir. Antik çağda dağların boğanın sırtına benzetildiği düşünülür. Aladağlar bölgesindeki Yedigöller, buzul döneminden kalma 7 krater gölüyle Türkiye'nin en yüksek göl grubunu oluşturur.",
  },
  "yenisehir-mersin": {
    about:
      "Yenişehir, Mersin'in modern merkez ilçesidir ve Akdeniz kıyısında planlı şehircilik örneği olarak gelişmiştir. Mersin Marina, Atatürk Parkı sahil şeridi ve Forum Mersin gibi büyük alışveriş merkezleri ilçenin çağdaş yüzünü oluşturur. Mersin Limanı Türkiye'nin en büyük konteyner limanıdır ve şehir ekonomisinin lokomotifidir. Geniş bulvarlar, palmiye ağaçları ve modern binalar Yenişehir'e planlı bir Akdeniz şehri görünümü kazandırır. Mersin Üniversitesi şehre akademik bir dinamizm katar.",
    strategy:
      "Yenişehir'de geniş sahil bulvarını, palmiye ağaçlarını ve modern şehir silüetini arayın. Mersin Limanı'nın büyük vinçleri ve konteyner alanları deniz tarafında belirgindir. 33 plaka kodu Mersin'i gösterir. Düz arazi yapısı ve planlı geniş caddeler Çukurova bölgesini işaret eder.",
    funFact:
      "Mersin, Türkiye'nin en genç illerinden biridir; 2002'de İçel adıyla anılan il, adını Mersin olarak değiştirmiştir. Mersin Limanı yılda 2 milyonun üzerinde konteyner elleçler ve Türkiye'nin Akdeniz'e açılan en büyük ticaret kapısıdır.",
  },

  // ==================== EGE BÖLGESİ ====================

  "alsancak-izmir": {
    about:
      "Alsancak, İzmir'in en canlı ve kozmopolit semtidir. Kordon Boyu, Kıbrıs Şehitleri Caddesi ve 1. Kordon'daki tarihi taş binalar semtin karakterini belirler. Eski Rum ve Levanten evleri, butik oteller, barlar sokağı ve kafeler Alsancak'ı İzmir'in eğlence ve kültür merkezi yapar. Her akşam Kordon'da yürüyüş yapan İzmirliler semtin ritüelini oluşturur. Alsancak Garı'nın tarihi cephesi ve İzmir Körfezi manzarası semtin iki önemli simgesidir.",
    strategy:
      "Alsancak'ta Kordon Boyu'ndaki geniş yürüyüş yolunu, palmiye ağaçlarını ve körfez manzarasını arayın. Tarihi taş binalardaki kafe ve bar tabelaları belirgindir. Kıbrıs Şehitleri Caddesi'ndeki yoğun yaya trafiği ve 35 plaka kodu İzmir'i gösterir. Alsancak Garı'nın cephesi karakteristik bir ipucudur.",
    funFact:
      "Alsancak Garı, 1858'de İngiliz mühendisler tarafından inşa edilmiş ve Osmanlı İmparatorluğu'nun ilk demiryolu hatlarından birinin başlangıç noktasıdır. İzmir-Aydın demiryolu Türkiye'nin en eski tren hattı olma özelliğini taşır.",
  },
  "bafa-golu-mugla": {
    about:
      "Bafa Gölü, Muğla ile Aydın sınırında Beşparmak Dağları'nın eteklerinde yer alan doğa harikası bir gördür. Antik çağda Ege Denizi'nin bir körfezi olan alan, alüvyon birikintileriyle denizden koparak göle dönüşmüştür. Göl kıyısındaki Herakleia antik kenti, suya yansıyan tapınak kalıntıları ve Bizans manastırlarıyla eşsiz bir atmosfer sunar. Bafa, göçmen kuşlar için önemli bir konaklama noktasıdır ve pelikan, flamingo gibi türler gözlemlenir. Zeytin ağaçları göl kıyısını çevreler.",
    strategy:
      "Bafa Gölü'nde geniş göl yüzeyini, Beşparmak Dağları'nın kayalık zirvelerini ve kıyıdaki antik kalıntıları arayın. Zeytin ağaçları ve balıkçı kayıkları belirgindir. Kuş gözlem platformları ve doğa koruma levhaları bölgeye özgüdür. 48 plaka kodu Muğla'yı gösterir.",
    funFact:
      "Bafa Gölü, yaklaşık 2.000 yıl önce Büyük Menderes Nehri'nin alüvyonlarıyla Ege Denizi'nden ayrılmıştır. Antik dönemde Latmos Körfezi olarak bilinen alan bir deniz limanıydı. Herakleia antik kentindeki Athena Tapınağı kalıntıları hâlâ göl kıyısında ayaktadır.",
  },
  "bergama-izmir": {
    about:
      "Bergama, İzmir'in kuzeyinde antik Pergamon Krallığı'nın başkenti üzerine kurulmuş tarihi bir ilçedir. Akropol tepesindeki antik tiyatro, Trajaneum tapınağı ve kütüphane kalıntıları UNESCO Dünya Mirası Listesi'ndedir. Asklepion sağlık merkezi antik dünyanın en ünlü tedavi merkezlerinden biriydi. Kızıl Avlu (Serapis Tapınağı) şehir merkezinde devasa boyutlarıyla dikkat çeker. Bergama halıcılığı ve geleneksel çarşısı Osmanlı dönemi dokusunu yaşatır. Kozak Yaylası'nda fıstıkçamı ormanları ilçenin doğal zenginliğidir.",
    strategy:
      "Bergama'da tepe üzerindeki akropol kalıntılarını, Kızıl Avlu'nun kırmızı tuğla duvarlarını ve geleneksel çarşıdaki el dokuması halı tabelalarını arayın. UNESCO Dünya Mirası levhaları ve tur otobüsleri belirgindir. 35 plaka kodu İzmir'i gösterir. Kozak yaylasının çam ormanları kuzey kesimde görülür.",
    funFact:
      "Bergama, parşömenin (pergament) icat edildiği şehirdir. MÖ 2. yüzyılda Mısır'ın papirüs ihracatını kesmesi üzerine Bergama Kütüphanesi hayvan derisinden yazı malzemesi geliştirmiş, bu buluş 'pergamena' adını almıştır.",
  },
  "bornova-izmir": {
    about:
      "Bornova, İzmir'in en kalabalık ilçelerinden biri olup Ege Üniversitesi kampüsünün varlığıyla genç ve dinamik bir nüfusa sahiptir. Osmanlı döneminde Levanten ailelerin yaşadığı Bornova Köşkleri, tarihi bir miras olarak korunmaktadır. Büyük Park (Bornova Çınar Altı) semtin sosyal merkezi olup yüzyıllık çınar ağaçlarıyla ünlüdür. Modern alışveriş merkezleri, hastaneler ve eğitim kurumları Bornova'yı İzmir'in yaşam merkezi yapmıştır. İlçe ovadan dağ eteklerine doğru yayılır.",
    strategy:
      "Bornova'da Ege Üniversitesi kampüs girişini, geniş bulvarları ve modern-tarihî yapı kontrastını arayın. Levanten köşklerinin Avrupa tarzı cepheleri ve Büyük Park'ın çınar ağaçları belirgindir. 35 plaka kodu ve üniversite tabelaları İzmir'i gösterir.",
    funFact:
      "Bornova'daki Levanten köşkleri, 19. yüzyılda İzmir'de yaşayan Avrupalı tüccar ailelerin yaz sayfiyeleriydi. Whitall, Giraud ve Paterson gibi ailelerin konakları neo-klasik mimarileriyle Anadolu'da eşsiz bir Avrupa dokusu oluşturur.",
  },
  "buca-izmir": {
    about:
      "Buca, İzmir'in güneydoğusunda yer alan ve Osmanlı döneminde Rum, Ermeni ve Levanten toplulukların birlikte yaşadığı kozmopolit bir ilçedir. Hasanağa Bahçesi, tarihi kiliseler ve taş evler semtin çok kültürlü geçmişini yansıtır. Dokuz Eylül Üniversitesi kampüsü ilçeye akademik bir canlılık katar. Buca, İzmir'in hızla büyüyen yerleşim alanlarından biri olup Gediz ovası ile dağ etekleri arasında yayılır. Yerel pazarı ve mahalleleri Anadolu kasaba kültürünü kentsel dokuyla harmanlayan yapıdadır.",
    strategy:
      "Buca'da yoğun konut dokusunu, üniversite kampüs alanlarını ve ova ile dağ geçişini arayın. Tarihi Rum kiliseleri ve taş evlerin arasındaki modern apartmanlar kontrastı belirgindir. 35 plaka kodu İzmir'i gösterir. Hasanağa Bahçesi'nin yeşil alanı ve meydan düzeni ipucudur.",
    funFact:
      "Buca'nın Hasanağa Bahçesi, Osmanlı döneminde Levanten ailelerin piknik ve sosyal etkinlik alanıydı. 19. yüzyılda İzmir'in en prestijli mesire yerlerinden biriydi ve bugün hâlâ İzmir'in en büyük kamusal yeşil alanlarından biri olarak kullanılmaktadır.",
  },
  "didim-aydin": {
    about:
      "Didim, Aydın'ın Ege kıyısındaki ilçesi olup Altınkum plajı ve Apollon Tapınağı ile ünlüdür. Didyma Apollon Tapınağı, antik dünyanın en büyük tapınaklarından biri olarak devasa Medusa kabartmasıyla bilinir. Altınkum adını altın rengindeki ince kumundan alır ve İngiliz emekli topluluğunun yoğun olarak yaşadığı bir bölgedir. Akbük koyu ve Bafa Gölü'ne yakınlığı doğal güzellikleri artırır. Zeytincilik ve balıkçılık yöre ekonomisinin temelini oluşturur.",
    strategy:
      "Didim'de devasa antik tapınak sütunlarını, Altınkum'un sarı kumlu plajını ve İngilizce yazılmış emlak ile restoran tabelalarını arayın. İngiliz expatlar için yazılmış 'English pub' ve 'fish & chips' tabelaları dikkat çekicidir. 09 plaka kodu Aydın'ı gösterir.",
    funFact:
      "Didyma Apollon Tapınağı'ndaki Medusa başı kabartması, 2 metre çapında ve antik dünyanın en büyük Medusa tasvirlerinden biridir. Tapınak tamamlanamamış olmasına rağmen 122 sütun planlanmış, yalnızca 3'ü tam yüksekliğine ulaşmıştır.",
  },
  "dilek-yarimadasi-aydin": {
    about:
      "Dilek Yarımadası, Aydın'ın Kuşadası ilçesinde Ege'ye uzanan ve milli park statüsüyle korunan bir doğa cennetidir. Samsun Dağı'nın 1.237 metrelik zirvesi yarımadaya hakimdir. Aydınlık, Karasu, İçmeler ve Kavaklıburun koyları el değmemiş turkuaz sularıyla Ege'nin en temiz plajlarını barındırır. Akdeniz fokları, yaban domuzları ve şahinler yarımadanın zengin faunasını oluşturur. Maki ve kızılçam ormanları kıyıya kadar iner. Zeus Mağarası yarımadanın güney kıyısında gizli bir doğa harikasıdır.",
    strategy:
      "Dilek Yarımadası'nda yoğun orman örtüsü, el değmemiş koyları ve milli park giriş kapısını arayın. Araç park alanları ve doğa yürüyüşü levhaları belirgindir. Yapılaşmanın olmadığı doğal kıyı şeridi diğer tatil beldelerinden ayrışır. 09 plaka kodu Aydın'ı gösterir.",
    funFact:
      "Dilek Yarımadası, Türkiye'de Akdeniz fokunun (Monachus monachus) son yaşam alanlarından biridir. Dünyada 700'den az birey kalan bu nadir tür, yarımadanın korunaklı mağaralarında üremektedir. Park, NATO askeri bölgesine komşu olması nedeniyle uzun süre sivil erişime kapalı kalmıştır.",
  },
  "hierapolis-denizli": {
    about:
      "Hierapolis, Denizli'deki Pamukkale travertenlerinin hemen tepesinde kurulmuş antik bir Roma şehridir. MÖ 190'da Pergamon Kralı II. Eumenes tarafından kurulan kent, termal sularıyla antik dünyanın en önemli sağlık merkezlerinden biriydi. 12.000 kişilik tiyatrosu, Roma hamamları, Frontinus Caddesi ve Anadolu'nun en büyük nekropolü (1.200'den fazla mezar) kentin başlıca kalıntılarıdır. Antik yüzme havuzu, Roma sütunları arasında termal suda yüzme imkanı sunar. UNESCO Dünya Mirası'nın parçasıdır.",
    strategy:
      "Hierapolis'te Roma tiyatrosunu, uzun sütunlu caddeyi ve arkadaki beyaz traverten manzarasını arayın. Nekropol alanındaki taş lahitler ve mezar yapıları karakteristiktir. Antik havuzdaki batık sütunlar arasında yüzen turistler belirgindir. 20 plaka kodu Denizli'yi gösterir.",
    funFact:
      "Hierapolis'in antik havuzu, MS 7. yüzyıldaki bir depremde suya devrilen Roma sütunları üzerinde yüzme imkanı sunar. 36°C sıcaklıktaki termal suda, 2.000 yıllık mermer sütun ve başlıkları arasında banyo yapmak dünyanın başka hiçbir yerinde mümkün değildir.",
  },
  "karsiyaka-izmir": {
    about:
      "Karşıyaka, İzmir Körfezi'nin kuzey kıyısında yer alan ve ismini 'karşı yaka' konumundan alan sempatik bir ilçedir. Kordon boyunca uzanan yürüyüş yolu, çınar ağaçlarıyla gölgelenen sahil kafeler ve Karşıyaka Çarşısı semtin yaşam damarlarıdır. Karşıyaka Spor Kulübü'nün tribün kültürü ilçenin kimliğinin ayrılmaz parçasıdır. Bostanlı sahili ve iskelesi günlük İzmir vapuru trafiğinin önemli duraklarıdır. İlçe, üst-orta gelir grubu ile entelektüel dokusuyla İzmir'in kültürel çekim noktalarından biridir.",
    strategy:
      "Karşıyaka'da körfez kıyısındaki yürüyüş yolunu, vapur iskelelerini ve çınar ağaçlı sahil kafeleri arayın. Karşıyaka SK bayrakları ve pankartları taraftar kültürünü yansıtır. Konak'a bakan karşı kıyı manzarası ve 35 plaka kodu İzmir'i gösterir. Bostanlı sahilindeki yeşil alan belirgindir.",
    funFact:
      "Karşıyaka'nın simgesi olan vapur kültürü, 1884'ten bu yana İzmir Körfezi'ni aralıksız birbirine bağlamaktadır. İzmirlilerin 'vapura yetişmek' deyimi günlük yaşamın parçasıdır. Karşıyaka SK, Türkiye'nin en eski spor kulüplerinden biri olup 1912'de kurulmuştur.",
  },
  "merkez-afyonkarahisar": {
    about:
      "Afyonkarahisar, 226 metre yüksekliğindeki volkanik kayalığın üzerinde yükselen kalesiyle Ege-İç Anadolu geçişindeki stratejik bir şehirdir. 'Afyon' (haşhaş) ve 'kara hisar' (kara kale) kelimelerinden oluşan adı şehrin iki sembolünü özetler. Kaymak, sucuk, lokum ve termal kaynakları ile tanınan şehirde Ulu Cami, Mevlevihane ve Gedik Ahmet Paşa Külliyesi tarihi zenginliği yansıtır. Termal turizm merkezi Ömer-Gecek kaplıcaları şehrin batısındadır. Zafer Müzesi, Kurtuluş Savaşı'ndaki Büyük Taarruz'un karargahını barındırır.",
    strategy:
      "Afyonkarahisar'da dev kaya üzerindeki kale silüetini arayın — şehrin en belirgin özelliğidir. Haşhaş tarlalarını (mor çiçekleri), kaymak dükkanlarını ve termal tesis tabelalarını gözlemleyin. 03 plaka kodu ve Ege-İç Anadolu arası step-yeşil geçişi bölgeyi daraltır.",
    funFact:
      "Afyonkarahisar, dünyada yasal tıbbi afyon (haşhaş) üretiminin en büyük merkezlerinden biridir. Türkiye, BM denetiminde morfin hammaddesi üretir ve Afyonkarahisar bu üretimin kalbidir. Haşhaş çiçeğinin mor-beyaz rengi haziran ayında ovaları kaplar.",
  },
  "merkezefendi-denizli": {
    about:
      "Merkezefendi, Denizli'nin merkez ilçesi olup adını şehrin manevi kurucusu kabul edilen mutasavvıf Merkezefendi'den alır. Denizli, tekstil ve dokumacılık geleneğiyle Türkiye'nin sanayi merkezlerinden biridir. İlçede Laodikeia antik kenti, Denizli horozu heykelleri ve geleneksel çarşı yapısı dikkat çeker. Kaleiçi semti şehrin tarihi dokusunu yaşatır. Pamukkale'ye 20 km mesafesi ilçeyi turistik bir geçiş noktası yapar. Çivril ve Buldan gibi çevre ilçelerdeki bağcılık ve dokumacılık Denizli ekonomisinin temellerini oluşturur.",
    strategy:
      "Merkezefendi'de orta büyüklükte Anadolu şehir merkezini, tekstil fabrikalarını ve Denizli horozu heykellerini arayın. Pamukkale yönlendirme tabelaları yaygındır. 20 plaka kodu Denizli'yi gösterir. Büyük Menderes ovası ve pamuk tarlaları çevre yollarında görülür.",
    funFact:
      "Denizli horozu, Türkiye'nin en uzun süre öten horoz ırkıdır ve tek bir ötüşü 25 saniyeyi bulabilir. Bu özellik genetik seleksiyonla yüzyıllar boyunca geliştirilmiştir. Denizli horozu, şehrin sembolü olarak her meydanda heykeli bulunur.",
  },
  "priene-aydin": {
    about:
      "Priene, Aydın'ın Söke ilçesinde Mykale Dağı'nın (Samsun Dağı) eteklerine kurulmuş antik bir İyon şehridir. MÖ 350'de ızgara şehir planıyla yeniden inşa edilmiş ve Helenistik şehircilik planlamasının en iyi örneği sayılır. Athena Tapınağı (Büyük İskender tarafından ithaf edilmiştir), bouleuterion (meclis binası), agora ve 5.000 kişilik tiyatro kentin başlıca yapılarıdır. Antik dönemde Ege kıyısında bir liman kentiyken, Büyük Menderes'in alüvyonları kıyıyı 15 km uzaklaştırmıştır.",
    strategy:
      "Priene'de dik yamaçtaki antik kent teraslarını, Athena Tapınağı'nın İyon sütunlarını ve alttaki Menderes ovasını arayın. Efes'e kıyasla daha az turist ve daha küçük ölçekli kalıntılar belirgindir. 09 plaka kodu Aydın'ı gösterir. Söke yönlendirme tabelaları bölgeyi daraltır.",
    funFact:
      "Priene'deki ızgara şehir planı, mimar Hippodamos'un MÖ 5. yüzyılda geliştirdiği sisteme dayanır. Bu plan modern şehircilik tarihinde 'Hippodamos planı' olarak bilinir ve New York'un sokak ızgarasının ilham kaynakları arasında sayılır.",
  },
  "yunusemre-manisa": {
    about:
      "Yunusemre, Manisa'nın merkez ilçesi olup adını Anadolu'nun büyük halk ozanı Yunus Emre'den alır. Manisa, Osmanlı şehzadelerinin sancak valiliği yaptığı tarihi bir kenttir. Spil Dağı'nın eteklerindeki konumu, Sultan Camii, Muradiye Camii ve tarihi Manisa Çarşısı şehrin Osmanlı mirasını yansıtır. Manisa'nın meşhur mesir macunu geleneği 500 yılı aşkın bir geçmişe sahiptir. Gediz ovası bağcılık ve tarım açısından son derece verimlidir; Sultaniye çekirdeksiz üzümü dünyaca ünlüdür.",
    strategy:
      "Yunusemre'de Spil Dağı silüetini, geleneksel çarşı sokaklarını ve orta ölçekli Anadolu şehir dokusunu arayın. Mesir macunu dükkanları ve festivali pankartları bölgeye özgü detaylardır. 45 plaka kodu Manisa'yı gösterir. Bağ ve üzüm kurutma alanları çevre yollarında görülür.",
    funFact:
      "Manisa Mesir Macunu Festivali, 1539'dan beri her yıl kutlanan ve UNESCO Somut Olmayan Kültürel Miras Listesi'ne kayıtlı bir gelenektir. Rivayete göre Sultan Süleyman'ın annesi Hafsa Sultan'ın hastalığına çare olarak 41 baharattan hazırlanan macun şifa vermiş ve bu gelenek başlamıştır.",
  },

  // ==================== İÇ ANADOLU BÖLGESİ ====================

  "derinkuyu-nevsehir": {
    about:
      "Derinkuyu, Kapadokya'nın en derin ve en büyük yeraltı şehridir. Sekiz kat derinliğe inen bu devasa yapı, yaklaşık 20.000 kişiyi barındırabilecek kapasitededir. Havalandırma bacaları, su kuyuları, şarap mahzenleri, kiliseler ve hatta hayvan ahırları yeraltında eksiksiz bir şehir oluşturur. Hititlerden Bizans dönemine kadar farklı medeniyetler tarafından genişletilen Derinkuyu, düşman akınlarından korunmak amacıyla inşa edilmiştir. Girişleri dev taş kapılarla kapatılabilen bu labirent, Kaymaklı yeraltı şehrine uzanan kilometrelerce tünel ile bağlantılıdır. Kapadokya'nın volkanik tüf formasyonları, yumuşak kaya yapısı sayesinde bu devasa yeraltı yerleşimlerinin oyulmasını mümkün kılmıştır.",
    strategy:
      "Derinkuyu'da yeraltı şehri giriş yapısını, turist bilet gişelerini ve Nevşehir'in kurak step arazisini arayın. Kasabanın merkezi küçük ve kırsal karakterlidir; düz damlı evler ve tahıl tarlaları yaygındır. 50 plaka kodu ve Kapadokya yönlendirme tabelaları bölgeyi doğrular. Yüzeyde sıradan bir Anadolu kasabası görünümü hakimdir.",
    funFact:
      "Derinkuyu yeraltı şehri, 1963 yılında bir evin duvarı yıkıldığında tesadüfen keşfedilmiştir. Arkasından çıkan tünel, sekiz kat derinliğe inen ve 85 metre aşağı uzanan devasa bir yeraltı kompleksine açılmıştır. Bugün ziyaretçilere sadece ilk dört kat açıktır.",
  },
  "erciyes-dagi-kayseri": {
    about:
      "Erciyes Dağı, 3.917 metre yüksekliğiyle İç Anadolu'nun en yüksek zirvesi ve sönmüş bir volkandır. Kayseri şehir merkezinin hemen güneyinde yükselen bu görkemli dağ, kış aylarında Türkiye'nin en önemli kayak merkezlerinden birine ev sahipliği yapar. Modern teleferik hatları, pistler ve otel tesisleri dağın kuzey yamacında yer alır. Yaz aylarında ise trekking, dağ bisikleti ve yamaç paraşütü gibi aktivitelerle ziyaretçi çeker. Erciyes'in volkanik yapısı, Kapadokya'daki peri bacalarını oluşturan tüf tabakalarının ana kaynağıdır. Dağın eteklerindeki yaylalar geleneksel hayvancılık faaliyetleriyle canlıdır.",
    strategy:
      "Erciyes'te karlı zirveyi, kayak pistlerini ve teleferik hatlarını arayın. Kayseri'nin düz ovası üzerinde tek başına yükselen konik dağ silüeti çok belirgindir. 38 plaka kodu ve kayak merkezi tabelaları konumu kesinleştirir. Şehir merkezinden bile dağın baskın varlığı hissedilir.",
    funFact:
      "Erciyes Dağı, son büyük patlamasını yaklaşık 8.000 yıl önce gerçekleştirmiştir. Bu patlama sonucu çevreye yayılan volkanik kül ve tüf, yüzlerce kilometre öteye ulaşarak Kapadokya'nın peri bacalarını ve yeraltı şehirlerini mümkün kılan yumuşak kaya tabakasını oluşturmuştur.",
  },
  "etimesgut-ankara": {
    about:
      "Etimesgut, Ankara'nın batısında yer alan ve hızla büyüyen modern bir ilçedir. Adını Hititçe 'güneşin battığı yer' anlamına gelen bir sözcükten aldığı rivayet edilir. İlçe, Türk Hava Kuvvetleri'nin en büyük üssü olan Etimesgut Hava Üssü'ne ev sahipliği yapar. Eryaman ve Elvankent gibi toplu konut bölgeleri, geniş bulvarlar, alışveriş merkezleri ve Ankara Metrosu'nun son durakları bu ilçeyi modern bir uydu şehir haline getirmiştir. Akıncı Mahallesi'ndeki tarihi köy dokusu ile yeni yerleşim alanlarının kontrastı ilçenin karakterini belirler. Atatürk Orman Çiftliği'nin batı uzantıları yeşil alanlar sunar.",
    strategy:
      "Etimesgut'ta geniş, düz bulvarları, toplu konut bloklarını ve askeri alan çitlerini arayın. Metro istasyonu tabelaları ve 06 plaka kodu Ankara'yı doğrular. Düz ova arazisi ve yeni yapılaşma baskındır. Ankara'nın diğer ilçelerine kıyasla daha yeni ve planlı bir görünüm hakimdir.",
    funFact:
      "Etimesgut Hava Üssü, Türk havacılık tarihinin başlangıç noktalarından biridir. 1912'de kurulan bu alan, Türkiye'nin ilk uçuş eğitim merkeziydi. Bugün hâlâ aktif askeri üs olarak kullanılmakta ve THK'nın önemli bir tesisi konumundadır.",
  },
  "ihlara-vadisi-aksaray": {
    about:
      "Ihlara Vadisi, Aksaray ili sınırları içinde Melendiz Çayı'nın milyonlarca yıl boyunca volkanik tüf kayaları aşındırmasıyla oluşmuş 14 kilometre uzunluğunda, 150 metre derinliğinde muhteşem bir kanyondur. Vadi duvarlarına oyulmuş yüzlerce kaya kilisesi, Hristiyan keşişlerin MS 4-13. yüzyıllar arasında yaşadığı manastır komplekslerini barındırır. Ağaçlık Kilise, Yılanlı Kilise ve Kokar Kilise gibi yapılarda Bizans freskleri hâlâ görülebilir. Vadi tabanında akan derenin iki yanında kavak ve söğüt ağaçları yeşil bir koridor oluşturur. Kapadokya'nın daha az bilinen ama en etkileyici doğa harikalarından biridir.",
    strategy:
      "Ihlara'da derin kanyon manzarasını, vadi tabanındaki yürüyüş patikasını ve kaya oyma kiliseleri arayın. 3.500 basamaklı merdivenle vadiye iniş noktası belirgin bir ipucudur. 68 plaka kodu (Aksaray) ve kurak step arazisi İç Anadolu'yu işaret eder. Vadi girişindeki turist tesisleri ve otopark alanları da gösterge olabilir.",
    funFact:
      "Ihlara Vadisi'nde keşfedilen kaya kiliselerinin sayısı 100'ü aşmaktadır, ancak bunların çoğu henüz tam olarak belgelenmemiştir. Vadi, UNESCO Dünya Mirası geçici listesinde yer almaktadır ve her yıl yaklaşık 500.000 ziyaretçi çeker.",
  },
  "kecioren-ankara": {
    about:
      "Keçiören, Ankara'nın en kalabalık ilçesi olup şehrin kuzeyinde Etlik ve Ovacık tepeleri üzerinde yayılır. Adı bölgede eskiden yetiştirilen keçilerden gelir. Estergon Kalesi replikası, Kalaba Mahallesi'nin geleneksel dokusu ve Gençlik Parkı ile Ankara'nın en bilinen mahallelerindendir. İlçe merkezi yoğun konut bloklarıyla kaplı olup Etlik Hastaneler Bölgesi önemli bir sağlık merkezidir. Keçiören belediyesinin yaptırdığı Estergon ve Japon Bahçesi gibi tematik parklar ilçeye farklı bir karakter katar. Kalaba Pazarı ve Güçlükaya semtleri yerel ticaretin nabzını tutar.",
    strategy:
      "Keçiören'de tepelik arazi üzerine kurulmuş yoğun apartman bloklarını, dar yokuş sokakları ve belediye parklarını arayın. Estergon Kalesi replikası dikkat çekici bir yapıdır. 06 plaka kodu ve Ankara EGO otobüs hatları doğrulayıcıdır. Etlik Caddesi üzerindeki hastane tabelaları bölgeyi daraltır.",
    funFact:
      "Keçiören, yaklaşık 950.000 nüfusuyla Ankara'nın ve Türkiye'nin en kalabalık ilçelerinden biridir. İlçede bulunan Estergon Kalesi, Macaristan'daki orijinalinin sadık bir kopyasıdır ve Osmanlı-Macar tarihsel bağlarını simgeler.",
  },
  "kizilay-ankara": {
    about:
      "Kızılay, Ankara'nın modern merkezi ve nabız noktasıdır. Resmi olarak Çankaya ilçesine bağlı olan bu semt, adını meydandaki eski Kızılay binasından alır. Atatürk Bulvarı, Sakarya Caddesi ve Tunalı Hilmi gibi önemli akslar burada kesişir. Kızılay Meydanı metro, otobüs ve dolmuş hatlarının buluşma noktasıdır. Bakanlıklar bölgesine yakınlığı nedeniyle bürokratik merkez olma özelliğini korur. Meydanın çevresindeki kitapçılar, kafeler ve öğrenci mekanları semte genç ve dinamik bir hava katar. Güvenpark'taki kuğulu havuz ve çevre banklar Ankaralıların buluşma noktasıdır.",
    strategy:
      "Kızılay'da Güvenpark'ı, yoğun yaya trafiğini ve Kızılay Meydanı'ndaki metro girişlerini arayın. Atatürk Bulvarı üzerindeki geniş kaldırımlar ve devlet kurumları tabelaları belirgindir. 06 plaka kodu, Ankara'ya özgü EGO otobüsleri ve meydandaki büyük reklam panoları konumu doğrular.",
    funFact:
      "Kızılay Meydanı'nın altı, Ankara'nın en büyük yeraltı alışveriş ve ulaşım kompleksine ev sahipliği yapar. Ankaray ve Metro hatlarının kesiştiği bu istasyon, günde 300.000'i aşkın yolcu tarafından kullanılır ve Ankara'nın en işlek noktasıdır.",
  },
  "mamak-ankara": {
    about:
      "Mamak, Ankara'nın doğusunda geniş bir alana yayılan ve son yıllarda büyük kentsel dönüşüm projeleriyle değişen bir ilçedir. İmrahor Vadisi, Kayaş semti ve Cebeci sırtları ilçenin önemli bölgeleridir. Hititlerden kalma izler taşıyan İmrahor Vadisi, doğa yürüyüşleri için popülerdir. İlçe, gecekondu yapılaşmasından modern toplu konutlara geçiş sürecini yoğun şekilde yaşamaktadır. Ankara garına yakınlığı ve TCDD hatlarının geçişi Mamak'ın ulaşım altyapısını şekillendirir. Natoyolu ve Mamak Caddesi ana ulaşım akslarıdır. Yerel pazarlar ve mahalle arası ticaret semtin sosyal dokusunu belirler.",
    strategy:
      "Mamak'ta kentsel dönüşüm alanlarını (eski gecekondu yanında yeni bloklar), demiryolu hatlarını ve İmrahor Vadisi'ni arayın. Dar, eğimli sokaklar ve yoğun konut dokusu karakteristiktir. 06 plaka kodu ve Ankara belediye otobüsleri bölgeyi doğrular. Eski-yeni yapılaşma kontrastı Mamak'ın en belirgin özelliğidir.",
    funFact:
      "Mamak'taki İmrahor Vadisi, Ankara'nın içindeki en büyük doğal koridor olup 10 km uzunluğunda bir ekosisteme ev sahipliği yapar. Vadide tilki, tavşan ve çeşitli kuş türleri yaşar; şehrin ortasında kırsal bir kaçış noktası sunar.",
  },
  "melikgazi-kayseri": {
    about:
      "Melikgazi, Kayseri'nin merkez ilçesi ve ticari kalbidir. Selçuklu döneminden kalma Hunat Hatun Külliyesi, Kapalı Çarşı ve tarihi medreseler ilçenin tarihsel dokusunu oluşturur. Modern Kayseri'nin iş merkezleri, üniversite kampüsleri ve sanayi tesisleri de bu ilçededir. Erciyes Üniversitesi kampüsü ilçenin güney kesiminde geniş bir alan kaplar. Kayseri'nin ünlü pastırma ve sucuk üretim tesisleri bu bölgede yoğunlaşmıştır. Selçuklu ve Osmanlı eserlerinin modern şehir dokusuyla iç içe yaşadığı Melikgazi, Kayseri'nin hem ticaret hem kültür merkezidir.",
    strategy:
      "Melikgazi'de Selçuklu dönemi taş yapılarını, modern iş merkezlerini ve Erciyes Dağı'nın arka plan silüetini arayın. 38 plaka kodu ve 'Kayseri Sanayi' tabelaları belirgindir. Düz ova üzerinde yayılan şehir yapısı ve kurak iklim İç Anadolu'ya işaret eder. Organize sanayi bölgesi tabelaları da ipucu olabilir.",
    funFact:
      "Kayseri, Türkiye'nin en girişimci şehirlerinden biri olarak bilinir ve 'Anadolu Kaplanları' arasında sayılır. Melikgazi'deki Kapalı Çarşı, 500 yılı aşkın süredir kesintisiz faaliyet göstermekte olup çevresindeki hanlarla birlikte hâlâ şehrin ticaret merkezidir.",
  },
  "merkez-aksaray": {
    about:
      "Aksaray, İç Anadolu'nun güneydoğusunda Hasan Dağı'nın eteklerinde kurulmuş kadim bir şehirdir. Selçuklu ve Osmanlı dönemlerinden kalma Ulu Cami, Zinciriye Medresesi ve Eğri Minare ilçenin tarihi yapılarıdır. İpek Yolu güzergahında stratejik bir konaklama noktası olan Aksaray, Sultanhanı Kervansarayı ile bu mirası yaşatır. Şehir merkezindeki modern yapılaşma tarihi dokuyla iç içe geçmiştir. Hasan Dağı ve Melendiz Dağı'nın volkanik silüetleri şehrin manzarasını belirler. Aksaray ovası verimli tarım arazileriyle kaplı olup tahıl ve şeker pancarı üretimi önemlidir.",
    strategy:
      "Aksaray'da Eğri Minare'nin eğik silüetini, şehir merkezindeki geniş bulvarları ve kurak step arazisini arayın. Hasan Dağı'nın konik zirvesi arka planda görülebilir. 68 plaka kodu ve Aksaray Üniversitesi tabelaları konumu doğrular. Düz ova üzerinde orta ölçekli bir şehir yapısı hakimdir.",
    funFact:
      "Aksaray'daki Eğri Minare, yapıldığı dönemden bu yana yaklaşık 27 derece eğilmiş olmasına rağmen hâlâ ayaktadır. İtalya'nın Pisa Kulesi gibi eğik yapısıyla dikkat çeken minare, Selçuklu dönemine ait tuğla işçiliğinin nadir örneklerindendir.",
  },
  "merkez-nevsehir": {
    about:
      "Nevşehir, Kapadokya bölgesinin idari merkezi ve ulaşım kapısıdır. Damat İbrahim Paşa Külliyesi, kale kalıntıları ve geleneksel Anadolu çarşısı şehir merkezinin tarihsel katmanlarını oluşturur. Göreme, Ürgüp ve Avanos gibi turistik merkezlere buradan ulaşılır. Şehir, 18. yüzyılda Sadrazam Damat İbrahim Paşa'nın doğduğu yer olması nedeniyle büyük yatırımlar almış ve 'Nevşehir' (yeni şehir) adını almıştır. Kapadokya'nın peri bacaları ve yeraltı şehirleri bu ilin sınırları içinde yoğunlaşır. Kentin güneyindeki Kaymaklı yeraltı şehri merkeze sadece 20 km uzaklıktadır.",
    strategy:
      "Nevşehir'de orta ölçekli bir Anadolu şehrinin tipik görünümünü, Damat İbrahim Paşa Camii'nin kubbe ve minaresini arayın. Kapadokya'ya yönelik turist tabelaları ve tur acentesi dükkanları yoğundur. 50 plaka kodu kesin göstergedir. Şehrin hemen dışında volkanik tüf oluşumları başlar.",
    funFact:
      "Nevşehir'in eski adı Muşkara'dır. 1726'da Osmanlı Sadrazamı Damat İbrahim Paşa doğduğu bu kasabayı bayındır hale getirmiş, cami, medrese, hamam ve kütüphane inşa ettirmiş ve kasabanın adını 'Nevşehir' (yeni şehir) olarak değiştirmiştir.",
  },
  "merkez-sivas": {
    about:
      "Sivas, Anadolu'nun tam ortasında yer alan ve Selçuklu mimarisinin başkenti sayılan tarihi bir şehirdir. Gök Medrese, Çifte Minareli Medrese, Şifaiye Medresesi ve Buruciye Medresesi dünyanın en önemli Selçuklu yapıları arasında yer alır. 1919'da toplanan Sivas Kongresi Türk Kurtuluş Savaşı'nın dönüm noktalarından biri olmuş ve kongre binası müze olarak korunmaktadır. Kızılırmak'ın yukarı havzasında 1.285 metre rakımda kurulan şehir, sert karasal iklimle bilinir. Kangal köpekleri ve Kangal Balıklı Kaplıca şehrin dünya çapında tanınan sembolleridir.",
    strategy:
      "Sivas'ta Selçuklu medreselerinin görkemli taç kapılarını, geometrik süslemeli minareleri ve geniş şehir meydanını arayın. 58 plaka kodu ve üniversite tabelaları belirgindir. Sert iklim, kurak arazi ve yüksek rakım ipuçlarıdır. Kongre binası yönlendirme tabelaları ve Selçuklu eser yoğunluğu konumu daraltır.",
    funFact:
      "Sivas'taki Şifaiye Medresesi (1217), dünyanın ilk tıp fakültelerinden biri olarak kabul edilir. Selçuklu döneminde ruh hastalıklarının müzikle tedavi edildiği bu yapı, aynı zamanda Anadolu'daki en eski hastane örneklerinden biridir.",
  },
  "sincan-ankara": {
    about:
      "Sincan, Ankara'nın batısında hızla büyümüş büyük bir ilçedir. Ankara-Eskişehir demiryolu hattı üzerinde konumlanan Sincan, YHT (Yüksek Hızlı Tren) istasyonuna sahiptir. Temelli ve Yenikent gibi yeni yerleşim alanları ile birlikte nüfusu hızla artmaktadır. Sincan Organize Sanayi Bölgesi Ankara'nın en büyük sanayi merkezlerinden biridir. İlçede geleneksel bir Anadolu kasabası dokusu ile modern kentsel gelişim bir arada yaşar. Sakarya Nehri'nin kollarının geçtiği verimli ova arazisi tarımsal faaliyetlere imkan tanır.",
    strategy:
      "Sincan'da geniş düz araziyi, sanayi bölgesi tabelalarını ve YHT demiryolu hattını arayın. Toplu konut blokları ve yeni yapılaşma alanları hakimdir. 06 plaka kodu ve Ankara banliyö tren istasyonu tabelaları konumu doğrular. İlçe merkezindeki ticaret alanı tipik bir Anadolu kasabası görünümündedir.",
    funFact:
      "Sincan, 1990'larda 30.000 nüfuslu küçük bir kasaba iken 2020'lere gelindiğinde 550.000'i aşan nüfusuyla Ankara'nın en hızlı büyüyen ilçesi olmuştur. Bu büyüme, Ankara'nın batıya doğru genişleme stratejisinin en somut örneğidir.",
  },
  "tepebasi-eskisehir": {
    about:
      "Tepebaşı, Eskişehir'in modern yüzü ve kültürel merkezidir. Porsuk Çayı kıyısındaki yürüyüş yolları, Kentpark, Sazova Bilim Sanat ve Kültür Parkı'ndaki masal şatosu ve modern tramvay hattı Eskişehir'i Anadolu'nun en yaşanabilir şehirlerinden biri yapar. Anadolu ve Osmangazi üniversitelerinin varlığı şehre genç ve dinamik bir kimlik kazandırır. Odunpazarı'nın tarihi evleri ile Tepebaşı'nın modern yapıları kontrast oluşturur. Eskişehir'in lületaşı işçiliği yüzyıllardır süren geleneksel bir zanaat olarak devam eder. Porsuk kıyısındaki gondol turları şehrin simgesi haline gelmiştir.",
    strategy:
      "Tepebaşı'nda Porsuk Çayı kıyısını, tramvay hattını ve modern şehir parklarını arayın. Sazova'daki masal şatosu çok karakteristiktir. 26 plaka kodu ve üniversite kampüs tabelaları Eskişehir'i doğrular. Düz ova arazisi üzerinde planlı ve temiz bir şehir görünümü diğer Anadolu şehirlerinden ayırt edicidir.",
    funFact:
      "Eskişehir, dünyadaki en kaliteli lületaşı yataklarına sahiptir. Tepebaşı'ndaki atölyelerde üretilen lületaşı pipoları yüzyıllardır Avrupa'ya ihraç edilmektedir. Bu hafif ve gözenekli mineral sadece Eskişehir çevresinde ekonomik olarak çıkarılabilir kalitede bulunur.",
  },
  "tuz-golu-ankara": {
    about:
      "Tuz Gölü, İç Anadolu'nun kalbinde Ankara, Aksaray ve Konya illerinin kesişim noktasında yer alan Türkiye'nin ikinci büyük gölüdür. 1.665 km² yüzölçümüne sahip bu tuzlu göl, yaz aylarında büyük bölümü kuruyarak beyaz bir tuz tabakası bırakır. Tuz Gölü, Türkiye'nin tuz ihtiyacının yüzde 70'ini karşılar. Gölün güney kıyılarında flamingo kolonileri ürer ve bu alan özel çevre koruma bölgesi ilan edilmiştir. Yaz mevsiminde tuz kristallerinin güneş ışığını yansıtması muhteşem bir görsel oluşturur. Step bitki örtüsü ve uçsuz bucaksız düzlük bölgenin karakteridir.",
    strategy:
      "Tuz Gölü'nde uçsuz bucaksız beyaz tuz düzlüğünü, ufuk çizgisinde hiçbir yükselti olmayan dümdüz araziyi arayın. Yaz aylarında tuz kristalleri parlak beyazdır. Ankara-Aksaray otoyolu gölün kıyısından geçer. Tuz fabrikası tabelaları ve 06-68-42 plaka kodları bölgeyi daraltır. Flamingo gözlem kuleleri de ipucu olabilir.",
    funFact:
      "Tuz Gölü, her yaz binlerce flamingonun üremek için geldiği Türkiye'nin en büyük flamingo koloni alanıdır. Gölde üreyen flamingo sayısı bazı yıllarda 20.000 çifti aşar. Tuz tabakasının kalınlığı bazı bölgelerde 30 santimetreyi bulur.",
  },
  "yenimahalle-ankara": {
    about:
      "Yenimahalle, Ankara'nın batı-kuzeybatısında yer alan gelişmiş ve modern bir ilçedir. Batıkent, Demetevler ve Macunköy gibi planlı yerleşim bölgeleriyle Ankara'nın en düzenli ilçelerinden biridir. Ankara Şehirlerarası Otobüs Terminali (AŞTİ) ve Batıkent Metro hattı ilçenin önemli ulaşım altyapılarıdır. Çayyolu yerleşim bölgesi modern yaşam alanları sunar. İlçe, savunma sanayi kuruluşlarına yakınlığı ile de bilinir; ASELSAN ve TAI gibi stratejik tesisler bu bölgededir. Göksu Parkı ve Batıkent rekreasyon alanları yeşil alan ihtiyacını karşılar.",
    strategy:
      "Yenimahalle'de düzenli şehir planlamasını, geniş bulvarları ve modern konut bloklarını arayın. Batıkent metro istasyonu ve AŞTİ tabelaları güçlü ipuçlarıdır. 06 plaka kodu Ankara'yı doğrular. Diğer Ankara ilçelerine kıyasla daha planlı ve modern bir yerleşim düzeni dikkat çeker. Savunma sanayi tesisleri çevresindeki güvenlik yapıları da görülebilir.",
    funFact:
      "Yenimahalle'de bulunan ASELSAN, Türkiye'nin en büyük savunma sanayi şirketidir ve radar, elektronik harp ve haberleşme sistemleri üretir. İlçe, Ankara'nın teknoloji ve savunma sanayi ekosisteminin merkezinde yer alır.",
  },

  // ==================== DOĞU ANADOLU BÖLGESİ ====================

  "ani-harabeleri-kars": {
    about:
      "Ani, Kars'ın 42 km doğusunda Arpaçay sınırında yer alan ve UNESCO Dünya Mirası Listesi'nde bulunan ortaçağ harabesidir. 10-11. yüzyıllarda Bagratid Ermeni Krallığı'nın başkenti olan Ani, '1001 Kilise Şehri' olarak bilinirdi. Surlar, kiliseler, camiler ve Selçuklu sarayı kalıntıları Arpaçay vadisinin kenarında dramatik bir manzara oluşturur. Şehir, İpek Yolu üzerinde stratejik konumuyla 100.000'den fazla nüfusa ulaşmıştı. Menüçehr Camii, Anadolu'daki ilk Türk camisi olarak kabul edilir. Ermeni, Gürcü, Selçuklu ve Osmanlı mimarisi bir arada görülebilir.",
    strategy:
      "Ani'de ıssız ovada yükselen görkemli taş duvarları, kilise kalıntılarını ve sınır çitlerini arayın. Arpaçay'ın (Akhuryan Nehri) oluşturduğu derin vadi Türkiye-Ermenistan sınırını belirler. 36 plaka kodu ve bozkır manzarası Kars'ı işaret eder. Rüzgârlı, çorak bir düzlük ve turist bilgilendirme panoları belirgindir.",
    funFact:
      "Ani'deki yapıların birçoğu, 1319 depreminden bu yana ayakta kalmayı başarmıştır. Şehrin nüfusu altın çağında Avrupa'nın birçok büyük kentini geride bırakıyordu. İpek Yolu ticaretinden elde edilen zenginlik sayesinde şehir 'Doğu'nun Paris'i' olarak adlandırılmıştı.",
  },
  "agri-dagi-agri": {
    about:
      "Ağrı Dağı (Ararat), 5.137 metre yüksekliğiyle Türkiye'nin en yüksek zirvesidir. Doğu Anadolu'nun uçsuz bucaksız platosundan tek başına yükselen bu volkanik dağ, Nuh'un Gemisi efsanesiyle dünyanın en tanınan dağlarından biridir. Zirvedeki kalıcı buzul örtüsü yıl boyu bembeyaz bir taç oluşturur. Dağın etekleri yazın yaylacılık faaliyetleri, kışın ise kalın kar örtüsüyle kaplanır. Büyük Ağrı ve Küçük Ağrı olmak üzere iki zirveden oluşan dağ, Doğubayazıt ilçesinden izlenir. İran ve Ermenistan sınırlarına yakınlığı stratejik önemini artırır.",
    strategy:
      "Ağrı Dağı'nda devasa karlı zirveyi, düz plato üzerinde tek başına yükselen konik silüeti arayın. Doğubayazıt kasabasından dağ manzarası çok belirgindir. 04 plaka kodu ve yüksek rakımlı bozkır arazisi ipucudur. Sınır bölgesi tabelaları ve askeri kontrol noktaları görülebilir.",
    funFact:
      "Ağrı Dağı, Türkiye'nin tek kalıcı buzuluna ev sahipliği yapar. Buzul yaklaşık 10 km² alan kaplar, ancak iklim değişikliği nedeniyle son yüzyılda önemli ölçüde küçülmüştür. Dağa ilk bilinen tırmanış 1829'da Friedrich Parrot tarafından gerçekleştirilmiştir.",
  },
  "battalgazi-malatya": {
    about:
      "Battalgazi, Malatya'nın tarihi merkezidir ve eski Malatya şehrinin üzerine kurulmuştur. Selçuklu dönemi Ulu Camii, Silahtar Mustafa Paşa Kervansarayı ve antik Melitene kalıntıları ilçenin tarihsel katmanlarını oluşturur. Fırat Nehri'nin kollarından Tohma Çayı ilçeyi besler. Malatya'nın dünyaca ünlü kayısı bahçeleri ilçe çevresinde geniş alanlara yayılır. Battalgazi Barajı şehrin su ihtiyacını karşılarken çevresi rekreasyon alanı olarak kullanılır. İlçe adını, İslam tarihi ve Türk destanlarının efsanevi kahramanı Battal Gazi'den alır.",
    strategy:
      "Battalgazi'de kayısı bahçelerini, tarihi Selçuklu yapılarını ve verimli ova arazisini arayın. 44 plaka kodu ve kayısı kurutma sergileri (özellikle yaz aylarında) Malatya'yı ele verir. Kırsal kesimde düz tarım arazileri ve kavak ağaçları yaygındır. Eski şehir dokusundaki taş yapılar belirgindir.",
    funFact:
      "Malatya, dünya kayısı üretiminin yaklaşık yüzde 85'ini tek başına karşılar. Battalgazi'nin verimli ovalarında yetiştirilen kayısılar, güneşte kurutularak 100'den fazla ülkeye ihraç edilir. Temmuz ayında yol kenarlarındaki turuncu kayısı sergileri bölgenin en tanınan manzarasıdır.",
  },
  "merkez-elazig": {
    about:
      "Elazığ, Fırat Nehri havzasında 1.067 metre rakımda kurulmuş Doğu Anadolu'nun önemli şehirlerinden biridir. Keban ve Karakaya barajlarının oluşturduğu göl sistemi şehrin çevresini sular ve Hazar Gölü Türkiye'nin en büyük tektonik gölüdür. Fırat Üniversitesi şehre akademik canlılık katar. Harput Kalesi ve eski Harput yerleşimi şehir merkezinin üzerinde tarihi bir silüet oluşturur. Elazığ'ın kendine özgü mutfağı, özellikle içli köfte ve harput köftesi, bölgesel gastronomi kültürünün öne çıkan lezzetleridir. Şehir sıcaklık farkının aşırı olduğu bir karasal iklime sahiptir.",
    strategy:
      "Elazığ'da Harput Kalesi'nin tepedeki silüetini, baraj göllerinin manzarasını ve orta ölçekli bir Anadolu şehri yapısını arayın. 23 plaka kodu ve üniversite kampüs tabelaları belirgindir. Kurak yüksek plato arazisi ve kışın kar manzarası Doğu Anadolu'yu işaret eder. Hazar Gölü kıyısındaki tesisler de ipucu olabilir.",
    funFact:
      "Elazığ'ın hemen yukarısındaki Harput, antik çağlardan beri yerleşim yeri olup 'yaşayan açık hava müzesi' olarak anılır. Harput'un Meryem Ana Kilisesi'nde her yıl düzenlenen ayin, dünyanın dört bir yanından Süryani Hristiyanları bir araya getirir.",
  },
  "merkez-kars": {
    about:
      "Kars, Türkiye'nin kuzeydoğusunda 1.768 metre rakımda yer alan ve Baltık mimarisiyle dikkat çeken sınır şehridir. Rusya'nın 1878-1918 arasındaki hakimiyeti döneminde inşa edilen taş binalar, grid planlı sokaklar ve Baltık üslubundaki yapılar Kars'ı Türkiye'nin diğer şehirlerinden farklı kılar. Kars Kalesi şehre hakim bir tepede yükselir. Evliya Camii (eski Havariler Kilisesi) ve Fethiye Camii Rus-Osmanlı mimari katmanlarını yansıtır. Şehir, Orhan Pamuk'un romanıyla uluslararası üne kavuşmuştur. Kars kaşarı ve bal Türkiye genelinde tanınır. Kışın sıcaklık -30°C'ye kadar düşebilir.",
    strategy:
      "Kars'ta Baltık tarzı taş binaları, grid plan sokak düzenini ve Kars Kalesi'nin silüetini arayın. 36 plaka kodu kesin göstergedir. Rus dönemi mimarisi (geniş pencereler, yüksek tavanlar) diğer Doğu Anadolu şehirlerinden farklılaştırır. Kar örtüsü ve bozkır manzarası yüksek rakımı ele verir.",
    funFact:
      "Kars, Türkiye'nin gravyer peyniri (kaşar) başkenti olarak bilinir. Yüksek rakımlı otlaklarda yetişen hayvanların sütünden üretilen Kars gravyeri, İsviçre gravyerine rakip kalitededir. Boğatepe köyü, Türkiye'de gravyer üretiminin başladığı yer olarak kabul edilir.",
  },
  "muradiye-selalesi-van": {
    about:
      "Muradiye Şelalesi, Van'ın Muradiye ilçesinde Bendimahi Çayı üzerinde oluşmuş doğal bir güzelliktir. 20 metre yükseklikten dökülen su, bazalt kayaları arasında görkemli bir görüntü oluşturur. Çevresindeki yeşil vadi ve köprüler şelaleye farklı açılardan bakma imkanı sunar. Kış aylarında şelalenin kısmen donması büyüleyici buz sarkıtları yaratır. Bölge, Doğu Anadolu'nun sert karasal iklimine rağmen yaz aylarında yeşil bir vaha görünümündedir. Yakın çevresindeki Osmanlı dönemi köprüsü ve çay bahçeleri ziyaretçi deneyimini tamamlar.",
    strategy:
      "Muradiye'de şelale manzarasını, bazalt kaya formasyonlarını ve yeşil vadi içindeki patika yolları arayın. Turist tesisleri ve yönlendirme tabelaları belirgindir. 65 plaka kodu ve yüksek plato arazisi Van bölgesini işaret eder. Kış fotoğraflarında donmuş şelale ve kar örtüsü çok karakteristiktir.",
    funFact:
      "Muradiye Şelalesi'nin adı, Osmanlı padişahı IV. Murad'ın Bağdat Seferi sırasında bu bölgeden geçmesi ve şelalenin güzelliğinden etkilenmesi rivayetine dayanır. Kış aylarında şelale tamamen donduğunda oluşan buz kütlesi 10 metreyi aşan sarkıtlar yaratır.",
  },
  "nemrut-dagi-adiyaman": {
    about:
      "Nemrut Dağı, Adıyaman ilinde 2.134 metre yükseklikte, Kommagene Kralı I. Antiochos'un MÖ 62 yılında yaptırdığı devasa heykellerle taçlanan ve UNESCO Dünya Mirası Listesi'nde yer alan antik bir tümülüstür. Doğu ve batı teraslarındaki tanrı heykelleri (Zeus, Apollon, Herakles ve Antiochos) depremlerle devrilmiş ve devasa başları teraslar üzerinde sıralanmıştır. Gün doğumu ve gün batımı anlarında heykellerin ışıkla buluşması dünyanın en etkileyici manzaralarından birini oluşturur. Fırat Nehri'nin oluşturduğu Atatürk Baraj Gölü dağın güneyinde uzanır.",
    strategy:
      "Nemrut'ta devasa taş heykel başlarını, tümülüs tepesini ve dağ yolu serpantinlerini arayın. Turist otobüsleri ve rehber grupları yoğundur. 02 plaka kodu ve dağlık arazi Adıyaman'ı işaret eder. Yüksek rakımlı çorak arazi ve antik kalıntılar konumu kesinleştirir.",
    funFact:
      "Nemrut Dağı'ndaki heykel başlarının her biri yaklaşık 2 metre yüksekliğinde ve 6 ton ağırlığındadır. Kommagene Krallığı, Roma ve Pers imparatorlukları arasında tampon bir devletti ve bu heykeller her iki kültürün tanrılarını sentezleyen benzersiz bir sanat anlayışını yansıtır.",
  },
  "tortum-selalesi-erzurum": {
    about:
      "Tortum Şelalesi, Erzurum'un Uzundere ilçesinde Tortum Çayı üzerinde oluşmuş Türkiye'nin en yüksek şelalelerinden biridir. Yaklaşık 48 metre yükseklikten dökülen su, derin bir kanyon içinde muhteşem bir manzara yaratır. Şelalenin hemen altında oluşan Tortum Gölü, bir heyelan sonucu meydana gelmiş doğal bir baraj gölüdür. Çevredeki dağlık arazi, çam ormanları ve yaylalar Doğu Anadolu'nun vahşi doğasını gözler önüne serer. Bölge, kuş gözlemciliği ve doğa fotoğrafçılığı için popüler bir destinasyondur.",
    strategy:
      "Tortum'da yüksek şelale manzarasını, derin kanyon yapısını ve çevreleyen dağlık araziyi arayın. Tortum Gölü'nün yeşil-turkuaz suyu belirgin bir ipucudur. 25 plaka kodu ve yüksek rakımlı orman örtüsü Erzurum bölgesini işaret eder. Kış aylarında yoğun kar örtüsü ve donmuş su izleri görülebilir.",
    funFact:
      "Tortum Gölü, yaklaşık 8.000 yıl önce büyük bir heyelanın Tortum Çayı'nı tıkamasıyla oluşmuştur. 8 km uzunluğundaki bu doğal baraj gölü, Türkiye'nin en büyük heyelan göllerinden biridir ve şelalenin debisi göl seviyesine bağlı olarak mevsimsel değişiklik gösterir.",
  },
  "van-golu-van": {
    about:
      "Van Gölü, 3.713 km² yüzölçümüyle Türkiye'nin en büyük gölü ve dünyanın en büyük sodalı gölüdür. Nemrut ve Süphan yanardağlarının lav akıntılarının su yollarını tıkamasıyla oluşan göl, deniz seviyesinden 1.646 metre yüksekliktedir. Gölün soda ve tuz içeriği yüksek olup içinde sadece inci kefali yaşar. Turkuaz mavi suları ve çevresindeki karlı dağlar olağanüstü bir manzara oluşturur. Akdamar Adası, Çarpanak Adası ve Kuş Adası gölün önemli adalarıdır. İnci kefali her bahar üremek için akarsulara göç eder.",
    strategy:
      "Van Gölü'nde uçsuz bucaksız turkuaz suyu, arka plandaki karlı dağları (Süphan Dağı) ve göl kıyısındaki küçük yerleşimleri arayın. 65 plaka kodu ve yüksek rakımlı plato manzarası Van'ı doğrular. Göl kenarındaki feribot iskeleleri ve balıkçı tekneleri de ipucu olabilir. Su renginin denizden farklı tonu dikkat çekicidir.",
    funFact:
      "Van Gölü'nde yaşayan inci kefali, dünyanın en zorlu koşullarına adapte olmuş balık türlerinden biridir. Sodalı suda hayatta kalabilen bu balık, üremek için her bahar tatlı su akarsularına göç eder. Van kedisi ise gölün kıyısına özgü, iki farklı göz rengine sahip nadir bir kedi türüdür.",
  },
  "yakutiye-erzurum": {
    about:
      "Yakutiye, Erzurum'un tarihi merkezi ve Anadolu'nun en soğuk şehirlerinden birinin kalbidir. Çifte Minareli Medrese, Yakutiye Medresesi ve Lala Mustafa Paşa Camii Selçuklu ve İlhanlı dönemlerinin mimari şaheserleridır. 1.900 metre rakımda kurulan Erzurum, kışın -40°C'ye varan sıcaklıklarıyla Türkiye'nin en sert iklimli şehirlerinden biridir. Palandöken Dağı'ndaki kayak merkezi kış sporlarının önemli merkezlerindendir. Oltu taşı işçiliği, cağ kebabı ve Erzurum'un kendine has aksanı şehrin kültürel kimliğini oluşturur.",
    strategy:
      "Yakutiye'de Çifte Minareli Medrese'nin ikonik minarelerini, geniş şehir meydanını ve taş yapıları arayın. 25 plaka kodu kesin göstergedir. Kışın yoğun kar örtüsü, yazın bile serin iklim izleri belirgindir. Palandöken kayak merkezi tabelaları ve Erzurum Kongresi müzesi yönlendirmeleri konumu daraltır.",
    funFact:
      "Erzurum'daki Çifte Minareli Medrese (1253), Selçuklu mimarisinin en görkemli örneklerinden biridir. Taç kapısındaki hayat ağacı ve çift başlı kartal kabartmaları, Türk-İslam sanatının en tanınan motifleri arasındadır. Yakutiye Medresesi ise İlhanlı dönemine ait nadir eserlerdendir.",
  },
  "ipekyolu-van": {
    about:
      "İpekyolu, Van'ın merkez ilçesi olup adını tarihte bu bölgeden geçen kadim İpek Yolu'ndan alır. Van Kalesi, Urartu döneminden (MÖ 9. yüzyıl) kalma görkemli bir yapıdır ve Van Gölü kıyısındaki konumuyla şehrin simgesidir. Kale duvarlarındaki Urartu çivi yazıtları tarihin en eski belgelerindendir. İlçede Van Müzesi, tarihi çarşı ve geleneksel kahvaltı mekanları öne çıkar. Van kahvaltısı, otlu peynir ve murtuğa gibi lezzetleriyle Türkiye'nin gastronomi haritasında ayrıcalıklı bir yere sahiptir.",
    strategy:
      "İpekyolu'nda Van Kalesi'nin göl kıyısındaki masif silüetini, şehir merkezindeki modern yapılaşmayı ve Van Gölü manzarasını arayın. 65 plaka kodu ve kahvaltıcı dükkan tabelaları belirgindir. Yüksek plato arazisi, kurak iklim ve karlı dağlar Doğu Anadolu'yu işaret eder. Kale çevresindeki kazı alanları ve müze tabelaları ipucu olabilir.",
    funFact:
      "Van Kalesi'ndeki Urartu çivi yazıtları, MÖ 832 yılına tarihlenmektedir ve Doğu Anadolu'nun en eski yazılı belgelerindendir. Urartular, Van Gölü çevresinde gelişmiş bir sulama sistemi kurmuş ve bölgeyi bir tarım cennetine dönüştürmüştü.",
  },
  "ishak-pasa-sarayi-agri": {
    about:
      "İshak Paşa Sarayı, Ağrı'nın Doğubayazıt ilçesinde 2.200 metre rakımda, Ağrı Dağı'nın eteklerinde bir tepe üzerine kurulmuş yarı harabe, yarı restore edilmiş görkemli bir Osmanlı saray kompleksidir. 1685-1784 yılları arasında inşa edilen saray, cami, harem, selamlık, zindan, hamam ve mutfak bölümlerinden oluşur. Selçuklu, Osmanlı, Gürcü ve İran mimari stillerini bir arada barındıran yapı, Anadolu'nun en özgün saraylarından biridir. Ağrı Dağı'nın karlı zirvesi ve Doğubayazıt ovasının panoramik manzarası sarayın çevresini tamamlar.",
    strategy:
      "İshak Paşa'da tepe üzerindeki saray silüetini, arkadaki Ağrı Dağı'nı ve çorak yüksek plato manzarasını arayın. 04 plaka kodu ve Doğubayazıt tabelaları konumu doğrular. Turist otobüsleri ve saray giriş kapısı belirgindir. İran sınırına yakınlık ve yüksek rakımlı kurak arazi Doğu Anadolu'yu kesinleştirir.",
    funFact:
      "İshak Paşa Sarayı, Anadolu'daki ilk merkezi ısıtma sistemine sahip yapılardan biridir. Sarayın altındaki kanallardan sıcak hava dolaştırılarak bütün odalar ısıtılıyordu. Bu sistem, Erzurum-Ağrı bölgesinin -40°C'ye varan kışlarında hayati önem taşıyordu.",
  },
  "merkez-adiyaman": {
    about:
      "Adıyaman, Güneydoğu Toros Dağları'nın eteklerinde Fırat Nehri havzasında kurulmuş tarihi bir şehirdir. Kommagene Krallığı'nın mirası, Nemrut Dağı'na açılan kapı olma özelliği ve Atatürk Baraj Gölü'nün oluşturduğu göl manzarası şehrin öne çıkan değerleridir. Perre Antik Kenti şehir merkezine birkaç kilometre uzaklıktadır ve Roma dönemi kaya mezarları, mozaikler barındırır. Cendere Köprüsü, Roma İmparatoru Septimius Severus döneminde inşa edilmiş ve hâlâ ayakta duran muhteşem bir yapıdır. Antep fıstığı, üzüm ve zeytin tarımı bölge ekonomisinin temelini oluşturur.",
    strategy:
      "Adıyaman'da orta ölçekli bir Güneydoğu şehri yapısını, dağlık arazi ve baraj gölü manzarasını arayın. 02 plaka kodu kesin göstergedir. Nemrut Dağı yönlendirme tabelaları, Atatürk Barajı tabelaları ve Perre Antik Kenti işaretleri konumu daraltır. Yarı kurak iklim ve taşlı arazi belirgindir.",
    funFact:
      "Adıyaman'daki Cendere Köprüsü, MS 200 yılında Roma İmparatoru Septimius Severus onuruna inşa edilmiş ve 1.800 yılı aşkın süredir ayaktadır. Tek kemerli bu taş köprü, dünyada hâlâ kullanılabilen en eski Roma köprülerinden biri olarak kabul edilir.",
  },

  // ==================== GÜNEYDOĞU ANADOLU BÖLGESİ ====================

  "baglar-diyarbakir": {
    about:
      "Bağlar, Diyarbakır'ın en kalabalık ilçesi olup şehrin batı ve güneybatı kesiminde geniş bir alana yayılır. Adını bölgedeki tarihi bağ ve bahçelerden alan ilçe, Hevsel Bahçeleri'ne komşudur. Diyarbakır Surları UNESCO Dünya Mirası Listesi'ndedir ve Çin Seddi'nden sonra dünyanın en uzun ikinci savunma duvarı olarak bilinir. Dicle Nehri vadisindeki Hevsel Bahçeleri 8.000 yıldır kesintisiz tarım yapılan bir alandır. İlçede bazalt taşından inşa edilmiş koyu renkli yapılar şehre kendine has bir karakter verir. Karpuz festivali ve kaburga kebabı Diyarbakır'ın gastronomik sembolleridir.",
    strategy:
      "Bağlar'da siyah bazalt taşından yapılmış binaları, geniş surları ve Dicle Nehri vadisini arayın. 21 plaka kodu ve Kürtçe-Türkçe çift dilli tabelalar güçlü ipuçlarıdır. Koyu renkli taş mimari Diyarbakır'a özgüdür ve diğer Güneydoğu şehirlerinden bile ayırt edilebilir. Sıcak ve kurak iklim belirgindir.",
    funFact:
      "Diyarbakır Surları, 5.8 km uzunluğunda ve 82 burçla donatılmış olup bazalt taşından inşa edilmiştir. Surların tarihi Roma dönemine kadar uzanır ve üzerlerindeki kitabeler Roma, Bizans, Selçuklu ve Osmanlı dönemlerine ait katmanları gösterir.",
  },
  "gobeklitepe-sanliurfa": {
    about:
      "Göbeklitepe, Şanlıurfa'nın 15 km kuzeydoğusunda yer alan ve insanlık tarihini yeniden yazdıran arkeolojik alandır. MÖ 9600 yılına tarihlenen T biçimli dikilitaşlar, bilinen en eski tapınak yapıları olarak kabul edilir ve Stonehenge'den 6.000 yıl daha eskidir. UNESCO Dünya Mirası Listesi'nde yer alan alan, avcı-toplayıcı toplulukların dini ritüeller için devasa yapılar inşa edebildiğini kanıtlamıştır. Dikilitaşlar üzerindeki hayvan kabartmaları (yılan, tilki, aslan, akbaba) dönemin inanç sistemine dair ipuçları sunar. Alanın büyük bölümü henüz kazılmamıştır.",
    strategy:
      "Göbeklitepe'de modern koruma çatısını, T biçimli dikilitaşları ve çevredeki kurak tepelik araziyi arayın. Turist bilgilendirme panoları ve UNESCO tabelaları belirgindir. 63 plaka kodu ve yarı çöl iklimi Şanlıurfa bölgesini işaret eder. Ziyaretçi merkezi ve otopark alanı yüzey ipuçlarıdır.",
    funFact:
      "Göbeklitepe'nin keşfi, arkeoloji dünyasının kabul ettiği 'önce yerleşim, sonra tapınak' teorisini tersine çevirmiştir. İnsanlar burada tarım yapmadan önce, sadece inanç amaçlı anıtsal yapılar inşa etmiştir. Alanın sadece yüzde 5'i kazılmış olup geri kalanı hâlâ toprak altındadır.",
  },
  "haliliye-sanliurfa": {
    about:
      "Haliliye, Şanlıurfa'nın tarihi merkezini kapsayan ilçedir. Balıklıgöl, Hz. İbrahim'in ateşe atıldığı ve suyun mucizevi olarak çıktığı yer olarak inanılır; kutsal sazan balıklarıyla ünlüdür. Urfa Kalesi, Rızvaniye Camii ve tarihi çarşı bu bölgenin öne çıkan yapılarıdır. Taş avlulu geleneksel Urfa evleri, şehrin mimari mirasını oluşturur. Şanlıurfa, 'Peygamberler Şehri' olarak bilinir ve Hz. Eyyüb'ün sabrını simgeleyen makam da bu ilçededir. Çiğ köfte, lahmacun ve tıkka kebap Urfa mutfağının dünyaca tanınan lezzetleridir.",
    strategy:
      "Haliliye'de Balıklıgöl havuzlarını, Urfa Kalesi'nin kayalık silüetini ve kireçtaşından yapılmış geleneksel evleri arayın. 63 plaka kodu ve Arapça-Türkçe karışık tabelalar güçlü ipuçlarıdır. Sıcak iklim, düz çatılı taş evler ve dini ziyaret merkezleri tabelaları Şanlıurfa'yı doğrular.",
    funFact:
      "Balıklıgöl'deki sazan balıklarına dokunmak veya yakalamak yasaktır ve halk arasında 'balıklara dokunanın kör olacağı' inancı yaygındır. İnanışa göre Hz. İbrahim'in ateşe atıldığı yerde odunlar suya, ateş ise balıklara dönüşmüştür.",
  },
  "merkez-batman": {
    about:
      "Batman, Güneydoğu Anadolu'da petrol endüstrisiyle büyümüş genç bir şehirdir. 1957'de ilçe, 1990'da il olan Batman, Türkiye'nin ilk petrol kuyusunun açıldığı yerdir. Batman Çayı ve Dicle Nehri'nin birleştiği noktada kurulan şehir, hızlı göç ve kentleşmeyle büyümüştür. Hasankeyf'in Ilısu Barajı altında kalmasıyla tarihi mirasın bir bölümü bu ile taşınmıştır. Batman Köprüsü ve Malabadi Köprüsü (Artuklu dönemi) kültürel değerleri oluşturur. Şehrin adının DC Comics karakteriyle aynı olması uluslararası ilgi çeker.",
    strategy:
      "Batman'da petrol rafinerisi bacalarını, modern ancak hızla büyümüş şehir dokusunu ve Dicle vadisi manzarasını arayın. 72 plaka kodu kesin göstergedir. Petrol boru hatları ve rafineri tesisleri diğer Güneydoğu şehirlerinden farklılaştırır. Düz ovada hızlı yapılaşma ve yeni konut blokları belirgindir.",
    funFact:
      "Batman valiliği, 2008 yılında DC Comics'e şehrin adını 'izinsiz kullandığı' gerekçesiyle telif davası açmayı düşünmüş ancak vazgeçmiştir. Batman adı aslında şehirden geçen Batman Çayı'ndan gelir ve kelimenin Türkçe kökenli olduğu düşünülmektedir.",
  },
  "zeugma-gaziantep": {
    about:
      "Zeugma, Gaziantep'in Nizip ilçesi yakınlarında Fırat Nehri kıyısında yer alan antik bir Roma şehridir. MÖ 300 civarında kurulan Zeugma, Roma döneminde Fırat'ın doğu ve batı kıyısını birleştiren stratejik bir köprü noktasıydı. 2000 yılında Birecik Barajı'nın su tutmasıyla alanın büyük bölümü sular altında kalmadan önce yapılan kurtarma kazılarında olağanüstü Roma mozaikleri gün yüzüne çıkarılmıştır. Gaziantep Zeugma Mozaik Müzesi, dünyanın en büyük mozaik koleksiyonlarından birine ev sahipliği yapar.",
    strategy:
      "Zeugma'da Fırat kıyısındaki arkeolojik kazı alanını, baraj gölü manzarasını ve müze yönlendirme tabelalarını arayın. 27 plaka kodu ve Gaziantep tabelaları bölgeyi doğrular. Antep fıstığı bahçeleri ve yarı kurak Güneydoğu arazisi ipucudur. Gaziantep şehir merkezindeki Zeugma Mozaik Müzesi de bu slug ile ilişkilendirilebilir.",
    funFact:
      "Zeugma'nın ünlü 'Çingene Kız' mozaiği, MS 2. yüzyıla aittir ve 2012'de ABD'deki Bowling Green Üniversitesi'nden iade edilen eksik parçalarıyla tamamlanmıştır. Mozaiğin büyüleyici bakışları dünya basınında 'antik Mona Lisa' olarak nitelendirilmiştir.",
  },
  "sahinbey-gaziantep": {
    about:
      "Şahinbey, Gaziantep'in en büyük ve en kalabalık ilçesi olup şehrin merkezi iş ve ticaret bölgesini kapsar. Gaziantep Kalesi, Bakırcılar Çarşısı ve tarihi hanlar ilçenin Osmanlı dönemi mirasını yansıtır. UNESCO Gastronomi Şehri Gaziantep'in efsanevi mutfağı — baklava, kebap çeşitleri, lahmacun ve katmer — bu ilçedeki geleneksel lokantalarda yaşatılır. Zeugma Mozaik Müzesi, Savunma ve Kahramanlık Panoramik Müzesi ve Emine Göğüş Mutfak Müzesi kültürel cazibe noktalarıdır. Antep fıstığı işleme tesisleri şehrin ekonomik omurgasını oluşturur.",
    strategy:
      "Şahinbey'de tarihi kale silüetini, bakır işçiliği dükkanlarını ve baklavacı vitrinlerini arayın. 27 plaka kodu ve 'Antep' ibareli dükkan tabelaları güçlü ipuçlarıdır. Kireçtaşı mimari, dar çarşı sokakları ve yoğun ticari yaşam belirgindir. Gaziantep'in UNESCO Gastronomi tabelaları konumu kesinleştirir.",
    funFact:
      "Gaziantep baklavası, 2013 yılında Avrupa Birliği coğrafi işaret tescili alan ilk Türk tatlısıdır. Şahinbey'deki geleneksel baklavacılar, 40 kat yufkayı elle açarak Antep fıstıklı baklavayı üretir. Şehirde 200'den fazla aktif baklavacı dükkanı bulunmaktadır.",
  },

  // ==================== MARMARA BÖLGESİ ====================

  "adapazari-sakarya": {
    about:
      "Adapazarı, Sakarya ilinin merkezi ve Marmara Bölgesi'nin doğu ucundaki verimli bir ova şehridir. Sakarya Nehri'nin suladığı alüvyon düzlükleri üzerine kurulmuş olan kent, tarım ve sanayinin iç içe geçtiği kendine özgü bir dokuya sahiptir. Sapanca Gölü'ne yakınlığı, kentin batı girişindeki yeşil kuşağı oluşturur. 1999 depreminden sonra büyük ölçüde yeniden inşa edilen modern yapılar, eski mahallelerdeki Osmanlı dönemi ahşap konaklarla kontrast yaratır. Kent merkezindeki Uzunçarşı sokağı geleneksel esnafıyla hâlâ canlılığını korurken, Serdivan ve Erenler yönündeki yeni yerleşim alanları modern apartman bloklarıyla genişlemektedir. Sakarya'nın Karadeniz geçiş iklimi nedeniyle yeşil bitki örtüsü Marmara'nın diğer ovalarına göre belirgin şekilde daha yoğundur.",
    strategy:
      "Adapazarı'nda düz ova arazisi, geniş tarım alanları ve nehir yatakları karakteristiktir. 1999 sonrası inşa edilmiş depreme dayanıklı modern binalar çoğunluktadır. 54 plaka kodu Sakarya'nın kesin göstergesidir. Sanayi tesisleri ve fabrika bacaları kent çevresinde sıkça görülür. Sakarya Nehri köprüleri ve kordon yolu önemli ipuçlarıdır.",
    funFact:
      "Adapazarı'nın ünlü ıslak hamburger geleneği, kentin simgesi haline gelmiştir. Buharda bekletilen küçük hamburgerlerin buğulu cam vitrinlerdeki görüntüsü kente özgüdür. Sakarya ayrıca Türkiye'nin en büyük fındık işleme tesislerinden bazılarına ev sahipliği yapar.",
  },
  "avcilar-istanbul": {
    about:
      "Avcılar, İstanbul'un Avrupa yakasında Küçükçekmece Gölü ile Marmara Denizi kıyısı arasında uzanan bir ilçedir. İstanbul Üniversitesi-Cerrahpaşa kampüsünün burada yer alması nedeniyle yoğun bir öğrenci nüfusuna sahiptir. Ambarlı Limanı'na komşuluğu ilçeyi lojistik ve ticaret açısından stratejik kılar. Avcılar sahil yolu Marmara kıyısı boyunca uzanırken, iç kesimlerdeki yerleşim alanları 1980 sonrası göçle birlikte hızla yapılaşmıştır. Küçükçekmece Gölü kıyısındaki sazlıklar kuş gözlemcileri için önemli bir durak noktasıdır. İlçenin Florya ve Beylikdüzü arasındaki konumu, E-5 ve TEM otoyollarının geçiş güzergâhında olmasıyla trafik yoğunluğunu beraberinde getirir.",
    strategy:
      "Avcılar'da Küçükçekmece Gölü manzarasını, sahil yolundaki balıkçı barınaklarını ve üniversite kampüs tabelalarını arayın. E-5 karayolu üzerindeki yoğun trafik ve büyük alışveriş merkezleri belirgindir. 34 plaka kodu İstanbul'u, sahildeki düzlük arazi ve göl manzarası ise Avcılar'ı işaret eder.",
    funFact:
      "Avcılar adını, Osmanlı döneminde bölgedeki ormanlarda av partileri düzenleyen saray avcılarından almıştır. Küçükçekmece Gölü kenarındaki arkeolojik kazılarda Neolitik döneme ait yerleşim izleri bulunmuş, bölgenin 8.000 yıllık geçmişi ortaya çıkmıştır.",
  },
  "bakirkoy-istanbul": {
    about:
      "Bakırköy, İstanbul'un Avrupa yakasında Marmara Denizi kıyısında yer alan köklü bir ilçedir. Ataköy sahil şeridi, Botanik Park ve tarihi Bakırköy çarşısı ilçenin en tanınan noktalarıdır. Cumhuriyet döneminin ilk planlı yerleşim alanlarından biri olan Ataköy sitelerinin modernist mimarisi dikkat çeker. Yeşilköy'ün Rum ve Ermeni geçmişinden kalan taş villalar, sahil boyunca sıralanan balık restoranları ve hafta sonları dolup taşan sahil parkları Bakırköy'ün karakterini oluşturur. Havalimanı yakınlığı ve metrobüs hattının geçmesi ilçeyi ulaşım açısından merkezi konuma getirmiştir. İncirli ve Kartaltepe mahalleleri yoğun konut dokusuyla ticari bölgelere geçiş yapar.",
    strategy:
      "Bakırköy'de Marmara kıyısındaki geniş sahil parkını, marina görüntüsünü ve Ataköy'ün planlı yerleşim bloklarını arayın. Yeşilköy'deki tarihi taş evler ve uçak iniş güzergâhındaki alçak uçuşlar ayırt edici ipuçlarıdır. E-5 üzerindeki metrobüs durakları ve 34 plaka kodu yardımcı göstergelerdir.",
    funFact:
      "Bakırköy'ün adı, Bizans döneminde bölgedeki bakır atölyelerinden (Makrohori) gelir. Yeşilköy ise eski adıyla San Stefano olarak bilinir ve 1878'de Osmanlı-Rus Savaşı'nı bitiren ön barış antlaşması burada imzalanmıştır.",
  },
  "besiktas-istanbul": {
    about:
      "Beşiktaş, İstanbul Boğazı'nın Avrupa yakasındaki en merkezi ve hareketli ilçelerden biridir. Dolmabahçe Sarayı, Ortaköy Camii, Çırağan Sarayı ve Yıldız Parkı gibi simge yapılar bu ilçede yer alır. Boğaz köprülerinin Avrupa yakası ayağı Beşiktaş sınırları içindedir. Barbaros Bulvarı üzerindeki iş merkezleri, Bebek ve Arnavutköy sahilindeki yalılar ve tarihi ahşap evler, ilçeye hem modern hem nostaljik bir hava katar. Beşiktaş meydanı balıkçıların, öğrencilerin ve iş insanlarının buluştuğu canlı bir merkezdir. Ortaköy'ün sanatlı meydanı ve kumpir tezgâhları, Boğaz manzarasıyla birleşerek İstanbul'un en çok ziyaret edilen noktalarından birini yaratır.",
    strategy:
      "Beşiktaş'ta Boğaz kıyısındaki yalıları, Dolmabahçe Sarayı'nın beyaz cephesini ve Boğaziçi Köprüsü'nün silüetini arayın. Ortaköy Camii'nin deniz kenarındaki ikonik görüntüsü kolay tanınır. Vapur iskelesi ve Beşiktaş meydanındaki kalabalık belirgindir. 34 plaka ve Boğaz manzarası kesin ipuçlarıdır.",
    funFact:
      "Dolmabahçe Sarayı'ndaki 4,5 tonluk Bohemya kristali avize, dönemin en büyük avizesi olarak Kraliçe Victoria tarafından hediye edilmiştir. Saray, 285 oda ve 46 salonuyla Avrupa'nın en büyük saraylarından biridir. Atatürk, son günlerini bu sarayda geçirmiştir.",
  },
  "cumalikizik-bursa": {
    about:
      "Cumalıkızık, Bursa'nın Yıldırım ilçesine bağlı, UNESCO Dünya Mirası Listesi'nde yer alan 700 yıllık bir Osmanlı köyüdür. Uludağ'ın kuzey eteklerinde kurulan köy, Osmanlı sivil mimarisinin en iyi korunmuş örneklerini barındırır. Renkli boyalı ahşap ve kerpiç evler, dar arnavut kaldırımlı sokaklar ve çiçekli avlular köyü açık hava müzesine dönüştürür. Osmanlı'nın kuruluş dönemine tanıklık eden köy, her yıl düzenlenen Ahududu Festivali ile de ünlüdür. Yerel kadınların ev yapımı gözleme, tarhana ve reçel sattığı tezgâhlar sokakları süsler. Köyün geleneksel dokusu, Türkiye'nin en çok ziyaret edilen kırsal miras alanlarından biri olmasını sağlamıştır.",
    strategy:
      "Cumalıkızık'ta renkli boyalı ahşap evlerin dar taş sokaklarda sıralandığını göreceksiniz. Çiçekli balkonlar, ahşap çıkmalar ve arnavut kaldırım karakteristiktir. Köy girişindeki UNESCO tabelası ve geleneksel ürün satan tezgâhlar belirgindir. Uludağ silueti arka planda görülür. 16 plaka Bursa'yı işaret eder.",
    funFact:
      "Cumalıkızık, adını Osmanlı'nın kuruluşunda Osman Gazi'ye destek veren Kızık boyundan alır. 'Cumalı' eki ise köyde cuma namazı kılınan bir caminin varlığından gelir. Köydeki 270 evin yaklaşık 180'i orijinal Osmanlı dokusuyla ayakta durmaktadır.",
  },
  "eminonu-istanbul": {
    about:
      "Eminönü, İstanbul'un Haliç kıyısındaki tarihi ticaret merkezidir. Yeni Cami, Mısır Çarşısı (Baharatçılar Çarşısı) ve Galata Köprüsü'nün güney ayağı burada yer alır. Vapur iskelelerinden kalkan gemiler Kadıköy, Üsküdar ve Adalara ulaşımı sağlar. Eminönü meydanı, balık-ekmek tekneleri, seyyar satıcılar ve turist kalabalığıyla İstanbul'un en kaotik ve canlı noktasıdır. Sirkeci Garı'nın tarihi cephesi Orient Express'in son durağı olarak nostalji taşırken, Haliç üzerindeki Galata Köprüsü'nün alt katındaki balık restoranları şehrin ikonik görüntülerinden birini sunar. Tahtakale ve Eminönü han bölgesi toptan ticaretin merkezi olmaya devam eder.",
    strategy:
      "Eminönü'nde Galata Köprüsü'nden sarkan olta çubuklarını, vapur iskeleleri ve kalabalık meydanı arayın. Yeni Cami'nin büyük kubbesi ve Mısır Çarşısı girişi belirgin yapılardır. Haliç'in dar su yolu ve karşıda Galata Kulesi'nin silueti güçlü ipuçlarıdır. 34 plaka kodunu arayın.",
    funFact:
      "Sirkeci Garı, 1890'da açılarak ünlü Orient Express treninin son durağı olmuştur. Alman mimar August Jachmund'un tasarladığı bina, Osmanlı ve Avrupa mimari stillerinin harmanıdır. Agatha Christie'nin meşhur romanına ilham veren hat buradan başlardı.",
  },
  "gebze-kocaeli": {
    about:
      "Gebze, Kocaeli'nin batısında Marmara Denizi kıyısında yer alan büyük bir sanayi ve lojistik merkezidir. Osmanlı sadrazamı Çoban Mustafa Paşa Külliyesi, Mimar Sinan eseri olarak kentin tarihî mirasını temsil eder. Modern Gebze ise organize sanayi bölgeleri, TÜBİTAK kampüsü ve teknoloji vadileriyle Türkiye'nin Ar-Ge üssü konumundadır. Osman Gazi Köprüsü'nün Kocaeli ayağı Gebze yakınlarındadır ve İzmit Körfezi manzarası ilçeye kıyı hissiyatı katar. Eskihisar'daki Hannibal Mezarı tarihi bir ilgi noktasıdır. Darıca Hayvanat Bahçesi ve sahil yolu aileler için popüler rekreasyon alanları arasındadır.",
    strategy:
      "Gebze'de sanayi bölgesi tabelalarını, fabrika yapılarını ve yoğun TIR trafiğini fark edeceksiniz. Osman Gazi Köprüsü yaklaşım yolları ve İzmit Körfezi manzarası önemli ipuçlarıdır. TÜBİTAK ve teknoloji vadisi yönlendirmeleri Gebze'ye özgüdür. 41 plaka kodu Kocaeli'yi işaret eder.",
    funFact:
      "Kartaca komutanı Hannibal'ın mezarının Gebze'de olduğuna inanılır. MÖ 183'te Roma'dan kaçarken Bithynia Kralı'na sığınan Hannibal, teslim edilmek üzere olduğunu anlayınca burada hayatına son vermiştir. Eskihisar'daki anıt mezar bu hikâyeyi yaşatır.",
  },
  "gelibolu-canakkale": {
    about:
      "Gelibolu, Çanakkale Boğazı'nın Avrupa yakasında Gelibolu Yarımadası'nın kuzeyinde yer alan tarihi bir liman kasabasıdır. Birinci Dünya Savaşı'ndaki Çanakkale Savaşları'nın geçtiği yarımada, bugün Gelibolu Yarımadası Tarihi Milli Parkı olarak korunmaktadır. Anzak Koyu, Conkbayırı, Lone Pine ve Şehitler Abidesi gibi anıtlar her yıl binlerce ziyaretçi çeker. Kasabanın kendisi sessiz bir balıkçı limanıyla Marmara Denizi'ne açılır. Piri Reis'in burada doğmuş olması, denizcilik tarihindeki önemini vurgular. Yazlık balık restoranları ve Ecebat feribotu günlük yaşamın parçasıdır.",
    strategy:
      "Gelibolu'da savaş anıtlarını, asker mezarlıklarını ve milli park tabelalarını arayın. Boğaz manzarası, feribot iskelesi ve küçük liman belirgindir. ANZAC ve şehitlik yönlendirme levhaları bölgeye özgüdür. 17 plaka Çanakkale'yi işaret eder. Yarımadanın fundalık bitki örtüsü ve deniz kıyısı karakteristiktir.",
    funFact:
      "Piri Reis, 1465'te Gelibolu'da doğmuş ve amcası Kemal Reis'in yanında denizcilik öğrenmiştir. 1513 tarihli dünya haritası, Amerika kıtasının bilinen en eski haritalarından biridir ve Topkapı Sarayı'nda keşfedilmiştir.",
  },
  "karesi-balikesir": {
    about:
      "Karesi, Balıkesir ilinin merkez ilçesi ve Güney Marmara'nın önemli ticaret merkezlerinden biridir. Adını Karesi Beyliği'nden alan ilçe, Osmanlı öncesi Türk tarihinin önemli bir halkasıdır. Kent merkezindeki Zağnos Paşa Camii, Saat Kulesi ve Kuvayi Milliye Müzesi tarihi zenginliği yansıtır. Balıkesir ovası zeytincilik ve hayvancılık açısından son derece verimlidir. Kaz Dağları'nın güneybatıda, Uludağ'ın kuzeydoğuda silüet oluşturması kente dağ çerçevesi kazandırır. Bandırma Kuş Cenneti'ne ve termal kaynaklara yakınlığı Balıkesir'i bir geçiş ve keşif noktası yapar.",
    strategy:
      "Karesi'de geniş düzlüklerdeki zeytin bahçelerini, şehir merkezindeki Saat Kulesi'ni ve ova arazisini arayın. 10 plaka kodu Balıkesir'in kesin göstergesidir. Kaz Dağları silueti ve termal otel tabelaları bölgeye özgü ipuçlarıdır. Ticaret merkezindeki geleneksel esnaf dükkânları karakteristiktir.",
    funFact:
      "Karesi Beyliği, Osmanlı'ya katılan ilk Türk beyliğidir ve donanmasını Osmanlılara devretmesiyle Osmanlı'nın deniz gücünün temelini oluşturmuştur. Balıkesir'in Kuvayi Milliye dönemindeki kongreleri ise Milli Mücadele'nin ilk örgütlenme adımlarından sayılır.",
  },
  "kartal-istanbul": {
    about:
      "Kartal, İstanbul'un Anadolu yakasında Marmara Denizi kıyısında yer alan, eski sanayi kimliğinden konut ve ticaret merkezine dönüşen dinamik bir ilçedir. Dragos Tepesi'nden Adalar ve karşı kıyı manzarası nefes kesicidir. Kartal sahil yolu, bisiklet parkuru ve yürüyüş alanlarıyla son yıllarda büyük dönüşüm geçirmiştir. Aydos Ormanı ilçenin kuzeyinde doğal bir tampon bölge oluşturur. Kartal Meydanı'ndaki cami ve çarşı geleneksel dokuyu korurken, sahil hattındaki modern rezidanslar ve iş merkezleri yeni Kartal'ın yüzünü çizer. E-5 ve D-100 karayollarının kavşağındaki konumu ulaşımı kolaylaştırır.",
    strategy:
      "Kartal'da Marmara kıyısındaki yeni sahil düzenlemesini, modern rezidansları ve Dragos Tepesi'ne çıkan yolu arayın. Adalar manzarası deniz yönünden görülür. Marmaray ve metro istasyonları toplu ulaşım ipuçları sağlar. 34 plaka İstanbul'u, Anadolu yakası görünümü ve sahil çizgisi Kartal'ı daraltır.",
    funFact:
      "Aydos Kalesi, İstanbul'un Anadolu yakasındaki en yüksek noktada (537 m) yer alan Bizans dönemi kalesidir. Kartal sınırları içindeki bu tepeden hem Marmara Denizi hem de Karadeniz yönü görülebilir ve İstanbul'un iki deniz arasındaki konumu somutlaşır.",
  },
  "maltepe-istanbul": {
    about:
      "Maltepe, İstanbul'un Anadolu yakasında Marmara kıyısında uzanan, sahil parkı ve dolgu alanlarıyla tanınan bir ilçedir. Maltepe sahil parkı, İstanbul'un en büyük kıyı rekreasyon alanlarından biri olarak piknik, spor ve konser etkinliklerine ev sahipliği yapar. Başıbüyük mahallesindeki kentsel dönüşüm projeleri ile Cevizli ve İdealtepe'deki yerleşik konut alanları ilçenin kontrastını oluşturur. Bağdat Caddesi'nin doğu uzantısı Maltepe'den geçer. İlçenin güneydoğusundaki kayalık sahil hattı, Adalar manzarasıyla birleşerek doğal bir güzellik sunar. Maltepe, Kadıköy ile Pendik arasındaki geçiş bölgesinde kentsel yoğunluğun arttığı bir aksı temsil eder.",
    strategy:
      "Maltepe'de geniş dolgu sahil parkını, bisiklet yollarını ve çim alanları arayın. Marmara Denizi ve Adalar manzarası sahilden belirgindir. Marmaray istasyonları ve D-100 karayolu geçişi önemli ipuçlarıdır. 34 plaka kodu İstanbul'u, geniş sahil düzenlemesi ve Anadolu yakası silueti Maltepe'yi işaret eder.",
    funFact:
      "Maltepe sahil parkındaki dolgu alan, 2013'ten itibaren İstanbul'un en büyük açık hava konser ve festival mekanına dönüşmüştür. 1,2 milyon metrekarelik park alanı, her yıl milyonlarca ziyaretçi ağırlayarak Anadolu yakasının sosyal merkezi haline gelmiştir.",
  },
  "merkez-edirne": {
    about:
      "Edirne, Osmanlı İmparatorluğu'nun İstanbul'dan önceki başkenti olarak muazzam bir tarihî mirasa sahiptir. Mimar Sinan'ın başyapıtı Selimiye Camii UNESCO Dünya Mirası Listesi'ndedir ve İslam mimarisinin zirvesi kabul edilir. Eski Cami, Üç Şerefeli Cami ve tarihi Arasta çarşısı kentin Osmanlı silüetini tamamlar. Meriç ve Tunca nehirlerinin buluştuğu noktadaki köprüler ve nehir boyunca uzanan yeşil alanlar Edirne'ye Balkan havası katar. Her yaz düzenlenen Kırkpınar Yağlı Güreş Festivali dünyanın en eski spor organizasyonudur. Trakya mutfağının ciğer tava ve badem ezmesi gibi ikonik tatları Edirne'ye özgüdür.",
    strategy:
      "Edirne'de Selimiye Camii'nin dört minareli siluetini, taş köprüleri ve nehir manzarasını arayın. Balkan mimarisine özgü iki katlı taş evler ve geniş bulvarlar karakteristiktir. 22 plaka kodu Edirne'nin kesin göstergesidir. Trakya ovası düzlüğü ve Bulgaristan-Yunanistan sınır tabelaları bölgeyi daraltır.",
    funFact:
      "Kırkpınar Yağlı Güreşleri, 1362'den bu yana kesintisiz düzenlenen dünyanın en eski spor organizasyonudur ve UNESCO Somut Olmayan Kültürel Miras Listesi'nde yer alır. Her yıl haziran-temmuz aylarında Sarayiçi'ndeki çimenlik alanda düzenlenen turnuva binlerce pehlivan ve seyirci çeker.",
  },
  "merkez-yalova": {
    about:
      "Yalova, Marmara Denizi'nin güneyinde İstanbul'a deniz otobüsüyle bir saat mesafedeki küçük ama şirin bir kıyı şehridir. Termal kaplıcaları, Yürüyen Köşk ve çiçek festivalleriyle tanınır. Kent merkezi Marmara sahilinde düz bir hat üzerinde uzanır; palmiye ve çınar ağaçlıklı sahil yolu akşam yürüyüşlerinin vazgeçilmezidir. Termal ilçesindeki Osmanlı dönemi hamamları ve Atatürk'ün sıkça ziyaret ettiği Yürüyen Köşk tarihi çekim noktalarıdır. Yalova'nın mikro iklimi ve zengin bitki örtüsü, kenti süs bitkileri yetiştiriciliğinin Türkiye'deki başkenti yapmıştır. İstanbul'dan kolay ulaşım, hafta sonu turizmini canlı tutar.",
    strategy:
      "Yalova'da palmiye ve çınar ağaçlı sahil yolunu, Marmara Denizi manzarasını ve feribot/deniz otobüsü iskelesini arayın. Termal tabelaları ve çiçek seraları bölgeye özgü ipuçlarıdır. 77 plaka kodu Yalova'nın kesin göstergesidir. Küçük şehir ölçeği ve sahil düzlüğü İstanbul'dan ayırır.",
    funFact:
      "Atatürk'ün Yalova Termal'deki köşkü, yol genişletme çalışması sırasında kesilmek istenen çınar ağacını kurtarmak için 1930'da raylar üzerinde kaydırılmıştır. 'Yürüyen Köşk' adını bu olaydan alan yapı, bugün müze olarak ziyarete açıktır.",
  },
  "merkez-canakkale": {
    about:
      "Çanakkale, Asya ve Avrupa'yı birbirinden ayıran Çanakkale Boğazı'nın kıyısında kurulmuş stratejik bir liman şehridir. Kale-i Sultaniye (Çimenlik Kalesi) ve karşısındaki Kilitbahir Kalesi boğazın iki yakasını kontrol eden Osmanlı savunma hatlarıdır. Kent merkezi boğaz kıyısında uzanan kordon boyuyla canlıdır; öğrenci şehri olarak kafeler ve kitapçılarla doludur. Saat Kulesi kent meydanının simgesidir. Çanakkale Savaşları'nın anıtları ve Truva Antik Kenti'ne yakınlığı kenti hem tarihi hem turistik açıdan öne çıkarır. Kordon boyundaki tahta Truva Atı replikası kentin en fotoğraflanan noktasıdır.",
    strategy:
      "Çanakkale'de boğaz kıyısındaki kordon yolunu, Truva Atı replikasını ve Çimenlik Kalesi'ni arayın. Feribot iskelesi ve karşı kıyıdaki Kilitbahir Kalesi belirgin yapılardır. 17 plaka kodu Çanakkale'yi işaret eder. Üniversite öğrencilerinin yoğunluğu ve sahildeki kafe sıraları karakteristiktir.",
    funFact:
      "Çanakkale Boğazı'ndan günde yaklaşık 130 gemi geçer ve dünyanın en yoğun su yollarından biridir. Boğazın en dar yeri yalnızca 1.200 metre olup, 2023'te açılan 1915 Çanakkale Köprüsü ile artık karayoluyla da geçilebilmektedir.",
  },
  "pendik-istanbul": {
    about:
      "Pendik, İstanbul'un Anadolu yakasının güneydoğusunda Marmara kıyısında uzanan geniş bir ilçedir. Sabiha Gökçen Havalimanı'nın burada yer alması Pendik'i İstanbul'un ikinci hava ulaşım merkezi yapar. Kurtköy bölgesindeki yeni yerleşim alanları, AVM'ler ve hastane kampüsleri modern yapılaşmayı temsil ederken, eski Pendik merkezi geleneksel çarşı ve konut dokusuyla bir kasaba havası korur. Tuzla sınırındaki sahil hattı marina ve yat limanlarıyla donatılmıştır. Aydos Ormanı'nın güney etekleri ilçeye yeşil bir arka plan sağlar. Pendik-Kaynarca metrosu ve Marmaray bağlantısı ulaşımı güçlendirmiştir.",
    strategy:
      "Pendik'te havalimanı yaklaşım yollarını, Sabiha Gökçen tabelalarını ve yeni yapı stoğunu arayın. Kurtköy bölgesindeki büyük hastane ve AVM tabelaları belirgindir. Marmaray istasyonu ve marina görüntüsü yardımcı ipuçlarıdır. 34 plaka İstanbul'u, havalimanı yakınlığı ve Anadolu yakası düzlüğü Pendik'i daraltır.",
    funFact:
      "Pendik adı, antik Panteikhion yerleşiminden gelir. 2015'te Yeniçağ mahallesi kazılarında Marmara kıyısında 8.500 yıllık Fikirtepe kültürüne ait yerleşim kalıntıları bulunmuş ve bu keşif İstanbul'un bilinen en eski yerleşim izlerinden birini ortaya koymuştur.",
  },
  "sariyer-istanbul": {
    about:
      "Sarıyer, İstanbul Boğazı'nın Karadeniz'e açıldığı kuzey ucunda, Avrupa yakasında yer alır. Rumeli Feneri, Rumeli Hisarı, Emirgan Korusu ve Belgrad Ormanı gibi doğa ve tarih alanları ilçenin sınırları içindedir. Boğaz'ın en dar noktasındaki Rumeli Hisarı'ndan kuzeye doğru ilerledikçe sahil kasabaları Tarabya, Büyükdere ve Sarıyer merkez sıralanır. Sarıyer balık hali ve balık restoranları İstanbul'un deniz ürünleri kültürünün merkezidir. Belgrad Ormanı kentin en büyük doğal parkı olarak hafta sonları binlerce İstanbullunun sığınağıdır. Emirgan Korusu lale festivaliyle ünlüdür.",
    strategy:
      "Sarıyer'de Boğaz'ın kuzey ucundaki geniş açıklığı, Rumeli Feneri'ni ve orman alanlarını arayın. Sahil kasabalarındaki balık restoranları ve yalılar belirgindir. Belgrad Ormanı tabelaları ve Emirgan Korusu girişi önemli ipuçlarıdır. 34 plaka ve Boğaz'ın genişleyen kuzey ağzı Sarıyer'i işaret eder.",
    funFact:
      "Rumeli Hisarı, Fatih Sultan Mehmed tarafından 1452'de İstanbul'un fethine hazırlık olarak sadece 4 ay 16 günde inşa ettirilmiştir. Boğaz'ın en dar noktasını kontrol eden hisar, karşısındaki Anadolu Hisarı ile birlikte deniz trafiğini tamamen kesmiştir.",
  },
  "taksim-istanbul": {
    about:
      "Taksim, İstanbul'un modern yüzünü temsil eden Beyoğlu ilçesinin kalbidir. Taksim Meydanı'ndaki Cumhuriyet Anıtı ve İstiklal Caddesi'nin başlangıç noktası burayı İstanbul'un en merkezi noktası kılar. İstiklal Caddesi boyunca art nouveau yapılar, konsoloslukhane binaları, tarihi pasajlar ve nostaljik tramvay uzanır. Gezi Parkı meydanın hemen yanında şehrin nadir yeşil alanlarından birini oluşturur. Cihangir ve Çukurcuma mahalleleri antikacılar, galeriler ve kafelerle bohemyen bir atmosfer sunar. Taksim aynı zamanda İstanbul'un en yoğun metro, otobüs ve füniküler aktarma noktasıdır.",
    strategy:
      "Taksim'de İstiklal Caddesi'ndeki nostaljik kırmızı tramvayı, yoğun kalabalığı ve art nouveau bina cephelerini arayın. Cumhuriyet Anıtı ve meydandaki geniş alan belirgindir. Konsolosluk binaları üzerindeki bayraklar ve tarihi pasajların dar girişleri ipucu sağlar. 34 plaka ve tramvay hattı kesin göstergelerdir.",
    funFact:
      "İstiklal Caddesi, Osmanlı döneminde 'Grand Rue de Péra' olarak bilinir ve şehrin Avrupalı diplomatlarının yaşadığı kozmopolit bir cadde olarak şöhret kazanmıştır. Günde ortalama 3 milyon kişinin yürüdüğü cadde, Türkiye'nin en kalabalık yaya yoludur.",
  },
  "truva-canakkale": {
    about:
      "Truva (Troia), Çanakkale'nin Tevfikiye köyü yakınlarında yer alan ve Homeros'un İlyada destanıyla dünyaca ünlü antik kenttir. UNESCO Dünya Mirası Listesi'ndeki sit alanı, MÖ 3000'den Roma dönemine kadar uzanan dokuz farklı yerleşim katmanını barındırır. Kazı alanındaki taş duvar kalıntıları, rampa girişleri ve megaron yapıları Bronz Çağı uygarlığına tanıklık eder. Girişteki ahşap Truva Atı replikası ziyaretçilerin fotoğraf noktasıdır. Çevredeki tarım arazileri ve Ege manzarası antik kenti sakin bir kırsal peyzajla çevreler. Kazılar Heinrich Schliemann tarafından 1870'lerde başlatılmış ve hâlâ uluslararası ekipler tarafından sürdürülmektedir.",
    strategy:
      "Truva'da arkeolojik kazı alanını, bilgilendirme panolarını ve ahşap at replikasını arayın. UNESCO Dünya Mirası işaretleri ve müze binası belirgindir. Çevredeki düzlük tarım arazileri ve Ege iklimine has zeytinlikler bölgeyi tanımlar. 17 plaka Çanakkale'yi işaret eder.",
    funFact:
      "Heinrich Schliemann, 1873'te Truva'da bulduğu altın takıları 'Priamos Hazinesi' olarak adlandırmıştır. Hazine Berlin'e kaçırılmış, İkinci Dünya Savaşı sonunda Sovyet ordusu tarafından Moskova'ya götürülmüş ve bugün hâlâ Puşkin Müzesi'nde sergilenmektedir.",
  },
  "uludag-bursa": {
    about:
      "Uludağ, 2.543 metre yüksekliğiyle Marmara Bölgesi'nin en yüksek dağı ve Türkiye'nin en popüler kış sporları merkezidir. Antik çağda Olympos Mysios olarak bilinen dağ, mitolojide tanrıların Truva Savaşı'nı izlediği yer sayılırdı. Teleferik ve otoyol ile ulaşılan kayak merkezinde onlarca otel, pistler ve yayla restoranları bulunur. Yaz aylarında yaylacılık, trekking ve doğa kampçılığı yapılır. Uludağ Milli Parkı çeşitli endemik bitki türlerine ve yaban hayatına ev sahipliği yapar. Bursa şehir merkezinden teleferikle yükselen manzara, ova ve Marmara Denizi'ni bir arada sunar.",
    strategy:
      "Uludağ'da kayak pistlerini, teleferik hatlarını, karlı dağ oteli tabelalarını ve çam ormanlarını arayın. Kışın yoğun kar örtüsü, yazın ise yemyeşil yayla manzarası görülür. Uludağ Milli Parkı giriş kapısı belirgindir. 16 plaka Bursa'yı, dağ otelleri ve kayak altyapısı Uludağ'ı kesinleştirir.",
    funFact:
      "Uludağ teleferik hattı 1963'te açılmış ve uzun süre dünyanın en uzun teleferik hatlarından biri olmuştur. Bugünkü modern sistem 9 km uzunluğuyla yolcuları Bursa kent merkezinden 1.810 metre yüksekliğe 22 dakikada çıkarır.",
  },
  "corlu-tekirdag": {
    about:
      "Çorlu, Tekirdağ ilinin en kalabalık ilçesi ve Trakya'nın sanayi başkentidir. İstanbul-Edirne otoyolu üzerindeki stratejik konumu onu lojistik ve üretim merkezi haline getirmiştir. Tekstil, gıda ve kimya sektörlerindeki fabrikalar ilçe çevresinde yoğunlaşmıştır. Kent merkezi Trakya'nın tipik ova yerleşimi görünümündedir; geniş caddeler, düşük katlı yapılar ve ayçiçeği tarlaları çevre peyzajını oluşturur. Çorlu Deresi üzerindeki Osmanlı dönemi köprüsü ve Fatih Camii tarihi dokuyu temsil eder. Son yıllarda İstanbul'dan göç alan ilçe, hızlı nüfus artışıyla Trakya'nın en dinamik yerleşimine dönüşmüştür.",
    strategy:
      "Çorlu'da Trakya ovasının düz arazisini, sanayi bölgesi tabelalarını ve İstanbul-Edirne otoyolu çıkışlarını arayın. Ayçiçeği tarlaları ve geniş tarım arazileri çevrede belirgindir. 59 plaka kodu Tekirdağ'ı işaret eder. Sanayi tesislerinin yoğunluğu ve ova peyzajı Çorlu'yu daraltır.",
    funFact:
      "Çorlu'nun antik adı Tzurulum'dur ve Roma İmparatorluğu döneminde Via Egnatia yolu üzerinde önemli bir konaklama noktasıydı. Bugün Trakya'nın en büyük organize sanayi bölgelerinden birine ev sahipliği yaparak, tarih boyunca süren ticaret ve geçiş noktası kimliğini korumaktadır.",
  },
  "uskudar-istanbul": {
    about:
      "Üsküdar, İstanbul Boğazı'nın Anadolu yakasındaki en eski ve en köklü yerleşimlerden biridir. Kız Kulesi, Mihrimah Sultan Camii, Çamlıca Tepesi ve Çengelköy sahili ilçenin simge noktalarıdır. Boğaz'ın Anadolu girişindeki konumuyla vapur trafiğinin kalbidir; Üsküdar iskelesi İstanbul'un en işlek aktarma noktalarından biridir. Selimiye Kışlası Florence Nightingale'in hizmet verdiği yer olarak dünya tarihine geçmiştir. Çamlıca Tepesi'ndeki yeni cami ve televizyon kulesi İstanbul'un en yüksek yapıları arasındadır. Kuzguncuk'un renkli ahşap evleri ve çok kültürlü geçmişi ilçeye bohemyen bir katman ekler.",
    strategy:
      "Üsküdar'da Kız Kulesi'nin deniz üzerindeki siluetini, yoğun vapur trafiğini ve Boğaz manzarasını arayın. Çamlıca Tepesi'ndeki kule ve cami arka plan ipucudur. Mihrimah Sultan Camii iskele meydanını domine eder. 34 plaka ve Anadolu yakasından Boğaz görünümü Üsküdar'ı işaret eder.",
    funFact:
      "Kız Kulesi 2.500 yıllık tarihiyle İstanbul'un en eski yapılarından biridir. Boğaz'ın ortasındaki kayalık ada üzerindeki kule; fener, karantina istasyonu, gümrük kontrol noktası ve restoran olarak farklı işlevlerle kullanılmıştır.",
  },
  "izmit-kocaeli": {
    about:
      "İzmit, Kocaeli ilinin merkezi ve İzmit Körfezi'nin doğu ucunda kurulu bir sanayi ve liman şehridir. Antik Nikomedia olarak Bithynia Krallığı'nın başkenti olan kent, Roma İmparatoru Diocletianus'un doğu başkenti olma şerefine de sahiptir. Modern İzmit, petrokimya, kağıt ve otomotiv sanayileriyle Türkiye'nin en büyük endüstriyel bölgelerinden birini barındırır. Körfez kıyısındaki seyir terası ve balıkçı barınakları kent hayatına deniz havası katar. 1999 depremi kenti derinden etkilemiş ve yeniden yapılanma sürecinde modern deprem mühendisliği uygulanmıştır. Seka Park, eski kağıt fabrikasının dönüştürülmesiyle oluşan kentsel yaşam alanıdır.",
    strategy:
      "İzmit'te körfez kıyısındaki sanayi tesislerini, rafineri bacalarını ve liman vinçlerini fark edeceksiniz. Seka Park tabelası ve körfez manzarası belirgindir. 41 plaka kodu Kocaeli'nin göstergesidir. Otoyol kavşakları ve sanayi bölgesi yönlendirmeleri İzmit'e özgü ipuçlarıdır.",
    funFact:
      "İzmit (Nikomedia), MS 4. yüzyılda Roma İmparatorluğu'nun fiili başkenti olmuştur. İmparator Konstantin 337'de burada vaftiz edilmiş ve hayata veda etmiştir. Bugün antik dönemden kalma sütun ve lahit kalıntıları kent merkezinde sergilenmektedir.",
  },
  "sisli-istanbul": {
    about:
      "Şişli, İstanbul'un Avrupa yakasında ticaret, finans ve kültürün buluştuğu merkezi bir ilçedir. Osmanbey ve Nişantaşı moda ve lüks alışverişin adresi olarak öne çıkarken, Bomonti semti butik otelleri ve gastronomi mekanlarıyla yükselen bir bölgedir. Harbiye'deki Askeri Müze, Maçka Parkı ve Hilton Oteli (Türkiye'nin ilk beş yıldızlı oteli) tarihi ve modern katmanları bir arada sunar. Şişli Camii ve Rum, Ermeni kiliseleri kozmopolit geçmişin izlerini taşır. Büyükdere Caddesi'ndeki iş kuleleri ve Mecidiyeköy metro kavşağı İstanbul'un en yoğun iş akslarından birini oluşturur.",
    strategy:
      "Şişli'de Büyükdere Caddesi'ndeki cam gökdelenleri, Nişantaşı'nın dar sokaklarındaki lüks mağaza vitrinlerini ve Osmanbey metro çıkışını arayın. Yoğun yaya ve araç trafiği karakteristiktir. Mecidiyeköy kavşağı ve AVM binaları belirgindir. 34 plaka ve şehir merkezinin yoğun dokusu Şişli'yi işaret eder.",
    funFact:
      "Şişli'deki Bomonti Bira Fabrikası 1890'da İsviçreli Bomonti kardeşler tarafından kurulmuş ve Osmanlı'nın ilk bira fabrikası olmuştur. Bugün fabrika binası butik otel ve kültür merkezine dönüştürülerek İstanbul'un endüstriyel mirasının en başarılı dönüşüm örneklerinden biri haline gelmiştir.",
  },

  // ==================== KARADENİZ BÖLGESİ ====================

  "abant-bolu": {
    about:
      "Abant Gölü, Bolu'nun güneybatısında deniz seviyesinden 1.328 metre yükseklikte yer alan tektonik kökenli bir krater gölüdür. Çevresi köknar, çam ve kayın ormanlarıyla kaplı olan göl, her mevsim farklı bir renk paletine bürünür; sonbaharda altın-kızıl yapraklar, kışın kar örtüsü, ilkbaharda çiçek açan çayırlar manzarayı değiştirir. Göl çevresindeki yürüyüş ve bisiklet parkuru 7 km uzunluğundadır. Abant Tabiat Parkı sınırları içinde fayton turları, at binme ve kano gibi aktiviteler sunulur. Bolu'nun temiz havası ve doğal güzellikleri kenti İstanbul ve Ankara'dan hafta sonu kaçışı arayan ziyaretçilerin gözdesi yapar.",
    strategy:
      "Abant'ta göl çevresindeki orman yolunu, ahşap iskeleri ve fayton duraklarını arayın. Köknar ve kayın ağaçlarının yoğunluğu Batı Karadeniz'e has bir ipucudur. Tabiat Parkı giriş kapısı ve otel tabelaları belirgindir. 14 plaka Bolu'yu işaret eder. Göl yüzeyindeki yansımalar ve dağ silueti karakteristiktir.",
    funFact:
      "Abant Gölü'nde yaşayan Abant alası (Salmo abanticus) dünyada başka hiçbir yerde bulunmayan endemik bir alabalık türüdür. Maalesef aşırı avlanma ve dışarıdan bırakılan türlerle rekabet nedeniyle nesli tehlike altındadır ve koruma çalışmaları sürmektedir.",
  },
  "altinordu-ordu": {
    about:
      "Altınordu, Ordu ilinin merkez ilçesi ve Doğu Karadeniz'in sakin kıyı şehirlerinden biridir. Boztepe Tepesi'nden şehir ve deniz manzarası Karadeniz'in en güzel panoramik görüntülerinden birini sunar. Teleferik hattı kent merkezinden Boztepe'ye ulaşımı sağlar. Sahil yolu boyunca sıralanan çay bahçeleri ve fındık bahçeleri Ordu'nun tarımsal kimliğini yansıtır. Kent, Türkiye'nin en büyük fındık üreticisi olarak 'fındık başkenti' unvanını taşır. Tarihi Rum kiliseleri, Paşaoğlu Konağı Etnografya Müzesi ve Taşbaşı Kilisesi kentin çok katmanlı tarihini gözler önüne serer.",
    strategy:
      "Altınordu'da Boztepe'ye çıkan teleferik hattını, sahil boyundaki fındık bahçelerini ve deniz manzarasını arayın. Karadeniz'e özgü yoğun yeşil bitki örtüsü belirgindir. 52 plaka kodu Ordu'nun kesin göstergesidir. Fındık işleme tesisleri ve çay bahçesi tabelaları bölgeyi daraltır.",
    funFact:
      "Ordu, Türkiye fındık üretiminin yaklaşık yüzde yirmi beşini tek başına karşılar. Dünya fındık üretiminin yüzde yetmişi Türkiye'den geldiği düşünüldüğünde, Ordu küresel çikolata endüstrisinin en kritik tedarik noktalarından biridir.",
  },
  "ayder-rize": {
    about:
      "Ayder Yaylası, Rize'nin Çamlıhemşin ilçesinde 1.350 metre yükseklikte Fırtına Vadisi'nin yukarısında yer alan ünlü bir yayla yerleşimidir. Kaçkar Dağları'nın eteklerindeki konumuyla trekking ve dağcılığın başlangıç noktasıdır. Yaylanın termal kaynakları Osmanlı döneminden beri şifalı sularıyla bilinir. Ahşap yayla evleri, sis bulutları arasından yükselen çam ormanları ve şelale sesleri Ayder'e masalsı bir atmosfer katar. Hemşin kültürünün yoğun olarak yaşandığı yaylada tulum peyniri, muhlama ve Hemşin pidesi yerel mutfağın öne çıkan tatlarıdır. Horon dansı ve kemençe sesi yaylada sıkça duyulur.",
    strategy:
      "Ayder'de dik yamaçlardaki ahşap yayla evlerini, sis ve bulut örtüsünü, şelaleleri ve termal hamam tabelalarını arayın. Kaçkar Dağları'nın karlı zirveleri arka planda görülebilir. Yoğun yeşil çay bahçeleri ve orman örtüsü Karadeniz'e hastır. 53 plaka Rize'yi, yayla dokusu Ayder'i işaret eder.",
    funFact:
      "Ayder'in termal suları 55°C sıcaklıkta yerden çıkar ve romatizma, cilt hastalıkları gibi rahatsızlıklara iyi geldiğine inanılır. Yaylanın Hemşin sakinleri, Ermenice kökenli bir diyalekt konuşan ve asırlardır arıcılık ve hayvancılıkla geçinen kendine özgü bir topluluktur.",
  },
  "firtina-vadisi-rize": {
    about:
      "Fırtına Vadisi, Rize'nin Çamlıhemşin ilçesinde Kaçkar Dağları'ndan Karadeniz'e doğru uzanan derin ve dramatik bir nehir vadisidir. Fırtına Deresi'nin oyduğu vadi, yüzlerce metre derinliğindeki kanyonları, tarihi kemer köprüleri ve yoğun orman örtüsüyle Türkiye'nin en etkileyici doğal alanlarından biridir. Osmanlı dönemi taş kemer köprüleri vadinin en fotoğrafik öğeleridir. Rafting, kanyoning ve trekking için ideal koşullar sunar. Vadi boyunca dağınık Hemşin köyleri, çay tarlaları ve ahşap değirmenler geleneksel yaşamı sürdürür. Zilkale, Çat Kalesi ve Palovit Şelalesi vadinin öne çıkan durak noktalarıdır.",
    strategy:
      "Fırtına Vadisi'nde derin kanyon manzarasını, taş kemer köprüleri ve akan dere yatağını arayın. Rafting tabelaları ve kamp alanı yönlendirmeleri belirgindir. Yoğun orman örtüsü, sisli hava ve dar virajlı dağ yolları Karadeniz'e özgüdür. 53 plaka Rize'yi, vadi derinliği ve kemer köprüler Fırtına Vadisi'ni kesinleştirir.",
    funFact:
      "Fırtına Vadisi'nin adı, vadide sıkça oluşan ani fırtınalardan gelir. Kaçkar Dağları'ndan inen soğuk hava ile Karadeniz'in nemli havası vadide çarpışarak yıl boyunca yağış, sis ve rüzgâr yaratır. Vadideki yıllık yağış miktarı 2.500 mm'yi aşar.",
  },
  "hamsikoy-trabzon": {
    about:
      "Hamsiköy, Trabzon'un Maçka ilçesine bağlı dağ eteklerindeki küçük bir köydür ancak ünü Türkiye sınırlarını aşmıştır: Hamsiköy sütlacı. Zigana Dağı'na giden yol üzerinde 1.200 metre rakımda yer alan köy, yaylacılık geleneğini sürdüren taş ve ahşap evleriyle tipik bir Karadeniz yerleşimidir. Çevresi fındık bahçeleri, çay tarlaları ve ladin ormanlarıyla kaplıdır. Sümela Manastırı'na giden güzergâh üzerinde olması nedeniyle ziyaretçi trafiği yoğundur. Köyün dar yolları, dere kenarındaki değirmenler ve yayla havasıyla buluşan sis manzarası Karadeniz'in otantik kırsal dokusunu yansıtır.",
    strategy:
      "Hamsiköy'de dar dağ yollarını, sütlaç tabelalarını ve köy kahvelerini arayın. Zigana geçidi yönlendirmeleri ve Sümela tabelaları güzergâhı tanımlar. Ladin ormanları, fındık bahçeleri ve dik yamaçlardaki taş evler Karadeniz'e hastır. 61 plaka Trabzon'u, sütlaç tabelaları Hamsiköy'ü kesinleştirir.",
    funFact:
      "Hamsiköy sütlacı, köyün yüksek rakımlı yaylalarında otlayan ineklerin sütünden yapılır. Krema kıvamındaki yoğun dokusu, düşük sıcaklıkta uzun pişirme tekniğinden gelir. Köyde hemen her evin kendi tarifiyle gurur duyduğu sütlaç, Türkiye'nin gastronomi turizmi rotalarının vazgeçilmezi olmuştur.",
  },
  "limni-golu-bolu": {
    about:
      "Limni Gölü (Gölcük), Bolu'nun güneyinde deniz seviyesinden 1.475 metre yükseklikte yer alan volkanik kökenli bir krater gölüdür. Abant'a kıyasla daha sakin ve bakir olan Limni, çevresi sık ormanlarla kaplı küçük bir doğa cennetidir. Gölün ortasındaki küçük ada ilginç bir görüntü oluşturur. Tabiat parkı sınırları içindeki yürüyüş parkurları, kamp alanları ve piknik noktaları doğa severlerin tercihi arasındadır. Sonbaharda göl çevresindeki yaprakların renk değiştirmesi eşsiz bir manzara yaratır. Bolu'nun temiz dağ havası ve doğal güzellikleri gölü sakin bir kaçış noktası yapar.",
    strategy:
      "Limni Gölü'nde küçük krater gölünü, ortadaki adayı ve çevreleyen sık ormanı arayın. Tabiat parkı tabelaları ve kamp alanı yönlendirmeleri belirgindir. Göl Abant'tan daha küçük ve daha yüksektedir. 14 plaka Bolu'yu, volkanik krater formu ve ormanlık dağ peyzajı Limni Gölü'nü tanımlar.",
    funFact:
      "Limni Gölü'nün adı Yunanca 'göl' anlamına gelen 'limni' kelimesinden gelir. Volkanik patlamayla oluşan krater zamanla suyla dolmuş ve ortasındaki koni adacık volkanın son kalıntısı olarak kalmıştır. Göl çevresinde ayı, kurt ve geyik gibi büyük memeliler yaşar.",
  },
  "merkez-amasya": {
    about:
      "Amasya, Yeşilırmak kıyısında dik kayalıkların arasına sıkışmış masalsı bir Anadolu şehridir. Pontus Kralları'nın kayalara oyduğu kral mezarları şehrin tepelerinden aşağıya bakar. Osmanlı dönemi yalıboyu evleri nehir kenarında sıralanarak Amasya'nın en ikonik manzarasını oluşturur. Şehzadeler şehri olarak bilinen Amasya, Osmanlı taht adaylarının valilik yaparak yetiştirildiği yerdir. Amasya Kalesi, Beyazıt Camii ve Hatuniye Medresesi tarihi dokuyu zenginleştirir. Elma bahçeleri kenti çevreleyen vadilerde uzanır ve Amasya elması Türkiye'nin en ünlü yerel ürünlerinden biridir.",
    strategy:
      "Amasya'da Yeşilırmak kıyısındaki yalıboyu evlerini, kayalıklardaki kral mezarlarını ve nehir üzerindeki taş köprüleri arayın. Dar vadi içindeki yerleşim ve dik kayalıklar çok karakteristiktir. 05 plaka kodu Amasya'nın kesin göstergesidir. Kale silüeti ve elma bahçeleri yardımcı ipuçlarıdır.",
    funFact:
      "Amasya, antik coğrafyacı Strabon'un doğum yeridir. Pontus Kral Mezarları MÖ 3. yüzyılda kayalara oyulmuş ve geceleri aydınlatılan bu mezarlar nehre yansıyarak şehre dramatik bir siluet kazandırır. Amasya'nın dar vadisi nedeniyle güneş kışın günde sadece birkaç saat görülür.",
  },
  "merkez-artvin": {
    about:
      "Artvin, Çoruh Nehri vadisinde dik yamaçlara kurulmuş Türkiye'nin en engebeli illerinden biridir. Kent merkezi nehir vadisinin yukarısında, neredeyse dağa tırmanır gibi yükselen binalarıyla kendine özgü bir görüntü sunar. Kafkasör Yaylası'nda her yıl düzenlenen boğa güreşleri geleneksel festivallerin başında gelir. Borçka Karagöl, Şavşat Sahara Milli Parkı ve Yusufeli Barajı çevresi doğa turizmi açısından zengindir. Gürcistan sınırına yakınlığı kültürel etkileşim yaratır. Çoruh Nehri'ndeki rafting parkurları adrenalin tutkunları için uluslararası düzeyde önem taşır.",
    strategy:
      "Artvin'de dik yamaçlara yaslanmış binaları, dar virajlı dağ yollarını ve Çoruh Nehri vadisini arayın. Yoğun orman örtüsü ve dağlık arazi Doğu Karadeniz'e hastır. 08 plaka kodu Artvin'in göstergesidir. Baraj gölleri ve Gürcistan sınır tabelaları bölgeyi daraltır.",
    funFact:
      "Artvin'in Kafkasör Yaylası'nda her haziran ayında düzenlenen boğa güreşleri İspanya'daki boğa dövüşlerinden tamamen farklıdır: burada iki boğa birbirine sürtünerek güç yarıştırır ve hayvanlara zarar verilmez. Festival, UNESCO Somut Olmayan Kültürel Miras adayları arasında değerlendirilmektedir.",
  },
  "merkez-bolu": {
    about:
      "Bolu, Batı Karadeniz'in iç kesiminde ormanlarla çevrili sakin bir şehirdir ve Türkiye'nin aşçılık geleneğinin başkenti olarak kabul edilir. Bolu Dağı'nın eteklerinde kurulan kent, termal kaynakları, gölleri ve yeşil doğasıyla öne çıkar. Kent merkezindeki Yıldırım Bayezid Camii ve tarihi çarşı Osmanlı dönemi mirasını yansıtır. Mudurnu'daki Osmanlı ahşap evleri ve Göynük'teki tarihi konak sokakları ilçenin kırsal zenginliğini tamamlar. Bolu Tüneli, İstanbul-Ankara otoyolunun kritik geçiş noktasıdır. Bolu Dağı geçidi kış aylarında kar ve sis nedeniyle sürücüler için dikkat gerektiren bir güzergâhtır.",
    strategy:
      "Bolu'da dağlık orman arazisini, kayak ve termal otel tabelalarını ve İstanbul-Ankara otoyolu kavşaklarını arayın. 14 plaka kodu Bolu'nun kesin göstergesidir. Şehrin küçük ölçeği, çevreleyen çam ormanları ve dağ geçidi manzarası karakteristiktir. Aşçılık okulu tabelaları bölgeye özgü bir ipucudur.",
    funFact:
      "Bolu, Osmanlı saray mutfağının aşçıbaşılarını yetiştiren bir gelenek taşır. 'Bolu aşçısı' deyimi Türk mutfak kültürünün en yüksek kalite göstergesidir. Bugün kentin adını taşıyan Aşçılık ve Gastronomi Fakültesi, bu geleneği akademik düzeyde sürdürmektedir.",
  },
  "merkez-giresun": {
    about:
      "Giresun, Karadeniz kıyısında yarımada şeklindeki kale tepesinin etrafında kurulmuş antik bir liman şehridir. Giresun Kalesi'nden şehir ve deniz panoraması görülür. Giresun Adası, Karadeniz'in Türkiye kıyılarındaki tek adası olarak özel bir yere sahiptir. Fındık tarımı ekonominin bel kemiğidir; şehir çevresindeki yamaçlar fındık bahçeleriyle kaplıdır. Zeytinlik Mahallesi'ndeki eski Rum taş evleri ve Seyyid Vakkas Türbesi tarihi dokuyu oluşturur. Her mayıs ayında düzenlenen Aksu Festivali geleneksel kutlamaların en önemlisidir. Tirebolu ve Espiye kıyı kasabaları Giresun'un doğusunda sıralanır.",
    strategy:
      "Giresun'da kıyıdaki kale tepesini, limanı ve deniz manzarasını arayın. Fındık bahçeleri yamaçlarda belirgindir. Karadeniz'in koyu mavi suyu ve yeşil bitki örtüsü kontrastı karakteristiktir. 28 plaka kodu Giresun'un göstergesidir. Giresun Adası'nın denizden görüntüsü ek ipucu sağlar.",
    funFact:
      "Kiraz (cherry) kelimesinin kökeni Giresun'un antik adı Kerasous'tan gelir. Roma komutanı Lucullus MÖ 69'da burada keşfettiği kirazı Roma'ya götürmüş ve meyve oradan tüm Avrupa'ya yayılmıştır. Giresun böylece dünyanın kiraz tarihinde özel bir yere sahiptir.",
  },
  "merkez-rize": {
    about:
      "Rize, Doğu Karadeniz'in kalbinde çay tarımının başkenti olarak bilinen kıyı şehridir. Kent merkezi deniz seviyesinden hızla yükselen yamaçlara yayılmıştır; her yöne baktığınızda çay bahçeleri görürsünüz. Rize Kalesi şehrin tepesinden Karadeniz'e bakar. Ziraat Çay Bahçesi kent merkezindeki en popüler buluşma noktasıdır. Bot Suyu Şelalesi ve İyidere Vadisi doğal güzellikleri arasındadır. Rize'nin yağışlı iklimi (yıllık 2.300 mm) çay bitkisinin ideal yetişme koşullarını sağlar. Laz kültürü, horon dansı ve kemençe müziği kentin sosyal yaşamına renk katar.",
    strategy:
      "Rize'de yamaçlardaki çay bahçelerini, çay fabrikası binalarını ve yeşilin baskın olduğu manzarayı arayın. Yağmurlu ve sisli hava Rize'ye özgüdür. 53 plaka kodu Rize'nin kesin göstergesidir. ÇAYKUR tabelaları ve çay toplama işçileri belirgin ipuçlarıdır. Deniz ve dağ manzarasının bir arada olması karakteristiktir.",
    funFact:
      "Rize'de çay tarımı 1938'de Zihni Derin'in Gürcistan'dan getirdiği tohumlarla başlamıştır. Bugün Türkiye dünyanın en büyük beşinci çay üreticisidir ve üretimin tamamına yakını Rize ile çevre illerden gelir. Rizeliler kişi başı yıllık 10 kg çay tüketerek dünya ortalamasının çok üzerindedir.",
  },
  "merkez-zonguldak": {
    about:
      "Zonguldak, Batı Karadeniz'de Türkiye'nin en önemli taş kömürü havzasının merkezidir. 19. yüzyıldan itibaren kömür madenciliği kentin kimliğini şekillendirmiştir; maden ocakları, işçi mahalleleri ve endüstriyel yapılar şehir dokusuna sinmiştir. TTK (Türkiye Taşkömürü Kurumu) tesisleri kent çevresinde yoğunlaşır. Kıyı şeridi boyunca kayalık koylar ve orman örtüsü doğal güzellik sunar. Kozlu ve Kilimli maden kasabaları kentin uzantılarıdır. Zonguldak Limanı kömür ihracatı için stratejik öneme sahiptir. Maden Müzesi kentin endüstriyel tarihini belgeler.",
    strategy:
      "Zonguldak'ta maden ocağı girişlerini, kömür yıkama tesislerini ve endüstriyel yapıları arayın. Karadeniz kıyısındaki kayalık sahil hattı ve orman örtüsü belirgindir. 67 plaka kodu Zonguldak'ın göstergesidir. TTK tabelaları ve maden işçisi anıtları bölgeye özgü ipuçlarıdır.",
    funFact:
      "Zonguldak kömür madenleri 1848'de keşfedilmiş ve bölge Osmanlı'nın ilk endüstriyel yatırım alanı olmuştur. Türkiye'nin bilinen tek taş kömürü yatakları burada bulunur. Maden galerileri şehrin altında yüzlerce kilometre uzanır ve bazı galeriler deniz tabanının altına kadar iner.",
  },
  "ortahisar-trabzon": {
    about:
      "Ortahisar, Trabzon'un merkez ilçesi ve Doğu Karadeniz'in en büyük şehir merkezidir. Trabzon Kalesi kalıntıları, Atatürk Köşkü, Ayasofya Müzesi (Trabzon) ve Boztepe Tepesi ilçenin başlıca tarihi ve turistik noktalarıdır. Trabzon limanı tarih boyunca İpek Yolu'nun Karadeniz çıkış kapısı olmuştur. Meydan Parkı ve Uzun Sokak alışveriş aksı kent yaşamının merkezidir. Karadeniz'e has balık kültürü, hamsi festivalleri ve kemençe geleneği kentin sosyal dokusunu şekillendirir. Atatürk Köşkü'nün çevreleyen ormanı ve Boztepe'den panoramik deniz manzarası ziyaretçileri cezbeder.",
    strategy:
      "Ortahisar'da liman manzarasını, Boztepe'ye çıkan yolu ve kale surlarını arayın. Trabzon Ayasofyası'nın Bizans dönemi cephesi belirgindir. Hamsi temalı restoran tabelaları ve balıkçı barınakları bölgeye özgüdür. 61 plaka kodu Trabzon'un kesin göstergesidir. Yoğun yeşil bitki örtüsü ve deniz manzarası Karadeniz'i işaret eder.",
    funFact:
      "Trabzon'un eski adı Trapezous, Yunanca 'masa/trapez' anlamına gelir ve kentin üzerine kurulduğu düz tepeli kaya oluşumundan kaynaklanır. Trabzon 1204-1461 yılları arasında bağımsız bir Rum İmparatorluğu'nun (Trabzon İmparatorluğu) başkenti olmuş ve Osmanlı'nın fethettiği son Bizans devleti olmuştur.",
  },
  "pokut-yaylasi-rize": {
    about:
      "Pokut Yaylası, Rize'nin Çamlıhemşin ilçesinde 2.032 metre yükseklikte yer alan, geleneksel Hemşin yayla kültürünün en otantik örneklerinden biridir. Kaçkar Dağları'nın kuzeybatı yamaçlarındaki yayla, ahşap yayla evleri (bacalı evler) ile tanınır. Çatı bacalarından yükselen duman, çevreleyen bulut denizi ve alpine çayırlar yaylaya masalsı bir görünüm verir. Yaz aylarında hayvancılıkla geçinen aileler yaylaya çıkar; tulum peyniri yapımı ve arıcılık temel geçim kaynaklarıdır. Ayder'den daha sakin ve bakir olan Pokut, doğa fotoğrafçılarının ve trekking tutkunlarının gözdesidir.",
    strategy:
      "Pokut'ta yüksek yayla düzlüğündeki ahşap bacalı evleri, alpin çayırları ve bulut denizi manzarasını arayın. Çam ormanlarından yaylaya geçiş belirgindir. Dar toprak yollar ve hayvancılık izleri kırsal dokuyu yansıtır. 53 plaka Rize'yi, yüksek rakımlı yayla ve ahşap evler Pokut'u işaret eder.",
    funFact:
      "Pokut Yaylası'ndaki geleneksel ahşap evlerin çatılarında bulunan uzun bacalar, yayla sisinin içeri girmesini engellerken dumanlı ortamda peynir ve et kurutma işlevi de görür. Bu mimari detay Hemşin yaylalarına özgüdür ve yüzyıllardır değişmeden süren bir yapı geleneğini temsil eder.",
  },
  "yedigoller-bolu": {
    about:
      "Yedigöller Milli Parkı, Bolu'nun kuzeyinde yoğun orman örtüsü içinde yedi gölün adını verdiği eşsiz bir doğa alanıdır. Büyük Göl, Nazlı Göl, Seringöl, İnci Göl, Sazlıgöl, Kara Göl ve Deringöl heyelan sonucu oluşmuş baraj gölleridir. Karadeniz ikliminin etkisiyle kayın, köknar, çam ve meşe ormanları parkı kaplar. Özellikle ekim-kasım aylarında yaprak dökümü renkleri dünyaca ünlü fotoğraf karelerine ev sahipliği yapar. Yürüyüş parkurları göller arasında dolaşarak ziyaretçilere farklı perspektifler sunar. Park, bozayı, geyik, kurt ve vaşak gibi yaban hayvanlarına ev sahipliği yapar.",
    strategy:
      "Yedigöller'de orman içi göl manzaralarını, ahşap yürüyüş köprülerini ve milli park giriş kapısını arayın. Sonbahar renklerindeki yapraklar ve yoğun orman örtüsü çok belirgindir. 14 plaka Bolu'yu işaret eder. Dar orman yolları ve göl kenarındaki piknik alanları bölgeye özgüdür.",
    funFact:
      "Yedigöller, UNESCO tarafından Dünya Biyosfer Rezervi olarak kabul edilmiştir. Parkta 50'den fazla ağaç türü bir arada yaşar ve sonbahar döneminde tek bir karede sarı, kırmızı, turuncu, yeşil ve kahverengi tonlarının bir arada görüldüğü fotoğraflar sosyal medyada viral olmaktadır.",
  },
  "zilkale-rize": {
    about:
      "Zilkale, Rize'nin Çamlıhemşin ilçesinde Fırtına Deresi vadisinde, dik bir kayalığın üzerine kurulmuş ortaçağ kalesidir. Yoğun orman ve sis arasında yükselen kale, Karadeniz'in en gizemli ve fotoğrafik yapılarından biridir. 14. yüzyılda inşa edildiği düşünülen kalenin kimin tarafından yapıldığı hâlâ tartışmalıdır; Cenevizliler, Gürcüler veya yerel beyler arasında farklı teoriler vardır. Kalenin iç ve dış surları, burçları ve gözetleme kulesi kısmen ayaktadır. Çevreleyen vadi manzarası, dere sesi ve orman örtüsü kaleye mistik bir atmosfer katar. Fırtına Vadisi turlarının en popüler durak noktasıdır.",
    strategy:
      "Zilkale'de kayalık tepe üzerindeki kale siluetini, vadi manzarasını ve yoğun orman örtüsünü arayın. Fırtına Deresi ve taş kemer köprüler yakında görülebilir. Sis ve bulut örtüsü sık rastlanan hava koşullarıdır. 53 plaka Rize'yi, vadideki kale görüntüsü Zilkale'yi kesinleştirir.",
    funFact:
      "Zilkale'nin inşa amacı kesin olarak bilinmemektedir. Vadinin ticaret yolu kontrolü, haydutlara karşı savunma veya bir feodal beyin ikametgâhı olarak kullanıldığına dair teoriler mevcuttur. Kalenin adındaki 'Zil' kelimesinin bölgedeki eski bir aile veya topluluk adından geldiği düşünülmektedir.",
  },
  "camlihemsim-rize": {
    about:
      "Çamlıhemşin, Rize'nin iç kesimlerinde Fırtına Vadisi'nin merkezinde yer alan küçük ama kültürel açıdan son derece zengin bir ilçe merkezidir. Hemşin kültürünün kalbi sayılan ilçe, yaylacılık geleneği, tulum peyniri, Hemşin pidesi ve horon dansıyla tanınır. İlçe merkezindeki Osmanlı dönemi taş kemer köprüler ve Hemşin evleri mimari mirası oluşturur. Ayder Yaylası, Pokut, Elevit ve Hazindağ yaylaları Çamlıhemşin'e bağlıdır. Fırtına Deresi ilçe merkezinden geçerek vadinin omurgasını oluşturur. Arıcılık bölgenin en önemli geçim kaynaklarından biridir ve Anzer balı dünyaca ünlüdür.",
    strategy:
      "Çamlıhemşin'de taş kemer köprüleri, Fırtına Deresi'ni ve yayla yolu tabelalarını arayın. Hemşin kültürüne ait detaylar (tulum peyniri tabelaları, bal satış noktaları) karakteristiktir. Yoğun yeşil vadi ve dik yamaçlar Karadeniz'e hastır. 53 plaka Rize'yi, vadi merkezi ve yayla yönlendirmeleri Çamlıhemşin'i işaret eder.",
    funFact:
      "Çamlıhemşin'e bağlı Anzer Yaylası'nda üretilen Anzer balı, 500'den fazla endemik çiçek türünden toplanan poleniyle dünyanın en pahalı balları arasındadır. Kilogramı yüzlerce dolar edebilen bu bal, yıllık yalnızca birkaç ton üretilebilmekte ve coğrafi işaret tesciliyle korunmaktadır.",
  },
  "ilkadim-samsun": {
    about:
      "İlkadım, Samsun'un merkez ilçesi ve Orta Karadeniz'in en büyük şehir merkezidir. Adını Atatürk'ün 19 Mayıs 1919'da Samsun'a çıkarak Milli Mücadele'yi başlattığı ilk adımdan alır. Bandırma Vapuru Müzesi, Atatürk Anıtı ve Amisos Tepesi antik şehir kalıntıları ilçenin tarih katmanlarını oluşturur. Samsun sahil yolu Karadeniz kıyısı boyunca uzanır; Amazon Alışveriş Merkezi ve modern sahil düzenlemesi kent yaşamının merkezidir. Amisos Tepesi'ndeki tümülüsler Helenistik döneme ait renkli mozaikler barındırır. Çarşamba ve Bafra ovaları kentin doğu ve batısında verimli tarım alanları oluşturur.",
    strategy:
      "İlkadım'da geniş sahil yolunu, Bandırma Vapuru müze gemisini ve 19 Mayıs anıtlarını arayın. Karadeniz kıyısındaki düzlük sahil hattı Samsun'a özgüdür. 55 plaka kodu Samsun'un kesin göstergesidir. Amisos Tepesi'ne çıkan yol ve üniversite kampüs tabelaları yardımcı ipuçlarıdır.",
    funFact:
      "Amisos Tepesi'nde 2005'te bulunan 2.300 yıllık Amisos Hazinesi, altın zırh, takılar ve cam eserlerden oluşur. Tümülüslerdeki renkli duvar freskleri Karadeniz bölgesindeki en iyi korunmuş Helenistik dönem sanat eserleri arasında yer alır ve Samsun Müzesi'nde sergilenmektedir.",
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
    "Doğu Anadolu Bölgesi, yüksek platoları, karlı dağları ve tarihi yapılarıyla Türkiye'nin en zorlu ve etkileyici coğrafyasıdır.",
  guneydogu:
    "Güneydoğu Anadolu Bölgesi, Mezopotamya mirası, taş mimari ve binlerce yıllık medeniyetlerin izleriyle Türkiye'nin en eski yerleşim alanlarından biridir.",
};

const REGION_GEO_CLUES: Record<string, string> = {
  marmara:
    "Marmara bölgesinde modern şehir altyapısı, yoğun trafik ve sanayi bölgeleri yaygındır. Deniz manzarası (Marmara veya Karadeniz kıyısı), geniş otoyollar ve fabrika bacaları bu bölgeyi diğerlerinden ayırır. Düz veya hafif tepelik arazi yapısı baskındır.",
  ege:
    "Ege bölgesinde zeytin bahçeleri, antik kalıntılar ve taş evler bölgesel ipuçlarıdır. Kıyı kesimlerinde turkuaz deniz ve beyaz kumlu plajlar görülür. İç kesimlerde pamuk ve tütün tarlaları uzanır. Mimari genellikle beyaz badanalı ve taş yapılıdır.",
  akdeniz:
    "Akdeniz bölgesinde palmiye ağaçları, narenciye bahçeleri ve sera tarımı yaygındır. Toros Dağları'nın dramatik silüeti arka planda yükselir. Turkuaz deniz suyu ve uzun sahil şeritleri bölgenin en belirgin coğrafi özelliğidir.",
  karadeniz:
    "Karadeniz bölgesinde yoğun yeşil ormanlar, dik dağ yamaçları ve sis/bulut örtüsü baskın coğrafi öğelerdir. Çay bahçeleri Doğu Karadeniz'in, fındık bahçeleri Orta Karadeniz'in göstergesidir. Ahşap evler ve yaylalar bölgeye özgü yapılardır.",
  ic_anadolu:
    "İç Anadolu'da düz step arazi, tahıl tarlaları ve kurak iklim baskındır. Kapadokya'nın peri bacaları bu bölgenin en tanınan coğrafi oluşumlarıdır. Geniş ovalar, bozkır manzarası ve az ağaç örtüsü kıyı bölgelerinden belirgin şekilde ayrılır.",
  dogu_anadolu:
    "Doğu Anadolu'da yüksek dağlar, kar örtüsü ve geniş platolar baskın coğrafi öğelerdir. Otlaklar, taş duvarlar ve kırsal yerleşimler yaygındır. Sert iklim koşulları (uzun kışlar, kısa yazlar) peyzajı doğrudan etkiler.",
  guneydogu:
    "Güneydoğu Anadolu'da düz ovalar, kireçtaşı yapılar ve sıcak iklim baskındır. Arapça tabelalar, düz çatılı taş evler ve Mezopotamya düzlüğü bölgenin karakteristik özelliklerindendir. Fırat ve Dicle nehir vadileri önemli coğrafi göstergelerdir.",
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
  geoClues: string;
  plateInfo: string;
  provinceAbout: string;
}

/**
 * Returns a unique description for the given city.
 * Hand-written for popular cities, generated for others.
 * Province data is always included for additional unique content.
 */
export function getCityDescription(city: CityData): CityDescription {
  const province = getProvinceInfo(city.province);
  const geoClues = buildGeoClues(city);
  const plateInfo = buildPlateInfo(city, province);
  const provinceAbout = province
    ? `${province.description} ${province.geography}`
    : `${city.province}, ${city.regionDisplayName}'nde yer alan bir ildir. Bölgenin coğrafi özellikleri ve kültürel yapısı bu lokasyondaki ipuçlarını doğrudan etkiler.`;

  // 1. Check hand-written descriptions first
  const handWritten = POPULAR_DESCRIPTIONS[city.slug];
  if (handWritten) {
    return {
      ...handWritten,
      geoClues,
      plateInfo,
      provinceAbout,
    };
  }

  // 2. Generate unique description from city attributes + province data
  return generateCityDescription(city, province, geoClues, plateInfo, provinceAbout);
}

// ==================== CONTENT GENERATORS ====================

function buildGeoClues(city: CityData): string {
  const regionClue = REGION_GEO_CLUES[city.region] || "";
  const hintClues = city.hintTags
    .filter((t) => HINT_STRATEGIES[t])
    .slice(0, 4)
    .map((t) => HINT_STRATEGIES[t]);

  const parts = [regionClue];
  if (hintClues.length > 0) {
    parts.push(`Bu lokasyonda özellikle dikkat edilmesi gereken detaylar: ${hintClues.join(" ")}`);
  }
  return parts.filter(Boolean).join(" ");
}

function buildPlateInfo(city: CityData, province: ReturnType<typeof getProvinceInfo>): string {
  if (!province) {
    return `Sokak görünümündeki araç plakalarına dikkat ederek hangi ilde olduğunuzu anlayabilirsiniz. Yeşil yol tabelalarındaki şehir isimleri ve mesafe bilgileri konumu daraltmanın en etkili yollarından biridir.`;
  }
  return `${city.province} ili plaka kodu ${province.plateCode}'dir. Sokak görünümünde park halindeki araçların plakalarında ${province.plateCode} kodunu görmek ${city.province}'da olduğunuzu kesin olarak kanıtlar. Yeşil yol tabelalarındaki şehir isimleri ve mesafe bilgileri konumu daha da daraltmanıza yardımcı olur.`;
}

function generateCityDescription(
  city: CityData,
  province: ReturnType<typeof getProvinceInfo>,
  geoClues: string,
  plateInfo: string,
  provinceAbout: string,
): CityDescription {
  const regionIntro = REGION_INTROS[city.region] || "";
  const difficultyKey =
    city.qualityScore >= 4 ? "easy" : city.qualityScore >= 3 ? "medium" : "hard";
  const difficultyTip = DIFFICULTY_TIPS[difficultyKey];
  const modeKey = city.modes.join(", ");
  const modeDesc = MODE_DESCRIPTIONS[modeKey] || MODE_DESCRIPTIONS["urban"] || "";

  // Build enriched about paragraph with province context
  const aboutParts = [
    `${city.district}, ${city.province} ili sınırları içinde ${city.regionDisplayName}'nde yer alır.`,
    regionIntro,
  ];
  if (province) {
    aboutParts.push(
      `${city.province}, ${province.famousFor.slice(0, 3).join(", ")} ile tanınan bir ildir.`,
    );
    if (province.climate) {
      aboutParts.push(`Bölgede ${province.climate.toLowerCase()}`);
    }
  }
  aboutParts.push(
    `Bu lokasyonda ${city.packageCount} farklı Street View noktası bulunur ve ${difficultyKey === "easy" ? "kolay" : difficultyKey === "medium" ? "orta" : "zor"} zorluk seviyesindedir.`,
  );
  if (city.hintTags.length > 0) {
    const translatedTags = city.hintTags
      .slice(0, 5)
      .filter((t) => HINT_STRATEGIES[t])
      .map((t) => {
        const sentence = HINT_STRATEGIES[t];
        return sentence.split(".")[0].toLowerCase();
      });
    if (translatedTags.length > 0) {
      aboutParts.push(
        `Bölgenin öne çıkan özellikleri arasında ${translatedTags.join("; ")} gibi detaylar yer alır.`,
      );
    }
  }
  const about = aboutParts.filter(Boolean).join(" ");

  // Build enriched strategy paragraph
  const strategyParts = [difficultyTip, modeDesc];
  const relevantHints = city.hintTags
    .filter((t) => HINT_STRATEGIES[t])
    .slice(0, 4);
  for (const hint of relevantHints) {
    strategyParts.push(HINT_STRATEGIES[hint]);
  }
  if (province) {
    strategyParts.push(
      `${province.plateCode} plaka kodunu araçlarda görmek ${city.province}'da olduğunuzun kesin göstergesidir.`,
    );
  }
  const strategy = strategyParts.filter(Boolean).join(" ");

  // Generate contextual fun fact from province data
  let funFact: string | null = null;
  if (province && province.famousFor.length >= 3) {
    funFact = `${city.province}, ${province.famousFor.join(", ")} ile bilinir. ${province.climate}`;
  }

  return { about, strategy, funFact, geoClues, plateInfo, provinceAbout };
}
