import {
  resolveApiConfig,
  formatConnectionErrorMessage,
} from '../src/general/apiConfig';

describe('apiConfig environment resolution', () => {
  test('uses explicit VISIONFIT_API_BASE_URL when provided and trims trailing slash', () => {
    const cfg = resolveApiConfig({
      platform: 'android',
      envBaseUrl: 'https://api.visionfit.vn/',
    });
    expect(cfg.baseUrl).toBe('https://api.visionfit.vn');
    expect(cfg.apiUrl).toBe('https://api.visionfit.vn/api');
    expect(cfg.source).toBe('env_base_url');
    expect(cfg.configError).toBeNull();
  });

  test('defaults to 10.0.2.2 with configurable port on standard Android emulator', () => {
    const defaultCfg = resolveApiConfig({
      platform: 'android',
      androidTarget: 'emulator',
      metroScriptUrl: 'http://10.0.2.2:8081/index.bundle',
    });
    expect(defaultCfg.baseUrl).toBe('http://10.0.2.2:8000');
    expect(defaultCfg.apiUrl).toBe('http://10.0.2.2:8000/api');
    expect(defaultCfg.source).toBe('android_emulator_default');
    expect(defaultCfg.configError).toBeNull();

    const customPortCfg = resolveApiConfig({
      platform: 'android',
      androidTarget: 'emulator',
      envPort: '8088',
      metroScriptUrl: '',
    });
    expect(customPortCfg.baseUrl).toBe('http://10.0.2.2:8088');
    expect(customPortCfg.port).toBe('8088');
  });

  test('supports LAN host for physical Android devices via envHost or Metro LAN scriptURL', () => {
    const envHostCfg = resolveApiConfig({
      platform: 'android',
      androidTarget: 'device',
      envHost: '192.168.1.42',
      envPort: '8000',
    });
    expect(envHostCfg.baseUrl).toBe('http://192.168.1.42:8000');
    expect(envHostCfg.source).toBe('env_host');
    expect(envHostCfg.configError).toBeNull();

    const metroLanCfg = resolveApiConfig({
      platform: 'android',
      androidTarget: 'device',
      metroScriptUrl: 'http://192.168.1.42:8081/index.bundle?platform=android',
    });
    expect(metroLanCfg.baseUrl).toBe('http://192.168.1.42:8000');
    expect(metroLanCfg.source).toBe('metro_lan_host');
    expect(metroLanCfg.configError).toBeNull();
  });

  test('reports clear configError when physical Android device has no LAN host configured', () => {
    const missingHostCfg = resolveApiConfig({
      platform: 'android',
      androidTarget: 'device',
      metroScriptUrl: '',
    });
    expect(missingHostCfg.configError).toContain('VISIONFIT_API_HOST');
    expect(formatConnectionErrorMessage({ code: 'ERR_NETWORK' }, missingHostCfg)).toContain('10.0.2.2');
  });

  test('formats clear Vietnamese timeout and network error messages', () => {
    const cfg = resolveApiConfig({ platform: 'android', envPort: '8000', metroScriptUrl: '' });
    expect(formatConnectionErrorMessage({ code: 'ECONNABORTED' }, cfg)).toContain('quá thời gian chờ');
    expect(formatConnectionErrorMessage({ code: 'ERR_NETWORK' }, cfg)).toContain('http://10.0.2.2:8000');
  });
});

