/* The Offside Club: shared interactions.
   Progressive enhancement: every effect here is additive. If this file fails
   to load, the pages still render fully (reveal attributes are set from JS,
   so nothing is hidden by CSS alone). */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.navtoggle');
  var links = document.querySelector('.navlinks');

  if (toggle && links) {
    if (!links.id) links.id = 'primary-nav';
    toggle.setAttribute('aria-controls', links.id);
    toggle.setAttribute('aria-expanded', 'false');

    var setNav = function (open) {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '✕' : '☰';
    };

    toggle.addEventListener('click', function () {
      setNav(!links.classList.contains('open'));
    });

    // tapping a link, or Escape, closes the menu
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        setNav(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Nav shadow on scroll ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 12); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll reveal ---------- */
  // Groups of siblings that should animate in sequence rather than all at once.
  var GROUPS = [
    'header.hero > .wrap > *',
    'header.hero > *:not(.wrap)',
    'section > *',
    '.grid-3 > .card',
    '.gallery-grid > .photo',
    '.story-row',
    '.footer-links'
  ];

  var revealables = [];
  GROUPS.forEach(function (sel) {
    var byParent = new Map();
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.hasAttribute('data-reveal')) return;
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      var list = byParent.get(el.parentNode) || [];
      list.push(el);
      byParent.set(el.parentNode, list);
    });
    byParent.forEach(function (list) {
      list.forEach(function (el, i) {
        el.setAttribute('data-reveal', '');
        el.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms');
        revealables.push(el);
      });
    });
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
        countUp(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Stat count-up ---------- */
  // Only touches pure integers, so "Sat, Aug 16" is left exactly as written.
  function countUp(scope) {
    scope.querySelectorAll('.stats b').forEach(function (el) {
      if (el.dataset.counted) return;
      var raw = el.textContent.trim();
      if (!/^\d+$/.test(raw)) return;
      el.dataset.counted = '1';

      var target = parseInt(raw, 10);
      if (reduceMotion) { el.textContent = String(target); return; }

      var start = performance.now();
      var dur = 1100;
      el.textContent = '0';
      (function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    });
  }
  if (reduceMotion || !('IntersectionObserver' in window)) countUp(document);

  // cms.js calls this after it swaps in edited stat values, so the counter
  // animates the new number instead of fighting the old one mid-animation
  window.OffsideCountUp = function () {
    document.querySelectorAll('.stats b').forEach(function (el) { delete el.dataset.counted; });
    countUp(document);
  };

  /* ---------- WhatsApp booking link ---------- */
  // The HTML ships only the /qr/ link, which contains no phone number, so
  // anything reading the raw source finds nothing to harvest. The number-format
  // link is assembled here at runtime because WhatsApp honours a prefilled
  // ?text= on that format only. Not encryption, just not sitting in the markup.
  var waBtn = document.querySelector('[data-wa-template]');
  if (waBtn) {
    var msg = [
      'Offside Club, count me in for a game ⚽',
      '',
      'Name:',
      'How many of us:',
      'Position you will claim to play:',
      'Preferred day:',
      'Rough time:',
      '',
      'Boots optional. Enthusiasm mandatory.'
    ].join('\n');
    try {
      waBtn.href = 'https://wa.me/' + atob('OTE5NTU3NzQ4NjY1') + '?text=' + encodeURIComponent(msg);
    } catch (e) { /* keep the QR fallback already in the href */ }
  }

  /* ---------- Gallery lightbox ---------- */
  var grid = document.getElementById('galleryGrid');
  if (grid) {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo viewer');
    box.innerHTML = '<button class="lightbox-close" aria-label="Close">✕</button><img alt="">';
    document.body.appendChild(box);

    var boxImg = box.querySelector('img');
    var lastFocus = null;

    var closeBox = function () {
      box.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };

    grid.addEventListener('click', function (e) {
      if (e.target.closest('.dl')) return; // let downloads through
      var img = e.target.closest('.photo') && e.target.closest('.photo').querySelector('img');
      if (!img) return;
      lastFocus = document.activeElement;
      boxImg.src = img.src;
      boxImg.alt = img.alt || '';
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
      box.querySelector('.lightbox-close').focus();
    });

    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.lightbox-close')) closeBox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('open')) closeBox();
    });
  }
})();
