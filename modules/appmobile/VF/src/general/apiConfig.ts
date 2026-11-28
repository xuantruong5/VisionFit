import { NativeModules, Platform } from 'react-native';

export type AndroidTargetMode = 'emulator' | 'device';

export interface ApiConfigInput {
  platform?: string;
  envBaseUrl?: string;
  envProtocol?: string;
  envHost?: string;
  envPort?: string;
  androidTarget?: string;
  metroScriptUrl?: string;
}

export interface ResolvedApiConfig {
  baseUrl: string;
  apiUrl: string;
  host: string;
  port: string;
  source: 'env_base_url' | 'env_host' | 'metro_lan_host' | 'android_emulator_default' | 'ios_default';
  configError: string | null;
}

const DEFAULT_PROTOCOL = 'http';
const DEFAULT_PORT = '8000';
const ANDROID_EMULATOR_HOST = '10.0.2.2';
const LOCAL_DEV_HOST = 'localhost';

function trimTrailingSlash(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function sanitizePort(rawPort?: string): string {
  const cleaned = (rawPort || '').trim();
  if (/^\d{1,5}$/.test(cleaned)) {
    const num = Number(cleaned);
    if (num >= 1 && num <= 65535) {
      return String(num);
    }
  }
  return DEFAULT_PORT;
}

function extractLanHostFromScriptUrl(scriptUrl?: string): string | null {
  if (!scriptUrl || typeof scriptUrl !== 'string') {
    return null;
  }
  const match = scriptUrl.trim().match(/^https?:\/\/([^/:?#]+)(?::\d+)?/i);
  if (!match || !match[1]) {
    return null;
  }
  const host = match[1].trim();
  if (
    !host ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === ANDROID_EMULATOR_HOST
  ) {
    return null;
  }
  return host;
}

function readEnvValue(key: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const val = env?.[key];
  return typeof val === 'string' && val.trim() !== '' ? val.trim() : undefined;
}

/**
 * Resolve backend BASE_URL / API_URL cleanly by environment and runtime target:
 * - Explicit VISIONFIT_API_BASE_URL takes top priority (release/staging/custom network).
 * - Explicit VISIONFIT_API_HOST + VISIONFIT_API_PORT (default 8000, never hardcoding QA port).
 * - Android physical device (VISIONFIT_ANDROID_TARGET=device) requires LAN host (env or Metro LAN IP).
 * - Standard Android emulator defaults to host 10.0.2.2:<port>.
 * - iOS / other platforms default to localhost:<port>.
 */
export function resolveApiConfig(input: ApiConfigInput = {}): ResolvedApiConfig {
  const platform = input.platform ?? Platform.OS;
  const protocol = (input.envProtocol || readEnvValue('VISIONFIT_API_PROTOCOL') || DEFAULT_PROTOCOL)
    .toLowerCase()
    .replace(/:\/\/$/, '');
  const port = sanitizePort(input.envPort ?? readEnvValue('VISIONFIT_API_PORT'));
  const explicitBaseUrl = input.envBaseUrl ?? readEnvValue('VISIONFIT_API_BASE_URL');

  if (explicitBaseUrl && /^https?:\/\/.+/i.test(explicitBaseUrl.trim())) {
    const cleanBase = trimTrailingSlash(explicitBaseUrl);
    const hostMatch = cleanBase.match(/^https?:\/\/([^/:?#]+)(?::(\d+))?/i);
    return {
      baseUrl: cleanBase,
      apiUrl: `${cleanBase}/api`,
      host: hostMatch?.[1] || '',
      port: hostMatch?.[2] || (cleanBase.startsWith('https://') ? '443' : '80'),
      source: 'env_base_url',
      configError: null,
    };
  }

  const explicitHost = (input.envHost ?? readEnvValue('VISIONFIT_API_HOST') ?? '').trim();
  if (explicitHost) {
    const cleanHost = explicitHost.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const baseUrl = `${protocol}://${cleanHost}:${port}`;
    return {
      baseUrl,
      apiUrl: `${baseUrl}/api`,
      host: cleanHost,
      port,
      source: 'env_host',
      configError: null,
    };
  }

  const metroScriptUrl =
    input.metroScriptUrl !== undefined
      ? input.metroScriptUrl
      : ((NativeModules as { SourceCode?: { scriptURL?: string } })?.SourceCode?.scriptURL ?? undefined);
  const metroLanHost = extractLanHostFromScriptUrl(metroScriptUrl);

  const androidTargetRaw = (
    input.androidTarget ??
    readEnvValue('VISIONFIT_ANDROID_TARGET') ??
    'emulator'
  ).toLowerCase();
  const isPhysicalAndroidDevice = platform === 'android' && androidTargetRaw === 'device';

  if (metroLanHost) {
    const baseUrl = `${protocol}://${metroLanHost}:${port}`;
    return {
      baseUrl,
      apiUrl: `${baseUrl}/api`,
      host: metroLanHost,
      port,
      source: 'metro_lan_host',
      configError: null,
    };
  }

  if (isPhysicalAndroidDevice) {
    const fallbackBase = `${protocol}://${ANDROID_EMULATOR_HOST}:${port}`;
    return {
      baseUrl: fallbackBase,
      apiUrl: `${fallbackBase}/api`,
      host: ANDROID_EMULATOR_HOST,
      port,
      source: 'android_emulator_default',
      configError:
        'Chưa cấu hình địa chỉ máy chủ cho thiết bị Android thật (VISIONFIT_API_HOST hoặc VISIONFIT_API_BASE_URL). Địa chỉ 10.0.2.2 chỉ dùng cho Android Emulator.',
    };
  }

  if (platform === 'android') {
    const baseUrl = `${protocol}://${ANDROID_EMULATOR_HOST}:${port}`;
    return {
      baseUrl,
      apiUrl: `${baseUrl}/api`,
      host: ANDROID_EMULATOR_HOST,
      port,
      source: 'android_emulator_default',
      configError: null,
    };
  }

  const baseUrl = `${protocol}://${LOCAL_DEV_HOST}:${port}`;
  return {
    baseUrl,
    apiUrl: `${baseUrl}/api`,
    host: LOCAL_DEV_HOST,
    port,
    source: 'ios_default',
    configError: null,
  };
}

export const API_CONFIG: ResolvedApiConfig = resolveApiConfig();
export const BASE_URL: string = API_CONFIG.baseUrl;
export const API_URL: string = API_CONFIG.apiUrl;

export interface ConnectionErrorLike {
  code?: string;
  message?: string;
  response?: { status?: number };
}

/**
 * Produce clear, actionable Vietnamese connection error message without leaking tokens or secrets.
 */
export function formatConnectionErrorMessage(
  err: ConnectionErrorLike | null | undefined,
  config: ResolvedApiConfig = API_CONFIG
): string {
  if (config.configError) {
    return config.configError;
  }

  const code = (err?.code || '').toUpperCase();
  const msg = (err?.message || '').toLowerCase();

  if (code === 'ECONNABORTED' || msg.includes('timeout')) {
    return `Kết nối tới máy chủ (${config.baseUrl}) bị quá thời gian chờ. Vui lòng kiểm tra mạng hoặc trạng thái backend rồi bấm thử lại.`;
  }

  if (code === 'ERR_NETWORK' || code === 'ECONNREFUSED' || msg.includes('network error')) {
    return `Không thể kết nối tới máy chủ VisionFit tại ${config.baseUrl}. Hãy kiểm tra kết nối mạng, cổng backend (mặc định 8000) hoặc cấu hình VISIONFIT_API_BASE_URL rồi thử lại.`;
  }

  return `Mất kết nối tới máy chủ trợ lý AI (${config.baseUrl}). Bạn vui lòng kiểm tra mạng rồi bấm thử lại nhé!`;
}

