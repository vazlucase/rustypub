import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright-core';

const root = new URL('../', import.meta.url);
const edgePath = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp']
]);

async function startStaticServer() {
  const rootPath = normalize(root.pathname.replace(/^\/(?:[A-Za-z]:)/, match => match.slice(1)));
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
      const filePath = normalize(join(rootPath, relative));
      if (!filePath.startsWith(rootPath)) {
        response.writeHead(403).end();
        return;
      }
      const info = await stat(filePath);
      if (!info.isFile()) throw new Error('not-file');
      response.writeHead(200, {
        'Content-Type': contentTypes.get(extname(filePath)) || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      response.end(await readFile(filePath));
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Não encontrado');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise(resolve => server.close(resolve))
  };
}

function questionState({ number = 1, deadlineOffset = 30_000 } = {}) {
  return {
    campaignId: 'rustytoberfest-2026',
    status: 'active',
    serverNow: Date.now(),
    name: 'Participante Teste',
    questionSeconds: 30,
    question: {
      id: `q${String(number).padStart(2, '0')}`,
      index: number - 1,
      number,
      total: 15,
      text: 'Qual detalhe indica que o chopp foi servido corretamente?',
      deadlineAt: Date.now() + deadlineOffset,
      options: [
        { token: 'token-a', text: 'Colarinho cremoso' },
        { token: 'token-b', text: 'Copo morno' },
        { token: 'token-c', text: 'Sem espuma' },
        { token: 'token-d', text: 'Gelo no copo' }
      ]
    }
  };
}

function winnerState(status = 'issued') {
  return {
    campaignId: 'rustytoberfest-2026',
    status: 'winner',
    serverNow: Date.now(),
    name: 'Participante Teste',
    questionSeconds: 30,
    result: {
      score: 15,
      total: 15,
      answers: Array(15).fill(true),
      winnerRank: 3,
      ticket: {
        code: 'RUSTY-ABCD-EFGH-JKLM-NPQR-STUV-WXYZ',
        rank: 3,
        prize: '2 chopps por conta da casa',
        status
      }
    }
  };
}

function resultState() {
  return {
    campaignId: 'rustytoberfest-2026',
    status: 'finished',
    serverNow: Date.now(),
    name: 'Participante Teste',
    questionSeconds: 30,
    result: {
      score: 12,
      total: 15,
      answers: [true, true, false, true, true, true, false, true, true, true, true, true, false, true, true],
      winnerRank: null
    }
  };
}

async function jsonRoute(route, status, payload, requestLog) {
  requestLog?.push({ method: route.request().method(), payload: route.request().postDataJSON?.() });
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'Cache-Control': 'no-store' },
    body: JSON.stringify(payload)
  });
}

let server;
let browser;

test.before(async () => {
  server = await startStaticServer();
  browser = await chromium.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--disable-gpu', '--no-first-run', '--disable-background-networking']
  });
});

test.after(async () => {
  await browser?.close();
  await server?.close();
});

test('quiz abre em 320 px, valida formulário e avança sem revelar acerto', async () => {
  const context = await browser.newContext({ viewport: { width: 320, height: 720 } });
  const page = await context.newPage();
  const requests = [];
  let stateRequests = 0;

  await page.route('**/api/quiz/state', route => {
    stateRequests += 1;
    return jsonRoute(route, 401, { error: 'Tentativa não encontrada.' });
  });
  await page.route('**/api/quiz/start', route => jsonRoute(route, 201, questionState(), requests));
  await page.route('**/api/quiz/answer', route => jsonRoute(route, 200, questionState({ number: 2 }), requests));

  await page.goto(`${server.origin}/quiz.html`);
  await page.locator('#view-intro').waitFor({ state: 'visible' });
  assert.ok(stateRequests >= 1);
  assert.equal(await page.locator('body').evaluate(element => element.scrollWidth <= element.clientWidth), true);
  assert.equal(await page.locator('a[href$="index.html"], a[href="/"], a[href*="quiz-admin"]').count(), 0);

  await page.locator('#start-button').click();
  assert.equal(await page.locator('#name-error').textContent(), 'Informe seu nome.');

  await page.locator('#quiz-name').fill('Participante Teste');
  await page.locator('#quiz-phone').fill('91999999999');
  await page.locator('#quiz-terms').check();
  await page.locator('#quiz-adult').check();
  await page.locator('#start-button').click();
  await page.locator('#view-question').waitFor({ state: 'visible' });

  assert.match(await page.locator('#question-progress').textContent(), /Pergunta 1 de 15/);
  assert.equal(await page.locator('.quiz-option').count(), 4);
  assert.equal(await page.locator('#answer-button').isDisabled(), true);
  await page.locator('.quiz-option').first().click();
  assert.equal(await page.locator('#answer-button').isDisabled(), false);
  await page.locator('#answer-button').click();
  await page.locator('#question-progress').getByText('Pergunta 2 de 15').waitFor();
  assert.equal(await page.locator('#answer-error').textContent(), '');
  assert.equal(await page.locator('#view-result').isHidden(), true);
  assert.equal(requests[0].payload.phone, '(91) 99999-9999');
  assert.equal(requests[1].payload.optionToken, 'token-a');
  assert.match(requests[1].payload.idempotencyKey, /^ans_q01_/);

  await context.close();
});

test('timer expirado envia timeout com chave idempotente', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const requests = [];
  let answered = false;
  await page.route('**/api/quiz/state', route => jsonRoute(
    route,
    200,
    answered ? resultState() : questionState({ deadlineOffset: 120 })
  ));
  await page.route('**/api/quiz/answer', route => {
    answered = true;
    return jsonRoute(route, 200, resultState(), requests);
  });

  await page.goto(`${server.origin}/quiz.html`);
  await page.locator('#view-result').waitFor({ state: 'visible', timeout: 5_000 });
  assert.ok(requests.length >= 1);
  assert.ok(requests.every(request => request.payload.optionToken === null));
  assert.ok(requests.every(request => /^ans_q01_/.test(request.payload.idempotencyKey)));
  assert.equal(new Set(requests.map(request => request.payload.idempotencyKey)).size, 1);
  assert.equal(await page.locator('#result-score').textContent(), '12');
  assert.equal(await page.locator('#answer-map > span').count(), 15);

  await context.close();
});

test('vencedor vê ticket, mensagem correta e estado resgatado', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.route('**/api/quiz/state', route => jsonRoute(route, 200, winnerState()));

  await page.goto(`${server.origin}/quiz.html`);
  await page.locator('#view-winner').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#ticket-code').textContent(), 'RUSTY-ABCD-EFGH-JKLM-NPQR-STUV-WXYZ');
  assert.equal(await page.locator('#ticket-rank').textContent(), '3º de 10');
  const whatsapp = await page.locator('#ticket-whatsapp').getAttribute('href');
  assert.match(decodeURIComponent(whatsapp), /Ganhei o quiz Rustytoberfest/);
  assert.match(decodeURIComponent(whatsapp), /RUSTY-ABCD-EFGH-JKLM-NPQR-STUV-WXYZ/);

  await page.unroute('**/api/quiz/state');
  await page.route('**/api/quiz/state', route => jsonRoute(route, 200, winnerState('redeemed')));
  await page.reload();
  await page.locator('#view-winner').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#ticket-status').textContent(), 'Ticket já resgatado');
  assert.equal(await page.locator('#ticket-whatsapp').isHidden(), true);

  await context.close();
});

test('validador interno verifica, confirma e limpa o PIN após resgate', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const requests = [];
  await page.route('**/api/quiz/redeem', async route => {
    const body = route.request().postDataJSON();
    requests.push(body);
    const redeemed = body.action === 'redeem';
    return jsonRoute(route, 200, {
      valid: true,
      status: redeemed ? 'redeemed' : 'issued',
      redeemedNow: redeemed,
      rank: 3,
      issuedAt: Date.now() - 60_000,
      redeemedAt: redeemed ? Date.now() : null,
      prize: '2 chopps por conta da casa'
    });
  });

  await page.goto(`${server.origin}/quiz-admin.html`);
  assert.equal(await page.locator('a[href$="index.html"], a[href="/"], a[href*="quiz.html"]').count(), 0);
  await page.locator('#ticket-code-input').fill('abcd efgh jklm npqr stuv wxyz');
  await page.locator('#ticket-pin-input').fill('123456');
  await page.locator('#verify-button').click();
  await page.locator('#redeem-result').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#ticket-status-badge').textContent(), 'TICKET VÁLIDO');
  assert.equal(requests[0].code, 'RUSTY-ABCD-EFGH-JKLM-NPQR-STUV-WXYZ');
  assert.equal(requests[0].action, 'verify');

  await page.locator('#redeem-button').click();
  await page.locator('#confirm-panel').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#confirm-redeem-button').evaluate(element => document.activeElement === element), true);
  await page.locator('#confirm-redeem-button').click();
  await page.locator('#ticket-status-badge').getByText('TICKET JÁ UTILIZADO').waitFor();
  assert.equal(requests[1].action, 'redeem');
  assert.equal(await page.locator('#ticket-pin-input').inputValue(), '');
  assert.equal(await page.locator('#redeem-button').isHidden(), true);

  await context.close();
});

test('home mantém âncoras, galeria imediata e reduced motion sem reveal oculto', async () => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  await page.route('**/api/**', route => jsonRoute(route, 200, { visitas: 1 }));

  await page.goto(`${server.origin}/index.html`);
  await page.locator('#gallery-grid .gallery-item').first().waitFor({ state: 'visible' });
  assert.equal(await page.locator('#gallery-grid .gallery-item').count(), 3);
  assert.equal(await page.locator('.reveal:not(.visible)').count(), 0);
  assert.equal(await page.locator('#galeria').evaluate(element => getComputedStyle(element).contentVisibility), 'auto');
  await page.locator('a[href="#contato"]').first().click();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#contato').evaluate(element => document.activeElement === element), true);
  assert.equal(await page.locator('body').evaluate(element => element.scrollWidth <= element.clientWidth), true);

  await context.close();
});
