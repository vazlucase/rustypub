import test from 'node:test';
import assert from 'node:assert/strict';

import { advanceExpiredQuestions } from '../lib/quiz/timeout.js';

class TimeoutRedisDouble {
  constructor(attempt, now) {
    this.attempt = { ...attempt };
    this.now = now;
    this.deadlines = [];
  }

  async eval(_script, _keys, args) {
    const expectedIndex = Number(args[0]);
    if (Number(this.attempt.nextIndex) !== expectedIndex || this.attempt.status !== 'active') {
      return ['stale'];
    }

    const deadline = Number(args[3]);
    this.deadlines.push(deadline);
    this.attempt.nextIndex = String(expectedIndex + 1);
    this.attempt.results += '0';
    this.attempt.deadlineAt = String(deadline);
    if (Number(this.attempt.nextIndex) >= 15) {
      this.attempt.status = 'finished';
      this.attempt.finishedAt = args[6];
    }
    return ['active'];
  }

  async hgetall() {
    return { ...this.attempt };
  }
}

const config = Object.freeze({
  campaignId: 'rustytoberfest-2026',
  ticketSecret: 'ticket-de-teste-com-mais-de-32-caracteres',
  questionSeconds: 30,
  questionCount: 15,
  winnerLimit: 10
});

const keys = {
  attempt: id => `attempt:${id}`,
  winnerCount: 'winner-count',
  winners: 'winners',
  ticket: hash => `ticket:${hash}`
};

test('consome todas as janelas vencidas a partir do deadline anterior', async () => {
  const realNow = Date.now;
  const now = 1_000_000;
  Date.now = () => now;
  try {
    const redis = new TimeoutRedisDouble({
      status: 'active',
      nextIndex: '0',
      score: '0',
      results: '',
      deadlineAt: String(now - 95_000)
    }, now);
    const context = { attemptId: 'attempt-1', attempt: { ...redis.attempt }, keys };

    await advanceExpiredQuestions(redis, config, context);

    assert.deepEqual(redis.deadlines, [
      now - 65_000,
      now - 35_000,
      now - 5_000,
      now + 25_000
    ]);
    assert.equal(context.attempt.nextIndex, '4');
    assert.equal(context.attempt.results, '0000');
    assert.equal(context.attempt.status, 'active');
  } finally {
    Date.now = realNow;
  }
});

test('encerra tentativa ao consumir o último prazo vencido', async () => {
  const realNow = Date.now;
  const now = 2_000_000;
  Date.now = () => now;
  try {
    const redis = new TimeoutRedisDouble({
      status: 'active',
      nextIndex: '14',
      score: '14',
      results: '11111111111111',
      deadlineAt: String(now - 1)
    }, now);
    const context = { attemptId: 'attempt-2', attempt: { ...redis.attempt }, keys };

    await advanceExpiredQuestions(redis, config, context);

    assert.equal(context.attempt.status, 'finished');
    assert.equal(context.attempt.nextIndex, '15');
    assert.equal(context.attempt.score, '14');
    assert.equal(context.attempt.results, '111111111111110');
    assert.equal(redis.deadlines.length, 1);
  } finally {
    Date.now = realNow;
  }
});
