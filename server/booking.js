// Booking rules shared by the public site and the admin panel:
// dates in IST, seat availability per slot, and price calculation.
const crypto = require('node:crypto');
const { db, getSettings } = require('./db');

const TZ = 'Asia/Kolkata';
const PENDING_HOLD_MINUTES = 15;

function todayIST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}
function nowMinutesIST() {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date()).split(':').map(Number);
  return h * 60 + m;
}
function addDays(date, n) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function isDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00Z')); }
function toMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function fmtTime(t) {
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}
function fmtDate(date, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
}
function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

function parseSession(s) {
  if (!s) return s;
  return { ...s, slot_times: JSON.parse(s.slot_times || '[]'), active: !!s.active, sees_coral: !!s.sees_coral };
}
function getSessions({ activeOnly = false } = {}) {
  const rows = db.prepare(`SELECT * FROM sessions ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY sort, id`).all();
  return rows.map(parseSession);
}
function getSession(idOrSlug) {
  const s = typeof idOrSlug === 'number' || /^\d+$/.test(String(idOrSlug))
    ? db.prepare('SELECT * FROM sessions WHERE id = ?').get(Number(idOrSlug))
    : db.prepare('SELECT * FROM sessions WHERE slug = ?').get(String(idOrSlug));
  return parseSession(s);
}
function getAddons({ activeOnly = false } = {}) {
  return db.prepare(`SELECT * FROM addons ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY sort, id`).all();
}

// Seats taken in a slot. Unpaid online bookings hold their seats for a short window.
function seatsTaken(sessionId, date, time, excludeBookingId = 0) {
  return db.prepare(`SELECT COALESCE(SUM(adults + kids), 0) AS n FROM bookings
    WHERE session_id = ? AND date = ? AND time = ? AND id != ?
      AND (status = 'confirmed' OR (status = 'pending' AND created_at > datetime('now', ?)))`)
    .get(sessionId, date, time, excludeBookingId, `-${PENDING_HOLD_MINUTES} minutes`).n;
}

function closureFor(sessionId, date, time) {
  return db.prepare(`SELECT * FROM closures WHERE date = ? AND (session_id IS NULL OR session_id = ?)
    AND (time IS NULL OR time = ?) LIMIT 1`).get(date, sessionId, time) || null;
}

// Slot list for one session/date, with seats left and why a slot is unavailable.
function slotsFor(session, date, { forAdmin = false, excludeBookingId = 0 } = {}) {
  const st = getSettings();
  const today = todayIST();
  const lastDay = addDays(today, Number(st.booking_window_days) || 60);
  const cutoff = (Number(st.cutoff_hours) || 0) * 60;
  return session.slot_times.map(time => {
    const taken = seatsTaken(session.id, date, time, excludeBookingId);
    const closure = closureFor(session.id, date, time);
    let left = Math.max(0, session.capacity - taken);
    let reason = '';
    if (closure) reason = closure.reason || 'Closed';
    else if (date < today) reason = 'Past';
    else if (!forAdmin && date > lastDay) reason = 'Not open yet';
    else if (date === today && toMinutes(time) - nowMinutesIST() < (forAdmin ? 0 : cutoff)) reason = 'Closed for today';
    else if (left === 0) reason = 'Sold out';
    return { time, label: fmtTime(time), capacity: session.capacity, taken, left: reason ? 0 : left, reason, closed: !!closure };
  });
}

// Day-level summary for the booking calendar: is anything bookable that day?
function monthAvailability(session, month /* YYYY-MM */) {
  const [y, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out = [];
  for (let d = 1; d <= days; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    const slots = slotsFor(session, date);
    const left = slots.reduce((a, s) => a + s.left, 0);
    const reason = left > 0 ? '' : (slots.find(s => s.closed)?.reason || slots[0]?.reason || 'Unavailable');
    out.push({ date, left, reason });
  }
  return out;
}

function findPromo(code) {
  if (!code) return null;
  return db.prepare('SELECT * FROM promo_codes WHERE code = ? COLLATE NOCASE AND active = 1').get(String(code).trim()) || null;
}

// Price breakdown. `input` = { adults, kids, kayak, addons:[ids], promo }
function quote(session, input) {
  const st = getSettings();
  const adults = Math.max(0, Math.floor(Number(input.adults) || 0));
  const kids = Math.max(0, Math.floor(Number(input.kids) || 0));
  const pax = adults + kids;
  const lines = [];
  if (adults) lines.push({ label: `${adults} adult${adults > 1 ? 's' : ''} × ${inr(session.price)}`, amount: adults * session.price });
  if (kids) lines.push({ label: `${kids} kid${kids > 1 ? 's' : ''} × ${inr(session.child_price)}`, amount: kids * session.child_price });
  if (input.kayak === 'single' && adults) {
    const p = Number(st.single_kayak_price) || 0;
    lines.push({ label: `Single kayak × ${adults}`, amount: adults * p });
  }
  const chosen = new Set((input.addons || []).map(Number));
  const addons = getAddons({ activeOnly: true }).filter(a => chosen.has(a.id));
  for (const a of addons) {
    const amt = a.per === 'person' ? a.price * pax : a.price;
    lines.push({ label: a.per === 'person' ? `${a.name} × ${pax}` : a.name, amount: amt, addonId: a.id });
  }
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const promo = findPromo(input.promo);
  const discount = promo ? Math.round(subtotal * promo.percent_off / 100) : 0;
  if (promo) lines.push({ label: `Promo ${promo.code.toUpperCase()} (−${promo.percent_off}%)`, amount: -discount });
  const total = subtotal - discount;
  const advancePct = Math.min(100, Math.max(0, Number(st.advance_percent) || 0));
  const advance = Math.ceil(total * advancePct / 100);
  return { adults, kids, pax, lines, subtotal, discount, total, advance, advancePct,
    promo: promo ? promo.code.toUpperCase() : '', addonNames: addons.map(a => a.name), addonIds: addons.map(a => a.id),
    needsHotel: addons.some(a => a.needs_hotel) };
}

function newToken() { return crypto.randomBytes(16).toString('hex'); }
function assignCode(id) {
  const code = 'NB-' + (1000 + id);
  db.prepare('UPDATE bookings SET code = ? WHERE id = ?').run(code, id);
  return code;
}

function statusLabel(b) {
  if (b.status === 'cancelled') return b.refunded > 0 ? 'Refunded' : 'Cancelled';
  if (b.status === 'pending') return 'Awaiting payment';
  if (b.paid >= b.total) return 'Paid';
  if (b.paid > 0) return 'Advance';
  return 'Due';
}

function decorate(b) {
  if (!b) return b;
  const s = getSession(b.session_id);
  return {
    ...b,
    addons: JSON.parse(b.addons || '[]'),
    checked_in: !!b.checked_in,
    session_name: s?.name || '—',
    session_slug: s?.slug || '',
    time_label: fmtTime(b.time),
    date_label: fmtDate(b.date),
    balance: Math.max(0, b.total - b.paid),
    status_label: statusLabel(b),
    pax: b.adults + b.kids,
  };
}

module.exports = {
  TZ, todayIST, addDays, isDate, fmtTime, fmtDate, inr, toMinutes,
  getSessions, getSession, getAddons, slotsFor, monthAvailability, seatsTaken, closureFor,
  quote, findPromo, newToken, assignCode, statusLabel, decorate,
};
