// Downloadable PDF ticket. Works everywhere, including in-app browsers
// (WhatsApp / Instagram) where window.print() is not available.
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { getSettings } = require('./db');
const B = require('./booking');
const path = require('node:path');

const LOGO_PNG = path.join(__dirname, '..', 'public', 'brand', 'png', 'tebishiro-logo-horizontal.png');

// The built-in PDF fonts have no ₹ glyph, so amounts are written as "Rs".
const rs = (n) => 'Rs ' + Math.round(n).toLocaleString('en-IN');

const C = { ink: '#0E3B43', muted: '#3E5A5F', lagoon: '#2A9D8F', coral: '#E07A5F', sand: '#F7F5F0', line: '#c6bca8' };

function statusOf(b) {
  if (b.status === 'cancelled') return { text: b.refunded ? `CANCELLED · ${rs(b.refunded)} refunded` : 'CANCELLED', bg: '#fde6e1', fg: '#b3361d' };
  if (b.status === 'pending') return { text: 'PAYMENT PENDING', bg: '#fff3d6', fg: '#8a5a12' };
  if (b.checked_in) return { text: 'CHECKED IN', bg: '#e6f4ea', fg: '#1e7a3c' };
  if (b.balance > 0) return { text: `CONFIRMED · ${rs(b.balance)} due at the jetty`, bg: '#dcf8f5', fg: '#0a6d69' };
  return { text: 'CONFIRMED · fully paid', bg: '#dcf8f5', fg: '#0a6d69' };
}

// b = decorated booking, url = absolute ticket link encoded in the QR code
function ticketPdf(b, { url, reportTime }) {
  const st = getSettings();
  const W = 595, H = 330; // wide ticket, fits on A4 / phone screens
  const doc = new PDFDocument({ size: [W, H], margin: 0, info: { Title: `Ticket ${b.code} · ${st.brand_name}`, Author: st.brand_name } });

  // card + gradient strip
  doc.rect(0, 0, W, H).fill('#ffffff');
  const g = doc.linearGradient(0, 0, W, 0);
  g.stop(0, '#7CC6BC').stop(0.55, C.coral).stop(1, '#f2c27b');
  doc.rect(0, 0, W, 8).fill(g);

  const stubX = 410;
  doc.rect(stubX, 8, W - stubX, H - 8).fill(C.sand);
  doc.save().moveTo(stubX, 18).lineTo(stubX, H - 10).dash(5, { space: 4 }).lineWidth(1.5).strokeColor(C.line).stroke().restore();
  doc.circle(stubX, 8, 11).fill('#ffffff');
  doc.circle(stubX, H, 11).fill('#ffffff');

  // left: details
  const x = 28;
  // Tebishiro logo (from public/brand)
  try { doc.image(LOGO_PNG, x - 4, 18, { height: 30 }); }
  catch { doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(11).text(st.brand_name, x, 24); }
  doc.fillColor(C.lagoon).font('Helvetica-Bold').fontSize(8.5).text(b.session_name.toUpperCase(), x, 48, { characterSpacing: 1.6 });
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(22).text(B.fmtDate(b.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), x, 62, { width: stubX - x - 20 });
  doc.fillColor(C.coral).font('Helvetica-Bold').fontSize(22).text(b.time_label, x, doc.y);

  const s = statusOf(b);
  const sy = doc.y + 8;
  doc.font('Helvetica-Bold').fontSize(9);
  const sw = doc.widthOfString(s.text) + 24;
  doc.roundedRect(x, sy, sw, 20, 10).fill(s.bg);
  doc.fillColor(s.fg).text(s.text, x + 12, sy + 6);

  const fields = [
    ['BOOKING ID', b.code], ['REPORT BY', reportTime], ['GUEST', b.name],
    ['GUESTS', `${b.adults} adult${b.adults !== 1 ? 's' : ''}${b.kids ? ` + ${b.kids} kid${b.kids > 1 ? 's' : ''}` : ''}`],
    ['KAYAK', b.kayak === 'single' ? 'Single' : 'Double'], ['PAID', `${rs(b.paid)} of ${rs(b.total)}`],
  ];
  const colW = (stubX - x - 20) / 3;
  let fy = sy + 34;
  fields.forEach(([k, v], i) => {
    const fx = x + (i % 3) * colW;
    if (i === 3) fy += 34;
    doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(7).text(k, fx, fy, { characterSpacing: 1.2 });
    doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(10.5).text(v, fx, fy + 11, { width: colW - 8, lineBreak: false, ellipsis: true });
  });
  fy += 36;
  if (b.addons.length) {
    doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(7).text('ADD-ONS', x, fy, { characterSpacing: 1.2 });
    doc.fillColor(C.ink).font('Helvetica').fontSize(9.5).text(b.addons.join(', ') + (b.hotel ? ` (pickup: ${b.hotel})` : ''), x, fy + 11, { width: stubX - x - 20, height: 12, ellipsis: true });
    fy += 30;
  }
  doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(7).text('MEETING POINT', x, fy, { characterSpacing: 1.2 });
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(9.5).text(st.meeting_point, x, fy + 11, { width: stubX - x - 20, height: 24, ellipsis: true });
  doc.fillColor(C.muted).font('Helvetica').fontSize(7.5).text(st.policy_text, x, H - 24, { width: stubX - x - 20, lineBreak: false, ellipsis: true });

  // right: QR stub
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const box = 130, cell = box / n, qx = stubX + (W - stubX - box) / 2, qy = 40;
  doc.roundedRect(qx - 10, qy - 10, box + 20, box + 20, 12).fill('#ffffff');
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (qr.modules.get(r, c)) doc.rect(qx + c * cell, qy + r * cell, cell + 0.2, cell + 0.2).fill(C.ink);
  }
  const cx = stubX, cw = W - stubX;
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(20).text(b.code, cx, qy + box + 22, { width: cw, align: 'center', characterSpacing: 1 });
  doc.fillColor(C.muted).font('Helvetica').fontSize(8.5).text('Show this at the jetty', cx, doc.y + 2, { width: cw, align: 'center' });
  if (b.balance > 0 && b.status === 'confirmed') doc.fillColor(C.coral).font('Helvetica-Bold').fontSize(10).text(`Due: ${rs(b.balance)}`, cx, doc.y + 6, { width: cw, align: 'center' });
  if (st.phone) doc.fillColor(C.muted).font('Helvetica').fontSize(7.5).text(`Help: ${st.phone}`, cx, H - 24, { width: cw, align: 'center' });

  if (b.status === 'cancelled') {
    doc.save().rotate(-14, { origin: [W / 2 - 60, H / 2] }).roundedRect(W / 2 - 170, H / 2 - 24, 220, 48, 10).lineWidth(4).strokeColor('#d6452a').stroke()
      .fillColor('#d6452a').font('Helvetica-Bold').fontSize(26).text('CANCELLED', W / 2 - 170, H / 2 - 12, { width: 220, align: 'center', characterSpacing: 3 }).restore();
  }
  doc.end();
  return doc;
}

module.exports = { ticketPdf };
