// North Bay Kayaking — booking website + admin panel.
const path = require('node:path');
const express = require('express');
const { UPLOAD_DIR } = require('./db');
const auth = require('./auth');

auth.ensurePassword();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.path.startsWith('/admin')) res.set('X-Frame-Options', 'DENY');
  next();
});
app.use(express.json({ limit: '200kb' }));

const ROOT = path.join(__dirname, '..');
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, index: false }));
app.use(express.static(path.join(ROOT, 'public'), { maxAge: '1h', index: false }));

app.use('/admin/api', require('./admin-routes'));
app.use('/admin', express.static(path.join(ROOT, 'admin'), { index: 'index.html', maxAge: 0 }));
app.use(require('./public-routes'));

app.use((req, res) => res.status(404).type('html').send('<p style="font-family:sans-serif;padding:40px">Page not found. <a href="/">Go to the home page</a></p>'));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500) console.error(err);
  const msg = err.code === 'LIMIT_FILE_SIZE' ? 'That file is too large' : status >= 500 ? 'Something went wrong' : err.message;
  res.status(status).json({ error: msg });
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`Site:  http://localhost:${port}\nAdmin: http://localhost:${port}/admin`));
}

module.exports = app;
