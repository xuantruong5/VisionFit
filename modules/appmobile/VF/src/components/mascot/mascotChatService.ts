import apiFitlife from '../../general/api';
import { MascotSpecies } from './types';

// Bộ nhớ đệm ngữ cảnh dữ liệu người dùng (Cache 3 phút để tiết kiệm request và tốc độ phản hồi tức thì)
let cachedContext: any = null;
let lastContextFetch = 0;
const CONTEXT_TTL = 3 * 60 * 1000;

// Lấy dữ liệu hồ sơ, dinh dưỡng, gói tập và lịch tập từ Backend VisionFit
const fetchUserContext = async (): Promise<any> => {
  const now = Date.now();
  if (cachedContext && now - lastContextFetch < CONTEXT_TTL) {
    return cachedContext;
  }
  try {
    const res = await apiFitlife.get('/assistant/context', { timeout: 4000 });
    if (res.data?.data) {
      cachedContext = res.data.data;
      lastContextFetch = now;
      return cachedContext;
    }
  } catch (e) {
    // Nếu token chưa có quyền assistant:read hoặc chưa đăng nhập, thử lấy từ /client/list-programs
    try {
      const progRes = await apiFitlife.get('/client/list-programs', { timeout: 3000 });
      if (progRes.data?.data) {
        cachedContext = {
          profile: { goal: 'Rèn luyện sức khỏe' },
          schedule: progRes.data.data.map((p: any) => ({
            name: p.ten_chuong_trinh || 'Chương trình thể lực',
            starts_at: 'Theo lịch cá nhân',
            trainer: 'HLV VisionFit',
          })),
        };
        lastContextFetch = now;
        return cachedContext;
      }
    } catch (_) {}
  }
  return cachedContext;
};

// Gọi Gemini AI trực tiếp với ngữ cảnh thực tế của người dùng
const queryGeminiAI = async (
  question: string,
  context: any,
  species: MascotSpecies
): Promise<string | null> => {
  const apiKey = (globalThis as any)?.__VISIONFIT_GEMINI_KEY__ || '';
  if (!apiKey) {
    return null;
  }
  const mascotRole =
    species === 'cat'
      ? 'Bạn là Mèo VIF 🐱 - trợ lý linh vật tinh nghịch, đáng yêu, nói chuyện có thể chêm "Meo meo!" nhẹ nhàng, thân thiện.'
      : 'Bạn là Gấu VIF 🐻 - trợ lý linh vật khỏe khoắn, tràn đầy năng lượng, vững chãi, luôn khích lệ tinh thần người tập.';

  const systemPrompt = `${mascotRole}
Bạn là trợ lý AI thông minh chuyên về Thể hình, Sức khỏe và Dinh dưỡng của hệ sinh thái VisionFit.
Trả lời bằng tiếng Việt ngắn gọn, súc tích, ấm áp (dưới 120 từ), định dạng danh sách gạch đầu dòng rõ ràng, dễ đọc trên màn hình điện thoại di động.
DỮ LIỆU THỰC TẾ CỦA HỘI VIÊN ĐANG TRUY VẤN:
${context ? JSON.stringify(context) : 'Chưa đăng nhập / dữ liệu mẫu chung'}
Quy tắc:
1. Nếu hội viên hỏi chỉ số (BMI/BMR/TDEE/Calo/Macros): Hãy dùng số liệu thực tế trong dữ liệu nếu có.
2. Nếu hội viên báo đau mỏi hoặc chấn thương: Khuyên dừng ngay bài tập, chườm lạnh nếu sưng và hỏi ý kiến Huấn luyện viên (PT) hoặc bác sĩ.
3. Không tự chế số buổi gói tập hay ngày hết hạn nếu không có trong dữ liệu.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // Giới hạn 4.5s để không làm user đợi lâu

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gemini-3.8-flash',
          max_completion_tokens: 450,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
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
  } catch (err) {
    // Gemini offline hoặc timeout -> Fallback mượt mà sang bộ não dữ liệu thực tế
  }
  return null;
};

// Trả lời thông minh dựa trên Dữ Liệu Thực Tế từ Database VisionFit (Deterministic RAG Fallback)
const replyFromRealContext = (
  question: string,
  context: any,
  species: MascotSpecies
): string => {
  const q = question.toLowerCase().trim();
  const isCat = species === 'cat';
  const prefix = isCat ? 'Meo meo! 🐱 ' : 'Gấu VIF đây! 🐻 ';

  // 1. Kiểm tra chấn thương / đau mỏi
  if (/đau|chấn thương|chuột rút|chóng mặt|buốt|ngất|khớp/.test(q)) {
    return `${prefix}Hãy dừng ngay bài tập đang gây đau nhé! Chườm lạnh trong 15-20 phút nếu bị sưng và tuyệt đối đừng cố gắng tập tiếp. Hãy báo ngay cho Huấn luyện viên (PT) hoặc bác sĩ thể thao để được kiểm tra kỹ càng! 🛡️`;
  }

  // 2. Tra cứu gói tập & hạn sử dụng
  if (/gói|hạn|buổi còn|bao nhiêu buổi|thẻ/.test(q)) {
    if (context?.packages && context.packages.length > 0) {
      let msg = `${prefix}Thông tin gói tập hiện tại của bạn:\n`;
      context.packages.forEach((p: any) => {
        const rem = p.remaining_sessions !== null ? `${p.remaining_sessions} buổi` : 'Đang cập nhật';
        const exp = p.expires_at || 'Không giới hạn';
        msg += `• Gói: ${p.name || 'Gói tập'}\n• Còn lại: ${rem}\n• Hạn dùng: ${exp}\n`;
      });
      return msg.trim();
    }
    return `${prefix}Bạn có thể xem số buổi tập còn lại và hạn thẻ tập trong mục "Hồ sơ cá nhân" > "Gói tập của tôi" nhé!`;
  }

  // 3. Tra cứu lịch tập
  if (/lịch|hôm nay|tiếp theo|khi nào tập|ngày mai/.test(q)) {
    if (context?.schedule && context.schedule.length > 0) {
      let msg = `${prefix}Lịch tập sắp tới của bạn được ghi nhận trên hệ thống:\n`;
      context.schedule.slice(0, 3).forEach((s: any) => {
        const time = s.starts_at || s.scheduled_date || 'Theo lịch cá nhân';
        const trainer = s.trainer ? ` (PT: ${s.trainer})` : '';
        msg += `• ${s.name || 'Buổi tập'}: ${time}${trainer}\n`;
      });
      msg += `\nHãy chuẩn bị nước và đồ tập đầy đủ nhé! 💪`;
      return msg;
    }
    return `${prefix}Lịch tập tuần này của bạn gồm 3-4 buổi cách ngày. Bạn hãy mở tab "Kế hoạch tập" trên ứng dụng để xem chi tiết bài tập hôm nay nhé!`;
  }

  // 4. Tra cứu chỉ số thể trạng & dinh dưỡng (BMI, BMR, TDEE, Calo, Macros)
  if (/dinh dưỡng|chỉ số|bmi|bmr|tdee|calo|macro|protein|thể trạng|cân nặng/.test(q)) {
    if (context?.nutrition) {
      const n = context.nutrition;
      return `${prefix}Bảng chỉ số thể trạng & dinh dưỡng cá nhân của bạn:\n` +
        `• Cân nặng: ${n.can_nang ?? '—'} kg · Chiều cao: ${n.chieu_cao_cm ?? '—'} cm\n` +
        `• Chỉ số BMI: ${n.bmi ?? '—'}\n` +
        `• Năng lượng tiêu thụ TDEE: ${n.tdee ?? '—'} kcal/ngày\n` +
        `• Năng lượng mục tiêu: ${n.kcal_muc_tieu ?? '—'} kcal/ngày\n` +
        `• Nhu cầu Đạm (Protein): ${n.protein ?? '—'} g/ngày\n` +
        `• Nhu cầu Tinh bột (Carb): ${n.carb ?? '—'} g/ngày\n` +
        `• Nhu cầu Chất béo (Fat): ${n.fat ?? '—'} g/ngày`;
    }
    return `${prefix}Chỉ số dinh dưỡng chuẩn: Để duy trì vóc dáng, hãy nạp đủ 1.6 - 2.0g Protein/kg cân nặng, uống đủ 2-2.5 lít nước mỗi ngày và ăn nhiều rau xanh nhé!`;
  }

  // 5. Gợi ý thực đơn & món ăn
  if (/ăn gì|thực đơn|món ăn|bữa sáng|bữa trưa|bữa tối|eat clean|giảm cân|giảm mỡ|tăng cơ/.test(q)) {
    if (context?.suggestions?.meals && context.suggestions.meals.length > 0) {
      let meals = context.suggestions.meals;
      if (/sáng/.test(q)) meals = meals.filter((m: any) => (m.meal_type || '').includes('sang') || (m.name || '').includes('sáng'));
      else if (/trưa/.test(q)) meals = meals.filter((m: any) => (m.meal_type || '').includes('trua') || (m.name || '').includes('trưa'));
      else if (/tối/.test(q)) meals = meals.filter((m: any) => (m.meal_type || '').includes('toi') || (m.name || '').includes('tối'));

      const list = (meals.length > 0 ? meals : context.suggestions.meals).slice(0, 3);
      let res = `${prefix}Gợi ý món ăn phù hợp với mục tiêu của bạn:\n`;
      list.forEach((m: any) => {
        res += `• ${m.name}: ${m.calories || '—'} kcal, ${m.protein || '—'}g đạm (${m.diet_type || 'Healthy'})\n`;
      });
      return res.trim();
    }
    return `${prefix}Gợi ý thực đơn Eat Clean chuẩn thể hình:\n• Sáng: Yến mạch + sữa chua Hy Lạp + chuối chín\n• Trưa: 150g Ức gà áp chảo + cơm gạo lứt + bông cải xanh\n• Phụ xế: 1 muỗng Whey hoặc 1 quả táo\n• Tối: Cá hồi hoặc thịt nạc bò sốt tiêu + salad dầu oliu! 🥗`;
  }

  // 6. Gợi ý bài tập & Khởi động
  if (/khởi động|bài tập|động tác|tập gì|ngực|lưng|chân|tay|bụng/.test(q)) {
    if (/khởi động/.test(q)) {
      return `${prefix}4 bước khởi động chuẩn 5 phút:\n1. Xoay tròn cổ tay, cổ chân, khớp vai và khớp hông (2 phút)\n2. Jumping Jacks hoặc chạy gót chạm mông nhẹ (1 phút)\n3. Giãn cơ động Dynamic Stretching (1 phút)\n4. Đẩy 1 set tạ nhẹ 30% để làm nóng cơ khớp trước khi vào bài chính! 🔥`;
    }
    if (/ngực/.test(q)) {
      return `${prefix}Gợi ý bài tập ngực hiệu quả: Bench Press (Đẩy tạ đòn), Incline Dumbbell Press (Đẩy tạ dốc lên) và Push-ups (Hít đất). Mỗi bài 3-4 hiệp từ 8-12 reps nhé!`;
    }
    if (/chân|đùi|mông/.test(q)) {
      return `${prefix}Gợi ý bài tập chân: Barbell Squat (Gánh tạ), Romanian Deadlift, Bulgarian Split Squat và Leg Press. Tập đều chân giúp đốt mỡ cực đỉnh!`;
    }
    if (/bụng/.test(q)) {
      return `${prefix}Gợi ý bài tập bụng săn chắc: Plank (giữ 45-60s), Gập bụng Crunch (15-20 reps) và Leg Raise nhấc chân. Nhớ gồng chặt cơ bụng khi thở ra nhé!`;
    }
    return `${prefix}Hôm nay bạn hãy mở tab "Kế hoạch tập" để tập theo đúng giáo án được thiết kế cho bạn nhé. Chúc bạn có buổi tập sung sức! 💪`;
  }

  // 7. Chào hỏi
  if (/chào|hello|hi|bạn là ai|tên gì/.test(q)) {
    if (isCat) {
      return `Meo meo! Chào bạn nha! Mình là Mèo VIF tinh nghịch 🐱. Mình đã kết nối với tài khoản VisionFit của bạn để sẵn sàng giải đáp về chỉ số calo, thực đơn và bài tập hôm nay!`;
    }
    return `Chào bạn! Mình là Gấu VIF khỏe khoắn 🐻. Mình đã kết nối trực tiếp với dữ liệu thể hình của bạn. Hãy nói cho mình biết bạn đang cần hỗ trợ phần nào nhé!`;
  }

  // Mặc định
  return `${prefix}Mình đã nhận câu hỏi: "${question}".\nBạn có thể hỏi mình về chỉ số dinh dưỡng (BMI/BMR/TDEE), gói tập còn lại, thực đơn ăn uống hoặc gợi ý bài tập hôm nay nhé! Chúc bạn luôn giữ vững phong độ tập luyện! 🔥`;
};

// Hàm chính xuất ra cho MascotChatModal
export const getAIResponse = async (
  question: string,
  species: MascotSpecies = 'bear'
): Promise<string> => {
  // 1. Lấy ngữ cảnh hội viên từ Backend
  const context = await fetchUserContext();

  // 2. Thử truy vấn Google Gemini AI thông minh
  const aiAnswer = await queryGeminiAI(question, context, species);
  if (aiAnswer) {
    return aiAnswer;
  }

  // 3. Fallback sang bộ quy tắc RAG khớp nối dữ liệu thực tế VisionFit
  return replyFromRealContext(question, context, species);
};
