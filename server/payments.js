// Razorpay integration. When no keys are configured the site runs in
// "simulated" mode so the whole booking flow can be tested end to end.
const crypto = require('node:crypto');
const { getSettings } = require('./db');

function keys() {
  const st = getSettings();
  const keyId = process.env.RAZORPAY_KEY_ID || st.razorpay_key_id;
  const secret = process.env.RAZORPAY_KEY_SECRET || st.razorpay_key_secret;
  return keyId && secret ? { keyId, secret } : null;
}
function mode() { return keys() ? 'razorpay' : 'simulated'; }

async function rzp(method, path, body) {
  const k = keys();
  const res = await fetch('https://api.razorpay.com/v1' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${k.keyId}:${k.secret}`).toString('base64'),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.description || `Razorpay error ${res.status}`);
  return data;
}

// amount in rupees
async function createOrder(amount, receipt, notes = {}) {
  return rzp('POST', '/orders', { amount: Math.round(amount * 100), currency: 'INR', receipt, notes });
}

function verifySignature(orderId, paymentId, signature) {
  const k = keys();
  if (!k || !signature) return false;
  const expected = crypto.createHmac('sha256', k.secret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function fetchPayment(paymentId) { return rzp('GET', `/payments/${encodeURIComponent(paymentId)}`); }

async function refund(paymentId, amount) {
  return rzp('POST', `/payments/${encodeURIComponent(paymentId)}/refund`, { amount: Math.round(amount * 100) });
}

module.exports = { keys, mode, createOrder, verifySignature, fetchPayment, refund };
