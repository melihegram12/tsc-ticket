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

- **Frontend:** Next.js 15 (App Router), React 19
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js
- **Styling:** CSS Modules

## 📋 Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. .env dosyası oluştur
cp .env.example .env

# 3. Veritabanı şemasını uygula
npx prisma db push

# 4. Seed verileri ekle
npm run db:seed

# 5. Geliştirme sunucusunu başlat
npm run dev
```

## 🔐 Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | PostgreSQL bağlantı adresi |
| `NEXTAUTH_URL` | Uygulama URL'i |
| `NEXTAUTH_SECRET` | NextAuth secret key |

## 👥 Varsayılan Kullanıcılar (Seed sonrası)

| E-posta | Şifre | Rol |
|---------|-------|-----|
| admin@tsc.local | admin123 | Admin |
| it.agent@tsc.local | admin123 | IT Agent |
| hr.agent@tsc.local | admin123 | HR Agent |
| calisan@tsc.local | admin123 | Requester |

## 📁 Proje Yapısı

```
src/
├── app/
│   ├── api/              # API endpoints
│   ├── dashboard/        # Dashboard sayfaları
│   └── auth/             # Login sayfası
├── components/
│   ├── widgets/          # Dashboard widget bileşenleri
│   └── ...               # Diğer bileşenler
└── lib/                  # Utility fonksiyonlar
```

## 🚀 Deploy

Detaylı deploy rehberi için [DEPLOY.md](./DEPLOY.md) dosyasına bakın.

---

**Lisans:** MIT
