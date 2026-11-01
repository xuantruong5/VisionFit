import { resolve } from 'node:path';
export function config(env = process.env) {
  const number = (key, fallback, max) => {
    const value = Number(env[key] || fallback);
    if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(`Invalid ${key}`);
    return value;
  };
  const c = {
    host: env.HOST || '127.0.0.1', port: number('PORT', 3000, 65535),
    origin: env.APP_ORIGIN || 'http://localhost:3000', production: env.NODE_ENV === 'production',
    dataMode: env.DATA_MODE || 'demo', aiMode: env.AI_MODE || 'demo',
    dbPath: resolve(env.DB_PATH || './data/assistant.sqlite'),
    ttl: number('SESSION_TTL_MINUTES', 60, 1440) * 60000,
    retention: number('HISTORY_RETENTION_DAYS', 30, 365) * 86400000,
    chatLimit: number('CHAT_LIMIT_PER_HOUR', 30, 1000), loginLimit: number('LOGIN_LIMIT_PER_15_MINUTES', 15, 100),
    apiUrl: env.VISIONFIT_API_URL || 'http://127.0.0.1:8000/api',
    loginPaths: { member: env.VISIONFIT_MEMBER_LOGIN_PATH || '/client/login', trainer: env.VISIONFIT_TRAINER_LOGIN_PATH || '/trainer/login', admin: env.VISIONFIT_ADMIN_LOGIN_PATH || '/admin/login' },
    mePath: env.VISIONFIT_ME_PATH || '/assistant/me', contextPath: env.VISIONFIT_CONTEXT_PATH || '/assistant/context',
    aiUrl: env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    aiKey: env.AI_API_KEY, model: env.AI_MODEL,
  };
  if (!['demo', 'live'].includes(c.dataMode) || !['demo', 'live'].includes(c.aiMode)) throw new Error('Mode must be demo or live');
  const origin = new URL(c.origin);
  if (origin.origin !== c.origin) throw new Error('APP_ORIGIN must be an exact origin, without trailing slash');
  if (c.production && (c.dataMode !== 'live' || c.aiMode !== 'live' || origin.protocol !== 'https:')) throw new Error('Production requires live modes and HTTPS APP_ORIGIN');
  for (const address of [c.apiUrl, c.aiUrl]) {
    const u = new URL(address);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.search || u.hash) throw new Error('Invalid upstream URL');
    if (c.production && u.protocol !== 'https:') throw new Error('Production upstreams require HTTPS');
  }
  for (const path of [...Object.values(c.loginPaths), c.mePath, c.contextPath]) {
    if (!/^\/[a-zA-Z0-9/_-]+$/.test(path)) throw new Error('Invalid upstream path');
  }
  if (c.aiMode === 'live' && (!c.aiKey || !c.model)) throw new Error('AI_API_KEY and AI_MODEL are required');
  if (c.aiMode === 'live' && c.dataMode === 'live' && env.ALLOW_CUSTOMER_DATA_TO_AI !== 'true') throw new Error('Approve minimized customer data transfer with ALLOW_CUSTOMER_DATA_TO_AI=true');
  return c;
}
