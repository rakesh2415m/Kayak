// Public website: pages + the JSON API used by the booking sheet.
const express = require('express');
const { db, getSettings } = require('./db');
const B = require('./booking');
const pay = require('./payments');
const views = require('./views');
const media = require('./media');

const router = express.Router();

// Tiny per-IP limiter for write endpoints.
const hits = new Map();
function limit(max, windowMs) {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
    arr.push(now);
    hits.set(key, arr);
    if (arr.length > max) return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
    next();
  };
}

const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

function bookingByCode(code, token) {
  const b = db.prepare('SELECT * FROM bookings WHERE code = ?').get(String(code));
  if (!b || !token || b.token !== String(token)) return null;
  return b;
}

// ---------- pages ----------
router.get('/', (req, res) => res.type('html').send(views.landing()));

router.get('/booking/:code', (req, res) => {
  const b = bookingByCode(req.params.code, req.query.t);
  if (!b) return res.status(404).type('html').send('<p style="font-family:sans-serif;padding:40px">Booking not found. Check the link you received, or message us on WhatsApp.</p>');
  res.set('Cache-Control', 'no-store').type('html').send(views.confirmation(B.decorate(b)));
});

router.get('/booking/:code/calendar.ics', (req, res) => {
  const b = bookingByCode(req.params.code, req.query.t);
  if (!b) return res.status(404).end();
  res.set('Content-Disposition', `attachment; filename="${b.code}.ics"`).type('text/calendar').send(views.ics(B.decorate(b)));
});

router.get('/review', (req, res) => {
  const b = req.query.b ? bookingByCode(req.query.b, req.query.t) : null;
  res.type('html').send(views.reviewPage(b));
});

// ---------- API ----------
router.get('/api/config', (req, res) => {
  const st = getSettings();
  res.json({
    brand: st.brand_name,
    whatsapp: st.whatsapp,
    phone: st.phone,
    advancePercent: Number(st.advance_percent) || 0,
    singleKayakPrice: Number(st.single_kayak_price) || 0,
    policy: st.policy_text,
    payment: { mode: pay.mode(), keyId: pay.keys()?.keyId || '' },
    today: B.todayIST(),
    lastDay: B.addDays(B.todayIST(), Number(st.booking_window_days) || 60),
    sessions: B.getSessions({ activeOnly: true }).map(s => ({
      id: s.id, slug: s.slug, name: s.name, duration: s.duration, tagline: s.tagline,
      price: s.price, childPrice: s.child_price, capacity: s.capacity, minAge: s.min_age,
    })),
    addons: B.getAddons({ activeOnly: true }).map(a => ({ id: a.id, name: a.name, price: a.price, per: a.per, needsHotel: !!a.needs_hotel })),
  });
});

function activeSession(slug) {
  const s = B.getSession(slug);
  return s && s.active ? s : null;
}

router.get('/api/availability', (req, res) => {
  const s = activeSession(req.query.session);
  if (!s) return bad(res, 'Unknown session');
  const month = String(req.query.month || '');
  if (!/^\d{4}-\d{2}$/.test(month)) return bad(res, 'month must be YYYY-MM');
  res.json({ days: B.monthAvailability(s, month) });
});

router.get('/api/slots', (req, res) => {
  const s = activeSession(req.query.session);
  if (!s) return bad(res, 'Unknown session');
  if (!B.isDate(req.query.date)) return bad(res, 'Invalid date');
  res.json({ slots: B.slotsFor(s, req.query.date).map(({ time, label, left, reason }) => ({ time, label, left, reason })) });
});

router.post('/api/quote', (req, res) => {
  const s = activeSession(req.body?.session);
  if (!s) return bad(res, 'Unknown session');
  const q = B.quote(s, req.body);
  res.json({ ...q, promoValid: !req.body.promo || !!q.promo });
});

router.post('/api/bookings', limit(10, 60_000), async (req, res) => {
  const body = req.body || {};
  const s = activeSession(body.session);
  if (!s) return bad(res, 'Please choose a session.');
  if (!B.isDate(body.date)) return bad(res, 'Please choose a date.');
  const name = String(body.name || '').trim().slice(0, 80);
  const phone = String(body.phone || '').replace(/[^\d+]/g, '').slice(0, 16);
  const email = String(body.email || '').trim().slice(0, 120);
  if (name.length < 2) return bad(res, 'Please enter your full name.');
  if (phone.replace(/\D/g, '').length < 10) return bad(res, 'Please enter a valid WhatsApp number.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'That email address looks wrong.');
  const q = B.quote(s, body);
  if (q.adults < 1) return bad(res, 'At least one adult is needed.');
  if (q.kids > q.adults * 2) return bad(res, 'Each adult can bring at most 2 kids.');
  if (body.promo && !q.promo) return bad(res, 'That promo code is not valid.');
  if (q.needsHotel && !String(body.hotel || '').trim()) return bad(res, 'Please tell us your hotel for pickup.');
  const plan = body.plan === 'full' ? 'full' : 'advance';

  // Check seats and insert in one transaction so two people can't take the last seats.
  let id;
  db.exec('BEGIN IMMEDIATE');
  try {
    const slot = B.slotsFor(s, body.date).find(x => x.time === body.time);
    if (!slot) throw Object.assign(new Error('Please choose a time slot.'), { status: 400 });
    if (slot.reason) throw Object.assign(new Error(`That slot is not available (${slot.reason}). Please pick another.`), { status: 409 });
    if (slot.left < q.pax) throw Object.assign(new Error(`Only ${slot.left} seat${slot.left === 1 ? '' : 's'} left in that slot.`), { status: 409 });
    const r = db.prepare(`INSERT INTO bookings(token, session_id, date, time, adults, kids, kayak, addons, hotel, name, phone, email, promo, total, pay_plan, pay_method, status, source, utm)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending','online',?)`).run(
      B.newToken(), s.id, body.date, body.time, q.adults, q.kids, body.kayak === 'single' ? 'single' : 'double',
      JSON.stringify(q.addonNames), q.needsHotel ? String(body.hotel).trim().slice(0, 120) : '', name, phone, email, q.promo, q.total, plan,
      String(body.method || '').slice(0, 20), String(body.utm || '').slice(0, 300));
    id = Number(r.lastInsertRowid);
    B.assignCode(id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    return bad(res, err.message, err.status || 500);
  }

  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  const amount = plan === 'full' ? q.total : q.advance;
  const out = { code: b.code, token: b.token, amount, mode: pay.mode() };
  if (pay.mode() === 'razorpay' && amount > 0) {
    try {
      const order = await pay.createOrder(amount, b.code, { booking: b.code });
      db.prepare('UPDATE bookings SET order_id = ? WHERE id = ?').run(order.id, id);
      out.order = { id: order.id, amount: order.amount, currency: order.currency, keyId: pay.keys().keyId };
    } catch (err) {
      console.error('Razorpay order failed:', err.message);
      return bad(res, 'Payment could not be started. Please try again or book on WhatsApp.', 502);
    }
  }
  res.json(out);
});

function markPaid(b, amount, ref, method) {
  db.prepare(`UPDATE bookings SET status = 'confirmed', paid = ?, pay_ref = ?, pay_method = COALESCE(NULLIF(?, ''), pay_method), updated_at = datetime('now') WHERE id = ?`)
    .run(amount, ref, method || '', b.id);
}

router.post('/api/bookings/:code/verify', limit(20, 60_000), async (req, res) => {
  const b = bookingByCode(req.params.code, req.body?.token);
  if (!b) return bad(res, 'Booking not found', 404);
  if (b.status === 'confirmed') return res.json({ ok: true, url: `/booking/${b.code}?t=${b.token}` });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig } = req.body || {};
  if (pay.mode() !== 'razorpay' || orderId !== b.order_id || !pay.verifySignature(orderId, paymentId, sig)) {
    return bad(res, 'Payment could not be verified. If money was debited, message us on WhatsApp with your booking ID.');
  }
  let amount = b.pay_plan === 'full' ? b.total : Math.ceil(b.total * (Number(getSettings().advance_percent) || 0) / 100);
  let method = '';
  try { const p = await pay.fetchPayment(paymentId); amount = Math.round(p.amount / 100); method = p.method || ''; } catch { /* signature already proves payment */ }
  markPaid(b, amount, paymentId, method);
  res.json({ ok: true, url: `/booking/${b.code}?t=${b.token}` });
});

// Test mode only: completes payment without a gateway.
router.post('/api/bookings/:code/simulate-pay', (req, res) => {
  if (pay.mode() !== 'simulated') return bad(res, 'Simulated payments are disabled when Razorpay is configured.', 403);
  const b = bookingByCode(req.params.code, req.body?.token);
  if (!b) return bad(res, 'Booking not found', 404);
  if (b.status === 'pending') {
    const amount = b.pay_plan === 'full' ? b.total : Math.ceil(b.total * (Number(getSettings().advance_percent) || 0) / 100);
    markPaid(b, amount, 'TEST-' + Date.now(), b.pay_method || 'test');
  }
  res.json({ ok: true, url: `/booking/${b.code}?t=${b.token}` });
});

router.post('/api/reviews', limit(5, 60_000), media.uploader({ maxMB: 12, allowVideo: false }).single('photo'), async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 60);
  const text = String(req.body?.text || '').trim().slice(0, 1200);
  const rating = Math.min(5, Math.max(1, Number(req.body?.rating) || 5));
  if (name.length < 2 || text.length < 5) {
    media.discard(req.file);
    return bad(res, 'Please add your name and a few words about your trip.');
  }
  const b = req.body.booking ? bookingByCode(req.body.booking, req.body.t) : null;
  let photo = '';
  if (req.file) photo = (await media.store(req.file, { maxWidth: 400 })).file;
  db.prepare("INSERT INTO reviews(name, city, rating, source, text, photo, status, booking_id) VALUES(?,?,?,?,?,?,'pending',?)")
    .run(name, String(req.body.city || '').trim().slice(0, 60), rating, 'Website', text, photo, b ? b.id : null);
  res.json({ ok: true });
});

module.exports = router;
