# TPE PATENT BAŞVURUSU — TARİFNAME

**Başvuru Sahibi:** Emekcan Doğru  
**Başvuru Tarihi:** 2026-05-13  
**Buluşun Başlığı:** Kıyafet Fotoğrafı Bulunmayan Gardırop Parçaları için Yapay Zeka Destekli Sanal Deneme Sistemi ve Yöntemi

---

## 1. TEKNİK ALAN

Bu buluş; dijital gardırop yönetimi, yapay zeka destekli görüntü üretimi ve sanal kıyafet deneme teknolojileri alanına girmektedir. Daha özellikle bu buluş; bir kullanıcının kıyafet koleksiyonunda fotoğrafı bulunmayan kıyafet parçaları için yapay zeka ile standart görsel üreten ve bu görseli gerçek zamanlı sanal deneme motoruna ileten, mobil uygulama tabanlı bir sistem ve yönteme ilişkindir.

---

## 2. BİLİNEN TEKNİK (Arka Plan)

Mevcut teknikte sanal kıyafet deneme sistemleri bilinmektedir. Bu sistemler genel olarak iki girdi gerektirmektedir: (1) kullanıcının model fotoğrafı ve (2) denenecek kıyafetin standart ürün fotoğrafı. Söz konusu yaklaşımın temel kısıtı, kıyafet görselinin mutlaka önceden mevcut olması zorunluluğudur.

Gerçek dünya kullanım senaryolarında ise gardırop uygulamalarına kaydedilen kıyafetin büyük bir kısmı yalnızca metin açıklaması içermekte, fotoğrafı bulunmamaktadır. Kullanıcılar kıyafetlerini her zaman fotoğraflayamaz ya da fotoğrafı çekilmemiş eski kıyafetlerini sisteme ekleyebilir. Bu durumda mevcut sistemler sanal deneme işlemini gerçekleştirememekte ve kullanıcı deneyimi kesintiye uğramaktadır.

Bilinen çözümlerde bu sorunun giderilmesine yönelik herhangi bir teknik yöntem tanımlanmamıştır.

---

## 3. TEKNİK PROBLEM

Bu buluşun çözmeye çalıştığı teknik problem; kıyafet görsel verisi bulunmayan durumlarda sanal deneme zincirinin kesintisiz sürdürülmesidir. Daha açık bir ifadeyle problem şudur: Yalnızca metin adı bilinen (örn. "Lacivert Slim Fit Pantolon") bir kıyafet parçası için, kullanıcı fotoğraf yüklemeden, sanal deneme işleminin otomatik olarak tamamlanması mümkün değildir.

---

## 4. BULUŞUN AÇIKLAMASI

Bu buluş, yukarıda tanımlanan teknik problemi çözmek için aşağıdaki teknik adımları içeren bir yöntem ve sistemi kapsamaktadır:

### 4.1 Genel Sistem Mimarisi

Buluşa konu sistem üç ana bileşenden oluşmaktadır:

**(A) Mobil İstemci Uygulaması:** Kullanıcının kıyafet koleksiyonunu yöneten, kombin önerileri sunan ve sanal deneme arayüzünü barındıran React Native tabanlı mobil uygulama.

**(B) Güvenli API Proxy Katmanı:** Mobil istemci ile üçüncü taraf yapay zeka servisleri arasında konumlanan, kimlik doğrulama bilgilerini istemci tarafında açığa çıkarmayan ara sunucu (reverse proxy). Bu katman şu uç noktaları barındırır: görüntü üretimi, sanal deneme başlatma, sanal deneme durum sorgulama.

**(C) Yapay Zeka Servisleri:** Metin tabanlı görsel üretimi için büyük dil modeli destekli görüntü üretim servisi ve görsel tabanlı sanal deneme servisi.

### 4.2 Fotoğrafsız Kıyafet Sanal Deneme Yöntemi (Ana Buluş)

Buluşun özgün yöntemi aşağıdaki adımları kapsamaktadır:

**Adım 1 — Kıyafet Fotoğraf Durumu Tespiti:**  
Sistem, sanal deneme isteği alındığında ilgili kıyafet kaydının fotoğraf URI'si içerip içermediğini kontrol eder. Kıyafetin yerel depolama alanında veya uzak sunucuda erişilebilir bir görseli varsa standart sanal deneme akışına yönlenir. Görsel bulunamazsa aşağıdaki alternatif akış tetiklenir.

**Adım 2 — Metinden Görsel Üretimi:**  
Fotoğrafı bulunmayan kıyafet parçasının metin adı (örn. "Siyah Slim Fit Pantolon") yapay zeka görüntü üretim servisine gönderilir. İstek şu parametreleri içerir:
- Kıyafetin metin tanımı
- Standart ürün fotoğrafı üretim talimatı (beyaz/nötr arka plan, dik duruş, tam çerçeve)

Üretim servisi, kıyafet parçasına ait standardize edilmiş bir ürün görselini döndürür.

**Adım 3 — Üretilen Görselin Önbelleğe Alınması:**  
Üretilen görsel URL'i, gelecekteki sanal deneme çağrılarında yeniden kullanılmak üzere kıyafet kaydına ilişkilendirilir. Böylece aynı kıyafet için görsel üretim işlemi yalnızca bir kez gerçekleştirilir.

**Adım 4 — Sanal Deneme Zincirinin Sürdürülmesi:**  
Adım 2'de elde edilen görsel URI, standart sanal deneme akışına girdi olarak beslenir. Bu adımdan itibaren sistem, fotoğraflı kıyafetlerle özdeş şekilde çalışmaktadır:
- Model fotoğrafı ve kıyafet görseli API proxy katmanına iletilir
- Sanal deneme işi kuyruğa alınır ve bir iş kimliği (ID) döndürülür
- İstemci, belirlenen aralıklarla iş kimliği üzerinden durum sorgulaması yapar
- İş tamamlandığında sonuç görseli istemci cihazına indirilir

**Adım 5 — Yerel Önbelleğe İndirme:**  
Sonuç görseli, CDN URL'i üzerinden doğrudan yüklenmek yerine cihazın yerel önbellek dizinine indirilir. Bu yaklaşım, mobil işletim sistemi güvenlik politikaları veya ağ kısıtlamaları nedeniyle uzak CDN URL'lerinin görüntülenemediği cihazlarda görüntü render sorununu ortadan kaldırır.

### 4.3 Renk Uyum Skoru Hesaplama Yöntemi

Buluş kapsamındaki ikincil teknik katkı, kıyafet parçaları arasındaki renk uyumunun otomatik hesaplanmasına ilişkin yöntemdir:

**Adım 1 — Renk Çıkarımı:**  
Her kıyafetin metin adı, dil bağımsız bir anahtar kelime eşleştirme tablosu aracılığıyla HEX renk koduna dönüştürülür. Eşleştirme tablosu Türkçe ve İngilizce renk anahtar kelimelerini birlikte destekler. Bir metin içinde birden fazla renk anahtar kelimesi bulunduğunda, metindeki karakter konumuna göre öncelik belirlenir (en erken geçen renk seçilir).

**Adım 2 — HSL Renk Uzayına Dönüşüm:**  
HEX kodları, renk tonu (hue), doygunluk (saturation) ve parlaklık (lightness) bileşenlerinden oluşan HSL renk uzayına dönüştürülür.

**Adım 3 — Çift Yönlü Uyum Skoru:**  
Kombin içindeki her kıyafet çifti için renk tonu mesafesi hesaplanır. Hesaplanan mesafe, renk teorisinin analog, tamamlayıcı ve bölünmüş tamamlayıcı kategorilerine göre 45–95 aralığında bir uyum puanına dönüştürülür. Kombinin genel uyum skoru, tüm çiftlerin puanlarının ortalamasıdır.

**Adım 4 — Nötr Renk Filtreleme:**  
Doygunluğu belirli bir eşiğin (S < 0.12) altında kalan renkler (beyaz, siyah, gri tonları) uyum hesabına dahil edilmez, zira bu renkler teorik olarak her renk ile uyumludur.

### 4.4 Güvenli Proxy Mimarisi

Buluşta API kimlik bilgileri hiçbir zaman mobil istemci uygulamasına gömülmez. Tüm üçüncü taraf servis çağrıları, erişim anahtarlarını sunucu ortamında saklayan proxy katmanı üzerinden gerçekleştirilir. Bu yapı; sanal deneme, görüntü üretimi, hava durumu ve yapay zeka sohbet servislerini kapsamaktadır.

---

## 5. ŞEKİLLERİN KISA AÇIKLAMASI

**Şekil 1:** Sistemin genel mimarisi — mobil istemci, proxy katmanı ve yapay zeka servisleri arasındaki veri akışı.

**Şekil 2:** Fotoğrafsız kıyafet sanal deneme yöntemi akış diyagramı (Ana Buluş).

**Şekil 3:** Renk uyum skoru hesaplama algoritması akış diyagramı.

*(Şekiller başvuru ile birlikte ayrıca sunulacaktır.)*

---

## 6. BULUŞUN TERCİH EDİLEN GERÇEKLEŞTİRME BİÇİMLERİ

### 6.1 Tercih Edilen Gerçekleştirme — Sanal Deneme Zinciri

Tercih edilen gerçekleştirmede mobil uygulama, React Native çerçevesi ile geliştirilmiş olup iOS ve Android platformlarında çalışmaktadır. Kıyafet kayıtları, kullanıcı cihazında AsyncStorage adlı yerel anahtar-değer deposunda saklanmakta; her kayıt kıyafet adı, kategori ve isteğe bağlı görsel URI içermektedir.

Sanal deneme akışı başlatıldığında:
- Görsel URI varsa: `gorselParam()` fonksiyonu, URI'nin yerel mi yoksa uzak mı olduğunu tespit eder. Yerel URI'ler base64 kodlamasına dönüştürülürken HTTP URL'leri doğrudan iletilir.
- Görsel URI yoksa: `kiyafetGorseliUret()` fonksiyonu çağrılarak metin adı görüntü üretim servisine gönderilir; dönen URL standart akışa beslenir.

Sanal deneme sonucu bekleme sürecinde istemci, 5 saniyelik aralıklarla maksimum 40 deneme (toplam 200 saniye) boyunca durum sorgular. Hermes JavaScript motoru `AbortSignal.timeout()` metodunu desteklemediğinden, zaman aşımı kontrolü `AbortController` ve `setTimeout` kombinasyonu ile gerçekleştirilir.

Sonuç görseli, `expo-file-system` kütüphanesi aracılığıyla cihazın önbellek dizinine indirilir ve yerel URI üzerinden görüntülenir.

### 6.2 Tercih Edilen Gerçekleştirme — Renk Uyum Skoru

Renk anahtar kelime tablosu 16 renk grubunu, her grup için Türkçe ve İngilizce terimleri kapsamaktadır. Eşleştirme mekanizması tam sözcük sınırı aramak yerine alt dize (substring) araması yapmakta; bu sayede "Lacivert Slim Fit" gibi bileşik kıyafet adlarından renk çıkarımı mümkün olmaktadır.

---

## 7. İSTEMLER

**İstem 1:**  
Bir mobil cihazda çalışan dijital gardırop uygulamasında, kıyafet görsel verisi bulunmayan durumlar için sanal deneme gerçekleştiren yöntem olup şu adımları içerir:
- (a) Kullanıcı tarafından seçilen kıyafet kaydının görsel verisi içerip içermediğinin tespit edilmesi;
- (b) Görsel veri bulunmaması halinde, kıyafetin metin tanımının yapay zeka görüntü üretim servisine iletilerek standart kıyafet görseli üretilmesi;
- (c) Üretilen görselin, kullanıcının model fotoğrafı ile birlikte sanal deneme servisine iletilmesi;
- (d) Sanal deneme servisinden dönen sonuç görselinin cihazın yerel depolama alanına indirilmesi ve kullanıcıya sunulması.

**İstem 2:**  
İstem 1'e göre yöntem olup, (b) adımındaki üretilen görsel URL'inin ilgili kıyafet kaydına kaydedilmesi ve aynı kıyafet için sonraki sanal deneme çağrılarında görüntü üretim adımının atlanması özelliğini içerir.

**İstem 3:**  
İstem 1'e göre yöntem olup, (c) adımındaki sanal deneme servisine iletimin, API kimlik bilgilerini istemci uygulamasından gizleyen bir ara sunucu (proxy) katmanı üzerinden gerçekleştirilmesi özelliğini içerir.

**İstem 4:**  
İstem 1'e göre yöntem olup, (d) adımındaki durum sorgulama işleminin, belirli aralıklarla tekrarlanan HTTP GET çağrıları aracılığıyla asenkron biçimde gerçekleştirilmesi ve her çağrının bağımsız zaman aşımı kontrolüne tabi tutulması özelliğini içerir.

**İstem 5:**  
Bir mobil gardırop uygulamasında kombin renk uyumunu değerlendiren yöntem olup şu adımları içerir:
- (a) Her kıyafet parçasının metin adından, anahtar kelime eşleştirme tablosu kullanılarak HEX renk kodunun çıkarılması;
- (b) HEX renk kodlarının HSL renk uzayına dönüştürülmesi;
- (c) Kombin içindeki her kıyafet çifti için renk tonu mesafesinin hesaplanması ve bu mesafeye karşılık gelen uyum puanının belirlenmesi;
- (d) Çift uyum puanlarının ortalaması alınarak kombinin genel renk uyum skorunun hesaplanması.

**İstem 6:**  
İstem 5'e göre yöntem olup, (c) adımındaki uyum puanının renk tonu mesafesine göre şu kategorilere atanması özelliğini içerir: analog (≤30°: 95 puan), tamamlayıcı (150°–210°: 88 puan), bölünmüş tamamlayıcı (100°–140° veya 220°–260°: 78 puan).

**İstem 7:**  
İstem 1'e göre yöntem olup, (a) adımındaki görsel verisi tespitinin; yerel dosya URI'si, uzak HTTP URL'i veya base64 kodlu veri URI'sini ayırt edebilmesi ve her durumda farklı işleme yolu uygulaması özelliğini içerir.

**İstem 8:**  
İstem 1 ile 7 arasındaki istemlerden herhangi birine göre yöntemi uygulayan sistem olup şunları içerir:
- Kullanıcı cihazında çalışan mobil istemci uygulaması;
- API kimlik bilgilerini barındıran güvenli ara sunucu katmanı;
- Yapay zeka görüntü üretim servisi;
- Sanal deneme servisi.

---

## 8. ÖZET

Bu buluş; dijital gardırop uygulamalarında, fotoğrafı bulunmayan kıyafet parçaları için sanal deneme işleminin kesintisiz sürdürülmesine imkân tanıyan bir yöntem ve sistem sunmaktadır. Yöntemde, fotoğraf verisi bulunmayan kıyafetin metin tanımı yapay zeka görüntü üretim servisine iletilerek standart bir kıyafet görseli otomatik olarak üretilmekte, ardından bu görsel mevcut sanal deneme akışına beslenmektedir. Sistem ayrıca; API kimlik bilgilerini istemci cihazında açığa çıkarmayan güvenli proxy mimarisini ve kıyafet renk adlarından kombin uyum skoru hesaplayan renk uyum algoritmasını kapsamaktadır. Buluş sayesinde kullanıcılar, gardıroplarındaki tüm kıyafet parçalarını — fotoğraflı ya da fotoğrafsız — sanal olarak deneyebilmektedir.

---

*Bu tarifname TPE başvurusuna esas teşkil edecek taslak niteliğindedir. Resmi başvuru öncesinde patent vekili incelemesinden geçirilmesi tavsiye edilir.*
