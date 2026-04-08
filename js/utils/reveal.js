/**
 * reveal.js — Módulo singleton de scroll-reveal
 *
 * PROBLEMA que resolve:
 *   IntersectionObserver configurado no DOMContentLoaded não enxerga
 *   elementos inseridos dinamicamente depois (via setTimeout nos módulos).
 *
 * SOLUÇÃO:
 *   MutationObserver global que detecta QUALQUER novo nó com .reveal
 *   adicionado ao DOM em qualquer momento e o passa para o
 *   IntersectionObserver automaticamente.
 *
 * USO nos módulos: não precisam importar nada.
 *   Basta adicionar class="reveal" no elemento — este módulo cuida do resto.
 */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── IntersectionObserver que anima o elemento ── */
const intersectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      intersectionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

/**
 * Observa um elemento com .reveal.
 * Se prefers-reduced-motion estiver ativo, torna visível imediatamente.
 */
export function observeReveal(el) {
  if (prefersReduced) {
    el.classList.add('visible');
    return;
  }
  intersectionObserver.observe(el);
}

/**
 * Observa todos os .reveal dentro de um container (ou do document).
 */
export function observeAll(root = document) {
  root.querySelectorAll('.reveal:not(.visible)').forEach(observeReveal);
}

/* ── MutationObserver: detecta .reveal adicionados ao DOM em qualquer momento ── */
const mutationObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== 1) continue; // só elementos

      // O próprio nó tem .reveal?
      if (node.classList?.contains('reveal')) {
        observeReveal(node);
      }
      // Filhos do nó têm .reveal?
      node.querySelectorAll?.('.reveal:not(.visible)').forEach(observeReveal);
    }
  }
});

mutationObserver.observe(document.body, { childList: true, subtree: true });
