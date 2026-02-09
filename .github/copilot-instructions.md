# Copilot / AI Agent Instructions for this repo

Kısa, eyleme dönük rehber: yapacakların ve projeye hızla adapte olmanın önemli noktaları.

- **Proje tipi:** Next.js (App Router) monorepo-stili uygulama; sunucu tarafı API endpoint'leri `app/api` ve klasik API dosyaları `src/pages/api` içinde.
- **Temel bağımlılıklar:** `prisma` (Postgres), `next-auth` (Credentials provider), `socket.io` (gerçek zamanlı chat/presence).

- **Başlatma / build:**
  - Geliştirme: `npm run dev` (Next dev)
  - Build: `npm run build` — bu komut otomatik `prisma generate` çalıştırır
  - Üretim: `npm run start`
  - DB: `npm run db:push`, `npm run db:seed`, `npm run db:studio`
  - Ek: `npm run dns` — yerel DNS server (scripts/dns-server.js).

- **Prisma kullanımı & konvansiyonlar:**
  - Singleton Prisma client: `src/lib/prisma.ts` — geliştirme sırasında birden fazla instance önlemek için global singleton kullanılır. Her PR veya değişiklikte bu dosyaya dokunurken singleton kalıbını koruyun.
  - Schema ve seed: `prisma/schema.prisma` ve `prisma/seed.ts`.

- **Gerçek zamanlı (Socket.io) entegrasyonu:**
  - Sunucu başlatma noktası: `src/pages/api/socket/io.ts` çağırarak HTTP server üzerinden `initSocketServer(httpServer)` başlatılır.
  - Socket server implementasyonu: `src/lib/socket.ts` — event isimleri (`join_chat`, `send_message`, `join_ticket`, vs.) ve `ticketViewers` (in-memory) burada bulunur.
  - İstemci tarafı: `src/lib/socket-client.ts` — bağlantı için önce `fetch('/api/socket/io')` çağrısı yapıp sonra `io({ path: '/api/socket' })` kullanılır. Bu akışı bozmadan değişiklik yapın.
  - Dikkat: `ticketViewers` in-memory olup yatay ölçekleme (çoklu sunucu) için paylaşılan state sunmaz.

- **Auth özel durumu:**
  - Credentials provider: `src/lib/auth.ts` içinde. Önemli sabit: `SKIP_PASSWORD_CHECK_FOR_REQUESTER` — bu sihirli değer personel (`Requester`) rollerine yönelik özel bypass sağlar. Bu davranışı değiştirmeden önce rolleri ve etkisini doğrulayın.

- **Kod düzeni / önemli klasörler:**
  - `src/app/` — Next App Router sayfaları ve `app/api/` endpoint'leri.
  - `src/pages/api/` — klasik Next API route örnekleri (örn. socket init).
  - `src/components/` ve `src/components/widgets/` — yeniden kullanılabilir UI bileşenleri.
  - `src/lib/` — uygulama mantığı (prisma, auth, socket, email vb.). Bu klasör en iyi başlangıç noktasıdır.

- **Veri akışı örneği (chat):**
  1. İstemci `fetch('/api/socket/io')` -> `io` endpoint server'ı başlatır (`src/pages/api/socket/io.ts`).
  2. `src/lib/socket.ts` içindeki event handler'lar DB'yi `prisma` üzerinden günceller (örn. `chatMessage.create`).
  3. Server `io.to(...).emit(...)` ile client'lara olayları dağıtır.

- **Pratik ipuçları için örnek dosyalar:**
  - Socket init: `src/pages/api/socket/io.ts`
  - Socket server & events: `src/lib/socket.ts`
  - Socket client: `src/lib/socket-client.ts`
  - Auth davranışı: `src/lib/auth.ts`
  - Prisma singleton: `src/lib/prisma.ts`

- **Ne yok / bilinmesi gerekenler:**
  - Repo'da test dizini veya test scriptleri yok. Test eklemeyi planlarken mevcut CI/test konvansiyonları yok sayılabilir.
  - Deployment rehberi ayrıntılı: `DEPLOY.md`, `DOCKER_DEPLOY.md` dosyalarına bakın.

Eğer bu yönergede belirsiz veya eksik olduğunu düşündüğünüz bir nokta varsa belirtin; örnekler ve daha ayrıntılı kod referansları ekleyeyim.
