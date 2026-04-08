import { sanitizeText } from '../utils/helpers.js';

const carpadioItems = [
  { nome: 'CARPADIO CLÁSSICO',  preco: 'R$ 49', badge: 'CARRO-CHEFE', img: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=280&fit=crop' },
  { nome: 'CARPADIO PICANTE',   preco: 'R$ 52', badge: 'HOT 🔥',       img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=280&fit=crop' },
  { nome: 'CARPADIO DE ATUM',   preco: 'R$ 58', badge: 'PREMIUM',      img: 'https://images.unsplash.com/photo-1621985169064-5e7d0c56f5c5?w=400&h=280&fit=crop' },
  { nome: 'CARPADIO VEGANO',    preco: 'R$ 44', badge: 'VEGANO 🌿',    img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=280&fit=crop' },
];

export function renderCarpadio() {
  const container = document.getElementById('carpadio-grid');
  if (!container) return;

  setTimeout(() => {
    container.innerHTML = '';
    carpadioItems.forEach((item, idx) => {
      const card = document.createElement('article');
      card.className = `carpadio-card mini reveal reveal-delay-${(idx % 4) + 1}`;
      card.style.background = 'rgba(26,20,16,.85)';
      card.style.border = '1px solid rgba(46,37,32,.8)';
      card.innerHTML = `
        <div class="carpadio-img" style="background-image:url('${item.img}')" role="img" aria-label="Foto do ${sanitizeText(item.nome)}">
          <span class="carpadio-badge">${sanitizeText(item.badge)}</span>
        </div>
        <div style="padding:8px 4px">
          <div class="carpadio-name">${sanitizeText(item.nome)}</div>
          <div class="carpadio-price">${sanitizeText(item.preco)}</div>
        </div>
      `;
      container.appendChild(card);
    });
  }, 400);
}
