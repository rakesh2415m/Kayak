/* Booking sheet: Step 1 session/date/slot → Step 2 guests/add-ons → Step 3 details & pay.
   Opens as a bottom sheet on phones, a centred dialog on desktop. */
(function () {
  'use strict';

  var cfg = null;
  var root, sheet, backdrop, lastFocus;
  var S = null; // booking state
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function api(url, body) {
    return fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined)
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Something went wrong'); return d; }); });
  }
  function loadConfig() { return cfg ? Promise.resolve(cfg) : api('/api/config').then(function (c) { cfg = c; return c; }); }
  function session() { return cfg.sessions.find(function (s) { return s.slug === S.session; }) || cfg.sessions[0]; }
  function fmtDate(d, long) {
    var x = new Date(d + 'T00:00:00Z');
    return x.toLocaleDateString('en-GB', { weekday: long ? 'long' : 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  function selectedSlot() { return (S.slots || []).find(function (x) { return x.time === S.time; }); }

  // Remember ad click info so bookings can be traced back to campaigns.
  try {
    var qs = location.search;
    if (/utm_|gclid|fbclid/.test(qs)) sessionStorage.setItem('nbk_utm', qs.slice(1, 300));
  } catch (_) {}

  // ---------- open / close ----------
  function open(opts) {
    opts = opts || {};
    loadConfig().then(function () {
      if (!cfg.sessions.length) return alert('Bookings are not open right now. Please message us on WhatsApp.');
      var keep = S && !opts.session && !opts.date;
      if (!keep) {
        S = {
          step: 1, session: opts.session || (cfg.sessions[0] && cfg.sessions[0].slug), month: '', date: opts.date || '', time: opts.time || '',
          slots: [], days: [], adults: Math.max(1, Number(opts.adults) || 2), kids: 0, kayak: 'double', addons: [], hotel: '',
          name: '', phone: '', email: '', promo: '', promoOpen: false, plan: 'advance', method: 'upi', quote: null, pending: null, error: '',
        };
        S.month = (S.date || cfg.today).slice(0, 7);
        if (opts.date && opts.time) S.step = 2;
      }
      mount();
      render();
      if (S.step === 1) { loadMonth(); if (S.date) loadSlots(); }
      else if (S.step === 2) { loadSlots().then(function () { clampGuests(); refreshQuote(); }); }
      else refreshQuote();
    }).catch(function () { alert('Could not load booking. Check your connection and try again.'); });
  }

  function mount() {
    if (sheet) return;
    root = document.getElementById('sheetRoot') || document.body.appendChild(document.createElement('div'));
    backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Book kayaking');
    root.appendChild(backdrop);
    root.appendChild(sheet);
    lastFocus = document.activeElement;
    document.documentElement.style.overflow = 'hidden';
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(function () { backdrop.classList.add('show'); sheet.classList.add('show'); });
    try { history.pushState({ nbkSheet: 1 }, ''); } catch (_) {}
    window.addEventListener('popstate', onPop);
  }

  function close(fromPop) {
    if (!sheet) return;
    var s = sheet, b = backdrop;
    s.classList.remove('show');
    b.classList.remove('show');
    setTimeout(function () { s.remove(); b.remove(); }, 400);
    sheet = backdrop = null;
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('popstate', onPop);
    if (fromPop !== true && history.state && history.state.nbkSheet) history.back();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onPop() { close(true); }
  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab' && sheet) {
      var f = sheet.querySelectorAll('button:not([disabled]), input, select, a[href], textarea');
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  }

  // ---------- data ----------
  function loadMonth() {
    var m = S.month;
    return api('/api/availability?session=' + encodeURIComponent(S.session) + '&month=' + m).then(function (d) {
      if (S.month !== m) return;
      S.days = d.days;
      render();
    }).catch(function (e) { S.error = e.message; render(); });
  }
  function loadSlots() {
    if (!S.date) return Promise.resolve();
    var key = S.session + S.date;
    S.slots = null;
    render();
    return api('/api/slots?session=' + encodeURIComponent(S.session) + '&date=' + S.date).then(function (d) {
      if (S.session + S.date !== key) return;
      S.slots = d.slots;
      var sl = selectedSlot();
      if (S.time && (!sl || sl.left === 0)) S.time = '';
      render();
    }).catch(function (e) { S.error = e.message; S.slots = []; render(); });
  }
  var qTimer;
  function refreshQuote() {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () {
      api('/api/quote', payload()).then(function (q) {
        S.quote = q;
        S.promoError = S.promo && !q.promoValid ? 'That code is not valid' : '';
        render();
      }).catch(function () {});
    }, 120);
  }
  function payload() {
    return { session: S.session, date: S.date, time: S.time, adults: S.adults, kids: S.kids, kayak: S.kayak, addons: S.addons,
      hotel: S.hotel, promo: S.promo, name: S.name, phone: normPhone(S.phone), email: S.email, plan: S.plan, method: S.method,
      utm: (function () { try { return sessionStorage.getItem('nbk_utm') || ''; } catch (_) { return ''; } })() };
  }
  function normPhone(p) {
    var d = String(p || '').replace(/[^\d+]/g, '');
    if (/^\d{10}$/.test(d)) return '+91' + d;
    if (/^0\d{10}$/.test(d)) return '+91' + d.slice(1);
    return d;
  }
  function seatsLeft() { var sl = selectedSlot(); return sl ? sl.left : 12; }
  function clampGuests() {
    var left = seatsLeft();
    S.adults = Math.max(1, Math.min(S.adults, left));
    S.kids = Math.max(0, Math.min(S.kids, left - S.adults, S.adults * 2));
  }

  // ---------- render ----------
  function render() {
    if (!sheet) return;
    var focusId = document.activeElement && sheet.contains(document.activeElement) ? document.activeElement.id : '';
    var head = '<div class="sheet-head">' +
      (S.step === 1 ? '<button type="button" data-act="close">✕ Close</button>' : '<button type="button" data-act="back">‹ Back</button>') +
      '<span class="overline">Step ' + Math.min(S.step, 3) + ' of 3</span>' +
      '<a href="https://wa.me/' + esc(cfg.whatsapp) + '?text=' + encodeURIComponent('Hi! I need help with a booking.') + '" target="_blank" rel="noopener">Help</a></div>';
    var banner = cfg.payment.mode === 'simulated' ? '<div class="test-banner">TEST MODE · no real payments are taken</div>' : '';
    var prog = '<div class="progress" aria-hidden="true"><i class="on"></i><i class="' + (S.step >= 2 ? 'on' : '') + '"></i><i class="' + (S.step >= 3 ? 'on' : '') + '"></i></div>';
    var body = S.step === 1 ? step1() : S.step === 2 ? step2() : S.step === 3 ? step3() : stepSim();
    var err = S.error ? '<div class="sheet-error" role="alert">' + esc(S.error) + '</div>' : '';
    var scroll = sheet.querySelector('.sheet-body');
    var top = scroll ? scroll.scrollTop : 0;
    var sameStep = sheet.getAttribute('data-step') === String(S.step);
    sheet.setAttribute('data-step', S.step);
    sheet.innerHTML = banner + head + '<div class="sheet-body">' + prog + body + err + '</div>' + bar();
    if (sameStep) sheet.querySelector('.sheet-body').scrollTop = top;
    var f = focusId && document.getElementById(focusId);
    if (f) { f.focus(); if (f.setSelectionRange && f.type === 'text') { try { f.setSelectionRange(f.value.length, f.value.length); } catch (_) {} } }
    else if (!sameStep) { var c = sheet.querySelector('.sheet-head button'); if (c) c.focus({ preventScroll: true }); }
  }

  function step1() {
    var h = '<div class="field-label" id="lblSession">Session</div><div class="chip-row" role="radiogroup" aria-labelledby="lblSession">';
    cfg.sessions.forEach(function (s) {
      h += '<button type="button" class="chip" role="radio" aria-checked="' + (s.slug === S.session) + '" data-session="' + esc(s.slug) + '">' + esc(s.name) + ' · ' + esc(s.duration) + '</button>';
    });
    h += '</div>';
    h += '<div class="field-label">Date</div>' + calendar();
    h += '<div class="field-label">Time slot</div>';
    if (!S.date) h += '<p class="fine">Pick a date to see available times.</p>';
    else if (S.slots === null) h += '<p class="fine">Checking seats…</p>';
    else if (!S.slots.length) h += '<p class="fine">No slots on this day.</p>';
    else {
      h += '<div class="slot-grid">';
      S.slots.forEach(function (sl) {
        var txt = sl.left > 0 ? (sl.left + ' seat' + (sl.left === 1 ? '' : 's') + ' left') : sl.reason;
        h += '<button type="button" class="slot" data-time="' + sl.time + '" aria-pressed="' + (sl.time === S.time) + '"' + (sl.left > 0 ? '' : ' disabled') + '>' +
          '<b>' + esc(sl.label) + '</b><span class="' + (sl.left > 0 && sl.left <= 3 ? 'low' : '') + '">' + esc(txt) + '</span></button>';
      });
      h += '</div><p class="fine">Times follow the tide, so they can change by season.</p>';
    }
    return h;
  }

  function calendar() {
    var y = Number(S.month.slice(0, 4)), m = Number(S.month.slice(5, 7));
    var first = new Date(Date.UTC(y, m - 1, 1));
    var lead = (first.getUTCDay() + 6) % 7;
    var daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
    var canPrev = S.month > cfg.today.slice(0, 7);
    var canNext = S.month < cfg.lastDay.slice(0, 7);
    var byDate = {};
    (S.days || []).forEach(function (d) { byDate[d.date] = d; });
    var h = '<div class="cal"><div class="cal-head"><button type="button" data-month="-1" aria-label="Previous month"' + (canPrev ? '' : ' disabled') + '>‹</button>' +
      '<b>' + MONTHS[m - 1] + ' ' + y + '</b><button type="button" data-month="1" aria-label="Next month"' + (canNext ? '' : ' disabled') + '>›</button></div><div class="cal-grid">';
    DOW.forEach(function (d) { h += '<div class="cal-dow">' + d + '</div>'; });
    for (var i = 0; i < lead; i++) h += '<div></div>';
    for (var d = 1; d <= daysIn; d++) {
      var date = S.month + '-' + (d < 10 ? '0' : '') + d;
      var info = byDate[date];
      var ok = info && info.left > 0;
      var label = fmtDate(date, true) + (info ? (ok ? ', ' + info.left + ' seats' : ', ' + info.reason) : '');
      h += '<button type="button" class="cal-day" data-date="' + date + '" aria-pressed="' + (date === S.date) + '" aria-label="' + esc(label) + '"' + (ok ? '' : ' disabled') + '>' + d +
        (ok && info.left <= 4 ? '<small>' + info.left + ' left</small>' : '') + '</button>';
    }
    h += '</div><div class="cal-legend">' + (S.days.length ? 'Greyed dates = rough sea, closed or sold out' : 'Loading…') + '</div></div>';
    return h;
  }

  function step2() {
    var left = seatsLeft();
    var s = session();
    var h = '<div class="box">' +
      stepper('adults', 'Adults', '12+ yrs', S.adults, 1, Math.min(left - S.kids, 20)) +
      stepper('kids', 'Kids', (s.minAge || 6) + '–11 yrs, with an adult', S.kids, 0, Math.min(left - S.adults, S.adults * 2)) +
      '</div>';
    if (left <= 6) h += '<p class="fine">' + left + ' seat' + (left === 1 ? '' : 's') + ' left in this slot.</p>';
    h += '<div class="field-label">Kayak type</div><div class="grid2">' +
      choice('kayak', 'double', 'Double (shared)', 'Included', S.kayak === 'double') +
      choice('kayak', 'single', 'Single', '+ ' + inr(cfg.singleKayakPrice) + ' per adult', S.kayak === 'single') + '</div>';
    if (cfg.addons.length) {
      h += '<div class="field-label">Add-ons</div><div class="box" style="gap:6px">';
      cfg.addons.forEach(function (a) {
        var on = S.addons.indexOf(a.id) >= 0;
        h += '<label class="addon"><input type="checkbox" data-addon="' + a.id + '"' + (on ? ' checked' : '') + '><span>' + esc(a.name) + '</span><em>+' + inr(a.price) + (a.per === 'person' ? ' pp' : '') + '</em></label>';
        if (on && a.needsHotel) h += '<input class="input" id="fHotel" data-field="hotel" placeholder="Hotel name for pickup" value="' + esc(S.hotel) + '" autocomplete="off">';
      });
      h += '</div>';
    }
    return h;
  }
  function stepper(key, title, sub, val, min, max) {
    return '<div class="stepper-row"><div><b>' + title + '</b><span>' + esc(sub) + '</span></div><div class="stepper">' +
      '<button type="button" data-step-key="' + key + '" data-delta="-1" aria-label="Fewer ' + title.toLowerCase() + '"' + (val <= min ? ' disabled' : '') + '>−</button>' +
      '<output aria-live="polite" aria-label="' + title + '">' + val + '</output>' +
      '<button type="button" data-step-key="' + key + '" data-delta="1" aria-label="More ' + title.toLowerCase() + '"' + (val >= max ? ' disabled' : '') + '>+</button></div></div>';
  }
  function choice(name, value, title, sub, checked) {
    return '<label class="choice"><input type="radio" name="' + name + '" value="' + value + '"' + (checked ? ' checked' : '') + '><b>' + esc(title) + '</b><span>' + sub + '</span></label>';
  }

  function step3() {
    var s = session();
    var q = S.quote;
    var guests = S.adults + ' adult' + (S.adults > 1 ? 's' : '') + (S.kids ? ' · ' + S.kids + ' kid' + (S.kids > 1 ? 's' : '') : '');
    var extras = q && q.addonNames.length ? ' · ' + q.addonNames.join(', ') : '';
    var sl = selectedSlot();
    var h = '<div class="summary"><div><b>' + esc(s.name) + ' · ' + esc(fmtDate(S.date)) + ' · ' + esc(sl ? sl.label : S.time) + '</b><span>' + esc(guests + extras) + '</span></div>' +
      '<button type="button" data-act="edit">Edit</button></div>';
    h += '<label class="field-label" for="fName">Full name</label><input class="input" id="fName" data-field="name" autocomplete="name" placeholder="As on ID (needed for jetty permit)" value="' + esc(S.name) + '">';
    h += '<label class="field-label" for="fPhone">WhatsApp number</label><input class="input" id="fPhone" data-field="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+91 98XXX XXXXX" value="' + esc(S.phone) + '">';
    h += '<label class="field-label" for="fEmail">Email (optional)</label><input class="input" id="fEmail" data-field="email" type="email" autocomplete="email" placeholder="For your receipt" value="' + esc(S.email) + '">';
    if (S.promoOpen || S.promo) {
      h += '<label class="field-label" for="fPromo">Promo code</label><div class="promo-row"><input class="input" id="fPromo" data-field="promo" autocomplete="off" value="' + esc(S.promo) + '"></div>' +
        (S.promoError ? '<div class="sheet-error">' + esc(S.promoError) + '</div>' : (q && q.promo ? '<div class="fine" style="color:var(--success)">Code applied</div>' : ''));
    } else h += '<button type="button" class="linkish" data-act="promo" style="margin-top:10px">Have a promo code?</button>';
    if (q) {
      h += '<div class="lines" style="margin-top:8px">';
      q.lines.forEach(function (l) { h += '<div><span>' + esc(l.label) + '</span><span>' + (l.amount < 0 ? '−' : '') + inr(Math.abs(l.amount)) + '</span></div>'; });
      h += '<div class="tot"><span>Total</span><span>' + inr(q.total) + '</span></div></div>';
      h += '<div class="field-label">Pay now</div><div class="grid2">' +
        choice('plan', 'advance', 'Advance ' + q.advancePct + '%', '<span class="price">' + inr(q.advance) + '</span><br>rest at the jetty', S.plan === 'advance') +
        choice('plan', 'full', 'Full amount', '<span class="price">' + inr(q.total) + '</span><br>nothing to pay later', S.plan === 'full') + '</div>';
    }
    h += '<div class="chip-row" role="radiogroup" aria-label="Payment method" style="margin-top:10px">';
    [['upi', 'UPI'], ['card', 'Card'], ['netbanking', 'Netbanking']].forEach(function (m) {
      h += '<button type="button" class="chip" role="radio" data-method="' + m[0] + '" aria-checked="' + (S.method === m[0]) + '">' + m[1] + '</button>';
    });
    h += '</div><p class="fine" style="margin-top:8px">' + esc(cfg.policy) + '</p>';
    return h;
  }

  function stepSim() {
    return '<div class="box" style="margin-top:12px"><b>Test payment</b><p class="fine" style="margin:0">Razorpay keys are not set up yet, so no money is taken. ' +
      'Tap below to simulate a successful payment of <b>' + inr(S.pending.amount) + '</b> for booking <b>' + esc(S.pending.code) + '</b>.</p></div>';
  }

  function bar() {
    var s = session();
    var q = S.quote;
    if (S.step === 1) {
      return '<div class="sheet-bar"><div class="total"><div class="price">' + inr(s.price) + '</div><div class="fine">per person</div></div>' +
        '<button type="button" class="btn btn-primary" data-act="next"' + (S.time ? '' : ' disabled') + '>Continue</button></div>';
    }
    if (S.step === 2) {
      var pax = S.adults + S.kids;
      return '<div class="sheet-bar"><div class="total"><div class="price">' + (q ? inr(q.total) : '…') + '</div><div class="fine">' + pax + ' guest' + (pax > 1 ? 's' : '') + ' · total</div></div>' +
        '<button type="button" class="btn btn-primary" data-act="next">Continue</button></div>';
    }
    if (S.step === 3) {
      var amt = q ? (S.plan === 'full' ? q.total : q.advance) : 0;
      return '<div class="sheet-bar"><button type="button" class="btn btn-primary" data-act="pay"' + (S.busy || !q ? ' disabled' : '') + '>' +
        (S.busy ? 'Please wait…' : 'Pay ' + inr(amt) + ' & confirm') + '</button></div>';
    }
    return '<div class="sheet-bar"><button type="button" class="btn btn-primary" data-act="simulate"' + (S.busy ? ' disabled' : '') + '>Simulate successful payment</button></div>';
  }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-book]');
    if (t && !(sheet && sheet.contains(t))) {
      e.preventDefault();
      open({ session: t.getAttribute('data-book') || undefined });
      return;
    }
    if (!sheet || !sheet.contains(e.target)) return;
    var el;
    if ((el = e.target.closest('[data-session]'))) {
      S.session = el.getAttribute('data-session'); S.time = ''; S.slots = []; S.error = '';
      render(); loadMonth(); if (S.date) loadSlots();
    } else if ((el = e.target.closest('[data-month]'))) {
      var y = Number(S.month.slice(0, 4)), m = Number(S.month.slice(5, 7)) + Number(el.getAttribute('data-month'));
      if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
      S.month = y + '-' + (m < 10 ? '0' : '') + m; S.days = [];
      render(); loadMonth();
    } else if ((el = e.target.closest('[data-date]'))) {
      S.date = el.getAttribute('data-date'); S.time = ''; S.error = '';
      loadSlots();
    } else if ((el = e.target.closest('[data-time]'))) {
      S.time = el.getAttribute('data-time'); S.error = '';
      render();
      var b = sheet.querySelector('[data-act="next"]'); if (b) b.focus();
    } else if ((el = e.target.closest('[data-step-key]'))) {
      S[el.getAttribute('data-step-key')] += Number(el.getAttribute('data-delta'));
      clampGuests(); render(); refreshQuote();
    } else if ((el = e.target.closest('[data-method]'))) {
      S.method = el.getAttribute('data-method'); render();
    } else if ((el = e.target.closest('[data-act]'))) {
      act(el.getAttribute('data-act'));
    }
  });

  document.addEventListener('change', function (e) {
    if (!sheet || !sheet.contains(e.target)) return;
    var t = e.target;
    if (t.name === 'kayak') { S.kayak = t.value; refreshQuote(); }
    else if (t.name === 'plan') { S.plan = t.value; render(); }
    else if (t.hasAttribute('data-addon')) {
      var id = Number(t.getAttribute('data-addon'));
      S.addons = S.addons.filter(function (x) { return x !== id; });
      if (t.checked) S.addons.push(id);
      render(); refreshQuote();
    }
  });
  document.addEventListener('input', function (e) {
    if (!sheet || !sheet.contains(e.target)) return;
    var f = e.target.getAttribute('data-field');
    if (!f) return;
    S[f] = e.target.value;
    if (f === 'promo') refreshQuote();
  });

  function act(a) {
    S.error = '';
    if (a === 'close') return close();
    if (a === 'back') { S.step = S.step === 4 ? 3 : S.step - 1; render(); if (S.step === 1) { loadMonth(); } return; }
    if (a === 'edit') { S.step = 2; render(); return; }
    if (a === 'promo') { S.promoOpen = true; render(); var p = document.getElementById('fPromo'); if (p) p.focus(); return; }
    if (a === 'next') {
      if (S.step === 1) { if (!S.time) return; S.step = 2; clampGuests(); render(); refreshQuote(); return; }
      if (S.step === 2) {
        var needHotel = cfg.addons.some(function (x) { return x.needsHotel && S.addons.indexOf(x.id) >= 0; });
        if (needHotel && !S.hotel.trim()) { S.error = 'Please tell us your hotel for pickup.'; render(); return; }
        S.step = 3; render(); refreshQuote(); return;
      }
    }
    if (a === 'pay') return pay();
    if (a === 'simulate') return simulate();
  }

  function pay() {
    if (S.name.trim().length < 2) { S.error = 'Please enter your full name.'; render(); return focus('fName'); }
    if (normPhone(S.phone).replace(/\D/g, '').length < 10) { S.error = 'Please enter a valid WhatsApp number.'; render(); return focus('fPhone'); }
    if (S.pending && S.pending.sig === sig()) return startPayment(S.pending);
    S.busy = true; render();
    api('/api/bookings', payload()).then(function (r) {
      S.busy = false;
      r.sig = sig();
      S.pending = r;
      startPayment(r);
    }).catch(function (e) {
      S.busy = false; S.error = e.message; render();
      if (/slot|seat/i.test(e.message)) { S.slots = []; loadSlots(); }
    });
  }
  function sig() { return JSON.stringify(payload()); }
  function focus(id) { var el = document.getElementById(id); if (el) el.focus(); }

  function startPayment(r) {
    if (r.mode === 'simulated' || !r.order) { S.step = 4; render(); return; }
    loadRazorpay().then(function () {
      var rz = new window.Razorpay({
        key: r.order.keyId, order_id: r.order.id, amount: r.order.amount, currency: r.order.currency,
        name: cfg.brand, description: 'Booking ' + r.code,
        prefill: { name: S.name, contact: normPhone(S.phone), email: S.email, method: S.method },
        notes: { booking: r.code }, theme: { color: '#D97757' },
        handler: function (resp) {
          S.busy = true; render();
          api('/api/bookings/' + encodeURIComponent(r.code) + '/verify', Object.assign({ token: r.token }, resp))
            .then(function (v) { location.href = v.url; })
            .catch(function (e) { S.busy = false; S.error = e.message; render(); });
        },
        modal: { ondismiss: function () { S.error = 'Payment not completed. Your seats are held for 15 minutes. Tap Pay to try again.'; render(); } },
      });
      rz.on('payment.failed', function (resp) { S.error = (resp.error && resp.error.description) || 'Payment failed. Please try again.'; render(); });
      rz.open();
    }).catch(function () { S.error = 'Could not load the payment window. Check your connection.'; render(); });
  }
  function loadRazorpay() {
    if (window.Razorpay) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function simulate() {
    S.busy = true; render();
    api('/api/bookings/' + encodeURIComponent(S.pending.code) + '/simulate-pay', { token: S.pending.token })
      .then(function (v) { location.href = v.url; })
      .catch(function (e) { S.busy = false; S.error = e.message; render(); });
  }

  window.openBooking = open;

  // Deep links from ads: /?book=mangrove or /#book
  var p = new URLSearchParams(location.search);
  if (p.has('book') || location.hash === '#book') {
    window.addEventListener('load', function () { open({ session: p.get('book') || undefined }); });
  }
})();
