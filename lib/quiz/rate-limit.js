const RATE_LIMIT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return current
`;

export async function enforceRateLimit(redis, key, limit, windowSeconds) {
  const count = Number(await redis.eval(RATE_LIMIT_SCRIPT, [key], [String(windowSeconds)]));
  if (count > limit) {
    const error = new Error('Muitas tentativas. Aguarde um pouco.');
    error.statusCode = 429;
    error.retryAfter = windowSeconds;
    throw error;
  }
}
