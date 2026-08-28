import test from 'node:test';
import assert from 'node:assert/strict';

import { publicAttemptState, publicQuestion } from '../lib/quiz/state.js';
import { QUESTIONS } from '../lib/quiz/questions.js';

const config = Object.freeze({
  campaignId: 'rustytoberfest-2026',
  optionSecret: 'opcao-de-teste-com-mais-de-32-caracteres',
  ticketSecret: 'ticket-de-teste-com-mais-de-32-caracteres',
  questionCount: QUESTIONS.length,
  questionSeconds: 30
});

test('pergunta pública não expõe IDs internos nem gabarito', () => {
  const question = publicQuestion(config, 'attempt-1', 0, 123456);
  const serialized = JSON.stringify(question);

  assert.equal(question.id, 'q01');
  assert.equal(question.options.length, 4);
  assert.deepEqual(Object.keys(question.options[0]).sort(), ['text', 'token']);
  assert.equal('correctOptionId' in question, false);
  assert.doesNotMatch(serialized, /correctOptionId|colarinho|gargalo|coroa|creme/);
  assert.match(serialized, /No Brasil, como é chamada/);
});

test('estado ativo entrega apenas a pergunta atual', () => {
  const state = publicAttemptState(config, 'attempt-1', {
    status: 'active',
    name: 'Ana',
    nextIndex: '3',
    score: '2',
    results: '110',
    deadlineAt: '123456',
    optionOrderSlot: '7'
  });

  assert.equal(state.status, 'active');
  assert.equal(state.name, 'Ana');
  assert.equal(state.question.id, 'q04');
  assert.equal('score' in state, false);
  assert.equal('answers' in state, false);
  assert.equal('ticket' in state, false);
  assert.equal('optionOrderSlot' in state, false);
  assert.doesNotMatch(JSON.stringify(state), /optionOrderSlot/);
});

test('estado final expõe apenas mapa booleano e pontuação', () => {
  const state = publicAttemptState(config, 'attempt-1', {
    status: 'finished',
    name: 'Ana',
    nextIndex: '15',
    score: '12',
    results: '111011101110111',
    winnerRank: ''
  });

  assert.equal(state.status, 'finished');
  assert.equal(state.result.score, 12);
  assert.equal(state.result.total, 15);
  assert.equal(state.result.answers.length, 15);
  assert.ok(state.result.answers.every(value => typeof value === 'boolean'));
  assert.equal(state.result.ticket, undefined);
});

test('ticket só aparece para vencedor quando o código foi reconstruído', () => {
  const attempt = {
    status: 'winner',
    name: 'Ana',
    nextIndex: '15',
    score: '15',
    results: '111111111111111',
    winnerRank: '7'
  };

  const withoutTicket = publicAttemptState(config, 'attempt-1', attempt);
  const issued = publicAttemptState(config, 'attempt-1', attempt, 'RUSTY-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF');
  const redeemed = publicAttemptState(config, 'attempt-1', attempt, 'RUSTY-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF', 'redeemed');

  assert.equal(withoutTicket.result.ticket, undefined);
  assert.equal(issued.result.ticket.rank, 7);
  assert.equal(issued.result.ticket.prize, '2 chopps por conta da casa');
  assert.equal(issued.result.ticket.status, 'issued');
  assert.equal(redeemed.result.ticket.status, 'redeemed');
});
