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
