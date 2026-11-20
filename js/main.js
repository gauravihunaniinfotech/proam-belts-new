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
  })();
});
