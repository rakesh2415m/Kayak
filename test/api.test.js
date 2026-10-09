// End-to-end API tests against a throwaway database.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nbk-test-'));
process.env.DATA_DIR = dir;
process.env.ADMIN_PASSWORD = 'test-password';
delete process.env.RAZORPAY_KEY_ID;

const app = require('../server/index');
const B = require('../server/booking');

let server, base, cookie = '';
const day = B.addDays(B.todayIST(), 5);

async function req(method, url, body, { admin = false } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (admin) headers.Cookie = cookie;
  const r = await fetch(base + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get('content-type') || '';
  return { status: r.status, headers: r.headers, data: ct.includes('json') ? await r.json() : await r.text() };
}
const book = (over = {}) => req('POST', '/api/bookings', { session: 'mangrove', date: day, time: '09:30', adults: 2, name: 'Asha Rao', phone: '9876543210', ...over });

before(async () => {
  server = app.listen(0);
  await new Promise(r => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test('landing page renders sessions from the database', async () => {
  const r = await req('GET', '/');
  assert.equal(r.status, 200);
  assert.match(r.data, /Mangrove trail/);
  assert.match(r.data, /id="mangrove"/);
  assert.match(r.data, /Reserve my slot/);
});

test('quote applies add-ons, single kayak and promo', async () => {
  const r = await req('POST', '/api/quote', { session: 'mangrove', adults: 2, kids: 1, kayak: 'single', addons: [1], promo: 'welcome10' });
  // 2×1800 + 1200 + 2×400 + 600 = 6200, −10% = 5580
  assert.equal(r.data.subtotal, 6200);
  assert.equal(r.data.total, 5580);
  assert.equal(r.data.advance, Math.ceil(5580 * 0.25));
});

test('booking → simulated payment → confirmation page', async () => {
  const r = await book();
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.mode, 'simulated');
  assert.equal(r.data.amount, 900);
  const bad = await req('POST', `/api/bookings/${r.data.code}/simulate-pay`, { token: 'wrong' });
  assert.equal(bad.status, 404);
  const p = await req('POST', `/api/bookings/${r.data.code}/simulate-pay`, { token: r.data.token });
  assert.equal(p.data.ok, true);
  const page = await req('GET', p.data.url);
  assert.match(page.data, /You're booked/);
  assert.match(page.data, /Report by 8:45 AM/);
  const ics = await req('GET', `/booking/${r.data.code}/calendar.ics?t=${r.data.token}`);
  assert.match(ics.data, /BEGIN:VEVENT/);
  const noTok = await req('GET', `/booking/${r.data.code}`);
  assert.equal(noTok.status, 404);
});

test('validation and capacity limits', async () => {
  assert.equal((await book({ name: '' })).status, 400);
  assert.equal((await book({ phone: '123' })).status, 400);
  assert.equal((await book({ time: '08:00' })).status, 400);
  assert.equal((await book({ adults: 1, kids: 3 })).status, 400);
  // 12 seats; 2 taken above → 10 left
  const tooMany = await book({ adults: 11 });
  assert.equal(tooMany.status, 409);
  assert.match(tooMany.data.error, /10 seats left/);
  const slots = await req('GET', `/api/slots?session=mangrove&date=${day}`);
  assert.equal(slots.data.slots.find(s => s.time === '09:30').left, 10);
});

test('admin API requires login', async () => {
  assert.equal((await req('GET', '/admin/api/bookings')).status, 401);
  assert.equal((await req('POST', '/admin/api/login', { password: 'nope' })).status, 401);
  const r = await fetch(base + '/admin/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'test-password' }) });
  assert.equal(r.status, 200);
  cookie = r.headers.get('set-cookie').split(';')[0];
  assert.match(r.headers.get('set-cookie'), /HttpOnly/);
  assert.equal((await req('GET', '/admin/api/me', null, { admin: true })).data.authed, true);
});

test('admin: walk-in, check-in, balance, reschedule, cancel', async () => {
  const w = await req('POST', '/admin/api/bookings', { session: 1, date: day, time: '09:30', adults: 2, kids: 0, name: '', paid: 0 }, { admin: true });
  assert.equal(w.status, 200, JSON.stringify(w.data));
  assert.equal(w.data.booking.name, 'Walk-in');
  assert.equal(w.data.booking.status_label, 'Due');
  const id = w.data.booking.id;

  const list = await req('GET', `/admin/api/bookings?from=${day}&to=${day}`, null, { admin: true });
  assert.equal(list.data.totals.guests, 4);

  const ci = await req('PATCH', `/admin/api/bookings/${id}`, { checked_in: true }, { admin: true });
  assert.equal(ci.data.booking.checked_in, true);
  const bal = await req('PATCH', `/admin/api/bookings/${id}`, { balance_paid: true, method: 'cash' }, { admin: true });
  assert.equal(bal.data.booking.status_label, 'Paid');

  const rs = await req('POST', `/admin/api/bookings/${id}/reschedule`, { date: day, time: '15:00' }, { admin: true });
  assert.equal(rs.data.booking.time, '15:00');

  const full = await req('POST', '/admin/api/bookings', { session: 1, date: day, time: '15:00', adults: 11 }, { admin: true });
  assert.equal(full.status, 409);
  assert.equal(full.data.canForce, true);

  const c = await req('POST', `/admin/api/bookings/${id}/cancel`, { refund: 500, reason: 'test' }, { admin: true });
  assert.equal(c.data.booking.status_label, 'Refunded');

  const csv = await req('GET', `/admin/api/bookings.csv?from=${day}&to=${day}`, null, { admin: true });
  assert.match(csv.data, /code,date,time/);
  assert.match(csv.data, /Asha Rao/);
});

test('closing a slot blocks online booking and lists affected guests', async () => {
  const r = await req('POST', '/admin/api/closures', { date: day, session_id: 1, time: '09:30', reason: 'Rough sea' }, { admin: true });
  assert.equal(r.data.affected.length, 1);
  assert.equal(r.data.affected[0].name, 'Asha Rao');
  const b = await book({ adults: 1 });
  assert.equal(b.status, 409);
  assert.match(b.data.error, /Rough sea/);
  const cal = await req('GET', `/admin/api/calendar?session=1&start=${day}`, null, { admin: true });
  const cell = cal.data.rows.find(x => x.time === '09:30').cells.find(c => c.date === day);
  assert.equal(cell.closure.reason, 'Rough sea');
  await req('DELETE', `/admin/api/closures/${cell.closure.id}`, null, { admin: true });
  assert.equal((await book({ adults: 1 })).status, 200);
});

test('reviews: guest submits → pending → approve → shows on landing', async () => {
  const fd = new FormData();
  fd.append('name', 'Kiran'); fd.append('city', 'Mumbai'); fd.append('rating', '5'); fd.append('text', 'Loved the mangrove trail, super calm water!');
  const r = await fetch(base + '/api/reviews', { method: 'POST', body: fd });
  assert.equal(r.status, 200);
  let page = await req('GET', '/');
  assert.doesNotMatch(page.data, /Loved the mangrove trail/);
  const pend = await req('GET', '/admin/api/reviews?status=pending', null, { admin: true });
  const id = pend.data.reviews[0].id;
  await req('PATCH', `/admin/api/reviews/${id}`, { status: 'live', featured: true }, { admin: true });
  page = await req('GET', '/');
  assert.match(page.data, /Loved the mangrove trail/);
  assert.match(page.data, /★ 5\.0 · 1 review/);
});

test('settings: secrets are masked and session edits go live', async () => {
  await req('PUT', '/admin/api/settings', { razorpay_key_secret: 'shh', whatsapp: '+91 99999-00000', advance_percent: '150' }, { admin: true });
  const s = await req('GET', '/admin/api/settings', null, { admin: true });
  assert.equal(s.data.settings.razorpay_key_secret, '••••••••');
  assert.equal(s.data.settings.whatsapp, '919999900000');
  assert.equal(s.data.settings.advance_percent, '100');
  assert.equal(s.data.settings.admin_password_hash, undefined);
  await req('PUT', '/admin/api/settings', { razorpay_key_secret: '', advance_percent: '25' }, { admin: true });

  const cat = await req('GET', '/admin/api/catalog', null, { admin: true });
  const s1 = cat.data.sessions[0];
  await req('PUT', `/admin/api/sessions/${s1.id}`, { ...s1, price: 1999 }, { admin: true });
  const cfg = await req('GET', '/api/config');
  assert.equal(cfg.data.sessions[0].price, 1999);
});

test('photo upload is compressed and placed on the page', async () => {
  // 1×1 PNG
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const fd = new FormData();
  fd.append('files', new Blob([png], { type: 'image/png' }), 'kayak-at-dawn.png');
  fd.append('placement', 'gallery');
  const r = await fetch(base + '/admin/api/photos', { method: 'POST', headers: { Cookie: cookie }, body: fd });
  assert.equal(r.status, 200);
  const list = await req('GET', '/admin/api/photos', null, { admin: true });
  const p = list.data.photos[0];
  assert.equal(p.alt, 'kayak at dawn');
  const page = await req('GET', '/');
  assert.match(page.data, new RegExp(p.file));
  const img = await fetch(base + '/uploads/' + p.file);
  assert.equal(img.status, 200);

  const txt = new FormData();
  txt.append('files', new Blob(['hi'], { type: 'text/plain' }), 'x.txt');
  const bad = await fetch(base + '/admin/api/photos', { method: 'POST', headers: { Cookie: cookie }, body: txt });
  assert.equal(bad.status, 400);
});
