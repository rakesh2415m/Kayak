// Adds sample bookings and reviews so the admin panel can be tried out.
// Run with `npm run seed:demo`. Do not run on the live site: the sample
// reviews would appear on the landing page.
const { db } = require('./db');
const B = require('./booking');

const today = B.todayIST();
const sessions = B.getSessions();
const byslug = Object.fromEntries(sessions.map(s => [s.slug, s]));

const people = [
  ['Rahul Mehta', '+919811100001', 2, 0, 'mangrove', '09:30', 'advance', ['GoPro photos & video', 'Hotel pickup · Port Blair'], 'Hotel Sea Shell'],
  ['Priya Sharma', '+919711100002', 2, 2, 'mangrove', '09:30', 'full', [], ''],
  ['Walk-in', '', 2, 0, 'mangrove', '09:30', 'jetty', [], ''],
  ['Ankit Verma', '+919911100003', 3, 0, 'glass-bottom', '11:00', 'advance', ['Boat transfer to North Bay'], ''],
  ['Sara Klein', '+447700900004', 2, 0, 'mangrove', '15:00', 'full', [], ''],
  ['Dev Patel', '+919011100005', 5, 0, 'mangrove', '15:00', 'cancelled', [], ''],
];

const ins = db.prepare(`INSERT INTO bookings(token, session_id, date, time, adults, kids, addons, hotel, name, phone, total, paid, pay_plan, pay_method, pay_ref, status, source, refunded)
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

function add(day, [name, phone, adults, kids, slug, time, plan, addons, hotel]) {
  const s = byslug[slug];
  if (!s) return;
  const addonIds = B.getAddons().filter(a => addons.includes(a.name)).map(a => a.id);
  const q = B.quote(s, { adults, kids, addons: addonIds });
  const paid = plan === 'full' ? q.total : plan === 'advance' ? q.advance : 0;
  const r = ins.run(B.newToken(), s.id, day, time, adults, kids, JSON.stringify(q.addonNames), hotel, name, phone, q.total,
    plan === 'cancelled' ? q.advance : paid, plan === 'cancelled' ? 'advance' : plan, paid ? 'upi' : '', paid ? 'TEST-demo' : '',
    plan === 'cancelled' ? 'cancelled' : 'confirmed', name === 'Walk-in' ? 'walkin' : 'online', plan === 'cancelled' ? q.advance : 0);
  B.assignCode(Number(r.lastInsertRowid));
}

for (const p of people) add(today, p);
for (const p of people.slice(0, 4)) add(B.addDays(today, 1), [p[0] === 'Walk-in' ? 'Meera Iyer' : p[0] + ' (2)', p[1] || '+919811100009', ...p.slice(2)]);
add(B.addDays(today, 2), ['Kabir Singh', '+919811100010', 2, 0, 'sunrise', '05:45', 'advance', [], '']);

const rv = db.prepare('INSERT INTO reviews(name, city, rating, source, text, status, featured) VALUES(?,?,?,?,?,?,?)');
rv.run('Neha', 'Pune', 5, 'Google', 'Best thing we did in the Andamans. The mangrove trail was so calm and our guide pointed out crabs, kingfishers and even a baby reef shark.', 'live', 1);
rv.run('Arjun', 'Delhi', 5, 'WhatsApp', 'First time kayaking and I was nervous, but the safety briefing was great. Got amazing GoPro photos the same evening.', 'pending', 0);
rv.run('Emma', 'UK', 4, 'TripAdvisor', 'Glass-bottom kayak was magical, saw so much coral. Only wish it was a bit longer!', 'pending', 0);
rv.run('Sanjay', 'Chennai', 5, 'Google', 'Sunrise paddle is worth waking up for. Small group, flat water, beautiful light.', 'live', 1);
rv.run('Lakshmi', 'Bengaluru', 5, 'Google', 'Went with two kids (8 and 11). Very patient guides, kids loved it.', 'live', 0);

console.log('Demo bookings and reviews added.');
