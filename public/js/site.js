/* Public site behaviour: animated reveals, counters, parallax, ripple buttons,
   nav, sticky book bar, gallery lightbox, review carousel, quick-book widget
   and session deep links (#mangrove). Motion is skipped for reduced-motion users. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // ---------- nav: solid background once scrolled ----------
  var nav = $('#siteNav');
  function onScrollNav() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  var menuBtn = $('.menu-btn'), links = $('#navLinks');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
      if (open && nav) nav.classList.add('scrolled');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // ---------- reveal on scroll ----------
  var reveals = $$('.reveal');
  if (!hasIO || reduce) reveals.forEach(function (el) { el.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // ---------- animated counters ----------
  var counters = $$('.count[data-count]');
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = Number(el.getAttribute('data-dec')) || 0;
    var prefix = el.textContent.trim().charAt(0) === '₹' ? '₹' : '';
    var t0 = null, dur = 1600;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = prefix + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-IN'));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (hasIO && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // ---------- parallax ----------
  var plx = $$('.parallax');
  if (plx.length && !reduce) {
    var ticking = false;
    function parallax() {
      var vh = window.innerHeight;
      plx.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var speed = parseFloat(el.getAttribute('data-speed')) || 0.2;
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        var max = parseFloat(el.getAttribute('data-max'));
        if (max) offset = Math.max(-max * r.height, Math.min(max * r.height, offset));
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    window.addEventListener('resize', parallax);
    parallax();
  }

  // ---------- ripple on buttons ----------
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn');
    if (!b || reduce) return;
    var r = b.getBoundingClientRect();
    var s = Math.max(r.width, r.height);
    var span = document.createElement('span');
    span.className = 'ripple';
    span.style.width = span.style.height = s + 'px';
    span.style.left = (e.clientX - r.left - s / 2) + 'px';
    span.style.top = (e.clientY - r.top - s / 2) + 'px';
    b.appendChild(span);
    setTimeout(function () { span.remove(); }, 700);
  });

  // ---------- review carousel arrows ----------
  var rs = $('#reviewScroll');
  $$('[data-scroll]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (rs) rs.scrollBy({ left: Number(btn.getAttribute('data-scroll')) * Math.min(rs.clientWidth * 0.8, 420), behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // ---------- sticky bar: shows once the hero booking widget scrolls away ----------
  var bar = $('#stickyBar'), widget = $('#quickBook');
  if (bar && widget && hasIO) {
    new IntersectionObserver(function (entries) {
      var show = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
      bar.classList.toggle('show', show);
      bar.setAttribute('aria-hidden', !show);
      bar.querySelectorAll('a,button').forEach(function (el) { el.tabIndex = show ? 0 : -1; });
    }).observe(widget);
  }

  // ---------- lightbox ----------
  var lb = $('#lightbox');
  if (lb) {
    document.addEventListener('click', function (e) {
      var g = e.target.closest('.gallery-item');
      if (g) { $('img', lb).src = g.getAttribute('data-full'); lb.hidden = false; $('.lightbox-close', lb).focus(); return; }
      if (!lb.hidden && (e.target === lb || e.target.closest('.lightbox-close'))) lb.hidden = true;
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.hidden = true; });
  }

  // ---------- deep link to a session: /#glass-bottom → scroll + highlight ----------
  function highlight() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var card = document.getElementById(id);
    if (card && card.classList.contains('exp')) {
      $$('.reveal', card).forEach(function (el) { el.classList.add('in'); });
      card.classList.add('highlight');
      setTimeout(function () { card.classList.remove('highlight'); }, 2600);
    }
  }
  window.addEventListener('hashchange', highlight);
  highlight();

  // ---------- quick-book widget ----------
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
    if (s) totalEl.textContent = inr(s.price * Number(selG.value)) + ' total';
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
      if (!slotsEl.querySelector('button:not([disabled])')) slotsEl.insertAdjacentHTML('beforeend', '<span class="muted small">Full that day. Try another date.</span>');
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
    if (window.openBooking) window.openBooking({ session: selS.value, date: selD.value || '', time: chosenTime, adults: selG.value });
  });
})();
