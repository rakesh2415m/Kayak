// Single-owner admin login: scrypt-hashed password, opaque session cookie.
const crypto = require('node:crypto');
const { db, getSettings, setSetting } = require('./db');

const COOKIE = 'nbk_admin';
const SESSION_DAYS = 30;

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}
function checkPassword(pw, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const a = crypto.scryptSync(String(pw), salt, 64);
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ADMIN_PASSWORD, when set, always becomes the password at startup (so it can
// be used to reset a forgotten one). Otherwise a random one is generated on first run.
function ensurePassword() {
  const current = getSettings().admin_password_hash;
  if (process.env.ADMIN_PASSWORD) {
    if (!checkPassword(process.env.ADMIN_PASSWORD, current)) setSetting('admin_password_hash', hashPassword(process.env.ADMIN_PASSWORD));
    return;
  }
  if (current) return;
  let pw;
  if (!pw) {
    pw = crypto.randomBytes(6).toString('base64url');
    console.log('\n  ┌──────────────────────────────────────────────┐');
    console.log(`  │  Admin password (first run): ${pw.padEnd(16)}│`);
    console.log('  │  Change it in Admin → Settings.              │');
    console.log('  └──────────────────────────────────────────────┘\n');
  }
  setSetting('admin_password_hash', hashPassword(pw));
}

function readCookie(req) {
  const raw = req.headers.cookie || '';
  const m = raw.split(/;\s*/).find(c => c.startsWith(COOKIE + '='));
  return m ? decodeURIComponent(m.slice(COOKIE.length + 1)) : '';
}

function isAuthed(req) {
  const t = readCookie(req);
  if (!t) return false;
  const row = db.prepare('SELECT expires_at FROM admin_sessions WHERE token = ?').get(t);
  return !!row && row.expires_at > Date.now();
}

function requireAdmin(req, res, next) {
  if (isAuthed(req)) return next();
  res.status(401).json({ error: 'Please log in' });
}

const attempts = new Map();
function login(req, res) {
  const key = req.ip;
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter(t => now - t < 15 * 60_000);
  if (recent.length >= 10) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  if (!checkPassword(req.body?.password || '', getSettings().admin_password_hash)) {
    recent.push(now);
    attempts.set(key, recent);
    return res.status(401).json({ error: 'Wrong password' });
  }
  attempts.delete(key);
  const token = crypto.randomBytes(32).toString('hex');
  const expires = now + SESSION_DAYS * 86400e3;
  db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(now);
  db.prepare('INSERT INTO admin_sessions(token, expires_at) VALUES(?, ?)').run(token, expires);
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.set('Set-Cookie', `${COOKIE}=${token}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}${secure}`);
  res.json({ ok: true });
}

function logout(req, res) {
  db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(readCookie(req));
  res.set('Set-Cookie', `${COOKIE}=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0`);
  res.json({ ok: true });
}

function changePassword(current, next) {
  if (!checkPassword(current, getSettings().admin_password_hash)) return 'Current password is wrong';
  if (String(next || '').length < 8) return 'New password must be at least 8 characters';
  setSetting('admin_password_hash', hashPassword(next));
  db.prepare('DELETE FROM admin_sessions').run();
  return null;
}

module.exports = { ensurePassword, requireAdmin, isAuthed, login, logout, changePassword, hashPassword };
