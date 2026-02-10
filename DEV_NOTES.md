# Geliştirme Notları (DEV_NOTES.md)

## 2026-02-10 - Veritabanı Migrasyonu (PostgreSQL -> SQLite)

### Kapsam
Projenin yerel geliştirme ortamında daha hızlı ve bağımsız çalışabilmesi için veritabanı altyapısı PostgreSQL'den SQLite'a geçirilmiştir.

### Yapılan Değişiklikler
1.  **Veritabanı Sağlayıcısı:** `prisma/schema.prisma` dosyasında provider `postgresql` yerine `sqlite` olarak ayarlandı.
2.  **Enum Kaldırılması:** SQLite `enum` veri tipini desteklemediği için şemadaki tüm `enum` tanımları kaldırıldı ve ilgili alanlar `String` tipine dönüştürüldü. Uygulama seviyesinde bu string değerlerin tutarlılığı kontrol edilmelidir.
3.  **Çevresel Değişkenler:** `.env` dosyasında `DATABASE_URL="file:./dev.db"` olarak güncellendi.

### Riskler ve Notlar
- SQLite, PostgreSQL kadar güçlü concurrency (eşzamanlılık) yönetimine sahip değildir. Yüksek trafikli testlerde kilitlenmeler olabilir.
- Enum güvenliği veritabanı seviyesinden uygulama seviyesine taşınmıştır.
