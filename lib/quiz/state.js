import { getQuestionByIndex } from './questions.js';
import { deterministicOptionOrder, deriveOptionToken, getCookie, sha256 } from './security.js';
import { quizKeys } from './keys.js';

export async function getAttemptFromRequest(redis, config, request) {
  const token = getCookie(request, 'rusty_quiz_session');
  if (!token) throw Object.assign(new Error('Tentativa não encontrada.'), { statusCode: 401 });
  const keys = quizKeys(config.campaignId);
  const sessionHash = sha256(token);
  const attemptId = await redis.get(keys.session(sessionHash));
  if (!attemptId) throw Object.assign(new Error('Sessão expirada.'), { statusCode: 401 });
  const attempt = await redis.hgetall(keys.attempt(attemptId));
  if (!attempt || !attempt.status) throw Object.assign(new Error('Tentativa não encontrada.'), { statusCode: 404 });
  return { attemptId: String(attemptId), attempt, keys, sessionHash };
}

export function publicQuestion(config, attemptId, index, deadlineAt) {
  const question = getQuestionByIndex(index);
  if (!question) return null;
  const options = deterministicOptionOrder(config.optionSecret, config.campaignId, attemptId, question)
    .map(option => ({
      token: deriveOptionToken(config.optionSecret, config.campaignId, attemptId, question.id, option.id),
      text: option.text
    }));
  return { id: question.id, index, number: index + 1, total: config.questionCount, text: question.text, options, deadlineAt };
}

function parseResults(value) {
  return String(value || '').split('').map(item => item === '1');
}

export function publicAttemptState(config, attemptId, attempt, ticketCode = null, ticketStatus = 'issued') {
  const serverNow = Date.now();
  const status = String(attempt.status);
  const index = Number(attempt.nextIndex || 0);
  const base = {
    campaignId: config.campaignId,
    status,
    serverNow,
    name: String(attempt.name || ''),
    questionSeconds: config.questionSeconds
  };
  if (status === 'active') {
    return {
      ...base,
      question: publicQuestion(config, attemptId, index, Number(attempt.deadlineAt))
    };
  }
  const result = {
    score: Number(attempt.score || 0),
    total: config.questionCount,
    answers: parseResults(attempt.results),
    winnerRank: attempt.winnerRank ? Number(attempt.winnerRank) : null
  };
  if (status === 'winner' && ticketCode) {
    result.ticket = {
      code: ticketCode,
      rank: Number(attempt.winnerRank),
      prize: '2 chopps por conta da casa',
      status: ticketStatus
    };
  }
  return { ...base, result };
}
