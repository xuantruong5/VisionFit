import AsyncStorage from '@react-native-async-storage/async-storage';
import apiFitlife from '../../general/api';
import { MascotSpecies, ChatAction } from './types';

// Bộ nhớ đệm ngữ cảnh gắn theo token đăng nhập (tự xóa khi đổi tài khoản / đăng xuất)
let cachedContext: any = null;
let cachedToken: string | null = null;
let lastContextFetch = 0;
const CONTEXT_TTL = 2 * 60 * 1000;

export const clearAssistantCache = () => {
  cachedContext = null;
  cachedToken = null;
  lastContextFetch = 0;
};

// Lấy dữ liệu hồ sơ, dinh dưỡng, gói tập và lịch tập thực tế từ Backend VisionFit
const fetchUserContext = async (): Promise<any> => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    clearAssistantCache();
    return {
      authenticated: false,
      account_status: {
        authenticated: false,
        has_body_metrics: false,
        has_goal: false,
        has_registered_program: false,
        has_active_package: false,
        has_schedule: false,
      },
      profile: null,
      nutrition: null,
      active_program: null,
      packages: [],
      schedule: [],
      suggestions: { programs: [], exercises: [], meals: [] },
    };
  }

  if (cachedToken !== token) {
    clearAssistantCache();
    cachedToken = token;
  }

  const now = Date.now();
  if (cachedContext && now - lastContextFetch < CONTEXT_TTL) {
    return cachedContext;
  }

  try {
    const res = await apiFitlife.get('/assistant/context', { timeout: 5000 });
    if (res.data?.data) {
      cachedContext = res.data.data;
      cachedToken = token;
      lastContextFetch = now;
      return cachedContext;
    }
  } catch (_) {
    // Không tự bịa profile / schedule giả nếu API lỗi
  }
  return cachedContext;
};

// Helper định dạng ngày giờ chuẩn Việt Nam (HH:mm dd/mm/yyyy)
const formatVNTime = (isoStr?: string, dateStr?: string): string => {
  if (isoStr) {
    try {
      const d = new Date(isoStr);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const MM = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
      }
    } catch (_) {}
  }
  if (dateStr) {
    const clean = String(dateStr).split('T')[0];
    const p = clean.split('-');
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return dateStr;
  }
  return 'Chưa có thời gian';
};

// Helper định dạng ngày chuẩn Việt Nam (dd/mm/yyyy)
const formatVNDate = (dateStr?: string): string => {
  if (!dateStr) return 'Chưa có dữ liệu';
  const clean = String(dateStr).split('T')[0];
  const p = clean.split('-');
  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
  return dateStr;
};

const formatMealType = (code?: string): string => {
  const normalized = String(code || '').trim().toUpperCase();
  switch (normalized) {
    case 'SANG':
    case 'BUA_SANG':
    case 'SÁNG':
      return 'Sáng';
    case 'PHU_SANG':
    case 'PHỤ SÁNG':
      return 'Phụ sáng';
    case 'TRUA':
    case 'BUA_TRUA':
    case 'TRƯA':
      return 'Trưa';
    case 'PHU_CHIEU':
    case 'PHU_XE':
    case 'PHỤ CHIỀU':
      return 'Phụ chiều';
    case 'TOI':
    case 'BUA_TOI':
    case 'TỐI':
      return 'Tối';
    default:
      return code ? String(code).trim() : 'Bữa chính';
  }
};

const classifyBmi = (bmi?: number | null): string => {
  if (typeof bmi !== 'number' || !isFinite(bmi) || bmi <= 0) return 'Chưa đánh giá';
  if (bmi < 18.5) return 'Thiếu cân';
  if (bmi < 23.0) return 'Bình thường';
  if (bmi < 25.0) return 'Thừa cân';
  return 'Béo phì';
};

// Gọi Gemini AI trực tiếp nếu có key phía client (dự phòng khi backend offline)
const queryGeminiAI = async (
  question: string,
  context: any,
  species: MascotSpecies,
  history: Array<{ sender: string; text: string }> = []
): Promise<string | null> => {
  const apiKey = (globalThis as any)?.__VISIONFIT_GEMINI_KEY__ || '';
  if (!apiKey) {
    return null;
  }
  const mascotRole =
    species === 'cat'
      ? 'Bạn là Mèo VIF 🐱 - trợ lý linh vật tinh nghịch, đáng yêu, nói chuyện có thể chêm "Meo meo!" nhẹ nhàng, thân thiện.'
      : 'Bạn là Gấu VIF 🐻 - trợ lý linh vật khỏe khoắn, tràn đầy năng lượng, vững chãi, luôn khích lệ tinh thần người tập.';

  const formattedContext = context
    ? {
        ...context,
        schedule: (context.schedule || []).map((s: any) => ({
          name: s.name || 'Buổi tập',
          time: formatVNTime(s.starts_at, s.scheduled_date),
          trainer: s.trainer || 'Tự tập',
        })),
        packages: (context.packages || []).map((p: any) => ({
          name: p.name || 'Gói tập',
          total_sessions: p.total_sessions,
          remaining_sessions: p.remaining_sessions,
          expires_at: formatVNDate(p.expires_at),
        })),
      }
    : null;

  const systemPrompt = `${mascotRole}
Bạn là trợ lý AI thông minh chuyên về Thể hình, Sức khỏe và Dinh dưỡng của hệ sinh thái VisionFit.
QUY TẮC BẮT BUỘC:
1. Hiểu tốt tiếng Việt có dấu, không dấu, viết tắt và từ lóng gym. Trả lời ngắn gọn dưới 160 từ.
2. TRUNG THỰC VỚI DỮ LIỆU TÀI KHOẢN:
   - Nếu account_status.has_body_metrics === false (hoặc nutrition == null): KHÔNG bịa chỉ số BMI/BMR/TDEE/calo, nói rõ bạn chưa cập nhật chỉ số cơ thể.
   - Nếu chưa cập nhật chỉ số và chưa đăng ký chương trình: KHÔNG bịa bảng thực đơn cá nhân hóa, nhắc người dùng cập nhật hồ sơ cơ thể trước.
   - Nếu schedule rỗng / packages rỗng: nói rõ bạn chưa đăng ký lịch tập / gói tập.
3. Khi có dữ liệu thực để liệt kê, dùng BẢNG Markdown tối đa 3-4 cột. Tên bữa viết tiếng Việt có dấu (Sáng, Trưa, Tối).
4. Ngày giờ định dạng Việt Nam "HH:mm dd/mm/yyyy" hoặc "dd/mm/yyyy". Không dùng '#', '##', '###'.
5. DỮ LIỆU TÀI KHOẢN:
${formattedContext ? JSON.stringify(formattedContext) : 'Chưa kết nối được dữ liệu tài khoản'}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const messages: any[] = [{ role: 'system', content: systemPrompt }];
    if (history && Array.isArray(history)) {
      history.slice(-4).forEach((h: any) => {
        if (h.sender && h.text) {
          messages.push({
            role: h.sender === 'user' ? 'user' : 'assistant',
            content: String(h.text),
          });
        }
      });
    }
    messages.push({ role: 'user', content: question });

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gemini-flash-lite-latest',
          max_completion_tokens: 1000,
          messages,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) {
        return content.trim();
      }
    }
  } catch (_) {}

  return null;
};

export interface AIResponseResult {
  answer: string;
  intent?: string;
  emotion?: string;
  action?: ChatAction | null;
  source?: string;
}

// Fallback dự phòng khi mất mạng hoặc Backend không phản hồi
const replyFromRealContext = (
  question: string,
  context: any,
  species: MascotSpecies,
  history: Array<{ sender: string; text: string }> = []
): AIResponseResult => {
  const q = question.toLowerCase().trim();
  const isCat = species === 'cat';
  const prefix = isCat ? 'Meo meo! 🐱 ' : 'Gấu VIF đây! 🐻 ';

  const status = context?.account_status || {};
  const isAuthenticated = Boolean(status.authenticated ?? context?.authenticated ?? Boolean(context?.subject));
  const hasBodyMetrics = Boolean(status.has_body_metrics ?? Boolean(context?.nutrition));
  const hasGoal = Boolean(status.has_goal ?? Boolean(context?.profile?.goal));
  const hasRegisteredProgram = Boolean(status.has_registered_program ?? Boolean(context?.active_program));

  // 0. Tiếp nối ngữ cảnh ngắn
  let lastAssistantMsg = '';
  if (history && Array.isArray(history)) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]?.sender === 'assistant' && history[i]?.text) {
        lastAssistantMsg = (history[i].text || '').toLowerCase();
        break;
      }
    }
  }

  const isAffirmative = /^(có|co|ok|oke|được|duoc|uh|ừ|u|đồng ý|dong y|yes|yep|muốn|muon|chốt|nhất trí|tập luôn|tap luon)(?:$|[\s!.,?])/i.test(q);
  const isNegative = /^(không|khong|k|ko|thôi|thoi|chưa|chua|no|nope|đừng|dung|không cần|khong can)(?:$|[\s!.,?])/i.test(q);

  if (isAffirmative && lastAssistantMsg) {
    if (/uống nước|uong nuoc|nhắc nước/i.test(lastAssistantMsg)) {
      return {
        answer: `${prefix}Đã thiết lập nhắc bạn uống nước đều đặn mỗi 2 tiếng một lần! 💧`,
        intent: 'water_reminder',
        emotion: 'reminding',
        action: { type: 'SET_WATER_REMINDER', params: { enabled: true, interval_hours: 2 } },
        source: 'client_rag_fallback',
      };
    }
    if (/bắt đầu|bat dau|kế hoạch tập|tập luyện|tập ngay/i.test(lastAssistantMsg)) {
      return {
        answer: `${prefix}Lên dây cót tinh thần nào! Bấm nút bên dưới để mở ngay trang Kế hoạch tập luyện nhé! 🔥💪`,
        intent: 'workout_navigation',
        emotion: 'encouraging',
        action: { type: 'NAVIGATE_WORKOUT', screen: 'WorkoutPlan' },
        source: 'client_rag_fallback',
      };
    }
  }

  if (isNegative && lastAssistantMsg && /uống nước|uong nuoc/i.test(lastAssistantMsg)) {
    return {
      answer: `${prefix}Đã tắt tính năng nhắc uống nước theo yêu cầu của bạn.`,
      intent: 'water_reminder',
      emotion: 'neutral',
      action: { type: 'SET_WATER_REMINDER', params: { enabled: false, interval_hours: 2 } },
      source: 'client_rag_fallback',
    };
  }

  // 1. Chấn thương / đau mỏi (không khớp nhầm "bắt đầu", "đậu", "dầu")
  if (/(?:^|[\s,.;:!?])(đau|bị đau|bi dau|dau lung|dau goi|dau vai|dau khop|dau co|dau chan|dau tay|dau bung|dau nguc|dau qua|chấn thương|chan thuong|chuột rút|chuot rut|chóng mặt|chong mat|buốt|buot|ngất|ngat|đau khớp|sưng khớp|sung khop)(?=$|[\s,.;:!?])/i.test(q)) {
    return {
      answer: `${prefix}Hãy dừng ngay bài tập đang gây đau nhé! Chườm lạnh 15-20 phút nếu sưng và báo cho Huấn luyện viên (PT) hoặc bác sĩ thể thao để kiểm tra an toàn! 🛡️`,
      intent: 'general_support',
      emotion: 'caring',
      action: null,
      source: 'client_rag_fallback',
    };
  }

  // 2. Nhắc uống nước
  if (/uống nước|uong nuoc|nhắc nước|nhac nuoc|nhắc nhở uống nước|water reminder/i.test(q)) {
    const isOff = /(?:^|[\s,.;:!?])(tắt|tat|hủy|huy|dừng|dung|off|stop)(?=$|[\s,.;:!?])/i.test(q);
    return {
      answer: isOff
        ? `${prefix}Đã tắt tính năng tự động nhắc uống nước cho bạn.`
        : `${prefix}Đã thiết lập nhắc bạn uống nước đều đặn mỗi 2 tiếng một lần! 💧`,
      intent: 'water_reminder',
      emotion: isOff ? 'neutral' : 'reminding',
      action: { type: 'SET_WATER_REMINDER', params: { enabled: !isOff, interval_hours: 2 } },
      source: 'client_rag_fallback',
    };
  }

  // 3. Tra cứu gói tập
  if (/gói tập|goi tap|gói của tôi|goi cua toi|thẻ tập|the tap|thẻ của tôi|the cua toi|hạn thẻ|han the|hạn gói|han goi|hạn sử dụng|han su dung|buổi còn|buoi con|bao nhiêu buổi|bao nhieu buoi|còn mấy buổi|con may buoi|đăng ký gói|dang ky goi/i.test(q)) {
    if (!isAuthenticated) {
      return {
        answer: `${prefix}Bạn chưa đăng nhập nên mình chưa thể kiểm tra thông tin gói tập. Hãy đăng nhập trước nhé!`,
        intent: 'general_support',
        emotion: 'apologetic',
        action: null,
        source: 'client_rag_fallback',
      };
    }
    if (context?.packages && context.packages.length > 0) {
      let msg = `${prefix}Thông tin gói tập hiện tại của bạn:\n\n` +
        `| Gói tập | Số buổi | Hạn sử dụng |\n` +
        `| :--- | :--- | :--- |\n`;
      context.packages.forEach((p: any) => {
        const name = p.name || 'Gói tập';
        const rem =
          p.remaining_sessions !== null && p.remaining_sessions !== undefined
            ? `${p.remaining_sessions} buổi còn lại`
            : p.total_sessions
            ? `${p.total_sessions} buổi đăng ký`
            : 'Đang cập nhật';
        const exp = p.expires_at ? formatVNDate(p.expires_at) : 'Không giới hạn';
        msg += `| ${name} | ${rem} | ${exp} |\n`;
      });
      return { answer: msg.trim(), intent: 'general_support', emotion: 'explaining', action: null, source: 'client_rag_fallback' };
    }
    return {
      answer: `${prefix}Hiện tại tài khoản của bạn chưa đăng ký gói tập nào trên hệ thống VisionFit. Bạn có thể vào mục **Thêm > Gói tập của tôi** để xem hoặc đăng ký gói tập nhé!`,
      intent: 'general_support',
      emotion: 'explaining',
      action: null,
      source: 'client_rag_fallback',
    };
  }

  // 4. Tra cứu lịch tập
  if (/lịch tập|lich tap|xem lịch|xem lich|lịch hôm nay|lich hom nay|lịch ngày mai|lich ngay mai|lịch tuần|lich tuan|lịch trình|lich trinh|có lịch|co lich|buổi tập tiếp theo|buoi tap tiep theo|buổi tập hôm nay|buoi tap hom nay|buổi tập sắp tới|buoi tap sap toi|khi nào tập|khi nao tap|mấy giờ tập|may gio tap|tập mấy giờ|tap may gio|lịch của tôi|lich cua toi/i.test(q)) {
    if (!isAuthenticated) {
      return {
        answer: `${prefix}Bạn chưa đăng nhập nên mình chưa thể xem lịch tập cá nhân của bạn.`,
        intent: 'general_support',
        emotion: 'apologetic',
        action: null,
        source: 'client_rag_fallback',
      };
    }
    if (context?.schedule && context.schedule.length > 0) {
      let msg = `${prefix}Bảng lịch tập sắp tới của bạn trên hệ thống:\n\n` +
        `| Buổi tập | Thời gian | Huấn luyện viên |\n` +
        `| :--- | :--- | :--- |\n`;
      context.schedule.slice(0, 5).forEach((s: any) => {
        const name = s.name || 'Buổi tập';
        const time = formatVNTime(s.starts_at, s.scheduled_date);
        const trainer = s.trainer || 'Tự tập';
        msg += `| ${name} | ${time} | ${trainer} |\n`;
      });
      msg += `\nHãy chuẩn bị nước và đồ tập đầy đủ nhé! 💪`;
      return {
        answer: msg.trim(),
        intent: 'workout_navigation',
        emotion: 'reminding',
        action: { type: 'NAVIGATE_WORKOUT', screen: 'WorkoutPlan' },
        source: 'client_rag_fallback',
      };
    }
    return {
      answer: `${prefix}Hiện tại bạn **chưa đăng ký chương trình tập hoặc chưa có lịch tập nào** trên hệ thống.\nHãy bấm nút bên dưới để vào **Kế hoạch tập** và chọn lộ trình phù hợp cho mình nhé! 📋💪`,
      intent: 'workout_navigation',
      emotion: 'explaining',
      action: { type: 'NAVIGATE_WORKOUT', screen: 'WorkoutPlan' },
      source: 'client_rag_fallback',
    };
  }

  // 5. Chỉ số thể trạng & dinh dưỡng
  if (/chỉ số|chi so|thể trạng|the trang|bmi|bmr|tdee|dinh dưỡng calo|dinh duong calo|calo của tôi|calo cua toi/i.test(q)) {
    if (hasBodyMetrics && context?.nutrition) {
      const n = context.nutrition;
      return {
        answer:
          `${prefix}Bảng chỉ số thể trạng & dinh dưỡng cá nhân của bạn:\n\n` +
          `| Chỉ số | Giá trị | Đánh giá / Đơn vị |\n` +
          `| :--- | :--- | :--- |\n` +
          `| Cân nặng | ${n.can_nang ?? '—'} | kg |\n` +
          `| Chiều cao | ${n.chieu_cao_cm ?? '—'} | cm |\n` +
          `| Chỉ số BMI | ${n.bmi ?? '—'} | ${classifyBmi(n.bmi)} |\n` +
          `| BMR | ${n.bmr ?? '—'} | kcal/ngày |\n` +
          `| Tiêu hao TDEE | ${n.tdee ?? '—'} | kcal/ngày |\n` +
          `| Calo mục tiêu | ${n.kcal_muc_tieu ?? '—'} | kcal/ngày |\n` +
          `| Đạm (Protein) | ${n.protein ?? '—'} | g/ngày |\n` +
          `| Tinh bột (Carb) | ${n.carb ?? '—'} | g/ngày |\n` +
          `| Chất béo (Fat) | ${n.fat ?? '—'} | g/ngày |`,
        intent: 'general_support',
        emotion: 'explaining',
        action: null,
        source: 'client_rag_fallback',
      };
    }
    return {
      answer: `${prefix}Hiện tại bạn **chưa cập nhật chỉ số cơ thể** (chiều cao, cân nặng, mục tiêu) trên hệ thống nên mình chưa có dữ liệu để tính BMI, BMR, TDEE và nhu cầu calo của bạn.\n\nBạn hãy cập nhật hồ sơ cơ thể trước, sau đó hỏi lại mình nhé! 📊`,
      intent: 'general_support',
      emotion: 'explaining',
      action: null,
      source: 'client_rag_fallback',
    };
  }

  // 6. Thực đơn & món ăn
  if (/ăn gì|an gi|thực đơn|thuc don|chế độ ăn|che do an|eat clean|giảm cân|giam can|giảm mỡ|giam mo|tăng cơ|tang co|bữa sáng|bua sang|bữa trưa|bua trua|bữa tối|bua toi/i.test(q)) {
    if (!hasBodyMetrics && !hasGoal && !hasRegisteredProgram) {
      return {
        answer: `${prefix}Hiện tại bạn **chưa cập nhật chỉ số thể trạng** và **chưa đăng ký lộ trình tập luyện** nên hệ thống chưa có dữ liệu để lập thực đơn cá nhân hóa cho bạn.\n\nBạn hãy cập nhật hồ sơ cơ thể trước để mình gợi ý thực đơn đúng calo và phù hợp nhất nhé! 🥗`,
        intent: 'food_detail',
        emotion: 'explaining',
        action: null,
        source: 'client_rag_fallback',
      };
    }

    if (context?.suggestions?.meals && context.suggestions.meals.length > 0) {
      let meals = context.suggestions.meals;
      if (/bữa sáng|bua sang/i.test(q)) meals = meals.filter((m: any) => String(m.meal_type_code || m.meal_type || '').toUpperCase().includes('SANG'));
      else if (/bữa trưa|bua trua/i.test(q)) meals = meals.filter((m: any) => String(m.meal_type_code || m.meal_type || '').toUpperCase().includes('TRUA'));
      else if (/bữa tối|bua toi/i.test(q)) meals = meals.filter((m: any) => String(m.meal_type_code || m.meal_type || '').toUpperCase().includes('TOI'));

      const list = (meals.length > 0 ? meals : context.suggestions.meals).slice(0, 4);
      let res = `${prefix}Gợi ý thực đơn dinh dưỡng phù hợp với hồ sơ của bạn:\n\n` +
        `| Bữa | Tên món ăn | Calo | Đạm |\n` +
        `| :--- | :--- | :--- | :--- |\n`;
      list.forEach((m: any) => {
        const type = formatMealType(m.meal_type_code || m.meal_type);
        const name = m.name || 'Món ăn';
        const cal = m.calories ? `${m.calories} kcal` : '—';
        const pro = m.protein ? `${m.protein}g` : '—';
        res += `| ${type} | ${name} | ${cal} | ${pro} |\n`;
      });
      return { answer: res.trim(), intent: 'food_detail', emotion: 'explaining', action: null, source: 'client_rag_fallback' };
    }
    return {
      answer: `${prefix}Hiện chưa có danh sách thực đơn phù hợp từ máy chủ. Bạn thử kiểm tra kết nối mạng và hỏi lại mình nhé!`,
      intent: 'food_detail',
      emotion: 'apologetic',
      action: null,
      source: 'client_rag_fallback',
    };
  }

  // 7. Khởi động & Tập luyện
  if (/khởi động|khoi dong|warm up/i.test(q)) {
    return {
      answer:
        `${prefix}- **⏱️ 4 bước khởi động chuẩn (5 - 10 phút)**\n\n` +
        `1. Xoay tròn cổ tay, cổ chân, khớp vai và khớp hông (2 phút)\n` +
        `2. Jumping Jacks hoặc chạy bước nhỏ tại chỗ (1 - 2 phút)\n` +
        `3. Giãn cơ động Dynamic Stretching (2 phút)\n` +
        `4. Đẩy 1 hiệp tạ nhẹ ~30% để làm nóng cơ khớp trước khi vào bài chính! 🔥`,
      intent: 'exercise_detail',
      emotion: 'encouraging',
      action: null,
      source: 'client_rag_fallback',
    };
  }

  if (/tập luyện|tap luyen|muốn tập|muon tap|bắt đầu tập|bat dau tap|vào tập|vao tap|kế hoạch tập|ke hoach tap|tập ngay|tap ngay|đi tập|di tap/i.test(q)) {
    return {
      answer: hasRegisteredProgram && context?.active_program?.name
        ? `${prefix}Bạn đang theo lộ trình **${context.active_program.name}**. Bấm nút bên dưới để mở **Kế hoạch tập** và bắt đầu ngay nhé! 💪🔥`
        : `${prefix}Hiện bạn chưa đăng ký chương trình tập cố định. Hãy bấm nút bên dưới để mở **Kế hoạch tập** và chọn lộ trình phù hợp nhé! 📋💪`,
      intent: 'workout_navigation',
      emotion: 'encouraging',
      action: { type: 'NAVIGATE_WORKOUT', screen: 'WorkoutPlan' },
      source: 'client_rag_fallback',
    };
  }

  // 8. Chào hỏi
  if (/(?:^|[\s,.;:!?])(chào|chao|hello|hi|bạn là ai|tên gì)(?=$|[\s,.;:!?])/i.test(q)) {
    return {
      answer: isCat
        ? `Meo meo! Chào bạn nha! Mình là Mèo VIF 🐱 - trợ lý AI đồng hành thể hình VisionFit. Bạn cần hỗ trợ về lịch tập, chỉ số dinh dưỡng hay bài tập nào?`
        : `Chào bạn! Mình là Gấu VIF 🐻 - trợ lý AI đồng hành thể hình VisionFit. Bạn cần hỗ trợ về lịch tập, chỉ số dinh dưỡng hay bài tập nào?`,
      intent: 'general_support',
      emotion: 'welcome',
      action: null,
      source: 'client_rag_fallback',
    };
  }

  return {
    answer: `${prefix}Mình đã nhận câu hỏi: "${question}".\nBạn có thể hỏi mình về lịch tập, gói tập, chỉ số thể trạng (BMI/BMR/TDEE), tra cứu calo món ăn, hướng dẫn bài tập hoặc bật/tắt nhắc uống nước nhé! 🔥`,
    intent: 'general_support',
    emotion: 'neutral',
    action: null,
    source: 'client_rag_fallback',
  };
};

// Backup API Puller: Nếu /assistant/chat lỗi hoặc không phản hồi, tự động nhảy qua các API tri thức
// của VisionFit (/so-tay/thuc-pham, /dinh-duong-the-thao, /bach-khoa-toan-thu, /bai-tap) để kéo dữ liệu thật về trả lời
const queryVisionFitBackupAPIs = async (
  question: string,
  species: MascotSpecies
): Promise<AIResponseResult | null> => {
  const q = question.toLowerCase().trim();
  const prefix = species === 'cat' ? 'Meo meo! 🐱 ' : 'Gấu VIF đây! 🐻 ';

  const extractKeyword = (raw: string) =>
    raw
      .toLowerCase()
      .replace(/calo|bao nhiêu|bao nhieu|cho tôi biết|cho toi biet|có tác dụng gì|co tac dung gi|là gì|la gi|như thế nào|nhu the nao|món|mon|ăn|an|có|co|trong|vậy|vay|bạn|ban|giúp|giup|mình|minh|tôi|toi|\?/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  try {
    // 1. Kéo API Dinh dưỡng thể thao (Whey, Creatine, BCAA, thực phẩm bổ sung) - backend nhận param `q`
    if (/whey|creatine|bcaa|pre-workout|preworkout|mass|vitamin|omega|thực phẩm bổ sung|thuc pham bo sung|dinh dưỡng thể thao/i.test(q)) {
      const kw = extractKeyword(question);
      if (kw.length >= 2) {
        const res = await apiFitlife.get('/dinh-duong-the-thao', { params: { q: kw }, timeout: 5000 });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        if (list.length > 0) {
          const item = list[0];
          return {
            answer: `${prefix}Thông tin từ Sổ tay Dinh dưỡng Thể thao VisionFit:\n\n- **${item.ten_san_pham}**\n${item.mo_ta_ngan || ''}`,
            intent: 'food_detail',
            emotion: 'explaining',
            action: null,
            source: 'visionfit_api_backup_nutrition',
          };
        }
      }
    }

    // 2. Kéo API Thực phẩm & Calo (/so-tay/thuc-pham) - backend nhận param `q`
    if (/calo|bao nhiêu|bao nhieu|ức gà|uc ga|trứng|yến mạch|yen mach|cá hồi|ca hoi|khoai lang|chuối|chuoi|đậu phụ|dau phu|salad/i.test(q)) {
      const keyword = extractKeyword(question);
      if (keyword.length >= 2) {
        const res = await apiFitlife.get('/so-tay/thuc-pham', { params: { q: keyword }, timeout: 5000 });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        if (list.length > 0) {
          const f = list[0];
          return {
            answer:
              `${prefix}Thông tin dinh dưỡng món **${f.ten_mon_an}** (khẩu phần ${f.khoi_luong_gram ?? 100}g):\n\n` +
              `| Calo | Đạm | Tinh bột | Chất béo |\n` +
              `| :--- | :--- | :--- | :--- |\n` +
              `| **${f.calo ?? 0} kcal** | **${f.protein ?? 0}g** | **${f.carb ?? 0}g** | **${f.fat ?? 0}g** |`,
            intent: 'food_detail',
            emotion: 'explaining',
            action: null,
            source: 'visionfit_api_backup_food',
          };
        }
      }
    }

    // 3. Kéo API Bách khoa toàn thư thể hình (/bach-khoa-toan-thu) - backend nhận param `q`
    const encKeyword = extractKeyword(question);
    if (encKeyword.length >= 3) {
      const encRes = await apiFitlife.get('/bach-khoa-toan-thu', { params: { q: encKeyword }, timeout: 5000 });
      const encList = Array.isArray(encRes.data?.data) ? encRes.data.data : [];
      if (encList.length > 0) {
        const art = encList[0];
        return {
          answer: `${prefix}Kiến thức từ Bách khoa Thể hình VisionFit:\n\n- **${art.tieu_de}**\n${art.tom_tat || ''}`,
          intent: 'general_support',
          emotion: 'explaining',
          action: null,
          source: 'visionfit_api_backup_encyclopedia',
        };
      }
    }
  } catch (_) {
    // API backup không phản hồi -> chuyển xuống fallback tiếp theo
  }

  return null;
};

// Hàm chính xuất ra cho MascotChatModal
export const getAIResponse = async (
  question: string,
  species: MascotSpecies = 'bear',
  history: Array<{ sender: string; text: string }> = []
): Promise<AIResponseResult> => {
  // 1. Gọi trực tiếp Backend AI Assistant (Đã tích hợp RAG + Multi-Model Gemini Failover + Backup LLM + DB Backup)
  try {
    const res = await apiFitlife.post(
      '/assistant/chat',
      { message: question, species, history },
      { timeout: 20000 }
    );
    if (res.data?.answer && typeof res.data.answer === 'string') {
      return {
        answer: res.data.answer.trim(),
        intent: res.data.intent || 'general_support',
        emotion: res.data.emotion || 'explaining',
        action: res.data.action || null,
        source: res.data.source || 'gemini_ai',
      };
    }
  } catch (_) {
    // Mạng chậm / backend AI lỗi -> Tự động nhảy sang các tầng Backup API phía sau
  }

  // 2. Lấy ngữ cảnh hội viên từ Backend cache
  const context = await fetchUserContext();

  // 3. Thử truy vấn Google Gemini AI trực tiếp nếu có key trên client
  const aiAnswer = await queryGeminiAI(question, context, species, history);
  if (aiAnswer) {
    return {
      answer: aiAnswer,
      intent: 'general_support',
      emotion: 'explaining',
      action: null,
      source: 'client_gemini_ai',
    };
  }

  // 4. Backup API Puller: Kéo dữ liệu thật từ các API tri thức của VisionFit (/so-tay/thuc-pham, /dinh-duong-the-thao, /bach-khoa-toan-thu)
  const apiBackupResult = await queryVisionFitBackupAPIs(question, species);
  if (apiBackupResult) {
    return apiBackupResult;
  }

  // 5. Fallback cuối cùng dựa trên ngữ cảnh thật đã đồng bộ của hội viên
  return replyFromRealContext(question, context, species, history);
};
