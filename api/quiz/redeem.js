import { getQuizConfig } from '../../lib/quiz/config.js';
import { setApiHeaders, requireMethod, requireSameOrigin, parseJsonBody, sendError } from '../../lib/quiz/http.js';
import { getRedis } from '../../lib/quiz/redis-client.js';
import { quizKeys } from '../../lib/quiz/keys.js';
import { enforceRateLimit } from '../../lib/quiz/rate-limit.js';
import { REDEEM_TICKET_SCRIPT } from '../../lib/quiz/scripts.js';
import { getRequestIp, hmac, safeEqualText, sha256 } from '../../lib/quiz/security.js';

function normalizeTicketCode(value) {
  const code = String(value || '').toUpperCase().replace(/\s+/g, '').trim();
  if (!/^RUSTY-(?:[A-Z2-9]{4}-){5}[A-Z2-9]{4}$/.test(code)) {
    throw Object.assign(new Error('Código inválido.'), { statusCode: 400 });
  }
  return code;
}

export default async function handler(request, response) {
  setApiHeaders(response, ['POST']);
  if (!requireMethod(request, response, ['POST']) || !requireSameOrigin(request, response)) return;

  try {
    const config = getQuizConfig();
    const body = parseJsonBody(request);
    if (body.action !== 'verify' && body.action !== 'redeem') {
      return response.status(400).json({ error: 'Ação inválida.' });
    }
    const action = body.action;
    const code = normalizeTicketCode(body.code);
    const pin = String(body.pin || '');
    const redis = getRedis();
    const keys = quizKeys(config.campaignId);
    const ipHash = hmac(config.identitySecret, `ip:${getRequestIp(request)}`);
    await enforceRateLimit(redis, keys.rateLimit('redeem-ip', ipHash), 40, 900);

    if (!safeEqualText(pin, config.adminPin)) {
      return response.status(401).json({ error: 'Código ou PIN inválido.' });
    }

    const now = Date.now();
    const ticketKey = keys.ticket(sha256(code));
    const attemptId = await redis.hget(ticketKey, 'attemptId');
    const result = await redis.eval(
      REDEEM_TICKET_SCRIPT,
      [ticketKey, keys.attempt(String(attemptId || 'missing'))],
      [action, String(now), String(config.retentionSeconds)]
    );
    const status = String(result?.[0]);
    if (status === 'invalid') return response.status(404).json({ error: 'Ticket não encontrado.' });

    return response.status(200).json({
      valid: true,
      status: status === 'redeemed_now' ? 'redeemed' : status,
      redeemedNow: status === 'redeemed_now',
      rank: Number(result?.[1] || 0),
      issuedAt: Number(result?.[2] || 0),
      redeemedAt: result?.[3] ? Number(result[3]) : null,
      prize: '2 chopps por conta da casa'
    });
  } catch (error) {
    return sendError(response, error);
  }
}
