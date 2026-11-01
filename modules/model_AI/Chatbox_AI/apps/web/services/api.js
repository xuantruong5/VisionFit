export class APIError extends Error { constructor(message, status) { super(message); this.status = status; } }
export async function api(path, options = {}) {
  let res;
  try { res = await fetch(path, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...options.headers } }); }
  catch { throw new APIError('Mất kết nối. Vui lòng kiểm tra mạng rồi thử lại.', 0); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/auth/login') window.dispatchEvent(new CustomEvent('vif:session-expired'));
    throw new APIError(body.error || 'Có lỗi xảy ra. Vui lòng thử lại.', res.status);
  }
  return body;
}
