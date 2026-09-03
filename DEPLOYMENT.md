# 🚀 Panduan Deploy Backend ke Hostinger

Panduan lengkap untuk meng-upload dan men-deploy backend PLN Profile ke Hostinger VPS/Cloud Hosting.

---

## 📋 Prasyarat

1. **Akun Hostinger** dengan paket VPS atau Cloud Hosting (yang mendukung Node.js)
2. **MySQL database** sudah dibuat di Hostinger (srv2262.hstgr.io)
3. **Hostinger Connector** sudah terpasang di VSCode
4. **Kredensial MySQL** yang valid
5. **Gmail App Password** untuk fitur email (lihat [panduan](https://support.google.com/accounts/answer/185833))

---

## 🔧 Langkah 1: Persiapkan File Backend

### 1.1 Update file `.env`

Buka [`backend/.env`](backend/.env) dan isi dengan kredensial Hostinger Anda:

```env
MYSQL_HOST=srv2262.hstgr.io
MYSQL_USER=nama_user_mysql_anda
MYSQL_PASSWORD=password_mysql_anda
MYSQL_DATABASE=pln_profile
MYSQL_PORT=3306
PORT=3001

EMAIL_USER=pln4usaumlaki@gmail.com
EMAIL_PASS=app_password_gmail_anda
CONTACT_EMAIL=pln4usaumlaki@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

### 1.2 Update `ecosystem.config.js`

Buka [`backend/ecosystem.config.js`](backend/ecosystem.config.js) dan ganti path `cwd` dengan path home Anda di Hostinger:

```js
cwd: '/home/uXXXXX/pln-profile-backend', // Ganti uXXXXX dengan username Hostinger Anda
```

### 1.3 Pastikan `node_modules` tidak ikut ter-upload

File [`backend/.gitignore`](backend/.gitignore) sudah mengecualikan `node_modules/`. Ini benar — jangan upload `node_modules/` karena akan di-install di server.

---

## 📤 Langkah 2: Upload Backend ke Hostinger

### Opsi A: Menggunakan Hostinger Connector (VSCode)

1. Buka VSCode, tekan `Ctrl+Shift+P` (atau `Cmd+Shift+P` di Mac)
2. Ketik **"Hostinger"** dan pilih perintah Hostinger connector
3. Pilih **"Upload Files"** atau **"Deploy"**
4. Pilih folder `backend/` sebagai sumber
5. Pilih direktori tujuan di server, misalnya:
   ```
   /home/uXXXXX/pln-profile-backend/
   ```
6. Klik **Upload** dan tunggu hingga selesai

### Opsi B: Menggunakan SFTP di VSCode

1. Buka panel SFTP di VSCode (ekstensi SFTP)
2. Konfigurasi `sftp.json`:
   ```json
   {
     "name": "Hostinger",
     "host": "192.168.1.1",           // IP VPS Hostinger Anda
     "protocol": "sftp",
     "port": 22,
     "username": "uXXXXX",             // Username VPS Anda
     "remotePath": "/home/uXXXXX/pln-profile-backend",
     "uploadOnSave": false
   }
   ```
3. Pilih folder `backend/`, klik kanan → **"Upload"**

### Opsi C: Menggunakan Terminal (SCP)

```bash
# Dari komputer lokal, upload folder backend
scp -r backend/* uXXXXX@IP_VPS_ANDA:/home/uXXXXX/pln-profile-backend/
```

---

## 🖥️ Langkah 3: Setup di Server Hostinger

### 3.1 SSH ke server

```bash
ssh uXXXXX@IP_VPS_ANDA
```

### 3.2 Install Node.js (jika belum terpasang)

```bash
# Cek versi Node.js
node --version

# Jika belum terpasang, install Node.js 20:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
```

### 3.3 Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### 3.4 Install dependencies backend

```bash
cd /home/uXXXXX/pln-profile-backend
npm install --production
```

### 3.5 Jalankan script deploy otomatis

```bash
chmod +x deploy.sh
./deploy.sh
```

Atau jalankan manual:

```bash
# Buat folder logs
mkdir -p logs

# Start dengan PM2
pm2 start ecosystem.config.js

# Simpan konfigurasi PM2
pm2 save

# Setup agar otomatis start saat reboot
pm2 startup
```

---

## 🔍 Langkah 4: Verifikasi & Testing

### 4.1 Cek status PM2

```bash
pm2 status
```

Output yang diharapkan:
```
✅ pln-profile-backend    running   3001
```

### 4.2 Test koneksi database

```bash
cd /home/uXXXXX/pln-profile-backend
node check-db.js
```

### 4.3 Test API

```bash
curl http://localhost:3001/api/health
```

Response yang diharapkan:
```json
{
  "status": "ok",
  "message": "PLN Profile Backend is running",
  "database": "connected",
  "test": "passed"
}
```

### 4.4 Cek log

```bash
pm2 logs pln-profile-backend
```

---

## 🌐 Langkah 5: Konfigurasi Reverse Proxy (Nginx)

Agar backend dapat diakses melalui domain/IP publik, setup Nginx sebagai reverse proxy:

### 5.1 Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

### 5.2 Konfigurasi Nginx

Buat file konfigurasi:

```bash
sudo nano /etc/nginx/sites-available/pln-profile-backend
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Ganti dengan domain/IP Anda

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Upload size limit (untuk fitur upload gambar)
    client_max_body_size 50M;
}
```

### 5.3 Aktifkan konfigurasi

```bash
sudo ln -s /etc/nginx/sites-available/pln-profile-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5.4 Buka firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 3001
sudo ufw --force enable
```

---

## 🔒 Langkah 6: Setup SSL (HTTPS)

Gunakan Let's Encrypt untuk SSL gratis:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🔄 Langkah 7: Update Frontend untuk Produksi

Setelah backend berjalan, update frontend untuk menghubungkan ke backend produksi:

1. Buka file `.env` di root project
2. Set `VITE_API_URL` ke URL backend produksi:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```
3. Build frontend:
   ```bash
   npm run build
   ```
4. Upload hasil build (`dist/`) ke Hostinger

---

## 🛠️ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `ECONNREFUSED` database | Cek kredensial MySQL di `.env`, pastikan database ada |
| `EADDRINUSE` port 3001 | Ganti PORT di `.env` ke port lain |
| Upload gambar gagal | Pastikan folder `uploads/` ada dan writable: `chmod 755 uploads` |
| PM2 proses mati | Cek log: `pm2 logs pln-profile-backend` |
| CORS error | Pastikan domain frontend sudah ditambahkan di CORS middleware |

---

## 📝 Catatan Penting

- **Jangan commit file `.env`** ke git (sudah di-gitignore)
- **Gunakan port khusus** (misal: 3001) jangan port 80/443 untuk Node.js
- **Backup database** secara berkala
- **Monitor resource** dengan `pm2 monit`
- **Update dependencies** secara berkala: `npm outdated`
