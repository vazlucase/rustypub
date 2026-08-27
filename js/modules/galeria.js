import { showEmptyState, iconSvg } from '../utils/helpers.js';

const imagens = [
  {
    url: '/assets/gale1.webp',
    alt: 'Salão do Rusty Pub cheio durante show de rock ao vivo em Belém'
  },
  {
    url: '/assets/gale2.webp',
    alt: 'Chopp gelado servido no balcão do Rusty Pub'
  },
  {
    url: '/assets/gale3.webp',
    alt: 'Clientes brindando com cerveja no bar Rusty Pub em Belém-PA'
  }
];

export function renderGaleria() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  grid.replaceChildren();
  if (!imagens.length) {
    showEmptyState(
      grid,
      'Em breve mais momentos registrados.',
      'Siga nosso Instagram',
      'https://instagram.com/rusty_pub'
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  imagens.forEach((imagem, index) => {
    const item = document.createElement('div');
    item.className = `gallery-item reveal reveal-delay-${index % 4 + 1}`;
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Abrir foto: ${imagem.alt}`);

    const baseUrl = imagem.url.replace('.webp', '');
    const image = document.createElement('img');
    image.src = `${baseUrl}-400.webp`;
    image.srcset = `${baseUrl}-400.webp 400w, ${baseUrl}.webp 800w`;
    image.sizes = '(max-width: 600px) 45vw, 360px';
    image.alt = imagem.alt;
    image.width = 400;
    image.height = 400;
    image.loading = 'lazy';
    image.decoding = 'async';

    const overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = iconSvg('expand-alt');
    item.append(image, overlay);

    const openLightbox = () => {
      document.dispatchEvent(new CustomEvent('openLightbox', {
        detail: { images: imagens, index, triggerEl: item }
      }));
    };
    item.addEventListener('click', openLightbox);
    item.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openLightbox();
    });
    fragment.appendChild(item);
  });

  grid.appendChild(fragment);
}
