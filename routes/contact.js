import { Router } from 'express'
import nodemailer from 'nodemailer'

export default function contactRoutes(db) {
  const router = Router()

  // Helper: get all settings from database
  async function getSettings() {
    const [rows] = await db.query('SELECT `key`, `value` FROM settings')
    const settings = {}
    rows.forEach(row => {
      settings[row.key] = row.value
    })
    return settings
  }

  // POST /api/contact - Send contact form email
  router.post('/', async (req, res) => {
    const { name, contact, message } = req.body

    if (!name || !contact || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, contact, and message are required',
      })
    }

    try {
      const settings = await getSettings()

      const transporter = nodemailer.createTransporter({
        host: settings.smtp_host || 'smtp.gmail.com',
        port: parseInt(settings.smtp_port || '587'),
        secure: settings.smtp_secure === 'true',
        auth: {
          user: settings.email_user,
          pass: settings.email_pass,
        },
      })

      const mailOptions = {
        from: `"PLN4U Saumlaki Website" <${settings.email_user}>`,
        to: settings.contact_email || 'pln4usaumlaki@gmail.com',
        subject: `Pesan dari ${name} - PLN4U Saumlaki`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: #008ed6; color: white; padding: 16px; text-align: center; border-radius: 6px 6px 0 0;">
            <h2 style="margin: 0; font-size: 20px;">Pesan Baru dari Website PLN4U Saumlaki</h2>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 120px;">Nama</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Email / No. HP</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${contact}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; vertical-align: top;">Pesan</td>
                <td style="padding: 8px 12px; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</td>
              </tr>
            </table>
          </div>
          <div style="padding: 12px 20px; background: #f0f0f0; text-align: center; font-size: 12px; color: #888; border-radius: 0 0 6px 6px;">
            Email ini dikirim otomatis dari formulir kontak website PLN4U Saumlaki.
          </div>
        </div>
      `,
      }

      await transporter.sendMail(mailOptions)

      res.json({
        success: true,
        message: 'Pesan berhasil terkirim',
      })
    } catch (err) {
      console.error('Email send error:', err)
      res.status(500).json({
        success: false,
        message: 'Gagal mengirim pesan',
        error: err.message,
      })
    }
  })

  return router
}
