/* The Offside Club: content loader.

   Reads text and images from Supabase and swaps them into the page.
   Everything here is an override, never a dependency: if Supabase is
   unconfigured, offline, paused or slow, each page keeps the text
   already written in its HTML. The site can never render empty
   because of this file. */
(function () {
  'use strict';

  var cfg = window.OFFSIDE_CMS || {};
  var configured = cfg.url && cfg.anonKey &&
                   cfg.url.indexOf('YOUR_') !== 0 &&
                   cfg.anonKey.indexOf('YOUR_') !== 0;

  window.OffsideCMS = { configured: configured, content: {} };
  if (!configured) return;

  var base = cfg.url.replace(/\/+$/, '');
  var headers = { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey };

  function api(path) {
    return fetch(base + '/rest/v1/' + path, { headers: headers })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); });
  }

  function publicUrl(objectPath) {
    return base + '/storage/v1/object/public/media/' + objectPath;
  }

  /* ---------- text + image overrides ---------- */

  function applyContent(rows) {
    var map = {};
    rows.forEach(function (r) { map[r.key] = r.value; });
    window.OffsideCMS.content = map;

    // plain text nodes
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var v = map[el.getAttribute('data-cms')];
      if (typeof v === 'string' && v !== '') el.textContent = v;
    });

    // fields that are allowed to contain markup, e.g. headings with <br>
    document.querySelectorAll('[data-cms-html]').forEach(function (el) {
      var v = map[el.getAttribute('data-cms-html')];
      if (typeof v === 'string' && v !== '') el.innerHTML = v;
    });

    // <img> sources, stored as object paths in the media bucket
    document.querySelectorAll('[data-cms-src]').forEach(function (el) {
      var v = map[el.getAttribute('data-cms-src')];
      if (!v) return;
      var url = /^https?:/.test(v) ? v : publicUrl(v);
      el.src = url;
      var zoom = el.closest('.media-zoom');
      if (zoom && zoom.tagName === 'A') zoom.href = url;
    });

    // page header background, consumed by --hero-img in style.css
    var hero = map['img.hero'];
    if (hero) {
      var heroUrl = /^https?:/.test(hero) ? hero : publicUrl(hero);
      document.documentElement.style.setProperty('--hero-img', 'url("' + heroUrl + '")');
    }

    // WhatsApp template: keep whatever number is already in the href and
    // only replace the message body, so the number never appears in the DB
    var wa = document.querySelector('[data-wa-template]');
    if (wa && map['join.wa.template']) {
      wa.href = wa.href.split('?')[0] + '?text=' + encodeURIComponent(map['join.wa.template']);
    }

    // re-run the stat counter so an edited number animates cleanly
    if (typeof window.OffsideCountUp === 'function') window.OffsideCountUp();

    document.dispatchEvent(new CustomEvent('cms:content', { detail: map }));
  }

  /* ---------- gallery ---------- */

  function applyPhotos(rows) {
    var grid = document.getElementById('galleryGrid');
    if (!grid || !rows.length) return;
    var empty = document.getElementById('emptyState');

    grid.innerHTML = '';
    rows.forEach(function (p) {
      var url = /^https?:/.test(p.path) ? p.path : publicUrl(p.path);
      var div = document.createElement('div');
      div.className = 'photo';
      var img = document.createElement('img');
      img.src = url;
      img.alt = p.caption || 'The Offside Club';
      img.loading = 'lazy';
      var dl = document.createElement('a');
      dl.className = 'dl';
      dl.href = url;
      dl.download = '';
      dl.title = 'Download';
      dl.textContent = '⬇';
      div.append(img, dl);
      grid.appendChild(div);
    });

    if (empty) empty.style.display = 'none';
    document.dispatchEvent(new CustomEvent('cms:photos'));
  }

  /* ---------- go ---------- */

  api('content?select=key,value')
    .then(applyContent)
    .catch(function () { /* keep the HTML that is already on the page */ });

  if (document.getElementById('galleryGrid')) {
    api('photos?select=path,caption,sort_order&order=sort_order.asc,created_at.desc')
      .then(applyPhotos)
      .catch(function () { /* keep the hardcoded photo list */ });
  }
})();
