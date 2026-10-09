// SQLite storage using Node's built-in driver (no native build needed).
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(process.env.DB_FILE || path.join(DATA_DIR, 'kayak.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  duration TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  child_price INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  slot_times TEXT NOT NULL DEFAULT '[]',
  report_minutes INTEGER NOT NULL DEFAULT 45,
  min_age INTEGER NOT NULL DEFAULT 6,
  sees_coral INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS addons (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  per TEXT NOT NULL DEFAULT 'booking',  -- 'booking' | 'person'
  needs_hotel INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  percent_off INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS closures (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  session_id INTEGER,          -- NULL = all sessions
  time TEXT,                   -- NULL = whole day
  reason TEXT NOT NULL DEFAULT 'Weather'
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE,
  token TEXT NOT NULL,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  kids INTEGER NOT NULL DEFAULT 0,
  kayak TEXT NOT NULL DEFAULT 'double',
  addons TEXT NOT NULL DEFAULT '[]',
  hotel TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  promo TEXT NOT NULL DEFAULT '',
  total INTEGER NOT NULL,
  paid INTEGER NOT NULL DEFAULT 0,
  refunded INTEGER NOT NULL DEFAULT 0,
  pay_plan TEXT NOT NULL DEFAULT 'advance', -- 'advance' | 'full' | 'jetty'
  pay_method TEXT NOT NULL DEFAULT '',
  pay_ref TEXT NOT NULL DEFAULT '',
  order_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | confirmed | cancelled
  source TEXT NOT NULL DEFAULT 'online',    -- online | walkin
  checked_in INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  utm TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(date, session_id, time);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY,
  file TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'image',       -- image | video
  placement TEXT NOT NULL DEFAULT 'gallery', -- hero | gallery | session:<id>
  alt TEXT NOT NULL DEFAULT '',
  visible INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  source TEXT NOT NULL DEFAULT 'Website',
  text TEXT NOT NULL,
  photo TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | live | hidden
  featured INTEGER NOT NULL DEFAULT 0,
  booking_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY,
  q TEXT NOT NULL,
  a TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
`);

// ---------- settings ----------
const DEFAULT_SETTINGS = {
  brand_name: 'North Bay Kayaking',
  hero_overline: 'North Bay Island · Andaman',
  hero_title: 'Paddle the clearest water in the Andamans.',
  hero_subtitle: 'Guided kayak trips through mangroves and over coral. No experience needed.',
  rating_text: '',            // e.g. "★ 4.9 · 300+ Google reviews"; empty = computed from live reviews
  whatsapp: '919800000000',   // digits only, with country code
  phone: '+91 98000 00000',
  email: '',
  meeting_point: 'Rajiv Gandhi Water Sports Complex jetty, Port Blair',
  map_query: 'Rajiv Gandhi Water Sports Complex, Port Blair',
  advance_percent: '25',
  single_kayak_price: '400',  // per person
  booking_window_days: '60',
  cutoff_hours: '2',
  included: 'Certified guide\nLife jacket\nTrip photos\nDrinking water\nLocker',
  how_it_works: 'Boat from Port Blair\nSafety briefing\nPaddle with your guide',
  bring_list: 'Photo ID\nQuick-dry clothes\nSunscreen\nWater bottle',
  trust_points: 'Certified guides|Rescue-trained, 1 guide per 6 guests\nFree reschedule|If the sea is rough, we move you free\nNo swim needed|Life jackets for every guest\nPhotos included|Sent on WhatsApp the same day',
  policy_text: 'Free reschedule if weather cancels · Full refund up to 48 hrs before',
  razorpay_key_id: '',
  razorpay_key_secret: '',
  head_code: '',              // tracking tags injected into <head> on public pages
  conversion_code: '',        // injected only on the confirmation page
  admin_password_hash: '',
};

function getSettings() {
  const out = { ...DEFAULT_SETTINGS };
  for (const r of db.prepare('SELECT key, value FROM settings').all()) out[r.key] = r.value;
  return out;
}
function setSetting(key, value) {
  db.prepare('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, String(value ?? ''));
}

// ---------- first-run seed ----------
function seed() {
  const has = db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n;
  if (has) return;
  const ins = db.prepare(`INSERT INTO sessions(slug,name,duration,tagline,description,badge,price,child_price,capacity,slot_times,report_minutes,min_age,sees_coral,sort)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  ins.run('mangrove', 'Mangrove trail', '2 hr', 'Calm water · ages 6+',
    'Glide through quiet mangrove creeks with a guide who knows every channel. The calmest water on the island and the best pick for first-timers and families.',
    'Most booked', 1800, 1200, 12, JSON.stringify(['07:00', '09:30', '12:00', '15:00']), 45, 6, 0, 1);
  ins.run('sunrise', 'Sunrise paddle', '1.5 hr', '5:45 AM start · golden light',
    'Launch before dawn and watch the sun come up over Ross Island from the water. Small group, glassy sea, the best light for photos.',
    '', 2200, 1500, 8, JSON.stringify(['05:45']), 30, 10, 0, 2);
  ins.run('glass-bottom', 'Glass-bottom kayak', '1 hr', 'See the coral below',
    'Clear-hull kayaks over the North Bay reef. Watch coral, clownfish and parrotfish under your seat without getting wet.',
    '', 2500, 1800, 6, JSON.stringify(['09:00', '11:00', '14:00']), 45, 6, 1, 3);

  const addon = db.prepare('INSERT INTO addons(name,price,per,needs_hotel,sort) VALUES(?,?,?,?,?)');
  addon.run('GoPro photos & video', 600, 'booking', 0, 1);
  addon.run('Hotel pickup · Port Blair', 500, 'booking', 1, 2);
  addon.run('Boat transfer to North Bay', 400, 'person', 0, 3);
  addon.run('Combo: + snorkelling', 900, 'person', 0, 4);

  const faq = db.prepare('INSERT INTO faqs(q,a,sort) VALUES(?,?,?)');
  faq.run('Do I need to know how to swim?', 'No. Every guest wears a life jacket and paddles with a certified guide. We start with a short safety briefing on the beach.', 1);
  faq.run('How do I reach North Bay?', 'Boats leave from the Rajiv Gandhi Water Sports Complex jetty in Port Blair (about 20 minutes). Add the boat transfer when you book and we handle the tickets.', 2);
  faq.run('What if the sea is rough?', 'Safety first. If the harbour master or our guides call off a slot, we move you to another slot for free or refund you in full.', 3);
  faq.run('What age can kids join?', 'Kids from 6 years can join with an adult in a double kayak. The sunrise paddle is for ages 10 and up.', 4);
  faq.run('What is the cancellation policy?', 'Full refund if you cancel 48 hours or more before your slot. After that the advance is non-refundable, but you can reschedule once for free.', 5);

  db.prepare("INSERT INTO promo_codes(code, percent_off) VALUES('WELCOME10', 10)").run();
}
seed();

module.exports = { db, getSettings, setSetting, DEFAULT_SETTINGS, DATA_DIR, UPLOAD_DIR };
