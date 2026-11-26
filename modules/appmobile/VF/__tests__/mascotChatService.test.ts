import { getAIResponse } from '../src/components/mascot/mascotChatService';
import {
  mascotEmitter,
  MASCOT_EVENTS,
  triggerAuthSessionChanged,
  triggerWaterReminderSetting,
} from '../src/components/mascot/mascotEvents';
import apiFitlife from '../src/general/api';

jest.mock('../src/general/api', () => {
  const actualConfig = jest.requireActual('../src/general/apiConfig');
  return {
    __esModule: true,
    default: {
      post: jest.fn(),
    },
    API_CONFIG: actualConfig.resolveApiConfig({
      platformOS: 'android',
      envTarget: 'emulator',
    }),
    formatConnectionErrorMessage: actualConfig.formatConnectionErrorMessage,
  };
});

const mockedPost = apiFitlife.post as jest.Mock;

describe('mascotChatService & mascotEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns grounded answer and keeps only allowlisted navigation/water actions', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        status: true,
        answer: 'Ngày mai bạn có lịch tập lúc 17:30.',
        intent: 'workout_navigation',
        emotion: 'encouraging',
        action: { type: 'NAVIGATE_WORKOUT', screen: 'headerPage' },
        source: 'gemini_fc:gemini-flash-lite-latest',
      },
    });

    const res = await getAIResponse('Mai tôi tập gì?', 'bear', []);
    expect(res.ok).toBe(true);
    expect(res.answer).toContain('17:30');
    expect(res.action).toEqual({ type: 'NAVIGATE_WORKOUT', screen: 'headerPage' });

    // Action ngoài allowlist bị chặn (sanitized thành null)
    mockedPost.mockResolvedValueOnce({
      data: {
        status: true,
        answer: 'Test',
        action: { type: 'DELETE_ACCOUNT' },
      },
    });
    const resBlocked = await getAIResponse('test', 'bear', []);
    expect(resBlocked.ok).toBe(true);
    expect(resBlocked.action).toBeNull();
  });

  test('returns structured retryable service error on HTTP 503 without scripted fallback', async () => {
    mockedPost.mockRejectedValueOnce({
      response: {
        status: 503,
        data: {
          status: false,
          answer: 'Dịch vụ trợ lý AI đang tạm gián đoạn.',
          error_code: 'AI_PROVIDER_UNAVAILABLE',
          retryable: true,
        },
      },
    });

    const res = await getAIResponse('Gói còn mấy buổi?', 'bear', []);
    expect(res.ok).toBe(false);
    expect(res.retryable).toBe(true);
    expect(res.errorCode).toBe('AI_PROVIDER_UNAVAILABLE');
    expect(res.source).toBe('service_error');
    expect(res.action).toBeNull();
  });

  test('terminates cleanly with REQUEST_TIMEOUT on ECONNABORTED', async () => {
    mockedPost.mockRejectedValueOnce({ code: 'ECONNABORTED', message: 'timeout' });

    const res = await getAIResponse('Lịch hôm nay?', 'cat', []);
    expect(res.ok).toBe(false);
    expect(res.errorCode).toBe('REQUEST_TIMEOUT');
    expect(res.retryable).toBe(true);
  });

  test('returns canceled=true when AbortSignal aborts (logout/account switch)', async () => {
    const controller = new AbortController();
    controller.abort();

    const res = await getAIResponse('Lịch hôm nay?', 'bear', [], controller.signal);
    expect(res.ok).toBe(false);
    expect(res.canceled).toBe(true);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  test('emits AUTH_SESSION_CHANGED and SET_WATER_REMINDER events properly', () => {
    const authSpy = jest.fn();
    const waterSpy = jest.fn();
    mascotEmitter.on(MASCOT_EVENTS.AUTH_SESSION_CHANGED, authSpy);
    mascotEmitter.on(MASCOT_EVENTS.SET_WATER_REMINDER, waterSpy);

    triggerAuthSessionChanged();
    triggerWaterReminderSetting(true, 3);

    expect(authSpy).toHaveBeenCalledTimes(1);
    expect(waterSpy).toHaveBeenCalledWith({ enabled: true, intervalHours: 3 });

    mascotEmitter.off(MASCOT_EVENTS.AUTH_SESSION_CHANGED, authSpy);
    mascotEmitter.off(MASCOT_EVENTS.SET_WATER_REMINDER, waterSpy);
  });
});

