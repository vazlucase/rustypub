/**
 * lightbox.js — Galeria com navegação, foco gerenciado e ARIA completo
 * v2.0 — ELITE: focus trap, retorno de foco ao elemento de origem, touch swipe
 */
let galleryImages = [];
let currentIndex  = 0;
let triggerElement = null; // elemento que abriu o lightbox (para retorno de foco)

export function initLightbox() {
  const lightbox   = document.getElementById('lightbox');
  const img        = document.getElementById('lightbox-img');
  const closeBtn   = document.getElementById('lightbox-close');
  const prevBtn    = document.getElementById('lightbox-prev');
  const nextBtn    = document.getElementById('lightbox-next');
  if (!lightbox || !img) return;

  // Garante IDs para aria-labelledby / aria-describedby
  let captionEl = lightbox.querySelector('.lightbox__caption');
  if (!captionEl) {
    captionEl = document.createElement('p');
    captionEl.id        = 'lightbox-caption';
    captionEl.className = 'lightbox__caption';
    lightbox.appendChild(captionEl);
  }
  lightbox.setAttribute('aria-labelledby', 'lightbox-caption');

  // Contagem de slides para acessibilidade
  let counterEl = lightbox.querySelector('.lightbox__counter');
  if (!counterEl) {
    counterEl = document.createElement('p');
    counterEl.id        = 'lightbox-counter';
    counterEl.className = 'lightbox__counter';
    counterEl.setAttribute('aria-live', 'polite');
    lightbox.appendChild(counterEl);
  }

  // Abre via evento customizado
  document.addEventListener('openLightbox', (e) => {
    const { src, alt, images, index, triggerEl } = e.detail;
    triggerElement = triggerEl || document.activeElement;

    if (images) {
      galleryImages = images;
      currentIndex  = index ?? 0;
    } else {
      galleryImages = [{ url: src, alt }];
      currentIndex  = 0;
    }

    showImage(img, captionEl, counterEl, galleryImages[currentIndex]);
    openLightbox(lightbox, closeBtn);
  });

  // Fecha
  closeBtn?.addEventListener('click', () => closeLightbox(lightbox, img, captionEl, counterEl));
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox(lightbox, img, captionEl, counterEl);
  });

  // Navegação
  prevBtn?.addEventListener('click', () => navigate(-1, img, captionEl, counterEl));
  nextBtn?.addEventListener('click', () => navigate(+1, img, captionEl, counterEl));

  // Teclado: ESC, setas, Tab (focus trap)
  lightbox.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'Escape':
        closeLightbox(lightbox, img, captionEl, counterEl);
        break;
      case 'ArrowLeft':
        navigate(-1, img, captionEl, counterEl);
        break;
      case 'ArrowRight':
        navigate(+1, img, captionEl, counterEl);
        break;
      case 'Tab':
        trapFocus(e, lightbox);
        break;
    }
  });

  // Touch swipe
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1, img, captionEl, counterEl);
  }, { passive: true });
}

function openLightbox(lightbox, closeBtn) {
  lightbox.hidden = false;
  lightbox.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
  // Pequeno delay para garantir que o elemento esteja visível antes do foco
  requestAnimationFrame(() => closeBtn?.focus());
}

function closeLightbox(lightbox, img, captionEl, counterEl) {
  lightbox.hidden = true;
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  img.src = '';
  img.alt = '';
  if (captionEl) captionEl.textContent = '';
  if (counterEl) counterEl.textContent = '';
  galleryImages = [];

  // Retorna foco ao elemento que abriu o lightbox
  if (triggerElement && typeof triggerElement.focus === 'function') {
    triggerElement.focus();
    triggerElement = null;
  }
}

function navigate(direction, img, captionEl, counterEl) {
  if (galleryImages.length <= 1) return;
  currentIndex = (currentIndex + direction + galleryImages.length) % galleryImages.length;
  showImage(img, captionEl, counterEl, galleryImages[currentIndex]);
}

function showImage(img, captionEl, counterEl, item) {
  img.src = item.url;
  img.alt = item.alt ?? '';
  if (captionEl) captionEl.textContent = item.alt ?? '';
  if (counterEl && galleryImages.length > 1) {
    counterEl.textContent = `${currentIndex + 1} de ${galleryImages.length}`;
  }
}

function trapFocus(e, container) {
  const focusable = [...container.querySelectorAll(
    'button:not([disabled]), [tabindex="0"]'
  )].filter(el => !el.hidden && el.offsetParent !== null);

  if (focusable.length === 0) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
