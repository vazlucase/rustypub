const JSON_LIMIT_BYTES = 8192;

export function setApiHeaders(response, methods) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Allow', methods.join(', '));
}

export function requireMethod(request, response, methods) {
  if (!methods.includes(request.method)) {
    response.status(405).json({ error: 'Método não permitido.' });
    return false;
  }
  return true;
}

export function requireSameOrigin(request, response) {
  const origin = request.headers.origin;
  if (!origin) return true;
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  try {
    const originUrl = new URL(origin);
    if (originUrl.host === host && originUrl.protocol === `${protocol}:`) return true;
  } catch {}
  response.status(403).json({ error: 'Origem não permitida.' });
  return false;
}

export function parseJsonBody(request) {
  const contentType = String(request.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    throw Object.assign(new Error('Envie os dados como JSON.'), { statusCode: 415 });
  }
  const contentLength = Number.parseInt(request.headers['content-length'] || '0', 10);
  if (contentLength > JSON_LIMIT_BYTES) {
    throw Object.assign(new Error('Corpo muito grande'), { statusCode: 413 });
  }
  if (request.body == null) return {};
  if (typeof request.body === 'object') return request.body;
  try {
    return JSON.parse(request.body);
  } catch {
    throw Object.assign(new Error('JSON inválido'), { statusCode: 400 });
  }
}

export function sendError(response, error) {
  if (error?.code === 'QUIZ_CONFIG_ERROR') {
    response.setHeader('Retry-After', '60');
    return response.status(503).json({ error: 'Quiz temporariamente indisponível.' });
  }
  const status = error?.statusCode || 503;
  if (error?.retryAfter) response.setHeader('Retry-After', String(error.retryAfter));
  if (status >= 500) {
    response.setHeader('Retry-After', '30');
    console.error('Erro no quiz:', error?.message || error);
  }
  return response.status(status).json({
    error: status >= 500 ? 'Não foi possível confirmar agora. Tente novamente.' : error.message
  });
}
