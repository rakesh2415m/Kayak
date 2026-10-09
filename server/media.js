// Upload handling. Images are resized and re-encoded to WebP so the
// landing page stays fast on mobile; videos are stored as uploaded.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const { UPLOAD_DIR } = require('./db');

let sharp = null;
try { sharp = require('sharp'); } catch { /* optional: originals are kept if sharp is unavailable */ }

const IMAGE_TYPES = /^image\/(jpeg|png|webp|gif|heic|heif|avif)$/;
const VIDEO_TYPES = /^video\/(mp4|webm|quicktime)$/;

function uploader({ maxMB = 60, allowVideo = true } = {}) {
  return multer({
    dest: path.join(UPLOAD_DIR, 'tmp'),
    limits: { fileSize: maxMB * 1024 * 1024, files: 20 },
    fileFilter: (req, file, cb) => {
      const ok = IMAGE_TYPES.test(file.mimetype) || (allowVideo && VIDEO_TYPES.test(file.mimetype));
      cb(ok ? null : Object.assign(new Error('Only photos' + (allowVideo ? ' or MP4/WebM videos' : '') + ' can be uploaded'), { status: 400 }), ok);
    },
  });
}

// Moves a multer temp file into place. Returns { file, kind }.
async function store(f, { maxWidth = 2000 } = {}) {
  const id = crypto.randomBytes(8).toString('hex');
  if (VIDEO_TYPES.test(f.mimetype)) {
    const ext = f.mimetype === 'video/webm' ? '.webm' : f.mimetype === 'video/quicktime' ? '.mov' : '.mp4';
    const name = id + ext;
    fs.renameSync(f.path, path.join(UPLOAD_DIR, name));
    return { file: name, kind: 'video' };
  }
  if (sharp) {
    try {
      const name = id + '.webp';
      await sharp(f.path).rotate().resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(UPLOAD_DIR, name));
      fs.unlinkSync(f.path);
      return { file: name, kind: 'image' };
    } catch { /* fall through and keep the original */ }
  }
  const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[f.mimetype] || '.img';
  const name = id + ext;
  fs.renameSync(f.path, path.join(UPLOAD_DIR, name));
  return { file: name, kind: 'image' };
}

function remove(file) {
  if (!file || file.includes('/') || file.includes('..')) return;
  fs.rm(path.join(UPLOAD_DIR, file), { force: true }, () => {});
}

// Drops a multer temp file that won't be kept.
function discard(f) { if (f?.path) fs.rm(f.path, { force: true }, () => {}); }

module.exports = { uploader, store, remove, discard };
