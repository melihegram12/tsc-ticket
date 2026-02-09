# 🐳 TSC Docker Deployment - Şirket İçi Kurulum

Bu rehber TSC Ticket Support Center uygulamasını Docker ile şirket ağınıza deploy etmenizi sağlar.

## 📋 Gereksinimler

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac)
- En az 4GB RAM
- 10GB boş disk alanı

## 🚀 Hızlı Başlangıç

### 1. Docker Desktop Kurulumu
1. [docker.com](https://www.docker.com/products/docker-desktop/) adresinden indirin
2. Kurulumu tamamlayın ve Docker Desktop'ı başlatın
3. System tray'de Docker simgesinin "Running" olduğunu kontrol edin

### 2. Uygulamayı Başlatma

```powershell
# Proje klasörüne gidin
cd C:\Users\ENGINME1\Desktop\TSC\tsc-ticket

# Docker container'ları başlatın (ilk sefer 5-10 dk sürebilir)
docker-compose up -d --build

# Veritabanı tablolarını oluşturun
docker-compose exec tsc-app npx prisma db push

# Varsayılan kullanıcıları ekleyin
docker-compose exec tsc-app npx prisma db seed
```

### 3. Erişim Kontrolü
Tarayıcınızda açın: **http://localhost:3000**

---

## 🌐 Şirket Ağından Erişim

### Sunucu IP Adresini Bulma (Windows)
```powershell
ipconfig
# IPv4 Address satırını bulun (örn: 192.168.1.100)
```

### NEXTAUTH_URL Güncelleme
`docker-compose.yml` dosyasında:
```yaml
environment:
  NEXTAUTH_URL: http://192.168.1.100:3000  # Kendi IP'nizi yazın
```

Değişiklikten sonra:
```powershell
docker-compose down
docker-compose up -d
```

### Windows Firewall Ayarı
```powershell
# Yönetici olarak PowerShell açın ve çalıştırın:
New-NetFirewallRule -DisplayName "TSC Ticket System" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow
```

---

## 🔤 Özel Domain Adı (tsc.malhotra.local)

### Seçenek A: Hosts Dosyası (Her Bilgisayarda)

Her istemci bilgisayarda **Yönetici olarak Notepad** açıp bu dosyayı düzenleyin:
```
C:\Windows\System32\drivers\etc\hosts
```

En alta ekleyin:
```
192.168.1.100   tsc.malhotra.local
```

Artık tarayıcıda **http://tsc.malhotra.local:3000** yazarak erişebilirsiniz.

### Seçenek B: Şirket DNS Sunucusu (Merkezi)
IT departmanınız DNS sunucusuna A kaydı ekleyebilir:
- Host: `tsc.malhotra.local`
- IP: Sunucu IP adresi

---

## 🔐 Varsayılan Kullanıcılar

| E-posta | Şifre | Rol |
|---------|-------|-----|
| admin@tsc.local | admin123 | Admin |
| it.agent@tsc.local | admin123 | IT Agent |
| hr.agent@tsc.local | admin123 | HR Agent |
| calisan@tsc.local | admin123 | Requester |

> ⚠️ **Önemli:** Production'da bu şifreleri mutlaka değiştirin!

---

## 🛠 Yönetim Komutları

```powershell
# Durumu kontrol et
docker-compose ps

# Logları görüntüle
docker-compose logs -f

# Uygulamayı durdur
docker-compose down

# Tamamen sil (veritabanı dahil)
docker-compose down -v

# Yeniden başlat
docker-compose restart
```

---

## 🔄 Güncelleme

Yeni bir versiyon deploy etmek için:
```powershell
# En son kodu çekin
git pull

# Container'ları yeniden build edin
docker-compose up -d --build
```

---

## ❓ Sorun Giderme

### Container başlamıyor
```powershell
docker-compose logs tsc-app
docker-compose logs tsc-db
```

### Veritabanı bağlantı hatası
```powershell
# Veritabanı container'ının çalıştığından emin olun
docker-compose ps

# Manuel olarak kontrol edin
docker-compose exec tsc-db psql -U tsc_admin -d tsc_ticket
```

### Port 3000 meşgul
`docker-compose.yml` dosyasında portu değiştirin:
```yaml
ports:
  - "8080:3000"  # 8080'den erişin
```
