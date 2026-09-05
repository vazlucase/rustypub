const API = Object.freeze({
  start: '/api/quiz/start',
  state: '/api/quiz/state',
  answer: '/api/quiz/answer',
  ticket: '/api/quiz/ticket'
});

const DEVICE_KEY = 'rusty_quiz_device_v1';
const TAB_KEY = 'rusty_quiz_tab_v1';
const CHANNEL_NAME = 'rusty_quiz_channel_v1';
const WHATSAPP_NUMBER = '5591991567596';
const views = [...document.querySelectorAll('.quiz-view')];
const liveRegion = document.querySelector('#quiz-live');
const introView = document.querySelector('#view-intro');
const questionView = document.querySelector('#view-question');
const resultView = document.querySelector('#view-result');
const winnerView = document.querySelector('#view-winner');
const blockedView = document.querySelector('#view-blocked');
const fatalView = document.querySelector('#view-fatal');
const startForm = document.querySelector('#quiz-start-form');
const answerForm = document.querySelector('#answer-form');
const startButton = document.querySelector('#start-button');
const answerButton = document.querySelector('#answer-button');
const nameInput = document.querySelector('#quiz-name');
const phoneInput = document.querySelector('#quiz-phone');
const termsInput = document.querySelector('#quiz-terms');
const adultInput = document.querySelector('#quiz-adult');
const questionProgress = document.querySelector('#question-progress');
const progressFill = document.querySelector('#quiz-progress-fill');
const questionTitle = document.querySelector('#question-title');
const questionOptions = document.querySelector('#question-options');
const timer = document.querySelector('#quiz-timer');
const timerValue = document.querySelector('#timer-value');
const timerRingBar = document.querySelector('#timer-ring-bar');
const RING_CIRCUMFERENCE = 226.19; // 2 * π * 36
const answerError = document.querySelector('#answer-error');
const startError = document.querySelector('#start-error');

let currentState = null;
let currentQuestion = null;
let selectedToken = null;
let pendingAnswer = null;
let timerFrame = 0;
let serverAnchorTime = Date.now();
let serverAnchorPerf = performance.now();
let requestInFlight = false;
let deadlineSubmitted = false;
let activeView = null;
let tabBlocked = false;

const tabId = getRandomId();
const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;

function getRandomId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id || !/^[a-zA-Z0-9_-]{16,128}$/.test(id)) {
      id = getRandomId().replace(/-/g, '_');
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return getRandomId().replace(/-/g, '_');
  }
}

function announce(message) {
  liveRegion.textContent = '';
  requestAnimationFrame(() => { liveRegion.textContent = message; });
}

function showView(view, announcement = '') {
  views.forEach(item => { item.hidden = item !== view; });
  activeView = view;
  if (announcement) announce(announcement);
  if (view !== introView) {
    window.scrollTo(0, 0);
  }
  const heading = view.querySelector('h1, legend');
  if (heading && view !== introView) {
    heading.setAttribute('tabindex', '-1');
    requestAnimationFrame(() => heading.focus({ preventScroll: true }));
  }
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Não foi possível confirmar agora.');
    error.status = response.status;
    error.retryAfter = response.headers.get('Retry-After');
    throw error;
  }
  return data;
}

function setBusy(button, busy, busyLabel, idleLabel) {
  button.disabled = busy;
  button.textContent = busy ? busyLabel : idleLabel;
  button.setAttribute('aria-busy', String(busy));
}

function clearFieldErrors() {
  document.querySelector('#name-error').textContent = '';
  document.querySelector('#phone-error').textContent = '';
  startError.textContent = '';
  nameInput.removeAttribute('aria-invalid');
  phoneInput.removeAttribute('aria-invalid');
}

function formatPhone(event) {
  const rawDigits = event.currentTarget.value.replace(/\D/g, '');
  const digits = (rawDigits.length > 11 && rawDigits.startsWith('55') ? rawDigits.slice(2) : rawDigits).slice(0, 11);
  let formatted = digits;
  if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length > 7) formatted = `${formatted.slice(0, digits.length === 11 ? 10 : 9)}-${digits.slice(digits.length === 11 ? 7 : 6)}`;
  event.currentTarget.value = formatted;
}

function validateStartForm() {
  clearFieldErrors();
  let valid = true;
  if (nameInput.value.trim().length < 2) {
    document.querySelector('#name-error').textContent = 'Informe seu nome.';
    nameInput.setAttribute('aria-invalid', 'true');
    valid = false;
  }
  const rawPhoneDigits = phoneInput.value.replace(/\D/g, '');
  const phoneDigits = rawPhoneDigits.length > 11 && rawPhoneDigits.startsWith('55')
    ? rawPhoneDigits.slice(2)
    : rawPhoneDigits;
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    document.querySelector('#phone-error').textContent = 'Informe um WhatsApp com DDD.';
    phoneInput.setAttribute('aria-invalid', 'true');
    valid = false;
  }
  if (!termsInput.checked || !adultInput.checked) {
    startError.textContent = 'Aceite as regras e confirme sua maioridade.';
    valid = false;
  }
  return valid;
}

async function startQuiz(event) {
  event.preventDefault();
  if (requestInFlight || !validateStartForm()) return;
  requestInFlight = true;
  setBusy(startButton, true, 'INICIANDO...', 'COMEÇAR O DESAFIO');
  try {
    const state = await apiFetch(API.start, {
      method: 'POST',
      body: JSON.stringify({
        name: nameInput.value.trim(),
        phone: phoneInput.value,
        deviceId: getDeviceId(),
        accepted: termsInput.checked,
        adult: adultInput.checked
      })
    });
    broadcast({ type: 'attempt-active' });
    renderState(state);
  } catch (error) {
    startError.textContent = error.message;
    announce(error.message);
  } finally {
    requestInFlight = false;
    setBusy(startButton, false, 'INICIANDO...', 'COMEÇAR O DESAFIO');
  }
}

function syncServerClock(state) {
  if (Number.isFinite(Number(state.serverNow))) {
    serverAnchorTime = Number(state.serverNow);
    serverAnchorPerf = performance.now();
  }
}

function estimatedServerNow() {
  return serverAnchorTime + (performance.now() - serverAnchorPerf);
}

function renderState(state) {
  currentState = state;
  syncServerClock(state);
  stopTimer();
  if (state.status === 'active' && state.question) {
    renderQuestion(state.question, Number(state.questionSeconds || 30));
    return;
  }
  if (state.status === 'winner') {
    renderWinner(state);
    return;
  }
  renderResult(state);
}

function renderQuestion(question, questionSeconds) {
  currentQuestion = question;
  selectedToken = null;
  pendingAnswer = null;
  deadlineSubmitted = false;
  answerError.textContent = '';
  answerButton.disabled = true;
  questionProgress.textContent = `Pergunta ${question.number} de ${question.total}`;
  if (progressFill) {
    const total = Number(question.total) || 15;
    progressFill.style.width = `${((Number(question.number) - 1) / total) * 100}%`;
  }
  questionTitle.textContent = question.text;
  questionOptions.replaceChildren(...question.options.map((option, index) => createOption(option, index)));
  showView(questionView, `Pergunta ${question.number} de ${question.total}. Você tem ${questionSeconds} segundos.`);
  broadcast({ type: 'attempt-active' });
  startTimer(Number(question.deadlineAt), questionSeconds);
}

function createOption(option, index) {
  const label = document.createElement('label');
  label.className = 'quiz-option';
  label.style.setProperty('--option-index', index);

  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'quiz-answer';
  input.value = option.token;
  input.addEventListener('change', () => selectOption(option.token, label));

  const letter = document.createElement('span');
  letter.className = 'quiz-option__letter';
  letter.textContent = String.fromCharCode(65 + index);
  letter.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'quiz-option__text';
  text.textContent = option.text;

  label.append(input, letter, text);
  return label;
}

function selectOption(token, selectedLabel) {
  selectedToken = token;
  questionOptions.querySelectorAll('.quiz-option').forEach(label => label.classList.toggle('is-selected', label === selectedLabel));
  answerButton.disabled = requestInFlight;
  answerError.textContent = '';
}

function startTimer(deadlineAt, totalSeconds) {
  const duration = totalSeconds * 1000;
  let lastDisplayed = null;
  const tick = () => {
    const remaining = Math.max(0, deadlineAt - estimatedServerNow());
    const seconds = Math.ceil(remaining / 1000);
    const ratio = Math.max(0, Math.min(1, remaining / duration));
    timerRingBar.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - ratio)}`;
    if (lastDisplayed !== seconds) {
      timerValue.textContent = String(seconds);
      timer.setAttribute('aria-label', `${seconds} ${seconds === 1 ? 'segundo restante' : 'segundos restantes'}`);
      lastDisplayed = seconds;
    }
    const low = remaining <= 10000;
    timer.classList.toggle('is-low', low);
    if (remaining <= 0) {
      if (!deadlineSubmitted) {
        deadlineSubmitted = true;
        announce('Tempo encerrado. Avançando para a próxima pergunta.');
        submitAnswer(null, true);
      }
      return;
    }
    timerFrame = requestAnimationFrame(tick);
  };
  timerFrame = requestAnimationFrame(tick);
}

function stopTimer() {
  if (timerFrame) cancelAnimationFrame(timerFrame);
  timerFrame = 0;
}

function makeIdempotencyKey(question) {
  return `ans_${question.id}_${getRandomId().replace(/-/g, '')}`;
}

async function submitAnswer(optionToken, timedOut = false) {
  if (requestInFlight || !currentQuestion) return;
  requestInFlight = true;
  stopTimer();
  answerError.textContent = '';
  if (!pendingAnswer) {
    pendingAnswer = {
      questionId: currentQuestion.id,
      optionToken,
      index: currentQuestion.index,
      idempotencyKey: makeIdempotencyKey(currentQuestion)
    };
  }
  setBusy(answerButton, true, timedOut ? 'TEMPO ENCERRADO...' : 'CONFIRMANDO...', 'CONFIRMAR RESPOSTA');
  try {
    const state = await apiFetch(API.answer, { method: 'POST', body: JSON.stringify(pendingAnswer) });
    pendingAnswer = null;
    renderState(state);
  } catch (error) {
    answerError.textContent = `${error.message} Toque para tentar novamente.`;
    announce(error.message);
    deadlineSubmitted = false;
    answerButton.disabled = false;
  } finally {
    requestInFlight = false;
    if (activeView === questionView) {
      setBusy(answerButton, false, 'CONFIRMANDO...', pendingAnswer ? 'TENTAR NOVAMENTE' : 'CONFIRMAR RESPOSTA');
      answerButton.disabled = !pendingAnswer && !selectedToken;
    }
  }
}

function renderAnswerMap(answers) {
  const items = (answers || []).map((correct, index) => {
    const item = document.createElement('span');
    item.className = correct ? 'is-correct' : 'is-wrong';
    item.textContent = String(index + 1);
    item.title = `Pergunta ${index + 1}: ${correct ? 'acerto' : 'erro'}`;
    return item;
  });
  document.querySelector('#answer-map').replaceChildren(...items);
}

function renderResult(state) {
  const result = state.result || {};
  const score = Number(result.score || 0);
  document.querySelector('#result-score').textContent = String(score);
  document.querySelector('#result-title').textContent = state.status === 'perfect_nonwinner' ? 'VOCÊ GABARITOU' : 'QUIZ CONCLUÍDO';
  document.querySelector('#result-kicker').textContent = state.status === 'perfect_nonwinner' ? 'Pontuação perfeita' : 'Resultado final';
  document.querySelector('#result-message').textContent = state.status === 'perfect_nonwinner'
    ? 'Você acertou todas, mas os 10 tickets já foram liberados.'
    : score >= 12
      ? 'Mandou muito bem. Desta vez, o ticket exigia todas as 15 respostas certas.'
      : 'Valeu por participar. O ticket exigia 15 acertos nesta tentativa.';
  document.querySelector('#result-fine').textContent = 'As respostas corretas aparecem em verde. Não é possível refazer o quiz com os mesmos dados.';
  renderAnswerMap(result.answers);
  broadcast({ type: 'attempt-finished' });
  showView(resultView, `Quiz concluído. Sua pontuação foi ${score} de 15.`);
}

function renderWinner(state) {
  const ticket = state.result?.ticket;
  if (!ticket) {
    loadTicket();
    return;
  }
  fillTicket(state.name, ticket);
}

async function loadTicket() {
  showView(document.querySelector('#view-loading'), 'Recuperando seu ticket.');
  try {
    const ticket = await apiFetch(API.ticket);
    fillTicket(ticket.name, ticket);
  } catch (error) {
    showFatal(error.message);
  }
}

function fillTicket(name, ticket) {
  document.querySelector('#ticket-name').textContent = name || 'Participante';
  document.querySelector('#ticket-rank').textContent = `${ticket.rank}º de 10`;
  document.querySelector('#ticket-code').textContent = ticket.code;
  const statusText = ticket.status === 'redeemed' ? 'Ticket já resgatado' : 'Válido até o resgate';
  document.querySelector('#ticket-status').textContent = statusText;
  const whatsappLink = document.querySelector('#ticket-whatsapp');
  const message = `Olá! Ganhei o quiz Rustytoberfest do Rusty Pub. Meu código é ${ticket.code}.`;
  whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  whatsappLink.hidden = ticket.status === 'redeemed';
  broadcast({ type: 'attempt-finished' });
  showView(winnerView, `Parabéns. Você ficou em ${ticket.rank}º lugar e ganhou 2 chopps.`);
}

async function syncState({ quiet = false } = {}) {
  if (requestInFlight || tabBlocked) return;
  requestInFlight = true;
  try {
    const state = await apiFetch(API.state);
    renderState(state);
  } catch (error) {
    if (error.status === 401 || error.status === 404) {
      if (!quiet) showView(introView, 'Preencha seus dados para iniciar o quiz.');
      return;
    }
    if (!quiet) showFatal(error.message);
  } finally {
    requestInFlight = false;
  }
}

function showFatal(message) {
  document.querySelector('#fatal-message').textContent = message || 'Sua tentativa continua protegida no servidor.';
  showView(fatalView, message);
}

function broadcast(message) {
  const payload = { ...message, tabId, timestamp: Date.now() };
  channel?.postMessage(payload);
  try { localStorage.setItem(TAB_KEY, JSON.stringify(payload)); } catch {}
}

function onExternalMessage(payload) {
  if (!payload || payload.tabId === tabId) return;
  if (payload.type === 'attempt-active' && activeView === questionView) {
    if (String(payload.tabId) < tabId) {
      tabBlocked = true;
      stopTimer();
      showView(blockedView, 'O quiz está ativo em outra aba.');
    } else {
      broadcast({ type: 'attempt-active' });
    }
  }
  if (payload.type === 'attempt-finished') syncState({ quiet: true });
  if (payload.type === 'tab-closed' && tabBlocked) {
    tabBlocked = false;
    syncState();
  }
}

function onStorage(event) {
  if (event.key !== TAB_KEY || !event.newValue) return;
  try { onExternalMessage(JSON.parse(event.newValue)); } catch {}
}

function announcePresence() {
  if (activeView === questionView) broadcast({ type: 'attempt-active' });
}

startForm.addEventListener('submit', startQuiz);
phoneInput.addEventListener('input', formatPhone);
answerForm.addEventListener('submit', event => {
  event.preventDefault();
  if (pendingAnswer) submitAnswer(pendingAnswer.optionToken, pendingAnswer.optionToken == null);
  else if (selectedToken) submitAnswer(selectedToken);
});
document.querySelector('#retry-button').addEventListener('click', () => syncState());
document.querySelector('#sync-button').addEventListener('click', () => { tabBlocked = false; syncState(); });
channel?.addEventListener('message', event => onExternalMessage(event.data));
window.addEventListener('storage', onStorage);
window.addEventListener('pageshow', () => syncState({ quiet: activeView === introView }));
window.addEventListener('focus', () => {
  announcePresence();
  if (activeView === questionView && !tabBlocked) syncState({ quiet: true });
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    announcePresence();
    if (activeView === questionView && !tabBlocked) syncState({ quiet: true });
  }
});
window.addEventListener('online', () => syncState({ quiet: false }));
window.addEventListener('pagehide', () => broadcast({ type: 'tab-closed' }));

syncState();
