import { QUESTION_VERSION, QUESTIONS } from './questions.js';

const DEFAULT_CAMPAIGN_ID = 'rustytoberfest-2026';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 365 * 2;

function requiredSecret(name, minimumLength = 32) {
  const value = process.env[name];
  if (!value || value.length < minimumLength) {
    const error = new Error(`Configuração ausente: ${name}`);
    error.code = 'QUIZ_CONFIG_ERROR';
    throw error;
  }
  return value;
}

export function getQuizConfig() {
  const enabled = process.env.QUIZ_ENABLED !== 'false';
  const campaignId = process.env.QUIZ_CAMPAIGN_ID || DEFAULT_CAMPAIGN_ID;
  const winnerLimit = Number.parseInt(process.env.QUIZ_WINNER_LIMIT || '10', 10);
  const questionSeconds = Number.parseInt(process.env.QUIZ_QUESTION_SECONDS || '30', 10);
  const retentionSeconds = Number.parseInt(process.env.QUIZ_RETENTION_SECONDS || String(DEFAULT_TTL_SECONDS), 10);

  if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(campaignId)) {
    throw Object.assign(new Error('QUIZ_CAMPAIGN_ID inválido'), { code: 'QUIZ_CONFIG_ERROR' });
  }
  if (!Number.isInteger(winnerLimit) || winnerLimit < 1 || winnerLimit > 100) {
    throw Object.assign(new Error('QUIZ_WINNER_LIMIT inválido'), { code: 'QUIZ_CONFIG_ERROR' });
  }
  if (!Number.isInteger(questionSeconds) || questionSeconds < 5 || questionSeconds > 300) {
    throw Object.assign(new Error('QUIZ_QUESTION_SECONDS inválido'), { code: 'QUIZ_CONFIG_ERROR' });
  }
  if (!Number.isInteger(retentionSeconds) || retentionSeconds < 86400) {
    throw Object.assign(new Error('QUIZ_RETENTION_SECONDS inválido'), { code: 'QUIZ_CONFIG_ERROR' });
  }

  return {
    enabled,
    campaignId,
    winnerLimit,
    questionSeconds,
    retentionSeconds,
    questionVersion: QUESTION_VERSION,
    questionCount: QUESTIONS.length,
    identitySecret: requiredSecret('QUIZ_IDENTITY_SECRET'),
    optionSecret: requiredSecret('QUIZ_OPTION_SECRET'),
    ticketSecret: requiredSecret('QUIZ_TICKET_SECRET'),
    adminPin: requiredSecret('QUIZ_ADMIN_PIN', 6)
  };
}
