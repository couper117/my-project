/**
 * db.js — SQLite data layer using Node's built-in node:sqlite
 * (no native compilation needed — works out of the box on Node 22.5+/24).
 * Two stores:
 *   docs  — single JSON documents (profile, quotes, footer, …)
 *   items — ordered collections (gallery, projects, skills, socials, marquee)
 */
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'portfolio.db'));
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS docs (
  key TEXT PRIMARY KEY,
  json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_items_collection ON items(collection, position);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

/* ---------------- docs ---------------- */
const getDocStmt = db.prepare('SELECT json FROM docs WHERE key = ?');
const setDocStmt = db.prepare(`
  INSERT INTO docs (key, json) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET json = excluded.json`);

function getDoc(key) {
  const row = getDocStmt.get(key);
  return row ? JSON.parse(row.json) : null;
}
function setDoc(key, value) {
  setDocStmt.run(key, JSON.stringify(value));
  return value;
}

/* ---------------- items ---------------- */
const listStmt = db.prepare('SELECT id, position, json FROM items WHERE collection = ? ORDER BY position, id');
const maxPosStmt = db.prepare('SELECT COALESCE(MAX(position), -1) AS p FROM items WHERE collection = ?');
const insertStmt = db.prepare('INSERT INTO items (collection, position, json) VALUES (?, ?, ?)');
const getItemStmt = db.prepare('SELECT id, collection, position, json FROM items WHERE id = ? AND collection = ?');
const updateStmt = db.prepare('UPDATE items SET json = ? WHERE id = ?');
const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
const setPosStmt = db.prepare('UPDATE items SET position = ? WHERE id = ?');

function listItems(collection) {
  return listStmt.all(collection).map(r => ({ id: Number(r.id), ...JSON.parse(r.json) }));
}
function createItem(collection, data) {
  const pos = Number(maxPosStmt.get(collection).p) + 1;
  const info = insertStmt.run(collection, pos, JSON.stringify(data));
  return { id: Number(info.lastInsertRowid), ...data };
}
function updateItem(collection, id, data) {
  const row = getItemStmt.get(id, collection);
  if (!row) return null;
  const merged = { ...JSON.parse(row.json), ...data };
  delete merged.id;
  updateStmt.run(JSON.stringify(merged), id);
  return { id, ...merged };
}
function deleteItem(collection, id) {
  const row = getItemStmt.get(id, collection);
  if (!row) return false;
  deleteStmt.run(id);
  return true;
}
function moveItem(collection, id, dir) {
  db.exec('BEGIN');
  try {
    const rows = listStmt.all(collection);
    const i = rows.findIndex(r => Number(r.id) === Number(id));
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i === -1 || j < 0 || j >= rows.length) { db.exec('ROLLBACK'); return false; }
    // normalise positions then swap
    rows.forEach((r, idx) => setPosStmt.run(idx, r.id));
    setPosStmt.run(j, rows[i].id);
    setPosStmt.run(i, rows[j].id);
    db.exec('COMMIT');
    return true;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/* ---------------- users ---------------- */
/* ---------------- messages (contact form) ---------------- */
const msgCreateStmt = db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)');
const msgListStmt = db.prepare('SELECT * FROM messages ORDER BY id DESC');
const msgReadStmt = db.prepare('UPDATE messages SET read = 1 WHERE id = ?');
const msgDeleteStmt = db.prepare('DELETE FROM messages WHERE id = ?');
const msgUnreadStmt = db.prepare('SELECT COUNT(*) AS c FROM messages WHERE read = 0');

const messages = {
  create: (name, email, message) => Number(msgCreateStmt.run(name, email, message).lastInsertRowid),
  list: () => msgListStmt.all().map(m => ({ ...m, id: Number(m.id), read: Number(m.read) })),
  markRead: id => msgReadStmt.run(id),
  remove: id => msgDeleteStmt.run(id),
  unread: () => Number(msgUnreadStmt.get().c)
};

const userByNameStmt = db.prepare('SELECT * FROM users WHERE username = ?');
const userCountStmt = db.prepare('SELECT COUNT(*) AS c FROM users');
const createUserStmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
const setPasswordStmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');

/* ---------------- seed ---------------- */
const SEED_DOCS = {
  profile: {
    logo: 'IKK',
    nameLines: ['Ishimwe', 'Keny Kelvin'],
    role: 'Student Software Engineer',
    meta: 'New Generation Academy — Kigali, Rwanda — Age 17',
    badge: 'EST. 2009',
    nextLabel: 'Currently',
    nextValue: 'Student @ NGA',
    signature: '— Keny Kelvin',
    photo: 'https://avatars.githubusercontent.com/u/237972652?v=4',
    cvUrl: ''
  },
  quote1: {
    label: 'Message from Kelvin',
    text: '**Turning** concepts into robust, scalable and **high-quality** solutions. Using the best possible practice from **idea** to deployed solution.'
  },
  quote2: {
    label: 'Philosophy',
    text: "It doesn't matter **where you start**, it's how you **progress** from there. Every codebase is a puzzle waiting to be **solved**."
  },
  split: {
    a1: 'ON', a2: 'CODE', aDesc: 'Most recent **projects**, systems and experiments — from school platforms to full web apps.',
    b1: 'OFF', b2: 'CODE', bDesc: '**Student life**, football, gaming and everything that keeps the creativity running.'
  },
  sections: {
    galleryT1: 'The', galleryT2: 'Journey',
    projectsT1: 'Projects', projectsT2: 'Hall of Fame',
    projectsDesc: "From school management systems to sports platforms — I've always been passionate about building solutions that solve real problems, from idea to deployed product.",
    skillsT1: 'Tech', skillsT2: '& Stack',
    socialsT1: "What's up", socialsT2: 'On Socials',
    timelineT1: 'Career', timelineT2: 'So Far',
    contactT1: 'Get', contactT2: 'In Touch',
    contactDesc: "Have a project, an internship or a collab in mind? Drop a message — I read everything and reply fast."
  },
  footer: {
    big: 'Always building the future.',
    email: 'ikennykelvin75@gmail.com',
    tagline: 'Open for internships & collabs',
    copyright: '© 2026 Ishimwe Keny Kelvin. All rights reserved.',
    credit: 'Designed with inspiration — built with code'
  }
};

const SEED_ITEMS = {
  marquee: [
    { text: 'New Generation Academy' }, { text: 'Software Engineer' },
    { text: 'Kigali · Rwanda' }, { text: 'Problem → Solution' }, { text: 'Since 2009' }
  ],
  gallery: [
    { img: 'https://avatars.githubusercontent.com/u/237972652?v=4', place: 'Kigali', year: '2026' },
    { img: 'https://avatars.githubusercontent.com/u/237972652?v=4', place: 'Replace me', year: '2025' },
    { img: 'https://avatars.githubusercontent.com/u/237972652?v=4', place: 'Replace me', year: '2025' },
    { img: 'https://avatars.githubusercontent.com/u/237972652?v=4', place: 'Replace me', year: '2024' }
  ],
  projects: [
    { title: 'Interschool Sports Website', year: '2025', tag: 'PHP', desc: 'A full platform connecting schools through sports — fixtures, results and team management.', link: 'https://github.com/couper117/interschool-sports-website', img: '' },
    { title: 'Student Management System', year: '2025', tag: 'JavaScript', desc: 'Manage students, records and reports in one clean dashboard.', link: 'https://github.com/couper117/Student-management-system', img: '' },
    { title: 'My Portfolio', year: '2026', tag: 'Full-stack', desc: 'This very site — Node.js, Express and SQLite with a custom admin CMS.', link: 'https://github.com/couper117/MY-PORTFOLIO', img: '' },
    { title: 'Project 2025', year: '2025', tag: 'PHP', desc: 'A capstone-style project focused on real-world problem solving.', link: 'https://github.com/couper117/project2025', img: '' },
    { title: 'My NMP', year: '2025', tag: 'JavaScript', desc: 'A Node-powered experiment exploring modern backend patterns.', link: 'https://github.com/couper117/my-nmp', img: '' },
    { title: 'RRA Version 3', year: '2025', tag: 'Web', desc: 'Third iteration of the RRA build — cleaner, faster, better.', link: 'https://github.com/couper117/RRA-version-3', img: '' }
  ],
  skills: [
    { name: 'Python' }, { name: 'JavaScript' }, { name: 'PHP' }, { name: 'C' },
    { name: 'SQL' }, { name: 'Node.js' }, { name: 'HTML5' }, { name: 'CSS3' }
  ],
  timeline: [
    { period: '2024 — Present', title: 'Software Engineering Student', org: 'New Generation Academy', desc: 'Studying software engineering in Kigali — building real projects from idea to deployment.' },
    { period: '2025', title: 'Interschool Sports Website', org: 'School project', desc: 'Designed and shipped a full sports platform in PHP connecting schools through fixtures and results.' },
    { period: '2023', title: 'First lines of code', org: 'Self-taught', desc: 'Started with HTML, CSS and Python — and never stopped.' }
  ],
  socials: [
    { name: 'GitHub', handle: '@couper117', url: 'https://github.com/couper117' },
    { name: 'Instagram', handle: '@kel_vin_75', url: 'https://www.instagram.com/kel_vin_75/' },
    { name: 'LinkedIn', handle: '/in/kennykelvin', url: 'https://linkedin.com/in/kennykelvin' },
    { name: 'Email', handle: 'ikennykelvin75@gmail.com', url: 'mailto:ikennykelvin75@gmail.com' }
  ]
};

function seed() {
  for (const [key, def] of Object.entries(SEED_DOCS)) {
    const cur = getDoc(key);
    if (!cur) { setDoc(key, def); continue; }
    // migration: add any new fields to existing docs
    let changed = false;
    for (const k of Object.keys(def)) {
      if (!(k in cur)) { cur[k] = def[k]; changed = true; }
    }
    if (changed) setDoc(key, cur);
  }
  for (const [collection, rows] of Object.entries(SEED_ITEMS)) {
    if (listItems(collection).length === 0) rows.forEach(r => createItem(collection, r));
  }
}
seed();

module.exports = {
  db,
  getDoc, setDoc,
  listItems, createItem, updateItem, deleteItem, moveItem,
  messages,
  users: {
    byName: u => userByNameStmt.get(u),
    count: () => Number(userCountStmt.get().c),
    create: (u, hash) => createUserStmt.run(u, hash),
    setPassword: (id, hash) => setPasswordStmt.run(hash, id)
  },
  DOC_KEYS: Object.keys(SEED_DOCS),
  COLLECTIONS: Object.keys(SEED_ITEMS)
};
