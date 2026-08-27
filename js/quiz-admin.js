const API_URL = '/api/quiz/redeem';
const form = document.querySelector('#redeem-form');
const codeInput = document.querySelector('#ticket-code-input');
const pinInput = document.querySelector('#ticket-pin-input');
const errorMessage = document.querySelector('#redeem-error');
const verifyButton = document.querySelector('#verify-button');
const resultPanel = document.querySelector('#redeem-result');
const statusBadge = document.querySelector('#ticket-status-badge');
const redeemButton = document.querySelector('#redeem-button');
const newTicketButton = document.querySelector('#new-ticket-button');
const confirmPanel = document.querySelector('#confirm-panel');
const cancelButton = document.querySelector('#cancel-redeem-button');
const confirmButton = document.querySelector('#confirm-redeem-button');
let verifiedCode = '';
let busy = false;

function normalizeCode(value) {
  const compact = String(value || '').toUpperCase().replace(/[^A-Z2-9]/g, '').replace(/^RUSTY/, '');
  const groups = compact.match(/.{1,4}/g) || [];
  return groups.length ? `RUSTY-${groups.slice(0, 6).join('-')}` : '';
}

function formatDate(value) {
  const timestamp = Number(value);
  if (!timestamp) return 'Não registrado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(timestamp));
}

function setBusy(button, value, loadingLabel, idleLabel) {
  busy = value;
  button.disabled = value;
  button.textContent = value ? loadingLabel : idleLabel;
  button.setAttribute('aria-busy', String(value));
}

async function callRedeem(action) {
  const response = await fetch(API_URL, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: verifiedCode || codeInput.value,
      pin: pinInput.value,
      action
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível validar o ticket.');
  return data;
}

function renderResult(data) {
  const redeemed = data.status === 'redeemed';
  resultPanel.hidden = false;
  statusBadge.className = `qa-status ${redeemed ? 'is-redeemed' : 'is-issued'}`;
  statusBadge.textContent = redeemed ? 'TICKET JÁ UTILIZADO' : 'TICKET VÁLIDO';
  document.querySelector('#result-rank').textContent = `${data.rank}º de 10`;
  document.querySelector('#result-issued').textContent = formatDate(data.issuedAt);
  document.querySelector('#result-redeemed').textContent = redeemed ? formatDate(data.redeemedAt) : 'Ainda não';
  redeemButton.hidden = redeemed;
  form.hidden = true;
  requestAnimationFrame(() => statusBadge.focus?.());
}

async function verifyTicket(event) {
  event.preventDefault();
  if (busy) return;
  errorMessage.textContent = '';
  const code = normalizeCode(codeInput.value);
  if (!/^RUSTY-(?:[A-Z2-9]{4}-){5}[A-Z2-9]{4}$/.test(code)) {
    errorMessage.textContent = 'Digite o código completo do ticket.';
    codeInput.focus();
    return;
  }
  if (pinInput.value.length < 6) {
    errorMessage.textContent = 'Digite o PIN da equipe.';
    pinInput.focus();
    return;
  }
  codeInput.value = code;
  verifiedCode = code;
  setBusy(verifyButton, true, 'VERIFICANDO...', 'VERIFICAR TICKET');
  try {
    renderResult(await callRedeem('verify'));
  } catch (error) {
    verifiedCode = '';
    errorMessage.textContent = error.message;
  } finally {
    setBusy(verifyButton, false, 'VERIFICANDO...', 'VERIFICAR TICKET');
  }
}

function openConfirmation() {
  confirmPanel.hidden = false;
  confirmButton.focus();
}

function closeConfirmation() {
  confirmPanel.hidden = true;
  redeemButton.focus();
}

async function confirmRedeem() {
  if (busy) return;
  setBusy(confirmButton, true, 'CONFIRMANDO...', 'CONFIRMAR USO');
  try {
    const data = await callRedeem('redeem');
    confirmPanel.hidden = true;
    pinInput.value = '';
    renderResult(data);
  } catch (error) {
    confirmPanel.hidden = true;
    form.hidden = false;
    resultPanel.hidden = true;
    errorMessage.textContent = error.message;
    pinInput.focus();
  } finally {
    setBusy(confirmButton, false, 'CONFIRMANDO...', 'CONFIRMAR USO');
  }
}

function resetForm() {
  verifiedCode = '';
  pinInput.value = '';
  codeInput.value = '';
  errorMessage.textContent = '';
  resultPanel.hidden = true;
  form.hidden = false;
  codeInput.focus();
}

codeInput.addEventListener('blur', () => { codeInput.value = normalizeCode(codeInput.value); });
form.addEventListener('submit', verifyTicket);
redeemButton.addEventListener('click', openConfirmation);
cancelButton.addEventListener('click', closeConfirmation);
confirmButton.addEventListener('click', confirmRedeem);
newTicketButton.addEventListener('click', resetForm);
confirmPanel.addEventListener('click', event => { if (event.target === confirmPanel) closeConfirmation(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !confirmPanel.hidden) closeConfirmation(); });
