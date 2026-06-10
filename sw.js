/**
 * sw.js — Service Worker Rusty Pub
 * v9 — CACHE DESATIVADO: pass-through total + limpeza de caches anteriores
 */

const SW_VERSION = 'v9-no-cache';

// ── INSTALL: pula espera imediatamente, sem pré-cache ────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

// ── ACTIVATE: apaga TODOS os caches existentes (v1–v8) e assume controle ─────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: sem handler — browser vai direto à rede em toda requisição ─────────