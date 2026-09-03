#!/bin/bash
# ============================================
# Hostinger Backend Deployment Script
# ============================================
# Jalankan di server Hostinger setelah upload file:
#   chmod +x deploy.sh && ./deploy.sh
# ============================================

set -e

echo "========================================"
echo "  PLN Profile Backend - Deploy Script"
echo "========================================"
echo ""

# 1. Check Node.js
echo "[1/6] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js tidak ditemukan. Install dulu:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -"
    echo "   sudo apt-get install -y nodejs"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# 2. Check npm
echo ""
echo "[2/6] Checking npm..."
echo "✅ npm: $(npm --version)"

# 3. Install PM2 globally
echo ""
echo "[3/6] Installing PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
echo "✅ PM2: $(pm2 --version)"

# 4. Install backend dependencies
echo ""
echo "[4/6] Installing backend dependencies..."
npm install --production
echo "✅ Dependencies terpasang"

# 5. Create logs directory
echo ""
echo "[5/6] Creating logs directory..."
mkdir -p logs
echo "✅ Logs directory created"

# 6. Start with PM2
echo ""
echo "[6/6] Starting backend with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup
echo "✅ Backend started!"

echo ""
echo "========================================"
echo "  Deployment selesai!"
echo "========================================"
echo ""
echo "Backend berjalan di port: $(node -e "console.log(process.env.PORT || 3001)")"
echo ""
echo "Perintah yang berguna:"
echo "  pm2 status              - Lihat status aplikasi"
echo "  pm2 logs pln-profile-backend - Lihat log"
echo "  pm2 restart pln-profile-backend - Restart aplikasi"
echo "  pm2 stop pln-profile-backend - Stop aplikasi"
echo ""
