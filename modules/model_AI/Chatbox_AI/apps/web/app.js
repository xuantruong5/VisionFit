import { api } from './services/api.js';
const $ = id => document.getElementById(id);
const roles = { member: 'Hội viên', trainer: 'Huấn luyện viên', admin: 'Quản lý phòng tập' };
let state = { user: null, dataMode: 'demo', aiMode: 'demo', busy: false, generation: 0 };
function showLogin(error = '') {
  state.generation++; state.user = null; state.busy = false;
  $('app-view').hidden = true; $('login-view').hidden = false; $('messages').replaceChildren(); $('context-content').replaceChildren();
  $('message').value = ''; $('typing').hidden = true; $('login-error').textContent = error; $('chat-error').textContent = '';
  $('password').value = ''; $('clear-dialog').close(); updateBusy();
}
function modeLabel() { return state.dataMode === 'demo' ? '🧪 DỮ LIỆU DEMO' : state.aiMode === 'demo' ? 'API THẬT · CƠ BẢN' : 'ĐÃ KẾT NỐI'; }
function fillDemo() {
  if (state.dataMode === 'demo') { $('email').value = `${$('role').value}@demo.visionfit.local`; $('password').value = 'Demo123!'; }
}
function updateMode() {
  $('login-mode').textContent = modeLabel(); $('app-mode').textContent = modeLabel();
  $('demo-info').hidden = state.dataMode !== 'demo';
  $('mode-notice').textContent = state.dataMode === 'demo' ? 'Bạn đang dùng dữ liệu minh họa. Đây chưa phải thông tin hội viên thật.' : state.aiMode === 'demo' ? 'Đang đọc dữ liệu thật từ VisionFit. Trả lời cơ bản theo từ khóa; chưa bật mô hình AI.' : 'Thông tin được tra cứu theo quyền tài khoản. Trợ lý hiện chỉ hỗ trợ đọc dữ liệu.';
}
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function isSafeURL(url) {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim().toLowerCase();
  return t.startsWith('https://') || t.startsWith('http://');
}
function formatInline(str) {
  return str
    .replace(/`([^`]+)`/g, '<code class="vif-inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
      const unescaped = url.replace(/&amp;/g, '&');
      return isSafeURL(unescaped) ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="vif-msg-link">${label} ↗</a>` : label;
    });
}
function formatSafeHTML(text) {
  if (typeof text !== 'string') return '';
  const escaped = escapeHTML(text);
  const lines = escaped.split(/\r?\n/);
  const parts = [];
  let inUl = false, inOl = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const isUl = /^[-*]\s+(.*)$/.test(trimmed);
    const isOl = /^(\d+)\.\s+(.*)$/.test(trimmed);
    if (isUl || isOl) {
      const match = isUl ? trimmed.match(/^[-*]\s+(.*)$/) : trimmed.match(/^(\d+)\.\s+(.*)$/);
      const content = match ? match[1] || match[2] : trimmed;
      if (isUl && !inUl) { if (inOl) { parts.push('</ol>'); inOl = false; } parts.push('<ul class="vif-msg-list">'); inUl = true; }
      else if (isOl && !inOl) { if (inUl) { parts.push('</ul>'); inUl = false; } parts.push('<ol class="vif-msg-list">'); inOl = true; }
      parts.push(`<li>${formatInline(content)}</li>`);
    } else {
      if (inUl) { parts.push('</ul>'); inUl = false; }
      if (inOl) { parts.push('</ol>'); inOl = false; }
      if (trimmed === '') parts.push('<div style="height:6px"></div>');
      else parts.push(`<p class="vif-msg-p">${formatInline(line)}</p>`);
    }
  }
  if (inUl) parts.push('</ul>');
  if (inOl) parts.push('</ol>');
  return parts.join('');
}
function renderMessages(messages) {
  $('messages').replaceChildren(); $('welcome').hidden = messages.length > 0;
  for (const m of messages) {
    const row = document.createElement('div'); row.className = `bubble-row ${m.role === 'user' ? 'user' : 'assistant'}`;
    if (m.role !== 'user') { const avatar = document.createElement('div'); avatar.className = 'bubble-avatar'; avatar.textContent = '✦'; row.append(avatar); }
    const bubble = document.createElement('div'); bubble.className = 'bubble';
    if (m.role === 'user') {
      bubble.textContent = m.content;
    } else {
      bubble.innerHTML = formatSafeHTML(m.content);
    }
    row.append(bubble); $('messages').append(row);
  }
  $('chat-scroll').scrollTop = $('chat-scroll').scrollHeight;
}
function card(label, title, lines = []) {
  const el = document.createElement('section'); el.className = 'data-card';
  const small = document.createElement('small'); small.textContent = label;
  const heading = document.createElement('h4'); heading.textContent = title; el.append(small, heading);
  for (const line of lines) { const p = document.createElement('p'); p.textContent = line; el.append(p); }
  $('context-content').append(el); return el;
}
function renderContext(c) {
  $('context-content').replaceChildren();
  card('Mục tiêu hiện tại', c.profile.goal || 'Chưa có dữ liệu', [c.profile.level || '']);
  if (c.packages.length) { const p = c.packages[0]; card('Gói tập của bạn', p.name || 'Chưa có tên gói', [p.remaining_sessions !== null ? `Còn ${p.remaining_sessions} buổi` : 'Chưa có dữ liệu số buổi còn lại', ...(p.total_sessions !== null && p.total_sessions !== undefined ? [`Đã đăng ký: ${p.total_sessions} buổi`] : []), `Hết hạn: ${p.expires_at || 'Chưa có dữ liệu'}`]); }
  else card('Gói tập', 'Chưa có dữ liệu');
  if (c.schedule.length) { const s = c.schedule[0]; const date = s.starts_at ? new Date(s.starts_at) : null; card('Lịch tập được cấp', s.name || 'Buổi tập', [date && !Number.isNaN(date.getTime()) ? date.toLocaleString('vi-VN') : s.scheduled_date ? `${s.scheduled_date} · Chưa có giờ tập` : 'Chưa có thời gian', s.trainer || '']); }
  const progress = card('Tiến độ', `${c.progress.sessions_this_week ?? '—'} buổi trong tuần`);
  if (c.progress.completion_percent !== null) { const bar = document.createElement('progress'); bar.max = 100; bar.value = Math.max(0, Math.min(100, c.progress.completion_percent)); bar.setAttribute('aria-label', 'Tỷ lệ hoàn thành'); progress.append(bar); const p = document.createElement('p'); p.textContent = `Hoàn thành ${c.progress.completion_percent}%`; progress.append(p); }
  if (c.summary) card('Phạm vi quản lý', `${c.summary.assigned_members ?? '—'} hội viên`, c.summary.expiring_members !== null ? [`${c.summary.expiring_members} hội viên sắp hết hạn`] : []);
  $('context-source').textContent = `${state.dataMode === 'demo' ? 'Nguồn: dữ liệu minh họa' : 'Nguồn: API VisionFit'} · ${new Date().toLocaleTimeString('vi-VN')}`;
}
async function loadContext(generation = state.generation) {
  $('refresh-context').disabled = true;
  try { const r = await api('/api/context'); if (generation === state.generation && state.user) renderContext(r.context); }
  catch(e) { if (generation === state.generation) { $('context-content').replaceChildren(); card('Kết nối dữ liệu', 'Chưa tải được thông tin', [e.message]); } }
  finally { $('refresh-context').disabled = false; }
}
async function showApp(auth) {
  state.generation++; Object.assign(state, auth); const generation = state.generation;
  $('login-view').hidden = true; $('app-view').hidden = false; $('password').value = '';
  $('user-name').textContent = state.user.name; $('user-avatar').textContent = state.user.name.slice(0, 1); $('user-role').textContent = roles[state.user.role]; updateMode();
  if ($('welcome-title')) $('welcome-title').innerHTML = `Hôm nay mình cùng<br>tiến thêm một chút nhé, <em>${escapeHTML(state.user.name)}</em>?`;
  renderMessages([]); $('context-content').replaceChildren();
  await Promise.allSettled([loadContext(generation), (async()=>{
    try { const r = await api('/api/messages'); if (generation === state.generation && state.user) renderMessages(r.messages); }
    catch(e) { if (generation === state.generation) $('chat-error').textContent = e.message; }
  })()]);
}
function updateBusy() {
  $('send').disabled = state.busy; $('message').disabled = state.busy;
  for (const el of document.querySelectorAll('[data-prompt]')) el.disabled = state.busy;
  $('clear-chat').disabled = state.busy; $('clear-mobile').disabled = state.busy;
}
async function send(message) {
  if (state.busy || !message.trim() || !state.user) return;
  const question = message.trim(), generation = state.generation;
  state.busy = true; updateBusy(); $('chat-error').textContent = ''; $('typing').hidden = false;
  $('chat-scroll').scrollTop = $('chat-scroll').scrollHeight;
  try {
    const r = await api('/api/chat', { method: 'POST', body: JSON.stringify({ message: question }) });
    if (generation !== state.generation) return;
    renderMessages(r.messages); $('message').value = ''; $('char-count').textContent = '0 / 2000'; $('message').rows = 1;
  } catch(e) { if (generation === state.generation) { $('message').value = question; $('chat-error').textContent = `${e.message} Nội dung được giữ lại để bạn gửi lại.`; } }
  finally { if (generation === state.generation) { state.busy = false; $('typing').hidden = true; updateBusy(); $('message').focus(); } }
}
window.addEventListener('vif:session-expired', () => { if (state.user) showLogin('Phiên đã hết hạn. Vui lòng đăng nhập lại.'); });
$('role').addEventListener('change', fillDemo);
$('toggle-password').addEventListener('click', () => { const hidden = $('password').type === 'password'; $('password').type = hidden ? 'text' : 'password'; $('toggle-password').textContent = hidden ? 'Ẩn' : 'Hiện'; $('toggle-password').setAttribute('aria-label', hidden ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'); });
$('login-form').addEventListener('submit', async e => {
  e.preventDefault(); $('login-submit').disabled = true; $('login-error').textContent = '';
  try { await showApp(await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ role: $('role').value, email: $('email').value, password: $('password').value }) })); }
  catch(e) { $('login-error').textContent = e.message; }
  finally { $('login-submit').disabled = false; }
});
$('chat-form').addEventListener('submit', e => { e.preventDefault(); send($('message').value); });
$('message').addEventListener('input', () => { $('char-count').textContent = `${$('message').value.length} / 2000`; $('message').rows = Math.min(4, $('message').value.split('\n').length); });
$('message').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); send($('message').value); } });
for (const el of document.querySelectorAll('[data-prompt]')) el.addEventListener('click', () => send(el.dataset.prompt));
$('logout').addEventListener('click', async () => {
  $('logout').disabled = true;
  try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); showLogin(); fillDemo(); }
  catch(e) { $('chat-error').textContent = e.message; }
  finally { $('logout').disabled = false; }
});
$('refresh-context').addEventListener('click', () => loadContext());
for (const id of ['clear-chat','clear-mobile']) $(id).addEventListener('click', () => $('clear-dialog').showModal());
$('cancel-clear').addEventListener('click', () => $('clear-dialog').close());
$('confirm-clear').addEventListener('click', async () => {
  $('confirm-clear').disabled = true;
  try { await api('/api/messages', { method: 'DELETE' }); renderMessages([]); $('clear-dialog').close(); }
  catch(e) { $('chat-error').textContent = e.message; $('clear-dialog').close(); }
  finally { $('confirm-clear').disabled = false; }
});
$('chat-nav').addEventListener('click', () => $('message').focus());
try { Object.assign(state, await api('/api/config')); updateMode(); fillDemo(); const auth = await api('/api/auth/me'); await showApp(auth); }
catch(e) { if (e.status !== 401) $('login-error').textContent = e.message; }
