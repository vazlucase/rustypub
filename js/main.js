/**
 * main.js — Orquestrador principal
 * v2.0 — ELITE: form com fallback WhatsApp, rate limiting client-side, honeypot
 */
import { renderGaleria }         from './modules/galeria.js';
import { renderEventosPassados } from './modules/eventosPassados.js';
import { initLightbox }          from './modules/lightbox.js';
import { validateForm, setFieldError } from './utils/helpers.js';
import { observeAll }            from './utils/reveal.js';

document.addEventListener('DOMContentLoaded', () => {
  renderGaleria();
  renderEventosPassados();
  initLightbox();
  observeAll(document);
  initContactForm();
  initHeader();
  initStatsCounter();
  initSmoothScroll();
  initMenuTabs();
});

/* ─── Menu Tabs ─── */
function initMenuTabs() {
  const tabs   = document.querySelectorAll('.menu-tab');
  const panels = document.querySelectorAll('.menu-panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.toggle('active', t.dataset.tab === target);
        t.setAttribute('aria-selected', t.dataset.tab === target ? 'true' : 'false');
      });

      panels.forEach(p => {
        const active = p.id === `tab-${target}`;
        p.classList.toggle('hidden', !active);
        if (active) {
          p.querySelectorAll('.reveal:not(.visible)').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) el.classList.add('visible');
          });
        }
      });
    });
  });
}

/* ─── Formulário de Contato ─── */

// Rate limiting simples no client (não substitui server-side)
const RATE_LIMIT_MS = 30_000;
let lastSubmitTime  = 0;

function initContactForm() {
  const form      = document.getElementById('contact-form');
  const statusDiv = document.getElementById('form-status');
  const submitBtn = document.getElementById('contact-submit');
  if (!form || !statusDiv || !submitBtn) return;

  // Limpa erros inline ao digitar
  form.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => setFieldError(input, ''));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus(statusDiv);

    // Honeypot check
    const honeypot = form.querySelector('[name="_gotcha"]');
    if (honeypot?.value) return; // bot detectado — falha silenciosa

    // Rate limit
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
      setStatus(statusDiv, 'error', `Aguarde ${wait}s antes de enviar novamente.`);
      return;
    }

    if (!validateForm(form)) {
      setStatus(statusDiv, 'error', 'Corrija os campos indicados acima.');
      // Foca o primeiro campo com erro
      const firstError = form.querySelector('.input--error');
      firstError?.focus();
      return;
    }

    const name    = form.querySelector('[name="name"]').value.trim();
    const email   = form.querySelector('[name="email"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();

    setLoading(submitBtn, true);
    lastSubmitTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 8000);

      const r = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, message }),
        signal:  controller.signal,
      });

      clearTimeout(timeout);
      const d = await r.json().catch(() => ({}));

      if (r.ok) {
        setStatus(statusDiv, 'success', '✅ Mensagem enviada! Responderemos em breve.');
        form.reset();
        lastSubmitTime = Date.now();
      } else {
        setStatus(statusDiv, 'error', d.error || 'Erro ao enviar. Tente novamente.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus(statusDiv, 'error', 'Tempo esgotado. Tente via WhatsApp.');
      } else {
        // Fallback para WhatsApp quando API não está disponível
        const waText = encodeURIComponent(`Olá! Me chamo ${name} (${email}).\n\n${message}`);
        const waUrl  = `https://wa.me/5591991567596?text=${waText}`;
        setStatusHTML(statusDiv, 'info',
          `Sem conexão com o servidor. <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="status-wa-link">Envie pelo WhatsApp</a> — é mais rápido! 🤙`
        );
      }
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

const setStatus    = (el, t, m) => { el.textContent = m; el.dataset.status = t; };
const setStatusHTML = (el, t, html) => { el.innerHTML = html; el.dataset.status = t; };
const clearStatus  = (el)       => { el.textContent = ''; delete el.dataset.status; };
const setLoading   = (btn, l)   => {
  btn.disabled = l;
  btn.querySelector('.btn-text').hidden    = l;
  btn.querySelector('.btn-loading').hidden = !l;
};

/* ─── Header ─── */
function initHeader() {
  const header   = document.getElementById('header');
  const heroBg   = document.getElementById('hero-bg');
  const toggle   = document.getElementById('mobile-menu');
  const nav      = document.querySelector('.header__nav');
  const navLinks = document.querySelectorAll('.header__nav a');
  const sections = document.querySelectorAll('section[id]');
  const prefersR = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 60);
    if (heroBg && !prefersR) heroBg.style.transform = `scale(1.05) translateY(${y * .12}px)`;

    let cur = '';
    sections.forEach(s => { if (y + 100 >= s.offsetTop) cur = s.id; });
    navLinks.forEach(a => {
      const href = a.getAttribute('href')?.slice(1);
      const act  = href === cur;
      a.classList.toggle('active', act);
      act ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const closeNav = () => {
    nav?.classList.remove('open');
    toggle?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };
  toggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  });
  navLinks.forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('click', e => {
    if (!toggle?.contains(e.target) && !nav?.contains(e.target)) closeNav();
  });
  // Fecha menu mobile com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeNav();
  });
}

/* ─── Counter animado nas stats ─── */
function initStatsCounter() {
  const prefersR = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = Number(el.dataset.target);
      if (!target) return;
      observer.unobserve(el);

      if (prefersR) { el.textContent = target; return; }

      const dur = 1800;
      const step = 16;
      const inc  = target / (dur / step);
      let   cur  = 0;

      const tick = () => {
        cur = Math.min(cur + inc, target);
        el.textContent = target < 10 ? cur.toFixed(1) : Math.floor(cur);
        if (cur < target) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .5 });

  document.querySelectorAll('.stats__num[data-target]').forEach(el => observer.observe(el));
}

/* ─── Sticky CTA mobile ─── */
/* ─── Smooth scroll com offset de header ─── */
function initSmoothScroll() {
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 70;
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
      const id = this.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: 'smooth' });
      // Atualiza foco para acessibilidade
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}
