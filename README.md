# TSC - Ticket Support Center 🎫

Malhotra Helpdesk için dahili destek talep yönetim sistemi.

## 🚀 Özellikler

- **Ticket Yönetimi** - Oluşturma, atama, durum takibi
- **SLA Takibi** - Yanıt ve çözüm süresi izleme
- **Memnuniyet Anketi** - Ticket çözümünde 5 yıldız puanlama
- **Kayıtlı Aramalar** - Filtre kombinasyonlarını kaydetme
- **Denetim Logları** - Admin için aktivite izleme
- **Otomasyon Kuralları** - Otomatik ticket işlemleri
- **Dashboard Widgets** - Özelleştirilebilir gösterge paneli
- **Çakışma Uyarıları** - Aynı ticket'ı görüntüleyen kullanıcılar

## 🛠 Teknolojiler

- **Frontend:** Next.js 16 (App Router), React 19
- **Backend:** Next.js API Routes / Server Actions
- **Database:** SQLite (Dev) / PostgreSQL (Prod) + Prisma ORM
- **Auth:** NextAuth.js
- **Styling:** Tailwind CSS

## 📋 Hızlı Kurulum (SQLite - Geliştirme Ortamı)

Bu proje geliştirme ortamında **SQLite** kullanacak şekilde yapılandırılmıştır. Ekstra bir veritabanı kurulumuna ihtiyaç duymaz.

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Veritabanını oluştur ve sıfırla (Temiz Başlangıç)
npx prisma db push --force-reset

# 3. Başlangıç verilerini (Admin, Roller, Departmanlar) yükle
npx prisma db seed

# 4. Geliştirme sunucusunu başlat
npm run dev
```

Uygulama: http://localhost:3000

## 🔐 Ortam Değişkenleri (.env)

| Değişken | Açıklama | Örnek Değer |
|----------|----------|-------------|
| `DATABASE_URL` | Veritabanı bağlantı adresi | `"file:./dev.db"` (SQLite için) |
| `NEXTAUTH_URL` | Uygulama URL'i | `"http://localhost:3000"` |
| `NEXTAUTH_SECRET` | Güvenlik anahtarı | (Rastgele string) |

## 👥 Varsayılan Kullanıcılar (Seed Data)

Veritabanı oluşturulduğunda aşağıdaki hesaplar otomatik tanımlanır:

| Rol | E-posta | Şifre |
|-----|---------|-------|
| **Admin** | `admin@tsc.local` | `admin123` |
| **IT Agent** | `it.agent@tsc.local` | `admin123` |
| **HR Agent** | `hr.agent@tsc.local` | `admin123` |
| **Personel** | `calisan@tsc.local` | (Şifresiz Giriş) |

## 📁 Önemli Dosyalar

- `prisma/schema.prisma`: Veritabanı şeması (SQLite uyumlu)
- `src/types/enums.ts`: Prisma Enum'larının yerel TypeScript tanımları
- `TEST_PLAN.md`: Manuel test senaryoları
- `DEV_NOTES.md`: Geliştirme notları ve değişiklik günlüğü

## 🚀 Deploy

Detaylı deploy rehberi için [DEPLOY.md](./DEPLOY.md) dosyasına bakın.

---

**Lisans:** MIT
