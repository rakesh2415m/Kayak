// Minimal, safe Markdown → HTML for blog posts. All text is HTML-escaped first,
// so post content can never inject scripts. Supports: ## headings, **bold**,
// *italic*, [links](url), ![images](url), - / 1. lists, > quotes, --- rules.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function safeUrl(u) {
  const url = String(u).trim();
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(url) ? url : '#';
}

function inline(text) {
  let s = esc(text);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => `<img src="${safeUrl(url)}" alt="${alt}" loading="lazy">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const u = safeUrl(url);
    const ext = /^https?:\/\//i.test(u);
    return `<a href="${u}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

const slugify = (s) => String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function render(md) {
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  const out = [];
  const toc = [];
  let para = [];
  let list = null; // { tag, items }
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if ((m = line.match(/^(#{2,4})\s+(.+)$/))) {
      flushPara(); flushList();
      const lvl = m[1].length;
      const html = inline(m[2]);
      const id = slugify(m[2]);
      if (lvl === 2) toc.push({ id, text: m[2] });
      out.push(`<h${lvl} id="${id}">${html}</h${lvl}>`);
    } else if (/^---+$/.test(line.trim())) {
      flushPara(); flushList(); out.push('<hr>');
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara(); flushList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if ((m = line.match(/^\s*[-*]\s+(.+)$/))) {
      flushPara();
      if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; }
      list.items.push(m[1]);
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.+)$/))) {
      flushPara();
      if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; }
      list.items.push(m[1]);
    } else if ((m = line.match(/^!\[[^\]]*\]\([^)]+\)$/))) {
      flushPara(); flushList(); out.push(`<figure>${inline(line)}</figure>`);
    } else {
      flushList(); para.push(line.trim());
    }
  }
  flushPara(); flushList();
  return { html: out.join('\n'), toc };
}

function plainText(md) {
  return String(md || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#>*`_-]/g, '').replace(/\s+/g, ' ').trim();
}

module.exports = { render, plainText, slugify };
