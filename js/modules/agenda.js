/**
 * agenda.js — Renderiza cards de eventos futuros
 * v2.0 — ELITE: DOM API, URL WhatsApp sanitizada, acessibilidade
 */
import { showEmptyState } from '../utils/helpers.js';

const WA = '5591991567596';

const eventos = [
  { dia: 'QUI 12/06', banda: 'OVERDRIVE',        horario: '21h',   preco: 'R$ 20', spots: '8 vagas restantes', img: 'https://images.unsplash.com/photo-1540914124281-342587941389?w=800&h=500&fit=crop', destaque: 'Rock Clássico'     },
  { dia: 'SEX 13/06', banda: 'SULPHUR ANGELS',   horario: '22h',   preco: 'R$ 25', spots: '4 vagas restantes', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&h=500&fit=crop', destaque: 'Heavy Metal'        },
  { dia: 'SÁB 14/06', banda: 'THE RUSTY NAILS',  horario: '21h30', preco: 'R$ 30', spots: 'Últimas mesas!',    img: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=500&fit=crop', destaque: 'Hard Rock + Cover'  },
  { dia: 'DOM 15/06', banda: 'ACOUSTIC SESSION',  horario: '19h',   preco: 'R$ 15', spots: '12 vagas',          img: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&h=500&fit=crop', destaque: 'Desplugado'         },
];

export function renderAgenda() {
  const container = document.getElementById('agenda-grid');
  if (!container) return;

  container.innerHTML = Array(4).fill('<div class="skeleton skeleton-card" aria-hidden="true"></div>').join('');

  setTimeout(() => {
    container.innerHTML = '';
    if (!eventos.length) {
      showEmptyState(container, 'Nenhum show programado ainda.', 'Ver eventos passados', '#eventos-passados');
      return;
    }

    eventos.forEach(ev => {
      const waText = encodeURIComponent(`Oi! Quero garantir minha mesa pro show de ${ev.banda} no dia ${ev.dia} no Rusty Pub.`);
      const waHref = `https://wa.me/${WA}?text=${waText}`;

      const card = document.createElement('article');
      card.className = 'event-card reveal';
      card.setAttribute('aria-label', `Show: ${ev.banda} — ${ev.dia}`);

      // Imagem
      const imgDiv = document.createElement('div');
      imgDiv.className = 'event-img';
      imgDiv.setAttribute('role', 'img');
      imgDiv.setAttribute('aria-label', `Foto do show ${ev.banda}`);
      imgDiv.style.backgroundImage = `url('${encodeURI(ev.img)}')`;

      const dayBadge = document.createElement('div');
      dayBadge.className  = 'event-day';
      dayBadge.textContent = ev.dia;

      const spotsBadge = document.createElement('div');
      spotsBadge.className  = 'event-spots';
      spotsBadge.textContent = ev.spots;

      imgDiv.appendChild(dayBadge);
      imgDiv.appendChild(spotsBadge);

      // Body
      const body = document.createElement('div');
      body.className = 'event-body';

      const title = document.createElement('div');
      title.className  = 'event-title';
      title.textContent = ev.banda;

      const meta = document.createElement('div');
      meta.className = 'event-meta';

      const timeSpan = document.createElement('span');
      const timeIcon = document.createElement('i');
      timeIcon.className = 'fas fa-clock';
      timeIcon.setAttribute('aria-hidden', 'true');
      timeSpan.appendChild(timeIcon);
      timeSpan.appendChild(document.createTextNode(ev.horario));

      const priceSpan = document.createElement('span');
      const priceIcon = document.createElement('i');
      priceIcon.className = 'fas fa-ticket-alt';
      priceIcon.setAttribute('aria-hidden', 'true');
      priceSpan.appendChild(priceIcon);
      priceSpan.appendChild(document.createTextNode(ev.preco));

      meta.appendChild(timeSpan);
      meta.appendChild(priceSpan);

      const genre = document.createElement('p');
      genre.className  = 'event-genre';
      genre.textContent = `🎸 ${ev.destaque}`;

      const cta = document.createElement('a');
      cta.href      = waHref;
      cta.className = 'event-cta';
      cta.target    = '_blank';
      cta.rel       = 'noopener noreferrer';
      cta.setAttribute('aria-label', `Garantir vaga no show de ${ev.banda} pelo WhatsApp`);
      const ctaIcon = document.createElement('i');
      ctaIcon.className = 'fab fa-whatsapp';
      ctaIcon.setAttribute('aria-hidden', 'true');
      cta.appendChild(ctaIcon);
      cta.appendChild(document.createTextNode('Garantir Minha Vaga'));

      body.appendChild(title);
      body.appendChild(meta);
      body.appendChild(genre);
      body.appendChild(cta);

      card.appendChild(imgDiv);
      card.appendChild(body);
      container.appendChild(card);
    });
  }, 300);
}
