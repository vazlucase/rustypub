import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = relativePath => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('frontend público não contém gabarito nem segredo operacional', async () => {
  const contents = await Promise.all([
    read('quiz.html'),
    read('quiz-admin.html'),
    read('js/quiz.js'),
    read('js/quiz-admin.js'),
    read('css/quiz.css'),
    read('css/quiz-admin.css')
  ]);
  const publicBundle = contents.join('\n');

  assert.doesNotMatch(publicBundle, /correctOptionId/);
  assert.doesNotMatch(publicBundle, /QUIZ_(?:IDENTITY|OPTION|TICKET)_SECRET/);
  assert.doesNotMatch(publicBundle, /QUIZ_ADMIN_PIN\s*=/);
});

test('quiz e validador não são ligados pela navegação pública', async () => {
  const publicPages = await Promise.all([read('index.html'), read('cardapio.html')]);
  const navigation = publicPages.join('\n');

  assert.doesNotMatch(navigation, /href=["'][^"']*quiz(?:-admin)?\.html/i);
});

test('páginas ocultas têm noindex e proteção adicional da Vercel', async () => {
  const [quiz, admin, robots, vercelText] = await Promise.all([
    read('quiz.html'),
    read('quiz-admin.html'),
    read('robots.txt'),
    read('vercel.json')
  ]);
  const vercel = JSON.parse(vercelText);
  const hiddenRule = vercel.headers.find(rule => String(rule.source).includes('quiz-admin'));

  assert.match(quiz, /noindex, nofollow, noarchive/);
  assert.match(admin, /noindex, nofollow, noarchive/);
  assert.match(robots, /Disallow: \/quiz\.html/);
  assert.match(robots, /Disallow: \/quiz-admin\.html/);
  assert.ok(hiddenRule);
  assert.ok(hiddenRule.headers.some(header =>
    header.key === 'X-Robots-Tag' && header.value === 'noindex, nofollow, noarchive'));
});

test('service worker permanece pass-through e não armazena o quiz', async () => {
  const serviceWorker = await read('sw.js');
  assert.doesNotMatch(serviceWorker, /addEventListener\(['"]fetch/);
  assert.doesNotMatch(serviceWorker, /quiz(?:-admin)?\.html|api\/quiz/);
});

test('assets estáticos alterados usam versão de URL', async () => {
  const [home, cardapio, quiz, admin, main] = await Promise.all([
    read('index.html'),
    read('cardapio.html'),
    read('quiz.html'),
    read('quiz-admin.html'),
    read('js/main.js')
  ]);

  [home, cardapio, quiz, admin].forEach(page => {
    assert.match(page, /\/css\/lp\.css\?v=2/);
  });
  assert.match(home, /\/js\/main\.js\?v=2/);
  assert.match(quiz, /\/css\/quiz\.css\?v=2/);
  assert.match(quiz, /\/js\/quiz\.js\?v=2/);
  assert.match(main, /\.\/modules\/galeria\.js\?v=2/);
  assert.match(main, /\.\/utils\/reveal\.js\?v=2/);
});

test('APIs e cliente exigem no-store para dados do quiz', async () => {
  const [http, quizClient, adminClient] = await Promise.all([
    read('lib/quiz/http.js'),
    read('js/quiz.js'),
    read('js/quiz-admin.js')
  ]);

  assert.match(http, /Cache-Control['"], ['"]no-store, max-age=0/);
  assert.match(quizClient, /cache: 'no-store'/);
  assert.match(adminClient, /cache: 'no-store'/);
});

test('ticket emitido não recebe TTL e resgatado recebe retenção', async () => {
  const scripts = await read('lib/quiz/scripts.js');
  const answerScript = scripts.slice(scripts.indexOf('export const ANSWER_SCRIPT'), scripts.indexOf('export const REDEEM_TICKET_SCRIPT'));
  const redeemScript = scripts.slice(scripts.indexOf('export const REDEEM_TICKET_SCRIPT'));

  assert.doesNotMatch(answerScript, /EXPIRE[^\n]*KEYS\[4\]/);
  assert.match(redeemScript, /EXPIRE[^\n]*KEYS\[1\][^\n]*ARGV\[3\]/);
  assert.match(redeemScript, /HDEL[^\n]*KEYS\[2\][^\n]*'name'/);
});

test('scripts Lua reservam vaga e resgatam ticket em operações atômicas', async () => {
  const scripts = await read('lib/quiz/scripts.js');
  assert.match(scripts, /winnerCount < tonumber\(ARGV\[6\]\)/);
  assert.match(scripts, /redis\.call\('INCR', KEYS\[2\]\)/);
  assert.match(scripts, /if status == 'redeemed'/);
  assert.match(scripts, /'redeemed_now'/);
});
