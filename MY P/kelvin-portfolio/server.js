/**
 * server.js — Express API + static hosting for the portfolio.
 * Auth: JWT in an httpOnly cookie. Admin CRUD over docs & items.
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const store = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const IS_PROD = process.env.NODE_ENV === 'production';

/* ---------- JWT secret: env var, or generated once and kept in data/ ---------- */
const SECRET_FILE = path.join(__dirname, 'data', '.jwt-secret');
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (fs.existsSync(SECRET_FILE)) JWT_SECRET = fs.readFileSync(SECRET_FILE, 'utf8').trim();
  else {
    JWT_SECRET = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(SECRET_FILE, JWT_SECRET, { mode: 0o600 });
  }
}

/* ---------- first-run admin account ---------- */
if (store.users.count() === 0) {
  const username = process.env.ADMIN_USER || 'kelvin';
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(6).toString('base64url');
  store.users.create(username, bcrypt.hashSync(password, 12));
  console.log('┌──────────────────────────────────────────────┐');
  console.log('│  ADMIN ACCOUNT CREATED (first run)           │');
  console.log(`│  username: ${username.padEnd(34)}│`);
  console.log(`│  password: ${password.padEnd(34)}│`);
  console.log('│  Log in at /admin and change it right away.  │');
  console.log('└──────────────────────────────────────────────┘');
}

/* ---------- middleware ---------- */
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired — log in again' });
  }
}
const cookieOpts = { httpOnly: true, sameSite: 'lax', secure: IS_PROD, maxAge: 7 * 24 * 3600 * 1000 };

/* ---------- uploads ---------- */
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
      cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif|avif|svg\+xml)$/.test(file.mimetype)
      || file.mimetype === 'application/pdf';
    cb(ok ? null : new Error('Only images or PDF files are allowed'), ok);
  }
});

/* =================== PUBLIC API =================== */
app.get('/api/content', (_req, res) => {
  const out = {};
  for (const key of store.DOC_KEYS) out[key] = store.getDoc(key);
  for (const col of store.COLLECTIONS) out[col] = store.listItems(col);
  res.json(out);
});

/* =================== CONTACT FORM =================== */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 8,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many messages — try again later.' }
});

app.post('/api/contact', contactLimiter, (req, res) => {
  const { name, email, message, website } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot: silently drop bots
  const n = String(name || '').trim(), e = String(email || '').trim(), m = String(message || '').trim();
  if (!n || n.length > 100) return res.status(400).json({ error: 'Please enter your name' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 200) return res.status(400).json({ error: 'Please enter a valid email' });
  if (!m || m.length > 5000) return res.status(400).json({ error: 'Please write a message (max 5000 chars)' });
  store.messages.create(n, e, m);
  res.status(201).json({ ok: true });
});

app.get('/api/messages', requireAuth, (_req, res) => {
  res.json({ messages: store.messages.list(), unread: store.messages.unread() });
});
app.put('/api/messages/:id/read', requireAuth, (req, res) => {
  store.messages.markRead(Number(req.params.id));
  res.json({ ok: true });
});
app.delete('/api/messages/:id', requireAuth, (req, res) => {
  store.messages.remove(Number(req.params.id));
  res.json({ ok: true });
});

/* =================== AUTH =================== */
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const user = username ? store.users.byName(String(username).trim()) : null;
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Wrong username or password' });
  }
  res.cookie('token', signToken(user), cookieOpts);
  res.json({ ok: true, username: user.username });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

app.put('/api/auth/password', requireAuth, (req, res) => {
  const { current, next } = req.body || {};
  const user = store.users.byName(req.user.username);
  if (!user || !bcrypt.compareSync(String(current || ''), user.password_hash)) {
    return res.status(400).json({ error: 'Current password is wrong' });
  }
  if (!next || String(next).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  store.users.setPassword(user.id, bcrypt.hashSync(String(next), 12));
  res.json({ ok: true });
});

/* =================== ADMIN CRUD =================== */
function checkDocKey(req, res, next) {
  if (!store.DOC_KEYS.includes(req.params.key)) return res.status(404).json({ error: 'Unknown section' });
  next();
}
function checkCollection(req, res, next) {
  if (!store.COLLECTIONS.includes(req.params.collection)) return res.status(404).json({ error: 'Unknown collection' });
  next();
}

app.put('/api/docs/:key', requireAuth, checkDocKey, (req, res) => {
  if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Body must be a JSON object' });
  }
  res.json(store.setDoc(req.params.key, req.body));
});

app.post('/api/items/:collection', requireAuth, checkCollection, (req, res) => {
  res.status(201).json(store.createItem(req.params.collection, req.body || {}));
});

app.put('/api/items/:collection/:id', requireAuth, checkCollection, (req, res) => {
  const updated = store.updateItem(req.params.collection, Number(req.params.id), req.body || {});
  if (!updated) return res.status(404).json({ error: 'Item not found' });
  res.json(updated);
});

app.delete('/api/items/:collection/:id', requireAuth, checkCollection, (req, res) => {
  if (!store.deleteItem(req.params.collection, Number(req.params.id))) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json({ ok: true });
});

app.put('/api/items/:collection/:id/move', requireAuth, checkCollection, (req, res) => {
  const dir = req.body && req.body.dir === 'up' ? 'up' : 'down';
  store.moveItem(req.params.collection, Number(req.params.id), dir);
  res.json({ ok: true });
});

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  res.json({ url: '/uploads/' + req.file.filename });
});

/* =================== STATIC =================== */
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

/* errors */
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message || 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Portfolio running  →  http://localhost:${PORT}`);
  console.log(`Admin panel        →  http://localhost:${PORT}/admin`);
});
