import { ANSWER_SCRIPT } from './scripts.js';
import { getQuestionByIndex } from './questions.js';
import { deriveTicketCode, sha256 } from './security.js';

export async function advanceExpiredQuestions(redis, config, context) {
  let { attempt } = context;
  while (attempt.status === 'active' && Number(attempt.deadlineAt) <= Date.now()) {
    const index = Number(attempt.nextIndex || 0);
    const question = getQuestionByIndex(index);
    if (!question) break;
    const now = Date.now();
    const nextDeadline = Number(attempt.deadlineAt) + config.questionSeconds * 1000;
    const ticketCode = deriveTicketCode(config.ticketSecret, config.campaignId, context.attemptId);
    const ticketHash = sha256(ticketCode);
    await redis.eval(
      ANSWER_SCRIPT,
      [context.keys.attempt(context.attemptId), context.keys.winnerCount, context.keys.winners, context.keys.ticket(ticketHash)],
      [String(index), `timeout:${question.id}`, '0', String(nextDeadline), String(config.questionCount), String(config.winnerLimit), String(now), context.attemptId, ticketHash]
    );
    attempt = await redis.hgetall(context.keys.attempt(context.attemptId));
  }
  context.attempt = attempt;
  return context;
}
