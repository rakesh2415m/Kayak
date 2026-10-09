// Admin panel JSON API (mounted at /admin/api).
const express = require('express');
const { db, getSettings, setSetting, DEFAULT_SETTINGS } = require('./db');
const B = require('./booking');
const pay = require('./payments');
const auth = require('./auth');
const media = require('./media');

const router = express.Router();
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
const int = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : d);
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);

router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.get('/me', (req, res) => res.json({ authed: auth.isAuthed(req) }));

router.use(auth.requireAdmin);

// ---------- bookings ----------
function weekStart(date) {
  const d = new Date(date + 'T00:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  return B.addDays(date, -dow);
}

router.get('/stats', (req, res) => {
  const today = B.todayIST();
  const ws = weekStart(today);
  const guests = (from, to) => db.prepare(`SELECT COALESCE(SUM(adults + kids), 0) AS n FROM bookings
    WHERE status = 'confirmed' AND date BETWEEN ? AND ?`).get(from, to).n;
  const money = db.prepare(`SELECT COALESCE(SUM(paid), 0) AS paid, COALESCE(SUM(MAX(total - paid, 0)), 0) AS due FROM bookings
    WHERE status = 'confirmed' AND date BETWEEN ? AND ?`).get(today, B.addDays(today, 6));
  const pendingReviews = db.prepare("SELECT COUNT(*) AS n FROM reviews WHERE status = 'pending'").get().n;
  const abandoned = db.prepare(`SELECT COUNT(*) AS n FROM bookings WHERE status = 'pending' AND created_at > datetime('now', '-3 days')`).get().n;
  res.json({
    today, todayLabel: B.fmtDate(today, { weekday: 'short', day: 'numeric', month: 'short' }),
    todayGuests: guests(today, today), weekGuests: guests(ws, B.addDays(ws, 6)),
    collected: money.paid, due: money.due, pendingReviews, abandoned, paymentMode: pay.mode(),
  });
});

function listBookings(q) {
  const where = [];
  const args = [];
  if (B.isDate(q.from)) { where.push('date >= ?'); args.push(q.from); }
  if (B.isDate(q.to)) { where.push('date <= ?'); args.push(q.to); }
  if (q.session) { where.push('session_id = ?'); args.push(int(q.session)); }
  if (q.time) { where.push('time = ?'); args.push(str(q.time, 5)); }
  if (q.q) {
    const term = `%${str(q.q, 60)}%`;
    where.push('(name LIKE ? OR phone LIKE ? OR code LIKE ? OR email LIKE ?)');
    args.push(term, term, term, term);
  }
  const status = str(q.status, 20);
  if (status === 'pending') where.push("status = 'pending'");
  else if (status === 'cancelled') where.push("status = 'cancelled'");
  else if (status === 'paid') where.push("status = 'confirmed' AND paid >= total");
  else if (status === 'advance') where.push("status = 'confirmed' AND paid > 0 AND paid < total");
  else if (status === 'due') where.push("status = 'confirmed' AND paid = 0");
  else if (status !== 'all') where.push("status != 'pending'"); // default: hide unpaid drop-offs
  const sql = `SELECT * FROM bookings ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY date, time, id LIMIT 1000`;
  return db.prepare(sql).all(...args).map(B.decorate);
}

router.get('/bookings', (req, res) => {
  const rows = listBookings(req.query);
  const live = rows.filter(b => b.status === 'confirmed');
  res.json({
    bookings: rows,
    totals: { bookings: live.length, guests: live.reduce((a, b) => a + b.pax, 0), paid: live.reduce((a, b) => a + b.paid, 0), due: live.reduce((a, b) => a + b.balance, 0) },
  });
});

router.get('/bookings.csv', (req, res) => {
  const rows = listBookings({ ...req.query, status: req.query.status || 'all' });
  const cols = ['code', 'date', 'time', 'session_name', 'name', 'phone', 'email', 'adults', 'kids', 'kayak', 'addons', 'hotel', 'total', 'paid', 'balance', 'refunded', 'status_label', 'pay_method', 'pay_ref', 'source', 'checked_in', 'promo', 'note', 'utm', 'created_at'];
  const cell = (v) => {
    let s = Array.isArray(v) ? v.join('; ') : String(v ?? '');
    if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => cell(r[c])).join(','))].join('\n');
  res.set('Content-Disposition', `attachment; filename="bookings-${B.todayIST()}.csv"`).type('text/csv').send('﻿' + csv);
});

function getBooking(id) { return db.prepare('SELECT * FROM bookings WHERE id = ?').get(int(id)); }

router.get('/bookings/:id', (req, res) => {
  const b = getBooking(req.params.id);
  if (!b) return bad(res, 'Not found', 404);
  res.json({ booking: B.decorate(b), reviewUrl: `/review?b=${b.code}&t=${b.token}`, confirmUrl: `/booking/${b.code}?t=${b.token}` });
});

// Walk-in / phone booking added by staff.
router.post('/bookings', (req, res) => {
  const body = req.body || {};
  const s = B.getSession(body.session);
  if (!s) return bad(res, 'Choose a session');
  if (!B.isDate(body.date)) return bad(res, 'Choose a date');
  const q = B.quote(s, body);
  if (q.pax < 1) return bad(res, 'Add at least one guest');
  if (!s.slot_times.includes(body.time)) return bad(res, 'Choose a slot');
  const left = s.capacity - B.seatsTaken(s.id, body.date, body.time);
  if (left < q.pax && !body.force) return res.status(409).json({ error: `Only ${Math.max(0, left)} seats left in that slot`, canForce: true });
  const total = body.total !== undefined && body.total !== '' ? Math.max(0, int(body.total)) : q.total;
  const paid = Math.min(total, Math.max(0, int(body.paid)));
  const r = db.prepare(`INSERT INTO bookings(token, session_id, date, time, adults, kids, kayak, addons, hotel, name, phone, email, total, paid, pay_plan, pay_method, status, source, note)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,'jetty',?,'confirmed',?,?)`).run(
    B.newToken(), s.id, body.date, body.time, q.adults, q.kids, body.kayak === 'single' ? 'single' : 'double',
    JSON.stringify(q.addonNames), str(body.hotel, 120), str(body.name, 80) || 'Walk-in', str(body.phone, 20), str(body.email, 120),
    total, paid, paid ? str(body.method, 20) || 'cash' : '', body.source === 'phone' ? 'phone' : 'walkin', str(body.note, 500));
  const id = Number(r.lastInsertRowid);
  B.assignCode(id);
  res.json({ booking: B.decorate(getBooking(id)) });
});

router.patch('/bookings/:id', (req, res) => {
  const b = getBooking(req.params.id);
  if (!b) return bad(res, 'Not found', 404);
  const body = req.body || {};
  const sets = [];
  const args = [];
  for (const k of ['name', 'phone', 'email', 'note', 'hotel']) {
    if (body[k] !== undefined) { sets.push(`${k} = ?`); args.push(str(body[k], k === 'note' ? 1000 : 120)); }
  }
  if (body.checked_in !== undefined) { sets.push('checked_in = ?'); args.push(body.checked_in ? 1 : 0); }
  if (body.balance_paid) {
    sets.push('paid = total');
    if (body.method) { sets.push("pay_method = CASE WHEN pay_method = '' THEN ? ELSE pay_method || ' + ' || ? END"); args.push(str(body.method, 20), str(body.method, 20)); }
  }
  if (body.paid !== undefined) { sets.push('paid = ?'); args.push(Math.max(0, int(body.paid))); }
  if (body.total !== undefined) { sets.push('total = ?'); args.push(Math.max(0, int(body.total))); }
  if (body.confirm && b.status === 'pending') sets.push("status = 'confirmed'");
  if (!sets.length) return bad(res, 'Nothing to update');
  sets.push("updated_at = datetime('now')");
  db.prepare(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ?`).run(...args, b.id);
  res.json({ booking: B.decorate(getBooking(b.id)) });
});

router.post('/bookings/:id/reschedule', (req, res) => {
  const b = getBooking(req.params.id);
  if (!b) return bad(res, 'Not found', 404);
  const s = B.getSession(req.body?.session || b.session_id);
  const { date, time } = req.body || {};
  if (!s || !B.isDate(date) || !s.slot_times.includes(time)) return bad(res, 'Choose a valid date and slot');
  const left = s.capacity - B.seatsTaken(s.id, date, time, b.id);
  if (left < b.adults + b.kids && !req.body.force) return res.status(409).json({ error: `Only ${Math.max(0, left)} seats left in that slot`, canForce: true });
  db.prepare("UPDATE bookings SET session_id = ?, date = ?, time = ?, updated_at = datetime('now') WHERE id = ?").run(s.id, date, time, b.id);
  res.json({ booking: B.decorate(getBooking(b.id)) });
});

router.post('/bookings/:id/cancel', async (req, res) => {
  const b = getBooking(req.params.id);
  if (!b) return bad(res, 'Not found', 404);
  const refund = Math.min(b.paid, Math.max(0, int(req.body?.refund)));
  let refundNote = '';
  if (refund > 0 && pay.mode() === 'razorpay' && b.pay_ref.startsWith('pay_') && req.body?.viaGateway) {
    try {
      const r = await pay.refund(b.pay_ref, refund);
      refundNote = `Razorpay refund ${r.id}`;
    } catch (err) {
      return bad(res, 'Razorpay refund failed: ' + err.message, 502);
    }
  }
  const note = [b.note, refund ? `Refunded ₹${refund}${refundNote ? ' · ' + refundNote : ' (manual)'}` : '', str(req.body?.reason, 200)].filter(Boolean).join('\n');
  db.prepare("UPDATE bookings SET status = 'cancelled', refunded = ?, note = ?, updated_at = datetime('now') WHERE id = ?").run(refund, note, b.id);
  res.json({ booking: B.decorate(getBooking(b.id)) });
});

// ---------- calendar & closures ----------
router.get('/slots', (req, res) => {
  const s = B.getSession(req.query.session);
  if (!s || !B.isDate(req.query.date)) return bad(res, 'Invalid session or date');
  res.json({ slots: B.slotsFor(s, req.query.date, { forAdmin: true, excludeBookingId: int(req.query.exclude) }) });
});

router.get('/calendar', (req, res) => {
  const s = B.getSession(req.query.session) || B.getSessions()[0];
  if (!s) return res.json({ days: [], rows: [] });
  const start = weekStart(B.isDate(req.query.start) ? req.query.start : B.todayIST());
  const days = Array.from({ length: 7 }, (_, i) => B.addDays(start, i));
  const rows = s.slot_times.map(time => ({
    time, label: B.fmtTime(time),
    cells: days.map(date => {
      const closure = B.closureFor(s.id, date, time);
      return { date, booked: B.seatsTaken(s.id, date, time), capacity: s.capacity, closure };
    }),
  }));
  res.json({
    session: s, start, prev: B.addDays(start, -7), next: B.addDays(start, 7), today: B.todayIST(),
    days: days.map(d => ({ date: d, label: B.fmtDate(d, { weekday: 'short' }), day: B.fmtDate(d, { day: 'numeric', month: 'short' }) })),
    rows,
    closures: db.prepare('SELECT c.*, s.name AS session_name FROM closures c LEFT JOIN sessions s ON s.id = c.session_id WHERE date >= ? ORDER BY date, time').all(B.todayIST()),
  });
});

function affectedBookings(date, sessionId, time) {
  const args = [date];
  let sql = "SELECT * FROM bookings WHERE status = 'confirmed' AND date = ?";
  if (sessionId) { sql += ' AND session_id = ?'; args.push(sessionId); }
  if (time) { sql += ' AND time = ?'; args.push(time); }
  return db.prepare(sql + ' ORDER BY time').all(...args).map(B.decorate);
}

router.post('/closures', (req, res) => {
  const { date, to } = req.body || {};
  if (!B.isDate(date)) return bad(res, 'Choose a date');
  const end = B.isDate(to) && to >= date ? to : date;
  const sessionId = req.body.session_id ? int(req.body.session_id) : null;
  const time = req.body.time ? str(req.body.time, 5) : null;
  const reason = str(req.body.reason, 80) || 'Weather';
  const affected = [];
  for (let d = date, n = 0; d <= end && n < 120; d = B.addDays(d, 1), n++) {
    db.prepare('INSERT INTO closures(date, session_id, time, reason) VALUES(?,?,?,?)').run(d, sessionId, time, reason);
    affected.push(...affectedBookings(d, sessionId, time));
  }
  res.json({ ok: true, affected });
});

router.delete('/closures/:id', (req, res) => {
  db.prepare('DELETE FROM closures WHERE id = ?').run(int(req.params.id));
  res.json({ ok: true });
});

// ---------- sessions, add-ons, promos ----------
router.get('/catalog', (req, res) => {
  res.json({
    sessions: B.getSessions(),
    addons: B.getAddons(),
    promos: db.prepare('SELECT * FROM promo_codes ORDER BY id').all(),
  });
});

function sessionFields(body) {
  const times = (Array.isArray(body.slot_times) ? body.slot_times : String(body.slot_times || '').split(','))
    .map(t => String(t).trim()).filter(t => /^\d{1,2}:\d{2}$/.test(t)).map(t => t.padStart(5, '0')).sort();
  return {
    slug: str(body.slug || body.name, 40).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: str(body.name, 80), duration: str(body.duration, 30), tagline: str(body.tagline, 120),
    description: str(body.description, 1000), badge: str(body.badge, 30),
    price: Math.max(0, int(body.price)), child_price: Math.max(0, int(body.child_price ?? body.price)),
    capacity: Math.max(1, int(body.capacity, 1)), slot_times: JSON.stringify([...new Set(times)]),
    report_minutes: Math.max(0, int(body.report_minutes, 45)), min_age: Math.max(0, int(body.min_age, 6)),
    sees_coral: body.sees_coral ? 1 : 0, active: body.active === undefined ? 1 : (body.active ? 1 : 0), sort: int(body.sort),
  };
}

router.post('/sessions', (req, res) => {
  const f = sessionFields(req.body || {});
  if (!f.name || !f.slug) return bad(res, 'Name is required');
  try {
    const keys = Object.keys(f);
    db.prepare(`INSERT INTO sessions(${keys.join(',')}) VALUES(${keys.map(() => '?').join(',')})`).run(...Object.values(f));
  } catch { return bad(res, 'A session with that link name already exists'); }
  res.json({ ok: true });
});

router.put('/sessions/:id', (req, res) => {
  const f = sessionFields(req.body || {});
  if (!f.name || !f.slug) return bad(res, 'Name is required');
  try {
    db.prepare(`UPDATE sessions SET ${Object.keys(f).map(k => `${k} = ?`).join(', ')} WHERE id = ?`).run(...Object.values(f), int(req.params.id));
  } catch { return bad(res, 'A session with that link name already exists'); }
  res.json({ ok: true });
});

router.delete('/sessions/:id', (req, res) => {
  const id = int(req.params.id);
  if (db.prepare('SELECT COUNT(*) AS n FROM bookings WHERE session_id = ?').get(id).n) {
    return bad(res, 'This session has bookings. Switch it off instead of deleting it.');
  }
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  res.json({ ok: true });
});

router.post('/addons', (req, res) => {
  const b = req.body || {};
  if (!str(b.name)) return bad(res, 'Name is required');
  db.prepare('INSERT INTO addons(name, price, per, needs_hotel, active, sort) VALUES(?,?,?,?,?,?)')
    .run(str(b.name, 80), Math.max(0, int(b.price)), b.per === 'person' ? 'person' : 'booking', b.needs_hotel ? 1 : 0, b.active === false ? 0 : 1, int(b.sort));
  res.json({ ok: true });
});
router.put('/addons/:id', (req, res) => {
  const b = req.body || {};
  if (!str(b.name)) return bad(res, 'Name is required');
  db.prepare('UPDATE addons SET name = ?, price = ?, per = ?, needs_hotel = ?, active = ?, sort = ? WHERE id = ?')
    .run(str(b.name, 80), Math.max(0, int(b.price)), b.per === 'person' ? 'person' : 'booking', b.needs_hotel ? 1 : 0, b.active ? 1 : 0, int(b.sort), int(req.params.id));
  res.json({ ok: true });
});
router.delete('/addons/:id', (req, res) => { db.prepare('DELETE FROM addons WHERE id = ?').run(int(req.params.id)); res.json({ ok: true }); });

router.post('/promos', (req, res) => {
  const code = str(req.body?.code, 30).toUpperCase().replace(/\s/g, '');
  const pct = int(req.body?.percent_off);
  if (!code || pct < 1 || pct > 100) return bad(res, 'Enter a code and a discount between 1 and 100%');
  try { db.prepare('INSERT INTO promo_codes(code, percent_off) VALUES(?, ?)').run(code, pct); } catch { return bad(res, 'That code already exists'); }
  res.json({ ok: true });
});
router.patch('/promos/:id', (req, res) => {
  db.prepare('UPDATE promo_codes SET active = ? WHERE id = ?').run(req.body?.active ? 1 : 0, int(req.params.id));
  res.json({ ok: true });
});
router.delete('/promos/:id', (req, res) => { db.prepare('DELETE FROM promo_codes WHERE id = ?').run(int(req.params.id)); res.json({ ok: true }); });

// ---------- photos ----------
const PLACEMENT = /^(hero|gallery|session:\d+)$/;

router.get('/photos', (req, res) => {
  res.json({ photos: db.prepare('SELECT * FROM photos ORDER BY placement, sort, id').all(), sessions: B.getSessions().map(s => ({ id: s.id, name: s.name })) });
});

router.post('/photos', media.uploader().array('files', 20), async (req, res) => {
  const placement = PLACEMENT.test(req.body?.placement) ? req.body.placement : 'gallery';
  const visible = req.body?.visible === '0' ? 0 : 1;
  const files = req.files || [];
  if (!files.length) return bad(res, 'Choose at least one photo or video');
  let sort = db.prepare('SELECT COALESCE(MAX(sort), 0) AS m FROM photos WHERE placement = ?').get(placement).m;
  const out = [];
  for (const f of files) {
    const { file, kind } = await media.store(f);
    const r = db.prepare('INSERT INTO photos(file, kind, placement, alt, visible, sort) VALUES(?,?,?,?,?,?)')
      .run(file, kind, placement, str(f.originalname.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), 120), visible, ++sort);
    out.push(Number(r.lastInsertRowid));
  }
  res.json({ ok: true, ids: out });
});

router.patch('/photos/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM photos WHERE id = ?').get(int(req.params.id));
  if (!p) return bad(res, 'Not found', 404);
  const b = req.body || {};
  const placement = PLACEMENT.test(b.placement) ? b.placement : p.placement;
  db.prepare('UPDATE photos SET placement = ?, alt = ?, visible = ? WHERE id = ?')
    .run(placement, b.alt !== undefined ? str(b.alt, 160) : p.alt, b.visible !== undefined ? (b.visible ? 1 : 0) : p.visible, p.id);
  res.json({ ok: true });
});

router.post('/photos/reorder', (req, res) => {
  const ids = (req.body?.ids || []).map(Number);
  const upd = db.prepare('UPDATE photos SET sort = ? WHERE id = ?');
  ids.forEach((id, i) => upd.run(i + 1, id));
  res.json({ ok: true });
});

router.delete('/photos/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM photos WHERE id = ?').get(int(req.params.id));
  if (p) { db.prepare('DELETE FROM photos WHERE id = ?').run(p.id); media.remove(p.file); }
  res.json({ ok: true });
});

// ---------- reviews ----------
router.get('/reviews', (req, res) => {
  const counts = Object.fromEntries(db.prepare('SELECT status, COUNT(*) AS n FROM reviews GROUP BY status').all().map(r => [r.status, r.n]));
  const avg = db.prepare("SELECT AVG(rating) AS a FROM reviews WHERE status = 'live'").get().a;
  const status = ['pending', 'live', 'hidden'].includes(req.query.status) ? req.query.status : 'live';
  res.json({
    counts, avg: avg ? Number(avg.toFixed(1)) : null,
    reviews: db.prepare('SELECT * FROM reviews WHERE status = ? ORDER BY featured DESC, created_at DESC').all(status),
  });
});

router.post('/reviews', media.uploader({ maxMB: 12, allowVideo: false }).single('photo'), async (req, res) => {
  const b = req.body || {};
  if (!str(b.name) || !str(b.text)) { media.discard(req.file); return bad(res, 'Name and review text are required'); }
  const photo = req.file ? (await media.store(req.file, { maxWidth: 400 })).file : '';
  db.prepare("INSERT INTO reviews(name, city, rating, source, text, photo, status, featured) VALUES(?,?,?,?,?,?,'live',?)")
    .run(str(b.name, 60), str(b.city, 60), Math.min(5, Math.max(1, int(b.rating, 5))), str(b.source, 30) || 'Google', str(b.text, 2000), photo, b.featured === 'true' || b.featured === true ? 1 : 0);
  res.json({ ok: true });
});

router.patch('/reviews/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM reviews WHERE id = ?').get(int(req.params.id));
  if (!r) return bad(res, 'Not found', 404);
  const b = req.body || {};
  db.prepare('UPDATE reviews SET name = ?, city = ?, rating = ?, source = ?, text = ?, status = ?, featured = ? WHERE id = ?').run(
    b.name !== undefined ? str(b.name, 60) : r.name, b.city !== undefined ? str(b.city, 60) : r.city,
    b.rating !== undefined ? Math.min(5, Math.max(1, int(b.rating, 5))) : r.rating, b.source !== undefined ? str(b.source, 30) : r.source,
    b.text !== undefined ? str(b.text, 2000) : r.text, ['pending', 'live', 'hidden'].includes(b.status) ? b.status : r.status,
    b.featured !== undefined ? (b.featured ? 1 : 0) : r.featured, r.id);
  res.json({ ok: true });
});

router.delete('/reviews/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM reviews WHERE id = ?').get(int(req.params.id));
  if (r) { db.prepare('DELETE FROM reviews WHERE id = ?').run(r.id); media.remove(r.photo); }
  res.json({ ok: true });
});

// ---------- FAQ ----------
router.get('/faqs', (req, res) => res.json({ faqs: db.prepare('SELECT * FROM faqs ORDER BY sort, id').all() }));
router.post('/faqs', (req, res) => {
  if (!str(req.body?.q) || !str(req.body?.a)) return bad(res, 'Question and answer are required');
  const m = db.prepare('SELECT COALESCE(MAX(sort), 0) AS m FROM faqs').get().m;
  db.prepare('INSERT INTO faqs(q, a, sort) VALUES(?,?,?)').run(str(req.body.q, 200), str(req.body.a, 2000), m + 1);
  res.json({ ok: true });
});
router.put('/faqs/:id', (req, res) => {
  if (!str(req.body?.q) || !str(req.body?.a)) return bad(res, 'Question and answer are required');
  db.prepare('UPDATE faqs SET q = ?, a = ? WHERE id = ?').run(str(req.body.q, 200), str(req.body.a, 2000), int(req.params.id));
  res.json({ ok: true });
});
router.post('/faqs/reorder', (req, res) => {
  const upd = db.prepare('UPDATE faqs SET sort = ? WHERE id = ?');
  (req.body?.ids || []).map(Number).forEach((id, i) => upd.run(i + 1, id));
  res.json({ ok: true });
});
router.delete('/faqs/:id', (req, res) => { db.prepare('DELETE FROM faqs WHERE id = ?').run(int(req.params.id)); res.json({ ok: true }); });

// ---------- settings ----------
const SECRET_KEYS = new Set(['razorpay_key_secret']);
const HIDDEN_KEYS = new Set(['admin_password_hash']);

router.get('/settings', (req, res) => {
  const st = getSettings();
  const out = {};
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    if (HIDDEN_KEYS.has(k)) continue;
    out[k] = SECRET_KEYS.has(k) ? (st[k] ? '••••••••' : '') : st[k];
  }
  res.json({ settings: out, paymentMode: pay.mode(), envPayment: !!process.env.RAZORPAY_KEY_ID });
});

router.put('/settings', (req, res) => {
  const body = req.body || {};
  for (const [k, v] of Object.entries(body)) {
    if (!(k in DEFAULT_SETTINGS) || HIDDEN_KEYS.has(k)) continue;
    if (SECRET_KEYS.has(k) && v === '••••••••') continue;
    let val = String(v ?? '').slice(0, 20000);
    if (k === 'whatsapp') val = val.replace(/\D/g, '');
    if (['advance_percent', 'single_kayak_price', 'booking_window_days', 'cutoff_hours'].includes(k)) val = String(Math.max(0, int(val)));
    if (k === 'advance_percent') val = String(Math.min(100, Number(val)));
    setSetting(k, val);
  }
  res.json({ ok: true });
});

router.post('/password', (req, res) => {
  const err = auth.changePassword(req.body?.current, req.body?.next);
  if (err) return bad(res, err);
  res.json({ ok: true });
});

module.exports = router;
