// Server-rendered public pages. Rendering on the server keeps the ad landing
// page fast on mobile data and gives search engines the full content.
const { db, getSettings } = require('./db');
const B = require('./booking');
const md = require('./markdown');

const e = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lines = (s) => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const upl = (f) => '/uploads/' + encodeURIComponent(f);
const waLink = (num, text) => `https://wa.me/${String(num).replace(/\D/g, '')}${text ? '?text=' + encodeURIComponent(text) : ''}`;
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

const ICONS = {
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  wave: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/></svg>',
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m-5-5 5 5 5-5M5 20h14"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 7v5l3 2"/></svg>',
  logo: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 20c3 0 3-2.6 6.5-2.6S13 20 16 20s3-2.6 6.5-2.6S26 20 29 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M8 13.5 24 9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M22.5 7.3 26 10.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
};
const TRUST_ICONS = [ICONS.shield, ICONS.wave, ICONS.sun, ICONS.camera];

function photosFor(placement) {
  return db.prepare('SELECT * FROM photos WHERE placement = ? AND visible = 1 ORDER BY sort, id').all(placement);
}

function ratingInfo(st) {
  const r = db.prepare("SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE status = 'live'").get();
  const text = st.rating_text || (r.n ? `★ ${r.avg.toFixed(1)} · ${r.n} review${r.n > 1 ? 's' : ''}` : '');
  return { text, count: r.n, avg: r.n ? Number(r.avg.toFixed(1)) : null };
}

// ---------- decorative SVG ----------

// Layered, endlessly moving waves. `fill` is the colour of the section below.
function waves(fill, { flip = false, cls = '' } = {}) {
  const id = 'w' + Math.random().toString(36).slice(2, 8);
  return `<div class="waves ${flip ? 'waves-flip' : ''} ${cls}" aria-hidden="true"><svg viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
<defs><path id="${id}" d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z"/></defs>
<g class="wave-par"><use href="#${id}" x="48" y="0" fill="${fill}" opacity=".25"/><use href="#${id}" x="48" y="3" fill="${fill}" opacity=".45"/><use href="#${id}" x="48" y="5" fill="${fill}" opacity=".7"/><use href="#${id}" x="48" y="7" fill="${fill}"/></g></svg></div>`;
}

const PALM = (x, y, s = 1, flip = 1) => `<g transform="translate(${x} ${y}) scale(${s * flip} ${s})" fill="#062433"><path d="M0 0c4-40 10-80 26-118l6 2C18-78 12-40 8 0z"/><path d="M30-118c-26-12-52-6-70 12 22-8 42-8 60 0zM30-118c-14-22-38-30-62-26 20 6 36 16 50 32zM30-118c10-24 34-36 60-34-20 8-36 20-48 38zM30-118c24-10 52-4 70 14-22-6-44-6-62 2zM30-118c4 24-6 46-24 60 8-20 12-40 10-58z"/></g>`;

// Illustrated, animated sea scene used until the owner uploads a hero photo/video.
function heroScene() {
  return `<svg class="hero-scene" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs>
  <linearGradient id="hsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#062a3a"/><stop offset=".45" stop-color="#1b6f86"/><stop offset=".72" stop-color="#f6a982"/><stop offset=".8" stop-color="#ffd79a"/></linearGradient>
  <linearGradient id="hsSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2aa6ad"/><stop offset=".35" stop-color="#0f6f86"/><stop offset="1" stop-color="#05293a"/></linearGradient>
  <radialGradient id="hsGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe2a6" stop-opacity=".9"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1440" height="900" fill="url(#hsSky)"/>
<circle class="sun-glow" cx="1030" cy="560" r="260" fill="url(#hsGlow)"/>
<circle cx="1030" cy="560" r="62" fill="#ffe1a0"/>
<g class="clouds" fill="#fff" opacity=".18"><ellipse cx="300" cy="230" rx="140" ry="18"/><ellipse cx="380" cy="215" rx="90" ry="14"/><ellipse cx="1180" cy="300" rx="160" ry="16"/></g>
<path d="M0 585c120-40 220-58 330-40 70 12 110 30 160 40H0z" fill="#0a3446"/>
<path d="M820 585c60-26 140-40 230-30 90 10 170 22 390 30z" fill="#0d3c4f"/>
${PALM(110, 560, .9)}${PALM(200, 566, .7, -1)}${PALM(1250, 580, .6)}
<rect y="585" width="1440" height="315" fill="url(#hsSea)"/>
<g class="glints" fill="#ffe7b8">${Array.from({ length: 14 }, (_, i) => `<rect x="${980 + (i % 5) * 22 - (i * 7) % 30}" y="${600 + i * 16}" width="${90 - i * 4}" height="3" rx="1.5" style="--d:${(i % 5) * .4}s"/>`).join('')}</g>
<g class="kayak-group">
  <g class="kayak k1" transform="translate(560 690)"><ellipse cx="0" cy="0" rx="74" ry="9" fill="#ff6b4a"/><ellipse cx="0" cy="-3" rx="60" ry="4" fill="#ff9b7f"/><circle cx="-12" cy="-30" r="9" fill="#062433"/><path d="M-20-22h16v18h-16z" fill="#ffc857"/><path class="paddle" d="M-62-44 38 6" stroke="#062433" stroke-width="4" stroke-linecap="round"/></g>
  <g class="kayak k2" transform="translate(840 742) scale(.75)"><ellipse cx="0" cy="0" rx="74" ry="9" fill="#ffc857"/><ellipse cx="0" cy="-3" rx="60" ry="4" fill="#ffe08f"/><circle cx="10" cy="-30" r="9" fill="#062433"/><path d="M2-22h16v18H2z" fill="#14b8b8"/><path class="paddle" d="M-40 8 60-42" stroke="#062433" stroke-width="4" stroke-linecap="round"/></g>
</g>
</svg>`;
}

// Fallback artwork for session cards without a photo, picked by session type.
function sessionScene(s, i) {
  const kind = /sun/i.test(s.slug + s.name) ? 'sunrise' : /glass|coral|reef/i.test(s.slug + s.name) ? 'reef' : /mangrove/i.test(s.slug + s.name) ? 'mangrove' : ['mangrove', 'sunrise', 'reef'][i % 3];
  if (kind === 'sunrise') return `<svg class="scene" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="ss${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2a5a"/><stop offset=".5" stop-color="#ff8a5c"/><stop offset=".62" stop-color="#ffd18a"/><stop offset=".62" stop-color="#ff9b6a"/><stop offset="1" stop-color="#0e4a63"/></linearGradient></defs><rect width="600" height="450" fill="url(#ss${i})"/><circle class="pulse-sun" cx="300" cy="280" r="58" fill="#ffe3a3"/><g class="glints" fill="#ffe3a3">${[0, 1, 2, 3, 4, 5].map(j => `<rect x="${250 - j * 6}" y="${295 + j * 18}" width="${100 + j * 12}" height="4" rx="2" style="--d:${j * .3}s"/>`).join('')}</g><g class="kayak k1" transform="translate(180 380)"><ellipse rx="60" ry="7" fill="#062433"/><circle cx="-6" cy="-24" r="7" fill="#062433"/><path class="paddle" d="M-50-36 30 6" stroke="#062433" stroke-width="3.5" stroke-linecap="round"/></g></svg>`;
  if (kind === 'reef') return `<svg class="scene" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sr${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fd4cc"/><stop offset="1" stop-color="#0a4a66"/></linearGradient></defs><rect width="600" height="450" fill="url(#sr${i})"/><g class="rays" fill="#fff" opacity=".12"><path d="M80 0h40L60 450H20z"/><path d="M260 0h30l-40 450h-40z"/><path d="M440 0h50l-20 450h-50z"/></g><g fill="#ff6b4a"><path d="M90 450c0-60 10-90 30-120-6 40 6 70 20 120z"/><circle cx="160" cy="420" r="30" fill="#ffc857"/><path d="M420 450c-10-70 10-110 40-140-10 50 0 90 10 140z" fill="#ff8fab"/><circle cx="500" cy="430" r="36" fill="#ff6b4a"/></g><g class="fish f1" fill="#ffc857"><path d="M0 0c16-12 36-12 50 0-14 12-34 12-50 0z"/><path d="M50 0l14-10v20z"/></g><g class="fish f2" fill="#fff"><path d="M0 0c12-9 28-9 38 0-10 9-26 9-38 0z"/><path d="M38 0l10-7v14z"/></g><g class="bubbles-svg" fill="none" stroke="#fff" stroke-opacity=".6"><circle cx="300" cy="300" r="6"/><circle cx="320" cy="250" r="4"/><circle cx="290" cy="200" r="3"/></g></svg>`;
  return `<svg class="scene" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sm${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe9d4"/><stop offset=".55" stop-color="#5fb39a"/><stop offset=".55" stop-color="#1f7a74"/><stop offset="1" stop-color="#0b3f47"/></linearGradient></defs><rect width="600" height="450" fill="url(#sm${i})"/><g fill="#174f3a"><ellipse cx="80" cy="200" rx="140" ry="90"/><ellipse cx="540" cy="190" rx="150" ry="100"/><ellipse cx="300" cy="150" rx="90" ry="60" opacity=".6"/></g><g stroke="#174f3a" stroke-width="6" fill="none" stroke-linecap="round"><path d="M30 250c10 20 0 40-10 60M60 250c0 30 20 40 10 70M110 255c-10 25 10 40 0 60M500 250c10 25-5 45-15 60M540 250c0 30 15 45 5 70M580 250c-10 25 5 40-5 60"/></g><g class="glints" fill="#d8fff2">${[0, 1, 2, 3].map(j => `<rect x="${200 + j * 40}" y="${280 + j * 30}" width="${80}" height="3" rx="1.5" style="--d:${j * .5}s"/>`).join('')}</g><g class="kayak k1" transform="translate(300 360)"><ellipse rx="70" ry="8" fill="#ff6b4a"/><circle cx="-8" cy="-26" r="8" fill="#062433"/><circle cx="20" cy="-24" r="7" fill="#062433"/><path class="paddle" d="M-60-40 40 6" stroke="#062433" stroke-width="3.5" stroke-linecap="round"/></g></svg>`;
}

// ---------- page chrome ----------

function layout({ title, description = '', body, st, bodyClass = '', extraHead = '', canonical = '', image = '', jsonLd = [], type = 'website' }) {
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
${canonical ? `<link rel="canonical" href="${e(canonical)}">` : ''}
<meta property="og:type" content="${type}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:site_name" content="${e(st.brand_name)}">
${canonical ? `<meta property="og:url" content="${e(canonical)}">` : ''}
${image ? `<meta property="og:image" content="${e(image)}"><meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="#062a3a">
<script>document.documentElement.classList.add('js')</script>
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${e(st.brand_name)} blog" href="/blog/rss.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/css/tokens.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/css/site.css">
${jsonLd.map(j => `<script type="application/ld+json">${json(j)}</script>`).join('\n')}
${extraHead}
${st.head_code || ''}
</head>
<body class="${bodyClass}">
${body}
<script src="/js/site.js" defer></script>
</body>
</html>`;
}

function header(st, { home = false } = {}) {
  const h = home ? '' : '/';
  return `<header class="site-nav ${home ? 'on-hero' : 'solid'}" id="siteNav">
  <a class="logo" href="/">${ICONS.logo}<span>${e(st.brand_name)}</span></a>
  <nav class="nav-links" id="navLinks" aria-label="Main">
    <a href="${h}#sessions">Sessions</a><a href="${h}#how">How it works</a><a href="${h}#reviews">Reviews</a><a href="/blog">Blog</a><a href="${h}#faq">FAQ</a><a href="/my-booking" class="nav-my">My booking</a>
  </nav>
  <div class="nav-actions">
    <a class="icon-btn" href="tel:${e(st.phone.replace(/\s/g, ''))}" aria-label="Call us">${ICONS.phone}</a>
    <button class="icon-btn menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="navLinks">${ICONS.menu}</button>
    ${home ? '<button class="btn btn-primary btn-sm nav-book" type="button" data-book>Book now</button>' : '<a class="btn btn-primary btn-sm nav-book" href="/?book=1">Book now</a>'}
  </div>
</header>`;
}

function footer(st) {
  return `<footer class="site-footer">
  ${waves('#04141f', { cls: 'waves-footer' })}
  <div class="container footer-inner">
    <div class="footer-brand"><a class="logo" href="/">${ICONS.logo}<span>${e(st.brand_name)}</span></a><p>${e(st.hero_overline)}</p><p class="small">${e(st.meeting_point)}</p></div>
    <div><h4>Explore</h4><a href="/my-booking">My booking</a><a href="/#sessions">Sessions</a><a href="/#gallery">Gallery</a><a href="/#reviews">Reviews</a><a href="/blog">Blog</a><a href="/#faq">FAQ</a></div>
    <div><h4>Contact</h4><a href="tel:${e(st.phone.replace(/\s/g, ''))}">${e(st.phone)}</a>${st.email ? `<a href="mailto:${e(st.email)}">${e(st.email)}</a>` : ''}<a href="${e(waLink(st.whatsapp))}" target="_blank" rel="noopener">WhatsApp</a><a href="/review">Leave a review</a></div>
  </div>
  <div class="container footer-base"><span>© ${new Date().getFullYear()} ${e(st.brand_name)}</span><a href="/admin/" rel="nofollow">Staff login</a></div>
</footer>`;
}

function sessionMedia(s, i) {
  const p = photosFor('session:' + s.id)[0];
  if (!p) return sessionScene(s, i);
  return p.kind === 'video'
    ? `<video src="${upl(p.file)}" autoplay muted loop playsinline preload="metadata" aria-label="${e(p.alt || s.name)}"></video>`
    : `<img src="${upl(p.file)}" alt="${e(p.alt || s.name)}" loading="lazy">`;
}

function publishedPosts(limit, offset = 0) {
  return db.prepare("SELECT * FROM posts WHERE status = 'published' AND published_at <= datetime('now') ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?").all(limit, offset);
}
function readMinutes(body) { return Math.max(1, Math.round(md.plainText(body).split(' ').length / 200)); }
function postDate(p) { return B.fmtDate(String(p.published_at || p.created_at).slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' }); }

function postCard(p, i = 0) {
  return `<a class="post-card reveal" href="/blog/${e(p.slug)}" style="--i:${i}">
    <div class="post-cover">${p.cover ? `<img src="${upl(p.cover)}" alt="" loading="lazy">` : `<div class="post-cover-art art-${i % 3}" aria-hidden="true">${ICONS.wave}</div>`}</div>
    <div class="post-body"><div class="post-meta">${e(postDate(p))} · ${readMinutes(p.body)} min read</div><h3>${e(p.title)}</h3><p>${e(p.excerpt)}</p><span class="read-more">Read article ${ICONS.arrow}</span></div>
  </a>`;
}

// ---------- landing ----------

function landing(base = '') {
  const st = getSettings();
  const sessions = B.getSessions({ activeOnly: true });
  const hero = photosFor('hero');
  const gallery = photosFor('gallery');
  const reviews = db.prepare("SELECT * FROM reviews WHERE status = 'live' ORDER BY featured DESC, created_at DESC LIMIT 12").all();
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort, id').all();
  const posts = publishedPosts(3);
  const rating = ratingInfo(st);
  const minPrice = sessions.length ? Math.min(...sessions.map(s => s.price)) : 0;
  const trust = lines(st.trust_points).map(l => l.split('|'));
  const departures = sessions.reduce((a, s) => a + s.slot_times.length, 0);
  const heroImg = hero.find(h => h.kind === 'image');
  const heroMedia = hero[0]
    ? (hero[0].kind === 'video'
      ? `<video class="hero-media" src="${upl(hero[0].file)}" autoplay muted loop playsinline preload="metadata" ${heroImg ? `poster="${upl(heroImg.file)}"` : ''}></video>`
      : `<img class="hero-media" src="${upl(hero[0].file)}" alt="${e(hero[0].alt || 'Kayaking at North Bay')}" fetchpriority="high">`)
    : heroScene();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(st.map_query)}&output=embed`;
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(st.map_query)}`;
  const words = String(st.hero_title).split(/\s+/).filter(Boolean);
  const bubbles = Array.from({ length: 16 }, (_, i) => `<span style="--x:${(i * 37) % 100}%;--s:${6 + (i * 7) % 16}px;--d:${7 + (i * 3) % 9}s;--delay:-${(i * 1.7) % 9}s"></span>`).join('');
  const stats = [
    rating.avg ? { n: rating.avg, dec: 1, suffix: '★', label: 'Guest rating' } : null,
    st.stat_guests ? { n: Number(st.stat_guests) || 0, suffix: '+', label: 'Happy paddlers' } : null,
    { n: sessions.length, label: sessions.length === 1 ? 'Way to paddle' : 'Ways to paddle' },
    { n: departures, label: 'Departures a day' },
    minPrice ? { n: minPrice, prefix: '₹', label: 'Starting price' } : null,
  ].filter(Boolean).slice(0, 4);

  const imageUrl = heroImg ? base + upl(heroImg.file) : '';
  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': ['LocalBusiness', 'TouristAttraction'], name: st.brand_name,
      description: st.hero_subtitle, url: base + '/', telephone: st.phone, ...(imageUrl ? { image: imageUrl } : {}),
      address: { '@type': 'PostalAddress', streetAddress: st.meeting_point, addressLocality: 'Port Blair', addressRegion: 'Andaman and Nicobar Islands', addressCountry: 'IN' },
      priceRange: minPrice ? `₹${minPrice}+` : undefined,
      ...(rating.count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.avg, reviewCount: rating.count } } : {}),
      makesOffer: sessions.map(s => ({ '@type': 'Offer', name: s.name, price: s.price, priceCurrency: 'INR', url: `${base}/#${s.slug}` })),
    },
    ...(faqs.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
  ];

  const body = `
${header(st, { home: true })}
<main>
<section class="hero" id="top">
  <div class="hero-bg parallax" data-speed=".35">${heroMedia}</div>
  <div class="hero-shade"></div>
  <div class="caustics" aria-hidden="true"></div>
  <div class="bubbles" aria-hidden="true">${bubbles}</div>
  <div class="hero-inner container">
    <div class="hero-copy">
      <div class="pill-overline">${ICONS.pin}${e(st.hero_overline)}</div>
      <h1 class="hero-title" aria-label="${e(st.hero_title)}">${words.map((w, i) => `<span class="w" aria-hidden="true" style="--i:${i}"><span>${e(w)}</span></span>`).join(' ')}</h1>
      <p class="lead">${e(st.hero_subtitle)}</p>
      <div class="hero-ctas">
        <button class="btn btn-primary btn-lg" type="button" data-book>Book your paddle ${ICONS.arrow}</button>
        <a class="btn btn-glass btn-lg" href="${e(waLink(st.whatsapp, 'Hi! I want to book kayaking at North Bay.'))}" target="_blank" rel="noopener">${ICONS.wa} Ask on WhatsApp</a>
      </div>
      <div class="chip-row hero-chips">
        ${rating.text ? `<span class="chip chip-glass">${e(rating.text)}</span>` : ''}
        <span class="chip chip-glass">Life jackets &amp; guide</span>
        <span class="chip chip-glass">No experience needed</span>
      </div>
    </div>
    <form class="widget" id="quickBook" autocomplete="off" novalidate>
      <div class="widget-head"><span class="live-dot"></span>Live availability</div>
      <h2 class="widget-title">Book in 60 seconds</h2>
      <label class="field-label" for="qbSession">Session</label>
      <select id="qbSession" class="input">${sessions.map(s => `<option value="${e(s.slug)}">${e(s.name)} · ${e(s.duration)}</option>`).join('')}</select>
      <div class="grid2">
        <div><label class="field-label" for="qbDate">Date</label><input id="qbDate" class="input" type="date"></div>
        <div><label class="field-label" for="qbGuests">Guests</label>
          <select id="qbGuests" class="input">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${n} adult${n > 1 ? 's' : ''}</option>`).join('')}</select></div>
      </div>
      <div class="field-label">Time slot</div>
      <div class="chip-row slot-chips" id="qbSlots" role="radiogroup" aria-label="Time slot"><span class="muted small">Pick a date to see times</span></div>
      <div class="widget-total"><span class="price" id="qbTotal">${minPrice ? 'From ' + B.inr(minPrice) : ''}</span><span class="muted small">Pay ${e(st.advance_percent)}% now</span></div>
      <button class="btn btn-primary btn-block btn-lg" type="submit">Reserve my slot</button>
    </form>
  </div>
  <a class="scroll-cue" href="#sessions" aria-label="Scroll to sessions"><span></span></a>
  ${waves('#fffaf2')}
</section>

<section class="marquee" aria-label="Why book with us"><div class="marquee-track">
  ${[0, 1].map(k => `<div class="marquee-group"${k ? ' aria-hidden="true"' : ''}>${trust.map(([t]) => `<span>${ICONS.wave}${e(t)}</span>`).join('')}${lines(st.included).map(t => `<span>${ICONS.check}${e(t)}</span>`).join('')}</div>`).join('')}
</div></section>

<section class="stats container" aria-label="At a glance">
  ${stats.map((s, i) => `<div class="stat reveal" style="--i:${i}"><b><span class="count" data-count="${s.n}" data-dec="${s.dec || 0}">${s.prefix || ''}${s.dec ? s.n.toFixed(s.dec) : s.n.toLocaleString('en-IN')}</span>${s.suffix ? `<i>${s.suffix}</i>` : ''}</b><span>${e(s.label)}</span></div>`).join('')}
</section>

<section class="section container" id="sessions">
  <div class="section-head reveal">
    <div class="overline">Choose your adventure</div>
    <h2>Pick your <em>paddle.</em></h2>
    <p class="muted">All guided, all beginner-friendly. Prices are per person.</p>
  </div>
  <div class="exp-list${sessions.length > 3 ? ' compact' : ''}" id="expList">
    ${sessions.map((s, i) => `<article class="exp" id="${e(s.slug)}">
      <div class="exp-media reveal reveal-zoom"><div class="exp-img parallax" data-speed=".08" data-max=".1">${sessionMedia(s, i)}</div>
        ${s.badge ? `<span class="badge">${e(s.badge)}</span>` : ''}<span class="exp-num">0${i + 1}</span></div>
      <div class="exp-body reveal" style="--i:1">
        <div class="overline">${e(s.duration)} · ${e(s.tagline)}</div>
        <h3>${e(s.name)}</h3>
        <p>${e(s.description)}</p>
        <div class="exp-meta"><span>${ICONS.clock}${s.slot_times.map(B.fmtTime).join(' · ')}</span><span>${ICONS.shield}Ages ${s.min_age}+</span>${s.sees_coral ? `<span>${ICONS.camera}See coral</span>` : ''}</div>
        <div class="exp-foot"><div><span class="price">${B.inr(s.price)}</span> <span class="muted small">/ person</span></div>
          <button class="btn btn-primary" type="button" data-book="${e(s.slug)}">Book ${e(s.name.split(' ')[0])} ${ICONS.arrow}</button></div>
      </div>
    </article>`).join('')}
  </div>
  ${sessions.length > 3 ? `<div class="exp-swipe" aria-hidden="true">← Swipe to see all ${sessions.length} sessions →</div>` : ''}
  ${sessions.length > 1 ? `<div class="compare reveal" role="region" aria-label="Compare sessions" tabindex="0">
    <table>
      <thead><tr><th></th>${sessions.map(s => `<th>${e(s.name)}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><td>Duration</td>${sessions.map(s => `<td>${e(s.duration)}</td>`).join('')}</tr>
        <tr><td>Start times</td>${sessions.map(s => `<td>${s.slot_times.map(B.fmtTime).join(', ')}</td>`).join('')}</tr>
        <tr><td>See coral</td>${sessions.map(s => `<td>${s.sees_coral ? '<span class="yes">✓</span>' : '—'}</td>`).join('')}</tr>
        <tr><td>Min. age</td>${sessions.map(s => `<td>${s.min_age}+</td>`).join('')}</tr>
        <tr><td>Price</td>${sessions.map(s => `<td><b>${B.inr(s.price)}</b></td>`).join('')}</tr>
      </tbody>
    </table>
  </div>` : ''}
</section>

<section class="deep" id="how">
  ${waves('#062a3a', { flip: true })}
  <div class="light-rays" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="container deep-inner">
    <div class="section-head reveal on-dark">
      <div class="overline">How it works</div>
      <h2>Three steps to <em>the water.</em></h2>
    </div>
    <ol class="steps-flow">${lines(st.how_it_works).map((l, i) => `<li class="reveal" style="--i:${i}"><span class="step-n">${i + 1}</span><span class="step-t">${e(l)}</span></li>`).join('')}</ol>
    <div class="trust-grid">
      ${trust.map(([t, d], i) => `<div class="trust-item reveal" style="--i:${i}"><span class="trust-ic">${TRUST_ICONS[i % TRUST_ICONS.length]}</span><b>${e(t)}</b>${d ? `<span>${e(d)}</span>` : ''}</div>`).join('')}
    </div>
    <div class="included reveal"><span class="overline">Included</span>${lines(st.included).map(l => `<span class="chip chip-glass">${ICONS.check}${e(l)}</span>`).join('')}</div>
  </div>
  ${waves('#fffaf2')}
</section>

${gallery.length ? `<section class="section container" id="gallery">
  <div class="section-head reveal"><div class="overline">Gallery</div><h2>What you'll <em>see.</em></h2></div>
  <div class="mosaic">${gallery.map((p, i) => p.kind === 'video'
    ? `<div class="tile reveal reveal-zoom" style="--i:${i % 4}"><video src="${upl(p.file)}" muted loop playsinline autoplay preload="metadata" aria-label="${e(p.alt)}"></video></div>`
    : `<button type="button" class="tile gallery-item reveal reveal-zoom" style="--i:${i % 4}" data-full="${upl(p.file)}" aria-label="Open photo: ${e(p.alt || 'gallery ' + (i + 1))}"><img src="${upl(p.file)}" alt="${e(p.alt)}" loading="lazy"></button>`).join('')}</div>
</section>` : ''}

${reviews.length ? `<section class="section reviews-band" id="reviews">
  <div class="container">
    <div class="section-head row-between reveal"><div><div class="overline">Reviews</div><h2>Guests say it <em>best.</em></h2></div>${rating.text ? `<span class="rating-big">${e(rating.text)}</span>` : ''}</div>
    <div class="review-scroll" id="reviewScroll">${reviews.map((r, i) => `<figure class="review reveal" style="--i:${i % 4}">
      <div class="stars" aria-label="${r.rating} out of 5">${stars(r.rating)}</div>
      <blockquote>“${e(r.text)}”</blockquote>
      <figcaption>${r.photo ? `<img src="${upl(r.photo)}" alt="" loading="lazy">` : `<span class="avatar">${e(r.name.trim()[0] || '?')}</span>`}<span><b>${e(r.name)}</b>${r.city ? `, ${e(r.city)}` : ''}<br><span class="muted small">${e(r.source)}</span></span></figcaption>
    </figure>`).join('')}</div>
    <div class="row-between"><a class="link-arrow" href="/review">Been kayaking with us? Leave a review ${ICONS.arrow}</a>
      <div class="scroll-btns"><button type="button" class="icon-btn" data-scroll="-1" aria-label="Previous reviews">‹</button><button type="button" class="icon-btn" data-scroll="1" aria-label="Next reviews">›</button></div></div>
  </div>
</section>` : ''}

${posts.length ? `<section class="section container" id="blog">
  <div class="section-head row-between reveal"><div><div class="overline">From the blog</div><h2>Plan your <em>trip.</em></h2></div><a class="link-arrow" href="/blog">All articles ${ICONS.arrow}</a></div>
  <div class="post-grid">${posts.map(postCard).join('')}</div>
</section>` : ''}

<section class="section section-sunken" id="meet">
  <div class="container two-col">
    <div class="reveal">
      <div class="overline">Meeting point</div>
      <h2>Where we <em>meet.</em></h2>
      <p class="meet-line">${ICONS.pin}<span>${e(st.meeting_point)}</span></p>
      <p class="muted">Your report time is on your booking confirmation, usually 30–45 minutes before your slot.</p>
      <a class="btn btn-secondary" href="${e(dirUrl)}" target="_blank" rel="noopener">Get directions ${ICONS.arrow}</a>
    </div>
    <div class="map reveal reveal-zoom"><iframe title="Map to meeting point" src="${e(mapSrc)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
  </div>
</section>

${faqs.length ? `<section class="section container narrow" id="faq">
  <div class="section-head reveal"><div class="overline">FAQ</div><h2>Good <em>questions.</em></h2></div>
  <div class="faq">${faqs.map((f, i) => `<details class="reveal" style="--i:${i % 4}"><summary>${e(f.q)}</summary><div class="faq-a"><p>${e(f.a)}</p></div></details>`).join('')}</div>
</section>` : ''}

<section class="cta-band">
  ${waves('#062a3a', { flip: true })}
  <div class="caustics" aria-hidden="true"></div>
  <div class="container cta-inner reveal">
    <h2>Ready to get on <em>the water?</em></h2>
    <p>${e(st.policy_text)}</p>
    <div class="cta-actions">
      <button class="btn btn-primary btn-lg" type="button" data-book>Check dates &amp; book ${ICONS.arrow}</button>
      <a class="btn btn-glass btn-lg" href="${e(waLink(st.whatsapp, 'Hi! I have a question about kayaking at North Bay.'))}" target="_blank" rel="noopener">${ICONS.wa} Ask on WhatsApp</a>
    </div>
  </div>
</section>
</main>
${footer(st)}

<div class="sticky-bar" id="stickyBar" aria-hidden="true">
  <div class="sticky-price"><span class="muted small">From</span><span class="price">${B.inr(minPrice)}</span></div>
  <a class="icon-btn wa-btn" href="${e(waLink(st.whatsapp, 'Hi! I want to book kayaking at North Bay.'))}" target="_blank" rel="noopener" aria-label="WhatsApp us" tabindex="-1">${ICONS.wa}</a>
  <button class="btn btn-primary" type="button" data-book tabindex="-1">Book now</button>
</div>
<a class="wa-float" href="${e(waLink(st.whatsapp, 'Hi! I want to book kayaking at North Bay.'))}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${ICONS.wa}</a>

<div class="lightbox" id="lightbox" hidden><button type="button" class="lightbox-close" aria-label="Close">✕</button><img alt=""></div>
<div id="sheetRoot"></div>
<script src="/js/book.js" defer></script>`;

  return layout({
    title: `${st.brand_name} · Kayaking in North Bay, Andaman`,
    description: st.hero_subtitle,
    body, st, bodyClass: 'page-landing', canonical: base ? base + '/' : '', image: imageUrl, jsonLd,
    extraHead: heroImg && hero[0].kind === 'image' ? `<link rel="preload" as="image" href="${upl(heroImg.file)}">` : '',
  });
}

// ---------- blog ----------

const PAGE_SIZE = 9;

function pageHero(st, { overline, title, sub, cover }) {
  return `<section class="page-hero">
  ${cover ? `<div class="page-hero-bg parallax" data-speed=".25"><img src="${upl(cover)}" alt="" fetchpriority="high"></div>` : `<div class="page-hero-bg">${heroScene()}</div>`}
  <div class="hero-shade"></div><div class="caustics" aria-hidden="true"></div>
  <div class="container page-hero-inner">
    <div class="pill-overline">${overline}</div>
    <h1>${title}</h1>
    ${sub ? `<p class="lead">${sub}</p>` : ''}
  </div>
  ${waves('#fffaf2')}
</section>`;
}

function blogIndex(base, page = 1) {
  const st = getSettings();
  const total = db.prepare("SELECT COUNT(*) AS n FROM posts WHERE status = 'published' AND published_at <= datetime('now')").get().n;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  page = Math.min(Math.max(1, page), pages);
  const posts = publishedPosts(PAGE_SIZE, (page - 1) * PAGE_SIZE);
  const url = `${base}/blog${page > 1 ? '?page=' + page : ''}`;
  const body = `
${header(st)}
<main>
${pageHero(st, { overline: `${ICONS.wave}The ${e(st.brand_name)} blog`, title: 'Stories &amp; tips from <em>the water</em>', sub: 'Guides for kayaking in the Andamans: when to go, how to get to North Bay, what to bring and more.' })}
<section class="section container">
  ${posts.length ? `<div class="post-grid">${posts.map(postCard).join('')}</div>` : '<p class="muted center">No articles yet. Check back soon!</p>'}
  ${pages > 1 ? `<nav class="pager" aria-label="Pages">${page > 1 ? `<a class="btn btn-secondary" href="/blog${page > 2 ? '?page=' + (page - 1) : ''}" rel="prev">← Newer</a>` : '<span></span>'}<span class="muted">Page ${page} of ${pages}</span>${page < pages ? `<a class="btn btn-secondary" href="/blog?page=${page + 1}" rel="next">Older →</a>` : '<span></span>'}</nav>` : ''}
</section>
${bookBand(st)}
</main>
${footer(st)}`;
  return layout({
    title: `Blog · ${st.brand_name}`, description: `Kayaking guides and travel tips for North Bay Island and the Andamans from ${st.brand_name}.`,
    body, st, bodyClass: 'page-blog', canonical: url,
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'Blog', name: `${st.brand_name} blog`, url: `${base}/blog` }],
  });
}

function bookBand(st) {
  return `<section class="book-band container reveal"><div><div class="overline on-dark">North Bay · Andaman</div><h2>Ready to paddle?</h2><p>${e(st.policy_text)}</p></div><a class="btn btn-primary btn-lg" href="/?book=1">Check dates &amp; book ${ICONS.arrow}</a></section>`;
}

function blogPost(base, post, { preview = false } = {}) {
  const st = getSettings();
  const { html, toc } = md.render(post.body);
  const url = `${base}/blog/${post.slug}`;
  const related = db.prepare("SELECT * FROM posts WHERE status = 'published' AND published_at <= datetime('now') AND id != ? ORDER BY published_at DESC LIMIT 3").all(post.id || 0);
  const description = post.meta_description || post.excerpt || md.plainText(post.body).slice(0, 155);
  const image = post.cover ? base + upl(post.cover) : '';
  const tags = String(post.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const body = `
${preview ? '<div class="preview-banner">Preview: this article is not published yet.</div>' : ''}
${header(st)}
<main>
${pageHero(st, { overline: `<a href="/blog">Blog</a> · ${e(postDate(post))} · ${readMinutes(post.body)} min read`, title: e(post.title), sub: e(post.excerpt), cover: post.cover })}
<div class="container article-wrap">
  <article class="article">
    ${toc.length > 2 ? `<nav class="toc" aria-label="In this article"><b>In this article</b>${toc.map(t => `<a href="#${t.id}">${e(t.text)}</a>`).join('')}</nav>` : ''}
    <div class="prose">${html}</div>
    ${tags.length ? `<div class="chip-row tags">${tags.map(t => `<span class="chip">#${e(t)}</span>`).join('')}</div>` : ''}
    <div class="share"><span>Share:</span><a href="https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}" target="_blank" rel="noopener">${ICONS.wa} WhatsApp</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a><a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}" target="_blank" rel="noopener">X</a></div>
  </article>
  <aside class="article-side">
    <div class="side-card"><div class="overline">Book a paddle</div><h3>Kayak North Bay</h3><p class="muted small">Guided trips for beginners. ${e(st.policy_text)}</p><a class="btn btn-primary btn-block" href="/?book=1">Check dates ${ICONS.arrow}</a><a class="btn btn-secondary btn-block" href="${e(waLink(st.whatsapp, 'Hi! I read your blog and have a question.'))}" target="_blank" rel="noopener">${ICONS.wa} WhatsApp us</a></div>
  </aside>
</div>
${related.length ? `<section class="section container"><div class="section-head reveal"><div class="overline">Keep reading</div><h2>More <em>articles.</em></h2></div><div class="post-grid">${related.map(postCard).join('')}</div></section>` : ''}
${bookBand(st)}
</main>
${footer(st)}`;
  return layout({
    title: `${post.meta_title || post.title} · ${st.brand_name}`, description, body, st, bodyClass: 'page-post', canonical: url, image, type: 'article',
    extraHead: preview ? '<meta name="robots" content="noindex">' : '',
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description, ...(image ? { image } : {}),
        datePublished: post.published_at || post.created_at, dateModified: post.updated_at, mainEntityOfPage: url,
        author: { '@type': 'Organization', name: st.brand_name }, publisher: { '@type': 'Organization', name: st.brand_name } },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: base + '/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: base + '/blog' },
        { '@type': 'ListItem', position: 3, name: post.title, item: url }] },
    ],
  });
}

function sitemap(base) {
  const posts = db.prepare("SELECT slug, updated_at FROM posts WHERE status = 'published' AND published_at <= datetime('now') ORDER BY published_at DESC").all();
  const urls = [{ loc: base + '/', pri: '1.0' }, { loc: base + '/blog', pri: '0.7' },
    ...posts.map(p => ({ loc: `${base}/blog/${p.slug}`, mod: p.updated_at.slice(0, 10), pri: '0.6' }))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${e(u.loc)}</loc>${u.mod ? `<lastmod>${u.mod}</lastmod>` : ''}<priority>${u.pri}</priority></url>`).join('\n')}\n</urlset>\n`;
}

function rss(base) {
  const st = getSettings();
  const posts = publishedPosts(20);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${e(st.brand_name)} blog</title><link>${e(base)}/blog</link><description>${e(st.hero_subtitle)}</description>\n${posts.map(p => `<item><title>${e(p.title)}</title><link>${e(base)}/blog/${e(p.slug)}</link><guid>${e(base)}/blog/${e(p.slug)}</guid><pubDate>${new Date(p.published_at.replace(' ', 'T') + 'Z').toUTCString()}</pubDate><description>${e(p.excerpt)}</description></item>`).join('\n')}\n</channel></rss>\n`;
}

// ---------- booking confirmation, review form, calendar file ----------

function reportTime(b, session) {
  const m = B.toMinutes(b.time) - (session?.report_minutes ?? 45);
  const t = `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;
  return B.fmtTime(t);
}

function confirmation(b, { qr = '' } = {}) {
  const st = getSettings();
  const s = B.getSession(b.session_id);
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(st.map_query)}&output=embed`;
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(st.map_query)}`;
  const ok = b.status === 'confirmed';
  const past = ok && b.date < B.todayIST();
  const waText = `Hi! My booking ID is ${b.code} (${b.session_name}, ${b.date_label} ${b.time_label}).`;
  const conv = { code: b.code, value: b.paid, total: b.total, currency: 'INR', session: b.session_name };
  // One clear status line for the guest.
  const status = b.status === 'cancelled' ? { cls: 'st-cancel', text: b.refunded ? `Cancelled · ${B.inr(b.refunded)} refunded` : 'Cancelled' }
    : b.status === 'pending' ? { cls: 'st-pending', text: 'Payment pending' }
    : b.checked_in ? { cls: 'st-in', text: 'Checked in · enjoy your paddle!' }
    : past ? { cls: 'st-done', text: 'Trip completed' }
    : b.balance > 0 ? { cls: 'st-ok', text: `Confirmed · ${B.inr(b.balance)} due at the jetty` }
    : { cls: 'st-ok', text: 'Confirmed · fully paid' };
  const title = b.status === 'cancelled' ? 'Booking cancelled' : b.status === 'pending' ? 'Payment pending' : past ? 'Thanks for paddling!' : b.checked_in ? "You're checked in!" : "You're booked!";
  const body = `
${header(st)}
<main>
<section class="confirm-top">
  ${ok && !past ? '<div class="confetti" hidden aria-hidden="true">' + Array.from({ length: 24 }, (_, i) => `<i style="--x:${(i * 41) % 100}%;--d:${(i % 6) * .15}s;--c:${['#ff6b4a', '#ffc857', '#2fd4cc', '#fff'][i % 4]}"></i>`).join('') + '</div>' : ''}
  <div class="container narrow confirm-hero">
    <div class="tick ${ok ? '' : 'tick-pending'}">${ok ? ICONS.check : b.status === 'cancelled' ? '✕' : '…'}</div>
    <h1>${title}</h1>
    <p>${ok && !past ? 'This page is your ticket. Download it, or open it any time from <b>My booking</b>.' : b.status === 'pending' ? 'We have not received your payment yet. If money was debited, message us on WhatsApp.' : past ? 'We hope you loved it. A quick review helps other travellers find us.' : ''}</p>
    ${b.status !== 'pending' ? `<a class="btn btn-glass hero-dl" href="/booking/${e(b.code)}/ticket.pdf?t=${e(b.token)}" download>${ICONS.download} Download ticket (PDF)</a>` : ''}
  </div>
  ${waves('#fffaf2')}
</section>
<div class="confirm container narrow">
  <article class="ticket ${b.status === 'cancelled' ? 'is-cancelled' : ''}" id="ticket" aria-label="Booking ticket">
    <div class="ticket-main">
      <div class="ticket-brand">${ICONS.logo}<span>${e(st.brand_name)}</span></div>
      <div class="overline">${e(b.session_name)}</div>
      <h2>${e(B.fmtDate(b.date, { weekday: 'long', day: 'numeric', month: 'long' }))}<br><span>${e(b.time_label)}</span></h2>
      <div class="ticket-status ${status.cls}">${e(status.text)}</div>
      <dl class="ticket-grid">
        <div><dt>Booking ID</dt><dd>${e(b.code)}</dd></div>
        <div><dt>Report by</dt><dd>${e(reportTime(b, s))}</dd></div>
        <div><dt>Guest</dt><dd>${e(b.name)}</dd></div>
        <div><dt>Guests</dt><dd>${b.adults} adult${b.adults !== 1 ? 's' : ''}${b.kids ? ` + ${b.kids} kid${b.kids > 1 ? 's' : ''}` : ''}</dd></div>
        <div><dt>Kayak</dt><dd>${b.kayak === 'single' ? 'Single' : 'Double'}</dd></div>
        <div><dt>Paid</dt><dd>${B.inr(b.paid)} of ${B.inr(b.total)}</dd></div>
        ${b.addons.length ? `<div class="wide"><dt>Add-ons</dt><dd>${e(b.addons.join(', '))}${b.hotel ? ` (pickup: ${e(b.hotel)})` : ''}</dd></div>` : ''}
        <div class="wide"><dt>Meeting point</dt><dd>${e(st.meeting_point)}</dd></div>
      </dl>
    </div>
    <div class="ticket-stub">
      ${qr ? `<div class="qr" role="img" aria-label="QR code for booking ${e(b.code)}">${qr}</div>` : ''}
      <b>${e(b.code)}</b>
      <span>Show this at the jetty</span>
      ${b.balance > 0 && ok ? `<span class="due">Due: ${B.inr(b.balance)}</span>` : ''}
    </div>
  </article>

  <div class="ticket-actions no-print">
    <a class="btn btn-primary" href="/booking/${e(b.code)}/ticket.pdf?t=${e(b.token)}" download>${ICONS.download} Download PDF</a>
    <button class="btn btn-secondary" type="button" onclick="window.print()">Print</button>
    <a class="btn btn-secondary" href="/booking/${e(b.code)}/calendar.ics?t=${e(b.token)}">Add to calendar</a>
    <a class="btn btn-secondary" href="${e(dirUrl)}" target="_blank" rel="noopener">Get directions</a>
    <button class="btn btn-secondary" type="button" id="copyLink">Copy ticket link</button>
  </div>

  <div class="no-print">
    ${past ? `<a class="btn btn-primary btn-block btn-lg" style="margin-top:20px" href="/review?b=${e(b.code)}&t=${e(b.token)}">★ Leave a review</a>` : ''}
    <div class="card confirm-card" style="margin-top:24px">
      <p class="meet-line">${ICONS.pin}<span>Meet at: ${e(st.meeting_point)}</span></p>
      <div class="map"><iframe title="Map to meeting point" src="${e(mapSrc)}" loading="lazy"></iframe></div>
    </div>
    <div class="overline" style="margin-top:28px">Bring</div>
    <div class="chip-row">${lines(st.bring_list).map(l => `<span class="chip">${ICONS.check}${e(l)}</span>`).join('')}</div>
    <a class="btn btn-primary btn-block btn-lg" style="margin-top:20px" href="${e(waLink(st.whatsapp, waText))}" target="_blank" rel="noopener">${ICONS.wa} Need to change something? WhatsApp us</a>
    <p class="muted small center" style="margin-top:16px">${e(st.policy_text)}</p>
  </div>
</div>
</main>
${footer(st)}
${ok ? `<script>
(function(){
  var c = ${json(conv)};
  var key = 'conv_' + c.code;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (_) {}
  var cf = document.querySelector('.confetti'); if (cf) cf.hidden = false;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'booking_confirmed', booking_id: c.code, value: c.total, currency: c.currency, session: c.session });
  if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', { value: c.total, currency: c.currency });
  window.__conversion = c;
})();
</script>
${st.conversion_code || ''}` : ''}
<script>
document.getElementById('copyLink').addEventListener('click', function () {
  var b = this, u = location.href;
  (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { b.textContent = 'Link copied ✓'; }, function () { prompt('Copy your ticket link:', u); });
});
</script>`;
  return layout({ title: `Booking ${b.code} · ${st.brand_name}`, body, st, bodyClass: 'page-confirm', extraHead: '<meta name="robots" content="noindex">' });
}

function reviewPage(b) {
  const st = getSettings();
  const body = `
${header(st)}
<main>
${pageHero(st, { overline: `${ICONS.wave}Your trip`, title: 'How was your <em>paddle?</em>', sub: 'Your review helps other travellers find us. It appears on the site after a quick check.' })}
<div class="container narrow review-page">
  <form class="card form-card" id="reviewForm" enctype="multipart/form-data">
    ${b ? `<input type="hidden" name="booking" value="${e(b.code)}"><input type="hidden" name="t" value="${e(b.token)}">` : ''}
    <div class="grid2">
      <div><label class="field-label" for="rvName">Your name</label><input class="input" id="rvName" name="name" required maxlength="60" value="${e(b ? b.name.split(' ')[0] : '')}"></div>
      <div><label class="field-label" for="rvCity">City</label><input class="input" id="rvCity" name="city" maxlength="60"></div>
    </div>
    <fieldset class="rating-input"><legend class="field-label">Rating</legend>
      ${[5, 4, 3, 2, 1].map(n => `<input type="radio" id="rv${n}" name="rating" value="${n}" ${n === 5 ? 'checked' : ''}><label for="rv${n}" title="${n} stars">★</label>`).join('')}
    </fieldset>
    <label class="field-label" for="rvText">Your review</label>
    <textarea class="input" id="rvText" name="text" rows="5" required maxlength="1200" placeholder="What did you love? Any tips for others?"></textarea>
    <label class="field-label" for="rvPhoto">Add a photo (optional)</label>
    <input class="input" id="rvPhoto" name="photo" type="file" accept="image/*">
    <button class="btn btn-primary btn-block btn-lg" type="submit">Submit review</button>
    <p class="form-msg" role="status"></p>
  </form>
</div>
</main>
${footer(st)}
<script src="/js/review.js" defer></script>`;
  return layout({ title: `Leave a review · ${st.brand_name}`, body, st, bodyClass: 'page-review', extraHead: '<meta name="robots" content="noindex">' });
}

function myBookingPage() {
  const st = getSettings();
  const body = `
${header(st)}
<main>
${pageHero(st, { overline: `${ICONS.wave}Already booked?`, title: 'Find my <em>booking</em>', sub: 'See your ticket, report time and meeting point. Use the booking ID from your confirmation (e.g. NB-1042) and the WhatsApp number you booked with.' })}
<div class="container narrow review-page">
  <form class="card form-card" id="findForm" autocomplete="on">
    <label class="field-label" for="fbCode">Booking ID</label>
    <input class="input" id="fbCode" name="code" required placeholder="NB-1042" autocapitalize="characters" style="text-transform:uppercase">
    <label class="field-label" for="fbPhone">WhatsApp number</label>
    <input class="input" id="fbPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="+91 98XXX XXXXX">
    <button class="btn btn-primary btn-block btn-lg" type="submit">Show my ticket</button>
    <p class="form-msg" role="status"></p>
  </form>
  <p class="muted small center" style="margin-top:18px">Can't find your booking ID? <a href="${e(waLink(st.whatsapp, 'Hi! I need help finding my booking.'))}" target="_blank" rel="noopener">Message us on WhatsApp</a> and we'll send your ticket link.</p>
</div>
</main>
${footer(st)}
<script>
(function () {
  var f = document.getElementById('findForm'), msg = f.querySelector('.form-msg');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = f.querySelector('button'); btn.disabled = true; msg.className = 'form-msg'; msg.textContent = 'Looking up…';
    fetch('/api/find-booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: f.code.value, phone: f.phone.value }) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Not found'); return d; }); })
      .then(function (d) { location.href = d.url; })
      .catch(function (err) { btn.disabled = false; msg.className = 'form-msg err'; msg.textContent = err.message; });
  });
})();
</script>`;
  return layout({ title: `My booking · ${st.brand_name}`, description: 'Find your kayak booking ticket.', body, st, bodyClass: 'page-review', extraHead: '<meta name="robots" content="noindex">' });
}

function ics(b) {
  const st = getSettings();
  const s = B.getSession(b.session_id);
  const dur = parseFloat(s?.duration) || 2;
  const start = new Date(`${b.date}T${b.time}:00+05:30`);
  const end = new Date(start.getTime() + dur * 3600e3);
  const f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (x) => String(x).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NorthBayKayak//EN', 'BEGIN:VEVENT',
    `UID:${b.code}@northbay-kayak`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${esc(`${s?.name || 'Kayaking'} · ${st.brand_name}`)}`,
    `LOCATION:${esc(st.meeting_point)}`,
    `DESCRIPTION:${esc(`Booking ${b.code}. Report by ${reportTime(b, s)}. Balance at jetty: ${B.inr(b.balance)}.`)}`,
    'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}

module.exports = { reportTime, landing, blogIndex, blogPost, sitemap, rss, confirmation, reviewPage, myBookingPage, ics, e, waLink };
