/**
 * eventosPassados.js — Renderiza cards de eventos passados
 * v2.0 — ELITE: criação via DOM API (sem innerHTML para dados), aria correto
 */
import { showEmptyState } from '../utils/helpers.js';

const eventosPassados = [
  { data: '2025', banda: 'RockStar',   tag: '#RustyPUB', img: '/assets/memo-1.webp', lotado: false  },
  { data: '2025', banda: 'Rocão',  tag: '#RustyPUB',  img: '/assets/memo-2.webp', lotado: false },
  { data: '2025', banda: 'St. Patrick′s Day',  tag: '#RustyPUB',   img: '/assets/memo-3.webp', lotado: true  },
];

export function renderEventosPassados() {
  const container = document.getElementById('past-grid');
  if (!container) return;

  container.innerHTML = Array(6).fill('<div class="skeleton skeleton-card" aria-hidden="true"></div>').join('');

  setTimeout(() => {
    container.innerHTML = '';

    if (eventosPassados.length === 0) {
      showEmptyState(container, 'Nenhum registro antigo ainda.', 'Confira a agenda', '#agenda');
      return;
    }

    eventosPassados.forEach(ev => {
      const card = document.createElement('article');
      card.className = 'past-card reveal';
      card.setAttribute('aria-label', `Show: ${ev.banda}, ${ev.data}${ev.lotado ? ', lotado' : ''}`);

      // Badge "LOTADO" — apenas texto, sem risco XSS
      if (ev.lotado) {
        const badge = document.createElement('span');
        badge.className  = 'past-sold-badge';
        badge.setAttribute('aria-label', 'Evento lotado');
        badge.textContent = 'LOTADO';
        card.appendChild(badge);
      }

      // Imagem de fundo via div (sem injetar URL via innerHTML)
      const imgDiv = document.createElement('div');
      imgDiv.className = 'past-img';
      imgDiv.setAttribute('role', 'img');
      imgDiv.setAttribute('aria-label', `Foto do show ${ev.banda}`);
      imgDiv.style.backgroundImage = `url('${encodeURI(ev.img)}')`;
      card.appendChild(imgDiv);

      // Info
      const info = document.createElement('div');
      info.className = 'past-info';

      const meta = document.createElement('p');
      meta.className   = 'past-meta';
      meta.textContent  = ev.data;

      const h3 = document.createElement('h3');
      h3.textContent = ev.banda;

      const tagEl = document.createElement('span');
      tagEl.className  = 'past-tag';
      tagEl.textContent = ev.tag;

      info.appendChild(meta);
      info.appendChild(h3);
      info.appendChild(tagEl);
      card.appendChild(info);

      container.appendChild(card);
    });
  }, 300);
}
