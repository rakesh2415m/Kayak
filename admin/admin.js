/* Admin panel SPA (no build step). Hash routes:
   #/bookings #/calendar #/sessions #/photos #/reviews #/content #/settings #/jetty */
(function () {
  'use strict';

  // ---------- helpers ----------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var inr = function (n) { return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN'); };
  var stars = function (n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); };
  var app = $('#app');
  var ctx = { stats: null, catalog: null, settings: null };

  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || (opts.body || opts.form ? 'POST' : 'GET'), headers: {} };
    if (opts.form) init.body = opts.form;
    else if (opts.body) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    return fetch('/admin/api' + path, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 && path !== '/login') { showLogin(); throw new Error('Please log in'); }
        if (!r.ok) { var e = new Error(d.error || 'Something went wrong'); e.data = d; e.status = r.status; throw e; }
        return d;
      });
    });
  }
  var toastT;
  function toast(msg, bad) {
    var t = $('#toast');
    t.textContent = msg;
    t.className = 'show' + (bad ? ' bad' : '');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.className = ''; }, 2800);
  }
  function fail(e) { if (e && e.message !== 'Please log in') toast(e.message, true); }
  function todayIST() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()); }
  function addDays(d, n) { var x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function fmtDate(d, o) { return new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', Object.assign({ weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }, o || {})); }
  function fmtTime(t) { var p = t.split(':').map(Number); return ((p[0] % 12) || 12) + ':' + String(p[1]).padStart(2, '0') + ' ' + (p[0] >= 12 ? 'PM' : 'AM'); }
  function waUrl(phone, text) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length === 10) d = '91' + d;
    return 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function statusChip(label) { return '<span class="status st-' + esc(label.split(' ')[0]) + '">' + esc(label) + '</span>'; }
  function debounce(fn, ms) { var t; return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; }
  function formData(form) {
    var o = {};
    $$('[name]', form).forEach(function (el) {
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else if (el.type !== 'file') o[el.name] = el.value;
    });
    return o;
  }
  var ICON = {
    wa: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/></svg>',
  };

  // ---------- modal / drawer ----------
  function overlayPanel(kind, title, bodyHtml, footHtml) {
    var ov = document.createElement('div');
    ov.className = 'overlay';
    var el = document.createElement('div');
    el.className = kind;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', title);
    el.innerHTML = '<div class="drawer-head"><h2>' + esc(title) + '</h2><button type="button" class="x" data-close aria-label="Close">✕</button></div>' +
      '<div class="drawer-body">' + bodyHtml + '</div>' + (footHtml ? '<div class="modal-foot">' + footHtml + '</div>' : '');
    document.body.appendChild(ov);
    document.body.appendChild(el);
    var prev = document.activeElement;
    function close() { ov.remove(); el.remove(); document.removeEventListener('keydown', key); if (prev && prev.focus) prev.focus(); }
    function key(e) { if (e.key === 'Escape') close(); }
    ov.addEventListener('click', close);
    el.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', key);
    var first = el.querySelector('input:not([type=hidden]), select, textarea') || el.querySelector('.x');
    if (first) first.focus();
    return { el: el, body: el.querySelector('.drawer-body'), close: close };
  }
  var modal = function (t, b, f) { return overlayPanel('modal', t, b, f); };
  var drawer = function (t, b) { return overlayPanel('drawer', t, b); };

  // ---------- auth ----------
  function showLogin() {
    app.innerHTML = '<div class="login"><form class="card" id="loginForm"><div class="muted small" style="letter-spacing:.18em;font-weight:800">ADMIN</div>' +
      '<h1>North Bay Kayaking</h1><label class="f">Password<input class="input" type="password" name="password" autocomplete="current-password" required autofocus></label>' +
      '<button class="btn primary block" type="submit">Log in</button><div class="err" role="alert"></div></form></div>';
    $('#loginForm').onsubmit = function (e) {
      e.preventDefault();
      api('/login', { body: formData(e.target) }).then(function () { route(); })
        .catch(function (err) { $('.err', e.target).textContent = err.message; });
    };
  }

  // ---------- shell ----------
  var NAV = [
    ['bookings', 'Bookings'], ['calendar', 'Calendar & slots'], ['sessions', 'Sessions & prices'], ['photos', 'Photos'],
    ['reviews', 'Reviews'], ['content', 'FAQ & text'], ['settings', 'Settings'], ['jetty', 'Jetty check-in'],
  ];
  function shell(active, title, actionsHtml) {
    var pending = ctx.stats ? ctx.stats.pendingReviews : 0;
    var banner = ctx.stats && ctx.stats.paymentMode === 'simulated'
      ? '<div class="mode-banner">Test mode: payments are simulated. <a href="#/settings">Add Razorpay keys</a> to take real payments.</div>' : '';
    app.innerHTML =
      '<div class="shell"><aside class="side" id="side"><div class="logo">' + esc(ctx.settings ? ctx.settings.brand_name : 'Kayak') + '<small>ADMIN</small></div>' +
      NAV.map(function (n) {
        return '<a class="nav' + (n[0] === active ? ' on' : '') + '" href="#/' + n[0] + '"' + (n[0] === active ? ' aria-current="page"' : '') + '>' + esc(n[1]) +
          (n[0] === 'reviews' && pending ? '<span class="count">' + pending + '</span>' : '') + '</a>';
      }).join('') +
      '<div class="foot"><a href="/" target="_blank" rel="noopener">View website ↗</a><button type="button" data-logout>Log out</button></div></aside>' +
      '<div class="main"><div class="topbar"><span class="logo">ADMIN</span><button type="button" class="btn ghost" data-menu aria-label="Menu" aria-controls="side">☰</button></div>' +
      banner + (title ? '<div class="page-head"><h1>' + esc(title) + '</h1>' + (actionsHtml || '') + '</div>' : '') +
      '<div class="view" id="view"></div></div></div>';
    $('[data-menu]').onclick = function () { $('#side').classList.toggle('open'); };
    $('[data-logout]').onclick = function () { api('/logout', { body: {} }).then(showLogin); };
    return $('#view');
  }

  function refreshStats() { return api('/stats').then(function (s) { ctx.stats = s; return s; }); }
  function loadCatalog() { return api('/catalog').then(function (c) { ctx.catalog = c; return c; }); }
  function loadSettings() { return api('/settings').then(function (s) { ctx.settings = s.settings; ctx.settingsMeta = s; return s; }); }

  // ======================================================================
  // BOOKINGS (3a) + detail drawer (3b)
  // ======================================================================
  var bk = { range: 'today', from: '', to: '', session: '', time: '', status: '', q: '' };

  function bkRange() {
    var t = todayIST();
    if (bk.range === 'today') return [t, t];
    if (bk.range === 'tomorrow') return [addDays(t, 1), addDays(t, 1)];
    if (bk.range === 'week') return [t, addDays(t, 6)];
    if (bk.range === 'upcoming') return [t, ''];
    return [bk.from, bk.to];
  }
  function bkQuery(extra) {
    var r = bkRange();
    var p = new URLSearchParams();
    if (r[0]) p.set('from', r[0]);
    if (r[1]) p.set('to', r[1]);
    if (bk.session) p.set('session', bk.session);
    if (bk.time) p.set('time', bk.time);
    if (bk.status) p.set('status', bk.status);
    if (bk.q) p.set('q', bk.q);
    if (extra) Object.keys(extra).forEach(function (k) { p.set(k, extra[k]); });
    return p.toString();
  }

  function viewBookings() {
    var v = shell('bookings', 'Bookings', '<a class="btn" id="csv" href="#">Export CSV</a><button class="btn primary" data-walkin>+ Add walk-in</button>');
    v.innerHTML = '<div class="page"><div class="stats" id="stats"></div><div class="card pad stack">' +
      '<div class="filters">' +
      '<input class="input search" type="search" id="q" placeholder="Search name / phone / booking ID" value="' + esc(bk.q) + '" aria-label="Search">' +
      [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'Next 7 days'], ['upcoming', 'All upcoming'], ['custom', 'Date range']].map(function (r) {
        return '<button class="chip' + (bk.range === r[0] ? ' on' : '') + '" data-range="' + r[0] + '" aria-pressed="' + (bk.range === r[0]) + '">' + r[1] + '</button>';
      }).join('') +
      '<span class="row' + (bk.range === 'custom' ? '' : ' hidden') + '" id="custom"><input class="input" type="date" id="from" value="' + bk.from + '" aria-label="From"> – <input class="input" type="date" id="to" value="' + bk.to + '" aria-label="To"></span>' +
      '<select class="input" id="fSession" aria-label="Session"><option value="">All sessions</option>' +
      ctx.catalog.sessions.map(function (s) { return '<option value="' + s.id + '"' + (String(bk.session) === String(s.id) ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select>' +
      '<select class="input" id="fStatus" aria-label="Status">' +
      [['', 'All bookings'], ['paid', 'Paid'], ['advance', 'Advance paid'], ['due', 'Due (nothing paid)'], ['pending', 'Awaiting payment (drop-offs)'], ['cancelled', 'Cancelled'], ['all', 'Everything']].map(function (o) {
        return '<option value="' + o[0] + '"' + (bk.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>' +
      (bk.time ? '<button class="chip on" data-cleartime>' + esc(fmtTime(bk.time)) + ' ✕</button>' : '') +
      '</div><div id="list"><div class="empty">Loading…</div></div></div></div>';

    function stats() {
      var s = ctx.stats;
      $('#stats').innerHTML =
        '<div class="card stat"><span>Today · ' + esc(s.todayLabel) + '</span><b>' + s.todayGuests + ' guests</b></div>' +
        '<div class="card stat"><span>This week</span><b>' + s.weekGuests + ' guests</b></div>' +
        '<div class="card stat"><span>Collected · next 7 days</span><b>' + inr(s.collected) + '</b></div>' +
        '<div class="card stat"><span>Due at jetty · next 7 days</span><b>' + inr(s.due) + '</b></div>';
    }
    stats();
    function load() {
      $('#csv').href = '/admin/api/bookings.csv?' + bkQuery();
      api('/bookings?' + bkQuery()).then(function (d) { renderList(d); }).catch(fail);
    }
    function renderList(d) {
      var rows = d.bookings;
      if (!rows.length) { $('#list').innerHTML = '<div class="empty">No bookings for this filter.</div>'; return; }
      var h = '<table class="tbl"><thead><tr><th>ID</th><th>Guest</th><th>Slot</th><th>Session</th><th>Pax</th><th>Paid</th><th>Status</th><th><span class="hidden">Checked in</span></th></tr></thead><tbody>';
      var lastKey = '';
      var groups = {};
      rows.forEach(function (b) {
        var k = b.date + b.time + b.session_id;
        if (b.status === 'confirmed') groups[k] = (groups[k] || 0) + b.pax;
      });
      var caps = {};
      ctx.catalog.sessions.forEach(function (s) { caps[s.id] = s.capacity; });
      rows.forEach(function (b) {
        var k = b.date + b.time + b.session_id;
        if (k !== lastKey) {
          lastKey = k;
          h += '<tr class="grp"><td colspan="8">' + esc(b.date_label) + ' · ' + esc(b.time_label) + ' · ' + esc(b.session_name) +
            ' <span class="muted">— ' + (groups[k] || 0) + '/' + (caps[b.session_id] || '?') + ' seats</span></td></tr>';
        }
        h += '<tr class="b" data-id="' + b.id + '" tabindex="0">' +
          '<td data-k="id"><b>' + esc(b.code) + '</b>' + (b.source !== 'online' ? '<br><span class="tag">' + esc(b.source) + '</span>' : '') + '</td>' +
          '<td><b>' + esc(b.name) + '</b><div class="sub">' + esc(b.phone || '—') + '</div></td>' +
          '<td data-k="slot">' + esc(b.time_label) + '</td>' +
          '<td>' + esc(b.session_name) + '</td>' +
          '<td>' + b.pax + '</td>' +
          '<td>' + (b.paid >= b.total ? inr(b.total) : inr(b.paid) + ' <span class="sub">of ' + inr(b.total) + '</span>') + '</td>' +
          '<td>' + statusChip(b.status_label) + '</td>' +
          '<td>' + (b.checked_in ? '<span class="ci" title="Checked in">✓ in</span>' : '') + '</td></tr>';
      });
      h += '</tbody></table>';
      var t = d.totals;
      h += '<div class="row wrap muted small" style="padding:12px 4px 0;gap:18px"><span><b>' + t.bookings + '</b> bookings</span><span><b>' + t.guests + '</b> guests</span><span>Paid <b>' + inr(t.paid) + '</b></span><span>Due at jetty <b>' + inr(t.due) + '</b></span></div>';
      $('#list').innerHTML = h;
    }
    load();

    v.onclick = function (e) {
      var el;
      if ((el = e.target.closest('[data-range]'))) { bk.range = el.getAttribute('data-range'); viewBookings(); }
      else if (e.target.closest('[data-cleartime]')) { bk.time = ''; viewBookings(); }
      else if ((el = e.target.closest('tr.b'))) openBookingDrawer(Number(el.getAttribute('data-id')), afterChange);
    };
    v.onkeydown = function (e) { var el = e.target.closest('tr.b'); if (el && e.key === 'Enter') openBookingDrawer(Number(el.getAttribute('data-id')), afterChange); };
    $('[data-walkin]').onclick = function () { walkinModal({}, afterChange); };
    $('#q').oninput = debounce(function (e) { bk.q = e.target.value.trim(); load(); }, 250);
    $('#fSession').onchange = function (e) { bk.session = e.target.value; load(); };
    $('#fStatus').onchange = function (e) { bk.status = e.target.value; load(); };
    $('#from').onchange = function (e) { bk.from = e.target.value; load(); };
    $('#to').onchange = function (e) { bk.to = e.target.value; load(); };
    function afterChange() { load(); refreshStats().then(stats); }
  }

  function openBookingDrawer(id, onChange) {
    var d = drawer('Booking', '<div class="empty">Loading…</div>');
    function load() {
      return api('/bookings/' + id).then(function (r) { render(r); }).catch(function (e) { fail(e); d.close(); });
    }
    function render(r) {
      var b = r.booking;
      var origin = location.origin;
      var st = ctx.settings || {};
      $('h2', d.el).textContent = b.code;
      var waBase = 'Hi ' + b.name.split(' ')[0] + ', ';
      d.body.innerHTML =
        '<div class="stack" style="gap:6px"><div class="row"><b style="font-size:16px;flex:1">' + esc(b.name) + '</b>' + statusChip(b.status_label) + '</div>' +
        '<div class="muted">' + esc(b.phone || 'No phone') + (b.email ? ' · ' + esc(b.email) : '') + '</div>' +
        (b.phone ? '<div class="grid2"><a class="btn wa" target="_blank" rel="noopener" href="' + esc(waUrl(b.phone, waBase)) + '">' + ICON.wa + ' WhatsApp</a><a class="btn" href="tel:' + esc(b.phone) + '">' + ICON.phone + ' Call</a></div>' : '') + '</div>' +
        '<div class="box"><b>' + esc(b.session_name) + ' · ' + esc(b.date_label) + ' · ' + esc(b.time_label) + '</b>' +
        '<span>' + b.adults + ' adult' + (b.adults !== 1 ? 's' : '') + ' · ' + b.kids + ' kid' + (b.kids !== 1 ? 's' : '') + ' · ' + (b.kayak === 'single' ? 'Single kayak' : 'Double kayak') + '</span>' +
        (b.addons.length ? '<span>Add-ons: ' + esc(b.addons.join(', ')) + (b.hotel ? ' (' + esc(b.hotel) + ')' : '') + '</span>' : '') +
        (b.promo ? '<span>Promo: ' + esc(b.promo) + '</span>' : '') +
        '<span class="muted small">Booked ' + esc(b.created_at) + ' UTC · ' + esc(b.source) + (b.utm ? ' · ' + esc(b.utm) : '') + '</span></div>' +
        '<div class="box"><div class="kv"><span>Total</span><b>' + inr(b.total) + '</b></div>' +
        '<div class="kv"><span>Paid' + (b.pay_method ? ' · ' + esc(b.pay_method) : '') + (b.pay_ref ? ' · <span class="small muted">' + esc(b.pay_ref) + '</span>' : '') + '</span><b>' + inr(b.paid) + '</b></div>' +
        (b.refunded ? '<div class="kv"><span>Refunded</span><b>' + inr(b.refunded) + '</b></div>' : '') +
        '<div class="kv"><span>Balance at jetty</span><b>' + inr(b.status === 'cancelled' ? 0 : b.balance) + '</b></div></div>' +
        '<label class="f">Internal note<textarea class="input" id="note" placeholder="e.g. first-timers, wants photos">' + esc(b.note) + '</textarea></label>' +
        '<div id="act"></div>' +
        (b.status === 'cancelled' ? '' :
          '<div class="grid2">' +
          '<button class="btn" data-a="reschedule">Reschedule</button>' +
          '<button class="btn" data-a="checkin">' + (b.checked_in ? 'Undo check-in' : 'Mark checked-in') + '</button>' +
          (b.balance > 0 && b.status === 'confirmed' ? '<button class="btn" data-a="balance">Mark balance paid</button>' : '') +
          (b.status === 'pending' ? '<button class="btn" data-a="confirm">Mark as confirmed</button>' : '') +
          '<button class="btn danger" data-a="cancel">Cancel / refund</button></div>') +
        '<div class="grid2">' +
        (b.phone ? '<a class="btn sm" target="_blank" rel="noopener" href="' + esc(waUrl(b.phone, waBase + 'thank you for kayaking with us! Could you leave a quick review? ' + origin + r.reviewUrl)) + '">Send review link</a>' : '') +
        '<a class="btn sm" target="_blank" rel="noopener" href="' + esc(r.confirmUrl) + '">Open guest page ↗</a>' +
        (b.phone && b.status === 'confirmed' ? '<a class="btn sm" target="_blank" rel="noopener" href="' + esc(waUrl(b.phone, waBase + 'your kayaking booking ' + b.code + ' is confirmed: ' + b.session_name + ', ' + b.date_label + ' ' + b.time_label + '. Meet at ' + (st.meeting_point || '') + '. Details: ' + origin + r.confirmUrl)) + '">Send confirmation</a>' : '') +
        '</div>';

      $('#note', d.body).onchange = function (e) {
        api('/bookings/' + b.id, { method: 'PATCH', body: { note: e.target.value } }).then(function () { toast('Note saved'); }).catch(fail);
      };
      d.body.onclick = function (e) {
        var a = e.target.closest('[data-a]');
        if (!a) return;
        var act = a.getAttribute('data-a');
        var box = $('#act', d.body);
        if (act === 'checkin') patch({ checked_in: !b.checked_in }, b.checked_in ? 'Check-in undone' : 'Checked in');
        else if (act === 'confirm') patch({ confirm: true }, 'Booking confirmed');
        else if (act === 'balance') {
          box.innerHTML = '<div class="inline-form"><b>Collect ' + inr(b.balance) + '</b><div class="row wrap">' +
            ['cash', 'upi', 'card'].map(function (m, i) { return '<label class="check"><input type="radio" name="m" value="' + m + '"' + (i === 0 ? ' checked' : '') + '>' + m.toUpperCase() + '</label>'; }).join('') +
            '</div><button class="btn primary" data-a="balance-save">Mark ' + inr(b.balance) + ' as paid</button></div>';
        } else if (act === 'balance-save') {
          patch({ balance_paid: true, method: ($('input[name=m]:checked', box) || {}).value }, 'Balance marked paid');
        } else if (act === 'reschedule') {
          box.innerHTML = '<div class="inline-form"><b>Move to</b><div class="grid2"><label class="f">Session<select class="input" id="rsS">' +
            ctx.catalog.sessions.map(function (s) { return '<option value="' + s.id + '"' + (s.id === b.session_id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') +
            '</select></label><label class="f">Date<input class="input" type="date" id="rsD" value="' + b.date + '"></label></div>' +
            '<label class="f">Slot<select class="input" id="rsT"></select></label><div class="err" id="rsErr"></div>' +
            '<button class="btn primary" data-a="reschedule-save">Save new time</button></div>';
          var fill = function () { fillSlots($('#rsT', box), $('#rsS', box).value, $('#rsD', box).value, b.time, b.id); };
          $('#rsS', box).onchange = fill; $('#rsD', box).onchange = fill; fill();
        } else if (act === 'reschedule-save' || act === 'reschedule-force') {
          var body = { session: $('#rsS', box).value, date: $('#rsD', box).value, time: $('#rsT', box).value, force: act === 'reschedule-force' };
          api('/bookings/' + b.id + '/reschedule', { body: body }).then(function (res) {
            var nb = res.booking;
            toast('Rescheduled');
            onChange && onChange();
            render({ booking: nb, reviewUrl: r.reviewUrl, confirmUrl: r.confirmUrl });
            if (nb.phone) {
              $('#act', d.body).innerHTML = '<div class="inline-form"><b>Tell the guest</b><a class="btn wa" target="_blank" rel="noopener" href="' +
                esc(waUrl(nb.phone, waBase + 'your kayaking booking ' + nb.code + ' has been moved to ' + nb.session_name + ', ' + nb.date_label + ' at ' + nb.time_label + '. Details: ' + origin + r.confirmUrl)) +
                '">' + ICON.wa + ' Send new time on WhatsApp</a></div>';
            }
          }).catch(function (err) {
            $('#rsErr', box).innerHTML = esc(err.message) + (err.data && err.data.canForce ? ' <button class="btn sm" data-a="reschedule-force">Overbook anyway</button>' : '');
          });
        } else if (act === 'cancel') {
          var canGateway = ctx.stats.paymentMode === 'razorpay' && /^pay_/.test(b.pay_ref);
          box.innerHTML = '<div class="inline-form"><b>Cancel booking</b><label class="f">Refund amount<span class="hint">Paid so far: ' + inr(b.paid) + '</span>' +
            '<input class="input" type="number" id="rf" min="0" max="' + b.paid + '" value="' + b.paid + '"></label>' +
            (canGateway ? '<label class="check"><input type="checkbox" id="rfGw" checked> Refund through Razorpay automatically</label>' : '<span class="muted small">Refund the guest yourself (UPI / cash). This records the amount.</span>') +
            '<label class="f">Reason<input class="input" id="rfWhy" placeholder="e.g. guest request, weather"></label>' +
            '<button class="btn danger" data-a="cancel-save">Cancel booking</button></div>';
        } else if (act === 'cancel-save') {
          if (!confirm('Cancel booking ' + b.code + '?')) return;
          var gw = $('#rfGw', box);
          api('/bookings/' + b.id + '/cancel', { body: { refund: $('#rf', box).value, reason: $('#rfWhy', box).value, viaGateway: gw ? gw.checked : false } })
            .then(function (res) { toast('Booking cancelled'); onChange && onChange(); render({ booking: res.booking, reviewUrl: r.reviewUrl, confirmUrl: r.confirmUrl }); })
            .catch(fail);
        }
      };
      function patch(body, msg) {
        api('/bookings/' + b.id, { method: 'PATCH', body: body }).then(function (res) {
          toast(msg); onChange && onChange(); render({ booking: res.booking, reviewUrl: r.reviewUrl, confirmUrl: r.confirmUrl });
        }).catch(fail);
      }
    }
    load();
  }

  function fillSlots(select, sessionId, date, current, exclude) {
    if (!date) { select.innerHTML = '<option value="">Pick a date</option>'; return Promise.resolve(); }
    return api('/slots?session=' + sessionId + '&date=' + date + (exclude ? '&exclude=' + exclude : '')).then(function (d) {
      select.innerHTML = d.slots.map(function (s) {
        var left = s.capacity - s.taken;
        return '<option value="' + s.time + '"' + (s.time === current ? ' selected' : '') + '>' + s.label + ' · ' +
          (s.closed ? 'CLOSED (' + esc(s.reason) + ')' : left + ' of ' + s.capacity + ' seats free') + '</option>';
      }).join('') || '<option value="">No slots</option>';
    }).catch(fail);
  }

  function walkinModal(pre, onDone) {
    var sessions = ctx.catalog.sessions.filter(function (s) { return s.active; });
    var m = modal('Add walk-in / phone booking',
      '<form id="wk" class="stack">' +
      '<div class="grid2"><label class="f">Session<select class="input" name="session">' + sessions.map(function (s) { return '<option value="' + s.id + '"' + (String(pre.session) === String(s.id) ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f">Date<input class="input" type="date" name="date" value="' + (pre.date || todayIST()) + '" required></label></div>' +
      '<label class="f">Slot<select class="input" name="time"></select></label>' +
      '<div class="grid3"><label class="f">Adults<input class="input" type="number" name="adults" min="0" value="2"></label><label class="f">Kids<input class="input" type="number" name="kids" min="0" value="0"></label>' +
      '<label class="f">Source<select class="input" name="source"><option value="walkin">Walk-in</option><option value="phone">Phone / WhatsApp</option></select></label></div>' +
      '<div class="grid2"><label class="f">Guest name<input class="input" name="name" placeholder="Walk-in"></label><label class="f">Phone<input class="input" name="phone" type="tel"></label></div>' +
      '<div class="grid3"><label class="f">Total (₹)<input class="input" type="number" name="total" min="0"></label><label class="f">Paid now (₹)<input class="input" type="number" name="paid" min="0" value="0"></label>' +
      '<label class="f">Method<select class="input" name="method"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option></select></label></div>' +
      '<label class="f">Note<input class="input" name="note"></label><div class="err" id="wkErr"></div></form>',
      '<button class="btn" data-close>Cancel</button><button class="btn primary" id="wkSave">Add booking</button>');
    var f = $('#wk', m.el);
    var priceFor = function () {
      var s = sessions.find(function (x) { return String(x.id) === f.session.value; });
      if (s) f.total.value = (Number(f.adults.value) || 0) * s.price + (Number(f.kids.value) || 0) * s.child_price;
    };
    var fill = function () { fillSlots(f.time, f.session.value, f.date.value, pre.time); };
    f.session.onchange = function () { fill(); priceFor(); };
    f.date.onchange = fill;
    f.adults.oninput = priceFor; f.kids.oninput = priceFor;
    fill(); priceFor();
    function save(force) {
      var body = formData(f); body.force = !!force;
      api('/bookings', { body: body }).then(function (r) { toast(r.booking.code + ' added'); m.close(); onDone && onDone(r.booking); })
        .catch(function (err) {
          $('#wkErr', m.el).innerHTML = esc(err.message) + (err.data && err.data.canForce ? ' <button type="button" class="btn sm" id="wkForce">Overbook anyway</button>' : '');
          var fb = $('#wkForce', m.el); if (fb) fb.onclick = function () { save(true); };
        });
    }
    $('#wkSave', m.el).onclick = function () { save(false); };
    f.onsubmit = function (e) { e.preventDefault(); save(false); };
  }

  // ======================================================================
  // CALENDAR & SLOTS (3e)
  // ======================================================================
  var cal = { session: '', start: '' };
  function viewCalendar() {
    var v = shell('calendar', 'Calendar & slots', '<button class="btn" data-week="prev" aria-label="Previous week">‹</button><button class="btn" data-week="this">This week</button><button class="btn" data-week="next" aria-label="Next week">›</button><button class="btn primary" data-block>Block dates</button>');
    v.innerHTML = '<div class="page"><div class="row wrap" id="sessTabs"></div><div class="card pad" id="grid"><div class="empty">Loading…</div></div>' +
      '<div class="card pad"><h2>Upcoming closures</h2><div id="closures"></div></div>' +
      '<div class="card pad"><h2>Sessions &amp; prices</h2><div id="sessQuick"></div></div></div>';
    if (!cal.session && ctx.catalog.sessions[0]) cal.session = String(ctx.catalog.sessions[0].id);
    $('#sessTabs').innerHTML = ctx.catalog.sessions.map(function (s) {
      return '<button class="chip' + (String(s.id) === cal.session ? ' on' : '') + '" data-sess="' + s.id + '">' + esc(s.name) + (s.active ? '' : ' (off)') + '</button>';
    }).join('');
    $('#sessQuick').innerHTML = ctx.catalog.sessions.map(function (s) {
      return '<div class="list-row"><b style="flex:1">' + esc(s.name) + ' · ' + esc(s.duration) + '</b><span>' + inr(s.price) + '</span><span class="muted">' + s.capacity + ' seats</span><span class="tag">' + (s.active ? 'On' : 'Off') + '</span></div>';
    }).join('') + '<div class="list-row"><span style="flex:1">Add-ons · Promo codes · Advance %</span><a href="#/sessions">Edit ›</a></div>';
    var data;
    function load() {
      api('/calendar?session=' + cal.session + (cal.start ? '&start=' + cal.start : '')).then(function (d) {
        data = d; cal.start = d.start;
        var cols = d.days.length;
        var h = '<div class="cal" style="grid-template-columns:70px repeat(' + cols + ', minmax(0,1fr))"><span></span>' +
          d.days.map(function (x) { return '<div class="hd' + (x.date === d.today ? ' today' : '') + '">' + esc(x.label) + '<small>' + esc(x.day) + '</small></div>'; }).join('');
        if (!d.rows.length) h += '<div class="empty" style="grid-column:1/-1">This session has no slot times. Add them under Sessions &amp; prices.</div>';
        d.rows.forEach(function (r, ri) {
          h += '<span class="t">' + esc(r.label) + '</span>';
          r.cells.forEach(function (c, ci) {
            var cls = c.closure ? 'closed' : c.booked >= c.capacity ? 'full' : c.booked > 0 ? 'some' : '';
            if (c.date < d.today) cls += ' past';
            h += '<button class="cell ' + cls + '" data-cell="' + ri + ':' + ci + '" aria-label="' + esc(fmtDate(c.date) + ' ' + r.label + ': ' + (c.closure ? 'closed' : c.booked + ' of ' + c.capacity + ' booked')) + '">' +
              (c.closure ? 'Closed<small>' + esc(c.closure.reason) + '</small>' : c.booked + '/' + c.capacity) + '</button>';
          });
        });
        h += '</div><p class="muted small" style="margin:12px 0 0">Cell = booked / capacity. Click a slot to close it (e.g. rough sea) or see its guests.</p>';
        $('#grid').innerHTML = h;
        $('#closures').innerHTML = d.closures.length ? d.closures.map(function (c) {
          return '<div class="list-row"><b>' + esc(fmtDate(c.date)) + '</b><span>' + (c.time ? esc(fmtTime(c.time)) : 'All day') + ' · ' + esc(c.session_name || 'All sessions') + '</span><span class="muted" style="flex:1">' + esc(c.reason) + '</span><button class="btn sm" data-reopen="' + c.id + '">Reopen</button></div>';
        }).join('') : '<div class="muted">No closures. All slots are open.</div>';
      }).catch(fail);
    }
    load();
    v.onclick = function (e) {
      var el;
      if ((el = e.target.closest('[data-sess]'))) { cal.session = el.getAttribute('data-sess'); viewCalendar(); }
      else if ((el = e.target.closest('[data-reopen]'))) { api('/closures/' + el.getAttribute('data-reopen'), { method: 'DELETE' }).then(function () { toast('Reopened'); load(); }).catch(fail); }
      else if ((el = e.target.closest('[data-cell]'))) {
        var p = el.getAttribute('data-cell').split(':').map(Number);
        slotModal(data, data.rows[p[0]], data.rows[p[0]].cells[p[1]], load);
      }
    };
    $$('[data-week]').forEach(function (b) {
      b.onclick = function () { var w = b.getAttribute('data-week'); cal.start = w === 'prev' ? data.prev : w === 'next' ? data.next : ''; load(); };
    });
    $('[data-block]').onclick = function () { blockModal(load); };
  }

  function affectedHtml(list, reason) {
    if (!list.length) return '<p class="muted">No confirmed guests were booked in the closed slot(s).</p>';
    var origin = location.origin;
    return '<p><b>' + list.length + ' booking' + (list.length > 1 ? 's' : '') + ' affected.</b> Message each guest to reschedule or refund:</p>' + list.map(function (b) {
      var msg = 'Hi ' + b.name.split(' ')[0] + ', sorry! Your ' + b.session_name + ' kayaking on ' + b.date_label + ' at ' + b.time_label + ' (' + b.code + ') is cancelled due to ' + (reason || 'weather').toLowerCase() + '. Reply with a new date and we will move you for free, or we can refund you in full.';
      return '<div class="list-row"><span style="flex:1"><b>' + esc(b.name) + '</b> · ' + b.pax + ' pax · ' + esc(b.time_label) + '</span>' + (b.phone ? '<a class="btn sm wa" target="_blank" rel="noopener" href="' + esc(waUrl(b.phone, msg)) + '">' + ICON.wa + ' Notify</a>' : '<span class="muted small">no phone</span>') + '</div>';
    }).join('');
  }

  function slotModal(d, row, c, reload) {
    var title = d.session.name + ' · ' + fmtDate(c.date) + ' · ' + row.label;
    var m = modal(title,
      '<p><b>' + c.booked + ' of ' + c.capacity + '</b> seats booked.</p>' +
      (c.closure
        ? '<p>Closed: <b>' + esc(c.closure.reason) + '</b>' + (c.closure.time ? '' : ' (whole day)') + (c.closure.session_id ? '' : ' (all sessions)') + '</p><button class="btn" id="reopen">Reopen</button>'
        : '<label class="f">Close this slot because<input class="input" id="why" value="Rough sea"></label><button class="btn danger" id="close">Close slot &amp; list guests to notify</button>') +
      '<button class="btn" id="seeGuests">See guests in this slot</button><div id="aff"></div>');
    $('#seeGuests', m.el).onclick = function () {
      bk.range = 'custom'; bk.from = c.date; bk.to = c.date; bk.session = String(d.session.id); bk.time = row.time; bk.status = '';
      m.close(); location.hash = '#/bookings';
    };
    var rb = $('#reopen', m.el);
    if (rb) rb.onclick = function () { api('/closures/' + c.closure.id, { method: 'DELETE' }).then(function () { toast('Slot reopened'); m.close(); reload(); }).catch(fail); };
    var cb = $('#close', m.el);
    if (cb) cb.onclick = function () {
      var reason = $('#why', m.el).value;
      api('/closures', { body: { date: c.date, session_id: d.session.id, time: row.time, reason: reason } }).then(function (r) {
        toast('Slot closed'); reload();
        cb.remove(); $('#why', m.el).closest('label').remove();
        $('#aff', m.el).innerHTML = affectedHtml(r.affected, reason);
      }).catch(fail);
    };
  }

  function blockModal(reload) {
    var t = todayIST();
    var m = modal('Block dates',
      '<form id="bl" class="stack"><div class="grid2"><label class="f">From<input class="input" type="date" name="date" value="' + t + '" required></label><label class="f">To<input class="input" type="date" name="to" value="' + t + '"></label></div>' +
      '<label class="f">Sessions<select class="input" name="session_id"><option value="">All sessions</option>' + ctx.catalog.sessions.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f">Reason<input class="input" name="reason" value="Rough sea"></label></form><div id="aff"></div>',
      '<button class="btn" data-close>Close</button><button class="btn danger" id="blSave">Block dates</button>');
    $('#blSave', m.el).onclick = function () {
      var body = formData($('#bl', m.el));
      api('/closures', { body: body }).then(function (r) {
        toast('Dates blocked'); reload();
        $('#blSave', m.el).remove();
        $('#aff', m.el).innerHTML = affectedHtml(r.affected, body.reason);
      }).catch(fail);
    };
  }

  // ======================================================================
  // SESSIONS, ADD-ONS, PROMOS, BOOKING RULES
  // ======================================================================
  function viewSessions() {
    var v = shell('sessions', 'Sessions & prices', '<button class="btn primary" data-newsess>+ New session</button>');
    loadCatalog().then(function (c) {
      var st = ctx.settings;
      v.innerHTML = '<div class="page">' +
        '<p class="muted" style="margin:0">Price and seat changes go live on the website instantly. Each session card links straight from ads: <code>' + esc(location.origin) + '/#&lt;link-name&gt;</code> or open booking with <code>/?book=&lt;link-name&gt;</code>.</p>' +
        c.sessions.map(sessionCard).join('') +
        '<div class="card pad"><h2>Booking rules</h2><form id="rules" class="stack"><div class="grid2">' +
        '<label class="f">Advance to pay online (%)<input class="input" type="number" min="0" max="100" name="advance_percent" value="' + esc(st.advance_percent) + '"></label>' +
        '<label class="f">Single kayak surcharge (₹ per adult)<input class="input" type="number" min="0" name="single_kayak_price" value="' + esc(st.single_kayak_price) + '"></label>' +
        '<label class="f">Bookable days ahead<input class="input" type="number" min="1" name="booking_window_days" value="' + esc(st.booking_window_days) + '"></label>' +
        '<label class="f">Stop online booking (hours before slot)<input class="input" type="number" min="0" name="cutoff_hours" value="' + esc(st.cutoff_hours) + '"></label>' +
        '</div><div><button class="btn primary" type="submit">Save rules</button></div></form></div>' +
        '<div class="card pad"><h2>Add-ons</h2><div id="addons">' + c.addons.map(addonRow).join('') + '</div>' +
        '<div class="list-row"><input class="input" id="naName" placeholder="New add-on name" style="flex:2"><input class="input" id="naPrice" type="number" placeholder="₹" style="width:90px">' +
        '<select class="input" id="naPer" style="width:auto"><option value="booking">per booking</option><option value="person">per person</option></select><button class="btn" data-addadd>Add</button></div></div>' +
        '<div class="card pad"><h2>Promo codes</h2>' + c.promos.map(function (p) {
          return '<div class="list-row"><b style="flex:1">' + esc(p.code) + '</b><span>' + p.percent_off + '% off</span><label class="switch" title="Active"><input type="checkbox" data-promo="' + p.id + '"' + (p.active ? ' checked' : '') + ' aria-label="Active"><i></i></label><button class="btn sm danger" data-delpromo="' + p.id + '">Delete</button></div>';
        }).join('') +
        '<div class="list-row"><input class="input" id="npCode" placeholder="CODE" style="flex:1;text-transform:uppercase"><input class="input" id="npPct" type="number" placeholder="% off" style="width:90px"><button class="btn" data-addpromo>Add</button></div></div>' +
        '</div>';

      $('#rules').onsubmit = function (e) { e.preventDefault(); saveSettings(formData(e.target)); };
      $$('form.sess', v).forEach(function (f) {
        f.onsubmit = function (e) {
          e.preventDefault();
          var id = f.getAttribute('data-id');
          api('/sessions/' + id, { method: 'PUT', body: formData(f) }).then(function () { toast('Session saved'); loadCatalog(); }).catch(fail);
        };
      });
    }).catch(fail);

    v.onclick = function (e) {
      var el;
      if ((el = e.target.closest('[data-delsess]'))) {
        if (!confirm('Delete this session?')) return;
        api('/sessions/' + el.getAttribute('data-delsess'), { method: 'DELETE' }).then(function () { toast('Deleted'); viewSessions(); }).catch(fail);
      } else if ((el = e.target.closest('[data-saveaddon]'))) {
        var row = el.closest('.list-row');
        var body = { name: $('[name=name]', row).value, price: $('[name=price]', row).value, per: $('[name=per]', row).value, needs_hotel: $('[name=needs_hotel]', row).checked, active: $('[name=active]', row).checked };
        api('/addons/' + el.getAttribute('data-saveaddon'), { method: 'PUT', body: body }).then(function () { toast('Add-on saved'); }).catch(fail);
      } else if ((el = e.target.closest('[data-deladdon]'))) {
        api('/addons/' + el.getAttribute('data-deladdon'), { method: 'DELETE' }).then(viewSessions).catch(fail);
      } else if (e.target.closest('[data-addadd]')) {
        api('/addons', { body: { name: $('#naName').value, price: $('#naPrice').value, per: $('#naPer').value } }).then(viewSessions).catch(fail);
      } else if (e.target.closest('[data-addpromo]')) {
        api('/promos', { body: { code: $('#npCode').value, percent_off: $('#npPct').value } }).then(viewSessions).catch(fail);
      } else if ((el = e.target.closest('[data-delpromo]'))) {
        api('/promos/' + el.getAttribute('data-delpromo'), { method: 'DELETE' }).then(viewSessions).catch(fail);
      }
    };
    v.onchange = function (e) {
      var p = e.target.getAttribute('data-promo');
      if (p) api('/promos/' + p, { method: 'PATCH', body: { active: e.target.checked } }).then(function () { toast('Saved'); }).catch(fail);
    };
    $('[data-newsess]').onclick = function () {
      var m = modal('New session', '<form id="ns" class="stack"><label class="f">Name<input class="input" name="name" required placeholder="e.g. Night bioluminescence paddle"></label>' +
        '<div class="grid3"><label class="f">Price (₹)<input class="input" type="number" name="price" required></label><label class="f">Seats per slot<input class="input" type="number" name="capacity" value="10"></label><label class="f">Duration<input class="input" name="duration" placeholder="1.5 hr"></label></div>' +
        '<label class="f">Slot times<span class="hint">24-hour, comma separated, e.g. 07:00, 09:30, 15:00</span><input class="input" name="slot_times"></label></form>',
        '<button class="btn" data-close>Cancel</button><button class="btn primary" id="nsSave">Create</button>');
      $('#nsSave', m.el).onclick = function () {
        var b = formData($('#ns', m.el)); b.active = false;
        api('/sessions', { body: b }).then(function () { toast('Session created (switched off until you turn it on)'); m.close(); viewSessions(); }).catch(fail);
      };
    };
  }

  function sessionCard(s) {
    return '<form class="card sess" data-id="' + s.id + '"><div class="sess-top"><h3>' + esc(s.name) + '</h3><label class="check"><span class="switch"><input type="checkbox" name="active"' + (s.active ? ' checked' : '') + ' aria-label="Bookable"><i></i></span>' + (s.active ? 'On' : 'Off') + '</label></div>' +
      '<div class="sess-fields">' +
      '<label class="f wide">Name<input class="input" name="name" value="' + esc(s.name) + '"></label>' +
      '<label class="f">Link name<input class="input" name="slug" value="' + esc(s.slug) + '"></label>' +
      '<label class="f">Duration<input class="input" name="duration" value="' + esc(s.duration) + '"></label>' +
      '<label class="f">Adult price (₹)<input class="input" type="number" name="price" value="' + s.price + '"></label>' +
      '<label class="f">Kid price (₹)<input class="input" type="number" name="child_price" value="' + s.child_price + '"></label>' +
      '<label class="f">Seats per slot<input class="input" type="number" name="capacity" value="' + s.capacity + '"></label>' +
      '<label class="f">Report minutes before<input class="input" type="number" name="report_minutes" value="' + s.report_minutes + '"></label>' +
      '<label class="f wide">Slot times<span class="hint">24-hour, comma separated</span><input class="input" name="slot_times" value="' + esc(s.slot_times.join(', ')) + '"></label>' +
      '<label class="f">Badge<input class="input" name="badge" value="' + esc(s.badge) + '" placeholder="e.g. Most booked"></label>' +
      '<label class="f">Min. age<input class="input" type="number" name="min_age" value="' + s.min_age + '"></label>' +
      '<label class="f full">Short line<input class="input" name="tagline" value="' + esc(s.tagline) + '"></label>' +
      '<label class="f full">Description<textarea class="input" name="description" rows="2">' + esc(s.description) + '</textarea></label>' +
      '<label class="check"><input type="checkbox" name="sees_coral"' + (s.sees_coral ? ' checked' : '') + '> See coral</label>' +
      '<label class="f">Order<input class="input" type="number" name="sort" value="' + s.sort + '"></label>' +
      '</div><div class="row"><button class="btn primary" type="submit">Save</button><span class="spacer"></span><button class="btn danger sm" type="button" data-delsess="' + s.id + '">Delete</button></div></form>';
  }
  function addonRow(a) {
    return '<div class="list-row"><input class="input" name="name" value="' + esc(a.name) + '" style="flex:2" aria-label="Name"><input class="input" name="price" type="number" value="' + a.price + '" style="width:90px" aria-label="Price">' +
      '<select class="input" name="per" style="width:auto" aria-label="Charged"><option value="booking"' + (a.per === 'booking' ? ' selected' : '') + '>per booking</option><option value="person"' + (a.per === 'person' ? ' selected' : '') + '>per person</option></select>' +
      '<label class="check small" title="Ask for hotel name"><input type="checkbox" name="needs_hotel"' + (a.needs_hotel ? ' checked' : '') + '>Hotel</label>' +
      '<label class="switch" title="Active"><input type="checkbox" name="active"' + (a.active ? ' checked' : '') + ' aria-label="Active"><i></i></label>' +
      '<button class="btn sm" data-saveaddon="' + a.id + '">Save</button><button class="btn sm danger" data-deladdon="' + a.id + '" aria-label="Delete">✕</button></div>';
  }

  function saveSettings(body) {
    return api('/settings', { method: 'PUT', body: body }).then(function () { toast('Saved'); return loadSettings(); }).catch(fail);
  }

  // ======================================================================
  // PHOTOS (3c)
  // ======================================================================
  var ph = { filter: 'all' };
  function placementLabel(p, sessions) {
    if (p === 'hero') return 'Hero';
    if (p === 'gallery') return 'Gallery';
    var s = sessions.find(function (x) { return 'session:' + x.id === p; });
    return s ? s.name + ' card' : 'Session card';
  }
  function viewPhotos() {
    var v = shell('photos', 'Photos', '<label class="btn primary">Upload<input type="file" id="up" multiple accept="image/*,video/mp4,video/webm,video/quicktime" class="hidden"></label>');
    v.innerHTML = '<div class="page"><div class="card pad stack">' +
      '<div class="dropzone" id="drop">Drag photos / videos here, or use Upload. Photos are compressed automatically for fast mobile loading.</div>' +
      '<div class="row wrap"><span class="small"><b>Upload to:</b></span><select class="input" id="upTo" style="width:auto"></select><span class="spacer"></span><span id="filters" class="row wrap"></span></div>' +
      '</div><div id="grid" class="photos"></div><p class="muted small" id="hint"></p></div>';
    var data;
    function load() {
      api('/photos').then(function (d) {
        data = d;
        var opts = [['hero', 'Hero (top of page)'], ['gallery', 'Gallery']].concat(d.sessions.map(function (s) { return ['session:' + s.id, s.name + ' card']; }));
        var upTo = $('#upTo');
        var keep = upTo.value;
        upTo.innerHTML = opts.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + '</option>'; }).join('');
        upTo.value = keep || (ph.filter !== 'all' && ph.filter !== 'hidden' && ph.filter !== 'sessions' ? ph.filter : 'gallery');
        $('#filters').innerHTML = [['all', 'All'], ['hero', 'Hero'], ['gallery', 'Gallery'], ['sessions', 'Session cards'], ['hidden', 'Hidden']].map(function (f) {
          return '<button class="chip' + (ph.filter === f[0] ? ' on' : '') + '" data-filter="' + f[0] + '">' + f[1] + '</button>';
        }).join('');
        var list = d.photos.filter(function (p) {
          if (ph.filter === 'all') return true;
          if (ph.filter === 'hidden') return !p.visible;
          if (ph.filter === 'sessions') return p.placement.indexOf('session:') === 0;
          return p.placement === ph.filter;
        });
        var canSort = ph.filter === 'hero' || ph.filter === 'gallery';
        $('#hint').textContent = canSort ? 'Drag ⋮⋮ to change the order on the website. The first hero item is the one shown.' : 'Pick Hero or Gallery above to drag photos into order.';
        $('#grid').innerHTML = list.length ? list.map(function (p) {
          var media = p.kind === 'video' ? '<video src="/uploads/' + encodeURIComponent(p.file) + '" muted preload="metadata"></video>' : '<img src="/uploads/' + encodeURIComponent(p.file) + '" alt="' + esc(p.alt) + '" loading="lazy">';
          return '<div class="ph" data-id="' + p.id + '"' + (canSort ? ' draggable="true"' : '') + '><div class="thumb">' + media +
            (canSort ? '<span class="handle" title="Drag to reorder">⋮⋮</span>' : '') + (p.kind === 'video' ? '<span class="kind">VIDEO</span>' : '') + (p.visible ? '' : '<span class="hiddenmark">HIDDEN</span>') + '</div>' +
            '<select class="input" data-place aria-label="Placement">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === p.placement ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>' +
            '<button class="alt" data-alt title="Edit alt text">' + (p.alt ? esc(p.alt) : '+ Add alt text') + '</button>' +
            '<div class="row"><label class="check small"><span class="switch"><input type="checkbox" data-vis' + (p.visible ? ' checked' : '') + ' aria-label="Show on site"><i></i></span>Show</label><span class="spacer"></span><button class="btn sm ghost" data-del aria-label="Delete">🗑</button></div></div>';
        }).join('') : '<div class="empty card" style="grid-column:1/-1">No photos here yet.</div>';
      }).catch(fail);
    }
    load();

    function upload(files) {
      if (!files.length) return;
      var fd = new FormData();
      Array.prototype.forEach.call(files, function (f) { fd.append('files', f); });
      fd.append('placement', $('#upTo').value);
      toast('Uploading ' + files.length + ' file' + (files.length > 1 ? 's' : '') + '…');
      api('/photos', { form: fd }).then(function () { toast('Uploaded'); load(); }).catch(fail);
    }
    $('#up').onchange = function (e) { upload(e.target.files); e.target.value = ''; };
    var drop = $('#drop');
    drop.ondragover = function (e) { if (e.dataTransfer.types.indexOf('Files') >= 0) { e.preventDefault(); drop.classList.add('over'); } };
    drop.ondragleave = function () { drop.classList.remove('over'); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove('over'); upload(e.dataTransfer.files); };

    v.onclick = function (e) {
      var el, card = e.target.closest('.ph'), id = card && card.getAttribute('data-id');
      if ((el = e.target.closest('[data-filter]'))) { ph.filter = el.getAttribute('data-filter'); load(); }
      else if (e.target.closest('[data-del]')) {
        if (confirm('Delete this photo from the website?')) api('/photos/' + id, { method: 'DELETE' }).then(load).catch(fail);
      } else if (e.target.closest('[data-alt]')) {
        var p = data.photos.find(function (x) { return String(x.id) === id; });
        var m = modal('Photo details', '<label class="f">Alt text<span class="hint">Describe the photo for screen readers and Google, e.g. "Two kayakers in mangrove creek"</span><input class="input" id="altIn" value="' + esc(p.alt) + '"></label>',
          '<button class="btn" data-close>Cancel</button><button class="btn primary" id="altSave">Save</button>');
        $('#altSave', m.el).onclick = function () { api('/photos/' + id, { method: 'PATCH', body: { alt: $('#altIn', m.el).value } }).then(function () { m.close(); load(); }).catch(fail); };
      }
    };
    v.onchange = function (e) {
      var card = e.target.closest('.ph'); if (!card) return;
      var id = card.getAttribute('data-id');
      if (e.target.hasAttribute('data-vis')) api('/photos/' + id, { method: 'PATCH', body: { visible: e.target.checked } }).then(function () { toast(e.target.checked ? 'Shown on site' : 'Hidden'); load(); }).catch(fail);
      if (e.target.hasAttribute('data-place')) api('/photos/' + id, { method: 'PATCH', body: { placement: e.target.value } }).then(function () { toast('Moved'); load(); }).catch(fail);
    };
    // drag to reorder
    var dragId = null;
    v.ondragstart = function (e) { var c = e.target.closest && e.target.closest('.ph'); if (!c) return; dragId = c.getAttribute('data-id'); c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; };
    v.ondragend = function () { $$('.ph', v).forEach(function (c) { c.classList.remove('dragging', 'drop-before'); }); };
    v.ondragover = function (e) {
      var c = e.target.closest && e.target.closest('.ph');
      if (!dragId || !c) return;
      e.preventDefault();
      $$('.ph', v).forEach(function (x) { x.classList.toggle('drop-before', x === c); });
    };
    v.ondrop = function (e) {
      var c = e.target.closest && e.target.closest('.ph');
      if (!dragId || !c) return;
      e.preventDefault();
      var dragged = $('.ph[data-id="' + dragId + '"]', v);
      if (dragged && dragged !== c) c.parentNode.insertBefore(dragged, c);
      dragId = null;
      var ids = $$('.ph', v).map(function (x) { return Number(x.getAttribute('data-id')); });
      api('/photos/reorder', { body: { ids: ids } }).then(function () { toast('Order saved'); }).catch(fail);
    };
  }

  // ======================================================================
  // REVIEWS (3d)
  // ======================================================================
  var rv = { status: 'pending' };
  function viewReviews() {
    var v = shell('reviews', 'Reviews', '<button class="btn" data-link>Send review link</button><button class="btn primary" data-add>+ Add review</button>');
    v.innerHTML = '<div class="page"><div class="row wrap" id="tabs"></div><div class="card" id="list"><div class="empty">Loading…</div></div>' +
      '<p class="muted small">After a trip, send guests the review link from their booking (or the general link above). New reviews land in Pending. “Feature” (★) puts a review first on the landing page.</p></div>';
    var cache = {};
    function load() {
      api('/reviews?status=' + rv.status).then(function (d) {
        var c = d.counts;
        cache = {};
        d.reviews.forEach(function (r) { cache[r.id] = r; });
        $('#tabs').innerHTML = [['pending', 'Pending'], ['live', 'Live'], ['hidden', 'Hidden']].map(function (t) {
          return '<button class="chip' + (rv.status === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + ' (' + (c[t[0]] || 0) + ')</button>';
        }).join('') + '<span class="spacer"></span><span class="muted small">' + (d.avg ? 'Avg ★ ' + d.avg + ' shown on site' : '') + '</span>';
        $('#list').innerHTML = d.reviews.length ? d.reviews.map(function (r) {
          return '<div class="rv" data-id="' + r.id + '"><div class="av">' + (r.photo ? '<img src="/uploads/' + encodeURIComponent(r.photo) + '" alt="">' : esc((r.name || '?')[0])) + '</div>' +
            '<div class="body"><div class="row wrap"><b>' + esc(r.name) + '</b>' + (r.city ? '<span class="muted">' + esc(r.city) + '</span>' : '') + '<span class="stars">' + stars(r.rating) + '</span><span class="tag">' + esc(r.source) + '</span></div>' +
            '<p>' + esc(r.text) + '</p><div class="muted small">' + esc(r.created_at.slice(0, 10)) + '</div></div>' +
            '<div class="acts">' +
            (r.status !== 'live' ? '<button class="btn sm primary" data-set="live">Approve</button>' : '<button class="feat' + (r.featured ? ' on' : '') + '" data-feat title="Feature on landing page" aria-pressed="' + !!r.featured + '">★</button>') +
            (r.status !== 'hidden' ? '<button class="btn sm" data-set="hidden">Hide</button>' : '') +
            '<button class="btn sm ghost" data-edit>Edit</button><button class="btn sm ghost" data-del>Delete</button></div></div>';
        }).join('') : '<div class="empty">No ' + rv.status + ' reviews.</div>';
        return refreshStats();
      }).catch(fail);
    }
    load();
    v.onclick = function (e) {
      var el, row = e.target.closest('.rv'), id = row && row.getAttribute('data-id');
      if ((el = e.target.closest('[data-tab]'))) { rv.status = el.getAttribute('data-tab'); load(); }
      else if ((el = e.target.closest('[data-set]'))) api('/reviews/' + id, { method: 'PATCH', body: { status: el.getAttribute('data-set') } }).then(function () { toast('Updated'); load(); }).catch(fail);
      else if ((el = e.target.closest('[data-feat]'))) api('/reviews/' + id, { method: 'PATCH', body: { featured: !el.classList.contains('on') } }).then(load).catch(fail);
      else if (e.target.closest('[data-del]')) { if (confirm('Delete this review?')) api('/reviews/' + id, { method: 'DELETE' }).then(load).catch(fail); }
      else if (e.target.closest('[data-edit]')) {
        reviewModal(cache[id], function (body) { return api('/reviews/' + id, { method: 'PATCH', body: body }); }, load);
      }
    };
    $('[data-add]').onclick = function () {
      reviewModal(null, function (body, file) {
        var fd = new FormData();
        Object.keys(body).forEach(function (k) { fd.append(k, body[k]); });
        if (file) fd.append('photo', file);
        return api('/reviews', { form: fd });
      }, function () { rv.status = 'live'; load(); });
    };
    $('[data-link]').onclick = function () {
      var url = location.origin + '/review';
      var m = modal('Review link', '<p>Share this link with guests after their trip. Reviews arrive in Pending for you to approve.</p><input class="input" readonly value="' + esc(url) + '" id="rl">' +
        '<div class="grid2"><button class="btn" id="copy">Copy link</button><a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent('Thanks for kayaking with us! We would love a quick review: ' + url) + '">' + ICON.wa + ' Share on WhatsApp</a></div>' +
        '<p class="muted small">Tip: the “Send review link” button inside each booking sends a personal link that ties the review to that trip.</p>');
      $('#copy', m.el).onclick = function () { var i = $('#rl', m.el); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.resolve(document.execCommand('copy'))).then(function () { toast('Copied'); }); };
    };
  }
  function reviewModal(r, save, done) {
    var isNew = !r;
    r = r || { name: '', city: '', rating: 5, source: 'Google', text: '' };
    var m = modal(isNew ? 'Add review' : 'Edit review',
      '<form id="rf" class="stack"><div class="grid2"><label class="f">Guest name<input class="input" name="name" value="' + esc(r.name) + '" required></label><label class="f">City<input class="input" name="city" value="' + esc(r.city) + '"></label>' +
      '<label class="f">Rating<select class="input" name="rating">' + [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '"' + (n === r.rating ? ' selected' : '') + '>' + stars(n) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f">Source<select class="input" name="source">' + ['Google', 'TripAdvisor', 'WhatsApp', 'Instagram', 'Website'].map(function (s) { return '<option' + (s === r.source ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="f">Review text<textarea class="input" name="text" rows="4" required>' + esc(r.text) + '</textarea></label>' +
      (isNew ? '<label class="f">Guest photo (optional)<input class="input" type="file" name="photo" accept="image/*"></label><label class="check"><input type="checkbox" name="featured"> Feature on landing page</label>' : '') +
      '</form>', '<button class="btn" data-close>Cancel</button><button class="btn primary" id="rfSave">Save</button>');
    $('#rfSave', m.el).onclick = function () {
      var f = $('#rf', m.el);
      var file = f.photo && f.photo.files[0];
      save(formData(f), file).then(function () { toast('Saved'); m.close(); done(); }).catch(fail);
    };
  }

  // ======================================================================
  // FAQ & TEXT
  // ======================================================================
  function viewContent() {
    var v = shell('content', 'FAQ & text');
    var st = ctx.settings;
    var field = function (k, label, hint, rows) {
      return '<label class="f">' + label + (hint ? '<span class="hint">' + hint + '</span>' : '') +
        (rows ? '<textarea class="input" name="' + k + '" rows="' + rows + '">' + esc(st[k]) + '</textarea>' : '<input class="input" name="' + k + '" value="' + esc(st[k]) + '">') + '</label>';
    };
    v.innerHTML = '<div class="page"><form class="card pad stack" id="txt"><h2>Landing page text</h2>' +
      field('brand_name', 'Business name') + field('hero_overline', 'Small line above headline') + field('hero_title', 'Headline') + field('hero_subtitle', 'Sub-headline', '', 2) +
      field('rating_text', 'Rating badge', 'Leave empty to show the average of live reviews, or type e.g. “★ 4.9 · 300+ Google reviews”') +
      '<div class="grid2">' + field('trust_points', 'Trust points', 'One per line: Title|short detail', 4) + field('how_it_works', 'How it works', 'One step per line', 4) +
      field('included', 'Included', 'One per line', 5) + field('bring_list', 'What to bring (confirmation page)', 'One per line', 5) + '</div>' +
      field('policy_text', 'Cancellation line', 'Shown in checkout and on the confirmation page') +
      '<div><button class="btn primary" type="submit">Save text</button></div></form>' +
      '<div class="card pad"><h2>FAQ</h2><div id="faqs"></div><form id="nf" class="stack" style="margin-top:12px"><b>Add a question</b><input class="input" name="q" placeholder="Question" required><textarea class="input" name="a" rows="2" placeholder="Answer" required></textarea><div><button class="btn" type="submit">Add</button></div></form></div></div>';
    $('#txt').onsubmit = function (e) { e.preventDefault(); saveSettings(formData(e.target)); };
    function load() {
      api('/faqs').then(function (d) {
        $('#faqs').innerHTML = d.faqs.map(function (f, i) {
          return '<div class="list-row" data-id="' + f.id + '" style="align-items:flex-start"><div class="stack" style="flex:1;gap:6px"><input class="input" name="q" value="' + esc(f.q) + '" aria-label="Question"><textarea class="input" name="a" rows="2" aria-label="Answer">' + esc(f.a) + '</textarea></div>' +
            '<div class="stack" style="gap:4px"><button class="btn sm" data-up' + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">↑</button><button class="btn sm" data-down' + (i === d.faqs.length - 1 ? ' disabled' : '') + ' aria-label="Move down">↓</button></div>' +
            '<div class="stack" style="gap:4px"><button class="btn sm primary" data-save>Save</button><button class="btn sm danger" data-del>Delete</button></div></div>';
        }).join('') || '<div class="muted">No questions yet.</div>';
      }).catch(fail);
    }
    load();
    $('#nf').onsubmit = function (e) { e.preventDefault(); api('/faqs', { body: formData(e.target) }).then(function () { e.target.reset(); toast('Added'); load(); }).catch(fail); };
    $('#faqs').onclick = function (e) {
      var row = e.target.closest('.list-row'); if (!row) return;
      var id = row.getAttribute('data-id');
      if (e.target.closest('[data-save]')) api('/faqs/' + id, { method: 'PUT', body: { q: $('[name=q]', row).value, a: $('[name=a]', row).value } }).then(function () { toast('Saved'); }).catch(fail);
      else if (e.target.closest('[data-del]')) { if (confirm('Delete this question?')) api('/faqs/' + id, { method: 'DELETE' }).then(load).catch(fail); }
      else if (e.target.closest('[data-up]') || e.target.closest('[data-down]')) {
        var rows = $$('.list-row', $('#faqs'));
        var i = rows.indexOf(row);
        var j = e.target.closest('[data-up]') ? i - 1 : i + 1;
        var ids = rows.map(function (r) { return Number(r.getAttribute('data-id')); });
        var t = ids[i]; ids[i] = ids[j]; ids[j] = t;
        api('/faqs/reorder', { body: { ids: ids } }).then(load).catch(fail);
      }
    };
  }

  // ======================================================================
  // SETTINGS
  // ======================================================================
  function viewSettings() {
    var v = shell('settings', 'Settings');
    loadSettings().then(function (meta) {
      var st = meta.settings;
      var f = function (k, label, hint, type) {
        return '<label class="f">' + label + (hint ? '<span class="hint">' + hint + '</span>' : '') + '<input class="input" name="' + k + '" type="' + (type || 'text') + '" value="' + esc(st[k]) + '" autocomplete="off"></label>';
      };
      v.innerHTML = '<div class="page">' +
        '<form class="card pad stack" data-settings><h2>Contact &amp; meeting point</h2><div class="grid2">' +
        f('whatsapp', 'WhatsApp number', 'With country code, digits only, e.g. 919876543210') + f('phone', 'Phone (shown on site)') + f('email', 'Email (optional)') +
        f('map_query', 'Google Maps search for the jetty') + '</div>' + f('meeting_point', 'Meeting point (shown to guests)') +
        '<div><button class="btn primary" type="submit">Save</button></div></form>' +
        '<form class="card pad stack" data-settings><h2>Payments · Razorpay</h2>' +
        '<p class="muted" style="margin:0">Status: <b>' + (meta.paymentMode === 'razorpay' ? 'Live payments on' : 'Test mode (payments simulated)') + '</b>' + (meta.envPayment ? ' · keys set by the server environment' : '') + '. Get keys from Razorpay Dashboard → Account &amp; Settings → API Keys. Use <i>rzp_test_…</i> keys first to try it.</p>' +
        '<div class="grid2">' + f('razorpay_key_id', 'Key ID') + f('razorpay_key_secret', 'Key secret', 'Stored on the server, never shown on the website', 'password') + '</div>' +
        '<div><button class="btn primary" type="submit">Save</button></div></form>' +
        '<form class="card pad stack" data-settings><h2>Ad tracking</h2>' +
        '<label class="f">Tracking code in &lt;head&gt;<span class="hint">Paste the Google Ads / Google tag (gtag.js) or Meta Pixel base code. Loaded on every public page.</span><textarea class="input" name="head_code" rows="4" spellcheck="false">' + esc(st.head_code) + '</textarea></label>' +
        '<label class="f">Conversion code<span class="hint">Runs once on the booking confirmation page. <code>window.__conversion</code> holds { code, value, total, currency }. A <code>booking_confirmed</code> dataLayer event and Meta <code>Purchase</code> also fire automatically.</span><textarea class="input" name="conversion_code" rows="4" spellcheck="false">' + esc(st.conversion_code) + '</textarea></label>' +
        '<div><button class="btn primary" type="submit">Save</button></div></form>' +
        '<form class="card pad stack" id="pw"><h2>Change admin password</h2><div class="grid2"><label class="f">Current password<input class="input" type="password" name="current" autocomplete="current-password"></label>' +
        '<label class="f">New password<span class="hint">At least 8 characters</span><input class="input" type="password" name="next" autocomplete="new-password"></label></div><div><button class="btn" type="submit">Change password</button></div></form>' +
        '</div>';
      $$('form[data-settings]', v).forEach(function (fm) {
        fm.onsubmit = function (e) { e.preventDefault(); saveSettings(formData(fm)).then(function () { return refreshStats(); }).then(viewSettings); };
      });
      $('#pw').onsubmit = function (e) {
        e.preventDefault();
        api('/password', { body: formData(e.target) }).then(function () { toast('Password changed. Please log in again.'); showLogin(); }).catch(fail);
      };
    }).catch(fail);
  }

  // ======================================================================
  // JETTY CHECK-IN — phone view (3f)
  // ======================================================================
  var jt = { date: '', key: '' };
  function viewJetty() {
    var v = shell('jetty', '');
    jt.date = jt.date || todayIST();
    v.innerHTML = '<div class="jetty"><div class="row"><button class="btn sm" data-day="-1" aria-label="Previous day">‹</button><div class="ov" style="flex:1;text-align:center" id="jDate"></div><button class="btn sm" data-day="1" aria-label="Next day">›</button></div>' +
      '<div class="slots" id="jSlots"></div><div id="jList" class="stack"></div></div>' +
      '<div class="jetty-bar"><button class="btn" data-walk>+ Walk-in</button><label class="btn primary">Upload photos<input type="file" id="jUp" multiple accept="image/*,video/*" class="hidden"></label></div>';
    var rows = [];
    function load() {
      $('#jDate').textContent = (jt.date === todayIST() ? 'Today · ' : '') + fmtDate(jt.date);
      api('/bookings?from=' + jt.date + '&to=' + jt.date).then(function (d) {
        rows = d.bookings.filter(function (b) { return b.status === 'confirmed'; });
        var slots = [];
        ctx.catalog.sessions.forEach(function (s) {
          s.slot_times.forEach(function (t) {
            var list = rows.filter(function (b) { return b.session_id === s.id && b.time === t; });
            if (list.length || s.active) slots.push({ key: s.id + '|' + t, time: t, s: s, pax: list.reduce(function (a, b) { return a + b.pax; }, 0) });
          });
        });
        slots.sort(function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : 0; });
        var withGuests = slots.filter(function (x) { return x.pax > 0; });
        if (!slots.some(function (x) { return x.key === jt.key; })) jt.key = (withGuests[0] || slots[0] || {}).key || '';
        $('#jSlots').innerHTML = slots.map(function (x) {
          return '<button class="chip' + (x.key === jt.key ? ' on' : '') + '" data-slot="' + x.key + '">' + esc(fmtTime(x.time)) + ' · ' + esc(x.s.name.split(' ')[0]) + ' · ' + x.pax + '/' + x.s.capacity + '</button>';
        }).join('') || '<span class="muted">No slots.</span>';
        var list = rows.filter(function (b) { return b.session_id + '|' + b.time === jt.key; });
        var inCount = list.filter(function (b) { return b.checked_in; }).reduce(function (a, b) { return a + b.pax; }, 0);
        var total = list.reduce(function (a, b) { return a + b.pax; }, 0);
        $('#jList').innerHTML = (list.length ? '<div class="muted small">' + inCount + ' of ' + total + ' guests checked in</div>' : '') + (list.map(function (b) {
          return '<div class="guest' + (b.checked_in ? ' in' : '') + '" data-id="' + b.id + '"><button class="tick" data-tick aria-pressed="' + b.checked_in + '" aria-label="Checked in: ' + esc(b.name) + '">' + (b.checked_in ? '✓' : '') + '</button>' +
            '<button class="who" data-open style="background:none;border:0;text-align:left;padding:0"><b>' + esc(b.name) + ' · ' + b.pax + ' pax</b><span class="small ' + (b.balance > 0 ? '' : 'muted') + '">' + (b.balance > 0 ? 'Due ' + inr(b.balance) : 'Fully paid') + (b.addons.length ? ' · ' + esc(b.addons.join(', ')) : '') + '</span></button>' +
            (b.phone ? '<a class="btn sm wa" target="_blank" rel="noopener" href="' + esc(waUrl(b.phone, 'Hi ' + b.name.split(' ')[0] + ', ')) + '" aria-label="WhatsApp ' + esc(b.name) + '">' + ICON.wa + '</a>' : '') + '</div>';
        }).join('') || '<div class="empty">No guests in this slot.</div>');
      }).catch(fail);
    }
    load();
    v.onclick = function (e) {
      var el, g = e.target.closest('.guest');
      if ((el = e.target.closest('[data-day]'))) { jt.date = addDays(jt.date, Number(el.getAttribute('data-day'))); jt.key = ''; load(); }
      else if ((el = e.target.closest('[data-slot]'))) { jt.key = el.getAttribute('data-slot'); load(); }
      else if (e.target.closest('[data-tick]')) {
        var b = rows.find(function (x) { return String(x.id) === g.getAttribute('data-id'); });
        api('/bookings/' + b.id, { method: 'PATCH', body: { checked_in: !b.checked_in } }).then(load).catch(fail);
      } else if (e.target.closest('[data-open]')) openBookingDrawer(Number(g.getAttribute('data-id')), load);
      else if (e.target.closest('[data-walk]')) {
        var p = (jt.key || '').split('|');
        walkinModal({ session: p[0], time: p[1], date: jt.date }, load);
      }
    };
    $('#jUp').onchange = function (e) {
      var files = e.target.files;
      if (!files.length) return;
      var fd = new FormData();
      Array.prototype.forEach.call(files, function (f) { fd.append('files', f); });
      fd.append('placement', 'gallery');
      fd.append('visible', '0');
      toast('Uploading…');
      api('/photos', { form: fd }).then(function () { toast('Uploaded to Photos (hidden until you show them)'); }).catch(fail);
      e.target.value = '';
    };
  }

  // ---------- router ----------
  var VIEWS = { bookings: viewBookings, calendar: viewCalendar, sessions: viewSessions, photos: viewPhotos, reviews: viewReviews, content: viewContent, settings: viewSettings, jetty: viewJetty };
  function route() {
    var name = location.hash.replace(/^#\/?/, '').split('?')[0];
    if (!VIEWS[name]) name = window.innerWidth < 820 ? 'jetty' : 'bookings';
    api('/me').then(function (m) {
      if (!m.authed) return showLogin();
      return Promise.all([refreshStats(), ctx.catalog ? null : loadCatalog(), ctx.settings ? null : loadSettings()]).then(function () {
        VIEWS[name]();
        window.scrollTo(0, 0);
      });
    }).catch(fail);
  }
  window.addEventListener('hashchange', route);
  route();
})();
