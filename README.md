# 🍺 Rusty Pub

Site institucional do **Rusty Pub** — bar de rock em Belém-PA. Chopps artesanais, shows ao vivo e cardápio digital.

🔗 **Produção:** [rustypub.vercel.app](https://rustypub.vercel.app)

---

## Stack

Site **100% estático** (sem backend), otimizado para performance e SEO, com PWA.

- HTML5 semântico + CSS3 (tokens de design, dark theme)
- JavaScript vanilla modular (sem framework)
- PWA: manifest + Service Worker (offline-ready)
- Deploy: Vercel (CDN global)

---

## Estrutura

```
rustypub/
├── index.html              # Home (institucional)
├── cardapio.html           # Cardápio digital — página oculta, acesso via QR Code
├── manifest.json           # PWA
├── sw.js                   # Service Worker (cache offline)
├── vercel.json             # Headers de segurança + cache
├── robots.txt              # SEO (bloqueia /cardapio.html)
├── sitemap.xml             # SEO
├── favicon.ico             # Favicon + apple-touch-icon
├── og-image.png            # Imagem de compartilhamento (1200×630)
├── icons/                  # Ícones PWA (192, 512, maskable)
├── assets/                 # Imagens (.webp)
├── css/
│   ├── lp.css              # Estilos da home
│   └── cardapio.css        # Estilos do cardápio
└── js/
    ├── main.js             # Orquestração da home
    ├── cardapio.js         # Busca + filtro do cardápio
    ├── modules/            # agenda, galeria, lightbox, eventosPassados
    └── utils/              # helpers, reveal
```

---

## Cardápio digital (aba oculta via QR Code)

O `cardapio.html` é uma página **sem link no menu** e marcada como `noindex` (reforçado no `robots.txt` e no header `X-Robots-Tag` via `vercel.json`). O único acesso é por **QR Code** nas mesas do bar.

Recursos: busca instantânea (sem acento), filtro por categoria (Comidas/Bebidas), botão flutuante de pedido via WhatsApp, estado vazio, offline-ready e acessível (WCAG AA).

> Para gerar/atualizar o QR Code, veja [`CARDAPIO-QR-README.md`](./CARDAPIO-QR-README.md).

---

## Como rodar localmente

O site usa caminhos absolutos (`/css/…`) e Service Worker, então precisa ser servido por HTTP (não abra o arquivo direto):

```bash
# opção 1 — npm
npm run dev

# opção 2 — Python
python3 -m http.server 8000
```

Abra `http://localhost:8000`.

---

## Deploy (Vercel)

O deploy é automático a cada push na branch `main`. O `vercel.json` aplica:

- **Headers de segurança:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Cache:** assets imutáveis (CSS/JS/imagens) com `max-age` de 1 ano; HTML e `sw.js` sempre revalidados
- **`X-Robots-Tag: noindex`** na rota `/cardapio.html`

---

## Segurança

- Sem segredos no código (site estático, sem variáveis sensíveis)
- CSP restritiva (sem `unsafe-eval`, sem fontes de terceiros não confiáveis)
- HTTPS forçado (HSTS com preload)
- Proteção contra clickjacking (frame-ancestors none)

> O site não possui backend/API, portanto **não há endpoints que exijam rate limiting**. O Vercel já fornece proteção DDoS na borda. Caso um formulário ou API seja adicionado no futuro, implementar rate limiting nesse ponto.

---

## Manutenção do cardápio

Para alterar itens/preços, edite as listas `.mp-item` em `cardapio.html`. Cada item tem um atributo `data-name` com palavras-chave para a busca — mantenha-o atualizado ao renomear pratos.

---

## Licença

[MIT](./LICENSE) © 2026 Lucas Vaz
