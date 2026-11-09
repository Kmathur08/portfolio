# Portfolio server and admin

This folder runs your portfolio (`../site`) and an admin dashboard where you edit everything on it:
projects, experience, services, tools, side projects, profile and links, and your resume PDF.

Coding stats (Codolio) and recent commits (GitHub) are not edited here. The site fetches those live in the visitor's browser.

## Run it on your computer

```bash
cd server
npm install
npm run set-password      # choose the admin password (10+ characters)
npm start
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin

## How it works

| What | Where |
|---|---|
| All editable content | `data/content.json`, created from `content.default.json` on first start |
| Previous versions | `data/backups/`. The last 30 are kept, and the **History** tab restores them |
| Uploaded resumes | `data/uploads/` |
| Admin password (hashed) | `data/auth.json`. Change it with `npm run set-password` |

When someone opens the site, the server puts the current `content.json` into the page, so every change you save shows up on the next page load.
The site also still works as a plain static page: it falls back to the copy of the content written inside `site/index.html`.

## Hosting

Use any host that runs Node 20+ **and keeps files on disk between deploys** (your edits live in `data/`):

- **Render**: a Web Service with a persistent disk mounted at `/var/data`
- **Railway**: a service with a volume
- **Fly.io**: a machine with a volume
- **Any VPS**: for example DigitalOcean or a Lightsail droplet

Plain Vercel or Netlify won't work for the admin, because their file systems are reset on every deploy.

Settings for the host:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` (turns on secure cookies behind HTTPS) |
| `DATA_DIR` | the mounted disk, for example `/var/data` |
| `SESSION_SECRET` | any long random string |
| `ADMIN_PASSWORD` | optional. Use it instead of running `set-password` on the host |
| `PORT` | usually set by the host |
| `SITE_URL` | your public address, for example `https://kshitij.dev/`. Used for the canonical link, share image and sitemap |

Build command: `npm install`. Start command: `npm start`. Root directory: `server` (the server serves `../site`).

## Search and AI discoverability

Everything below is built from the same content you edit in the dashboard (`lib/seo.js`), so it updates when you save:

- **Search engines (SEO):** title, description, canonical link, Open Graph and Twitter cards with `og.png` for link previews, `/robots.txt` and `/sitemap.xml`.
- **Answer engines (AEO):** schema.org JSON-LD for you (`Person`), the site, your projects, and an FAQ written from your real details.
- **AI assistants (LLMO / GEO):** `/llms.txt`, a plain summary of your work for language models, and a plain-HTML copy of the portfolio inside `<noscript>`, for crawlers that don't run JavaScript. `robots.txt` explicitly welcomes GPTBot, ClaudeBot, PerplexityBot and others.

## Free hosting: static site + admin on your computer

Host only the `site/` folder for free (Vercel: import the repo, Root Directory `site`, no build command). Keep the admin on your own computer and publish edits like this:

1. `npm start`, then edit at http://localhost:3000/admin
2. `npm run export -- https://your-name.vercel.app/` (the address is remembered, so next time just `npm run export`)
3. `git add site && git commit -m "Update portfolio content" && git push`. The host redeploys by itself.

Export bakes your content into `site/index.html`, refreshes the SEO files and copies an uploaded resume to `site/Kshitij_Mathur_Resume.pdf`. That file becomes public, so upload a version without your phone number.

## Security notes

- Only one admin exists. The password is stored as a scrypt hash, sessions are signed cookies (httpOnly, SameSite=Strict, 12 hours), and login is limited to 8 tries per 15 minutes per IP.
- Every change request also needs an `X-Admin-Request` header, which blocks cross-site form tricks.
- Saved content is cleaned on the server: unknown fields are dropped, lengths are capped, and links must start with `http(s)://`, `mailto:` or `/`. The site also escapes text before showing it.
