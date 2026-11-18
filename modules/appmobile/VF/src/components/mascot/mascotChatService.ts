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

  // Chuẩn hóa ngữ cảnh với ngày giờ Việt Nam
  const formattedContext = context ? {
    ...context,
    schedule: (context.schedule || []).map((s: any) => ({
      name: s.name || 'Buổi tập',
      time: formatVNTime(s.starts_at, s.scheduled_date),
      trainer: s.trainer || 'Chưa có PT',
    })),
    packages: (context.packages || []).map((p: any) => ({
      name: p.name || 'Gói tập',
      remaining_sessions: p.remaining_sessions,
      expires_at: formatVNDate(p.expires_at),
    })),
  } : null;

  const systemPrompt = `${mascotRole}
Bạn là trợ lý AI thông minh chuyên về Thể hình, Sức khỏe và Dinh dưỡng của hệ sinh thái VisionFit.
QUY TẮC BẮT BUỘC:
1. Dùng tiếng Việt chuẩn, ấm áp, ngắn gọn, súc tích (dưới 150 từ), dễ đọc trên màn hình điện thoại di động.
2. QUY TẮC BẢNG DỮ LIỆU (TỐI ƯU CHO ĐIỆN THOẠI):
Khi trả lời về CHỈ SỐ DINH DƯỠNG (BMI/BMR/TDEE/Calo/Macros), THỰC ĐƠN MÓN ĂN, BÀI TẬP, GÓI TẬP hoặc LỊCH TẬP, bạn BẮT BUỘC phải trình bày kết quả dưới dạng BẢNG Markdown (| Cột 1 | Cột 2 | ...) rõ ràng, có tiêu đề cột và hàng phân cách.
Để bảng dễ xem và thân thiện trên điện thoại:
- Giới hạn bảng tối đa từ 3 đến 4 cột chính (ví dụ: | STT | Tên bài tập | Sets x Reps | Ghi chú |).
- Nội dung từng ô cần súc tích, ngắn gọn.
3. QUY TẮC ĐỊNH DẠNG NGÀY GIỜ VIỆT NAM (BẮT BUỘC):
Khi hiển thị ngày giờ trong bảng Markdown hoặc câu trả lời, bạn BẮT BUỘC phải định dạng theo chuẩn Việt Nam: "HH:mm dd/mm/yyyy" (ví dụ: "06:00 11/11/2026") hoặc "dd/mm/yyyy" (ví dụ: "11/11/2026"). TUYỆT ĐỐI KHÔNG để chuỗi ISO như "2026-11-11T06:00:00+07:00" hay "+00:00".
4. QUY TẮC TIÊU ĐỀ & ĐỀ MỤC (BẮT BUỘC):
TUYỆT ĐỐI KHÔNG dùng các dấu thăng markdown thô như '###', '####', '#####', '##', '#'.
BẮT BUỘC thay các dấu đó bằng dấu gạch ngang '-' kèm in đậm:
- Tiêu đề chính / buổi tập: Dùng dấu gạch ngang: - **🏋️ LỊCH TẬP HÔM NAY: NGỰC & XÔ**
- Các phần bài tập (Khởi động, Bài tập chính, Giãn cơ): - **⏱️ 1. Khởi động (5 - 10 phút)**
- Nhóm cơ / phân mục chi tiết: - **NHÓM CƠ NGỰC (CHEST):**
- Không dùng đường kẻ '---' thô; dùng khoảng cách dòng thoáng.
5. DỮ LIỆU THỰC TẾ CỦA HỘI VIÊN ĐANG TRUY VẤN:
${formattedContext ? JSON.stringify(formattedContext) : 'Chưa đăng nhập / dữ liệu mẫu chung'}
6. Nếu hội viên báo đau mỏi hoặc chấn thương: Khuyên dừng ngay bài tập, chườm lạnh nếu sưng và hỏi ý kiến Huấn luyện viên (PT) hoặc bác sĩ.
7. Không tự chế số buổi gói tập hay ngày hết hạn nếu không có trong dữ liệu.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gemini-3.5-flash-lite',
          max_completion_tokens: 1200,
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

  // 2. Tra cứu gói tập & hạn sử dụng -> Dạng bảng Markdown tối ưu cho điện thoại
  if (/gói|hạn|buổi còn|bao nhiêu buổi|thẻ/.test(q)) {
    if (context?.packages && context.packages.length > 0) {
      let msg = `${prefix}Thông tin gói tập hiện tại của bạn:\n\n` +
        `| Gói tập | Buổi còn lại | Hạn sử dụng |\n` +
        `| :--- | :--- | :--- |\n`;
      context.packages.forEach((p: any) => {
        const name = p.name || 'Gói tập';
        const rem = p.remaining_sessions !== null && p.remaining_sessions !== undefined ? `${p.remaining_sessions} buổi` : 'Đang cập nhật';
        const exp = p.expires_at ? formatVNDate(p.expires_at) : 'Không giới hạn';
        msg += `| ${name} | ${rem} | ${exp} |\n`;
      });
      return msg.trim();
    }
    return `${prefix}Bạn có thể xem số buổi tập còn lại và hạn thẻ tập trong mục "Hồ sơ cá nhân" > "Gói tập của tôi" nhé!`;
  }

  // 3. Tra cứu lịch tập -> Dạng bảng Markdown tối ưu cho điện thoại
  if (/lịch|hôm nay|tiếp theo|khi nào tập|ngày mai/.test(q)) {
    if (context?.schedule && context.schedule.length > 0) {
      let msg = `${prefix}Bảng lịch tập sắp tới của bạn trên hệ thống:\n\n` +
        `| Buổi tập | Thời gian | Huấn luyện viên (PT) |\n` +
        `| :--- | :--- | :--- |\n`;
      context.schedule.slice(0, 5).forEach((s: any) => {
        const name = s.name || 'Buổi tập';
        const time = formatVNTime(s.starts_at, s.scheduled_date);
        const trainer = s.trainer || 'Chưa có PT';
        msg += `| ${name} | ${time} | ${trainer} |\n`;
      });
      msg += `\nHãy chuẩn bị nước và đồ tập đầy đủ nhé! 💪`;
      return msg;
    }
    return `${prefix}Lịch tập tuần này của bạn gồm 3-4 buổi cách ngày. Bạn hãy mở tab "Kế hoạch tập" trên ứng dụng để xem chi tiết bài tập hôm nay nhé!`;
  }

  // 4. Tra cứu chỉ số thể trạng & dinh dưỡng (BMI, BMR, TDEE, Calo, Macros) -> Dạng bảng Markdown
  if (/dinh dưỡng|chỉ số|bmi|bmr|tdee|calo|macro|protein|thể trạng|cân nặng/.test(q)) {
    if (context?.nutrition) {
      const n = context.nutrition;
      return `${prefix}Bảng chỉ số thể trạng & dinh dưỡng cá nhân:\n\n` +
        `| Chỉ số thể trạng | Giá trị | Đơn vị / Đánh giá |\n` +
        `| :--- | :--- | :--- |\n` +
        `| Cân nặng | ${n.can_nang ?? '—'} | kg |\n` +
        `| Chiều cao | ${n.chieu_cao_cm ?? '—'} | cm |\n` +
        `| Chỉ số BMI | ${n.bmi ?? '—'} | Thể trạng cân đối |\n` +
        `| Tiêu hao TDEE | ${n.tdee ?? '—'} | kcal/ngày |\n` +
        `| Năng lượng mục tiêu | ${n.kcal_muc_tieu ?? '—'} | kcal/ngày |\n` +
        `| Đạm (Protein) | ${n.protein ?? '—'} | g/ngày |\n` +
        `| Tinh bột (Carb) | ${n.carb ?? '—'} | g/ngày |\n` +
        `| Chất béo (Fat) | ${n.fat ?? '—'} | g/ngày |`;
    }
    return `${prefix}Chỉ số dinh dưỡng chuẩn: Để duy trì vóc dáng, hãy nạp đủ 1.6 - 2.0g Protein/kg cân nặng, uống đủ 2-2.5 lít nước mỗi ngày và ăn nhiều rau xanh nhé!`;
  }

  // 5. Gợi ý thực đơn & món ăn -> Dạng bảng Markdown
  if (/ăn gì|thực đơn|món ăn|bữa sáng|bữa trưa|bữa tối|eat clean|giảm cân|giảm mỡ|tăng cơ/.test(q)) {
    if (context?.suggestions?.meals && context.suggestions.meals.length > 0) {
      let meals = context.suggestions.meals;
      if (/sáng/.test(q)) meals = meals.filter((m: any) => (m.meal_type || '').includes('sang') || (m.name || '').includes('sáng'));
      else if (/trưa/.test(q)) meals = meals.filter((m: any) => (m.meal_type || '').includes('trua') || (m.name || '').includes('trưa'));
      else if (/tối/.test(q)) meals = meals.filter((m: any) => (m.meal_type || '').includes('toi') || (m.name || '').includes('tối'));

      const list = (meals.length > 0 ? meals : context.suggestions.meals).slice(0, 4);
      let res = `${prefix}Gợi ý thực đơn dinh dưỡng cho bạn:\n\n` +
        `| Bữa ăn | Tên món ăn | Năng lượng | Đạm (Protein) |\n` +
        `| :--- | :--- | :--- | :--- |\n`;
      list.forEach((m: any) => {
        const type = m.meal_type || 'Món chính';
        const name = m.name || 'Món ăn';
        const cal = m.calories ? `${m.calories} kcal` : '—';
        const pro = m.protein ? `${m.protein}g` : '—';
        res += `| ${type} | ${name} | ${cal} | ${pro} |\n`;
      });
      return res.trim();
    }
    return `${prefix}Gợi ý thực đơn Eat Clean chuẩn thể hình:\n• Sáng: Yến mạch + sữa chua Hy Lạp + chuối chín\n• Trưa: 150g Ức gà áp chảo + cơm gạo lứt + bông cải xanh\n• Phụ xế: 1 muỗng Whey hoặc 1 quả táo\n• Tối: Cá hồi hoặc thịt nạc bò sốt tiêu + salad dầu oliu! 🥗`;
  }

  // 6. Gợi ý bài tập & Khởi động
  if (/khởi động|bài tập|động tác|tập gì|ngực|lưng|chân|tay|bụng/.test(q)) {
    if (/khởi động/.test(q)) {
      return `${prefix}- **⏱️ 4 bước khởi động chuẩn (5 - 10 phút)**\n\n` +
        `1. Xoay tròn cổ tay, cổ chân, khớp vai và khớp hông (2 phút)\n` +
        `2. Jumping Jacks hoặc chạy gót chạm mông nhẹ (1 phút)\n` +
        `3. Giãn cơ động Dynamic Stretching (1 phút)\n` +
        `4. Đẩy 1 set tạ nhẹ 30% để làm nóng cơ khớp trước khi vào bài chính! 🔥`;
    }
    const exercises = context?.suggestions?.exercises || [];
    if (exercises.length > 0) {
      let res = `${prefix}Bảng bài tập gợi ý phù hợp cho bạn:\n\n` +
        `| STT | Tên bài tập | Nhóm cơ | Thiết bị |\n` +
        `| :--- | :--- | :--- | :--- |\n`;
      exercises.slice(0, 4).forEach((e: any, idx: number) => {
        const name = e.name || 'Bài tập';
        const muscle = e.muscle_group || 'Toàn thân';
        const equip = e.equipment || 'Tự do';
        res += `| ${idx + 1} | ${name} | ${muscle} | ${equip} |\n`;
      });
      return res.trim();
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
  // 1. Gọi trực tiếp Backend AI Assistant (đã huấn luyện toàn bộ dữ liệu dinh dưỡng, món ăn, bài tập)
  try {
    const res = await apiFitlife.post(
      '/assistant/chat',
      { message: question, species },
      { timeout: 8000 }
    );
    if (res.data?.answer && typeof res.data.answer === 'string') {
      return res.data.answer.trim();
    }
  } catch (err) {
    // Mạng chậm hoặc offline -> Tiếp tục fallback phía client
  }

  // 2. Lấy ngữ cảnh hội viên từ Backend cache
  const context = await fetchUserContext();

  // 3. Thử truy vấn Google Gemini AI trực tiếp nếu có key
  const aiAnswer = await queryGeminiAI(question, context, species);
  if (aiAnswer) {
    return aiAnswer;
  }

  // 4. Fallback sang bộ quy tắc RAG khớp nối dữ liệu thực tế VisionFit
  return replyFromRealContext(question, context, species);
};
