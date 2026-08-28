import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export function normalizeBrazilianPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  const national = digits.length > 11 && digits.startsWith('55') ? digits.slice(2) : digits;
  if (!/^[1-9]{2}9?\d{8}$/.test(national) || national.length < 10 || national.length > 11) {
    throw Object.assign(new Error('WhatsApp inválido'), { code: 'INVALID_PHONE', statusCode: 400 });
  }
  return `55${national}`;
}

export function normalizeName(value) {
  const name = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 80) {
    throw Object.assign(new Error('Nome inválido'), { code: 'INVALID_NAME', statusCode: 400 });
  }
  return name;
}

export function normalizeDeviceId(value) {
  const id = String(value ?? '').trim();
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(id)) {
    throw Object.assign(new Error('Dispositivo inválido'), { code: 'INVALID_DEVICE', statusCode: 400 });
  }
  return id;
}

export function hmac(secret, value) {
  return createHmac('sha256', secret).update(String(value)).digest('hex');
}

export function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function safeEqualText(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getRequestIp(request) {
  return String(
    request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    request.headers['x-real-ip'] ||
    'desconhecido'
  ).slice(0, 128);
}

const BASE32_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function bufferToBase32(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function deriveTicketCode(secret, campaignId, attemptId) {
  const digest = createHmac('sha256', secret)
    .update(`${campaignId}:${attemptId}:ticket`)
    .digest()
    .subarray(0, 15);
  const raw = bufferToBase32(digest);
  return `RUSTY-${raw.match(/.{1,4}/g).join('-')}`;
}

export function deriveOptionToken(secret, campaignId, attemptId, questionId, optionId) {
  return createHmac('sha256', secret)
    .update(`${campaignId}:${attemptId}:${questionId}:${optionId}`)
    .digest('base64url');
}

function permutationIndex(secret, campaignId, attemptId, optionOrderSlot, questionId, permutationCount) {
  const slot = Number.parseInt(String(optionOrderSlot), 10);
  if (!Number.isInteger(slot) || slot < 0) {
    const fallback = createHash('sha256').update(`${attemptId}:${questionId}:legacy-order`).digest().readUInt32BE(0);
    return fallback % permutationCount;
  }
  const questionOffset = createHmac('sha256', secret)
    .update(`${campaignId}:${questionId}:order-offset`)
    .digest()
    .readUInt32BE(0);
  return (slot + questionOffset) % permutationCount;
}

function permutationByIndex(options, index) {
  const available = [...options];
  const ordered = [];
  let remaining = index;
  for (let size = available.length; size > 0; size -= 1) {
    const selected = remaining % size;
    remaining = Math.floor(remaining / size);
    ordered.push(available.splice(selected, 1)[0]);
  }
  return ordered;
}

export function deterministicOptionOrder(secret, campaignId, attemptId, question, optionOrderSlot = null) {
  if (optionOrderSlot == null) {
    return [...question.options].sort((left, right) => {
      const leftKey = hmac(secret, `${campaignId}:${attemptId}:${question.id}:order:${left.id}`);
      const rightKey = hmac(secret, `${campaignId}:${attemptId}:${question.id}:order:${right.id}`);
      return leftKey.localeCompare(rightKey);
    });
  }
  const permutationCount = question.options.reduce((total, _, index) => total * (index + 1), 1);
  const index = permutationIndex(secret, campaignId, attemptId, optionOrderSlot, question.id, permutationCount);
  return permutationByIndex(question.options, index);
}

export function getCookie(request, name) {
  const header = String(request.headers.cookie || '');
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
}

export function buildSessionCookie(token, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `rusty_quiz_session=${encodeURIComponent(token)}; Path=/api/quiz; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}
