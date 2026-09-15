export const CONFIG = Object.freeze({
  sessionKey: 'curso_access_session_v2',
  attemptKey: 'curso_access_attempts_v2',
  maxAttempts: 5,
  attemptWindowMs: 5 * 60 * 1000,
  cooldownMs: 30 * 1000
});
