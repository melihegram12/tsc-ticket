# Vercel Deployment Rehberi 🚀

## Adım 1: Neon PostgreSQL Kurulumu

1. [neon.tech](https://neon.tech) → **Sign Up** (GitHub ile)
2. **Create Project** → Proje adı: `tsc-ticket`
3. **Connection String**'i kopyala (bu `DATABASE_URL` olacak)

## Adım 2: GitHub'a Push

VS Code'da:
1. **Source Control** (Ctrl+Shift+G)
2. Tüm değişiklikleri **Stage** et (+)
3. Commit mesajı: `Vercel deployment ready`
4. **Sync Changes** veya **Push**

## Adım 3: Vercel Kurulumu

1. [vercel.com](https://vercel.com) → **GitHub ile giriş yap**
2. **Add New...** → **Project**
3. `tsc-ticket` reposunu **Import** et
4. **Environment Variables** ekle:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string |
| `NEXTAUTH_URL` | `https://proje-adi.vercel.app` |
| `NEXTAUTH_SECRET` | `npx auth secret` ile oluştur |

5. **Deploy** butonuna tıkla

## Adım 4: Veritabanı Seed

Deploy tamamlandıktan sonra, Vercel Dashboard → **Functions** → terminalde:
```bash
npx prisma db push
npm run db:seed
```

Veya lokal terminalden (Neon URL ile):
```bash
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npm run db:seed
```

## Kullanıcılar (Seed sonrası)

| E-posta | Şifre | Rol |
|---------|-------|-----|
| admin@tsc.local | admin123 | Admin |
| it.agent@tsc.local | admin123 | IT Agent |
| hr.agent@tsc.local | admin123 | HR Agent |
| calisan@tsc.local | admin123 | Requester |

---

> ⚠️ **Not**: Canlı chat (Socket.io) şu anda Vercel'de devre dışı. Ticket sistemi tam çalışır.

✅ **Tebrikler!** Sisteminiz artık canlıda!
