/* DezSolution — til, animatsiyalar va lead formalar */
(function () {
  'use strict';

  // Agar sahifa fayl sifatida (file://) ochilsa, backend lokal serverda deb hisoblaymiz.
  // Aks holda — nisbiy manzil (sayt va backend bir domenda).
  var API_URL = (location.protocol === 'file:')
    ? 'http://localhost:3000/api/lead'
    : '/api/lead';
  var STORE_KEY = 'dez_lang';
  var currentLang = 'ru';

  /* ===================== I18N ===================== */
  function t(key) {
    var dict = (window.I18N && window.I18N[currentLang]) || {};
    return dict[key];
  }

  function applyLang(lang) {
    if (!window.I18N || !window.I18N[lang]) lang = 'ru';
    currentLang = lang;
    document.documentElement.setAttribute('lang', lang);

    // matnlar
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n'));
      if (val == null) return;
      var attr = el.getAttribute('data-i18n-attr'); // masalan meta content
      if (attr) el.setAttribute(attr, val);
      else el.innerHTML = val;
    });

    // placeholderlar
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n-ph'));
      if (val != null) el.setAttribute('placeholder', val);
    });

    // select optionlar
    document.querySelectorAll('[data-i18n-opts]').forEach(function (sel) {
      var opts = t(sel.getAttribute('data-i18n-opts'));
      if (!Array.isArray(opts)) return;
      sel.innerHTML = '';
      opts.forEach(function (label, i) {
        var o = document.createElement('option');
        o.textContent = label;
        o.value = i === 0 ? '' : label;
        sel.appendChild(o);
      });
    });

    // hisoblagich suffikslari (RU/UZ farqli)
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var uz = el.getAttribute('data-suffix-uz');
      if (uz != null) el.setAttribute('data-suffix-active', lang === 'uz' ? uz : (el.getAttribute('data-suffix') || ''));
    });

    // tugma holati
    document.querySelectorAll('.lang-switch__btn').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-lang') === lang);
    });

    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
  }

  document.querySelectorAll('.lang-switch__btn').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-lang')); });
  });

  // boshlang'ich til: URL ?lang= → saqlangan → brauzer → ru
  var urlLang = null;
  try {
    var m = location.search.match(/[?&]lang=(ru|uz)\b/);
    if (m) urlLang = m[1];
  } catch (e) {}
  var saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
  var initial = urlLang || saved || (navigator.language && navigator.language.indexOf('uz') === 0 ? 'uz' : 'ru');
  applyLang(initial);

  /* ============== SCROLL REVEAL ============== */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* stagger: bir konteynerdagi kartalarga ketma-ket kechikish */
  document.querySelectorAll('.grid').forEach(function (grid) {
    grid.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (i * 80) + 'ms';
    });
  });

  /* ============== COUNTER ANIMATION ============== */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix-active') || el.getAttribute('data-suffix') || '';
    var dur = 1400, start = null;
    function fmt(n) { return Math.round(n).toLocaleString('ru-RU'); }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target) + suffix;
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ============== HERO VIDEO — SCROLL PARALLAX ============== */
  // Skroll paytida hero videosi sekinroq siljiydi va ozgina kattalashadi.
  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var parallaxEls = prefersReduced ? [] : document.querySelectorAll('[data-parallax]');
  var heroSection = document.querySelector('.hero');

  /* ============== NAV SHADOW ON SCROLL ============== */
  var nav = document.querySelector('.nav');

  // Bitta rAF ichida barcha skroll effektlari (nav soyasi + parallaks)
  var scrollTicking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('is-scrolled', y > 8);

    if (parallaxEls.length && heroSection) {
      var heroH = heroSection.offsetHeight || 1;
      // hero ko'rinishda bo'lganda parallaksni hisoblaymiz
      if (y < heroH) {
        var p = y / heroH;                 // 0 → 1
        var shift = p * 60;                // px pastga
        var scale = 1.08 + p * 0.06;       // ozgina kattalashish
        for (var i = 0; i < parallaxEls.length; i++) {
          parallaxEls[i].style.transform =
            'scale(' + scale.toFixed(3) + ') translateY(' + shift.toFixed(1) + 'px)';
        }
      }
    }
    scrollTicking = false;
  }
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ============== MOBILE MENU (hamburger) ============== */
  var navToggle = document.querySelector('.js-nav-toggle');
  var navMenu = document.getElementById('nav-menu');
  function setMenu(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle('is-menu-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      setMenu(!nav.classList.contains('is-menu-open'));
    });
    // menyudagi havolaga bosilganda yopiladi
    navMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    // Esc bilan yopish
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ============== LEAD FORMS ============== */
  // Har qanday kiritilgan qiymatdan 9 xonali raqamni ajratib olamiz (hammasini qabul qiladi)
  function normalizePhone(raw) {
    var d = (raw || '').replace(/\D/g, '');
    if (d.indexOf('998') === 0) d = d.slice(3);
    if (d.length === 10 && d.indexOf('0') === 0) d = d.slice(1);
    return d.slice(0, 9);
  }
  function isValid(n) { return /^\d{9}$/.test(n); }

  /* ---- Telefon maskasi: XX-XXX-XX-XX ko'rinishida ko'rsatiladi ---- */
  // Yakuniy format regexi: +998 90-123-45-67
  var PHONE_RE = /^\+998 \d{2}-\d{3}-\d{2}-\d{2}$/;
  function maskPhone(digits) {
    var d = normalizePhone(digits);
    var p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)];
    return p.filter(Boolean).join('-');
  }
  function attachPhoneMask(input) {
    function reformat() {
      var masked = maskPhone(input.value);
      if (input.value !== masked) input.value = masked;
    }
    input.addEventListener('input', reformat);
    input.addEventListener('paste', function () { setTimeout(reformat, 0); });
    reformat();
  }
  document.querySelectorAll('input[name="phone"]').forEach(attachPhoneMask);

  function setStatus(form, msg, type) {
    var el = form.querySelector('.js-status');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('is-ok', 'is-err');
    if (type) el.classList.add('is-' + type);
  }

  function handleSubmit(e) {
    e.preventDefault();
    var form = e.currentTarget;
    var phoneInput = form.querySelector('input[name="phone"]');
    var nine = normalizePhone(phoneInput ? phoneInput.value : '');
    // To'liq terilganda "+998 XX-XXX-XX-XX" formatiga mos kelishi shart
    var fullFormatted = '+998 ' + maskPhone(nine);

    if (!isValid(nine) || !PHONE_RE.test(fullFormatted)) {
      setStatus(form, t('form.invalid'), 'err');
      if (phoneInput) phoneInput.focus();
      form.classList.add('shake');
      setTimeout(function () { form.classList.remove('shake'); }, 500);
      return;
    }

    var payload = {
      phone: '+998' + nine,
      name: (form.querySelector('input[name="name"]') || {}).value || '',
      service: (form.querySelector('select[name="service"]') || {}).value || '',
      source: form.getAttribute('data-source') || 'unknown',
      lang: currentLang,
      page: location.href
    };

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    setStatus(form, t('form.sending'), null);

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json().catch(function () { return {}; });
      })
      .then(function () {
        form.reset();
        setStatus(form, t('form.ok'), 'ok');
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', { event_category: 'lead', event_label: payload.source });
        }
      })
      .catch(function (err) {
        // Konsolda aniq sabab (server o'chiq / noto'g'ri manzil / CORS)
        console.error('[DezSolution] Formani yuborishda xatolik:', err && err.message, '→ API:', API_URL);
        setStatus(form, t('form.err'), 'err');
      })
      .finally(function () { if (btn) btn.disabled = false; });
  }

  document.querySelectorAll('.js-lead').forEach(function (form) {
    form.addEventListener('submit', handleSubmit);
  });
})();
