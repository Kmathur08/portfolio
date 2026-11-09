// Publishes what you edited in the admin dashboard to the static site folder:
//   npm run export                              (uses the site address saved last time)
//   npm run export -- https://your-name.vercel.app/
// Then commit and push; Vercel/Netlify redeploys the site by itself.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as store from '../lib/store.js';
import { writeSite } from '../lib/static.js';
import { savedSiteUrl } from './site-url.js';

const site = path.resolve(process.env.SITE_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'site'));
const RESUME = 'Kshitij_Mathur_Resume.pdf';

await store.init();
const content = await store.readContent();
const url = await savedSiteUrl(process.argv[2]);

// a resume uploaded in the dashboard lives in data/uploads; copy it next to the site under the usual name
const up = content.resume?.url || '';
if (up.startsWith('/uploads/')) {
  await fs.copyFile(path.join(store.UPLOAD_DIR, path.basename(up)), path.join(site, RESUME));
  content.resume = { ...content.resume, url: RESUME };
  console.log(`Resume copied to site/${RESUME}. It will be public once pushed, so make sure it has no phone number.`);
}

await writeSite(site, content, url);
console.log(`Exported ${content.projects?.length || 0} projects, ${content.experience?.length || 0} timeline entries and ${content.tools?.length || 0} tools to site/.`);
console.log(url ? `Site address: ${url}` : 'Tip: add your site address once for the canonical link, share image and sitemap: npm run export -- https://your-name.vercel.app/');
console.log('Next: run  npm run deploy  to put it live (or commit and push the site folder yourself).');
