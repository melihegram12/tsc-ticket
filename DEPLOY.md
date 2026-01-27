# Railway Deployment Rehberi 🚀

## Adım 1: GitHub'a Push

```bash
# Git repo oluştur (yoksa)
git init
git add .
git commit -m "Initial commit"

# GitHub'da yeni repo oluştur ve bağla
git remote add origin https://github.com/KULLANICI/tsc-ticket.git
git branch -M main
git push -u origin main
```

## Adım 2: Railway Kurulumu

1. [railway.app](https://railway.app) adresine git
2. **GitHub ile giriş yap**
3. **"New Project"** → **"Deploy from GitHub repo"**
4. `tsc-ticket` reposunu seç

## Adım 3: PostgreSQL Ekle

1. Railway dashboard'da **"New"** → **"Database"** → **"PostgreSQL"**
2. Otomatik olarak `DATABASE_URL` eklenecek

## Adım 4: Environment Variables

Railway dashboard'da **Variables** sekmesine git ve ekle:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `https://[proje-adi].up.railway.app` |
| `NEXTAUTH_SECRET` | `npx auth secret` ile oluştur |

## Adım 5: Deploy

1. Railway otomatik deploy edecek
2. **"Generate Domain"** ile URL al
3. `NEXTAUTH_URL`'i bu URL ile güncelle

## Adım 6: Veritabanı Seed

Railway'de terminal aç ve çalıştır:
```bash
npx prisma db push
npm run db:seed
```

## Kullanıcılar (Seed sonrası)

| E-posta | Şifre | Rol |
|---------|-------|-----|
| admin@tsc.local | admin123 | Admin |
| it.agent@tsc.local | admin123 | IT Agent |
| hr.agent@tsc.local | admin123 | HR Agent |
| calisan@tsc.local | admin123 | Requester |

---

✅ **Tebrikler!** Sisteminiz artık canlıda!
