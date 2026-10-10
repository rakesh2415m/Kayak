# North Bay Kayaking — booking website + admin panel

Built from the Claude Design handoff in `project/` (wireframes: `Kayak Booking Wireframes.dc.html`, design brief: `chats/chat1.md`, original handoff notes: `project/HANDOFF-README.md`).

- **Website** (`/`): mobile-first ad landing page. It combines the story scroll from 1a with the "book in 60 seconds" widget from 1b, plus a WhatsApp button, session cards you can deep-link to, and a comparison table.
- **Booking flow** (2a–2d): a bottom sheet with session, date and slot → guests and add-ons → details and advance payment → confirmation page (report time, map, add to calendar, WhatsApp, and the ad conversion event).
- **Admin panel** (`/admin`), 3a–3f:
  - **Bookings:** filters, stats, CSV export and walk-ins.
  - **Booking detail drawer:** WhatsApp, reschedule, check-in, balance paid, cancel and refund.
  - **Calendar & slots:** close slots for weather and see which guests to notify.
  - **Sessions & prices:** also covers add-ons, promo codes and booking rules.
  - **Photos:** upload, place on the site, show or hide, drag to reorder.
  - **Reviews:** pending, approve, feature, add your own.
  - **FAQ & text, Settings, and Jetty check-in:** the jetty screen is the phone view.

## Run it

Requires Node.js 22.5+ (uses the built-in `node:sqlite`, so there is no database server to install).

```bash
npm install
ADMIN_PASSWORD='choose-a-strong-one' npm start   # http://localhost:3000 and /admin
npm run seed:demo   # optional: sample bookings + reviews (don't run on the live site)
npm test
```

If `ADMIN_PASSWORD` is set, it becomes the admin password every time the server starts (handy for resetting a forgotten one). If it isn't set, a random password is printed on first run; you can change it in Admin → Settings.

Data lives in `data/` (SQLite file + uploaded photos). Back this folder up. Set `DATA_DIR` to store it elsewhere.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | default 3000 |
| `ADMIN_PASSWORD` | first-run admin password |
| `DATA_DIR` | where the database and uploads are stored (default `./data`) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | optional; can also be entered in Admin → Settings |
| `TRUST_PROXY=1` | set when running behind nginx/Cloudflare so HTTPS cookies and rate limits work |

## Payments

Without Razorpay keys the site runs in **test mode**: a banner says so and checkout simulates the payment. Add `rzp_test_…` keys in Admin → Settings to try real Razorpay Checkout, then switch to live keys. Payments are verified on the server by signature. Refunds from the cancel dialog go through Razorpay when the payment was made online.

## Ads and tracking

- Deep links: `/#mangrove` scrolls to and highlights a session card; `/?book=glass-bottom` opens the booking sheet with that session selected.
- UTM/gclid/fbclid parameters are saved on each booking and included in the CSV export.
- Paste your Google tag / Meta Pixel into Admin → Settings → Ad tracking. The confirmation page pushes a `booking_confirmed` dataLayer event, fires Meta `Purchase`, and runs your conversion snippet once per booking.

## Not automated (yet)

WhatsApp messages (confirmation, reschedule, weather cancellation, review link) open WhatsApp with the text pre-filled, and staff press send. Sending them automatically needs a WhatsApp Business API provider such as Interakt, Gupshup or Twilio.

## Layout

```
server/   Express app: db.js (schema + seed), booking.js (availability/pricing), views.js (server-rendered pages),
          public-routes.js, admin-routes.js, auth.js, payments.js (Razorpay), media.js (uploads + WebP compression)
public/   site CSS/JS (tokens.css = design-system tokens), booking sheet in js/book.js
admin/    admin SPA (no build step)
test/     API tests (node --test)
```
