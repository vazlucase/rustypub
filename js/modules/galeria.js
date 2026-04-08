/**
 * galeria.js — Renderiza galeria de fotos com segurança e acessibilidade
 * v2.0 — ELITE: sem innerHTML para dados externos, foco gerenciado, lazy loading correto
 */
import { showEmptyState } from '../utils/helpers.js';

const galeriaFotos = [
  { url: '/assets/gale1.webp', alt: 'Show de rock no Rusty Pub' },
  { url: '/assets/gale2.webp', alt: 'Chopps artesanais gelados' },
  { url: '/assets/gale3.webp', alt: 'Público animado na pista' },];

export function renderGaleria() {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  container.innerHTML = Array(6).fill('<div class="skeleton skeleton-card" aria-hidden="true"></div>').join('');

  setTimeout(() => {
    container.innerHTML = '';

    if (galeriaFotos.length === 0) {
      showEmptyState(container, 'Em breve mais momentos registrados.', 'Siga nosso Instagram', 'https://instagram.com/rusty_pub');
      return;
    }

    galeriaFotos.forEach((foto, idx) => {
      const item = document.createElement('div');
      item.className = `gallery-item reveal reveal-delay-${(idx % 4) + 1}`;
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `Abrir foto: ${foto.alt}`);

      // Imagem — criada via DOM (sem innerHTML para src externo)
      const img = document.createElement('img');
      img.src     = foto.url;
      img.alt     = foto.alt;
      img.width   = 600;
      img.height  = 600;
      img.loading = idx < 3 ? 'eager' : 'lazy';
      img.decoding = 'async';

      const overlay = document.createElement('div');
      overlay.className   = 'gallery-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML   = '<i class="fas fa-expand-alt"></i>';

      item.appendChild(img);
      item.appendChild(overlay);

      const openLightbox = () => {
        document.dispatchEvent(new CustomEvent('openLightbox', {
          detail: { images: galeriaFotos, index: idx, triggerEl: item },
        }));
      };

      item.addEventListener('click', openLightbox);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(); }
      });

      container.appendChild(item);
    });
  }, 300);
}
