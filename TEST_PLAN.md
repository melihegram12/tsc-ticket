# Test Planı: TSC Ticket System (SQLite & Enum-String Migration)

Bu doküman, PostgreSQL'den SQLite'a geçiş ve Enum yapılarının String veri tipine dönüştürülmesi sonrası yapılacak manuel testleri içerir.

## Ön Hazırlık (Environment Setup)

Testlere başlamadan önce terminalinizde aşağıdaki komutları çalıştırarak temiz bir veritabanı ortamı oluşturun:

\`\`\`powershell
# 1. Veritabanını sıfırla ve yeniden oluştur
npx prisma db push --force-reset

# 2. Başlangıç verilerini (Admin, Roller, Departmanlar) yükle
npx prisma db seed

# 3. Uygulamayı başlat
npm run dev
\`\`\`

---

## Manuel Test Senaryoları (Test Cases)

### 1. Kimlik Doğrulama (Authentication)
| No | Senaryo Adı | Adımlar | Beklenen Sonuç | Kritik Kontrol Noktası |
|:---|:---|:---|:---|:---|
| **TC-01** | Admin Girişi | 1. Tarayıcıda `http://localhost:3000` adresine git.<br>2. Email: `admin@tsc.local`<br>3. Şifre: `admin123`<br>4. "Giriş Yap" butonuna tıkla. | Dashboard (Ana Sayfa) açılmalı. | `.env` dosyasındaki `NEXTAUTH_SECRET` hatası almamalı. |
| **TC-02** | Hatalı Giriş | 1. Yanlış şifre ile giriş dene. | Hata mesajı ("Geçersiz email veya şifre") görünmeli. | Veritabanına hatalı kayıt düşmemeli. |

### 2. Veri Doğrulama (Data Integrity & Seeding)
| No | Senaryo Adı | Adımlar | Beklenen Sonuç | Kritik Kontrol Noktası |
|:---|:---|:---|:---|:---|
| **TC-03** | Seed Verisi Kontrolü | 1. Sol menüden "Yeni Talep" sayfasına git.<br>2. "Departman" seçeneğine tıkla. | Listede "Bilgi Teknolojileri", "İnsan Kaynakları" vb. görünmeli. | `prisma/seed.ts` dosyasının doğru çalıştığını gösterir. |
| **TC-04** | Kategori Seçimi | 1. "Bilgi Teknolojileri" departmanını seç.<br>2. Kategori listesini kontrol et. | "Donanım Arızası", "Yazılım Sorunu" seçenekleri gelmeli. | İlişkisel veri (Foreign Key) bağlantıları çalışıyor mu? |

### 3. İşlevsellik (Functionality & Enum Check)
| No | Senaryo Adı | Adımlar | Beklenen Sonuç | Kritik Kontrol Noktası |
|:---|:---|:---|:---|:---|
| **TC-05** | Ticket Oluşturma | 1. Formu doldur (Konu, Açıklama, Departman, Kategori, Öncelik).<br>2. "Normal" önceliğini seç.<br>3. "Gönder" butonuna tıkla. | Başarı mesajı ve yönlendirme gerçekleşmeli. | Veritabanına `status: "NEW"` ve `priority: "NORMAL"` string değerleri doğru yazılmalı (Enum hatası vermemeli). |
| **TC-06** | Durum Güncelleme | 1. Oluşturulan ticketın detayına gir.<br>2. Durumu "Çözüldü" (Resolved) olarak değiştir.<br>3. Kaydet. | Durum güncellenmeli. | Veritabanına `status: "RESOLVED"` string değeri yazılmalı. |

---

## Hata Raporlama

Test sırasında karşılaşılan hataları aşağıdaki formatta raporlayın:

- **Senaryo No:** (Örn: TC-05)
- **Hata Mesajı:** (Terminaldeki veya tarayıcı konsolundaki hata)
- **Ekran Görüntüsü:** (Varsa)
