(function () {
  'use strict';
  var form = document.getElementById('reviewForm');
  if (!form) return;
  var msg = form.querySelector('.form-msg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    msg.className = 'form-msg';
    msg.textContent = 'Sending…';
    fetch('/api/reviews', { method: 'POST', body: new FormData(form) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Could not send'); return d; }); })
      .then(function () {
        form.innerHTML = '<h2 class="h3">Thank you!</h2><p class="muted">Your review has been sent. It will appear on the site after a quick check.</p><a class="btn btn-secondary" href="/">Back to the home page</a>';
      })
      .catch(function (err) { btn.disabled = false; msg.className = 'form-msg err'; msg.textContent = err.message; });
  });
})();
