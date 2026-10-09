/* Landing page behaviour: menu, sticky book bar, gallery lightbox,
   the quick-book widget in the hero, and session deep links (#mangrove). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };

  // Mobile menu
  var menuBtn = $('.menu-btn'), links = $('#navLinks');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Sticky bar appears once the hero booking widget scrolls away (form IS the hero until then).
  var bar = $('#stickyBar'), widget = $('#quickBook');
  if (bar && widget && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var show = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
      bar.classList.toggle('show', show);
      bar.setAttribute('aria-hidden', !show);
      bar.querySelectorAll('a,button').forEach(function (el) { el.tabIndex = show ? 0 : -1; });
    }).observe(widget);
  }

  // Lightbox
  var lb = $('#lightbox');
  if (lb) {
    document.addEventListener('click', function (e) {
      var g = e.target.closest('.gallery-item');
      if (g) { $('img', lb).src = g.getAttribute('data-full'); lb.hidden = false; $('.lightbox-close', lb).focus(); return; }
      if (!lb.hidden && (e.target === lb || e.target.closest('.lightbox-close'))) lb.hidden = true;
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.hidden = true; });
  }

  // Deep link to a session card: /#glass-bottom → scroll + highlight.
  function highlight() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var card = document.getElementById(id);
    if (card && card.classList.contains('session-card')) {
      card.classList.add('highlight');
      setTimeout(function () { card.classList.remove('highlight'); }, 2600);
    }
  }
  window.addEventListener('hashchange', highlight);
  highlight();

  // Quick-book widget
  if (!widget) return;
  var selS = $('#qbSession'), selD = $('#qbDate'), selG = $('#qbGuests'), slotsEl = $('#qbSlots'), totalEl = $('#qbTotal');
  var chosenTime = '', cfg = null;
  fetch('/api/config').then(function (r) { return r.json(); }).then(function (c) {
    cfg = c;
    selD.min = c.today; selD.max = c.lastDay;
    var fromHash = c.sessions.find(function (s) { return '#' + s.slug === location.hash; });
    var fromQuery = new URLSearchParams(location.search).get('session');
    if (fromHash) selS.value = fromHash.slug; else if (fromQuery) selS.value = fromQuery;
    updateTotal();
  });

  function session() { return cfg && cfg.sessions.find(function (s) { return s.slug === selS.value; }); }
  function updateTotal() {
    var s = session();
    if (!s) return;
    totalEl.textContent = inr(s.price * Number(selG.value)) + ' total';
  }
  function loadSlots() {
    chosenTime = '';
    if (!selD.value) { slotsEl.innerHTML = '<span class="muted small">Pick a date to see times</span>'; return; }
    slotsEl.innerHTML = '<span class="muted small">Checking seats…</span>';
    fetch('/api/slots?session=' + encodeURIComponent(selS.value) + '&date=' + selD.value).then(function (r) { return r.json(); }).then(function (d) {
      var list = d.slots || [];
      var need = Number(selG.value);
      if (!list.length) { slotsEl.innerHTML = '<span class="muted small">No slots that day</span>'; return; }
      slotsEl.innerHTML = list.map(function (s) {
        var ok = s.left >= need;
        var title = s.left > 0 ? s.left + ' seats left' : s.reason;
        return '<button type="button" class="chip" role="radio" aria-checked="false" data-qb-time="' + s.time + '" title="' + title + '"' + (ok ? '' : ' disabled') + '>' + s.label + '</button>';
      }).join('');
      var first = slotsEl.querySelector('button:not([disabled])');
      if (!first) slotsEl.insertAdjacentHTML('beforeend', '<span class="muted small">Full that day. Try another date.</span>');
    });
  }
  selS.addEventListener('change', function () { updateTotal(); loadSlots(); });
  selD.addEventListener('change', loadSlots);
  selG.addEventListener('change', function () { updateTotal(); if (selD.value) loadSlots(); });
  slotsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-qb-time]');
    if (!b) return;
    chosenTime = b.getAttribute('data-qb-time');
    slotsEl.querySelectorAll('[data-qb-time]').forEach(function (x) { x.setAttribute('aria-checked', x === b); });
  });
  widget.addEventListener('submit', function (e) {
    e.preventDefault();
    window.openBooking && window.openBooking({ session: selS.value, date: selD.value || '', time: chosenTime, adults: selG.value });
  });
})();
