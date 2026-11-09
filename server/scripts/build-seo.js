// Refreshes the SEO blocks, llms.txt, robots.txt and (with a site URL) sitemap.xml from the content already in site/index.html.
//   npm run build-seo -- https://your-name.vercel.app/
// To publish edits made in the admin dashboard, use "npm run export" instead.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEmbedded, writeSite } from '../lib/static.js';
import { savedSiteUrl } from './site-url.js';

const site = path.resolve(process.env.SITE_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'site'));
const url = await savedSiteUrl(process.argv[2]);
await writeSite(site, readEmbedded(await fs.readFile(path.join(site, 'index.html'), 'utf8')), url);
console.log('SEO updated' + (url ? ` for ${url}` : '. Add your site address to include the canonical link, share image and sitemap: npm run build-seo -- https://your-name.vercel.app/'));
