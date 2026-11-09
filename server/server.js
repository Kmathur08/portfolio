// Kshitij's portfolio server: serves the site with live content baked in,
// a JSON API for that content, and the password-protected admin dashboard at /admin.
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as store from './lib/store.js';
import * as auth from './lib/auth.js';
import { cleanContent, PREVIEWS, ICONS } from './lib/validate.js';
import { buildSeo, injectSeo } from './lib/seo.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(process.env.SITE_DIR || path.join(here, '..', 'site'));
const ADMIN_DIR = path.join(here, 'admin');
const PORT = +process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';

await store.init();
const app = express();
app.disable('x-powered-by');
if (PROD) app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN' });
  next();
});

// ---------- public site: index.html with the current content embedded ----------
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
async function renderIndex(req, res, next) {
  try {
    const [html, content] = await Promise.all([fs.readFile(path.join(SITE_DIR, 'index.html'), 'utf8'), store.readContent()]);
    const blob = JSON.stringify(content).replace(/</g, '\\u003c');
    let out = html.replace(/(<script id="site-content" type="application\/json">)[\s\S]*?(<\/script>)/, (_, a, b) => a + blob + b);
    const seo = buildSeo(content, siteUrl(req));
    out = injectSeo(out, seo).replace(/<title>[^<]*<\/title>/, () => `<title>${esc(seo.title)}</title>`);
    out = out.replace(/(<meta name="description" content=")[^"]*(")/, (_, a, b) => a + esc(seo.description) + b);
    res.set('Cache-Control', 'no-cache').type('html').send(out);
  } catch (e) { next(e); }
}
app.get(['/', '/index.html'], renderIndex);

// ---------- SEO / AI discoverability files, always in sync with the current content ----------
// SITE_URL (e.g. https://kshitij.dev/) is the public address; without it the request's own host is used.
const siteUrl = req => process.env.SITE_URL || `${req.protocol}://${req.get('host')}/`;
const seoFile = (key, type) => async (req, res, next) => {
  try {
    const text = buildSeo(await store.readContent(), siteUrl(req))[key];
    if (!text) return res.status(404).end();
    res.set('Cache-Control', 'public, max-age=3600').type(type).send(text);
  } catch (e) { next(e); }
};
app.get('/llms.txt', seoFile('llms', 'text/plain; charset=utf-8'));
app.get('/robots.txt', seoFile('robots', 'text/plain; charset=utf-8'));
app.get('/sitemap.xml', seoFile('sitemap', 'application/xml'));
app.get('/api/content', async (req, res, next) => { try { res.set('Cache-Control', 'no-cache').json(await store.readContent()); } catch (e) { next(e); } });
app.use('/uploads', express.static(store.UPLOAD_DIR, { maxAge: '1h', fallthrough: false }));

// ---------- auth ----------
app.use('/api', express.json({ limit: '1mb' }));
app.get('/api/auth/me', async (req, res) => res.json({ admin: await auth.isAdmin(req), configured: await auth.passwordConfigured() }));
app.post('/api/auth/login', auth.loginLimiter, async (req, res, next) => {
  try {
    if (!(await auth.passwordConfigured())) return res.status(503).json({ error: 'No admin password yet. Run "npm run set-password" on the server first.' });
    if (!(await auth.checkPassword(req.body?.password))) return res.status(401).json({ error: 'That password is not right.' });
    auth.clearAttempts(req);
    await auth.issueSession(res, req.secure);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
app.post('/api/auth/logout', (req, res) => { auth.clearSession(res); res.json({ ok: true }); });

// ---------- admin API ----------
app.get('/api/admin/meta', auth.requireAdmin, (req, res) => res.json({ previews: PREVIEWS, icons: ICONS }));
app.put('/api/admin/content', auth.requireAdmin, async (req, res, next) => {
  try {
    const clean = cleanContent(req.body), stored = await store.readContent();
    clean.resume = stored.resume || clean.resume;
    clean.commitsFallback = clean.commitsFallback.length ? clean.commitsFallback : stored.commitsFallback || [];
    await store.writeContent(clean, 'save');
    res.json({ ok: true, content: clean });
  } catch (e) { next(e); }
});
app.get('/api/admin/backups', auth.requireAdmin, async (req, res, next) => { try { res.json(await store.listBackups()); } catch (e) { next(e); } });
app.post('/api/admin/backups/:name/restore', auth.requireAdmin, async (req, res, next) => {
  try { res.json({ ok: true, content: await store.restoreBackup(req.params.name) }); } catch (e) { next(e); }
});

// Resume upload: the browser sends the PDF as the raw request body.
app.post('/api/admin/resume', auth.requireAdmin, express.raw({ type: 'application/pdf', limit: '8mb' }), async (req, res, next) => {
  try {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length < 100 || buf.subarray(0, 5).toString() !== '%PDF-') return res.status(400).json({ error: 'Please choose a PDF file.' });
    const name = `resume-${Date.now()}.pdf`;
    await fs.writeFile(path.join(store.UPLOAD_DIR, name), buf);
    const pages = Math.max(1, (buf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length);
    const kb = buf.length / 1024, size = kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.round(kb) + ' KB';
    const updated = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    let old;
    const content = await store.updateContent(doc => { old = doc.resume?.url; doc.resume = { url: '/uploads/' + name, updated, size, pages }; }, 'resume');
    // remove the previous uploaded resume (the original one in /site is left alone)
    if (old && old.startsWith('/uploads/resume-')) await fs.unlink(path.join(store.UPLOAD_DIR, path.basename(old))).catch(() => {});
    res.json({ ok: true, resume: content.resume });
  } catch (e) { next(e); }
});

// ---------- admin dashboard + rest of the static site ----------
app.use('/admin', express.static(ADMIN_DIR, { index: 'index.html' }));
app.use(express.static(SITE_DIR, { index: false }));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong on the server.' });
});

app.listen(PORT, async () => {
  console.log(`Portfolio:  http://localhost:${PORT}`);
  console.log(`Admin:      http://localhost:${PORT}/admin`);
  if (!(await auth.passwordConfigured())) console.log('No admin password yet. Run: npm run set-password');
});
