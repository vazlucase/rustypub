import { getQuizConfig } from '../../lib/quiz/config.js';
import { setApiHeaders, requireMethod, requireSameOrigin, parseJsonBody, sendError } from '../../lib/quiz/http.js';
import { getRedis } from '../../lib/quiz/redis-client.js';
import { ANSWER_SCRIPT } from '../../lib/quiz/scripts.js';
import { getQuestionByIndex } from '../../lib/quiz/questions.js';
import { deriveOptionToken, deriveTicketCode, safeEqualText, sha256 } from '../../lib/quiz/security.js';
import { getAttemptFromRequest, publicAttemptState } from '../../lib/quiz/state.js';
import { advanceExpiredQuestions } from '../../lib/quiz/timeout.js';
import { enforceRateLimit } from '../../lib/quiz/rate-limit.js';

function validateIdempotencyKey(value) {
  const key = String(value || '');
  if (!/^[a-zA-Z0-9_-]{12,128}$/.test(key)) {
    throw Object.assign(new Error('Chave da resposta inválida.'), { statusCode: 400 });
  }
  return key;
}

async function publicStateWithTicket(redis, config, context, attempt = context.attempt) {
  if (attempt.status !== 'winner') {
    return publicAttemptState(config, context.attemptId, attempt);
  }

  const ticketCode = deriveTicketCode(config.ticketSecret, config.campaignId, context.attemptId);
  const ticket = await redis.hgetall(context.keys.ticket(sha256(ticketCode)));
  const ticketStatus = String(ticket?.status || 'issued');
  return publicAttemptState(
    config,
    context.attemptId,
    attempt,
    ticketCode,
    ticketStatus
  );
}

export default async function handler(request, response) {
  setApiHeaders(response, ['POST']);
  if (!requireMethod(request, response, ['POST']) || !requireSameOrigin(request, response)) return;

  try {
    const config = getQuizConfig();
    const body = parseJsonBody(request);
    const requestedIndex = Number(body.index);
    const idempotencyKey = validateIdempotencyKey(body.idempotencyKey);
    const redis = getRedis();
    const sessionContext = await getAttemptFromRequest(redis, config, request);
    await enforceRateLimit(
      redis,
      sessionContext.keys.rateLimit('answer-session', sessionContext.sessionHash),
      60,
      600
    );
    const context = await advanceExpiredQuestions(redis, config, sessionContext);

    if (context.attempt.status !== 'active') {
      return response.status(200).json(
        await publicStateWithTicket(redis, config, context)
      );
    }

    const currentIndex = Number(context.attempt.nextIndex || 0);
    if (!Number.isInteger(requestedIndex) || requestedIndex !== currentIndex) {
      return response.status(200).json(publicAttemptState(config, context.attemptId, context.attempt));
    }

    const question = getQuestionByIndex(currentIndex);
    if (!question || body.questionId !== question.id) {
      return response.status(200).json(publicAttemptState(config, context.attemptId, context.attempt));
    }

    const optionToken = body.optionToken == null ? null : String(body.optionToken);
    let correct = false;
    if (optionToken) {
      const selected = question.options.find(option => {
        const expected = deriveOptionToken(config.optionSecret, config.campaignId, context.attemptId, question.id, option.id);
        return safeEqualText(optionToken, expected);
      });
      if (!selected) return response.status(400).json({ error: 'Alternativa inválida.' });
      correct = selected.id === question.correctOptionId;
    }

    const now = Date.now();
    if (now > Number(context.attempt.deadlineAt)) correct = false;
    const nextDeadline = now + config.questionSeconds * 1000;
    const ticketCode = deriveTicketCode(config.ticketSecret, config.campaignId, context.attemptId);
    const ticketHash = sha256(ticketCode);

    await redis.eval(
      ANSWER_SCRIPT,
      [context.keys.attempt(context.attemptId), context.keys.winnerCount, context.keys.winners, context.keys.ticket(ticketHash)],
      [String(currentIndex), idempotencyKey, correct ? '1' : '0', String(nextDeadline), String(config.questionCount), String(config.winnerLimit), String(now), context.attemptId, ticketHash]
    );

    const attempt = await redis.hgetall(context.keys.attempt(context.attemptId));
    return response.status(200).json(
      await publicStateWithTicket(redis, config, context, attempt)
    );
  } catch (error) {
    return sendError(response, error);
  }
}
