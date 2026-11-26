import apiFitlife from '../../general/api';
import { MascotSpecies, ChatAction } from './types';

const ALLOWED_ACTION_TYPES = new Set([
  'NAVIGATE_WORKOUT',
  'NAVIGATE_REGISTER_PROGRAM',
  'NAVIGATE_BODY_METRICS',
  'NAVIGATE_REGISTER_PACKAGE',
  'SET_WATER_REMINDER',
]);

export interface AIResponseResult {
  ok: boolean;
  answer: string;
  intent?: string;
  emotion?: string;
  action?: ChatAction | null;
  source?: string;
  errorCode?: string;
  retryable?: boolean;
}

const sanitizeAction = (action: any): ChatAction | null => {
  if (!action || typeof action !== 'object' || typeof action.type !== 'string') {
    return null;
  }
  const type = action.type.trim().toUpperCase();
  if (!ALLOWED_ACTION_TYPES.has(type)) {
    return null;
  }
  return {
    ...action,
    type,
  };
};

// Giữ export tương thích khi MascotChatModal reset phiên đăng nhập / đổi tài khoản
export const clearAssistantCache = () => {
  // Không lưu cache dữ liệu người dùng hay API key ở phía client nữa;
  // mọi truy vấn đều đi trực tiếp qua Backend Function Calling theo Bearer token phiên hiện tại.
};

/**
 * Gọi trực tiếp Backend VisionFit (/assistant/chat) sử dụng Gemini Function Calling.
 * Không gọi Gemini trực tiếp từ Mobile, không chứa API key trên client,
 * và không âm thầm rơi về kịch bản regex/từ khóa khi dịch vụ lỗi.
 */
export const getAIResponse = async (
  question: string,
  species: MascotSpecies = 'bear',
  history: Array<{ sender: string; text: string }> = []
): Promise<AIResponseResult> => {
  try {
    const res = await apiFitlife.post(
      '/assistant/chat',
      {
        message: question,
        species,
        history: history.slice(-8),
      },
      { timeout: 30000 }
    );

    const data = res.data || {};
    if (data.status === true && typeof data.answer === 'string' && data.answer.trim()) {
      return {
        ok: true,
        answer: data.answer.trim(),
        intent: data.intent || 'general_support',
        emotion: data.emotion || 'explaining',
        action: sanitizeAction(data.action),
        source: data.source || 'gemini_fc',
      };
    }

    return {
      ok: false,
      answer:
        typeof data.answer === 'string' && data.answer.trim()
          ? data.answer.trim()
          : 'Dịch vụ trợ lý AI hiện chưa phản hồi hợp lệ. Bạn vui lòng bấm thử lại nhé!',
      intent: 'service_error',
      emotion: 'apologetic',
      action: null,
      source: data.source || 'service_error',
      errorCode: data.error_code || 'AI_INVALID_RESPONSE',
      retryable: data.retryable !== false,
    };
  } catch (err: any) {
    const status = err?.response?.status;
    const serverData = err?.response?.data;

    if (status === 422 && typeof serverData?.message === 'string') {
      return {
        ok: false,
        answer: serverData.message,
        intent: 'service_error',
        emotion: 'apologetic',
        action: null,
        source: 'service_error',
        errorCode: serverData.error_code || 'VALIDATION_ERROR',
        retryable: false,
      };
    }

    if (serverData && typeof serverData.answer === 'string' && serverData.answer.trim()) {
      return {
        ok: false,
        answer: serverData.answer.trim(),
        intent: 'service_error',
        emotion: 'apologetic',
        action: null,
        source: serverData.source || 'service_error',
        errorCode: serverData.error_code || 'AI_PROVIDER_UNAVAILABLE',
        retryable: serverData.retryable !== false,
      };
    }

    return {
      ok: false,
      answer: 'Không thể kết nối tới máy chủ trợ lý AI lúc này. Bạn kiểm tra mạng rồi bấm thử lại nhé!',
      intent: 'service_error',
      emotion: 'apologetic',
      action: null,
      source: 'service_error',
      errorCode: 'NETWORK_ERROR',
      retryable: true,
    };
  }
};
