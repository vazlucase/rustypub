# Rusty Pub — Cardápio Digital via QR Code

Atualização que adiciona uma **aba escondida do cardápio**, acessível **somente via QR Code** (pensada para a mesa do bar), além de melhorias visuais sutis no site.

## O que foi adicionado

| Arquivo | Descrição |
|---|---|
| `cardapio.html` | Página oculta do cardápio digital. `noindex, nofollow` — não aparece no Google nem no menu do site. |
| `css/cardapio.css` | Estilo dedicado, mobile-first, reaproveitando os tokens da identidade Rusty. |
| `js/cardapio.js` | Busca em tempo real, filtro por categoria (chips) e botão "voltar ao topo". |
| `assets/qrcode-cardapio.png` | QR Code puro (alta resolução) — para usar onde quiser. |
| `assets/qrcode-cartao-mesa.png` | Cartão de mesa pronto para impressão (1000×1500px) com o QR estilizado. |

## Como funciona a "aba escondida"

A página **não tem link no menu** e está marcada como `noindex`. O único caminho de acesso é o **QR Code** — ideal para colocar nas mesas. Quem escaneia abre direto o cardápio no celular.

> Na home (`index.html`) o cardápio completo continua existindo. Foi adicionado apenas um aviso discreto ("Na mesa? Acesse o cardápio digital pelo QR Code") que leva à página dedicada.

## Recursos da página de cardápio

- **Busca instantânea** sem acento e sem diferenciar maiúsculas (ex.: "jambu" acha em comidas e bebidas).
- **Filtro por categoria**: Tudo · Comidas · Bebidas.
- **Header fixo** com busca e filtros sempre à mão.
- **Botão flutuante "Fazer pedido"** que abre o WhatsApp do bar.
- **Estado vazio** com microcopy e ação de limpar busca.
- **Offline-ready** (PWA): a página é cacheada pelo Service Worker.
- **Acessível**: navegação por teclado, contraste WCAG AA, `prefers-reduced-motion`.

## Apontar o QR para a URL correta

O QR aponta para `https://www.rustypub.com.br/cardapio.html`.

Se o domínio ou o caminho mudar, regenere o QR alterando a constante `URL` nos scripts de geração, ou use qualquer gerador de QR com a URL final.

## Imprimir o cartão de mesa

Use `assets/qrcode-cartao-mesa.png`. A proporção (2:3) imprime bem em A6/A5. Para mesas, plastifique ou use suporte acrílico.

## Como rodar localmente

Por usar caminhos absolutos (`/css/...`, `/js/...`) e Service Worker, sirva via HTTP:

```bash
# na raiz do projeto
python3 -m http.server 8000
# abra http://localhost:8000/         (home)
# abra http://localhost:8000/cardapio.html  (cardápio QR)
```

## Manutenção do cardápio

Para alterar itens/preços, edite as listas `.mp-item` em `cardapio.html`. Cada item tem um `data-name` (palavras-chave para a busca) — mantenha-o atualizado ao renomear pratos.
