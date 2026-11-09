// Single-admin auth: scrypt password hash in data/auth.json (or ADMIN_PASSWORD env),
// HMAC-signed session cookie, and a small login rate limit.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR } from './store.js';

const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const SECRET_FILE = path.join(DATA_DIR, 'session.secret');
const COOKIE = 'pf_admin';
const SESSION_HOURS = 12;
let secret;

export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

async function storedHash() {
  try { return JSON.parse(await fs.readFile(AUTH_FILE, 'utf8')).hash; } catch { return null; }
}

export async function passwordConfigured() {
  return Boolean((await storedHash()) || process.env.ADMIN_PASSWORD);
}

export async function checkPassword(pw) {
  if (typeof pw !== 'string' || !pw) return false;
  const hash = await storedHash();
  if (hash) {
    const [, saltHex, keyHex] = String(hash).split('$');
    if (!saltHex || !keyHex) return false;
    const expected = Buffer.from(keyHex, 'hex');
    if (!expected.length) return false;
    const key = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), expected.length);
    return crypto.timingSafeEqual(key, expected);
  }
  const env = process.env.ADMIN_PASSWORD;
  if (!env) return false;
  const a = crypto.createHash('sha256').update(pw).digest(), b = crypto.createHash('sha256').update(env).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function savePassword(pw) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(AUTH_FILE, JSON.stringify({ hash: await hashPassword(pw), updated: new Date().toISOString() }, null, 2), { mode: 0o600 });
}

async function getSecret() {
  if (secret) return secret;
  if (process.env.SESSION_SECRET) return (secret = process.env.SESSION_SECRET);
  try { secret = (await fs.readFile(SECRET_FILE, 'utf8')).trim(); }
  catch { secret = crypto.randomBytes(32).toString('hex'); await fs.mkdir(DATA_DIR, { recursive: true }); await fs.writeFile(SECRET_FILE, secret, { mode: 0o600 }); }
  return secret;
}

const sign = async payload => crypto.createHmac('sha256', await getSecret()).update(payload).digest('base64url');

export async function issueSession(res, secure) {
  const exp = Date.now() + SESSION_HOURS * 3600e3;
  const payload = `admin.${exp}`;
  res.cookie(COOKIE, `${payload}.${await sign(payload)}`, { httpOnly: true, sameSite: 'strict', secure, maxAge: SESSION_HOURS * 3600e3, path: '/' });
}

export function clearSession(res) { res.clearCookie(COOKIE, { path: '/' }); }

function readCookie(req) {
  const raw = req.headers.cookie || '';
  const m = raw.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
  return m ? decodeURIComponent(m.slice(COOKIE.length + 1)) : null;
}

export async function isAdmin(req) {
  const v = readCookie(req); if (!v) return false;
  const i = v.lastIndexOf('.'); if (i < 0) return false;
  const payload = v.slice(0, i), sig = v.slice(i + 1);
  const good = await sign(payload);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return false;
  return Number(payload.split('.')[1]) > Date.now();
}

// Mutating admin requests must carry the session cookie AND a custom header,
// which a cross-site form or image request cannot add.
export function requireAdmin(req, res, next) {
  isAdmin(req).then(ok => {
    if (!ok) return res.status(401).json({ error: 'Please sign in again.' });
    if (req.method !== 'GET' && req.get('X-Admin-Request') !== '1') return res.status(403).json({ error: 'Missing admin request header.' });
    next();
  }, next);
}

const attempts = new Map();
export function loginLimiter(req, res, next) {
  const key = req.ip, now = Date.now(), win = 15 * 60e3;
  const list = (attempts.get(key) || []).filter(t => now - t < win);
  if (list.length >= 8) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  list.push(now); attempts.set(key, list);
  next();
}
export function clearAttempts(req) { attempts.delete(req.ip); }
