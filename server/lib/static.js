// Writes content into the static site folder, so the site works on any static host (Vercel, Netlify, Pages)
// without this server: content baked into index.html, SEO blocks, llms.txt, robots.txt and sitemap.xml.
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildSeo, injectSeo } from './seo.js';

const CONTENT_RE = /(<script id="site-content" type="application\/json">)[\s\S]*?(<\/script>)/;
const escAttr = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const readEmbedded = html => JSON.parse(html.match(/<script id="site-content" type="application\/json">([\s\S]*?)<\/script>/)[1]);

export async function writeSite(siteDir, content, siteUrl = '') {
  const file = path.join(siteDir, 'index.html');
  let html = await fs.readFile(file, 'utf8');
  if (!CONTENT_RE.test(html)) throw new Error('index.html has no site-content block');
  const seo = buildSeo(content, siteUrl);
  const blob = JSON.stringify(content, null, 1).replace(/</g, '\\u003c');
  html = html.replace(CONTENT_RE, (_, a, b) => a + blob + b);
  html = injectSeo(html, seo).replace(/<title>[^<]*<\/title>/, () => `<title>${escAttr(seo.title)}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, (_, a, b) => a + escAttr(seo.description) + b);
  await fs.writeFile(file, html);
  await fs.writeFile(path.join(siteDir, 'llms.txt'), seo.llms);
  await fs.writeFile(path.join(siteDir, 'robots.txt'), seo.robots);
  if (seo.sitemap) await fs.writeFile(path.join(siteDir, 'sitemap.xml'), seo.sitemap);
  return seo;
}
