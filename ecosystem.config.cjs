/**
 * PM2 Process Manager Configuration
 * Install PM2 globally: npm install -g pm2
 * Start: pm2 start ecosystem.config.js
 * Save:  pm2 save
 * Setup startup: pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'pln-profile-backend',
      script: 'server.js',
      cwd: '/home/uXXXXX/pln-profile-backend', // <-- Ganti dengan path home Anda di Hostinger
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Logging
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Restart policy
      max_restarts: 10,
      min_uptime: '10s',
      // Watch (disable in production)
      watch: false,
      // Max memory before restart
      max_memory_restart: '512M',
    },
  ],
}
