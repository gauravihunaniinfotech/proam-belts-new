const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
const on = (el, ev, fn, opt) => { if (el) el.addEventListener(ev, fn, opt); };
let lastFocus = null;

function ready(fn) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}

ready(function () {

  /* ---------- missing-image placeholders ---------- */
  function markMissing(img) { const p = img.closest('.ph'); if (p) p.classList.add('is-missing'); }
  $$('.ph img').forEach(img => {
    on(img, 'error', () => markMissing(img));
    if (img.complete && img.naturalWidth === 0) markMissing(img);
  });

  /* ---------- sticky header state ---------- */
  const hdr = $('#hdr');
  function onScroll() { if (hdr) hdr.classList.toggle('is-stuck', window.scrollY > 10); }
  on(window, 'scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- desktop dropdowns ---------- */
  function closeDropdowns() {
    $$('.has-dd').forEach(li => {
      li.classList.remove('is-open');
      const b = $('button', li); if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  $$('.has-dd').forEach(li => {
    const btn = $('button', li);
    on(btn, 'click', e => {
      e.stopPropagation();
      const open = !li.classList.contains('is-open');
      closeDropdowns();
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  on(document, 'click', closeDropdowns);
  on(document, 'keydown', e => { if (e.key === 'Escape') { closeDropdowns(); closeSearch(); } });

  /* ---------- focus trap ---------- */
  function trap(box, e) {
    if (e.key !== 'Tab') return;
    const f = $$('a[href],button:not([disabled]),input,summary', box).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- mobile drawer ---------- */
  const drawer = $('#drawer'), scrim = $('#scrim'), burger = $('#burger'), drawerClose = $('#drawerClose');
  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    if (scrim) scrim.hidden = false;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (drawerClose) drawerClose.focus();
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (scrim) scrim.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  on(burger, 'click', openDrawer);
  on(drawerClose, 'click', closeDrawer);
  on(scrim, 'click', closeDrawer);
  on(drawer, 'keydown', e => trap(drawer, e));
  on(drawer, 'click', e => { if (e.target.closest('a')) closeDrawer(); });
  on(window, 'resize', () => {
    if (drawer && window.innerWidth > 991 && drawer.classList.contains('is-open')) closeDrawer();
  });

  /* ---------- search overlay ---------- */
  const search = $('#search');
  function openSearch() {
    if (!search) return;
    lastFocus = document.activeElement; search.hidden = false;
    document.body.style.overflow = 'hidden';
    const q = $('#q'); if (q) q.focus();
  }
  function closeSearch() {
    if (!search || search.hidden) return;
    search.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  on($('#searchOpen'), 'click', openSearch);
  on($('#searchClose'), 'click', closeSearch);
  on(search, 'keydown', e => trap(search, e));
  on(search, 'click', e => { if (e.target === search) closeSearch(); });



    /* ---------- hero: tilt on pointer ---------- */
  (function () {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stage = $('.hero__stage'), frame = $('.hero__frame');
    if (!stage || !frame || reduced || !window.matchMedia('(hover:hover)').matches) return;
    frame.style.transition = 'transform .4s ease-out';
    on(stage, 'mousemove', e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      frame.style.transform = 'perspective(1100px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg)';
    });
    on(stage, 'mouseleave', () => { frame.style.transform = ''; });
  })();

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveal ---------- */
  (function () {
    const els = $$('.reveal');
    if (!els.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    els.forEach((el, i) => { el.style.transitionDelay = (i % 5) * 80 + 'ms'; io.observe(el); });
  })();

  /* ---------- stats count-up ---------- */
  (function () {
    const nums = $$('[data-count]');
    if (!nums.length || prefersReduced || !('IntersectionObserver' in window)) return;

    function run(el) {
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const dur = 1700;
      let t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = (target * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(n => io.observe(n));
  })();


    /* ---------- category expanding panels (autoplay) ---------- */
  (function () {
    const section = $('.cats');
    const panels = $$('.cats .panel');
    if (!panels.length) return;

    /* images: stay hidden until fully decoded, then fade in sharp */
    $$('.panel__img img').forEach(img => {
      if (img.complete && img.naturalWidth) return;
      img.classList.add('is-pending');
      const reveal = () => img.classList.remove('is-pending');
      on(img, 'load', () => {
        (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(reveal);
      });
      on(img, 'error', reveal);
    });

    const canHover = window.matchMedia('(hover:hover)').matches;
    let active = 0, auto = null, visible = true;

    function activate(i) {
      panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
      active = i;
    }
    function stop() { clearInterval(auto); auto = null; }
    function start() {
      stop();
      if (prefersReduced || !visible) return;
      auto = setInterval(() => activate((active + 1) % panels.length), 3000);
    }

    panels.forEach((p, i) => {
      on(p, 'mouseenter', () => { stop(); activate(i); });
      on(p, 'mouseleave', start);
      on(p, 'focus', () => { stop(); activate(i); });
      on(p, 'blur', start);
      // touch: first tap opens the panel, second tap follows the link
      on(p, 'click', e => {
        if (!canHover && active !== i) { e.preventDefault(); stop(); activate(i); }
      });
    });

    // only autoplay while the section is on screen
    if ('IntersectionObserver' in window && section) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }, { threshold: .25 }).observe(section);
    }

    activate(0);
    start();
  })();

    

    /* ---------- 04 shop carousel ---------- */
  (function () {
    const track = $('#shopTrack');
    if (!track) return;
    const cards = $$('.p-card', track);
    const chips = $$('.chip');
    const prev = $('#shopPrev'), next = $('#shopNext');
    const cartBadge = $('#cartCount');

    /* safe storage helpers */
    const store = {
      get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
      set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    };

    /* arrows */
    function step() {
      const c = $('.p-card:not([hidden])', track);
      return c ? c.getBoundingClientRect().width + 20 : 300;
    }
    function updateArrows() {
      if (!prev || !next) return;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    }
    on(prev, 'click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    on(next, 'click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    on(track, 'scroll', updateArrows, { passive: true });
    on(window, 'resize', updateArrows);

    /* filter chips */
    chips.forEach(chip => on(chip, 'click', () => {
      const f = chip.dataset.f;
      chips.forEach(c => {
        const isOn = c === chip;
        c.classList.toggle('is-on', isOn);
        c.setAttribute('aria-pressed', String(isOn));
      });
      cards.forEach(card => {
        const show = f === 'all' || card.dataset.tags.split(' ').includes(f);
        card.hidden = !show;
      });
      track.scrollTo({ left: 0, behavior: 'auto' });
      updateArrows();
    }));

    /* wishlist hearts */
    let wish = store.get('proam_wish', []);
    cards.forEach(card => {
      const btn = $('.heart', card);
      const id = card.dataset.id;
      const set = isOn => { btn.classList.toggle('is-on', isOn); btn.setAttribute('aria-pressed', String(isOn)); };
      set(wish.includes(id));
      on(btn, 'click', () => {
        wish = wish.includes(id) ? wish.filter(w => w !== id) : wish.concat(id);
        set(wish.includes(id));
        store.set('proam_wish', wish);
      });
    });

    /* toast */
    let toastEl = null, toastTimer;
    function toast(msg) {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'toast';
        toastEl.setAttribute('role', 'status');
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = msg;
      toastEl.classList.add('is-show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2200);
    }

    /* add to cart (front-end demo) */
    let cart = store.get('proam_cart', []);
    function renderCount() {
      if (!cartBadge) return;
      cartBadge.textContent = cart.reduce((s, i) => s + i.qty, 0);
    }
    renderCount();

    cards.forEach(card => {
      const btn = $('.add-btn', card);
      on(btn, 'click', () => {
        const id = card.dataset.id;
        const found = cart.find(c => c.id === id);
        if (found) found.qty++;
        else cart.push({ id, name: card.dataset.name, price: +card.dataset.price, img: $('.p-img img', card).getAttribute('src'), qty: 1 });
        store.set('proam_cart', cart);
        renderCount();
        if (cartBadge) { cartBadge.classList.remove('is-bump'); void cartBadge.offsetWidth; cartBadge.classList.add('is-bump'); }
        const label = $('span', btn);
        btn.classList.add('is-added'); label.textContent = 'Added';
        setTimeout(() => { btn.classList.remove('is-added'); label.textContent = 'Add'; }, 1400);
        toast(card.dataset.name + ' added to cart');
      });
    });

    updateArrows();



      /* ---------- 06 spotlight tabs ---------- */
    (function () {
      const tabs = $$('.tab2'), panels = $$('.tabp');
      if (!tabs.length || !panels.length) return;

      function selectTab(t, focus) {
        const target = t.getAttribute('aria-controls');
        tabs.forEach(x => {
          const isOn = x === t;
          x.classList.toggle('is-on', isOn);
          x.setAttribute('aria-selected', String(isOn));
          x.tabIndex = isOn ? 0 : -1;
        });
        panels.forEach(p => {
          const show = p.id === target;
          p.hidden = !show;
          p.classList.toggle('is-on', show);
        });
        if (focus) t.focus();
      }

      tabs.forEach((t, i) => {
        on(t, 'click', () => selectTab(t));
        on(t, 'keydown', e => {
          let n = null;
          if (e.key === 'ArrowRight') n = i + 1;
          else if (e.key === 'ArrowLeft') n = i - 1;
          else if (e.key === 'Home') n = 0;
          else if (e.key === 'End') n = tabs.length - 1;
          if (n === null) return;
          e.preventDefault();
          selectTab(tabs[(n + tabs.length) % tabs.length], true);
        });
      });

      selectTab(tabs.find(t => t.classList.contains('is-on')) || tabs[0]);
    })();


      /* ---------- 07 animated process timeline ---------- */
    (function () {
      const tl = $('#timeline');
      if (!tl) return;
      const steps = $$('.step', tl), fill = $('#timelineFill');
      let lit = -1;

      function light(n) {
        steps[n].classList.add('is-lit');
        lit = Math.max(lit, n);
        if (fill) fill.style.setProperty('--p', (lit / (steps.length - 1) * 100) + '%');
      }

      if (!('IntersectionObserver' in window) || prefersReduced) {
        steps.forEach((s, k) => light(k));
        return;
      }

      const desktop = window.matchMedia('(min-width: 1025px)');
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          if (desktop.matches) {
            // desktop: light all steps one after another when the timeline enters view
            if (en.target === tl) {
              steps.forEach((s, k) => setTimeout(() => light(k), 350 + k * 420));
              io.unobserve(tl);
            }
          } else if (en.target !== tl) {
            // tablet / phone: light each step as it scrolls into view
            light(steps.indexOf(en.target));
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.45 });

      io.observe(tl);
      steps.forEach(s => io.observe(s));
    })();



      /* ---------- 08 gallery: render, filter, lightbox ---------- */
    (function () {
      const grid = $('#galleryGrid');
      if (!grid) return;

      const CDN = 'https://proambelts.com/cdn/shop/files/';
      /* c = caption, cat = filter, v = 1 shows the green verified tick */
      const GALLERY = [
        { f: '485141120_10235561199714792_2080231454445274156_n.jpg?v=1785923381', n: 'John Smith', c: '2025 State Champion', cat: 'boxing', v: 1 },
        { f: 'EBI_with_custom_stock_LOKI_belt.png?v=1785923383', n: 'Michael Johnson', c: '2025 National Champion', cat: 'wrestling', v: 1 },
        { f: 'bakersfield_combat_belt.jpg?v=1785923382', n: 'David Williams', c: '2025 Boxing Champion', cat: 'mma', v: 1 },
        { f: 'chilli_cook_off_belt.jpg?v=1785923381', n: 'Alex Carter', c: '2025 MMA Champion', cat: 'entertainment', v: 1 },
        { f: 'EBi_custom_championship_title_Belt_proambelts_-_Copy.png?v=1785923382', n: 'James Anderson', c: '2025 World Champion', cat: 'wrestling', v: 1 },
        { f: 'military_championship_custom_award_belt_proambelts.jpg?v=1785923382', n: 'Robert Taylor', c: '2025 Jiu-Jitsu Champion', cat: 'sports', v: 1 },
        { f: 'cal_ripken_jr_under_armour_custom_championship_title_belts_baseball_awards.jpg?v=1785923381', n: 'Daniel Brown', c: '2025 Regional Champion', cat: 'sports', v: 0 },
        { f: 'malibu_ken_and_barbie_custom_championship_belt.jpg?v=1785923381', n: 'Jason Miller', c: '2025 World Champion', cat: 'entertainment', v: 1 },
        { f: 'convert.webp?v=1785923381', n: 'Kevin Moore', c: '2025 Wrestling Champion', cat: 'wrestling', v: 1 },
        { f: 'Screenshot_668.png?v=1785923382', n: 'Anthony Thomas', c: '2025 MMA Champion', cat: 'boxing', v: 1 },
        { f: 'peachbowl_championship_custom_belt.jpg?v=1785923380', n: 'Chris Wilson', c: '2025 State Champion', cat: 'sports', v: 1 },
        { f: 'medusa_fight_championship_title_award_belts.png?v=1785923382', n: 'Matthew Jackson', c: '2025 Boxing Champion', cat: 'mma', v: 1 },
        { f: 'Screenshot_26.png?v=1785923382', n: 'Justin Harris', c: '2025 National Champion', cat: 'mma', v: 1 },
        { f: 'fiesta_bowl_flag_football_female_women_s_championship_title_Belt.jpg?v=1785923381', n: 'Ryan Martinez', c: '2025 National Champion', cat: 'sports', v: 0 },
        { f: 'Gc7ev0jXUAAD0zF.jpg?v=1785923383', n: 'Eric Martin', c: '2025 World Champion', cat: 'entertainment', v: 1 },
        { f: 'Rectangle_26.png?v=1782817270', n: 'Marcus Thompson', c: '2025 Boxing Champion', cat: 'boxing', v: 1 },
        { f: 'custom_engraved_blank_championship_title_award_belts.png?v=1785923382', n: 'Marcus Thompson', c: '2025 Boxing Champion', cat: 'boxing', v: 1 },
        { f: 'ac516877-99aa-485b-aab9-d380eb22d15a.jpg?v=1785923380', n: 'Marcus Thompson', c: '2025 Boxing Champion', cat: 'boxing', v: 1 }
      ];

      const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"><rect width="600" height="450" fill="#0d0d0d"/>' +
        '<text x="300" y="225" fill="#6cc417" font-family="Impact,Arial Narrow,sans-serif" font-size="54" text-anchor="middle">PROAM BELTS</text>' +
        '<text x="300" y="268" fill="#8a8a8a" font-family="Arial,sans-serif" font-size="18" letter-spacing="4" text-anchor="middle">CUSTOM CHAMPIONSHIP BELTS</text></svg>');

      const tick = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.5l3 3 6-7" fill="none" stroke="#050505" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      /* build tiles */
      GALLERY.forEach((g, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'g-item';
        b.dataset.cat = g.cat;
        b.dataset.idx = idx;
        b.setAttribute('aria-label', 'Open photo: ' + g.n + ', ' + g.c);
        b.innerHTML =
          '<img loading="lazy" decoding="async" src="' + CDN + g.f + '&width=800" alt="Custom ProAm championship belt – ' + g.c + '">' +
          '<span class="g-cap"><strong>' + g.n + (g.v ? tick : '') + '</strong><small>' + g.c + '</small></span>';
        const img = $('img', b);
        on(img, 'error', () => { if (img.src !== PLACEHOLDER) img.src = PLACEHOLDER; });
        grid.appendChild(b);
      });

      /* filters */
      const filters = $$('#galleryFilters .gal__filter');
      let visible = [];
      function apply(f) {
        visible = [];
        $$('.g-item', grid).forEach(el => {
          const show = f === 'all' || el.dataset.cat === f;
          el.hidden = !show;
          if (show) {
            visible.push(el);
            el.style.animationDelay = (visible.length * 0.04) + 's';
            el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
          }
        });
      }
      filters.forEach(b => on(b, 'click', () => {
        filters.forEach(x => { x.classList.remove('is-on'); x.setAttribute('aria-selected', 'false'); });
        b.classList.add('is-on'); b.setAttribute('aria-selected', 'true');
        apply(b.dataset.filter);
      }));
      apply('all');

      /* lightbox */
      const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
      if (!lb) return;
      let pos = 0, opener = null;

      function show(n) {
        if (!visible.length) return;
        pos = (n + visible.length) % visible.length;
        const g = GALLERY[visible[pos].dataset.idx];
        lbImg.src = CDN + g.f + '&width=1400';
        lbImg.alt = 'Custom ProAm championship belt – ' + g.c;
        lbCap.textContent = g.n + ' — ' + g.c;
      }
      function onKey(e) {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') show(pos + 1);
        else if (e.key === 'ArrowLeft') show(pos - 1);
        else trap(lb, e);
      }
      function open(el) {
        opener = el;
        lb.hidden = false;
        document.body.style.overflow = 'hidden';
        show(visible.indexOf(el));
        document.addEventListener('keydown', onKey);
        setTimeout(() => $('#lbClose').focus(), 30);
      }
      function close() {
        lb.hidden = true;
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKey);
        if (opener) opener.focus();
      }

      on(grid, 'click', e => { const it = e.target.closest('.g-item'); if (it) open(it); });
      on($('#lbClose'), 'click', close);
      on($('#lbPrev'), 'click', () => show(pos - 1));
      on($('#lbNext'), 'click', () => show(pos + 1));
      on(lb, 'click', e => { if (e.target === lb) close(); });

      /* swipe on touch */
      let sx = null;
      on(lb, 'touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
      on(lb, 'touchend', e => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) show(pos + (dx < 0 ? 1 : -1));
        sx = null;
      });
    })();

      /* ---------- 10 promo: 3D tilt on pointer ---------- */
    (function () {
      const media = $('.promo__media'), frame = $('#promoFrame');
      if (!media || !frame || prefersReduced || !window.matchMedia('(hover:hover)').matches) return;
      on(media, 'mousemove', e => {
        const r = media.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        frame.style.transform = 'perspective(900px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg)';
      });
      on(media, 'mouseleave', () => { frame.style.transform = ''; });
    })();



      /* ---------- 12 footer: newsletter + year ---------- */
    (function () {
      const yr = $('#footYear');
      if (yr) yr.textContent = new Date().getFullYear();

      const form = $('#nl'), input = $('#nlEmail'), msg = $('#nlMsg');
      if (!form || !input || !msg) return;
      const row = $('.nl__row', form), btn = $('button[type="submit"]', form);
      if (!row || !btn) return;

      const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      const originalMsg = msg.textContent;
      const originalBtn = btn.innerHTML;

      function setState(type, text) {
        row.classList.toggle('is-err', type === 'err');
        row.classList.toggle('is-ok', type === 'ok');
        msg.classList.toggle('is-err', type === 'err');
        msg.classList.toggle('is-ok', type === 'ok');
        input.setAttribute('aria-invalid', type === 'err' ? 'true' : 'false');
        msg.textContent = text;
      }

      /* clear the error as soon as the person starts typing again */
      on(input, 'input', () => {
        if (row.classList.contains('is-err') || row.classList.contains('is-ok')) setState('', originalMsg);
      });

      on(form, 'submit', async e => {
        e.preventDefault();
        if (btn.disabled) return;

        const v = input.value.trim();
        if (!v) { setState('err', 'Please enter your email address.'); input.focus(); return; }
        if (!re.test(v)) { setState('err', 'That email doesn’t look right. Please check it and try again.'); input.focus(); return; }
        input.value = v;

        btn.disabled = true;
        btn.textContent = 'Sending…';
        try {
          /* posts to the form's action URL (your Shopify customer form).
            no-cors = we can send it, but the browser won't let us read the reply */
          await fetch(form.getAttribute('action'), { method: 'POST', body: new FormData(form), mode: 'no-cors' });
          setState('ok', 'Welcome to the championship circle! Check your inbox soon.');
          form.reset();
        } catch (err) {
          setState('err', 'Something went wrong. Please check your connection and try again.');
        } finally {
          btn.disabled = false;
          btn.innerHTML = originalBtn;
        }
      });
    })();
  })();
});
