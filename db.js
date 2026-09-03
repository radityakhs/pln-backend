import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Try loading .env.production first (for Hostinger), then .env as fallback
const envFiles = ['.env.production', '.env']
for (const file of envFiles) {
  const result = dotenv.config({ path: path.join(__dirname, file) })
  if (result.parsed && Object.keys(result.parsed).length > 0) {
    console.log(`[env] Loaded ${file} with keys:`, Object.keys(result.parsed).join(', '))
    break
  } else {
    console.log(`[env] ${file} not found or empty, trying next...`)
  }
}

// Diagnostic: print which env vars are set (without values) for debugging on Hostinger
const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE', 'MYSQL_PORT']
const envStatus = requiredEnvVars.map((k) => `${k}=${process.env[k] ? '✓ set' : '✗ MISSING'}`).join(' | ')
console.log('[env status]', envStatus)
console.log('[env] NODE_ENV =', process.env.NODE_ENV || 'undefined')
console.log('[env] PORT (from hostinger) =', process.env.PORT || 'undefined (will use default)')

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'pln_profile',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function initializeDb() {
  // Create events table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pillar_id VARCHAR(50) NOT NULL,
      tag VARCHAR(100),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      header_image VARCHAR(500),
      status ENUM('upcoming', 'past') DEFAULT 'upcoming'
    )
  `)

  // Create gallery table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      year VARCHAR(10) NOT NULL,
      date VARCHAR(100) NOT NULL,
      description TEXT,
      cover VARCHAR(500),
      photos TEXT
    )
  `)

  // Create pillars table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pillars (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tab_id VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255),
      icon VARCHAR(100),
      color VARCHAR(50),
      stats TEXT,
      gallery TEXT
    )
  `)

  // Seed default pillars if empty
  const [pillarRows] = await pool.query('SELECT COUNT(*) as count FROM pillars')
  if (pillarRows[0].count === 0) {
    const defaultPillars = [
      {
        tab_id: 'cook',
        title: 'Cook For You',
        subtitle: 'Experience First',
        icon: 'Zap',
        color: '#00aee6',
        stats: JSON.stringify([
          { number: '28', label: 'Institutions Engaged' },
          { number: '12', label: 'UMKM Onboarded' },
          { number: '2.237+', label: 'Event Executions' },
        ]),
        gallery: JSON.stringify([
          { title: 'Demo Kompor Induksi Saumlaki', count: 3, images: ['/assets/images/event/DSC09650.JPG', '/assets/images/event/DSC09666.JPG', '/assets/images/event/DSC09683.JPG'] },
          { title: 'Festival Kuliner PLN4U', count: 2, images: ['/assets/images/event/DSC09684.JPG', '/assets/images/event/DSC09695.JPG'] },
        ]),
      },
      {
        tab_id: 'come',
        title: 'Come To You',
        subtitle: 'Ultimate Convenience',
        icon: 'Map',
        color: '#ffc400',
        stats: JSON.stringify([
          { number: '377+', label: 'Direct Services' },
          { number: '98%', label: 'Same Day Completion' },
        ]),
        gallery: JSON.stringify([
          { title: 'Layanan On-site Pelanggan', count: 2, images: ['/assets/images/event/DSC09932.JPG', '/assets/images/event/DSC09933.JPG'] },
        ]),
      },
      {
        tab_id: 'up',
        title: 'Up To You',
        subtitle: 'Peace of Mind',
        icon: 'BookOpen',
        color: '#f05286',
        stats: JSON.stringify([
          { number: '12', label: 'Strategic Events' },
          { number: '1.500+', label: 'Guests Served' },
        ]),
        gallery: JSON.stringify([
          { title: 'VIP Power Backup System', count: 1, images: ['/assets/images/event/IMG_3005.JPG'] },
        ]),
      },
      {
        tab_id: 'grow',
        title: 'Grow With You',
        subtitle: 'Shared Growth',
        icon: 'Headphones',
        color: '#8c1bab',
        stats: JSON.stringify([
          { number: '3+', label: 'Community Partnerships' },
          { number: '264K', label: 'VA Gained' },
        ]),
        gallery: JSON.stringify([
          { title: 'Kemitraan UMKM Saumlaki', count: 2, images: ['/assets/images/event/IMG_3029.JPG', '/assets/images/event/IMG_3081.JPG'] },
        ]),
      },
    ]

    for (const p of defaultPillars) {
      await pool.query(
        'INSERT INTO pillars (tab_id, title, subtitle, icon, color, stats, gallery) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.tab_id, p.title, p.subtitle, p.icon, p.color, p.stats, p.gallery]
      )
    }
  }

  // Seed default gallery if empty
  const [galleryRows] = await pool.query('SELECT COUNT(*) as count FROM gallery')
  if (galleryRows[0].count === 0) {
    const defaultGallery = [
      {
        title: 'Dokumentasi HLN 80',
        category: 'event',
        year: '2025',
        date: '27 Oktober 2025',
        description: 'Peringatan Hari Listrik Nasional ke-80 di lingkungan UP3 Saumlaki.',
        cover: '/assets/images/event/DSC09650.JPG',
        photos: JSON.stringify(['/assets/images/event/DSC09650.JPG', '/assets/images/event/DSC09666.JPG', '/assets/images/event/DSC09683.JPG']),
      },
      {
        title: 'Sosialisasi MATAKU',
        category: 'sosialisasi',
        year: '2026',
        date: '12 Februari 2026',
        description: 'Kegiatan edukasi dan sosialisasi program MATAKU kepada pelanggan.',
        cover: '/assets/images/event/DSC09684.JPG',
        photos: JSON.stringify(['/assets/images/event/DSC09684.JPG', '/assets/images/event/DSC09695.JPG']),
      },
      {
        title: 'Kegiatan SAR Kantor UP3',
        category: 'k3',
        year: '2026',
        date: '14 Juni 2026',
        description: 'Simulasi dan pelatihan tanggap darurat K3 bersama tim SAR.',
        cover: '/assets/images/event/DSC09704.jpg',
        photos: JSON.stringify(['/assets/images/event/DSC09704.jpg', '/assets/images/event/DSC09916.JPG']),
      },
      {
        title: 'Foto Unit UP3 Saumlaki',
        category: 'unit',
        year: '2026',
        date: '01 Januari 2026',
        description: 'Dokumentasi gedung, fasilitas kantor, dan lanskap lingkungan UP3 Saumlaki.',
        cover: '/assets/images/event/DSC09926.JPG',
        photos: JSON.stringify(['/assets/images/event/DSC09926.JPG', '/assets/images/event/DSC09932.JPG', '/assets/images/event/DSC09933.JPG']),
      },
      {
        title: 'Upacara 17 Agustus',
        category: 'event',
        year: '2025',
        date: '17 Agustus 2025',
        description: 'Peringatan Hari Kemerdekaan RI di halaman kantor PLN Saumlaki.',
        cover: '/assets/images/event/DSC09955.JPG',
        photos: JSON.stringify(['/assets/images/event/DSC09955.JPG']),
      },
    ]

    for (const g of defaultGallery) {
      await pool.query(
        'INSERT INTO gallery (title, category, year, date, description, cover, photos) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [g.title, g.category, g.year, g.date, g.description, g.cover, g.photos]
      )
    }
  }

  // Seed default events if empty
  const [eventRows] = await pool.query('SELECT COUNT(*) as count FROM events')
  if (eventRows[0].count === 0) {
    const defaultEvents = [
      {
        pillar_id: 'cook',
        tag: 'NEXT PROJECT',
        title: 'Green Future Powered Today',
        description: 'Pengembangan ekosistem energi bersih melalui demo memasak kompor induksi bersama komunitas lokal.',
        start_date: '2026-09-15',
        end_date: '2026-09-15',
        header_image: '/assets/images/event/DSC09704.jpg',
        status: 'upcoming',
      },
      {
        pillar_id: 'cook',
        tag: 'WORKSHOP',
        title: 'Electrifying Cooking Masterclass',
        description: 'Pelatihan khusus bagi pelaku UMKM Saumlaki dalam mengoptimalkan efisiensi dapur berbasis induksi.',
        start_date: '2026-10-28',
        end_date: '2026-10-28',
        header_image: '/assets/images/event/DSC09916.JPG',
        status: 'upcoming',
      },
      {
        pillar_id: 'cook',
        tag: 'EXPO',
        title: 'Saumlaki Clean Energy Foodfest',
        description: 'Pameran bazar kuliner ramah lingkungan dengan keikutsertaan puluhan tenant UMKM binaan.',
        start_date: '2026-11-10',
        end_date: '2026-11-10',
        header_image: '/assets/images/event/DSC09926.JPG',
        status: 'upcoming',
      },
      {
        pillar_id: 'come',
        tag: 'SPECIAL EVENT',
        title: 'Hari Pelanggan Nasional',
        description: 'Layanan jemput bola dan asistensi pemasangan baru secara langsung di lokasi pelanggan.',
        start_date: '2026-09-04',
        end_date: '2026-09-04',
        header_image: '/assets/images/event/DSC09955.JPG',
        status: 'upcoming',
      },
      {
        pillar_id: 'come',
        tag: 'COMMUNITY CARE',
        title: 'Inspeksi Instalasi Gratis',
        description: 'Kunjungan teknisi langsung ke rumah pelanggan untuk memastikan keamanan jaringan listrik internal.',
        start_date: '2026-09-20',
        end_date: '2026-09-20',
        header_image: '/assets/images/event/IMG_0054.JPG',
        status: 'upcoming',
      },
      {
        pillar_id: 'up',
        tag: 'INNOVATION',
        title: 'Smart Power Management',
        description: 'Kemudahan kontrol dan pemantauan daya listrik secara fleksibel sesuai kebutuhan event.',
        start_date: '2026-10-01',
        end_date: '2026-10-01',
        header_image: '/assets/images/event/IMG_3019.JPG',
        status: 'upcoming',
      },
      {
        pillar_id: 'grow',
        tag: 'COMMUNITY',
        title: 'Sentra Kuliner PLN4U',
        description: 'Dukungan infrastruktur kelistrikan bagi pelaku usaha kecil Saumlaki untuk tumbuh bersama.',
        start_date: '2026-12-18',
        end_date: '2026-12-18',
        header_image: '/assets/images/event/IMG_5439.JPG',
        status: 'upcoming',
      },
    ]

    for (const e of defaultEvents) {
      await pool.query(
        'INSERT INTO events (pillar_id, tag, title, description, start_date, end_date, header_image, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [e.pillar_id, e.tag, e.title, e.description, e.start_date, e.end_date, e.header_image, e.status]
      )
    }
  }

  // Create settings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(100) NOT NULL UNIQUE,
      \`value\` TEXT,
      \`description\` VARCHAR(255)
    )
  `)

  // Seed default email settings if empty
  const [settingsRows] = await pool.query('SELECT COUNT(*) as count FROM settings')
  if (settingsRows[0].count === 0) {
    const defaultSettings = [
      { key: 'email_user', value: 'pln4usaumlaki@gmail.com', description: 'Gmail address for sending emails' },
      { key: 'email_pass', value: '', description: 'Gmail App Password for SMTP authentication' },
      { key: 'contact_email', value: 'pln4usaumlaki@gmail.com', description: 'Recipient email for contact form submissions' },
      { key: 'smtp_host', value: 'smtp.gmail.com', description: 'SMTP server host' },
      { key: 'smtp_port', value: '587', description: 'SMTP server port' },
      { key: 'smtp_secure', value: 'false', description: 'Use TLS (true for port 465, false for other ports)' },
    ]
    for (const s of defaultSettings) {
      await pool.query(
        'INSERT INTO settings (`key`, `value`, `description`) VALUES (?, ?, ?)',
        [s.key, s.value, s.description]
      )
    }
  }

  // Auto-update event statuses
  const today = new Date().toISOString().split('T')[0]
  await pool.query('UPDATE events SET status = ? WHERE end_date < ? AND status = ?', ['past', today, 'upcoming'])

  return pool
}

export function getDb() {
  return pool
}
