/**
 * helpers.js — Utilitários compartilhados
 * v2.0 — ELITE SECURITY: DOMPurify-like sanitização + validação reforçada
 */

/**
 * Sanitiza texto para uso em atributos e textContent (XSS-safe).
 * Usa textContent — nunca innerHTML — para dados externos.
 */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Cria elemento de texto seguro (nunca usa innerHTML para conteúdo externo).
 */
export function createTextNode(tag, text, attrs = {}) {
  const el = document.createElement(tag);
  el.textContent = text;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

/**
 * Renderiza empty state em um container.
 */
export function showEmptyState(container, message, ctaText, ctaLink) {
  const el   = document.createElement('div');
  el.className = 'empty-state';

  const p   = document.createElement('p');
  p.textContent = message;

  const a   = document.createElement('a');
  a.textContent = ctaText;
  a.href        = ctaLink;
  a.className   = 'btn btn--outline';

  el.appendChild(p);
  el.appendChild(a);
  container.appendChild(el);
}

/**
 * Valida o formulário de contato com feedback inline por campo.
 * @returns {boolean}
 */
export function validateForm(form) {
  let valid = true;

  const fields = [
    {
      el: form.querySelector('[name="name"]'),
      validate: (v) => v.length >= 2 && v.length <= 100,
      msg: 'Nome deve ter entre 2 e 100 caracteres.',
    },
    {
      el: form.querySelector('[name="email"]'),
      validate: (v) => isValidEmail(v),
      msg: 'Informe um e-mail válido.',
    },
    {
      el: form.querySelector('[name="message"]'),
      validate: (v) => v.length >= 5 && v.length <= 2000,
      msg: 'Mensagem deve ter entre 5 e 2000 caracteres.',
    },
  ];

  fields.forEach(({ el, validate, msg }) => {
    if (!el) return;
    const value = el.value.trim();
    const ok    = validate(value);
    setFieldError(el, ok ? '' : msg);
    if (!ok) valid = false;
  });

  return valid;
}

/**
 * Aplica/remove erro visual em um campo.
 */
export function setFieldError(el, message) {
  const group = el.closest('.form-group');
  if (!group) return;

  let errorEl = group.querySelector('.form-field-error');
  el.classList.toggle('input--error', !!message);

  if (message) {
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className  = 'form-field-error';
      errorEl.setAttribute('role', 'alert');
      group.appendChild(errorEl);
    }
    errorEl.textContent = message;
  } else if (errorEl) {
    errorEl.remove();
  }
}

/** Regex de e-mail (RFC 5322 simplificado) */
function isValidEmail(email) {
  return /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email);
}
