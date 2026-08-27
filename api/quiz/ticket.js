import { getQuizConfig } from '../../lib/quiz/config.js';
import { setApiHeaders, requireMethod, sendError } from '../../lib/quiz/http.js';
import { getRedis } from '../../lib/quiz/redis-client.js';
import { deriveTicketCode, sha256 } from '../../lib/quiz/security.js';
import { getAttemptFromRequest } from '../../lib/quiz/state.js';
import { enforceRateLimit } from '../../lib/quiz/rate-limit.js';

export default async function handler(request, response) {
  setApiHeaders(response, ['GET']);
  if (!requireMethod(request, response, ['GET'])) return;

  try {
    const config = getQuizConfig();
    const redis = getRedis();
    const context = await getAttemptFromRequest(redis, config, request);
    await enforceRateLimit(
      redis,
      context.keys.rateLimit('ticket-session', context.sessionHash),
      30,
      300
    );
    if (context.attempt.status !== 'winner') {
      return response.status(404).json({ error: 'Ticket não encontrado.' });
    }
    const code = deriveTicketCode(config.ticketSecret, config.campaignId, context.attemptId);
    const ticket = await redis.hgetall(context.keys.ticket(sha256(code)));
    if (!ticket?.status) return response.status(404).json({ error: 'Ticket não encontrado.' });
    return response.status(200).json({
      campaignId: config.campaignId,
      name: String(context.attempt.name || ''),
      code,
      rank: Number(ticket.rank),
      prize: '2 chopps por conta da casa',
      status: String(ticket.status),
      issuedAt: Number(ticket.issuedAt || 0),
      redeemedAt: ticket.redeemedAt ? Number(ticket.redeemedAt) : null
    });
  } catch (error) {
    return sendError(response, error);
  }
}
