import axios from 'axios';

// Tự động nhận diện host:
// - Khi mở http://localhost:5173 -> gọi http://localhost:8000/api (chạy trên bất kỳ máy nào, không cần đổi IP)
// - Khi mở bằng IP LAN (VD: http://192.168.1.x:5173) -> gọi đúng IP đó
// - Khi có cấu hình file .env (VITE_API_URL) -> ưu tiên dùng .env
const host = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost';
export const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${host}:8000/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// Tự động gắn token nếu có
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token_admin');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
