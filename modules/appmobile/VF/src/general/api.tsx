import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notify } from './notification';
import {
  API_CONFIG,
  API_URL,
  BASE_URL,
  formatConnectionErrorMessage,
} from './apiConfig';

export { API_CONFIG, API_URL, BASE_URL, formatConnectionErrorMessage };

let isAuthAlertShown = false;
let isNetworkAlertShown = false;

// ─────────────────────────────────────────────────────────────────────────────
// Danh sách IP backend của các thành viên — GIỮ LẠI để tra cứu, KHÔNG xóa.
// Địa chỉ đang dùng được cấu hình trong ./apiConfig.ts qua biến môi trường,
// không sửa IP trực tiếp ở đây nữa (tránh conflict mỗi lần đổi mạng):
//   VISIONFIT_API_BASE_URL=http://172.29.192.1:8000
//   hoặc VISIONFIT_API_HOST=172.29.192.1  (+ VISIONFIT_API_PORT=8000)
//
// export const BASE_URL = "http://172.29.192.1:8000";   // Trường (mới nhất)
// export const BASE_URL = "http://172.16.62.57:8000";
// export const BASE_URL = "http://localhost:8000";
// export const BASE_URL = "http://172.16.57.58:8000"; // IP của quán cf
//
// cái ni của Ngọc đừng xóa :)) comment nó lại giùm đi.
// export const BASE_URL = "http://192.168.1.8:8000";
//
// export const BASE_URL = "http://192.168.1.171:8000";
//
// Cái này của Hùng xóa là t chém.
// export const BASE_URL = "http://localhost:8000";
// ─────────────────────────────────────────────────────────────────────────────

const apiFitlife = axios.create({
  baseURL: API_URL,
  timeout: 10000, // BE không phản hồi sau 10s thì báo lỗi, tránh treo màn hình Onloading
});
apiFitlife.defaults.headers.common['Accept'] = 'application/json';
apiFitlife.defaults.headers.common['Content-Type'] = 'application/json';

apiFitlife.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

apiFitlife.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401 && !isAuthAlertShown) {
      isAuthAlertShown = true;
      notify({
        type: 'auth',
        message:
          error.response?.data?.message ||
          'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
      });
      setTimeout(() => {
        isAuthAlertShown = false;
      }, 3000);
    } else if (!error?.response && error?.code !== 'ERR_CANCELED' && !isNetworkAlertShown) {
      isNetworkAlertShown = true;
      notify({
        type: 'error',
        message: formatConnectionErrorMessage(error, API_CONFIG),
      });
      setTimeout(() => {
        isNetworkAlertShown = false;
      }, 4000);
    }

    return Promise.reject(error);
  }
);

export default apiFitlife;
