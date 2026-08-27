# Rusty Pub

Site institucional do **Rusty Pub**, bar de rock em Belém-PA, com cardápio digital e quiz promocional Rustytoberfest.

**Produção:** [rustypub.vercel.app](https://rustypub.vercel.app)

## Stack

- HTML5, CSS3 e JavaScript vanilla, sem etapa de build
- Vercel Functions em JavaScript
- Upstash Redis por `@upstash/redis`
- Manifest PWA e Service Worker pass-through, sem cache de respostas da API
- Deploy na Vercel

## Estrutura principal

```text
rustypub/
├── index.html                 # Home pública
├── cardapio.html              # Cardápio oculto, distribuído por QR Code
├── quiz.html                  # Quiz oculto, distribuído pelo Instagram
├── quiz-admin.html            # Validação interna dos tickets
├── api/
│   ├── visitas.js
│   └── quiz/                  # Start, state, answer, ticket e redeem
├── lib/quiz/                  # Perguntas, segurança, Redis e scripts Lua
├── css/                       # Estilos da home, cardápio e quiz
├── js/                        # Clientes da home, cardápio e quiz
├── manifest.json
├── sw.js                      # Remove caches antigos e opera em pass-through
├── vercel.json                # Headers de segurança, cache e noindex
├── robots.txt
└── .env.example
```

## Quiz Rustytoberfest

O `quiz.html` não possui link na home, no cardápio ou no rodapé. Ele é marcado como `noindex, nofollow, noarchive`, bloqueado no `robots.txt` e não aparece no sitemap. A URL continua compartilhável e deve ser divulgada somente pelo canal da campanha.

Regras implementadas:

- 15 perguntas e 30 segundos por pergunta
- Feedback somente ao final
- Uma tentativa por WhatsApp e identificador aleatório do dispositivo
- Alternativas embaralhadas por tentativa
- Gabarito e cronômetro sob autoridade do servidor
- 2 chopps para os 10 primeiros participantes com 15/15
- Reserva atômica do décimo ticket por script Lua
- Ticket de uso único, válido até o resgate
- Retomada após reload, suspensão da aba ou falha de rede
- Coordenação entre múltiplas abas

O WhatsApp é normalizado e transformado em HMAC antes de ser persistido. O número, IP e identificador do dispositivo não são retornados pelas APIs públicas.

## Resgate interno

A página `quiz-admin.html` também é oculta e marcada como `noindex`. A equipe informa o código do ticket e o PIN configurado no ambiente.

O fluxo primeiro verifica o ticket e depois solicita confirmação para marcá-lo como usado. O resgate é atômico: duas confirmações concorrentes não conseguem consumir o mesmo ticket duas vezes. O PIN não fica no HTML, no JavaScript nem no armazenamento do navegador.

Não adicione links públicos para `quiz-admin.html` e nunca registre o PIN no repositório.

## Variáveis de ambiente

Copie `.env.example` para o ambiente local da Vercel ou cadastre os valores no painel do projeto:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
QUIZ_ENABLED
QUIZ_CAMPAIGN_ID
QUIZ_WINNER_LIMIT
QUIZ_QUESTION_SECONDS
QUIZ_RETENTION_SECONDS
QUIZ_IDENTITY_SECRET
QUIZ_OPTION_SECRET
QUIZ_TICKET_SECRET
QUIZ_ADMIN_PIN
```

Use segredos independentes e aleatórios, com pelo menos 32 caracteres. O PIN interno exige pelo menos 6 caracteres. `QUIZ_ENABLED=false` bloqueia novas tentativas sem invalidar tickets já emitidos.

`QUIZ_RETENTION_SECONDS` controla tentativas, sessões e a auditoria após o resgate. Tickets emitidos não recebem TTL e continuam válidos até serem usados.

## Como rodar localmente

Instale as dependências:

```bash
npm install
```

Para visualizar somente as páginas estáticas:

```bash
npm run dev
```

Para executar o quiz com as Vercel Functions e variáveis locais:

```bash
npx vercel dev
```

Abra a URL informada pelo comando. Não abra os arquivos HTML diretamente, pois o projeto usa caminhos absolutos e APIs same-origin.

Para executar a suíte completa (lógica, contratos e E2E headless no Microsoft Edge):

```bash
npm test
npm run check
```

O E2E usa `playwright-core` com o Edge instalado no Windows. Em outro local, defina `EDGE_PATH` com o caminho do executável antes de rodar `npm run test:e2e`.

Os testes E2E interceptam as APIs para validar todos os estados visuais sem usar dados reais. A atomicidade dos scripts Lua tem cobertura de contrato; antes da campanha, ainda é obrigatório validar o 10º/11º vencedor e dois resgates simultâneos em um Redis Upstash de teste.

## Deploy

O `vercel.json` aplica:

- CSP, HSTS, proteção contra clickjacking e demais headers de segurança
- Assets versionados com cache imutável
- HTML e `sw.js` sempre revalidados
- `X-Robots-Tag` nas páginas ocultas
- `Cache-Control: no-store` diretamente nas APIs do quiz

Antes de ativar a campanha, confirme as variáveis do ambiente de produção e faça o fluxo completo no domínio final.

## Cardápio digital

O `cardapio.html` é uma página sem link na navegação e distribuída por QR Code nas mesas. Para alterar itens e preços, edite as listas `.mp-item` e mantenha os atributos `data-name` atualizados.

Consulte [`CARDAPIO-QR-README.md`](./CARDAPIO-QR-README.md) para atualizar o QR Code.

## Segurança operacional

- Não exponha segredos ou o PIN em arquivos públicos
- Não use o frontend como autoridade para pontuação ou ticket
- Altere `QUIZ_CAMPAIGN_ID` ao iniciar uma campanha independente
- Use `QUIZ_ENABLED=false` como kill switch de novas tentativas
- Preserve o namespace da campanha enquanto houver tickets pendentes

## Licença

[MIT](./LICENSE) © 2026 Lucas Vaz
