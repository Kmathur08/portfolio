// Search + answer-engine + LLM discoverability, all generated from the same content the site shows.
//   head     -> meta, Open Graph, Twitter card, canonical, JSON-LD (Person, WebSite, ProfilePage, projects, FAQ)
//   body     -> a plain-HTML copy of the portfolio inside <noscript>, for crawlers and AI bots that don't run JavaScript
//   llms     -> /llms.txt, a markdown summary written for language models
//   robots   -> /robots.txt (search engines and AI crawlers welcome)
//   sitemap  -> /sitemap.xml (only when the public URL is known)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const abs = (u, base) => { try { return base ? new URL(u, base).href : (/^https?:/i.test(u) ? u : ''); } catch { return ''; } };
const clean = o => JSON.parse(JSON.stringify(o, (k, v) => (v === '' || (Array.isArray(v) && !v.length) ? undefined : v)));
const list = a => a.filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1');

export function buildSeo(content = {}, siteUrl = '') {
  const base = siteUrl ? siteUrl.replace(/\/?$/, '/') : '';
  const p = content.profile || {}, links = p.links || {};
  const name = p.name || 'Kshitij Mathur';
  const role = 'Full-stack developer & product engineer';
  const title = `${name} · ${role}`;
  const lead = p.lead || `${name}, ${role.toLowerCase()} from India.`;
  const desc = lead.length <= 160 ? lead : lead.slice(0, 157).replace(/\s+\S*$/, '') + '…';
  const projects = content.projects || [], exp = content.experience || [], tools = (content.tools || []).map(t => t.name);
  const side = content.sideProjects || [], services = content.services || [];
  const sameAs = [links.github, links.linkedin, links.leetcode, links.codolio].filter(Boolean);
  const [city, country] = (p.location || 'Jaipur, India').split(',').map(s => s.trim());
  const school = (p.education || '').split('·').map(s => s.trim());
  const jobs = exp.filter(e => /intern/i.test(e.title));

  // ---------- answers to the questions people (and answer engines) actually ask ----------
  const faq = [
    [`Who is ${name}?`, `${lead}${p.education ? ` Education: ${p.education}.` : ''}`],
    [`What projects has ${p.firstName || name} built?`, projects.map(x => `${x.name}: ${x.summary}`).join(' ')],
    [`What technologies does ${p.firstName || name} work with?`, `${list(tools)}.`],
    jobs.length && [`Where has ${p.firstName || name} interned?`, jobs.map(e => `${e.title} (${e.when}): ${e.text}`).join(' ')],
    [`Is ${p.firstName || name} available for work?`, `${p.availability || 'Yes'}.${p.usualReply ? ` Usual reply time: ${p.usualReply.toLowerCase()}.` : ''}`],
    p.email && [`How can I contact ${name}?`, `Email ${p.email}${links.linkedin ? `, or message on LinkedIn (${links.linkedin})` : ''}${links.github ? `. Code is on GitHub at ${links.github}` : ''}.`]
  ].filter(Boolean);

  // ---------- structured data ----------
  const personId = (base || '') + '#person';
  const graph = [
    clean({ '@type': 'Person', '@id': personId, name, givenName: p.firstName, jobTitle: role, description: desc, email: p.email ? `mailto:${p.email}` : '',
      url: base, image: base ? base + 'og.png' : '', sameAs,
      address: { '@type': 'PostalAddress', addressLocality: city, addressCountry: country || 'India' },
      alumniOf: school[1] ? { '@type': 'CollegeOrUniversity', name: school[1] } : undefined,
      knowsAbout: tools, knowsLanguage: ['English', 'Hindi'] }),
    clean({ '@type': 'WebSite', '@id': (base || '') + '#website', url: base, name: `${name} portfolio`, description: desc, inLanguage: 'en', author: { '@id': personId } }),
    clean({ '@type': 'ProfilePage', '@id': (base || '') + '#page', url: base, name: title, description: desc, mainEntity: { '@id': personId }, dateModified: new Date().toISOString().slice(0, 10) }),
    { '@type': 'ItemList', name: `Projects by ${name}`, itemListElement: projects.map((x, i) => ({ '@type': 'ListItem', position: i + 1,
      item: clean({ '@type': 'SoftwareApplication', name: x.name, description: x.summary, applicationCategory: x.kicker, operatingSystem: x.platform,
        url: x.live || x.repo, codeRepository: x.repo, dateCreated: x.year, keywords: (x.stack || x.chips || []).join(', '), author: { '@id': personId } }) })) },
    { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ];
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');

  const img = base ? base + 'og.png' : '';
  const head = [
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<meta name="author" content="${esc(name)}" />`,
    `<meta name="theme-color" content="#0b0806" />`,
    `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#1a0f0a"/><text x="32" y="45" font-family="Arial,sans-serif" font-size="38" font-weight="700" text-anchor="middle" fill="#ffa582">K</text></svg>`)}" />`,
    base && `<link rel="canonical" href="${esc(base)}" />`,
    `<link rel="alternate" type="text/plain" href="llms.txt" title="LLM-readable summary" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${esc(name)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    base && `<meta property="og:url" content="${esc(base)}" />`,
    img && `<meta property="og:image" content="${esc(img)}" />`,
    img && `<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />`,
    img && `<meta property="og:image:alt" content="${esc(`${name}, ${role}`)}" />`,
    `<meta property="profile:first_name" content="${esc(p.firstName || name.split(' ')[0])}" />`,
    `<meta property="profile:last_name" content="${esc(name.split(' ').slice(1).join(' '))}" />`,
    `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    img && `<meta name="twitter:image" content="${esc(img)}" />`,
    `<script type="application/ld+json">${ld}</script>`
  ].filter(Boolean).join('\n');

  // ---------- plain HTML copy for non-JS crawlers ----------
  const a = (u, t) => u ? `<a href="${esc(u)}">${esc(t)}</a>` : esc(t);
  const body = `<noscript><article class="seo-copy" style="max-width:760px;margin:0 auto;padding:120px 24px;position:relative;z-index:3;line-height:1.6">
<h1>${esc(name)}, ${esc(role.toLowerCase())}</h1>
<p>${esc(p.lead)}</p>
<p>${esc(p.education)} · ${esc(p.location)} · ${esc(p.availability)}</p>
<h2>Projects</h2>
${projects.map(x => `<section><h3>${esc(x.name)}: ${esc(x.kicker)}</h3><p>${esc(x.summary)}</p>${x.story?.approach ? `<p>${esc(x.story.approach)}</p>` : ''}${x.story?.outcome ? `<p>${esc(x.story.outcome)}</p>` : ''}<p>Stack: ${esc((x.stack || x.chips || []).join(', '))}. ${x.live ? a(x.live, 'Live site') : ''} ${x.repo ? a(x.repo, 'Source code') : ''}</p></section>`).join('\n')}
<h2>Experience</h2>
<ul>${exp.map(e => `<li><strong>${esc(e.title)}</strong> (${esc(e.when)}): ${esc(e.text)}</li>`).join('')}</ul>
<h2>Services</h2>
<ul>${services.map(s => `<li><strong>${esc(s.title)}</strong>: ${esc(s.description)}</li>`).join('')}</ul>
<h2>Skills and tools</h2>
<p>${esc(tools.join(', '))}</p>
${side.length ? `<h2>Side projects</h2><ul>${side.map(r => `<li>${a(r.url, r.title)} (${esc(r.year)}): ${esc(r.description)}</li>`).join('')}</ul>` : ''}
<h2>Frequently asked questions</h2>
${faq.map(([q, ans]) => `<h3>${esc(q)}</h3><p>${esc(ans)}</p>`).join('\n')}
<h2>Contact</h2>
<p>${p.email ? a('mailto:' + p.email, p.email) : ''} · ${sameAs.map(u => a(u, u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))).join(' · ')}</p>
</article></noscript>`;

  // ---------- llms.txt ----------
  const llms = `# ${name}

> ${lead}

${name} is based in ${p.location || 'India'}. ${p.education ? `Education: ${p.education}. ` : ''}${p.availability ? `Status: ${p.availability}.` : ''}

## Projects

${projects.map(x => `- ${x.live || x.repo ? `[${x.name}](${x.live || x.repo})` : `**${x.name}**`}: ${x.kicker}. ${x.summary} Stack: ${(x.stack || x.chips || []).join(', ')}.${x.repo ? ` Code: ${x.repo}` : ''}`).join('\n')}

## Experience

${exp.map(e => `- ${e.title} (${e.when}): ${e.text}`).join('\n')}

## Skills

${tools.join(', ')}

## Services

${services.map(s => `- ${s.title}: ${s.description}`).join('\n')}
${side.length ? `\n## Side projects\n\n${side.map(r => `- [${r.title}](${r.url}) (${r.year}): ${r.description}`).join('\n')}\n` : ''}
## FAQ

${faq.map(([q, ans]) => `### ${q}\n${ans}`).join('\n\n')}

## Links

${p.email ? `- Email: ${p.email}\n` : ''}${sameAs.map(u => `- ${u}`).join('\n')}
`;

  // one group for everyone, so the /admin and /api rules apply to the named AI crawlers too
  const bots = ['*', 'Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'];
  const robots = [
    '# Search engines and AI assistants are welcome to read this portfolio.',
    ...bots.map(b => `User-agent: ${b}`),
    'Allow: /', 'Disallow: /admin', 'Disallow: /api/',
    ...(base ? ['', `Sitemap: ${base}sitemap.xml`] : [])
  ].join('\n') + '\n';

  const today = new Date().toISOString().slice(0, 10);
  const sitemap = base ? `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${esc(base)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${esc(base)}llms.txt</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>
</urlset>
` : '';

  return { head, body, llms, robots, sitemap, title, description: desc };
}

// Replace the marked SEO blocks in index.html.
export function injectSeo(html, seo) {
  return html
    .replace(/<!-- seo:head -->[\s\S]*?<!-- \/seo:head -->/, `<!-- seo:head -->\n${seo.head}\n<!-- /seo:head -->`)
    .replace(/<!-- seo:body -->[\s\S]*?<!-- \/seo:body -->/, `<!-- seo:body -->\n${seo.body}\n<!-- /seo:body -->`);
}
