/**
 * cardapio.js — Lógica do cardápio digital (página oculta via QR Code)
 * Busca em tempo real + filtro por categoria + voltar ao topo.
 * Segurança: nenhum dado externo vai para innerHTML; termo é escapado via textContent.
 * Performance: debounce na busca, matching pré-normalizado.
 */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const searchInput = $('#menu-search');
  const searchClear = $('#search-clear');
  const chips       = $$('.mp-chip');
  const groups      = $$('.mp-group');
  const cats        = $$('.mp-cat');
  const items       = $$('.mp-item, .mp-tag');
  const emptyState  = $('#menu-empty');
  const emptyTerm   = $('#menu-empty-term');
  const emptyReset  = $('#menu-empty-reset');
  const topBtn      = $('#mp-top');

  let activeFilter = 'todos';

  /* ── Normaliza texto: minúsculo, sem acento ── */
  const normalize = (str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  /* Pré-computa a chave de busca de cada item (nome + descrição + data-name) */
  items.forEach((el) => {
    const data = el.dataset.name || '';
    const text = el.textContent || '';
    el._searchKey = normalize(`${data} ${text}`);
  });

  /* ── Aplica filtro de categoria + termo de busca ── */
  function applyFilters() {
    const term = normalize(searchInput.value.trim());
    let visibleCount = 0;

    cats.forEach((cat) => {
      const matchesCat = activeFilter === 'todos' || cat.dataset.cat === activeFilter;
      let catHasVisible = false;

      $$('.mp-item, .mp-tag', cat).forEach((item) => {
        const matchesTerm = !term || item._searchKey.includes(term);
        const show = matchesCat && matchesTerm;
        item.hidden = !show;
        if (show) { catHasVisible = true; visibleCount++; }
      });

      // Esconde a categoria inteira se nenhum item dela aparece
      cat.hidden = !catHasVisible;
    });

    // Esconde grupos (comidas/bebidas) totalmente vazios
    groups.forEach((group) => {
      const anyVisible = $$('.mp-cat', group).some((c) => !c.hidden);
      group.hidden = !anyVisible;
    });

    // Estado vazio
    const isEmpty = visibleCount === 0;
    emptyState.hidden = !isEmpty;
    if (isEmpty) {
      // textContent => seguro contra XSS
      emptyTerm.textContent = searchInput.value.trim() || '—';
    }

    // Botão limpar
    searchClear.hidden = searchInput.value.length === 0;
  }

  /* ── Debounce simples ── */
  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  }

  /* ── Eventos: busca ── */
  if (searchInput) {
    searchInput.addEventListener('input', debounce(applyFilters, 120));
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      applyFilters();
      searchInput.focus();
    });
  }
  if (emptyReset) {
    emptyReset.addEventListener('click', () => {
      searchInput.value = '';
      setActiveChip('todos');
      applyFilters();
      searchInput.focus();
    });
  }

  /* ── Eventos: chips de categoria ── */
  function setActiveChip(filter) {
    activeFilter = filter;
    chips.forEach((chip) => {
      const on = chip.dataset.filter === filter;
      chip.classList.toggle('active', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      setActiveChip(chip.dataset.filter);
      applyFilters();
      // Rola até o topo do conteúdo para ver o resultado do filtro
      const main = $('#menu-conteudo-lista');
      if (main) {
        const y = main.getBoundingClientRect().top + window.scrollY - 160;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    });
  });

  /* ── Voltar ao topo ── */
  if (topBtn) {
    const onScroll = () => { topBtn.hidden = window.scrollY < 600; };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      searchInput?.focus({ preventScroll: true });
    });
  }

  /* ── Sombra no header ao rolar ── */
  const header = $('#mp-header');
  if (header) {
    const onScrollHeader = () => {
      header.style.boxShadow = window.scrollY > 8
        ? '0 6px 24px rgba(0,0,0,.45)'
        : 'none';
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();
  }

  // Estado inicial
  applyFilters();
})();
