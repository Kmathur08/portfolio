// Cleans a content document coming from the admin dashboard: keeps only known fields,
// coerces types, trims strings and caps lengths, so a typo can't break the public site.
const str = (v, max = 400) => (v == null ? '' : String(v)).trim().slice(0, max);
const text = v => str(v, 4000);
const url = v => { const s = str(v, 500); return !s || /^(https?:\/\/|mailto:|\/(?![\/\\]))/i.test(s) || /^[\w./-]+\.pdf$/i.test(s) ? s : ''; };
const color = (v, d) => (/^#[0-9a-f]{3,8}$/i.test(str(v)) ? str(v) : d);
const list = (v, fn, max = 60) => (Array.isArray(v) ? v : []).slice(0, max).map(fn);
const words = v => (Array.isArray(v) ? v : String(v || '').split(',')).map(x => str(x, 80)).filter(Boolean).slice(0, 30);
const slug = (v, i) => str(v, 60).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || `project-${i + 1}`;

export const PREVIEWS = ['meet', 'thandak', 'paper', 'interview', 'api', 'kanban', 'dash', 'code', 'chat', 'phone', 'sphere', 'gradient', 'kinetic'];
export const ICONS = ['pen', 'globe', 'bot', 'grid'];

export function cleanContent(c = {}) {
  const p = c.profile || {};
  const out = {
    profile: {
      name: str(p.name, 80), firstName: str(p.firstName, 40), availability: str(p.availability, 80), lead: text(p.lead),
      education: str(p.education, 120), location: str(p.location, 80), email: str(p.email, 120), usualReply: str(p.usualReply, 60),
      links: Object.fromEntries(['github', 'linkedin', 'leetcode', 'codolio'].map(k => [k, url((p.links || {})[k])])),
      contactLinks: list(p.contactLinks, l => ({ label: str(l?.label, 40), url: url(l?.url) }), 12).filter(l => l.label && l.url)
    },
    resume: { url: url(c.resume?.url), updated: str(c.resume?.updated, 40), size: str(c.resume?.size, 20), pages: Math.max(1, Math.min(20, parseInt(c.resume?.pages, 10) || 1)) },
    projects: list(c.projects, (x = {}, i) => ({
      slug: slug(x.slug || x.name, i), name: str(x.name, 80), kicker: str(x.kicker, 80), year: str(x.year, 30), role: str(x.role, 80),
      platform: str(x.platform, 80), team: str(x.team, 40), accent: color(x.accent, '#ff7a4e'), preview: PREVIEWS.includes(x.preview) ? x.preview : 'code',
      summary: text(x.summary), metric: { value: str(x.metric?.value, 20), label: str(x.metric?.label, 40) }, chips: words(x.chips).slice(0, 4),
      story: { challenge: text(x.story?.challenge), approach: text(x.story?.approach), outcome: text(x.story?.outcome) },
      stats: list(x.stats, s => ({ value: str(s?.value, 20), label: str(s?.label, 80) }), 3), stack: words(x.stack),
      live: url(x.live), repo: url(x.repo) }), 20).filter(x => x.name),
    experience: list(c.experience, (e = {}) => ({ when: str(e.when, 40), title: str(e.title, 80), text: str(e.text, 300) }), 12).filter(e => e.title),
    services: list(c.services, (s = {}) => ({ title: str(s.title, 60), tag: str(s.tag, 60), icon: ICONS.includes(s.icon) ? s.icon : 'pen', description: text(s.description),
      items: words(s.items), duration: str(s.duration, 40), audience: str(s.audience, 60) }), 8).filter(s => s.title),
    tools: list(c.tools, (t = {}) => ({ name: str(t.name, 40), short: str(t.short, 3) || str(t.name, 2), color: color(t.color, '#ffffff') }), 80).filter(t => t.name),
    sideProjects: list(c.sideProjects, (r = {}) => ({ year: str(r.year, 12), title: str(r.title, 80), description: str(r.description, 200), tags: str(r.tags, 80), url: url(r.url) }), 30).filter(r => r.title),
    commitsFallback: list(c.commitsFallback, (q = {}) => ({ message: str(q.message, 200), repo: str(q.repo, 40), date: str(q.date, 30) }), 8)
  };
  return out;
}
