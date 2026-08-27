import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSessionCookie,
  deriveOptionToken,
  deriveTicketCode,
  deterministicOptionOrder,
  normalizeBrazilianPhone,
  normalizeDeviceId,
  normalizeName,
  safeEqualText
} from '../lib/quiz/security.js';
import { QUESTIONS } from '../lib/quiz/questions.js';

const SECRET = 'segredo-de-teste-com-mais-de-32-caracteres';
const CAMPAIGN_ID = 'rustytoberfest-2026';

test('normaliza telefones brasileiros com e sem código do país', () => {
  assert.equal(normalizeBrazilianPhone('(91) 99999-9999'), '5591999999999');
  assert.equal(normalizeBrazilianPhone('+55 (91) 99999-9999'), '5591999999999');
  assert.equal(normalizeBrazilianPhone('(55) 99999-9999'), '5555999999999');
  assert.equal(normalizeBrazilianPhone('55 3222-3344'), '555532223344');
});

test('rejeita telefone, nome e dispositivo inválidos como erro do cliente', () => {
  for (const operation of [
    () => normalizeBrazilianPhone('123'),
    () => normalizeName(' '),
    () => normalizeDeviceId('curto')
  ]) {
    assert.throws(operation, error => error.statusCode === 400);
  }
});

test('normaliza espaços do nome sem alterar o conteúdo válido', () => {
  assert.equal(normalizeName('  Ana   da Silva  '), 'Ana da Silva');
});

test('gera código de ticket determinístico no formato canônico', () => {
  const first = deriveTicketCode(SECRET, CAMPAIGN_ID, 'attempt-1');
  const repeated = deriveTicketCode(SECRET, CAMPAIGN_ID, 'attempt-1');
  const other = deriveTicketCode(SECRET, CAMPAIGN_ID, 'attempt-2');

  assert.equal(first, repeated);
  assert.notEqual(first, other);
  assert.match(first, /^RUSTY-(?:[A-Z2-9]{4}-){5}[A-Z2-9]{4}$/);
});

test('tokens de alternativa são opacos, estáveis e vinculados à tentativa', () => {
  const first = deriveOptionToken(SECRET, CAMPAIGN_ID, 'attempt-1', 'q01', 'colarinho');
  assert.equal(first, deriveOptionToken(SECRET, CAMPAIGN_ID, 'attempt-1', 'q01', 'colarinho'));
  assert.notEqual(first, deriveOptionToken(SECRET, CAMPAIGN_ID, 'attempt-2', 'q01', 'colarinho'));
  assert.notEqual(first, deriveOptionToken(SECRET, CAMPAIGN_ID, 'attempt-1', 'q01', 'gargalo'));
  assert.doesNotMatch(first, /colarinho|q01|attempt/i);
});

test('ordem das alternativas é determinística por tentativa e varia entre tentativas', () => {
  const question = QUESTIONS[0];
  const baseline = deterministicOptionOrder(SECRET, CAMPAIGN_ID, 'attempt-1', question).map(option => option.id);
  const repeated = deterministicOptionOrder(SECRET, CAMPAIGN_ID, 'attempt-1', question).map(option => option.id);

  assert.deepEqual(baseline, repeated);

  const variants = new Set(
    Array.from({ length: 20 }, (_, index) => JSON.stringify(
      deterministicOptionOrder(SECRET, CAMPAIGN_ID, `attempt-${index}`, question).map(option => option.id)
    ))
  );
  assert.ok(variants.size > 1);
});

test('comparação segura distingue valores sem lançar para tamanhos diferentes', () => {
  assert.equal(safeEqualText('mesmo', 'mesmo'), true);
  assert.equal(safeEqualText('mesmo', 'outro'), false);
  assert.equal(safeEqualText('curto', 'valor-maior'), false);
});

test('cookie de sessão limita escopo e não expõe JavaScript', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const cookie = buildSessionCookie('token-secreto', 3600);
    assert.match(cookie, /Path=\/api\/quiz/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /Max-Age=3600/);
  } finally {
    if (previousNodeEnv == null) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
