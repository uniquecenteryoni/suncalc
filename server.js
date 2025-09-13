import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25kb' }));
app.use(express.urlencoded({ extended: true }));

// Basic rate limit (very naive, per-process memory)
const recent = new Map();
function rateLimit(key, windowMs = 60000, max = 5) {
  const now = Date.now();
  const arr = recent.get(key) || [];
  const filtered = arr.filter(ts => now - ts < windowMs);
  if (filtered.length >= max) return false;
  filtered.push(now);
  recent.set(key, filtered);
  return true;
}

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  FEEDBACK_TO = 'unique.center.yoni@gmail.com',
  FEEDBACK_FROM
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn('[warn] SMTP environment variables are missing. Feedback endpoint will 500.');
}

let transporter;
try {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // true for 465
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
} catch (e) {
  console.error('Failed to create transporter', e);
}

app.post('/api/feedback', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!rateLimit(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many requests, slow down.' });
  }
  const { name = '', email = '', message = '' } = req.body || {};
  const trimmedMsg = (message || '').trim();
  if (!trimmedMsg) return res.status(400).json({ ok: false, error: 'Message required' });
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (email && !emailRe.test(email)) return res.status(400).json({ ok: false, error: 'Invalid sender email' });
  if (!transporter) return res.status(500).json({ ok: false, error: 'Mail transporter not configured' });

  try {
    const info = await transporter.sendMail({
      from: FEEDBACK_FROM || SMTP_USER,
      to: FEEDBACK_TO,
      subject: `[Cyprus Crags] Feedback from ${name || 'anonymous'}`,
      replyTo: email || undefined,
      text: `Name: ${name}\nEmail: ${email}\nIP: ${ip}\n\nMessage:\n${trimmedMsg}`
    });
    res.json({ ok: true, id: info.messageId });
  } catch (err) {
    console.error('Send fail', err);
    res.status(500).json({ ok: false, error: 'Failed to send email' });
  }
});

// Serve static files (calc.html and assets)
app.use(express.static(__dirname, { extensions: ['html'] }));

app.get('/healthz', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
