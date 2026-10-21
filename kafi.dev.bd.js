(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  // ===== Mobile menu =====
  const menuBtn = $('#menuBtn');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      menuBtn.focus();
    }
  });

  // ===== Header shadow =====
  const header = $('#header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ===== Active nav link (scroll-spy) =====
  const navLinks = new Map($$('a', nav).map((a) => [a.getAttribute('href').slice(1), a]));
  if (hasIO) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link, id) => {
          const on = id === entry.target.id;
          link.classList.toggle('active', on);
          if (on) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('section[id]').forEach((s) => navLinks.has(s.id) && spy.observe(s));
  }

  // ===== Reveal on scroll =====
  const revealEls = $$('.reveal');
  if (hasIO && !reduceMotion) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('show');
        revealObs.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 80 + 'ms';
      revealObs.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('show'));
  }

  // ===== Counter animation (final value is already in the HTML) =====
  const runCounter = (el) => {
    const to = Number(el.dataset.to) || 0;
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.floor(p * to);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = to;
    };
    requestAnimationFrame(tick);
  };
  if (hasIO && !reduceMotion) {
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        runCounter(e.target);
        countObs.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    $$('.count').forEach((c) => { c.textContent = '0'; countObs.observe(c); });
  }

  // ===== Hero photo fallback =====
  const heroImg = $('#heroImg');
  if (heroImg) {
    const box = heroImg.closest('.hero-img');
    const showFallback = () => box.classList.add('no-photo');
    heroImg.addEventListener('error', showFallback);
    if (heroImg.complete && heroImg.naturalWidth === 0) showFallback();
  }

  // ===== Copy code button =====
  const copyBtn = $('#copyBtn');
  const codeText = $('#codeText');
  if (copyBtn && codeText) {
    const icon = (cls) => `<i aria-hidden="true" class="${cls}"></i>`;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeText.innerText);
        copyBtn.innerHTML = icon('fa-solid fa-check');
        copyBtn.setAttribute('aria-label', 'Copied');
      } catch (err) {
        copyBtn.innerHTML = icon('fa-solid fa-xmark');
        copyBtn.setAttribute('aria-label', 'Copy failed');
      }
      setTimeout(() => {
        copyBtn.innerHTML = icon('fa-regular fa-copy');
        copyBtn.setAttribute('aria-label', 'Copy code');
      }, 1500);
    });
  }

  // ===== Footer year =====
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Contact form (opens the visitor's email app, pre-filled) =====
  const form = $('#contactForm');
  const formMsg = $('#formMsg');
  const CONTACT_EMAIL = 'me@kafi.dev.bd';
  const say = (text, ok = true) => {
    formMsg.textContent = text;
    formMsg.style.color = ok ? '#2ee15a' : '#ff6b6b';
    setTimeout(() => { formMsg.textContent = ''; }, 5000);
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      say('Please fill in all fields with a valid email.', false);
      return;
    }
    const d = new FormData(form);
    const subject = encodeURIComponent(`[kafi.dev.bd] ${d.get('subject')}`);
    const body = encodeURIComponent(
      `Name: ${String(d.get('name')).trim()}\nEmail: ${String(d.get('email')).trim()}\n\n${String(d.get('message')).trim()}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    say('Opening your email app to send the message...');
  });
})();
