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

Build command: `npm install`. Start command: `npm start`. Root directory: `server` (the server serves `../site`).

## Security notes

- Only one admin exists. The password is stored as a scrypt hash, sessions are signed cookies (httpOnly, SameSite=Strict, 12 hours), and login is limited to 8 tries per 15 minutes per IP.
- Every change request also needs an `X-Admin-Request` header, which blocks cross-site form tricks.
- Saved content is cleaned on the server: unknown fields are dropped, lengths are capped, and links must start with `http(s)://`, `mailto:` or `/`. The site also escapes text before showing it.
