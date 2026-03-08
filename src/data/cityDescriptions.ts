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
