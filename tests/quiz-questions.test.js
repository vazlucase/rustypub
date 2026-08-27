import test from 'node:test';
import assert from 'node:assert/strict';

import { QUESTION_VERSION, QUESTIONS, getQuestionById, getQuestionByIndex } from '../lib/quiz/questions.js';

const EXPECTED_CORRECT_OPTIONS = [
  'colarinho',
  'chopeira',
  'petiscos',
  'chopp',
  'brinde',
  'aromas-gas',
  'co2',
  'aquece-qualidade',
  'lager-pilsen',
  'residuos-microrganismos',
  'denominacao-legal',
  'espuma-carbonatacao',
  'cor-parede',
  'contato-oxigenio',
  'sem-pasteurizacao'
];

test('mantém a versão e as 15 perguntas da campanha', () => {
  assert.equal(QUESTION_VERSION, 'rustytoberfest-2026-v1');
  assert.equal(QUESTIONS.length, 15);
  assert.deepEqual(QUESTIONS.map(question => question.id),
    Array.from({ length: 15 }, (_, index) => `q${String(index + 1).padStart(2, '0')}`));
});

test('cada pergunta tem quatro alternativas únicas e um único gabarito válido', () => {
  QUESTIONS.forEach((question, index) => {
    assert.equal(question.options.length, 4, question.id);
    assert.equal(new Set(question.options.map(option => option.id)).size, 4, question.id);
    assert.equal(new Set(question.options.map(option => option.text)).size, 4, question.id);
    assert.ok(question.text.trim().length > 0, question.id);
    assert.equal(question.correctOptionId, EXPECTED_CORRECT_OPTIONS[index]);
    assert.ok(question.options.some(option => option.id === question.correctOptionId), question.id);
  });
});

test('buscas por índice e ID são estáveis e falham fechadas', () => {
  assert.equal(getQuestionByIndex(0), QUESTIONS[0]);
  assert.equal(getQuestionByIndex(14), QUESTIONS[14]);
  assert.equal(getQuestionByIndex(15), null);
  assert.equal(getQuestionById('q10'), QUESTIONS[9]);
  assert.equal(getQuestionById('inexistente'), null);
});
