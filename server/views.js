// Server-rendered public pages. Rendering on the server keeps the ad
// landing page fast on mobile data: content arrives in the first response.
const { db, getSettings } = require('./db');
const B = require('./booking');

const e = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lines = (s) => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const upl = (f) => '/uploads/' + encodeURIComponent(f);
const waLink = (num, text) => `https://wa.me/${String(num).replace(/\D/g, '')}${text ? '?text=' + encodeURIComponent(text) : ''}`;
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

const ICONS = {
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  wave: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/></svg>',
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>',
};
const TRUST_ICONS = [ICONS.shield, ICONS.wave, ICONS.sun, ICONS.camera];

function photosFor(placement) {
  return db.prepare('SELECT * FROM photos WHERE placement = ? AND visible = 1 ORDER BY sort, id').all(placement);
}

function ratingSummary(st) {
  const r = db.prepare("SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE status = 'live'").get();
  if (st.rating_text) return st.rating_text;
  if (!r.n) return '';
  return `★ ${r.avg.toFixed(1)} · ${r.n} review${r.n > 1 ? 's' : ''}`;
}

function layout({ title, description = '', body, st, bodyClass = '', extraHead = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta name="theme-color" content="#1A1715">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/css/tokens.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Mulish:wght@400;600;700;800&display=swap">
<link rel="stylesheet" href="/css/site.css">
${extraHead}
${st.head_code || ''}
</head>
<body class="${bodyClass}">
${body}
</body>
</html>`;
}

function header(st, { minimal = false } = {}) {
  return `<header class="site-nav">
  <a class="logo" href="/">${e(st.brand_name)}</a>
  ${minimal ? '' : `<nav class="nav-links" id="navLinks">
    <a href="#sessions">Sessions</a><a href="#gallery">Gallery</a><a href="#reviews">Reviews</a><a href="#meet">Meeting point</a><a href="#faq">FAQ</a>
  </nav>`}
  <div class="nav-actions">
    <a class="icon-btn" href="tel:${e(st.phone.replace(/\s/g, ''))}" aria-label="Call us">${ICONS.phone}</a>
    ${minimal ? '' : `<button class="icon-btn menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="navLinks">${ICONS.menu}</button>
    <button class="btn btn-primary btn-sm nav-book" type="button" data-book>Book now</button>`}
  </div>
</header>`;
}

function sessionArt(s) {
  const p = photosFor('session:' + s.id)[0];
  return p ? `<img src="${upl(p.file)}" alt="${e(p.alt || s.name)}" loading="lazy">` : `<div class="art art-${s.id % 3}" aria-hidden="true">${ICONS.wave}</div>`;
}

function landing() {
  const st = getSettings();
  const sessions = B.getSessions({ activeOnly: true });
  const hero = photosFor('hero');
  const gallery = photosFor('gallery');
  const reviews = db.prepare("SELECT * FROM reviews WHERE status = 'live' ORDER BY featured DESC, created_at DESC LIMIT 12").all();
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort, id').all();
  const rating = ratingSummary(st);
  const minPrice = sessions.length ? Math.min(...sessions.map(s => s.price)) : 0;
  const trust = lines(st.trust_points).map(l => l.split('|'));
  const heroMedia = hero[0]
    ? (hero[0].kind === 'video'
      ? `<video class="hero-media" src="${upl(hero[0].file)}" autoplay muted loop playsinline preload="metadata" ${hero[1] && hero[1].kind === 'image' ? `poster="${upl(hero[1].file)}"` : ''}></video>`
      : `<img class="hero-media" src="${upl(hero[0].file)}" alt="${e(hero[0].alt || 'Kayaking at North Bay')}" fetchpriority="high">`)
    : '<div class="hero-media hero-fallback" aria-hidden="true"></div>';
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(st.map_query)}&output=embed`;
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(st.map_query)}`;
  const coralSessions = sessions;

  const body = `
${header(st)}
<main>
<section class="hero">
  ${heroMedia}
  <div class="hero-shade"></div>
  <div class="hero-inner container">
    <div class="hero-copy">
      <div class="overline on-dark">${e(st.hero_overline)}</div>
      <h1>${e(st.hero_title)}</h1>
      <p class="lead">${e(st.hero_subtitle)}</p>
      <div class="chip-row">
        ${rating ? `<span class="chip chip-glass">${e(rating)}</span>` : ''}
        <span class="chip chip-glass">Life jackets &amp; guide</span>
        <span class="chip chip-glass">Beginner friendly</span>
      </div>
    </div>
    <form class="widget card" id="quickBook" autocomplete="off" novalidate>
      <h2 class="widget-title">Kayak North Bay — book in 60 seconds</h2>
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
      <button class="btn btn-primary btn-block" type="submit">Reserve my slot</button>
    </form>
  </div>
</section>

<section class="trust container" aria-label="Why book with us">
  ${trust.map(([t, d], i) => `<div class="trust-item"><span class="trust-ic">${TRUST_ICONS[i % TRUST_ICONS.length]}</span><div><b>${e(t)}</b>${d ? `<span>${e(d)}</span>` : ''}</div></div>`).join('')}
</section>

<section class="section container" id="sessions">
  <div class="overline">Choose a session</div>
  <h2>Pick your paddle.</h2>
  <p class="muted">All guided, all beginner-friendly. Prices are per person.</p>
  <div class="session-grid">
    ${sessions.map(s => `<article class="session-card card" id="${e(s.slug)}">
      <div class="session-art">${sessionArt(s)}${s.badge ? `<span class="badge">${e(s.badge)}</span>` : ''}</div>
      <div class="session-body">
        <h3>${e(s.name)}</h3>
        <div class="muted small">${e(s.duration)} · ${e(s.tagline)}</div>
        <p class="small">${e(s.description)}</p>
        <div class="session-foot">
          <div><span class="price">${B.inr(s.price)}</span> <span class="muted small">/ person</span></div>
          <button class="btn btn-primary btn-sm" type="button" data-book="${e(s.slug)}">Book</button>
        </div>
      </div>
    </article>`).join('')}
  </div>
  ${coralSessions.length > 1 ? `<div class="compare card" role="region" aria-label="Compare sessions" tabindex="0">
    <table>
      <thead><tr><th></th>${coralSessions.map(s => `<th>${e(s.name)}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><td>Duration</td>${coralSessions.map(s => `<td>${e(s.duration)}</td>`).join('')}</tr>
        <tr><td>Start times</td>${coralSessions.map(s => `<td>${s.slot_times.map(B.fmtTime).join(', ')}</td>`).join('')}</tr>
        <tr><td>See coral</td>${coralSessions.map(s => `<td>${s.sees_coral ? '✓' : '—'}</td>`).join('')}</tr>
        <tr><td>Min. age</td>${coralSessions.map(s => `<td>${s.min_age}+</td>`).join('')}</tr>
        <tr><td>Price</td>${coralSessions.map(s => `<td>${B.inr(s.price)}</td>`).join('')}</tr>
      </tbody>
    </table>
  </div>` : ''}
</section>

<section class="section section-sunken">
  <div class="container two-col">
    <div>
      <div class="overline">How it works</div>
      <h2>Three steps to the water.</h2>
      <ol class="steps-list">${lines(st.how_it_works).map((l, i) => `<li><span class="step-n">${i + 1}</span><span>${e(l)}</span></li>`).join('')}</ol>
    </div>
    <div>
      <div class="overline">Included</div>
      <h2>Everything you need.</h2>
      <ul class="included">${lines(st.included).map(l => `<li>${ICONS.check}${e(l)}</li>`).join('')}</ul>
    </div>
  </div>
</section>

${gallery.length ? `<section class="section container" id="gallery">
  <div class="overline">Gallery</div>
  <h2>What you'll see.</h2>
  <div class="gallery">${gallery.map((p, i) => p.kind === 'video'
    ? `<video src="${upl(p.file)}" muted loop playsinline preload="metadata" controls aria-label="${e(p.alt)}"></video>`
    : `<button type="button" class="gallery-item" data-full="${upl(p.file)}" aria-label="Open photo ${i + 1}"><img src="${upl(p.file)}" alt="${e(p.alt)}" loading="lazy"></button>`).join('')}</div>
</section>` : ''}

${reviews.length ? `<section class="section container" id="reviews">
  <div class="overline">Reviews</div>
  <div class="row-between"><h2>Guests say it best.</h2>${rating ? `<span class="rating-big">${e(rating)}</span>` : ''}</div>
  <div class="review-scroll">${reviews.map(r => `<figure class="review card">
    <div class="stars" aria-label="${r.rating} out of 5">${stars(r.rating)}</div>
    <blockquote>${e(r.text)}</blockquote>
    <figcaption>${r.photo ? `<img src="${upl(r.photo)}" alt="" loading="lazy">` : `<span class="avatar">${e(r.name.trim()[0] || '?')}</span>`}<span><b>${e(r.name)}</b>${r.city ? `, ${e(r.city)}` : ''}<br><span class="muted small">${e(r.source)}</span></span></figcaption>
  </figure>`).join('')}</div>
  <p class="small"><a href="/review">Been kayaking with us? Leave a review →</a></p>
</section>` : ''}

<section class="section section-sunken" id="meet">
  <div class="container two-col">
    <div>
      <div class="overline">Meeting point</div>
      <h2>Where we meet.</h2>
      <p class="meet-line">${ICONS.pin}<span>${e(st.meeting_point)}</span></p>
      <p class="muted small">Report time is shown on your booking confirmation, usually 30–45 minutes before your slot.</p>
      <a class="btn btn-secondary" href="${e(dirUrl)}" target="_blank" rel="noopener">Get directions</a>
    </div>
    <div class="map card"><iframe title="Map to meeting point" src="${e(mapSrc)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
  </div>
</section>

${faqs.length ? `<section class="section container narrow" id="faq">
  <div class="overline">FAQ</div>
  <h2>Good questions.</h2>
  <div class="faq">${faqs.map(f => `<details><summary>${e(f.q)}</summary><p>${e(f.a)}</p></details>`).join('')}</div>
</section>` : ''}

<section class="section container cta-band">
  <h2>Ready to get on the water?</h2>
  <p class="muted">${e(st.policy_text)}</p>
  <div class="cta-actions">
    <button class="btn btn-primary" type="button" data-book>Check dates &amp; book</button>
    <a class="btn btn-secondary" href="${e(waLink(st.whatsapp, 'Hi! I have a question about kayaking at North Bay.'))}" target="_blank" rel="noopener">${ICONS.wa} Ask on WhatsApp</a>
  </div>
</section>
</main>

<footer class="site-footer">
  <div class="container footer-inner">
    <div><div class="logo">${e(st.brand_name)}</div><p class="small">${e(st.meeting_point)}</p></div>
    <div class="small"><a href="tel:${e(st.phone.replace(/\s/g, ''))}">${e(st.phone)}</a>${st.email ? `<br><a href="mailto:${e(st.email)}">${e(st.email)}</a>` : ''}<br><a href="${e(waLink(st.whatsapp))}" target="_blank" rel="noopener">WhatsApp</a></div>
  </div>
</footer>

<div class="sticky-bar" id="stickyBar" aria-hidden="true">
  <div class="sticky-price"><span class="muted small">From</span><span class="price">${B.inr(minPrice)}</span></div>
  <a class="icon-btn wa-btn" href="${e(waLink(st.whatsapp, 'Hi! I want to book kayaking at North Bay.'))}" target="_blank" rel="noopener" aria-label="WhatsApp us" tabindex="-1">${ICONS.wa}</a>
  <button class="btn btn-primary" type="button" data-book tabindex="-1">Book now</button>
</div>
<a class="wa-float" href="${e(waLink(st.whatsapp, 'Hi! I want to book kayaking at North Bay.'))}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${ICONS.wa}</a>

<div class="lightbox" id="lightbox" hidden><button type="button" class="lightbox-close" aria-label="Close">✕</button><img alt=""></div>
<div id="sheetRoot"></div>
<script src="/js/site.js" defer></script>
<script src="/js/book.js" defer></script>`;

  return layout({
    title: `${st.brand_name} · Kayaking in North Bay, Andaman`,
    description: st.hero_subtitle,
    body, st, bodyClass: 'page-landing',
    extraHead: hero[0] && hero[0].kind === 'image' ? `<link rel="preload" as="image" href="${upl(hero[0].file)}">` : '',
  });
}

function reportTime(b, session) {
  const m = B.toMinutes(b.time) - (session?.report_minutes ?? 45);
  const t = `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;
  return B.fmtTime(t);
}

function confirmation(b) {
  const st = getSettings();
  const s = B.getSession(b.session_id);
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(st.map_query)}&output=embed`;
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(st.map_query)}`;
  const ok = b.status === 'confirmed';
  const waText = `Hi! My booking ID is ${b.code} (${b.session_name}, ${b.date_label} ${b.time_label}).`;
  const conv = { code: b.code, value: b.paid, total: b.total, currency: 'INR', session: b.session_name };
  const body = `
${header(st, { minimal: true })}
<main class="confirm container narrow">
  <div class="confirm-hero">
    <div class="tick ${ok ? '' : 'tick-pending'}">${ok ? ICONS.check : '…'}</div>
    <h1>${ok ? "You're booked." : b.status === 'cancelled' ? 'Booking cancelled' : 'Payment pending'}</h1>
    <p class="muted">Booking ID · <b>${e(b.code)}</b><br>${ok ? 'Save this page. We will also confirm on WhatsApp.' : b.status === 'pending' ? 'We have not received your payment yet. If money was debited, message us on WhatsApp.' : ''}</p>
  </div>
  <div class="card confirm-card">
    <div class="overline">${e(b.session_name)}</div>
    <h2 class="h3">${e(B.fmtDate(b.date, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${e(b.time_label)}</h2>
    <p><b>Report by ${e(reportTime(b, s))}</b></p>
    <p class="meet-line">${ICONS.pin}<span>Meet at: ${e(st.meeting_point)}</span></p>
    <div class="map"><iframe title="Map to meeting point" src="${e(mapSrc)}" loading="lazy"></iframe></div>
    <dl class="kv">
      <dt>Guests</dt><dd>${b.adults} adult${b.adults !== 1 ? 's' : ''}${b.kids ? ` · ${b.kids} kid${b.kids > 1 ? 's' : ''}` : ''} · ${b.kayak === 'single' ? 'Single kayak' : 'Double kayak'}</dd>
      ${b.addons.length ? `<dt>Add-ons</dt><dd>${e(b.addons.join(', '))}${b.hotel ? ` (${e(b.hotel)})` : ''}</dd>` : ''}
      <dt>Total</dt><dd>${B.inr(b.total)}</dd>
      <dt>Paid</dt><dd>${B.inr(b.paid)}</dd>
      <dt>Balance at jetty</dt><dd><b>${B.inr(b.balance)}</b></dd>
    </dl>
  </div>
  <div class="overline" style="margin-top:24px">Bring</div>
  <div class="chip-row">${lines(st.bring_list).map(l => `<span class="chip">${e(l)}</span>`).join('')}</div>
  <div class="grid2" style="margin-top:20px">
    <a class="btn btn-secondary" href="/booking/${e(b.code)}/calendar.ics?t=${e(b.token)}">Add to calendar</a>
    <a class="btn btn-secondary" href="${e(dirUrl)}" target="_blank" rel="noopener">Get directions</a>
  </div>
  <a class="btn btn-primary btn-block" style="margin-top:12px" href="${e(waLink(st.whatsapp, waText))}" target="_blank" rel="noopener">${ICONS.wa} Chat on WhatsApp</a>
  <p class="muted small center" style="margin-top:16px">${e(st.policy_text)}</p>
</main>
${ok ? `<script>
(function(){
  var c = ${JSON.stringify(conv).replace(/</g, '\\u003c')};
  var key = 'conv_' + c.code;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (_) {}
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'booking_confirmed', booking_id: c.code, value: c.total, currency: c.currency, session: c.session });
  if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', { value: c.total, currency: c.currency });
  window.__conversion = c;
})();
</script>
${st.conversion_code || ''}` : ''}`;
  return layout({ title: `Booking ${b.code} · ${st.brand_name}`, body, st, bodyClass: 'page-confirm' });
}

function reviewPage(b) {
  const st = getSettings();
  const body = `
${header(st, { minimal: true })}
<main class="container narrow review-page">
  <div class="overline">Your trip</div>
  <h1>How was your paddle?</h1>
  <p class="muted">Your review helps other travellers find us. It appears on the site after a quick check.</p>
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
    <button class="btn btn-primary btn-block" type="submit">Submit review</button>
    <p class="form-msg" role="status"></p>
  </form>
</main>
<script src="/js/review.js" defer></script>`;
  return layout({ title: `Leave a review · ${st.brand_name}`, body, st, bodyClass: 'page-review' });
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

module.exports = { landing, confirmation, reviewPage, ics, e, waLink };
