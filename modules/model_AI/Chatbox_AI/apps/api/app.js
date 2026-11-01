import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createStore } from './store.js';
import { AppError, createVisionFit, demoUser, demoContext, ownerKey } from './visionfit.js';
import { answer } from './assistant.js';
const PUBLIC = fileURLToPath(new URL('../web/', import.meta.url));
async function readJSON(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new AppError(415, 'Yêu cầu phải là JSON.');
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 12000) throw new AppError(413, 'Nội dung quá dài.'); chunks.push(chunk); }
  try { const body = JSON.parse(Buffer.concat(chunks).toString()); if (!body || Array.isArray(body) || typeof body !== 'object') throw 0; return body; }
  catch { throw new AppError(400, 'JSON không hợp lệ.'); }
}
export function createApp(c, { logger = console.info } = {}) {
  const store = createStore(c.dbPath), vf = createVisionFit(c), sessions = new Map(), limits = new Map(), busyOwners = new Set();
  const cookieName = c.production ? '__Host-vif_session' : 'vif_session';
  const cookie = (token, age) => `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${c.production ? '; Secure' : ''}`;
  function limit(key, max, window) {
    const now = Date.now(), prev = limits.get(key), bucket = prev?.until > now ? prev : { count: 0, until: now + window };
    if (++bucket.count > max) throw new AppError(429, 'Bạn đã gửi nhiều yêu cầu. Vui lòng thử lại sau.');
    limits.set(key, bucket);
  }
  const sweep = () => {
    const now = Date.now();
    for (const [k,v] of sessions) if (v.expires <= now) sessions.delete(k);
    for (const [k,v] of limits) if (v.until <= now) limits.delete(k);
    store.prune(now - c.retention);
  };
  sweep(); const timer = setInterval(sweep, 60000); timer.unref();
  const server = createServer(async (req, res) => {
    const started = Date.now(), requestId = randomBytes(6).toString('hex');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'");
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (c.production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    const json = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
    let session, sid;
    try {
      const path = new URL(req.url, c.origin).pathname;
      const method = req.method;
      if (path.startsWith('/api/')) {
        if (!['GET','POST','DELETE'].includes(method)) throw new AppError(405, 'Phương thức không được hỗ trợ.');
        if (method !== 'GET' && req.headers.origin !== c.origin) throw new AppError(403, 'Nguồn yêu cầu không hợp lệ.');
        const config = { dataMode: c.dataMode, aiMode: c.aiMode };
        if (path === '/api/config' && method === 'GET') return json(config);
        const match = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${cookieName}=`));
        sid = match?.slice(cookieName.length + 1); session = sessions.get(sid);
        if (path === '/api/auth/login' && method === 'POST') {
          limit(`login:${req.socket.remoteAddress}`, c.loginLimit, 900000);
          const b = await readJSON(req);
          if (!['member','trainer','admin'].includes(b.role) || typeof b.email !== 'string' || b.email.length > 254 || typeof b.password !== 'string' || b.password.length > 256 || !b.password) throw new AppError(400, 'Thông tin đăng nhập không hợp lệ.');
          let auth;
          if (c.dataMode === 'demo') {
            if (b.password !== 'Demo123!') throw new AppError(401, 'Mật khẩu demo không đúng.');
            auth = { user: demoUser(b.role, b.email.trim().toLowerCase()), token: null };
          } else auth = await vf.login(b.role, b.email.trim(), b.password);
          if (sessions.size >= 2000) { sweep(); if (sessions.size >= 2000) throw new AppError(503, 'Hệ thống đang bận.'); }
          if (sid) sessions.delete(sid);
          const token = randomBytes(32).toString('hex');
          sessions.set(token, { ...auth, expires: Date.now() + c.ttl });
          res.setHeader('Set-Cookie', cookie(token, Math.floor(c.ttl / 1000)));
          return json({ user: auth.user, ...config });
        }
        if (!session || session.expires <= Date.now()) { sessions.delete(sid); throw new AppError(401, 'Vui lòng đăng nhập để tiếp tục.'); }
        if (path === '/api/auth/logout' && method === 'POST') {
          sessions.delete(sid); res.setHeader('Set-Cookie', cookie('', 0)); return json({ ok: true });
        }
        if (c.dataMode === 'live') await vf.validate(session);
        const owner = ownerKey(session.user);
        if (path === '/api/auth/me' && method === 'GET') return json({ user: session.user, ...config });
        if (path === '/api/context' && method === 'GET') return json({ context: c.dataMode === 'demo' ? demoContext(session.user) : await vf.context(session), ...config });
        if (path === '/api/messages' && method === 'GET') return json({ messages: store.list(owner) });
        if (path === '/api/messages' && method === 'DELETE') {
          if (busyOwners.has(owner)) throw new AppError(409, 'Vui lòng chờ câu trả lời hoàn tất trước khi xóa.');
          store.clear(owner); return json({ ok: true });
        }
        if (path === '/api/chat' && method === 'POST') {
          limit(`chat:${owner}`, c.chatLimit, 3600000);
          const body = await readJSON(req);
          if (Object.keys(body).some(k => k !== 'message')) throw new AppError(400, 'Chỉ nhận nội dung câu hỏi; không nhận user ID hoặc đường dẫn API.');
          if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 2000) throw new AppError(400, 'Câu hỏi cần từ 1 đến 2.000 ký tự.');
          if (busyOwners.has(owner)) throw new AppError(409, 'Trợ lý đang trả lời. Vui lòng chờ.');
          busyOwners.add(owner);
          try {
            const context = c.dataMode === 'demo' ? demoContext(session.user) : await vf.context(session);
            const result = await answer(c, session.user, context, store.list(owner), body.message.trim());
            // Logout/expiry while AI was running must not persist a late response.
            if (!sessions.has(sid) || session.expires <= Date.now()) throw new AppError(401, 'Phiên đã kết thúc. Vui lòng đăng nhập lại.');
            store.appendPair(owner, body.message.trim(), result.content);
            logger(JSON.stringify({ event: 'chat', requestId, duration_ms: Date.now()-started, usage: result.usage, mode: config }));
            return json({ ...result, messages: store.list(owner), ...config });
          } finally { busyOwners.delete(owner); }
        }
        throw new AppError(404, 'Không tìm thấy API.');
      }
      if (req.method !== 'GET') throw new AppError(405, 'Phương thức không được hỗ trợ.');
      const files = {
        '/': ['index.html','text/html'],
        '/app.js': ['app.js','text/javascript'],
        '/styles.css': ['styles.css','text/css'],
        '/favicon.svg': ['favicon.svg','image/svg+xml'],
        '/services/api.js': ['services/api.js','text/javascript'],
        '/services/chatboxCore.js': ['services/chatboxCore.js','text/javascript'],
        '/mascot-lab': ['mascot/lab.html','text/html'],
        '/mascot/lab.js': ['mascot/lab.js','text/javascript'],
        '/mascot/lab.css': ['mascot/lab.css','text/css'],
        '/mascot/mascot.css': ['mascot/mascot.css','text/css'],
        '/mascot/bear.js': ['mascot/bear.js','text/javascript'],
        '/mascot/cat.js': ['mascot/cat.js','text/javascript'],
        '/mascot/renderer.js': ['mascot/renderer.js','text/javascript'],
        '/mascot/selector.js': ['mascot/selector.js','text/javascript'],
        '/widget-demo': ['widget/demo.html','text/html'],
        '/widget/demo.js': ['widget/demo.js','text/javascript'],
        '/widget/widget.css': ['widget/widget.css','text/css'],
        '/widget/widget.js': ['widget/widget.js','text/javascript'],
        '/widget/adapter.js': ['widget/adapter.js','text/javascript'],
        '/widget/sanitizer.js': ['widget/sanitizer.js','text/javascript'],
        '/contracts/assistant.js': ['../../packages/contracts/assistant.js','text/javascript'],
        '/packages/contracts/assistant.js': ['../../packages/contracts/assistant.js','text/javascript']
      };
      if (!files[path]) throw new AppError(404, 'Không tìm thấy trang.');
      const [file, type] = files[path];
      res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` }); res.end(await readFile(PUBLIC + file));
    } catch(e) {
      const status = e instanceof AppError ? e.status : 500;
      if ([401,403].includes(status) && session && c.dataMode === 'live') { sessions.delete(sid); res.setHeader('Set-Cookie', cookie('', 0)); }
      logger(JSON.stringify({ event: 'request_error', requestId, status, duration_ms: Date.now()-started }));
      if (!res.headersSent) json({ error: status === 500 ? 'Có lỗi hệ thống. Vui lòng thử lại.' : e.message, requestId }, status);
      else res.end();
    }
  });
  server.headersTimeout = 10000; server.requestTimeout = 35000;
  server.on('close', () => { clearInterval(timer); store.close(); });
  return { server };
}
