import { CONFIG } from './config.js';

export function readAttempts() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.attemptKey) || '{"count":0,"since":0,"lockUntil":0}');
  } catch {
    return { count: 0, since: 0, lockUntil: 0 };
  }
}

export function writeAttempts(data) {
  localStorage.setItem(CONFIG.attemptKey, JSON.stringify(data));
}

export function isRateLimited() {
  const now = Date.now();
  const attempts = readAttempts();
  if (!attempts.since || now - attempts.since >= CONFIG.attemptWindowMs) return false;
  return Boolean(attempts.lockUntil && now < attempts.lockUntil);
}

export function registerAttempt(success) {
  const now = Date.now();
  const attempts = readAttempts();

  if (!attempts.since || now - attempts.since >= CONFIG.attemptWindowMs) {
    attempts.count = 0;
    attempts.since = now;
    attempts.lockUntil = 0;
  }

  attempts.count += 1;

  if (!success && attempts.count >= CONFIG.maxAttempts) {
    attempts.lockUntil = now + CONFIG.cooldownMs;
  }

  if (success) {
    attempts.count = 0;
    attempts.since = now;
    attempts.lockUntil = 0;
  }

  writeAttempts(attempts);
}

export function clearSession() {
  localStorage.removeItem(CONFIG.sessionKey);
}
