// The public site address, remembered after the first time you pass it (stored in the committed site-url.txt).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site-url.txt');

export async function savedSiteUrl(arg) {
  let url = (arg || process.env.SITE_URL || '').trim();
  if (url) {
    if (!/^https?:\/\/[^/\s]+/i.test(url)) throw new Error(`"${url}" is not a web address. Example: https://your-name.vercel.app/`);
    url = new URL(url).origin + '/';
    await fs.writeFile(FILE, url + '\n');
    return url;
  }
  try { return (await fs.readFile(FILE, 'utf8')).trim(); } catch { return ''; }
}
