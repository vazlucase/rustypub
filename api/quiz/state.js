import { getQuizConfig } from '../../lib/quiz/config.js';
import { setApiHeaders, requireMethod, sendError } from '../../lib/quiz/http.js';
import { getRedis } from '../../lib/quiz/redis-client.js';
import { deriveTicketCode, sha256 } from '../../lib/quiz/security.js';
import { getAttemptFromRequest, publicAttemptState } from '../../lib/quiz/state.js';
import { advanceExpiredQuestions } from '../../lib/quiz/timeout.js';
import { enforceRateLimit } from '../../lib/quiz/rate-limit.js';

export default async function handler(request, response) {
  setApiHeaders(response, ['GET']);
  if (!requireMethod(request, response, ['GET'])) return;

  try {
    const config = getQuizConfig();
    const redis = getRedis();
    const sessionContext = await getAttemptFromRequest(redis, config, request);
    await enforceRateLimit(
      redis,
      sessionContext.keys.rateLimit('state-session', sessionContext.sessionHash),
      120,
      600
    );
    const context = await advanceExpiredQuestions(redis, config, sessionContext);
    const ticketCode = context.attempt.status === 'winner'
      ? deriveTicketCode(config.ticketSecret, config.campaignId, context.attemptId)
      : null;
    let ticketStatus = 'issued';
    if (ticketCode) {
      const ticket = await redis.hgetall(context.keys.ticket(sha256(ticketCode)));
      ticketStatus = String(ticket?.status || 'issued');
    }
    return response.status(200).json(
      publicAttemptState(config, context.attemptId, context.attempt, ticketCode, ticketStatus)
    );
  } catch (error) {
    return sendError(response, error);
  }
}
