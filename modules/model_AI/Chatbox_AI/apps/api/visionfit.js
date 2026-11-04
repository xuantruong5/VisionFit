export class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export async function requestJSON(url, options = {}) {
  let response;
  try { response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(25000) }); }
  catch { throw new AppError(502, 'Không kết nối được dịch vụ. Vui lòng thử lại.'); }
  if ([401, 403].includes(response.status)) throw new AppError(response.status, 'Phiên đăng nhập hết hạn hoặc không có quyền truy cập.');
  if (!response.ok) throw new AppError(502, 'Dịch vụ chưa sẵn sàng. Vui lòng thử lại.');
  const reader = response.body.getReader(); let size = 0; const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 256000) { await reader.cancel(); throw new AppError(502, 'Dữ liệu phản hồi quá lớn.'); }
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch (e) { if (e instanceof AppError) throw e; throw new AppError(502, 'Phản hồi dịch vụ không hợp lệ.'); }
}
const text = (x, max = 160) => typeof x === 'string' ? x.slice(0, max) : null;
const metric = x => typeof x === 'number' && Number.isFinite(x) ? x : null;
export function identity(raw, role) {
  const u = raw?.data;
  if (!u || !['string', 'number'].includes(typeof u.id) || !String(u.id) || !['string', 'number'].includes(typeof u.gym_id) || !String(u.gym_id) || u.role !== role) throw new AppError(502, 'API danh tính chưa đúng hợp đồng tích hợp.');
  return { id: String(u.id), gym_id: String(u.gym_id), role, name: text(u.name) || 'Thành viên' };
}
export const ownerKey = u => JSON.stringify([u.gym_id, u.role, u.id]);
export function sanitizeContext(raw, user) {
  const d = raw?.data;
  if (!d || !d.subject || String(d.subject.id) !== user.id || String(d.subject.gym_id) !== user.gym_id || d.subject.role !== user.role) throw new AppError(403, 'Dữ liệu trả về không thuộc tài khoản hiện tại.');
  const records = (value, mapper) => Array.isArray(value) ? value.slice(0, 20).map(mapper) : [];
  return {
    profile: {
      name: user.name,
      goal: text(d.profile?.goal),
      level: text(d.profile?.level),
      activity_level: text(d.profile?.activity_level),
      allergy: text(d.profile?.allergy),
      note: text(d.profile?.note),
    },
    nutrition: d.nutrition ? {
      weight_kg: metric(d.nutrition?.can_nang),
      height_cm: metric(d.nutrition?.chieu_cao_cm),
      bmi: metric(d.nutrition?.bmi),
      bmr: metric(d.nutrition?.bmr),
      tdee: metric(d.nutrition?.tdee),
      target_calories: metric(d.nutrition?.kcal_muc_tieu),
      protein_g: metric(d.nutrition?.protein),
      carb_g: metric(d.nutrition?.carb),
      fat_g: metric(d.nutrition?.fat),
    } : null,
    suggestions: d.suggestions ? {
      programs: records(d.suggestions?.programs, p => ({ name: text(p.name), goal: text(p.goal), sessions_per_week: metric(p.sessions_per_week) })),
      exercises: records(d.suggestions?.exercises, e => ({ name: text(e.name), equipment: text(e.equipment) })),
      meals: records(d.suggestions?.meals, m => ({ name: text(m.name), meal_type: text(m.meal_type), diet_type: text(m.diet_type), calories: metric(m.calories), protein: metric(m.protein) })),
    } : null,
    packages: records(d.packages, p => ({ name: text(p.name), expires_at: text(p.expires_at, 40), remaining_sessions: metric(p.remaining_sessions), total_sessions: metric(p.total_sessions) })),
    schedule: records(d.schedule, s => ({ name: text(s.name), starts_at: text(s.starts_at, 40), scheduled_date: text(s.scheduled_date, 20), trainer: text(s.trainer) })),
    progress: { sessions_this_week: metric(d.progress?.sessions_this_week), completion_percent: metric(d.progress?.completion_percent) },
    summary: user.role === 'member' ? null : { assigned_members: metric(d.summary?.assigned_members), expiring_members: user.role === 'admin' ? metric(d.summary?.expiring_members) : null },
  };
}
export function createVisionFit(c) {
  const get = (path, token) => requestJSON(c.apiUrl.replace(/\/$/, '') + path, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  return {
    async login(role, email, password) {
      const r = await requestJSON(c.apiUrl.replace(/\/$/, '') + c.loginPaths[role], { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!r.status || typeof r.token !== 'string' || !r.token) throw new AppError(401, 'Email hoặc mật khẩu không đúng.');
      const user = identity(await get(c.mePath, r.token), role);
      return { user, token: r.token };
    },
    async validate(session) {
      const current = identity(await get(c.mePath, session.token), session.user.role);
      if (ownerKey(current) !== ownerKey(session.user)) throw new AppError(401, 'Danh tính tài khoản đã thay đổi. Vui lòng đăng nhập lại.');
      session.user = current;
    },
    async context(session) { return sanitizeContext(await get(c.contextPath, session.token), session.user); },
  };
}
export function demoUser(role, email) {
  const expected = `${role}@demo.visionfit.local`;
  if (email !== expected) throw new AppError(401, 'Vui lòng dùng tài khoản demo được hiển thị.');
  return { id: role === 'member' ? '101' : role === 'trainer' ? '201' : '301', gym_id: 'demo-gym', role, name: { member: 'Minh Anh', trainer: 'HLV Hoàng Nam', admin: 'Quản lý VisionFit' }[role] };
}
export function demoContext(user) {
  return {
    profile: { name: user.name, goal: 'Tăng cơ giảm mỡ', level: 'Cơ bản', activity_level: '2', allergy: 'Không', note: 'Thể trạng bình thường' },
    nutrition: { weight_kg: 70, height_cm: 175, bmi: 22.86, bmr: 1673.75, tdee: 2301.41, target_calories: 2601.41, protein_g: 195.11, carb_g: 292.66, fat_g: 72.26 },
    suggestions: {
      programs: [{ name: 'Tập luyện toàn thân nền tảng', goal: 'Tăng cơ', sessions_per_week: 3 }],
      exercises: [{ name: 'Barbell Bench Press', equipment: 'Thanh tạ đòn, ghế tập' }, { name: 'Dumbbell Floor Press', equipment: 'Tạ đơn, thảm tập' }],
      meals: [{ name: 'Cơm gạo lứt ức gà', meal_type: 'SANG', diet_type: 'Eat Clean', calories: 420, protein: 35 }, { name: 'Ức gà áp chảo ăn kèm rau củ hấp', meal_type: 'TOI', diet_type: 'Giảm tinh bột (Low-carb/Keto)', calories: 350, protein: 42 }]
    },
    packages: [{ name: 'Gói trải nghiệm DEMO', expires_at: '2026-12-31', remaining_sessions: 12 }],
    schedule: [{ name: 'Toàn thân cơ bản (DEMO)', starts_at: '2026-11-02T18:00:00+07:00', trainer: 'HLV Demo' }],
    progress: { sessions_this_week: 2, completion_percent: 65 },
    summary: user.role === 'member' ? null : { assigned_members: 8, expiring_members: user.role === 'admin' ? 3 : null }
  };
}
