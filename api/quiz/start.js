import { getQuizConfig } from '../../lib/quiz/config.js';
import { setApiHeaders, requireMethod, requireSameOrigin, parseJsonBody, sendError } from '../../lib/quiz/http.js';
import { getRedis } from '../../lib/quiz/redis-client.js';
import { quizKeys } from '../../lib/quiz/keys.js';
import { enforceRateLimit } from '../../lib/quiz/rate-limit.js';
import { START_ATTEMPT_SCRIPT } from '../../lib/quiz/scripts.js';
import {
  buildSessionCookie,
  getRequestIp,
  hmac,
  normalizeBrazilianPhone,
  normalizeDeviceId,
  normalizeName,
  randomToken,
  sha256
} from '../../lib/quiz/security.js';
import { publicAttemptState } from '../../lib/quiz/state.js';

export default async function handler(request, response) {
  setApiHeaders(response, ['POST']);
  if (!requireMethod(request, response, ['POST']) || !requireSameOrigin(request, response)) return;

  try {
    const config = getQuizConfig();
    if (!config.enabled) return response.status(410).json({ error: 'A campanha não está recebendo novas tentativas.' });

    const body = parseJsonBody(request);
    if (body.accepted !== true || body.adult !== true) {
      return response.status(400).json({ error: 'É necessário aceitar o regulamento e confirmar maioridade.' });
    }

    const name = normalizeName(body.name);
    const phone = normalizeBrazilianPhone(body.phone);
    const deviceId = normalizeDeviceId(body.deviceId);
    const phoneHash = hmac(config.identitySecret, `phone:${phone}`);
    const deviceHash = hmac(config.identitySecret, `device:${deviceId}`);
    const ipHash = hmac(config.identitySecret, `ip:${getRequestIp(request)}`);
    const redis = getRedis();
    const keys = quizKeys(config.campaignId);

    await enforceRateLimit(redis, keys.rateLimit('start-ip', ipHash), 300, 3600);
    await enforceRateLimit(redis, keys.rateLimit('start-device', deviceHash), 10, 3600);

    const attemptId = randomToken(18);
    const sessionToken = randomToken(32);
    const sessionHash = sha256(sessionToken);
    const now = Date.now();
    const deadlineAt = now + config.questionSeconds * 1000;
    const result = await redis.eval(
      START_ATTEMPT_SCRIPT,
      [keys.participant(phoneHash), keys.device(deviceHash), keys.attempt(attemptId), keys.session(sessionHash)],
      [attemptId, String(config.retentionSeconds), name, config.questionVersion, String(now), String(deadlineAt)]
    );

    const state = String(result?.[0]);
    const resolvedAttemptId = String(result?.[1] || '');
    if (state === 'blocked') {
      return response.status(409).json({ error: 'Já existe uma tentativa registrada para estes dados.' });
    }
    if (state !== 'created' && state !== 'resume') {
      throw new Error('Resposta inesperada ao iniciar o quiz');
    }

    if (state === 'resume') {
      await redis.set(keys.session(sessionHash), resolvedAttemptId, { ex: config.retentionSeconds });
    }

    const attempt = await redis.hgetall(keys.attempt(resolvedAttemptId));
    response.setHeader('Set-Cookie', buildSessionCookie(sessionToken, config.retentionSeconds));
    return response.status(state === 'created' ? 201 : 200).json(
      publicAttemptState(config, resolvedAttemptId, attempt)
    );
  } catch (error) {
    return sendError(response, error);
  }
}
